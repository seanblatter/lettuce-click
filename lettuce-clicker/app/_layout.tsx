import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { GameProvider } from '@/context/GameContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GameProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="modal"
              options={{ presentation: 'modal', title: 'Modal', animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="music"
              options={{ headerShown: false, presentation: 'modal', animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="profile"
              options={{ headerShown: false, presentation: 'modal', animation: 'slide_from_bottom' }}
            />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </GameProvider>
    </GestureHandlerRootView>
  );
}
