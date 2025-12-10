import React, { useState, useEffect, Fragment } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';

const { width } = Dimensions.get('window');

const ScheduleScreen = () => {
  const { user, updateUser } = useAuth();
  
  
  // Башкы state
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [courses, setCourses] = useState([]);
  const [groups, setGroups] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  
  // Тандоолор
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  
  // Расписание маалыматы
  const [scheduleData, setScheduleData] = useState({});
  
  // Ата-эне үчүн балдардын тизмеси
  const [myChildren, setMyChildren] = useState([]);
  const [childrenSchedules, setChildrenSchedules] = useState({});
  
  // Модалдар
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [lessonForm, setLessonForm] = useState({
    subject_id: '',
    teacher_id: '',
    room: '',
    time_slot_id: '',
    day: ''
  });
  
  // Attendance модалы
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [currentLessonId, setCurrentLessonId] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  
  // Дни недели
  const days = {
    Monday: { short: 'Дүй', full: 'Дүйшөмбү' },
    Tuesday: { short: 'Шей', full: 'Шейшемби' },
    Wednesday: { short: 'Шар', full: 'Шаршемби' },
    Thursday: { short: 'Бей', full: 'Бейшемби' },
    Friday: { short: 'Жум', full: 'Жума' },
    Saturday: { short: 'Ише', full: 'Ишемби' }
  };

  const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Уруксаттар
  const canEdit = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const canViewAll = user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'TEACHER';

  // Refresh функциясы
  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Загрузка данных
  const loadData = async () => {
    try {
      await loadTimeSlots();
      
      if (user?.role === 'TEACHER') {
        await loadTeacherSchedule();
      } else if (user?.role === 'STUDENT') {
        await loadStudentSchedule();
      } else if (user?.role === 'PARENT') {
        await loadParentSchedule();
      } else if (canViewAll) {
        await loadCourses();
      }
    } catch (error) {
      console.error('Data loading error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    
    if (user?.role === 'TEACHER' && !user.teacher_id) {
      fetchTeacherId();
    }
  }, [user]);

  // Курс тандалганда группаларды жүктөө
  useEffect(() => {
    if (selectedCourse) {
      loadGroups(selectedCourse);
      setSelectedGroup('');
    } else {
      setGroups([]);
      setSelectedGroup('');
    }
  }, [selectedCourse]);

  // Группа тандалганда расписание жүктөө
  useEffect(() => {
    if (selectedGroup && canViewAll) {
      loadSchedule(selectedGroup);
      loadSubjects();
      loadTeachers();
    }
  }, [selectedGroup]);

  // Teacher ID алуу
  const fetchTeacherId = async () => {
    try {
      const response = await api.get('/v1/profile/update/');
      if (response.data.teacher_id) {
        const updatedUser = { ...user, teacher_id: response.data.teacher_id };
        updateUser(updatedUser);
      }
    } catch (error) {
      console.error('Teacher ID алууда ката:', error);
    }
  };

  // API функциялары
  const loadTeacherSchedule = async () => {
    try {
      setLoading(true);
      
      const profileResponse = await api.get('/v1/profile/update/');
      const profileData = profileResponse.data;
      
      const teachersResponse = await api.get('/v1/teachers/');
      const teachersList = teachersResponse.data.results || teachersResponse.data || [];
      
      const currentTeacher = teachersList.find(t => t.user && t.user.id === user.id);
      
      if (!currentTeacher) {
        Alert.alert('Ката', 'Мугалим профили табылган жок');
        setLoading(false);
        return;
      }
      
      const schedulesResponse = await api.get(`/v1/schedules/?teacher=${currentTeacher.id}`);
      const mySchedules = schedulesResponse.data.results || schedulesResponse.data || [];
      
      const gridData = {};
      daysOrder.forEach(day => {
        gridData[day] = {};
      });

      mySchedules.forEach(schedule => {
        const day = schedule.day;
        const timeSlotId = schedule.time_slot?.id || schedule.time_slot_id;
        
        if (day && timeSlotId) {
          gridData[day][timeSlotId] = {
            id: schedule.id,
            subject: schedule.subject?.name || schedule.subject?.subject_name,
            teacher: schedule.teacher?.name,
            room: schedule.room,
            group: schedule.group?.name,
            subject_id: schedule.subject?.id,
            teacher_id: schedule.teacher?.id,
            time_slot_id: timeSlotId,
            attendance_status: schedule.attendance_status,
            attendance_text: schedule.attendance_text
          };
        }
      });

      setScheduleData(gridData);
      await loadSubjects();
      await loadTeachers();
    } catch (error) {
      console.error('Мугалим расписаниесин жүктөөдө ката:', error);
      Alert.alert('Ката', 'Расписаниени жүктөөдө ката чыкты');
    } finally {
      setLoading(false);
    }
  };

  const loadStudentSchedule = async () => {
    try {
      setLoading(true);
      
      const profileResponse = await api.get('/v1/profile/update/');
      const profileData = profileResponse.data;
      
      if (profileData.group && profileData.group.id) {
        const groupId = profileData.group.id;
        
        if (profileData.group.course && profileData.group.course.id) {
          setSelectedCourse(profileData.group.course.id);
        }
        
        setSelectedGroup(groupId);
        await loadSchedule(groupId);
        await loadSubjects();
        await loadTeachers();
      } else {
        Alert.alert('Ката', 'Сиз али группага киргизилген эмессиз');
      }
    } catch (error) {
      console.error('Студент расписаниесин жүктөөдө ката:', error);
      Alert.alert('Ката', 'Расписаниени жүктөөдө ката чыкты');
    } finally {
      setLoading(false);
    }
  };

  const loadParentSchedule = async () => {
    try {
      setLoading(true);
      
      const statsResponse = await api.get('/v1/dashboard/stats/');
      const statsData = statsResponse.data;
      const children = statsData.my_children || [];
      
      if (children.length > 0) {
        setMyChildren(children);
        
        const schedulesPromises = children.map(async (child) => {
          if (child.group && child.group.id) {
            try {
              const response = await api.get(`/v1/schedules/?group=${child.group.id}`);
              const data = response.data;
              
              let schedules = [];
              if (Array.isArray(data)) {
                schedules = data;
              } else if (data && Array.isArray(data.results)) {
                schedules = data.results;
              }
              
              const gridData = {};
              daysOrder.forEach(day => {
                gridData[day] = {};
              });

              schedules.forEach(schedule => {
                const day = schedule.day;
                const timeSlotId = schedule.time_slot?.id || schedule.time_slot_id;
                
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
                  };
                }
              });
              
              return { childId: child.id, scheduleData: gridData };
            } catch (error) {
              console.error(`Error loading schedule for ${child.name}:`, error);
              return { childId: child.id, scheduleData: {} };
            }
          }
          return { childId: child.id, scheduleData: {} };
        });
        
        const schedulesResults = await Promise.all(schedulesPromises);
        const schedulesMap = {};
        schedulesResults.forEach(result => {
          schedulesMap[result.childId] = result.scheduleData;
        });
        setChildrenSchedules(schedulesMap);
      } else {
        Alert.alert('Ката', 'Сизге эч кандай студент байланышкан эмес');
      }
    } catch (error) {
      console.error('Ата-эне расписаниесин жүктөөдө ката:', error);
      Alert.alert('Ката', 'Расписаниени жүктөөдө ката чыкты');
    } finally {
      setLoading(false);
    }
  };

  const loadCourses = async () => {
    try {
      const response = await api.get('/v1/courses/');
      const data = response.data;
      
      if (Array.isArray(data)) {
        setCourses(data);
      } else if (data && Array.isArray(data.results)) {
        setCourses(data.results);
      } else {
        setCourses([]);
      }
    } catch (error) {
      console.error('Курстарды жүктөөдө ката:', error);
      setCourses([]);
    }
  };

  const loadGroups = async (courseId) => {
    try {
      const response = await api.get(`/v1/groups/?course=${courseId}`);
      const data = response.data;
      
      if (Array.isArray(data)) {
        setGroups(data);
      } else if (data && Array.isArray(data.results)) {
        setGroups(data.results);
      } else {
        setGroups([]);
      }
    } catch (error) {
      console.error('Группаларды жүктөөдө ката:', error);
      setGroups([]);
    }
  };

  const loadSubjects = async () => {
    try {
      const response = await api.get('/v1/subjects/');
      const data = response.data;
      
      if (Array.isArray(data)) {
        setSubjects(data);
      } else if (data && Array.isArray(data.results)) {
        setSubjects(data.results);
      } else {
        setSubjects([]);
      }
    } catch (error) {
      console.error('Сабактарды жүктөөдө ката:', error);
      setSubjects([]);
    }
  };

  const loadTeachers = async () => {
    try {
      const response = await api.get('/v1/teachers/');
      const data = response.data;
      
      if (Array.isArray(data)) {
        setTeachers(data);
      } else if (data && Array.isArray(data.results)) {
        setTeachers(data.results);
      } else {
        setTeachers([]);
      }
    } catch (error) {
      console.error('Мугалимдерди жүктөөдө ката:', error);
      setTeachers([]);
    }
  };

  const loadTimeSlots = async () => {
    try {
      const response = await api.get('/v1/timeslots/');
      const data = response.data;
      
      if (Array.isArray(data) && data.length > 0) {
        setTimeSlots(data);
        return;
      }
    } catch (error) {
      console.log('TimeSlot API жок, дефолт убакыттарды колдонобуз');
    }
    
    // Дефолт убакыт слоттары
    setTimeSlots([
      { id: 1, name: '1-пара', start_time: '08:00', end_time: '09:30' },
      { id: 2, name: '2-пара', start_time: '09:40', end_time: '11:10' },
      { id: 3, name: '3-пара', start_time: '11:20', end_time: '12:50' },
      { id: 4, name: '4-пара', start_time: '13:30', end_time: '15:00' },
      { id: 5, name: '5-пара', start_time: '15:10', end_time: '16:40' }
    ]);
  };

  const loadSchedule = async (groupId) => {
    setLoading(true);
    try {
      const response = await api.get(`/v1/schedules/?group=${groupId}`);
      const data = response.data;
      
      let schedules = [];
      if (Array.isArray(data)) {
        schedules = data;
      } else if (data && Array.isArray(data.results)) {
        schedules = data.results;
      }
      
      const gridData = {};
      daysOrder.forEach(day => {
        gridData[day] = {};
      });

      schedules.forEach(schedule => {
        const day = schedule.day;
        const timeSlotId = schedule.time_slot?.id || schedule.time_slot_id;
        
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
          };
        }
      });

      setScheduleData(gridData);
    } catch (error) {
      console.error('Расписаниени жүктөөдө ката:', error);
      setScheduleData({});
    } finally {
      setLoading(false);
    }
  };

  // Модал функциялары
  const openAddLessonModal = (timeSlotId, day) => {
    if (!canEdit) return;
    
    setCurrentLesson(null);
    setLessonForm({
      subject_id: '',
      teacher_id: '',
      room: '',
      time_slot_id: timeSlotId,
      day: day
    });
    setShowLessonModal(true);
  };

  const openEditLessonModal = (lesson) => {
    if (!canEdit) return;
    
    setCurrentLesson(lesson);
    setLessonForm({
      subject_id: lesson.subject_id || '',
      teacher_id: lesson.teacher_id || '',
      room: lesson.room || '',
      time_slot_id: lesson.time_slot_id || '',
      day: ''
    });
    setShowLessonModal(true);
  };

  const handleSubjectChange = (subjectId) => {
    const selectedSubject = subjects.find(s => s.id === parseInt(subjectId));
    
    if (selectedSubject && selectedSubject.teacher) {
      setLessonForm(prev => ({ 
        ...prev, 
        subject_id: subjectId,
        teacher_id: selectedSubject.teacher.id 
      }));
    } else {
      setLessonForm(prev => ({ 
        ...prev, 
        subject_id: subjectId,
        teacher_id: '' 
      }));
    }
  };

  const saveLesson = async () => {
    try {
      const payload = {
        subject_id: parseInt(lessonForm.subject_id),
        group_id: parseInt(selectedGroup),
        teacher_id: lessonForm.teacher_id ? parseInt(lessonForm.teacher_id) : null,
        room: lessonForm.room || '',
        time_slot_id: parseInt(lessonForm.time_slot_id),
        day: lessonForm.day
      };

      if (currentLesson) {
        await api.patch(`/v1/schedules/${currentLesson.id}/`, payload);
      } else {
        await api.post('/v1/schedules/', payload);
      }

      setShowLessonModal(false);
      loadSchedule(selectedGroup);
      Alert.alert('Ийгиликтүү!', 'Сабак сакталды');
    } catch (error) {
      console.error('Сабакты сактоодо ката:', error);
      Alert.alert('Ката', 'Сабакты сактоодо ката чыкты');
    }
  };

  const deleteLesson = async (lessonId) => {
    Alert.alert(
      'Ырас менен өчүрүү?',
      'Бул сабакты өчүрөсүзбү?',
      [
        { text: 'Жокко чыгаруу', style: 'cancel' },
        {
          text: 'Өчүрүү',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/v1/schedules/${lessonId}/`);
              loadSchedule(selectedGroup);
              Alert.alert('Ийгиликтүү', 'Сабак өчүрүлдү');
            } catch (error) {
              console.error('Сабакты өчүрүүдө ката:', error);
              Alert.alert('Ката', 'Өчүрүүдө ката чыкты');
            }
          }
        }
      ]
    );
  };

  // Attendance функциялары
  const isTeacherTodayLesson = (lesson, day) => {
    if (user?.role !== 'TEACHER') return false;
    
    const today = new Date();
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = daysOfWeek[today.getDay()];
    
    return day === todayName && lesson.teacher_id === user.teacher_id;
  };

  const openAttendanceModal = async (lessonId, lesson, day) => {
    if (user?.role !== 'TEACHER') {
      Alert.alert('Ката', 'Катышууну белгилөө мугалимдер үчүн гана');
      return;
    }
    
    if (!isTeacherTodayLesson(lesson, day)) {
      Alert.alert('Ката', 'Сиз өзүңүздүн бүгүнкү сабагыңызга гана жоктоо белгилей аласыз');
      return;
    }

    setCurrentLessonId(lessonId);
    setShowAttendanceModal(true);
    
    try {
      const response = await api.get(`/v1/schedules/${lessonId}/students/`);
      const studentsList = response.data.students || [];
      
      setStudents(studentsList);
      
      const initialAttendance = {};
      studentsList.forEach(student => {
        initialAttendance[student.id] = student.current_status || 'Present';
      });
      setAttendanceData(initialAttendance);
    } catch (error) {
      console.error('Студенттерди жүктөөдө ката:', error);
      Alert.alert('Ката', 'Студенттерди жүктөөдө ката чыкты');
      setShowAttendanceModal(false);
    }
  };

  const saveAttendance = async () => {
    if (!currentLessonId || Object.keys(attendanceData).length === 0) {
      Alert.alert('Ката', 'Жоктоо маалыматы жок');
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      
      let scheduleInfo = null;
      Object.values(scheduleData).forEach(daySchedule => {
        Object.values(daySchedule).forEach(lesson => {
          if (lesson.id === currentLessonId) {
            scheduleInfo = lesson;
          }
        });
      });

      if (!scheduleInfo) {
        Alert.alert('Ката', 'Сабак маалыматы табылган жок');
        return;
      }

      const attendanceRecords = Object.entries(attendanceData).map(([studentId, status]) => ({
        student_id: parseInt(studentId),
        status: status,
        date: today,
        subject_id: scheduleInfo.subject_id,
        time_slot_id: scheduleInfo.time_slot_id,
        schedule_id: currentLessonId
      }));

      await api.post('/v1/attendance/bulk/', {
        attendance_records: attendanceRecords
      });

      Alert.alert('Ийгиликтүү!', 'Катышуу ийгиликтүү сакталды!');
      setShowAttendanceModal(false);
      setStudents([]);
      setAttendanceData({});
      setCurrentLessonId(null);
    } catch (error) {
      console.error('Катышууну сактоодо ката:', error);
      Alert.alert('Ката', 'Сактоодо ката чыкты');
    }
  };

  // Attendance статусу боюнча цвет
  const getAttendanceColor = (status) => {
    switch (status) {
      case 'Present': return '#48bb78';
      case 'Absent': return '#f56565';
      case 'Late': return '#ed8936';
      default: return '#a0aec0';
    }
  };

  // Сабак карточкасы
  const renderLessonCard = (lesson, day, timeSlotId) => {
    if (!lesson) return null;

    return (
      <View style={styles.lessonCard}>
        <View style={styles.lessonHeader}>
          <Text style={styles.lessonSubject} numberOfLines={2}>
            {lesson.subject}
          </Text>
          {canEdit && (
            <View style={styles.lessonActions}>
              <TouchableOpacity 
                onPress={() => openEditLessonModal(lesson)}
                style={styles.actionButton}
              >
                <Icon name="pencil" size={16} color="#4299e1" />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => deleteLesson(lesson.id)}
                style={styles.actionButton}
              >
                <Icon name="trash" size={16} color="#f56565" />
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {lesson.teacher && user?.role !== 'TEACHER' && (
          <Text style={styles.lessonDetail} numberOfLines={1}>
            <Icon name="person" size={12} color="#718096" /> {lesson.teacher}
          </Text>
        )}
        
        {lesson.group && user?.role === 'TEACHER' && (
          <Text style={styles.lessonDetail} numberOfLines={1}>
            <Icon name="people" size={12} color="#718096" /> {lesson.group}
          </Text>
        )}
        
        <Text style={styles.lessonDetail} numberOfLines={1}>
          <Icon name="business" size={12} color="#718096" /> {lesson.room || 'Белгиленген эмес'}
        </Text>
        
        {/* Катышуу статусу */}
        {(user?.role === 'STUDENT' || user?.role === 'PARENT') && lesson.attendance_text && (
          <View style={[styles.attendanceBadge, { backgroundColor: getAttendanceColor(lesson.attendance_status) }]}>
            <Text style={styles.attendanceText}>
              {lesson.attendance_text}
            </Text>
          </View>
        )}
        
        {/* Мугалим үчүн жоктоо баскычы */}
        {user?.role === 'TEACHER' && isTeacherTodayLesson(lesson, day) && (
          <TouchableOpacity 
            style={styles.attendanceButton}
            onPress={() => openAttendanceModal(lesson.id, lesson, day)}
          >
            <Icon name="clipboard" size={14} color="#fff" />
            <Text style={styles.attendanceButtonText}>Жоктоо</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Свободная ячейка
  const renderEmptyCell = (timeSlotId, day) => {
    return (
      <TouchableOpacity 
        style={styles.emptyCell}
        onPress={() => canEdit && openAddLessonModal(timeSlotId, day)}
        disabled={!canEdit}
      >
        {canEdit && (
          <TouchableOpacity 
            style={styles.addButton}
            onPress={(e) => {
              e.stopPropagation();
              openAddLessonModal(timeSlotId, day);
            }}
          >
            <Icon name="add" size={20} color="#48bb78" />
          </TouchableOpacity>
        )}
        <Text style={styles.emptyCellText}>Бош</Text>
      </TouchableOpacity>
    );
  };

  // Детская расписание
  const renderChildSchedule = (child) => {
    const childSchedule = childrenSchedules[child.id] || {};

    return (
      <View key={child.id} style={styles.childScheduleContainer}>
        <View style={styles.childHeader}>
          <Icon name="person-circle" size={30} color="#667eea" />
          <View style={styles.childInfo}>
            <Text style={styles.childName}>{child.name}</Text>
            <Text style={styles.childGroup}>{child.group?.name}</Text>
          </View>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.scheduleTable}>
            {/* Header */}
            <View style={styles.tableHeader}>
              <View style={styles.timeSlotHeader}>
                <Text style={styles.headerText}>Убакыт</Text>
              </View>
              {daysOrder.map(day => (
                <View key={day} style={styles.dayHeader}>
                  <Text style={styles.headerText}>{days[day].short}</Text>
                </View>
              ))}
            </View>
            
            {/* Time slots */}
            {timeSlots.map(timeSlot => (
              <View key={timeSlot.id} style={styles.tableRow}>
                <View style={styles.timeSlotCell}>
                  <Text style={styles.timeSlotName}>{timeSlot.name}</Text>
                  <Text style={styles.timeSlotTime}>
                    {timeSlot.start_time} - {timeSlot.end_time}
                  </Text>
                </View>
                
                {daysOrder.map(day => {
                  const lesson = childSchedule[day]?.[timeSlot.id];
                  return (
                    <View key={`${day}-${timeSlot.id}`} style={styles.dayCell}>
                      {lesson ? (
                        <View style={styles.lessonCardSmall}>
                          <Text style={styles.lessonSubjectSmall} numberOfLines={2}>
                            {lesson.subject}
                          </Text>
                          {lesson.attendance_text && (
                            <View style={[
                              styles.attendanceBadgeSmall, 
                              { backgroundColor: getAttendanceColor(lesson.attendance_status) }
                            ]}>
                              <Text style={styles.attendanceTextSmall}>
                                {lesson.attendance_text.substring(0, 10)}
                              </Text>
                            </View>
                          )}
                        </View>
                      ) : (
                        <Text style={styles.emptyTextSmall}>-</Text>
                      )}
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  // Основное расписание
  const renderMainSchedule = () => {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.scheduleTable}>
          {/* Header */}
          <View style={styles.tableHeader}>
            <View style={styles.timeSlotHeader}>
              <Text style={styles.headerText}>Убакыт</Text>
            </View>
            {daysOrder.map(day => (
              <View key={day} style={styles.dayHeader}>
                <Text style={styles.headerText}>{days[day].short}</Text>
              </View>
            ))}
          </View>
          
          {/* Time slots */}
          {timeSlots.map(timeSlot => (
            <View key={timeSlot.id} style={styles.tableRow}>
              <View style={styles.timeSlotCell}>
                <Text style={styles.timeSlotName}>{timeSlot.name}</Text>
                <Text style={styles.timeSlotTime}>
                  {timeSlot.start_time} - {timeSlot.end_time}
                </Text>
              </View>
              
              {daysOrder.map(day => {
                const lesson = scheduleData[day]?.[timeSlot.id];
                return (
                  <View key={`${day}-${timeSlot.id}`} style={styles.dayCell}>
                    {lesson ? renderLessonCard(lesson, day, timeSlot.id) : renderEmptyCell(timeSlot.id, day)}
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  // Курс кнопкалары
  const renderCourseButtons = () => {
    return (
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Курсту тандаңыз:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.courseButtons}>
            {courses.map(course => (
              <TouchableOpacity
                key={course.id}
                style={[
                  styles.courseButton,
                  selectedCourse == course.id && styles.activeButton
                ]}
                onPress={() => setSelectedCourse(course.id)}
              >
                <Text style={[
                  styles.courseButtonText,
                  selectedCourse == course.id && styles.activeButtonText
                ]}>
                  {course.year}-курс
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  // Группа кнопкалары
  const renderGroupButtons = () => {
    return (
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Группаны тандаңыз:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.groupButtons}>
            {groups.map(group => (
              <TouchableOpacity
                key={group.id}
                style={[
                  styles.groupButton,
                  selectedGroup == group.id && styles.activeButton
                ]}
                onPress={() => setSelectedGroup(group.id)}
              >
                <Icon name="people" size={16} color={selectedGroup == group.id ? '#fff' : '#667eea'} />
                <Text style={[
                  styles.groupButtonText,
                  selectedGroup == group.id && styles.activeButtonText
                ]}>
                  {group.name}
                </Text>
                <Text style={styles.studentCount}>
                  ({group.student_count || 0} студент)
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  // Информационная карточка
  const renderInfoCard = () => {
    let message = '';
    
    switch (user?.role) {
      case 'STUDENT':
        message = 'Сиздин группаңыздын расписаниеси жана катышуу тартибиңиз';
        break;
      case 'PARENT':
        message = 'Балдарыңыздын расписаниелери жана катышуу тартиби';
        break;
      case 'TEACHER':
        message = 'Бардык расписаниени көрө аласыз. Өзүңүздүн бүгүнкү сабагыңызга гана жоктоо белгилей аласыз.';
        break;
    }

    return (
      <View style={styles.infoCard}>
        <Icon name="information-circle" size={24} color="#fff" />
        <Text style={styles.infoText}>{message}</Text>
      </View>
    );
  };

  // Lesson Modal компонент
  const renderLessonModal = () => (
    <Modal
      visible={showLessonModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowLessonModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {currentLesson ? '✏️ Сабакты өзгөртүү' : '📚 Жаңы сабак кошуу'}
            </Text>
            <TouchableOpacity onPress={() => setShowLessonModal(false)}>
              <Icon name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>📖 Сабак:</Text>
              <View style={styles.pickerContainer}>
                {/* React Native'де Picker компонентин колдонуңуз */}
                {subjects.map(subject => (
                  <TouchableOpacity
                    key={subject.id}
                    style={[
                      styles.optionButton,
                      lessonForm.subject_id == subject.id && styles.selectedOption
                    ]}
                    onPress={() => handleSubjectChange(subject.id)}
                  >
                    <Text style={[
                      styles.optionText,
                      lessonForm.subject_id == subject.id && styles.selectedOptionText
                    ]}>
                      {subject.name || subject.subject_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>👨‍🏫 Мугалим:</Text>
              <View style={styles.pickerContainer}>
                {teachers.map(teacher => (
                  <TouchableOpacity
                    key={teacher.id}
                    style={[
                      styles.optionButton,
                      lessonForm.teacher_id == teacher.id && styles.selectedOption
                    ]}
                    onPress={() => setLessonForm({...lessonForm, teacher_id: teacher.id})}
                  >
                    <Text style={[
                      styles.optionText,
                      lessonForm.teacher_id == teacher.id && styles.selectedOptionText
                    ]}>
                      {teacher.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>📍 Кабинет:</Text>
              <TextInput
                style={styles.input}
                placeholder="304, Lab-1, Ауд-205..."
                value={lessonForm.room}
                onChangeText={(text) => setLessonForm({...lessonForm, room: text})}
              />
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => setShowLessonModal(false)}
            >
              <Text style={styles.secondaryButtonText}>Жокко чыгаруу</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.primaryButton, !lessonForm.subject_id && styles.disabledButton]}
              onPress={saveLesson}
              disabled={!lessonForm.subject_id}
            >
              <Text style={styles.primaryButtonText}>💾 Сактоо</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Attendance Modal компонент
  const renderAttendanceModal = () => (
    <Modal
      visible={showAttendanceModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowAttendanceModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, styles.attendanceModal]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>📋 Студенттердин катышуусун белгилөө</Text>
            <TouchableOpacity onPress={() => setShowAttendanceModal(false)}>
              <Icon name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={students}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item, index }) => (
              <View style={styles.studentItem}>
                <Text style={styles.studentName}>
                  {index + 1}. {item.name || item.full_name}
                </Text>
                
                <View style={styles.attendanceButtons}>
                  {['Present', 'Late', 'Absent'].map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.attendanceStatusButton,
                        attendanceData[item.id] === status && styles.activeStatusButton,
                        { backgroundColor: getAttendanceColor(status) }
                      ]}
                      onPress={() => setAttendanceData({...attendanceData, [item.id]: status})}
                    >
                      <Text style={styles.attendanceStatusText}>
                        {status === 'Present' ? '✅ Келди' :
                         status === 'Late' ? '⏰ Кечикти' : '❌ Келбеди'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyList}>
                <Text>Студенттер жүктөлүүдө...</Text>
              </View>
            }
          />

          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => setShowAttendanceModal(false)}
            >
              <Text style={styles.secondaryButtonText}>Жабуу</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.primaryButton, Object.keys(attendanceData).length === 0 && styles.disabledButton]}
              onPress={saveAttendance}
              disabled={Object.keys(attendanceData).length === 0}
            >
              <Text style={styles.primaryButtonText}>💾 Сактоо</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Жүктөлүүдө...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Курс жана Группа тандоо */}
      {canViewAll && user?.role !== 'TEACHER' && (
        <View style={styles.filtersContainer}>
          {renderCourseButtons()}
          {selectedCourse && groups.length > 0 && renderGroupButtons()}
        </View>
      )}

      {/* Информация карточкасы */}
      {(user?.role === 'STUDENT' || user?.role === 'PARENT' || user?.role === 'TEACHER') && 
       selectedGroup && renderInfoCard()}

      {/* Ата-эне үчүн балдардын расписаниеси */}
      {user?.role === 'PARENT' && myChildren.length > 0 ? (
        <View style={styles.childrenContainer}>
          {myChildren.map(child => renderChildSchedule(child))}
        </View>
      ) : (
        // Студент/Мугалим/Админ үчүн негизги расписание
        <View style={styles.scheduleContainer}>
          {renderMainSchedule()}
        </View>
      )}

      {/* Эгер эч нерсе тандалбаса */}
      {!selectedGroup && canViewAll && (
        <View style={styles.emptyState}>
          <Icon name="calendar-outline" size={60} color="#cbd5e0" />
          <Text style={styles.emptyStateText}>
            Расписаниени көрүү үчүн курс жана группа тандаңыз
          </Text>
        </View>
      )}

      {/* Модалдар */}
      {renderLessonModal()}
      {renderAttendanceModal()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#000000ff',
  },
  filtersContainer: {
    padding: 15,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 10,
  },
  courseButtons: {
    flexDirection: 'row',
  },
  courseButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 25,
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  groupButtons: {
    flexDirection: 'row',
  },
  groupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  activeButton: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  courseButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a5568',
  },
  groupButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a5568',
    marginLeft: 5,
  },
  activeButtonText: {
    color: '#fff',
  },
  studentCount: {
    fontSize: 12,
    color: '#718096',
    marginLeft: 5,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#667eea',
    padding: 15,
    margin: 15,
    borderRadius: 12,
  },
  infoText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
  },
  childrenContainer: {
    padding: 15,
  },
  childScheduleContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  childHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  childInfo: {
    marginLeft: 10,
  },
  childName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  childGroup: {
    fontSize: 14,
    color: '#718096',
  },
  scheduleContainer: {
    padding: 15,
  },
  scheduleTable: {
    minWidth: width * 1.5,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f7fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  timeSlotHeader: {
    width: 100,
    padding: 10,
    alignItems: 'center',
  },
  dayHeader: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    minWidth: 120,
  },
  headerText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  timeSlotCell: {
    width: 100,
    padding: 10,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
  },
  timeSlotName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3748',
  },
  timeSlotTime: {
    fontSize: 12,
    color: '#718096',
    marginTop: 2,
  },
  dayCell: {
    flex: 1,
    padding: 10,
    minWidth: 120,
    minHeight: 120,
  },
  lessonCard: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flex: 1,
  },
  lessonCardSmall: {
    backgroundColor: '#f8f9fa',
    padding: 5,
    borderRadius: 6,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lessonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  lessonSubject: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3748',
    flex: 1,
  },
  lessonSubjectSmall: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2d3748',
    textAlign: 'center',
  },
  lessonActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 4,
    marginLeft: 5,
  },
  lessonDetail: {
    fontSize: 12,
    color: '#718096',
    marginTop: 4,
  },
  attendanceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  attendanceBadgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  attendanceText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  attendanceTextSmall: {
    fontSize: 8,
    color: '#fff',
  },
  attendanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#48bb78',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  attendanceButtonText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyCell: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    marginBottom: 5,
  },
  emptyCellText: {
    fontSize: 12,
    color: '#a0aec0',
    textAlign: 'center',
  },
  emptyTextSmall: {
    fontSize: 12,
    color: '#a0aec0',
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    marginTop: 10,
  },
  // Modal стили
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  attendanceModal: {
    width: '95%',
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#667eea',
    padding: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  modalBody: {
    padding: 15,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 10,
  },
  pickerContainer: {
    maxHeight: 200,
  },
  optionButton: {
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  selectedOption: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  optionText: {
    fontSize: 14,
    color: '#4a5568',
  },
  selectedOptionText: {
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  primaryButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 10,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#4a5568',
    fontSize: 16,
    fontWeight: '600',
  },
  // Attendance modal
  studentItem: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 10,
  },
  attendanceButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  attendanceStatusButton: {
    flex: 1,
    padding: 10,
    borderRadius: 6,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  activeStatusButton: {
    borderWidth: 2,
    borderColor: '#fff',
  },
  attendanceStatusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyList: {
    padding: 40,
    alignItems: 'center',
  },
});

export default ScheduleScreen;