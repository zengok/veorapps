import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/contexts/AuthContext';
import { NotificationProvider } from './src/contexts/NotificationContext';
import AppNavigator from './src/navigation/AppNavigator';
import { navigationRef } from './src/navigation/navigationRef';

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <NavigationContainer ref={navigationRef}>
          <StatusBar style="light" backgroundColor="#1a1a1a" />
          <AppNavigator />
        </NavigationContainer>
      </NotificationProvider>
    </AuthProvider>
  );
}
