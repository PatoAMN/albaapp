import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../utils/authContext';
import { useNavigation } from '@react-navigation/native';

interface AdminPortalSelectorProps {
  onGoBack?: () => void;
}

export const AdminPortalSelector: React.FC<AdminPortalSelectorProps> = ({ onGoBack }) => {
  const { user, organization, logout } = useAuth();
  const navigation = useNavigation();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error en logout:', error);
    }
  };

  const navigateToGuardPortal = () => {
    console.log('🔐 [ADMIN] Navegando al portal de guardias');
    navigation.navigate('GuardScanner' as never);
  };

  const navigateToMemberPortal = () => {
    console.log('🔐 [ADMIN] Navegando al portal de miembros');
    navigation.navigate('MemberHome' as never);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onGoBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#64B5F6" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Ionicons name="shield-checkmark" size={32} color="#64B5F6" />
          <Text style={styles.headerTitle}>Portal de Administrador</Text>
        </View>
        
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={20} color="#ff6b6b" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.welcomeCard}>
          <Ionicons name="person-circle" size={48} color="#64B5F6" />
          <Text style={styles.welcomeTitle}>¡Bienvenido, Administrador!</Text>
          <Text style={styles.welcomeMessage}>
            Selecciona el portal al que deseas acceder
          </Text>
        </View>

        <View style={styles.userInfoCard}>
          <Text style={styles.cardTitle}>Información del Usuario</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nombre:</Text>
            <Text style={styles.infoValue}>{user?.name || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{user?.email || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Rol:</Text>
            <Text style={styles.infoValue}>{user?.role || 'N/A'}</Text>
          </View>
        </View>

        {/* Portal Selection */}
        <View style={styles.portalSelection}>
          <Text style={styles.portalTitle}>Seleccionar Portal</Text>
          
          {/* Guard Portal */}
          <TouchableOpacity
            style={styles.portalButton}
            onPress={navigateToGuardPortal}
            activeOpacity={0.7}
          >
            <View style={styles.portalIconContainer}>
              <Ionicons name="shield" size={32} color="#ffffff" />
            </View>
            <View style={styles.portalInfo}>
              <Text style={styles.portalName}>Portal de Guardias</Text>
              <Text style={styles.portalDescription}>
                Acceso al sistema de guardias, escáner QR y chat
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#64B5F6" />
          </TouchableOpacity>

          {/* Member Portal */}
          <TouchableOpacity
            style={styles.portalButton}
            onPress={navigateToMemberPortal}
            activeOpacity={0.7}
          >
            <View style={[styles.portalIconContainer, { backgroundColor: '#4CAF50' }]}>
              <Ionicons name="people" size={32} color="#ffffff" />
            </View>
            <View style={styles.portalInfo}>
              <Text style={styles.portalName}>Portal de Miembros</Text>
              <Text style={styles.portalDescription}>
                Acceso al sistema de miembros, QR personal y chat
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#4CAF50" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

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
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#f0f8ff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  headerTitle: {
    color: '#333',
    fontSize: 18,
    fontWeight: 'bold',
  },
  logoutButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#fff5f5',
    borderWidth: 1,
    borderColor: '#ff6b6b',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  welcomeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  welcomeMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  userInfoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  portalSelection: {
    flex: 1,
  },
  portalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  portalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  portalIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#64B5F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  portalInfo: {
    flex: 1,
  },
  portalName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  portalDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
