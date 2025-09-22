import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/utils/authContext';
import { OrganizationProvider } from './src/utils/organizationContext';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    <OrganizationProvider>
      <AuthProvider>
        <StatusBar style="auto" />
        <AppNavigator />
      </AuthProvider>
    </OrganizationProvider>
  );
}
