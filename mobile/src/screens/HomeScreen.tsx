import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import DashboardCard from '../components/DashboardCard';
import QuickMenuButton from '../components/QuickMenuButton';
import { dashboardApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../utils/formatters';
import type { DashboardData } from '../types';

type TabParamList = { Home: undefined; Sale: undefined; Order: undefined; Stock: undefined };
type Nav = BottomTabNavigationProp<TabParamList>;

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Günaydın';
  if (h < 18) return 'İyi öğlenler';
  return 'İyi akşamlar';
}

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchDashboard = useCallback(async () => {
    try {
      setError('');
      const res = await dashboardApi.get();
      if (res.success && res.data) setData(res.data);
      else setError('Veriler yüklenemedi');
    } catch {
      setError('Bağlantı hatası. Tekrar dene.');
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboard();
    setRefreshing(false);
  }, [fetchDashboard]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchDashboard().finally(() => setLoading(false));
    }, [fetchDashboard])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#c9a961" />
      </View>
    );
  }

  if (error && !data) {
    return (
      <View style={styles.center}>
        <Ionicons name="cloud-offline-outline" size={48} color="#ccc" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchDashboard}>
          <Text style={styles.retryText}>Tekrar Dene</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#c9a961']} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.greetRow}>
        <View>
          <Text style={styles.greetSub}>{greeting()},</Text>
          <Text style={styles.greetName}>{user?.name ?? 'Ortak'}</Text>
        </View>
        <View style={styles.badgePill}>
          <Ionicons name="storefront-outline" size={14} color="#c9a961" />
          <Text style={styles.badgePillText}>Veor</Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>SATIŞ ÖZETI</Text>
      <View style={styles.row}>
        <DashboardCard compact icon="today-outline" color="#c9a961" title="Bugün" value={`${data?.dailySales ?? 0} adet`} />
        <DashboardCard compact icon="calendar-outline" color="#5c6bc0" title="Bu Hafta" value={`${data?.weeklySales ?? 0} adet`} />
        <DashboardCard compact icon="bar-chart-outline" color="#26a69a" title="Bu Ay" value={`${data?.monthlySales ?? 0} adet`} />
      </View>

      <Text style={styles.sectionLabel}>CİRO & DEĞER</Text>
      <View style={styles.row}>
        <DashboardCard icon="cash-outline" color="#2e7d32" title="Bugünkü Ciro" value={formatCurrency(data?.dailyRevenue ?? 0)} subtitle="Bugün toplam" />
        <DashboardCard icon="cube-outline" color="#1565c0" title="Stok Değeri" value={formatCurrency(data?.totalStockValue ?? 0)} subtitle={`${data?.totalProducts ?? 0} ürün`} />
      </View>

      {(data?.lowStockCount ?? 0) > 0 && (
        <View style={styles.warningCard}>
          <Ionicons name="warning-outline" size={20} color="#d32f2f" />
          <Text style={styles.warningText}>{data!.lowStockCount} ürünün stoğu kritik seviyede!</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Stock')}>
            <Text style={styles.warningLink}>İncele →</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.sectionLabel}>HIZLI İŞLEMLER</Text>
      <View style={styles.row}>
        <QuickMenuButton title="Satış Gir" icon="cash-outline" color="#c9a961" onPress={() => navigation.navigate('Sale')} />
        <QuickMenuButton title="Sipariş Gir" icon="list-outline" color="#5c6bc0" onPress={() => navigation.navigate('Order')} />
        <QuickMenuButton title="Stok Düzenle" icon="cube-outline" color="#26a69a" onPress={() => navigation.navigate('Stock')} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'rgba(245,245,245,0.92)' },
  content: { paddingHorizontal: 12, paddingTop: 16, paddingBottom: 24 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(245,245,245,0.92)', gap: 12 },
  greetRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingHorizontal: 4 },
  greetSub: { fontSize: 13, color: '#888' },
  greetName: { fontSize: 22, fontWeight: '800', color: '#1a1a1a' },
  badgePill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff8e6', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, gap: 4, borderWidth: 1, borderColor: '#e8d5a3' },
  badgePillText: { fontSize: 12, fontWeight: '700', color: '#c9a961' },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: '#aaa', letterSpacing: 1.5, marginBottom: 8, marginTop: 16, paddingHorizontal: 4 },
  row: { flexDirection: 'row', marginHorizontal: -4 },
  warningCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff5f5', borderRadius: 12, borderLeftWidth: 4, borderLeftColor: '#d32f2f', padding: 14, marginTop: 12, gap: 8, elevation: 2, shadowColor: '#d32f2f', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4 },
  warningText: { flex: 1, fontSize: 13, color: '#d32f2f', fontWeight: '600' },
  warningLink: { fontSize: 13, color: '#d32f2f', fontWeight: '700' },
  errorText: { color: '#888', fontSize: 14, textAlign: 'center', marginTop: 8 },
  retryBtn: { backgroundColor: '#c9a961', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12, marginTop: 4 },
  retryText: { color: '#1a1a1a', fontWeight: '700', fontSize: 14 },
});
