import axios from 'axios'
import { apiClient } from './client'

export type UserRole = 1 | 2 | 3

export interface AuthSession {
  token: string
  userId: number
  login_no?: string
  role: UserRole
  mustChangePassword: boolean
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isAuthSession(value: unknown): value is AuthSession {
  if (!isRecord(value)) return false

  return (
    typeof value.token === 'string' &&
    value.token.length > 0 &&
    typeof value.userId === 'number' &&
    (value.login_no === undefined || typeof value.login_no === 'string') &&
    (value.role === 1 || value.role === 2 || value.role === 3) &&
    typeof value.mustChangePassword === 'boolean'
  )
}

export async function login(
  loginAccount: string,
  password: string,
): Promise<AuthSession> {
  try {
    const response = await apiClient.post<unknown>('/api/v1/user/login', {
      loginAccount,
      password,
    })
    const payload = response.data

    if (!isRecord(payload)) {
      throw new Error('服务器返回了无效的登录数据')
    }

    if (payload.success !== true) {
      throw new Error(
        typeof payload.message === 'string'
          ? payload.message
          : '登录失败，请稍后重试',
      )
    }

    if (!isAuthSession(payload.data)) {
      throw new Error('服务器返回的登录信息不完整，请联系管理员')
    }

    return payload.data
  } catch (error) {
    if (error instanceof Error && !axios.isAxiosError(error)) {
      throw error
    }

    if (axios.isAxiosError(error)) {
      const message = isRecord(error.response?.data)
        ? error.response.data.message
        : undefined

      if (typeof message === 'string' && message.trim()) {
        throw new Error(message, { cause: error })
      }

      if (error.response?.status === 401) {
        throw new Error('账号或密码错误', { cause: error })
      }

      if (error.response) {
        throw new Error(`登录失败（HTTP ${error.response.status}）`, {
          cause: error,
        })
      }

      throw new Error('无法连接服务器，请检查网络或确认后端服务已启动', {
        cause: error,
      })
    }

    throw new Error('登录失败，请稍后重试', { cause: error })
  }
}
