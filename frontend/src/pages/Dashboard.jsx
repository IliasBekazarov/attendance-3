import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import api from '../services/api'
import Avatar from '../components/Avatar'

const Dashboard = () => {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/v1/dashboard/stats/')
      setStats(response.data)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="loading">{t('loading')}</div>
  }

  return (
    <div className="dashboard-container">
      {/* User Info Card */}
      {/* <div className="card user-card">
        <div className="card-body">
          <div className="user-header">
            <div className="user-avatar-section">
              <Avatar 
                src={user?.profile_photo}
                alt={user?.full_name || user?.username}
                size="lg"
                className="profile-photo-large"
              />
              <div className="user-details">
                <h2>{user?.full_name || user?.username}</h2>
                <p className="user-role">
                  <i className="fas fa-crown"></i>
                  {t(user?.role?.toLowerCase() || 'user')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div> */}

      {/* Admin/Manager Dashboard */}
      {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
        <>
          <div className="stats-grid">
            <div className="stat-card stat-primary">
              <div className="stat-icon">
                <i className="fas fa-users"></i>
              </div>
              <div className="stat-content">
                <h3>{stats?.total_students || 0}</h3>
                <p>{t('totalStudents')}</p>
              </div>
            </div>

            <div className="stat-card stat-success">
              <div className="stat-icon">
                <i className="fas fa-chalkboard-teacher"></i>
              </div>
              <div className="stat-content">
                <h3>{stats?.total_teachers || 0}</h3>
                <p>{t('totalTeachers')}</p>
              </div>
            </div>

            <div className="stat-card stat-info">
              <div className="stat-icon">
                <i className="fas fa-layer-group"></i>
              </div>
              <div className="stat-content">
                <h3>{stats?.total_groups || 0}</h3>
                <p>{t('totalGroups')}</p>
              </div>
            </div>

            <div className="stat-card stat-warning">
              <div className="stat-icon">
                <i className="fas fa-book-open"></i>
              </div>
              <div className="stat-content">
                <h3>{stats?.total_subjects || 0}</h3>
                <p>{t('totalSubjects')}</p>
              </div>
            </div>
          </div>

          {/* Today's Statistics */}
          <div className="card">
            <div className="card-header">
              <h5>
                <i className="fas fa-calendar-day"></i>
                {t('todayStatistics')}
              </h5>
            </div>
            <div className="card-body">
              <div className="today-stats">
                <div className="today-stat">
                  <div className="today-stat-label">{t('total')}</div>
                  <div className="today-stat-value">{stats?.today_total || 0}</div>
                </div>
                <div className="today-stat success">
                  <div className="today-stat-label">{t('presentStudents')}</div>
                  <div className="today-stat-value">{stats?.today_present || 0}</div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill success"
                      style={{ width: `${stats?.today_present_rate || 0}%` }}
                    ></div>
                  </div>
                </div>
                <div className="today-stat danger">
                  <div className="today-stat-label">{t('absentStudents')}</div>
                  <div className="today-stat-value">{stats?.today_absent || 0}</div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill danger"
                      style={{ width: `${stats?.today_absent_rate || 0}%` }}
                    ></div>
                  </div>
                </div>
                <div className="today-stat warning">
                  <div className="today-stat-label">{t('lateStudents')}</div>
                  <div className="today-stat-value">{stats?.today_late || 0}</div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill warning"
                      style={{ width: `${stats?.today_late_rate || 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Groups Statistics */}
          {stats?.groups_stats && stats.groups_stats.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h5>
                  <i className="fas fa-table"></i>
                  {t('groupStatistics')}
                </h5>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>{t('group')}</th>
                        <th className="text-center">{t('total')}</th>
                        <th className="text-center">{t('presentStudents')}</th>
                        <th className="text-center">{t('absentStudents')}</th>
                        <th className="text-center">{t('percentage')}</th>
                        <th>{t('progress')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.groups_stats.map((group) => (
                        <tr key={group.id}>
                          <td>
                            <strong>{group.name}</strong>
                            <br />
                            <small className="text-muted">{group.course?.name}</small>
                          </td>
                          <td className="text-center">
                            <span className="badge badge-info">
                              {group.total_records || 0}
                            </span>
                          </td>
                          <td className="text-center">
                            <span className="badge badge-success">
                              {group.present_count || 0}
                            </span>
                          </td>
                          <td className="text-center">
                            <span className="badge badge-danger">
                              {group.absent_count || 0}
                            </span>
                          </td>
                          <td className="text-center">
                            <span className={`badge ${
                              group.attendance_rate >= 80 ? 'badge-success' :
                              group.attendance_rate >= 60 ? 'badge-warning' : 'badge-danger'
                            }`}>
                              {group.attendance_rate || 0}%
                            </span>
                          </td>
                          <td>
                            <div className="progress-bar">
                              <div 
                                className={`progress-fill ${
                                  group.attendance_rate >= 80 ? 'success' :
                                  group.attendance_rate >= 60 ? 'warning' : 'danger'
                                }`}
                                style={{ width: `${group.attendance_rate || 0}%` }}
                              >
                                <span>{group.attendance_rate || 0}%</span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Teacher Dashboard */}
      {user?.role === 'TEACHER' && (
        <div className="stats-grid">
          <div className="stat-card stat-primary">
            <div className="stat-icon">
              <i className="fas fa-calendar-check"></i>
            </div>
            <div className="stat-content">
              <h3>{stats?.today_classes_count || 0}</h3>
              <p>{t('todayClasses')}</p>
            </div>
          </div>

          <div className="stat-card stat-success">
            <div className="stat-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <div className="stat-content">
              <h3>{stats?.marked_classes_count || 0}</h3>
              <p>{t('markedClasses')}</p>
            </div>
          </div>

          <div className="stat-card stat-warning">
            <div className="stat-icon">
              <i className="fas fa-clock"></i>
            </div>
            <div className="stat-content">
              <h3>{stats?.unmarked_classes_count || 0}</h3>
              <p>{t('pending')}</p>
            </div>
          </div>

          <div className="stat-card stat-info">
            <div className="stat-icon">
              <i className="fas fa-users"></i>
            </div>
            <div className="stat-content">
              <h3>{stats?.my_students_count || 0}</h3>
              <p>{t('totalStudents')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Student Dashboard */}
      {user?.role === 'STUDENT' && (
        <div className="stats-grid">
          <div className="stat-card stat-primary">
            <div className="stat-icon">
              <i className="fas fa-percentage"></i>
            </div>
            <div className="stat-content">
              <h3>{stats?.attendance_percentage || 0}%</h3>
              <p>{t('attendancePercentage')}</p>
            </div>
          </div>

          <div className="stat-card stat-success">
            <div className="stat-icon">
              <i className="fas fa-calendar-check"></i>
            </div>
            <div className="stat-content">
              <h3>{stats?.present_days || 0}</h3>
              <p>{t('presentDays')}</p>
            </div>
          </div>

          <div className="stat-card stat-danger">
            <div className="stat-icon">
              <i className="fas fa-times-circle"></i>
            </div>
            <div className="stat-content">
              <h3>{stats?.absent_days || 0}</h3>
              <p>{t('absentDays')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Parent Dashboard */}
      {user?.role === 'PARENT' && stats?.my_children && (
        <div className="card">
          <div className="card-header">
            <h5>
              <i className="fas fa-child"></i>
              {t('myChildren')}
            </h5>
          </div>
          <div className="card-body">
            <div className="children-grid">
              {stats.my_children.map((child) => (
                <div key={child.id} className="child-card">
                  <h6>{child.name}</h6>
                  <p className="text-muted">{child.group?.name}</p>
                  <div className="child-stats">
                    <div className="child-stat success">
                      <span>{child.present_count || 0}</span>
                      <small>{t('presentStudents')}</small>
                    </div>
                    <div className="child-stat danger">
                      <span>{child.absent_count || 0}</span>
                      <small>{t('absentStudents')}</small>
                    </div>
                    <div className="child-stat primary">
                      <span>{child.attendance_percentage || 0}%</span>
                      <small>{t('percentage')}</small>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
