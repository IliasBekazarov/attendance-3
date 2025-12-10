import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import api from '../services/api'
import Avatar from '../components/Avatar'

const Profile = () => {
  const { user, setUser, logout } = useAuth()
  const { t } = useLanguage()
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: ''
  })
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })
  const [showUsernameModal, setShowUsernameModal] = useState(false)
  const [usernameData, setUsernameData] = useState({
    new_username: '',
    password: ''
  })

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone_number: user.phone_number || '',
        address: user.address || '',
        emergency_contact_name: user.emergency_contact_name || '',
        emergency_contact_phone: user.emergency_contact_phone || ''
      })
      // Учурдагы профиль фотосун preview кылуу
      if (user.profile_photo) {
        setPhotoPreview(user.profile_photo)
      }
    }
  }, [user])

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setPhotoFile(file)
      
      // Фотону preview кылуу
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const data = new FormData()
      Object.keys(formData).forEach(key => {
        data.append(key, formData[key])
      })
      if (photoFile) {
        data.append('profile_photo', photoFile)
      }

      console.log('📤 Sending profile update...')
      const response = await api.patch('/v1/profile/update/', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      console.log('✅ Profile updated:', response.data)
      const updatedUser = response.data
      setUser(updatedUser)
      localStorage.setItem('user', JSON.stringify(updatedUser))
      
      // Preview жана file'ды тазалоо
      setPhotoFile(null)
      if (updatedUser.profile_photo) {
        setPhotoPreview(updatedUser.profile_photo)
      }
      
      setEditing(false)
      alert('✅ Профиль ийгиликтүү жаңыртылды!')
    } catch (error) {
      console.error('❌ Failed to update profile:', error)
      console.error('Error details:', error.response?.data)
      alert('❌ Профилди жаңыртууда ката: ' + (error.response?.data?.detail || error.message))
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      alert('❌ Жаңы пароль туура эмес экенин текшериңиз!')
      return
    }

    if (passwordData.new_password.length < 6) {
      alert('❌ Пароль кеминде 6 символдон турушу керек!')
      return
    }

    setLoading(true)
    try {
      await api.post('/v1/profile/change-password/', {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      })
      
      alert('✅ Пароль ийгиликтүү өзгөртүлдү!')
      setShowPasswordModal(false)
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' })
    } catch (error) {
      console.error('❌ Password change error:', error)
      alert('❌ Паролду өзгөртүүдө ката: ' + (error.response?.data?.error || error.message))
    } finally {
      setLoading(false)
    }
  }

  const handleUsernameChange = async (e) => {
    e.preventDefault()
    
    if (!usernameData.new_username.trim()) {
      alert('❌ Жаңы логинди жазыңыз!')
      return
    }

    if (usernameData.new_username.length < 3) {
      alert('❌ Логин кеминде 3 символдон турушу керек!')
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/v1/profile/change-username/', {
        new_username: usernameData.new_username,
        password: usernameData.password
      })
      
      // User маалыматын жаңылоо
      const updatedUser = { ...user, username: response.data.username }
      setUser(updatedUser)
      localStorage.setItem('user', JSON.stringify(updatedUser))
      
      alert('✅ Логин ийгиликтүү өзгөртүлдү!')
      setShowUsernameModal(false)
      setUsernameData({ new_username: '', password: '' })
    } catch (error) {
      console.error('❌ Username change error:', error)
      alert('❌ Логинди өзгөртүүдө ката: ' + (error.response?.data?.error || error.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="profile-container">
      <div className="card">
        <div className="card-header">
          <h5>
            <i className="fas fa-user"></i>
            Профилим
          </h5>
          <div className="profile-header-actions">
            {/* Мобилдик logout баткычы */}
            <button
              className="btn btn-danger mobile-logout-btn"
              onClick={logout}
              title="Чыгуу"
            >
              <i className="fas fa-sign-out-alt"></i>
              <span>Чыгуу</span>
            </button>
            {!editing && (
              <button
                className="btn btn-primary"
                onClick={() => setEditing(true)}
              >
                <i className="fas fa-edit"></i>
                Өзгөртүү
              </button>
            )}
          </div>
        </div>

        <div className="card-body">
          <div className="profile-header">
            <div className="profile-photo-wrapper">
              <Avatar
                src={photoPreview || user?.profile_photo}
                alt={user?.full_name || user?.username}
                size="xl"
                className="profile-photo-xl"
              />
              {editing && (
                <label className="photo-upload-btn">
                  <i className="fas fa-camera"></i>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    style={{ display: 'none' }}
                  />
                </label>
              )}
              {photoFile && editing && (
                <div className="photo-upload-hint">
                  <small>📸 Жаңы фото тандалды</small>
                </div>
              )}
            </div>

            <div className="profile-info-header">
              <h3>{user?.full_name || user?.username}</h3>
              <p className="text-muted">
                <i className="fas fa-envelope"></i>
                {user?.email}
              </p>
              <span className="badge badge-primary">
                <i className="fas fa-crown"></i>
                {t(user?.role?.toLowerCase())}
              </span>
            </div>
          </div>

          {editing ? (
            <form onSubmit={handleSubmit} className="profile-form">
              <div className="form-row">
                <div className="form-group">
                  <label>
                    <i className="fas fa-user"></i>
                    Аты
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    className="form-control"
                    value={formData.first_name}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>
                    <i className="fas fa-user"></i>
                    Фамилиясы
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    className="form-control"
                    value={formData.last_name}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>
                  <i className="fas fa-phone"></i>
                  Телефон номери
                </label>
                <input
                  type="text"
                  name="phone_number"
                  className="form-control"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>
                  <i className="fas fa-map-marker-alt"></i>
                  Дареги
                </label>
                <input
                  type="text"
                  name="address"
                  className="form-control"
                  value={formData.address}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>
                  <i className="fas fa-user-shield"></i>
                  Өзгөчө кырдаалдагы байланыш (Аты)
                </label>
                <input
                  type="text"
                  name="emergency_contact_name"
                  className="form-control"
                  value={formData.emergency_contact_name}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>
                  <i className="fas fa-phone-alt"></i>
                  Өзгөчө кырдаалдагы телефон
                </label>
                <input
                  type="text"
                  name="emergency_contact_phone"
                  className="form-control"
                  value={formData.emergency_contact_phone}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditing(false)}
                  disabled={loading}
                >
                  <i className="fas fa-times"></i>
                  Жокко чыгаруу
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Сакталууда...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save"></i>
                      Сактоо
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-details">
              <div className="detail-row">
                <span className="detail-label">
                  <i className="fas fa-phone"></i>
                  Телефон:
                </span>
                <span className="detail-value">{user?.phone_number || '—'}</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">
                  <i className="fas fa-map-marker-alt"></i>
                  Дареги:
                </span>
                <span className="detail-value">{user?.address || '—'}</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">
                  <i className="fas fa-user-shield"></i>
                  Өзгөчө кырдаал (Аты):
                </span>
                <span className="detail-value">{user?.emergency_contact_name || '—'}</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">
                  <i className="fas fa-phone-alt"></i>
                  Өзгөчө кырдаал (Телефон):
                </span>
                <span className="detail-value">{user?.emergency_contact_phone || '—'}</span>
              </div>

              {user?.role === 'STUDENT' && (
                <>
                  <div className="detail-row">
                    <span className="detail-label">
                      <i className="fas fa-users"></i>
                      Группа:
                    </span>
                    <span className="detail-value">{user?.group?.name || '—'}</span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">
                      <i className="fas fa-book"></i>
                      Курс:
                    </span>
                    <span className="detail-value">{user?.group?.course?.name || '—'}</span>
                  </div>
                </>
              )}

              {user?.role === 'TEACHER' && (
                <div className="detail-row">
                  <span className="detail-label">
                    <i className="fas fa-book-open"></i>
                    Предметтер:
                  </span>
                  <span className="detail-value">
                    {user?.subjects?.map(s => s.name).join(', ') || '—'}
                  </span>
                </div>
              )}

              {/* Логин жана Пароль өзгөртүү баткычтары */}
              <div className="security-actions">
                <h4>
                  <i className="fas fa-shield-alt"></i>
                  Коопсуздук
                </h4>
                <div className="security-buttons">
                  <button
                    className="btn btn-warning"
                    onClick={() => setShowUsernameModal(true)}
                  >
                    <i className="fas fa-user-edit"></i>
                    Логинди өзгөртүү
                  </button>
                  <button
                    className="btn btn-warning"
                    onClick={() => setShowPasswordModal(true)}
                  >
                    <i className="fas fa-key"></i>
                    Паролду өзгөртүү
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Пароль өзгөртүү модалы */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <i className="fas fa-key"></i>
                Паролду өзгөртүү
              </h3>
              <button
                className="modal-close"
                onClick={() => setShowPasswordModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handlePasswordChange}>
              <div className="modal-body">
                <div className="form-group">
                  <label>
                    <i className="fas fa-lock"></i>
                    Учурдагы пароль
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    value={passwordData.current_password}
                    onChange={(e) => setPasswordData({
                      ...passwordData,
                      current_password: e.target.value
                    })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>
                    <i className="fas fa-key"></i>
                    Жаңы пароль
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    value={passwordData.new_password}
                    onChange={(e) => setPasswordData({
                      ...passwordData,
                      new_password: e.target.value
                    })}
                    required
                    minLength="6"
                  />
                </div>
                <div className="form-group">
                  <label>
                    <i className="fas fa-check-circle"></i>
                    Паролду тастыктоо
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    value={passwordData.confirm_password}
                    onChange={(e) => setPasswordData({
                      ...passwordData,
                      confirm_password: e.target.value
                    })}
                    required
                    minLength="6"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowPasswordModal(false)}
                >
                  Жокко чыгаруу
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Өзгөртүлүүдө...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save"></i>
                      Сактоо
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Логин өзгөртүү модалы */}
      {showUsernameModal && (
        <div className="modal-overlay" onClick={() => setShowUsernameModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <i className="fas fa-user-edit"></i>
                Логинди өзгөртүү
              </h3>
              <button
                className="modal-close"
                onClick={() => setShowUsernameModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleUsernameChange}>
              <div className="modal-body">
                <div className="info-box">
                  <i className="fas fa-info-circle"></i>
                  <p>Учурдагы логин: <strong>{user?.username}</strong></p>
                </div>
                <div className="form-group">
                  <label>
                    <i className="fas fa-user"></i>
                    Жаңы логин
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={usernameData.new_username}
                    onChange={(e) => setUsernameData({
                      ...usernameData,
                      new_username: e.target.value
                    })}
                    required
                    minLength="3"
                    placeholder="Жаңы логинди жазыңыз"
                  />
                </div>
                <div className="form-group">
                  <label>
                    <i className="fas fa-lock"></i>
                    Паролуңуз (тастыктоо үчүн)
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    value={usernameData.password}
                    onChange={(e) => setUsernameData({
                      ...usernameData,
                      password: e.target.value
                    })}
                    required
                    placeholder="Паролуңузду жазыңыз"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowUsernameModal(false)}
                >
                  Жокко чыгаруу
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Өзгөртүлүүдө...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save"></i>
                      Сактоо
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Profile
