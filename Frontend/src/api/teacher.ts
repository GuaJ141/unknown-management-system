import axios from 'axios'
import { apiClient } from './client'

export interface TeacherScheduleEntry {
  scheduleId: number
  courseId: number
  courseCode: string
  courseName: string
  classId: number
  teacherId: number
  teacherName: string
  semester: string
  weekday: number
  startSection: number
  endSection: number
  startWeek: number
  endWeek: number
  location: string
}

export interface TeacherStudent {
  studentId: number
  studentNo: string
  studentName: string
  classId: number | null
  className: string | null
  grade: string | null
  enrollmentYear: number | null
  graduationYear: number | null
  classStatus: number | null
}

export interface TeacherCourse {
  courseId: number
  courseCode: string
  courseName: string
  teacherId: number
}

export interface TeacherCourseScore {
  studentId: number
  studentNo: string
  studentName: string
  classId: number
  className: string
  courseId: number
  courseCode: string
  courseName: string
  teacherId: number
  teacherName: string
  score: number | null
  gradePoint: number | null
  scoreUpdatedAt: string | null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseInteger(value: unknown): number | null {
  if (typeof value === 'number' && Number.isSafeInteger(value)) return value
  if (typeof value !== 'string' || !/^-?\d+$/.test(value.trim())) return null
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) ? parsed : null
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
      headers: { Authorization: token },
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
    if (error instanceof Error && !axios.isAxiosError(error)) throw error
    if (axios.isAxiosError(error)) {
      const responseData = error.response?.data
      const serverMessage =
        isRecord(responseData) && typeof responseData.message === 'string'
          ? responseData.message
          : undefined
      if (serverMessage?.trim()) throw new Error(serverMessage, { cause: error })
      if (error.response?.status === 401) {
        throw new Error('登录状态已失效，请重新登录', { cause: error })
      }
      if (error.response?.status === 403) {
        throw new Error('当前账号没有执行此操作的权限', { cause: error })
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

function parseSchedule(value: unknown): TeacherScheduleEntry[] {
  if (!Array.isArray(value) || !value.every(isRecord)) {
    throw new Error('服务器返回的教师课表数据格式无效')
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
      startSection < 1 ||
      startSection > 12 ||
      endSection === null ||
      endSection > 12 ||
      endSection < startSection ||
      startWeek === null ||
      startWeek < 1 ||
      endWeek === null ||
      endWeek < startWeek ||
      typeof item.semester !== 'string' ||
      typeof item.courseName !== 'string'
    ) {
      throw new Error(`服务器返回的第 ${index + 1} 条教师课表字段无效`)
    }
    return {
      scheduleId,
      courseId,
      courseCode: typeof item.courseCode === 'string' ? item.courseCode : '',
      courseName: item.courseName,
      classId,
      teacherId,
      teacherName: typeof item.teacherName === 'string' ? item.teacherName : '',
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

function nullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'string') return value
  throw new Error('服务器返回的教师学生信息字段格式无效')
}

function nullableInteger(value: unknown): number | null {
  if (value === null || value === undefined) return null
  const parsed = parseInteger(value)
  if (parsed === null) throw new Error('服务器返回的教师学生信息字段格式无效')
  return parsed
}

function parseStudents(value: unknown): TeacherStudent[] {
  if (!Array.isArray(value) || !value.every(isRecord)) {
    throw new Error('服务器返回的授课学生数据格式无效')
  }
  return value.map((item, index) => {
    const studentId = parseInteger(item.studentId)
    if (
      studentId === null ||
      typeof item.studentNo !== 'string' ||
      typeof item.studentName !== 'string'
    ) {
      throw new Error(`服务器返回的第 ${index + 1} 条学生信息字段无效`)
    }
    return {
      studentId,
      studentNo: item.studentNo,
      studentName: item.studentName,
      classId: nullableInteger(item.classId),
      className: nullableString(item.className),
      grade: nullableString(item.grade),
      enrollmentYear: nullableInteger(item.enrollmentYear),
      graduationYear: nullableInteger(item.graduationYear),
      classStatus: nullableInteger(item.classStatus),
    }
  })
}

function parseCourses(value: unknown): TeacherCourse[] {
  if (!Array.isArray(value) || !value.every(isRecord)) {
    throw new Error('服务器返回的教师课程数据格式无效')
  }
  return value.map((item, index) => {
    const courseId = parseInteger(item.courseId)
    const teacherId = parseInteger(item.teacherId)
    if (
      courseId === null ||
      teacherId === null ||
      typeof item.courseName !== 'string'
    ) {
      throw new Error(`服务器返回的第 ${index + 1} 条教师课程字段无效`)
    }
    return {
      courseId,
      courseCode: typeof item.courseCode === 'string' ? item.courseCode : '',
      courseName: item.courseName,
      teacherId,
    }
  })
}

function nullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null
  if (
    (typeof value !== 'number' && typeof value !== 'string') ||
    (typeof value === 'string' && !value.trim())
  ) {
    throw new Error('服务器返回的成绩或绩点字段格式无效')
  }
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    throw new Error('服务器返回的成绩或绩点字段格式无效')
  }
  return parsed
}

function parseCourseScores(value: unknown): TeacherCourseScore[] {
  if (!Array.isArray(value) || !value.every(isRecord)) {
    throw new Error('服务器返回的成绩列表数据格式无效')
  }
  return value.map((item, index) => {
    const studentId = parseInteger(item.studentId)
    const classId = parseInteger(item.classId)
    const courseId = parseInteger(item.courseId)
    const teacherId = parseInteger(item.teacherId)
    if (
      studentId === null ||
      classId === null ||
      courseId === null ||
      teacherId === null ||
      typeof item.studentNo !== 'string' ||
      typeof item.studentName !== 'string' ||
      typeof item.className !== 'string' ||
      typeof item.courseName !== 'string'
    ) {
      throw new Error(`服务器返回的第 ${index + 1} 条成绩记录字段无效`)
    }
    return {
      studentId,
      studentNo: item.studentNo,
      studentName: item.studentName,
      classId,
      className: item.className,
      courseId,
      courseCode: typeof item.courseCode === 'string' ? item.courseCode : '',
      courseName: item.courseName,
      teacherId,
      teacherName: typeof item.teacherName === 'string' ? item.teacherName : '',
      score: nullableNumber(item.score),
      gradePoint: nullableNumber(item.gradePoint),
      scoreUpdatedAt:
        typeof item.scoreUpdatedAt === 'string' ? item.scoreUpdatedAt : null,
    }
  })
}

export async function getTeacherSemesters(token: string): Promise<string[]> {
  const data = await request<unknown>(token, 'get', '/api/v1/common/semesters')
  if (!Array.isArray(data) || !data.every((semester) => typeof semester === 'string')) {
    throw new Error('服务器返回的排课学期数据格式无效')
  }
  return data
}

export async function getTeacherSchedule(
  token: string,
): Promise<TeacherScheduleEntry[]> {
  return parseSchedule(await request<unknown>(token, 'get', '/api/v1/teacher/schedule'))
}

export async function getTeacherScheduleBySemester(
  token: string,
  semester: string,
): Promise<TeacherScheduleEntry[]> {
  const path = `/api/v1/teacher/schedule/teacher?semester=${encodeURIComponent(semester)}`
  return parseSchedule(await request<unknown>(token, 'get', path))
}

export async function getTeacherStudents(
  token: string,
  courseId: number,
): Promise<TeacherStudent[]> {
  return parseStudents(
    await request<unknown>(
      token,
      'get',
      `/api/v1/teacher/classes/students?courseId=${courseId}`,
    ),
  )
}

export async function getTeacherCourses(token: string): Promise<TeacherCourse[]> {
  return parseCourses(await request<unknown>(token, 'get', '/api/v1/teacher/courses'))
}

export async function getTeacherCourseScores(
  token: string,
  classId: number,
  courseId: number,
  teacherId: number,
): Promise<TeacherCourseScore[]> {
  const query = new URLSearchParams({
    classId: String(classId),
    courseId: String(courseId),
    teacherId: String(teacherId),
  })
  return parseCourseScores(
    await request<unknown>(token, 'get', `/api/v1/teacher/scores?${query}`),
  )
}

export async function saveStudentScore(
  token: string,
  courseId: number,
  payload: { studentId: number; score: number },
): Promise<void> {
  await request<unknown>(
    token,
    'post',
    `/api/v1/teacher/courses/${courseId}/scores`,
    payload,
  )
}

export async function updateStudentScore(
  token: string,
  courseId: number,
  payload: { studentId: number; score: number },
): Promise<void> {
  await request<unknown>(
    token,
    'put',
    `/api/v1/teacher/courses/${courseId}/scores`,
    payload,
  )
}

export async function deleteStudentScore(
  token: string,
  courseId: number,
  studentId: number,
): Promise<void> {
  await request<unknown>(
    token,
    'delete',
    `/api/v1/teacher/courses/${courseId}/scores/${studentId}`,
  )
}

export async function updateTeacherPhone(
  token: string,
  payload: { name: string; idCard: string; phone: string },
): Promise<void> {
  await request<unknown>(token, 'put', '/api/v1/teacher/phone', payload)
}

export async function updateTeacherPassword(
  token: string,
  payload: { name: string; idCard: string; newPassword: string },
): Promise<void> {
  await request<unknown>(token, 'put', '/api/v1/teacher/password', payload)
}
