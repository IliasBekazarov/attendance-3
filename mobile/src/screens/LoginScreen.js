import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';

const LoginScreen = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleLogin = async () => {
        if (!username || !password) {
            Alert.alert('Ката', 'Колдонуучу аты жана паролду киргизиңиз');
            return;
        }

        setLoading(true);
        const result = await login(username, password);
        setLoading(false);

        if (!result.success) {
            Alert.alert('Ката', result.error || 'Кирүү катасы');
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <LinearGradient
                colors={['#002fffff', '#0400ffff']}
                style={styles.gradient}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.logoContainer}>
                        <View style={styles.logoCircle}>
                            <Image
                                source={require('../../assets/logo.png')} // Path to your logo
                                style={styles.logoImage}
                                resizeMode="contain"
                            />
                        </View>
                        <Text style={styles.title}>Attendance System</Text>
                    </View>

                    <View style={styles.formContainer}>
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Колдонуучу аты</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Колдонуучу аты"
                                value={username}
                                onChangeText={setUsername}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Пароль</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Пароль"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                autoCapitalize="none"
                            />
                        </View>
                        <View style={styles.rememberContainer}>
                            <TouchableOpacity style={styles.rememberMe}>
                                <View style={styles.checkbox} />
                                <Text style={styles.rememberText}>Эстеп калуу</Text>
                            </TouchableOpacity>
                            <TouchableOpacity>
                                <Text style={styles.forgotPassword}>Паролду унуттуңузбу?</Text>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity
                            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                            onPress={handleLogin}
                            disabled={loading}
                        >
                            <Text style={styles.loginButtonText}>
                                {loading ? 'Жүктөлүүдө...' : 'Кирүү'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.footerText}>
                        © 2025 Attendance System. Бардык укуктар корголгон.
                    </Text>
                </ScrollView>
            </LinearGradient>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    logoText: {
        fontSize: 50,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 5,
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.95)',
        letterSpacing: 0.5,
    },
    formContainer: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        color: '#444',
        marginBottom: 8,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    input: {
        height: 50,
        borderWidth: 1.5,
        borderColor: '#e1e1e1',
        borderRadius: 12,
        paddingHorizontal: 15,
        fontSize: 16,
        backgroundColor: '#fafafa',
        color: '#333',
    },
    loginButton: {
        backgroundColor: '#002fffff',
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#667eea',
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 6,
    },
    loginButtonDisabled: {
        opacity: 0.6,
        shadowOpacity: 0.1,
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    footerText: {
        textAlign: 'center',
        color: 'rgba(255, 255, 255, 0.9)',
        marginTop: 30,
        fontSize: 12,
        letterSpacing: 0.3,
    },

    rememberContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 10,
    },
    rememberMe: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkbox: {
        width: 18,
        height: 18,
        borderRadius: 4,
        borderWidth: 1.5,
        borderColor: '#667eea',
        marginRight: 8,
    },
    rememberText: {
        color: '#666',
        fontSize: 14,
    },
    forgotPassword: {
        color: '#667eea',
        fontSize: 14,
        fontWeight: '500',
    },
    // Update the styles:
    logoCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        overflow: 'hidden', // Important for circular image
    },
    logoImage: {
        width: '80%',
        height: '80%',
    },
});

export default LoginScreen;
