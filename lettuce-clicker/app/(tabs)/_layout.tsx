import { Tabs } from 'expo-router';
import React from 'react';
import { Text } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>🏠</Text>,
        }}
      />
      <Tabs.Screen
        name="garden"
        options={{
          title: 'Garden',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>🌲</Text>,
        }}
      />
      <Tabs.Screen
        name="upgrades"
        options={{
          title: 'Upgrades',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>⚡️</Text>,
        }}
      />
    </Tabs>
  );
}
