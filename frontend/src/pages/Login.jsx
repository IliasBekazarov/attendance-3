import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import logo from '../imgs/logo.png'

const Login = () => {
  const { login } = useAuth()
  const { t } = useLanguage()
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await login(formData.username, formData.password)
    
    if (!result.success) {
      setError(result.error)
    }
    
    setLoading(false)
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="login-container">
      <div className="login-left">
        <div className="login-brand">
          <div className="bran-icon">
            <i className="logo-icon">
                <img src={logo} alt="Attendance System Logo" />
            </i>
          </div>
          <h1>Attendance System</h1>
          <p className="brand-tagline">Smart way to track student attendance</p>
        </div>
        
        <div className="login-features">
          <div className="feature-item">
            <i className="fas fa-check-circle"></i>
            <span>Real-time Tracking</span>
          </div>
          <div className="feature-item">
            <i className="fas fa-chart-line"></i>
            <span>Detailed Reports</span>
          </div>
          <div className="feature-item">
            <i className="fas fa-bell"></i>
            <span>Instant Notifications</span>
          </div>
        </div>
      </div>

      <div className="login-right">
        <div className="login-card">
          <div className="login-header">
            <h2>{t('welcomeBack')}</h2>
            <p>{t('signInToAccount')}</p>
          </div>

          {error && (
            <div className="alert alert-error">
              <i className="fas fa-exclamation-circle"></i>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="username">
                <i className="fas fa-user"></i>
                {t('username')}
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                disabled={loading}
                placeholder={t('username')}
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">
                <i className="fas fa-lock"></i>
                {t('password')}
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  placeholder={t('password')}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                >
                  <i className={`fas fa-eye${showPassword ? '-slash' : ''}`}></i>
                </button>
              </div>
            </div>

            {/* <div className="form-options">
              <label className="checkbox-label">
                <input type="checkbox" />
                <span>{t('rememberMe')}</span>
              </label>
              <a href="#" className="forgot-link">{t('forgotPassword')}</a>
            </div> */}

            <button 
              type="submit" 
              className="login-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  <span>{t('signingIn')}</span>
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt"></i>
                  <span>{t('signIn')}</span>
                </>
              )}
            </button>
          </form>

          <div className="login-footer">
            <p>© 2024 Attendance System. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
