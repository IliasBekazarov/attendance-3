import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
// import * as DocumentPicker from 'expo-document-picker';

const LeaveRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    leave_type: 'SICK',
    start_date: '',
    end_date: '',
    reason: '',
  });
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const fetchLeaveRequests = async () => {
    setLoading(true);
    try {
      const response = await api.get('/v1/leave-requests/');
      const data = response.data;
      setRequests(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error('Failed to fetch leave requests:', error);
      setRequests([]);
      Alert.alert('Ката', 'Өтүнмөлөрдү жүктөөдө ката чыкты');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async () => {
    if (!formData.start_date || !formData.end_date || !formData.reason) {
      Alert.alert('Ката', 'Баардык талап кылынган талааларды толтуруңуз');
      return;
    }

    if (new Date(formData.start_date) > new Date(formData.end_date)) {
      Alert.alert('Ката', 'Башталыш күнү аяктоо күнүнөн мурун болушу керек');
      return;
    }

    try {
      await api.post('/v1/leave-requests/', {
        leave_type: formData.leave_type,
        start_date: formData.start_date,
        end_date: formData.end_date,
        reason: formData.reason,
      });

      setShowForm(false);
      setFormData({
        leave_type: 'SICK',
        start_date: '',
        end_date: '',
        reason: '',
      });
      fetchLeaveRequests();
      Alert.alert('Ийгиликтүү', 'Өтүнмө ийгиликтүү жөнөтүлдү');
    } catch (error) {
      console.error('Failed to submit leave request:', error);
      Alert.alert('Ката', 'Өтүнмөнү жөнөтүүдө ката чыкты');
    }
  };

  // КАБЫЛ АЛУУ ФУНКЦИЯСЫ
  const handleApprove = async (requestId) => {
    Alert.alert(
      'Ырас менен кабыл алуу?',
      'Бул өтүнмөнү кабыл аласызбы?',
      [
        { text: 'Жокко чыгаруу', style: 'cancel' },
        {
          text: 'Кабыл алуу',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.post(`/v1/leave-requests/${requestId}/approve/`);
              fetchLeaveRequests();
              Alert.alert('Ийгиликтүү', 'Өтүнмө кабыл алынды');
            } catch (error) {
              console.error('Failed to approve request:', error);
              Alert.alert(
                'Ката',
                error.response?.data?.message ||
                error.response?.data?.detail ||
                'Өтүнмөнү кабыл алууда ката чыкты'
              );
            }
          },
        },
      ]
    );
  };

  // ЧЕТКЕ КАГУУ МОДАЛЫН АЧУУ
  const openRejectModal = (requestId) => {
    setSelectedRequestId(requestId);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  // ЧЕТКЕ КАГУУ ФУНКЦИЯСЫ
  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      Alert.alert('Ката', 'Четке кагуунун себебин киризиңиз');
      return;
    }

    try {
      await api.post(`/v1/leave-requests/${selectedRequestId}/reject/`, {
        rejection_reason: rejectionReason,
      });
      
      setShowRejectModal(false);
      fetchLeaveRequests();
      Alert.alert('Ийгиликтүү', 'Өтүнмө четке кагылды');
    } catch (error) {
      console.error('Failed to reject request:', error);
      Alert.alert(
        'Ката',
        error.response?.data?.message ||
        error.response?.data?.detail ||
        'Өтүнмөнү четке кагууда ката чыкты'
      );
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: { color: '#ed8936', text: 'Күтүүдө', icon: 'clock' },
      APPROVED: { color: '#48bb78', text: 'Кабыл алынды', icon: 'check' },
      REJECTED: { color: '#f56565', text: 'Четке кагылды', icon: 'times' },
    };

    const badge = badges[status] || badges.PENDING;

    return (
      <View style={[styles.statusBadge, { backgroundColor: badge.color }]}>
        <Icon name={badge.icon} size={12} color="#fff" style={styles.badgeIcon} />
        <Text style={styles.badgeText}>{badge.text}</Text>
      </View>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ky-KG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ky-KG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const openDocument = async (documentUrl) => {
    try {
      if (Platform.OS === 'web') {
        window.open(documentUrl, '_blank');
      } else {
        Alert.alert('Документ', `Документтин шилтемеси: ${documentUrl}`);
      }
    } catch (error) {
      console.error('Error opening document:', error);
      Alert.alert('Ката', 'Документти ачууда ката');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Жүктөлүүдө...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* ЧЕТКЕ КАГУУ МОДАЛЫ */}
      <Modal
        visible={showRejectModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRejectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Өтүнмөнү четке кагуу</Text>
              <TouchableOpacity onPress={() => setShowRejectModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Четке кагуунун себеби:</Text>
              <TextInput
                style={styles.reasonInput}
                value={rejectionReason}
                onChangeText={setRejectionReason}
                placeholder="Себебин жазыңыз..."
                multiline
                numberOfLines={4}
              />
            </View>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setShowRejectModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>Жокко чыгаруу</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalRejectButton}
                onPress={handleReject}
                disabled={!rejectionReason.trim()}
              >
                <Text style={styles.modalRejectButtonText}>Четке кагуу</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.headerContent}>
            <Ionicons name="document-text" size={24} color="#667eea" />
            <Text style={styles.headerTitle}>Өтүнмөлөр</Text>
          </View>
          {(user?.role === 'STUDENT' || user?.role === 'TEACHER') && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowForm(!showForm)}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Жаңы өтүнмө</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.cardBody}>
          {/* ЖАҢЫ ӨТҮНМӨ ФОРМАСЫ */}
          {showForm && (
            <View style={styles.formContainer}>
              <View style={styles.formRow}>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>
                    <Ionicons name="calendar" size={16} color="#4a5568" /> Башталыш күнү
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={formData.start_date}
                    onChangeText={(text) => handleInputChange('start_date', text)}
                    placeholder="YYYY-MM-DD"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>
                    <Ionicons name="calendar" size={16} color="#4a5568" /> Аяктоо күнү
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={formData.end_date}
                    onChangeText={(text) => handleInputChange('end_date', text)}
                    placeholder="YYYY-MM-DD"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  <Ionicons name="chatbubble" size={16} color="#4a5568" /> Себеби
                </Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.reason}
                  onChangeText={(text) => handleInputChange('reason', text)}
                  placeholder="Өтүнмөнүн себебин жазыңыз..."
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.formActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowForm(false)}
                >
                  <Ionicons name="close" size={18} color="#4a5568" />
                  <Text style={styles.cancelButtonText}>Жокко чыгаруу</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleSubmit}
                >
                  <Ionicons name="send" size={18} color="#fff" />
                  <Text style={styles.submitButtonText}>Жөнөтүү</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ӨТҮНМӨЛӨРДҮН ТИЗМЕСИ */}
          <View style={styles.requestsList}>
            {requests.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="inbox" size={60} color="#cbd5e0" />
                <Text style={styles.emptyStateText}>Өтүнмөлөр жок</Text>
              </View>
            ) : (
              requests.map((request) => (
                <View key={request.id} style={styles.requestCard}>
                  <View style={styles.requestHeader}>
                    <View style={styles.requestStudent}>
                      {request.student?.profile_photo ? (
                        <Image
                          source={{ uri: request.student.profile_photo }}
                          style={styles.studentAvatar}
                        />
                      ) : (
                        <View style={[styles.studentAvatar, styles.avatarPlaceholder]}>
                          <Text style={styles.avatarText}>
                            {request.student?.full_name?.charAt(0) || 'С'}
                          </Text>
                        </View>
                      )}
                      <View style={styles.studentInfo}>
                        <Text style={styles.studentName}>
                          {request.student?.full_name || 'Аты белгисиз'}
                        </Text>
                        <Text style={styles.studentGroup}>
                          {request.student?.group?.name || 'Группасыз'}
                        </Text>
                      </View>
                    </View>
                    {getStatusBadge(request.status)}
                  </View>

                  <View style={styles.requestBody}>
                    <View style={styles.requestDates}>
                      <View style={styles.dateItem}>
                        <Ionicons name="calendar" size={14} color="#718096" />
                        <Text style={styles.dateText}>
                          {formatDate(request.start_date)}
                        </Text>
                      </View>
                      <Text style={styles.dateSeparator}>—</Text>
                      <View style={styles.dateItem}>
                        <Ionicons name="calendar" size={14} color="#718096" />
                        <Text style={styles.dateText}>
                          {formatDate(request.end_date)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.requestReason}>
                      <Text style={styles.reasonLabel}>Себеби:</Text>
                      <Text style={styles.reasonText}>{request.reason}</Text>
                    </View>

                    {request.document && (
                      <TouchableOpacity
                        style={styles.documentButton}
                        onPress={() => openDocument(request.document)}
                      >
                        <Ionicons name="download" size={16} color="#4299e1" />
                        <Text style={styles.documentText}>Документти жүктөп алуу</Text>
                      </TouchableOpacity>
                    )}

                    {request.rejection_reason && (
                      <View style={styles.rejectionBox}>
                        <Ionicons name="warning" size={16} color="#f56565" />
                        <View style={styles.rejectionContent}>
                          <Text style={styles.rejectionLabel}>
                            Четке кагуунун себеби:
                          </Text>
                          <Text style={styles.rejectionText}>
                            {request.rejection_reason}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>

                  {/* АДМИН/МЕНЕДЖЕР АКШЫЯЛАРЫ */}
                  {(user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'TEACHER') &&
                    request.status === 'PENDING' && (
                    <View style={styles.requestActions}>
                      <TouchableOpacity
                        style={styles.approveButton}
                        onPress={() => handleApprove(request.id)}
                      >
                        <Ionicons name="checkmark" size={16} color="#fff" />
                        <Text style={styles.actionButtonText}>Кабыл алуу</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.rejectButton}
                        onPress={() => openRejectModal(request.id)}
                      >
                        <Ionicons name="close" size={16} color="#fff" />
                        <Text style={styles.actionButtonText}>Четке кагуу</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  <View style={styles.requestFooter}>
                    <Ionicons name="time" size={12} color="#a0aec0" />
                    <Text style={styles.footerText}>
                      Жөнөтүлгөн: {formatDateTime(request.created_at)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fafc',
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
  
  // МОДАЛ СТИЛДЕРИ
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxWidth: 400,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#667eea',
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
  },
  modalBody: {
    padding: 20,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 12,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#2d3748',
    backgroundColor: '#fff',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  modalCancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#e2e8f0',
  },
  modalCancelButtonText: {
    fontSize: 14,
    color: '#4a5568',
    fontWeight: '600',
  },
  modalRejectButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f56565',
  },
  modalRejectButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  
  // КАЛГАН СТИЛДЕРИ
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    margin: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2d3748',
    marginLeft: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#667eea',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  cardBody: {
    padding: 20,
  },
  formContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  formGroup: {
    flex: 1,
    marginHorizontal: 4,
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a5568',
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#2d3748',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  fileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#edf2f7',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
  },
  fileButtonText: {
    fontSize: 14,
    color: '#4a5568',
    marginLeft: 8,
  },
  fileName: {
    fontSize: 12,
    color: '#718096',
    marginTop: 4,
    fontStyle: 'italic',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 12,
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#4a5568',
    fontWeight: '600',
    marginLeft: 8,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#667eea',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  requestsList: {
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#a0aec0',
    marginTop: 12,
    fontWeight: '500',
  },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  requestStudent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  studentAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  studentInfo: {
    marginLeft: 12,
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
  },
  studentGroup: {
    fontSize: 14,
    color: '#718096',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeIcon: {
    marginRight: 6,
  },
  badgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  requestBody: {
    marginBottom: 16,
  },
  requestDates: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7fafc',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  dateText: {
    fontSize: 14,
    color: '#2d3748',
    fontWeight: '500',
    marginLeft: 6,
  },
  dateSeparator: {
    fontSize: 16,
    color: '#a0aec0',
    marginHorizontal: 12,
    fontWeight: '500',
  },
  requestReason: {
    marginBottom: 16,
  },
  reasonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 14,
    color: '#4a5568',
    lineHeight: 20,
  },
  documentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ebf8ff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    marginBottom: 16,
  },
  documentText: {
    fontSize: 14,
    color: '#4299e1',
    fontWeight: '600',
    marginLeft: 8,
  },
  rejectionBox: {
    flexDirection: 'row',
    backgroundColor: '#fff5f5',
    borderLeftWidth: 4,
    borderLeftColor: '#f56565',
    padding: 12,
    borderRadius: 6,
  },
  rejectionContent: {
    flex: 1,
    marginLeft: 12,
  },
  rejectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#c53030',
    marginBottom: 4,
  },
  rejectionText: {
    fontSize: 14,
    color: '#742a2a',
    lineHeight: 20,
  },
  requestActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  approveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#48bb78',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    marginLeft: 12,
  },
  rejectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f56565',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    marginLeft: 12,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  requestFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  footerText: {
    fontSize: 12,
    color: '#a0aec0',
    marginLeft: 6,
  },
});

export default LeaveRequests;