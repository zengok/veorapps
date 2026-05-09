import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl,
  TouchableOpacity, Alert, ActivityIndicator, TextInput,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import OrderItem from '../components/OrderItem';
import CategorySelector from '../components/CategorySelector';
import ProductCard from '../components/ProductCard';
import { ordersApi, productsApi } from '../services/api';
import { formatCurrency } from '../utils/formatters';
import type { Order, Product, Category } from '../types';

type SubTab = 'active' | 'new';

export default function OrderScreen() {
  const [subTab, setSubTab] = useState<SubTab>('active');
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersRefreshing, setOrdersRefreshing] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [customerNote, setCustomerNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const res = await ordersApi.getAll('PENDING');
      if (res.success && res.data) {
        setOrders([...res.data].sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
      }
    } catch { Alert.alert('Hata', 'Siparişler yüklenemedi.'); }
    finally { setOrdersLoading(false); }
  }, []);

  const onOrdersRefresh = useCallback(async () => {
    setOrdersRefreshing(true);
    await fetchOrders();
    setOrdersRefreshing(false);
  }, [fetchOrders]);

  React.useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleComplete = useCallback(async (id: string) => {
    try {
      const res = await ordersApi.complete(id);
      if (res.success) {
        Alert.alert('Tamamlandı', 'Sipariş tamamlandı, satış kaydı oluşturuldu.');
        fetchOrders();
      } else Alert.alert('Hata', res.message ?? 'İşlem başarısız.');
    } catch { Alert.alert('Hata', 'Bağlantı hatası.'); }
  }, [fetchOrders]);

  const handleCancel = useCallback(async (id: string) => {
    try {
      const res = await ordersApi.cancel(id);
      if (res.success) fetchOrders();
      else Alert.alert('Hata', res.message ?? 'İptal başarısız.');
    } catch { Alert.alert('Hata', 'Bağlantı hatası.'); }
  }, [fetchOrders]);

  const fetchProducts = useCallback(async (category: Category) => {
    setProductsLoading(true);
    try {
      const res = await productsApi.getAll(category);
      if (res.success && res.data)
        setProducts([...res.data].sort((a, b) => (a.stock === 0 ? 1 : b.stock === 0 ? -1 : 0)));
    } catch { Alert.alert('Hata', 'Ürünler yüklenemedi.'); }
    finally { setProductsLoading(false); }
  }, []);

  const handleCategoryChange = useCallback((cat: Category) => {
    setSelectedCategory(cat);
    setSelectedProduct(null);
    setDetailOpen(false);
    fetchProducts(cat);
  }, [fetchProducts]);

  const handleProductPress = useCallback((product: Product) => {
    if (product.stock === 0) return;
    setSelectedProduct(product);
    setQuantity(1);
    setDetailOpen(true);
  }, []);

  const handleQtyChange = (val: string) => {
    const n = parseInt(val, 10);
    if (isNaN(n) || n < 1) { setQuantity(1); return; }
    if (selectedProduct && n > selectedProduct.stock) { setQuantity(selectedProduct.stock); return; }
    setQuantity(n);
  };

  const handleCreateOrder = useCallback(() => {
    if (!selectedProduct) return;
    Alert.alert(
      'Siparişi Onayla',
      `${selectedProduct.name} — ${quantity} adet\nToplam: ${formatCurrency(Number(selectedProduct.price) * quantity)}\n\nSipariş oluşturulsun mu?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sipariş Oluştur',
          onPress: async () => {
            setSubmitting(true);
            try {
              const res = await ordersApi.create(selectedProduct.id, quantity, customerNote.trim() || undefined);
              if (res.success) {
                Alert.alert('Başarılı', 'Sipariş oluşturuldu!');
                setSelectedProduct(null);
                setSelectedCategory(null);
                setProducts([]);
                setQuantity(1);
                setCustomerNote('');
                setDetailOpen(false);
                fetchOrders();
                setSubTab('active');
              } else Alert.alert('Hata', res.message ?? 'Sipariş oluşturulamadı.');
            } catch { Alert.alert('Hata', 'Bağlantı hatası.'); }
            finally { setSubmitting(false); }
          },
        },
      ]
    );
  }, [selectedProduct, quantity, customerNote, fetchOrders]);

  return (
    <View style={styles.root}>
      {/* Sub-tab bar */}
      <View style={styles.tabBar}>
        {(['active', 'new'] as SubTab[]).map((tab) => {
          const isActive = subTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tabBtn, isActive && styles.tabBtnActive]}
              onPress={() => { setSubTab(tab); if (tab === 'active') fetchOrders(); }}
              activeOpacity={0.8}
            >
              <Ionicons
                name={tab === 'active' ? 'time-outline' : 'add-circle-outline'}
                size={16}
                color={isActive ? '#c9a961' : '#aaa'}
              />
              <Text style={[styles.tabBtnText, isActive && styles.tabBtnTextActive]}>
                {tab === 'active' ? 'Aktif Siparişler' : 'Yeni Sipariş Gir'}
              </Text>
              {tab === 'active' && orders.length > 0 && (
                <View style={[styles.tabBadge, isActive && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, isActive && { color: '#1a1a1a' }]}>{orders.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Aktif Siparişler */}
      {subTab === 'active' && (
        ordersLoading ? (
          <View style={styles.center}><ActivityIndicator size="large" color="#c9a961" /></View>
        ) : (
          <FlatList
            data={orders}
            keyExtractor={(o) => o.id}
            renderItem={({ item }) => (
              <OrderItem order={item} onComplete={handleComplete} onCancel={handleCancel} />
            )}
            refreshControl={<RefreshControl refreshing={ordersRefreshing} onRefresh={onOrdersRefresh} colors={['#c9a961']} />}
            ListHeaderComponent={
              <View style={styles.listHeader}>
                <Text style={styles.listHeaderTitle}>Hazırlanacak Siparişler</Text>
                <Text style={styles.listHeaderCount}>{orders.length} sipariş</Text>
              </View>
            }
            ListEmptyComponent={
              <View style={styles.center}>
                <Ionicons name="checkmark-done-circle-outline" size={52} color="#ddd" />
                <Text style={styles.emptyText}>Bekleyen sipariş yok</Text>
              </View>
            }
            contentContainerStyle={orders.length === 0 ? { flex: 1 } : { paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
          />
        )
      )}

      {/* Yeni Sipariş */}
      {subTab === 'new' && (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          {!detailOpen ? (
            <>
              <View style={styles.categoryArea}>
                <CategorySelector selected={selectedCategory} onChange={handleCategoryChange} />
                {selectedCategory && (
                  <TouchableOpacity style={styles.changeCatBtn} onPress={() => { setSelectedCategory(null); setProducts([]); }}>
                    <Ionicons name="swap-horizontal-outline" size={13} color="#c9a961" />
                    <Text style={styles.changeCatText}>Kategoriyi Değiştir</Text>
                  </TouchableOpacity>
                )}
              </View>
              {!selectedCategory ? (
                <View style={styles.center}>
                  <Ionicons name="arrow-up-circle-outline" size={52} color="#ddd" />
                  <Text style={styles.emptyText}>Yukarıdan bir kategori seçin</Text>
                </View>
              ) : productsLoading ? (
                <View style={styles.center}><ActivityIndicator size="large" color="#c9a961" /></View>
              ) : (
                <FlatList
                  data={products}
                  keyExtractor={(p) => p.id}
                  renderItem={({ item }) => (
                    <ProductCard product={item} onPress={() => handleProductPress(item)} isSelected={selectedProduct?.id === item.id} />
                  )}
                  ListEmptyComponent={<View style={styles.center}><Text style={styles.emptyText}>Bu kategoride ürün yok</Text></View>}
                  contentContainerStyle={{ paddingBottom: 24, paddingTop: 8 }}
                  showsVerticalScrollIndicator={false}
                />
              )}
            </>
          ) : (
            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.detailContent} keyboardShouldPersistTaps="handled">
              <TouchableOpacity style={styles.backBtn} onPress={() => setDetailOpen(false)}>
                <Ionicons name="arrow-back-outline" size={18} color="#c9a961" />
                <Text style={styles.backBtnText}>Ürün Listesine Dön</Text>
              </TouchableOpacity>
              {selectedProduct && (
                <>
                  <Text style={styles.detailName}>{selectedProduct.name}</Text>
                  <Text style={styles.detailCat}>{selectedProduct.category === 'WOMEN' ? 'Kadın Parfümü' : 'Erkek Parfümü'}</Text>
                  <Text style={styles.detailPrice}>{formatCurrency(Number(selectedProduct.price))}</Text>
                  <Text style={styles.detailStock}>Stok: {selectedProduct.stock} adet</Text>

                  <Text style={styles.sectionLabel}>ADET</Text>
                  <View style={styles.qtyRow}>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity((q) => Math.max(1, q - 1))}>
                      <Ionicons name="remove" size={22} color="#c9a961" />
                    </TouchableOpacity>
                    <TextInput style={styles.qtyInput} value={String(quantity)} onChangeText={handleQtyChange} keyboardType="number-pad" selectTextOnFocus />
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity((q) => Math.min(selectedProduct.stock, q + 1))}>
                      <Ionicons name="add" size={22} color="#c9a961" />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.sectionLabel}>MÜŞTERİ NOTU (OPSİYONEL)</Text>
                  <TextInput
                    style={styles.noteInput}
                    value={customerNote}
                    onChangeText={setCustomerNote}
                    placeholder="Özel istek, teslimat notu..."
                    placeholderTextColor="#ccc"
                    multiline
                    numberOfLines={3}
                    maxLength={300}
                  />

                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Toplam</Text>
                    <Text style={styles.totalValue}>{formatCurrency(Number(selectedProduct.price) * quantity)}</Text>
                  </View>

                  <TouchableOpacity style={[styles.orderBtn, submitting && styles.orderBtnDisabled]} onPress={handleCreateOrder} disabled={submitting} activeOpacity={0.85}>
                    {submitting ? <ActivityIndicator color="#1a1a1a" /> : (
                      <><Ionicons name="checkmark-circle-outline" size={20} color="#1a1a1a" /><Text style={styles.orderBtnText}>Sipariş Oluştur</Text></>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          )}
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'rgba(245,245,245,0.92)' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  emptyText: { fontSize: 14, color: '#bbb', fontWeight: '500', textAlign: 'center' },
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingHorizontal: 12, paddingTop: 8 },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: '#c9a961' },
  tabBtnText: { fontSize: 12, fontWeight: '600', color: '#aaa' },
  tabBtnTextActive: { color: '#c9a961' },
  tabBadge: { backgroundColor: '#ddd', borderRadius: 8, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  tabBadgeActive: { backgroundColor: '#c9a961' },
  tabBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  listHeaderTitle: { fontSize: 13, fontWeight: '700', color: '#1a1a1a' },
  listHeaderCount: { fontSize: 12, color: '#c9a961', fontWeight: '600' },
  categoryArea: { backgroundColor: '#fff', paddingTop: 16, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  changeCatBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 16, paddingBottom: 8 },
  changeCatText: { fontSize: 12, color: '#c9a961', fontWeight: '600' },
  detailContent: { padding: 20, paddingBottom: 40 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  backBtnText: { fontSize: 13, color: '#c9a961', fontWeight: '600' },
  detailName: { fontSize: 22, fontWeight: '800', color: '#1a1a1a', marginBottom: 4 },
  detailCat: { fontSize: 13, color: '#aaa', marginBottom: 6 },
  detailPrice: { fontSize: 22, fontWeight: '700', color: '#c9a961', marginBottom: 4 },
  detailStock: { fontSize: 13, color: '#888', marginBottom: 20 },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: '#aaa', letterSpacing: 1.5, marginBottom: 10 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 20 },
  qtyBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#fff8e6', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e8d5a3' },
  qtyInput: { width: 72, height: 44, borderRadius: 12, borderWidth: 1.5, borderColor: '#e0e0e0', textAlign: 'center', fontSize: 20, fontWeight: '700', color: '#1a1a1a' },
  noteInput: { backgroundColor: '#f9f9f9', borderRadius: 12, borderWidth: 1.5, borderColor: '#e0e0e0', paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#1a1a1a', minHeight: 80, textAlignVertical: 'top', marginBottom: 20 },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f9f9f9', borderRadius: 12, padding: 14, marginBottom: 16 },
  totalLabel: { fontSize: 14, color: '#888', fontWeight: '600' },
  totalValue: { fontSize: 22, fontWeight: '800', color: '#1a1a1a' },
  orderBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#c9a961', borderRadius: 14, paddingVertical: 16 },
  orderBtnDisabled: { backgroundColor: '#ddd' },
  orderBtnText: { fontSize: 16, fontWeight: '800', color: '#1a1a1a' },
});
