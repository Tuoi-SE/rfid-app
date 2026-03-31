import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Platform, SafeAreaView, ActivityIndicator } from 'react-native';
import { 
  Truck, 
  RefreshCw, 
  MapPin,
  ArrowRight,
  CheckCircle2, 
  Clock, 
  Play, 
  Square, 
  Save, 
  ChevronLeft,
  ScanLine
} from 'lucide-react-native';
import { useTransfers } from '../hooks/use-transfers';
import { useTransferPicking } from '../hooks/use-transfer-picking';
import { useTagCacheStore } from '../../inventory/store/tag-cache.store';
import { inventoryApi } from '../../inventory/api/sessions';
import { TransferData } from '../types';

export function TransfersScreen() {
  const { transfers, loading, refetch } = useTransfers();
  const [selectedTransfer, setSelectedTransfer] = useState<TransferData | null>(null);
  const { updateServerNames, serverNames } = useTagCacheStore();

  useEffect(() => {
    // Tự động đồng bộ tên thẻ Ngầm để bộ lọc thẻ đúng sản phẩm hoạt động
    inventoryApi.pullTags().then(updateServerNames).catch(() => {});
  }, []);

  const { isSaving, isScanning, toggleScan, submitReceipt, getProgressInfo } = useTransferPicking(
    selectedTransfer, 
    () => { setSelectedTransfer(null); refetch(); }
  );

  const { totalItems: totalRequired, scannedItems: totalScanned, sessionCounts } = getProgressInfo();

  if (!selectedTransfer) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Điều Chuyển</Text>
              <Text style={styles.headerSubtitle}>Quản lý nhập hàng luân chuyển</Text>
            </View>
            <TouchableOpacity onPress={refetch} style={styles.syncBtn}>
              {loading ? <ActivityIndicator size="small" color="#4F46E5" /> : <RefreshCw color="#4F46E5" size={20} />}
            </TouchableOpacity>
          </View>

          <View style={styles.summarySection}>
            <View style={styles.statsCard}>
              <View style={styles.statsIconBox}>
                <Truck color="#4F46E5" size={24} />
              </View>
              <View style={styles.statsInfo}>
                <Text style={styles.statsLabel}>Đang chờ nhận</Text>
                <Text style={styles.statsValue}>{transfers.length} phiếu điều chuyển</Text>
              </View>
            </View>
          </View>

          <FlatList
            data={transfers}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const totalItems = item.items.length;
              return (
                <TouchableOpacity style={styles.orderCard} onPress={() => setSelectedTransfer(item)}>
                  <View style={styles.orderCardHeader}>
                    <View style={styles.typeBadge}>
                      <Truck color="#04147B" size={14} />
                      <Text style={styles.typeText}>NHẬN HÀNG</Text>
                    </View>
                    <Text style={styles.orderDate}>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</Text>
                  </View>

                  <Text style={styles.orderCode}>{item.code}</Text>
                  
                  <View style={styles.routeBox}>
                    <MapPin color="#64748B" size={14} />
                    <Text style={styles.routeText} numberOfLines={1}>{item.source?.name || 'Admin/Kho'}</Text>
                    <ArrowRight color="#CBD5E1" size={12} style={{ marginHorizontal: 4 }} />
                    <MapPin color="#04147B" size={14} />
                    <Text style={[styles.routeText, { color: '#04147B', fontWeight: 'bold' }]} numberOfLines={1}>{item.destination?.name || 'Kho của bạn'}</Text>
                  </View>

                  <View style={styles.orderCardFooter}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.itemCountBox}>
                        <Text style={styles.itemCountText}>{totalItems} thẻ yêu cầu</Text>
                      </View>
                      <View style={[styles.statusBox, { marginTop: 6 }]}>
                        <Clock color="#F59E0B" size={14} />
                        <Text style={[styles.statusText, { color: '#F59E0B' }]}>Chờ tiếp nhận</Text>
                      </View>
                    </View>
                    
                    <View style={styles.scanHintBtn}>
                      <ScanLine color="#FFFFFF" size={16} />
                      <Text style={styles.scanHintText}>NHẬN HÀNG</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>Chưa có phiếu luân chuyển nào cần nhận</Text>
              </View>
            }
          />
        </View>
      </SafeAreaView>
    );
  }

  // Tái tạo lại items view đếm theo sản phẩm (tương tự transaction picking)
  // Vì item trong transfer là từng thẻ, ta group by productId để view giống Order
  const groupedProducts: Record<string, { id: string, name: string, sku: string, expectedCount: number }> = {};
  selectedTransfer.items.forEach(item => {
    const epc = item.tag?.epc;
    const productId = item.tag?.productId || 'unknown';
    const productName = epc ? (serverNames[epc] || 'Thẻ rỗng/Không xác định') : 'Thẻ rỗng';

    if (!groupedProducts[productId]) {
      groupedProducts[productId] = { id: productId, name: productName, sku: 'Từ bộ lập lịch', expectedCount: 0 };
    }
    groupedProducts[productId].expectedCount++;
  });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.activeHeader}>
          <TouchableOpacity onPress={() => setSelectedTransfer(null)} style={styles.backBtn}>
            <ChevronLeft color="#1E293B" size={24} />
          </TouchableOpacity>
          <View style={styles.activeHeaderTitleBox}>
            <Text style={styles.activeHeaderTitle}>{selectedTransfer.code}</Text>
            <Text style={styles.activeHeaderSubtitle}>Quét thẻ để xác nhận nhận hàng</Text>
          </View>
        </View>

        <View style={styles.pickingStats}>
          <View style={styles.mainProgressBox}>
            <Text style={styles.mainProgressValue}>{totalScanned}</Text>
            <Text style={styles.mainProgressLabel}>THẺ ĐÃ QUÉT</Text>
          </View>
          <View style={styles.statsDivider} />
          <View style={styles.mainProgressBox}>
            <Text style={[styles.mainProgressValue, { color: '#64748B' }]}>{totalRequired}</Text>
            <Text style={styles.mainProgressLabel}>THẺ YÊU CẦU</Text>
          </View>
        </View>

        <FlatList
          data={Object.values(groupedProducts)}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.checklistContainer}
          renderItem={({ item }) => {
            const currentScanned = sessionCounts[item.name] || 0;
            const expectedItemsInTransfer = item.expectedCount;
            const fullscanned = currentScanned >= expectedItemsInTransfer;

            return (
              <View style={[styles.checklistItem, fullscanned && styles.checklistItemDone]}>
                <View style={styles.itemMainInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemSku}>{item.sku}</Text>
                </View>
                
                <View style={styles.itemQtyBox}>
                  <Text style={styles.qtyLabel}>TIẾN ĐỘ</Text>
                  <Text style={styles.qtyValue}>
                    {currentScanned} / {expectedItemsInTransfer}
                  </Text>
                  {currentScanned > 0 && (
                     <View style={[styles.newBadge, fullscanned && { backgroundColor: '#10B981' }]}>
                       <Text style={styles.newBadgeText}>{fullscanned ? 'ĐỦ' : 'THIẾU'}</Text>
                     </View>
                   )}
                </View>

                {fullscanned && (
                  <View style={styles.itemDoneIcon}>
                    <CheckCircle2 color="#10B981" size={20} />
                  </View>
                )}
              </View>
            );
          }}
        />

        <View style={styles.actionDock}>
          <TouchableOpacity 
            style={[styles.dockBtn, styles.dockBtnScan, isScanning && styles.dockBtnScanActive]} 
            onPress={toggleScan}
          >
            {isScanning ? <Square color="#DC2626" size={20} /> : <Play color="#04147B" size={20} />}
            <Text style={[styles.dockBtnText, isScanning ? { color: '#DC2626' } : { color: '#04147B' }]}>
              {isScanning ? 'DỪNG QUÉT' : 'BẮT ĐẦU'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.dockBtn, styles.dockBtnSave, (isSaving || totalScanned === 0) && styles.dockBtnDisabled]} 
            onPress={submitReceipt} 
            disabled={isSaving || totalScanned === 0}
          >
            {isSaving ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Save color="#FFFFFF" size={20} />}
            <Text style={styles.dockBtnTextWhite}>
              {isSaving ? 'ĐANG LƯU' : 'XÁC NHẬN'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F9FB' },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1E293B' },
  headerSubtitle: { fontSize: 13, color: '#64748B', marginTop: 2 },
  syncBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summarySection: { padding: 24, paddingBottom: 0 },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  statsIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statsInfo: { flex: 1 },
  statsLabel: { fontSize: 12, color: '#94A3B8', fontWeight: 'bold' },
  statsValue: { fontSize: 18, color: '#1E293B', fontWeight: 'bold' },
  listContainer: { padding: 24 },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
    backgroundColor: '#EEF2FF'
  },
  typeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, color: '#04147B' },
  orderDate: { fontSize: 12, color: '#94A3B8' },
  orderCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  routeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  routeText: {
    fontSize: 13,
    color: '#64748B',
    flex: 1,
    marginLeft: 6
  },
  orderCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  itemCountBox: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start'
  },
  itemCountText: { fontSize: 11, color: '#64748B', fontWeight: '500' },
  statusBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusText: { fontSize: 12, fontWeight: '600' },
  scanHintBtn: {
    backgroundColor: '#04147B',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  scanHintText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  emptyBox: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#94A3B8', fontSize: 14, textAlign: 'center' },
  activeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeHeaderTitleBox: { flex: 1 },
  activeHeaderTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  activeHeaderSubtitle: { fontSize: 12, color: '#64748B' },
  pickingStats: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  mainProgressBox: { flex: 1, alignItems: 'center' },
  mainProgressValue: { fontSize: 32, fontWeight: 'bold', color: '#04147B' },
  mainProgressLabel: { fontSize: 10, fontWeight: '800', color: '#94A3B8', marginTop: 4 },
  statsDivider: { width: 1, height: 40, backgroundColor: '#F1F5F9' },
  checklistContainer: { padding: 16 },
  checklistItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  checklistItemDone: { backgroundColor: '#F0FDF4', borderColor: '#DCFCE7' },
  itemMainInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: 'bold', color: '#1E293B', marginBottom: 2 },
  itemSku: { fontSize: 11, color: '#64748B', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  itemQtyBox: { alignItems: 'flex-end', minWidth: 80 },
  qtyLabel: { fontSize: 8, fontWeight: '800', color: '#94A3B8', marginBottom: 2 },
  qtyValue: { fontSize: 14, fontWeight: 'bold', color: '#1E293B' },
  newBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  newBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' },
  itemDoneIcon: { marginLeft: 16 },
  actionDock: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 12,
  },
  dockBtn: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dockBtnScan: { backgroundColor: '#F1F5F9' },
  dockBtnScanActive: { backgroundColor: '#FEF2F2' },
  dockBtnSave: { backgroundColor: '#04147B' },
  dockBtnDisabled: { backgroundColor: '#CBD5E1' },
  dockBtnText: { fontSize: 16, fontWeight: 'bold' },
  dockBtnTextWhite: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' },
});
