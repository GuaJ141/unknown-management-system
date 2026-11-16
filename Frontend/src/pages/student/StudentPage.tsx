import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getAnnouncements,
  getAvailableCourses,
  getCourseSelections,
  getScheduleSemesters,
  getStudentScheduleBySemester,
  getScores,
  getStudentClass,
  selectCourse,
  updateStudentPassword,
  updateStudentPhone,
  type StudentRecord,
  type StudentScheduleEntry,
} from '../../api/student'
import { useAuthStore } from '../../store/authStore'
import { useStudentStore, type StudentSection } from '../../store/studentStore'
import { StudentSchedule } from './StudentSchedule'
import './student.css'

const navItems: { id: StudentSection; icon: string; label: string }[] = [
  { id: 'overview', icon: '⌂', label: '学习概览' },
  { id: 'courses', icon: '▤', label: '课程选课' },
  { id: 'myCourses', icon: '▤', label: '本学期课程' },
  { id: 'selections', icon: '✓', label: '选课结果' },
  { id: 'schedule', icon: '▦', label: '我的课表' },
  { id: 'scores', icon: '▧', label: '我的成绩' },
  { id: 'class', icon: '♙', label: '班级信息' },
  { id: 'announcements', icon: '◉', label: '校园公告' },
  { id: 'account', icon: '⚙', label: '账户设置' },
]

const sectionTitles: Record<StudentSection, string> = {
  overview: '学习概览',
  courses: '课程选课',
  myCourses: '本学期课程',
  selections: '选课结果',
  schedule: '我的课表',
  scores: '我的成绩',
  class: '班级信息',
  announcements: '校园公告',
  account: '账户设置',
}

function valueOf(record: StudentRecord | null, ...keys: string[]): string {
  if (!record) return ''
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' || typeof value === 'number') {
      const text = String(value).trim()
      if (text) return text
    }
  }
  return ''
}

function display(value: string) {
  return value || '—'
}

function yearOf(record: StudentRecord, ...keys: string[]): string {
  const value = valueOf(record, ...keys)
  const year = /^(\d{4})/.exec(value)
  return year?.[1] ?? value
}

function courseOf(record: StudentRecord): StudentRecord {
  const nested = record.course
  return typeof nested === 'object' && nested !== null && !Array.isArray(nested)
    ? nested as StudentRecord
    : record
}

function isOnlineCourse(record: StudentRecord): boolean {
  return Number(valueOf(courseOf(record), 'courseType', 'course_type')) === 3
}

function dateText(value: string) {
  return value ? value.replace('T', ' ').slice(0, 16) : '—'
}

