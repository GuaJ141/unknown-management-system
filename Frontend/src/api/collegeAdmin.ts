import axios from 'axios'
import { apiClient } from './client'

export interface BatchPersonInput {
  name: string
  idCard: string
  phone: string
}

export interface StudentRegistrationInput extends BatchPersonInput {
  gender?: number
  birth?: string
  enrollmentYear: number
  graduationYear: number
  studyDuration: number
}

export interface CollegeStudent {
  studentId: number | null
  studentNo: string
  studentName: string
  phone: string
  gender: number | null
  birth: string | null
  className: string | null
  enrollmentYear: number | null
  graduationYear: number | null
  studyDuration: number | null
}

export interface UnassignedStudent {
  studentId: number
  studentNo: string
  studentName: string
}

export interface StudentPage {
  pageNum: number
  pageSize: number
  size: number
  total: number
  pages: number
  list: CollegeStudent[]
}

export interface CollegeClass {
  classId: number
  className: string
  grade: string
  studentCount: number
  enrollmentYear: number
  graduationYear: number
  status: number
}

export interface CollegeTeacher {
  teacherId: number
  teacherNo: string
  teacherName: string
  phone: string
}

export interface CourseSchedule {
  scheduleId: number
  courseId: number
  courseCode: string
  courseName: string
  classId: number
  teacherId: number
  teacherName?: string
  semester: string
  weekday: number
  startSection: number
  endSection: number
  startWeek: number
  endWeek: number
  location: string
}

export interface CreateScheduleInput {
  courseId: number
  classId: number
  teacherId: number
  semester: string
  weekday: number
  section: number
  startWeek: number
  endWeek: number
  location: string
}

export interface UpdateScheduleInput {
  courseId: number
  classId: number
  weekday: number
  section: number
  startWeek: number
  endWeek: number
  location: string
}

export interface TeacherPage {
  pageNum: number
  pageSize: number
  total: number
  pages: number
  list: CollegeTeacher[]
}

export interface CollegeCourse {
  id?: number
  courseId?: number
  courseCode?: string
  courseName?: string
  name?: string
  credit?: number
  hours?: number
  assessType?: string
  teacherId?: number
  courseType?: number
  status?: number
}

export interface SelectionBatch {
  id?: number
  batchId?: number
  batchName?: string
  startTime?: string
  endTime?: string
  status?: number
}

