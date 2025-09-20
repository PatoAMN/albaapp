import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../utils/authContext';
import { useAdminPortal } from '../utils/adminPortalContext';
import { AdminPortal } from '../types/simple';

interface AdminPortalSwitcherProps {
  style?: any;
}

export const AdminPortalSwitcher: React.FC<AdminPortalSwitcherProps> = ({ style }) => {
  const { user } = useAuth();
  const { currentPortal, switchPortal } = useAdminPortal();
  
  // Debug logs
  console.log('🔍 [AdminPortalSwitcher] Renderizando componente');
  console.log('🔍 [AdminPortalSwitcher] Usuario recibido:', user);
  console.log('🔍 [AdminPortalSwitcher] Rol del usuario:', user?.role);
  console.log('🔍 [AdminPortalSwitcher] Es admin:', user?.role === 'admin' || user?.role === 'super_admin');

  // Solo mostrar para administradores
  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return null;
  }

  const handlePortalSwitch = (newPortal: 'member' | 'guard') => {
    if (newPortal === currentPortal) return;

    Alert.alert(
      'Cambiar Portal',
      `¿Estás seguro de que quieres cambiar al portal de ${newPortal === 'member' ? 'miembros' : 'guardias'}?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cambiar',
          onPress: () => {
            switchPortal(newPortal);
            Alert.alert(
              'Portal Cambiado',
              `Ahora estás en el portal de ${newPortal === 'member' ? 'miembros' : 'guardias'}`,
              [{ text: 'OK' }]
            );
          },
        },
      ]
    );
  };

  const getPortalInfo = (portal: 'member' | 'guard') => {
    switch (portal) {
      case 'member':
        return {
          name: 'Miembros',
          icon: 'people',
          color: '#64B5F6',
          description: 'Gestionar miembros y residentes',
        };
      case 'guard':
        return {
          name: 'Guardias',
          icon: 'shield',
          color: '#4CAF50',
          description: 'Gestionar guardias y seguridad',
        };
      default:
        return {
          name: 'Portal',
          icon: 'home',
          color: '#FF9800',
          description: 'Portal de administración',
        };
    }
  };

  const currentPortalInfo = getPortalInfo(currentPortal);
  const otherPortal = currentPortal === 'member' ? 'guard' : 'member';
  const otherPortalInfo = getPortalInfo(otherPortal);

  return (
    <View style={[styles.container, style]}>
      {/* Portal Actual */}
      <View style={styles.currentPortal}>
        <View style={[styles.portalIcon, { backgroundColor: currentPortalInfo.color }]}>
          <Ionicons name={currentPortalInfo.icon as any} size={20} color="#ffffff" />
        </View>
        <View style={styles.portalInfo}>
          <Text style={styles.portalLabel}>Portal Actual</Text>
          <Text style={styles.portalName}>{currentPortalInfo.name}</Text>
          <Text style={styles.portalDescription}>{currentPortalInfo.description}</Text>
        </View>
      </View>

      {/* Botón de Cambio */}
      <TouchableOpacity
        style={[styles.switchButton, { backgroundColor: otherPortalInfo.color }]}
        onPress={() => handlePortalSwitch(otherPortal)}
        activeOpacity={0.8}
      >
        <Ionicons name="swap-horizontal" size={20} color="#ffffff" />
        <Text style={styles.switchButtonText}>
          Cambiar a {otherPortalInfo.name}
        </Text>
      </TouchableOpacity>

      {/* Indicador de Estado */}
      <View style={styles.statusIndicator}>
        <View style={[styles.statusDot, { backgroundColor: currentPortalInfo.color }]} />
        <Text style={styles.statusText}>
          Portal activo: {currentPortalInfo.name}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    margin: 16,
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
  currentPortal: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  portalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  portalInfo: {
    flex: 1,
  },
  portalLabel: {
    color: '#666',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  portalName: {
    color: '#333',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  portalDescription: {
    color: '#666',
    fontSize: 14,
    lineHeight: 20,
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  switchButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '500',
  },
});
