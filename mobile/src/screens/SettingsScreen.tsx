import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { dashboardApi, settingsApi } from '../services/api';
import { getApiErrorMessage } from '../utils/errors';
import { exportMonthlySales, getMonthPeriod } from '../utils/salesExport';
import { formatCurrency } from '../utils/formatters';
import StatusBadge from '../components/StatusBadge';
import AppIcon, { type AppIconName } from '../components/AppIcon';
import { makeTypography, radius, shadow, spacing, type ThemeColors, type ThemeMode } from '../theme';
import type { MonthlyTargetSetting } from '../types';

function createStyles(colors: ThemeColors) {
  const typography = makeTypography(colors);
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.appBg },
    content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
    userCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.mode === 'dark' ? '#141516' : colors.black,
      borderRadius: radius.xl,
      padding: spacing.lg,
      gap: spacing.md,
      marginBottom: spacing.xxl,
      borderWidth: 1,
      borderColor: colors.mode === 'dark' ? colors.border : 'transparent',
      ...shadow.lifted,
    },
    avatarCircle: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: colors.gold,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarLetter: { fontSize: 22, fontWeight: '900', color: colors.black },
    userName: { fontSize: 16, fontWeight: '800', color: colors.white },
    userEmail: { fontSize: 12, color: colors.mode === 'dark' ? colors.inkMuted : '#d7d0c2', marginTop: 2 },
    sectionLabel: { ...typography.sectionLabel, marginBottom: spacing.sm, marginTop: 4, paddingHorizontal: 4 },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      overflow: 'hidden',
      marginBottom: spacing.lg,
      ...shadow.card,
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: 14,
      gap: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSoft,
    },
    settingRowDanger: { backgroundColor: colors.redBg },
    settingIcon: {
      width: 38,
      height: 38,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    settingText: { flex: 1 },
    settingTitle: { fontSize: 14, fontWeight: '700', color: colors.ink },
    settingSubtitle: { fontSize: 12, color: colors.muted, marginTop: 2 },
    themeRow: { flexDirection: 'row', gap: 10, padding: spacing.md },
    themeOption: {
      flex: 1,
      minHeight: 58,
      borderRadius: radius.lg,
      borderWidth: 1.5,
      borderColor: colors.borderSoft,
      backgroundColor: colors.surfaceSoft,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
    },
    themeOptionActive: {
      borderColor: colors.gold,
      backgroundColor: colors.surfaceWarm,
    },
    themeOptionText: { fontSize: 13, fontWeight: '800', color: colors.inkMuted },
    themeOptionTextActive: { color: colors.gold },
    targetPanel: { padding: spacing.lg, gap: spacing.md },
    targetHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    targetIcon: {
      width: 42,
      height: 42,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceWarm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    targetTitle: { fontSize: 15, fontWeight: '800', color: colors.ink },
    targetSubtitle: { fontSize: 12, color: colors.muted, marginTop: 2, lineHeight: 17 },
    targetStats: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    targetStatBox: {
      flex: 1,
      backgroundColor: colors.surfaceSoft,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      padding: spacing.md,
    },
    targetStatLabel: { fontSize: 11, fontWeight: '800', color: colors.muted },
    targetStatValue: { fontSize: 14, fontWeight: '900', color: colors.ink, marginTop: 4 },
    targetInputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceSoft,
      borderWidth: 1.5,
      borderColor: colors.borderSoft,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.md,
    },
    targetPrefix: { fontSize: 16, fontWeight: '900', color: colors.gold, marginRight: 8 },
    targetInput: { flex: 1, paddingVertical: 13, fontSize: 16, fontWeight: '800', color: colors.ink },
    targetSaveBtn: {
      minHeight: 46,
      borderRadius: radius.lg,
      backgroundColor: colors.gold,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    targetSaveBtnDisabled: { opacity: 0.55 },
    targetSaveText: { fontSize: 14, fontWeight: '900', color: colors.black },
    targetHitBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.greenBg,
      borderRadius: radius.md,
      paddingHorizontal: 10,
      paddingVertical: 8,
      alignSelf: 'flex-start',
    },
    targetHitText: { fontSize: 12, fontWeight: '800', color: colors.green },
    infoBox: {
      flexDirection: 'row',
      backgroundColor: colors.blueBg,
      borderRadius: radius.lg,
      padding: spacing.md,
      gap: spacing.sm,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.mode === 'dark' ? '#263a5c' : '#dde0f5',
      alignItems: 'flex-start',
    },
    infoText: { flex: 1, fontSize: 12, color: colors.mode === 'dark' ? colors.inkMuted : '#3a4080', lineHeight: 18 },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSoft,
    },
    infoRowLabel: { fontSize: 14, color: colors.ink, fontWeight: '600' },
    infoRowValue: { fontSize: 14, color: colors.muted },
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.xxl,
    },
    modalCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.xl,
      padding: spacing.xxl,
      width: '100%',
      maxWidth: 380,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      ...shadow.lifted,
    },
    modalHeader: { alignItems: 'center', marginBottom: 20 },
    modalIconWrap: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.redBg,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    modalTitle: { fontSize: 18, fontWeight: '800', color: colors.ink, marginBottom: 8, textAlign: 'center' },
    modalDesc: { fontSize: 13, color: colors.muted, textAlign: 'center', lineHeight: 20 },
    errorBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.redBg,
      borderRadius: radius.md,
      padding: 12,
      marginBottom: 14,
      gap: 8,
      borderLeftWidth: 3,
      borderLeftColor: colors.red,
    },
    errorText: { flex: 1, color: colors.red, fontSize: 13 },
    modalLabel: { ...typography.sectionLabel, marginBottom: 8 },
    inputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceSoft,
      borderWidth: 1.5,
      borderColor: colors.borderSoft,
      borderRadius: radius.lg,
      marginBottom: spacing.xxl,
      paddingHorizontal: 14,
    },
    modalInput: { flex: 1, paddingVertical: 14, fontSize: 16, color: colors.ink, letterSpacing: 2 },
    eyeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    modalButtons: { flexDirection: 'row', gap: 10 },
    cancelBtn: {
      flex: 1,
      borderWidth: 1.5,
      borderColor: colors.borderSoft,
      borderRadius: radius.lg,
      paddingVertical: 14,
      alignItems: 'center',
    },
    cancelText: { fontSize: 14, fontWeight: '700', color: colors.muted },
    confirmBtn: {
      flex: 2,
      backgroundColor: colors.red,
      borderRadius: radius.lg,
      paddingVertical: 14,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 6,
    },
    confirmText: { fontSize: 14, fontWeight: '800', color: '#ffffff' },
    successCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: colors.greenBg,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    successTitle: { fontSize: 18, fontWeight: '800', color: colors.ink, marginBottom: 10 },
    successDesc: {
      fontSize: 13,
      color: colors.muted,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 24,
      paddingHorizontal: 8,
    },
    successBtn: {
      backgroundColor: colors.green,
      borderRadius: radius.lg,
      paddingVertical: 14,
      paddingHorizontal: 40,
      alignItems: 'center',
    },
    successBtnText: { fontSize: 14, fontWeight: '800', color: '#ffffff' },
  });
}

