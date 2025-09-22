import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../utils/authContext';
import { LoginScreen } from '../screens/LoginScreen';
import { MemberHomeScreen } from '../screens/MemberHomeScreen';
import { GuardScannerScreen } from '../screens/GuardScannerScreen';
import { AnnouncementsScreen } from '../screens/AnnouncementsScreen';

export type RootStackParamList = {
  Login: undefined;
  MemberHome: undefined;
  GuardScanner: undefined;
  Announcements: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user.userType === 'member' ? (
          <>
            <Stack.Screen name="MemberHome" component={MemberHomeScreen} />
            <Stack.Screen name="Announcements" component={AnnouncementsScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="GuardScanner" component={GuardScannerScreen} />
            <Stack.Screen name="Announcements" component={AnnouncementsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
