import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';

export default function DashboardScreen({ setUserToken }) {
  const [summary, setSummary] = useState(null);
  const [recentSales, setRecentSales] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [summaryRes, recentRes] = await Promise.all([
        api.get('/analytics/summary'),
        api.get('/sales/recent')
      ]);
      setSummary(summaryRes.data);
      setRecentSales(recentRes.data);
    } catch (error) {
      console.error(error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userToken');
    setUserToken(null);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value || 0);
  };

  return (
    <ImageBackground 
      source={require('../../assets/backgraound.png')} 
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Özet & Analiz</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Çıkış</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4AF37" />}
      >
        {summary && (
          <View style={styles.analysisContainer}>
            <Text style={styles.sectionTitle}>Satış Analizi</Text>
            
            <View style={styles.cardsRow}>
              <View style={styles.card}>
                <Text style={styles.cardLabel}>Bugün</Text>
                <Text style={styles.cardValue}>{summary.daily.quantity} Adet</Text>
                <Text style={styles.cardAmount}>{formatCurrency(summary.daily.revenue)}</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.cardLabel}>Bu Hafta</Text>
                <Text style={styles.cardValue}>{summary.weekly.quantity} Adet</Text>
                <Text style={styles.cardAmount}>{formatCurrency(summary.weekly.revenue)}</Text>
              </View>
            </View>

            <View style={styles.cardsRow}>
              <View style={styles.card}>
                <Text style={styles.cardLabel}>Bu Ay</Text>
                <Text style={styles.cardValue}>{summary.monthly.quantity} Adet</Text>
                <Text style={styles.cardAmount}>{formatCurrency(summary.monthly.revenue)}</Text>
              </View>
              <View style={[styles.card, { backgroundColor: '#D4AF37' }]}>
                <Text style={[styles.cardLabel, { color: '#000' }]}>Toplam Satış</Text>
                <Text style={[styles.cardValue, { color: '#000' }]}>{summary.total.quantity} Adet</Text>
                <Text style={[styles.cardAmount, { color: '#000' }]}>{formatCurrency(summary.total.revenue)}</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.recentContainer}>
          <Text style={styles.sectionTitle}>Son 5 Satış</Text>
          {recentSales.map((sale) => (
            <View key={sale.id} style={styles.saleItem}>
              <View style={styles.saleItemLeft}>
                <Text style={styles.saleProduct}>{sale.product_name}</Text>
                <Text style={styles.saleDetails}>Satıcı: {sale.username} • {new Date(sale.sale_date).toLocaleDateString('tr-TR')}</Text>
              </View>
              <View style={styles.saleItemRight}>
                <Text style={styles.saleQuantity}>{sale.quantity} Adet</Text>
                <Text style={styles.salePrice}>{formatCurrency(sale.total_price)}</Text>
              </View>
            </View>
          ))}
          {recentSales.length === 0 && (
            <Text style={styles.emptyText}>Henüz satış bulunmuyor.</Text>
          )}
        </View>

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
    backgroundColor: 'rgba(22, 19, 11, 0.90)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#4d4635',
  },
  headerTitle: {
    color: '#f2ca50',
    fontSize: 22,
    fontWeight: 'bold',
  },
  logoutButton: {
    padding: 8,
  },
  logoutText: {
    color: '#99907c',
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 20,
  },
  sectionTitle: {
    color: '#d4af37',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  analysisContainer: {
    marginBottom: 30,
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  card: {
    backgroundColor: 'rgba(22, 19, 11, 0.85)',
    width: '48%',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4d4635',
  },
  cardLabel: {
    color: '#d0c5af',
    fontSize: 14,
    marginBottom: 8,
  },
  cardValue: {
    color: '#f2ca50',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardAmount: {
    color: '#eae1d4',
    fontSize: 14,
    fontWeight: '600',
  },
  recentContainer: {
    marginBottom: 20,
  },
  saleItem: {
    backgroundColor: 'rgba(22, 19, 11, 0.85)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#4d4635',
  },
  saleItemLeft: {
    flex: 1,
  },
  saleProduct: {
    color: '#f2ca50',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  saleDetails: {
    color: '#d0c5af',
    fontSize: 12,
  },
  saleItemRight: {
    alignItems: 'flex-end',
  },
  saleQuantity: {
    color: '#d4af37',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  salePrice: {
    color: '#eae1d4',
    fontWeight: 'bold',
  },
  emptyText: {
    color: '#99907c',
    textAlign: 'center',
    marginTop: 20,
  }
});
