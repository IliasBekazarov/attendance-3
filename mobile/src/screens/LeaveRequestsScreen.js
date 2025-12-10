import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const LeaveRequestsScreen = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    reason: '',
  });

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const fetchLeaveRequests = async () => {
    try {
      const response = await api.get('/v1/leave-requests/');
      setRequests(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch leave requests:', error);
      setRequests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeaveRequests();
  };

  const handleSubmit = async () => {
    if (!formData.start_date || !formData.end_date || !formData.reason) {
      Alert.alert('Ката', 'Бардык талааларды толтуруңуз');
      return;
    }

    try {
      await api.post('/v1/leave-requests/', formData);
      Alert.alert('Ийгиликтүү', 'Өтүнүч жиберилди');
      setModalVisible(false);
      setFormData({ start_date: '', end_date: '', reason: '' });
      fetchLeaveRequests();
    } catch (error) {
      console.error('Failed to submit leave request:', error);
      Alert.alert('Ката', 'Өтүнүчтү жиберүү мүмкүн болбоду');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED':
        return '#28a745';
      case 'REJECTED':
        return '#dc3545';
      case 'PENDING':
        return '#ffc107';
      default:
        return '#6c757d';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'APPROVED':
        return 'Кабыл алынды';
      case 'REJECTED':
        return 'Четке кагылды';
      case 'PENDING':
        return 'Күтүлүүдө';
      default:
        return status;
    }
  };

  const renderRequestItem = (request) => (
    <View key={request.id} style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
          <Text style={styles.statusText}>{getStatusText(request.status)}</Text>
        </View>
        <Text style={styles.dateRange}>
          {new Date(request.start_date).toLocaleDateString('ky-KG')} - {new Date(request.end_date).toLocaleDateString('ky-KG')}
        </Text>
      </View>
      
      <Text style={styles.reason}>{request.reason}</Text>
      
      {request.admin_comment && (
        <View style={styles.commentSection}>
          <Text style={styles.commentLabel}>Администратордун комментарийи:</Text>
          <Text style={styles.commentText}>{request.admin_comment}</Text>
        </View>
      )}
      
      <Text style={styles.createdAt}>
        Түзүлдү: {new Date(request.created_at).toLocaleDateString('ky-KG')}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text>Жүктөлүүдө...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ооруга арыздар</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addButtonText}>+ Жаңы арыз</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {requests.length > 0 ? (
          requests.map(renderRequestItem)
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyText}>Арыздар жок</Text>
          </View>
        )}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Жаңы арыз</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Башталуу күнү (YYYY-MM-DD):</Text>
                <TextInput
                  style={styles.input}
                  value={formData.start_date}
                  onChangeText={(text) => setFormData({ ...formData, start_date: text })}
                  placeholder="2024-01-01"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Аяктоо күнү (YYYY-MM-DD):</Text>
                <TextInput
                  style={styles.input}
                  value={formData.end_date}
                  onChangeText={(text) => setFormData({ ...formData, end_date: text })}
                  placeholder="2024-01-05"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Себеби:</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.reason}
                  onChangeText={(text) => setFormData({ ...formData, reason: text })}
                  placeholder="Себебин жазыңыз..."
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                <Text style={styles.submitButtonText}>Жиберүү</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#667eea',
    padding: 20,
    paddingTop: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  dateRange: {
    fontSize: 14,
    color: '#666',
  },
  reason: {
    fontSize: 14,
    color: '#333',
    marginBottom: 10,
    lineHeight: 20,
  },
  commentSection: {
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  commentLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5,
  },
  commentText: {
    fontSize: 14,
    color: '#333',
  },
  createdAt: {
    fontSize: 12,
    color: '#999',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    fontSize: 24,
    color: '#999',
  },
  form: {
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 100,
  },
  submitButton: {
    backgroundColor: '#667eea',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LeaveRequestsScreen;
