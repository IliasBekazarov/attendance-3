import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';
import '../styles/reports.css';

function ReportsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  
  // Filters
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  
  // Data
  const [attendanceData, setAttendanceData] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [groups, setGroups] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  
  // Loading
  const [loading, setLoading] = useState(false);
  const [loadingFilters, setLoadingFilters] = useState(true);

  // Translations
  const translations = {
    title: {
      en: 'Attendance Reports',
      ru: 'Отчеты по посещаемости',
      ky: 'Катышуу отчету'
    },
    filters: {
      en: 'Filters',
      ru: 'Фильтры',
      ky: 'Чыпкалар'
    },
    startDate: {
      en: 'Start Date',
      ru: 'Дата начала',
      ky: 'Башталгыч күн'
    },
    endDate: {
      en: 'End Date',
      ru: 'Дата окончания',
      ky: 'Аяктоо күнү'
    },
    group: {
      en: 'Group',
      ru: 'Группа',
      ky: 'Топ'
    },
    student: {
      en: 'Student',
      ru: 'Студент',
      ky: 'Студент'
    },
    subject: {
      en: 'Subject',
      ru: 'Предмет',
      ky: 'Сабак'
    },
    teacher: {
      en: 'Teacher',
      ru: 'Преподаватель',
      ky: 'Мугалим'
    },
    status: {
      en: 'Status',
      ru: 'Статус',
      ky: 'Статус'
    },
    all: {
      en: 'All',
      ru: 'Все',
      ky: 'Баары'
    },
    present: {
      en: 'Present',
      ru: 'Присутствовал',
      ky: 'Келди'
    },
    absent: {
      en: 'Absent',
      ru: 'Отсутствовал',
      ky: 'Келбеди'
    },
    late: {
      en: 'Late',
      ru: 'Опоздал',
      ky: 'Кечикти'
    },
    search: {
      en: 'Search',
      ru: 'Поиск',
      ky: 'Издөө'
    },
    reset: {
      en: 'Reset',
      ru: 'Сбросить',
      ky: 'Тазалоо'
    },
    statistics: {
      en: 'Statistics',
      ru: 'Статистика',
      ky: 'Статистика'
    },
    total: {
      en: 'Total',
      ru: 'Всего',
      ky: 'Баары'
    },
    presentPercent: {
      en: 'Present %',
      ru: 'Присутствовали %',
      ky: 'Келгендер %'
    },
    absentPercent: {
      en: 'Absent %',
      ru: 'Отсутствовали %',
      ky: 'Келбегендер %'
    },
    latePercent: {
      en: 'Late %',
      ru: 'Опоздали %',
      ky: 'Кечиккендер %'
    },
    date: {
      en: 'Date',
      ru: 'Дата',
      ky: 'Күн'
    },
    studentName: {
      en: 'Student Name',
      ru: 'Имя студента',
      ky: 'Студенттин аты'
    },
    noData: {
      en: 'No data found',
      ru: 'Данные не найдены',
      ky: 'Маалымат табылган жок'
    },
    export: {
      en: 'Export',
      ru: 'Экспорт',
      ky: 'Экспорт'
    },
    markedBy: {
      en: 'Marked By',
      ru: 'Отметил',
      ky: 'Белгилеген'
    },
    markedAt: {
      en: 'Marked At',
      ru: 'Время отметки',
      ky: 'Белгиленген убакыт'
    }
  };

  const txt = (key) => {
    const lang = localStorage.getItem('language') || 'en';
    return translations[key]?.[lang] || key;
  };

  // Load filter options
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        setLoadingFilters(true);
        
        // Load based on role
        if (user.role === 'ADMIN' || user.role === 'MANAGER') {
          const [groupsRes, subjectsRes, teachersRes, studentsRes] = await Promise.all([
            api.get('/v1/groups/'),
            api.get('/v1/subjects/'),
            api.get('/v1/teachers/'),
            api.get('/v1/students/')
          ]);
          // Handle both paginated and non-paginated responses
          setGroups(Array.isArray(groupsRes.data) ? groupsRes.data : groupsRes.data.results || []);
          setSubjects(Array.isArray(subjectsRes.data) ? subjectsRes.data : subjectsRes.data.results || []);
          setTeachers(Array.isArray(teachersRes.data) ? teachersRes.data : teachersRes.data.results || []);
          setStudents(Array.isArray(studentsRes.data) ? studentsRes.data : studentsRes.data.results || []);
        } else if (user.role === 'TEACHER') {
          // Teacher sees own subjects and students
          const [subjectsRes, studentsRes] = await Promise.all([
            api.get('/v1/subjects/'),
            api.get('/v1/students/')
          ]);
          setSubjects(Array.isArray(subjectsRes.data) ? subjectsRes.data : subjectsRes.data.results || []);
          setStudents(Array.isArray(studentsRes.data) ? studentsRes.data : studentsRes.data.results || []);
        }
      } catch (error) {
        console.error('Error loading filter options:', error);
      } finally {
        setLoadingFilters(false);
      }
    };

    loadFilterOptions();
  }, [user.role]);

  // Load attendance data
  const loadAttendanceData = async () => {
    try {
      setLoading(true);
      
      const params = {
        start_date: startDate,
        end_date: endDate
      };
      
      if (selectedGroup) params.group = selectedGroup;
      if (selectedStudent) params.student = selectedStudent;
      if (selectedSubject) params.subject = selectedSubject;
      if (selectedTeacher) params.teacher = selectedTeacher;
      if (selectedStatus) params.status = selectedStatus;
      
      const response = await api.get('/v1/reports/attendance/', { params });
      setAttendanceData(response.data.attendance);
      setStatistics(response.data.statistics);
    } catch (error) {
      console.error('Error loading attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load on mount
  useEffect(() => {
    if (!loadingFilters) {
      loadAttendanceData();
    }
  }, [loadingFilters]);

  // Handle search
  const handleSearch = () => {
    loadAttendanceData();
  };

  // Handle reset
  const handleReset = () => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    setStartDate(date.toISOString().split('T')[0]);
    setEndDate(new Date().toISOString().split('T')[0]);
    setSelectedGroup('');
    setSelectedStudent('');
    setSelectedSubject('');
    setSelectedTeacher('');
    setSelectedStatus('');
    
    setTimeout(() => {
      loadAttendanceData();
    }, 100);
  };

  // Get status badge class
  const getStatusBadge = (status) => {
    const badges = {
      'Present': 'status-present',
      'Absent': 'status-absent',
      'Late': 'status-late'
    };
    return badges[status] || '';
  };

  // Role-based filter visibility
  const canSeeGroupFilter = user.role === 'ADMIN' || user.role === 'MANAGER';
  const canSeeTeacherFilter = user.role === 'ADMIN' || user.role === 'MANAGER';
  const canSeeStudentFilter = user.role !== 'STUDENT';

  return (
    <div className="reports-container">
      <div className="reports-header">
        <h1>{txt('title')}</h1>
      </div>

      {/* Filters */}
      <div className="reports-filters">
        <h3>{txt('filters')}</h3>
        <div className="filters-grid">
          {/* Date Range */}
          <div className="filter-item">
            <label>{txt('startDate')}</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="filter-input"
            />
          </div>
          
          <div className="filter-item">
            <label>{txt('endDate')}</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="filter-input"
            />
          </div>

          {/* Group Filter */}
          {canSeeGroupFilter && (
            <div className="filter-item">
              <label>{txt('group')}</label>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="filter-select"
              >
                <option value="">{txt('all')}</option>
                {groups.map(group => (
                  <option key={group.id} value={group.id}>{group.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Student Filter */}
          {canSeeStudentFilter && (
            <div className="filter-item">
              <label>{txt('student')}</label>
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="filter-select"
              >
                <option value="">{txt('all')}</option>
                {students.map(student => (
                  <option key={student.id} value={student.id}>
                    {student.user.first_name} {student.user.last_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Subject Filter */}
          <div className="filter-item">
            <label>{txt('subject')}</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="filter-select"
            >
              <option value="">{txt('all')}</option>
              {subjects.map(subject => (
                <option key={subject.id} value={subject.id}>{subject.subject_name}</option>
              ))}
            </select>
          </div>

          {/* Teacher Filter */}
          {canSeeTeacherFilter && (
            <div className="filter-item">
              <label>{txt('teacher')}</label>
              <select
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
                className="filter-select"
              >
                <option value="">{txt('all')}</option>
                {teachers.map(teacher => (
                  <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Status Filter */}
          <div className="filter-item">
            <label>{txt('status')}</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="filter-select"
            >
              <option value="">{txt('all')}</option>
              <option value="Present">{txt('present')}</option>
              <option value="Absent">{txt('absent')}</option>
              <option value="Late">{txt('late')}</option>
            </select>
          </div>
        </div>

        <div className="filters-actions">
          <button onClick={handleSearch} className="btn-search">
            {txt('search')}
          </button>
          <button onClick={handleReset} className="btn-reset">
            {txt('reset')}
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="statistics-cards">
          <div className="stat-card stat-total">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h4>{txt('total')}</h4>
              <p className="stat-value">{statistics.total}</p>
            </div>
          </div>

          <div className="stat-card stat-present">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h4>{txt('present')}</h4>
              <p className="stat-value">{statistics.present}</p>
              <span className="stat-percent">{statistics.present_percentage}%</span>
            </div>
          </div>

          <div className="stat-card stat-absent">
            <div className="stat-icon">❌</div>
            <div className="stat-content">
              <h4>{txt('absent')}</h4>
              <p className="stat-value">{statistics.absent}</p>
              <span className="stat-percent">{statistics.absent_percentage}%</span>
            </div>
          </div>

          <div className="stat-card stat-late">
            <div className="stat-icon">⏰</div>
            <div className="stat-content">
              <h4>{txt('late')}</h4>
              <p className="stat-value">{statistics.late}</p>
              <span className="stat-percent">{statistics.late_percentage}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Table */}
      <div className="attendance-table-container">
        {loading ? (
          <div className="loading-spinner">Loading...</div>
        ) : attendanceData.length === 0 ? (
          <div className="no-data">{txt('noData')}</div>
        ) : (
          <table className="attendance-table">
            <thead>
              <tr>
                <th>{txt('date')}</th>
                <th>{txt('studentName')}</th>
                <th>{txt('group')}</th>
                <th>{txt('subject')}</th>
                <th>{txt('teacher')}</th>
                <th>{txt('status')}</th>
                <th>{txt('markedAt')}</th>
                <th>{txt('markedBy')}</th>
              </tr>
            </thead>
            <tbody>
              {attendanceData.map((record) => (
                <tr key={record.id}>
                  <td>{record.date}</td>
                  <td>{record.student_name}</td>
                  <td>{record.group}</td>
                  <td>{record.subject}</td>
                  <td>{record.teacher}</td>
                  <td>
                    <span className={`status-badge ${getStatusBadge(record.status)}`}>
                      {record.status_display}
                    </span>
                  </td>
                  <td>{record.marked_at}</td>
                  <td>{record.marked_by}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default ReportsPage;
