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
import { Settings, ScanLine } from 'lucide-react-native';

const Tab = createBottomTabNavigator();

export default function App() {
  const taiTuBo = useInventoryStore(s => s.taiTuBo);

  useEffect(() => {
    taiTuBo(); // Load offline saved data when app loads
  }, []);

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
          tabBarLabelStyle:     { fontSize: 12, fontWeight: 'bold' }
        }}
      >
        <Tab.Screen
          name="KetNoi"
          component={KetNoiScreen}
          options={{ 
            title: 'Kết Nối Máy Quét',
            tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />
          }}
        />
        <Tab.Screen
          name="QuetThe"
          component={QuetTheScreen}
          options={{ 
            title: 'Live Scanning',
            tabBarIcon: ({ color, size }) => <ScanLine color={color} size={size} />
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
