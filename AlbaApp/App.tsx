import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/utils/authContext';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <AppNavigator />
    </AuthProvider>
  );
}