function Panel({
  title,
  description,
  action,
  children,
}: {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="student-panel">
      <div className="student-panel-heading">
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

function StudentPage() {
  const session = useAuthStore((state) => state.session)
  const signOut = useAuthStore((state) => state.signOut)
  const section = useStudentStore((state) => state.section)
  const setSection = useStudentStore((state) => state.setSection)
  const collections = useStudentStore((state) => state.collections)
  const setCollection = useStudentStore((state) => state.setCollection)
  const classInfo = useStudentStore((state) => state.classInfo)
  const setClassInfo = useStudentStore((state) => state.setClassInfo)
  const clearData = useStudentStore((state) => state.clearData)
  const navigate = useNavigate()
  const token = session?.token ?? ''
  const mustChangePassword = session?.mustChangePassword ?? false
  const activeSection = mustChangePassword ? 'account' : section
  const [settledRequest, setSettledRequest] = useState('')
  const [loadError, setLoadError] = useState<{ key: string; message: string } | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [busyAction, setBusyAction] = useState('')
  const [name, setName] = useState('')
  const [idCard, setIdCard] = useState('')
  const [phone, setPhone] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const requestKey = `${activeSection}:${refreshKey}`
  const loading =
    activeSection !== 'account' &&
    activeSection !== 'schedule' &&
    activeSection !== 'myCourses' &&
    settledRequest !== requestKey
  const visibleLoadError = loadError?.key === requestKey ? loadError.message : ''

  useEffect(() => {
    if (mustChangePassword && section !== 'account') {
      setSection('account')
    }
  }, [mustChangePassword, section, setSection])

  useEffect(() => {
    if (
      !token ||
      activeSection === 'account' ||
      activeSection === 'schedule' ||
      activeSection === 'myCourses'
    ) return
    let active = true

    const load = async () => {
      if (activeSection === 'overview') {
        const [classResult, announcementResult, selectionResult, scoreResult] =
          await Promise.all([
            getStudentClass(token),
            getAnnouncements(token),
            getCourseSelections(token),
            getScores(token),
          ])
        if (active) {
          setClassInfo(classResult)
          setCollection('announcements', announcementResult)
          setCollection('selections', selectionResult)
          setCollection('scores', scoreResult)
        }
        return
      }

      switch (activeSection) {
        case 'courses':
          setCollection('courses', await getAvailableCourses(token))
          break
        case 'selections':
          setCollection('selections', await getCourseSelections(token))
          break
        case 'scores':
          setCollection('scores', await getScores(token))
          break
        case 'class':
          setClassInfo(await getStudentClass(token))
          break
        case 'announcements':
          setCollection('announcements', await getAnnouncements(token))
          break
      }
    }

    void load()
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
  }, [
    activeSection,
    requestKey,
    refreshKey,
    setClassInfo,
    setCollection,
    token,
  ])

  const activeAnnouncements = useMemo(
    () => collections.announcements.slice(0, 3),
    [collections.announcements],
  )

  function navigateTo(next: StudentSection) {
    if (mustChangePassword && next !== 'account') return
    setSection(next)
    if (next !== activeSection) setRefreshKey((key) => key + 1)
    setNotice(null)
  }

  function handleSignOut() {
    clearData()
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
      await updateStudentPhone(token, {
        name: name.trim(),
        idCard: idCard.trim().toUpperCase(),
        phone: phone.trim(),
      })
      setNotice({ type: 'success', text: '手机号已更新' })
      setPhone('')
    } catch (error) {
      setNotice({
        type: 'error',
        text: error instanceof Error ? error.message : '手机号更新失败',
      })
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
      await updateStudentPassword(token, {
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
        clearData()
        signOut()
        navigate('/login', { replace: true })
      }, 1200)
    } catch (error) {
      setNotice({
        type: 'error',
        text: error instanceof Error ? error.message : '密码更新失败',
      })
    } finally {
      if (!redirecting) setBusyAction('')
    }
  }

  async function handleSelectCourse(record: StudentRecord) {
    const course = courseOf(record)
    const rawId = course.courseId ?? course.id
    const courseId = typeof rawId === 'number' ? rawId : Number(rawId)
    if (!Number.isSafeInteger(courseId) || courseId <= 0) {
      setNotice({ type: 'error', text: '课程数据缺少有效的课程 ID，暂时无法选课' })
      return
    }

    setBusyAction(`course-${courseId}`)
    setNotice(null)
    try {
      await selectCourse(token, courseId)
      setNotice({ type: 'success', text: `已成功选择「${valueOf(course, 'name', 'courseName') || '该课程'}」` })
      setRefreshKey((key) => key + 1)
    } catch (error) {
      setNotice({
        type: 'error',
        text: error instanceof Error ? error.message : '选课失败，请稍后重试',
      })
    } finally {
      setBusyAction('')
    }
  }

  const records = activeSection === 'courses'
    ? collections.courses.filter(isOnlineCourse)
    : activeSection === 'selections'
      ? collections.selections.filter(isOnlineCourse)
      : activeSection === 'schedule'
        ? collections.schedule
        : activeSection === 'scores'
          ? collections.scores
          : activeSection === 'announcements'
            ? collections.announcements
            : []

  return (
    <main className="student-workspace">
      <aside className="student-sidebar">
        <a className="student-brand" href="/student" aria-label="知行教务学生工作台">
          <span className="student-brand-mark" aria-hidden="true">知</span>
          <span>知行<span>·</span>教务</span>
        </a>
        <div className="student-sidebar-caption">STUDENT SERVICES</div>
        {mustChangePassword ? (
          <div className="password-required-note">
            <span>!</span>
            <div><strong>首次登录</strong><small>请先完成密码修改后继续使用</small></div>
          </div>
        ) : (
          <nav className="student-nav" aria-label="学生导航">
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
          <div className="student-sidebar-tip"><span>i</span><p>课程、成绩与班级数据以教务系统记录为准。</p></div>
          <button className="student-signout" onClick={handleSignOut}>
            <span aria-hidden="true">↪</span> 退出登录
          </button>
        </div>
      </aside>

      <div className="student-main">
        <header className="student-topbar">
          <div className="student-breadcrumb"><span>学生服务</span><b>/</b>{sectionTitles[activeSection]}</div>
          <div className="student-user">
            <span className="student-avatar">学</span>
            <span><strong>学生</strong><small>学号：{session?.login_no ?? '—'}</small></span>
          </div>
          <button className="student-topbar-logout" onClick={handleSignOut}>退出</button>
        </header>
        <div className="student-content">
          <div className="student-page-heading">
            <div>
              <p className="student-eyebrow">STUDENT PORTAL</p>
              <h1>{sectionTitles[activeSection]}</h1>
              <p className="student-subtitle">
                {mustChangePassword
                  ? '为保障账户安全，请先设置新的登录密码。'
                  : '查看学习安排，管理课程与个人账户信息。'}
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
              <span>!</span>首次登录必须修改初始密码，完成后即可使用学生工作台。
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
              classInfo={classInfo}
              selections={collections.selections.length}
              scores={collections.scores.length}
              announcements={activeAnnouncements}
              loading={loading}
              onNavigate={navigateTo}
            />
          )}
          {activeSection === 'courses' && (
            <CourseList
              records={records}
              loading={loading}
              busyAction={busyAction}
              onSelect={(record) => void handleSelectCourse(record)}
            />
          )}
          {activeSection === 'selections' && (
            <RecordList
              title="已选课程"
              records={records}
              loading={loading}
              emptyText="你还没有选修课程。"
              renderRecord={(record, index) => <CourseCard key={record.id?.toString() ?? index} record={record} index={index} />}
            />
          )}
          {activeSection === 'schedule' && (
            <StudentSchedule token={token} refreshKey={refreshKey} />
          )}
          {activeSection === 'myCourses' && (
            <MyCourses token={token} refreshKey={refreshKey} />
          )}
          {activeSection === 'scores' && (
            <RecordList
              title="课程成绩"
              records={records}
              loading={loading}
              emptyText="暂未录入课程成绩。"
              renderRecord={(record, index) => <ScoreCard key={record.id?.toString() ?? index} record={record} />}
            />
          )}
          {activeSection === 'class' && <ClassPanel classInfo={classInfo} loading={loading} />}
          {activeSection === 'announcements' && (
            <RecordList
              title="学校与学院公告"
              records={records}
              loading={loading}
              emptyText="当前没有已发布的公告。"
              renderRecord={(record, index) => <AnnouncementCard key={record.id?.toString() ?? index} record={record} />}
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
            <span>知行教务 · 学生服务平台</span>
            <span>愿每一次学习，都有迹可循</span>
          </footer>
        </div>
      </div>
    </main>
  )
}

function Overview({
  classInfo,
  selections,
  scores,
  announcements,
  loading,
  onNavigate,
}: {
  classInfo: StudentRecord | null
  selections: number
  scores: number
  announcements: StudentRecord[]
  loading: boolean
  onNavigate: (section: StudentSection) => void
}) {
  const className = valueOf(classInfo, 'className', 'class_name')
  const collegeName = valueOf(classInfo, 'collegeName', 'college_name')
  return (
    <>
      <section className="student-welcome">
        <div>
          <span className="student-welcome-tag">我的校园学习</span>
          <h2>你好，欢迎回到学生工作台</h2>
          <p>在这里查看选课、课表和学习进度，安排好每一个学习日。</p>
        </div>
        <div className="student-welcome-art" aria-hidden="true"><span>学</span><i /><b /></div>
      </section>
      <div className="student-stat-grid">
        <StatCard label="已选课程" value={loading ? '…' : selections} note="当前已选课程数量" icon="✓" tone="blue" />
        <StatCard label="已录成绩" value={loading ? '…' : scores} note="已录入成绩的记录" icon="▧" tone="gold" />
        <StatCard label="所在班级" value={className || (loading ? '…' : '未分班')} note={collegeName || '班级归属信息'} icon="♙" tone="green" />
      </div>
      <div className="student-overview-grid">
        <Panel title="快捷入口" description="常用学习服务">
          <div className="student-quick-actions">
            <button onClick={() => onNavigate('courses')}><span className="quick-mark blue">＋</span><span><strong>浏览可选课程</strong><small>查看本学院开放课程</small></span><b>→</b></button>
            <button onClick={() => onNavigate('schedule')}><span className="quick-mark green">▦</span><span><strong>查看我的课表</strong><small>了解上课时间与地点</small></span><b>→</b></button>
            <button onClick={() => onNavigate('scores')}><span className="quick-mark gold">▧</span><span><strong>查看课程成绩</strong><small>跟进课程学习结果</small></span><b>→</b></button>
          </div>
        </Panel>
        <Panel
          title="最新公告"
          description="学校及学院发布的信息"
          action={<button className="student-text-button" onClick={() => onNavigate('announcements')}>查看全部 →</button>}
        >
          {announcements.length ? (
            <div className="student-announcement-list">
              {announcements.map((item, index) => (
                <article className="student-announcement-preview" key={valueOf(item, 'id', 'announcementId') || index}>
                  <strong>{display(valueOf(item, 'title'))}</strong>
                  <small>{dateText(valueOf(item, 'publishTime', 'publish_time'))}</small>
                  <p>{valueOf(item, 'content')}</p>
                </article>
              ))}
            </div>
          ) : <EmptyState text={loading ? '正在加载公告…' : '暂无公告'} />}
        </Panel>
      </div>
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

function CourseList({
  records,
  loading,
  busyAction,
  onSelect,
}: {
  records: StudentRecord[]
  loading: boolean
  busyAction: string
  onSelect: (record: StudentRecord) => void
}) {
  return (
    <Panel title="本学院开放课程" description="选课结果以教务系统最终记录为准">
      {loading && records.length === 0 ? <EmptyState text="正在加载课程…" /> : records.length === 0 ? (
        <EmptyState text="当前没有开放选修的课程，请留意选课批次安排。" />
      ) : (
        <div className="student-course-grid">
          {records.map((record, index) => {
            const course = courseOf(record)
            const courseId = course.courseId ?? course.id
            const isBusy = busyAction === `course-${courseId}`
            return (
              <article className="student-course-card" key={String(courseId ?? index)}>
                {/* <div className={`student-course-symbol symbol-${index % 4}`}>{valueOf(course, 'name', 'courseName').slice(0, 1) || '课'}</div> */}
                <div className="student-course-meta">
                  <span className="student-course-status">开放选课</span>
                </div>
                <h3>{display(valueOf(course, 'name', 'courseName', 'course_name'))}</h3>
                <p>{[
                  valueOf(course, 'credit') ? `${valueOf(course, 'credit')} 学分` : '',
                  valueOf(course, 'hours') ? `${valueOf(course, 'hours')} 学时` : '',
                  valueOf(course, 'assessType', 'assess_type'),
                ].filter(Boolean).join(' · ') || '课程信息'}</p>
                <div className="student-course-detail">
                  <span>授课教师</span><strong>{display(valueOf(course, 'teacherName', 'teacher_name'))}</strong>
                </div>
                <button className="student-primary-button" onClick={() => onSelect(record)} disabled={Boolean(busyAction)}>
                  {isBusy ? '提交中…' : '选择课程'}
                </button>
              </article>
            )
          })}
        </div>
      )}
    </Panel>
  )
}

function MyCourses({ token, refreshKey }: { token: string; refreshKey: number }) {
  const [semesters, setSemesters] = useState<string[]>([])
  const [semester, setSemester] = useState('')
  const [courses, setCourses] = useState<StudentScheduleEntry[]>([])
  const [loadingSemesters, setLoadingSemesters] = useState(true)
  const [coursesLoadedKey, setCoursesLoadedKey] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    void getScheduleSemesters(token)
      .then((items) => {
        if (!active) return
        setSemesters(items)
        setSemester((current) =>
          current && items.includes(current) ? current : (items.at(-1) ?? ''),
        )
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : '学期列表加载失败')
        }
      })
      .finally(() => {
        if (active) setLoadingSemesters(false)
      })
    return () => {
      active = false
    }
  }, [token])

  useEffect(() => {
    if (!semester) return
    let active = true
    const requestKey = `${semester}:${refreshKey}`
    void getStudentScheduleBySemester(token, semester)
      .then((items) => {
        if (active) {
          setCourses(items)
          setCoursesLoadedKey(requestKey)
          setError('')
        }
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : '课程列表加载失败')
          setCourses([])
          setCoursesLoadedKey(requestKey)
        }
      })
    return () => {
      active = false
    }
  }, [refreshKey, semester, token])

  const loadingCourses = Boolean(semester && coursesLoadedKey !== `${semester}:${refreshKey}`)
  const uniqueCourses = Array.from(
    new Map(courses.map((course) => [course.courseId, course])).values(),
  )

  return (
    <div className="student-record-list">
      <Panel
        title="本学期需要参加的课程"
        description="按本人所在班级的排课信息列出课程；课时安排可在“我的课表”中查看。"
      >
        <label className="student-schedule-term">
          <span>学期</span>
          <select
            value={semester}
            onChange={(event) => {
              setError('')
              setSemester(event.target.value)
            }}
            disabled={loadingSemesters || semesters.length === 0}
          >
            {semesters.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        {loadingSemesters && <EmptyState text="正在加载学期…" />}
        {error && <p className="student-schedule-message is-error" role="alert">{error}</p>}
        {!loadingSemesters && !error && semesters.length === 0 && (
          <EmptyState text="当前没有可查询的学期。" />
        )}
        {loadingCourses && <EmptyState text="正在加载本学期课程…" />}
        {!loadingSemesters && !loadingCourses && !error && semester && uniqueCourses.length === 0 && (
          <EmptyState text="该学期所在班级暂无课程安排。" />
        )}
        {!loadingCourses && !error && semester && uniqueCourses.length > 0 && (
          <div className="student-course-grid">
            {uniqueCourses.map((course) => {
              const schedules = courses.filter((item) => item.courseId === course.courseId)
              return (
                <article className="student-course-card" key={course.courseId}>
                  <div className="student-course-meta"><span className="student-course-status">{course.courseCode}</span></div>
                  <h3>{course.courseName}</h3>
                  <div className="student-course-detail"><span>授课教师</span><strong>{course.teacherName || '—'}</strong></div>
                  <p>{schedules.map((item) => (
                    `${['', '周一', '周二', '周三', '周四', '周五', '周六', '周日'][item.weekday]} 第${item.startSection}${item.endSection === item.startSection ? '' : `-${item.endSection}`}节 · ${item.startWeek}-${item.endWeek}周 · ${item.location}`
                  )).join('；')}</p>
                </article>
              )
            })}
          </div>
        )}
      </Panel>
    </div>
  )
}

