import React, { useState, useEffect } from 'react';
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
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';

const { width, height } = Dimensions.get('window');

const ScheduleScreen = () => {
  const { user, updateUser } = useAuth();
  const { language } = useLanguage();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [courses, setCourses] = useState([]);
  const [groups, setGroups] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  
  const [scheduleData, setScheduleData] = useState({});
  const [myChildren, setMyChildren] = useState([]);
  const [childrenSchedules, setChildrenSchedules] = useState({});
  
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [lessonForm, setLessonForm] = useState({
    subject_id: '',
    teacher_id: '',
    room: '',
    time_slot_id: '',
    day: ''
  });
  
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [currentLessonId, setCurrentLessonId] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});

  // Translations
  const translations = {
    en: {
      loading: 'Loading...',
      error: 'Error',
      dataLoadError: 'Error loading data',
      scheduleLoadError: 'Error loading schedule',
      teacherNotFound: 'Teacher profile not found',
      noGroup: 'You are not assigned to a group yet',
      noChildren: 'No students linked to you',
      courses: 'Courses:',
      noCourses: 'No courses',
      selectCourse: 'Select course:',
      groups: 'Groups:',
      noGroups: 'No groups',
      selectGroup: 'Select group:',
      students: 'students',
      time: 'Time',
      notSpecified: 'Not specified',
      empty: 'Empty',
      add: 'Add',
      editLesson: '✏️ Edit Lesson',
      addLesson: '📚 Add New Lesson',
      subject: '📖 Subject:',
      teacher: '👨‍🏫 Teacher:',
      room: '📍 Room:',
      cancel: 'Cancel',
      save: '💾 Save',
      confirmDelete: 'Confirm Delete?',
      deleteLesson: 'Delete this lesson?',
      delete: 'Delete',
      success: 'Success!',
      lessonSaved: 'Lesson saved',
      lessonDeleted: 'Lesson deleted',
      saveError: 'Error saving',
      deleteError: 'Error deleting',
      markAttendance: '📋 Mark Student Attendance',
      close: 'Close',
      present: '✅ Present',
      late: '⏰ Late',
      absent: '❌ Absent',
      attendanceOnly: 'Attendance marking is for teachers only',
      todayOnly: 'You can only mark attendance for your today\'s lessons',
      myLessonsOnly: 'You can only mark attendance for your own lessons',
      noAttendanceData: 'No attendance data',
      lessonNotFound: 'Lesson information not found',
      attendanceSaved: 'Attendance saved successfully!',
      attendanceButton: 'Attendance',
      selectToView: 'Select course and group to view schedule',
      monday: 'Monday',
      tuesday: 'Tuesday',
      wednesday: 'Wednesday',
      thursday: 'Thursday',
      friday: 'Friday',
      saturday: 'Saturday',
      monShort: 'Mon',
      tueShort: 'Tue',
      wedShort: 'Wed',
      thuShort: 'Thu',
      friShort: 'Fri',
      satShort: 'Sat',
    },
    ru: {
      loading: 'Загрузка...',
      error: 'Ошибка',
      dataLoadError: 'Ошибка загрузки данных',
      scheduleLoadError: 'Ошибка загрузки расписания',
      teacherNotFound: 'Профиль преподавателя не найден',
      noGroup: 'Вы еще не назначены в группу',
      noChildren: 'К вам не привязаны студенты',
      courses: 'Курсы:',
      noCourses: 'Нет курсов',
      selectCourse: 'Выберите курс:',
      groups: 'Группы:',
      noGroups: 'Нет групп',
      selectGroup: 'Выберите группу:',
      students: 'студентов',
      time: 'Время',
      notSpecified: 'Не указано',
      empty: 'Пусто',
      add: 'Добавить',
      editLesson: '✏️ Редактировать занятие',
      addLesson: '📚 Добавить занятие',
      subject: '📖 Предмет:',
      teacher: '👨‍🏫 Преподаватель:',
      room: '📍 Кабинет:',
      cancel: 'Отмена',
      save: '💾 Сохранить',
      confirmDelete: 'Подтвердить удаление?',
      deleteLesson: 'Удалить это занятие?',
      delete: 'Удалить',
      success: 'Успешно!',
      lessonSaved: 'Занятие сохранено',
      lessonDeleted: 'Занятие удалено',
      saveError: 'Ошибка сохранения',
      deleteError: 'Ошибка удаления',
      markAttendance: '📋 Отметить посещаемость',
      close: 'Закрыть',
      present: '✅ Присутствовал',
      late: '⏰ Опоздал',
      absent: '❌ Отсутствовал',
      attendanceOnly: 'Отметка посещаемости только для преподавателей',
      todayOnly: 'Вы можете отмечать только сегодняшние занятия',
      myLessonsOnly: 'Вы можете отмечать только свои занятия',
      noAttendanceData: 'Нет данных посещаемости',
      lessonNotFound: 'Информация о занятии не найдена',
      attendanceSaved: 'Посещаемость успешно сохранена!',
      attendanceButton: 'Посещаемость',
      selectToView: 'Выберите курс и группу для просмотра расписания',
      monday: 'Понедельник',
      tuesday: 'Вторник',
      wednesday: 'Среда',
      thursday: 'Четверг',
      friday: 'Пятница',
      saturday: 'Суббота',
      monShort: 'Пн',
      tueShort: 'Вт',
      wedShort: 'Ср',
      thuShort: 'Чт',
      friShort: 'Пт',
      satShort: 'Сб',
    },
    ky: {
      loading: 'Жүктөлүүдө...',
      error: 'Ката',
      dataLoadError: 'Маалыматтарды жүктөөдө ката чыкты',
      scheduleLoadError: 'Расписаниени жүктөөдө ката чыкты',
      teacherNotFound: 'Мугалим профили табылган жок',
      noGroup: 'Сиз али группага киргизилген эмессиз',
      noChildren: 'Сизге эч кандай студент байланышкан эмес',
      courses: 'Курстар:',
      noCourses: 'Курстар жок',
      selectCourse: 'Курсту тандаңыз:',
      groups: 'Группалар:',
      noGroups: 'Группалар жок',
      selectGroup: 'Группаны тандаңыз:',
      students: 'студент',
      time: 'Убакыт',
      notSpecified: 'Белгиленген эмес',
      empty: 'Бош',
      add: 'Кошуу',
      editLesson: '✏️ Сабакты өзгөртүү',
      addLesson: '📚 Жаңы сабак кошуу',
      subject: '📖 Сабак:',
      teacher: '👨‍🏫 Мугалим:',
      room: '📍 Кабинет:',
      cancel: 'Жокко чыгаруу',
      save: '💾 Сактоо',
      confirmDelete: 'Ырас менен өчүрүү?',
      deleteLesson: 'Бул сабакты өчүрөсүзбү?',
      delete: 'Өчүрүү',
      success: 'Ийгиликтүү!',
      lessonSaved: 'Сабак сакталды',
      lessonDeleted: 'Сабак өчүрүлдү',
      saveError: 'Сактоодо ката чыкты',
      deleteError: 'Өчүрүүдө ката чыкты',
      markAttendance: '📋 Студенттердин катышуусун белгилөө',
      close: 'Жабуу',
      present: '✅ Келди',
      late: '⏰ Кечикти',
      absent: '❌ Келбеди',
      attendanceOnly: 'Катышууну белгилөө мугалимдер үчүн гана',
      todayOnly: 'Сиз өзүңүздүн бүгүнкү сабагыңызга гана жоктоо белгилей аласыз',
      myLessonsOnly: 'Сиз өзүңүздүн сабактарыңызга гана жоктоо белгилей аласыз',
      noAttendanceData: 'Жоктоо маалыматы жок',
      lessonNotFound: 'Сабак маалыматы табылган жок',
      attendanceSaved: 'Катышуу ийгиликтүү сакталды!',
      attendanceButton: 'Жоктоо',
      selectToView: 'Расписаниени көрүү үчүн курс жана группа тандаңыз',
      monday: 'Дүйшөмбү',
      tuesday: 'Шейшемби',
      wednesday: 'Шаршемби',
      thursday: 'Бейшемби',
      friday: 'Жума',
      saturday: 'Ишемби',
      monShort: 'Дүй',
      tueShort: 'Шей',
      wedShort: 'Шар',
      thuShort: 'Бей',
      friShort: 'Жум',
      satShort: 'Ише',
    }
  };

  const t = translations[language] || translations.ky;

  const days = {
    Monday: { short: t.monShort, full: t.monday },
    Tuesday: { short: t.tueShort, full: t.tuesday },
    Wednesday: { short: t.wedShort, full: t.wednesday },
    Thursday: { short: t.thuShort, full: t.thursday },
    Friday: { short: t.friShort, full: t.friday },
    Saturday: { short: t.satShort, full: t.saturday }
  };

  const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const canEdit = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const canViewAll = user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'TEACHER';

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const loadData = async () => {
    try {
      setLoading(true);
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
      Alert.alert(t.error, t.dataLoadError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    
    if (user?.role === 'TEACHER' && !user.teacher_id) {
      fetchTeacherId();
    }
  }, [user]);

  useEffect(() => {
    if (selectedCourse) {
      loadGroups(selectedCourse);
      setSelectedGroup(null);
    } else {
      setGroups([]);
      setSelectedGroup(null);
    }
  }, [selectedCourse]);

  useEffect(() => {
    if (selectedGroup && canViewAll) {
      loadSchedule(selectedGroup);
      loadSubjects();
      loadTeachers();
    }
  }, [selectedGroup]);

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

  const loadTeacherSchedule = async () => {
    try {
      console.log('👨‍🏫 Loading teacher schedule...');
      const profileResponse = await api.get('/v1/profile/update/');
      const teachersResponse = await api.get('/v1/teachers/');
      const teachersList = teachersResponse.data.results || teachersResponse.data || [];
      
      const currentTeacher = teachersList.find(t => t.user && t.user.id === user.id);
      
      if (!currentTeacher) {
        console.log('❌ Teacher not found');
        Alert.alert(t.error, t.teacherNotFound);
        return;
      }
      
      console.log('✅ Current teacher:', currentTeacher);
      
      // Teacher ID'ди user'ге сактоо
      if (!user.teacher_id) {
        const updatedUser = { ...user, teacher_id: currentTeacher.id };
        updateUser(updatedUser);
        console.log('💾 Saved teacher_id to user:', currentTeacher.id);
      }
      
      const schedulesResponse = await api.get(`/v1/schedules/?teacher=${currentTeacher.id}`);
      const mySchedules = schedulesResponse.data.results || schedulesResponse.data || [];
      
      console.log('📅 Teacher schedules loaded:', mySchedules.length);
      
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
            teacher_id: currentTeacher.id, // currentTeacher.id'ди колдонобуз
            time_slot_id: timeSlotId,
            attendance_status: schedule.attendance_status,
            attendance_text: schedule.attendance_text
          };
        }
      });

      console.log('📊 Schedule grid created:', Object.keys(gridData).length, 'days');
      setScheduleData(gridData);
      
      // Расписание бар экенин текшерүү
      const hasSchedule = Object.values(gridData).some(day => Object.keys(day).length > 0);
      if (!hasSchedule) {
        Alert.alert(
          'Маалымат',
          'Сизге али сабактар белгиленген эмес. Администратор менен байланышыңыз.'
        );
      }
      
      await loadSubjects();
      await loadTeachers();
    } catch (error) {
      console.error('❌ Мугалим расписаниесин жүктөөдө ката:', error);
      Alert.alert(t.error, t.scheduleLoadError);
    }
  };

  const loadStudentSchedule = async () => {
    try {
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
        Alert.alert(t.error, t.noGroup);
      }
    } catch (error) {
      console.error('Студент расписаниесин жүктөөдө ката:', error);
      Alert.alert(t.error, t.scheduleLoadError);
    }
  };

  const loadParentSchedule = async () => {
    try {
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
        await loadTimeSlots();
      } else {
        Alert.alert(t.error, t.noChildren);
      }
    } catch (error) {
      console.error('Ата-эне расписаниесин жүктөөдө ката:', error);
      Alert.alert(t.error, t.scheduleLoadError);
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
    
    setTimeSlots([
      { id: 1, name: '1-пара', start_time: '08:00', end_time: '09:30' },
      { id: 2, name: '2-пара', start_time: '09:40', end_time: '11:10' },
      { id: 3, name: '3-пара', start_time: '11:20', end_time: '12:50' },
      { id: 4, name: '4-пара', start_time: '13:30', end_time: '15:00' },
      { id: 5, name: '5-пара', start_time: '15:10', end_time: '16:40' },
      { id: 6, name: '6-пара', start_time: '16:50', end_time: '18:20' },
    ]);
  };

  const loadSchedule = async (groupId) => {
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
    }
  };

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
      Alert.alert(t.success, t.lessonSaved);
    } catch (error) {
      console.error('Сабакты сактоодо ката:', error);
      Alert.alert(t.error, t.saveError);
    }
  };

  const deleteLesson = async (lessonId) => {
    Alert.alert(
      t.confirmDelete,
      t.deleteLesson,
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.delete,
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/v1/schedules/${lessonId}/`);
              loadSchedule(selectedGroup);
              Alert.alert(t.success, t.lessonDeleted);
            } catch (error) {
              console.error('Сабакты өчүрүүдө ката:', error);
              Alert.alert(t.error, t.deleteError);
            }
          }
        }
      ]
    );
  };

  const isTeacherTodayLesson = (lesson, day) => {
    if (user?.role !== 'TEACHER') return false;
    
    const today = new Date();
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = daysOfWeek[today.getDay()];
    
    // Бүгүнкү күн жана мугалимдин өз сабагы
    const isToday = day === todayName;
    const isMyLesson = lesson.teacher_id === user.teacher_id;
    
    console.log('📅 Attendance check:', {
      day,
      todayName,
      isToday,
      lessonTeacherId: lesson.teacher_id,
      userTeacherId: user.teacher_id,
      isMyLesson,
      canMark: isToday && isMyLesson
    });
    
    return isToday && isMyLesson;
  };

  const openAttendanceModal = async (lessonId, lesson, day) => {
    console.log('🎯 Opening attendance modal:', { lessonId, day, lesson });
    console.log('👤 User info:', { role: user?.role, teacher_id: user?.teacher_id });
    
    if (user?.role !== 'TEACHER') {
      Alert.alert(t.error, t.attendanceOnly);
      return;
    }
    
    // Бүгүнкү күндү текшерүү
    if (!isTeacherTodayLesson(lesson, day)) {
      Alert.alert(t.error, t.todayOnly);
      return;
    }
    
    // Мугалимдин өз сабагы экенин текшерүү
    console.log('🔍 Checking lesson ownership:', {
      lessonTeacherId: lesson.teacher_id,
      userTeacherId: user.teacher_id,
      match: lesson.teacher_id === user.teacher_id
    });
    
    if (lesson.teacher_id !== user.teacher_id) {
      Alert.alert(t.error, t.myLessonsOnly);
      return;
    }

    setCurrentLessonId(lessonId);
    setShowAttendanceModal(true);
    
    try {
      // Ошол эле убакытта жана күндө окутулган бардык параллелдүү сабактарды табуу
      const currentTimeSlot = lesson.time_slot_id;
      const parallelLessons = [];
      
      // Schedule data'дан ошол эле time slot жана day'дагы бардык сабактарды издөө
      if (scheduleData[day] && scheduleData[day][currentTimeSlot]) {
        const currentLesson = scheduleData[day][currentTimeSlot];
        if (currentLesson.teacher_id === user.teacher_id) {
          parallelLessons.push(currentLesson.id);
        }
      }
      
      // Эгер бир нече параллелдүү сабак болсо, аларды да кошуу керек
      // Бирок scheduleData'да бир гана сабак бар (teacher'дин өз расписаниеси)
      // Ошондуктан API'ден толук маалымат алуу керек
      
      console.log('📡 Fetching students for lesson:', lessonId);
      const response = await api.get(`/v1/schedules/${lessonId}/students/`);
      const studentsList = response.data.students || [];
      const lessonInfo = response.data.lesson_info || {};
      
      console.log('👥 Students loaded:', studentsList.length);
      console.log('📚 Lesson info:', lessonInfo);
      
      if (lessonInfo.total_groups > 1) {
        console.log(`📢 Параллелдүү ${lessonInfo.total_groups} группа, ${lessonInfo.total_students} студент`);
      }
      
      setStudents(studentsList);
      
      const initialAttendance = {};
      studentsList.forEach(student => {
        initialAttendance[student.id] = student.current_status || 'Present';
      });
      setAttendanceData(initialAttendance);
    } catch (error) {
      console.error('Студенттерди жүктөөдө ката:', error);
      Alert.alert(t.error, t.scheduleLoadError);
      setShowAttendanceModal(false);
    }
  };

  const saveAttendance = async () => {
    if (!currentLessonId || Object.keys(attendanceData).length === 0) {
      Alert.alert(t.error, t.noAttendanceData);
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
        Alert.alert(t.error, t.lessonNotFound);
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

      Alert.alert(t.success, t.attendanceSaved);
      setShowAttendanceModal(false);
      setStudents([]);
      setAttendanceData({});
      setCurrentLessonId(null);
    } catch (error) {
      console.error('Катышууну сактоодо ката:', error);
      Alert.alert(t.error, t.saveError);
    }
  };

  const getAttendanceColor = (status) => {
    switch (status) {
      case 'Present': return '#48bb78';
      case 'Absent': return '#f56565';
      case 'Late': return '#ed8936';
      default: return '#a0aec0';
    }
  };

  // ОҢДОЛГОН: Сабак карточкасы вертикалдык созулуу
  const renderLessonCard = (lesson, day, timeSlotId) => {
    if (!lesson) return null;

    return (
      <TouchableOpacity 
        style={styles.lessonCard}
        activeOpacity={0.8}
        onPress={() => {
          if (canEdit) {
            openEditLessonModal(lesson);
          }
        }}
      >
        <View style={styles.lessonContent}>
          <View style={styles.lessonHeader}>
            <Text style={styles.lessonSubject} numberOfLines={2} ellipsizeMode='tail'>
              {lesson.subject}
            </Text>
            {canEdit && (
              <View style={styles.lessonActions}>
                <TouchableOpacity 
                  onPress={(e) => {
                    e.stopPropagation();
                    openEditLessonModal(lesson);
                  }}
                  style={styles.actionButton}
                >
                  <Icon name="pencil" size={16} color="#4299e1" />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={(e) => {
                    e.stopPropagation();
                    deleteLesson(lesson.id);
                  }}
                  style={styles.actionButton}
                >
                  <Icon name="trash" size={16} color="#f56565" />
                </TouchableOpacity>
              </View>
            )}
          </View>
          
          <View style={styles.lessonDetails}>
            {lesson.teacher && user?.role !== 'TEACHER' && (
              <View style={styles.detailRow}>
                <Icon name="person" size={12} color="#718096" />
                <Text style={styles.lessonDetail} numberOfLines={1} ellipsizeMode='tail'>
                  {lesson.teacher}
                </Text>
              </View>
            )}
            
            {lesson.group && user?.role === 'TEACHER' && (
              <View style={styles.detailRow}>
                <Icon name="people" size={12} color="#718096" />
                <Text style={styles.lessonDetail} numberOfLines={1} ellipsizeMode='tail'>
                  {lesson.group}
                </Text>
              </View>
            )}
            
            <View style={styles.detailRow}>
              <Icon name="business" size={12} color="#718096" />
              <Text style={styles.lessonDetail} numberOfLines={1} ellipsizeMode='tail'>
                {lesson.room || t.notSpecified}
              </Text>
            </View>
          </View>
          
          {(user?.role === 'STUDENT' || user?.role === 'PARENT') && lesson.attendance_text && (
            <View style={[styles.attendanceBadge, { backgroundColor: getAttendanceColor(lesson.attendance_status) }]}>
              <Text style={styles.attendanceText}>
                {lesson.attendance_text}
              </Text>
            </View>
          )}
          
          {user?.role === 'TEACHER' && isTeacherTodayLesson(lesson, day) && (
            <TouchableOpacity 
              style={styles.attendanceButton}
              onPress={(e) => {
                e.stopPropagation();
                console.log('📝 Attendance button pressed:', {
                  lessonId: lesson.id,
                  day,
                  lessonTeacherId: lesson.teacher_id,
                  userTeacherId: user.teacher_id
                });
                openAttendanceModal(lesson.id, lesson, day);
              }}
            >
              <Icon name="clipboard" size={14} color="#fff" />
              <Text style={styles.attendanceButtonText}>{t.attendanceButton}</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyCell = (timeSlotId, day) => {
    return (
      <TouchableOpacity 
        style={styles.emptyCell}
        onPress={() => canEdit && openAddLessonModal(timeSlotId, day)}
        disabled={!canEdit}
        activeOpacity={0.8}
      >
        {canEdit ? (
          <View style={styles.emptyCellContent}>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={(e) => {
                e.stopPropagation();
                openAddLessonModal(timeSlotId, day);
              }}
            >
              <Icon name="add" size={24} color="#48bb78" />
            </TouchableOpacity>
            <Text style={styles.emptyCellText}>{t.add}</Text>
          </View>
        ) : (
          <Text style={styles.emptyCellText}>{t.empty}</Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderChildSchedule = (child) => {
    const childSchedule = childrenSchedules[child.id] || {};

    return (
      <View key={child.id} style={styles.childScheduleContainer}>
        <View style={styles.childHeader}>
          <Icon name="person-circle" size={30} color="#384da9ff" />
          <View style={styles.childInfo}>
            <Text style={styles.childName}>{child.name}</Text>
            <Text style={styles.childGroup}>{child.group?.name}</Text>
          </View>
        </View>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={true}
          style={styles.scheduleScrollView}
        >
          <View style={styles.scheduleTable}>
            <View style={styles.tableHeader}>
              <View style={[styles.timeSlotHeader, styles.timeSlotWidth]}>
                <Text style={styles.headerText}>{t.time}</Text>
              </View>
              {daysOrder.map(day => (
                <View key={day} style={[styles.dayHeader, styles.fixedWidth]}>
                  <Text style={styles.headerText}>{days[day].short}</Text>
                  <Text style={styles.headerSubText}>{days[day].full}</Text>
                </View>
              ))}
            </View>
            
            {timeSlots.map(timeSlot => (
              <View key={timeSlot.id} style={styles.tableRow}>
                <View style={[styles.timeSlotCell, styles.timeSlotWidth]}>
                  <Text style={styles.timeSlotName}>{timeSlot.name}</Text>
                  <Text style={styles.timeSlotTime}>
                    {timeSlot.start_time} - {timeSlot.end_time}
                  </Text>
                </View>
                
                {daysOrder.map(day => {
                  const lesson = childSchedule[day]?.[timeSlot.id];
                  return (
                    <View key={`${day}-${timeSlot.id}`} style={[styles.dayCell, styles.fixedWidth]}>
                      {lesson ? (
                        <View style={styles.lessonCardSmall}>
                          <Text style={styles.lessonSubjectSmall} numberOfLines={2} ellipsizeMode='tail'>
                            {lesson.subject}
                          </Text>
                          <View style={styles.lessonDetailsSmall}>
                            <Icon name="person" size={10} color="#718096" />
                            <Text style={styles.lessonDetailSmall} numberOfLines={1} ellipsizeMode='tail'>
                              {lesson.teacher}
                            </Text>
                          </View>
                          {lesson.attendance_text && (
                            <View style={[
                              styles.attendanceBadgeSmall, 
                              { backgroundColor: getAttendanceColor(lesson.attendance_status) }
                            ]}>
                              <Text style={styles.attendanceTextSmall}>
                                {lesson.attendance_text}
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

  // ОҢДОЛГОН: Негизги расписание - ячейкалар вертикалдык созулуу
  const renderMainSchedule = () => {
    return (
      <View style={styles.scheduleWrapper}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={true}
          style={styles.scheduleScrollView}
        >
          <View style={styles.scheduleTable}>
            <View style={styles.tableHeader}>
              <View style={[styles.timeSlotHeader, styles.timeSlotWidth]}>
                <Text style={styles.headerText}>{t.time}</Text>
              </View>
              {daysOrder.map(day => (
                <View key={day} style={[styles.dayHeader, styles.fixedWidth]}>
                  <Text style={styles.headerText}>{days[day].short}</Text>
                  <Text style={styles.headerSubText}>{days[day].full}</Text>
                </View>
              ))}
            </View>
            
            {timeSlots.map(timeSlot => (
              <View key={timeSlot.id} style={styles.tableRow}>
                <View style={[styles.timeSlotCell, styles.timeSlotWidth]}>
                  <Text style={styles.timeSlotName}>{timeSlot.name}</Text>
                  <Text style={styles.timeSlotTime}>
                    {timeSlot.start_time} - {timeSlot.end_time}
                  </Text>
                </View>
                
                {daysOrder.map(day => {
                  const lesson = scheduleData[day]?.[timeSlot.id];
                  return (
                    <View key={`${day}-${timeSlot.id}`} style={[styles.dayCell, styles.fixedWidth]}>
                      {lesson ? renderLessonCard(lesson, day, timeSlot.id) : renderEmptyCell(timeSlot.id, day)}
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

  const renderCourseButtons = () => {
    if (courses.length === 0) {
      return (
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>{t.courses}</Text>
          <Text style={styles.noDataText}>{t.noCourses}</Text>
        </View>
      );
    }

    return (
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>{t.selectCourse}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.courseButtons}>
            {courses.map(course => (
              <TouchableOpacity
                key={course.id}
                style={[
                  styles.courseButton,
                  selectedCourse === course.id && styles.activeButton
                ]}
                onPress={() => setSelectedCourse(course.id)}
              >
                <Text style={[
                  styles.courseButtonText,
                  selectedCourse === course.id && styles.activeButtonText
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

  const renderGroupButtons = () => {
    if (groups.length === 0) {
      return (
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>{t.groups}</Text>
          <Text style={styles.noDataText}>{t.noGroups}</Text>
        </View>
      );
    }

    return (
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>{t.selectGroup}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.groupButtons}>
            {groups.map(group => (
              <TouchableOpacity
                key={group.id}
                style={[
                  styles.groupButton,
                  selectedGroup === group.id && styles.activeButton
                ]}
                onPress={() => setSelectedGroup(group.id)}
              >
                <Icon name="people" size={16} color={selectedGroup === group.id ? '#fff' : '#667eea'} />
                <Text style={[
                  styles.groupButtonText,
                  selectedGroup === group.id && styles.activeButtonText
                ]}>
                  {group.name}
                </Text>
                <Text style={styles.studentCount}>
                  ({group.student_count || 0} {t.students})
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

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
              {currentLesson ? t.editLesson : t.addLesson}
            </Text>
            <TouchableOpacity onPress={() => setShowLessonModal(false)}>
              <Icon name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>{t.subject}</Text>
              <ScrollView style={styles.pickerContainer}>
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
              </ScrollView>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>{t.teacher}</Text>
              <ScrollView style={styles.pickerContainer}>
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
              </ScrollView>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>{t.room}</Text>
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
              <Text style={styles.secondaryButtonText}>{t.cancel}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.primaryButton, !lessonForm.subject_id && styles.disabledButton]}
              onPress={saveLesson}
              disabled={!lessonForm.subject_id}
            >
              <Text style={styles.primaryButtonText}>{t.save}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

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
            <Text style={styles.modalTitle}>{t.markAttendance}</Text>
            <TouchableOpacity onPress={() => setShowAttendanceModal(false)}>
              <Icon name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={students}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item, index }) => (
              <View style={styles.studentItem}>
                <View style={styles.studentHeader}>
                  <Text style={styles.studentName}>
                    {index + 1}. {item.name || item.full_name}
                  </Text>
                  {item.group && (
                    <View style={styles.groupBadge}>
                      <Icon name="people" size={12} color="#667eea" />
                      <Text style={styles.groupBadgeText}>{item.group}</Text>
                    </View>
                  )}
                </View>
                
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
                        {status === 'Present' ? t.present :
                         status === 'Late' ? t.late : t.absent}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyList}>
                <Text style={styles.emptyListText}>Студенттер жүктөлүүдө...</Text>
              </View>
            }
          />

          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => setShowAttendanceModal(false)}
            >
              <Text style={styles.secondaryButtonText}>{t.close}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.primaryButton, Object.keys(attendanceData).length === 0 && styles.disabledButton]}
              onPress={saveAttendance}
              disabled={Object.keys(attendanceData).length === 0}
            >
              <Text style={styles.primaryButtonText}>{t.save}</Text>
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
        <Text style={styles.loadingText}>{t.loading}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {canViewAll && user?.role !== 'TEACHER' && (
          <View style={styles.filtersContainer}>
            {renderCourseButtons()}
            {selectedCourse && groups.length > 0 && renderGroupButtons()}
          </View>
        )}

        {user?.role === 'PARENT' && myChildren.length > 0 ? (
          <View style={styles.childrenContainer}>
            {myChildren.map(child => renderChildSchedule(child))}
          </View>
        ) : (selectedGroup || user?.role === 'TEACHER') && Object.keys(scheduleData).length > 0 ? (
          <View style={styles.scheduleContainer}>
            {renderMainSchedule()}
          </View>
        ) : user?.role === 'TEACHER' && Object.keys(scheduleData).length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="calendar-outline" size={60} color="#cbd5e0" />
            <Text style={styles.emptyStateText}>
              Сизге али сабактар белгиленген эмес
            </Text>
          </View>
        ) : canViewAll && user?.role !== 'TEACHER' && (
          <View style={styles.emptyState}>
            <Icon name="calendar-outline" size={60} color="#cbd5e0" />
            <Text style={styles.emptyStateText}>
              {t.selectToView}
            </Text>
          </View>
        )}

        {renderLessonModal()}
        {renderAttendanceModal()}
      </ScrollView>
    </SafeAreaView>
  );
};

// ОҢДОЛГОН: Ячейкалардын өлчөмдөрү - квадрат клеткалар
const TIME_SLOT_WIDTH = 90; // Убакыт үчүн узун
const CELL_WIDTH = 200; // Квадрат клеткалар үчүн
const CELL_HEIGHT = 110; // Квадрат өлчөм

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4a5568',
    fontWeight: '600',
  },
  filtersContainer: {
    padding: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2d3748',
    marginBottom: 10,
    marginLeft: 5,
  },
  noDataText: {
    fontSize: 14,
    color: '#a0aec0',
    fontStyle: 'italic',
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  courseButtons: {
    flexDirection: 'row',
    paddingHorizontal: 5,
  },
  courseButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 25,
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    minWidth: 100,
    alignItems: 'center',
  },
  groupButtons: {
    flexDirection: 'row',
    paddingHorizontal: 5,
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
    minWidth: 120,
    justifyContent: 'center',
  },
  activeButton: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
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
    marginRight: 5,
  },
  activeButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  studentCount: {
    fontSize: 11,
    color: '#718096',
    marginLeft: 2,
  },
  childrenContainer: {
    padding: 15,
    backgroundColor: '#ffffff',
  },
  childScheduleContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  childHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  childInfo: {
    marginLeft: 12,
    flex: 1,
  },
  childName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2d3748',
  },
  childGroup: {
    fontSize: 14,
    color: '#718096',
    marginTop: 2,
  },
  
  // ============ ОҢДОЛГОН РАСПИСАНИЕ СТИЛДЕРИ ============
  scheduleContainer: {
    flex: 1,
    padding: 15,
    backgroundColor: '#ffffff',
    minHeight: height * 0.7,
  },
  scheduleWrapper: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  scheduleScrollView: {
    flex: 1,
  },
  scheduleTable: {
    flexDirection: 'column',
    // minWidth: CELL_WIDTH * (daysOrder.length + 1),
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#667eea',
    borderBottomWidth: 2,
    borderBottomColor: '#5568d3',
    minHeight: 60,
  },
  fixedWidth: {
    width: CELL_WIDTH,
    minWidth: CELL_WIDTH,
    maxWidth: CELL_WIDTH,
    height: CELL_HEIGHT,
    minHeight: CELL_HEIGHT,
    maxHeight: CELL_HEIGHT,
  },
  timeSlotWidth: {
    width: TIME_SLOT_WIDTH,
    minWidth: TIME_SLOT_WIDTH,
    maxWidth: TIME_SLOT_WIDTH,
    height: CELL_HEIGHT,
    minHeight: CELL_HEIGHT,
    maxHeight: CELL_HEIGHT,
  },
  timeSlotHeader: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#5568d3',
    backgroundColor: '#4c63d4',
  },
  dayHeader: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#5568d3',
  },
  headerText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  headerSubText: {
    fontSize: 9,
    color: '#e2e8f0',
    textAlign: 'center',
    marginTop: 2,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  timeSlotCell: {
    padding: 12,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
  },
  timeSlotName: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2d3748',
    textAlign: 'center',
  },
  timeSlotTime: {
    fontSize: 9,
    color: '#718096',
    marginTop: 4,
    textAlign: 'center',
  },
  dayCell: {
    padding: 4,
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  
  // ОҢДОЛГОН: Вертикалдык созулуучу сабак карточкасы
  lessonCard: {
    flex: 1,
    // backgroundColor: '#ffffffff',
    // padding: 12,
    // borderRadius: 8,
    // borderWidth: 1,
    // borderColor: '#e2e8f0',
    // height: DAY_CELL_HEIGHT - 16,
    // justifyContent: 'space-between',
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.05,
    // shadowRadius: 2,
    // elevation: 2,
  },
  lessonContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  lessonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  lessonSubject: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2d3748',
    flex: 1,
    textAlign: 'left',
    lineHeight: 13,
  },
  lessonActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 4,
    marginLeft: 4,
    backgroundColor: '#fff',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  lessonDetails: {
    flex: 1,
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  lessonDetail: {
    fontSize: 9,
    color: '#718096',
    marginLeft: 4,
    flex: 1,
    lineHeight: 11,
  },
  attendanceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
    minWidth: 60,
  },
  attendanceText: {
    fontSize: 8,
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
  },
  attendanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#48bb78',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  attendanceButtonText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '700',
    marginLeft: 4,
  },
  
  // Балдар үчүн кичине сабак карточкасы
  lessonCardSmall: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    height: CELL_HEIGHT - 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  lessonSubjectSmall: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2d3748',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 4,
  },
  lessonDetailsSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  lessonDetailSmall: {
    fontSize: 10,
    color: '#718096',
    marginLeft: 4,
    lineHeight: 12,
  },
  attendanceBadgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
    minWidth: 50,
  },
  attendanceTextSmall: {
    fontSize: 9,
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
  },
  
  // ОҢДОЛГОН: Бош ячейка
  emptyCell: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    height: CELL_HEIGHT - 16,
  },
  emptyCellContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#48bb78',
    shadowColor: '#48bb78',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  emptyCellText: {
    fontSize: 12,
    color: '#a0aec0',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  emptyTextSmall: {
    fontSize: 12,
    color: '#a0aec0',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#ffffff',
    minHeight: height * 0.5,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 24,
    fontWeight: '500',
  },
  
  // МОДАЛ СТИЛДЕРИ
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
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
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    flex: 1,
  },
  modalBody: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2d3748',
    marginBottom: 12,
  },
  pickerContainer: {
    maxHeight: 150,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 5,
  },
  optionButton: {
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    marginBottom: 6,
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
    textAlign: 'center',
  },
  selectedOptionText: {
    color: '#fff',
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#2d3748',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  primaryButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
    flex: 1,
    marginLeft: 10,
    alignItems: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  secondaryButton: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
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
    fontWeight: '700',
  },
  secondaryButtonText: {
    color: '#4a5568',
    fontSize: 16,
    fontWeight: '600',
  },
  studentItem: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2d3748',
    flex: 1,
  },
  groupBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  groupBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#667eea',
    marginLeft: 4,
  },
  attendanceButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  attendanceStatusButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activeStatusButton: {
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  attendanceStatusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyList: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyListText: {
    fontSize: 14,
    color: '#a0aec0',
    fontStyle: 'italic',
  },
});

export default ScheduleScreen;