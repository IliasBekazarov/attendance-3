import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { Provider as PaperProvider } from 'react-native-paper';

export default function App() {
  return (
    <PaperProvider>
      <NavigationContainer>
        <AuthProvider>
          <AppNavigator />
          <StatusBar style="auto" />
        </AuthProvider>
      </NavigationContainer>
    </PaperProvider>
  );
}