function RecordList({
  title,
  records,
  loading,
  emptyText,
  renderRecord,
}: {
  title: string
  records: StudentRecord[]
  loading: boolean
  emptyText: string
  renderRecord: (record: StudentRecord, index: number) => ReactNode
}) {
  return (
    <Panel title={title}>
      {loading && records.length === 0
        ? <EmptyState text="正在加载数据…" />
        : records.length === 0
          ? <EmptyState text={emptyText} />
          : <div className="student-record-list">{records.map(renderRecord)}</div>}
    </Panel>
  )
}

function CourseCard({ record, index }: { record: StudentRecord; index: number }) {
  const course = courseOf(record)
  return (
    <article className="student-record-card">
      <span className={`student-record-icon tone-${index % 4}`}>课</span>
      <div className="student-record-main">
        <div className="student-record-title">
          <h3>{display(valueOf(course, 'name', 'courseName', 'course_name'))}</h3>
          <span>{display(valueOf(course, 'courseCode', 'course_code'))}</span>
        </div>
        <div className="student-record-details">
          <span>学分：{display(valueOf(course, 'credit'))}</span>
          <span>教师：{display(valueOf(course, 'teacherName', 'teacher_name'))}</span>
          <span>选课时间：{dateText(valueOf(record, 'selectTime', 'select_time'))}</span>
        </div>
      </div>
    </article>
  )
}

