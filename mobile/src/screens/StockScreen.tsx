import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl,
  TouchableOpacity, Alert, ActivityIndicator, Modal, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CategorySelector from '../components/CategorySelector';
import StockProductCard from '../components/StockProductCard';
import ProductFormModal from '../components/ProductFormModal';
import EmptyState from '../components/EmptyState';
import SearchBar from '../components/SearchBar';
import AppIcon from '../components/AppIcon';
import { productsApi, importApi } from '../services/api';
import { pickAndParseExcel } from '../utils/excelImport';
import { getApiErrorMessage } from '../utils/errors';
import type { Product, Category } from '../types';
import { radius, shadow, spacing, touch, type ThemeColors } from '../theme';
import { useTheme } from '../contexts/ThemeContext';

export default function StockScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Excel import state
  const [importing, setImporting] = useState(false);
  const [importResultVisible, setImportResultVisible] = useState(false);
  const [importResult, setImportResult] = useState<{
    created: number; updated: number; total: number; skipped?: number; errors?: string[];
  } | null>(null);

  const fetchProducts = useCallback(async (category: Category) => {
    setLoading(true);
    try {
      const res = await productsApi.getAll(category);
      if (res.success && res.data) setProducts(res.data);
    } catch (e) { Alert.alert('Hata', getApiErrorMessage(e, 'Ürünler yüklenemedi.')); }
    finally { setLoading(false); }
  }, []);

  const handleCategoryChange = useCallback((cat: Category) => {
    setSelectedCategory(cat);
    setSearchQuery('');
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
            } catch (e) { Alert.alert('Hata', getApiErrorMessage(e, 'Silme başarısız.')); }
          },
        },
      ]
    );
  }, []);

  const handleFormSuccess = useCallback(() => {
    if (selectedCategory) fetchProducts(selectedCategory);
  }, [selectedCategory, fetchProducts]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLocaleLowerCase('tr-TR');
    if (!q) return products;
    return products.filter((product) =>
      product.name.toLocaleLowerCase('tr-TR').includes(q)
    );
  }, [products, searchQuery]);

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
      let totalSkipped = 0;
      const allErrors: string[] = [];

      // Kadın parfümleri gönder
      if (parsed.women.length > 0) {
        const res = await importApi.fromExcel(parsed.women, 'WOMEN');
        if (res.success && res.data) {
          totalCreated += res.data.created;
          totalUpdated += res.data.updated;
          totalSkipped += res.data.skipped ?? 0;
          if (res.data.errors) allErrors.push(...res.data.errors);
        }
      }

      // Erkek parfümleri gönder
      if (parsed.men.length > 0) {
        const res = await importApi.fromExcel(parsed.men, 'MEN');
        if (res.success && res.data) {
          totalCreated += res.data.created;
          totalUpdated += res.data.updated;
          totalSkipped += res.data.skipped ?? 0;
          if (res.data.errors) allErrors.push(...res.data.errors);
        }
      }

      // Kategorisiz ama kullanıcı seçtiyse
      if (parsed.uncategorized.length > 0 && uncatCategory) {
        const res = await importApi.fromExcel(parsed.uncategorized, uncatCategory);
        if (res.success && res.data) {
          totalCreated += res.data.created;
          totalUpdated += res.data.updated;
          totalSkipped += res.data.skipped ?? 0;
          if (res.data.errors) allErrors.push(...res.data.errors);
        }
      }

      setImportResult({
        created: totalCreated,
        updated: totalUpdated,
        total: totalCreated + totalUpdated,
        skipped: totalSkipped,
        errors: allErrors.length > 0 ? allErrors : undefined,
      });
      setImportResultVisible(true);

      // Stok listesini yenile
      if (selectedCategory) fetchProducts(selectedCategory);

    } catch (err: unknown) {
      Alert.alert('Hata', getApiErrorMessage(err, 'Excel okunamadı.'));
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
        {selectedCategory && (
          <View style={styles.searchWrap}>
            <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
          </View>
        )}
        <View style={styles.btnRow}>
          {/* Excel yükle butonu */}
          <TouchableOpacity
            style={[styles.excelBtn, importing && styles.btnDisabled]}
            onPress={handleExcelImport}
            activeOpacity={0.85}
            disabled={importing}
            hitSlop={touch.hitSlop}
          >
            {importing ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <AppIcon name="upload" size={22} />
                <Text style={styles.excelBtnText}>Excel Yükle</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Yeni ürün butonu */}
          <TouchableOpacity style={styles.addBtn} onPress={handleNewProduct} activeOpacity={0.85} hitSlop={touch.hitSlop}>
            <AppIcon name="add" size={22} />
            <Text style={styles.addBtnText}>Yeni Ürün</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* İçerik */}
      {!selectedCategory ? (
        <View style={styles.center}>
          <EmptyState
            icon="grid-outline"
            title="Kategori seçin"
            description="Stok listesini yönetmek için kadın veya erkek parfüm kategorisini seçin."
          />
        </View>
      ) : loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.gold} /></View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => (
            <StockProductCard product={item} onEdit={handleEdit} onDelete={handleDelete} />
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.gold]} />}
          ListHeaderComponent={
            filteredProducts.length > 0 ? (
              <View style={styles.listHeader}>
                <Text style={styles.listHeaderTitle}>
                  {selectedCategory === 'WOMEN' ? 'Kadın' : 'Erkek'} Parfümleri
                </Text>
                <Text style={styles.listHeaderCount}>
                  {filteredProducts.length}{searchQuery ? ` / ${products.length}` : ''} ürün
                </Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <EmptyState
                icon={products.length === 0 ? 'cube-outline' : 'search-outline'}
                title={products.length === 0 ? 'Bu kategoride ürün bulunamadı' : 'Arama sonucu yok'}
                description={products.length === 0 ? 'İlk ürünü ekleyerek stok listesini oluşturun.' : 'Ürün adını farklı bir şekilde aramayı deneyin.'}
                compact
              />
              <TouchableOpacity style={styles.addFirstBtn} onPress={handleNewProduct} hitSlop={touch.hitSlop}>
                <AppIcon name="add" size={20} />
                <Text style={styles.addFirstBtnText}>İlk ürünü ekle</Text>
              </TouchableOpacity>
            </View>
          }
          contentContainerStyle={filteredProducts.length === 0 ? { flex: 1 } : { paddingBottom: 24, paddingTop: 8 }}
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
              <Ionicons name="checkmark-circle" size={56} color={colors.green} />
            </View>
            <Text style={styles.resultTitle} numberOfLines={2}>Excel İçe Aktarıldı!</Text>

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

            {(importResult?.skipped ?? 0) > 0 && (
              <Text style={styles.skippedText}>
                {importResult?.skipped} satır ürün adı bulunamadığı için atlandı.
              </Text>
            )}

            {importResult?.errors && importResult.errors.length > 0 && (
              <View style={styles.errorBox}>
                <Text style={styles.errorTitle}>Bazı satırlarda hata oluştu:</Text>
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
              hitSlop={touch.hitSlop}
            >
              <Text style={styles.resultCloseBtnText}>Tamam</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.appBg },
  topBar: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
    paddingBottom: 12,
  },
  categoryWrap: { paddingTop: 16 },
  searchWrap: { marginTop: 6 },
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
    backgroundColor: colors.mode === 'dark' ? 'transparent' : colors.blue,
    borderWidth: colors.mode === 'dark' ? 1.5 : 0,
    borderColor: colors.gold,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  excelBtnText: { fontSize: 12, fontWeight: '800', color: colors.mode === 'dark' ? colors.ink : '#ffffff' },
  btnDisabled: { opacity: 0.5 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.gold,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  addBtnText: { fontSize: 13, fontWeight: '800', color: colors.black },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  emptyText: { fontSize: 14, color: colors.faint, fontWeight: '500', textAlign: 'center' },
  addFirstBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  addFirstBtnText: { fontSize: 14, color: colors.gold, fontWeight: '700' },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  listHeaderTitle: { fontSize: 14, fontWeight: '700', color: colors.ink },
  listHeaderCount: { fontSize: 12, color: colors.gold, fontWeight: '700' },

  // Import result modal
  resultOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  resultSheet: {
    backgroundColor: colors.surface,
    borderRadius: radius.sheet,
    padding: 28,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    ...shadow.lifted,
  },
  resultIconWrap: { marginBottom: 12 },
  resultTitle: { fontSize: 20, fontWeight: '800', color: colors.ink, marginBottom: 20 },
  resultStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.xl,
    paddingVertical: 16,
    paddingHorizontal: 12,
    width: '100%',
    marginBottom: 20,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 26, fontWeight: '900', color: colors.ink },
  statLabel: { fontSize: 11, color: colors.inkMuted, fontWeight: '700', marginTop: 2 },
  statDivider: { width: 1, height: 40, backgroundColor: colors.borderSoft },
  skippedText: {
    width: '100%',
    color: colors.inkMuted,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: -8,
    marginBottom: 16,
  },
  errorBox: {
    backgroundColor: colors.orangeBg,
    borderRadius: radius.md,
    padding: 12,
    width: '100%',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.orange,
  },
  errorTitle: { fontSize: 12, fontWeight: '800', color: colors.orange, marginBottom: 4 },
  errorText: { fontSize: 11, color: colors.orange, lineHeight: 16 },
  resultCloseBtn: {
    backgroundColor: colors.gold,
    borderRadius: radius.lg,
    paddingVertical: 14,
    paddingHorizontal: 40,
  },
  resultCloseBtnText: { fontSize: 15, fontWeight: '800', color: colors.ink },
});
