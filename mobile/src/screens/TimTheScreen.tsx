// src/screens/TimTheScreen.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, TextInput, Dimensions, Animated, Easing
} from 'react-native';
import { useInventoryStore } from '../store/inventoryStore';
import { useBLEStore } from '../store/bleStore';
import BLEService from '../services/BLEService';

const { width } = Dimensions.get('window');

export default function TimTheScreen() {
  const { tenTuServer, tags } = useInventoryStore();
  const { trangThai, dangQuetInventory, setDangQuet } = useBLEStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [targetEpc, setTargetEpc] = useState<string | null>(null);
  const [hienThiRssi, setHienThiRssi] = useState(-100);

  // Animations cho Radar
  const pulseAnim = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    // Luôn luôn tạo hiệu ứng nhịp đập khi đang dò
    if (targetEpc) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
      
      // Khởi động Scanner tự động
      if (trangThai === 'da_ket_noi' && !dangQuetInventory) {
        BLEService.batDauQuet().then(() => setDangQuet(true)).catch(() => {});
      }
    } else {
      pulseAnim.stopAnimation();
    }
  }, [targetEpc, trangThai, dangQuetInventory]);

  // Vòng lặp kiểm tra tín hiệu
  useEffect(() => {
    if (!targetEpc) return;

    const interval = setInterval(() => {
      const tagInfo = useInventoryStore.getState().tags[targetEpc];
      if (tagInfo) {
        const timeSinceLastScan = Date.now() - new Date(tagInfo.lanQuetCuoi).getTime();
        if (timeSinceLastScan < 1500) {
          // Còn quét được trong 1.5s vừa qua
          setHienThiRssi(tagInfo.rssi);
        } else {
          // Mất tín hiệu
          setHienThiRssi(-100);
        }
      } else {
        setHienThiRssi(-100);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [targetEpc]);

  // Danh sách để chọn thẻ
  const danhSachChon = useMemo(() => {
    return Object.entries(tenTuServer)
      .filter(([epc, name]) => 
        name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        epc.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .slice(0, 50); // limit 50 để đỡ lag
  }, [searchQuery, tenTuServer]);

  const tinhPhanTram = (rssi: number) => {
    if (rssi < -90) return 0;
    if (rssi > -30) return 100;
    // Tuyến tính từ -90 tới -30. Quãng = 60
    return Math.round(((rssi + 90) / 60) * 100);
  };

  const layMauRadar = (phanTram: number) => {
    if (phanTram > 80) return '#4CAF50'; // Xanh lá - Gần
    if (phanTram > 50) return '#FFEB3B'; // Vàng - Vừa
    if (phanTram > 20) return '#FF9800'; // Cam - Xa
    return '#f44336'; // Đỏ - Rất xa / Mất tín hiệu
  };

  const phanTramHienTai = tinhPhanTram(hienThiRssi);
  const mauHienTai = layMauRadar(phanTramHienTai);
  const scale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1 + (phanTramHienTai / 100)],
  });
  const opacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 0],
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dò Tìm Radar</Text>
        <Text style={styles.headerSub}>
          {trangThai !== 'da_ket_noi' ? '🔴 Chưa kết nối thiết bị UHF' : '🟢 Sẵn sàng định vị'}
        </Text>
      </View>

      {!targetEpc ? (
        // Chọn Thẻ để dò
        <View style={styles.chonTheContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm theo Tên hoặc mã EPC..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <FlatList
            data={danhSachChon}
            keyExtractor={([epc]) => epc}
            contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
            renderItem={({ item: [epc, name] }) => (
              <TouchableOpacity
                style={styles.itemChon}
                onPress={() => setTargetEpc(epc)}
              >
                <Text style={styles.itemTen}>{name}</Text>
                <Text style={styles.itemEpc}>{epc}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={{ textAlign: 'center', color: '#888', marginTop: 20 }}>
                Không tìm thấy thẻ nào khớp. Kiểm tra đồng bộ (🔄) ở tab Quét thẻ.
              </Text>
            }
          />
        </View>
      ) : (
        // Radar Mode
        <View style={styles.radarContainer}>
          <Text style={styles.radarTargetName}>{tenTuServer[targetEpc] || 'Không xác định'}</Text>
          <Text style={styles.radarTargetEpc}>{targetEpc}</Text>

          <View style={styles.radarVisual}>
            {/* Vòng lan tỏa (Pulse) */}
            {phanTramHienTai > 0 && (
              <Animated.View
                style={[
                  styles.radarPulse,
                  { backgroundColor: mauHienTai, transform: [{ scale }], opacity },
                ]}
              />
            )}
            {/* Lõi Radar */}
            <View style={[styles.radarCore, { backgroundColor: phanTramHienTai > 0 ? mauHienTai : '#333' }]}>
              <Text style={styles.radarText}>{phanTramHienTai}%</Text>
              <Text style={styles.radarSubText}>{hienThiRssi} dBm</Text>
            </View>
          </View>

          <Text style={styles.radarHint}>
            {phanTramHienTai === 0 ? 'Chưa bắt được tín hiệu...' : 
             phanTramHienTai > 80 ? 'Sản phẩm ở rất gần bạn!' : 
             'Di chuyển súng quét xung quanh để dò hướng sóng.'}
          </Text>

          <TouchableOpacity
            style={styles.btnHuyDo}
            onPress={() => setTargetEpc(null)}
          >
            <Text style={styles.textBtnHuy}>❌ Dò thẻ khác</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a1a' },
  header: {
    paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20,
    backgroundColor: '#0d1b2a', borderBottomWidth: 1, borderBottomColor: '#1a2a3e',
    alignItems: 'center'
  },
  headerTitle: { color: '#4dd0e1', fontSize: 24, fontWeight: 'bold' },
  headerSub: { color: '#888', fontSize: 13, marginTop: 4 },
  
  // Choose Tag Mode
  chonTheContainer: { flex: 1 },
  searchInput: {
    backgroundColor: '#1a1a2e', color: '#fff', fontSize: 16,
    margin: 16, paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 12, borderWidth: 1, borderColor: '#2a2a4e',
  },
  itemChon: {
    backgroundColor: '#1a1a2e', padding: 16, borderRadius: 12, marginBottom: 12,
    borderWidth: 1, borderColor: '#2a2a4e',
  },
  itemTen: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  itemEpc: { color: '#4dd0e1', fontSize: 12, marginTop: 6, fontFamily: 'monospace' },

  // Radar Mode
  radarContainer: { flex: 1, alignItems: 'center', paddingTop: 40, paddingHorizontal: 20 },
  radarTargetName: { color: '#fff', fontSize: 28, fontWeight: 'bold', textAlign: 'center' },
  radarTargetEpc: { color: '#4dd0e1', fontSize: 14, fontFamily: 'monospace', marginTop: 8 },
  
  radarVisual: {
    width: width * 0.8,
    height: width * 0.8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  radarCore: {
    width: 120, height: 120, borderRadius: 60,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 4, borderColor: '#0a0a1a', zIndex: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10,
  },
  radarPulse: {
    position: 'absolute',
    width: 120, height: 120, borderRadius: 60,
    zIndex: 1,
  },
  radarText: { color: '#0a0a1a', fontSize: 32, fontWeight: 'bold' },
  radarSubText: { color: '#0a0a1a', fontSize: 14, fontWeight: '600', opacity: 0.8 },
  
  radarHint: { color: '#aaa', fontSize: 16, textAlign: 'center', marginBottom: 40, paddingHorizontal: 20 },
  
  btnHuyDo: {
    backgroundColor: '#1a1a2e', paddingVertical: 14, paddingHorizontal: 32,
    borderRadius: 30, borderWidth: 1, borderColor: '#f44336'
  },
  textBtnHuy: { color: '#f44336', fontSize: 16, fontWeight: 'bold' },
});
