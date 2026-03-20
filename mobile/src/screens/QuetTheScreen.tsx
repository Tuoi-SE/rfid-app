// src/screens/QuetTheScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, TextInput, Modal, Alert
} from 'react-native';
import BLEService from '../services/BLEService';
import SyncService from '../services/SyncService';
import { useBLEStore } from '../store/bleStore';
import { useInventoryStore, TagItem } from '../store/inventoryStore';

export default function QuetTheScreen() {
  const { dangQuetInventory, setDangQuet, trangThai } = useBLEStore();
  const { tags, doiTen, batDauPhienMoi, luuVaoBo } = useInventoryStore();
  const [tagChon, setTagChon] = useState<TagItem | null>(null);
  const [tenMoi, setTenMoi] = useState('');
  const [hienModal, setHienModal] = useState(false);

  // Sync real-time to backend every time tags change during a live scan
  useEffect(() => {
     if (dangQuetInventory) {
       const mappedTags = Object.values(tags)
          .filter(t => t.coMat) // Only push currently visible tags
          .map(t => ({ epc: t.epc, rssi: t.rssi }));
       
       if (mappedTags.length > 0) {
           SyncService.pushLiveScan(mappedTags);
       }
     }
  }, [tags, dangQuetInventory]);

  const danhSach = Object.values(tags).sort(
    (a, b) => b.lanQuetCuoi.getTime() - a.lanQuetCuoi.getTime()
  );

  const batDauQuet = async () => {
    if (trangThai !== 'da_ket_noi') {
        Alert.alert('Chưa kết nối', 'Vui lòng kết nối súng RFID trước!');
        return;
    }
    batDauPhienMoi(); // Reset 'coMat' flags for a fresh scan
    await BLEService.batDauQuet();
    setDangQuet(true);
  };

  const dungQuet = async () => {
    await BLEService.dungQuet();
    setDangQuet(false);
    await luuVaoBo(); // Persist to AsyncStorage

    // Gửi kết quả lên server
    try {
      if (danhSach.filter(t => t.coMat).length > 0){
          await SyncService.pushSession({
            name: `Phiên Live Mobile ${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN')}`,
            scans: danhSach
              .filter(t => t.coMat)
              .map(t => ({ epc: t.epc, rssi: t.rssi, time: t.lanQuetCuoi }))
          });
          Alert.alert('Thành công', 'Đã lưu Phiên Quét lên Hệ Thống Server\n\nBạn có thể kiểm tra trên Web App.');
      }
    } catch {
      Alert.alert('Lưu offline', 'Phiên được lưu offline. Sẽ đồng bộ khi có mạng.');
    }
  };

  const mauRSSI = (rssi: number) => {
    if (rssi > -60) return '#4CAF50';
    if (rssi > -75) return '#FF9800';
    return '#f44336';
  };

  return (
    <View style={styles.container}>
      {/* Nút quét */}
      <TouchableOpacity
        style={[styles.nutQuet, dangQuetInventory && styles.nutDung, trangThai !== 'da_ket_noi' && styles.nutDisabled]}
        onPress={dangQuetInventory ? dungQuet : batDauQuet}
      >
        <Text style={styles.textNutQuet}>
           {trangThai !== 'da_ket_noi' ? '🚫 Chưa kết nối RFID' : (dangQuetInventory ? '⏹  Dừng quét & Lưu' : '▶  Bắt đầu quét (SPP Mode)')}
        </Text>
      </TouchableOpacity>

      {/* Thống kê */}
      <View style={styles.thongKe}>
        <View style={styles.soThongKe}>
          <Text style={styles.soLon}>{danhSach.length}</Text>
          <Text style={styles.nhan}>Tổng thẻ</Text>
        </View>
        <View style={styles.soThongKe}>
          <Text style={[styles.soLon, { color: '#4CAF50' }]}>
            {danhSach.filter(t => t.coMat).length}
          </Text>
          <Text style={styles.nhan}>Có mặt</Text>
        </View>
        <View style={styles.soThongKe}>
          <Text style={[styles.soLon, { color: '#f44336' }]}>
            {danhSach.filter(t => !t.coMat).length}
          </Text>
          <Text style={styles.nhan}>Vắng mặt</Text>
        </View>
      </View>

      {/* Danh sách */}
      <FlatList
        data={danhSach}
        keyExtractor={item => item.epc}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.theTag}
            onLongPress={() => {
              setTagChon(item);
              setTenMoi(item.tenHienThi);
              setHienModal(true);
            }}
          >
            <View style={styles.dongDau}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[styles.dot, {
                  backgroundColor: item.coMat ? '#4CAF50' : '#f44336'
                }]} />
                <Text style={styles.tenTag}>{item.tenHienThi}</Text>
              </View>
              <Text style={{ color: mauRSSI(item.rssi), fontSize: 13, fontWeight: 'bold' }}>
                {item.rssi} dBm
              </Text>
            </View>
            <Text style={styles.epcText}>{item.epc}</Text>
            <Text style={styles.textPhu}>
              {item.coMat ? '✅ Đang quét' : '❌ Đã mất tín hiệu'} · {item.soLanQuet} hit
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.troung}>
             {trangThai !== 'da_ket_noi' ? '⚠️ Kết nối thiết bị ở tab Bluetooth trước' : (dangQuetInventory ? '🔫 Bóp cò súng hướng vào thẻ RFID...' : '📭 Nhấn "Bắt đầu quét" để nghe tín hiệu')}
          </Text>
        }
      />

      {/* Modal đổi tên */}
      <Modal visible={hienModal} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.tieuDeModal}>✏️ Đổi tên thẻ Database</Text>
            <Text style={styles.epcModal}>{tagChon?.epc}</Text>
            <TextInput
              style={styles.input}
              value={tenMoi}
              onChangeText={setTenMoi}
              placeholder="Nhập tên mới..."
              placeholderTextColor="#666"
              autoFocus
            />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                style={[styles.nutModal, { backgroundColor: '#333' }]}
                onPress={() => setHienModal(false)}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.nutModal, { backgroundColor: '#4dd0e1' }]}
                onPress={() => {
                  if (tagChon && tenMoi.trim()) {
                    doiTen(tagChon.epc, tenMoi.trim());
                    setHienModal(false);
                  }
                }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>💾 Lưu Nháp</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#0a0a1a', padding: 12 },
  thongKe:     { flexDirection: 'row', backgroundColor: '#1a1a2e',
                 borderRadius: 12, padding: 16, marginBottom: 12,
                 justifyContent: 'space-around' },
  soThongKe:   { alignItems: 'center' },
  soLon:       { fontSize: 28, fontWeight: 'bold', color: '#4dd0e1' },
  nhan:        { color: '#888', fontSize: 12, marginTop: 2 },
  nutQuet:     { backgroundColor: '#4CAF50', borderRadius: 12,
                 padding: 16, alignItems: 'center', marginBottom: 16 },
  nutDung:     { backgroundColor: '#f44336' },
  nutDisabled: { backgroundColor: '#333', opacity: 0.7 },
  textNutQuet: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  theTag:      { backgroundColor: '#1a1a2e', borderRadius: 10,
                 padding: 16, marginBottom: 8, borderWidth: 1,
                 borderColor: '#2a2a4e' },
  dongDau:     { flexDirection: 'row', justifyContent: 'space-between',
                 alignItems: 'center' },
  dot:         { width: 8, height: 8, borderRadius: 4 },
  tenTag:      { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  epcText:     { color: '#4dd0e1', fontSize: 11, marginTop: 8,
                 fontFamily: 'monospace' },
  textPhu:     { color: '#666', fontSize: 12, marginTop: 6 },
  troung:      { color: '#888', textAlign: 'center', marginTop: 60, fontSize: 16 },
  overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
                 justifyContent: 'flex-end' },
  modal:       { backgroundColor: '#1a1a2e', borderTopLeftRadius: 20,
                 borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  tieuDeModal: { color: '#4dd0e1', fontSize: 18, fontWeight: 'bold',
                 marginBottom: 8 },
  epcModal:    { color: '#555', fontSize: 11, marginBottom: 16,
                 fontFamily: 'monospace' },
  input:       { backgroundColor: '#0a0a1a', color: '#fff', borderRadius: 8,
                 padding: 12, fontSize: 16, marginBottom: 20,
                 borderWidth: 1, borderColor: '#4dd0e1' },
  nutModal:    { flex: 1, padding: 14, borderRadius: 8, alignItems: 'center' },
});