function ScoreCard({ record }: { record: StudentRecord }) {
  const course = courseOf(record)
  const score = valueOf(record, 'score')
  return (
    <article className="student-record-card">
      <span className="student-record-icon tone-2">▧</span>
      <div className="student-record-main">
        <div className="student-record-title">
          <h3>{display(valueOf(course, 'name', 'courseName', 'course_name'))}</h3>
          <strong className="student-score">{display(score)}</strong>
        </div>
        <div className="student-record-details">
          <span>课程码：{display(valueOf(course, 'courseCode', 'course_code'))}</span>
          <span>学分：{display(valueOf(course, 'credit'))}</span>
          <span>绩点：{display(valueOf(record, 'gradePoint', 'grade_point'))}</span>
          <span>录入时间：{dateText(valueOf(record, 'scoreUpdatedAt', 'score_updated_at'))}</span>
        </div>
      </div>
    </article>
  )
}

function AnnouncementCard({ record }: { record: StudentRecord }) {
  return (
    <article className="student-announcement">
      <div className="student-announcement-heading">
        <h3>{display(valueOf(record, 'title'))}</h3>
        <time>{dateText(valueOf(record, 'publishTime', 'publish_time'))}</time>
      </div>
      <p>{display(valueOf(record, 'content'))}</p>
      <small>{valueOf(record, 'collegeName', 'college_name') || '学校公告'}</small>
    </article>
  )
}

