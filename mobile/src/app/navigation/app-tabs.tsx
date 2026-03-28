import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Settings, ScanLine, Tag, LocateFixed, LogOut, ClipboardList } from 'lucide-react-native';
import { TouchableOpacity, Alert, View, Text } from 'react-native';

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
        headerStyle: { backgroundColor: '#ffffff', height: 110, shadowColor: 'transparent', elevation: 0 },
        headerTintColor: '#000f8a',
        headerTitleAlign: 'left',
        headerTitle: 'Inventory Precision',
        headerTitleStyle: { fontWeight: '800', fontSize: 18, fontStyle: 'italic' },
        tabBarStyle: { backgroundColor: '#ffffff', borderTopColor: '#f1f5f9', paddingBottom: 5, height: 60 },
        tabBarActiveTintColor: '#0856f4',
        tabBarInactiveTintColor: '#8fccff',
        tabBarLabelStyle: { fontSize: 12, fontWeight: 'bold' },
        headerRight: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 20 }}>
            {/* Fake Avatar */}
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
              <Text style={{ fontWeight: 'bold', color: '#0856f4' }}>AD</Text>
            </View>
            <TouchableOpacity onPress={handleLogout}>
              <LogOut color="#000f8a" size={24} />
            </TouchableOpacity>
          </View>
        ),
      }}
    >
      <Tab.Screen
        name="KetNoi"
        component={ConnectReaderScreen}
        options={{
          tabBarLabel: 'Kết Nối',
          tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />
        }}
      />
      <Tab.Screen
        name="GiaoDich"
        component={TransactionsScreen}
        options={{
          tabBarLabel: 'Phiếu XNK',
          tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size} />
        }}
      />
      <Tab.Screen
        name="QuetThe"
        component={InventoryScanScreen}
        options={{
          tabBarLabel: 'Kiểm Kê',
          tabBarIcon: ({ color, size }) => <ScanLine color={color} size={size} />
        }}
      />
      <Tab.Screen
        name="CapThe"
        component={AssignTagsScreen}
        options={{
          tabBarLabel: 'Cấp Thẻ',
          tabBarIcon: ({ color, size }) => <Tag color={color} size={size} />
        }}
      />
      <Tab.Screen
        name="TimThe"
        component={FindTagScreen}
        options={{
          tabBarLabel: 'Dò Tìm',
          tabBarIcon: ({ color, size }) => <LocateFixed color={color} size={size} />
        }}
      />
    </Tab.Navigator>
  );
}
