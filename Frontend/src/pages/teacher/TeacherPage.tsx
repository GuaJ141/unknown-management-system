import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getTeacherCourses,
  getTeacherCourseScores,
  getTeacherSchedule,
  getTeacherStudents,
  saveStudentScore,
  updateStudentScore,
  deleteStudentScore,
  updateTeacherPassword,
  updateTeacherPhone,
  type TeacherCourse,
  type TeacherCourseScore,
  type TeacherScheduleEntry,
  type TeacherStudent,
} from '../../api/teacher'
import { useAuthStore } from '../../store/authStore'
import { TeacherSchedule } from './TeacherSchedule'
import '../student/student.css'
import './teacher.css'

type TeacherSection = 'overview' | 'students' | 'schedule' | 'scores' | 'account'

const navItems: { id: TeacherSection; icon: string; label: string }[] = [
  { id: 'overview', icon: '⌂', label: '教学概览' },
  { id: 'students', icon: '♙', label: '授课学生' },
  { id: 'schedule', icon: '▦', label: '我的课表' },
  { id: 'scores', icon: '▧', label: '成绩录入' },
  { id: 'account', icon: '⚙', label: '账户设置' },
]

const sectionTitles: Record<TeacherSection, string> = {
  overview: '教学概览',
  students: '授课学生',
  schedule: '我的课表',
  scores: '成绩录入',
  account: '账户设置',
}

function display(value: string | number | null | undefined) {
  return value === null || value === undefined || value === '' ? '—' : value
}

