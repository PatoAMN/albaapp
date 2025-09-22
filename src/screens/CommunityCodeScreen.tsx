import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getOrganizationByCommunityCode } from '../utils/firebase';
import { Organization } from '../types';

interface CommunityCodeScreenProps {
  navigation: any;
}

export const CommunityCodeScreen: React.FC<CommunityCodeScreenProps> = ({ navigation }) => {
  const [communityCode, setCommunityCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [organization, setOrganization] = useState<Organization | null>(null);

  const handleCodeSubmit = async () => {
    if (!communityCode.trim()) {
      Alert.alert('Error', 'Por favor ingresa el código de tu comunidad');
      return;
    }

    setLoading(true);
    try {
      // Buscar la organización por código de comunidad
      const org = await getOrganizationByCommunityCode(communityCode.trim());
      
      if (org) {
        setOrganization(org);
        // Navegar a la pantalla de login con el ID de la organización
        navigation.navigate('Login', { organizationId: org.id });
      } else {
        Alert.alert(
          'Código Inválido',
          'El código de comunidad ingresado no es válido. Por favor verifica e intenta de nuevo.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error validating community code:', error);
      Alert.alert(
        'Error',
        'Hubo un problema al validar el código. Por favor intenta de nuevo.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Ionicons name="lock-closed" size={24} color="#64B5F6" />
          </View>
        </View>
        <View style={styles.centerSection}>
          <View style={styles.mainLogo}>
            <Ionicons name="shield-checkmark" size={32} color="#64B5F6" />
          </View>
          <Text style={styles.welcomeText}>SAFEGATE</Text>
        </View>
        <View style={styles.menuButton}>
          <Ionicons name="menu" size={24} color="#333" />
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Main Card */}
        <View style={styles.mainCard}>
          <View style={styles.mainCardHeader}>
            <View style={styles.mainCardTitleContainer}>
              <Ionicons name="key" size={32} color="#64B5F6" style={styles.mainCardIcon} />
              <Text style={styles.mainCardTitle}>Código de Comunidad</Text>
            </View>
            <View style={styles.mainCardSubtitle}>
              <Text style={styles.mainCardSubtitleText}>Ingresa el código para acceder a tu comunidad</Text>
            </View>
          </View>
          
          <View style={styles.mainCardContent}>
            <View style={styles.formContainer}>
              <Text style={styles.formTitle}>Ingresa el código de tu comunidad</Text>
              <Text style={styles.formDescription}>
                Este código te permite acceder a tu comunidad específica de manera segura
              </Text>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: SJ2024"
                  value={communityCode}
                  onChangeText={setCommunityCode}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  editable={!loading}
                  maxLength={20}
                />
              </View>

              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleCodeSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Continuar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>



        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            SafeGate System © 2024{'\n'}
            Seguridad comunitaria inteligente
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  logoContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainLogo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#9C27B0',
    textAlign: 'center',
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  mainCard: {
    backgroundColor: '#ffffff',
    borderRadius: 25,
    padding: 40,
    marginTop: 20,
    marginBottom: 30,
    borderWidth: 2,
    borderColor: '#000000',
    marginHorizontal: 10,
    minHeight: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  mainCardHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  mainCardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  mainCardIcon: {
    marginRight: 15,
  },
  mainCardTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
  },
  mainCardSubtitle: {
    alignItems: 'center',
  },
  mainCardSubtitleText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  mainCardContent: {
    alignItems: 'center',
    flex: 1,
  },
  formContainer: {
    width: '100%',
    alignItems: 'center',
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  formDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 20,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 24,
  },
  input: {
    borderWidth: 2,
    borderColor: '#64B5F6',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 3,
    fontWeight: '600',
    color: '#333',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  submitButton: {
    backgroundColor: '#64B5F6',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 40,
    alignItems: 'center',
    shadowColor: '#64B5F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0.1,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },

  footer: {
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
  },
});
