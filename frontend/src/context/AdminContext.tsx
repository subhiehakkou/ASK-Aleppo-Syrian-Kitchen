import React, { createContext, useContext, useState, useCallback } from 'react';
import { Alert } from 'react-native';
import axios from 'axios';
import Constants from 'expo-constants';

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface AdminContextType {
  isAdmin: boolean;
  enterAdminMode: () => void;
  exitAdminMode: () => void;
  adminPassword: string;
  updateRecipe: (recipeId: string, field: string, value: string) => Promise<boolean>;
  updateCategory: (catId: string, field: string, value: string) => Promise<boolean>;
  updateAbout: (field: string, value: string) => Promise<boolean>;
}

const AdminContext = createContext<AdminContextType>({
  isAdmin: false,
  enterAdminMode: () => {},
  exitAdminMode: () => {},
  adminPassword: '',
  updateRecipe: async () => false,
  updateCategory: async () => false,
  updateAbout: async () => false,
});

export const useAdmin = () => useContext(AdminContext);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');

  const enterAdminMode = useCallback(() => {
    Alert.prompt(
      '🔐 وضع المسؤول',
      'أدخل كلمة المرور:',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'دخول',
          onPress: async (password) => {
            if (!password) return;
            try {
              const resp = await axios.post(`${API_BASE}/api/admin/verify`, { password });
              if (resp.data.success) {
                setAdminPassword(password);
                setIsAdmin(true);
                Alert.alert('✅', 'تم تفعيل وضع التحرير');
              }
            } catch (e) {
              Alert.alert('❌', 'كلمة المرور غير صحيحة');
            }
          },
        },
      ],
      'secure-text'
    );
  }, []);

  const exitAdminMode = useCallback(() => {
    setIsAdmin(false);
    setAdminPassword('');
    Alert.alert('', 'تم الخروج من وضع التحرير');
  }, []);

  const updateRecipe = useCallback(async (recipeId: string, field: string, value: string): Promise<boolean> => {
    try {
      const resp = await axios.put(
        `${API_BASE}/api/admin/recipes/${recipeId}?password=${encodeURIComponent(adminPassword)}`,
        { [field]: value }
      );
      return resp.data.success;
    } catch (e) {
      console.log('Update recipe error:', e);
      return false;
    }
  }, [adminPassword]);

  const updateCategory = useCallback(async (catId: string, field: string, value: string): Promise<boolean> => {
    try {
      const resp = await axios.put(
        `${API_BASE}/api/admin/categories/${catId}?password=${encodeURIComponent(adminPassword)}`,
        { [field]: value }
      );
      return resp.data.success;
    } catch (e) {
      console.log('Update category error:', e);
      return false;
    }
  }, [adminPassword]);

  const updateAbout = useCallback(async (field: string, value: string): Promise<boolean> => {
    try {
      const resp = await axios.put(
        `${API_BASE}/api/admin/about?password=${encodeURIComponent(adminPassword)}`,
        { [field]: value }
      );
      return resp.data.success;
    } catch (e) {
      console.log('Update about error:', e);
      return false;
    }
  }, [adminPassword]);

  return (
    <AdminContext.Provider value={{ isAdmin, enterAdminMode, exitAdminMode, adminPassword, updateRecipe, updateCategory, updateAbout }}>
      {children}
    </AdminContext.Provider>
  );
}
