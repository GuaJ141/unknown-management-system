import { Link } from 'react-router-dom'
import LoginForm from '../../components/auth/LoginForm'

function AdminLoginPage() {
  return (
    <main className="login-page admin-page">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <header className="site-header">
        <a className="brand" href="/" aria-label="课程教学管理平台">
          <span className="brand-mark admin-brand-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="none">
              <path d="M4 10.5 16 4l12 6.5L16 17 4 10.5Z" />
              <path d="M8 13v7.5c4.5 4 11.5 4 16 0V13M28 11v9" />
            </svg>
          </span>
          <span className="brand-name">知行<span>·</span>教务</span>
        </a>
        <span className="header-caption">课程教学管理平台</span>
      </header>

      <section className="login-layout admin-layout">
        <div className="welcome-panel">
          <div className="welcome-kicker">
            <span className="kicker-line" />
            ACADEMIC ADMINISTRATION
          </div>
          <h1>让每一份教务，<br />尽在掌握。</h1>
          <p className="welcome-copy">
            用清晰、高效的管理方式，支持学院教学工作的每一步。
          </p>

          <div className="admin-illustration" aria-hidden="true">
            <div className="admin-orbit orbit-one" />
            <div className="admin-orbit orbit-two" />
            <div className="admin-illustration-card">
              <div className="illustration-header">
                <span /><span /><span />
              </div>
              <div className="illustration-content">
                <div className="illustration-sidebar">
                  <i /><i /><i /><i />
                </div>
                <div className="illustration-main">
                  <div className="illustration-title" />
                  <div className="illustration-metrics">
                    <i /><i /><i />
                  </div>
                  <div className="illustration-chart">
                    <span /><span /><span /><span /><span /><span /><span />
                  </div>
                </div>
              </div>
            </div>
            <span className="floating-star star-one">✦</span>
            <span className="floating-star star-two">✧</span>
          </div>
          <div className="welcome-footer">
            <span className="footer-dot" />
            <span>以专业管理，成就更好教学</span>
            <span className="footer-stars" aria-hidden="true">✦ ✧</span>
          </div>
        </div>

        <section className="login-card admin-card" aria-labelledby="login-title">
          <div className="card-topline">
            <span className="card-eyebrow">ADMIN PORTAL</span>
            <span className="secure-label">
              <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <rect x="3" y="7" width="10" height="7" rx="2" />
                <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
              </svg>
              安全登录
            </span>
          </div>
          <h2 id="login-title">管理入口</h2>
          <p className="card-description">登录学院管理账号，开启教务工作</p>

          <div className="login-type admin-login-type">
            <span className="login-type-icon" aria-hidden="true">◆</span>
            <span>学院管理员</span>
            <span className="type-indicator" />
          </div>

          <LoginForm
            allowedRoles={[3]}
            accountLabel="管理员账号 / 手机号"
            accountPlaceholder="请输入管理员账号或手机号"
            destination={() => '/admin'}
          />

          <p className="admin-link">
            返回学生 / 教师登录？ <Link to="/login">前往普通用户登录 <span>→</span></Link>
          </p>
          <div className="card-footnote">
            <span aria-hidden="true">◈</span>
            仅限已开通的学院管理员账号使用
          </div>
        </section>
      </section>

      <footer className="page-footer">
        <span>© 2026 知行教务 · 课程教学管理平台</span>
        <span className="footer-separator">•</span>
        <span>让每一次学习，都有迹可循</span>
      </footer>
    </main>
  )
}

export default AdminLoginPage
