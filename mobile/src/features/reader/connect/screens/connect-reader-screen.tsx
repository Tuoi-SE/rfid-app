import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Linking, Platform, SafeAreaView
} from 'react-native';
import { Bluetooth, Settings as SettingsIcon, RefreshCw, Cpu, Battery, Signal, ChevronRight, CheckCircle2, XCircle, Check } from 'lucide-react-native';
import { useReaderConnection } from '../../ble/hooks/use-reader-connection';
import { useReaderStore } from '../../ble/store/reader.store';

import { inventoryApi } from '../../../inventory/api/sessions';
import { useScanSessionStore } from '../../../inventory/store/scan-session.store';
import { useTagCacheStore } from '../../../inventory/store/tag-cache.store';

export function ConnectReaderScreen({ navigation }: any) {
  const [isScanningForDevices, setIsScanningForDevices] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [connectingDeviceId, setConnectingDeviceId] = useState<string | null>(null);
  
  const { scanDevices, connectToDevice } = useReaderConnection();
  const { foundDevices, connectedDevice } = useReaderStore();
  
  const { addOrUpdateTag } = useScanSessionStore();
  const { updateServerNames } = useTagCacheStore();

  const startScan = async () => {
    setIsScanningForDevices(true);
    try {
      await scanDevices();
      
      setTimeout(() => {
        if (useReaderStore.getState().foundDevices.length === 0) {
          Alert.alert(
            'Không tìm thấy thiết bị',
            'Đảm bảo RFID reader đang bật và ở gần điện thoại.',
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
    setConnectingDeviceId(deviceInfo.id);
    try {
      // Tải tag names từ server song song (không chặn kết nối BLE)
      inventoryApi.pullTags()
        .then(nameMap => updateServerNames(nameMap))
        .catch(() => console.log("Offline mode - using local names if any"));

      await connectToDevice(deviceInfo, (tag) => {
        addOrUpdateTag(tag.epc, tag.rssi);
      });

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        navigation.navigate('QuetThe');
      }, 3000);

    } catch (e: any) {
      Alert.alert(
        'Không kết nối được',
        e.message + '\n\nĐảm bảo:\n• Reader đã được Pair trong Bluetooth Settings\n• Reader đang bật và gần điện thoại',
        [
          { text: 'Thiết lập', onPress: () => Linking.openSettings() },
          { text: 'OK' }
        ]
      );
    } finally {
      setConnectingDeviceId(null);
    }
  };

  const renderDeviceItem = ({ item }: { item: any }) => {
    const isRFID = (item.name || '').toLowerCase().match(/uhf|rfid|h103|reader|hand|^3$/);
    const isThisConnected = connectedDevice?.id === item.id;
    const isThisConnecting = connectingDeviceId === item.id;
    const isAnyConnecting = connectingDeviceId !== null;

    return (
      <TouchableOpacity
        style={[styles.deviceItem, isThisConnected && styles.deviceItemActive]}
        onPress={() => !isThisConnected && connectToSelectedDevice(item)}
        disabled={isAnyConnecting || isThisConnected}
      >
        <View style={styles.deviceIconContainer}>
          <Cpu color={isRFID ? "#4F46E5" : "#64748B"} size={22} />
        </View>
        
        <View style={styles.deviceInfo}>
          <Text style={styles.deviceName} numberOfLines={1}>
            {item.name || 'Unknown Device'}
          </Text>
          <Text style={styles.deviceMac}>{item.id}</Text>
        </View>

        {isThisConnected ? (
          <View style={styles.connectedBadge}>
            <CheckCircle2 color="#10B981" size={18} />
          </View>
        ) : (
          <View style={styles.connectAction}>
            {isThisConnecting ? (
              <ActivityIndicator size="small" color="#4F46E5" />
            ) : (
              <ChevronRight color="#CBD5E1" size={20} />
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Connection Status Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.statusIndicator}>
              <View style={[styles.statusDot, connectedDevice ? styles.statusDotActive : styles.statusDotInactive]} />
              <Text style={[styles.statusText, connectedDevice ? styles.statusTextActive : styles.statusTextInactive]}>
                {connectedDevice ? 'RFID ONLINE' : 'DISCONNECTED'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => Linking.openSettings()}>
              <SettingsIcon color="#64748B" size={20} />
            </TouchableOpacity>
          </View>

          <View style={styles.heroContent}>
            <Text style={styles.heroDeviceName}>
              {connectedDevice?.name || 'Chưa kết nối thiết bị'}
            </Text>
            <Text style={styles.heroSubtitle}>
              {connectedDevice ? `MAC: ${connectedDevice.id}` : 'Vui lòng bật Bluetooth và quét thiết bị'}
            </Text>
          </View>

          <View style={styles.heroActionRow}>
            <TouchableOpacity 
              style={[styles.mainBtn, isScanningForDevices && styles.mainBtnDisabled]}
              onPress={startScan}
              disabled={isScanningForDevices || connectingDeviceId !== null}
            >
              {isScanningForDevices ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <RefreshCw color="#FFFFFF" size={18} />
              )}
              <Text style={styles.mainBtnText}>
                {isScanningForDevices ? ' Đang tìm kiếm...' : ' Tìm thiết bị mới'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.listSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>THIẾT BỊ KHẢ DỤNG</Text>
            <Bluetooth color="#4F46E5" size={16} />
          </View>

          <FlatList
            data={foundDevices.filter((d, i, arr) => arr.findIndex(x => x.id === d.id) === i)}
            keyExtractor={(item) => item.id}
            renderItem={renderDeviceItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                {!isScanningForDevices && (
                  <>
                    <View style={styles.emptyIconCircle}>
                      <Bluetooth color="#94A3B8" size={32} />
                    </View>
                    <Text style={styles.emptyText}>Chưa có thiết bị nào</Text>
                    <Text style={styles.emptySubtext}>Nhấn nút "Tìm thiết bị" ở trên để bắt đầu</Text>
                  </>
                )}
              </View>
            }
          />
        </View>

        {/* Footer info bars */}
        <View style={styles.footerInfo}>
          <View style={styles.footerItem}>
            <Battery color="#94A3B8" size={14} />
            <Text style={styles.footerText}>-- %</Text>
          </View>
          <View style={styles.footerDivider} />
          <View style={styles.footerItem}>
            <Signal color="#94A3B8" size={14} />
            <Text style={styles.footerText}>BLE 5.0</Text>
          </View>
          <View style={styles.footerDivider} />
          <View style={styles.footerItem}>
            <Text style={[styles.footerText, { color: '#4F46E5', fontWeight: 'bold' }]}>v1.2.4</Text>
          </View>
        </View>
      </View>

      {/* Success Modal Overlay */}
      {showSuccess && (
        <View style={styles.overlay}>
          <View style={styles.overlayBackdrop} />
          <View style={styles.successCard}>
            {/* Top Badge Decoration */}
            <View style={styles.badgeDecoration}>
              <View style={styles.badgeInner}>
                <Check color="#FFFFFF" size={24} strokeWidth={3} />
              </View>
            </View>

            <Text style={styles.successTitle}>Success</Text>
            <Text style={styles.successSubtitle}>
              Hệ thống đang xử lý kết nối.{"\n"}Vui lòng đợi trong giây lát.
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>

  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F9FB' },
  container: { flex: 1, padding: 20 },
  
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 32,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusDotActive: { backgroundColor: '#10B981' },
  statusDotInactive: { backgroundColor: '#EF4444' },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusTextActive: { color: '#059669' },
  statusTextInactive: { color: '#DC2626' },

  heroContent: {
    marginBottom: 24,
  },
  heroDeviceName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  heroActionRow: {
    flexDirection: 'row',
  },
  mainBtn: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    flex: 1,
  },
  mainBtnDisabled: {
    backgroundColor: '#818CF8',
  },
  mainBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },

  listSection: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
  },

  listContent: {
    paddingBottom: 20,
  },
  deviceItem: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  deviceItemActive: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  deviceIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 2,
  },
  deviceMac: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  connectedBadge: {
    marginLeft: 12,
  },
  connectAction: {
    marginLeft: 12,
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },

  footerInfo: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  footerDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 20,
  },

  // Success Modal Styles
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  overlayBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  successCard: {
    width: 320,
    paddingVertical: 40,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    // Soft frosted-like card without native BlurView dependency
    shadowColor: '#5CD88F',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 0, 
    elevation: 10,
  },
  successTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: -1,
  },
  successSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    lineHeight: 24,
  },
  badgeDecoration: {
    position: 'absolute',
    top: -46,
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: 'rgba(92, 216, 143, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(92, 216, 143, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  badgeInner: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: '#5CD88F',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  }
});
