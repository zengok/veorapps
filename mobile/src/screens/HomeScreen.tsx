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
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import { dashboardApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { formatCurrency } from '../utils/formatters';
import type { DashboardData } from '../types';
import { makeTypography, radius, shadow, spacing, touch, type ThemeColors } from '../theme';

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
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
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
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  if (error && !data) {
    return (
      <View style={styles.center}>
        <EmptyState
          icon="cloud-offline-outline"
          title="Veriler yüklenemedi"
          description={error}
          compact
        />
        <TouchableOpacity style={styles.retryBtn} onPress={fetchDashboard} hitSlop={touch.hitSlop}>
          <Text style={styles.retryText}>Tekrar Dene</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.gold]} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.greetRow}>
        <View>
          <Text style={styles.greetSub}>{greeting()},</Text>
          <Text style={styles.greetName} numberOfLines={1}>{user?.name ?? 'Ortak'}</Text>
        </View>
        <View style={styles.badgePill}>
          <StatusBadge tone="warning" icon="storefront-outline" label="Veor" />
        </View>
      </View>

      <Text style={styles.sectionLabel}>SATIŞ ÖZETI</Text>
      <View style={styles.row}>
        <DashboardCard compact icon="today-outline" color={colors.gold} title="Bugün" value={`${data?.dailySales ?? 0} adet`} />
        <DashboardCard compact icon="calendar-outline" color={colors.blue} title="Bu Hafta" value={`${data?.weeklySales ?? 0} adet`} />
        <DashboardCard compact icon="bar-chart-outline" color={colors.green} title="Bu Ay" value={`${data?.monthlySales ?? 0} adet`} />
      </View>

      <Text style={styles.sectionLabel}>CİRO & DEĞER</Text>
      <View style={styles.row}>
        <DashboardCard icon="cash-outline" color={colors.green} title="Bugünkü Ciro" value={formatCurrency(data?.dailyRevenue ?? 0)} subtitle="Bugün toplam" />
        <DashboardCard icon="cube-outline" color={colors.blue} title="Stok Değeri" value={formatCurrency(data?.totalStockValue ?? 0)} subtitle={`${data?.totalProducts ?? 0} ürün`} />
      </View>

      {(data?.lowStockCount ?? 0) > 0 && (
        <View style={styles.warningCard}>
          <Ionicons name="warning-outline" size={20} color={colors.red} />
          <Text style={styles.warningText}>{data!.lowStockCount} ürünün stoğu kritik seviyede!</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Stock')} hitSlop={touch.hitSlop}>
            <Text style={styles.warningLink}>İncele →</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.sectionLabel}>HIZLI İŞLEMLER</Text>
      <View style={styles.row}>
        <QuickMenuButton title="Satış Gir" icon="cash-outline" appIcon="sale" color={colors.gold} onPress={() => navigation.navigate('Sale')} />
        <QuickMenuButton title="Sipariş Gir" icon="list-outline" appIcon="orders" color={colors.blue} onPress={() => navigation.navigate('Order')} />
        <QuickMenuButton title="Stok Düzenle" icon="cube-outline" appIcon="stock" color={colors.green} onPress={() => navigation.navigate('Stock')} />
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) => {
  const typography = makeTypography(colors);
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.appBg },
  content: { paddingHorizontal: spacing.md, paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.appBg, gap: 12 },
  greetRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingHorizontal: 4 },
  greetSub: { fontSize: 13, color: colors.inkMuted },
  greetName: { fontSize: 22, fontWeight: '800', color: colors.ink },
  badgePill: { flexDirection: 'row', alignItems: 'center' },
  sectionLabel: { ...typography.sectionLabel, marginBottom: 8, marginTop: 16, paddingHorizontal: 4 },
  row: { flexDirection: 'row', marginHorizontal: -4 },
  warningCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.redBg, borderRadius: radius.lg, borderLeftWidth: 4, borderLeftColor: colors.red, padding: 14, marginTop: 12, gap: 8, ...shadow.card },
  warningText: { flex: 1, fontSize: 13, color: colors.red, fontWeight: '700' },
  warningLink: { fontSize: 13, color: colors.red, fontWeight: '800' },
  errorText: { color: colors.inkMuted, fontSize: 14, textAlign: 'center', marginTop: 8 },
  retryBtn: { backgroundColor: colors.gold, borderRadius: radius.md, paddingHorizontal: 24, paddingVertical: 12, marginTop: 4 },
  retryText: { color: colors.ink, fontWeight: '800', fontSize: 14 },
  });
};
