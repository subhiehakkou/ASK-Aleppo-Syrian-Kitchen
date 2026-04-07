import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarBackground: () => (
          <LinearGradient
            colors={['#FFD700', '#DAA520', '#B8860B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        ),
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.7)',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'العربية',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: 20 }}>🇸🇾</Text>
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // Navigate to home with Arabic language
          },
        })}
      />
      <Tabs.Screen
        name="english"
        options={{
          title: 'English',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: 20 }}>🇬🇧</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="svenska"
        options={{
          title: 'Svenska',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: 20 }}>🇸🇪</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favorite',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
