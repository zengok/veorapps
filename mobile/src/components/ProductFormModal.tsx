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
import { getApiErrorMessage } from '../utils/errors';
import type { Product, Category } from '../types';
import { makeTypography, radius, shadow, spacing, touch, type ThemeColors } from '../theme';
import { useTheme } from '../contexts/ThemeContext';
import AppIcon from './AppIcon';

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
  const { colors } = useTheme();
  const styles = createStyles(colors);
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
      } else if (product?.imageUrl && !form.imageUri) {
        formData.append('removeImage', 'true');
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
    } catch (e) {
      Alert.alert('Hata', getApiErrorMessage(e, 'İşlem başarısız.'));
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
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} disabled={loading} hitSlop={touch.hitSlop}>
              <Ionicons name="close-circle" size={28} color={colors.faint} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Görsel seçici */}
            <View style={styles.imageSection}>
              <TouchableOpacity style={styles.imagePicker} onPress={pickImage} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel="Ürün görseli seç">
                {form.imageUri ? (
                  <Image source={{ uri: form.imageUri }} style={styles.imagePreview} resizeMode="cover" />
                ) : (
                  <View style={styles.imageEmpty}>
                    <AppIcon name="upload" size={42} />
                    <Text style={styles.imageEmptyText}>Galeriden Seç</Text>
                  </View>
                )}
              </TouchableOpacity>
              {form.imageUri && (
                <TouchableOpacity style={styles.removeImage} onPress={() => setForm((p) => ({ ...p, imageUri: null }))} hitSlop={touch.hitSlop}>
                  <Ionicons name="close-circle" size={24} color={colors.red} />
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
                placeholderTextColor={colors.faint}
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
                  placeholderTextColor={colors.faint}
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
                  placeholderTextColor={colors.faint}
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
                  <ActivityIndicator color={colors.black} size="small" />
                ) : (
                  <>
                  <AppIcon name="check" size={22} />
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

const createStyles = (colors: ThemeColors) => {
  const typography = makeTypography(colors);
  return StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    padding: spacing.xxl,
    maxHeight: '92%',
    ...shadow.lifted,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: colors.ink },
  closeBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },

  imageSection: { alignItems: 'center', marginBottom: spacing.xl, position: 'relative' },
  imagePicker: {
    width: 120,
    height: 120,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  imagePreview: { width: 120, height: 120 },
  imageEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceWarm },
  imageEmptyText: { fontSize: 11, color: colors.gold, fontWeight: '700', marginTop: 6 },
  removeImage: {
    position: 'absolute',
    top: -10,
    right: '26%',
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  field: { marginBottom: spacing.lg },
  label: { ...typography.sectionLabel, marginBottom: 6 },
  input: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.borderSoft,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.ink,
  },
  inputError: { borderColor: colors.red, backgroundColor: colors.redBg },
  errorText: { fontSize: 11, color: colors.red, marginTop: 4, fontWeight: '700' },

  row2: { flexDirection: 'row', alignItems: 'flex-start' },

  btnRow: { flexDirection: 'row', gap: 12, marginTop: 8, marginBottom: 16 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.borderSoft,
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 15, fontWeight: '700', color: colors.inkMuted },
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.gold,
  },
  saveBtnDisabled: { backgroundColor: colors.faint },
  saveBtnText: { fontSize: 15, fontWeight: '800', color: colors.ink },
  });
};
