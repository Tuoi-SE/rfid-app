import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, TextInput, Dimensions, Animated, Easing, Platform, ScrollView
} from 'react-native';
import { Search, MapPin, Ruler, RefreshCcw, Bell, Info, Activity } from 'lucide-react-native';
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
  const [historyRssi, setHistoryRssi] = useState<number[]>(Array(15).fill(-100));

  const pulseAnim = useRef(new Animated.Value(0)).current;

  // Start BLE scanning automatically when finding a tag
  useEffect(() => {
    if (targetEpc) {
      if (status === 'connected' && !isScanning) {
        startScan().catch(() => {});
      }
    }
  }, [targetEpc, status, isScanning]);

  // Update target signal continuously
  useEffect(() => {
    if (!targetEpc) {
      setDisplayRssi(-100);
      setHistoryRssi(Array(15).fill(-100));
      return;
    }

    const interval = setInterval(() => {
      const tagInfo = useScanSessionStore.getState().scannedTags[targetEpc];
      let newRssi = -100;
      if (tagInfo) {
        const timeSinceLastScan = Date.now() - new Date(tagInfo.lastScanTime).getTime();
        newRssi = timeSinceLastScan < 1500 ? tagInfo.rssi : -100;
      }
      setDisplayRssi(newRssi);
      setHistoryRssi(prev => {
        const next = [...prev, newRssi];
        if (next.length > 15) next.shift();
        return next;
      });
    }, 400);

    return () => clearInterval(interval);
  }, [targetEpc]);

  // Pulse animation for radar
  useEffect(() => {
    pulseAnim.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim]);

  const listToSelect = useMemo(() => {
    return Object.entries(serverNames)
      .filter(([epc, name]) => 
        name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        epc.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .slice(0, 50);
  }, [searchQuery, serverNames]);

  const getSignalStatus = (rssi: number) => {
    if (rssi === -100) return { label: 'Mất tín hiệu', color: '#94A3B8', bg: '#F1F5F9', border: '#E2E8F0', percent: 2 };
    if (rssi > -45) return { label: 'Rất gần (~0.5m)', color: '#059669', bg: '#ECFDF5', border: '#D1FAE5', percent: 100 };
    if (rssi > -60) return { label: 'Gần (1m - 2m)', color: '#D97706', bg: '#FFFBEB', border: '#FEF3C7', percent: 70 };
    if (rssi > -75) return { label: 'Xa (> 3m)', color: '#EA580C', bg: '#FFF7ED', border: '#FFEDD5', percent: 40 };
    return { label: 'Rất xa', color: '#E11D48', bg: '#FFF1F2', border: '#FFE4E6', percent: 20 };
  };

  const signalStatus = getSignalStatus(displayRssi);
  const opacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] });
  const scale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.5] });

  return (
    <View style={styles.container}>
      <View style={styles.searchSection}>
        <View style={styles.inputContainer}>
          <Search color="#777587" size={20} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm EPC hoặc Tên sản phẩm..."
            placeholderTextColor="#777587"
            value={searchQuery}
            onChangeText={(t) => {
              setSearchQuery(t);
              if (t) setTargetEpc(null);
            }}
          />
        </View>
      </View>

      {!targetEpc && searchQuery ? (
        <FlatList
          data={listToSelect}
          keyExtractor={([epc]) => epc}
          contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
          renderItem={({ item: [epc, name] }) => (
            <TouchableOpacity 
              style={styles.searchResultItem} 
              onPress={() => { setTargetEpc(epc); setSearchQuery(''); }}
            >
              <View style={styles.resultMain}>
                <Text style={styles.searchResultName} numberOfLines={1}>{name}</Text>
                <Text style={styles.searchResultEpc}>EPC: {epc}</Text>
              </View>
              <Activity size={16} color="#4F46E5" />
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>Không tìm thấy thẻ nào khớp.</Text>}
        />
      ) : targetEpc ? (
        <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          {/* Signal Indicator Card */}
          <View style={[styles.card, styles.signalCard]}>
            <View style={styles.signalHeader}>
              <Text style={styles.sectionTitle}>TÍN HIỆU RFID</Text>
            </View>
            <View style={styles.dbmRow}>
              <Text style={styles.dbmValue}>{displayRssi > -99 ? displayRssi : '--'}</Text>
              <Text style={styles.dbmUnit}>dBm</Text>
            </View>
            
            <View style={styles.radarStatusContainer}>
               {displayRssi > -99 && (
                <Animated.View style={[styles.radarRipple, { backgroundColor: signalStatus.color, transform: [{ scale }], opacity }]} />
              )}
              <View style={[styles.radarPill, { backgroundColor: signalStatus.bg, borderColor: signalStatus.border }]}>
                <View style={[styles.radarDot, { backgroundColor: signalStatus.color }]} />
                <Text style={[styles.radarPillText, { color: signalStatus.color }]}>{signalStatus.label}</Text>
              </View>
            </View>
          </View>

          {/* Product Information Card */}
          <View style={[styles.card, styles.infoCard]}>
            <View style={styles.infoHeader}>
              <View style={styles.nameSection}>
                <Text style={styles.productName}>{serverNames[targetEpc] || 'Sản phẩm chưa gán tên'}</Text>
                <Text style={styles.epcText}>EPC: {targetEpc}</Text>
              </View>
              <View style={styles.inStockBadge}>
                <Text style={styles.inStockText}>TARGET</Text>
              </View>
            </View>

            <View style={styles.gridRow}>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>KÍCH CỠ</Text>
                <Text style={styles.gridValue}>Large (L)</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>VỊ TRÍ</Text>
                <Text style={styles.gridValue}>Khu A-12</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.btnReselect} onPress={() => setTargetEpc(null)}>
              <RefreshCcw size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.btnReselectText}>Hủy Định Vị</Text>
            </TouchableOpacity>
          </View>

          {/* Real-time Signal Chart */}
          <View style={[styles.card, styles.chartCard]}>
            <View style={styles.chartHeader}>
              <View style={styles.chartHeaderTitleRow}>
                <Activity size={16} color="#4F46E5" style={{ marginRight: 8 }} />
                <Text style={styles.chartTitle}>Biểu đồ tín hiệu thời gian thực</Text>
              </View>
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            </View>
            <View style={styles.chartContent}>
              <View style={styles.barsContainer}>
                {historyRssi.map((rssi, i) => {
                  const barStatus = getSignalStatus(rssi);
                  // Make bars more visible: min height of 10%
                  const h = rssi === -100 ? 10 : Math.max(10, barStatus.percent);
                  const isLast = i === historyRssi.length - 1;
                  
                  return (
                    <View key={i} style={styles.barWrapper}>
                      {/* Bar Background/Track */}
                      <View style={styles.barTrack} />
                      {/* Active Bar */}
                      <View style={[styles.bar, { 
                        height: `${h}%`, 
                        backgroundColor: isLast ? '#4F46E5' : barStatus.color,
                        opacity: isLast ? 1 : 0.4
                      }]} />
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.placeholderContainer}>
          <View style={styles.placeholderIconBox}>
             <MapPin size={48} color="#CBD5E1" />
          </View>
          <Text style={styles.placeholderText}>Nhập mã hoặc tên sản phẩm phía trên để bắt đầu định vị chính xác.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9FB' },
  searchSection: { padding: 24, paddingBottom: 12 },
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFFFFF', 
    borderRadius: 12, 
    paddingHorizontal: 16,
    height: 56,
    shadowColor: '#4F46E5', 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 2, 
    elevation: 2 
  },
  searchIcon: { marginRight: 12 },
  searchInput: { 
    flex: 1, 
    fontSize: 16, 
    color: '#191C1E', 
    fontWeight: '400',
    fontFamily: Platform.OS === 'ios' ? 'Geist' : 'sans-serif'
  },
  
  searchResultItem: { 
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 12, 
    borderLeftWidth: 4, 
    borderLeftColor: '#4F46E5', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 2, 
    elevation: 2 
  },
  resultMain: { flex: 1 },
  searchResultName: { fontSize: 16, fontWeight: '700', color: '#191C1E' },
  searchResultEpc: { fontSize: 12, color: '#777587', marginTop: 4, fontFamily: 'monospace' },
  emptyText: { textAlign: 'center', color: '#64748B', marginTop: 40, fontSize: 14 },

  placeholderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 48 },
  placeholderIconBox: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  placeholderText: { color: '#94A3B8', textAlign: 'center', fontSize: 15, lineHeight: 22 },

  contentContainer: { padding: 24, paddingBottom: 100 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  
  signalCard: { alignItems: 'center', paddingVertical: 32 },
  signalHeader: { alignSelf: 'stretch', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#777587', letterSpacing: 1.2, textTransform: 'uppercase' },
  dbmRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginBottom: 24 },
  dbmValue: { fontSize: 60, fontWeight: '800', color: '#191C1E' },
  dbmUnit: { fontSize: 24, fontWeight: '700', color: '#777587' },
  
  radarStatusContainer: { justifyContent: 'center', alignItems: 'center', position: 'relative' },
  radarRipple: { position: 'absolute', width: 60, height: 60, borderRadius: 30 },
  radarPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 100, borderWidth: 1 },
  radarDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  radarPillText: { fontSize: 14, fontWeight: '700' },

  infoCard: { borderRadius: 16, borderLeftWidth: 4, borderLeftColor: '#4F46E5' },
  infoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  nameSection: { flex: 1 },
  productName: { fontSize: 18, fontWeight: '700', color: '#191C1E', marginBottom: 6 },
  epcText: { fontSize: 12, color: '#777587', fontFamily: 'monospace' },
  inStockBadge: { backgroundColor: '#EEF2FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  inStockText: { fontSize: 10, fontWeight: '700', color: '#4F46E5' },
  
  gridRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  gridItem: { flex: 1, backgroundColor: '#F2F4F6', padding: 12, borderRadius: 8 },
  gridLabel: { fontSize: 10, fontWeight: '700', color: '#777587', marginBottom: 4, letterSpacing: 0.5 },
  gridValue: { fontSize: 16, fontWeight: '600', color: '#191C1E' },

  btnReselect: { backgroundColor: '#4F46E5', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, borderRadius: 12 },
  btnReselectText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

  chartCard: { borderRadius: 16 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  chartHeaderTitleRow: { flexDirection: 'row', alignItems: 'center' },
  chartTitle: { fontSize: 12, fontWeight: '700', color: '#191C1E' },
  liveBadge: { backgroundColor: '#F0FDF4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, flexDirection: 'row', alignItems: 'center' },
  liveDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#15803D', marginRight: 4 },
  liveText: { fontSize: 10, fontWeight: '800', color: '#15803D' },
  chartContent: { height: 120, justifyContent: 'flex-end', paddingTop: 10 },
  barsContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: '100%', gap: 4 },
  barWrapper: { flex: 1, height: '100%', justifyContent: 'flex-end', alignItems: 'center', position: 'relative' },
  barTrack: { position: 'absolute', width: '100%', height: '100%', backgroundColor: '#F1F5F9', borderRadius: 4, opacity: 0.5 },
  bar: { width: '100%', borderRadius: 4 },
});
