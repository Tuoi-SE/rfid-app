import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, TextInput, ActivityIndicator, Alert,
  Platform, KeyboardAvoidingView, ScrollView, Dimensions,
  StatusBar
} from 'react-native';
import { useReaderStore } from '../../../reader/ble/store/reader.store';
import { useScanSessionStore } from '../../store/scan-session.store';
import { useTagCacheStore } from '../../store/tag-cache.store';
import { inventoryApi } from '../../api/sessions';
import { Search, Tag, Check, RefreshCcw, Package, Layers, Info, Wifi, Cpu } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export function AssignTagsScreen() {
  const { status } = useReaderStore();
  const { scannedTags } = useScanSessionStore();
  const { updateServerNames, serverNames, getName } = useTagCacheStore();

  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  
  // sessionStartTime used to filter tags scanned in this "session"
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

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.sku.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, products]);

  const newlyScannedTags = Object.values(scannedTags).filter(
    t => new Date(t.lastScanTime).getTime() >= sessionStartTime.getTime()
  ).sort((a, b) => b.rssi - a.rssi);

  const handleAssign = async () => {
    if (!selectedProduct) return;
    if (newlyScannedTags.length === 0) {
      Alert.alert('Chưa có thẻ', 'Vui lòng bóp cò quét ít nhất 1 thẻ RFID mới.');
      return;
    }

    setIsAssigning(true);
    try {
      const epcs = newlyScannedTags.map(t => t.epc);
      await inventoryApi.assignTags(selectedProduct.id, epcs);
      
      const newNames = { ...serverNames };
      epcs.forEach(epc => { newNames[epc] = selectedProduct.name; });
      updateServerNames(newNames);

      Alert.alert('Thành công', `Đã gán ${epcs.length} thẻ cho: ${selectedProduct.name}`);
      setSessionStartTime(new Date());
      setSelectedProduct(null);
      setSearchQuery('');
    } catch (e: any) {
      Alert.alert('Lỗi cập nhật', e.message);
    } finally {
      setIsAssigning(false);
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <Cpu size={40} color="#94A3B8" />
      </View>
      <Text style={styles.emptyTitle}>RFID Reader Offline</Text>
      <Text style={styles.emptySubtitle}>
        Vui lòng kết nối súng RFID qua Bluetooth để thực hiện gán thẻ sản phẩm.
      </Text>
    </View>
  );

  if (status !== 'connected') {
    return <View style={styles.container}>{renderEmptyState()}</View>;
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <StatusBar barStyle="dark-content" />
      
      {/* Dynamic Status Header */}
      <View style={styles.header}>
        <View style={styles.statusGroup}>
          <View style={styles.statusPill}>
            <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.statusText}>READER READY</Text>
          </View>
          <View style={styles.batchPill}>
            <Layers size={12} color="#4F46E5" />
            <Text style={styles.batchText}>BATCH MODE</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={() => {
           setSessionStartTime(new Date());
           setSelectedProduct(null);
        }}>
          <RefreshCcw size={18} color="#4F46E5" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
      >
        
        {/* Section: Current Scanned Tag */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Current Tag</Text>
            {newlyScannedTags.length > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{newlyScannedTags.length} SELECTED</Text>
              </View>
            )}
          </View>
          
          {newlyScannedTags.length === 0 ? (
            <View style={styles.waitingCard}>
              <View style={styles.pingAnimation}>
                <Wifi size={32} color="#CBD5E1" />
              </View>
              <Text style={styles.waitingText}>Bóp cò súng để quét bộ thẻ mới...</Text>
            </View>
          ) : (
            <View style={styles.scannedList}>
              {newlyScannedTags.slice(0, 3).map((t, idx) => (
                <View key={t.epc} style={[styles.tagCard, idx > 0 && { marginTop: 12 }]}>
                  <View style={styles.cardLeftAccent} />
                  <View style={styles.tagCardContent}>
                    <View style={styles.iconBox}>
                      <Tag size={24} color="#6366F1" />
                    </View>
                    <View style={styles.metadata}>
                      <Text style={styles.labelCapsule}>EPC RECORD</Text>
                      <Text style={styles.epcValue} numberOfLines={1}>{t.epc}</Text>
                      <Text style={styles.currentName}>
                        {getName(t.epc) || 'Unassigned product'}
                      </Text>
                    </View>
                    <View style={styles.statusChip}>
                      <Text style={styles.statusChipText}>SCANNED</Text>
                    </View>
                  </View>
                </View>
              ))}
              {newlyScannedTags.length > 3 && (
                <Text style={styles.moreTagsText}>+ và {newlyScannedTags.length - 3} thẻ khác trong lượt quét này</Text>
              )}
            </View>
          )}
        </View>

        {/* Section: Target Product Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Replacement Product</Text>
          
          <View style={styles.searchContainer}>
            <Search size={20} color="#94A3B8" style={styles.searchIcon} />
            <TextInput 
              style={styles.searchInput}
              placeholder="Tìm sản phẩm thay thế..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <View style={styles.resultsHeader}>
            <Text style={styles.resultsLabel}>Alternative Products</Text>
            <Text style={styles.resultsCount}>{filteredProducts.length} results found</Text>
          </View>

          {loadingProducts ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color="#4F46E5" />
              <Text style={styles.loadingText}>Đang tải danh sách...</Text>
            </View>
          ) : (
            filteredProducts.slice(0, 8).map((product) => {
              const isSelected = selectedProduct?.id === product.id;
              const brandName = product.name.split(' ')[0].toUpperCase();
              
              return (
                <TouchableOpacity 
                  key={product.id}
                  activeOpacity={0.7}
                  style={[styles.productItem, isSelected && styles.productItemSelected]}
                  onPress={() => setSelectedProduct(isSelected ? null : product)}
                >
                   <View style={styles.productLeft}>
                      <View style={[styles.productIconBox, isSelected && { backgroundColor: '#EEF2FF' }]}>
                        <Package size={22} color={isSelected ? '#4F46E5' : '#94A3B8'} />
                      </View>
                      <View style={styles.productDetails}>
                        <Text style={styles.brandTag}>{brandName}</Text>
                        <Text style={styles.productNameText}>{product.name}</Text>
                        <Text style={styles.skuText}>ID: {product.sku}</Text>
                      </View>
                   </View>
                   <View style={[styles.radioOuter, isSelected && styles.radioActive]}>
                     {isSelected && <Check size={12} color="#FFF" strokeWidth={3} />}
                   </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

      </ScrollView>

      {/* Bottom Action Footer */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[
            styles.mainBtn, 
            (!selectedProduct || newlyScannedTags.length === 0 || isAssigning) && styles.mainBtnDisabled
          ]}
          onPress={handleAssign}
          disabled={!selectedProduct || newlyScannedTags.length === 0 || isAssigning}
        >
          {isAssigning ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.mainBtnText}>CẬP NHẬT THẺ</Text>
          )}
        </TouchableOpacity>
        {selectedProduct && newlyScannedTags.length > 0 && (
           <Text style={styles.helperText}>Sẵn sàng gán {newlyScannedTags.length} thẻ cho {selectedProduct.name}</Text>
        )}
      </View>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9FB' },
  
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 24, 
    paddingTop: 12, 
    paddingBottom: 4 
  },
  statusGroup: { flexDirection: 'row', gap: 8 },
  statusPill: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFFFFF', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { fontSize: 10, fontWeight: '800', color: '#64748B', letterSpacing: 0.5 },
  batchPill: {
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#EEF2FF', 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderRadius: 100
  },
  batchText: { fontSize: 10, fontWeight: '800', color: '#4F46E5', marginLeft: 4 },
  refreshBtn: { 
    backgroundColor: '#FFFFFF', 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2
  },

  scrollContent: { paddingHorizontal: 24, paddingBottom: 160 },
  
  section: { marginTop: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#191C1E', marginBottom: 12 },
  countBadge: { backgroundColor: '#4F46E5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  countBadgeText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF' },

  waitingCard: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 16, 
    paddingVertical: 40, 
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1'
  },
  pingAnimation: { marginBottom: 12 },
  waitingText: { color: '#94A3B8', fontSize: 14, fontWeight: '500' },

  scannedList: { width: '100%' },
  tagCard: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 16, 
    overflow: 'hidden',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#EEF2FF'
  },
  cardLeftAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: '#4F46E5' },
  tagCardContent: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingLeft: 20 },
  iconBox: { width: 56, height: 56, backgroundColor: '#F8F9FA', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  metadata: { flex: 1 },
  labelCapsule: { fontSize: 9, fontWeight: '800', color: '#94A3B8', letterSpacing: 1, marginBottom: 4 },
  epcValue: { fontSize: 13, color: '#4F46E5', fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginBottom: 2 },
  currentName: { fontSize: 14, fontWeight: '600', color: '#191C1E' },
  statusChip: { backgroundColor: '#F0FDF4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusChipText: { fontSize: 9, fontWeight: '800', color: '#16A34A' },
  moreTagsText: { fontSize: 12, color: '#94A3B8', textAlign: 'center', marginTop: 12, fontWeight: '500' },

  searchContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFFFFF', 
    borderRadius: 14, 
    paddingHorizontal: 16, 
    height: 52, 
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2
  },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, fontSize: 15, color: '#191C1E', fontWeight: '400' },

  resultsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  resultsLabel: { fontSize: 14, fontWeight: '700', color: '#777587' },
  resultsCount: { fontSize: 12, color: '#94A3B8' },

  productItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFFFFF', 
    padding: 16, 
    borderRadius: 16, 
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1
  },
  productItemSelected: { 
    borderColor: '#4F46E5', 
    borderWidth: 1.5, 
    backgroundColor: '#F8FAFF',
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  productLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  productIconBox: { width: 44, height: 44, backgroundColor: '#F1F5F9', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  productDetails: { flex: 1 },
  brandTag: { fontSize: 9, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.5, marginBottom: 2 },
  productNameText: { fontSize: 14, fontWeight: '700', color: '#191C1E', marginBottom: 2 },
  skuText: { fontSize: 12, color: '#777587' },
  
  radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#CBD5E1', justifyContent: 'center', alignItems: 'center' },
  radioActive: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },

  footer: { 
    position: 'absolute', 
    bottom: 0, 
    left: 0, 
    right: 0, 
    backgroundColor: '#FFFFFF', 
    paddingHorizontal: 24, 
    paddingTop: 16, 
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    alignItems: 'center'
  },
  mainBtn: { 
    backgroundColor: '#4F46E5', 
    width: '100%',
    paddingVertical: 18, 
    borderRadius: 14, 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4
  },
  mainBtnDisabled: { backgroundColor: '#94A3B8', shadowOpacity: 0 },
  mainBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  helperText: { fontSize: 11, color: '#4F46E5', fontWeight: '600', marginTop: 12 },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { color: '#191C1E', fontSize: 18, fontWeight: '800', marginBottom: 8 },
  emptySubtitle: { color: '#777587', fontSize: 14, textAlign: 'center', lineHeight: 22 },

  loadingBox: { paddingVertical: 40, alignItems: 'center' },
  loadingText: { color: '#94A3B8', fontSize: 12, marginTop: 8 },
});
