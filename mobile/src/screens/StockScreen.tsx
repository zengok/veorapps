import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl,
  TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CategorySelector from '../components/CategorySelector';
import StockProductCard from '../components/StockProductCard';
import ProductFormModal from '../components/ProductFormModal';
import { productsApi } from '../services/api';
import type { Product, Category } from '../types';

export default function StockScreen() {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const fetchProducts = useCallback(async (category: Category) => {
    setLoading(true);
    try {
      const res = await productsApi.getAll(category);
      if (res.success && res.data) setProducts(res.data);
    } catch { Alert.alert('Hata', 'Ürünler yüklenemedi.'); }
    finally { setLoading(false); }
  }, []);

  const handleCategoryChange = useCallback((cat: Category) => {
    setSelectedCategory(cat);
    fetchProducts(cat);
  }, [fetchProducts]);

  const onRefresh = useCallback(async () => {
    if (!selectedCategory) return;
    setRefreshing(true);
    await fetchProducts(selectedCategory);
    setRefreshing(false);
  }, [selectedCategory, fetchProducts]);

  const handleEdit = useCallback((product: Product) => {
    setEditingProduct(product);
    setModalVisible(true);
  }, []);

  const handleNewProduct = useCallback(() => {
    setEditingProduct(null);
    setModalVisible(true);
  }, []);

  const handleDelete = useCallback((product: Product) => {
    Alert.alert(
      'Ürünü Sil',
      `"${product.name}" ürününü silmek istediğinizden emin misiniz?\nBu işlem geri alınamaz.`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await productsApi.delete(product.id);
              if (res.success) {
                setProducts((prev) => prev.filter((p) => p.id !== product.id));
              } else Alert.alert('Hata', res.message ?? 'Silme başarısız.');
            } catch { Alert.alert('Hata', 'Bağlantı hatası.'); }
          },
        },
      ]
    );
  }, []);

  const handleFormSuccess = useCallback(() => {
    if (selectedCategory) fetchProducts(selectedCategory);
  }, [selectedCategory, fetchProducts]);

  return (
    <View style={styles.root}>
      {/* Üst bar: kategori + yeni ürün butonu */}
      <View style={styles.topBar}>
        <View style={styles.categoryWrap}>
          <CategorySelector selected={selectedCategory} onChange={handleCategoryChange} />
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={handleNewProduct} activeOpacity={0.85}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.addBtnText}>Yeni Ürün</Text>
        </TouchableOpacity>
      </View>

      {/* İçerik */}
      {!selectedCategory ? (
        <View style={styles.center}>
          <Ionicons name="grid-outline" size={52} color="#ddd" />
          <Text style={styles.emptyText}>Ürünleri görmek için kategori seçin</Text>
        </View>
      ) : loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#c9a961" /></View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => (
            <StockProductCard product={item} onEdit={handleEdit} onDelete={handleDelete} />
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#c9a961']} />}
          ListHeaderComponent={
            products.length > 0 ? (
              <View style={styles.listHeader}>
                <Text style={styles.listHeaderTitle}>
                  {selectedCategory === 'WOMEN' ? 'Kadın' : 'Erkek'} Parfümleri
                </Text>
                <Text style={styles.listHeaderCount}>{products.length} ürün</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="cube-outline" size={52} color="#ddd" />
              <Text style={styles.emptyText}>Bu kategoride ürün bulunamadı</Text>
              <TouchableOpacity style={styles.addFirstBtn} onPress={handleNewProduct}>
                <Ionicons name="add-circle-outline" size={16} color="#c9a961" />
                <Text style={styles.addFirstBtnText}>İlk ürünü ekle</Text>
              </TouchableOpacity>
            </View>
          }
          contentContainerStyle={products.length === 0 ? { flex: 1 } : { paddingBottom: 24, paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Form modal */}
      <ProductFormModal
        visible={modalVisible}
        product={editingProduct}
        onClose={() => { setModalVisible(false); setEditingProduct(null); }}
        onSuccess={handleFormSuccess}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f5f5' },
  topBar: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 12,
  },
  categoryWrap: { paddingTop: 16 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2e7d32',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: 'flex-end',
    marginHorizontal: 16,
    marginTop: 4,
  },
  addBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  emptyText: { fontSize: 14, color: '#bbb', fontWeight: '500', textAlign: 'center' },
  addFirstBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  addFirstBtnText: { fontSize: 14, color: '#c9a961', fontWeight: '600' },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  listHeaderTitle: { fontSize: 14, fontWeight: '700', color: '#1a1a1a' },
  listHeaderCount: { fontSize: 12, color: '#c9a961', fontWeight: '600' },
});
