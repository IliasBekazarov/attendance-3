import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Icon from 'react-native-vector-icons/FontAwesome5';

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, unread, read

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await api.get('/v1/notifications/', { params });
      const data = response.data;
      setNotifications(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      Alert.alert('Ката', 'Билдирүүлөрдү жүктөөдө ката чыкты');
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.post(`/v1/notifications/${notificationId}/mark_read/`);
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark as read:', error);
      Alert.alert('Ката', 'Белгилөөдө ката чыкты');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/v1/notifications/mark_all_read/');
      fetchNotifications();
      Alert.alert('Ийгиликтүү', 'Баары окулган деп белгиленди');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      Alert.alert('Ката', 'Белгилөөдө ката чыкты');
    }
  };

  const deleteNotification = async (notificationId) => {
    Alert.alert(
      'Билдирүүнү өчүрүү',
      'Билдирүүнү өчүрөсүзбү?',
      [
        { text: 'Жокко чыгаруу', style: 'cancel' },
        {
          text: 'Өчүрүү',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/v1/notifications/${notificationId}/`);
              fetchNotifications();
              Alert.alert('Ийгиликтүү', 'Билдирүү өчүрүлдү');
            } catch (error) {
              console.error('Failed to delete notification:', error);
              Alert.alert('Ката', 'Өчүрүүдө ката чыкты');
            }
          }
        }
      ]
    );
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'ATTENDANCE':
        return 'calendar-check';
      case 'LEAVE':
        return 'file-medical';
      case 'ANNOUNCEMENT':
        return 'bullhorn';
      case 'SCHEDULE':
        return 'calendar-alt';
      default:
        return 'bell';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'ATTENDANCE':
        return '#48bb78'; // green
      case 'LEAVE':
        return '#4299e1'; // blue
      case 'ANNOUNCEMENT':
        return '#ed8936'; // orange
      case 'SCHEDULE':
        return '#9f7aea'; // purple
      default:
        return '#667eea'; // primary blue
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Азыр эле';
    if (diffMins < 60) return `${diffMins} мүнөт мурун`;
    if (diffHours < 24) return `${diffHours} саат мурун`;
    if (diffDays < 7) return `${diffDays} күн мурун`;
    return date.toLocaleDateString('ky-KG');
  };

  const getUnreadCount = () => {
    return notifications.filter(n => !n.is_read).length;
  };

  const getReadCount = () => {
    return notifications.filter(n => n.is_read).length;
  };

  const renderFilterTabs = () => (
    <View style={styles.filterTabs}>
      <TouchableOpacity
        style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
        onPress={() => setFilter('all')}
      >
        <Icon name="inbox" size={16} color={filter === 'all' ? '#667eea' : '#718096'} />
        <Text style={[styles.filterTabText, filter === 'all' && styles.filterTabTextActive]}>
          Баары
        </Text>
        <View style={styles.filterBadge}>
          <Text style={styles.filterBadgeText}>{notifications.length}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.filterTab, filter === 'unread' && styles.filterTabActive]}
        onPress={() => setFilter('unread')}
      >
        <Icon name="envelope" size={16} color={filter === 'unread' ? '#667eea' : '#718096'} />
        <Text style={[styles.filterTabText, filter === 'unread' && styles.filterTabTextActive]}>
          Окулбаган
        </Text>
        <View style={styles.filterBadge}>
          <Text style={styles.filterBadgeText}>{getUnreadCount()}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.filterTab, filter === 'read' && styles.filterTabActive]}
        onPress={() => setFilter('read')}
      >
        <Icon name="envelope-open" size={16} color={filter === 'read' ? '#667eea' : '#718096'} />
        <Text style={[styles.filterTabText, filter === 'read' && styles.filterTabTextActive]}>
          Окулган
        </Text>
        <View style={styles.filterBadge}>
          <Text style={styles.filterBadgeText}>{getReadCount()}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderNotificationItem = ({ item: notification }) => (
    <View style={[styles.notificationItem, !notification.is_read && styles.unreadNotification]}>
      <View style={[styles.notificationIcon, { backgroundColor: getNotificationColor(notification.type) + '20' }]}>
        <Icon 
          name={getNotificationIcon(notification.type)} 
          size={24} 
          color={getNotificationColor(notification.type)} 
        />
      </View>

      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={styles.notificationTitle}>{notification.title}</Text>
          <Text style={styles.notificationTime}>
            {formatDate(notification.created_at)}
          </Text>
        </View>
        
        <Text style={styles.notificationMessage}>{notification.message}</Text>

        {notification.action_url && (
          <TouchableOpacity style={styles.notificationAction}>
            <Icon name="external-link-alt" size={14} color="#667eea" />
            <Text style={styles.notificationActionText}>Көрүү</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.notificationActions}>
        {!notification.is_read && (
          <TouchableOpacity
            style={[styles.actionButton, styles.markAsReadButton]}
            onPress={() => markAsRead(notification.id)}
          >
            <Icon name="check" size={16} color="#48bb78" />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => deleteNotification(notification.id)}
        >
          <Icon name="trash" size={16} color="#f56565" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="bell-slash" size={64} color="#cbd5e0" />
      <Text style={styles.emptyStateTitle}>Билдирүүлөр жок</Text>
      <Text style={styles.emptyStateText}>
        {filter === 'all' 
          ? 'Эч кандай билдирүүлөр жок' 
          : filter === 'unread' 
            ? 'Окулбаган билдирүүлөр жок'
            : 'Окулган билдирүүлөр жок'
        }
      </Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#667eea" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Билдирүүлөр жүктөлүүдө...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#667eea" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          <Icon name="bell" size={24} color="white" /> Билдирүүлөр
        </Text>
        <TouchableOpacity
          style={styles.markAllButton}
          onPress={markAllAsRead}
          disabled={getUnreadCount() === 0}
        >
          <Icon name="check-double" size={16} color="white" />
          <Text style={styles.markAllButtonText}>Баарын окуу</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#667eea']}
            tintColor="#667eea"
          />
        }
      >
        {/* Filter Tabs */}
        {renderFilterTabs()}

        {/* Notifications List */}
        {notifications.length === 0 ? (
          renderEmptyState()
        ) : (
          <View style={styles.notificationsList}>
            {notifications.map((notification) => (
              <View key={notification.id}>
                {renderNotificationItem({ item: notification })}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#667eea',
  },
  header: {
    backgroundColor: '#667eea',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    flexDirection: 'row',
    alignItems: 'center',
  },
  markAllButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  markAllButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  filterTabActive: {
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#718096',
    marginLeft: 6,
    marginRight: 8,
  },
  filterTabTextActive: {
    color: '#667eea',
  },
  filterBadge: {
    backgroundColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4a5568',
  },
  notificationsList: {
    marginBottom: 20,
  },
  notificationItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  unreadNotification: {
    backgroundColor: 'rgba(102, 126, 234, 0.05)',
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  notificationContent: {
    flex: 1,
    marginRight: 12,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    flex: 1,
    marginRight: 12,
  },
  notificationTime: {
    fontSize: 12,
    color: '#718096',
    flexShrink: 0,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#4a5568',
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationAction: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  notificationActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#667eea',
    marginLeft: 6,
  },
  notificationActions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    backgroundColor: '#f7fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  markAsReadButton: {
    borderColor: 'rgba(72, 187, 120, 0.3)',
    backgroundColor: 'rgba(72, 187, 120, 0.1)',
  },
  deleteButton: {
    borderColor: 'rgba(245, 101, 101, 0.3)',
    backgroundColor: 'rgba(245, 101, 101, 0.1)',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2d3748',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default Notifications;