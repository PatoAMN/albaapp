import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAdminPortal } from '../utils/adminPortalContext';
import { useAuth } from '../utils/authContext';
import { AdminPortal } from '../types/simple';

interface AdminPortalContentProps {
  children?: React.ReactNode;
}

export const AdminPortalContent: React.FC<AdminPortalContentProps> = ({ children }) => {
  const { currentPortal } = useAdminPortal();
  const { user } = useAuth();
  
  // Debug logs
  console.log('🔍 [AdminPortalContent] Renderizando componente');
  console.log('🔍 [AdminPortalContent] Usuario recibido:', user);
  console.log('🔍 [AdminPortalContent] Rol del usuario:', user?.role);
  console.log('🔍 [AdminPortalContent] Es admin:', user?.role === 'admin' || user?.role === 'super_admin');

  // Solo mostrar para administradores
  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return null;
  }

  const getPortalContent = () => {
    switch (currentPortal) {
      case 'member':
        return {
          title: 'Portal de Miembros',
          subtitle: 'Gestionar residentes y miembros de la organización',
          icon: 'people',
          color: '#64B5F6',
          features: [
            'Ver lista de miembros',
            'Gestionar perfiles',
            'Administrar accesos',
            'Ver historial de actividades',
            'Gestionar invitados',
          ],
        };
      case 'guard':
        return {
          title: 'Portal de Guardias',
          subtitle: 'Gestionar personal de seguridad y porterías',
          icon: 'shield',
          color: '#4CAF50',
          features: [
            'Ver lista de guardias',
            'Gestionar turnos',
            'Administrar porterías',
            'Ver registros de acceso',
            'Gestionar incidentes',
          ],
        };
      default:
        return {
          title: 'Portal de Administración',
          subtitle: 'Selecciona un portal para comenzar',
          icon: 'home',
          color: '#FF9800',
          features: [],
        };
    }
  };

  const portalInfo = getPortalContent();

  return (
    <View style={styles.container}>
      {/* Header del Portal */}
      <View style={styles.portalHeader}>
        <View style={[styles.portalIcon, { backgroundColor: portalInfo.color }]}>
          <Ionicons name={portalInfo.icon as any} size={32} color="#ffffff" />
        </View>
        <View style={styles.portalHeaderInfo}>
          <Text style={styles.portalTitle}>{portalInfo.title}</Text>
          <Text style={styles.portalSubtitle}>{portalInfo.subtitle}</Text>
        </View>
      </View>

      {/* Contenido del Portal */}
      {children ? (
        children
      ) : (
        <View style={styles.defaultContent}>
          <Text style={styles.defaultTitle}>
            Bienvenido al {portalInfo.title}
          </Text>
          <Text style={styles.defaultDescription}>
            Desde aquí puedes gestionar todos los aspectos relacionados con{' '}
            {currentPortal === 'member' ? 'los miembros y residentes' : 'los guardias y la seguridad'}.
          </Text>
          
          {/* Lista de Funcionalidades */}
          {portalInfo.features.length > 0 && (
            <View style={styles.featuresList}>
              <Text style={styles.featuresTitle}>Funcionalidades disponibles:</Text>
              {portalInfo.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <View style={[styles.featureDot, { backgroundColor: portalInfo.color }]} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Indicador de Portal */}
      <View style={styles.portalIndicator}>
        <View style={[styles.indicatorDot, { backgroundColor: portalInfo.color }]} />
        <Text style={styles.indicatorText}>
          Portal activo: {currentPortal === 'member' ? 'Miembros' : 'Guardias'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  portalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 20,
    margin: 16,
    borderRadius: 12,
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
  portalIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  portalHeaderInfo: {
    flex: 1,
  },
  portalTitle: {
    color: '#333',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  portalSubtitle: {
    color: '#666',
    fontSize: 14,
    lineHeight: 20,
  },
  defaultContent: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultTitle: {
    color: '#333',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  defaultDescription: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  featuresList: {
    width: '100%',
    maxWidth: 400,
  },
  featuresTitle: {
    color: '#333',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  featureText: {
    color: '#666',
    fontSize: 16,
    flex: 1,
  },
  portalIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  indicatorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  indicatorText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
});
