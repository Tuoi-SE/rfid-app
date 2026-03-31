import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Platform, SafeAreaView, ActivityIndicator } from 'react-native';
import { 
  ClipboardList, 
  RefreshCw, 
  ChevronRight, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CheckCircle2, 
  Clock, 
  Play, 
  Square, 
  Save, 
  ChevronLeft,
  ScanLine
} from 'lucide-react-native';
import { useOrders } from '../hooks/use-orders';
import { useTransactionPicking } from '../hooks/use-transaction-picking';
import { useTagCacheStore } from '../../inventory/store/tag-cache.store';
import { inventoryApi } from '../../inventory/api/sessions';
import { Order } from '../types';

export function TransactionsScreen() {
  const { orders, loading, refetch } = useOrders();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { updateServerNames } = useTagCacheStore();

  useEffect(() => {
    // Tự động đồng bộ tên thẻ Ngầm để bộ lọc thẻ đúng sản phẩm hoạt động
    inventoryApi.pullTags().then(updateServerNames).catch(() => {});
  }, []);

  const { isSaving, isScanning, toggleScan, submitSession, getValidTags } = useTransactionPicking(
    selectedOrder, 
    () => { setSelectedOrder(null); refetch(); }
  );

  const validTags = getValidTags();
  const totalScanned = validTags.length;

  if (!selectedOrder) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Phiếu Xuất Nhập</Text>
              <Text style={styles.headerSubtitle}>Quản lý lệnh kho thời gian thực</Text>
            </View>
            <TouchableOpacity onPress={refetch} style={styles.syncBtn}>
              {loading ? <ActivityIndicator size="small" color="#4F46E5" /> : <RefreshCw color="#4F46E5" size={20} />}
            </TouchableOpacity>
          </View>

          <View style={styles.summarySection}>
            <View style={styles.statsCard}>
              <View style={styles.statsIconBox}>
                <ClipboardList color="#4F46E5" size={24} />
              </View>
              <View style={styles.statsInfo}>
                <Text style={styles.statsLabel}>Đang xử lý</Text>
                <Text style={styles.statsValue}>
                  {orders.filter(o => {
                    const total = o.items.reduce((a, b) => a + b.quantity, 0);
                    const scanned = o.items.reduce((a, b) => a + b.scannedQuantity, 0);
                    return scanned < total;
                  }).length} Phiếu
                </Text>
              </View>
            </View>
          </View>

          <FlatList
            data={orders}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const totalItems = item.items.reduce((acc, curr) => acc + curr.quantity, 0);
              const scannedItems = item.items.reduce((acc, curr) => acc + curr.scannedQuantity, 0);
              const isDone = scannedItems >= totalItems && totalItems > 0;
              const isInbound = item.type === 'INBOUND';
              const progress = totalItems > 0 ? (scannedItems / totalItems) : 0;

              return (
                <TouchableOpacity style={styles.orderCard} onPress={() => setSelectedOrder(item)}>
                  <View style={styles.orderCardHeader}>
                    <View style={[styles.typeBadge, isInbound ? styles.typeBadgeIn : styles.typeBadgeOut]}>
                      {isInbound ? <ArrowDownLeft color="#10B981" size={14} /> : <ArrowUpRight color="#4F46E5" size={14} />}
                      <Text style={[styles.typeText, isInbound ? styles.typeTextIn : styles.typeTextOut]}>
                        {isInbound ? 'NHẬP KHO' : 'XUẤT KHO'}
                      </Text>
                    </View>
                    <Text style={styles.orderDate}>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</Text>
                  </View>

                  <Text style={styles.orderCode}>{item.code}</Text>
                  
                  <View style={styles.progressRow}>
                    <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { width: `${progress * 100}%`, backgroundColor: isDone ? '#10B981' : '#4F46E5' }]} />
                    </View>
                    <Text style={styles.progressLabel}>{scannedItems}/{totalItems}</Text>
                  </View>

                    <View style={styles.orderCardFooter}>
                      <View style={{ flex: 1 }}>
                        <View style={styles.itemCountBox}>
                          <Text style={styles.itemCountText}>{item.items.length} mặt hàng</Text>
                        </View>
                        <View style={[styles.statusBox, { marginTop: 6 }]}>
                          {isDone ? (
                            <CheckCircle2 color="#10B981" size={14} />
                          ) : (
                            <Clock color="#F59E0B" size={14} />
                          )}
                          <Text style={[styles.statusText, { color: isDone ? '#10B981' : '#F59E0B' }]}>
                            {isDone ? 'Hoàn thành' : 'Đang xử lý'}
                          </Text>
                        </View>
                      </View>
                      
                      {!isDone && (
                        <View style={styles.scanHintBtn}>
                          <ScanLine color="#FFFFFF" size={16} />
                          <Text style={styles.scanHintText}>QUÉT MÃ</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>Chưa có phiếu giao dịch nào</Text>
              </View>
            }
          />
        </View>
      </SafeAreaView>
    );
  }

  const totalRequired = selectedOrder.items.reduce((a, b) => a + b.quantity, 0) - selectedOrder.items.reduce((a, b) => a + b.scannedQuantity, 0);
  const sessionScannedCounts: Record<string, number> = {};
  selectedOrder.items.forEach(item => {
    sessionScannedCounts[item.id] = validTags.filter(t => t.displayName === item.product.name).length;
  });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.activeHeader}>
          <TouchableOpacity onPress={() => setSelectedOrder(null)} style={styles.backBtn}>
            <ChevronLeft color="#1E293B" size={24} />
          </TouchableOpacity>
          <View style={styles.activeHeaderTitleBox}>
            <Text style={styles.activeHeaderTitle}>{selectedOrder.code}</Text>
            <Text style={styles.activeHeaderSubtitle}>Thực hiện quét RFID</Text>
          </View>
        </View>

        <View style={styles.pickingStats}>
          <View style={styles.mainProgressBox}>
            <Text style={styles.mainProgressValue}>{totalScanned}</Text>
            <Text style={styles.mainProgressLabel}>ĐÃ QUÉT MỚI</Text>
          </View>
          <View style={styles.statsDivider} />
          <View style={styles.mainProgressBox}>
            <Text style={[styles.mainProgressValue, { color: '#64748B' }]}>{totalRequired}</Text>
            <Text style={styles.mainProgressLabel}>CẦN BỔ SUNG</Text>
          </View>
        </View>

        <FlatList
          data={selectedOrder.items}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.checklistContainer}
          renderItem={({ item }) => {
            const currentScanned = sessionScannedCounts[item.id] || 0;
            const alreadyScanned = item.scannedQuantity;
            const totalItemsInOrder = item.quantity;
            const fullscanned = (alreadyScanned + currentScanned) >= totalItemsInOrder;

            return (
              <View style={[styles.checklistItem, fullscanned && styles.checklistItemDone]}>
                <View style={styles.itemMainInfo}>
                  <Text style={styles.itemName}>{item.product.name}</Text>
                  <Text style={styles.itemSku}>{item.product.sku}</Text>
                </View>
                
                <View style={styles.itemQtyBox}>
                  <Text style={styles.qtyLabel}>TIẾN ĐỘ</Text>
                  <Text style={styles.qtyValue}>
                    {alreadyScanned + currentScanned} / {totalItemsInOrder}
                  </Text>
                  {currentScanned > 0 && (
                    <View style={styles.newBadge}>
                      <Text style={styles.newBadgeText}>+{currentScanned}</Text>
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
            {isScanning ? <Square color="#DC2626" size={20} /> : <Play color="#4F46E5" size={20} />}
            <Text style={[styles.dockBtnText, isScanning ? { color: '#DC2626' } : { color: '#4F46E5' }]}>
              {isScanning ? 'DỪNG QUÉT' : 'BẮT ĐẦU'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.dockBtn, styles.dockBtnSave, (isSaving || totalScanned === 0) && styles.dockBtnDisabled]} 
            onPress={submitSession} 
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

  summarySection: {
    padding: 24,
    paddingBottom: 0,
  },
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
  statsInfo: {
    flex: 1,
  },
  statsLabel: { fontSize: 12, color: '#94A3B8', fontWeight: 'bold' },
  statsValue: { fontSize: 18, color: '#1E293B', fontWeight: 'bold' },

  listContainer: {
    padding: 24,
  },
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
  },
  typeBadgeIn: { backgroundColor: '#ECFDF5' },
  typeBadgeOut: { backgroundColor: '#EEF2FF' },
  typeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  typeTextIn: { color: '#059669' },
  typeTextOut: { color: '#4F46E5' },
  orderDate: { fontSize: 12, color: '#94A3B8' },

  orderCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
    width: 45,
    textAlign: 'right',
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
  },
  itemCountText: { fontSize: 11, color: '#64748B', fontWeight: '500' },
  statusBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusText: { fontSize: 12, fontWeight: '600' },

  scanHintBtn: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  scanHintText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },

  emptyBox: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#94A3B8', fontSize: 14 },

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
  mainProgressValue: { fontSize: 32, fontWeight: 'bold', color: '#4F46E5' },
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
  checklistItemDone: {
    backgroundColor: '#F0FDF4',
    borderColor: '#DCFCE7',
  },
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
  dockBtnSave: { backgroundColor: '#4F46E5' },
  dockBtnDisabled: { backgroundColor: '#CBD5E1' },
  dockBtnText: { fontSize: 16, fontWeight: 'bold' },
  dockBtnTextWhite: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' },
});
