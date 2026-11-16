import { useState, type FormEvent } from 'react'
import { trim } from 'lodash'
import { useNavigate } from 'react-router-dom'
import { login, type UserRole } from '../../api/auth'
import { useAuthStore } from '../../store/authStore'

interface LoginFormProps {
  allowedRoles: UserRole[]
  accountLabel: string
  accountPlaceholder: string
  destination: (role: UserRole) => string
}

const roleNames: Record<UserRole, string> = {
  1: '学生',
  2: '教师',
  3: '学院管理员',
}

function LoginForm({
  allowedRoles,
  accountLabel,
  accountPlaceholder,
  destination,
}: LoginFormProps) {
  const [loginAccount, setLoginAccount] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const signIn = useAuthStore((state) => state.signIn)
  const navigate = useNavigate()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting) return

    const account = trim(loginAccount)
    if (!account || !trim(password)) {
      setError('请输入账号和密码')
      return
    }

    if (account.length > 30 || password.length > 64) {
      setError('账号最多 30 个字符，密码最多 64 个字符')
      return
    }

    setError('')
    setIsSubmitting(true)
    try {
      const session = await login(account, password)
      if (!allowedRoles.includes(session.role)) {
        setError(`当前入口不支持${roleNames[session.role]}账号，请选择对应入口`)
        return
      }

      signIn(session)
      navigate(destination(session.role), { replace: true })
    } catch (loginError) {
      setError(
        loginError instanceof Error ? loginError.message : '登录失败，请稍后重试',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="login-form" onSubmit={handleSubmit} noValidate>
      <label className="field-label" htmlFor="login-account">
        {accountLabel}
      </label>
      <div className="input-wrap">
        <span className="input-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="3.5" />
            <path d="M5 20c.5-3.4 3.2-5.5 7-5.5s6.5 2.1 7 5.5" />
          </svg>
        </span>
        <input
          id="login-account"
          name="loginAccount"
          type="text"
          autoComplete="username"
          maxLength={30}
          placeholder={accountPlaceholder}
          value={loginAccount}
          onChange={(event) => setLoginAccount(event.target.value)}
          aria-describedby={error ? 'login-error' : undefined}
        />
      </div>

      <div className="password-label-row">
        <label className="field-label" htmlFor="login-password">
          登录密码
        </label>
      </div>
      <div className="input-wrap">
        <span className="input-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <rect x="5" y="10" width="14" height="10" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v2" />
          </svg>
        </span>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          maxLength={64}
          placeholder="请输入密码"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-describedby={error ? 'login-error' : undefined}
        />
      </div>

      {error && (
        <p className="form-error" id="login-error" role="alert">
          <span aria-hidden="true">!</span>
          {error}
        </p>
      )}

      <button className="submit-button" type="submit" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <span className="button-spinner" aria-hidden="true" />
            正在登录
          </>
        ) : (
          <>
            登录进入
            <span aria-hidden="true">→</span>
          </>
        )}
      </button>
    </form>
  )
}

export default LoginForm