function SettingRow({
  colors,
  styles,
  icon,
  appIcon,
  iconColor,
  title,
  subtitle,
  onPress,
  danger,
}: {
  colors: ThemeColors;
  styles: ReturnType<typeof createStyles>;
  icon: keyof typeof Ionicons.glyphMap;
  appIcon?: AppIconName;
  iconColor: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.settingRow, danger && styles.settingRowDanger]}
      onPress={onPress}
      activeOpacity={0.74}
    >
      <View style={[styles.settingIcon, { backgroundColor: `${iconColor}22` }]}>
        {appIcon ? <AppIcon name={appIcon} size={24} /> : <Ionicons name={icon} size={20} color={iconColor} />}
      </View>
      <View style={styles.settingText}>
        <Text style={[styles.settingTitle, danger && { color: colors.red }]}>{title}</Text>
        {subtitle ? <Text style={styles.settingSubtitle}>{subtitle}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={danger ? colors.red : colors.faint} />
    </TouchableOpacity>
  );
}

function ThemeSelector({
  mode,
  onChange,
  colors,
  styles,
}: {
  mode: ThemeMode;
  onChange: (mode: ThemeMode) => void;
  colors: ThemeColors;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.themeRow}>
      {(['light', 'dark'] as ThemeMode[]).map((item) => {
        const active = mode === item;
        return (
          <TouchableOpacity
            key={item}
            style={[styles.themeOption, active && styles.themeOptionActive]}
            onPress={() => onChange(item)}
            activeOpacity={0.78}
            accessibilityRole="button"
            accessibilityLabel={item === 'light' ? 'Açık tema' : 'Koyu tema'}
          >
            <Ionicons
              name={item === 'light' ? 'sunny-outline' : 'moon-outline'}
              size={22}
              color={active ? colors.gold : colors.muted}
            />
            <Text style={[styles.themeOptionText, active && styles.themeOptionTextActive]}>
              {item === 'light' ? 'Açık' : 'Koyu'}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function parseRevenueInput(value: string): number {
  const normalized = value
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : NaN;
}

function MonthlyTargetPanel({
  colors,
  styles,
}: {
  colors: ThemeColors;
  styles: ReturnType<typeof createStyles>;
}) {
  const [setting, setSetting] = useState<MonthlyTargetSetting | null>(null);
  const [targetInput, setTargetInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadTarget = async () => {
    setLoading(true);
    try {
      const res = await settingsApi.getMonthlyTarget();
      if (res.success && res.data) {
        setSetting(res.data);
        setTargetInput(String(Math.round(res.data.targetRevenue)));
      }
    } catch (e) {
      Alert.alert('Hata', getApiErrorMessage(e, 'Aylık hedef ciro alınamadı.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTarget();
  }, []);

  const handleSave = async () => {
    const amount = parseRevenueInput(targetInput);
    if (!Number.isFinite(amount) || amount < 0) {
      Alert.alert('Geçersiz Değer', 'Aylık hedef ciro 0 veya daha büyük bir sayı olmalı.');
      return;
    }

    setSaving(true);
    try {
      const res = await settingsApi.updateMonthlyTarget(amount);
      if (res.success && res.data) {
        setSetting(res.data);
        setTargetInput(String(Math.round(res.data.targetRevenue)));
        Alert.alert('Güncellendi', 'Aylık hedef ciro kaydedildi.');
      } else {
        Alert.alert('Hata', res.error ?? 'Aylık hedef ciro güncellenemedi.');
      }
    } catch (e) {
      Alert.alert('Hata', getApiErrorMessage(e, 'Aylık hedef ciro güncellenemedi.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.targetPanel}>
      <View style={styles.targetHeader}>
        <View style={styles.targetIcon}>
          <Ionicons name="flag-outline" size={22} color={colors.gold} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.targetTitle}>Aylık Hedef Ciro</Text>
          <Text style={styles.targetSubtitle}>
            Hedefe ilk ulaşıldığında tüm ortaklara anlık bildirim gider.
          </Text>
        </View>
      </View>

      <View style={styles.targetStats}>
        <View style={styles.targetStatBox}>
          <Text style={styles.targetStatLabel}>BU AY CİRO</Text>
          <Text style={styles.targetStatValue}>{formatCurrency(setting?.currentRevenue ?? 0)}</Text>
        </View>
        <View style={styles.targetStatBox}>
          <Text style={styles.targetStatLabel}>HEDEF</Text>
          <Text style={styles.targetStatValue}>{formatCurrency(setting?.targetRevenue ?? 0)}</Text>
        </View>
      </View>

      {setting?.isMonthlyTargetHit ? (
        <View style={styles.targetHitBadge}>
          <Ionicons name="checkmark-circle-outline" size={16} color={colors.green} />
          <Text style={styles.targetHitText}>Bu ay hedef bildirimi gönderildi</Text>
        </View>
      ) : null}

      <View style={styles.targetInputWrap}>
        <Text style={styles.targetPrefix}>TL</Text>
        <TextInput
          style={styles.targetInput}
          value={targetInput}
          onChangeText={setTargetInput}
          placeholder="30000"
          placeholderTextColor={colors.faint}
          keyboardType={Platform.OS === 'ios' ? 'decimal-pad' : 'numeric'}
          editable={!loading && !saving}
        />
      </View>

      <TouchableOpacity
        style={[styles.targetSaveBtn, (loading || saving) && styles.targetSaveBtnDisabled]}
        onPress={handleSave}
        disabled={loading || saving}
        activeOpacity={0.82}
      >
        {loading || saving ? (
          <ActivityIndicator color={colors.black} size="small" />
        ) : (
          <>
            <Ionicons name="save-outline" size={17} color={colors.black} />
            <Text style={styles.targetSaveText}>Hedefi Güncelle</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

function PasswordModal({
  visible,
  period,
  colors,
  styles,
  onClose,
  onSuccess,
}: {
  visible: boolean;
  period: 'daily' | 'weekly' | 'monthly' | null;
  colors: ThemeColors;
  styles: ReturnType<typeof createStyles>;
  onClose: () => void;
  onSuccess: (deletedCount: number, period: string) => void;
}) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    setShowPass(false);
    onClose();
  };

  const handleConfirm = async () => {
    if (!password.trim()) {
      setError('Şifrenizi girin');
      shake();
      return;
    }
    if (!period) return;
    setLoading(true);
    setError('');
    try {
      const res = await dashboardApi.resetSales(password, period);
      if (res.success && res.data) {
        setPassword('');
        setShowPass(false);
        onSuccess(res.data.deletedSalesCount, res.data.period);
      } else {
        setError(res.error ?? 'Bir hata oluştu');
        shake();
      }
    } catch (e) {
      setError(getApiErrorMessage(e, 'Bağlantı hatası'));
      shake();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Animated.View style={[styles.modalCard, { transform: [{ translateX: shakeAnim }] }]}>
          <View style={styles.modalHeader}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="warning-outline" size={26} color={colors.red} />
            </View>
            <Text style={styles.modalTitle}>
              {period === 'daily' ? 'Günlük' : period === 'weekly' ? 'Haftalık' : 'Aylık'} Veriyi Sıfırla
            </Text>
            <Text style={styles.modalDesc}>
              Bu işlem seçilen döneme ait satış ve ciro kayıtlarını siler. Stok ve siparişlere dokunulmaz.
            </Text>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.red} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Text style={styles.modalLabel}>GİRİŞ ŞİFRENİZ</Text>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.modalInput}
              placeholder="••••••••"
              placeholderTextColor={colors.faint}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setError('');
              }}
              secureTextEntry={!showPass}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleConfirm}
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPass((value) => !value)}>
              <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.muted} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleClose} disabled={loading}>
              <Text style={styles.cancelText}>İptal</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.confirmBtn, loading && { opacity: 0.6 }]} onPress={handleConfirm} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Ionicons name="trash-outline" size={16} color="#ffffff" />
                  <Text style={styles.confirmText}>Sıfırla</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function SuccessModal({
  visible,
  deletedCount,
  period,
  colors,
  styles,
  onClose,
}: {
  visible: boolean;
  deletedCount: number;
  period: string | null;
  colors: ThemeColors;
  styles: ReturnType<typeof createStyles>;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { alignItems: 'center', paddingVertical: 36 }]}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark-outline" size={36} color={colors.green} />
          </View>
          <Text style={styles.successTitle}>Sıfırlama Tamamlandı</Text>
          <Text style={styles.successDesc}>
            {period === 'daily' ? 'Bugünkü' : period === 'weekly' ? 'Bu haftaki' : 'Bu ayki'} {deletedCount} satış kaydı başarıyla silindi.
          </Text>
          <TouchableOpacity style={styles.successBtn} onPress={onClose} activeOpacity={0.82}>
            <Text style={styles.successBtnText}>Tamam</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const { colors, mode, setThemeMode } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly' | null>(null);
  const [deletedCount, setDeletedCount] = useState(0);
  const [exportingPeriod, setExportingPeriod] = useState<string | null>(null);

  const openResetModal = (period: 'daily' | 'weekly' | 'monthly') => {
    setSelectedPeriod(period);
    setPasswordModalVisible(true);
  };

  const handleResetSuccess = (count: number, period: string) => {
    setDeletedCount(count);
    setSelectedPeriod(period as 'daily' | 'weekly' | 'monthly');
    setPasswordModalVisible(false);
    setSuccessModalVisible(true);
  };

  const handleLogout = () => {
    Alert.alert('Çıkış Yap', 'Oturumu sonlandırmak istediğinizden emin misiniz?', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Çıkış Yap', style: 'destructive', onPress: logout },
    ]);
  };

  const handleExportSales = async (period: string) => {
    setExportingPeriod(period);
    try {
      const result = await exportMonthlySales(period);
      Alert.alert(
        'Excel Hazır',
        `${result.period} dönemi için ${result.total} satış kaydı "${result.filename}" dosyasına aktarıldı.`
      );
    } catch (e) {
      Alert.alert('Hata', getApiErrorMessage(e, 'Excel çıktısı oluşturulamadı.'));
    } finally {
      setExportingPeriod(null);
    }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.userCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarLetter}>{user?.name?.charAt(0).toUpperCase() ?? 'V'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.userName}>{user?.name ?? 'Ortak'}</Text>
          <Text style={styles.userEmail}>{user?.email ?? ''}</Text>
        </View>
        <StatusBadge
          tone={user?.role === 'ADMIN' ? 'warning' : user?.role === 'VIEWER' ? 'neutral' : 'info'}
          icon={user?.role === 'ADMIN' ? 'shield-checkmark-outline' : 'person-outline'}
          label={user?.role === 'ADMIN' ? 'Yönetici' : user?.role === 'VIEWER' ? 'Görüntüleme' : 'Ortak'}
        />
      </View>

      <Text style={styles.sectionLabel}>GÖRÜNÜM</Text>
      <View style={styles.card}>
        <ThemeSelector mode={mode} onChange={setThemeMode} colors={colors} styles={styles} />
      </View>

      {user?.role === 'ADMIN' ? (
        <>
          <Text style={styles.sectionLabel}>HEDEF CİRO</Text>
          <View style={styles.card}>
            <MonthlyTargetPanel colors={colors} styles={styles} />
          </View>
        </>
      ) : null}

      <Text style={styles.sectionLabel}>SATIŞ EXCEL ÇIKTILARI</Text>
      <View style={styles.card}>
        <SettingRow
          colors={colors}
          styles={styles}
          icon="download-outline"
          appIcon="upload"
          iconColor={colors.green}
          title="Bu Ayın Satış Excel'ini İndir"
          subtitle={exportingPeriod === getMonthPeriod(0) ? 'Excel oluşturuluyor...' : `${getMonthPeriod(0)} satış kayıtları`}
          onPress={() => handleExportSales(getMonthPeriod(0))}
        />
        <SettingRow
          colors={colors}
          styles={styles}
          icon="calendar-number-outline"
          appIcon="calendar-month"
          iconColor={colors.blue}
          title="Geçen Ayın Satış Excel'ini İndir"
          subtitle={exportingPeriod === getMonthPeriod(-1) ? 'Excel oluşturuluyor...' : `${getMonthPeriod(-1)} satış kayıtları`}
          onPress={() => handleExportSales(getMonthPeriod(-1))}
        />
      </View>

      <Text style={styles.sectionLabel}>VERİ YÖNETİMİ</Text>
      <View style={styles.card}>
        <SettingRow
          colors={colors}
          styles={styles}
          icon="today-outline"
          appIcon="calendar"
          iconColor={colors.red}
          title="Günlük Satışları Sıfırla"
          subtitle="Sadece bugünkü satış ve ciroyu temizle"
          onPress={() => openResetModal('daily')}
          danger
        />
        <SettingRow
          colors={colors}
          styles={styles}
          icon="calendar-outline"
          appIcon="calendar-grid"
          iconColor={colors.red}
          title="Haftalık Satışları Sıfırla"
          subtitle="Bu haftaki tüm satış ve ciroyu temizle"
          onPress={() => openResetModal('weekly')}
          danger
        />
        <SettingRow
          colors={colors}
          styles={styles}
          icon="bar-chart-outline"
          appIcon="trend"
          iconColor={colors.red}
          title="Aylık Satışları Sıfırla"
          subtitle="Bu ayki tüm satış ve ciroyu temizle"
          onPress={() => openResetModal('monthly')}
          danger
        />
      </View>

      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={16} color={colors.blue} />
        <Text style={styles.infoText}>
          Sıfırlama işlemleri seçilen döneme ait satış ve ciro kayıtlarını siler. Stok miktarları ve sipariş geçmişi değişmez.
        </Text>
      </View>

      <Text style={styles.sectionLabel}>HESAP</Text>
      <View style={styles.card}>
        <SettingRow
          colors={colors}
          styles={styles}
          icon="log-out-outline"
          appIcon="logout"
          iconColor={colors.red}
          title="Çıkış Yap"
          subtitle="Oturumu sonlandır"
          onPress={handleLogout}
          danger
        />
      </View>

      <Text style={styles.sectionLabel}>UYGULAMA</Text>
      <View style={styles.card}>
        <View style={styles.infoRow}>
          <Text style={styles.infoRowLabel}>Versiyon</Text>
          <Text style={styles.infoRowValue}>1.0.0</Text>
        </View>
        <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
          <Text style={styles.infoRowLabel}>Platform</Text>
          <Text style={styles.infoRowValue}>Veor Collection</Text>
        </View>
      </View>

      <PasswordModal
        visible={passwordModalVisible}
        period={selectedPeriod}
        colors={colors}
        styles={styles}
        onClose={() => setPasswordModalVisible(false)}
        onSuccess={handleResetSuccess}
      />
      <SuccessModal
        visible={successModalVisible}
        deletedCount={deletedCount}
        period={selectedPeriod}
        colors={colors}
        styles={styles}
        onClose={() => setSuccessModalVisible(false)}
      />
    </ScrollView>
  );
}
