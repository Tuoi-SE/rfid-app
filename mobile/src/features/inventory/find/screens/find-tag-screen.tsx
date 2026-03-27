import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, TextInput, Dimensions, Animated, Easing
} from 'react-native';
import { useTagCacheStore } from '../../store/tag-cache.store';
import { useScanSessionStore } from '../../store/scan-session.store';
import { useReaderStore } from '../../../reader/ble/store/reader.store';
import { useReaderScan } from '../../../reader/ble/hooks/use-reader-scan';

const { width } = Dimensions.get('window');

export function FindTagScreen() {
  const { serverNames } = useTagCacheStore();
  const { scannedTags } = useScanSessionStore();
  const { status } = useReaderStore();
  const { isScanning, startScan } = useReaderScan();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [targetEpc, setTargetEpc] = useState<string | null>(null);
  const [displayRssi, setDisplayRssi] = useState(-100);

  const pulseAnim = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    if (targetEpc) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      ).start();
      
      if (status === 'connected' && !isScanning) {
        startScan().catch(() => {});
      }
    } else {
      pulseAnim.stopAnimation();
    }
  }, [targetEpc, status, isScanning]);

  useEffect(() => {
    if (!targetEpc) return;

    const interval = setInterval(() => {
      const tagInfo = useScanSessionStore.getState().scannedTags[targetEpc];
      if (tagInfo) {
        const timeSinceLastScan = Date.now() - new Date(tagInfo.lastScanTime).getTime();
        setDisplayRssi(timeSinceLastScan < 1500 ? tagInfo.rssi : -100);
      } else {
        setDisplayRssi(-100);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [targetEpc]);

  const listToSelect = useMemo(() => {
    return Object.entries(serverNames)
      .filter(([epc, name]) => 
        name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        epc.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .slice(0, 50);
  }, [searchQuery, serverNames]);

  const calcPercentage = (rssi: number) => {
    if (rssi < -90) return 0;
    if (rssi > -30) return 100;
    return Math.round(((rssi + 90) / 60) * 100);
  };

  const getRadarColor = (percent: number) => {
    if (percent > 80) return '#4CAF50';
    if (percent > 50) return '#FFEB3B';
    if (percent > 20) return '#FF9800';
    return '#f44336';
  };

  const currentPercent = calcPercentage(displayRssi);
  const currentColor = getRadarColor(currentPercent);
  const scale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1 + (currentPercent / 100)] });
  const opacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0] });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dò Tìm Radar</Text>
        <Text style={styles.headerSub}>
          {status !== 'connected' ? '🔴 Chưa kết nối thiết bị UHF' : '🟢 Sẵn sàng định vị'}
        </Text>
      </View>

      {!targetEpc ? (
        <View style={styles.listContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm theo Tên hoặc mã EPC..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <FlatList
            data={listToSelect}
            keyExtractor={([epc]) => epc}
            contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
            renderItem={({ item: [epc, name] }) => (
              <TouchableOpacity style={styles.itemRow} onPress={() => setTargetEpc(epc)}>
                <Text style={styles.itemName}>{name}</Text>
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
        <View style={styles.radarContainer}>
          <Text style={styles.radarTargetName}>{serverNames[targetEpc] || 'Không xác định'}</Text>
          <Text style={styles.radarTargetEpc}>{targetEpc}</Text>

          <View style={styles.radarVisual}>
            {currentPercent > 0 && (
              <Animated.View style={[styles.radarPulse, { backgroundColor: currentColor, transform: [{ scale }], opacity }]} />
            )}
            <View style={[styles.radarCore, { backgroundColor: currentPercent > 0 ? currentColor : '#333' }]}>
              <Text style={styles.radarText}>{currentPercent}%</Text>
              <Text style={styles.radarSubText}>{displayRssi} dBm</Text>
            </View>
          </View>

          <Text style={styles.radarHint}>
            {currentPercent === 0 ? 'Chưa bắt được tín hiệu...' : 
             currentPercent > 80 ? 'Sản phẩm ở rất gần bạn!' : 
             'Di chuyển súng quét xung quanh để dò hướng sóng.'}
          </Text>

          <TouchableOpacity style={styles.btnCancel} onPress={() => setTargetEpc(null)}>
            <Text style={styles.btnCancelText}>❌ Dò thẻ khác</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a1a' },
  header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, backgroundColor: '#0d1b2a', borderBottomWidth: 1, borderBottomColor: '#1a2a3e', alignItems: 'center' },
  headerTitle: { color: '#4dd0e1', fontSize: 24, fontWeight: 'bold' },
  headerSub: { color: '#888', fontSize: 13, marginTop: 4 },
  listContainer: { flex: 1 },
  searchInput: { backgroundColor: '#1a1a2e', color: '#fff', fontSize: 16, margin: 16, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  itemRow: { backgroundColor: '#1a1a2e', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  itemName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  itemEpc: { color: '#4dd0e1', fontSize: 12, marginTop: 6, fontFamily: 'monospace' },
  radarContainer: { flex: 1, alignItems: 'center', paddingTop: 40, paddingHorizontal: 20 },
  radarTargetName: { color: '#fff', fontSize: 28, fontWeight: 'bold', textAlign: 'center' },
  radarTargetEpc: { color: '#4dd0e1', fontSize: 14, fontFamily: 'monospace', marginTop: 8 },
  radarVisual: { width: width * 0.8, height: width * 0.8, alignItems: 'center', justifyContent: 'center', marginTop: 40, marginBottom: 40 },
  radarCore: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#0a0a1a', zIndex: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
  radarPulse: { position: 'absolute', width: 120, height: 120, borderRadius: 60, zIndex: 1 },
  radarText: { color: '#0a0a1a', fontSize: 32, fontWeight: 'bold' },
  radarSubText: { color: '#0a0a1a', fontSize: 14, fontWeight: '600', opacity: 0.8 },
  radarHint: { color: '#aaa', fontSize: 16, textAlign: 'center', marginBottom: 40, paddingHorizontal: 20 },
  btnCancel: { backgroundColor: '#1a1a2e', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 30, borderWidth: 1, borderColor: '#f44336' },
  btnCancelText: { color: '#f44336', fontSize: 16, fontWeight: 'bold' },
});