export interface CollegeSemester {
  semesterId: number
  semester: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parseCollection<T>(
  value: unknown,
  entityName: string,
): T[] {
  if (!Array.isArray(value) || !value.every(isRecord)) {
    throw new Error(`服务器返回的${entityName}数据格式无效`)
  }
  return value as T[]
}

function parseCollegeStudent(value: unknown): CollegeStudent {
  if (!isRecord(value)) {
    throw new Error('学生记录格式无效')
  }

  const studentNo =
    typeof value.studentNo === 'string' || typeof value.studentNo === 'number'
      ? String(value.studentNo)
      : null
  const phoneValue = value.phone
  const phone =
    typeof phoneValue === 'string' || typeof phoneValue === 'number'
      ? String(phoneValue)
      : ''
  const gender = parseInteger(value.gender)
  const birth =
    typeof value.birth === 'string' ? value.birth : null
  const className =
    typeof value.className === 'string' ? value.className : null
  const enrollmentYear = parseClassYear(value.enrollmentYear)
  const studyDuration = parseInteger(value.studyDuration)

  return {
    studentId: parseInteger(value.studentId),
    studentNo: studentNo?.trim() || '—',
    studentName:
      typeof value.studentName === 'string' && value.studentName.trim()
        ? value.studentName
        : '—',
    phone,
    gender,
    birth,
    className,
    enrollmentYear,
    graduationYear: parseClassYear(value.graduationYear),
    studyDuration,
  }
}

function parseStudentPage(value: unknown): StudentPage {
  if (
    !isRecord(value) ||
    typeof value.pageNum !== 'number' ||
    typeof value.pageSize !== 'number' ||
    typeof value.size !== 'number' ||
    typeof value.total !== 'number' ||
    typeof value.pages !== 'number' ||
    !Array.isArray(value.list)
  ) {
    throw new Error('服务器返回的学生分页数据格式无效')
  }

  const list: CollegeStudent[] = []
  for (const item of value.list) {
    try {
      list.push(parseCollegeStudent(item))
    } catch (error) {
      const detail =
        error instanceof Error ? error.message : '学生字段格式无效'
      throw new Error(`服务器返回的${detail}`, { cause: error })
    }
  }

  return {
    pageNum: value.pageNum,
    pageSize: value.pageSize,
    size: value.size,
    total: value.total,
    pages: value.pages,
    list,
  }
}

async function request<T>(
  token: string,
  method: 'get' | 'post' | 'put' | 'delete',
  path: string,
  body?: unknown,
): Promise<T> {
  try {
    const response = await apiClient.request<unknown>({
      method,
      url: path,
      data: body,
      headers: {
        Authorization: token,
      },
    })
    const payload = response.data

    if (!isRecord(payload) || payload.success !== true) {
      throw new Error(
        isRecord(payload) && typeof payload.message === 'string'
          ? payload.message
          : '服务器返回了无效响应',
      )
    }

    return payload.data as T
  } catch (error) {
    if (error instanceof Error && !axios.isAxiosError(error)) {
      throw error
    }
    if (axios.isAxiosError(error)) {
      const responseData = error.response?.data
      const serverMessage =
        isRecord(responseData) && typeof responseData.message === 'string'
          ? responseData.message
          : undefined

      if (serverMessage?.trim()) {
        throw new Error(serverMessage, { cause: error })
      }
      if (error.response?.status === 401) {
        throw new Error('登录状态已失效，请重新登录', { cause: error })
      }
      if (error.response?.status === 403) {
        throw new Error('当前账号没有执行此操作的权限', { cause: error })
      }
      if (error.response?.status === 409) {
        throw new Error('数据冲突，请检查编号、手机号、身份证号或课程码', {
          cause: error,
        })
      }
      if (error.response) {
        throw new Error(`请求失败（HTTP ${error.response.status}）`, {
          cause: error,
        })
      }
      throw new Error('无法连接服务器，请检查网络或确认后端服务已启动', {
        cause: error,
      })
    }
    throw new Error('请求失败，请稍后重试', { cause: error })
  }
}

export async function registerTeachers(
  token: string,
  teachers: BatchPersonInput[],
): Promise<void> {
  await request<null>(token, 'post', '/api/v1/college-admin/teachers/batch', {
    teachers,
  })
}

export async function registerStudents(
  token: string,
  students: StudentRegistrationInput[],
): Promise<void> {
  await request<null>(token, 'post', '/api/v1/college-admin/students/batch', {
    students,
  })
}

export async function getStudents(
  token: string,
  pageNum = 1,
  pageSize = 10,
): Promise<StudentPage> {
  const data = await request<unknown>(
    token,
    'get',
    `/api/v1/college-admin/students?pageNum=${pageNum}&pageSize=${pageSize}`,
  )
  return parseStudentPage(data)
}

export async function updateStudent(
  token: string,
  studentId: number,
  payload: {
    name: string
    phone: string
    gender: number | null
    birth: string | null
    enrollmentYear: number
    graduationYear: number
    studyDuration: number
  },
): Promise<void> {
  await request<null>(
    token,
    'put',
    `/api/v1/college-admin/students/${studentId}`,
    payload,
  )
}

export async function deactivateStudent(
  token: string,
  studentId: number,
): Promise<void> {
  await request<null>(
    token,
    'delete',
    `/api/v1/college-admin/students/${studentId}`,
  )
}

export async function updateTeacher(
  token: string,
  teacherId: number,
  payload: { name: string; phone: string },
): Promise<void> {
  await request<null>(
    token,
    'put',
    `/api/v1/college-admin/teachers/${teacherId}`,
    payload,
  )
}

export async function deactivateTeacher(
  token: string,
  teacherId: number,
): Promise<void> {
  await request<null>(
    token,
    'delete',
    `/api/v1/college-admin/teachers/${teacherId}`,
  )
}

export async function getUnassignedStudents(
  token: string,
): Promise<UnassignedStudent[]> {
  const data = await request<unknown>(
    token,
    'get',
    '/api/v1/college-admin/students/unassigned-class',
  )
  if (
    !Array.isArray(data) ||
    !data.every(
      (item) =>
        isRecord(item) &&
        typeof item.studentId === 'number' &&
        typeof item.studentNo === 'string' &&
        typeof item.studentName === 'string',
    )
  ) {
    throw new Error('服务器返回的未分配班级学生数据格式无效')
  }
  return data
}

export async function createClass(
  token: string,
  payload: {
    className: string
    grade: string
    enrollmentYear: number
    graduationYear: number
    status: number
  },
): Promise<void> {
  await request<null>(token, 'post', '/api/v1/college-admin/classes', payload)
}

export async function updateClass(
  token: string,
  classId: number,
  payload: {
    className: string
    grade: string
    enrollmentYear: number
    graduationYear: number
    status: number
  },
): Promise<void> {
  await request<null>(
    token,
    'put',
    `/api/v1/college-admin/classes/${classId}`,
    payload,
  )
}

export async function createAnnouncement(
  token: string,
  payload: { title: string; content: string; status: 0 | 1 },
): Promise<void> {
  await request<null>(
    token,
    'post',
    '/api/v1/college-admin/announcements',
    payload,
  )
}

export async function updateAnnouncement(
  token: string,
  announcementId: number,
  payload: { title: string; content: string; status: 0 | 1 },
): Promise<void> {
  await request<null>(
    token,
    'put',
    `/api/v1/college-admin/announcements/${announcementId}`,
    payload,
  )
}

export async function deleteAnnouncement(
  token: string,
  announcementId: number,
): Promise<void> {
  await request<null>(
    token,
    'delete',
    `/api/v1/college-admin/announcements/${announcementId}`,
  )
}

function parseTeacherPage(value: unknown): TeacherPage {
  if (!isRecord(value) || !Array.isArray(value.list)) {
    throw new Error('服务器返回的教师分页数据格式无效')
  }

  const pageNum = parseInteger(value.pageNum)
  const pageSize = parseInteger(value.pageSize)
  const total = parseInteger(value.total)
  const pages = parseInteger(value.pages)
  if (
    pageNum === null ||
    pageSize === null ||
    total === null ||
    pages === null
  ) {
    throw new Error('服务器返回的教师分页信息格式无效')
  }

  const list: CollegeTeacher[] = value.list.map((item, index) => {
    if (!isRecord(item)) {
      throw new Error(`服务器返回的第 ${index + 1} 条教师数据格式无效`)
    }

    const teacherId = parseInteger(item.teacherId)
    if (teacherId === null) {
      throw new Error(`第 ${index + 1} 条教师数据缺少有效的 teacherId`)
    }

    const teacherNo =
      typeof item.teacherNo === 'string' || typeof item.teacherNo === 'number'
        ? String(item.teacherNo)
        : ''
    if (!teacherNo.trim()) {
      throw new Error(`第 ${index + 1} 条教师数据缺少有效的 teacherNo`)
    }

    if (
      typeof item.teacherName !== 'string' ||
      !item.teacherName.trim()
    ) {
      throw new Error(`教师号 ${teacherNo} 对应的姓名无效`)
    }

    const phone =
      typeof item.phone === 'string' || typeof item.phone === 'number'
        ? String(item.phone)
        : ''

    return {
      teacherId,
      teacherNo,
      teacherName: item.teacherName,
      phone,
    }
  })

  return { pageNum, pageSize, total, pages, list }
}

export async function getTeachers(token: string): Promise<CollegeTeacher[]> {
  async function getTeacherPage(pageNum: number) {
    const data = await request<unknown>(
      token,
      'get',
      `/api/v1/college-admin/teachers?pageNum=${pageNum}&pageSize=100`,
    )
    return parseTeacherPage(data)
  }

  const firstPage = await getTeacherPage(1)
  const teachers = [...firstPage.list]
  for (let pageNum = 2; pageNum <= firstPage.pages; pageNum += 1) {
    const page = await getTeacherPage(pageNum)
    teachers.push(...page.list)
  }
  return teachers
}

export async function getClasses(token: string): Promise<CollegeClass[]> {
  const data = await request<unknown>(
    token,
    'get',
    '/api/v1/college-admin/classes',
  )
  if (!Array.isArray(data)) {
    throw new Error('服务器返回的班级数据格式无效：data 应为数组')
  }

  const classes: CollegeClass[] = []
  for (const [index, item] of data.entries()) {
    const itemLabel = `第 ${index + 1} 条班级数据`
    if (!isRecord(item)) {
      throw new Error(`服务器返回的${itemLabel}格式无效`)
    }

    const classId = parseInteger(item.classId)
    if (classId === null) {
      throw new Error(`服务器返回的${itemLabel} classId 无效`)
    }
    if (typeof item.className !== 'string') {
      throw new Error(`服务器返回的${itemLabel} className 无效`)
    }

    const grade =
      typeof item.grade === 'string' || typeof item.grade === 'number'
        ? String(item.grade)
        : item.grade === null || item.grade === undefined
          ? ''
          : null
    if (grade === null) {
      throw new Error(`服务器返回的${itemLabel} grade 无效`)
    }

    const studentCount = parseInteger(item.studentCount)
    if (studentCount === null) {
      throw new Error(`服务器返回的${itemLabel} studentCount 无效`)
    }

    const status = parseInteger(item.status)
    if (status === null) {
      throw new Error(`服务器返回的${itemLabel} status 无效`)
    }

    const enrollmentYear = parseClassYear(item.enrollmentYear)
    if (enrollmentYear === null) {
      throw new Error(`服务器返回的${itemLabel} enrollmentYear 无效`)
    }
    const graduationYear = parseClassYear(item.graduationYear)
    if (graduationYear === null) {
      throw new Error(`服务器返回的${itemLabel} graduationYear 无效`)
    }

    classes.push({
      classId,
      className: item.className,
      grade,
      studentCount,
      enrollmentYear,
      graduationYear,
      status,
    })
  }
  return classes
}

export async function getScheduleSemesters(token: string): Promise<string[]> {
  const data = await request<unknown>(
    token,
    'get',
    '/api/v1/common/semesters',
  )
  if (!Array.isArray(data) || !data.every((semester) => typeof semester === 'string')) {
    throw new Error('服务器返回的排课学期数据格式无效')
  }
  return data
}

export async function getCollegeSemesters(
  token: string,
): Promise<CollegeSemester[]> {
  const data = await request<unknown>(
    token,
    'get',
    '/api/v1/college-admin/semesters',
  )
  if (
    !Array.isArray(data) ||
    !data.every(
      (item) =>
        isRecord(item) &&
        typeof item.semesterId === 'number' &&
        typeof item.semester === 'string',
    )
  ) {
    throw new Error('服务器返回的学期数据格式无效')
  }
  return data
}

export async function saveSemester(
  token: string,
  semester: string,
  semesterId?: number,
): Promise<void> {
  if (semesterId === undefined) {
    await request<null>(
      token,
      'post',
      '/api/v1/college-admin/semesters',
      { semester },
    )
    return
  }
  await request<null>(
    token,
    'put',
    `/api/v1/college-admin/semesters/${semesterId}`,
    { semester },
  )
}

export async function deleteSemester(
  token: string,
  semesterId: number,
): Promise<void> {
  await request<null>(
    token,
    'delete',
    `/api/v1/college-admin/semesters/${semesterId}`,
  )
}

function parseCourseSchedules(value: unknown): CourseSchedule[] {
  if (!Array.isArray(value) || !value.every(isRecord)) {
    throw new Error('服务器返回的课表数据格式无效')
  }

  return value.map((item, index) => {
    const scheduleId = parseInteger(item.scheduleId)
    const courseId = parseInteger(item.courseId)
    const classId = parseInteger(item.classId)
    const teacherId = parseInteger(item.teacherId)
    const weekday = parseInteger(item.weekday)
    const startWeek = parseInteger(item.startWeek)
    const endWeek = parseInteger(item.endWeek)
    const sectionRange =
      typeof item.section === 'string'
        ? item.section.match(/^\s*(\d+)\s*[-~至]\s*(\d+)\s*$/)
        : null
    const section = parseInteger(item.section)
    const startSection =
      parseInteger(item.startSection) ??
      (sectionRange ? Number(sectionRange[1]) : section)
    const endSection =
      parseInteger(item.endSection) ??
      (sectionRange ? Number(sectionRange[2]) : section)

    if (
      scheduleId === null ||
      courseId === null ||
      classId === null ||
      teacherId === null ||
      weekday === null ||
      weekday < 1 ||
      weekday > 7 ||
      startSection === null ||
      endSection === null ||
      startSection < 1 ||
      endSection > 12 ||
      endSection < startSection ||
      startWeek === null ||
      endWeek === null ||
      typeof item.semester !== 'string' ||
      typeof item.courseName !== 'string'
    ) {
      throw new Error(`服务器返回的第 ${index + 1} 条课表记录字段无效`)
    }

    return {
      scheduleId,
      courseId,
      courseCode:
        typeof item.courseCode === 'string' ? item.courseCode : '',
      courseName: item.courseName,
      classId,
      teacherId,
      teacherName:
        typeof item.teacherName === 'string' ? item.teacherName : undefined,
      semester: item.semester,
      weekday,
      startSection,
      endSection,
      startWeek,
      endWeek,
      location: typeof item.location === 'string' ? item.location : '',
    }
  })
}

export async function getCollegeClassSchedule(
  token: string,
  classId: number,
  semester: string,
): Promise<CourseSchedule[]> {
  const data = await request<unknown>(
    token,
    'get',
    `/api/v1/college-admin/schedule/class?classId=${classId}&semester=${encodeURIComponent(semester)}`,
  )
  return parseCourseSchedules(data)
}

export async function getTeacherSchedule(
  token: string,
  teacherId: number,
  semester: string,
): Promise<CourseSchedule[]> {
  const data = await request<unknown>(
    token,
    'get',
    `/api/v1/teacher/schedule/teacher?teacherId=${teacherId}&semester=${encodeURIComponent(semester)}`,
  )
  return parseCourseSchedules(data)
}

export async function createSchedule(
  token: string,
  payload: CreateScheduleInput,
): Promise<void> {
  await request<null>(
    token,
    'post',
    '/api/v1/college-admin/schedules',
    payload,
  )
}

export async function updateSchedule(
  token: string,
  scheduleId: number,
  payload: UpdateScheduleInput,
): Promise<void> {
  await request<null>(
    token,
    'put',
    `/api/v1/college-admin/schedules/${scheduleId}`,
    payload,
  )
}

export async function deleteSchedule(
  token: string,
  scheduleId: number,
): Promise<void> {
  await request<null>(
    token,
    'delete',
    `/api/v1/college-admin/schedules/${scheduleId}`,
  )
}

function parseInteger(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value)) return value
  if (typeof value !== 'string' || !/^-?\d+$/.test(value.trim())) return null

  const parsed = Number(value)
  return Number.isSafeInteger(parsed) ? parsed : null
}

