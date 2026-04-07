import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LanguageProvider } from '../src/context/LanguageContext';
import { FavoritesProvider } from '../src/context/FavoritesContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { useFonts } from '@expo-google-fonts/cairo/useFonts';
import { Cairo_400Regular, Cairo_600SemiBold, Cairo_700Bold } from '@expo-google-fonts/cairo';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Cairo_400Regular,
    Cairo_600SemiBold,
    Cairo_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFE566" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <LanguageProvider>
        <FavoritesProvider>
          <StatusBar style="dark" backgroundColor="#FFDA47" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#FFFFF0' },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="category/[id]" />
            <Stack.Screen name="recipe/[id]" />
            <Stack.Screen name="contact" />
            <Stack.Screen name="about" />
          </Stack>
        </FavoritesProvider>
      </LanguageProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFF0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFF0',
  },
});
