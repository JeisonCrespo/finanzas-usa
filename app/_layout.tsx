import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { FinanceProvider } from '../src/context/FinanceContext';

export default function RootLayout() {
  return (
    <FinanceProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </FinanceProvider>
  );
}
