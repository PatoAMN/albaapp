import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  Dimensions,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../utils/authContext';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

interface AdminMemberViewProps {
  onGoBack?: () => void;
}

export const AdminMemberView: React.FC<AdminMemberViewProps> = ({ onGoBack }) => {
  const { user, organization, logout } = useAuth();
  const navigation = useNavigation();
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);

  // Función para regresar al selector de portal
  const goBackToPortalSelector = () => {
    if (onGoBack) {
      onGoBack();
    } else {
      navigation.goBack();
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error en logout:', error);
    }
  };

  const navigateToGuardPortal = () => {
    console.log('🔐 [ADMIN] Navegando al portal de guardias desde vista de miembros');
    navigation.navigate('GuardScanner' as never);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={goBackToPortalSelector}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#64B5F6" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Ionicons name="people" size={32} color="#4CAF50" />
          <Text style={styles.headerTitle}>Portal de Miembros</Text>
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
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Welcome Card */}
        <View style={styles.welcomeCard}>
          <Ionicons name="shield-checkmark" size={48} color="#4CAF50" />
          <Text style={styles.welcomeTitle}>Vista de Miembros</Text>
          <Text style={styles.welcomeMessage}>
            Estás viendo el portal de miembros como administrador
          </Text>
        </View>

        {/* User Info Card */}
        <View style={styles.userInfoCard}>
          <Text style={styles.cardTitle}>Información del Administrador</Text>
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

        {/* Organization Info Card */}
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
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email:</Text>
                <Text style={styles.infoValue}>{organization.contactEmail}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Teléfono:</Text>
                <Text style={styles.infoValue}>{organization.contactPhone}</Text>
              </View>
            </>
          ) : (
            <Text style={styles.noOrgText}>No hay organización asignada</Text>
          )}
        </View>

        {/* Current Time Card */}
        <View style={styles.timeCard}>
          <Text style={styles.cardTitle}>Hora Actual</Text>
          <View style={styles.timeDisplay}>
            <Ionicons name="time" size={24} color="#64B5F6" />
            <Text style={styles.timeText}>
              {currentTime.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
            </Text>
          </View>
          <Text style={styles.dateText}>
            {currentTime.toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Text>
        </View>

        {/* Navigation Actions */}
        <View style={styles.actionsCard}>
          <Text style={styles.cardTitle}>Acciones Disponibles</Text>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={navigateToGuardPortal}
            activeOpacity={0.7}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="shield" size={24} color="#ffffff" />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Ir al Portal de Guardias</Text>
              <Text style={styles.actionDescription}>
                Acceder al sistema de guardias y escáner QR
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#64B5F6" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              Alert.alert(
                'Funcionalidad de Miembros',
                'Como administrador, puedes ver la información de miembros aquí. Para funcionalidades específicas de miembros, crea un usuario con rol "member".'
              );
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: '#FF9800' }]}>
              <Ionicons name="information-circle" size={24} color="#ffffff" />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Información de Miembros</Text>
              <Text style={styles.actionDescription}>
                Ver detalles sobre el sistema de miembros
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#FF9800" />
          </TouchableOpacity>
        </View>

        {/* Admin Note */}
        <View style={styles.adminNoteCard}>
          <Ionicons name="bulb" size={24} color="#FFD700" />
          <Text style={styles.adminNoteTitle}>Nota para Administradores</Text>
          <Text style={styles.adminNoteText}>
            Esta es la vista del portal de miembros. Como administrador, tienes acceso de solo lectura a la información de miembros. Para probar funcionalidades completas de miembros, crea un usuario con rol "member".
          </Text>
        </View>
      </ScrollView>
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
  organizationInfoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  timeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  actionsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  adminNoteCard: {
    backgroundColor: '#fffbf0',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFD700',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
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
  timeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 8,
  },
  timeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#64B5F6',
  },
  dateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#64B5F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  adminNoteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#B8860B',
    marginBottom: 8,
  },
  adminNoteText: {
    fontSize: 14,
    color: '#8B6914',
    lineHeight: 20,
    flex: 1,
  },
});
