import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, TextInput, ActivityIndicator, Alert
} from 'react-native';
import { useReaderStore } from '../../../reader/ble/store/reader.store';
import { useScanSessionStore } from '../../store/scan-session.store';
import { useTagCacheStore } from '../../store/tag-cache.store';
import { inventoryApi } from '../../api/sessions';

export function AssignTagsScreen() {
  const { status } = useReaderStore();
  const { scannedTags } = useScanSessionStore();
  const { updateServerNames, serverNames } = useTagCacheStore();

  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  
  // Only show tags scanned AFTER product selection or "Refresh"
  const [sessionStartTime, setSessionStartTime] = useState<Date>(new Date());
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const data = await inventoryApi.getProducts();
      setProducts(data);
    } catch (e) {
      console.log('Lỗi tải sản phẩm', e);
    } finally {
      setLoadingProducts(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const newlyScannedTags = Object.values(scannedTags).filter(
    t => new Date(t.lastScanTime).getTime() >= sessionStartTime.getTime()
  );

  const handleAssign = async () => {
    if (!selectedProduct) return;
    if (newlyScannedTags.length === 0) {
      Alert.alert('Chưa có thẻ nào', 'Vui lòng bóp cò để quét ít nhất 1 thẻ RFID trước khi gán.');
      return;
    }

    setIsAssigning(true);
    try {
      const epcs = newlyScannedTags.map(t => t.epc);
      await inventoryApi.assignTags(selectedProduct.id, epcs);
      
      const newNames = { ...serverNames };
      epcs.forEach(epc => { newNames[epc] = selectedProduct.name; });
      updateServerNames(newNames);

      Alert.alert('Thành công', `Đã gán ${epcs.length} thẻ cho Sản phẩm: ${selectedProduct.name}`);
      setSessionStartTime(new Date());
    } catch (e: any) {
      Alert.alert('Lỗi gán thẻ', e.message);
    } finally {
      setIsAssigning(false);
    }
  };

  if (status !== 'connected') {
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
                      setSessionStartTime(new Date());
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
  section: { backgroundColor: '#151525', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a4e', flex: 1 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#4CAF50', marginBottom: 16 },
  searchInput: { backgroundColor: '#0a0a1a', color: '#fff', borderRadius: 8, padding: 12, fontSize: 15, borderWidth: 1, borderColor: '#4dd0e1' },
  productItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2a2a4e' },
  productName: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  productSku: { color: '#aaa', fontSize: 13, marginTop: 4 },
  selectedProductCard: { backgroundColor: '#0d2137', padding: 16, borderRadius: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#4dd0e1'},
  selectedProductTitle: { color: '#4dd0e1', fontSize: 12, marginBottom: 4 },
  selectedProductName: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  selectedProductSku: { color: '#aaa', fontSize: 13, marginTop: 4 },
  btnChangeProduct: { backgroundColor: '#1976D2', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  btnChangeProductText: { color: '#fff', fontWeight: 'bold' },
  tagListContainer: { flex: 1, backgroundColor: '#0a0a1a', borderRadius: 8, padding: 12, marginBottom: 16 },
  emptyScanText: { color: '#555', textAlign: 'center', marginTop: 40, fontStyle: 'italic' },
  tagItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1a1a2e' },
  tagEpc: { color: '#4dd0e1', fontFamily: 'monospace', fontSize: 13 },
  tagRssi: { color: '#888', fontSize: 12 },
  btnAssign: { backgroundColor: '#4CAF50', padding: 16, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  btnAssignDisabled: { backgroundColor: '#333', opacity: 0.7 },
  btnAssignText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { color: '#888', fontSize: 18, textAlign: 'center', fontWeight: 'bold' },
  emptySubtitle: { color: '#555', fontSize: 14, textAlign: 'center', marginTop: 8, paddingHorizontal: 30 },
});
