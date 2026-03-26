// src/screens/CapTheScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, TextInput, ActivityIndicator, Alert
} from 'react-native';
import SyncService from '../services/SyncService';
import { useBLEStore } from '../store/bleStore';
import { useInventoryStore } from '../store/inventoryStore';

export default function CapTheScreen() {
  const { trangThai } = useBLEStore();
  const { tags, capNhatTenTuServer } = useInventoryStore();

  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  
  // Chỉ hiện những tag quét SAU khi chọn sản phẩm hoặc ấn nút Ready
  const [sessionStartTime, setSessionStartTime] = useState<Date>(new Date());
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const data = await SyncService.getProducts();
      setProducts(data);
    } catch (e) {
      console.log('Lỗi tải sản phẩm', e);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Lọc sản phẩm theo UI
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Lấy danh sách thẻ quét được trong phiên cấp thẻ này
  const newlyScannedTags = Object.values(tags).filter(
    t => new Date(t.lanQuetCuoi).getTime() >= sessionStartTime.getTime()
  );

  // Gán mảng thẻ
  const handleAssign = async () => {
    if (!selectedProduct) return;
    if (newlyScannedTags.length === 0) {
      Alert.alert('Chưa có thẻ nào', 'Vui lòng bóp cò để quét ít nhất 1 thẻ RFID trước khi gán.');
      return;
    }

    setIsAssigning(true);
    try {
      const epcs = newlyScannedTags.map(t => t.epc);
      await SyncService.assignTags(selectedProduct.id, epcs);
      
      // Cập nhật lại tên vào bộ nhớ Local để UI hiển thị đúng luôn
      const tenMap = { ...useInventoryStore.getState().tenTuServer };
      epcs.forEach(epc => {
        tenMap[epc] = selectedProduct.name;
      });
      capNhatTenTuServer(tenMap);

      Alert.alert('Thành công', `Đã gán ${epcs.length} thẻ cho Sản phẩm: ${selectedProduct.name}`);
      // Nạp phiên quét mới
      setSessionStartTime(new Date());
    } catch (e: any) {
      Alert.alert('Lỗi gán thẻ', e.message);
    } finally {
      setIsAssigning(false);
    }
  };

  if (trangThai !== 'da_ket_noi') {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🔌</Text>
          <Text style={styles.emptyTitle}>Chưa kết nối Máy quét</Text>
          <Text style={styles.emptySubtitle}>
            Vui lòng sang tab "Kết Nối" để kết nối với Súng RFID trước khi thực hiện Cấp Thẻ.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Bước 1: Chọn sản phẩm */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Chọn Sản phẩm</Text>
        {!selectedProduct ? (
          <View style={{ flex: 1 }}>
            <TextInput 
              style={styles.searchInput}
              placeholder="Tìm tên sản phẩm hoặc SKU..."
              placeholderTextColor="#666"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {loadingProducts ? (
              <ActivityIndicator color="#4dd0e1" style={{ marginTop: 20 }} />
            ) : (
              <FlatList 
                data={filteredProducts}
                keyExtractor={item => item.id}
                style={{ marginTop: 10, flex: 1 }}
                renderItem={({item}) => (
                  <TouchableOpacity 
                    style={styles.productItem}
                    onPress={() => {
                      setSelectedProduct(item);
                      setSessionStartTime(new Date()); // Bắt đầu tính tag từ thời điểm này
                    }}
                  >
                    <Text style={styles.productName}>{item.name}</Text>
                    <Text style={styles.productSku}>SKU: {item.sku}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        ) : (
          <View style={styles.selectedProductCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.selectedProductTitle}>Sản phẩm đang chọn:</Text>
              <Text style={styles.selectedProductName}>{selectedProduct.name}</Text>
              <Text style={styles.selectedProductSku}>SKU: {selectedProduct.sku}</Text>
            </View>
            <TouchableOpacity 
              style={styles.btnChangeProduct}
              onPress={() => setSelectedProduct(null)}
            >
              <Text style={styles.btnChangeProductText}>Đổi</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Bước 2: Quét thẻ và gán */}
      <View style={[styles.section, { flex: 1, opacity: selectedProduct ? 1 : 0.4 }]} pointerEvents={selectedProduct ? 'auto' : 'none'}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={styles.sectionTitle}>2. Bóp cò quét thẻ</Text>
          <TouchableOpacity onPress={() => setSessionStartTime(new Date())}>
            <Text style={{ color: '#ff5252', fontSize: 13, fontWeight: 'bold' }}>Làm lại (Xóa list)</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.tagListContainer}>
          {newlyScannedTags.length === 0 ? (
            <Text style={styles.emptyScanText}>
              Đưa súng sát vào thẻ trắng và bóp cò...
            </Text>
          ) : (
            <FlatList 
              data={newlyScannedTags}
              keyExtractor={item => item.epc}
              renderItem={({item}) => (
                <View style={styles.tagItem}>
                  <Text style={styles.tagEpc}>{item.epc}</Text>
                  <Text style={styles.tagRssi}>{item.rssi} dBm</Text>
                </View>
              )}
            />
          )}
        </View>

        <TouchableOpacity 
          style={[styles.btnAssign, (newlyScannedTags.length === 0 || isAssigning) && styles.btnAssignDisabled]}
          onPress={handleAssign}
          disabled={newlyScannedTags.length === 0 || isAssigning}
        >
          {isAssigning ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnAssignText}>Gắn thẻ vào SP này ({newlyScannedTags.length} thẻ)</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a1a', padding: 12 },
  section: { 
    backgroundColor: '#151525', 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a4e',
    flex: 1
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#4CAF50', marginBottom: 16 },
  
  searchInput: { 
    backgroundColor: '#0a0a1a', color: '#fff', borderRadius: 8,
    padding: 12, fontSize: 15, borderWidth: 1, borderColor: '#4dd0e1' 
  },
  productItem: { 
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2a2a4e' 
  },
  productName: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  productSku: { color: '#aaa', fontSize: 13, marginTop: 4 },

  selectedProductCard: {
    backgroundColor: '#0d2137', padding: 16, borderRadius: 10,
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#4dd0e1'
  },
  selectedProductTitle: { color: '#4dd0e1', fontSize: 12, marginBottom: 4 },
  selectedProductName: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  selectedProductSku: { color: '#aaa', fontSize: 13, marginTop: 4 },
  btnChangeProduct: {
    backgroundColor: '#1976D2', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8
  },
  btnChangeProductText: { color: '#fff', fontWeight: 'bold' },

  tagListContainer: {
    flex: 1, backgroundColor: '#0a0a1a', borderRadius: 8, padding: 12, marginBottom: 16
  },
  emptyScanText: { color: '#555', textAlign: 'center', marginTop: 40, fontStyle: 'italic' },
  tagItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1a1a2e'
  },
  tagEpc: { color: '#4dd0e1', fontFamily: 'monospace', fontSize: 13 },
  tagRssi: { color: '#888', fontSize: 12 },

  btnAssign: {
    backgroundColor: '#4CAF50', padding: 16, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row'
  },
  btnAssignDisabled: { backgroundColor: '#333', opacity: 0.7 },
  btnAssignText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  emptyIcon:      { fontSize: 48, marginBottom: 16 },
  emptyTitle:     { color: '#888', fontSize: 18, textAlign: 'center', fontWeight: 'bold' },
  emptySubtitle:  { color: '#555', fontSize: 14, textAlign: 'center', marginTop: 8, paddingHorizontal: 30 },
});
