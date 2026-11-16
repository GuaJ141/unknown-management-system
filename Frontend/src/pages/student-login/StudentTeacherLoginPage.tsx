import { Link } from 'react-router-dom'
import LoginForm from '../../components/auth/LoginForm'

function StudentTeacherLoginPage() {
  return (
    <main className="login-page">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <header className="site-header">
        <a className="brand" href="/" aria-label="课程教学管理平台">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="none">
              <path d="M4 10.5 16 4l12 6.5L16 17 4 10.5Z" />
              <path d="M8 13v7.5c4.5 4 11.5 4 16 0V13M28 11v9" />
            </svg>
          </span>
          <span className="brand-name">知行<span>·</span>教务</span>
        </a>
        <span className="header-caption">课程教学管理平台</span>
      </header>

      <section className="login-layout">
        <div className="welcome-panel">
          <div className="welcome-kicker">
            <span className="kicker-line" />
            TEACHING & LEARNING
          </div>
          <h1>让学习与教学<br />井然有序。</h1>
          <p className="welcome-copy">
            课程、班级与成长记录，一站式连接每一段校园学习旅程。
          </p>

          <div className="campus-art" aria-hidden="true">
            <div className="art-sun" />
            <div className="art-cloud cloud-one" />
            <div className="art-cloud cloud-two" />
            <div className="art-hill hill-back" />
            <div className="art-hill hill-front" />
            <div className="art-building">
              <div className="building-roof" />
              <div className="building-body">
                <span /><span /><span /><span /><span /><span />
              </div>
              <div className="building-door" />
            </div>
            <div className="art-tree tree-one"><i /></div>
            <div className="art-tree tree-two"><i /></div>
            <div className="art-path" />
          </div>
          <div className="welcome-footer">
            <span className="footer-dot" />
            <span>一所校园，每一种可能</span>
            <span className="footer-stars" aria-hidden="true">✦ ✧</span>
          </div>
        </div>

        <section className="login-card" aria-labelledby="login-title">
          <div className="card-topline">
            <span className="card-eyebrow">WELCOME BACK</span>
            <span className="secure-label">
              <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <rect x="3" y="7" width="10" height="7" rx="2" />
                <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
              </svg>
              安全登录
            </span>
          </div>
          <h2 id="login-title">欢迎回来</h2>
          <p className="card-description">登录你的校园账号，继续校园生活</p>

          <div className="login-type">
            <span className="login-type-icon" aria-hidden="true">✦</span>
            <span>学生 / 教师</span>
            <span className="type-indicator" />
          </div>

          <LoginForm
            allowedRoles={[1, 2]}
            accountLabel="学号 / 教师号 / 手机号"
            accountPlaceholder="请输入学号、教师号或手机号"
            destination={(role) => (role === 1 ? '/student' : '/teacher')}
          />

          <p className="admin-link">
            你是学院管理员？ <Link to="/admin/login">前往管理员登录 <span>→</span></Link>
          </p>
          <div className="card-footnote">
            <span aria-hidden="true">◈</span>
            首次登录的学生与教师，请使用初始密码登录
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

export default StudentTeacherLoginPage
