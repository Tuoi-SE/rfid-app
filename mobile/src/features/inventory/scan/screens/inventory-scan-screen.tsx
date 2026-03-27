import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, TextInput, Modal, Alert
} from 'react-native';

import { useReaderScan } from '../../../reader/ble/hooks/use-reader-scan';
import { useReaderStore } from '../../../reader/ble/store/reader.store';

import { useScanSessionStore } from '../../store/scan-session.store';
import { useTagCacheStore } from '../../store/tag-cache.store';
import { inventoryApi } from '../../api/sessions';

export function InventoryScanScreen() {
  const { isScanning, startScan, stopScan } = useReaderScan();
  const { status } = useReaderStore();
  
  const { 
    scannedTags, startNewSession, saveToStorage, clearAll 
  } = useScanSessionStore();
  
  const { getName, renameTag, updateServerNames } = useTagCacheStore();

  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Auto-start scanning when entering screen
  useEffect(() => {
    if (status === 'connected' && !isScanning) {
      startScan().catch(e => console.log('[UI] Auto-start error:', e.message));
    }
    return () => {
      stopScan().catch(() => {});
    };
  }, [status]);

  // Sync real-time to backend
  useEffect(() => {
    if (isScanning) {
      const mappedTags = Object.values(scannedTags)
        .filter(t => t.isPresent)
        .map(t => ({ epc: t.epc, rssi: t.rssi }));
      
      if (mappedTags.length > 0) {
        inventoryApi.pushLiveScan(mappedTags).catch(() => {});
      }
    }
  }, [scannedTags, isScanning]);

  const displayList = Object.values(scannedTags)
    .map(t => ({ ...t, displayName: getName(t.epc) }))
    .sort((a, b) => new Date(b.lastScanTime).getTime() - new Date(a.lastScanTime).getTime());

  const handleNewSession = () => {
    Alert.alert(
      'Phiên mới', 
      'Xóa tất cả tag đã quét và bắt đầu phiên mới?',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Xóa & bắt đầu', style: 'destructive', onPress: clearAll },
      ]
    );
  };

  const handleSaveSession = async () => {
    const presentTags = displayList.filter(t => t.isPresent);
    if (presentTags.length === 0) {
      Alert.alert('Chưa có dữ liệu', 'Bóp cò reader để quét thẻ RFID trước.');
      return;
    }

    setIsSaving(true);
    try {
      await saveToStorage();
      await inventoryApi.pushSession({
        name: `Phiên ${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN')}`,
        scans: presentTags.map(t => ({ epc: t.epc, rssi: t.rssi, time: new Date(t.lastScanTime) }))
      });
      Alert.alert('✅ Đã lưu', `${presentTags.length} thẻ đã được gửi lên server.`);
    } catch {
      await saveToStorage();
      Alert.alert('📱 Lưu offline', 'Phiên được lưu offline. Sẽ đồng bộ khi có mạng.');
    } finally {
      setIsSaving(false);
    }
  };

  const syncTags = async () => {
    try {
      Alert.alert('', 'Đang đồng bộ dữ liệu thẻ...');
      const serverNames = await inventoryApi.pullTags();
      updateServerNames(serverNames);
      Alert.alert('Thành công', `Đã đồng bộ ${Object.keys(serverNames).length} định danh thẻ.`);
    } catch (e: any) {
      Alert.alert('Lỗi đồng bộ', e.message || 'Không thể lấy dữ liệu thẻ từ server');
    }
  };

  const getRssiColor = (rssi: number) => {
    if (rssi > -60) return '#4CAF50';
    if (rssi > -75) return '#FF9800';
    return '#f44336';
  };

  const presentCount = displayList.filter(t => t.isPresent).length;
  const missingCount = displayList.filter(t => !t.isPresent).length;

  return (
    <View style={styles.container}>
      {/* Status bar */}
      <View style={styles.statusBar}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
          <View style={[styles.statusDot, { backgroundColor: status === 'connected' ? '#4CAF50' : '#f44336' }]} />
          <Text style={styles.statusText} numberOfLines={1}>
            {status !== 'connected' ? '🔴 Chưa kết nối reader' : '🟢 Đang lắng nghe...'}
          </Text>
        </View>
        <TouchableOpacity style={styles.btnSync} onPress={syncTags}>
          <Text style={{ fontSize: 18 }}>🔄</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsPanel}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{displayList.length}</Text>
          <Text style={styles.statLabel}>Tổng thẻ</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: '#4CAF50' }]}>{presentCount}</Text>
          <Text style={styles.statLabel}>Có mặt</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: '#f44336' }]}>{missingCount}</Text>
          <Text style={styles.statLabel}>Vắng mặt</Text>
        </View>
      </View>

      {/* Tag List */}
      <FlatList
        data={displayList}
        keyExtractor={item => item.epc}
        style={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onLongPress={() => {
              setSelectedTag(item.epc);
              setNewName(item.displayName);
              setIsModalVisible(true);
            }}
          >
            <View style={styles.cardHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[styles.indicatorDot, { backgroundColor: item.isPresent ? '#4CAF50' : '#f44336' }]} />
                <Text style={styles.tagName}>{item.displayName}</Text>
              </View>
              <Text style={{ color: getRssiColor(item.rssi), fontSize: 13, fontWeight: 'bold' }}>
                {item.rssi} dBm
              </Text>
            </View>
            <Text style={styles.cardEpc}>{item.epc}</Text>
            <Text style={styles.cardInfo}>
              {item.isPresent ? '✅ Đang quét' : '❌ Mất tín hiệu'} · {item.scanCount} lần
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📡</Text>
            <Text style={styles.emptyTitle}>
              {status !== 'connected' ? 'Kết nối reader ở tab Bluetooth trước' : 'Bóp cò reader hướng vào thẻ RFID'}
            </Text>
            <Text style={styles.emptySub}>
              {status === 'connected' && 'Thẻ quét được sẽ tự hiện ở đây'}
            </Text>
          </View>
        }
      />

      {/* Bottom Actions */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.btnNewSession} onPress={handleNewSession}>
          <Text style={styles.btnNewSessionText}>🗑️ Phiên mới</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.btnSave, isSaving && styles.btnSaveDisabled]} 
          onPress={handleSaveSession} disabled={isSaving}
        >
          <Text style={styles.btnSaveText}>
            {isSaving ? '⏳ Đang lưu...' : `💾 Lưu phiên (${presentCount})`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Rename Modal */}
      <Modal visible={isModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>✏️ Đổi tên thẻ</Text>
            <Text style={styles.modalEpc}>{selectedTag}</Text>
            <TextInput
              style={styles.input}
              value={newName}
              onChangeText={setNewName}
              placeholder="Nhập tên mới..."
              placeholderTextColor="#666"
              autoFocus
            />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                style={[styles.btnAction, { backgroundColor: '#333' }]}
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={styles.btnActionText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnAction, { backgroundColor: '#4dd0e1' }]}
                onPress={() => {
                  if (selectedTag && newName.trim()) {
                    renameTag(selectedTag, newName.trim());
                    setIsModalVisible(false);
                  }
                }}
              >
                <Text style={styles.btnActionText}>💾 Lưu</Text>
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
  statusBar:   { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#0d1b2a', borderBottomWidth: 1, borderBottomColor: '#1a2a3e' },
  statusDot:   { width: 8, height: 8, borderRadius: 4 },
  statusText:  { color: '#aaa', fontSize: 13 },
  btnSync:     { padding: 8, backgroundColor: '#1a2a3e', borderRadius: 8, marginLeft: 8 },
  
  statsPanel:  { flexDirection: 'row', backgroundColor: '#1a1a2e', borderRadius: 12, padding: 16, margin: 12, marginBottom: 0, justifyContent: 'space-around' },
  statBox:     { alignItems: 'center' },
  statValue:   { fontSize: 28, fontWeight: 'bold', color: '#4dd0e1' },
  statLabel:   { color: '#888', fontSize: 12, marginTop: 2 },
  
  list:        { flex: 1, paddingHorizontal: 12, paddingTop: 12 },
  card:        { backgroundColor: '#1a1a2e', borderRadius: 10, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: '#2a2a4e' },
  cardHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  indicatorDot:{ width: 8, height: 8, borderRadius: 4 },
  tagName:     { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  cardEpc:     { color: '#4dd0e1', fontSize: 11, marginTop: 8, fontFamily: 'monospace' },
  cardInfo:    { color: '#666', fontSize: 12, marginTop: 6 },

  emptyState:  { alignItems: 'center', paddingTop: 60 },
  emptyIcon:   { fontSize: 48, marginBottom: 16 },
  emptyTitle:  { color: '#888', fontSize: 16, textAlign: 'center' },
  emptySub:    { color: '#555', fontSize: 13, marginTop: 8 },
  
  bottomBar:   { flexDirection: 'row', gap: 12, padding: 12, borderTopWidth: 1, borderTopColor: '#1a2a3e', backgroundColor: '#0d1b2a' },
  btnNewSession:{ flex: 1, backgroundColor: '#2a2a3e', padding: 14, borderRadius: 10, alignItems: 'center' },
  btnNewSessionText: { color: '#aaa', fontSize: 15, fontWeight: 'bold' },
  btnSave:     { flex: 2, backgroundColor: '#4CAF50', padding: 14, borderRadius: 10, alignItems: 'center' },
  btnSaveDisabled:{ backgroundColor: '#333', opacity: 0.7 },
  btnSaveText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  
  modalOverlay:{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent:{ backgroundColor: '#1a1a2e', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  modalTitle:  { color: '#4dd0e1', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  modalEpc:    { color: '#555', fontSize: 11, marginBottom: 16, fontFamily: 'monospace' },
  input:       { backgroundColor: '#0a0a1a', color: '#fff', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 20, borderWidth: 1, borderColor: '#4dd0e1' },
  btnAction:   { flex: 1, padding: 14, borderRadius: 8, alignItems: 'center' },
  btnActionText:{ color: '#fff', fontWeight: 'bold' },
});
