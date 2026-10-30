import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <Tabs
      backBehavior="history"
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#0F172A' },
        headerTintColor: '#F8FAFC',
        headerTitleStyle: { fontWeight: '700' },
        tabBarStyle: {
          backgroundColor: '#0F172A',
          borderTopColor: '#1E293B',
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: '#38BDF8',
        tabBarInactiveTintColor: '#64748B',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Resumen',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet-outline" size={size} color={String(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="accounts"
        options={{
          title: 'Bancos US',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="card-outline" size={size} color={String(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="recurring"
        options={{
          title: 'Control',
          headerTitle: 'Recurrentes, Préstamos y Metas',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="layers-outline" size={size} color={String(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Presupuesto',
          headerTitle: 'Gráficas y Presupuesto Mensual',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pie-chart-outline" size={size} color={String(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Ajustes',
          headerTitle: 'Ajustes y Categorías',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={String(color)} />
          ),
        }}
      />
    </Tabs>
  );
}
