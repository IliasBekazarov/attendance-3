import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const MarkAttendance = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [todaySchedules, setTodaySchedules] = useState([])
  const [selectedSchedule, setSelectedSchedule] = useState(null)
  const [students, setStudents] = useState([])
  const [attendance, setAttendance] = useState({})
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

  const daysKg = {
    'Sunday': 'Жекшемби',
    'Monday': 'Дүйшөмбү',
    'Tuesday': 'Шейшемби',
    'Wednesday': 'Шаршемби',
    'Thursday': 'Бейшемби',
    'Friday': 'Жума',
    'Saturday': 'Ишемби'
  }

  // Бүгүнкү сабактарды жүктөө
  useEffect(() => {
    loadTodaySchedules()
  }, [])

  const loadTodaySchedules = async () => {
    setLoading(true)
    try {
      const today = new Date()
      const dayName = days[today.getDay()]
      
      // Мугалимдин бүгүнкү сабактарын алуу - my_schedule эндпоинтун колдонуу
      const response = await api.get(`/v1/schedules/my_schedule/?day=${dayName}`)
      const mySchedules = response.data || []
      setTodaySchedules(mySchedules)
    } catch (error) {
      console.error('Сабактарды жүктөөдө ката:', error)
      setMessage('Сабактарды жүктөөдө ката чыкты')
    } finally {
      setLoading(false)
    }
  }

  const handleScheduleSelect = async (schedule) => {
    setSelectedSchedule(schedule)
    setMessage('')
    
    // Группанын студенттерин жүктөө
    if (schedule.group) {
      try {
        setLoading(true)
        const response = await api.get(`/v1/students/?group=${schedule.group.id}`)
        const studentsList = response.data.results || response.data || []
        setStudents(studentsList)
        
        // Баардыгын "Present" кылып коюу
        const initialAttendance = {}
        studentsList.forEach(student => {
          initialAttendance[student.id] = 'Present'
        })
        setAttendance(initialAttendance)
      } catch (error) {
        console.error('Студенттерди жүктөөдө ката:', error)
        setMessage('Студенттерди жүктөөдө ката чыкты')
      } finally {
        setLoading(false)
      }
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
    if (!selectedSchedule) return

    setSaving(true)
    setMessage('')
    
    try {
      const today = new Date().toISOString().split('T')[0]
      
      const attendanceRecords = students.map(student => ({
        student_id: student.id,
        status: attendance[student.id] || 'Present',
        date: today,
        subject_id: selectedSchedule.subject?.id,
        time_slot_id: selectedSchedule.time_slot?.id,
        schedule_id: selectedSchedule.id
      }))

      await api.post('/v1/attendance/bulk/', {
        attendance_records: attendanceRecords
      })

      setMessage('✅ Катышуу ийгиликтүү сакталды!')
      
      // 2 секундтан кийин тизмени тазалоо
      setTimeout(() => {
        setSelectedSchedule(null)
        setStudents([])
        setAttendance({})
        setMessage('')
      }, 2000)
      
    } catch (error) {
      console.error('Катышууну сактоодо ката:', error)
      setMessage('❌ Ката чыкты: ' + (error.response?.data?.error || error.message))
    } finally {
      setSaving(false)
    }
  }

  const formatTime = (time) => {
    if (!time) return ''
    return time.slice(0, 5) // "09:00:00" -> "09:00"
  }

  return (
    <div className="mark-attendance-page">
      <div className="page-header">
        <h1>📝 Катышуу белгилөө</h1>
        <p className="subtitle">Бүгүнкү күндүн сабактары - {new Date().toLocaleDateString('ru-RU')}</p>
      </div>

      {message && (
        <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      {/* Бүгүнкү сабактар */}
      {!selectedSchedule && (
        <div className="schedules-section">
          <h2>� Сиздин бүгүнкү сабактарыңыз</h2>
          
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>Жүктөлүүдө...</p>
            </div>
          ) : todaySchedules.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-calendar-times"></i>
              <h3>Бүгүн сабактар жок</h3>
              <p>Силердин бүгүнкү расписаниеде сабактар жок</p>
            </div>
          ) : (
            <div className="schedules-grid">
              {todaySchedules.map(schedule => (
                <div 
                  key={schedule.id} 
                  className="schedule-card"
                  onClick={() => handleScheduleSelect(schedule)}
                >
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
                        Бөлмө: {schedule.room}
                      </p>
                    )}
                  </div>
                  
                  <div className="schedule-action">
                    <button className="btn-select">
                      Тандоо <i className="fas fa-arrow-right"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Студенттер тизмеси */}
      {selectedSchedule && (
        <div className="students-section">
          <div className="section-header">
            <div>
              <button 
                className="btn-back"
                onClick={() => {
                  setSelectedSchedule(null)
                  setStudents([])
                  setAttendance({})
                }}
              >
                <i className="fas fa-arrow-left"></i> Артка
              </button>
              <h2>{selectedSchedule.subject?.subject_name}</h2>
              <p className="class-info">
                {selectedSchedule.group?.name} • {selectedSchedule.time_slot?.name} • 
                {students.length} студент
              </p>
            </div>
            
            <div className="quick-actions">
              <button className="btn btn-success" onClick={() => markAll('Present')}>
                ✅ Баарын бар
              </button>
              <button className="btn btn-warning" onClick={() => markAll('Late')}>
                ⏰ Баарын кеч
              </button>
              <button className="btn btn-danger" onClick={() => markAll('Absent')}>
                ❌ Баарын жок
              </button>
            </div>
          </div>

          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>Студенттер жүктөлүүдө...</p>
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
                        Бар
                      </button>
                      <button
                        className={`btn-attendance late ${attendance[student.id] === 'Late' ? 'active' : ''}`}
                        onClick={() => handleAttendanceChange(student.id, 'Late')}
                      >
                        <i className="fas fa-clock"></i>
                        Кеч
                      </button>
                      <button
                        className={`btn-attendance absent ${attendance[student.id] === 'Absent' ? 'active' : ''}`}
                        onClick={() => handleAttendanceChange(student.id, 'Absent')}
                      >
                        <i className="fas fa-times"></i>
                        Жок
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="attendance-summary">
                <div className="summary-item success">
                  <i className="fas fa-check-circle"></i>
                  Бар: {Object.values(attendance).filter(s => s === 'Present').length}
                </div>
                <div className="summary-item warning">
                  <i className="fas fa-clock"></i>
                  Кеч: {Object.values(attendance).filter(s => s === 'Late').length}
                </div>
                <div className="summary-item danger">
                  <i className="fas fa-times-circle"></i>
                  Жок: {Object.values(attendance).filter(s => s === 'Absent').length}
                </div>
              </div>

              {/* Save button */}
              <div className="save-section">
                <button
                  className="btn-save"
                  onClick={saveAttendance}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Сакталууда...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save"></i>
                      Катышууну сактоо
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

export default MarkAttendance
