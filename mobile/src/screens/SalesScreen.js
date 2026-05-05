import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator, ScrollView, RefreshControl, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';

export default function SalesScreen() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState('1');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

  const handleSale = async () => {
    if (!selectedProduct) {
      Alert.alert('Hata', 'Lütfen satılacak parfümü seçin.');
      return;
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Hata', 'Lütfen geçerli bir adet giriniz.');
      return;
    }

    if (qty > selectedProduct.stock) {
      Alert.alert('Hata', 'Stokta yeterli ürün yok!');
      return;
    }

    setLoading(true);
    try {
      const userInfoStr = await AsyncStorage.getItem('userInfo');
      const userInfo = JSON.parse(userInfoStr);

      await api.post('/sales', {
        product_id: selectedProduct.id,
        quantity: qty,
        user_id: userInfo.id
      });

      Alert.alert('Başarılı', 'Satış kaydedildi ve stok düşüldü.');
      setQuantity('1');
      setSelectedProduct(null);
      await fetchProducts(); // Refresh stock
    } catch (error) {
      Alert.alert('Hata', error.response?.data?.error || 'Satış kaydedilemedi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground 
      source={require('../../assets/backgraound.png')} 
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Yeni Satış</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4AF37" />}
      >
        <Text style={styles.label}>1. Parfüm Seçiniz:</Text>
        <View style={styles.productList}>
          {products.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={[
                styles.productItem, 
                selectedProduct?.id === item.id && styles.productItemSelected
              ]}
              onPress={() => setSelectedProduct(item)}
            >
              <View>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productPrice}>{item.price} TL</Text>
              </View>
              <Text style={[styles.productStock, item.stock < 10 && styles.lowStock]}>
                Stok: {item.stock}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {selectedProduct && (
          <View style={styles.saleFormContainer}>
            <Text style={styles.label}>2. Adet Giriniz:</Text>
            <View style={styles.quantityContainer}>
              <TouchableOpacity 
                style={styles.qtyButton} 
                onPress={() => setQuantity(String(Math.max(1, parseInt(quantity || '0') - 1)))}
              >
                <Text style={styles.qtyButtonText}>-</Text>
              </TouchableOpacity>
              
              <TextInput
                style={styles.qtyInput}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="number-pad"
              />
              
              <TouchableOpacity 
                style={styles.qtyButton}
                onPress={() => setQuantity(String(parseInt(quantity || '0') + 1))}
              >
                <Text style={styles.qtyButtonText}>+</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Toplam Tutar:</Text>
              <Text style={styles.totalValue}>
                {selectedProduct.price * (parseInt(quantity) || 0)} TL
              </Text>
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleSale} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.submitButtonText}>Satışı Kaydet</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: 'rgba(26, 26, 26, 0.85)',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  label: {
    color: '#D4AF37',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 10,
  },
  productList: {
    marginBottom: 20,
  },
  productItem: {
    backgroundColor: '#2A2A2A',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  productItemSelected: {
    borderColor: '#D4AF37',
    backgroundColor: '#332b14', // Slight gold tint
  },
  productName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  productPrice: {
    color: '#888',
    fontSize: 14,
  },
  productStock: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  lowStock: {
    color: '#FF5252',
  },
  saleFormContainer: {
    backgroundColor: '#252525',
    padding: 20,
    borderRadius: 12,
    marginTop: 10,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  qtyButton: {
    backgroundColor: '#333',
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyButtonText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  qtyInput: {
    flex: 1,
    backgroundColor: '#333',
    color: '#FFF',
    height: 40,
    marginHorizontal: 15,
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#444',
    paddingTop: 15,
    marginBottom: 20,
  },
  totalLabel: {
    color: '#FFF',
    fontSize: 18,
  },
  totalValue: {
    color: '#4CAF50',
    fontSize: 24,
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#D4AF37',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
