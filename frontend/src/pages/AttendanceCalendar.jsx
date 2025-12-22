import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import api from '../services/api'
import '../styles/attendance-calendar.css'

const AttendanceCalendar = () => {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedGroup, setSelectedGroup] = useState('')
  const [groups, setGroups] = useState([])
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState(null)
  const [students, setStudents] = useState([])
  const [attendance, setAttendance] = useState({})
  const [existingAttendance, setExistingAttendance] = useState({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const days = {
    0: 'Sunday',
    1: 'Monday',
    2: 'Tuesday',
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday',
    6: 'Saturday'
  }

  // Load groups for teacher
  useEffect(() => {
    if (user?.role === 'TEACHER') {
      loadGroups()
    }
  }, [user])

  // Load schedules when date or group changes
  useEffect(() => {
    if (selectedDate && selectedGroup) {
      loadSchedules()
    }
  }, [selectedDate, selectedGroup])

  const loadGroups = async () => {
    try {
      // Get only groups where teacher has schedules
      const response = await api.get('/v1/schedules/')
      const schedulesData = Array.isArray(response.data) ? response.data : (response.data.results || [])
      
      // Extract unique groups from teacher's schedules
      const uniqueGroups = []
      const groupIds = new Set()
      
      schedulesData.forEach(schedule => {
        if (schedule.group && !groupIds.has(schedule.group.id)) {
          groupIds.add(schedule.group.id)
          uniqueGroups.push(schedule.group)
        }
      })
      
      setGroups(uniqueGroups)
      if (uniqueGroups.length > 0) {
        setSelectedGroup(uniqueGroups[0].id)
      }
    } catch (error) {
      console.error('Error loading groups:', error)
      setGroups([]) // Ensure groups is always an array
    }
  }

  const loadSchedules = async () => {
    setLoading(true)
    try {
      const date = new Date(selectedDate)
      const dayName = days[date.getDay()]
      
      // Get teacher's schedules for selected group and day
      const response = await api.get(`/v1/schedules/?group=${selectedGroup}&day=${dayName}`)
      // Handle both array and paginated response formats
      let schedulesData = Array.isArray(response.data) ? response.data : (response.data.results || [])
      
      // Load attendance data for each schedule
      const schedulesWithAttendance = await Promise.all(
        schedulesData.map(async (schedule) => {
          try {
            const attResponse = await api.get(`/v1/attendance/?schedule=${schedule.id}&date=${selectedDate}`)
            // Handle both array and paginated response formats
            const attendanceData = Array.isArray(attResponse.data) ? attResponse.data : (attResponse.data.results || [])
            return {
              ...schedule,
              attendanceData
            }
          } catch (error) {
            return {
              ...schedule,
              attendanceData: []
            }
          }
        })
      )
      
      setSchedules(schedulesWithAttendance)
    } catch (error) {
      console.error('Error loading schedules:', error)
      setSchedules([])
    } finally {
      setLoading(false)
    }
  }

  const openScheduleModal = async (schedule) => {
    setSelectedSchedule(schedule)
    setLoading(true)
    
    try {
      // Load students for this group
      const studentsResponse = await api.get(`/v1/students/?group=${schedule.group?.id}`)
      // Handle both array and paginated response formats
      const studentsData = Array.isArray(studentsResponse.data) ? studentsResponse.data : (studentsResponse.data.results || [])
      setStudents(studentsData)
      
      // Load existing attendance
      const attResponse = await api.get(`/v1/attendance/?schedule=${schedule.id}&date=${selectedDate}`)
      // Handle both array and paginated response formats
      const attData = Array.isArray(attResponse.data) ? attResponse.data : (attResponse.data.results || [])
      
      // Map attendance to students
      const attMap = {}
      const existingMap = {}
      attData.forEach(att => {
        attMap[att.student?.id] = att.status
        existingMap[att.student?.id] = att
      })
      
      setAttendance(attMap)
      setExistingAttendance(existingMap)
    } catch (error) {
      console.error('Error loading students:', error)
      setStudents([]) // Ensure students is always an array
    } finally {
      setLoading(false)
    }
  }

  const handleAttendanceChange = (studentId, status) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }))
  }

  const markAll = (status) => {
    const newAttendance = {}
    students.forEach(student => {
      newAttendance[student.id] = status
    })
    setAttendance(newAttendance)
  }

  const saveAttendance = async () => {
    if (!selectedSchedule || students.length === 0) {
      return
    }

    setSaving(true)
    try {
      const attendanceRecords = students.map(student => ({
        student_id: student.id,
        status: attendance[student.id] || 'Present',
        date: selectedDate,
        subject_id: selectedSchedule.subject?.id,
        time_slot_id: selectedSchedule.time_slot?.id,
        schedule_id: selectedSchedule.id
      }))

      await api.post('/v1/attendance/bulk/', {
        attendance_records: attendanceRecords
      })

      setMessage('✅ ' + t('attendanceSaved'))
      
      setTimeout(() => {
        setSelectedSchedule(null)
        setStudents([])
        setAttendance({})
        setExistingAttendance({})
        setMessage('')
        loadSchedules() // Reload to show updated data
      }, 2000)
      
    } catch (error) {
      console.error('Error saving attendance:', error)
      setMessage('❌ ' + t('error') + ': ' + (error.response?.data?.error || error.message))
    } finally {
      setSaving(false)
    }
  }

  const getAttendanceSummary = (schedule) => {
    if (!schedule.attendanceData || schedule.attendanceData.length === 0) {
      return {
        total: 0,
        present: 0,
        late: 0,
        absent: 0,
        marked: false
      }
    }

    const present = schedule.attendanceData.filter(a => a.status === 'Present').length
    const late = schedule.attendanceData.filter(a => a.status === 'Late').length
    const absent = schedule.attendanceData.filter(a => a.status === 'Absent').length

    return {
      total: schedule.attendanceData.length,
      present,
      late,
      absent,
      marked: true
    }
  }

  const formatTime = (time) => {
    if (!time) return ''
    return time.slice(0, 5)
  }

  return (
    <div className="attendance-calendar-page">
      <div className="page-header">
        <h1>{t('attendanceCalendar')}</h1>
        <p className="subtitle">{t('attendanceManager')}</p>
      </div>

      {message && (
        <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label>{t('selectDate')}:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
          />
        </div>

        <div className="filter-group">
          <label>{t('calendarSelectGroup')}:</label>
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
          >
            <option value="">{t('calendarSelectGroup')}</option>
            {Array.isArray(groups) && groups.map(group => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Schedules List */}
      {!selectedSchedule && (
        <div className="schedules-section">
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>{t('loadingLessons')}...</p>
            </div>
          ) : schedules.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-calendar-times"></i>
              <h3>{t('noLessonsForDate')}</h3>
            </div>
          ) : (
            <div className="schedules-grid">
              {schedules.map(schedule => {
                const summary = getAttendanceSummary(schedule)
                return (
                  <div key={schedule.id} className="schedule-card">
                    <div className="schedule-time">
                      <i className="fas fa-clock"></i>
                      <span>{schedule.time_slot?.name}</span>
                      <small>
                        {formatTime(schedule.time_slot?.start_time)} - {formatTime(schedule.time_slot?.end_time)}
                      </small>
                    </div>
                    
                    <div className="schedule-info">
                      <h3>{schedule.subject?.subject_name}</h3>
                      <p className="group-name">
                        <i className="fas fa-users"></i>
                        {schedule.group?.name}
                      </p>
                      {schedule.room && (
                        <p className="room">
                          <i className="fas fa-door-open"></i>
                          {t('room')}: {schedule.room}
                        </p>
                      )}
                    </div>
                    
                    {summary.marked ? (
                      <div className="attendance-summary-mini">
                        <div className="summary-row">
                          <span className="success">✅ {summary.present}</span>
                          <span className="warning">⏰ {summary.late}</span>
                          <span className="danger">❌ {summary.absent}</span>
                        </div>
                        <button 
                          className="btn-edit"
                          onClick={() => openScheduleModal(schedule)}
                        >
                          {t('viewEdit')} <i className="fas fa-edit"></i>
                        </button>
                      </div>
                    ) : (
                      <div className="schedule-action">
                        <p className="not-marked">{t('notMarkedForDate')}</p>
                        <button 
                          className="btn-mark"
                          onClick={() => openScheduleModal(schedule)}
                        >
                          {t('markNow')} <i className="fas fa-check"></i>
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Attendance Modal */}
      {selectedSchedule && (
        <div className="attendance-modal-section">
          <div className="section-header">
            <div>
              <button 
                className="btn-back"
                onClick={() => {
                  setSelectedSchedule(null)
                  setStudents([])
                  setAttendance({})
                  setExistingAttendance({})
                }}
              >
                <i className="fas fa-arrow-left"></i> {t('back')}
              </button>
              <h2>{selectedSchedule.subject?.subject_name}</h2>
              <p className="class-info">
                {selectedSchedule.group?.name} • {selectedSchedule.time_slot?.name} • 
                {selectedDate}
              </p>
            </div>
            
            <div className="quick-actions">
              <button className="btn btn-success" onClick={() => markAll('Present')}>
                ✅ {t('markAllPresent')}
              </button>
              <button className="btn btn-warning" onClick={() => markAll('Late')}>
                ⏰ {t('markAllLate')}
              </button>
              <button className="btn btn-danger" onClick={() => markAll('Absent')}>
                ❌ {t('markAllAbsent')}
              </button>
            </div>
          </div>

          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>{t('loadingStudents')}...</p>
            </div>
          ) : (
            <>
              <div className="students-list">
                {students.map((student, index) => (
                  <div key={student.id} className="student-item">
                    <div className="student-info">
                      <span className="student-number">{index + 1}</span>
                      <div className="student-avatar">
                        {student.profile_photo ? (
                          <img src={student.profile_photo} alt={student.full_name || student.name} />
                        ) : (
                          <div className="avatar-placeholder">
                            {(student.full_name || student.name || 'S')[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="student-name">
                        <h4>{student.full_name || student.name}</h4>
                        <small>ID: {student.id}</small>
                      </div>
                    </div>

                    <div className="attendance-buttons">
                      <button
                        className={`btn-attendance present ${attendance[student.id] === 'Present' ? 'active' : ''}`}
                        onClick={() => handleAttendanceChange(student.id, 'Present')}
                      >
                        <i className="fas fa-check"></i>
                        {t('present')}
                      </button>
                      <button
                        className={`btn-attendance late ${attendance[student.id] === 'Late' ? 'active' : ''}`}
                        onClick={() => handleAttendanceChange(student.id, 'Late')}
                      >
                        <i className="fas fa-clock"></i>
                        {t('late')}
                      </button>
                      <button
                        className={`btn-attendance absent ${attendance[student.id] === 'Absent' ? 'active' : ''}`}
                        onClick={() => handleAttendanceChange(student.id, 'Absent')}
                      >
                        <i className="fas fa-times"></i>
                        {t('absent')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="attendance-summary">
                <div className="summary-item success">
                  <i className="fas fa-check-circle"></i>
                  {t('present')}: {Object.values(attendance).filter(s => s === 'Present').length}
                </div>
                <div className="summary-item warning">
                  <i className="fas fa-clock"></i>
                  {t('late')}: {Object.values(attendance).filter(s => s === 'Late').length}
                </div>
                <div className="summary-item danger">
                  <i className="fas fa-times-circle"></i>
                  {t('absent')}: {Object.values(attendance).filter(s => s === 'Absent').length}
                </div>
              </div>

              <div className="save-section">
                <button
                  className="btn-save"
                  onClick={saveAttendance}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      {t('saving')}...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save"></i>
                      {t('saveAttendance')}
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default AttendanceCalendar
