import { useNavigate } from 'react-router-dom'
import type { UserRole } from '../../api/auth'
import { useAuthStore } from '../../store/authStore'

interface PortalPageProps {
  role: UserRole
}

const roleDetails: Record<
  UserRole,
  { title: string; description: string; roleLabel: string; loginNoLabel: string }
> = {
  1: {
    title: '学生工作台',
    description: '选课、课表、成绩与班级信息将在这里为你呈现。',
    roleLabel: '学生',
    loginNoLabel: '学号',
  },
  2: {
    title: '教师工作台',
    description: '班级学生、课程安排与成绩录入将在这里为你呈现。',
    roleLabel: '教师',
    loginNoLabel: '教师号',
  },
  3: {
    title: '学院管理工作台',
    description: '账号、班级与课程管理将在这里为你呈现。',
    roleLabel: '学院管理员',
    loginNoLabel: '管理员号',
  },
}

function PortalPage({ role }: PortalPageProps) {
  const session = useAuthStore((state) => state.session)
  const signOut = useAuthStore((state) => state.signOut)
  const navigate = useNavigate()
  const details = roleDetails[role]

  function handleSignOut() {
    signOut()
    navigate(role === 3 ? '/admin/login' : '/login', { replace: true })
  }

  return (
    <main className="portal-page">
      <header className="portal-header">
        <a className="brand" href="/" aria-label="课程教学管理平台">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="none">
              <path d="M4 10.5 16 4l12 6.5L16 17 4 10.5Z" />
              <path d="M8 13v7.5c4.5 4 11.5 4 16 0V13M28 11v9" />
            </svg>
          </span>
          <span className="brand-name">知行<span>·</span>教务</span>
        </a>
        <div className="portal-user">
          <span>
            <strong>{details.roleLabel}</strong>
            <small>{details.loginNoLabel}：{session?.login_no ?? '—'}</small>
          </span>
          <button className="sign-out-button" onClick={handleSignOut}>
            退出登录
          </button>
        </div>
      </header>
      <section className="portal-content">
        <div className="portal-icon" aria-hidden="true">✦</div>
        <p className="portal-eyebrow">登录成功</p>
        <h1>{details.title}</h1>
        <p className="portal-description">{details.description}</p>
        <div className="portal-status">
          <span className="status-dot" />
          身份验证成功
        </div>
        {role !== 3 && session?.mustChangePassword && (
          <p className="password-notice" role="status">
            <strong>首次登录提醒</strong>
            请尽快修改初始密码。当前 API 文档未提供密码修改接口。
          </p>
        )}
      </section>
    </main>
  )
}

export default PortalPage
