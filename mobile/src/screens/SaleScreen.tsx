import React, { useState, useCallback } from 'react';
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
import { productsApi, salesApi } from '../services/api';
import { formatCurrency } from '../utils/formatters';
import type { Product, Category } from '../types';

export default function SaleScreen() {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
    } catch {
      Alert.alert('Hata', 'Ürünler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCategoryChange = useCallback((cat: Category) => {
    setSelectedCategory(cat);
    setSelectedProduct(null);
    setModalVisible(false);
    fetchProducts(cat);
  }, [fetchProducts]);

  const handleProductPress = useCallback((product: Product) => {
    if (product.stock === 0) return;
    setSelectedProduct(product);
    setQuantity(1);
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
    Alert.alert(
      'Satışı Onayla',
      `${selectedProduct.name} ürününden ${quantity} adet satış yapılacak.\n\nToplam: ${formatCurrency(Number(selectedProduct.price) * quantity)}\n\nOnaylıyor musunuz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Satış Yap',
          style: 'default',
          onPress: async () => {
            setSubmitting(true);
            try {
              const res = await salesApi.create(selectedProduct.id, quantity);
              if (res.success) {
                Alert.alert('Başarılı', 'Satış kaydedildi!');
                setModalVisible(false);
                setSelectedProduct(null);
                if (selectedCategory) fetchProducts(selectedCategory);
              } else {
                Alert.alert('Hata', res.message ?? 'Satış kaydedilemedi.');
              }
            } catch {
              Alert.alert('Hata', 'Bağlantı hatası.');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  }, [selectedProduct, quantity, selectedCategory, fetchProducts]);

  const total = selectedProduct ? Number(selectedProduct.price) * quantity : 0;

  return (
    <View style={styles.root}>
      {/* Kategori seçimi */}
      <View style={styles.categoryArea}>
        <CategorySelector selected={selectedCategory} onChange={handleCategoryChange} />
        {selectedCategory && (
          <TouchableOpacity style={styles.changeCatBtn} onPress={() => setSelectedCategory(null)}>
            <Ionicons name="swap-horizontal-outline" size={14} color="#c9a961" />
            <Text style={styles.changeCatText}>Kategoriyi Değiştir</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Ürün listesi */}
      {!selectedCategory ? (
        <View style={styles.emptyCenter}>
          <Ionicons name="arrow-up-circle-outline" size={52} color="#ddd" />
          <Text style={styles.emptyText}>Yukarıdan bir kategori seçin</Text>
        </View>
      ) : loading ? (
        <View style={styles.emptyCenter}>
          <ActivityIndicator size="large" color="#c9a961" />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() => handleProductPress(item)}
              isSelected={selectedProduct?.id === item.id}
            />
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#c9a961']} />}
          ListEmptyComponent={
            <View style={styles.emptyCenter}>
              <Ionicons name="cube-outline" size={48} color="#ddd" />
              <Text style={styles.emptyText}>Bu kategoride ürün yok</Text>
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
            <TouchableOpacity style={styles.modalClose} onPress={() => setModalVisible(false)}>
              <Ionicons name="close-circle" size={28} color="#ccc" />
            </TouchableOpacity>

            {selectedProduct && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Ürün görseli */}
                <View style={styles.modalImageWrap}>
                  {selectedProduct.imageUrl ? (
                    <Image source={{ uri: selectedProduct.imageUrl }} style={styles.modalImage} resizeMode="cover" />
                  ) : (
                    <View style={styles.modalImagePlaceholder}>
                      <Ionicons name="flower-outline" size={60} color="#c9a961" />
                    </View>
                  )}
                </View>

                {/* Ürün bilgisi */}
                <Text style={styles.modalName}>{selectedProduct.name}</Text>
                <Text style={styles.modalCategory}>
                  {selectedProduct.category === 'WOMEN' ? 'Kadın Parfümü' : 'Erkek Parfümü'}
                </Text>
                <Text style={styles.modalPrice}>{formatCurrency(Number(selectedProduct.price))}</Text>
                <Text style={styles.modalStock}>Stok: {selectedProduct.stock} adet</Text>

                {/* Adet kontrolü */}
                <View style={styles.qtyRow}>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                  >
                    <Ionicons name="remove" size={22} color="#c9a961" />
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
                  >
                    <Ionicons name="add" size={22} color="#c9a961" />
                  </TouchableOpacity>
                </View>

                {/* Toplam */}
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Toplam</Text>
                  <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
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
                    <ActivityIndicator color="#1a1a1a" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle-outline" size={20} color="#1a1a1a" />
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'rgba(245,245,245,0.92)' },
  categoryArea: { backgroundColor: '#fff', paddingTop: 16, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  changeCatBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 16, paddingBottom: 8 },
  changeCatText: { fontSize: 12, color: '#c9a961', fontWeight: '600' },
  listContent: { paddingTop: 12, paddingBottom: 24 },
  emptyCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 14, color: '#bbb', fontWeight: '500' },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  modalClose: { alignSelf: 'flex-end', marginBottom: 8 },
  modalImageWrap: { alignItems: 'center', marginBottom: 16 },
  modalImage: { width: 140, height: 140, borderRadius: 16 },
  modalImagePlaceholder: { width: 140, height: 140, borderRadius: 16, backgroundColor: '#fdf6e3', alignItems: 'center', justifyContent: 'center' },
  modalName: { fontSize: 20, fontWeight: '800', color: '#1a1a1a', textAlign: 'center', marginBottom: 4 },
  modalCategory: { fontSize: 12, color: '#aaa', textAlign: 'center', marginBottom: 8 },
  modalPrice: { fontSize: 22, fontWeight: '700', color: '#c9a961', textAlign: 'center', marginBottom: 4 },
  modalStock: { fontSize: 13, color: '#888', textAlign: 'center', marginBottom: 20 },

  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 20 },
  qtyBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#fff8e6', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e8d5a3' },
  qtyInput: { width: 72, height: 44, borderRadius: 12, borderWidth: 1.5, borderColor: '#e0e0e0', textAlign: 'center', fontSize: 20, fontWeight: '700', color: '#1a1a1a' },

  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f9f9f9', borderRadius: 12, padding: 14, marginBottom: 16 },
  totalLabel: { fontSize: 14, color: '#888', fontWeight: '600' },
  totalValue: { fontSize: 22, fontWeight: '800', color: '#1a1a1a' },

  saleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#c9a961', borderRadius: 14, paddingVertical: 16, marginBottom: 8 },
  saleBtnDisabled: { backgroundColor: '#ddd' },
  saleBtnText: { fontSize: 16, fontWeight: '800', color: '#1a1a1a' },
});
