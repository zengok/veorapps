import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl,
  TouchableOpacity, Alert, ActivityIndicator, TextInput,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import OrderItem from '../components/OrderItem';
import CategorySelector from '../components/CategorySelector';
import ProductCard from '../components/ProductCard';
import EmptyState from '../components/EmptyState';
import SearchBar from '../components/SearchBar';
import StatusBadge from '../components/StatusBadge';
import AppIcon from '../components/AppIcon';
import { ordersApi, productsApi } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import { getApiErrorMessage } from '../utils/errors';
import { formatCurrency } from '../utils/formatters';
import type { Order, Product, Category } from '../types';
import { makeTypography, radius, spacing, touch, type ThemeColors } from '../theme';

type SubTab = 'active' | 'new';

export default function OrderScreen() {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
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
  const [searchQuery, setSearchQuery] = useState('');

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const res = await ordersApi.getAll('PENDING');
      if (res.success && res.data) {
        setOrders([...res.data].sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
      }
    } catch (e) { Alert.alert('Hata', getApiErrorMessage(e, 'Siparişler yüklenemedi.')); }
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
    } catch (e) { Alert.alert('Hata', getApiErrorMessage(e, 'İşlem başarısız.')); }
  }, [fetchOrders]);

  const handleCancel = useCallback(async (id: string) => {
    try {
      const res = await ordersApi.cancel(id);
      if (res.success) fetchOrders();
      else Alert.alert('Hata', res.message ?? 'İptal başarısız.');
    } catch (e) { Alert.alert('Hata', getApiErrorMessage(e, 'İptal başarısız.')); }
  }, [fetchOrders]);

  const fetchProducts = useCallback(async (category: Category) => {
    setProductsLoading(true);
    try {
      const res = await productsApi.getAll(category);
      if (res.success && res.data)
        setProducts([...res.data].sort((a, b) => (a.stock === 0 ? 1 : b.stock === 0 ? -1 : 0)));
    } catch (e) { Alert.alert('Hata', getApiErrorMessage(e, 'Ürünler yüklenemedi.')); }
    finally { setProductsLoading(false); }
  }, []);

  const handleCategoryChange = useCallback((cat: Category) => {
    setSelectedCategory(cat);
    setSelectedProduct(null);
    setDetailOpen(false);
    setSearchQuery('');
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
            } catch (e) { Alert.alert('Hata', getApiErrorMessage(e, 'Sipariş oluşturulamadı.')); }
            finally { setSubmitting(false); }
          },
        },
      ]
    );
  }, [selectedProduct, quantity, customerNote, fetchOrders]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLocaleLowerCase('tr-TR');
    if (!q) return products;
    return products.filter((product) =>
      product.name.toLocaleLowerCase('tr-TR').includes(q)
    );
  }, [products, searchQuery]);

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
              hitSlop={touch.hitSlop}
            >
              <Ionicons
                name={tab === 'active' ? 'time-outline' : 'add-circle-outline'}
                size={16}
                color={isActive ? colors.gold : colors.muted}
              />
              <Text style={[styles.tabBtnText, isActive && styles.tabBtnTextActive]}>
                {tab === 'active' ? 'Aktif Siparişler' : 'Yeni Sipariş Gir'}
              </Text>
              {tab === 'active' && orders.length > 0 && (
                <View style={[styles.tabBadge, isActive && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, isActive && { color: colors.ink }]}>{orders.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Aktif Siparişler */}
      {subTab === 'active' && (
        ordersLoading ? (
          <View style={styles.center}><ActivityIndicator size="large" color={colors.gold} /></View>
        ) : (
          <FlatList
            data={orders}
            keyExtractor={(o) => o.id}
            renderItem={({ item }) => (
              <OrderItem order={item} onComplete={handleComplete} onCancel={handleCancel} />
            )}
            refreshControl={<RefreshControl refreshing={ordersRefreshing} onRefresh={onOrdersRefresh} colors={[colors.gold]} />}
            ListHeaderComponent={
              <View style={styles.listHeader}>
                <Text style={styles.listHeaderTitle}>Hazırlanacak Siparişler</Text>
                <Text style={styles.listHeaderCount}>{orders.length} sipariş</Text>
              </View>
            }
            ListEmptyComponent={
              <View style={styles.center}>
                <EmptyState
                  icon="checkmark-done-circle-outline"
                  title="Bekleyen sipariş yok"
                  description="Yeni sipariş geldiğinde burada hazırlanacak liste olarak görünür."
                />
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
                  <>
                    <View style={styles.searchWrap}>
                      <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
                    </View>
                    <TouchableOpacity style={styles.changeCatBtn} onPress={() => { setSelectedCategory(null); setProducts([]); setSearchQuery(''); }} hitSlop={touch.hitSlop}>
                      <Ionicons name="swap-horizontal-outline" size={13} color={colors.gold} />
                      <Text style={styles.changeCatText}>Kategoriyi Değiştir</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
              {!selectedCategory ? (
                <View style={styles.center}>
                  <EmptyState
                    icon="arrow-up-circle-outline"
                    title="Kategori seçin"
                    description="Sipariş oluşturmak için önce ürün kategorisini seçin."
                  />
                </View>
              ) : productsLoading ? (
                <View style={styles.center}><ActivityIndicator size="large" color={colors.gold} /></View>
              ) : (
                <FlatList
                  data={filteredProducts}
                  keyExtractor={(p) => p.id}
                  renderItem={({ item }) => (
                    <ProductCard product={item} onPress={() => handleProductPress(item)} isSelected={selectedProduct?.id === item.id} />
                  )}
                  ListEmptyComponent={
                    <View style={styles.center}>
                      <EmptyState
                        icon={products.length === 0 ? 'cube-outline' : 'search-outline'}
                        title={products.length === 0 ? 'Bu kategoride ürün yok' : 'Arama sonucu yok'}
                        description={products.length === 0 ? 'Stok ekranından ürün ekleyebilirsiniz.' : 'Ürün adını farklı bir şekilde aramayı deneyin.'}
                        compact
                      />
                    </View>
                  }
                  contentContainerStyle={{ paddingBottom: 24, paddingTop: 8 }}
                  showsVerticalScrollIndicator={false}
                />
              )}
            </>
          ) : (
            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.detailContent} keyboardShouldPersistTaps="handled">
              <TouchableOpacity style={styles.backBtn} onPress={() => setDetailOpen(false)} hitSlop={touch.hitSlop}>
                <Ionicons name="arrow-back-outline" size={18} color={colors.gold} />
                <Text style={styles.backBtnText}>Ürün Listesine Dön</Text>
              </TouchableOpacity>
              {selectedProduct && (
                <>
                  <Text style={styles.detailName} numberOfLines={2}>{selectedProduct.name}</Text>
                  <Text style={styles.detailCat}>{selectedProduct.category === 'WOMEN' ? 'Kadın Parfümü' : 'Erkek Parfümü'}</Text>
                  <Text style={styles.detailPrice} numberOfLines={1} adjustsFontSizeToFit>{formatCurrency(Number(selectedProduct.price))}</Text>
                  <View style={styles.detailBadgeRow}>
                    <StatusBadge tone={selectedProduct.stock <= 5 ? 'warning' : 'success'} icon="cube-outline" label={`${selectedProduct.stock} adet stok`} />
                  </View>

                  <Text style={styles.sectionLabel}>ADET</Text>
                  <View style={styles.qtyRow}>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity((q) => Math.max(1, q - 1))} hitSlop={touch.hitSlop}>
                      <AppIcon name="minus" size={26} />
                    </TouchableOpacity>
                    <TextInput style={styles.qtyInput} value={String(quantity)} onChangeText={handleQtyChange} keyboardType="number-pad" selectTextOnFocus />
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity((q) => Math.min(selectedProduct.stock, q + 1))} hitSlop={touch.hitSlop}>
                      <AppIcon name="plus" size={26} />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.sectionLabel}>MÜŞTERİ NOTU (OPSİYONEL)</Text>
                  <TextInput
                    style={styles.noteInput}
                    value={customerNote}
                    onChangeText={setCustomerNote}
                    placeholder="Özel istek, teslimat notu..."
                    placeholderTextColor={colors.faint}
                    multiline
                    numberOfLines={3}
                    maxLength={300}
                  />

                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Toplam</Text>
                    <Text style={styles.totalValue} numberOfLines={1} adjustsFontSizeToFit>{formatCurrency(Number(selectedProduct.price) * quantity)}</Text>
                  </View>

                  <TouchableOpacity style={[styles.orderBtn, submitting && styles.orderBtnDisabled]} onPress={handleCreateOrder} disabled={submitting} activeOpacity={0.85}>
                    {submitting ? <ActivityIndicator color={colors.ink} /> : (
                      <><AppIcon name="check" size={24} /><Text style={styles.orderBtnText}>Sipariş Oluştur</Text></>
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

const createStyles = (colors: ThemeColors) => {
  const typography = makeTypography(colors);
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.appBg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  emptyText: { fontSize: 14, color: colors.faint, fontWeight: '500', textAlign: 'center' },
  tabBar: { flexDirection: 'row', backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.borderSoft, paddingHorizontal: 12, paddingTop: 8 },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: colors.gold },
  tabBtnText: { fontSize: 12, fontWeight: '700', color: colors.muted },
  tabBtnTextActive: { color: colors.gold },
  tabBadge: { backgroundColor: colors.borderSoft, borderRadius: radius.sm, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  tabBadgeActive: { backgroundColor: colors.gold },
  tabBadgeText: { fontSize: 10, fontWeight: '800', color: colors.white },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  listHeaderTitle: { fontSize: 13, fontWeight: '700', color: colors.ink },
  listHeaderCount: { fontSize: 12, color: colors.gold, fontWeight: '700' },
  categoryArea: { backgroundColor: colors.surface, paddingTop: 16, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
  searchWrap: { marginBottom: 8 },
  changeCatBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 16, paddingBottom: 8 },
  changeCatText: { fontSize: 12, color: colors.gold, fontWeight: '700' },
  detailContent: { padding: spacing.xl, paddingBottom: 40 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  backBtnText: { fontSize: 13, color: colors.gold, fontWeight: '700' },
  detailName: { fontSize: 22, fontWeight: '800', color: colors.ink, marginBottom: 4 },
  detailCat: { fontSize: 13, color: colors.muted, marginBottom: 6 },
  detailPrice: { fontSize: 22, fontWeight: '800', color: colors.gold, marginBottom: 8 },
  detailBadgeRow: { marginBottom: 20 },
  sectionLabel: { ...typography.sectionLabel, marginBottom: 10 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 20 },
  qtyBtn: { width: 48, height: 48, borderRadius: radius.lg, backgroundColor: colors.surfaceWarm, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  qtyInput: { width: 76, height: 48, borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.borderSoft, backgroundColor: colors.surfaceSoft, textAlign: 'center', fontSize: 20, fontWeight: '800', color: colors.ink },
  noteInput: { backgroundColor: colors.surfaceSoft, borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.borderSoft, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: colors.ink, minHeight: 88, textAlignVertical: 'top', marginBottom: 20 },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surfaceSoft, borderRadius: radius.lg, padding: 14, marginBottom: 16, gap: 12 },
  totalLabel: { fontSize: 14, color: colors.inkMuted, fontWeight: '700' },
  totalValue: { flex: 1, fontSize: 22, fontWeight: '900', color: colors.ink, textAlign: 'right' },
  orderBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.gold, borderRadius: radius.lg, paddingVertical: 16, minHeight: 52 },
  orderBtnDisabled: { backgroundColor: colors.faint },
  orderBtnText: { fontSize: 16, fontWeight: '800', color: colors.ink },
  });
};
