import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '../utils/authContext';

export const SimpleAuthTest: React.FC = () => {
  try {
    const auth = useAuth();
    
    console.log('🔍 [SimpleAuthTest] Componente renderizado');
    console.log('🔍 [SimpleAuthTest] Auth object:', auth);
    console.log('🔍 [SimpleAuthTest] User:', auth?.user);
    console.log('🔍 [SimpleAuthTest] Loading:', auth?.loading);
    
    return (
      <View style={styles.container}>
        <Text style={styles.title}>🧪 Test Simple de Autenticación</Text>
        
        <View style={styles.statusContainer}>
          <Text style={styles.statusLabel}>Estado del Contexto:</Text>
          <Text style={[styles.statusValue, { 
            color: auth ? '#4CAF50' : '#FF5722' 
          }]}>
            {auth ? '✅ Contexto disponible' : '❌ Contexto NO disponible'}
          </Text>
        </View>
        
        <View style={styles.statusContainer}>
          <Text style={styles.statusLabel}>Usuario:</Text>
          <Text style={[styles.statusValue, { 
            color: auth?.user ? '#4CAF50' : '#FF9800' 
          }]}>
            {auth?.user ? `✅ ${auth.user.name} (${auth.user.role})` : '❌ No hay usuario'}
          </Text>
        </View>
        
        <View style={styles.statusContainer}>
          <Text style={styles.statusLabel}>Loading:</Text>
          <Text style={[styles.statusValue, { 
            color: auth?.loading ? '#FF9800' : '#4CAF50' 
          }]}>
            {auth?.loading ? '🔄 Cargando...' : '✅ No está cargando'}
          </Text>
        </View>
        
        <View style={styles.statusContainer}>
          <Text style={styles.statusLabel}>Error:</Text>
          <Text style={[styles.statusValue, { 
            color: auth?.error ? '#FF5722' : '#4CAF50' 
          }]}>
            {auth?.error || '✅ Sin errores'}
          </Text>
        </View>
        
        <View style={styles.debugInfo}>
          <Text style={styles.debugTitle}>Información de Debug:</Text>
          <Text style={styles.debugText}>Auth object: {JSON.stringify(auth, null, 2)}</Text>
        </View>
      </View>
    );
    
  } catch (error) {
    console.error('❌ [SimpleAuthTest] Error al usar useAuth:', error);
    
    return (
      <View style={styles.container}>
        <Text style={styles.title}>🧪 Test Simple de Autenticación</Text>
        <Text style={styles.errorText}>❌ Error al usar useAuth:</Text>
        <Text style={styles.errorDetails}>{error instanceof Error ? error.message : 'Error desconocido'}</Text>
        <Text style={styles.errorStack}>{error instanceof Error ? error.stack : ''}</Text>
      </View>
    );
  }
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
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  statusLabel: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  debugInfo: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  debugTitle: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  debugText: {
    color: '#666',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  errorText: {
    color: '#FF5722',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorDetails: {
    color: '#FF5722',
    fontSize: 14,
    marginBottom: 8,
  },
  errorStack: {
    color: '#666',
    fontSize: 10,
    fontFamily: 'monospace',
  },
});
