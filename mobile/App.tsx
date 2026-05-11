import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { AuthProvider } from './src/contexts/AuthContext';
import { NotificationProvider } from './src/contexts/NotificationContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import { navigationRef } from './src/navigation/navigationRef';

function AppShell() {
  const { colors, isDark } = useTheme();
  const transparentTheme = {
    ...DefaultTheme,
    dark: isDark,
    colors: {
      ...DefaultTheme.colors,
      background: 'transparent',
      text: colors.ink,
      card: colors.headerBg,
      primary: colors.gold,
      border: colors.borderSoft,
    },
  };

  return (
    <ImageBackground
      source={require('./assets/arkaplan.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={[styles.overlay, { backgroundColor: colors.backgroundOverlay }]} />
      <NavigationContainer ref={navigationRef} theme={transparentTheme}>
        <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.headerBg} />
        <AppNavigator />
      </NavigationContainer>
    </ImageBackground>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <AppShell />
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
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
  },
});