function parseClassYear(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value)) return value
  if (typeof value !== 'string') return parseInteger(value)

  const match = /^(\d{4})(?:$|[-/T ])/.exec(value)
  return match ? Number(match[1]) : null
}

export async function assignStudentsToClass(
  token: string,
  studentIds: number[],
  classId: number,
): Promise<void> {
  await request<null>(
    token,
    'put',
    '/api/v1/college-admin/students/class',
    { classId, studentIds },
  )
}

export async function getCourses(token: string): Promise<CollegeCourse[]> {
  const data = await request<unknown>(
    token,
    'get',
    '/api/v1/college-admin/courses',
  )
  const courses = parseCollection<CollegeCourse>(data, '课程')
  return courses.map((course) => ({
    ...course,
    name: course.name ?? course.courseName,
  }))
}

export async function saveCourse(
  token: string,
  payload: Omit<CollegeCourse, 'id' | 'courseId'>,
  courseId?: number,
): Promise<void> {
  if (courseId === undefined) {
    await request<null>(token, 'post', '/api/v1/college-admin/courses', payload)
    return
  }
  await request<null>(
    token,
    'put',
    `/api/v1/college-admin/courses/${courseId}`,
    payload,
  )
}

export async function deleteCourse(
  token: string,
  courseId: number,
): Promise<void> {
  await request<null>(
    token,
    'delete',
    `/api/v1/college-admin/courses/${courseId}`,
  )
}

export async function getSelectionBatches(
  token: string,
): Promise<SelectionBatch[]> {
  const data = await request<unknown>(
    token,
    'get',
    '/api/v1/college-admin/selection-batches',
  )
  return parseCollection<SelectionBatch>(data, '选课批次')
}

export async function saveSelectionBatch(
  token: string,
  payload: Omit<SelectionBatch, 'id' | 'batchId'>,
  batchId?: number,
): Promise<void> {
  if (batchId === undefined) {
    await request<null>(
      token,
      'post',
      '/api/v1/college-admin/selection-batches',
      payload,
    )
    return
  }
  await request<null>(
    token,
    'put',
    `/api/v1/college-admin/selection-batches/${batchId}`,
    payload,
  )
}

export async function deleteSelectionBatch(
  token: string,
  batchId: number,
): Promise<void> {
  await request<null>(
    token,
    'delete',
    `/api/v1/college-admin/selection-batches/${batchId}`,
  )
}
