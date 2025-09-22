import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useAuth } from '../utils/authContext';

export const AuthDebugger: React.FC = () => {
  const auth = useAuth();
  
  console.log('🔍 [AuthDebugger] Renderizando componente');
  console.log('🔍 [AuthDebugger] Auth completo:', auth);
  console.log('🔍 [AuthDebugger] User:', auth.user);
  console.log('🔍 [AuthDebugger] Loading:', auth.loading);
  console.log('🔍 [AuthDebugger] Error:', auth.error);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔍 Debug del Contexto de Autenticación</Text>
      
      <ScrollView style={styles.content}>
        {/* Estado de Loading */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estado de Loading</Text>
          <Text style={[styles.value, { color: auth.loading ? '#FF9800' : '#4CAF50' }]}>
            {auth.loading ? '🔄 Cargando...' : '✅ No está cargando'}
          </Text>
        </View>

        {/* Error */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Error</Text>
          <Text style={[styles.value, { color: auth.error ? '#FF5722' : '#4CAF50' }]}>
            {auth.error || '✅ Sin errores'}
          </Text>
        </View>

        {/* Usuario */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Usuario</Text>
          {auth.user ? (
            <View style={styles.userDetails}>
              <Text style={styles.label}>ID:</Text>
              <Text style={styles.value}>{auth.user.id}</Text>
              
              <Text style={styles.label}>Nombre:</Text>
              <Text style={styles.value}>{auth.user.name}</Text>
              
              <Text style={styles.label}>Email:</Text>
              <Text style={styles.value}>{auth.user.email}</Text>
              
              <Text style={styles.label}>Rol:</Text>
              <Text style={[styles.value, { 
                color: auth.user.role === 'admin' || auth.user.role === 'super_admin' ? '#4CAF50' : '#FF9800' 
              }]}>
                {auth.user.role}
              </Text>
              
              <Text style={styles.label}>Estado:</Text>
              <Text style={[styles.value, { 
                color: auth.user.status === 'active' ? '#4CAF50' : '#FF9800' 
              }]}>
                {auth.user.status}
              </Text>
              
              <Text style={styles.label}>Organización ID:</Text>
              <Text style={styles.value}>{auth.user.organizationId}</Text>
              
              <Text style={styles.label}>Firebase UID:</Text>
              <Text style={styles.value}>{auth.user.firebaseUid}</Text>
            </View>
          ) : (
            <Text style={[styles.value, { color: '#FF9800' }]}>
              👤 No hay usuario autenticado
            </Text>
          )}
        </View>

        {/* Organización */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Organización</Text>
          {auth.organization ? (
            <View style={styles.orgDetails}>
              <Text style={styles.label}>ID:</Text>
              <Text style={styles.value}>{auth.organization.id}</Text>
              
              <Text style={styles.label}>Nombre:</Text>
              <Text style={styles.value}>{auth.organization.name}</Text>
              
              <Text style={styles.label}>Dirección:</Text>
              <Text style={styles.value}>{auth.organization.address}</Text>
            </View>
          ) : (
            <Text style={[styles.value, { color: '#FF9800' }]}>
              🏢 No hay organización cargada
            </Text>
          )}
        </View>

        {/* Validación de Acceso */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Validación de Acceso</Text>
          
          <View style={styles.validationItem}>
            <Text style={styles.label}>Usuario existe:</Text>
            <Text style={[styles.value, { color: !!auth.user ? '#4CAF50' : '#FF5722' }]}>
              {!!auth.user ? '✅' : '❌'}
            </Text>
          </View>
          
          <View style={styles.validationItem}>
            <Text style={styles.label}>Es administrador:</Text>
            <Text style={[styles.value, { 
              color: auth.user?.role === 'admin' || auth.user?.role === 'super_admin' ? '#4CAF50' : '#FF5722' 
            }]}>
              {auth.user?.role === 'admin' || auth.user?.role === 'super_admin' ? '✅' : '❌'}
            </Text>
          </View>
          
          <View style={styles.validationItem}>
            <Text style={styles.label}>Está activo:</Text>
            <Text style={[styles.value, { 
              color: auth.user?.status === 'active' ? '#4CAF50' : '#FF5722' 
            }]}>
              {auth.user?.status === 'active' ? '✅' : '❌'}
            </Text>
          </View>
          
          <View style={styles.validationItem}>
            <Text style={styles.label}>Tiene organización:</Text>
            <Text style={[styles.value, { 
              color: !!auth.user?.organizationId ? '#4CAF50' : '#FF5722' 
            }]}>
              {!!auth.user?.organizationId ? '✅' : '❌'}
            </Text>
          </View>
          
          <View style={styles.validationItem}>
            <Text style={styles.label}>Puede acceder al portal admin:</Text>
            <Text style={[styles.value, { 
              color: (auth.user?.role === 'admin' || auth.user?.role === 'super_admin') && 
                     auth.user?.status === 'active' && 
                     !!auth.user?.organizationId ? '#4CAF50' : '#FF5722' 
            }]}>
              {(auth.user?.role === 'admin' || auth.user?.role === 'super_admin') && 
               auth.user?.status === 'active' && 
               !!auth.user?.organizationId ? '✅' : '❌'}
            </Text>
          </View>
        </View>

        {/* Timestamp */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timestamp</Text>
          <Text style={styles.timestamp}>
            Última actualización: {new Date().toLocaleTimeString('es-MX')}
          </Text>
        </View>
      </ScrollView>
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
  title: {
    color: '#333',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  content: {
    maxHeight: 400,
  },
  section: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  label: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  value: {
    color: '#333',
    fontSize: 16,
    marginBottom: 4,
  },
  userDetails: {
    marginTop: 8,
  },
  orgDetails: {
    marginTop: 8,
  },
  validationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timestamp: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
