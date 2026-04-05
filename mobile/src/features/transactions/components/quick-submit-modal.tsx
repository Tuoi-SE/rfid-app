import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator, FlatList, TextInput } from 'react-native';
import { ordersApi } from '../api/orders.api';
import { httpClient } from '../../../shared/api/http-client';
import { useAuthStore } from '../../auth/store/auth.store';
import { ArrowDownLeft, ArrowUpRight, MapPin, X, CheckCircle2 } from 'lucide-react-native';

interface QuickSubmitModalProps {
  visible: boolean;
  onClose: () => void;
  epcs: string[];
  onSuccess: () => void;
}

export function QuickSubmitModal({ visible, onClose, epcs, onSuccess }: QuickSubmitModalProps) {
  const [type, setType] = useState<'INBOUND' | 'OUTBOUND'>('INBOUND');
  const [locations, setLocations] = useState<any[]>([]);
  const [loadingLoc, setLoadingLoc] = useState(false);
  const [selectedLoc, setSelectedLoc] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { role } = useAuthStore();

  useEffect(() => {
    if (visible && type === 'OUTBOUND') {
      fetchLocations();
    }
  }, [visible, type]);

  const fetchLocations = async () => {
    try {
      setLoadingLoc(true);
      const res = await httpClient<any>('/locations', { method: 'GET' });
      setLocations(Array.isArray(res?.data) ? res.data : []);
    } catch (e) {
      console.log('Error fetching locations', e);
    } finally {
      setLoadingLoc(false);
    }
  };

  const handleSubmit = async () => {
    if (type === 'OUTBOUND' && !selectedLoc) {
      setErrorMsg('Vui lòng chọn nơi xuất đến.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      await ordersApi.mobileQuickSubmit({
        type,
        locationId: type === 'OUTBOUND' ? selectedLoc : undefined,
        epcs
      });
      onSuccess();
    } catch (e: any) {
      setErrorMsg(e.message || 'Lỗi kết nối máy chủ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Chốt Phiếu Nhanh ({epcs.length} thẻ)</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X color="#64748B" size={20} />
            </TouchableOpacity>
          </View>

          {errorMsg ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          <Text style={styles.sectionTitle}>1. CHỌN LOẠI PHIẾU</Text>
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[styles.typeBtn, type === 'INBOUND' && styles.typeBtnActive]}
              onPress={() => setType('INBOUND')}
            >
              <ArrowDownLeft color={type === 'INBOUND' ? '#10B981' : '#64748B'} size={24} />
              <Text style={[styles.typeText, type === 'INBOUND' && { color: '#059669' }]}>Nhập Kho</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeBtn, type === 'OUTBOUND' && styles.typeBtnActiveOut]}
              onPress={() => setType('OUTBOUND')}
            >
              <ArrowUpRight color={type === 'OUTBOUND' ? '#4F46E5' : '#64748B'} size={24} />
              <Text style={[styles.typeText, type === 'OUTBOUND' && { color: '#4F46E5' }]}>Xuất Kho</Text>
            </TouchableOpacity>
          </View>

          {type === 'INBOUND' && role === 'WAREHOUSE_MANAGER' && (
            <View style={styles.infoBox}>
              <MapPin color="#10B981" size={16} />
              <Text style={styles.infoText}>Hàng sẽ được nhập mặc định vào kho của bạn.</Text>
            </View>
          )}

          {type === 'OUTBOUND' && (
            <View style={styles.destSection}>
              <Text style={styles.sectionTitle}>2. CHỌN NƠI XUẤT ĐẾN</Text>
              {loadingLoc ? (
                <ActivityIndicator size="small" color="#4F46E5" />
              ) : (
                <FlatList
                  data={locations}
                  keyExtractor={item => item.id}
                  style={styles.locList}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.locItem, selectedLoc === item.id && styles.locItemActive]}
                      onPress={() => setSelectedLoc(item.id)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.locName, selectedLoc === item.id && { color: '#4F46E5' }]}>{item.name}</Text>
                        <Text style={styles.locType}>{item.type}</Text>
                      </View>
                      {selectedLoc === item.id && <CheckCircle2 color="#4F46E5" size={20} />}
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>
          )}

          <TouchableOpacity
            style={[styles.submitBtn, (isSubmitting || (type === 'OUTBOUND' && !selectedLoc)) && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting || (type === 'OUTBOUND' && !selectedLoc)}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitBtnText}>XÁC NHẬN CHỐT PHIẾU</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
  closeBtn: { padding: 4, backgroundColor: '#F1F5F9', borderRadius: 12 },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: '#94A3B8', marginBottom: 12, marginTop: 16 },
  typeSelector: { flexDirection: 'row', gap: 12 },
  typeBtn: { flex: 1, height: 80, borderRadius: 16, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  typeBtnActive: { backgroundColor: '#ECFDF5', borderColor: '#10B981' },
  typeBtnActiveOut: { backgroundColor: '#EEF2FF', borderColor: '#4F46E5' },
  typeText: { fontSize: 14, fontWeight: 'bold', color: '#64748B', marginTop: 8 },
  infoBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', padding: 12, borderRadius: 12, marginTop: 16, gap: 8 },
  infoText: { fontSize: 13, color: '#059669', flex: 1 },
  destSection: { flex: 1, minHeight: 200 },
  locList: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 8 },
  locItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, marginBottom: 4 },
  locItemActive: { backgroundColor: '#EEF2FF' },
  locName: { fontSize: 14, fontWeight: 'bold', color: '#1E293B' },
  locType: { fontSize: 11, color: '#64748B', marginTop: 2 },
  submitBtn: { backgroundColor: '#4F46E5', height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  submitBtnDisabled: { backgroundColor: '#CBD5E1' },
  submitBtnText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  errorBox: { backgroundColor: '#FEF2F2', padding: 12, borderRadius: 8, marginBottom: 16 },
  errorText: { color: '#DC2626', fontSize: 13, fontWeight: '500', textAlign: 'center' }
});
