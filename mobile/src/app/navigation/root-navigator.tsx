import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { AuthStack } from './auth-stack';
import { AppTabs } from './app-tabs';
import { useAuthStore } from '../../features/auth/store/auth.store';

export function RootNavigator() {
  const { token } = useAuthStore();

  return (
    <NavigationContainer>
      <StatusBar style={token ? "light" : "dark"} />
      {token ? <AppTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}
