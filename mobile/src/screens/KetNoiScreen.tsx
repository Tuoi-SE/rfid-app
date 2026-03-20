// src/screens/KetNoiScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Linking
} from 'react-native';
import BLEService from '../services/BLEService';
import SyncService from '../services/SyncService';
import { useBLEStore } from '../store/bleStore';
import { useInventoryStore } from '../store/inventoryStore';

export default function KetNoiScreen({ navigation }: any) {
  const [dangTimKiem, setDangTimKiem] = useState(false);
  const [dangKetNoi, setDangKetNoi] = useState(false);
  const [danhSachThietBi, setDanhSachThietBi] = useState<any[]>([]);

  const { setThietBiKetNoi, setTrangThai } = useBLEStore();
  const { themHoacCapNhatTag, capNhatTenTuServer } = useInventoryStore();

  const batDauTim = async () => {
    const coQuyen = await BLEService.xinQuyen();
    if (!coQuyen) {
      Alert.alert('Cần cấp quyền Bluetooth');
      return;
    }
    setDanhSachThietBi([]);
    setDangTimKiem(true);

    const seen = new Set<string>();
    
    await BLEService.quetThietBiClassic(
      device => {
        if (!seen.has(device.id)) {
          seen.add(device.id);
          setDanhSachThietBi(prev => [...prev, device]);
        }
      },
      error => {
        setDangTimKiem(false);
        Alert.alert('Lỗi Bluetooth', error.message);
      }
    );

    setDangTimKiem(false);
    
    if (seen.size === 0) {
      Alert.alert(
        'Không tìm thấy thiết bị',
        'Reader cần được PAIR trước:\n\n' +
        '1. Vào Cài đặt → Bluetooth trên điện thoại\n' +
        '2. Bật nguồn reader ST-H103\n' +
        '3. Tìm và ghép nối (Pair) thiết bị\n' +
        '4. Quay lại app và thử lại',
        [
          { text: 'Mở Bluetooth Settings', onPress: () => Linking.openSettings() },
          { text: 'OK' }
        ]
      );
    }
  };

  const ketNoiVao = async (deviceInfo: any) => {
    setDangKetNoi(true);
    try {
      try {
        const tenMap = await SyncService.pullTags();
        capNhatTenTuServer(tenMap);
      } catch {
        console.log("Offline mode - using local names if any");
      }

      await BLEService.ketNoi(deviceInfo, tag => {
        themHoacCapNhatTag(tag.epc, tag.rssi);
      });

      setThietBiKetNoi(deviceInfo);
      setTrangThai('da_ket_noi');
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
      setDangKetNoi(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.tieuDe}>🔫 Kết Nối RFID SPP (Native)</Text>
      <Text style={styles.moTa}>Hỗ trợ quét liên tục 100+ tag/s</Text>

      <TouchableOpacity
        style={[styles.nut, dangTimKiem && styles.nutMo]}
        onPress={batDauTim}
        disabled={dangTimKiem || dangKetNoi}
      >
        {dangTimKiem
          ? <><ActivityIndicator color="#fff" /><Text style={styles.textNut}> Đang tìm...</Text></>
          : <Text style={styles.textNut}>📡 Tìm Thiết Bị Đã Pair</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.nutSettings}
        onPress={() => Linking.openSettings()}
      >
        <Text style={styles.textNutSettings}>⚙️ Mở Bluetooth Settings (để Pair)</Text>
      </TouchableOpacity>

      {danhSachThietBi.length === 0 && !dangTimKiem && (
        <Text style={styles.huongDan}>
          Nhấn "Tìm Thiết Bị" để liệt kê.{'\n\n'}
          ⚠️ Reader cần được PAIR trước trong{'\n'}
          Settings → Bluetooth trên điện thoại.
        </Text>
      )}

      {danhSachThietBi.length > 0 && (
        <Text style={styles.soThietBi}>
          Tìm thấy {danhSachThietBi.length} thiết bị:
        </Text>
      )}

      <FlatList
        data={danhSachThietBi}
        keyExtractor={d => d.id}
        renderItem={({ item }) => {
          const isRFID = (item.name || '').toLowerCase().match(/uhf|rfid|h103|reader|hand|3/);
          return (
            <TouchableOpacity
              style={[styles.thietBiItem, isRFID && styles.thietBiRFID]}
              onPress={() => ketNoiVao(item)}
            >
              <View style={{flex:1}}>
                <Text style={styles.tenThietBi}>
                  {isRFID ? '⭐ ' : ''}{item.name || 'Không tên'}
                </Text>
                <Text style={styles.macText}>MAC: {item.id}</Text>
              </View>
              <Text style={styles.nutKetNoi}>
                {dangKetNoi ? '...' : 'Kết nối →'}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#0a0a1a', padding: 16 },
  tieuDe:       { fontSize: 22, fontWeight: 'bold', color: '#4dd0e1',
                  marginBottom: 4, textAlign: 'center' },
  moTa:         { color: '#888', fontSize: 12, textAlign: 'center', marginBottom: 20 },
  nut:          { backgroundColor: '#1976D2', padding: 14, borderRadius: 10,
                  alignItems: 'center', marginBottom: 10, flexDirection: 'row',
                  justifyContent: 'center' },
  nutMo:        { backgroundColor: '#555' },
  textNut:      { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  nutSettings:  { backgroundColor: '#2a2a4e', padding: 12, borderRadius: 10,
                  alignItems: 'center', marginBottom: 20 },
  textNutSettings: { color: '#aaa', fontSize: 14 },
  huongDan:     { color: '#666', textAlign: 'center', marginTop: 40,
                  lineHeight: 24 },
  soThietBi:    { color: '#aaa', fontSize: 13, marginBottom: 8 },
  thietBiItem:  { backgroundColor: '#1a1a2e', padding: 14, borderRadius: 10,
                  marginBottom: 10, flexDirection: 'row',
                  justifyContent: 'space-between', alignItems: 'center',
                  borderWidth: 1, borderColor: '#2a2a4e' },
  thietBiRFID:  { borderColor: '#4dd0e1', borderWidth: 2, backgroundColor: '#0d2137' },
  tenThietBi:   { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  macText:      { color: '#888', fontSize: 12 },
  nutKetNoi:    { color: '#4dd0e1', fontWeight: 'bold' },
});
