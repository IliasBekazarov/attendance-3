import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import api from '../services/api'
import Avatar from './Avatar'
import Logo from '../../src/imgs/logo.png'

const Layout = ({ children }) => {
  const { user, logout } = useAuth()
  const { t, language, changeLanguage } = useLanguage()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)

  // Билдирүүлөрдү жүктөө
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await api.get('/v1/notifications/')
        const data = response.data
        
        // Окулбаган билдирүүлөрдү эсептөө
        let notifications = []
        if (Array.isArray(data)) {
          notifications = data
        } else if (data && Array.isArray(data.results)) {
          notifications = data.results
        }
        
        const unread = notifications.filter(n => !n.is_read).length
        setUnreadCount(unread)
      } catch (error) {
        console.error('Билдирүүлөрдү жүктөөдө ката:', error)
        setUnreadCount(0)
      }
    }

    if (user) {
      fetchNotifications()
      // Ар 30 секундта жаңылоо
      const interval = setInterval(fetchNotifications, 30000)
      return () => clearInterval(interval)
    }
  }, [user])

  // Издөө функциясы
  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) {
      setShowResults(false)
      return
    }

    setIsSearching(true)
    try {
      // Бардык керектүү маалыматтарды параллелдүү издөө
      const [studentsRes, teachersRes, groupsRes, subjectsRes, schedulesRes] = await Promise.all([
        api.get(`/v1/students/?search=${searchQuery}`).catch(() => ({ data: { results: [] } })),
        api.get(`/v1/teachers/?search=${searchQuery}`).catch(() => ({ data: { results: [] } })),
        api.get(`/v1/groups/?search=${searchQuery}`).catch(() => ({ data: { results: [] } })),
        api.get(`/v1/subjects/?search=${searchQuery}`).catch(() => ({ data: { results: [] } })),
        api.get(`/v1/schedules/?search=${searchQuery}`).catch(() => ({ data: { results: [] } }))
      ])

      setSearchResults({
        students: Array.isArray(studentsRes.data) ? studentsRes.data : studentsRes.data.results || [],
        teachers: Array.isArray(teachersRes.data) ? teachersRes.data : teachersRes.data.results || [],
        groups: Array.isArray(groupsRes.data) ? groupsRes.data : groupsRes.data.results || [],
        subjects: Array.isArray(subjectsRes.data) ? subjectsRes.data : subjectsRes.data.results || [],
        schedules: Array.isArray(schedulesRes.data) ? schedulesRes.data : schedulesRes.data.results || []
      })
      setShowResults(true)
    } catch (error) {
      console.error('Издөөдө ката:', error)
      setSearchResults({
        students: [],
        teachers: [],
        groups: [],
        subjects: [],
        schedules: []
      })
      setShowResults(true)
    } finally {
      setIsSearching(false)
    }
  }

  // Издөө жыйынтыгын тазалоо
  const clearSearch = () => {
    setSearchQuery('')
    setSearchResults(null)
    setShowResults(false)
  }

  const menuItems = [
    { path: '/dashboard', icon: 'fa-home', label: t('dashboard') },
    { path: '/schedule', icon: 'fa-calendar-alt', label: t('schedule') },
    ...(user?.role === 'TEACHER' ? [{ path: '/mark-attendance', icon: 'fa-user-check', label: 'Катышуу' }] : []),
    ...(user?.role === 'ADMIN' || user?.role === 'MANAGER' ? [{ path: '/reports', icon: 'fa-chart-bar', label: t('reports') }] : []),
    { path: '/notifications', icon: 'fa-bell', label: t('notifications') },
    { path: '/leave-requests', icon: 'fa-file-alt', label: t('leaveRequests') },
    { path: '/profile', icon: 'fa-user', label: t('profile') }
  ]

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
            <div className="sidebar-brand">
            <div className="brand-icon">
                <img 
                  src={Logo} 
                  alt="Attendance System Logo" 
                />
            </div>
            <div className="brand-text">
              <h2>Attendance</h2>
              <span>System</span>
            </div>
            </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <i className={`fas ${item.icon}`}></i>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={logout}>
            <i className="fas fa-sign-out-alt"></i>
            <span>{t('logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <header className="header">
          <div className="header-left">
            {/* Search Bar */}
            <form className="search-form" onSubmit={handleSearch}>
              <div className="search-input-wrapper">
                <i className="fas fa-search search-icon"></i>
                <input
                  type="text"
                  className="search-input"
                  placeholder={t('search') || 'Издөө...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button 
                    type="button" 
                    className="clear-search-btn"
                    onClick={clearSearch}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </div>
              {isSearching && (
                <div className="search-loader">
                  <i className="fas fa-spinner fa-spin"></i>
                </div>
              )}
            </form>
          </div>

          <div className="header-right">
            {/* Language Switcher */}
            <div className="language-switcher">
              <button 
                className={`lang-btn ${language === 'ky' ? 'active' : ''}`}
                onClick={() => changeLanguage('ky')}
                title="Кыргызча"
              >
                🇰🇬 KY
              </button>
              <button 
                className={`lang-btn ${language === 'ru' ? 'active' : ''}`}
                onClick={() => changeLanguage('ru')}
                title="Русский"
              >
                🇷🇺 RU
              </button>
              <button 
                className={`lang-btn ${language === 'en' ? 'active' : ''}`}
                onClick={() => changeLanguage('en')}
                title="English"
              >
                🇬🇧 EN
              </button>
            </div>

            {/* Notifications */}
            <div className="header-notifications">
              <Link to="/notifications" className="notification-btn" title="Билдирүүлөр">
                <i className="fas fa-bell"></i>
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount}</span>
                )}
              </Link>
            </div>

            {/* User Info with Dropdown */}
            <div className="user-info">
              <Avatar 
                src={user?.profile_photo}
                alt={user?.first_name || user?.username}
                size="md"
                className="user-avatar"
              />
              <div className="user-details">
                <span className="user-name">{user?.first_name || user?.username}</span>
                <span className="user-role">{user?.role}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="page-content">
          {/* Издөө жыйынтыгы */}
          {showResults && searchResults && (
            <div className="search-results-container">
              <div className="search-results-header">
                <h2>
                  <i className="fas fa-search"></i>
                  Издөө жыйынтыгы: "{searchQuery}"
                </h2>
                <button className="close-results-btn" onClick={clearSearch}>
                  <i className="fas fa-times"></i>
                  Жабуу
                </button>
              </div>

              <div className="search-results-content">
                {/* Студенттер */}
                {searchResults.students.length > 0 && (
                  <div className="result-section">
                    <h3>
                      <i className="fas fa-user-graduate"></i>
                      Студенттер ({searchResults.students.length})
                    </h3>
                    <div className="result-items">
                      {searchResults.students.map(student => (
                        <div key={student.id} className="result-item">
                          <Avatar 
                            src={student.user?.profile_photo}
                            alt={student.name}
                            size="sm"
                          />
                          <div className="result-info">
                            <h4>{student.name}</h4>
                            <p>{student.group?.name || 'Группа жок'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Мугалимдер */}
                {searchResults.teachers.length > 0 && (
                  <div className="result-section">
                    <h3>
                      <i className="fas fa-chalkboard-teacher"></i>
                      Мугалимдер ({searchResults.teachers.length})
                    </h3>
                    <div className="result-items">
                      {searchResults.teachers.map(teacher => (
                        <div key={teacher.id} className="result-item">
                          <Avatar 
                            src={teacher.user?.profile_photo}
                            alt={teacher.name}
                            size="sm"
                          />
                          <div className="result-info">
                            <h4>{teacher.name}</h4>
                            <p>{teacher.degree || 'Мугалим'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Группалар */}
                {searchResults.groups.length > 0 && (
                  <div className="result-section">
                    <h3>
                      <i className="fas fa-users"></i>
                      Группалар ({searchResults.groups.length})
                    </h3>
                    <div className="result-items">
                      {searchResults.groups.map(group => (
                        <Link 
                          key={group.id} 
                          to={`/groups/${group.id}`}
                          className="result-item"
                          onClick={clearSearch}
                        >
                          <div className="result-icon">
                            <i className="fas fa-users"></i>
                          </div>
                          <div className="result-info">
                            <h4>{group.name}</h4>
                            <p>{group.course?.name || 'Курс белгисиз'}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Предметтер */}
                {searchResults.subjects.length > 0 && (
                  <div className="result-section">
                    <h3>
                      <i className="fas fa-book"></i>
                      Предметтер ({searchResults.subjects.length})
                    </h3>
                    <div className="result-items">
                      {searchResults.subjects.map(subject => (
                        <div key={subject.id} className="result-item">
                          <div className="result-icon">
                            <i className="fas fa-book"></i>
                          </div>
                          <div className="result-info">
                            <h4>{subject.subject_name}</h4>
                            <p>{subject.teacher?.name || 'Мугалим белгисиз'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Сабактар */}
                {searchResults.schedules.length > 0 && (
                  <div className="result-section">
                    <h3>
                      <i className="fas fa-calendar-alt"></i>
                      Расписание ({searchResults.schedules.length})
                    </h3>
                    <div className="result-items">
                      {searchResults.schedules.map(schedule => (
                        <div key={schedule.id} className="result-item">
                          <div className="result-icon">
                            <i className="fas fa-calendar-check"></i>
                          </div>
                          <div className="result-info">
                            <h4>{schedule.subject?.subject_name}</h4>
                            <p>
                              {schedule.group?.name} • {schedule.day_of_week} • {schedule.timeslot?.name}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Эч нерсе табылган жок */}
                {!searchResults.students.length && 
                 !searchResults.teachers.length && 
                 !searchResults.groups.length && 
                 !searchResults.subjects.length && 
                 !searchResults.schedules.length && (
                  <div className="no-results">
                    <i className="fas fa-search"></i>
                    <h3>Эч нерсе табылган жок</h3>
                    <p>"{searchQuery}" боюнча эч кандай маалымат табылган жок</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {children}
        </main>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-bottom-nav">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`mobile-nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <i className={`fas ${item.icon}`}></i>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}

export default Layout
