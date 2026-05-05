import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, RefreshControl, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';

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
      Alert.alert('Başarılı', 'Stok güncellendi.');
    } catch (error) {
      Alert.alert('Hata', 'Stok güncellenemedi.');
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemPrice}>{item.price} TL</Text>
      </View>
      
      {editingId === item.id ? (
        <View style={styles.editContainer}>
          <TextInput
            style={styles.stockInput}
            value={newStock}
            onChangeText={setNewStock}
            keyboardType="number-pad"
            placeholder={String(item.stock)}
            placeholderTextColor="#666"
            autoFocus
          />
          <TouchableOpacity style={styles.saveButton} onPress={() => handleUpdateStock(item.id)}>
            <Text style={styles.saveButtonText}>Kaydet</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={() => setEditingId(null)}>
            <Text style={styles.cancelButtonText}>İptal</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.stockContainer}>
          <Text style={[styles.stockText, item.stock < 10 && styles.lowStock]}>
            Stok: {item.stock}
          </Text>
          <TouchableOpacity 
            style={styles.editButton} 
            onPress={() => {
              setEditingId(item.id);
              setNewStock(String(item.stock));
            }}
          >
            <Text style={styles.editButtonText}>Güncelle</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <ImageBackground 
      source={require('../../assets/backgraound.png')} 
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Katalog & Stok</Text>
      </View>

      <FlatList
        data={products}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4AF37" />}
        ListEmptyComponent={<Text style={styles.emptyText}>Henüz ürün bulunmuyor.</Text>}
      />
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
  listContent: {
    padding: 20,
  },
  itemContainer: {
    backgroundColor: '#2A2A2A',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  itemInfo: {
    marginBottom: 10,
  },
  itemName: {
    color: '#D4AF37',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemPrice: {
    color: '#888',
    fontSize: 14,
  },
  stockContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 10,
  },
  stockText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  lowStock: {
    color: '#FF5252',
  },
  editButton: {
    backgroundColor: '#333',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 4,
  },
  editButtonText: {
    color: '#FFF',
    fontSize: 14,
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 10,
  },
  stockInput: {
    backgroundColor: '#333',
    color: '#FFF',
    flex: 1,
    height: 40,
    borderRadius: 4,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  saveButton: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 4,
    marginRight: 10,
  },
  saveButtonText: {
    color: '#000',
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#555',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 4,
  },
  cancelButtonText: {
    color: '#FFF',
  },
  emptyText: {
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
  }
});
