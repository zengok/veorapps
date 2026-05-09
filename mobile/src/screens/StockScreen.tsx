import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl,
  TouchableOpacity, Alert, ActivityIndicator, Modal, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CategorySelector from '../components/CategorySelector';
import StockProductCard from '../components/StockProductCard';
import ProductFormModal from '../components/ProductFormModal';
import { productsApi, importApi } from '../services/api';
import { pickAndParseExcel } from '../utils/excelImport';
import type { Product, Category } from '../types';

export default function StockScreen() {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Excel import state
  const [importing, setImporting] = useState(false);
  const [importResultVisible, setImportResultVisible] = useState(false);
  const [importResult, setImportResult] = useState<{
    created: number; updated: number; total: number; errors?: string[];
  } | null>(null);

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

  // ── Excel Import ─────────────────────────────────────────────────────────────
  const handleExcelImport = useCallback(async () => {
    try {
      setImporting(true);
      const parsed = await pickAndParseExcel();

      if (!parsed) {
        setImporting(false);
        return; // kullanıcı iptal etti
      }

      if (parsed.totalRows === 0) {
        setImporting(false);
        Alert.alert('Uyarı', 'Excel dosyası boş görünüyor.');
        return;
      }

      // Kategorisiz satırlar varsa kullanıcıya sor
      let uncatCategory: 'WOMEN' | 'MEN' | null = null;
      if (parsed.uncategorized.length > 0) {
        await new Promise<void>((resolve) => {
          Alert.alert(
            'Kategori Belirtilmemiş',
            `${parsed.uncategorized.length} satırda kategori bulunamadı.\nBu satırları hangi kategoriye ekleyelim?`,
            [
              {
                text: 'Kadın Parfümü',
                onPress: () => { uncatCategory = 'WOMEN'; resolve(); },
              },
              {
                text: 'Erkek Parfümü',
                onPress: () => { uncatCategory = 'MEN'; resolve(); },
              },
              {
                text: 'Atla',
                style: 'cancel',
                onPress: () => resolve(),
              },
            ]
          );
        });
      }

      let totalCreated = 0;
      let totalUpdated = 0;
      const allErrors: string[] = [];

      // Kadın parfümleri gönder
      if (parsed.women.length > 0) {
        const res = await importApi.fromExcel(parsed.women, 'WOMEN');
        if (res.success && res.data) {
          totalCreated += res.data.created;
          totalUpdated += res.data.updated;
          if (res.data.errors) allErrors.push(...res.data.errors);
        }
      }

      // Erkek parfümleri gönder
      if (parsed.men.length > 0) {
        const res = await importApi.fromExcel(parsed.men, 'MEN');
        if (res.success && res.data) {
          totalCreated += res.data.created;
          totalUpdated += res.data.updated;
          if (res.data.errors) allErrors.push(...res.data.errors);
        }
      }

      // Kategorisiz ama kullanıcı seçtiyse
      if (parsed.uncategorized.length > 0 && uncatCategory) {
        const res = await importApi.fromExcel(parsed.uncategorized, uncatCategory);
        if (res.success && res.data) {
          totalCreated += res.data.created;
          totalUpdated += res.data.updated;
          if (res.data.errors) allErrors.push(...res.data.errors);
        }
      }

      setImportResult({
        created: totalCreated,
        updated: totalUpdated,
        total: totalCreated + totalUpdated,
        errors: allErrors.length > 0 ? allErrors : undefined,
      });
      setImportResultVisible(true);

      // Stok listesini yenile
      if (selectedCategory) fetchProducts(selectedCategory);

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Excel okunamadı.';
      Alert.alert('Hata', msg);
    } finally {
      setImporting(false);
    }
  }, [selectedCategory, fetchProducts]);

  return (
    <View style={styles.root}>
      {/* Üst bar: kategori + butonlar */}
      <View style={styles.topBar}>
        <View style={styles.categoryWrap}>
          <CategorySelector selected={selectedCategory} onChange={handleCategoryChange} />
        </View>
        <View style={styles.btnRow}>
          {/* Excel yükle butonu */}
          <TouchableOpacity
            style={[styles.excelBtn, importing && styles.btnDisabled]}
            onPress={handleExcelImport}
            activeOpacity={0.85}
            disabled={importing}
          >
            {importing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="document-attach-outline" size={16} color="#fff" />
                <Text style={styles.excelBtnText}>Excel Yükle</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Yeni ürün butonu */}
          <TouchableOpacity style={styles.addBtn} onPress={handleNewProduct} activeOpacity={0.85}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.addBtnText}>Yeni Ürün</Text>
          </TouchableOpacity>
        </View>
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

      {/* Excel Import Sonuç Modal */}
      <Modal
        visible={importResultVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setImportResultVisible(false)}
      >
        <View style={styles.resultOverlay}>
          <View style={styles.resultSheet}>
            <View style={styles.resultIconWrap}>
              <Ionicons name="checkmark-circle" size={56} color="#2e7d32" />
            </View>
            <Text style={styles.resultTitle}>Excel İçe Aktarıldı!</Text>

            <View style={styles.resultStats}>
              <View style={styles.statItem}>
                <Text style={styles.statNum}>{importResult?.created ?? 0}</Text>
                <Text style={styles.statLabel}>Yeni Ürün</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNum}>{importResult?.updated ?? 0}</Text>
                <Text style={styles.statLabel}>Güncellendi</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNum}>{importResult?.total ?? 0}</Text>
                <Text style={styles.statLabel}>Toplam</Text>
              </View>
            </View>

            {importResult?.errors && importResult.errors.length > 0 && (
              <View style={styles.errorBox}>
                <Text style={styles.errorTitle}>⚠️ Bazı satırlarda hata oluştu:</Text>
                <ScrollView style={{ maxHeight: 80 }}>
                  {importResult.errors.map((e, i) => (
                    <Text key={i} style={styles.errorText}>{e}</Text>
                  ))}
                </ScrollView>
              </View>
            )}

            <TouchableOpacity
              style={styles.resultCloseBtn}
              onPress={() => setImportResultVisible(false)}
            >
              <Text style={styles.resultCloseBtnText}>Tamam</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'rgba(245,245,245,0.92)' },
  topBar: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 12,
  },
  categoryWrap: { paddingTop: 16 },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 8,
    justifyContent: 'flex-end',
  },
  excelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#1565c0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  excelBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  btnDisabled: { opacity: 0.5 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2e7d32',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  addBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  emptyText: { fontSize: 14, color: '#bbb', fontWeight: '500', textAlign: 'center' },
  addFirstBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  addFirstBtnText: { fontSize: 14, color: '#c9a961', fontWeight: '600' },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  listHeaderTitle: { fontSize: 14, fontWeight: '700', color: '#1a1a1a' },
  listHeaderCount: { fontSize: 12, color: '#c9a961', fontWeight: '600' },

  // Import result modal
  resultOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  resultSheet: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  resultIconWrap: { marginBottom: 12 },
  resultTitle: { fontSize: 20, fontWeight: '800', color: '#1a1a1a', marginBottom: 20 },
  resultStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    width: '100%',
    marginBottom: 20,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 26, fontWeight: '900', color: '#1a1a1a' },
  statLabel: { fontSize: 11, color: '#888', fontWeight: '600', marginTop: 2 },
  statDivider: { width: 1, height: 40, backgroundColor: '#e0e0e0' },
  errorBox: {
    backgroundColor: '#fff3e0',
    borderRadius: 10,
    padding: 12,
    width: '100%',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ffcc80',
  },
  errorTitle: { fontSize: 12, fontWeight: '700', color: '#e65100', marginBottom: 4 },
  errorText: { fontSize: 11, color: '#bf360c', lineHeight: 16 },
  resultCloseBtn: {
    backgroundColor: '#c9a961',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 40,
  },
  resultCloseBtnText: { fontSize: 15, fontWeight: '800', color: '#1a1a1a' },
});
