import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Text style={[styles.emoji, { color }]}>🏡</Text>,
        }}
      />
      <Tabs.Screen
        name="garden"
        options={{
          title: 'Garden',
          tabBarIcon: ({ color }) => <Text style={[styles.emoji, { color }]}>🌿</Text>,
        }}
      />
      <Tabs.Screen
        name="upgrades"
        options={{
          title: 'Upgrades',
          tabBarIcon: ({ color }) => <Text style={[styles.emoji, { color }]}>✨</Text>,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  emoji: {
    fontSize: 20,
    lineHeight: 24,
  },
});
