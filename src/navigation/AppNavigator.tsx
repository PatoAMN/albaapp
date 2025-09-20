import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../utils/authContext';
import { LoginScreen } from '../screens/LoginScreen';
import { MemberPortalContainer } from '../screens/MemberPortalContainer';
import { GuardScannerScreen } from '../screens/GuardScannerScreen';
import { GuardChatScreen } from '../screens/GuardChatScreen';
import SecurityLogsScreen from '../screens/SecurityLogsScreen';

export type RootStackParamList = {
  Login: undefined;
  MemberHome: undefined;
  Principal: undefined;
  GuardScanner: undefined;
  GuardChat: {
    onGoBack?: () => void;
  };
  SecurityLogs: undefined;
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
            <Stack.Screen name="Principal" component={MemberPortalContainer} />
            <Stack.Screen name="MemberHome" component={MemberPortalContainer} />
          </>
        ) : (
          <>
            <Stack.Screen name="GuardScanner" component={GuardScannerScreen} />
            <Stack.Screen name="GuardChat" component={GuardChatScreen} />
            <Stack.Screen name="SecurityLogs" component={SecurityLogsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
