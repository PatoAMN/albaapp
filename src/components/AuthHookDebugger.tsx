import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { useAuthDebug } from '../utils/useAuthDebug';

export const AuthHookDebugger: React.FC = () => {
  const auth = useAuthDebug();
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔍 Debug del Hook useAuth</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Estado del Hook:</Text>
        <Text style={styles.label}>Hook ejecutado:</Text>
        <Text style={styles.value}>✅ Sí</Text>
        
        <Text style={styles.label}>Contexto disponible:</Text>
        <Text style={[styles.value, { 
          color: auth ? '#4CAF50' : '#FF5722' 
        }]}>
          {auth ? '✅ Sí' : '❌ No'}
        </Text>
        
        <Text style={styles.label}>Usuario en hook:</Text>
        <Text style={[styles.value, { 
          color: auth?.user ? '#4CAF50' : '#FF9800' 
        }]}>
          {auth?.user ? `✅ ${auth.user.name} (${auth.user.role})` : '❌ No hay usuario'}
        </Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Comparación con useAuth:</Text>
        <Text style={styles.note}>
          Este componente usa useAuthDebug() en lugar de useAuth().
          Si ves diferencias, hay un problema con el hook original.
        </Text>
      </View>
      
      <View style={styles.timestamp}>
        <Text style={styles.timestampText}>
          Última actualización: {new Date().toLocaleTimeString('es-MX')}
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
  title: {
    color: '#333',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
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
  note: {
    color: '#666',
    fontSize: 12,
    fontStyle: 'italic',
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 4,
  },
  timestamp: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  timestampText: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
