import { createContext, useState, useContext } from 'react'

const LanguageContext = createContext()

export { LanguageContext }

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}

const translations = {
  ky: {
    // Navigation
    dashboard: 'Башкы бет',
    schedule: 'Расписание',
    profile: 'Профиль',
    notifications: 'Билдирүүлөр',
    leaveRequests: 'Арыз берүү',
    reports: 'Отчеттор',
    logout: 'Чыгуу',
    
    // Common
    save: 'Сактоо',
    cancel: 'Жокко чыгаруу',
    delete: 'Өчүрүү',
    edit: 'Өзгөртүү',
    search: 'Издөө',
    loading: 'Жүктөлүүдө...',
    
    // Auth
    login: 'Кирүү',
    username: 'Колдонуучу аты',
    password: 'Сыр сөз',
    
    // Roles
    admin: 'Админ',
    manager: 'Менеджер',
    teacher: 'Мугалим',
    student: 'Студент',
    parent: 'Ата-эне'
  },
  ru: {
    // Navigation
    dashboard: 'Главная',
    schedule: 'Расписание',
    profile: 'Профиль',
    notifications: 'Уведомления',
    leaveRequests: 'Заявки',
    reports: 'Отчеты',
    logout: 'Выход',
    
    // Common
    save: 'Сохранить',
    cancel: 'Отмена',
    delete: 'Удалить',
    edit: 'Изменить',
    search: 'Поиск',
    loading: 'Загрузка...',
    
    // Auth
    login: 'Войти',
    username: 'Имя пользователя',
    password: 'Пароль',
    
    // Roles
    admin: 'Администратор',
    manager: 'Менеджер',
    teacher: 'Учитель',
    student: 'Студент',
    parent: 'Родитель'
  },
  en: {
    // Navigation
    dashboard: 'Dashboard',
    schedule: 'Schedule',
    profile: 'Profile',
    notifications: 'Notifications',
    leaveRequests: 'Leave Requests',
    reports: 'Reports',
    logout: 'Logout',
    
    // Common
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    search: 'Search',
    loading: 'Loading...',
    
    // Auth
    login: 'Login',
    username: 'Username',
    password: 'Password',
    
    // Roles
    admin: 'Administrator',
    manager: 'Manager',
    teacher: 'Teacher',
    student: 'Student',
    parent: 'Parent'
  }
}

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(
    localStorage.getItem('language') || 'ky'
  )

  const changeLanguage = (lang) => {
    setLanguage(lang)
    localStorage.setItem('language', lang)
  }

  const t = (key) => {
    return translations[language][key] || key
  }

  const value = {
    language,
    changeLanguage,
    t
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}
