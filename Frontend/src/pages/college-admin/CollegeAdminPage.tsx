import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  assignStudentsToClass,
  createAnnouncement,
  createClass,
  createSchedule,
  deactivateStudent,
  deactivateTeacher,
  deleteCourse,
  deleteAnnouncement,
  deleteSelectionBatch,
  deleteSemester,
  deleteSchedule,
  getCollegeSemesters,
  getCollegeClassSchedule,
  getClasses,
  getCourses,
  getScheduleSemesters,
  getSelectionBatches,
  getTeacherSchedule,
  getUnassignedStudents,
  getStudents,
  getTeachers,
  registerStudents,
  registerTeachers,
  saveCourse,
  saveSelectionBatch,
  saveSemester,
  updateStudent,
  updateTeacher,
  updateClass,
  updateAnnouncement,
  updateSchedule,
  type BatchPersonInput,
  type CollegeClass,
  type CollegeCourse,
  type CollegeStudent,
  type CollegeTeacher,
  type CourseSchedule,
  type CreateScheduleInput,
  type UpdateScheduleInput,
  type SelectionBatch,
  type CollegeSemester,
  type StudentRegistrationInput,
  type StudentPage,
  type UnassignedStudent,
} from '../../api/collegeAdmin'
import { getAnnouncements, type StudentRecord } from '../../api/student'
import { useAuthStore } from '../../store/authStore'
import './college-admin.css'

type Section =
  | 'overview'
  | 'accounts'
  | 'classes'
  | 'students'
  | 'teachers'
  | 'schedule'
  | 'courses'
  | 'batches'
  | 'semesters'
  | 'announcements'
type PersonKind = 'teacher' | 'student'

interface AnnouncementForm {
  title: string
  content: string
  status: 0 | 1
}

interface PersonRow extends BatchPersonInput {
  rowId: string
  gender: string
  birth: string
  enrollmentYear: string
  graduationYear: string
  studyDuration: string
}

interface CourseForm {
  courseCode: string
  name: string
  credit: string
  hours: string
  assessType: string
  teacherId: string
  courseType: string
  status: string
}

interface BatchForm {
  batchName: string
  startTime: string
  endTime: string
  status: string
}

interface ScheduleForm {
  courseId: string
  classId: string
  teacherId: string
  weekday: string
  section: string
  startWeek: string
  endWeek: string
  location: string
}

const sectionTitles: Record<Section, string> = {
  overview: '工作概览',
  accounts: '账号注册',
  classes: '班级管理',
  students: '学生档案',
  teachers: '教师档案',
  schedule: '课表管理',
  courses: '课程管理',
  batches: '选课批次',
  semesters: '学期管理',
  announcements: '公告管理',
}

const emptyAnnouncement: AnnouncementForm = {
  title: '',
  content: '',
  status: 1,
}

const emptyCourse: CourseForm = {
  courseCode: '',
  name: '',
  credit: '',
  hours: '',
  assessType: '',
  teacherId: '',
  courseType: '1',
  status: '0',
}

const emptyBatch: BatchForm = {
  batchName: '',
  startTime: '',
  endTime: '',
  status: '0',
}

const navItems: { id: Section; icon: string; label: string }[] = [
  { id: 'overview', icon: '⌂', label: '工作概览' },
  { id: 'accounts', icon: '＋', label: '账号注册' },
  { id: 'classes', icon: '▦', label: '班级管理' },
  { id: 'students', icon: '♙', label: '学生档案' },
  { id: 'teachers', icon: '♙', label: '教师档案' },
  { id: 'schedule', icon: '▦', label: '课表管理' },
  { id: 'courses', icon: '▤', label: '课程管理' },
  { id: 'batches', icon: '◷', label: '选课批次' },
  { id: 'semesters', icon: '▤', label: '学期管理' },
  { id: 'announcements', icon: '◉', label: '公告管理' },
]

function newPersonRow(): PersonRow {
  return {
    rowId: `${Date.now()}-${Math.random()}`,
    name: '',
    idCard: '',
    phone: '',
    gender: '',
    birth: '',
    enrollmentYear: '',
    graduationYear: '',
    studyDuration: '',
  }
}

function entityId(item: CollegeCourse | SelectionBatch): number | undefined {
  const id = 'id' in item ? item.id : undefined
  const alternateId = 'courseId' in item ? item.courseId : undefined
  const batchId = 'batchId' in item ? item.batchId : undefined
  const value = id ?? alternateId ?? batchId
  return typeof value === 'number' ? value : undefined
}

function displayDate(value?: string) {
  if (!value) return '—'
  return value.replace('T', ' ')
}

function getBatchIntervalStatus(
  batch: SelectionBatch,
  now: number,
): '未开始' | '进行中' | '选课结束' | '时间无效' {
  const startTime = batch.startTime ? new Date(batch.startTime).getTime() : NaN
  const endTime = batch.endTime ? new Date(batch.endTime).getTime() : NaN
  if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime <= startTime) {
    return '时间无效'
  }
  if (batch.status === 2 || now > endTime || (batch.status === 0 && now >= startTime)) {
    return '选课结束'
  }
  if (now < startTime) return '未开始'
  return batch.status === 1 ? '进行中' : '选课结束'
}

