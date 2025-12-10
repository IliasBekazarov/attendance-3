import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const AttendanceScreen = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [todaySchedules, setTodaySchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [saving, setSaving] = useState(false);

  const days = {
    0: 'Sunday',
    1: 'Monday',
    2: 'Tuesday',
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday',
    6: 'Saturday'
  };

  useEffect(() => {
    loadTodaySchedules();
  }, []);

  const loadTodaySchedules = async () => {
    setLoading(true);
    try {
      const today = new Date();
      const dayName = days[today.getDay()];
      
      const response = await api.get(`/v1/schedules/my_schedule/?day=${dayName}`);
      const mySchedules = Array.isArray(response.data) ? response.data : response.data.results || [];
      setTodaySchedules(mySchedules);
    } catch (error) {
      console.error('Сабактарды жүктөөдө ката:', error);
      Alert.alert('Ката', 'Сабактарды жүктөөдө ката чыкты');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleSelect = async (schedule) => {
    setSelectedSchedule(schedule);
    
    if (schedule.group) {
      try {
        setLoading(true);
        const response = await api.get(`/v1/students/?group=${schedule.group.id}`);
        const studentsList = Array.isArray(response.data) ? response.data : response.data.results || [];
        setStudents(studentsList);
        
        // Set all to Present by default
        const initialAttendance = {};
        studentsList.forEach(student => {
          initialAttendance[student.id] = 'Present';
        });
        setAttendance(initialAttendance);
      } catch (error) {
        console.error('Студенттерди жүктөөдө ката:', error);
        Alert.alert('Ката', 'Студенттерди жүктөөдө ката чыкты');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAttendanceChange = (studentId, status) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const markAll = (status) => {
    const newAttendance = {};
    students.forEach(student => {
      newAttendance[student.id] = status;
    });
    setAttendance(newAttendance);
  };

  const saveAttendance = async () => {
    if (!selectedSchedule) {
      Alert.alert('Эскертүү', 'Сабак тандаңыз');
      return;
    }

    const attendanceList = students.map(student => ({
      student: student.id,
      schedule: selectedSchedule.id,
      status: attendance[student.id] || 'Present',
      marked_by_student: false
    }));

    setSaving(true);
    try {
      await api.post('/v1/attendance/bulk/', {
        attendance_data: attendanceList
      });
      
      Alert.alert('Ийгилик', 'Attendance сакталды');
      setSelectedSchedule(null);
      setStudents([]);
      setAttendance({});
      loadTodaySchedules();
    } catch (error) {
      console.error('Attendance сактоодо ката:', error);
      Alert.alert('Ката', 'Attendance сактоодо ката чыкты: ' + (error.response?.data?.error || error.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading && todaySchedules.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Жүктөлүүдө...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Attendance белгилөө</Text>
        <Text style={styles.subtitle}>Бүгүнкү сабактар</Text>
      </View>

      {!selectedSchedule ? (
        <View style={styles.schedulesContainer}>
          {todaySchedules.length > 0 ? (
            todaySchedules.map((schedule) => (
              <TouchableOpacity
                key={schedule.id}
                style={styles.scheduleCard}
                onPress={() => handleScheduleSelect(schedule)}
              >
                <View style={styles.scheduleTime}>
                  <Text style={styles.timeText}>{schedule.time_slot?.start_time}</Text>
                  <Text style={styles.timeSeparator}>-</Text>
                  <Text style={styles.timeText}>{schedule.time_slot?.end_time}</Text>
                </View>
                <View style={styles.scheduleInfo}>
                  <Text style={styles.subject}>{schedule.subject?.name}</Text>
                  <Text style={styles.group}>👥 {schedule.group?.name}</Text>
                  <Text style={styles.room}>🚪 Бөлмө: {schedule.room}</Text>
                </View>
                <Text style={styles.arrow}>›</Text>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>📅</Text>
              <Text style={styles.emptyMessage}>Бүгүн сабактар жок</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.attendanceContainer}>
          <View style={styles.selectedSchedule}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => {
                setSelectedSchedule(null);
                setStudents([]);
                setAttendance({});
              }}
            >
              <Text style={styles.backText}>‹ Артка</Text>
            </TouchableOpacity>
            
            <Text style={styles.selectedSubject}>{selectedSchedule.subject?.name}</Text>
            <Text style={styles.selectedGroup}>{selectedSchedule.group?.name}</Text>
            <Text style={styles.selectedTime}>
              {selectedSchedule.time_slot?.start_time} - {selectedSchedule.time_slot?.end_time}
            </Text>
          </View>

          <View style={styles.bulkActions}>
            <TouchableOpacity
              style={[styles.bulkButton, styles.bulkButtonPresent]}
              onPress={() => markAll('Present')}
            >
              <Text style={styles.bulkButtonText}>Баарын Келген</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bulkButton, styles.bulkButtonAbsent]}
              onPress={() => markAll('Absent')}
            >
              <Text style={styles.bulkButtonText}>Баарын Келбеген</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.studentsList}>
            {students.map((student, index) => (
              <View key={student.id} style={styles.studentItem}>
                <Text style={styles.studentNumber}>{index + 1}.</Text>
                <Text style={styles.studentName}>{student.full_name}</Text>
                <View style={styles.statusButtons}>
                  <TouchableOpacity
                    style={[
                      styles.statusButton,
                      styles.presentButton,
                      attendance[student.id] === 'Present' && styles.activePresent
                    ]}
                    onPress={() => handleAttendanceChange(student.id, 'Present')}
                  >
                    <Text style={[
                      styles.statusButtonText,
                      attendance[student.id] === 'Present' && styles.activeButtonText
                    ]}>✓</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.statusButton,
                      styles.absentButton,
                      attendance[student.id] === 'Absent' && styles.activeAbsent
                    ]}
                    onPress={() => handleAttendanceChange(student.id, 'Absent')}
                  >
                    <Text style={[
                      styles.statusButtonText,
                      attendance[student.id] === 'Absent' && styles.activeButtonText
                    ]}>✗</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.statusButton,
                      styles.lateButton,
                      attendance[student.id] === 'Late' && styles.activeLate
                    ]}
                    onPress={() => handleAttendanceChange(student.id, 'Late')}
                  >
                    <Text style={[
                      styles.statusButtonText,
                      attendance[student.id] === 'Late' && styles.activeButtonText
                    ]}>◷</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={saveAttendance}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Сактоо</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#667eea',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    marginTop: 5,
    opacity: 0.9,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  schedulesContainer: {
    padding: 15,
  },
  scheduleCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scheduleTime: {
    width: 80,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#eee',
    paddingRight: 10,
  },
  timeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#667eea',
  },
  timeSeparator: {
    fontSize: 12,
    color: '#999',
    marginVertical: 2,
  },
  scheduleInfo: {
    flex: 1,
    paddingLeft: 15,
  },
  subject: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  group: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  room: {
    fontSize: 14,
    color: '#999',
  },
  arrow: {
    fontSize: 24,
    color: '#667eea',
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    padding: 50,
  },
  emptyText: {
    fontSize: 48,
    marginBottom: 10,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#999',
  },
  attendanceContainer: {
    padding: 15,
  },
  selectedSchedule: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  backButton: {
    marginBottom: 10,
  },
  backText: {
    fontSize: 18,
    color: '#667eea',
    fontWeight: 'bold',
  },
  selectedSubject: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  selectedGroup: {
    fontSize: 16,
    color: '#666',
    marginBottom: 3,
  },
  selectedTime: {
    fontSize: 14,
    color: '#999',
  },
  bulkActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  bulkButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  bulkButtonPresent: {
    backgroundColor: '#28a745',
  },
  bulkButtonAbsent: {
    backgroundColor: '#dc3545',
  },
  bulkButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  studentsList: {
    marginBottom: 20,
  },
  studentItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  studentNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#999',
    width: 30,
  },
  studentName: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  statusButtons: {
    flexDirection: 'row',
  },
  statusButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
    borderWidth: 2,
  },
  presentButton: {
    borderColor: '#28a745',
    backgroundColor: '#fff',
  },
  absentButton: {
    borderColor: '#dc3545',
    backgroundColor: '#fff',
  },
  lateButton: {
    borderColor: '#ffc107',
    backgroundColor: '#fff',
  },
  activePresent: {
    backgroundColor: '#28a745',
  },
  activeAbsent: {
    backgroundColor: '#dc3545',
  },
  activeLate: {
    backgroundColor: '#ffc107',
  },
  statusButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#999',
  },
  activeButtonText: {
    color: '#fff',
  },
  saveButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#999',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default AttendanceScreen;
