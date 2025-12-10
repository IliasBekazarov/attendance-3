import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';


const { width } = Dimensions.get('window');

const DashboardScreen = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/v1/dashboard/stats/');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  // Admin/Manager Dashboard
  const renderAdminDashboard = () => (
    <>
      <View style={styles.statsGrid}>
        <StatCard
          title="Студенттер"
          value={stats?.total_students || 0}
          icon="people"
          color="#667eea"
          gradient={['#002fffff', '#2200ffff']}
        />
        <StatCard
          title="Мугалимдер"
          value={stats?.total_teachers || 0}
          icon="school"
          color="#48bb78"
          gradient={['#48bb78', '#38a169']}
        />
        <StatCard
          title="Группалар"
          value={stats?.total_groups || 0}
          icon="layers"
          color="#4299e1"
          gradient={['#4299e1', '#3182ce']}
        />
        <StatCard
          title="Предметтер"
          value={stats?.total_subjects || 0}
          icon="book"
          color="#ed8936"
          gradient={['#ed8936', '#dd6b20']}
        />
      </View>

      {/* Today's Statistics */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Icon name="calendar" size={20} color="#667eea" />
          <Text style={styles.cardTitle}>Бүгүнкү статистика</Text>
        </View>
        <View style={styles.todayStatsContainer}>
          <TodayStatItem
            label="Жалпы"
            value={stats?.today_total || 0}
            color="#4299e1"
            percentage={100}
          />
          <TodayStatItem
            label="Келген"
            value={stats?.today_present || 0}
            color="#48bb78"
            percentage={stats?.today_present_rate || 0}
          />
          <TodayStatItem
            label="Келбеген"
            value={stats?.today_absent || 0}
            color="#f56565"
            percentage={stats?.today_absent_rate || 0}
          />
          <TodayStatItem
            label="Кечикти"
            value={stats?.today_late || 0}
            color="#ed8936"
            percentage={stats?.today_late_rate || 0}
          />
        </View>
      </View>

      {/* Groups Statistics Table */}
      {stats?.groups_stats && stats.groups_stats.length > 0 && (
        <View style={[styles.card, styles.tableCard]}>
          <View style={styles.cardHeader}>
            <Icon name="stats-chart" size={20} color="#667eea" />
            <Text style={styles.cardTitle}>Группалар боюнча статистика</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { width: 150 }]}>Группа</Text>
                <Text style={[styles.tableHeaderCell, { width: 80 }]}>Жалпы</Text>
                <Text style={[styles.tableHeaderCell, { width: 80 }]}>Келген</Text>
                <Text style={[styles.tableHeaderCell, { width: 80 }]}>Келбеген</Text>
                <Text style={[styles.tableHeaderCell, { width: 80 }]}>Пайыз</Text>
              </View>
              {stats.groups_stats.map((group) => (
                <View key={group.id} style={styles.tableRow}>
                  <View style={[styles.tableCell, { width: 150 }]}>
                    <Text style={styles.groupName}>{group.name}</Text>
                    <Text style={styles.courseName}>{group.course?.name}</Text>
                  </View>
                  <View style={[styles.tableCell, styles.centerCell, { width: 80 }]}>
                    <Text style={styles.badge}>{group.total_records || 0}</Text>
                  </View>
                  <View style={[styles.tableCell, styles.centerCell, { width: 80 }]}>
                    <Text style={[styles.badge, styles.successBadge]}>
                      {group.present_count || 0}
                    </Text>
                  </View>
                  <View style={[styles.tableCell, styles.centerCell, { width: 80 }]}>
                    <Text style={[styles.badge, styles.dangerBadge]}>
                      {group.absent_count || 0}
                    </Text>
                  </View>
                  <View style={[styles.tableCell, styles.centerCell, { width: 80 }]}>
                    <View style={styles.progressContainer}>
                      <View style={[styles.progressBar, { width: '100%' }]}>
                        <View
                          style={[
                            styles.progressFill,
                            {
                              width: `${group.attendance_rate || 0}%`,
                              backgroundColor:
                                group.attendance_rate >= 80
                                  ? '#48bb78'
                                  : group.attendance_rate >= 60
                                  ? '#ed8936'
                                  : '#f56565',
                            },
                          ]}
                        >
                          <Text style={styles.progressText}>
                            {group.attendance_rate || 0}%
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      )}
    </>
  );

  // Student Dashboard
  const renderStudentDashboard = () => (
    <View style={styles.statsGrid}>
      <StatCard
        title="Катышуу пайызы"
        value={`${stats?.attendance_percentage || 0}%`}
        icon="trending-up"
        color="#667eea"
        gradient={['#667eea', '#764ba2']}
      />
      <StatCard
        title="Келген күндөр"
        value={stats?.present_days || 0}
        icon="checkmark-circle"
        color="#48bb78"
        gradient={['#48bb78', '#38a169']}
      />
      <StatCard
        title="Келбеген күндөр"
        value={stats?.absent_days || 0}
        icon="close-circle"
        color="#f56565"
        gradient={['#f56565', '#e53e3e']}
      />
      <StatCard
        title="Кеч калган"
        value={stats?.late_days || 0}
        icon="time"
        color="#ed8936"
        gradient={['#ed8936', '#dd6b20']}
      />
    </View>
  );

  // Parent Dashboard
  const renderParentDashboard = () => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Icon name="people" size={20} color="#667eea" />
        <Text style={styles.cardTitle}>Балдарым</Text>
      </View>
      <View style={styles.childrenGrid}>
        {stats?.my_children?.map((child) => (
          <ChildCard key={child.id} child={child} />
        ))}
      </View>
    </View>
  );

  // Teacher Dashboard
  const renderTeacherDashboard = () => (
    <View style={styles.statsGrid}>
      <StatCard
        title="Бүгүнкү сабактар"
        value={stats?.today_classes_count || 0}
        icon="calendar"
        color="#667eea"
        gradient={['#667eea', '#764ba2']}
      />
      <StatCard
        title="Белгиленген"
        value={stats?.marked_classes_count || 0}
        icon="checkmark-done"
        color="#48bb78"
        gradient={['#48bb78', '#38a169']}
      />
      <StatCard
        title="Күтүүдө"
        value={stats?.unmarked_classes_count || 0}
        icon="time"
        color="#ed8936"
        gradient={['#ed8936', '#dd6b20']}
      />
      <StatCard
        title="Студенттер"
        value={stats?.my_students_count || 0}
        icon="people"
        color="#4299e1"
        gradient={['#4299e1', '#3182ce']}
      />
    </View>
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
      showsVerticalScrollIndicator={false}
    >
      {/* User Profile Header */}
      <LinearGradient
        colors={['#1500ffff', '#1500ffff']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.userInfo}>
          {user?.profile_photo ? (
            <Image
              source={{ uri: user.profile_photo }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Icon name="person" size={40} color="#fff"  />
            </View>
          )}
          <View style={styles.userDetails}>
            <Text style={styles.greeting}>Салам,</Text>
            <Text style={styles.userName}>{user?.full_name || user?.username}</Text>
            <View style={styles.roleBadge}>
              <Icon name="shield" size={12} color="#fff" />
              <Text style={styles.roleText}>
                {user?.role === 'ADMIN' ? 'Администратор' :
                 user?.role === 'TEACHER' ? 'Мугалим' :
                 user?.role === 'STUDENT' ? 'Студент' :
                 user?.role === 'PARENT' ? 'Ата-эне' : 'Колдонуучу'}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {user?.role === 'ADMIN' || user?.role === 'MANAGER'
          ? renderAdminDashboard()
          : user?.role === 'STUDENT'
          ? renderStudentDashboard()
          : user?.role === 'PARENT'
          ? renderParentDashboard()
          : user?.role === 'TEACHER'
          ? renderTeacherDashboard()
          : null}
      </View>
    </ScrollView>
  );
};

// Stat Card Component
const StatCard = ({ title, value, icon, color, gradient }) => (
  <TouchableOpacity style={styles.statCard}>
    <LinearGradient
      colors={gradient}
      style={[styles.statGradient, { borderLeftColor: color }]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.statIconContainer}>
        <Icon name={icon} size={24} color="#fff" />
      </View>
      <Text style={styles.statNumber}>{value}</Text>
      <Text style={styles.statLabel}>{title}</Text>
    </LinearGradient>
  </TouchableOpacity>
);

// Today Stat Item Component
const TodayStatItem = ({ label, value, color, percentage }) => (
  <View style={styles.todayStatItem}>
    <View style={styles.todayStatHeader}>
      <View style={[styles.colorDot, { backgroundColor: color }]} />
      <Text style={styles.todayStatLabel}>{label}</Text>
    </View>
    <Text style={styles.todayStatValue}>{value}</Text>
    <View style={styles.progressBar}>
      <View
        style={[
          styles.progressFill,
          { width: `${percentage}%`, backgroundColor: color },
        ]}
      />
    </View>
  </View>
);

// Child Card Component
const ChildCard = ({ child }) => (
  <View style={styles.childCard}>
    <View style={styles.childHeader}>
      <Icon name="person-circle" size={40} color="#667eea" />
      <View style={styles.childInfo}>
        <Text style={styles.childName}>{child.name}</Text>
        <Text style={styles.childGroup}>{child.group?.name}</Text>
      </View>
    </View>
    <View style={styles.childStats}>
      <View style={styles.childStatItem}>
        <Text style={[styles.childStatValue, styles.successText]}>
          {child.present_count || 0}
        </Text>
        <Text style={styles.childStatLabel}>Келген</Text>
      </View>
      <View style={styles.childStatItem}>
        <Text style={[styles.childStatValue, styles.dangerText]}>
          {child.absent_count || 0}
        </Text>
        <Text style={styles.childStatLabel}>Келбеген</Text>
      </View>
      <View style={styles.childStatItem}>
        <Text style={[styles.childStatValue, styles.primaryText]}>
          {child.attendance_percentage || 0}%
        </Text>
        <Text style={styles.childStatLabel}>Пайыз</Text>
      </View>
    </View>
  </View>
);


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#667eea',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  userDetails: {
    marginLeft: 15,
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 2,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 12,
    color: '#fff',
    marginLeft: 5,
  },
  content: {
    padding: 15,
    marginTop: -15,
  },
  statsGrid: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    marginBottom: 15,
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  statGradient: {
    padding: 15,
    borderRadius: 15,
    borderLeftWidth: 4,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 5,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  tableCard: {
    padding: 15,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
    marginLeft: 10,
  },
  todayStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  todayStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  todayStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 5,
  },
  todayStatLabel: {
    fontSize: 12,
    color: '#718096',
  },
  todayStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 5,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f7fafc',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tableHeaderCell: {
    paddingHorizontal: 10,
    fontWeight: 'bold',
    color: '#4a5568',
    fontSize: 14,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 12,
  },
  tableCell: {
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  centerCell: {
    alignItems: 'center',
  },
  groupName: {
    fontWeight: 'bold',
    color: '#2d3748',
    fontSize: 14,
  },
  courseName: {
    fontSize: 12,
    color: '#718096',
    marginTop: 2,
  },
  badge: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4a5568',
  },
  successBadge: {
    backgroundColor: '#c6f6d5',
    color: '#22543d',
  },
  dangerBadge: {
    backgroundColor: '#fed7d7',
    color: '#742a2a',
  },
  progressContainer: {
    width: '100%',
  },
  progressText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  childrenGrid: {
    marginTop: 10,
  },
  childCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  childHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  childInfo: {
    marginLeft: 15,
  },
  childName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  childGroup: {
    fontSize: 14,
    color: '#718096',
    marginTop: 2,
  },
  childStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  childStatItem: {
    alignItems: 'center',
  },
  childStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  childStatLabel: {
    fontSize: 12,
    color: '#718096',
    marginTop: 2,
  },
  successText: {
    color: '#48bb78',
  },
  dangerText: {
    color: '#f56565',
  },
  primaryText: {
    color: '#667eea',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 12,
    color: '#4a5568',
    textAlign: 'center',
  },
});

export default DashboardScreen;