function displayBirthDate(value?: string | null) {
  if (!value) return '—'
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00+08:00`)
    : new Date(value)
  if (Number.isNaN(date.getTime())) return value

  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? ''

  return `${part('month')}月${part('day')}日`
}

function statusName(status: number | undefined, names: string[]) {
  return status !== undefined && names[status] ? names[status] : '未知'
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
    <section className="admin-panel">
      <div className="admin-panel-heading">
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

function CollegeAdminPage() {
  const session = useAuthStore((state) => state.session)
  const signOut = useAuthStore((state) => state.signOut)
  const navigate = useNavigate()
  const [section, setSection] = useState<Section>('overview')
  const [courses, setCourses] = useState<CollegeCourse[]>([])
  const [batches, setBatches] = useState<SelectionBatch[]>([])
  const [clockNow, setClockNow] = useState(() => Date.now())
  const [courseLoadError, setCourseLoadError] = useState('')
  const [batchLoadError, setBatchLoadError] = useState('')
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const token = session?.token ?? ''
  const availableCourses = useMemo(
    () => courses.filter((course) => course.status === 1).length,
    [courses],
  )
  const activeBatches = useMemo(
    () =>
      batches.filter(
        (batch) => getBatchIntervalStatus(batch, clockNow) === '进行中',
      ).length,
    [batches, clockNow],
  )

  useEffect(() => {
    const timer = window.setInterval(() => setClockNow(Date.now()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    let active = true
    void getCourses(token)
      .then((items) => {
        if (active) {
          setCourses(items)
          setCourseLoadError('')
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setCourseLoadError(error instanceof Error ? error.message : '课程加载失败')
        }
      })
    void getSelectionBatches(token)
      .then((items) => {
        if (active) {
          setBatches(items)
          setBatchLoadError('')
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setBatchLoadError(error instanceof Error ? error.message : '选课批次加载失败')
        }
      })
    return () => {
      active = false
    }
  }, [token])

  function showSuccess(text: string) {
    setNotice({ type: 'success', text })
  }

  function showError(error: unknown) {
    setNotice({
      type: 'error',
      text: error instanceof Error ? error.message : '操作失败，请稍后重试',
    })
  }

  function handleSignOut() {
    signOut()
    navigate('/admin/login', { replace: true })
  }

  return (
    <main className="college-admin">
      <aside className="admin-sidebar">
        <a className="admin-brand" href="/admin" aria-label="知行教务学院管理">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="none">
              <path d="M4 10.5 16 4l12 6.5L16 17 4 10.5Z" />
              <path d="M8 13v7.5c4.5 4 11.5 4 16 0V13M28 11v9" />
            </svg>
          </span>
          <span>知行<span>·</span>教务</span>
        </a>
        <div className="sidebar-caption">COLLEGE ADMINISTRATION</div>
        <nav className="admin-nav" aria-label="管理导航">
          {navItems.map((item) => (
            <button
              className={`admin-nav-item${section === item.id ? ' is-active' : ''}`}
              key={item.id}
              onClick={() => {
                setSection(item.id)
                setNotice(null)
              }}
            >
              <span className="nav-icon" aria-hidden="true">{item.icon}</span>
              {item.label}
              {section === item.id && <span className="nav-active-mark" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-help">
            <span className="help-icon">i</span>
            <div>
              <strong>学院数据安全</strong>
              <span>师生课程按学院隔离；学期列表全校共享</span>
            </div>
          </div>
          <button className="sidebar-logout" onClick={handleSignOut}>
            <span aria-hidden="true">↪</span> 退出登录
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="breadcrumb"><span>学院管理</span><b>/</b>{sectionTitles[section]}</div>
          <div className="admin-user">
            <span className="user-avatar">管</span>
            <span><strong>学院管理员</strong><small>管理员号：{session?.login_no ?? '—'}</small></span>
          </div>
        </header>

        <div className="admin-content">
          <div className="admin-page-heading">
            <div>
              <p className="admin-eyebrow">ACADEMIC SERVICES</p>
              <h1>{sectionTitles[section]}</h1>
              <p className="admin-subtitle">
                管理本学院教学资源、师生账号与选课安排
              </p>
            </div>
            {section === 'overview' && (
              <button className="primary-button" onClick={() => setSection('courses')}>
                <span aria-hidden="true">＋</span> 创建课程
              </button>
            )}
          </div>

          {notice && (
            <div className={`admin-notice ${notice.type}`} role={notice.type === 'error' ? 'alert' : 'status'}>
              <span>{notice.type === 'success' ? '✓' : '!'}</span>
              {notice.text}
              <button aria-label="关闭提示" onClick={() => setNotice(null)}>×</button>
            </div>
          )}

          {section === 'overview' && (
            <Overview
              courses={courses}
              batches={batches}
              availableCourses={availableCourses}
              activeBatches={activeBatches}
              courseLoadError={courseLoadError}
              batchLoadError={batchLoadError}
              onNavigate={setSection}
            />
          )}
          {section === 'accounts' && (
            <AccountsSection onSuccess={showSuccess} onError={showError} token={token} />
          )}
          {section === 'classes' && (
            <ClassesSection
              onSuccess={showSuccess}
              onError={showError}
              token={token}
            />
          )}
          {section === 'students' && (
            <StudentsSection
              token={token}
              onSuccess={showSuccess}
              onError={showError}
            />
          )}
          {section === 'teachers' && (
            <TeachersSection
              token={token}
              onSuccess={showSuccess}
              onError={showError}
            />
          )}
          {section === 'schedule' && (
            <ScheduleSection token={token} />
          )}
          {section === 'courses' && (
            <CoursesSection
              courses={courses}
              loadError={courseLoadError}
              token={token}
              onCoursesChange={setCourses}
              onSuccess={showSuccess}
              onError={showError}
            />
          )}
          {section === 'batches' && (
            <BatchesSection
              batches={batches}
              clockNow={clockNow}
              loadError={batchLoadError}
              token={token}
              onBatchesChange={setBatches}
              onSuccess={showSuccess}
              onError={showError}
            />
          )}
          {section === 'semesters' && (
            <SemestersSection
              token={token}
              onSuccess={showSuccess}
              onError={showError}
            />
          )}
          {section === 'announcements' && (
            <AnnouncementSection
              token={token}
              onSuccess={showSuccess}
              onError={showError}
            />
          )}
          <footer className="admin-footer">
            <span>知行教务 · 学院管理平台</span>
            <span>师生课程按学院隔离 · 学期列表全校共享</span>
          </footer>
        </div>
      </div>
    </main>
  )
}

function AnnouncementSection({
  token,
  onSuccess,
  onError,
}: {
  token: string
  onSuccess: (text: string) => void
  onError: (error: unknown) => void
}) {
  const [form, setForm] = useState<AnnouncementForm>(emptyAnnouncement)
  const [submitting, setSubmitting] = useState(false)
  const [announcements, setAnnouncements] = useState<StudentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<number | null>(null)

  useEffect(() => {
    let active = true
    void getAnnouncements(token)
      .then((items) => {
        if (active) {
          setAnnouncements(items)
          setLoadError('')
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadError(error instanceof Error ? error.message : '公告列表加载失败')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [token, refreshKey])

  function resetForm() {
    setForm(emptyAnnouncement)
    setEditingAnnouncementId(null)
  }

  function update<K extends keyof AnnouncementForm>(
    key: K,
    value: AnnouncementForm[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function editAnnouncement(record: StudentRecord) {
    const rawId =
      record.announcementId ?? record.announcement_id ?? record.id
    const id =
      typeof rawId === 'number' && Number.isInteger(rawId)
        ? rawId
        : typeof rawId === 'string' && /^\d+$/.test(rawId)
          ? Number(rawId)
          : null
    if (id === null) {
      onError(new Error('公告记录缺少有效的公告 ID，无法编辑'))
      return
    }
    const rawStatus = record.status
    setEditingAnnouncementId(id)
    setForm({
      title: String(record.title ?? ''),
      content: String(record.content ?? ''),
      status: rawStatus === 0 || rawStatus === '0' ? 0 : 1,
    })
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return

    const title = form.title.trim()
    const content = form.content.trim()
    if (!title || !content) {
      onError(new Error('公告标题和内容不能为空'))
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        title,
        content,
        status: form.status,
      }
      if (editingAnnouncementId === null) {
        await createAnnouncement(token, payload)
        onSuccess(form.status === 1 ? '公告已发布。' : '公告已保存为草稿。')
      } else {
        await updateAnnouncement(token, editingAnnouncementId, payload)
        onSuccess('公告已更新。')
      }
      resetForm()
      setLoading(true)
      setLoadError('')
      setRefreshKey((current) => current + 1)
    } catch (error) {
      onError(error)
    } finally {
      setSubmitting(false)
    }
  }

  async function removeAnnouncement(record: StudentRecord) {
    const rawId =
      record.announcementId ?? record.announcement_id ?? record.id
    const id =
      typeof rawId === 'number' && Number.isInteger(rawId)
        ? rawId
        : typeof rawId === 'string' && /^\d+$/.test(rawId)
          ? Number(rawId)
          : null
    if (id === null) {
      onError(new Error('公告记录缺少有效的公告 ID，无法删除'))
      return
    }
    if (!window.confirm(`确定删除公告“${String(record.title ?? '未命名公告')}”吗？此操作不可撤销。`)) {
      return
    }
    setSubmitting(true)
    try {
      await deleteAnnouncement(token, id)
      onSuccess('公告已删除。')
      if (editingAnnouncementId === id) resetForm()
      setLoading(true)
      setLoadError('')
      setRefreshKey((current) => current + 1)
    } catch (error) {
      onError(error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Panel
        title={editingAnnouncementId === null ? '创建公告' : '编辑公告'}
        description="公告将归属当前管理员所在学院；编辑和删除操作由服务端校验归属。"
      >
        <form className="admin-form announcement-form" onSubmit={submit}>
          <label className="form-field full">
            <span>公告标题</span>
            <input
              required
              maxLength={200}
              placeholder="请输入公告标题"
              value={form.title}
              onChange={(event) => update('title', event.target.value)}
            />
          </label>
          <label className="form-field full">
            <span>公告内容</span>
            <textarea
              required
              rows={8}
              placeholder="请输入公告内容"
              value={form.content}
              onChange={(event) => update('content', event.target.value)}
            />
          </label>
          <label className="form-field">
            <span>发布状态</span>
            <select
              required
              value={form.status}
              onChange={(event) =>
                update('status', event.target.value === '0' ? 0 : 1)
              }
            >
              <option value="1">立即发布</option>
              <option value="0">保存为草稿</option>
            </select>
          </label>
          <div className="form-submit full">
            <button className="primary-button" disabled={submitting}>
              {submitting
                ? '提交中…'
                : editingAnnouncementId !== null
                  ? '保存修改'
                  : form.status === 1
                    ? '发布公告'
                    : '保存草稿'}
            </button>
            {editingAnnouncementId !== null && (
              <button
                className="secondary-button"
                type="button"
                disabled={submitting}
                onClick={resetForm}
              >
                取消编辑
              </button>
            )}
          </div>
        </form>
      </Panel>
      <Panel
        title="公告列表"
        description="列表仅包含已发布公告；编辑和删除仅允许操作本学院公告，草稿不会显示。"
        action={
          <button
            className="secondary-button"
            type="button"
            disabled={loading || submitting}
            onClick={() => {
              setLoading(true)
              setLoadError('')
              setRefreshKey((current) => current + 1)
            }}
          >
            刷新
          </button>
        }
      >
        {loading ? (
          <EmptyState text="正在加载公告…" />
        ) : loadError ? (
          <EmptyState text={loadError} />
        ) : announcements.length === 0 ? (
          <EmptyState text="暂无已发布公告。" />
        ) : (
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>公告标题</th>
                  <th>发布时间</th>
                  <th>范围</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {announcements.map((record, index) => {
                  const rawId =
                    record.announcementId ?? record.announcement_id ?? record.id
                  const validId =
                    (typeof rawId === 'number' && Number.isInteger(rawId)) ||
                    (typeof rawId === 'string' && /^\d+$/.test(rawId))
                  const publishTime =
                    record.publishTime ?? record.publish_time ?? record.createdAt ?? record.created_at
                  const collegeName = record.collegeName ?? record.college_name
                  return (
                    <tr key={validId ? String(rawId) : `announcement-${index}`}>
                      <td>
                        <strong>{String(record.title ?? '未命名公告')}</strong>
                        <div className="announcement-preview">
                          {String(record.content ?? '')}
                        </div>
                      </td>
                      <td>{String(publishTime ?? '—').replace('T', ' ')}</td>
                      <td>{String(collegeName ?? '学校公告')}</td>
                      <td>
                        <div className="announcement-actions">
                          <button
                            className="table-action"
                            type="button"
                            disabled={submitting || !validId}
                            onClick={() => editAnnouncement(record)}
                          >
                            编辑
                          </button>
                          <button
                            className="table-action"
                            type="button"
                            disabled={submitting || !validId}
                            onClick={() => void removeAnnouncement(record)}
                          >
                            删除
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  )
}

function ScheduleSection({ token }: { token: string }) {
  const [classes, setClasses] = useState<CollegeClass[]>([])
  const [teachers, setTeachers] = useState<CollegeTeacher[]>([])
  const [courses, setCourses] = useState<CollegeCourse[]>([])
  const [semesters, setSemesters] = useState<string[]>([])
  const [optionsLoading, setOptionsLoading] = useState(true)
  const [optionsError, setOptionsError] = useState('')
  const [viewType, setViewType] = useState<'class' | 'teacher'>('class')
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedTeacherId, setSelectedTeacherId] = useState('')
  const [selectedSemester, setSelectedSemester] = useState('')
  const [schedule, setSchedule] = useState<CourseSchedule[]>([])
  const [scheduleLoading, setScheduleLoading] = useState(false)
  const [scheduleError, setScheduleError] = useState('')
  const [hasQueried, setHasQueried] = useState(false)
  const [editingScheduleId, setEditingScheduleId] = useState<number | null>(null)
  const [scheduleForm, setScheduleForm] = useState<ScheduleForm | null>(null)
  const [savingSchedule, setSavingSchedule] = useState(false)
  const [formError, setFormError] = useState('')
  const [operationNotice, setOperationNotice] = useState('')
  const schedulableCourses = courses.filter(
    (course) => Number(course.courseType) !== 3,
  )

  useEffect(() => {
    let active = true
    void Promise.all([
      getScheduleSemesters(token),
      getClasses(token),
      getTeachers(token),
      getCourses(token),
    ])
      .then(([semesterItems, classItems, teacherItems, courseItems]) => {
        if (!active) return
        setSemesters(semesterItems)
        setClasses(classItems)
        setTeachers(teacherItems)
        setCourses(courseItems)
        setSelectedSemester(semesterItems.at(-1) ?? '')
        setSelectedClassId(classItems[0] ? String(classItems[0].classId) : '')
        setSelectedTeacherId(teacherItems[0] ? String(teacherItems[0].teacherId) : '')
      })
      .catch((error: unknown) => {
        if (active) {
          setOptionsError(
            error instanceof Error ? error.message : '课表查询条件加载失败',
          )
        }
      })
      .finally(() => {
        if (active) setOptionsLoading(false)
      })
    return () => {
      active = false
    }
  }, [token])

  async function loadSelectedSchedule() {
    const entityId = Number(
      viewType === 'class' ? selectedClassId : selectedTeacherId,
    )
    if (!Number.isInteger(entityId) || entityId <= 0 || !selectedSemester) {
      setScheduleError('请选择有效的学期和查询对象。')
      setSchedule([])
      setHasQueried(false)
      return false
    }

    setScheduleLoading(true)
    setScheduleError('')
    try {
      const entries =
        viewType === 'class'
          ? await getCollegeClassSchedule(token, entityId, selectedSemester)
          : await getTeacherSchedule(token, entityId, selectedSemester)
      setSchedule(entries)
      setHasQueried(true)
      return true
    } catch (error) {
      setScheduleError(
        error instanceof Error ? error.message : '课表查询失败，请稍后重试',
      )
      setSchedule([])
      setHasQueried(false)
      return false
    } finally {
      setScheduleLoading(false)
    }
  }

  async function searchSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setScheduleForm(null)
    setEditingScheduleId(null)
    setOperationNotice('')
    await loadSelectedSchedule()
  }

  function beginCreateSchedule(weekday: number, section: number) {
    if (viewType !== 'class' || !hasQueried || !selectedClassId || !selectedSemester) {
      setOperationNotice('请先选择班级和学期，并查询班级课表，再点击空白格安排课程。')
      setScheduleForm(null)
      setEditingScheduleId(null)
      return
    }
    if (schedulableCourses.length === 0 || teachers.length === 0) {
      setFormError('当前学院尚无可用课程或教师，无法安排课程。')
      return
    }
    const initialCourse = schedulableCourses.find(
      (course) => entityId(course) !== undefined,
    )
    setEditingScheduleId(null)
    setFormError('')
    setOperationNotice('')
    setScheduleForm({
      courseId: initialCourse ? String(entityId(initialCourse)) : '',
      classId: selectedClassId,
      teacherId: initialCourse?.teacherId?.toString() ?? '',
      weekday: String(weekday),
      section: String(section),
      startWeek: '1',
      endWeek: '16',
      location: '',
    })
  }

  function beginEditSchedule(entry: CourseSchedule) {
    if (viewType !== 'class') return
    setEditingScheduleId(entry.scheduleId)
    setFormError('')
    setOperationNotice('')
    setScheduleForm({
      courseId: String(entry.courseId),
      classId: String(entry.classId),
      teacherId: String(entry.teacherId),
      weekday: String(entry.weekday),
      section: String(entry.startSection),
      startWeek: String(entry.startWeek),
      endWeek: String(entry.endWeek),
      location: entry.location,
    })
  }

  function chooseScheduleCourse(courseId: string) {
    const course = courses.find((item) => String(entityId(item) ?? '') === courseId)
    setScheduleForm((current) =>
      current
        ? {
            ...current,
            courseId,
            teacherId: String(course?.teacherId ?? ''),
          }
        : current,
    )
  }

  function updateScheduleForm<K extends keyof ScheduleForm>(
    key: K,
    value: ScheduleForm[K],
  ) {
    setScheduleForm((current) => current ? { ...current, [key]: value } : current)
  }

  async function submitSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!scheduleForm || savingSchedule) return

    const courseId = Number(scheduleForm.courseId)
    const classId = Number(scheduleForm.classId)
    const teacherId = Number(scheduleForm.teacherId)
    const weekday = Number(scheduleForm.weekday)
    const section = Number(scheduleForm.section)
    const startWeek = Number(scheduleForm.startWeek)
    const endWeek = Number(scheduleForm.endWeek)
    const location = scheduleForm.location.trim()
    if (
      !Number.isInteger(courseId) || courseId <= 0 ||
      !Number.isInteger(classId) || classId <= 0 ||
      !Number.isInteger(weekday) || weekday < 1 || weekday > 7 ||
      !Number.isInteger(section) || section < 1 || section > 12 ||
      !Number.isInteger(startWeek) || startWeek < 1 || startWeek > 255 ||
      !Number.isInteger(endWeek) || endWeek < startWeek || endWeek > 255 ||
      !location || location.length > 100 ||
      (editingScheduleId === null &&
        (!Number.isInteger(teacherId) ||
          teacherId <= 0 ||
          !teachers.some((item) => item.teacherId === teacherId)))
    ) {
      setFormError(
        editingScheduleId === null &&
          (!Number.isInteger(teacherId) ||
            !teachers.some((item) => item.teacherId === teacherId))
          ? '所选课程尚未绑定有效教师，请先在课程管理中为课程设置教师。'
          : '请检查表单：周几需为 1–7，节次 1–12，周次 1–255 且结束周不早于起始周，地点最多 100 字。',
      )
      return
    }

    setSavingSchedule(true)
    setFormError('')
    setOperationNotice('')
    try {
      if (editingScheduleId === null) {
        const payload: CreateScheduleInput = {
          courseId,
          classId,
          teacherId,
          semester: selectedSemester,
          weekday,
          section,
          startWeek,
          endWeek,
          location,
        }
        await createSchedule(token, payload)
        setOperationNotice('课程安排已创建。')
      } else {
        const payload: UpdateScheduleInput = {
          courseId,
          classId,
          weekday,
          section,
          startWeek,
          endWeek,
          location,
        }
        await updateSchedule(token, editingScheduleId, payload)
        setOperationNotice('课程安排已更新。')
      }
      setScheduleForm(null)
      setEditingScheduleId(null)
      await loadSelectedSchedule()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : '保存排课失败')
    } finally {
      setSavingSchedule(false)
    }
  }

  async function removeSchedule() {
    if (editingScheduleId === null || savingSchedule) return
    const target = schedule.find((item) => item.scheduleId === editingScheduleId)
    if (!window.confirm(`确定删除“${target?.courseName ?? '该课程'}”的排课吗？此操作不可撤销。`)) {
      return
    }
    setSavingSchedule(true)
    setFormError('')
    setOperationNotice('')
    try {
      await deleteSchedule(token, editingScheduleId)
      setScheduleForm(null)
      setEditingScheduleId(null)
      setOperationNotice('课程安排已删除。')
      await loadSelectedSchedule()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : '删除排课失败')
    } finally {
      setSavingSchedule(false)
    }
  }

  return (
    <div className="schedule-management">
      <Panel
        title="课表管理"
        description="按学期查看本学院班级或教师的排课安排。"
      >
        {optionsError ? (
          <EmptyState text={optionsError} />
        ) : (
          <form className="admin-form schedule-query-form" onSubmit={searchSchedule}>
            <div className="segmented-control full" role="group" aria-label="课表类型">
              <button
                className={viewType === 'class' ? 'selected' : ''}
                type="button"
                disabled={optionsLoading}
                onClick={() => {
                  setViewType('class')
                  setHasQueried(false)
                  setSchedule([])
                  setScheduleError('')
                  setScheduleForm(null)
                  setEditingScheduleId(null)
                }}
              >
                班级课表
              </button>
              <button
                className={viewType === 'teacher' ? 'selected' : ''}
                type="button"
                disabled={optionsLoading}
                onClick={() => {
                  setViewType('teacher')
                  setHasQueried(false)
                  setSchedule([])
                  setScheduleError('')
                  setScheduleForm(null)
                  setEditingScheduleId(null)
                }}
              >
                教师课表
              </button>
            </div>
            <label className="form-field">
              <span>{viewType === 'class' ? '选择班级' : '选择教师'}</span>
              <select
                required
                value={viewType === 'class' ? selectedClassId : selectedTeacherId}
                disabled={optionsLoading}
                onChange={(event) => {
                  if (viewType === 'class') setSelectedClassId(event.target.value)
                  else setSelectedTeacherId(event.target.value)
                  setHasQueried(false)
                  setSchedule([])
                  setScheduleForm(null)
                  setEditingScheduleId(null)
                }}
              >
                {viewType === 'class'
                  ? classes.map((item) => (
                      <option key={item.classId} value={item.classId}>
                        {item.className}
                      </option>
                    ))
                  : teachers.map((item) => (
                      <option key={item.teacherId} value={item.teacherId}>
                        {item.teacherName}（{item.teacherNo}）
                      </option>
                    ))}
              </select>
            </label>
            <label className="form-field">
              <span>学期</span>
              <select
                required
                value={selectedSemester}
                disabled={optionsLoading || semesters.length === 0}
                onChange={(event) => {
                  setSelectedSemester(event.target.value)
                  setHasQueried(false)
                  setSchedule([])
                  setScheduleForm(null)
                  setEditingScheduleId(null)
                }}
              >
                {semesters.map((semester) => (
                  <option key={semester} value={semester}>
                    {semester}
                  </option>
                ))}
              </select>
            </label>
            <div className="form-submit full">
              <button
                className="primary-button"
                disabled={
                  optionsLoading ||
                  scheduleLoading ||
                  semesters.length === 0 ||
                  (viewType === 'class'
                    ? classes.length === 0
                    : teachers.length === 0)
                }
              >
                {optionsLoading
                  ? '正在加载查询条件…'
                  : scheduleLoading
                    ? '查询中…'
                    : '查询课表'}
              </button>
            </div>
          </form>
        )}
      </Panel>
      <Panel
        title="课表安排"
        description={
          hasQueried
            ? `${selectedSemester} · ${viewType === 'class' ? '班级课表' : '教师课表'}`
            : '每周课程安排；选择查询条件后可加载对应课表。'
        }
      >
        {operationNotice && (
          <p className="schedule-message schedule-message-success">{operationNotice}</p>
        )}
        {viewType === 'class' && !hasQueried && !scheduleLoading && (
          <p className="schedule-message">先选择班级和学期并查询课表，再点击空白格安排课程。</p>
        )}
        {optionsLoading && <p className="schedule-message">正在加载课表查询条件…</p>}
        {!optionsLoading && optionsError && (
          <p className="schedule-message schedule-message-error">{optionsError}</p>
        )}
        {!optionsLoading && !optionsError && semesters.length === 0 && (
          <p className="schedule-message">当前没有可查询的排课学期。</p>
        )}
        {scheduleLoading && <p className="schedule-message">正在加载课表…</p>}
        {scheduleError && (
          <p className="schedule-message schedule-message-error">{scheduleError}</p>
        )}
        {hasQueried && !scheduleLoading && !scheduleError && schedule.length === 0 && (
          <p className="schedule-message">该学期暂无课表安排。</p>
        )}
        <div className="schedule-grid-scroll">
          <div className="schedule-grid">
              <div className="schedule-grid-heading schedule-grid-corner">节次</div>
              {['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'].map(
                (day, index) => (
                  <div
                    className="schedule-grid-heading"
                    key={day}
                    style={{ gridColumn: index + 2, gridRow: 1 }}
                  >
                    {day}
                  </div>
                ),
              )}
              {Array.from({ length: 12 }, (_, index) => (
                <div
                  className="schedule-period-label"
                  key={`period-${index + 1}`}
                  style={{ gridColumn: 1, gridRow: index + 2 }}
                >
                  第{index + 1}节
                </div>
              ))}
              {Array.from({ length: 84 }, (_, index) => {
                const weekday = Math.floor(index / 12) + 1
                const section = (index % 12) + 1
                return (
                  <button
                    className="schedule-grid-cell"
                    type="button"
                    key={`cell-${weekday}-${section}`}
                    aria-label={`安排星期${weekday}第${section}节课程`}
                    title={`点击安排星期${weekday}第${section}节课程`}
                    disabled={viewType !== 'class' || !hasQueried || scheduleLoading}
                    onClick={() => beginCreateSchedule(weekday, section)}
                    style={{
                      gridColumn: weekday + 1,
                      gridRow: section + 1,
                    }}
                  />
                )
              })}
              {schedule.map((entry) => (
                <article
                  className="schedule-course-card"
                  key={entry.scheduleId}
                  role={viewType === 'class' ? 'button' : undefined}
                  tabIndex={viewType === 'class' ? 0 : undefined}
                  aria-label={viewType === 'class' ? `编辑${entry.courseName}排课` : undefined}
                  onClick={viewType === 'class' ? () => beginEditSchedule(entry) : undefined}
                  onKeyDown={viewType === 'class' ? (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      beginEditSchedule(entry)
                    }
                  } : undefined}
                  style={{
                    gridColumn: entry.weekday + 1,
                    gridRow: `${entry.startSection + 1} / span ${entry.endSection - entry.startSection + 1}`,
                  }}
                  title={`${entry.courseName} · 第${entry.startWeek}-${entry.endWeek}周`}
                >
                  <strong>{entry.courseName}</strong>
                  <span>
                    第{entry.startWeek}
                    {entry.endWeek !== entry.startWeek ? `-${entry.endWeek}` : ''}
                    周
                  </span>
                  {viewType === 'class' ? (
                    <span>{entry.teacherName ?? `教师 ID ${entry.teacherId}`}</span>
                  ) : (
                    <span>班级 ID {entry.classId}</span>
                  )}
                  {entry.location && <span>{entry.location}</span>}
                </article>
              ))}
          </div>
        </div>
      </Panel>
      {scheduleForm && (
        <Panel
          title={editingScheduleId === null ? '安排课程' : '修改排课'}
          description={
            editingScheduleId === null
              ? `为 ${selectedSemester} 的星期${scheduleForm.weekday}第${scheduleForm.section}节安排课程。`
              : '更新时学期和教师保持原值，不能修改。'
          }
        >
          <form className="admin-form schedule-edit-form" onSubmit={submitSchedule}>
            <label className="form-field">
              <span>课程</span>
              <select
                required
                value={scheduleForm.courseId}
                disabled={savingSchedule}
                onChange={(event) => chooseScheduleCourse(event.target.value)}
              >
                <option value="" disabled>请选择课程</option>
                {(editingScheduleId === null
                  ? schedulableCourses
                  : courses
                ).map((course) => {
                  const id = entityId(course)
                  if (id === undefined) return null
                  return (
                    <option key={id} value={id}>
                      {course.name ?? course.courseName ?? '未命名课程'}
                    </option>
                  )
                })}
              </select>
            </label>
            <label className="form-field">
              <span>班级（通过课表查询确定）</span>
              <input
                readOnly
                value={
                  classes.find(
                    (collegeClass) => String(collegeClass.classId) === scheduleForm.classId,
                  )?.className ?? ''
                }
              />
            </label>
            {editingScheduleId === null && (
              <label className="form-field">
                <span>教师（由所选课程关联）</span>
                <input
                  readOnly
                  value={
                    teachers.find(
                      (teacher) => String(teacher.teacherId) === scheduleForm.teacherId,
                    )?.teacherName ?? '所选课程未关联有效教师'
                  }
                />
              </label>
            )}
            <label className="form-field">
              <span>星期（由课表格子确定）</span>
              {editingScheduleId === null ? (
                <input
                  readOnly
                  value={`星期${['一', '二', '三', '四', '五', '六', '日'][Number(scheduleForm.weekday) - 1]}`}
                />
              ) : (
                <select
                  required
                  value={scheduleForm.weekday}
                  disabled={savingSchedule}
                  onChange={(event) => updateScheduleForm('weekday', event.target.value)}
                >
                  {['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'].map(
                    (day, index) => (
                      <option key={day} value={index + 1}>{day}</option>
                    ),
                  )}
                </select>
              )}
            </label>
            <label className="form-field">
              <span>节次（由课表格子确定）</span>
              {editingScheduleId === null ? (
                <input readOnly value={`第${scheduleForm.section}节`} />
              ) : (
                <select
                  required
                  value={scheduleForm.section}
                  disabled={savingSchedule}
                  onChange={(event) => updateScheduleForm('section', event.target.value)}
                >
                  {Array.from({ length: 12 }, (_, index) => (
                    <option key={index + 1} value={index + 1}>第{index + 1}节</option>
                  ))}
                </select>
              )}
            </label>
            <label className="form-field">
              <span>起始周</span>
              <input
                required
                type="number"
                min="1"
                max="255"
                value={scheduleForm.startWeek}
                disabled={savingSchedule}
                onChange={(event) => updateScheduleForm('startWeek', event.target.value)}
              />
            </label>
            <label className="form-field">
              <span>结束周</span>
              <input
                required
                type="number"
                min="1"
                max="255"
                value={scheduleForm.endWeek}
                disabled={savingSchedule}
                onChange={(event) => updateScheduleForm('endWeek', event.target.value)}
              />
            </label>
            <label className="form-field full">
              <span>上课地点</span>
              <input
                required
                maxLength={100}
                value={scheduleForm.location}
                placeholder="例如：教学楼 A101"
                disabled={savingSchedule}
                onChange={(event) => updateScheduleForm('location', event.target.value)}
              />
            </label>
            {formError && (
              <p className="schedule-message schedule-message-error full" role="alert">
                {formError}
              </p>
            )}
            <div className="form-submit full">
              <button className="primary-button" disabled={savingSchedule}>
                {savingSchedule
                  ? '保存中…'
                  : editingScheduleId === null
                    ? '创建排课'
                    : '保存修改'}
              </button>
              {editingScheduleId !== null && (
                <button
                  className="schedule-delete-button"
                  type="button"
                  disabled={savingSchedule}
                  onClick={() => void removeSchedule()}
                >
                  删除排课
                </button>
              )}
              <button
                className="secondary-button"
                type="button"
                disabled={savingSchedule}
                onClick={() => {
                  setScheduleForm(null)
                  setEditingScheduleId(null)
                  setFormError('')
                }}
              >
                取消
              </button>
            </div>
          </form>
        </Panel>
      )}
    </div>
  )
}

function Overview({
  courses,
  batches,
  availableCourses,
  activeBatches,
  courseLoadError,
  batchLoadError,
  onNavigate,
}: {
  courses: CollegeCourse[]
  batches: SelectionBatch[]
  availableCourses: number
  activeBatches: number
  courseLoadError: string
  batchLoadError: string
  onNavigate: (section: Section) => void
}) {
  return (
    <>
      <div className="overview-welcome">
        <div>
          <span className="welcome-tag">本学院工作台</span>
          <h2>您好，管理员</h2>
          <p>从账号到课程，把教学管理安排得井井有条。</p>
        </div>
        <div className="welcome-art" aria-hidden="true">
          <div className="welcome-orbit" />
          <span>✦</span><i /><b />
        </div>
      </div>
      <div className="stat-grid">
        <StatCard label="学院课程" value={courseLoadError ? '—' : courses.length} icon="▤" tone="blue" note="已开设课程" />
        <StatCard label="可选课程" value={courseLoadError ? '—' : availableCourses} icon="✓" tone="green" note="当前可供选课" />
        <StatCard label="选课批次" value={batchLoadError ? '—' : batches.length} icon="◷" tone="gold" note="学院选课安排" />
        <StatCard label="进行中批次" value={batchLoadError ? '—' : activeBatches} icon="↗" tone="violet" note="当前开放选课" />
      </div>
      {(courseLoadError || batchLoadError) && (
        <div className="inline-warning" role="alert">
          数据加载失败：{[courseLoadError, batchLoadError].filter(Boolean).join('；')}
        </div>
      )}
      <div className="overview-columns">
        <Panel title="快捷管理" description="常用教务操作，一步直达">
          <div className="quick-actions">
            <button onClick={() => onNavigate('accounts')}><span className="quick-icon blue">＋</span><span><strong>批量注册账号</strong><small>导入教师或学生信息</small></span><b>→</b></button>
            <button onClick={() => onNavigate('classes')}><span className="quick-icon gold">▦</span><span><strong>创建班级</strong><small>维护学院班级及学生归属</small></span><b>→</b></button>
            <button onClick={() => onNavigate('courses')}><span className="quick-icon green">▤</span><span><strong>管理课程</strong><small>创建课程并指定授课教师</small></span><b>→</b></button>
            <button onClick={() => onNavigate('batches')}><span className="quick-icon violet">◷</span><span><strong>设置选课批次</strong><small>安排选课开始与结束时间</small></span><b>→</b></button>
          </div>
        </Panel>
        <Panel title="最近课程" description="本学院课程列表">
          {courses.length === 0 ? (
            <EmptyState text={courseLoadError || '暂未创建课程，创建课程后会显示在这里。'} />
          ) : (
            <div className="recent-courses">
              {courses.slice(0, 4).map((course, index) => (
                <div className="recent-course" key={entityId(course) ?? `${course.courseCode}-${index}`}>
                  <span className={`course-monogram monogram-${index % 4}`}>{course.name?.slice(0, 1) ?? '课'}</span>
                  <span className="recent-course-name"><strong>{course.name ?? '未命名课程'}</strong><small>{course.courseCode ?? '—'} · {course.credit ?? '—'} 学分</small></span>
                  <span className={`mini-status status-${course.status ?? 0}`}>{statusName(course.status, ['未发布', '可选', '停开'])}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </>
  )
}

function StatCard({
  label,
  value,
  icon,
  tone,
  note,
}: {
  label: string
  value: number | string
  icon: string
  tone: string
  note: string
}) {
  return (
    <article className="stat-card">
      <div className={`stat-icon ${tone}`}>{icon}</div>
      <div className="stat-copy"><span>{label}</span><strong>{value}</strong><small>{note}</small></div>
      <span className="stat-spark" aria-hidden="true">⌁</span>
    </article>
  )
}

function AccountsSection({
  token,
  onSuccess,
  onError,
}: {
  token: string
  onSuccess: (text: string) => void
  onError: (error: unknown) => void
}) {
  const [kind, setKind] = useState<PersonKind>('teacher')
  const [rows, setRows] = useState<PersonRow[]>([newPersonRow()])
  const [submitting, setSubmitting] = useState(false)
  const itemName = kind === 'teacher' ? '教师' : '学生'

  function changeKind(next: PersonKind) {
    setKind(next)
    setRows([newPersonRow()])
  }

  function updateRow<K extends keyof PersonRow>(rowId: string, field: K, value: PersonRow[K]) {
    setRows((current) => current.map((row) => row.rowId === rowId ? { ...row, [field]: value } : row))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (rows.length > 500) {
      onError(new Error('单次最多注册 500 人'))
      return
    }
    if (
      kind === 'student' &&
      rows.some(
        (row) =>
          Number(row.graduationYear) !==
          Number(row.enrollmentYear) + Number(row.studyDuration),
      )
    ) {
      onError(new Error('每位学生的毕业年份必须等于入学年份加学制'))
      return
    }
    setSubmitting(true)
    try {
      if (kind === 'teacher') {
        const payload: BatchPersonInput[] = rows.map((row) => ({
          name: row.name,
          idCard: row.idCard,
          phone: row.phone,
        }))
        await registerTeachers(token, payload)
      } else {
        const payload: StudentRegistrationInput[] = rows.map((row) => ({
          name: row.name,
          idCard: row.idCard,
          phone: row.phone,
          ...(row.gender !== '' ? { gender: Number(row.gender) } : {}),
          ...(row.birth !== '' ? { birth: row.birth } : {}),
          enrollmentYear: Number(row.enrollmentYear),
          graduationYear: Number(row.graduationYear),
          studyDuration: Number(row.studyDuration),
        }))
        await registerStudents(token, payload)
      }
      onSuccess(`已成功提交 ${rows.length} 位${itemName}账号，初始密码为 123456，首次登录需修改密码。`)
      setRows([newPersonRow()])
    } catch (error) {
      onError(error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Panel title="批量注册师生账号" description="新账户归属当前管理员所在学院，单次最多 500 条。">
      <div className="segmented-control" role="tablist" aria-label="选择注册对象">
        <button className={kind === 'teacher' ? 'selected' : ''} onClick={() => changeKind('teacher')} role="tab" aria-selected={kind === 'teacher'}>注册教师</button>
        <button className={kind === 'student' ? 'selected' : ''} onClick={() => changeKind('student')} role="tab" aria-selected={kind === 'student'}>注册学生</button>
      </div>
      <div className="form-note"><span>i</span>账号由系统自动生成，手机号也可用于登录。身份证号和手机号必须唯一。</div>
      <form onSubmit={submit}>
        {kind === 'student' ? (
          <div className="student-registration-rows">
            {rows.map((row, index) => (
              <div className="student-registration-row" key={row.rowId}>
                <label className="form-field"><span>姓名</span><input required maxLength={50} aria-label={`姓名 ${index + 1}`} placeholder="真实姓名" value={row.name} onChange={(event) => updateRow(row.rowId, 'name', event.target.value)} /></label>
                <label className="form-field"><span>身份证号</span><input required maxLength={30} aria-label={`身份证号 ${index + 1}`} placeholder="身份证号" value={row.idCard} onChange={(event) => updateRow(row.rowId, 'idCard', event.target.value)} /></label>
                <label className="form-field"><span>手机号</span><input required type="tel" maxLength={20} aria-label={`手机号 ${index + 1}`} placeholder="登录手机号" value={row.phone} onChange={(event) => updateRow(row.rowId, 'phone', event.target.value)} /></label>
                <label className="form-field"><span>性别（选填）</span><select aria-label={`性别 ${index + 1}`} value={row.gender} onChange={(event) => updateRow(row.rowId, 'gender', event.target.value)}><option value="">选择性别</option><option value="1">男</option><option value="0">女</option></select></label>
                <label className="form-field"><span>生日（选填）</span><input type="date" aria-label={`生日 ${index + 1}`} value={row.birth} onChange={(event) => updateRow(row.rowId, 'birth', event.target.value)} /></label>
                <label className="form-field"><span>入学年份</span><input required type="number" min="1901" max="2155" aria-label={`入学年份 ${index + 1}`} placeholder="例如：2026" value={row.enrollmentYear} onChange={(event) => updateRow(row.rowId, 'enrollmentYear', event.target.value)} /></label>
                <label className="form-field"><span>学制（年）</span><input required type="number" min="1" step="1" aria-label={`学制 ${index + 1}`} placeholder="例如：4" value={row.studyDuration} onChange={(event) => updateRow(row.rowId, 'studyDuration', event.target.value)} /></label>
                <label className="form-field"><span>毕业年份</span><input required type="number" min="1901" max="2155" aria-label={`毕业年份 ${index + 1}`} placeholder="例如：2030" value={row.graduationYear} onChange={(event) => updateRow(row.rowId, 'graduationYear', event.target.value)} /></label>
                <button className="row-remove student-registration-remove" type="button" aria-label={`删除第 ${index + 1} 行`} disabled={rows.length === 1} onClick={() => setRows((current) => current.filter((entry) => entry.rowId !== row.rowId))}>×</button>
              </div>
            ))}
          </div>
        ) : (
          <div className="account-table-wrap">
            <table className="admin-table account-table">
              <thead><tr><th>姓名</th><th>身份证号</th><th>手机号</th><th aria-label="操作" /></tr></thead>
              <tbody>
              {rows.map((row, index) => (
                <tr key={row.rowId}>
                  <td><input required maxLength={50} aria-label={`姓名 ${index + 1}`} placeholder="真实姓名" value={row.name} onChange={(event) => updateRow(row.rowId, 'name', event.target.value)} /></td>
                  <td><input required maxLength={30} aria-label={`身份证号 ${index + 1}`} placeholder="身份证号" value={row.idCard} onChange={(event) => updateRow(row.rowId, 'idCard', event.target.value)} /></td>
                  <td><input required type="tel" maxLength={20} aria-label={`手机号 ${index + 1}`} placeholder="登录手机号" value={row.phone} onChange={(event) => updateRow(row.rowId, 'phone', event.target.value)} /></td>
                  <td><button className="row-remove" type="button" aria-label={`删除第 ${index + 1} 行`} disabled={rows.length === 1} onClick={() => setRows((current) => current.filter((entry) => entry.rowId !== row.rowId))}>×</button></td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="table-actions">
          <button className="text-button" type="button" disabled={rows.length >= 500} onClick={() => setRows((current) => [...current, newPersonRow()])}>＋ 添加一行</button>
          <span>{rows.length} / 500 人</span>
        </div>
        <div className="form-footer">
          <p>初始密码：<strong>123456</strong><span> · 首次登录需修改密码</span></p>
          <button className="primary-button" type="submit" disabled={submitting}>{submitting ? '提交中…' : `提交注册 ${rows.length} 位${itemName}`}</button>
        </div>
      </form>
    </Panel>
  )
}

function ClassesSection({
  token,
  onSuccess,
  onError,
}: {
  token: string
  onSuccess: (text: string) => void
  onError: (error: unknown) => void
}) {
  const [className, setClassName] = useState('')
  const [grade, setGrade] = useState('')
  const [enrollmentYear, setEnrollmentYear] = useState('')
  const [graduationYear, setGraduationYear] = useState('')
  const [status, setStatus] = useState('1')
  const [editingClassId, setEditingClassId] = useState<number | null>(null)
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [classes, setClasses] = useState<CollegeClass[]>([])
  const [classesLoading, setClassesLoading] = useState(true)
  const [classesError, setClassesError] = useState('')
  const [classesRefreshKey, setClassesRefreshKey] = useState(0)
  const [unassignedStudents, setUnassignedStudents] = useState<UnassignedStudent[]>([])
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([])
  const [unassignedLoading, setUnassignedLoading] = useState(true)
  const [unassignedError, setUnassignedError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let active = true
    void getClasses(token)
      .then((items) => {
        if (active) {
          setClasses(items)
          setClassesError('')
          setSelectedClassId((current) =>
            current !== null && items.some((item) => item.classId === current)
              ? current
              : null,
          )
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setClassesError(
            error instanceof Error ? error.message : '班级列表加载失败',
          )
        }
      })
      .finally(() => {
        if (active) setClassesLoading(false)
      })
    return () => {
      active = false
    }
  }, [token, classesRefreshKey])

  useEffect(() => {
    let active = true
    void getUnassignedStudents(token)
      .then((items) => {
        if (active) {
          setUnassignedStudents(items)
          setSelectedStudentIds([])
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setUnassignedError(
            error instanceof Error ? error.message : '未分班学生加载失败',
          )
        }
      })
      .finally(() => {
        if (active) setUnassignedLoading(false)
      })
    return () => {
      active = false
    }
  }, [token, refreshKey])

  function resetClassForm() {
    setClassName('')
    setGrade('')
    setEnrollmentYear('')
    setGraduationYear('')
    setStatus('1')
    setEditingClassId(null)
  }

  function editClass(collegeClass: CollegeClass) {
    setEditingClassId(collegeClass.classId)
    setClassName(collegeClass.className)
    setGrade(collegeClass.grade)
    setEnrollmentYear(String(collegeClass.enrollmentYear))
    setGraduationYear(String(collegeClass.graduationYear))
    setStatus(String(collegeClass.status))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function submitClass(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (Number(graduationYear) <= Number(enrollmentYear)) {
      onError(new Error('毕业年份必须晚于入学年份'))
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        className: className.trim(),
        grade: grade.trim(),
        enrollmentYear: Number(enrollmentYear),
        graduationYear: Number(graduationYear),
        status: Number(status),
      }
      if (editingClassId === null) {
        await createClass(token, payload)
        onSuccess('班级已创建，所属学院由系统根据当前管理员账号自动确定。')
      } else {
        await updateClass(token, editingClassId, payload)
        onSuccess('班级信息已更新。')
      }
      resetClassForm()
      setClassesLoading(true)
      setClassesError('')
      setClassesRefreshKey((current) => current + 1)
    } catch (error) {
      onError(error)
    } finally {
      setSubmitting(false)
    }
  }

  async function submitAssignment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (selectedClassId === null) {
      onError(new Error('请先选择一个在校班级'))
      return
    }
    if (selectedStudentIds.length === 0) {
      onError(new Error('请至少选择一名未分配班级的学生'))
      return
    }
    if (selectedStudentIds.length > 500) {
      onError(new Error('单次最多为 500 名学生分配班级'))
      return
    }
    setSubmitting(true)
    try {
      await assignStudentsToClass(token, selectedStudentIds, selectedClassId)
      const selectedClass = classes.find(
        (item) => item.classId === selectedClassId,
      )
      onSuccess(
        `已将 ${selectedStudentIds.length} 名学生加入${selectedClass?.className ?? '所选班级'}。`,
      )
      setSelectedStudentIds([])
      setUnassignedLoading(true)
      setUnassignedError('')
      setRefreshKey((current) => current + 1)
      setClassesLoading(true)
      setClassesError('')
      setClassesRefreshKey((current) => current + 1)
    } catch (error) {
      onError(error)
    } finally {
      setSubmitting(false)
    }
  }

  function toggleStudent(studentId: number, checked: boolean) {
    setSelectedStudentIds((current) => {
      if (!checked) return current.filter((id) => id !== studentId)
      if (current.includes(studentId) || current.length >= 500) return current
      return [...current, studentId]
    })
  }

  function selectStudents() {
    const selectableStudents = unassignedStudents.slice(0, 500)
    setSelectedStudentIds(selectableStudents.map((student) => student.studentId))
  }

  return (
    <div className="class-management">
      <Panel
        title="本学院班级"
        description="选择一个在校班级，再勾选未分班学生即可批量分配。"
        action={
          <button
            className="text-button"
            type="button"
            disabled={classesLoading}
            onClick={() => {
              setClassesLoading(true)
              setClassesError('')
              setClassesRefreshKey((current) => current + 1)
            }}
          >
            刷新
          </button>
        }
      >
        {classesError ? (
          <div className="inline-warning" role="alert">{classesError}</div>
        ) : classesLoading ? (
          <EmptyState text="正在加载本学院班级…" />
        ) : classes.length === 0 ? (
          <EmptyState text="当前学院还没有班级，请先创建班级。" />
        ) : (
          <div className="table-scroll">
            <table className="admin-table classes-table">
              <thead>
                <tr>
                  <th>选择</th>
                  <th>班级名称</th>
                  <th>年级</th>
                  <th>班级人数</th>
                  <th>入学 / 毕业</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {classes.map((collegeClass) => (
                  <tr
                    className={
                      selectedClassId === collegeClass.classId
                        ? 'selected-class-row'
                        : ''
                    }
                    key={collegeClass.classId}
                  >
                    <td>
                      <input
                        className="class-select-radio"
                        type="radio"
                        name="target-class"
                        aria-label={`选择${collegeClass.className}`}
                        checked={selectedClassId === collegeClass.classId}
                        disabled={collegeClass.status !== 1}
                        onChange={() => setSelectedClassId(collegeClass.classId)}
                      />
                    </td>
                    <td><strong className="table-primary">{collegeClass.className}</strong></td>
                    <td>{collegeClass.grade}</td>
                    <td>{collegeClass.studentCount}</td>
                    <td>{collegeClass.enrollmentYear}–{collegeClass.graduationYear}</td>
                    <td>
                      <span className={`mini-status ${collegeClass.status === 1 ? 'class-status-active' : 'class-status-graduated'}`}>
                        {collegeClass.status === 1 ? '在校' : '已毕业'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="table-action"
                        type="button"
                        disabled={submitting}
                        onClick={() => editClass(collegeClass)}
                      >
                        编辑
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      <div className="two-panels">
      <Panel
        title={editingClassId === null ? '创建班级' : `编辑班级 · ID ${editingClassId}`}
        description={editingClassId === null
          ? '班级学院归属由当前管理员账号自动设置。'
          : '班级人数由学生分班操作维护，不能在此修改。'}
      >
        <form className="admin-form" onSubmit={submitClass}>
          <label className="form-field full"><span>班级名称</span><input required maxLength={50} placeholder="例如：软件工程 2026 级 1 班" value={className} onChange={(event) => setClassName(event.target.value)} /></label>
          <label className="form-field"><span>年级</span><input required maxLength={10} placeholder="例如：2026" value={grade} onChange={(event) => setGrade(event.target.value)} /></label>
          <label className="form-field"><span>班级状态</span><select required value={status} onChange={(event) => setStatus(event.target.value)}><option value="1">在校</option><option value="0">已毕业</option></select></label>
          <label className="form-field"><span>入学年份</span><input required type="number" min="1901" max="2155" value={enrollmentYear} onChange={(event) => setEnrollmentYear(event.target.value)} /></label>
          <label className="form-field"><span>毕业年份</span><input required type="number" min="1902" max="2155" value={graduationYear} onChange={(event) => setGraduationYear(event.target.value)} /></label>
          <p className="field-hint">毕业年份须晚于入学年份；已毕业班级不能分配新学生。</p>
          <div className="form-submit full">
            <button className="primary-button" disabled={submitting}>
              {submitting ? '提交中…' : editingClassId === null ? '创建班级' : '保存修改'}
            </button>
            {editingClassId !== null && (
              <button
                className="secondary-button"
                type="button"
                disabled={submitting}
                onClick={resetClassForm}
              >
                取消编辑
              </button>
            )}
          </div>
        </form>
      </Panel>
      <Panel title="批量分配学生班级" description="选择未分班学生并指定目标班级，一次最多分配 500 人。">
        <div className="form-note"><span>i</span>请选择上方班级列表中的在校班级；已毕业班级不能分配新学生。</div>
        <form className="admin-form single-column" onSubmit={submitAssignment}>
          <div className={`selected-class-summary${selectedClassId === null ? ' is-empty' : ''}`}>
            {selectedClassId === null
              ? '尚未选择目标班级'
              : `目标班级：${classes.find((item) => item.classId === selectedClassId)?.className ?? ''}`}
          </div>
          <div className="unassigned-students">
            <div className="unassigned-heading">
              <div>
                <strong>尚未分配班级</strong>
                <span>已选择 {selectedStudentIds.length} / 500 人</span>
              </div>
              <div className="unassigned-actions">
                <button
                  className="text-button"
                  type="button"
                  disabled={unassignedLoading || unassignedStudents.length === 0}
                  onClick={() => {
                    if (selectedStudentIds.length > 0) {
                      setSelectedStudentIds([])
                    } else {
                      selectStudents()
                    }
                  }}
                >
                  {selectedStudentIds.length > 0 ? '清除选择' : '选择全部（最多 500）'}
                </button>
                <button
                  className="text-button"
                  type="button"
                  disabled={unassignedLoading}
                  onClick={() => {
                    setUnassignedLoading(true)
                    setUnassignedError('')
                    setRefreshKey((current) => current + 1)
                  }}
                >
                  刷新
                </button>
              </div>
            </div>
            {unassignedLoading ? (
              <p className="unassigned-state">正在加载未分班学生…</p>
            ) : unassignedError ? (
              <div className="inline-warning" role="alert">{unassignedError}</div>
            ) : unassignedStudents.length === 0 ? (
              <p className="unassigned-state">目前没有未分配班级的学生。</p>
            ) : (
              <div className="unassigned-list">
                {unassignedStudents.map((student) => (
                  <label className="unassigned-student" key={student.studentNo}>
                    <input
                      type="checkbox"
                      checked={selectedStudentIds.includes(student.studentId)}
                      disabled={
                        submitting ||
                        (!selectedStudentIds.includes(student.studentId) &&
                          selectedStudentIds.length >= 500)
                      }
                      onChange={(event) =>
                        toggleStudent(student.studentId, event.target.checked)
                      }
                    />
                    <span className="student-avatar">{student.studentName.slice(0, 1)}</span>
                    <span><strong>{student.studentName}</strong><small>{student.studentNo}</small></span>
                  </label>
                ))}
              </div>
            )}
            {unassignedStudents.length > 0 && !unassignedLoading && !unassignedError && (
              <p className="unassigned-hint">
                勾选后将使用接口返回的学生 ID 批量分配到指定班级。
              </p>
            )}
            <div className="form-submit"><button className="primary-button" disabled={submitting || unassignedLoading || selectedClassId === null || selectedStudentIds.length === 0}>{submitting ? '提交中…' : `将 ${selectedStudentIds.length} 名学生加入班级`}</button></div>
          </div>
        </form>
      </Panel>
      </div>
    </div>
  )
}

function StudentsSection({
  token,
  onSuccess,
  onError,
}: {
  token: string
  onSuccess: (text: string) => void
  onError: (error: unknown) => void
}) {
  const [pageNum, setPageNum] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [studentPage, setStudentPage] = useState<StudentPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingStudent, setEditingStudent] = useState<CollegeStudent | null>(null)
  const [studentForm, setStudentForm] = useState({
    name: '',
    phone: '',
    gender: '',
    birth: '',
    enrollmentYear: '',
    graduationYear: '',
    studyDuration: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    void getStudents(token, pageNum, pageSize)
      .then((result) => {
        if (active) setStudentPage(result)
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(
            loadError instanceof Error ? loadError.message : '学生列表加载失败',
          )
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [token, pageNum, pageSize])

  const currentPage = studentPage?.pageNum ?? pageNum
  const pageCount = Math.max(studentPage?.pages ?? 1, 1)

  function changePage(nextPage: number) {
    setLoading(true)
    setError('')
    setPageNum(nextPage)
  }

  function editStudent(student: CollegeStudent) {
    setEditingStudent(student)
    setStudentForm({
      name: student.studentName,
      phone: student.phone,
      gender: student.gender === null ? '' : String(student.gender),
      birth: student.birth?.slice(0, 10) ?? '',
      enrollmentYear: student.enrollmentYear?.toString() ?? '',
      graduationYear: student.graduationYear?.toString() ?? '',
      studyDuration: student.studyDuration?.toString() ?? '',
    })
  }

  async function submitStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editingStudent?.studentId) return
    const enrollmentYear = Number(studentForm.enrollmentYear)
    const graduationYear = Number(studentForm.graduationYear)
    const studyDuration = Number(studentForm.studyDuration)
    if (graduationYear !== enrollmentYear + studyDuration) {
      onError(new Error('毕业年份必须等于入学年份加学制'))
      return
    }
    setSaving(true)
    try {
      await updateStudent(token, editingStudent.studentId, {
        name: studentForm.name.trim(),
        phone: studentForm.phone.trim(),
        gender: studentForm.gender === '' ? null : Number(studentForm.gender),
        birth: studentForm.birth || null,
        enrollmentYear,
        graduationYear,
        studyDuration,
      })
      setStudentPage(await getStudents(token, pageNum, pageSize))
      setEditingStudent(null)
      onSuccess('学生资料已更新。')
    } catch (saveError) {
      onError(saveError)
    } finally {
      setSaving(false)
    }
  }

  async function removeStudent(student: CollegeStudent) {
    if (!student.studentId || saving) return
    if (!window.confirm(`确定停用学生账号“${student.studentName}（${student.studentNo}）”吗？历史选课和成绩将保留。`)) {
      return
    }
    setSaving(true)
    try {
      await deactivateStudent(token, student.studentId)
      setStudentPage(await getStudents(token, pageNum, pageSize))
      if (editingStudent?.studentId === student.studentId) setEditingStudent(null)
      onSuccess('学生账号已停用。')
    } catch (deleteError) {
      onError(deleteError)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Panel
      title="本学院学生"
      description="可编辑学生资料或停用账号；停用会保留历史选课、成绩与档案记录。"
      action={
        <label className="page-size-control">
          <span>每页</span>
          <select
            aria-label="每页条数"
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value))
              changePage(1)
            }}
          >
            {[10, 20, 50, 100].map((size) => (
              <option key={size} value={size}>{size} 条</option>
            ))}
          </select>
        </label>
      }
    >
      {error ? (
        <div className="inline-warning" role="alert">{error}</div>
      ) : (
        <>
          {editingStudent && (
            <form className="admin-form" onSubmit={(event) => void submitStudent(event)}>
              <label className="form-field"><span>姓名</span><input required maxLength={50} value={studentForm.name} onChange={(event) => setStudentForm((form) => ({ ...form, name: event.target.value }))} /></label>
              <label className="form-field"><span>手机号</span><input required pattern="1[3-9][0-9]{9}" value={studentForm.phone} onChange={(event) => setStudentForm((form) => ({ ...form, phone: event.target.value }))} /></label>
              <label className="form-field"><span>性别</span><select value={studentForm.gender} onChange={(event) => setStudentForm((form) => ({ ...form, gender: event.target.value }))}><option value="">未填写</option><option value="1">男</option><option value="0">女</option></select></label>
              <label className="form-field"><span>出生日期</span><input type="date" value={studentForm.birth} onChange={(event) => setStudentForm((form) => ({ ...form, birth: event.target.value }))} /></label>
              <label className="form-field"><span>入学年份</span><input required type="number" min={1901} max={2155} value={studentForm.enrollmentYear} onChange={(event) => setStudentForm((form) => ({ ...form, enrollmentYear: event.target.value }))} /></label>
              <label className="form-field"><span>毕业年份</span><input required type="number" min={1901} max={2155} value={studentForm.graduationYear} onChange={(event) => setStudentForm((form) => ({ ...form, graduationYear: event.target.value }))} /></label>
              <label className="form-field"><span>学制（年）</span><input required type="number" min={1} value={studentForm.studyDuration} onChange={(event) => setStudentForm((form) => ({ ...form, studyDuration: event.target.value }))} /></label>
              <div className="form-submit"><button className="primary-button" disabled={saving}>{saving ? '保存中…' : '保存学生资料'}</button><button className="secondary-button" type="button" disabled={saving} onClick={() => setEditingStudent(null)}>取消</button></div>
            </form>
          )}
          <div className="table-scroll">
            <table className="admin-table students-table">
              <thead>
                <tr>
                  <th>学号</th>
                  <th>姓名</th>
                  <th>性别</th>
                  <th>出生日期</th>
                  <th>班级</th>
                  <th>入学年份</th>
                  <th>学制</th>
                  <th>手机号</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td className="table-message" colSpan={9}>正在加载学生信息…</td></tr>
                ) : studentPage?.list.length ? (
                  studentPage.list.map((student: CollegeStudent) => (
                    <tr key={student.studentNo}>
                      <td><strong className="table-primary">{student.studentNo}</strong></td>
                      <td>{student.studentName}</td>
                      <td>
                        {student.gender === 1
                          ? '男'
                          : student.gender === 0
                            ? '女'
                            : '—'}
                      </td>
                      <td>{displayBirthDate(student.birth)}</td>
                      <td>
                        {student.className ?? <span className="unassigned-tag">未分班</span>}
                      </td>
                      <td>{student.enrollmentYear ?? '—'}</td>
                      <td>{student.studyDuration ? `${student.studyDuration} 年` : '—'}</td>
                      <td>{student.phone || '—'}</td>
                      <td className="course-actions">
                        <button className="table-action" type="button" disabled={saving} onClick={() => editStudent(student)}>编辑</button>
                        <button className="table-action table-action-danger" type="button" disabled={saving} onClick={() => void removeStudent(student)}>停用</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td className="table-message" colSpan={9}>暂无学生信息。</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="student-pagination">
            <span>
              共 {studentPage?.total ?? 0} 名学生
              {!loading && studentPage && studentPage.total > 0 && (
                <> · 第 {currentPage} / {pageCount} 页</>
              )}
            </span>
            <div>
              <button
                className="secondary-button"
                type="button"
                disabled={loading || currentPage <= 1}
                onClick={() => changePage(Math.max(1, currentPage - 1))}
              >
                上一页
              </button>
              <button
                className="secondary-button"
                type="button"
                disabled={loading || currentPage >= pageCount}
                onClick={() => changePage(currentPage + 1)}
              >
                下一页
              </button>
            </div>
          </div>
          <p className="student-privacy-note">接口不返回学生身份证号。</p>
        </>
      )}
    </Panel>
  )
}

function TeachersSection({
  token,
  onSuccess,
  onError,
}: {
  token: string
  onSuccess: (text: string) => void
  onError: (error: unknown) => void
}) {
  const [teachers, setTeachers] = useState<CollegeTeacher[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingTeacher, setEditingTeacher] = useState<CollegeTeacher | null>(null)
  const [form, setForm] = useState({ name: '', phone: '' })
  const [busy, setBusy] = useState(false)

  async function loadTeachers() {
    const items = await getTeachers(token)
    setTeachers(items)
    setError('')
  }

  useEffect(() => {
    let active = true
    void getTeachers(token)
      .then((items) => {
        if (active) {
          setTeachers(items)
          setError('')
        }
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : '教师列表加载失败')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [token])

  function editTeacher(teacher: CollegeTeacher) {
    setEditingTeacher(teacher)
    setForm({ name: teacher.teacherName, phone: teacher.phone })
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editingTeacher) return
    setBusy(true)
    try {
      await updateTeacher(token, editingTeacher.teacherId, {
        name: form.name.trim(),
        phone: form.phone.trim(),
      })
      await loadTeachers()
      setEditingTeacher(null)
      onSuccess('教师资料已更新。')
    } catch (saveError) {
      onError(saveError)
    } finally {
      setBusy(false)
    }
  }

  async function removeTeacher(teacher: CollegeTeacher) {
    if (busy) return
    if (!window.confirm(`确定停用教师账号“${teacher.teacherName}（${teacher.teacherNo}）”吗？已有课程和历史记录将保留。`)) {
      return
    }
    setBusy(true)
    try {
      await deactivateTeacher(token, teacher.teacherId)
      await loadTeachers()
      if (editingTeacher?.teacherId === teacher.teacherId) setEditingTeacher(null)
      onSuccess('教师账号已停用。')
    } catch (deleteError) {
      onError(deleteError)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="batch-management">
      {editingTeacher && (
        <Panel title={`编辑教师 · ${editingTeacher.teacherNo}`} description="教师号和身份证号不可在此修改。">
          <form className="admin-form" onSubmit={(event) => void submit(event)}>
            <label className="form-field"><span>姓名</span><input required maxLength={50} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></label>
            <label className="form-field"><span>手机号</span><input required pattern="1[3-9][0-9]{9}" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} /></label>
            <div className="form-submit"><button className="primary-button" disabled={busy}>{busy ? '保存中…' : '保存教师资料'}</button><button className="secondary-button" type="button" disabled={busy} onClick={() => setEditingTeacher(null)}>取消</button></div>
          </form>
        </Panel>
      )}
      <Panel
        title="本学院教师"
        description="查看、编辑教师姓名和手机号，或停用教师账号；停用会保留已有课程和历史数据。"
        action={<button className="secondary-button" type="button" disabled={loading || busy} onClick={() => { setLoading(true); void loadTeachers().catch(onError).finally(() => setLoading(false)) }}>刷新</button>}
      >
        {error ? (
          <div className="inline-warning" role="alert">{error}</div>
        ) : loading ? (
          <p className="schedule-message">正在加载教师信息…</p>
        ) : teachers.length === 0 ? (
          <EmptyState text="暂无状态正常的教师账号。" />
        ) : (
          <div className="table-scroll">
            <table className="admin-table">
              <thead><tr><th>教师号</th><th>姓名</th><th>手机号</th><th>操作</th></tr></thead>
              <tbody>
                {teachers.map((teacher) => (
                  <tr key={teacher.teacherId}>
                    <td><strong className="table-primary">{teacher.teacherNo}</strong></td>
                    <td>{teacher.teacherName}</td>
                    <td>{teacher.phone || '—'}</td>
                    <td className="course-actions">
                      <button className="table-action" type="button" disabled={busy} onClick={() => editTeacher(teacher)}>编辑</button>
                      <button className="table-action table-action-danger" type="button" disabled={busy} onClick={() => void removeTeacher(teacher)}>停用</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  )
}

function CoursesSection({
  courses,
  loadError,
  token,
  onCoursesChange,
  onSuccess,
  onError,
}: {
  courses: CollegeCourse[]
  loadError: string
  token: string
  onCoursesChange: (courses: CollegeCourse[]) => void
  onSuccess: (text: string) => void
  onError: (error: unknown) => void
}) {
  const [form, setForm] = useState<CourseForm>(emptyCourse)
  const [editingId, setEditingId] = useState<number | undefined>()
  const [submitting, setSubmitting] = useState(false)
  const [deletingCourseId, setDeletingCourseId] = useState<number | undefined>()
  const [teachers, setTeachers] = useState<CollegeTeacher[]>([])
  const [teachersLoading, setTeachersLoading] = useState(true)
  const [teachersError, setTeachersError] = useState('')

  useEffect(() => {
    let active = true
    void getTeachers(token)
      .then((items) => {
        if (active) {
          setTeachers(items)
          setTeachersError('')
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setTeachersError(
            error instanceof Error ? error.message : '教师列表加载失败',
          )
        }
      })
      .finally(() => {
        if (active) setTeachersLoading(false)
      })
    return () => {
      active = false
    }
  }, [token])

  function update<K extends keyof CourseForm>(key: K, value: CourseForm[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function editCourse(course: CollegeCourse) {
    const id = entityId(course)
    if (id === undefined) return
    setEditingId(id)
    setForm({
      courseCode: course.courseCode ?? '',
      name: course.name ?? '',
      credit: course.credit?.toString() ?? '',
      hours: course.hours?.toString() ?? '',
      assessType: course.assessType ?? '',
      teacherId: course.teacherId?.toString() ?? '',
      courseType: course.courseType?.toString() ?? '1',
      status: course.status?.toString() ?? '0',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    try {
      const payload = {
        courseCode: form.courseCode.trim(),
        name: form.name.trim(),
        credit: Number(form.credit),
        hours: Number(form.hours),
        assessType: form.assessType.trim(),
        teacherId: Number(form.teacherId),
        courseType: Number(form.courseType),
        status: Number(form.status),
      }
      await saveCourse(token, payload, editingId)
      onSuccess(editingId === undefined ? '课程已创建。' : '课程信息已更新。')
      onCoursesChange(await getCourses(token))
      setForm(emptyCourse)
      setEditingId(undefined)
    } catch (error) {
      onError(error)
    } finally {
      setSubmitting(false)
    }
  }

  async function removeCourse(course: CollegeCourse) {
    const courseId = entityId(course)
    if (courseId === undefined) {
      onError(new Error('课程记录缺少有效的课程 ID，无法删除'))
      return
    }
    if (!window.confirm(`确定删除课程“${course.name ?? '未命名课程'}”吗？此操作不可撤销。`)) {
      return
    }

    setDeletingCourseId(courseId)
    try {
      await deleteCourse(token, courseId)
      onCoursesChange(await getCourses(token))
      if (editingId === courseId) {
        setEditingId(undefined)
        setForm(emptyCourse)
      }
      onSuccess('课程已删除。')
    } catch (error) {
      onError(error)
    } finally {
      setDeletingCourseId(undefined)
    }
  }

  return (
    <div className="course-management">
      <Panel title={editingId === undefined ? '创建课程' : `编辑课程 · ID ${editingId}`} description="授课教师必须属于本学院；开课单位自动设置为当前学院。">
        <div className="form-note"><span>i</span>课程码全局唯一；课程支持专业课、选修课与网课。选择下方教师后，系统会自动使用其教师 ID 提交课程。</div>
        {teachersError && <div className="inline-warning" role="alert">{teachersError}</div>}
        <form className="admin-form course-form" onSubmit={submit}>
          <label className="form-field"><span>课程名称</span><input required maxLength={100} placeholder="请输入课程名称" value={form.name} onChange={(event) => update('name', event.target.value)} /></label>
          <label className="form-field"><span>课程码</span><input required maxLength={30} placeholder="例如：WEB101" value={form.courseCode} onChange={(event) => update('courseCode', event.target.value)} /></label>
          <label className="form-field"><span>学分</span><input required type="number" min="0.1" max="99.9" step="0.1" placeholder="例如：2.0" value={form.credit} onChange={(event) => update('credit', event.target.value)} /></label>
          <label className="form-field"><span>学时</span><input required type="number" min="1" step="1" placeholder="请输入整数" value={form.hours} onChange={(event) => update('hours', event.target.value)} /></label>
          <label className="form-field"><span>考核方式</span><input required maxLength={20} placeholder="例如：线上考试" value={form.assessType} onChange={(event) => update('assessType', event.target.value)} /></label>
          <label className="form-field">
            <span>授课教师</span>
            <select
              required
              value={form.teacherId}
              disabled={teachersLoading || teachers.length === 0}
              onChange={(event) => update('teacherId', event.target.value)}
            >
              <option value="">
                {teachersLoading
                  ? '正在加载教师…'
                  : teachers.length === 0
                    ? '暂无可选教师'
                    : '请选择本学院教师'}
              </option>
              {teachers.map((teacher) => (
                <option key={teacher.teacherId} value={teacher.teacherId}>
                  {teacher.teacherName}（{teacher.teacherNo} · {teacher.phone || '无手机号'}）
                </option>
              ))}
            </select>
          </label>
          <label className="form-field"><span>课程类型</span><select required value={form.courseType} onChange={(event) => update('courseType', event.target.value)}><option value="1">专业课</option><option value="2">选修课</option><option value="3">网课</option></select></label>
          <label className="form-field"><span>发布状态</span><select required value={form.status} onChange={(event) => update('status', event.target.value)}><option value="0">未发布</option><option value="1">可选</option><option value="2">停开</option></select></label>
          <div className="form-submit full"><button className="primary-button" disabled={submitting}>{submitting ? '保存中…' : editingId === undefined ? '创建课程' : '保存修改'}</button>{editingId !== undefined && <button className="secondary-button" type="button" onClick={() => { setEditingId(undefined); setForm(emptyCourse) }}>取消编辑</button>}</div>
        </form>
      </Panel>
      <Panel title="本学院课程" description={`${courses.length} 门课程`}>
        {loadError ? <div className="inline-warning" role="alert">{loadError}</div> : courses.length === 0 ? <EmptyState text="暂无课程，使用上方表单创建第一门课程。" /> : (
          <div className="table-scroll">
            <table className="admin-table">
              <thead><tr><th>课程信息</th><th>课程类型</th><th>学分 / 学时</th><th>教师 ID</th><th>状态</th><th>操作</th></tr></thead>
              <tbody>{courses.map((course, index) => (
                <tr key={entityId(course) ?? `${course.courseCode}-${index}`}>
                  <td><strong className="table-primary">{course.name ?? '未命名课程'}</strong><small className="table-secondary">{course.courseCode ?? '—'} · {course.assessType ?? '未设置考核方式'}</small></td>
                  <td>{statusName(course.courseType, ['', '专业课', '选修课', '网课'])}</td>
                  <td>{course.credit ?? '—'} 学分 / {course.hours ?? '—'} 学时</td>
                  <td>{course.teacherId ?? '—'}</td>
                  <td><span className={`mini-status status-${course.status ?? 0}`}>{statusName(course.status, ['未发布', '可选', '停开'])}</span></td>
                  <td className="course-actions">
                    <button className="table-action" type="button" disabled={entityId(course) === undefined || deletingCourseId !== undefined} onClick={() => editCourse(course)}>编辑</button>
                    <button
                      className="table-action table-action-danger"
                      type="button"
                      disabled={entityId(course) === undefined || deletingCourseId !== undefined}
                      onClick={() => void removeCourse(course)}
                    >
                      {deletingCourseId === entityId(course) ? '删除中…' : '删除'}
                    </button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  )
}

function SemestersSection({
  token,
  onSuccess,
  onError,
}: {
  token: string
  onSuccess: (text: string) => void
  onError: (error: unknown) => void
}) {
  const [semesters, setSemesters] = useState<CollegeSemester[]>([])
  const [semesterName, setSemesterName] = useState('')
  const [editingId, setEditingId] = useState<number | undefined>()
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function loadSemesters() {
    const items = await getCollegeSemesters(token)
    setSemesters(items)
    setLoadError('')
  }

  useEffect(() => {
    let active = true
    void getCollegeSemesters(token)
      .then((items) => {
        if (active) {
          setSemesters(items)
          setLoadError('')
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadError(error instanceof Error ? error.message : '学期列表加载失败')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [token])

  function editSemester(item: CollegeSemester) {
    setEditingId(item.semesterId)
    setSemesterName(item.semester)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = semesterName.trim()
    if (!name) {
      onError(new Error('请填写学期名称'))
      return
    }
    setSubmitting(true)
    try {
      await saveSemester(token, name, editingId)
      onSuccess(editingId === undefined ? '学期已创建。' : '学期已更新。')
      await loadSemesters()
      setEditingId(undefined)
      setSemesterName('')
    } catch (error) {
      onError(error)
    } finally {
      setSubmitting(false)
    }
  }

  async function removeSemester(item: CollegeSemester) {
    if (submitting || deletingId !== null) return
    if (!window.confirm(`确定删除学期“${item.semester}”吗？已有排课的学期不能删除。`)) {
      return
    }
    setDeletingId(item.semesterId)
    try {
      await deleteSemester(token, item.semesterId)
      onSuccess('学期已删除。')
      await loadSemesters()
      if (editingId === item.semesterId) {
        setEditingId(undefined)
        setSemesterName('')
      }
    } catch (error) {
      onError(error)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="batch-management">
      <Panel
        title={editingId === undefined ? '创建学期' : `编辑学期 · ID ${editingId}`}
        description="学期列表供教师、学生与课表管理共用；已有排课的学期不能删除。"
      >
        <form className="admin-form batch-form" onSubmit={(event) => void submit(event)}>
          <label className="form-field full">
            <span>学期名称</span>
            <input
              required
              maxLength={20}
              placeholder="例如：2026-2027-1"
              value={semesterName}
              onChange={(event) => setSemesterName(event.target.value)}
            />
          </label>
          <div className="form-submit">
            <button className="primary-button" disabled={submitting}>
              {submitting ? '保存中…' : editingId === undefined ? '创建学期' : '保存修改'}
            </button>
            {editingId !== undefined && (
              <button
                className="secondary-button"
                type="button"
                onClick={() => {
                  setEditingId(undefined)
                  setSemesterName('')
                }}
              >
                取消编辑
              </button>
            )}
          </div>
        </form>
      </Panel>
      <Panel title="学期列表" description={`${semesters.length} 个学期`}>
        {loadError ? (
          <div className="inline-warning" role="alert">{loadError}</div>
        ) : loading ? (
          <p className="schedule-message">正在加载学期…</p>
        ) : semesters.length === 0 ? (
          <EmptyState text="暂无学期，请使用上方表单创建学期。" />
        ) : (
          <div className="table-scroll">
            <table className="admin-table">
              <thead><tr><th>学期</th><th>ID</th><th>操作</th></tr></thead>
              <tbody>
                {semesters.map((item) => (
                  <tr key={item.semesterId}>
                    <td><strong className="table-primary">{item.semester}</strong></td>
                    <td>{item.semesterId}</td>
                    <td className="course-actions">
                      <button
                        className="table-action"
                        type="button"
                        disabled={submitting || deletingId !== null}
                        onClick={() => editSemester(item)}
                      >
                        编辑
                      </button>
                      <button
                        className="table-action table-action-danger"
                        type="button"
                        disabled={submitting || deletingId !== null}
                        onClick={() => void removeSemester(item)}
                      >
                        {deletingId === item.semesterId ? '删除中…' : '删除'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  )
}

function BatchesSection({
  batches,
  clockNow,
  loadError,
  token,
  onBatchesChange,
  onSuccess,
  onError,
}: {
  batches: SelectionBatch[]
  clockNow: number
  loadError: string
  token: string
  onBatchesChange: (batches: SelectionBatch[]) => void
  onSuccess: (text: string) => void
  onError: (error: unknown) => void
}) {
  const [form, setForm] = useState<BatchForm>(emptyBatch)
  const [editingId, setEditingId] = useState<number | undefined>()
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  function update<K extends keyof BatchForm>(key: K, value: BatchForm[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function editBatch(batch: SelectionBatch) {
    const id = entityId(batch)
    if (id === undefined) return
    setEditingId(id)
    setForm({
      batchName: batch.batchName ?? '',
      startTime: batch.startTime?.slice(0, 16) ?? '',
      endTime: batch.endTime?.slice(0, 16) ?? '',
      status: batch.status?.toString() ?? '0',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (new Date(form.startTime) >= new Date(form.endTime)) {
      onError(new Error('选课开始时间必须早于结束时间'))
      return
    }
    setSubmitting(true)
    try {
      await saveSelectionBatch(token, {
        batchName: form.batchName.trim(),
        startTime: form.startTime,
        endTime: form.endTime,
        status: Number(form.status),
      }, editingId)
      onSuccess(editingId === undefined ? '选课批次已创建。' : '选课批次已更新。')
      onBatchesChange(await getSelectionBatches(token))
      setForm(emptyBatch)
      setEditingId(undefined)
    } catch (error) {
      onError(error)
    } finally {
      setSubmitting(false)
    }
  }

  async function removeBatch(batch: SelectionBatch) {
    const batchId = entityId(batch)
    if (batchId === undefined || submitting || deletingId !== null) return
    if (!window.confirm(`确定删除选课批次“${batch.batchName ?? '未命名批次'}”吗？此操作不可撤销。`)) {
      return
    }

    setDeletingId(batchId)
    try {
      await deleteSelectionBatch(token, batchId)
      onSuccess('选课批次已删除。')
      onBatchesChange(await getSelectionBatches(token))
      if (editingId === batchId) {
        setEditingId(undefined)
        setForm(emptyBatch)
      }
    } catch (error) {
      onError(error)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="batch-management">
      <Panel title={editingId === undefined ? '创建选课批次' : `编辑选课批次 · ID ${editingId}`} description="批次只对当前学院开放，开始时间须早于结束时间。">
        <form className="admin-form batch-form" onSubmit={submit}>
          <label className="form-field full"><span>批次名称</span><input required maxLength={100} placeholder="例如：2026 春季选课" value={form.batchName} onChange={(event) => update('batchName', event.target.value)} /></label>
          <label className="form-field"><span>开始时间</span><input required type="datetime-local" value={form.startTime} onChange={(event) => update('startTime', event.target.value)} /></label>
          <label className="form-field"><span>结束时间</span><input required type="datetime-local" value={form.endTime} onChange={(event) => update('endTime', event.target.value)} /></label>
          <label className="form-field"><span>批次状态</span><select required value={form.status} onChange={(event) => update('status', event.target.value)}><option value="0">未开始</option><option value="1">进行中</option><option value="2">已结束</option></select></label>
          <div className="form-submit"><button className="primary-button" disabled={submitting}>{submitting ? '保存中…' : editingId === undefined ? '创建批次' : '保存修改'}</button>{editingId !== undefined && <button className="secondary-button" type="button" onClick={() => { setEditingId(undefined); setForm(emptyBatch) }}>取消编辑</button>}</div>
        </form>
      </Panel>
      <Panel title="选课批次" description={`${batches.length} 个批次`}>
        {loadError ? <div className="inline-warning" role="alert">{loadError}</div> : batches.length === 0 ? <EmptyState text="暂无选课批次，创建批次后即可安排学院选课时间。" /> : (
          <div className="table-scroll">
            <table className="admin-table">
              <thead><tr><th>批次名称</th><th>开始时间</th><th>结束时间</th><th>状态</th><th>操作</th></tr></thead>
              <tbody>{batches.map((batch, index) => (
                <tr key={entityId(batch) ?? `${batch.batchName}-${index}`}>
                  <td><strong className="table-primary">{batch.batchName ?? '未命名批次'}</strong></td>
                  <td>{displayDate(batch.startTime)}</td>
                  <td>{displayDate(batch.endTime)}</td>
                  <td>
                    {(() => {
                      const status = getBatchIntervalStatus(batch, clockNow)
                      const statusClass =
                        status === '进行中'
                          ? 'batch-status-1'
                          : status === '选课结束'
                            ? 'batch-status-2'
                            : status === '未开始'
                              ? 'batch-status-0'
                            : 'batch-status-invalid'
                      return <span className={`mini-status ${statusClass}`}>{status}</span>
                    })()}
                  </td>
                  <td>
                    <div className="batch-row-actions">
                      <button
                        className="table-action"
                        type="button"
                        disabled={submitting || deletingId !== null || entityId(batch) === undefined}
                        onClick={() => editBatch(batch)}
                      >
                        编辑
                      </button>
                      <button
                        className="table-action batch-delete-action"
                        type="button"
                        disabled={submitting || deletingId !== null || entityId(batch) === undefined}
                        onClick={() => void removeBatch(batch)}
                      >
                        {deletingId === entityId(batch) ? '删除中…' : '删除'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return <div className="empty-state"><span aria-hidden="true">◌</span><p>{text}</p></div>
}

export default CollegeAdminPage
