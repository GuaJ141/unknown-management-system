import axios from 'axios'
import { apiClient } from './client'

export type StudentRecord = Record<string, unknown>

export interface StudentScheduleEntry {
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

function isRecord(value: unknown): value is StudentRecord {
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
  method: 'get' | 'post' | 'put',
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

function parseRecords(value: unknown, entityName: string): StudentRecord[] {
  const collection = Array.isArray(value)
    ? value
    : isRecord(value)
      ? value.list ?? value.records ?? value.items ?? value.courses
      : undefined

  if (!Array.isArray(collection) || !collection.every(isRecord)) {
    throw new Error(`服务器返回的${entityName}数据格式无效`)
  }
  return collection
}

export async function getAvailableCourses(token: string) {
  const data = await request<unknown>(
    token,
    'get',
    '/api/v1/student/courses/available',
  )
  return parseRecords(data, '可选课程')
}

export async function selectCourse(token: string, courseId: number) {
  await request<unknown>(
    token,
    'post',
    `/api/v1/student/courses/${courseId}/selection`,
    {},
  )
}

export async function getCourseSelections(token: string) {
  const data = await request<unknown>(
    token,
    'get',
    '/api/v1/student/course-selections',
  )
  return parseRecords(data, '已选课程')
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

function parseStudentSchedule(value: unknown): StudentScheduleEntry[] {
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
      startSection < 1 ||
      endSection === null ||
      endSection > 12 ||
      endSection < startSection ||
      startWeek === null ||
      endWeek === null ||
      endWeek < startWeek ||
      typeof item.semester !== 'string' ||
      typeof item.courseName !== 'string'
    ) {
      throw new Error(`服务器返回的第 ${index + 1} 条课表记录字段无效`)
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

export async function getStudentScheduleBySemester(
  token: string,
  semester: string,
): Promise<StudentScheduleEntry[]> {
  const data = await request<unknown>(
    token,
    'get',
    `/api/v1/student/schedule/class?semester=${encodeURIComponent(semester)}`,
  )
  return parseStudentSchedule(data)
}

export async function getScores(token: string) {
  const data = await request<unknown>(
    token,
    'get',
    '/api/v1/student/scores',
  )
  return parseRecords(data, '成绩')
}

export async function getStudentClass(token: string) {
  const data = await request<unknown>(
    token,
    'get',
    '/api/v1/student/class',
  )
  if (!isRecord(data)) {
    throw new Error('服务器返回的班级信息格式无效')
  }
  return data
}

export async function getAnnouncements(token: string) {
  const data = await request<unknown>(
    token,
    'get',
    '/api/v1/student/announcements',
  )
  return parseRecords(data, '公告')
}

export async function updateStudentPhone(
  token: string,
  payload: { name: string; idCard: string; phone: string },
) {
  await request<unknown>(token, 'put', '/api/v1/student/phone', payload)
}

export async function updateStudentPassword(
  token: string,
  payload: { name: string; idCard: string; newPassword: string },
) {
  await request<unknown>(token, 'put', '/api/v1/student/password', payload)
}
