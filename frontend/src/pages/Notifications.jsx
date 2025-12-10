import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const Notifications = () => {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, unread, read

  useEffect(() => {
    fetchNotifications()
  }, [filter])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const params = filter !== 'all' ? { status: filter } : {}
      const response = await api.get('/v1/notifications/', { params })
      setNotifications(Array.isArray(response.data) ? response.data : response.data.results || [])
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId) => {
    try {
      await api.post(`/v1/notifications/${notificationId}/mark_read/`)
      fetchNotifications()
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await api.post('/v1/notifications/mark_all_read/')
      fetchNotifications()
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  const deleteNotification = async (notificationId) => {
    if (!confirm('Билдирүүнү өчүрөсүзбү?')) return

    try {
      await api.delete(`/v1/notifications/${notificationId}/`)
      fetchNotifications()
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'ATTENDANCE':
        return 'fa-calendar-check'
      case 'LEAVE':
        return 'fa-file-medical'
      case 'ANNOUNCEMENT':
        return 'fa-bullhorn'
      case 'SCHEDULE':
        return 'fa-calendar-alt'
      default:
        return 'fa-bell'
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Азыр эле'
    if (diffMins < 60) return `${diffMins} мүнөт мурун`
    if (diffHours < 24) return `${diffHours} саат мурун`
    if (diffDays < 7) return `${diffDays} күн мурун`
    return date.toLocaleDateString('ky-KG')
  }

  if (loading) {
    return <div className="loading">Жүктөлүүдө...</div>
  }

  return (
    <div className="notifications-container">
      <div className="card">
        <div className="card-header">
          <h5>
            <i className="fas fa-bell"></i>
            Билдирүүлөр
          </h5>
          <div className="header-actions">
            <button
              className="btn btn-sm btn-primary"
              onClick={markAllAsRead}
              disabled={notifications.filter(n => !n.is_read).length === 0}
            >
              <i className="fas fa-check-double"></i>
              Баарын окуу
            </button>
          </div>
        </div>

        <div className="card-body">
          {/* Filter Tabs */}
          <div className="filter-tabs">
            <button
              className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              <i className="fas fa-inbox"></i>
              Баары
              <span className="badge">{notifications.length}</span>
            </button>
            <button
              className={`filter-tab ${filter === 'unread' ? 'active' : ''}`}
              onClick={() => setFilter('unread')}
            >
              <i className="fas fa-envelope"></i>
              Окулбаган
              <span className="badge">{notifications.filter(n => !n.is_read).length}</span>
            </button>
            <button
              className={`filter-tab ${filter === 'read' ? 'active' : ''}`}
              onClick={() => setFilter('read')}
            >
              <i className="fas fa-envelope-open"></i>
              Окулган
              <span className="badge">{notifications.filter(n => n.is_read).length}</span>
            </button>
          </div>

          {/* Notifications List */}
          <div className="notifications-list">
            {notifications.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-bell-slash"></i>
                <p>Билдирүүлөр жок</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                >
                  <div className="notification-icon">
                    <i className={`fas ${getNotificationIcon(notification.type)}`}></i>
                  </div>

                  <div className="notification-content">
                    <div className="notification-header">
                      <h6>{notification.title}</h6>
                      <span className="notification-time">
                        {formatDate(notification.created_at)}
                      </span>
                    </div>
                    <p className="notification-message">{notification.message}</p>

                    {notification.action_url && (
                      <a href={notification.action_url} className="notification-action">
                        <i className="fas fa-external-link-alt"></i>
                        Көрүү
                      </a>
                    )}
                  </div>

                  <div className="notification-actions">
                    {!notification.is_read && (
                      <button
                        className="btn-icon"
                        onClick={() => markAsRead(notification.id)}
                        title="Окулган деп белгилөө"
                      >
                        <i className="fas fa-check"></i>
                      </button>
                    )}
                    <button
                      className="btn-icon btn-danger"
                      onClick={() => deleteNotification(notification.id)}
                      title="Өчүрүү"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Notifications
