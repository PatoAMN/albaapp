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

interface AdminTestScreenProps {
  onGoBack?: () => void;
}

export const AdminTestScreen: React.FC<AdminTestScreenProps> = ({ onGoBack }) => {
  const { user, organization, logout } = useAuth();
  const navigation = useNavigation();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error en logout:', error);
    }
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
          <Text style={styles.headerTitle}>Admin Test Screen</Text>
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
        <View style={styles.infoCard}>
          <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />
          <Text style={styles.successTitle}>¡Login Exitoso!</Text>
          <Text style={styles.successMessage}>
            Has accedido como administrador al sistema
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
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>ID:</Text>
            <Text style={styles.infoValue}>{user?.id || 'N/A'}</Text>
          </View>
        </View>

        <View style={styles.organizationInfoCard}>
          <Text style={styles.cardTitle}>Información de la Organización</Text>
          {organization ? (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Nombre:</Text>
                <Text style={styles.infoValue}>{organization.name}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>ID:</Text>
                <Text style={styles.infoValue}>{organization.id}</Text>
              </View>
            </>
          ) : (
            <Text style={styles.noOrgText}>No hay organización asignada</Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => {
            console.log('Continuando al dashboard completo...');
            navigation.navigate('AdminDashboard' as never);
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-forward" size={20} color="#ffffff" />
          <Text style={styles.continueButtonText}>Continuar al Dashboard</Text>
        </TouchableOpacity>
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
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  successMessage: {
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
  organizationInfoCard: {
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
  noOrgText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#64B5F6',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    marginTop: 20,
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
