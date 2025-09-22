import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../utils/authContext';
import { adminService } from '../utils/adminService';
import { AdminPortal, AdminSession } from '../types';

const { width, height } = Dimensions.get('window');

interface AdminDashboardScreenProps {
  onGoBack?: () => void;
  onNavigateToPortal?: (portalName: string) => void;
}

export const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({ 
  onGoBack, 
  onNavigateToPortal 
}) => {
  const { user, organization } = useAuth();
  const [availablePortals, setAvailablePortals] = useState<AdminPortal[]>([]);
  const [currentSession, setCurrentSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalStats, setPortalStats] = useState<any>({});
  const [selectedPortal, setSelectedPortal] = useState<string | null>(null);

  // Debug logs
  console.log('🔐 [ADMIN_DASHBOARD] Componente renderizado');
  console.log('🔐 [ADMIN_DASHBOARD] Usuario:', user ? { id: user.id, role: user.role, email: user.email } : null);
  console.log('🔐 [ADMIN_DASHBOARD] Organización:', organization ? { id: organization.id, name: organization.name } : null);

  useEffect(() => {
    console.log('🔐 [ADMIN_DASHBOARD] useEffect ejecutado');
    console.log('🔐 [ADMIN_DASHBOARD] Usuario existe:', !!user);
    console.log('🔐 [ADMIN_DASHBOARD] Es admin:', user ? adminService.isAdmin(user) : false);
    
    if (!user || !adminService.isAdmin(user)) {
      console.log('🔐 [ADMIN_DASHBOARD] No se puede cargar datos - usuario no válido');
      return;
    }
    
    console.log('🔐 [ADMIN_DASHBOARD] Cargando datos de administrador...');
    loadAdminData();
  }, [user]);

  useEffect(() => {
    if (!user?.id) return;
    
    // Suscribirse a cambios en la sesión del administrador
    const unsubscribe = adminService.subscribeToAdminSession(
      user.id,
      (session) => {
        setCurrentSession(session);
        if (session) {
          loadPortalStats(session.currentPortal);
        }
      }
    );
    
    return unsubscribe;
  }, [user?.id]);

  const loadAdminData = async () => {
    console.log('🔐 [ADMIN_DASHBOARD] loadAdminData iniciado');
    
    if (!user || !adminService.isAdmin(user)) {
      console.log('🔐 [ADMIN_DASHBOARD] loadAdminData cancelado - usuario no válido');
      return;
    }
    
    try {
      setLoading(true);
      console.log('🔐 [ADMIN_DASHBOARD] Obteniendo portales disponibles...');
      
      // Obtener portales disponibles
      const portals = await adminService.getAvailablePortals(user as any);
      console.log('🔐 [ADMIN_DASHBOARD] Portales obtenidos:', portals.length);
      setAvailablePortals(portals);
      
      console.log('🔐 [ADMIN_DASHBOARD] Obteniendo sesión activa...');
      // Obtener sesión activa
      const session = await adminService.getActiveSession(user.id);
      console.log('🔐 [ADMIN_DASHBOARD] Sesión obtenida:', session ? 'Sí' : 'No');
      setCurrentSession(session);
      
      if (session) {
        console.log('🔐 [ADMIN_DASHBOARD] Cargando estadísticas del portal:', session.currentPortal);
        await loadPortalStats(session.currentPortal);
      }
      
      setLoading(false);
      console.log('🔐 [ADMIN_DASHBOARD] Datos cargados exitosamente');
    } catch (error) {
      console.error('🔐 [ADMIN_DASHBOARD] Error loading admin data:', error);
      setLoading(false);
    }
  };

  const loadPortalStats = async (portalName: string) => {
    if (!user?.id) return;
    
    try {
      const stats = await adminService.getPortalStats(user.id, portalName);
      setPortalStats(stats);
    } catch (error) {
      console.error('Error loading portal stats:', error);
    }
  };

  const handlePortalSelect = async (portal: AdminPortal) => {
    if (!user?.id) return;
    
    try {
      setSelectedPortal(portal.name);
      
      // Cambiar al portal seleccionado
      await adminService.switchPortal(user.id, portal.name);
      
      // Navegar al portal si se proporciona la función
      if (onNavigateToPortal) {
        onNavigateToPortal(portal.name);
      }
      
      Alert.alert(
        'Portal Cambiado',
        `Has cambiado al ${portal.displayName}`,
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('Error switching portal:', error);
      Alert.alert('Error', 'No se pudo cambiar al portal seleccionado');
      setSelectedPortal(null);
    }
  };

  const handleSpecialPermission = () => {
    Alert.alert(
      'Permisos Especiales',
      'Esta función solo está disponible para administradores con permisos especiales.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Solicitar Permiso', 
          onPress: () => {
            Alert.alert(
              'Solicitud Enviada',
              'Tu solicitud de permiso especial ha sido enviada a un super administrador.',
              [{ text: 'OK' }]
            );
          }
        }
      ]
    );
  };

  const getPortalIcon = (iconName: string) => {
    switch (iconName) {
      case 'shield': return 'shield';
      case 'people': return 'people';
      case 'library': return 'library';
      case 'settings': return 'settings';
      default: return 'grid';
    }
  };

  const getPortalColor = (portalName: string) => {
    switch (portalName) {
      case 'guard': return '#4CAF50';
      case 'member': return '#2196F3';
      case 'document': return '#FF9800';
      case 'system': return '#9C27B0';
      default: return '#64B5F6';
    }
  };

  const renderPortalCard = (portal: AdminPortal) => {
    const isSelected = currentSession?.currentPortal === portal.name;
    const portalColor = getPortalColor(portal.name);
    
    return (
      <TouchableOpacity
        key={portal.id}
        style={[
          styles.portalCard,
          isSelected && styles.selectedPortalCard,
          { borderColor: portalColor }
        ]}
        onPress={() => handlePortalSelect(portal)}
        activeOpacity={0.7}
      >
        <View style={[styles.portalIcon, { backgroundColor: portalColor }]}>
          <Ionicons 
            name={getPortalIcon(portal.icon) as any} 
            size={32} 
            color="#ffffff" 
          />
        </View>
        
        <View style={styles.portalInfo}>
          <Text style={styles.portalName}>{portal.displayName}</Text>
          <Text style={styles.portalDescription}>{portal.description}</Text>
          
          {isSelected && (
            <View style={styles.activeIndicator}>
              <Ionicons name="checkmark-circle" size={16} color={portalColor} />
              <Text style={[styles.activeText, { color: portalColor }]}>
                Portal Activo
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.portalActions}>
          <Ionicons 
            name="chevron-forward" 
            size={20} 
            color={isSelected ? portalColor : "#ccc"} 
          />
        </View>
      </TouchableOpacity>
    );
  };

  const renderStatsCard = () => {
    if (!currentSession || Object.keys(portalStats).length === 0) return null;
    
    const currentPortal = availablePortals.find(p => p.name === currentSession.currentPortal);
    if (!currentPortal) return null;
    
    return (
      <View style={styles.statsCard}>
        <View style={styles.statsHeader}>
          <Ionicons 
            name={getPortalIcon(currentPortal.icon) as any} 
            size={24} 
            color={getPortalColor(currentPortal.name)} 
          />
          <Text style={styles.statsTitle}>
            Estadísticas - {currentPortal.displayName}
          </Text>
        </View>
        
        <View style={styles.statsContent}>
          {Object.entries(portalStats).map(([key, value]) => (
            <View key={key} style={styles.statItem}>
              <Text style={styles.statLabel}>
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
              </Text>
              <Text style={styles.statValue}>{String(value)}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  if (loading) {
    console.log('🔐 [ADMIN_DASHBOARD] Mostrando pantalla de carga');
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#64B5F6" />
          <Text style={styles.loadingText}>Cargando dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user || !adminService.isAdmin(user)) {
    console.log('🔐 [ADMIN_DASHBOARD] Mostrando pantalla de acceso denegado');
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#ff6b6b" />
          <Text style={styles.errorText}>Acceso Denegado</Text>
          <Text style={styles.errorSubtext}>
            Solo los administradores pueden acceder a esta pantalla
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  console.log('🔐 [ADMIN_DASHBOARD] Renderizando dashboard principal');
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
          <Text style={styles.headerTitle}>Dashboard de Administración</Text>
        </View>
        
        <TouchableOpacity
          style={styles.specialPermissionButton}
          onPress={handleSpecialPermission}
          activeOpacity={0.7}
        >
          <Ionicons name="key" size={20} color="#FF9800" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>
            Bienvenido, {user.name}
          </Text>
          <Text style={styles.welcomeSubtitle}>
            Selecciona el portal que deseas administrar
          </Text>
          <Text style={styles.roleText}>
            Rol: {user.role === 'super_admin' ? 'Super Administrador' : 'Administrador'}
          </Text>
        </View>

        {/* Current Session Info */}
        {currentSession && (
          <View style={styles.sessionInfo}>
            <View style={styles.sessionHeader}>
              <Ionicons name="information-circle" size={20} color="#64B5F6" />
              <Text style={styles.sessionTitle}>Sesión Activa</Text>
            </View>
            <Text style={styles.sessionText}>
              Portal: {currentSession.currentPortal === 'guard' ? 'Guardias' : 
                       currentSession.currentPortal === 'member' ? 'Miembros' :
                       currentSession.currentPortal === 'document' ? 'Documentos' : 'Sistema'}
            </Text>
            <Text style={styles.sessionText}>
              Última actividad: {currentSession.lastActivity.toLocaleString('es-MX')}
            </Text>
          </View>
        )}

        {/* Portal Selection */}
        <View style={styles.portalsSection}>
          <Text style={styles.sectionTitle}>Portales Disponibles</Text>
          <Text style={styles.sectionSubtitle}>
            {availablePortals.length} portal{availablePortals.length !== 1 ? 'es' : ''} disponible{availablePortals.length !== 1 ? 's' : ''}
          </Text>
          
          {availablePortals.map(renderPortalCard)}
        </View>

        {/* Statistics */}
        {renderStatsCard()}

        {/* Special Permissions Info */}
        <View style={styles.permissionsInfo}>
          <View style={styles.permissionsHeader}>
            <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
            <Text style={styles.permissionsTitle}>Permisos Especiales</Text>
          </View>
          <Text style={styles.permissionsText}>
            Algunas funciones requieren permisos especiales que solo pueden ser otorgados por super administradores.
          </Text>
          <TouchableOpacity
            style={styles.requestPermissionButton}
            onPress={handleSpecialPermission}
            activeOpacity={0.7}
          >
            <Ionicons name="key-outline" size={16} color="#FF9800" />
            <Text style={styles.requestPermissionText}>Solicitar Permisos</Text>
          </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 40,
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
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
  specialPermissionButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#fff3e0',
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  content: {
    flex: 1,
  },
  welcomeSection: {
    backgroundColor: '#ffffff',
    padding: 20,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  roleText: {
    fontSize: 14,
    color: '#64B5F6',
    fontWeight: '600',
  },
  sessionInfo: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  sessionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  portalsSection: {
    backgroundColor: '#ffffff',
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  portalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
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
  selectedPortalCard: {
    borderWidth: 3,
    backgroundColor: '#f8f9ff',
  },
  portalIcon: {
    width: 60,
    height: 60,
    borderRadius: 12,
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
    marginBottom: 8,
  },
  activeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  portalActions: {
    marginLeft: 12,
  },
  statsCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statsContent: {
    gap: 8,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  permissionsInfo: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  permissionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  permissionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  permissionsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  requestPermissionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff3e0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#FF9800',
    gap: 8,
  },
  requestPermissionText: {
    color: '#FF9800',
    fontSize: 14,
    fontWeight: '600',
  },
});
