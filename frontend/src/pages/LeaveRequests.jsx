import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import Avatar from '../components/Avatar'

const LeaveRequests = () => {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    reason: '',
    document: null
  })

  useEffect(() => {
    fetchLeaveRequests()
  }, [])

  const fetchLeaveRequests = async () => {
    setLoading(true)
    try {
      const response = await api.get('/v1/leave-requests/')
      setRequests(Array.isArray(response.data) ? response.data : response.data.results || [])
    } catch (error) {
      console.error('Failed to fetch leave requests:', error)
      setRequests([])
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    if (e.target.name === 'document') {
      setFormData({ ...formData, document: e.target.files[0] })
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const data = new FormData()
    data.append('start_date', formData.start_date)
    data.append('end_date', formData.end_date)
    data.append('reason', formData.reason)
    if (formData.document) {
      data.append('document', formData.document)
    }

    try {
      await api.post('/v1/leave-requests/', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setShowForm(false)
      setFormData({ start_date: '', end_date: '', reason: '', document: null })
      fetchLeaveRequests()
      alert('Өтүнмө ийгиликтүү жөнөтүлдү')
    } catch (error) {
      console.error('Failed to submit leave request:', error)
      alert('Өтүнмөнү жөнөтүүдө ката')
    }
  }

  const handleApprove = async (requestId) => {
    try {
      await api.post(`/v1/leave-requests/${requestId}/approve/`)
      fetchLeaveRequests()
      alert('Өтүнмө кабыл алынды')
    } catch (error) {
      console.error('Failed to approve request:', error)
      alert('Ката чыкты: ' + (error.response?.data?.error || error.message))
    }
  }

  const handleReject = async (requestId) => {
    const reason = prompt('Четке кагуунун себеби:')
    if (!reason) return

    try {
      await api.post(`/v1/leave-requests/${requestId}/reject/`, {
        rejection_reason: reason
      })
      fetchLeaveRequests()
      alert('Өтүнмө четке кагылды')
    } catch (error) {
      console.error('Failed to reject request:', error)
      alert('Ката чыкты: ' + (error.response?.data?.error || error.message))
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: { class: 'warning', text: 'Күтүүдө', icon: 'clock' },
      APPROVED: { class: 'success', text: 'Кабыл алынды', icon: 'check' },
      REJECTED: { class: 'danger', text: 'Четке кагылды', icon: 'times' }
    }
    const badge = badges[status] || badges.PENDING
    return (
      <span className={`badge badge-${badge.class}`}>
        <i className={`fas fa-${badge.icon}`}></i>
        {badge.text}
      </span>
    )
  }

  if (loading) {
    return <div className="loading">Жүктөлүүдө...</div>
  }

  return (
    <div className="leave-requests-container">
      <div className="card">
        <div className="card-header">
          <h5>
            <i className="fas fa-file-medical"></i>
            Өтүнмөлөр
          </h5>
          {(user?.role === 'STUDENT' || user?.role === 'TEACHER') && (
            <button
              className="btn btn-primary"
              onClick={() => setShowForm(!showForm)}
            >
              <i className="fas fa-plus"></i>
              Жаңы өтүнмө
            </button>
          )}
        </div>

        <div className="card-body">
          {/* New Request Form */}
          {showForm && (
            <form onSubmit={handleSubmit} className="leave-form">
              <div className="form-row">
                <div className="form-group">
                  <label>
                    <i className="fas fa-calendar-alt"></i>
                    Башталыш күнү
                  </label>
                  <input
                    type="date"
                    name="start_date"
                    className="form-control"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    <i className="fas fa-calendar-alt"></i>
                    Аяктоо күнү
                  </label>
                  <input
                    type="date"
                    name="end_date"
                    className="form-control"
                    value={formData.end_date}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>
                  <i className="fas fa-comment-alt"></i>
                  Себеби
                </label>
                <textarea
                  name="reason"
                  className="form-control"
                  rows="3"
                  value={formData.reason}
                  onChange={handleInputChange}
                  required
                ></textarea>
              </div>

              <div className="form-group">
                <label>
                  <i className="fas fa-file-upload"></i>
                  Документ (сылтама, справка)
                </label>
                <input
                  type="file"
                  name="document"
                  className="form-control"
                  onChange={handleInputChange}
                  accept=".pdf,.jpg,.jpeg,.png"
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowForm(false)}
                >
                  <i className="fas fa-times"></i>
                  Жокко чыгаруу
                </button>
                <button type="submit" className="btn btn-primary">
                  <i className="fas fa-paper-plane"></i>
                  Жөнөтүү
                </button>
              </div>
            </form>
          )}

          {/* Requests List */}
          <div className="requests-list">
            {requests.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-inbox"></i>
                <p>Өтүнмөлөр жок</p>
              </div>
            ) : (
              requests.map((request) => (
                <div key={request.id} className="request-card">
                  <div className="request-header">
                    <div className="request-student">
                      <Avatar
                        src={request.student?.profile_photo}
                        alt={request.student?.full_name}
                        size="md"
                        className="student-avatar"
                      />
                      <div>
                        <h6>{request.student?.full_name}</h6>
                        <small className="text-muted">
                          {request.student?.group?.name}
                        </small>
                      </div>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>

                  <div className="request-body">
                    <div className="request-dates">
                      <div className="date-item">
                        <i className="fas fa-calendar-day"></i>
                        <span>{new Date(request.start_date).toLocaleDateString('ky-KG')}</span>
                      </div>
                      <span>—</span>
                      <div className="date-item">
                        <i className="fas fa-calendar-day"></i>
                        <span>{new Date(request.end_date).toLocaleDateString('ky-KG')}</span>
                      </div>
                    </div>

                    <div className="request-reason">
                      <p><strong>Себеби:</strong> {request.reason}</p>
                    </div>

                    {request.document && (
                      <a href={request.document} target="_blank" className="request-document">
                        <i className="fas fa-file-download"></i>
                        Документти жүктөп алуу
                      </a>
                    )}

                    {request.rejection_reason && (
                      <div className="rejection-reason">
                        <i className="fas fa-exclamation-circle"></i>
                        <strong>Четке кагуунун себеби:</strong> {request.rejection_reason}
                      </div>
                    )}
                  </div>

                  {/* Admin/Teacher Actions */}
                  {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && request.status === 'PENDING' && (
                    <div className="request-actions">
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleApprove(request.id)}
                      >
                        <i className="fas fa-check"></i>
                        Кабыл алуу
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleReject(request.id)}
                      >
                        <i className="fas fa-times"></i>
                        Четке кагуу
                      </button>
                    </div>
                  )}

                  <div className="request-footer">
                    <small className="text-muted">
                      <i className="fas fa-clock"></i>
                      Жөнөтүлгөн: {new Date(request.created_at).toLocaleString('ky-KG')}
                    </small>
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

export default LeaveRequests
