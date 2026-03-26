// App.tsx
import { Buffer } from 'buffer';
global.Buffer = global.Buffer || Buffer;

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { useInventoryStore } from './src/store/inventoryStore';
import KetNoiScreen from './src/screens/KetNoiScreen';
import QuetTheScreen from './src/screens/QuetTheScreen';
import GiaoDichScreen from './src/screens/GiaoDichScreen';
import CapTheScreen from './src/screens/CapTheScreen';
import TimTheScreen from './src/screens/TimTheScreen';
import LoginScreen from './src/screens/LoginScreen';
import { Settings, ScanLine, Tag, LocateFixed, LogOut, ClipboardList } from 'lucide-react-native';
import { useAuthStore } from './src/store/authStore';
import { TouchableOpacity, Alert } from 'react-native';

const Tab = createBottomTabNavigator();

export default function App() {
  const taiTuBo = useInventoryStore(s => s.taiTuBo);
  const { token, logout } = useAuthStore();

  useEffect(() => {
    taiTuBo(); // Load offline saved data when app loads
  }, []);

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: logout },
    ]);
  };

  if (!token) {
    return (
      <NavigationContainer>
        <StatusBar style="dark" />
        <LoginScreen />
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={{
          headerStyle:          { backgroundColor: '#0a0a1a', height: 100 },
          headerTintColor:      '#4dd0e1',
          headerTitleStyle:     { fontWeight: 'bold', fontSize: 20 },
          tabBarStyle:          { backgroundColor: '#0a0a1a', borderTopColor: '#1a1a2e', paddingBottom: 5, height: 60 },
          tabBarActiveTintColor:   '#4dd0e1',
          tabBarInactiveTintColor: '#555',
          tabBarLabelStyle:     { fontSize: 12, fontWeight: 'bold' },
          headerRight: () => (
            <TouchableOpacity onPress={handleLogout} style={{ marginRight: 20 }}>
              <LogOut color="#f44336" size={24} />
            </TouchableOpacity>
          ),
        }}
      >
        <Tab.Screen
          name="KetNoi"
          component={KetNoiScreen}
          options={{ 
            title: 'Kết Nối',
            tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />
          }}
        />
        <Tab.Screen
          name="GiaoDich"
          component={GiaoDichScreen}
          options={{ 
            title: 'Phiếu XNK',
            tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size} />
          }}
        />
        <Tab.Screen
          name="QuetThe"
          component={QuetTheScreen}
          options={{ 
            title: 'Kiểm Kê',
            tabBarIcon: ({ color, size }) => <ScanLine color={color} size={size} />
          }}
        />
        <Tab.Screen
          name="CapThe"
          component={CapTheScreen}
          options={{ 
            title: 'Cấp Thẻ',
            tabBarIcon: ({ color, size }) => <Tag color={color} size={size} />
          }}
        />
        <Tab.Screen
          name="TimThe"
          component={TimTheScreen}
          options={{ 
            title: 'Dò Tìm',
            tabBarIcon: ({ color, size }) => <LocateFixed color={color} size={size} />
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