function TeacherPage() {
  const session = useAuthStore((state) => state.session)
  const signOut = useAuthStore((state) => state.signOut)
  const navigate = useNavigate()
  const token = session?.token ?? ''
  const mustChangePassword = session?.mustChangePassword ?? false
  const [section, setSection] = useState<TeacherSection>('overview')
  const activeSection = mustChangePassword ? 'account' : section
  const [schedule, setSchedule] = useState<TeacherScheduleEntry[]>([])
  const [courses, setCourses] = useState<TeacherCourse[]>([])
  const [students, setStudents] = useState<TeacherStudent[]>([])
  const [settledRequest, setSettledRequest] = useState('')
  const [loadError, setLoadError] = useState<{ key: string; message: string } | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [busyAction, setBusyAction] = useState('')
  const [search, setSearch] = useState('')
  const [name, setName] = useState('')
  const [idCard, setIdCard] = useState('')
  const [phone, setPhone] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [scoreQueryResult, setScoreQueryResult] = useState<{
    key: string
    scores: TeacherCourseScore[]
    error: string
  } | null>(null)
  const [settledScoreQuery, setSettledScoreQuery] = useState('')
  const [scoresRefreshKey, setScoresRefreshKey] = useState(0)
  const [score, setScore] = useState('')
  const requestKey = `${activeSection}:${refreshKey}`
  const loading =
    activeSection !== 'account' &&
    activeSection !== 'schedule' &&
    settledRequest !== requestKey
  const visibleLoadError = loadError?.key === requestKey ? loadError.message : ''

  useEffect(() => {
    if (!token || activeSection === 'account' || activeSection === 'schedule') return
    let active = true
    const load = async () => {
      if (activeSection === 'overview') {
        const [scheduleResult, courseResult] = await Promise.all([
          getTeacherSchedule(token),
          getTeacherCourses(token),
        ])
        const courseStudents = await Promise.all(
          courseResult.map((course) => getTeacherStudents(token, course.courseId)),
        )
        const studentResult = Array.from(
          new Map(
            courseStudents.flat().map((student) => [student.studentId, student]),
          ).values(),
        )
        if (active) {
          setSchedule(scheduleResult)
          setStudents(studentResult)
          setCourses(courseResult)
        }
      } else if (activeSection === 'students' || activeSection === 'scores') {
        const courseResult = await getTeacherCourses(token)
        const courseToLoad = courseResult.find(
          (course) => String(course.courseId) === selectedCourseId,
        ) ?? courseResult[0]
        const studentResult = courseToLoad
          ? await getTeacherStudents(token, courseToLoad.courseId)
          : []
        if (active) {
          setStudents(studentResult)
          setCourses(courseResult)
        }
      }
    }

    void load()
      .then(() => {
        if (active) setLoadError(null)
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadError({
            key: requestKey,
            message: error instanceof Error ? error.message : '数据加载失败，请稍后重试',
          })
        }
      })
      .finally(() => {
        if (active) setSettledRequest(requestKey)
      })
    return () => {
      active = false
    }
  }, [activeSection, requestKey, selectedCourseId, token])

  const activeCourseId = courses.some((course) => String(course.courseId) === selectedCourseId)
    ? selectedCourseId
    : String(courses[0]?.courseId ?? '')
  const classes = useMemo(
    () => Array.from(new Map(
      students.flatMap((student) =>
        student.classId !== null && student.className
          ? [[student.classId, { classId: student.classId, className: student.className }]]
          : [],
      ),
    ).values()),
    [students],
  )
  const activeClassId = classes.some((item) => String(item.classId) === selectedClassId)
    ? selectedClassId
    : String(classes[0]?.classId ?? '')
  const activeCourse = courses.find((course) => String(course.courseId) === activeCourseId)
  const scoreQueryKey = `${activeClassId}:${activeCourseId}:${activeCourse?.teacherId ?? ''}:${scoresRefreshKey}`
  const scoresLoading =
    activeSection === 'scores' &&
    Boolean(activeClassId && activeCourseId && activeCourse) &&
    settledScoreQuery !== scoreQueryKey
  const courseScores =
    scoreQueryResult?.key === scoreQueryKey ? scoreQueryResult.scores : []
  const scoresError =
    scoreQueryResult?.key === scoreQueryKey ? scoreQueryResult.error : ''

  useEffect(() => {
    if (
      activeSection !== 'scores' ||
      !token ||
      !activeClassId ||
      !activeCourseId ||
      !activeCourse
    ) {
      return
    }

    let active = true
    void getTeacherCourseScores(
      token,
      Number(activeClassId),
      Number(activeCourseId),
      activeCourse.teacherId,
    )
      .then((result) => {
        if (active) {
          setScoreQueryResult({ key: scoreQueryKey, scores: result, error: '' })
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setScoreQueryResult({
            key: scoreQueryKey,
            scores: [],
            error: error instanceof Error ? error.message : '成绩列表加载失败，请稍后重试',
          })
        }
      })
      .finally(() => {
        if (active) setSettledScoreQuery(scoreQueryKey)
      })

    return () => {
      active = false
    }
  }, [
    activeClassId,
    activeCourse,
    activeCourseId,
    activeSection,
    scoreQueryKey,
    scoresRefreshKey,
    token,
  ])
  const activeStudentIdForCourse = courseScores.some(
    (item) => String(item.studentId) === selectedStudentId,
  )
    ? selectedStudentId
    : String(courseScores[0]?.studentId ?? '')

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    if (!query) return students
    return students.filter((student) =>
      [student.studentName, student.studentNo, student.className ?? '']
        .join(' ')
        .toLocaleLowerCase()
        .includes(query),
    )
  }, [search, students])

  function navigateTo(next: TeacherSection) {
    if (mustChangePassword && next !== 'account') return
    setSection(next)
    setNotice(null)
  }

  function changeTeacherCourse(courseId: string) {
    setStudents([])
    setSettledRequest('')
    setSelectedCourseId(courseId)
  }

  function handleSignOut() {
    signOut()
    navigate('/login', { replace: true })
  }

  function validateIdentity() {
    if (!name.trim()) return '请填写姓名'
    if (!/^\d{17}[\dXx]$/.test(idCard.trim())) return '请输入有效的 18 位身份证号'
    return ''
  }

  async function handlePhoneSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const identityError = validateIdentity()
    if (identityError) {
      setNotice({ type: 'error', text: identityError })
      return
    }
    if (!/^1[3-9]\d{9}$/.test(phone.trim())) {
      setNotice({ type: 'error', text: '请输入有效的中国大陆手机号' })
      return
    }
    setBusyAction('phone')
    setNotice(null)
    try {
      await updateTeacherPhone(token, {
        name: name.trim(),
        idCard: idCard.trim().toUpperCase(),
        phone: phone.trim(),
      })
      setNotice({ type: 'success', text: '手机号已更新' })
      setPhone('')
    } catch (error) {
      setNotice({ type: 'error', text: error instanceof Error ? error.message : '手机号更新失败' })
    } finally {
      setBusyAction('')
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busyAction) return
    const identityError = validateIdentity()
    if (identityError) {
      setNotice({ type: 'error', text: identityError })
      return
    }
    if (newPassword.length < 8 || newPassword.length > 64) {
      setNotice({ type: 'error', text: '新密码长度必须为 8–64 个字符' })
      return
    }
    if (newPassword !== confirmPassword) {
      setNotice({ type: 'error', text: '两次输入的新密码不一致' })
      return
    }
    setBusyAction('password')
    setNotice(null)
    let redirecting = false
    try {
      await updateTeacherPassword(token, {
        name: name.trim(),
        idCard: idCard.trim().toUpperCase(),
        newPassword,
      })
      redirecting = true
      setBusyAction('redirecting')
      setNewPassword('')
      setConfirmPassword('')
      setNotice({ type: 'success', text: '密码修改成功，即将返回登录页…' })
      window.setTimeout(() => {
        signOut()
        navigate('/login', { replace: true })
      }, 1200)
    } catch (error) {
      setNotice({ type: 'error', text: error instanceof Error ? error.message : '密码更新失败' })
    } finally {
      if (!redirecting) setBusyAction('')
    }
  }

  async function handleScoreSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const courseId = Number(activeCourseId)
    const studentId = Number(activeStudentIdForCourse)
    const scoreValue = Number(score)
    if (!Number.isSafeInteger(courseId) || courseId <= 0) {
      setNotice({ type: 'error', text: '请选择有效的授课课程' })
      return
    }
    if (!Number.isSafeInteger(studentId) || studentId <= 0) {
      setNotice({ type: 'error', text: '请选择有效的学生' })
      return
    }
    if (!Number.isFinite(scoreValue) || scoreValue < 0 || scoreValue > 100) {
      setNotice({ type: 'error', text: '成绩必须在 0–100 之间' })
      return
    }
    setBusyAction('score')
    setNotice(null)
    try {
      const currentRecord = courseScores.find((item) => item.studentId === studentId)
      if (currentRecord?.score === null || currentRecord === undefined) {
        await saveStudentScore(token, courseId, { studentId, score: scoreValue })
      } else {
        await updateStudentScore(token, courseId, { studentId, score: scoreValue })
      }
      const studentName = students.find((student) => student.studentId === studentId)?.studentName
      const action = currentRecord?.score === null || currentRecord === undefined ? '录入' : '更新'
      setNotice({ type: 'success', text: `已${action}${studentName ? `「${studentName}」` : ''}的成绩` })
      setScore('')
      setScoresRefreshKey((key) => key + 1)
    } catch (error) {
      setNotice({ type: 'error', text: error instanceof Error ? error.message : '成绩保存失败' })
    } finally {
      setBusyAction('')
    }
  }

  async function handleDeleteScore(studentId: number) {
    const courseId = Number(activeCourseId)
    if (!Number.isSafeInteger(courseId) || courseId <= 0) {
      setNotice({ type: 'error', text: '当前课程无效，无法删除成绩' })
      return
    }
    const record = courseScores.find((item) => item.studentId === studentId)
    if (!record || record.score === null) {
      setNotice({ type: 'error', text: '该学生尚未录入成绩' })
      return
    }
    if (!window.confirm(`确定删除${record.studentName}在「${record.courseName}」的成绩吗？此操作不会删除选课记录。`)) {
      return
    }
    setBusyAction(`delete-score-${studentId}`)
    setNotice(null)
    try {
      await deleteStudentScore(token, courseId, studentId)
      setNotice({ type: 'success', text: `已删除「${record.studentName}」的成绩` })
      if (selectedStudentId === String(studentId)) setScore('')
      setScoresRefreshKey((key) => key + 1)
    } catch (error) {
      setNotice({ type: 'error', text: error instanceof Error ? error.message : '成绩删除失败' })
    } finally {
      setBusyAction('')
    }
  }

  const courseCount = courses.length

  return (
    <main className="student-workspace">
      <aside className="student-sidebar">
        <a className="student-brand" href="/teacher" aria-label="知行教务教师工作台">
          <span className="student-brand-mark" aria-hidden="true">知</span>
          <span>知行<span>·</span>教务</span>
        </a>
        <div className="student-sidebar-caption">TEACHER SERVICES</div>
        {mustChangePassword ? (
          <div className="password-required-note">
            <span>!</span>
            <div><strong>首次登录</strong><small>请先完成密码修改后继续使用</small></div>
          </div>
        ) : (
          <nav className="student-nav" aria-label="教师导航">
            {navItems.map((item) => (
              <button
                className={`student-nav-item${activeSection === item.id ? ' is-active' : ''}`}
                key={item.id}
                onClick={() => navigateTo(item.id)}
              >
                <span className="student-nav-icon" aria-hidden="true">{item.icon}</span>
                {item.label}
                {activeSection === item.id && <span className="student-nav-active" />}
              </button>
            ))}
          </nav>
        )}
        <div className="student-sidebar-bottom">
          <div className="student-sidebar-tip"><span>i</span><p>课表、学生与成绩数据以教务系统记录为准。</p></div>
          <button className="student-signout" onClick={handleSignOut}>
            <span aria-hidden="true">↪</span> 退出登录
          </button>
        </div>
      </aside>

      <div className="student-main">
        <header className="student-topbar">
          <div className="student-breadcrumb"><span>教师服务</span><b>/</b>{sectionTitles[activeSection]}</div>
          <div className="student-user">
            <span className="student-avatar">师</span>
            <span><strong>教师</strong><small>教师号：{session?.login_no ?? '—'}</small></span>
          </div>
          <button className="student-topbar-logout" onClick={handleSignOut}>退出</button>
        </header>
        <div className="student-content">
          <div className="student-page-heading">
            <div>
              <p className="student-eyebrow">TEACHER PORTAL</p>
              <h1>{sectionTitles[activeSection]}</h1>
              <p className="student-subtitle">
                {mustChangePassword ? '为保障账户安全，请先设置新的登录密码。' : '查看教学安排、管理授课学生并录入课程成绩。'}
              </p>
            </div>
            {!mustChangePassword && activeSection !== 'account' && (
              <button
                className="student-secondary-button"
                onClick={() => setRefreshKey((key) => key + 1)}
                disabled={loading}
              >
                {loading ? '正在刷新…' : '↻ 刷新数据'}
              </button>
            )}
          </div>
          {mustChangePassword && (
            <div className="student-notice info" role="status">
              <span>!</span>首次登录必须修改初始密码，完成后即可使用教师工作台。
            </div>
          )}
          {notice && (
            <div className={`student-notice ${notice.type}`} role={notice.type === 'error' ? 'alert' : 'status'}>
              <span>{notice.type === 'success' ? '✓' : '!'}</span>{notice.text}
              <button aria-label="关闭提示" onClick={() => setNotice(null)}>×</button>
            </div>
          )}
          {visibleLoadError && (
            <div className="student-notice error" role="alert">
              <span>!</span>{visibleLoadError}
              <button onClick={() => setRefreshKey((key) => key + 1)}>重试</button>
            </div>
          )}
          {activeSection === 'overview' && (
            <Overview
              loading={loading}
              courseCount={courseCount}
              scheduleCount={schedule.length}
              studentCount={students.length}
              onNavigate={navigateTo}
            />
          )}
          {activeSection === 'students' && (
            <StudentList
              loading={loading}
              students={filteredStudents}
              courses={courses}
              selectedCourseId={activeCourseId}
              search={search}
              onCourseChange={changeTeacherCourse}
              onSearchChange={setSearch}
            />
          )}
          {activeSection === 'schedule' && <TeacherSchedule token={token} refreshKey={refreshKey} />}
          {activeSection === 'scores' && (
            <ScorePanel
              courses={courses}
              classes={classes}
              scores={courseScores}
              selectedCourseId={activeCourseId}
              selectedClassId={activeClassId}
              selectedStudentId={activeStudentIdForCourse}
              score={score}
              loading={loading}
              scoresLoading={scoresLoading}
              scoresError={scoresError}
              busyAction={busyAction}
              onCourseChange={changeTeacherCourse}
              onClassChange={setSelectedClassId}
              onStudentChange={setSelectedStudentId}
              onScoreChange={setScore}
              onDeleteScore={(studentId) => void handleDeleteScore(studentId)}
              onEditScore={(studentId, value) => {
                setSelectedStudentId(String(studentId))
                setScore(value === null ? '' : String(value))
              }}
              onSubmit={(event) => void handleScoreSubmit(event)}
            />
          )}
          {activeSection === 'account' && (
            <AccountPanel
              name={name}
              idCard={idCard}
              phone={phone}
              newPassword={newPassword}
              confirmPassword={confirmPassword}
              busyAction={busyAction}
              mustChangePassword={mustChangePassword}
              onNameChange={setName}
              onIdCardChange={setIdCard}
              onPhoneChange={setPhone}
              onPasswordChange={setNewPassword}
              onConfirmPasswordChange={setConfirmPassword}
              onPhoneSubmit={(event) => void handlePhoneSubmit(event)}
              onPasswordSubmit={(event) => void handlePasswordSubmit(event)}
            />
          )}
          <footer className="student-footer">
            <span>知行教务 · 教师服务平台</span>
            <span>让每一份教学安排清晰可循</span>
          </footer>
        </div>
      </div>
    </main>
  )
}

