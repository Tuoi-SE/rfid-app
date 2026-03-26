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
  const { tags, doiTen, batDauPhienMoi, luuVaoBo, themHoacCapNhatTag, xoaTatCa } = useInventoryStore();
  const [tagChon, setTagChon] = useState<TagItem | null>(null);
  const [tenMoi, setTenMoi] = useState('');
  const [hienModal, setHienModal] = useState(false);
  const [dangLuu, setDangLuu] = useState(false);

  // Auto-start scanning khi vào màn hình
  useEffect(() => {
    if (trangThai === 'da_ket_noi' && !dangQuetInventory) {
      autoStart();
    }
    // Auto-stop khi rời màn hình
    return () => {
      BLEService.dungQuet().catch(() => {});
    };
  }, []);

  const autoStart = async () => {
    try {
      await BLEService.batDauQuet();
      setDangQuet(true);
    } catch (e: any) {
      console.log('[UI] Auto-start error:', e.message);
    }
  };

  // Sync real-time to backend
  useEffect(() => {
    if (dangQuetInventory) {
      const mappedTags = Object.values(tags)
        .filter(t => t.coMat)
        .map(t => ({ epc: t.epc, rssi: t.rssi }));
      
      if (mappedTags.length > 0) {
        SyncService.pushLiveScan(mappedTags);
      }
    }
  }, [tags, dangQuetInventory]);

  const danhSach = Object.values(tags).sort(
    (a, b) => new Date(b.lanQuetCuoi).getTime() - new Date(a.lanQuetCuoi).getTime()
  );

  const phienMoi = () => {
    Alert.alert(
      'Phiên mới', 
      'Xóa tất cả tag đã quét và bắt đầu phiên mới?',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Xóa & bắt đầu', style: 'destructive', onPress: () => {
          xoaTatCa();
        }},
      ]
    );
  };

  const luuPhien = async () => {
    const tagCoMat = danhSach.filter(t => t.coMat);
    if (tagCoMat.length === 0) {
      Alert.alert('Chưa có dữ liệu', 'Bóp cò reader để quét thẻ RFID trước.');
      return;
    }

    setDangLuu(true);
    try {
      await luuVaoBo();
      await SyncService.pushSession({
        name: `Phiên ${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN')}`,
        scans: tagCoMat.map(t => ({ epc: t.epc, rssi: t.rssi, time: new Date(t.lanQuetCuoi) }))
      });
      Alert.alert('✅ Đã lưu', `${tagCoMat.length} thẻ đã được gửi lên server.`);
    } catch {
      await luuVaoBo();
      Alert.alert('📱 Lưu offline', 'Phiên được lưu offline. Sẽ đồng bộ khi có mạng.');
    } finally {
      setDangLuu(false);
    }
  };

  const mauRSSI = (rssi: number) => {
    if (rssi > -60) return '#4CAF50';
    if (rssi > -75) return '#FF9800';
    return '#f44336';
  };

  const soCoMat = danhSach.filter(t => t.coMat).length;
  const soVangMat = danhSach.filter(t => !t.coMat).length;

  return (
    <View style={styles.container}>
      {/* Status bar */}
      <View style={styles.statusBar}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText} numberOfLines={1}>
            {trangThai !== 'da_ket_noi' 
              ? '🔴 Chưa kết nối reader' 
              : '🟢 Đang lắng nghe...'}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.nutMiniSync} 
          onPress={async () => {
            try {
              Alert.alert('', 'Đang đồng bộ dữ liệu thẻ...');
              const tenMap = await SyncService.pullTags();
              useInventoryStore.getState().capNhatTenTuServer(tenMap);
              Alert.alert('Thành công', `Đã đồng bộ ${Object.keys(tenMap).length} định danh thẻ.`);
            } catch (e: any) {
              Alert.alert('Lỗi đồng bộ', e.message || 'Không thể lấy dữ liệu thẻ từ server');
            }
          }}
        >
          <Text style={{ fontSize: 18 }}>🔄</Text>
        </TouchableOpacity>
      </View>

      {/* Thống kê */}
      <View style={styles.thongKe}>
        <View style={styles.soThongKe}>
          <Text style={styles.soLon}>{danhSach.length}</Text>
          <Text style={styles.nhan}>Tổng thẻ</Text>
        </View>
        <View style={styles.soThongKe}>
          <Text style={[styles.soLon, { color: '#4CAF50' }]}>{soCoMat}</Text>
          <Text style={styles.nhan}>Có mặt</Text>
        </View>
        <View style={styles.soThongKe}>
          <Text style={[styles.soLon, { color: '#f44336' }]}>{soVangMat}</Text>
          <Text style={styles.nhan}>Vắng mặt</Text>
        </View>
      </View>

      {/* Danh sách tag */}
      <FlatList
        data={danhSach}
        keyExtractor={item => item.epc}
        style={styles.flatList}
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
              {item.coMat ? '✅ Đang quét' : '❌ Mất tín hiệu'} · {item.soLanQuet} lần
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📡</Text>
            <Text style={styles.emptyTitle}>
              {trangThai !== 'da_ket_noi' 
                ? 'Kết nối reader ở tab Bluetooth trước' 
                : 'Bóp cò reader hướng vào thẻ RFID'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {trangThai === 'da_ket_noi' && 'Thẻ quét được sẽ tự hiện ở đây'}
            </Text>
          </View>
        }
      />

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={styles.nutPhienMoi} 
          onPress={phienMoi}
        >
          <Text style={styles.textNutPhienMoi}>🗑️ Phiên mới</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.nutLuu, dangLuu && styles.nutDisabled]} 
          onPress={luuPhien}
          disabled={dangLuu}
        >
          <Text style={styles.textNutLuu}>
            {dangLuu ? '⏳ Đang lưu...' : `💾 Lưu phiên (${soCoMat})`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Modal đổi tên */}
      <Modal visible={hienModal} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.tieuDeModal}>✏️ Đổi tên thẻ</Text>
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
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>💾 Lưu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#0a0a1a' },
  
  // Status bar
  statusBar:   { flexDirection: 'row', alignItems: 'center', gap: 8,
                 paddingHorizontal: 16, paddingVertical: 12,
                 backgroundColor: '#0d1b2a', borderBottomWidth: 1, borderBottomColor: '#1a2a3e' },
  statusDot:   { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CAF50' },
  statusText:  { color: '#aaa', fontSize: 13 },
  nutMiniSync: { padding: 8, backgroundColor: '#1a2a3e', borderRadius: 8, marginLeft: 8 },
  
  // Thống kê
  thongKe:     { flexDirection: 'row', backgroundColor: '#1a1a2e',
                 borderRadius: 12, padding: 16, margin: 12, marginBottom: 0,
                 justifyContent: 'space-around' },
  soThongKe:   { alignItems: 'center' },
  soLon:       { fontSize: 28, fontWeight: 'bold', color: '#4dd0e1' },
  nhan:        { color: '#888', fontSize: 12, marginTop: 2 },
  
  // Tag list
  flatList:    { flex: 1, paddingHorizontal: 12, paddingTop: 12 },
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

  // Empty state
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyIcon:      { fontSize: 48, marginBottom: 16 },
  emptyTitle:     { color: '#888', fontSize: 16, textAlign: 'center' },
  emptySubtitle:  { color: '#555', fontSize: 13, marginTop: 8 },
  
  // Bottom bar
  bottomBar:   { flexDirection: 'row', gap: 12, padding: 12,
                 borderTopWidth: 1, borderTopColor: '#1a2a3e',
                 backgroundColor: '#0d1b2a' },
  nutPhienMoi: { flex: 1, backgroundColor: '#2a2a3e', padding: 14, 
                 borderRadius: 10, alignItems: 'center' },
  textNutPhienMoi: { color: '#aaa', fontSize: 15, fontWeight: 'bold' },
  nutLuu:      { flex: 2, backgroundColor: '#4CAF50', padding: 14,
                 borderRadius: 10, alignItems: 'center' },
  nutDisabled: { backgroundColor: '#333', opacity: 0.7 },
  textNutLuu:  { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  
  // Modal
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
