import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { AuthProvider } from './src/contexts/AuthContext';
import { NotificationProvider } from './src/contexts/NotificationContext';
import AppNavigator from './src/navigation/AppNavigator';
import { navigationRef } from './src/navigation/navigationRef';

const transparentTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: 'transparent',
  },
};

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <ImageBackground
          source={require('./assets/arkaplan.png')}
          style={styles.background}
          resizeMode="cover"
        >
          <View style={styles.overlay} />
          <NavigationContainer ref={navigationRef} theme={transparentTheme}>
            <StatusBar style="light" backgroundColor="#1a1a1a" />
            <AppNavigator />
          </NavigationContainer>
        </ImageBackground>
      </NotificationProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.75)', // Soft overlay to let background show but keep readability
  },
});
