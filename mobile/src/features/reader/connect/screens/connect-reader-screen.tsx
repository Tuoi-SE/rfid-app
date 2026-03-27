import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Linking
} from 'react-native';
import { useReaderConnection } from '../../ble/hooks/use-reader-connection';
import { useReaderStore } from '../../ble/store/reader.store';

import { inventoryApi } from '../../../inventory/api/sessions';
import { useScanSessionStore } from '../../../inventory/store/scan-session.store';
import { useTagCacheStore } from '../../../inventory/store/tag-cache.store';

export function ConnectReaderScreen({ navigation }: any) {
  const [isScanningForDevices, setIsScanningForDevices] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const { scanDevices, connectToDevice } = useReaderConnection();
  const { foundDevices } = useReaderStore();
  
  const { addOrUpdateTag } = useScanSessionStore();
  const { updateServerNames } = useTagCacheStore();

  const startScan = async () => {
    setIsScanningForDevices(true);
    try {
      await scanDevices();
      
      // We rely on the store to populate `foundDevices`. If empty after 10s:
      setTimeout(() => {
        if (useReaderStore.getState().foundDevices.length === 0) {
          Alert.alert(
            'Không tìm thấy thiết bị',
            'Đảm bảo RFID reader đang bật và ở gần điện thoại.\n\n' +
            '1. Bật nguồn reader\n' +
            '2. Đợi đèn LED nhấp nháy\n' +
            '3. Quay lại app và thử lại',
            [{ text: 'OK' }]
          );
        }
      }, 10500); 

    } catch (error: any) {
      Alert.alert('Lỗi Bluetooth', error.message);
    } finally {
      setIsScanningForDevices(false);
    }
  };

  const connectToSelectedDevice = async (deviceInfo: any) => {
    setIsConnecting(true);
    try {
      try {
        const nameMap = await inventoryApi.pullTags();
        updateServerNames(nameMap);
      } catch {
        console.log("Offline mode - using local names if any");
      }

      await connectToDevice(deviceInfo, (tag) => {
        addOrUpdateTag(tag.epc, tag.rssi);
      });

      navigation.navigate('QuetThe');
    } catch (e: any) {
      Alert.alert(
        'Không kết nối được',
        e.message + '\n\nĐảm bảo:\n• Reader đã được Pair trong Bluetooth Settings\n• Reader đang bật và gần điện thoại',
        [
          { text: 'Mở Bluetooth Settings', onPress: () => Linking.openSettings() },
          { text: 'OK' }
        ]
      );
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Kết Nối RFID (BLE)</Text>
      <Text style={styles.subtitle}>Quét BLE để tìm RFID reader</Text>

      <TouchableOpacity
        style={[styles.btn, isScanningForDevices && styles.btnDisabled]}
        onPress={startScan}
        disabled={isScanningForDevices || isConnecting}
      >
        {isScanningForDevices
          ? <><ActivityIndicator color="#fff" /><Text style={styles.btnText}> Đang tìm...</Text></>
          : <Text style={styles.btnText}>📡 Tìm Thiết Bị BLE</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.btnSettings}
        onPress={() => Linking.openSettings()}
      >
        <Text style={styles.btnSettingsText}>⚙️ Mở Bluetooth Settings (để Pair)</Text>
      </TouchableOpacity>

      {foundDevices.length === 0 && !isScanningForDevices && (
        <Text style={styles.instructions}>
          Nhấn "Tìm Thiết Bị" để quét BLE.{'\n\n'}
          ⚠️ Đảm bảo RFID reader đã bật nguồn{'\n'}
          và ở gần điện thoại.
        </Text>
      )}

      {foundDevices.length > 0 && (
        <Text style={styles.deviceCount}>
          Tìm thấy {foundDevices.length} thiết bị:
        </Text>
      )}

      <FlatList
        data={foundDevices.filter((d, i, arr) => arr.findIndex(x => x.id === d.id) === i)}
        keyExtractor={(d, index) => `${d.id}_${index}`}
        renderItem={({ item }) => {
          const isRFID = (item.name || '').toLowerCase().match(/uhf|rfid|h103|reader|hand|^3$/);
          return (
            <TouchableOpacity
              style={[styles.deviceItem, isRFID && styles.deviceRFID]}
              onPress={() => connectToSelectedDevice(item)}
              disabled={isConnecting}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.deviceName}>
                  {isRFID ? '⭐ ' : ''}{item.name || 'Không tên'}
                </Text>
                <Text style={styles.macText}>MAC: {item.id}</Text>
              </View>
              <Text style={styles.connectText}>
                {isConnecting ? '...' : 'Kết nối →'}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a1a', padding: 16 },
  title: {
    fontSize: 22, fontWeight: 'bold', color: '#4dd0e1',
    marginBottom: 4, textAlign: 'center'
  },
  subtitle: { color: '#888', fontSize: 12, textAlign: 'center', marginBottom: 20 },
  btn: {
    backgroundColor: '#1976D2', padding: 14, borderRadius: 10,
    alignItems: 'center', marginBottom: 10, flexDirection: 'row',
    justifyContent: 'center'
  },
  btnDisabled: { backgroundColor: '#555' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  btnSettings: {
    backgroundColor: '#2a2a4e', padding: 12, borderRadius: 10,
    alignItems: 'center', marginBottom: 20
  },
  btnSettingsText: { color: '#aaa', fontSize: 14 },
  instructions: {
    color: '#666', textAlign: 'center', marginTop: 40,
    lineHeight: 24
  },
  deviceCount: { color: '#aaa', fontSize: 13, marginBottom: 8 },
  deviceItem: {
    backgroundColor: '#1a1a2e', padding: 14, borderRadius: 10,
    marginBottom: 10, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: '#2a2a4e'
  },
  deviceRFID: { borderColor: '#4dd0e1', borderWidth: 2, backgroundColor: '#0d2137' },
  deviceName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  macText: { color: '#888', fontSize: 12 },
  connectText: { color: '#4dd0e1', fontWeight: 'bold' },
});
