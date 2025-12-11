import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Image,
  ActivityIndicator,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';

const ProfileScreen = () => {
  const { user, logout, updateUser } = useAuth();
  const { language, changeLanguage, availableLanguages, t } = useLanguage();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
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
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/v1/profile/update/');
      const profileData = response.data;
      
      updateUser(profileData);
      
      setFormData({
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || '',
        email: profileData.email || '',
        phone_number: profileData.phone_number || '',
        address: profileData.address || '',
        emergency_contact_name: profileData.emergency_contact_name || '',
        emergency_contact_phone: profileData.emergency_contact_phone || '',
      });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      Alert.alert(t('error'), t('error') + ': ' + error.message);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.patch('/v1/profile/update/', formData);
      await fetchProfile(); // Профилди кайра алуу
      setEditing(false);
      Alert.alert(t('success'), 'Профиль ийгиликтүү жаңыртылды');
    } catch (error) {
      Alert.alert(t('error'), 'Профилди жаңыртууда ката: ' + (error.response?.data?.detail || error.message));
      console.error('Failed to update profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password) {
      Alert.alert('Ката', 'Бардык талааларды толтуруңуз');
      return;
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      Alert.alert('Ката', 'Пароль дал келген жок');
      return;
    }

    if (passwordData.new_password.length < 6) {
      Alert.alert('Ката', 'Пароль минимум 6 символдон турушу керек');
      return;
    }

    setLoading(true);
    try {
      await api.post('/v1/profile/change-password/', {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });
      
      Alert.alert('Ийгиликтүү', 'Пароль ийгиликтүү өзгөртүлдү');
      setShowPasswordModal(false);
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.detail || error.message;
      Alert.alert('Ката', 'Паролду өзгөртүүдө ката: ' + errorMessage);
      console.error('Password change error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUsernameChange = async () => {
    if (!usernameData.new_username.trim()) {
      Alert.alert('Ката', 'Жаңы логинди жазыңыз');
      return;
    }

    if (!usernameData.password.trim()) {
      Alert.alert('Ката', 'Паролду жазыңыз');
      return;
    }

    if (usernameData.new_username.length < 3) {
      Alert.alert('Ката', 'Логин минимум 3 символдон турушу керек');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/v1/profile/change-username/', {
        new_username: usernameData.new_username,
        password: usernameData.password,
      });
      
      await fetchProfile(); // Профилди кайра алуу
      
      Alert.alert('Ийгиликтүү', 'Логин ийгиликтүү өзгөртүлдү');
      setShowUsernameModal(false);
      setUsernameData({ new_username: '', password: '' });
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.detail || error.message;
      Alert.alert('Ката', 'Логинди өзгөртүүдө ката: ' + errorMessage);
      console.error('Username change error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      t('logout'),
      t('confirmLogout') || 'Чынында да чыгып кетүүнү каалайсызбы?',
      [
        { text: t('no'), style: 'cancel' },
        { text: t('yes'), onPress: () => logout() },
      ]
    );
  };

  const handleLanguageSelect = (languageCode) => {
    changeLanguage(languageCode);
    setShowLanguageModal(false);
    Alert.alert(t('success'), t('languageChanged'));
  };

  const pickImageFromGallery = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Ката', 'Сүрөттөргө кирүү укугу керек');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadProfilePhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Ката', 'Сүрөттү тандоодо ката');
    } finally {
      setShowPhotoOptions(false);
    }
  };

  const takePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Ката', 'Камерага кирүү укугу керек');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadProfilePhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Ката', 'Камерада ката');
    } finally {
      setShowPhotoOptions(false);
    }
  };

  const uploadProfilePhoto = async (uri) => {
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      const filename = uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('profile_photo', {
        uri,
        name: filename,
        type,
      });

      await api.patch('/v1/profile/update/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      await fetchProfile();
      Alert.alert('Ийгиликтүү', 'Профиль сүрөтү жаңыртылды');
    } catch (error) {
      console.error('Photo upload error:', error);
      Alert.alert('Ката', 'Сүрөттү жүктөөдө ката: ' + (error.response?.data?.detail || error.message));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const deleteProfilePhoto = async () => {
    Alert.alert(
      'Сүрөттү өчүрүү',
      'Профиль сүрөтүн өчүргүңүз келеби?',
      [
        { text: 'Жок', style: 'cancel' },
        {
          text: 'Ооба',
          style: 'destructive',
          onPress: async () => {
            setUploadingPhoto(true);
            try {
              await api.delete('/v1/profile/delete-photo/');
              await fetchProfile();
              Alert.alert('Ийгиликтүү', 'Профиль сүрөтү өчүрүлдү');
            } catch (error) {
              console.error('Photo delete error:', error);
              Alert.alert('Ката', 'Сүрөттү өчүрүүдө ката');
            } finally {
              setUploadingPhoto(false);
              setShowPhotoOptions(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#002fffff', '#0d00ffff']}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={() => setShowPhotoOptions(true)}
        >
          {uploadingPhoto ? (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          ) : user?.profile_photo ? (
            <Image
              source={{ uri: user.profile_photo }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {user?.full_name?.charAt(0) || user?.username?.charAt(0) || '?'}
              </Text>
            </View>
          )}
          <View style={styles.cameraIcon}>
            <Text style={styles.cameraIconText}></Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.userName}>{user?.full_name || user?.username}</Text>
        <Text style={styles.userRole}>{user?.role}</Text>
      </LinearGradient>

      <View style={styles.content}>
        {/* Language Selection Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings')}</Text>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => setShowLanguageModal(true)}
          >
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>🌐</Text>
              <View>
                <Text style={styles.settingLabel}>{t('language')}</Text>
                <Text style={styles.settingValue}>
                  {availableLanguages.find(lang => lang.code === language)?.name}
                </Text>
              </View>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('personalInfo')}</Text>
            {!editing && (
              <TouchableOpacity onPress={() => setEditing(true)}>
                <Text style={styles.editButton}>{t('edit')}</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>
                <Text style={styles.infoIcon}></Text> Email:
              </Text>
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
                <Text style={styles.infoValue}>{user?.email || '—'}</Text>
              )}
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>
                <Text style={styles.infoIcon}></Text> Телефон:
              </Text>
              {editing ? (
                <TextInput
                  style={styles.input}
                  value={formData.phone_number}
                  onChangeText={(text) => setFormData({ ...formData, phone_number: text })}
                  placeholder="Телефон"
                  keyboardType="phone-pad"
                />
              ) : (
                <Text style={styles.infoValue}>{user?.phone_number || '—'}</Text>
              )}
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>
                <Text style={styles.infoIcon}></Text> Дареги:
              </Text>
              {editing ? (
                <TextInput
                  style={styles.input}
                  value={formData.address}
                  onChangeText={(text) => setFormData({ ...formData, address: text })}
                  placeholder="Дарек"
                />
              ) : (
                <Text style={styles.infoValue}>{user?.address || '—'}</Text>
              )}
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>
                <Text style={styles.infoIcon}></Text> Өзгөчө кырдаал (Аты):
              </Text>
              {editing ? (
                <TextInput
                  style={styles.input}
                  value={formData.emergency_contact_name}
                  onChangeText={(text) => setFormData({ ...formData, emergency_contact_name: text })}
                  placeholder="Өзгөчө кырдаал контакты"
                />
              ) : (
                <Text style={styles.infoValue}>{user?.emergency_contact_name || '—'}</Text>
              )}
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>
                <Text style={styles.infoIcon}></Text> Өзгөчө кырдаал (Телефон):
              </Text>
              {editing ? (
                <TextInput
                  style={styles.input}
                  value={formData.emergency_contact_phone}
                  onChangeText={(text) => setFormData({ ...formData, emergency_contact_phone: text })}
                  placeholder="Өзгөчө кырдаал телефону"
                  keyboardType="phone-pad"
                />
              ) : (
                <Text style={styles.infoValue}>{user?.emergency_contact_phone || '—'}</Text>
              )}
            </View>

            {user?.group && (
              <>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>
                    <Text style={styles.infoIcon}></Text> Группа:
                  </Text>
                  <Text style={styles.infoValue}>{user.group.name}</Text>
                </View>
                
                {user.group.course && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>
                      <Text style={styles.infoIcon}></Text> Курс:
                    </Text>
                    <Text style={styles.infoValue}>{user.group.course.name}</Text>
                  </View>
                )}
              </>
            )}
          </View>

          {editing && (
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setEditing(false);
                  setFormData({
                    first_name: user?.first_name || '',
                    last_name: user?.last_name || '',
                    email: user?.email || '',
                    phone_number: user?.phone_number || '',
                    address: user?.address || '',
                    emergency_contact_name: user?.emergency_contact_name || '',
                    emergency_contact_phone: user?.emergency_contact_phone || '',
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

        {/* Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Text style={styles.sectionIcon}></Text> Коопсуздук
          </Text>
          
          <TouchableOpacity
            style={styles.securityButton}
            onPress={() => setShowUsernameModal(true)}
          >
            <Text style={styles.securityButtonIcon}></Text>
            <Text style={styles.securityButtonText}>Логинди өзгөртүү</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.securityButton}
            onPress={() => setShowPasswordModal(true)}
          >
            <Text style={styles.securityButtonIcon}></Text>
            <Text style={styles.securityButtonText}>Паролду өзгөртүү</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>{t('logout')}</Text>
        </TouchableOpacity>
      </View>

      {/* Username Change Modal */}
      <Modal
        visible={showUsernameModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowUsernameModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Логинди өзгөртүү</Text>
              <TouchableOpacity onPress={() => setShowUsernameModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Жаңы логин</Text>
              <TextInput
                style={styles.modalInput}
                value={usernameData.new_username}
                onChangeText={(text) => setUsernameData({ ...usernameData, new_username: text })}
                placeholder="Жаңы логин"
                autoCapitalize="none"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Учурдагы пароль</Text>
              <TextInput
                style={styles.modalInput}
                value={usernameData.password}
                onChangeText={(text) => setUsernameData({ ...usernameData, password: text })}
                placeholder="Учурдагы пароль"
                secureTextEntry
              />
            </View>
            
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleUsernameChange}
              disabled={loading}
            >
              <Text style={styles.modalButtonText}>
                {loading ? 'Өзгөртүлүүдө...' : 'Сактоо'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Password Change Modal */}
      <Modal
        visible={showPasswordModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Паролду өзгөртүү</Text>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Учурдагы пароль</Text>
              <TextInput
                style={styles.modalInput}
                value={passwordData.current_password}
                onChangeText={(text) => setPasswordData({ ...passwordData, current_password: text })}
                placeholder="Учурдагы пароль"
                secureTextEntry
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Жаңы пароль</Text>
              <TextInput
                style={styles.modalInput}
                value={passwordData.new_password}
                onChangeText={(text) => setPasswordData({ ...passwordData, new_password: text })}
                placeholder="Жаңы пароль (мин. 6 символ)"
                secureTextEntry
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Паролду ырастоо</Text>
              <TextInput
                style={styles.modalInput}
                value={passwordData.confirm_password}
                onChangeText={(text) => setPasswordData({ ...passwordData, confirm_password: text })}
                placeholder="Паролду кайтадан жазыңыз"
                secureTextEntry
              />
            </View>
            
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handlePasswordChange}
              disabled={loading}
            >
              <Text style={styles.modalButtonText}>
                {loading ? 'Өзгөртүлүүдө...' : 'Сактоо'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Photo Options Modal */}
      <Modal
        visible={showPhotoOptions}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPhotoOptions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Профиль сүрөтү</Text>
              <TouchableOpacity onPress={() => setShowPhotoOptions(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={styles.photoOptionButton}
              onPress={takePhoto}
            >
              <Text style={styles.photoOptionIcon}>📸</Text>
              <Text style={styles.photoOptionText}>Камерадан тартуу</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.photoOptionButton}
              onPress={pickImageFromGallery}
            >
              <Text style={styles.photoOptionIcon}>🖼️</Text>
              <Text style={styles.photoOptionText}>Галлереядан тандоо</Text>
            </TouchableOpacity>
            
            {user?.profile_photo && (
              <TouchableOpacity
                style={[styles.photoOptionButton, styles.deletePhotoButton]}
                onPress={deleteProfilePhoto}
              >
                <Text style={styles.photoOptionIcon}>🗑️</Text>
                <Text style={[styles.photoOptionText, styles.deletePhotoText]}>
                  Сүрөттү өчүрүү
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('selectLanguage')}</Text>
              <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            {availableLanguages.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.languageOption,
                  language === lang.code && styles.selectedLanguage
                ]}
                onPress={() => handleLanguageSelect(lang.code)}
              >
                <Text style={[
                  styles.languageText,
                  language === lang.code && styles.selectedLanguageText
                ]}>
                  {lang.name}
                </Text>
                {language === lang.code && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
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
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarPlaceholder: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#667eea',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  cameraIconText: {
    fontSize: 16,
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
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
    fontWeight: '500',
  },
  infoIcon: {
    marginRight: 5,
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
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingIcon: {
    fontSize: 24,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  settingValue: {
    fontSize: 14,
    color: '#999',
    marginTop: 2,
  },
  settingArrow: {
    fontSize: 24,
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
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
  modalClose: {
    fontSize: 24,
    color: '#999',
    fontWeight: '300',
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: '#f8f9fa',
  },
  selectedLanguage: {
    backgroundColor: '#667eea',
  },
  languageText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  selectedLanguageText: {
    color: '#fff',
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  sectionIcon: {
    marginRight: 8,
  },
  securityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    backgroundColor: '#ffc107',
    borderRadius: 10,
    marginTop: 10,
  },
  securityButtonIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  securityButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  modalButton: {
    backgroundColor: '#667eea',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  photoOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 10,
  },
  photoOptionIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  photoOptionText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  deletePhotoButton: {
    backgroundColor: '#fff5f5',
  },
  deletePhotoText: {
    color: '#dc3545',
  },
});

export default ProfileScreen;
