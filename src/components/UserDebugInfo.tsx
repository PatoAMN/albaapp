import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../utils/authContext';

export const UserDebugInfo: React.FC = () => {
  const { user, loading, error } = useAuth();

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>🔄 Cargando usuario...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>❌ Error: {error}</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.noUserText}>👤 No hay usuario autenticado</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="information-circle" size={24} color="#64B5F6" />
        <Text style={styles.title}>Información del Usuario (Debug)</Text>
      </View>
      
      <View style={styles.userInfo}>
        <Text style={styles.label}>ID:</Text>
        <Text style={styles.value}>{user.id}</Text>
        
        <Text style={styles.label}>Nombre:</Text>
        <Text style={styles.value}>{user.name}</Text>
        
        <Text style={styles.label}>Email:</Text>
        <Text style={styles.value}>{user.email}</Text>
        
        <Text style={styles.label}>Rol:</Text>
        <Text style={[styles.value, styles.roleValue, { 
          color: user.role === 'admin' || user.role === 'super_admin' ? '#4CAF50' : '#FF9800' 
        }]}>
          {user.role}
        </Text>
        
        <Text style={styles.label}>Estado:</Text>
        <Text style={[styles.value, { 
          color: user.status === 'active' ? '#4CAF50' : '#FF9800' 
        }]}>
          {user.status}
        </Text>
        
        <Text style={styles.label}>Organización ID:</Text>
        <Text style={styles.value}>{user.organizationId}</Text>
        
        <Text style={styles.label}>Firebase UID:</Text>
        <Text style={styles.value}>{user.firebaseUid}</Text>
      </View>
      
      <View style={styles.permissions}>
        <Text style={styles.permissionsTitle}>Permisos:</Text>
        
        <View style={styles.permissionItem}>
          <Ionicons 
            name={user.role === 'admin' || user.role === 'super_admin' ? 'checkmark-circle' : 'close-circle'} 
            size={20} 
            color={user.role === 'admin' || user.role === 'super_admin' ? '#4CAF50' : '#FF9800'} 
          />
          <Text style={styles.permissionText}>
            Acceso a Portal de Administrador
          </Text>
        </View>
        
        <View style={styles.permissionItem}>
          <Ionicons 
            name={user.role === 'super_admin' ? 'checkmark-circle' : 'close-circle'} 
            size={20} 
            color={user.role === 'super_admin' ? '#4CAF50' : '#FF9800'} 
          />
          <Text style={styles.permissionText}>
            Super Administrador
          </Text>
        </View>
      </View>
      
      <View style={styles.timestamp}>
        <Text style={styles.timestampText}>
          Creado: {user.createdAt.toLocaleDateString('es-MX')}
        </Text>
        <Text style={styles.timestampText}>
          Actualizado: {user.updatedAt.toLocaleDateString('es-MX')}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  title: {
    color: '#333',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userInfo: {
    marginBottom: 16,
  },
  label: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  value: {
    color: '#333',
    fontSize: 16,
    marginBottom: 4,
  },
  roleValue: {
    fontWeight: 'bold',
  },
  permissions: {
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  permissionsTitle: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  permissionText: {
    color: '#333',
    fontSize: 14,
  },
  timestamp: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  timestampText: {
    color: '#666',
    fontSize: 12,
    marginBottom: 4,
  },
  loadingText: {
    color: '#64B5F6',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
  noUserText: {
    color: '#FF9800',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
});
