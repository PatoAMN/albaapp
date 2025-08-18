import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { useAuth } from '../utils/authContext';

const { width, height } = Dimensions.get('window');

export const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (userType: 'member' | 'guard') => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Por favor, ingrese correo y contraseña');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password.trim(), userType);
    } catch (error) {
      Alert.alert('Inicio de Sesión Fallido', 'Credenciales inválidas. Por favor, intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (userType: 'member' | 'guard') => {
    let demoEmail: string;
    let demoPassword: string;
    
    if (userType === 'member') {
      demoEmail = 'john@community.com';
      demoPassword = 'demo123';
    } else {
      demoEmail = 'guard@community.com';
      demoPassword = 'demo123';
    }
    
    // Set the credentials in the form
    setEmail(demoEmail);
    setPassword(demoPassword);
    
    // Auto-login with the correct credentials
    setLoading(true);
    setTimeout(() => {
      login(demoEmail, demoPassword, userType);
      setLoading(false);
    }, 500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.gradientBackground}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <View style={styles.logoIcon}>
                  <Text style={styles.logoIconText}>🏠</Text>
                </View>
                <Text style={styles.logoText}>Asociación de Colonos</Text>
                <Text style={styles.tagline}>Sistema de Seguridad Comunitario</Text>
              </View>
            </View>

            {/* Login Form */}
            <View style={styles.formContainer}>
              <View style={styles.formHeader}>
                <Text style={styles.formTitle}>Iniciar Sesión</Text>
                <Text style={styles.formSubtitle}>Accede a tu portal comunitario</Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Correo Electrónico</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="tu@email.com"
                  placeholderTextColor="#9ca3af"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Contraseña</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Tu contraseña"
                  placeholderTextColor="#9ca3af"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Login Buttons */}
              <View style={styles.loginButtonsContainer}>
                <TouchableOpacity
                  style={styles.memberButton}
                  onPress={() => handleLogin('member')}
                  disabled={loading}
                >
                  <Text style={styles.memberButtonText}>👤 Acceso Miembro</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.guardButton}
                  onPress={() => handleLogin('guard')}
                  disabled={loading}
                >
                  <Text style={styles.guardButtonText}>🛡️ Acceso Guardia</Text>
                </TouchableOpacity>
              </View>

              {/* Demo Login Section */}
              <View style={styles.demoContainer}>
                <Text style={styles.demoTitle}>Acceso de Prueba</Text>
                <Text style={styles.demoSubtitle}>Usa estas credenciales para probar la app</Text>
                
                <View style={styles.demoButtonsContainer}>
                  <TouchableOpacity
                    style={styles.demoMemberButton}
                    onPress={() => handleDemoLogin('member')}
                    disabled={loading}
                  >
                    <Text style={styles.demoMemberButtonText}>Miembro Demo (Auto-completar)</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.demoGuardButton}
                    onPress={() => handleDemoLogin('guard')}
                    disabled={loading}
                  >
                    <Text style={styles.demoGuardButtonText}>Guardia Demo (Auto-completar)</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  🔐 Sistema de Gestión de Acceso para Comunidades Cerradas
                </Text>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  gradientBackground: {
    flex: 1,
    backgroundColor: '#667eea',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  logoIcon: {
    fontSize: 48,
    marginRight: 15,
  },
  logoIconText: {
    fontSize: 48,
    marginRight: 15,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 25,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  formTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 15,
    padding: 18,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    color: '#1f2937',
  },
  loginButtonsContainer: {
    marginBottom: 30,
  },
  memberButton: {
    borderRadius: 15,
    padding: 18,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    backgroundColor: '#10b981',
  },
  memberButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  guardButton: {
    borderRadius: 15,
    padding: 18,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    backgroundColor: '#3b82f6',
  },
  guardButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  demoContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 25,
    marginBottom: 25,
  },
  demoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  demoSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  demoButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  demoButton: {
    flex: 1,
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f8fafc',
  },
  demoMemberButton: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  demoGuardButton: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  demoMemberButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  demoGuardButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  footerText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
