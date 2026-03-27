import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Settings, ScanLine, Tag, LocateFixed, LogOut, ClipboardList } from 'lucide-react-native';
import { TouchableOpacity, Alert } from 'react-native';

import { ConnectReaderScreen } from '../../features/reader/connect/screens/connect-reader-screen';
import { InventoryScanScreen } from '../../features/inventory/scan/screens/inventory-scan-screen';
import { AssignTagsScreen } from '../../features/inventory/assign/screens/assign-tags-screen';
import { FindTagScreen } from '../../features/inventory/find/screens/find-tag-screen';
import { TransactionsScreen } from '../../features/transactions/screens/transactions-screen';
import { useAuthStore } from '../../features/auth/store/auth.store';

const Tab = createBottomTabNavigator();

export function AppTabs() {
  const { logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0a0a1a', height: 100 },
        headerTintColor: '#4dd0e1',
        headerTitleStyle: { fontWeight: 'bold', fontSize: 20 },
        tabBarStyle: { backgroundColor: '#0a0a1a', borderTopColor: '#1a1a2e', paddingBottom: 5, height: 60 },
        tabBarActiveTintColor: '#4dd0e1',
        tabBarInactiveTintColor: '#555',
        tabBarLabelStyle: { fontSize: 12, fontWeight: 'bold' },
        headerRight: () => (
          <TouchableOpacity onPress={handleLogout} style={{ marginRight: 20 }}>
            <LogOut color="#f44336" size={24} />
          </TouchableOpacity>
        ),
      }}
    >
      <Tab.Screen
        name="KetNoi"
        component={ConnectReaderScreen}
        options={{
          title: 'Kết Nối',
          tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />
        }}
      />
      <Tab.Screen
        name="GiaoDich"
        component={TransactionsScreen}
        options={{
          title: 'Phiếu XNK',
          tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size} />
        }}
      />
      <Tab.Screen
        name="QuetThe"
        component={InventoryScanScreen}
        options={{
          title: 'Kiểm Kê',
          tabBarIcon: ({ color, size }) => <ScanLine color={color} size={size} />
        }}
      />
      <Tab.Screen
        name="CapThe"
        component={AssignTagsScreen}
        options={{
          title: 'Cấp Thẻ',
          tabBarIcon: ({ color, size }) => <Tag color={color} size={size} />
        }}
      />
      <Tab.Screen
        name="TimThe"
        component={FindTagScreen}
        options={{
          title: 'Dò Tìm',
          tabBarIcon: ({ color, size }) => <LocateFixed color={color} size={size} />
        }}
      />
    </Tab.Navigator>
  );
}
