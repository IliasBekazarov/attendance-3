import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const ProfileScreen = () => {
  const { user, logout, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [usernameData, setUsernameData] = useState({
    new_username: '',
    password: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone_number: user.phone_number || '',
        address: user.address || '',
        emergency_contact_name: user.emergency_contact_name || '',
        emergency_contact_phone: user.emergency_contact_phone || '',
      });
    }
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await api.patch('/v1/profile/update/', formData);
      updateUser(response.data);
      setEditing(false);
      Alert.alert('Ийгиликтүү', 'Профиль жаңыланды');
    } catch (error) {
      Alert.alert('Ката', 'Профилди жаңылоо мүмкүн болбоду: ' + (error.response?.data?.detail || error.message));
      console.error('Failed to update profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      Alert.alert('Ката', 'Жаңы пароль туура эмес экенин текшериңиз!');
      return;
    }

    if (passwordData.new_password.length < 6) {
      Alert.alert('Ката', 'Пароль кеминде 6 символдон турушу керек!');
      return;
    }

    setLoading(true);
    try {
      await api.post('/v1/profile/change-password/', {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });
      
      Alert.alert('Ийгиликтүү', 'Пароль ийгиликтүү өзгөртүлдү!');
      setShowPasswordModal(false);
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (error) {
      Alert.alert('Ката', 'Паролду өзгөртүүдө ката: ' + (error.response?.data?.error || error.message));
      console.error('Password change error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUsernameChange = async () => {
    if (!usernameData.new_username.trim()) {
      Alert.alert('Ката', 'Жаңы логинди жазыңыз!');
      return;
    }

    if (usernameData.new_username.length < 3) {
      Alert.alert('Ката', 'Логин кеминде 3 символдон турушу керек!');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/v1/profile/change-username/', {
        new_username: usernameData.new_username,
        password: usernameData.password,
      });
      
      const updatedUser = { ...user, username: response.data.username };
      updateUser(updatedUser);
      
      Alert.alert('Ийгиликтүү', 'Логин ийгиликтүү өзгөртүлдү!');
      setShowUsernameModal(false);
      setUsernameData({ new_username: '', password: '' });
    } catch (error) {
      Alert.alert('Ката', 'Логинди өзгөртүүдө ката: ' + (error.response?.data?.error || error.message));
      console.error('Username change error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Чыгуу',
      'Чынында да чыгып кетүүнү каалайсызбы?',
      [
        { text: 'Жок', style: 'cancel' },
        { text: 'Ооба', onPress: () => logout() },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#002fffff', '#0d00ffff']}
        style={styles.header}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.full_name?.charAt(0) || user?.username?.charAt(0) || '?'}
          </Text>
        </View>
        <Text style={styles.userName}>{user?.full_name || user?.username}</Text>
        <Text style={styles.userRole}>{user?.role}</Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Профиль маалыматы</Text>
            {!editing && (
              <TouchableOpacity onPress={() => setEditing(true)}>
                <Text style={styles.editButton}>✏️ Өзгөртүү</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Аты-жөнү:</Text>
              {editing ? (
                <TextInput
                  style={styles.input}
                  value={formData.full_name}
                  onChangeText={(text) => setFormData({ ...formData, full_name: text })}
                  placeholder="Аты-жөнү"
                />
              ) : (
                <Text style={styles.infoValue}>{user?.full_name || '-'}</Text>
              )}
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              {editing ? (
                <TextInput
                  style={styles.input}
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  placeholder="Email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              ) : (
                <Text style={styles.infoValue}>{user?.email || '-'}</Text>
              )}
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Телефон:</Text>
              {editing ? (
                <TextInput
                  style={styles.input}
                  value={formData.phone}
                  onChangeText={(text) => setFormData({ ...formData, phone: text })}
                  placeholder="Телефон"
                  keyboardType="phone-pad"
                />
              ) : (
                <Text style={styles.infoValue}>{user?.phone || '-'}</Text>
              )}
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Дарек:</Text>
              {editing ? (
                <TextInput
                  style={styles.input}
                  value={formData.address}
                  onChangeText={(text) => setFormData({ ...formData, address: text })}
                  placeholder="Дарек"
                />
              ) : (
                <Text style={styles.infoValue}>{user?.address || '-'}</Text>
              )}
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Колдонуучу аты:</Text>
              <Text style={styles.infoValue}>{user?.username}</Text>
            </View>
          </View>

          {editing && (
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setEditing(false);
                  setFormData({
                    full_name: user?.full_name || '',
                    email: user?.email || '',
                    phone: user?.phone || '',
                    address: user?.address || '',
                  });
                }}
              >
                <Text style={styles.cancelButtonText}>Жокко чыгаруу</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSave}
                disabled={loading}
              >
                <Text style={styles.saveButtonText}>
                  {loading ? 'Сакталууда...' : 'Сактоо'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>🚪 Чыгуу</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 30,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  userRole: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 5,
  },
  content: {
    padding: 15,
  },
  section: {
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  editButton: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
  },
  infoCard: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
  },
  infoRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
  },
  input: {
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 15,
    gap: 10,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#667eea',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc3545',
  },
});

export default ProfileScreen;