function Overview({
  loading,
  courseCount,
  scheduleCount,
  studentCount,
  onNavigate,
}: {
  loading: boolean
  courseCount: number
  scheduleCount: number
  studentCount: number
  onNavigate: (section: TeacherSection) => void
}) {
  return (
    <>
      <section className="student-welcome">
        <div>
          <span className="student-welcome-tag">我的教学工作</span>
          <h2>你好，欢迎回到教师工作台</h2>
          <p>在这里查看每周教学安排、授课学生，并及时完成成绩录入。</p>
        </div>
        <div className="student-welcome-art" aria-hidden="true"><span>师</span><i /><b /></div>
      </section>
      <div className="student-stat-grid">
        <StatCard label="授课课程" value={loading ? '…' : courseCount} note="本人负责的课程数量" icon="▤" tone="blue" />
        <StatCard label="排课记录" value={loading ? '…' : scheduleCount} note="当前可查询的排课记录" icon="▦" tone="gold" />
        <StatCard label="授课学生" value={loading ? '…' : studentCount} note="所授课程已选学生（去重）" icon="♙" tone="green" />
      </div>
      <section className="student-panel">
        <div className="student-panel-heading">
          <div><h2>教学工作入口</h2><p>快速进入常用的教师服务</p></div>
        </div>
        <div className="student-quick-actions">
          <button onClick={() => onNavigate('schedule')}><span className="quick-mark green">▦</span><span><strong>查看我的课表</strong><small>按学期查看教学时间与地点</small></span><b>→</b></button>
          <button onClick={() => onNavigate('students')}><span className="quick-mark blue">♙</span><span><strong>查看授课学生</strong><small>查询所授课程已选学生及班级</small></span><b>→</b></button>
          <button onClick={() => onNavigate('scores')}><span className="quick-mark gold">▧</span><span><strong>录入学生成绩</strong><small>为本人授课课程的有效选课学生登记成绩</small></span><b>→</b></button>
        </div>
      </section>
    </>
  )
}

