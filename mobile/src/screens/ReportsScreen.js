import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Platform
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
// import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';

export default function ReportsScreen() {
  const { user } = useAuth();
  const { t } = useLanguage();

  // Filters
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date;
  });
  const [endDate, setEndDate] = useState(new Date());
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Date pickers visibility
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

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
    }
  };

  const txt = (key) => {
    const lang = user?.language || 'en';
    return translations[key]?.[lang] || key;
  };

  // Load filter options
  useEffect(() => {
    if (user) {
      loadFilterOptions();
    }
  }, [user]);

  const loadFilterOptions = async () => {
    if (!user) return;
    
    try {
      setLoadingFilters(true);

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

  // Load attendance data
  useEffect(() => {
    if (!loadingFilters) {
      loadAttendanceData();
    }
  }, [loadingFilters]);

  const loadAttendanceData = async () => {
    try {
      setLoading(true);

      const params = {
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0]
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

  const handleSearch = () => {
    loadAttendanceData();
  };

  const handleReset = () => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    setStartDate(date);
    setEndDate(new Date());
    setSelectedGroup('');
    setSelectedStudent('');
    setSelectedSubject('');
    setSelectedTeacher('');
    setSelectedStatus('');

    setTimeout(() => {
      loadAttendanceData();
    }, 100);
  };

  // Date picker handlers
  const onStartDateChange = (event, selectedDate) => {
    setShowStartPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };

  const onEndDateChange = (event, selectedDate) => {
    setShowEndPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleDateString('en-GB');
  };

  // Get status badge style
  const getStatusStyle = (status) => {
    switch (status) {
      case 'Present':
        return styles.statusPresent;
      case 'Absent':
        return styles.statusAbsent;
      case 'Late':
        return styles.statusLate;
      default:
        return {};
    }
  };

  // Role-based filter visibility
  const canSeeGroupFilter = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const canSeeTeacherFilter = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const canSeeStudentFilter = user?.role !== 'STUDENT';

  if (!user || loadingFilters) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{txt('title')}</Text>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <Text style={styles.filtersTitle}>{txt('filters')}</Text>

        {/* Date Range */}
        <View style={styles.filterRow}>
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>{txt('startDate')}</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowStartPicker(true)}
            >
              <Text style={styles.dateText}>{formatDate(startDate)}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>{txt('endDate')}</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowEndPicker(true)}
            >
              <Text style={styles.dateText}>{formatDate(endDate)}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {showStartPicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display="default"
            onChange={onStartDateChange}
          />
        )}

        {showEndPicker && (
          <DateTimePicker
            value={endDate}
            mode="date"
            display="default"
            onChange={onEndDateChange}
          />
        )}

        {/* Group Filter */}
        {canSeeGroupFilter && groups.length > 0 && (
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>{txt('group')}</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedGroup}
                onValueChange={setSelectedGroup}
                style={styles.picker}
              >
                <Picker.Item label={txt('all')} value="" />
                {groups.map(group => (
                  <Picker.Item key={group.id} label={group.name} value={group.id.toString()} />
                ))}
              </Picker>
            </View>
          </View>
        )}

        {/* Student Filter */}
        {canSeeStudentFilter && students.length > 0 && (
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>{txt('student')}</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedStudent}
                onValueChange={setSelectedStudent}
                style={styles.picker}
              >
                <Picker.Item label={txt('all')} value="" />
                {students.map(student => (
                  <Picker.Item
                    key={student.id}
                    label={`${student.user.first_name} ${student.user.last_name}`}
                    value={student.id.toString()}
                  />
                ))}
              </Picker>
            </View>
          </View>
        )}

        {/* Subject Filter */}
        {subjects.length > 0 && (
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>{txt('subject')}</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedSubject}
                onValueChange={setSelectedSubject}
                style={styles.picker}
              >
                <Picker.Item label={txt('all')} value="" />
                {subjects.map(subject => (
                  <Picker.Item key={subject.id} label={subject.subject_name} value={subject.id.toString()} />
                ))}
              </Picker>
            </View>
          </View>
        )}

        {/* Teacher Filter */}
        {canSeeTeacherFilter && teachers.length > 0 && (
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>{txt('teacher')}</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedTeacher}
                onValueChange={setSelectedTeacher}
                style={styles.picker}
              >
                <Picker.Item label={txt('all')} value="" />
                {teachers.map(teacher => (
                  <Picker.Item key={teacher.id} label={teacher.name} value={teacher.id.toString()} />
                ))}
              </Picker>
            </View>
          </View>
        )}

        {/* Status Filter */}
        <View style={styles.filterItem}>
          <Text style={styles.filterLabel}>{txt('status')}</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedStatus}
              onValueChange={setSelectedStatus}
              style={styles.picker}
            >
              <Picker.Item label={txt('all')} value="" />
              <Picker.Item label={txt('present')} value="Present" />
              <Picker.Item label={txt('absent')} value="Absent" />
              <Picker.Item label={txt('late')} value="Late" />
            </Picker>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.filterActions}>
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Text style={styles.searchButtonText}>{txt('search')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Text style={styles.resetButtonText}>{txt('reset')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Statistics Cards */}
      {statistics && (
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, styles.statTotal]}>
            <Text style={styles.statIcon}></Text>
            <Text style={styles.statLabel}>{txt('total')}</Text>
            <Text style={styles.statValue}>{statistics.total}</Text>
          </View>

          <View style={[styles.statCard, styles.statPresent]}>
            <Text style={styles.statIcon}></Text>
            <Text style={styles.statLabel}>{txt('present')}</Text>
            <Text style={styles.statValue}>{statistics.present}</Text>
            <Text style={styles.statPercent}>{statistics.present_percentage}%</Text>
          </View>

          <View style={[styles.statCard, styles.statAbsent]}>
            <Text style={styles.statIcon}></Text>
            <Text style={styles.statLabel}>{txt('absent')}</Text>
            <Text style={styles.statValue}>{statistics.absent}</Text>
            <Text style={styles.statPercent}>{statistics.absent_percentage}%</Text>
          </View>

          <View style={[styles.statCard, styles.statLate]}>
            <Text style={styles.statIcon}></Text>
            <Text style={styles.statLabel}>{txt('late')}</Text>
            <Text style={styles.statValue}>{statistics.late}</Text>
            <Text style={styles.statPercent}>{statistics.late_percentage}%</Text>
          </View>
        </View>
      )}

      {/* Attendance List */}
      <View style={styles.dataContainer}>
        {loading ? (
          <ActivityIndicator size="large" color="#4CAF50" style={styles.loader} />
        ) : attendanceData.length === 0 ? (
          <Text style={styles.noData}>{txt('noData')}</Text>
        ) : (
          attendanceData.map((record) => (
            <View key={record.id} style={styles.recordCard}>
              <View style={styles.recordHeader}>
                <Text style={styles.recordDate}>{record.date}</Text>
                <View style={[styles.statusBadge, getStatusStyle(record.status)]}>
                  <Text style={styles.statusText}>{record.status_display}</Text>
                </View>
              </View>
              <Text style={styles.recordStudent}>{record.student_name}</Text>
              <View style={styles.recordDetails}>
                <Text style={styles.recordDetail}>{record.subject}</Text>
                <Text style={styles.recordDetail}>{record.group}</Text>
              </View>
              <Text style={styles.recordTeacher}>{record.teacher}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333'
  },
  filtersContainer: {
    backgroundColor: 'white',
    padding: 16,
    marginTop: 8,
    borderRadius: 12,
    marginHorizontal: 12
  },
  filtersTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12
  },
  filterItem: {
    flex: 1,
    marginBottom: 12
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginBottom: 6
  },
  dateButton: {
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  dateText: {
    fontSize: 14,
    color: '#333'
  },
  pickerContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden'
  },
  picker: {
    height: 50
  },
  filterActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8
  },
  searchButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center'
  },
  searchButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center'
  },
  resetButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600'
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 12
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  statIcon: {
    fontSize: 32,
    marginBottom: 8
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333'
  },
  statPercent: {
    fontSize: 14,
    color: '#4CAF50',
    marginTop: 4,
    fontWeight: '600'
  },
  statTotal: {
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3'
  },
  statPresent: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50'
  },
  statAbsent: {
    borderLeftWidth: 4,
    borderLeftColor: '#f44336'
  },
  statLate: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800'
  },
  dataContainer: {
    padding: 12
  },
  loader: {
    marginTop: 40
  },
  noData: {
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
    marginTop: 40
  },
  recordCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  recordDate: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500'
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600'
  },
  statusPresent: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)'
  },
  statusAbsent: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)'
  },
  statusLate: {
    backgroundColor: 'rgba(255, 152, 0, 0.1)'
  },
  recordStudent: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8
  },
  recordDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 4
  },
  recordDetail: {
    fontSize: 14,
    color: '#666'
  },
  recordTeacher: {
    fontSize: 14,
    color: '#666',
    marginTop: 4
  }
});