function ClassPanel({ classInfo, loading }: { classInfo: StudentRecord | null; loading: boolean }) {
  if (loading && !classInfo) return <Panel title="班级与学院信息"><EmptyState text="正在加载班级信息…" /></Panel>
  if (!classInfo) return <Panel title="班级与学院信息"><EmptyState text="暂无班级信息。" /></Panel>
  const hasClass = Boolean(valueOf(classInfo, 'classId', 'class_id', 'className', 'class_name'))
  const status = valueOf(classInfo, 'classStatus', 'class_status')
  return (
    <Panel title="班级与学院信息" description="以下信息由学籍档案提供">
      <div className="student-class-card">
        <span className="student-class-emblem">知</span>
        <div className="student-class-grid">
          <InfoField label="学院" value={valueOf(classInfo, 'collegeName', 'college_name')} />
          <InfoField label="班级" value={hasClass ? valueOf(classInfo, 'className', 'class_name') : '尚未分配班级'} />
          <InfoField label="年级" value={valueOf(classInfo, 'grade')} />
          <InfoField label="入学年份" value={yearOf(classInfo, 'enrollmentYear', 'enrollment_year')} />
          <InfoField label="预计毕业年份" value={yearOf(classInfo, 'graduationYear', 'graduation_year')} />
          <InfoField label="班级状态" value={status === '1' ? '在校' : status === '0' ? '已毕业' : status ? '未知' : ''} />
        </div>
      </div>
    </Panel>
  )
}

