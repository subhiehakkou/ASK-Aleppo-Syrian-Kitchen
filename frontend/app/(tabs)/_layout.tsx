import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Flag images
const FLAG_SY = { uri: 'https://flagcdn.com/w80/sy.png' };
const FLAG_GB = { uri: 'https://flagcdn.com/w80/gb.png' };
const FLAG_SE = { uri: 'https://flagcdn.com/w80/se.png' };

export default function TabLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: '#FFDA47' }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            elevation: 0,
            height: 90,
            paddingBottom: 30,
            paddingTop: 10,
          },
          tabBarBackground: () => (
            <LinearGradient
              colors={['#FFDA47', '#FFD700', '#E0B000']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          ),
          tabBarActiveTintColor: '#3A3A3A',
          tabBarInactiveTintColor: 'rgba(58, 58, 58, 0.6)',
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginTop: 4,
          },
        }}
      >
      <Tabs.Screen
        name="index"
        options={{
          title: 'العربية',
          tabBarIcon: ({ focused }) => (
            <Image 
              source={FLAG_SY} 
              style={[styles.flagIcon, focused && styles.flagIconActive]} 
              resizeMode="cover"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="english"
        options={{
          title: 'English',
          tabBarIcon: ({ focused }) => (
            <Image 
              source={FLAG_GB} 
              style={[styles.flagIcon, focused && styles.flagIconActive]} 
              resizeMode="cover"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="svenska"
        options={{
          title: 'Svenska',
          tabBarIcon: ({ focused }) => (
            <Image 
              source={FLAG_SE} 
              style={[styles.flagIcon, focused && styles.flagIconActive]} 
              resizeMode="cover"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favorite',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "heart" : "heart-outline"} 
              size={26} 
              color={color} 
            />
          ),
        }}
      />
    </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  flagIcon: {
    width: 32,
    height: 22,
    borderRadius: 3,
    opacity: 0.8,
  },
  flagIconActive: {
    opacity: 1,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
