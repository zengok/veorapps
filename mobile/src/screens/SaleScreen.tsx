import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CategorySelector from '../components/CategorySelector';
import ProductCard from '../components/ProductCard';
import EmptyState from '../components/EmptyState';
import SearchBar from '../components/SearchBar';
import StatusBadge from '../components/StatusBadge';
import AppIcon from '../components/AppIcon';
import { productsApi, salesApi } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import { getApiErrorMessage } from '../utils/errors';
import { formatCurrency } from '../utils/formatters';
import type { Product, Category } from '../types';
import { radius, shadow, spacing, touch, type ThemeColors } from '../theme';

export default function SaleScreen() {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [customerNote, setCustomerNote] = useState('');

  const fetchProducts = useCallback(async (category: Category) => {
    setLoading(true);
    try {
      const res = await productsApi.getAll(category);
      if (res.success && res.data) {
        const sorted = [...res.data].sort((a, b) =>
          a.stock === 0 ? 1 : b.stock === 0 ? -1 : 0
        );
        setProducts(sorted);
      }
    } catch (e) {
      Alert.alert('Hata', getApiErrorMessage(e, 'Ürünler yüklenemedi.'));
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCategoryChange = useCallback((cat: Category) => {
    setSelectedCategory(cat);
    setSelectedProduct(null);
    setModalVisible(false);
    setSearchQuery('');
    fetchProducts(cat);
  }, [fetchProducts]);

  const handleProductPress = useCallback((product: Product) => {
    if (product.stock === 0) return;
    setSelectedProduct(product);
    setQuantity(1);
    setCustomerNote('');
    setModalVisible(true);
  }, []);

  const handleQuantityChange = useCallback((val: string) => {
    const n = parseInt(val, 10);
    if (isNaN(n) || n < 1) { setQuantity(1); return; }
    if (selectedProduct && n > selectedProduct.stock) { setQuantity(selectedProduct.stock); return; }
    setQuantity(n);
  }, [selectedProduct]);

  const onRefresh = useCallback(async () => {
    if (!selectedCategory) return;
    setRefreshing(true);
    await fetchProducts(selectedCategory);
    setRefreshing(false);
  }, [selectedCategory, fetchProducts]);

  const handleSale = useCallback(() => {
    if (!selectedProduct) return;
    const note = customerNote.trim();
    Alert.alert(
      'Satışı Onayla',
      `${selectedProduct.name} ürününden ${quantity} adet satış yapılacak.\n\n${note ? `Kime/Not: ${note}\n` : ''}Toplam: ${formatCurrency(Number(selectedProduct.price) * quantity)}\n\nOnaylıyor musunuz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Satış Yap',
          style: 'default',
          onPress: async () => {
            setSubmitting(true);
            try {
              const res = await salesApi.create(selectedProduct.id, quantity, note || undefined);
              if (res.success) {
                Alert.alert('Başarılı', 'Satış kaydedildi!');
                setModalVisible(false);
                setSelectedProduct(null);
                setCustomerNote('');
                if (selectedCategory) fetchProducts(selectedCategory);
              } else {
                Alert.alert('Hata', res.message ?? 'Satış kaydedilemedi.');
              }
            } catch (e) {
              Alert.alert('Hata', getApiErrorMessage(e, 'Satış kaydedilemedi.'));
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  }, [selectedProduct, quantity, customerNote, selectedCategory, fetchProducts]);

  const total = selectedProduct ? Number(selectedProduct.price) * quantity : 0;
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLocaleLowerCase('tr-TR');
    if (!q) return products;
    return products.filter((product) =>
      product.name.toLocaleLowerCase('tr-TR').includes(q)
    );
  }, [products, searchQuery]);

  return (
    <View style={styles.root}>
      {/* Kategori seçimi */}
      <View style={styles.categoryArea}>
        <CategorySelector selected={selectedCategory} onChange={handleCategoryChange} />
        {selectedCategory && (
          <>
            <View style={styles.searchWrap}>
              <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
            </View>
            <TouchableOpacity style={styles.changeCatBtn} onPress={() => setSelectedCategory(null)} hitSlop={touch.hitSlop}>
              <Ionicons name="swap-horizontal-outline" size={14} color={colors.gold} />
              <Text style={styles.changeCatText}>Kategoriyi Değiştir</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Ürün listesi */}
      {!selectedCategory ? (
        <EmptyState
          icon="arrow-up-circle-outline"
          title="Kategori seçin"
          description="Satış yapmak için önce kadın veya erkek parfüm kategorisini seçin."
        />
      ) : loading ? (
        <View style={styles.emptyCenter}>
          <ActivityIndicator size="large" color={colors.gold} />
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() => handleProductPress(item)}
              isSelected={selectedProduct?.id === item.id}
            />
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.gold]} />}
          ListEmptyComponent={
            <View style={styles.emptyCenter}>
              <EmptyState
                icon={products.length === 0 ? 'cube-outline' : 'search-outline'}
                title={products.length === 0 ? 'Bu kategoride ürün yok' : 'Arama sonucu yok'}
                description={products.length === 0 ? 'Stok ekranından ilk ürünü ekleyebilirsiniz.' : 'Ürün adını farklı bir şekilde aramayı deneyin.'}
                compact
              />
            </View>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Satış Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            {/* Kapat butonu */}
            <TouchableOpacity style={styles.modalClose} onPress={() => setModalVisible(false)} hitSlop={touch.hitSlop}>
              <Ionicons name="close-circle" size={28} color={colors.faint} />
            </TouchableOpacity>

            {selectedProduct && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Ürün görseli */}
                <View style={styles.modalImageWrap}>
                  {selectedProduct.imageUrl ? (
                    <Image source={{ uri: selectedProduct.imageUrl }} style={styles.modalImage} resizeMode="cover" />
                  ) : (
                    <View style={styles.modalImagePlaceholder}>
                    <AppIcon name="perfume" size={72} />
                    </View>
                  )}
                </View>

                {/* Ürün bilgisi */}
                <Text style={styles.modalName} numberOfLines={2}>{selectedProduct.name}</Text>
                <Text style={styles.modalCategory}>
                  {selectedProduct.category === 'WOMEN' ? 'Kadın Parfümü' : 'Erkek Parfümü'}
                </Text>
                <Text style={styles.modalPrice} numberOfLines={1} adjustsFontSizeToFit>{formatCurrency(Number(selectedProduct.price))}</Text>
                <View style={styles.modalBadgeRow}>
                  <StatusBadge tone={selectedProduct.stock <= 5 ? 'warning' : 'success'} icon="cube-outline" label={`${selectedProduct.stock} adet stok`} />
                </View>

                {/* Adet kontrolü */}
                <View style={styles.qtyRow}>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                    hitSlop={touch.hitSlop}
                  >
                    <AppIcon name="minus" size={26} />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.qtyInput}
                    value={String(quantity)}
                    onChangeText={handleQuantityChange}
                    keyboardType="number-pad"
                    selectTextOnFocus
                  />
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => setQuantity((q) => Math.min(selectedProduct.stock, q + 1))}
                    hitSlop={touch.hitSlop}
                  >
                    <AppIcon name="plus" size={26} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.inputLabel}>KİME / SATIŞ NOTU</Text>
                <TextInput
                  style={styles.noteInput}
                  value={customerNote}
                  onChangeText={setCustomerNote}
                  placeholder="Örn. Ayşe Hanım, Instagram siparişi..."
                  placeholderTextColor={colors.faint}
                  multiline
                  numberOfLines={3}
                  maxLength={300}
                  textAlignVertical="top"
                />

                {/* Toplam */}
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Toplam</Text>
                  <Text style={styles.totalValue} numberOfLines={1} adjustsFontSizeToFit>{formatCurrency(total)}</Text>
                </View>

                {/* Satış butonu */}
                <TouchableOpacity
                  style={[
                    styles.saleBtn,
                    (selectedProduct.stock === 0 || submitting) && styles.saleBtnDisabled,
                  ]}
                  onPress={handleSale}
                  disabled={selectedProduct.stock === 0 || submitting}
                  activeOpacity={0.85}
                >
                  {submitting ? (
                    <ActivityIndicator color={colors.ink} />
                  ) : (
                    <>
                      <AppIcon name="check" size={24} />
                      <Text style={styles.saleBtnText}>Satış Yap</Text>
                    </>
                  )}
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.appBg },
  categoryArea: { backgroundColor: colors.surface, paddingTop: 16, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
  searchWrap: { marginBottom: 8 },
  changeCatBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 16, paddingBottom: 8 },
  changeCatText: { fontSize: 12, color: colors.gold, fontWeight: '700' },
  listContent: { paddingTop: 12, paddingBottom: 24 },
  emptyCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 14, color: colors.faint, fontWeight: '500' },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay },
  modalSheet: { backgroundColor: colors.surface, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, padding: spacing.xxl, maxHeight: '90%', ...shadow.lifted },
  modalClose: { alignSelf: 'flex-end', marginBottom: 8, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  modalImageWrap: { alignItems: 'center', marginBottom: 16 },
  modalImage: { width: 140, height: 140, borderRadius: radius.xl },
  modalImagePlaceholder: { width: 140, height: 140, borderRadius: radius.xl, backgroundColor: colors.surfaceWarm, alignItems: 'center', justifyContent: 'center' },
  modalName: { fontSize: 20, fontWeight: '800', color: colors.ink, textAlign: 'center', marginBottom: 4 },
  modalCategory: { fontSize: 12, color: colors.muted, textAlign: 'center', marginBottom: 8 },
  modalPrice: { fontSize: 22, fontWeight: '800', color: colors.gold, textAlign: 'center', marginBottom: 8 },
  modalBadgeRow: { alignItems: 'center', marginBottom: 20 },

  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 20 },
  qtyBtn: { width: 48, height: 48, borderRadius: radius.lg, backgroundColor: colors.surfaceWarm, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  qtyInput: { width: 76, height: 48, borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.borderSoft, backgroundColor: colors.surfaceSoft, textAlign: 'center', fontSize: 20, fontWeight: '800', color: colors.ink },
  inputLabel: { fontSize: 10, fontWeight: '800', color: colors.muted, letterSpacing: 1.2, marginBottom: 8 },
  noteInput: { backgroundColor: colors.surfaceSoft, borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.borderSoft, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: colors.ink, minHeight: 88, marginBottom: 16 },

  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surfaceSoft, borderRadius: radius.lg, padding: 14, marginBottom: 16, gap: 12 },
  totalLabel: { fontSize: 14, color: colors.inkMuted, fontWeight: '700' },
  totalValue: { flex: 1, fontSize: 22, fontWeight: '900', color: colors.ink, textAlign: 'right' },

  saleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.gold, borderRadius: radius.lg, paddingVertical: 16, marginBottom: 8, minHeight: 52 },
  saleBtnDisabled: { backgroundColor: colors.faint },
  saleBtnText: { fontSize: 16, fontWeight: '800', color: colors.ink },
});
