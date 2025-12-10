import { useState, useEffect, Fragment } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import api from '../services/api'
import '../styles/attendance-modal.css'

const Schedule = () => {
  const { user, updateUser } = useAuth()
  const { t } = useLanguage()
  
  // Башкы state
  const [loading, setLoading] = useState(false)
  const [courses, setCourses] = useState([])
  const [groups, setGroups] = useState([])
  const [subjects, setSubjects] = useState([])
  const [teachers, setTeachers] = useState([])
  const [timeSlots, setTimeSlots] = useState([])
  
  // Тандоолор
  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedGroup, setSelectedGroup] = useState('')
  
  // Расписание маалыматы
  const [scheduleData, setScheduleData] = useState({})
  
  // Ата-эне үчүн балдардын тизмеси жана алардын расписаниелери
  const [myChildren, setMyChildren] = useState([])
  const [childrenSchedules, setChildrenSchedules] = useState({}) // { childId: scheduleData }
  
  // Модалдар
  const [showLessonModal, setShowLessonModal] = useState(false)
  const [currentLesson, setCurrentLesson] = useState(null)
  const [lessonForm, setLessonForm] = useState({
    subject_id: '',
    teacher_id: '',
    room: '',
    time_slot_id: '',
    day: ''
  })
  
  // Attendance модалы
  const [showAttendanceModal, setShowAttendanceModal] = useState(false)
  const [currentLessonId, setCurrentLessonId] = useState(null)
  const [students, setStudents] = useState([])
  const [attendanceData, setAttendanceData] = useState({})

  const days = {
    Monday: 'Дүйшөмбү',
    Tuesday: 'Шейшемби',
    Wednesday: 'Шаршемби',
    Thursday: 'Бейшемби',
    Friday: 'Жума',
    Saturday: 'Ишемби'
  }

  // Уруксаттар
  const canEdit = user?.role === 'ADMIN' || user?.role === 'MANAGER'
  const canViewAll = user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'TEACHER'

  // Компонент жүктөлгөндө курстарды алуу жана студенттин расписаниесин автоматтык жүктөө
  useEffect(() => {
    loadCourses()
    loadTimeSlots()
    
    // Teacher_id текшерүү жана жүктөө
    if (user?.role === 'TEACHER' && !user.teacher_id) {
      fetchTeacherId()
    }
    
    // Эгер студент болсо, анын группасын автоматтык жүктөө
    if (user?.role === 'STUDENT') {
      loadStudentSchedule()
    }
    
    // Эгер ата-эне болсо, баласынын расписаниесин жүктөө
    if (user?.role === 'PARENT') {
      loadParentSchedule()
    }
  }, [user])
  
  // Teacher ID алуу
  const fetchTeacherId = async () => {
    try {
      const response = await api.get('/v1/profile/update/')
      if (response.data.teacher_id) {
        const updatedUser = { ...user, teacher_id: response.data.teacher_id }
        updateUser(updatedUser)
      }
    } catch (error) {
      console.error('Teacher ID алууда ката:', error)
    }
  }

  // Курс тандалганда группаларды жүктөө
  useEffect(() => {
    if (selectedCourse) {
      console.log('📚 Курс тандалды, ID:', selectedCourse)
      loadGroups(selectedCourse)
      setSelectedGroup('') // Мурунку группаны тазалоо
    } else {
      setGroups([])
      setSelectedGroup('')
    }
  }, [selectedCourse])

  // Группа тандалганда расписаниени жүктөө
  useEffect(() => {
    if (selectedGroup) {
      loadSchedule(selectedGroup)
      loadSubjects()
      loadTeachers()
    } else {
      setScheduleData({})
    }
  }, [selectedGroup])

  // API чакыруулар
  const loadTeacherSchedule = async () => {
    try {
      setLoading(true)
      console.log('👨‍🏫 Мугалимдин расписаниесин жүктөө...')
      
      // Учурдагы мугалимдин ID алабыз
      const profileResponse = await api.get('/v1/profile/update/')
      const profileData = profileResponse.data
      console.log('� Мугалим профили:', profileData)
      
      // Мугалимдин бардык расписаниесин алабыз
      // Teacher ID аркылуу фильтрлейбиз
      const teachersResponse = await api.get('/v1/teachers/')
      const teachers = teachersResponse.data.results || teachersResponse.data || []
      
      // Учурдагы user'дин teacher объектисин табабыз
      const currentTeacher = teachers.find(t => t.user && t.user.id === user.id)
      console.log('�‍🏫 Учурдагы мугалим:', currentTeacher)
      
      if (!currentTeacher) {
        alert('Мугалим профили табылган жок. Администратор менен байланышыңыз.')
        setLoading(false)
        return
      }
      
      // Мугалимдин расписаниесин teacher ID аркылуу алабыз
      const schedulesResponse = await api.get(`/v1/schedules/?teacher=${currentTeacher.id}`)
      const mySchedules = schedulesResponse.data.results || schedulesResponse.data || []
      
      console.log('✅ Мугалимдин сабактары:', mySchedules)
      
      if (mySchedules.length > 0) {
        // Расписаниени grid форматына которуу
        const gridData = {}
        Object.keys(days).forEach(day => {
          gridData[day] = {}
        })

        mySchedules.forEach(schedule => {
          const day = schedule.day
          const timeSlotId = schedule.time_slot?.id || schedule.time_slot_id
          
          if (day && timeSlotId) {
            gridData[day][timeSlotId] = {
              id: schedule.id,
              subject: schedule.subject?.name || schedule.subject?.subject_name,
              teacher: schedule.teacher?.name,
              room: schedule.room,
              group: schedule.group?.name, // Группаны да көрсөтөбүз
              subject_id: schedule.subject?.id,
              teacher_id: schedule.teacher?.id,
              time_slot_id: timeSlotId
            }
          }
        })

        console.log('🔄 Мугалимдин расписание grid:', gridData)
        setScheduleData(gridData)
        await loadSubjects()
        await loadTeachers()
      } else {
        console.log('⚠️ Мугалимдин расписаниесинде сабактар жок')
        alert('Сизге али сабактар белгиленген эмес. Администратор менен байланышыңыз.')
      }
    } catch (error) {
      console.error('❌ Мугалим расписаниесин жүктөөдө ката:', error)
      alert('Расписаниени жүктөөдө ката чыкты: ' + (error.response?.data?.detail || error.message))
    } finally {
      setLoading(false)
    }
  }

  const loadStudentSchedule = async () => {
    try {
      setLoading(true)
      console.log('👨‍🎓 Студенттин расписаниесин жүктөө...')
      
      // Студенттин профилин алабыз (анда группа маалыматы бар)
      const profileResponse = await api.get('/v1/profile/update/')
      const profileData = profileResponse.data
      console.log('📋 Студент профили:', profileData)
      
      if (profileData.group && profileData.group.id) {
        const groupId = profileData.group.id
        console.log('✅ Студенттин группасы табылды:', groupId)
        
        // Курсту автоматтык тандоо
        if (profileData.group.course && profileData.group.course.id) {
          setSelectedCourse(profileData.group.course.id)
        }
        
        // Группаны автоматтык тандоо
        setSelectedGroup(groupId)
        
        // Расписаниени жүктөө
        await loadSchedule(groupId)
        await loadSubjects()
        await loadTeachers()
      } else {
        console.log('⚠️ Студент группага киргизилбеген')
        alert('Сиз али группага киргизилген эмессиз. Администратор менен байланышыңыз.')
      }
    } catch (error) {
      console.error('❌ Студент расписаниесин жүктөөдө ката:', error)
      alert('Расписаниени жүктөөдө ката чыкты')
    } finally {
      setLoading(false)
    }
  }

  const loadParentSchedule = async () => {
    try {
      setLoading(true)
      console.log('👨‍👩‍👧 Ата-эненин балдарынын расписаниесин жүктөө...')
      
      // Dashboard stats'тан балдарды алабыз (анда уже туура балдар бар)
      const statsResponse = await api.get('/v1/dashboard/stats/')
      const statsData = statsResponse.data
      console.log('📋 Dashboard stats:', statsData)
      
      // Балдарды my_children массивинен алабыз
      const children = statsData.my_children || []
      
      console.log('👶 Ата-энеге байланышкан балдар:', children)
      
      if (children.length > 0) {
        setMyChildren(children)
        
        // Ар бир бала үчүн расписаниени жүктөө
        const schedulesPromises = children.map(async (child) => {
          if (child.group && child.group.id) {
            try {
              console.log(`📡 Loading schedule for child: ${child.name}, group: ${child.group.id}`)
              const response = await api.get(`/v1/schedules/?group=${child.group.id}`)
              const data = response.data
              
              let schedules = []
              if (Array.isArray(data)) {
                schedules = data
              } else if (data && Array.isArray(data.results)) {
                schedules = data.results
              }
              
              // Расписаниени grid форматына которуу
              const gridData = {}
              Object.keys(days).forEach(day => {
                gridData[day] = {}
              })

              schedules.forEach(schedule => {
                const day = schedule.day
                const timeSlotId = schedule.time_slot?.id || schedule.time_slot_id
                
                if (day && timeSlotId) {
                  gridData[day][timeSlotId] = {
                    id: schedule.id,
                    subject: schedule.subject?.name || schedule.subject?.subject_name,
                    teacher: schedule.teacher?.name,
                    room: schedule.room,
                    subject_id: schedule.subject?.id,
                    teacher_id: schedule.teacher?.id,
                    time_slot_id: timeSlotId,
                    attendance_status: schedule.attendance_status,
                    attendance_text: schedule.attendance_text
                  }
                }
              })
              
              return { childId: child.id, scheduleData: gridData }
            } catch (error) {
              console.error(`❌ Error loading schedule for ${child.name}:`, error)
              return { childId: child.id, scheduleData: {} }
            }
          }
          return { childId: child.id, scheduleData: {} }
        })
        
        const schedulesResults = await Promise.all(schedulesPromises)
        
        // Расписаниелерди state'ке сактоо
        const schedulesMap = {}
        schedulesResults.forEach(result => {
          schedulesMap[result.childId] = result.scheduleData
        })
        setChildrenSchedules(schedulesMap)
        
        await loadTimeSlots()
        
        console.log('✅ Бардык балдардын расписаниелери жүктөлдү')
      } else {
        console.log('⚠️ Ата-энеге эч кандай бала байланышкан эмес')
        alert('Сизге эч кандай студент байланышкан эмес. Администратор менен байланышыңыз.')
      }
    } catch (error) {
      console.error('❌ Ата-эне расписаниесин жүктөөдө ката:', error)
      alert('Расписаниени жүктөөдө ката чыкты')
    } finally {
      setLoading(false)
    }
  }

  const loadCourses = async () => {
    try {
      const response = await api.get('/v1/courses/')
      const data = response.data
      // API массив же объект кайтарышы мүмкүн
      if (Array.isArray(data)) {
        setCourses(data)
      } else if (data && Array.isArray(data.results)) {
        setCourses(data.results)
      } else {
        setCourses([])
      }
    } catch (error) {
      console.error('Курстарды жүктөөдө ката:', error)
      setCourses([])
    }
  }

  const loadGroups = async (courseId) => {
    try {
      console.log('🔄 Группаларды жүктөө, курс ID:', courseId)
      const response = await api.get(`/v1/groups/?course=${courseId}`)
      const data = response.data
      console.log('📦 Группалар жоопу:', data)
      
      if (Array.isArray(data)) {
        setGroups(data)
        console.log('✅ Группалар жүктөлдү:', data.length)
      } else if (data && Array.isArray(data.results)) {
        setGroups(data.results)
        console.log('✅ Группалар жүктөлдү:', data.results.length)
      } else {
        setGroups([])
        console.log('⚠️ Группалар табылган жок')
      }
    } catch (error) {
      console.error('❌ Группаларды жүктөөдө ката:', error)
      setGroups([])
    }
  }

  const loadSubjects = async () => {
    try {
      const response = await api.get('/v1/subjects/')
      const data = response.data
      if (Array.isArray(data)) {
        setSubjects(data)
      } else if (data && Array.isArray(data.results)) {
        setSubjects(data.results)
      } else {
        setSubjects([])
      }
    } catch (error) {
      console.error('Сабактарды жүктөөдө ката:', error)
      setSubjects([])
    }
  }

  const loadTeachers = async () => {
    try {
      const response = await api.get('/v1/teachers/')
      const data = response.data
      if (Array.isArray(data)) {
        setTeachers(data)
      } else if (data && Array.isArray(data.results)) {
        setTeachers(data.results)
      } else {
        setTeachers([])
      }
    } catch (error) {
      console.error('Мугалимдерди жүктөөдө ката:', error)
      setTeachers([])
    }
  }

  const loadTimeSlots = async () => {
    try {
      const response = await api.get('/v1/timeslots/')
      const data = response.data
      if (Array.isArray(data) && data.length > 0) {
        setTimeSlots(data)
        return
      }
    } catch (error) {
      console.log('TimeSlot API жок, дефолт убакыттарды колдонобуз')
    }
    
    // Дефолт убакыт слоттарын колдонобуз (API жок болсо)
    setTimeSlots([
      { id: 1, name: '1-пара', start_time: '08:00', end_time: '09:30' },
      { id: 2, name: '2-пара', start_time: '09:40', end_time: '11:10' },
      { id: 3, name: '3-пара', start_time: '11:20', end_time: '12:50' },
      { id: 4, name: '4-пара', start_time: '13:30', end_time: '15:00' },
      { id: 5, name: '5-пара', start_time: '15:10', end_time: '16:40' }
    ])
  }

  const loadSchedule = async (groupId) => {
    setLoading(true)
    try {
      console.log('📡 Loading schedule for group:', groupId)
      const response = await api.get(`/v1/schedules/?group=${groupId}`)
      const data = response.data
      console.log('📊 Raw API response:', data)
      
      // API жоопту текшерүү
      let schedules = []
      if (Array.isArray(data)) {
        schedules = data
      } else if (data && Array.isArray(data.results)) {
        schedules = data.results
      }
      console.log('✅ Parsed schedules array:', schedules)
      
      // Расписаниени grid форматына которуу
      const gridData = {}
      Object.keys(days).forEach(day => {
        gridData[day] = {}
      })

      schedules.forEach(schedule => {
        const day = schedule.day
        const timeSlotId = schedule.time_slot?.id || schedule.time_slot_id
        
        console.log(`📌 Processing schedule: day=${day}, timeSlot=${timeSlotId}`, schedule)
        
        if (day && timeSlotId) {
          gridData[day][timeSlotId] = {
            id: schedule.id,
            subject: schedule.subject?.name || schedule.subject?.subject_name,
            teacher: schedule.teacher?.name,
            room: schedule.room,
            subject_id: schedule.subject?.id,
            teacher_id: schedule.teacher?.id,
            time_slot_id: timeSlotId,
            // Attendance маалыматын кошуу (студент жана ата-эне үчүн)
            attendance_status: schedule.attendance_status,
            attendance_text: schedule.attendance_text
          }
        }
      })

      console.log('🔄 Final gridData:', gridData)
      setScheduleData(gridData)
    } catch (error) {
      console.error('Расписаниени жүктөөдө ката:', error)
      setScheduleData({})
    } finally {
      setLoading(false)
    }
  }

  // Модал функциялары
  const openAddLessonModal = (timeSlotId, day) => {
    if (!canEdit) return
    
    setCurrentLesson(null)
    setLessonForm({
      subject_id: '',
      teacher_id: '',
      room: '',
      time_slot_id: timeSlotId,
      day: day
    })
    setShowLessonModal(true)
  }

  const openEditLessonModal = (lesson) => {
    if (!canEdit) return
    
    setCurrentLesson(lesson)
    setLessonForm({
      subject_id: lesson.subject_id || '',
      teacher_id: lesson.teacher_id || '',
      room: lesson.room || '',
      time_slot_id: lesson.time_slot_id || '',
      day: ''
    })
    setShowLessonModal(true)
  }

  // Сабак тандаганда автоматтык мугалимди тандоо
  const handleSubjectChange = (subjectId) => {
    const selectedSubject = subjects.find(s => s.id === parseInt(subjectId))
    
    if (selectedSubject && selectedSubject.teacher) {
      setLessonForm(prev => ({ 
        ...prev, 
        subject_id: subjectId,
        teacher_id: selectedSubject.teacher.id 
      }))
    } else {
      setLessonForm(prev => ({ 
        ...prev, 
        subject_id: subjectId,
        teacher_id: '' 
      }))
    }
  }

  const saveLesson = async () => {
    try {
      const payload = {
        subject_id: parseInt(lessonForm.subject_id),
        group_id: parseInt(selectedGroup),
        teacher_id: lessonForm.teacher_id ? parseInt(lessonForm.teacher_id) : null,
        room: lessonForm.room || '',
        time_slot_id: parseInt(lessonForm.time_slot_id),
        day: lessonForm.day
      }

      console.log('💾 Saving lesson with payload:', payload)

      if (currentLesson) {
        // Өзгөртүү
        const response = await api.patch(`/v1/schedules/${currentLesson.id}/`, payload)
        console.log('✅ Lesson updated:', response.data)
      } else {
        // Жаңы кошуу
        const response = await api.post('/v1/schedules/', payload)
        console.log('✅ Lesson created:', response.data)
      }

      setShowLessonModal(false)
      console.log('🔄 Reloading schedule for group:', selectedGroup)
      loadSchedule(selectedGroup)
    } catch (error) {
      console.error('❌ Сабакты сактоодо ката:', error)
      alert('Катаны текшериңиз: ' + (error.response?.data?.detail || error.message))
    }
  }

  const deleteLesson = async (lessonId) => {
    if (!confirm('Бул сабакты өчүрөсүзбү?')) return

    try {
      await api.delete(`/v1/schedules/${lessonId}/`)
      loadSchedule(selectedGroup)
    } catch (error) {
      console.error('Сабакты өчүрүүдө ката:', error)
      alert('Өчүрүүдө ката чыкты')
    }
  }

  // === ATTENDANCE ФУНКЦИЯЛАРЫ ===
  
  // Мугалимдин бүгүнкү сабагын текшерүү
  const isTeacherTodayLesson = (lesson) => {
    if (user?.role !== 'TEACHER') return false
    
    // Бүгүнкү күндү аныктоо
    const today = new Date()
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const todayName = daysOfWeek[today.getDay()]
    
    // Сабактын күнү бүгүн бекен жана мугалим өзүбү текшерүү
    return lesson.day === todayName && lesson.teacher_id === user.teacher_id
  }
  
  const openAttendanceModal = async (lessonId, lesson) => {
    if (user?.role !== 'TEACHER') {
      alert('Катышууну белгилөө мугалимдер үчүн гана')
      return
    }
    
    // Бүгүнкү сабак экенин жана мугалимдики экенин текшерүү
    if (!isTeacherTodayLesson(lesson)) {
      alert('Сиз өзүңүздүн бүгүнкү сабагыңызга гана жоктоо белгилей аласыз')
      return
    }

    setCurrentLessonId(lessonId)
    setShowAttendanceModal(true)
    
    try {
      // Студенттерди жүктөө
      const response = await api.get(`/v1/schedules/${lessonId}/students/`)
      const studentsList = response.data.students || []
      
      setStudents(studentsList)
      
      // Баштапкы статустарды коюу
      const initialAttendance = {}
      studentsList.forEach(student => {
        initialAttendance[student.id] = student.current_status || 'Present'
      })
      setAttendanceData(initialAttendance)
    } catch (error) {
      console.error('Студенттерди жүктөөдө ката:', error)
      alert('Студенттерди жүктөөдө ката чыкты')
      setShowAttendanceModal(false)
    }
  }

  const saveAttendance = async () => {
    if (!currentLessonId || Object.keys(attendanceData).length === 0) {
      alert('Жоктоо маалыматы жок')
      return
    }

    try {
      const today = new Date().toISOString().split('T')[0]
      
      // Find the lesson to get schedule details
      let scheduleInfo = null
      Object.values(scheduleData).forEach(daySchedule => {
        Object.values(daySchedule).forEach(lesson => {
          if (lesson.id === currentLessonId) {
            scheduleInfo = lesson
          }
        })
      })

      if (!scheduleInfo) {
        alert('Сабак маалыматы табылган жок')
        return
      }

      const attendanceRecords = Object.entries(attendanceData).map(([studentId, status]) => ({
        student_id: parseInt(studentId),
        status: status,
        date: today,
        subject_id: scheduleInfo.subject_id,
        time_slot_id: scheduleInfo.time_slot_id,
        schedule_id: currentLessonId
      }))

      await api.post('/v1/attendance/bulk/', {
        attendance_records: attendanceRecords
      })

      alert('✅ Катышуу ийгиликтүү сакталды!')
      setShowAttendanceModal(false)
      setStudents([])
      setAttendanceData({})
      setCurrentLessonId(null)
    } catch (error) {
      console.error('Катышууну сактоодо ката:', error)
      alert('❌ Ката чыкты: ' + (error.response?.data?.error || error.message))
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Жүктөлүүдө...</p>
      </div>
    )
  }

  return (
    <div className="schedule-container">
      {/* Башкы */}
      
      {/* Курс жана Группа тандоо - ADMIN/MANAGER/TEACHER үчүн */}
      {canViewAll && (
        <div className="filters-section">
          {/* Курс тандоо */}
          <div className="filter-step">
            <label className="filter-label">Курсту тандаңыз:</label>
            <div className="course-buttons" id="courseButtons">
              {courses.map(course => (
                <button
                  key={course.id}
                  className={`course-btn ${selectedCourse == course.id ? 'active' : ''}`}
                  data-course-id={course.id}
                  onClick={() => setSelectedCourse(course.id)}
                >
                  {course.year}-курс
                </button>
              ))}
            </div>
          </div>

          {/* Группа тандоо */}
          {selectedCourse && groups.length > 0 && (
            <div className="filter-step group-section" id="groupSection">
              <label className="filter-label">Группаны тандаңыз:</label>
              <div className="group-buttons" id="groupButtons">
                {groups.map(group => (
                  <button
                    key={group.id}
                    className={`group-btn ${selectedGroup == group.id ? 'active' : ''}`}
                    data-group-id={group.id}
                    onClick={() => setSelectedGroup(group.id)}
                  >
                    👥 {group.name} <small>({group.student_count || 0} студент)</small>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Студент үчүн маалымат */}
      {user?.role === 'STUDENT' && selectedGroup && (
        <div className="student-schedule-info">
          <div className="info-card">
            <i className="fas fa-info-circle"></i>
            <p>Сиздин группаңыздын 1 жумалык расписаниеси жана акыркы жумадагы катышуу тартибиңиз</p>
          </div>
        </div>
      )}

      {/* Ата-эне үчүн маалымат */}
      {user?.role === 'PARENT' && myChildren.length > 0 && (
        <div className="student-schedule-info">
          <div className="info-card">
            <i className="fas fa-users"></i>
            <p>Балдарыңыздын 1 жумалык расписаниелери жана акыркы жумадагы катышуу тартиби</p>
          </div>
        </div>
      )}

      {/* Мугалим үчүн маалымат */}
      {user?.role === 'TEACHER' && selectedGroup && (
        <div className="student-schedule-info">
          <div className="info-card teacher-info">
            <i className="fas fa-chalkboard-teacher"></i>
            <p>📋 Сиз бардык расписаниени көрө аласыз. Өзүңүздүн бүгүнкү сабагыңызга гана жоктоо белгилей аласыз.</p>
          </div>
        </div>
      )}

      {/* Расписание таблицасы - Ата-эне үчүн (ар бир бала үчүн өзүнчө) */}
      {user?.role === 'PARENT' && myChildren.length > 0 && (
        <>
          {myChildren.map((child) => {
            const childSchedule = childrenSchedules[child.id] || {}
            
            return (
              <div key={child.id} className="schedule-grid-container" style={{ marginBottom: '40px' }}>
                <div className="child-schedule-header" style={{
                  padding: '15px 20px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  borderRadius: '12px 12px 0 0',
                  marginBottom: '0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.3rem' }}>
                      👤 {child.name}
                    </h3>
                    <p style={{ margin: '5px 0 0 0', opacity: 0.9, fontSize: '0.95rem' }}>
                      📚 {child.group?.name || 'Группасыз'}
                    </p>
                  </div>
                </div>
                
                <div className="schedule-grid" style={{ borderRadius: '0 0 12px 12px' }}>
                  {/* Header Row */}
                  <div className="schedule-cell header-cell">Убакыт</div>
                  {Object.keys(days).map(dayKey => (
                    <div key={dayKey} className="schedule-cell header-cell">
                      {days[dayKey]}
                    </div>
                  ))}

                  {/* Time Slots & Lessons */}
                  {timeSlots.map(timeSlot => (
                    <Fragment key={`child-${child.id}-slot-${timeSlot.id}`}>
                      <div className="schedule-cell time-cell">
                        <strong>{timeSlot.name}</strong><br/>
                        <small>{timeSlot.start_time} - {timeSlot.end_time}</small>
                      </div>

                      {Object.keys(days).map(dayKey => {
                        const lesson = childSchedule[dayKey]?.[timeSlot.id]

                        return lesson ? (
                          <div
                            key={`child-${child.id}-${dayKey}-${timeSlot.id}`}
                            className="schedule-cell lesson-cell"
                          >
                            <div className="lesson-title">{lesson.subject}</div>
                            <div className="lesson-teacher">👨‍🏫 {lesson.teacher}</div>
                            <div className="lesson-room">📍 {lesson.room || 'Белгиленген эмес'}</div>
                            
                            {/* Attendance маалыматы - ар дайым көрсөтүлөт */}
                            <div className={`lesson-attendance ${
                              lesson.attendance_status === 'Present' ? 'attendance-present' :
                              lesson.attendance_status === 'Absent' ? 'attendance-absent' :
                              lesson.attendance_status === 'Late' ? 'attendance-late' :
                              'attendance-unknown'
                            }`}>
                              {lesson.attendance_status === 'Present' && '✅ '}
                              {lesson.attendance_status === 'Absent' && '❌ '}
                              {lesson.attendance_status === 'Late' && '⏰ '}
                              {lesson.attendance_text || 'Белгилене элек'}
                            </div>
                          </div>
                        ) : (
                          <div
                            key={`child-${child.id}-${dayKey}-${timeSlot.id}`}
                            className="schedule-cell empty-cell"
                            style={{ cursor: 'default' }}
                          >
                            Эркин убакыт
                          </div>
                        )
                      })}
                    </Fragment>
                  ))}
                </div>
              </div>
            )
          })}
        </>
      )}

      {/* Расписание таблицасы - Студент/Мугалим/Админ үчүн */}
      {user?.role !== 'PARENT' && selectedGroup && (
        <div className="schedule-grid-container">
          <div className="schedule-grid">
            {/* Header Row */}
            <div className="schedule-cell header-cell">Убакыт</div>
            {Object.keys(days).map(dayKey => (
              <div key={dayKey} className="schedule-cell header-cell">
                {days[dayKey]}
              </div>
            ))}

            {/* Time Slots & Lessons */}
            {timeSlots.map(timeSlot => (
              <Fragment key={`slot-${timeSlot.id}`}>
                <div className="schedule-cell time-cell">
                  <strong>{timeSlot.name}</strong><br/>
                  <small>{timeSlot.start_time} - {timeSlot.end_time}</small>
                </div>

                {Object.keys(days).map(dayKey => {
                  const lesson = scheduleData[dayKey]?.[timeSlot.id]

                  return lesson ? (
                    <div
                      key={`${dayKey}-${timeSlot.id}`}
                      className="schedule-cell lesson-cell"
                    >
                      {canEdit && (
                        <>
                          <button
                            className="action-btn edit-btn"
                            onClick={() => openEditLessonModal(lesson)}
                            title="Өзгөртүү"
                          >✏️</button>
                          <button
                            className="action-btn delete-btn"
                            onClick={() => deleteLesson(lesson.id)}
                            title="Өчүрүү"
                          >🗑️</button>
                        </>
                      )}
                      {user?.role === 'TEACHER' && isTeacherTodayLesson({...lesson, day: dayKey}) && (
                        <button
                          className="action-btn attendance-btn"
                          onClick={() => openAttendanceModal(lesson.id, {...lesson, day: dayKey})}
                          title="Жоктоо белгилөө (бүгүнкү сабак)"
                        >📋</button>
                      )}
                      <div className="lesson-title">{lesson.subject}</div>
                      {lesson.group && user?.role === 'TEACHER' && (
                        <div className="lesson-group">👥 {lesson.group}</div>
                      )}
                      {lesson.teacher && user?.role !== 'TEACHER' && (
                        <div className="lesson-teacher">👨‍🏫 {lesson.teacher}</div>
                      )}
                      <div className="lesson-room">📍 {lesson.room || 'Белгиленген эмес'}</div>
                      
                      {/* Attendance маалыматы - студент жана ата-эне үчүн */}
                      {(user?.role === 'STUDENT' || user?.role === 'PARENT') && (
                        <div className={`lesson-attendance ${
                          lesson.attendance_status === 'Present' ? 'attendance-present' :
                          lesson.attendance_status === 'Absent' ? 'attendance-absent' :
                          lesson.attendance_status === 'Late' ? 'attendance-late' :
                          'attendance-unknown'
                        }`}>
                          {lesson.attendance_status === 'Present' && '✅ '}
                          {lesson.attendance_status === 'Absent' && '❌ '}
                          {lesson.attendance_status === 'Late' && '⏰ '}
                          {lesson.attendance_text || 'Белгилене элек'}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      key={`${dayKey}-${timeSlot.id}`}
                      className="schedule-cell empty-cell"
                      onClick={() => canEdit && openAddLessonModal(timeSlot.id, dayKey)}
                      style={{ cursor: canEdit ? 'pointer' : 'default' }}
                    >
                      {canEdit && (
                        <button
                          className="action-btn add-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            openAddLessonModal(timeSlot.id, dayKey)
                          }}
                          title="Кошуу"
                        >➕</button>
                      )}
                      Эркин убакыт
                    </div>
                  )
                })}
              </Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Сабак кошуу/өзгөртүү модалы */}
      {showLessonModal && (
        <div className="modal" onClick={() => setShowLessonModal(false)}>
          <div className="modal-content lesson-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {currentLesson ? '✏️ Сабакты өзгөртүү' : '📚 Жаңы сабак кошуу'}
              </h3>
              <button className="close-btn" onClick={() => setShowLessonModal(false)}>&times;</button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">📖 Сабак:</label>
                <select
                  className="form-select"
                  value={lessonForm.subject_id}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  required
                >
                  <option value="">Сабакты тандаңыз...</option>
                  {subjects.map(subject => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name || subject.subject_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">👨‍🏫 Мугалим:</label>
                <select
                  className="form-select"
                  value={lessonForm.teacher_id}
                  onChange={(e) => setLessonForm({...lessonForm, teacher_id: e.target.value})}
                >
                  <option value="">Мугалимди тандаңыз...</option>
                  {teachers.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">📍 Кабинет:</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="304, Lab-1, Ауд-205..."
                  value={lessonForm.room}
                  onChange={(e) => setLessonForm({...lessonForm, room: e.target.value})}
                />
                <small className="form-text">Кабинет белгиленбесе, "Белгиленген эмес" деп чыгат</small>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowLessonModal(false)}
              >
                Жокко чыгаруу
              </button>
              <button 
                className="btn btn-primary" 
                onClick={saveLesson}
                disabled={!lessonForm.subject_id}
              >
                💾 Сактоо
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Эгер эч нерсе тандалбаса */}
      {!selectedGroup && canViewAll && (
        <div className="empty-state">
          <i className="fas fa-calendar-times"></i>
          <p>Расписаниени көрүү үчүн курс жана группа тандаңыз</p>
        </div>
      )}

      {/* Келүү-кетүү белгилөө модалы */}
      {showAttendanceModal && (
        <div className="modal" onClick={() => setShowAttendanceModal(false)}>
          <div className="modal-content attendance-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">📋 Студенттердин катышуусун белгилөө</h3>
              <button className="close-btn" onClick={() => setShowAttendanceModal(false)}>&times;</button>
            </div>

            <div className="students-list">
              {students.length === 0 ? (
                <div className="empty-state">
                  <p>Студенттер жүктөлүүдө...</p>
                </div>
              ) : (
                students.map((student, index) => (
                  <div key={student.id} className="student-item">
                    <div className="student-name">
                      {index + 1}. {student.name || student.full_name || `Студент #${student.id}`}
                      {student.is_marked && ' 🔒'}
                    </div>
                    
                    {student.is_marked && (
                      <div className="marked-info">
                        ✅ Белгиленген: {student.marked_at} ({student.marked_by})
                      </div>
                    )}
                    
                    <div className={`attendance-buttons ${student.is_marked ? 'disabled' : ''}`}>
                      <button
                        type="button"
                        className={`status-btn present ${attendanceData[student.id] === 'Present' ? 'active' : ''}`}
                        onClick={() => !student.is_marked && setAttendanceData({...attendanceData, [student.id]: 'Present'})}
                        disabled={student.is_marked}
                      >
                        ✅ Келди
                      </button>
                      <button
                        type="button"
                        className={`status-btn late ${attendanceData[student.id] === 'Late' ? 'active' : ''}`}
                        onClick={() => !student.is_marked && setAttendanceData({...attendanceData, [student.id]: 'Late'})}
                        disabled={student.is_marked}
                      >
                        ⏰ Кечикти
                      </button>
                      <button
                        type="button"
                        className={`status-btn absent ${attendanceData[student.id] === 'Absent' ? 'active' : ''}`}
                        onClick={() => !student.is_marked && setAttendanceData({...attendanceData, [student.id]: 'Absent'})}
                        disabled={student.is_marked}
                      >
                        ❌ Келбеди
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* <div className="attendance-summary">
              <div className="summary-item summary-present">
                <div className="summary-number">
                  {Object.values(attendanceData).filter(s => s === 'Present').length}
                </div>
                <div className="summary-label">Келди</div>
              </div>
              <div className="summary-item summary-late">
                <div className="summary-number">
                  {Object.values(attendanceData).filter(s => s === 'Late').length}
                </div>
                <div className="summary-label">Кечикти</div>
              </div>
              <div className="summary-item summary-absent">
                <div className="summary-number">
                  {Object.values(attendanceData).filter(s => s === 'Absent').length}
                </div>
                <div className="summary-label">Келбеди</div>
              </div>
            </div> */}

            <div className="modal-footer">
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowAttendanceModal(false)}
              >
                Жабуу
              </button>
              <button 
                className="btn btn-primary" 
                onClick={saveAttendance}
                disabled={Object.keys(attendanceData).length === 0}
              >
                💾 Сактоо
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Schedule
