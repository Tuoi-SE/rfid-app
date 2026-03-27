import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useOrders } from '../hooks/use-orders';
import { useTransactionPicking } from '../hooks/use-transaction-picking';
import { Order } from '../types';

export function TransactionsScreen() {
  const { orders, loading, refetch } = useOrders();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { isSaving, isScanning, toggleScan, submitSession, getValidTags } = useTransactionPicking(
    selectedOrder, 
    () => { setSelectedOrder(null); refetch(); }
  );

  const validTags = getValidTags();
  const totalScanned = validTags.length;

  if (!selectedOrder) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Phiếu Giao Dịch</Text>
          <TouchableOpacity onPress={refetch} style={styles.btnSync}>
            <Text style={{ fontSize: 16 }}>🔄</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <Text style={styles.loadingText}>Đang tải phiếu...</Text>
        ) : (
          <FlatList
            data={orders}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listPadding}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.orderCard} onPress={() => setSelectedOrder(item)}>
                <View style={styles.orderHeader}>
                  <Text style={styles.orderCode}>{item.code}</Text>
                  <Text style={[styles.orderType, { color: item.type === 'INBOUND' ? '#4dd0e1' : '#ff4081' }]}>
                    {item.type === 'INBOUND' ? 'NHẬP KHO' : 'XUẤT KHO'}
                  </Text>
                </View>
                <Text style={styles.orderDate}>{new Date(item.createdAt).toLocaleString('vi-VN')}</Text>
                <View style={styles.orderStats}>
                   <Text style={styles.statText}>📦 {item.items.reduce((acc, curr) => acc + curr.quantity, 0)} SP yêu cầu</Text>
                   <Text style={styles.statText}>✅ {item.items.reduce((acc, curr) => acc + curr.scannedQuantity, 0)} SP đã quét</Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>Chưa có phiếu Nhập/Xuất nào cần xử lý.</Text>}
          />
        )}
      </View>
    );
  }

  const totalRequired = selectedOrder.items.reduce((a, b) => a + b.quantity, 0) - selectedOrder.items.reduce((a, b) => a + b.scannedQuantity, 0);
  const sessionScannedCounts: Record<string, number> = {};
  selectedOrder.items.forEach(item => {
    sessionScannedCounts[item.id] = validTags.filter(t => t.displayName === item.product.name).length;
  });

  return (
    <View style={styles.container}>
      <View style={styles.headerActive}>
        <TouchableOpacity onPress={() => setSelectedOrder(null)} style={styles.btnBack}>
          <Text style={styles.textBtnBack}>🔙 Nhận đơn khác</Text>
        </TouchableOpacity>
        <Text style={styles.activeTitle}>{selectedOrder.code}</Text>
      </View>

      <View style={styles.progressContainer}>
        <Text style={styles.progressTitle}>Tiến độ Quét Mới</Text>
        <Text style={styles.progressText}>
          <Text style={{ fontSize: 36, color: '#4CAF50' }}>{totalScanned}</Text>
          <Text style={{ fontSize: 18, color: '#888' }}> / {totalRequired} (còn thiếu)</Text>
        </Text>
      </View>

      <FlatList
        data={selectedOrder.items}
        keyExtractor={item => item.id}
        style={{ flex: 1, paddingHorizontal: 16 }}
        ListHeaderComponent={<Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', marginVertical: 12 }}>Checklist Đơn hàng:</Text>}
        renderItem={({ item }) => (
          <View style={styles.checklistItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{item.product.name}</Text>
              <Text style={styles.itemSku}>[{item.product.sku}]</Text>
            </View>
            <View style={styles.itemCounts}>
              <Text style={styles.itemReq}>Y/c: {item.quantity}</Text>
              <Text style={styles.itemDnq}>Đã nộp: {item.scannedQuantity}</Text>
              {sessionScannedCounts[item.id] > 0 && (
                <Text style={{ color: '#ffb300', fontSize: 13, fontWeight: 'bold', marginTop: 2 }}>
                  + {sessionScannedCounts[item.id]} (Lần này)
                </Text>
              )}
            </View>
          </View>
        )}
      />

      <View style={styles.bottomBar}>
        <TouchableOpacity style={[styles.btnScan, isScanning && styles.btnScanActive]} onPress={toggleScan}>
          <Text style={styles.textBtnScan}>{isScanning ? '🛑 Dừng Quét' : '▶️ Bắt đầu Quét'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btnSave, isSaving && { opacity: 0.5 }]} onPress={submitSession} disabled={isSaving}>
          <Text style={styles.textBtnSave}>{isSaving ? '⏳ Đang lưu...' : '💾 Nộp kết quả'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a1a' },
  header: { paddingTop: 60, paddingBottom: 16, paddingHorizontal: 20, backgroundColor: '#0d1b2a', borderBottomWidth: 1, borderBottomColor: '#1a2a3e', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: '#4dd0e1', fontSize: 24, fontWeight: 'bold' },
  btnSync: { padding: 8, backgroundColor: '#1a2a3e', borderRadius: 8 },
  loadingText: { color: '#888', textAlign: 'center', marginTop: 40 },
  listPadding: { padding: 16, gap: 12 },
  emptyText: { color: '#888', textAlign: 'center', marginTop: 40 },
  orderCard: { backgroundColor: '#1a1a2e', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#2a2a4e' },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  orderCode: { color: '#fff', fontSize: 18, fontWeight: 'bold', fontFamily: 'monospace' },
  orderType: { fontSize: 13, fontWeight: 'bold' },
  orderDate: { color: '#666', fontSize: 13, marginBottom: 12 },
  orderStats: { flexDirection: 'row', gap: 16 },
  statText: { color: '#bbb', fontSize: 14 },
  headerActive: { paddingTop: 60, paddingBottom: 16, paddingHorizontal: 16, backgroundColor: '#1a2a3e', flexDirection: 'row', alignItems: 'center', gap: 12 },
  btnBack: { backgroundColor: '#0d1b2a', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  textBtnBack: { color: '#aaa', fontWeight: 'bold' },
  activeTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', fontFamily: 'monospace' },
  progressContainer: { alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: '#1a2a3e' },
  progressTitle: { color: '#888', fontSize: 14, marginBottom: 8 },
  progressText: { fontWeight: 'bold' },
  checklistItem: { backgroundColor: '#1a1a2e', padding: 16, borderRadius: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 8, borderLeftWidth: 4, borderLeftColor: '#4dd0e1' },
  itemName: { color: '#fff', fontSize: 15, fontWeight: 'bold', marginBottom: 4 },
  itemSku: { color: '#888', fontSize: 12, fontFamily: 'monospace' },
  itemCounts: { alignItems: 'flex-end' },
  itemReq: { color: '#aaa', fontSize: 13, fontWeight: 'bold' },
  itemDnq: { color: '#4CAF50', fontSize: 13, fontWeight: 'bold', marginTop: 4 },
  bottomBar: { flexDirection: 'row', gap: 12, padding: 16, backgroundColor: '#0d1b2a', borderTopWidth: 1, borderTopColor: '#1a2a3e' },
  btnScan: { flex: 1, backgroundColor: '#1a2a3e', padding: 16, borderRadius: 12, alignItems: 'center' },
  btnScanActive: { backgroundColor: '#f44336' },
  textBtnScan: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  btnSave: { flex: 1, backgroundColor: '#4CAF50', padding: 16, borderRadius: 12, alignItems: 'center' },
  textBtnSave: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