function StatCard({
  label,
  value,
  note,
  icon,
  tone,
}: {
  label: string
  value: string | number
  note: string
  icon: string
  tone: string
}) {
  return (
    <article className="student-stat-card">
      <span className={`student-stat-icon ${tone}`}>{icon}</span>
      <div><span>{label}</span><strong>{value}</strong><small>{note}</small></div>
    </article>
  )
}

function StudentList({
  loading,
  students,
  courses,
  selectedCourseId,
  search,
  onCourseChange,
  onSearchChange,
}: {
  loading: boolean
  students: TeacherStudent[]
  courses: TeacherCourse[]
  selectedCourseId: string
  search: string
  onCourseChange: (value: string) => void
  onSearchChange: (value: string) => void
}) {
  return (
    <section className="student-panel">
      <div className="student-panel-heading">
        <div><h2>所授课程的已选学生</h2><p>学生名单按学生去重；未分配班级时显示为“未分班”。</p></div>
        <label className="teacher-course-select">
          <span>授课课程</span>
          <select
            value={selectedCourseId}
            onChange={(event) => onCourseChange(event.target.value)}
            disabled={courses.length === 0}
          >
            {courses.map((course) => (
              <option key={course.courseId} value={course.courseId}>
                {course.courseName}（{course.courseCode}）
              </option>
            ))}
          </select>
        </label>
        <label className="teacher-search">
          <span className="sr-only">搜索学生</span>
          <input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="搜索姓名、学号或班级" />
        </label>
      </div>
      {loading && students.length === 0 ? <EmptyState text="正在加载授课学生…" /> : students.length === 0 ? (
        <EmptyState text={search ? '没有找到符合条件的学生。' : '当前授课课程暂无已选学生。'} />
      ) : (
        <div className="teacher-student-table-wrap">
          <table className="teacher-student-table">
            <thead>
              <tr><th>学号</th><th>姓名</th><th>班级</th><th>年级</th><th>学籍状态</th></tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.studentId}>
                  <td>{student.studentNo}</td>
                  <td>{student.studentName}</td>
                  <td>{display(student.className ?? '未分班')}</td>
                  <td>{display(student.grade)}</td>
                  <td>{student.classStatus === 1 ? '在校' : student.classStatus === 0 ? '已毕业' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!loading && students.length > 0 && (
        <p className="teacher-list-count">共 {students.length} 位学生</p>
      )}
    </section>
  )
}

function ScorePanel({
  courses,
  classes,
  scores,
  selectedCourseId,
  selectedClassId,
  selectedStudentId,
  score,
  loading,
  scoresLoading,
  scoresError,
  busyAction,
  onCourseChange,
  onClassChange,
  onStudentChange,
  onScoreChange,
  onDeleteScore,
  onEditScore,
  onSubmit,
}: {
  courses: TeacherCourse[]
  classes: { classId: number; className: string }[]
  scores: TeacherCourseScore[]
  selectedCourseId: string
  selectedClassId: string
  selectedStudentId: string
  score: string
  loading: boolean
  scoresLoading: boolean
  scoresError: string
  busyAction: string
  onCourseChange: (value: string) => void
  onClassChange: (value: string) => void
  onStudentChange: (value: string) => void
  onScoreChange: (value: string) => void
  onDeleteScore: (studentId: number) => void
  onEditScore: (studentId: number, score: number | null) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  const selectedCourse = courses.find((course) => String(course.courseId) === selectedCourseId)
  const selectedClass = classes.find((item) => String(item.classId) === selectedClassId)
  const canQueryScores = Boolean(selectedCourse && selectedClass)

  return (
    <div className="teacher-score-layout">
      <section className="student-panel">
        <div className="student-panel-heading">
          <div><h2>录入或查看学生成绩</h2><p>先选择班级与课程查看成绩，再为列表中的学生录入或更新成绩。</p></div>
        </div>
        {loading ? <EmptyState text="正在加载授课课程与学生…" /> : courses.length === 0 || classes.length === 0 ? (
          <EmptyState text={courses.length === 0 ? '当前没有可用的授课课程，暂时无法录入成绩。' : '当前没有已分配班级的授课学生。'} />
        ) : (
          <>
            <form className="student-form teacher-score-form" onSubmit={onSubmit}>
              <label>
                班级
                <select value={selectedClassId} onChange={(event) => onClassChange(event.target.value)} required>
                  {classes.map((item) => (
                    <option key={item.classId} value={item.classId}>{item.className}</option>
                  ))}
                </select>
              </label>
              <label>
                授课课程
                <select value={selectedCourseId} onChange={(event) => onCourseChange(event.target.value)} required>
                  {courses.map((course) => (
                    <option key={course.courseId} value={course.courseId}>
                      {course.courseName}{course.courseCode ? `（${course.courseCode}）` : ''}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                学生
                <select
                  value={selectedStudentId}
                  onChange={(event) => onStudentChange(event.target.value)}
                  disabled={scoresLoading || scores.length === 0}
                  required
                >
                  {scores.map((item) => (
                    <option key={item.studentId} value={item.studentId}>
                      {item.studentName}（{item.studentNo}）
                    </option>
                  ))}
                </select>
              </label>
              <label>
                成绩
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={score}
                  onChange={(event) => onScoreChange(event.target.value)}
                  placeholder="请输入 0–100 的成绩"
                  required
                />
              </label>
              <button
                className="student-primary-button"
                type="submit"
                disabled={Boolean(busyAction) || scoresLoading || scores.length === 0}
              >
                {busyAction === 'score' ? '正在保存…' : scores.find((item) => String(item.studentId) === selectedStudentId)?.score === null
                  ? '录入成绩'
                  : '更新成绩'}
              </button>
            </form>
            <div className="teacher-score-results">
              <div className="student-panel-heading">
                <div>
                  <h2>{selectedClass?.className ?? '班级'} · {selectedCourse?.courseName ?? '课程'}成绩</h2>
                  <p>仅显示该班级选修该课程的学生。</p>
                </div>
              </div>
              {scoresLoading ? <EmptyState text="正在加载班级课程成绩…" /> : scoresError ? (
                <p className="student-schedule-message is-error" role="alert">{scoresError}</p>
              ) : !canQueryScores || scores.length === 0 ? (
                <EmptyState text={canQueryScores ? '该班级暂无这门课程的选课记录。' : '请选择班级和课程。'} />
              ) : (
                <div className="teacher-student-table-wrap">
                  <table className="teacher-student-table">
                    <thead>
                      <tr><th>学号</th><th>姓名</th><th>课程</th><th>成绩</th><th>绩点</th><th>更新时间</th><th>操作</th></tr>
                    </thead>
                    <tbody>
                      {scores.map((item) => (
                        <tr key={item.studentId}>
                          <td>{item.studentNo}</td>
                          <td>{item.studentName}</td>
                          <td>{item.courseName}</td>
                          <td>{display(item.score)}</td>
                          <td>{display(item.gradePoint)}</td>
                          <td>{item.scoreUpdatedAt ? item.scoreUpdatedAt.replace('T', ' ').slice(0, 16) : '—'}</td>
                          <td className="teacher-score-actions">
                            <button
                              className="teacher-score-action"
                              type="button"
                              disabled={Boolean(busyAction)}
                              onClick={() => onEditScore(item.studentId, item.score)}
                            >
                              {item.score === null ? '录入' : '修改'}
                            </button>
                            {item.score !== null && (
                              <button
                                className="teacher-score-action is-danger"
                                type="button"
                                disabled={Boolean(busyAction)}
                                onClick={() => onDeleteScore(item.studentId)}
                              >
                                {busyAction === `delete-score-${item.studentId}` ? '删除中…' : '删除'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </section>
      <aside className="student-panel teacher-score-tip">
        <span className="quick-mark gold">!</span>
        <div><strong>录入提示</strong><p>提交前请核对课程与学生。成绩更新后由教务系统记录当前教师和更新时间，不会自动重新计算绩点。</p></div>
      </aside>
    </div>
  )
}

function AccountPanel({
  name,
  idCard,
  phone,
  newPassword,
  confirmPassword,
  busyAction,
  mustChangePassword,
  onNameChange,
  onIdCardChange,
  onPhoneChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onPhoneSubmit,
  onPasswordSubmit,
}: {
  name: string
  idCard: string
  phone: string
  newPassword: string
  confirmPassword: string
  busyAction: string
  mustChangePassword: boolean
  onNameChange: (value: string) => void
  onIdCardChange: (value: string) => void
  onPhoneChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onConfirmPasswordChange: (value: string) => void
  onPhoneSubmit: (event: FormEvent<HTMLFormElement>) => void
  onPasswordSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <div className="student-account-grid">
      <section className="student-panel">
        <div className="student-panel-heading">
          <div><h2>身份核验</h2><p>更新账户信息时，系统会核验姓名与身份证号。</p></div>
        </div>
        <div className="student-form-grid">
          <label>姓名<input autoComplete="name" value={name} onChange={(event) => onNameChange(event.target.value)} placeholder="请输入本人姓名" maxLength={50} /></label>
          <label>身份证号<input autoComplete="off" value={idCard} onChange={(event) => onIdCardChange(event.target.value)} placeholder="18 位身份证号码" maxLength={18} /></label>
        </div>
      </section>
      {!mustChangePassword && (
        <section className="student-panel">
          <div className="student-panel-heading"><div><h2>更换手机号</h2><p>使用本人姓名与身份证号核验后更新。</p></div></div>
          <form className="student-form" onSubmit={onPhoneSubmit}>
            <label>新手机号<input autoComplete="tel" inputMode="tel" value={phone} onChange={(event) => onPhoneChange(event.target.value)} placeholder="请输入中国大陆手机号" maxLength={11} /></label>
            <button className="student-primary-button" type="submit" disabled={Boolean(busyAction)}>
              {busyAction === 'phone' ? '正在提交…' : '更新手机号'}
            </button>
          </form>
        </section>
      )}
      <section className="student-panel">
        <div className="student-panel-heading">
          <div>
            <h2>{mustChangePassword ? '设置新密码' : '修改登录密码'}</h2>
            <p>{mustChangePassword ? '新密码长度为 8–64 个字符，修改后才能继续使用系统。' : '请设置长度为 8–64 个字符的新密码。'}</p>
          </div>
        </div>
        <form className="student-form" onSubmit={onPasswordSubmit}>
          <label>新密码<input type="password" autoComplete="new-password" value={newPassword} onChange={(event) => onPasswordChange(event.target.value)} placeholder="请输入 8–64 位新密码" maxLength={64} /></label>
          <label>确认新密码<input type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => onConfirmPasswordChange(event.target.value)} placeholder="请再次输入新密码" maxLength={64} /></label>
          <button className="student-primary-button" type="submit" disabled={Boolean(busyAction)}>
            {busyAction === 'password' ? '正在提交…' : busyAction === 'redirecting' ? '正在返回登录页…' : mustChangePassword ? '确认并继续' : '修改密码'}
          </button>
        </form>
      </section>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return <div className="student-empty"><span aria-hidden="true">◇</span><p>{text}</p></div>
}

export default TeacherPage