function InfoField({ label, value }: { label: string; value: string }) {
  return <div className="student-info-field"><span>{label}</span><strong>{display(value)}</strong></div>
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
      <Panel title="身份核验" description="更新账户信息时，系统会核验姓名与身份证号">
        <div className="student-form-grid">
          <label>姓名<input autoComplete="name" value={name} onChange={(event) => onNameChange(event.target.value)} placeholder="请输入本人姓名" maxLength={50} /></label>
          <label>身份证号<input autoComplete="off" value={idCard} onChange={(event) => onIdCardChange(event.target.value)} placeholder="18 位身份证号码" maxLength={18} /></label>
        </div>
      </Panel>
      {!mustChangePassword && (
        <Panel title="更换手机号" description="使用本人姓名与身份证号核验后更新">
          <form className="student-form" onSubmit={onPhoneSubmit}>
            <label>新手机号<input autoComplete="tel" inputMode="tel" value={phone} onChange={(event) => onPhoneChange(event.target.value)} placeholder="请输入中国大陆手机号" maxLength={11} /></label>
            <button className="student-primary-button" type="submit" disabled={Boolean(busyAction)}>
              {busyAction === 'phone' ? '正在提交…' : '更新手机号'}
            </button>
          </form>
        </Panel>
      )}
      <Panel
        title={mustChangePassword ? '设置新密码' : '修改登录密码'}
        description={mustChangePassword ? '新密码长度为 8–64 个字符，修改后才能继续使用系统。' : '请设置长度为 8–64 个字符的新密码。'}
      >
        <form className="student-form" onSubmit={onPasswordSubmit}>
          <label>新密码<input type="password" autoComplete="new-password" value={newPassword} onChange={(event) => onPasswordChange(event.target.value)} placeholder="请输入 8–64 位新密码" maxLength={64} /></label>
          <label>确认新密码<input type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => onConfirmPasswordChange(event.target.value)} placeholder="请再次输入新密码" maxLength={64} /></label>
          <button className="student-primary-button" type="submit" disabled={Boolean(busyAction)}>
            {busyAction === 'password'
              ? '正在提交…'
              : busyAction === 'redirecting'
                ? '正在返回登录页…'
                : mustChangePassword
                  ? '确认并继续'
                  : '修改密码'}
          </button>
        </form>
      </Panel>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return <div className="student-empty"><span aria-hidden="true">◇</span><p>{text}</p></div>
}

export default StudentPage
