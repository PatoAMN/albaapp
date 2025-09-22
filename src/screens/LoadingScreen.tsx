import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LoadingScreenProps {
  message?: string;
  showIcon?: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = 'Cargando...', 
  showIcon = true 
}) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <View style={styles.content}>
        {showIcon && (
          <View style={styles.iconContainer}>
            <Ionicons name="shield-checkmark" size={64} color="#64B5F6" />
          </View>
        )}
        
        <ActivityIndicator size="large" color="#64B5F6" style={styles.spinner} />
        
        <Text style={styles.message}>{message}</Text>
        
        <Text style={styles.subtitle}>
          Por favor espera mientras configuramos tu experiencia
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    marginBottom: 32,
  },
  spinner: {
    marginBottom: 24,
  },
  message: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
});
