import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, RefreshControl, ImageBackground, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';

const PERFUME_IMAGES = [
  'https://lh3.googleusercontent.com/aida/ADBb0ujLsuzzGz_4KXJ3sI4QFGU5iXxu9BQw30Bmu9XLiFB73L_hmiaXfxmp8gt4snpN9jgZlHtuElWCbmLA2BzRJQbg1O2mCuBWIecw3QKZV-APIUn4XzKF_DKwuzyIiednEahkLvx2fWf4qiGQZNaNM5T0LQCxPY58Dk6tEn579KISjsKisxX0l42Vim7NqDBHvyTTvY3qDkOBKQPUujqvFqDhzc97xYhXTw5RuOahjcD7-I7yiWONpBlvAX4fE2PDJIdFJCgF5u2myPg',
  'https://lh3.googleusercontent.com/aida/ADBb0ugMKckYpnYlMTUc7B3KAR6kDbmII5TA19CAledQrec4JdBfsH4TFgNyqPSykJyH2C0LsbZajeCdax4SPedCNdn7qIuzxf1DqySx_t4FelbIc4XMioG5c6jH5qNNNW3UuoK75jrh1vKcQuHJYNVl3zsG2MDvgsvj7UGuPDSPk4pYwQoriVlyBjY2JoGPpRS9aXDidB3Z26urHLh4YFI4yr_wdKsqGQWN1J4v09stfSq34VCFaA6_pRe_ZSc3',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuC2tZKcKcGFa8d9BnNT4B3RUUsI9jO0yULQcUyQ94d340w1somdKuyYtXCZq0NgCuvy_Z4ruV8fAqYePUgxgjvISERsuC_yfmrn3fhQ-yH5BCsd_QGRPGc7tP3YfoAOOcnJEaKf6EwV9dJDjpuCw2gic8lflGntxhGWCLqmgPPGCQcWsgFnycBFEI_cDTBUNGry6GC-zuBmP63681AQkRSZvDLD5Xypk8Di4BV2fIc63Wdm16epWKg3txxShwpXKuVq17z83X-TjxfH',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBgHsJ71K_ZTEYMD_OqPDkueJ3_SU3Hs8QN3MP97k6ge0taukbtSJxWJMHZz4l7L_CaA_d2S4rv7HndJP_maOb0QOJmB2pq0ujbMuPND4Sc4j8grtKOvWXC92Rdi9g-ZGqzBM2ShiQbYHjmtm6hkmer0_lY3iblwZxs90jzeU8ugye6U8fH5WZT9S8iCnKdc7dpvWBOsP-dVEkZYnra1Js1yKF-7RNuEecEi7lc_ozhmXBB7-MGtevOoPu1nPMMz0guVP5jxHceUrVq'
];

export default function InventoryScreen() {
  const [products, setProducts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newStock, setNewStock] = useState('');

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProducts();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  };

  const handleUpdateStock = async (id) => {
    const stockVal = parseInt(newStock, 10);
    if (isNaN(stockVal) || stockVal < 0) {
      Alert.alert('Hata', 'Geçerli bir stok değeri giriniz.');
      return;
    }
    try {
      await api.put(`/products/${id}/stock`, { stock: stockVal });
      setEditingId(null);
      setNewStock('');
      await fetchProducts();
    } catch (error) {
      Alert.alert('Hata', 'Stok güncellenemedi.');
    }
  };

  const renderItem = ({ item, index }) => {
    const imageUrl = PERFUME_IMAGES[index % PERFUME_IMAGES.length];
    
    return (
      <View style={styles.cardContainer}>
        <View style={styles.glassSurface}>
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUrl }} style={styles.productImage} />
            <View style={styles.stockBadge}>
              <View style={[styles.stockDot, item.stock < 10 ? styles.dotRed : styles.dotGreen]} />
              <Text style={[styles.stockBadgeText, item.stock < 10 && styles.textRed]}>
                {item.stock} ADET
              </Text>
            </View>
          </View>

          <View style={styles.detailsContainer}>
            <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.productPrice}>${item.price}</Text>
          </View>

          {editingId === item.id ? (
            <View style={styles.editOverlay}>
              <TextInput
                style={styles.stockInput}
                value={newStock}
                onChangeText={setNewStock}
                keyboardType="number-pad"
                placeholder={String(item.stock)}
                placeholderTextColor="#99907c"
                autoFocus
              />
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.saveButton} onPress={() => handleUpdateStock(item.id)}>
                  <Text style={styles.saveButtonText}>✓</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setEditingId(null)}>
                  <Text style={styles.cancelButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.editIconButton} onPress={() => { setEditingId(item.id); setNewStock(String(item.stock)); }}>
              <Text style={styles.editIconText}>✎</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.mainBackground}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Inventory Stock</Text>
          <Text style={styles.subtitle}>Manage and review current boutique holdings.</Text>
        </View>

        <FlatList
          data={products}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4AF37" />}
          ListEmptyComponent={<Text style={styles.emptyText}>Katalogda ürün bulunamadı.</Text>}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainBackground: {
    flex: 1,
    backgroundColor: '#16130b',
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  title: {
    fontSize: 32,
    color: '#f2ca50',
    fontWeight: '400',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#d0c5af',
    opacity: 0.8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  cardContainer: {
    flex: 1,
    marginHorizontal: 6,
    marginBottom: 16,
  },
  glassSurface: {
    backgroundColor: 'rgba(22, 19, 11, 0.85)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d4af37',
    padding: 12,
    shadowColor: '#d4af37',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    position: 'relative',
  },
  imageContainer: {
    aspectRatio: 0.8,
    width: '100%',
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#1f1b13',
    borderColor: 'rgba(153, 144, 124, 0.2)',
    borderWidth: 1,
    marginBottom: 12,
  },
  productImage: {
    width: '100%',
    height: '100%',
    opacity: 0.8,
  },
  stockBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(22, 19, 11, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(153, 144, 124, 0.3)',
  },
  stockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  dotGreen: {
    backgroundColor: '#4CAF50',
  },
  dotRed: {
    backgroundColor: '#ffb4ab',
  },
  stockBadgeText: {
    fontSize: 10,
    color: '#eae1d4',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  textRed: {
    color: '#ffb4ab',
  },
  detailsContainer: {
    alignItems: 'center',
  },
  productName: {
    fontSize: 16,
    color: '#f2ca50',
    fontWeight: '600',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    color: '#eae1d4',
  },
  editIconButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(212, 175, 55, 0.5)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIconText: {
    color: '#16130b',
    fontSize: 16,
    fontWeight: 'bold',
  },
  editOverlay: {
    marginTop: 10,
    padding: 8,
    backgroundColor: '#1f1b13',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4d4635',
  },
  stockInput: {
    backgroundColor: '#16130b',
    color: '#eae1d4',
    height: 36,
    borderRadius: 4,
    paddingHorizontal: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#d4af37',
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#d4af37',
    borderRadius: 4,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  saveButtonText: {
    color: '#16130b',
    fontWeight: 'bold',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#38342b',
    borderRadius: 4,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  cancelButtonText: {
    color: '#eae1d4',
  },
  emptyText: {
    color: '#99907c',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  }
});
