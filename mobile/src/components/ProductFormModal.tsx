import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import CategorySelector from './CategorySelector';
import { productsApi } from '../services/api';
import type { Product, Category } from '../types';

interface Props {
  visible: boolean;
  product: Product | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormState {
  name: string;
  category: Category | null;
  price: string;
  stock: string;
  imageUri: string | null;
}

const EMPTY_FORM: FormState = {
  name: '',
  category: null,
  price: '',
  stock: '',
  imageUri: null,
};

export default function ProductFormModal({ visible, product, onClose, onSuccess }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const isEditing = product != null;

  // Form'u ürünle doldur (düzenleme modu)
  useEffect(() => {
    if (visible) {
      if (product) {
        setForm({
          name: product.name,
          category: product.category,
          price: String(product.price).replace('.', ','),
          stock: String(product.stock),
          imageUri: product.imageUrl ?? null,
        });
      } else {
        setForm(EMPTY_FORM);
      }
      setErrors({});
    }
  }, [visible, product]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Galeri erişimi için izin vermeniz gerekiyor.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: false,
    });
    if (!result.canceled && result.assets.length > 0) {
      setForm((prev) => ({ ...prev, imageUri: result.assets[0].uri }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) newErrors.name = 'Ürün adı zorunludur';
    if (!form.category) newErrors.category = 'Kategori seçiniz';
    const priceVal = parseFloat(form.price.replace(',', '.'));
    if (!form.price || isNaN(priceVal) || priceVal <= 0) newErrors.price = 'Geçerli bir fiyat giriniz';
    const stockVal = parseInt(form.stock, 10);
    if (!form.stock || isNaN(stockVal) || stockVal < 0) newErrors.stock = 'Geçerli bir stok miktarı giriniz';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', form.name.trim());
      formData.append('category', form.category!);
      formData.append('price', String(parseFloat(form.price.replace(',', '.'))));
      formData.append('stock', String(parseInt(form.stock, 10)));

      // Yeni görsel seçildiyse ekle (mevcut URL'den farklıysa)
      const isNewImage = form.imageUri && (!product?.imageUrl || form.imageUri !== product.imageUrl);
      if (isNewImage && form.imageUri) {
        const uriParts = form.imageUri.split('.');
        const fileType = uriParts[uriParts.length - 1];
        formData.append('image', {
          uri: form.imageUri,
          name: `product_${Date.now()}.${fileType}`,
          type: `image/${fileType}`,
        } as any);
      }

      let res;
      if (isEditing && product) {
        res = await productsApi.update(product.id, formData);
      } else {
        res = await productsApi.create(formData);
      }

      if (res.success) {
        Alert.alert('Başarılı', isEditing ? 'Ürün güncellendi.' : 'Ürün oluşturuldu.');
        onSuccess();
        onClose();
      } else {
        Alert.alert('Hata', res.message ?? 'İşlem başarısız.');
      }
    } catch (e: any) {
      Alert.alert('Hata', e?.response?.data?.message ?? 'Bağlantı hatası.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.sheet}>
          {/* Başlık */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{isEditing ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}</Text>
            <TouchableOpacity onPress={onClose} disabled={loading}>
              <Ionicons name="close-circle" size={28} color="#ccc" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Görsel seçici */}
            <View style={styles.imageSection}>
              <TouchableOpacity style={styles.imagePicker} onPress={pickImage} activeOpacity={0.8}>
                {form.imageUri ? (
                  <Image source={{ uri: form.imageUri }} style={styles.imagePreview} resizeMode="cover" />
                ) : (
                  <View style={styles.imageEmpty}>
                    <Ionicons name="camera-outline" size={36} color="#c9a961" />
                    <Text style={styles.imageEmptyText}>Galeriden Seç</Text>
                  </View>
                )}
              </TouchableOpacity>
              {form.imageUri && (
                <TouchableOpacity style={styles.removeImage} onPress={() => setForm((p) => ({ ...p, imageUri: null }))}>
                  <Ionicons name="close-circle" size={22} color="#d32f2f" />
                </TouchableOpacity>
              )}
            </View>

            {/* Ürün Adı */}
            <View style={styles.field}>
              <Text style={styles.label}>Ürün Adı *</Text>
              <TextInput
                style={[styles.input, errors.name ? styles.inputError : null]}
                value={form.name}
                onChangeText={(v) => setForm((p) => ({ ...p, name: v }))}
                placeholder="Parfüm adını giriniz"
                placeholderTextColor="#ccc"
                maxLength={100}
              />
              {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
            </View>

            {/* Kategori */}
            <View style={styles.field}>
              <Text style={styles.label}>Kategori *</Text>
              <CategorySelector
                selected={form.category}
                onChange={(cat) => setForm((p) => ({ ...p, category: cat }))}
              />
              {errors.category ? <Text style={[styles.errorText, { marginTop: 4 }]}>{errors.category}</Text> : null}
            </View>

            {/* Fiyat + Stok yan yana */}
            <View style={styles.row2}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>Fiyat (₺) *</Text>
                <TextInput
                  style={[styles.input, errors.price ? styles.inputError : null]}
                  value={form.price}
                  onChangeText={(v) => setForm((p) => ({ ...p, price: v }))}
                  placeholder="0,00"
                  placeholderTextColor="#ccc"
                  keyboardType="decimal-pad"
                />
                {errors.price ? <Text style={styles.errorText}>{errors.price}</Text> : null}
              </View>
              <View style={{ width: 12 }} />
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>Stok (adet) *</Text>
                <TextInput
                  style={[styles.input, errors.stock ? styles.inputError : null]}
                  value={form.stock}
                  onChangeText={(v) => setForm((p) => ({ ...p, stock: v }))}
                  placeholder="0"
                  placeholderTextColor="#ccc"
                  keyboardType="number-pad"
                />
                {errors.stock ? <Text style={styles.errorText}>{errors.stock}</Text> : null}
              </View>
            </View>

            {/* Butonlar */}
            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={loading} activeOpacity={0.8}>
                <Text style={styles.cancelBtnText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#1a1a1a" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark-outline" size={18} color="#1a1a1a" />
                    <Text style={styles.saveBtnText}>Kaydet</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '92%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1a1a1a' },

  imageSection: { alignItems: 'center', marginBottom: 20, position: 'relative' },
  imagePicker: {
    width: 120,
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#e8d5a3',
    borderStyle: 'dashed',
  },
  imagePreview: { width: 120, height: 120 },
  imageEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fdf6e3' },
  imageEmptyText: { fontSize: 11, color: '#c9a961', fontWeight: '600', marginTop: 6 },
  removeImage: { position: 'absolute', top: -6, right: '28%' },

  field: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '700', color: '#888', marginBottom: 6, letterSpacing: 0.5 },
  input: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1a1a1a',
  },
  inputError: { borderColor: '#d32f2f' },
  errorText: { fontSize: 11, color: '#d32f2f', marginTop: 4, fontWeight: '500' },

  row2: { flexDirection: 'row', alignItems: 'flex-start' },

  btnRow: { flexDirection: 'row', gap: 12, marginTop: 8, marginBottom: 16 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 15, fontWeight: '700', color: '#888' },
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#c9a961',
  },
  saveBtnDisabled: { backgroundColor: '#ddd' },
  saveBtnText: { fontSize: 15, fontWeight: '800', color: '#1a1a1a' },
});
