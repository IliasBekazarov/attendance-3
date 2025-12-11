import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LanguageContext = createContext();

// Translation dictionaries
const translations = {
  en: {
    // Common
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    confirm: 'Confirm',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    yes: 'Yes',
    no: 'No',
    
    // Auth
    login: 'Login',
    logout: 'Logout',
    username: 'Username',
    password: 'Password',
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    confirmPassword: 'Confirm Password',
    
    // Navigation
    dashboard: 'Dashboard',
    schedule: 'Schedule',
    attendance: 'Attendance',
    profile: 'Profile',
    leaveRequests: 'Leave Requests',
    notifications: 'Notifications',
    reports: 'Reports',
    
    // Dashboard
    welcome: 'Welcome',
    attendanceRate: 'Attendance Rate',
    upcomingClasses: 'Upcoming Classes',
    recentActivity: 'Recent Activity',
    statistics: 'Statistics',
    
    // Schedule
    today: 'Today',
    tomorrow: 'Tomorrow',
    week: 'Week',
    noSchedule: 'No schedule for this day',
    
    // Attendance
    present: 'Present',
    absent: 'Absent',
    late: 'Late',
    excused: 'Excused',
    markAttendance: 'Mark Attendance',
    attendanceMarked: 'Attendance marked successfully',
    
    // Profile
    personalInfo: 'Personal Information',
    firstName: 'First Name',
    lastName: 'Last Name',
    phoneNumber: 'Phone Number',
    address: 'Address',
    emergencyContact: 'Emergency Contact',
    emergencyContactName: 'Emergency Contact Name',
    emergencyContactPhone: 'Emergency Contact Phone',
    changePassword: 'Change Password',
    changeUsername: 'Change Username',
    profileUpdated: 'Profile updated successfully',
    passwordChanged: 'Password changed successfully',
    usernameChanged: 'Username changed successfully',
    
    // Leave Requests
    requestLeave: 'Request Leave',
    leaveType: 'Leave Type',
    startDate: 'Start Date',
    endDate: 'End Date',
    reason: 'Reason',
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    submitRequest: 'Submit Request',
    
    // Settings
    settings: 'Settings',
    language: 'Language',
    selectLanguage: 'Select Language',
    
    // Messages
    enterUsername: 'Please enter username',
    enterPassword: 'Please enter password',
    invalidCredentials: 'Invalid credentials',
    loginFailed: 'Login failed',
    profileUpdateFailed: 'Failed to update profile',
    passwordTooShort: 'Password must be at least 6 characters',
    passwordsNotMatch: 'Passwords do not match',
    enterNewUsername: 'Please enter new username',
    
    // Additional
    students: 'Students',
    teachers: 'Teachers',
    groups: 'Groups',
    subjects: 'Subjects',
    courses: 'Courses',
    todayStatistics: 'Today\'s Statistics',
    total: 'Total',
    room: 'Room',
    time: 'Time',
    day: 'Day',
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday',
    selectCourse: 'Select Course',
    selectGroup: 'Select Group',
    noData: 'No data available',
    refresh: 'Refresh',
    filter: 'Filter',
    all: 'All',
    unread: 'Unread',
    read: 'Read',
    markAsRead: 'Mark as read',
    markAllAsRead: 'Mark all as read',
    deleteNotification: 'Delete notification',
    fillAllFields: 'Please fill all fields',
    requestSent: 'Request sent successfully',
    languageChanged: 'Language changed successfully',
    mySchedule: 'My Schedule',
    teacherSchedule: 'Teacher Schedule',
    studentSchedule: 'Student Schedule',
    parentSchedule: 'Parent Schedule',
    addLesson: 'Add Lesson',
    editLesson: 'Edit Lesson',
    deleteLesson: 'Delete Lesson',
    selectSubject: 'Select Subject',
    selectTeacher: 'Select Teacher',
    selectTimeSlot: 'Select Time Slot',
    lessonAdded: 'Lesson added successfully',
    lessonUpdated: 'Lesson updated successfully',
    lessonDeleted: 'Lesson deleted successfully',
    confirmDelete: 'Are you sure you want to delete?',
    warning: 'Warning',
    viewDetails: 'View Details',
    close: 'Close',
    submit: 'Submit',
    selectAll: 'Select All',
    deselectAll: 'Deselect All',
    search: 'Search',
    sortBy: 'Sort by',
    name: 'Name',
    date: 'Date',
    status: 'Status',
    action: 'Action',
    details: 'Details',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    finish: 'Finish',
    myChildren: 'My Children',
    todayClasses: 'Today\'s Classes',
    marked: 'Marked',
    admin: 'Administrator',
    teacher: 'Teacher',
    student: 'Student',
    parent: 'Parent',
    user: 'User',
    selectLesson: 'Select lesson',
    adminComment: 'Admin comment',
    created: 'Created',
    deleted: 'Deleted',
    noUnread: 'No unread notifications',
    noRead: 'No read notifications',
    confirmLogout: 'Are you sure you want to logout?',
    usernameTooShort: 'Username must be at least 3 characters',
  },
  ru: {
    // Common
    save: 'Сохранить',
    cancel: 'Отмена',
    edit: 'Редактировать',
    delete: 'Удалить',
    confirm: 'Подтвердить',
    loading: 'Загрузка...',
    error: 'Ошибка',
    success: 'Успешно',
    yes: 'Да',
    no: 'Нет',
    
    // Auth
    login: 'Войти',
    logout: 'Выйти',
    username: 'Логин',
    password: 'Пароль',
    currentPassword: 'Текущий пароль',
    newPassword: 'Новый пароль',
    confirmPassword: 'Подтвердите пароль',
    
    // Navigation
    dashboard: 'Главная',
    schedule: 'Расписание',
    attendance: 'Посещаемость',
    profile: 'Профиль',
    leaveRequests: 'Заявки на отпуск',
    notifications: 'Уведомления',
    reports: 'Отчеты',
    
    // Dashboard
    welcome: 'Добро пожаловать',
    attendanceRate: 'Процент посещаемости',
    upcomingClasses: 'Предстоящие занятия',
    recentActivity: 'Последняя активность',
    statistics: 'Статистика',
    
    // Schedule
    today: 'Сегодня',
    tomorrow: 'Завтра',
    week: 'Неделя',
    noSchedule: 'Нет расписания на этот день',
    
    // Attendance
    present: 'Присутствует',
    absent: 'Отсутствует',
    late: 'Опоздал',
    excused: 'Уважительная',
    markAttendance: 'Отметить посещаемость',
    attendanceMarked: 'Посещаемость отмечена',
    
    // Profile
    personalInfo: 'Личная информация',
    firstName: 'Имя',
    lastName: 'Фамилия',
    phoneNumber: 'Телефон',
    address: 'Адрес',
    emergencyContact: 'Контакт для связи',
    emergencyContactName: 'Имя контакта',
    emergencyContactPhone: 'Телефон контакта',
    changePassword: 'Изменить пароль',
    changeUsername: 'Изменить логин',
    profileUpdated: 'Профиль обновлен',
    passwordChanged: 'Пароль изменен',
    usernameChanged: 'Логин изменен',
    
    // Leave Requests
    requestLeave: 'Запросить отпуск',
    leaveType: 'Тип отпуска',
    startDate: 'Дата начала',
    endDate: 'Дата окончания',
    reason: 'Причина',
    pending: 'В ожидании',
    approved: 'Одобрено',
    rejected: 'Отклонено',
    submitRequest: 'Отправить запрос',
    
    // Settings
    settings: 'Настройки',
    language: 'Язык',
    selectLanguage: 'Выбрать язык',
    
    // Messages
    enterUsername: 'Введите логин',
    enterPassword: 'Введите пароль',
    invalidCredentials: 'Неверные данные',
    loginFailed: 'Ошибка входа',
    profileUpdateFailed: 'Не удалось обновить профиль',
    passwordTooShort: 'Пароль должен содержать минимум 6 символов',
    passwordsNotMatch: 'Пароли не совпадают',
    enterNewUsername: 'Введите новый логин',
    
    // Additional
    students: 'Студенты',
    teachers: 'Преподаватели',
    groups: 'Группы',
    subjects: 'Предметы',
    courses: 'Курсы',
    todayStatistics: 'Статистика сегодня',
    total: 'Всего',
    room: 'Кабинет',
    time: 'Время',
    day: 'День',
    monday: 'Понедельник',
    tuesday: 'Вторник',
    wednesday: 'Среда',
    thursday: 'Четверг',
    friday: 'Пятница',
    saturday: 'Суббота',
    sunday: 'Воскресенье',
    selectCourse: 'Выберите курс',
    selectGroup: 'Выберите группу',
    noData: 'Нет данных',
    refresh: 'Обновить',
    filter: 'Фильтр',
    all: 'Все',
    unread: 'Непрочитанные',
    read: 'Прочитанные',
    markAsRead: 'Отметить как прочитанное',
    markAllAsRead: 'Отметить все как прочитанные',
    deleteNotification: 'Удалить уведомление',
    fillAllFields: 'Заполните все поля',
    requestSent: 'Запрос отправлен',
    languageChanged: 'Язык изменен',
    mySchedule: 'Мое расписание',
    teacherSchedule: 'Расписание преподавателя',
    studentSchedule: 'Расписание студента',
    parentSchedule: 'Расписание ребенка',
    addLesson: 'Добавить урок',
    editLesson: 'Редактировать урок',
    deleteLesson: 'Удалить урок',
    selectSubject: 'Выберите предмет',
    selectTeacher: 'Выберите преподавателя',
    selectTimeSlot: 'Выберите время',
    lessonAdded: 'Урок добавлен',
    lessonUpdated: 'Урок обновлен',
    lessonDeleted: 'Урок удален',
    confirmDelete: 'Вы уверены, что хотите удалить?',
    warning: 'Предупреждение',
    viewDetails: 'Просмотр деталей',
    close: 'Закрыть',
    submit: 'Отправить',
    selectAll: 'Выбрать все',
    deselectAll: 'Снять выбор',
    search: 'Поиск',
    sortBy: 'Сортировать',
    name: 'Имя',
    date: 'Дата',
    status: 'Статус',
    action: 'Действие',
    details: 'Детали',
    back: 'Назад',
    next: 'Далее',
    previous: 'Предыдущий',
    finish: 'Завершить',
    myChildren: 'Мои дети',
    todayClasses: 'Уроки сегодня',
    marked: 'Отмечено',
    admin: 'Администратор',
    teacher: 'Преподаватель',
    student: 'Студент',
    parent: 'Родитель',
    user: 'Пользователь',
    selectLesson: 'Выберите урок',
    adminComment: 'Комментарий администратора',
    created: 'Создано',
    deleted: 'Удалено',
    noUnread: 'Нет непрочитанных',
    noRead: 'Нет прочитанных',
    confirmLogout: 'Вы уверены, что хотите выйти?',
    usernameTooShort: 'Логин должен содержать минимум 3 символа',
  },
  ky: {
    // Common
    save: 'Сактоо',
    cancel: 'Жокко чыгаруу',
    edit: 'Өзгөртүү',
    delete: 'Өчүрүү',
    confirm: 'Ырастоо',
    loading: 'Жүктөлүүдө...',
    error: 'Ката',
    success: 'Ийгиликтүү',
    yes: 'Ооба',
    no: 'Жок',
    
    // Auth
    login: 'Кирүү',
    logout: 'Чыгуу',
    username: 'Логин',
    password: 'Пароль',
    currentPassword: 'Учурдагы пароль',
    newPassword: 'Жаңы пароль',
    confirmPassword: 'Паролду ырастоо',
    
    // Navigation
    dashboard: 'Башкы бет',
    schedule: 'Расписание',
    attendance: 'Катышуу',
    profile: 'Профиль',
    leaveRequests: 'Өтүнүчтөр',
    notifications: 'Билдирүүлөр',
    reports: 'Отчеттор',
    
    // Dashboard
    welcome: 'Кош келиңиз',
    attendanceRate: 'Катышуу пайызы',
    upcomingClasses: 'Келечектеги сабактар',
    recentActivity: 'Акыркы иштер',
    statistics: 'Статистика',
    
    // Schedule
    today: 'Бүгүн',
    tomorrow: 'Эртең',
    week: 'Апта',
    noSchedule: 'Бул күнгө расписание жок',
    
    // Attendance
    present: 'Бар',
    absent: 'Жок',
    late: 'Кеч калган',
    excused: 'Себептүү',
    markAttendance: 'Катышууну белгилөө',
    attendanceMarked: 'Катышуу белгиленди',
    
    // Profile
    personalInfo: 'Жеке маалымат',
    firstName: 'Аты',
    lastName: 'Фамилиясы',
    phoneNumber: 'Телефон',
    address: 'Дареги',
    emergencyContact: 'Байланыш үчүн контакт',
    emergencyContactName: 'Контакттын аты',
    emergencyContactPhone: 'Контакттын телефону',
    changePassword: 'Паролду өзгөртүү',
    changeUsername: 'Логинди өзгөртүү',
    profileUpdated: 'Профиль жаңыланды',
    passwordChanged: 'Пароль өзгөртүлдү',
    usernameChanged: 'Логин өзгөртүлдү',
    
    // Leave Requests
    requestLeave: 'Өтүнүч жөнөтүү',
    leaveType: 'Өтүнүчтүн түрү',
    startDate: 'Башталуу датасы',
    endDate: 'Аякталуу датасы',
    reason: 'Себеби',
    pending: 'Күтүүдө',
    approved: 'Кабыл алынды',
    rejected: 'Четке кагылды',
    submitRequest: 'Өтүнүч жөнөтүү',
    
    // Settings
    settings: 'Орнотуулар',
    language: 'Тил',
    selectLanguage: 'Тилди тандоо',
    
    // Messages
    enterUsername: 'Логинди жазыңыз',
    enterPassword: 'Паролду жазыңыз',
    invalidCredentials: 'Туура эмес маалыматтар',
    loginFailed: 'Кирүү мүмкүн болбоду',
    profileUpdateFailed: 'Профилди жаңылоо мүмкүн болбоду',
    passwordTooShort: 'Пароль кеминде 6 символдон турушу керек',
    passwordsNotMatch: 'Пароль туура эмес',
    enterNewUsername: 'Жаңы логинди жазыңыз',
    
    // Additional
    students: 'Студенттер',
    teachers: 'Мугалимдер',
    groups: 'Группалар',
    subjects: 'Предметтер',
    courses: 'Курстар',
    todayStatistics: 'Бүгүнкү статистика',
    total: 'Жалпы',
    room: 'Бөлмө',
    time: 'Убакыт',
    day: 'Күн',
    monday: 'Дүйшөмбү',
    tuesday: 'Шейшемби',
    wednesday: 'Шаршемби',
    thursday: 'Бейшемби',
    friday: 'Жума',
    saturday: 'Ишемби',
    sunday: 'Жекшемби',
    selectCourse: 'Курсту тандаңыз',
    selectGroup: 'Группаны тандаңыз',
    noData: 'Маалымат жок',
    refresh: 'Жаңылоо',
    filter: 'Фильтр',
    all: 'Баары',
    unread: 'Окулбаган',
    read: 'Окулган',
    markAsRead: 'Окулган деп белгилөө',
    markAllAsRead: 'Баарын окулган деп белгилөө',
    deleteNotification: 'Билдирүүнү өчүрүү',
    fillAllFields: 'Бардык талааларды толтуруңуз',
    requestSent: 'Өтүнүч жөнөтүлдү',
    languageChanged: 'Тил өзгөртүлдү',
    mySchedule: 'Менин расписанием',
    teacherSchedule: 'Мугалимдин расписаниеси',
    studentSchedule: 'Студенттин расписаниеси',
    parentSchedule: 'Баланын расписаниеси',
    addLesson: 'Сабак кошуу',
    editLesson: 'Сабакты өзгөртүү',
    deleteLesson: 'Сабакты өчүрүү',
    selectSubject: 'Предметти тандаңыз',
    selectTeacher: 'Мугалимди тандаңыз',
    selectTimeSlot: 'Убакытты тандаңыз',
    lessonAdded: 'Сабак кошулду',
    lessonUpdated: 'Сабак жаңыланды',
    lessonDeleted: 'Сабак өчүрүлдү',
    confirmDelete: 'Өчүрүүнү каалайсызбы?',
    warning: 'Эскертүү',
    viewDetails: 'Толук маалымат',
    close: 'Жабуу',
    submit: 'Жөнөтүү',
    selectAll: 'Баарын тандоо',
    deselectAll: 'Тандоону алып салуу',
    search: 'Издөө',
    sortBy: 'Тартипке келтирүү',
    name: 'Аты',
    date: 'Дата',
    status: 'Статус',
    action: 'Аракет',
    details: 'Толук маалымат',
    back: 'Артка',
    next: 'Кийинки',
    previous: 'Мурунку',
    finish: 'Бүтүрүү',
    myChildren: 'Балдарым',
    todayClasses: 'Бүгүнкү сабактар',
    marked: 'Белгиленген',
    admin: 'Администратор',
    teacher: 'Мугалим',
    student: 'Студент',
    parent: 'Ата-эне',
    user: 'Колдонуучу',
    selectLesson: 'Сабак тандаңыз',
    adminComment: 'Администратордун комментарийи',
    created: 'Түзүлдү',
    deleted: 'Өчүрүлдү',
    noUnread: 'Окулбаган билдирүүлөр жок',
    noRead: 'Окулган билдирүүлөр жок',
    confirmLogout: 'Чынында да чыгып кетүүнү каалайсызбы?',
    usernameTooShort: 'Логин кеминде 3 символдон турушу керек',
  }
};

const LANGUAGE_STORAGE_KEY = '@app_language';

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('ky'); // Default to Kyrgyz
  const [isLoading, setIsLoading] = useState(true);

  // Load saved language on mount
  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (savedLanguage && translations[savedLanguage]) {
        setLanguage(savedLanguage);
      }
    } catch (error) {
      console.error('Error loading language:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const changeLanguage = async (newLanguage) => {
    if (translations[newLanguage]) {
      try {
        await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, newLanguage);
        setLanguage(newLanguage);
      } catch (error) {
        console.error('Error saving language:', error);
      }
    }
  };

  const t = (key) => {
    return translations[language]?.[key] || key;
  };

  const value = {
    language,
    changeLanguage,
    t,
    isLoading,
    availableLanguages: [
      { code: 'en', name: 'English' },
      { code: 'ru', name: 'Русский' },
      { code: 'ky', name: 'Кыргызча' },
    ],
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;
