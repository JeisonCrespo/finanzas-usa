import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { FinanceProvider } from '../src/context/FinanceContext';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';

function RootNavigation() {
  const { isDark } = useTheme();
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <FinanceProvider>
        <RootNavigation />
      </FinanceProvider>
    </ThemeProvider>
  );
}
