import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { dashboardApi } from '../services/api';

const C = {
  bg: '#f5f5f5',
  black: '#1a1a1a',
  darkCard: '#242424',
  gold: '#c9a961',
  goldDim: '#a88940',
  white: '#ffffff',
  gray: '#888888',
  inputBg: '#2c2c2c',
  border: '#3a3a3a',
  error: '#e05555',
  errorBg: '#3a1a1a',
  success: '#2e7d32',
  successBg: '#e8f5e9',
  cardBg: '#ffffff',
  cardBorder: '#ebebeb',
  red: '#d32f2f',
  redBg: '#fff5f5',
  redBorder: '#f8d7d7',
};

// ─────────────────────────────────────────────
//  Ayar Satırı (genel amaçlı)
// ─────────────────────────────────────────────
function SettingRow({
  icon,
  iconColor,
  title,
  subtitle,
  onPress,
  danger,
}: {
  icon: keyof typeof Ionicons.glyphMap;
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
      activeOpacity={0.7}
    >
      <View style={[styles.settingIcon, { backgroundColor: iconColor + '18' }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.settingText}>
        <Text style={[styles.settingTitle, danger && { color: C.red }]}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={18} color={danger ? C.red : '#ccc'} />
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────
//  Şifre Doğrulama Modalı
// ─────────────────────────────────────────────
function PasswordModal({
  visible,
  period,
  onClose,
  onSuccess,
}: {
  visible: boolean;
  period: 'daily' | 'weekly' | 'monthly' | null;
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
    } catch (e: any) {
      const msg =
        e?.response?.data?.error ?? e?.message ?? 'Bağlantı hatası';
      setError(msg);
      shake();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Animated.View
          style={[styles.modalCard, { transform: [{ translateX: shakeAnim }] }]}
        >
          {/* Başlık */}
          <View style={styles.modalHeader}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="warning-outline" size={26} color={C.red} />
            </View>
            <Text style={styles.modalTitle}>
              {period === 'daily' ? 'Günlük' : period === 'weekly' ? 'Haftalık' : 'Aylık'} Veriyi Sıfırla
            </Text>
            <Text style={styles.modalDesc}>
              Bu işlem {period === 'daily' ? 'bugün' : period === 'weekly' ? 'bu hafta' : 'bu ay'} girilen tüm{' '}
              <Text style={{ fontWeight: '700', color: C.red }}>satış ve ciro</Text>{' '}
              kayıtlarını siler.{'\n'}Stok ve siparişlere dokunulmaz.
            </Text>
          </View>

          {/* Hata kutusu */}
          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={C.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Şifre alanı */}
          <Text style={styles.modalLabel}>GİRİŞ ŞİFRENİZ</Text>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.modalInput}
              placeholder="••••••••"
              placeholderTextColor="#666"
              value={password}
              onChangeText={(t) => { setPassword(t); setError(''); }}
              secureTextEntry={!showPass}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleConfirm}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowPass((v) => !v)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={showPass ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#888"
              />
            </TouchableOpacity>
          </View>

          {/* Butonlar */}
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={styles.cancelText}>İptal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, loading && { opacity: 0.6 }]}
              onPress={handleConfirm}
              disabled={loading}
              activeOpacity={0.82}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="trash-outline" size={16} color="#fff" />
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

// ─────────────────────────────────────────────
//  Başarı Modalı
// ─────────────────────────────────────────────
function SuccessModal({
  visible,
  deletedCount,
  period,
  onClose,
}: {
  visible: boolean;
  deletedCount: number;
  period: string | null;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { alignItems: 'center', paddingVertical: 36 }]}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark-outline" size={36} color={C.success} />
          </View>
          <Text style={styles.successTitle}>Sıfırlama Tamamlandı</Text>
          <Text style={styles.successDesc}>
            {period === 'daily' ? 'Bugünkü' : period === 'weekly' ? 'Bu haftaki' : 'Bu ayki'}{' '}
            <Text style={{ fontWeight: '800', color: C.black }}>{deletedCount} satış kaydı</Text>{' '}
            başarıyla silindi.{'\n'}Stok ve siparişlere dokunulmadı.
          </Text>
          <TouchableOpacity style={styles.successBtn} onPress={onClose} activeOpacity={0.82}>
            <Text style={styles.successBtnText}>Tamam</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────
//  Ana Ayarlar Ekranı
// ─────────────────────────────────────────────
export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly' | null>(null);
  const [deletedCount, setDeletedCount] = useState(0);

  const openResetModal = (period: 'daily' | 'weekly' | 'monthly') => {
    setSelectedPeriod(period);
    setPasswordModalVisible(true);
  };

  const handleResetSuccess = (count: number, period: string) => {
    setDeletedCount(count);
    setSelectedPeriod(period as any);
    setPasswordModalVisible(false);
    setSuccessModalVisible(true);
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* Kullanıcı Kartı */}
      <View style={styles.userCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarLetter}>
            {user?.name?.charAt(0).toUpperCase() ?? 'V'}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.userName}>{user?.name ?? 'Ortak'}</Text>
          <Text style={styles.userEmail}>{user?.email ?? ''}</Text>
        </View>
        <View style={styles.roleTag}>
          <Text style={styles.roleTagText}>YÖNETİCİ</Text>
        </View>
      </View>

      {/* Veri Yönetimi */}
      <Text style={styles.sectionLabel}>VERİ YÖNETİMİ</Text>
      <View style={styles.card}>
        <SettingRow
          icon="today-outline"
          iconColor={C.red}
          title="Günlük Satışları Sıfırla"
          subtitle="Sadece bugünkü satış ve ciroyu temizle"
          onPress={() => openResetModal('daily')}
          danger
        />
        <SettingRow
          icon="calendar-outline"
          iconColor={C.red}
          title="Haftalık Satışları Sıfırla"
          subtitle="Bu haftaki tüm satış ve ciroyu temizle"
          onPress={() => openResetModal('weekly')}
          danger
        />
        <SettingRow
          icon="bar-chart-outline"
          iconColor={C.red}
          title="Aylık Satışları Sıfırla"
          subtitle="Bu ayki tüm satış ve ciroyu temizle"
          onPress={() => openResetModal('monthly')}
          danger
        />
      </View>

      {/* Bilgi notu */}
      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={16} color="#5c6bc0" />
        <Text style={styles.infoText}>
          Sıfırlama işlemleri seçilen döneme ait <Text style={{ fontWeight: '700' }}>satış ve ciro</Text> kayıtlarını siler. Stok miktarları ve sipariş geçmişi değişmez.
        </Text>
      </View>

      {/* Hesap */}
      <Text style={styles.sectionLabel}>HESAP</Text>
      <View style={styles.card}>
        <SettingRow
          icon="log-out-outline"
          iconColor={C.red}
          title="Çıkış Yap"
          subtitle="Oturumu sonlandır"
          onPress={logout}
          danger
        />
      </View>

      {/* Uygulama Bilgisi */}
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

      {/* Modaller */}
      <PasswordModal
        visible={passwordModalVisible}
        period={selectedPeriod}
        onClose={() => setPasswordModalVisible(false)}
        onSuccess={handleResetSuccess}
      />
      <SuccessModal
        visible={successModalVisible}
        deletedCount={deletedCount}
        period={selectedPeriod}
        onClose={() => setSuccessModalVisible(false)}
      />
    </ScrollView>
  );
}

// ─────────────────────────────────────────────
//  Stiller
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'rgba(245,245,245,0.92)' },
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },

  // Kullanıcı kartı
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.black,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { fontSize: 22, fontWeight: '800', color: C.black },
  userName: { fontSize: 16, fontWeight: '700', color: C.white },
  userEmail: { fontSize: 12, color: C.gray, marginTop: 2 },
  roleTag: {
    backgroundColor: '#c9a96120',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#c9a96140',
  },
  roleTagText: { fontSize: 9, fontWeight: '800', color: C.gold, letterSpacing: 1.2 },

  // Bölüm başlıkları
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#aaa',
    letterSpacing: 1.5,
    marginBottom: 8,
    marginTop: 4,
    paddingHorizontal: 4,
  },

  // Kart
  card: {
    backgroundColor: C.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.cardBorder,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },

  // Ayar satırı
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingRowDanger: { backgroundColor: '#fff9f9' },
  settingIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingText: { flex: 1 },
  settingTitle: { fontSize: 14, fontWeight: '600', color: C.black },
  settingSubtitle: { fontSize: 12, color: C.gray, marginTop: 2 },

  // Info box
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#f0f2ff',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#dde0f5',
    alignItems: 'flex-start',
  },
  infoText: { flex: 1, fontSize: 12, color: '#3a4080', lineHeight: 18 },

  // Bilgi satırı
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoRowLabel: { fontSize: 14, color: C.black, fontWeight: '500' },
  infoRowValue: { fontSize: 14, color: C.gray },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  modalHeader: { alignItems: 'center', marginBottom: 20 },
  modalIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.redBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: C.black,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalDesc: {
    fontSize: 13,
    color: C.gray,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.errorBg,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    gap: 8,
    borderLeftWidth: 3,
    borderLeftColor: C.error,
  },
  errorText: { flex: 1, color: C.error, fontSize: 13 },
  modalLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.gray,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    marginBottom: 24,
    paddingHorizontal: 14,
  },
  modalInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: C.black,
    letterSpacing: 2,
  },
  eyeBtn: { padding: 4 },
  modalButtons: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelText: { fontSize: 14, fontWeight: '600', color: C.gray },
  confirmBtn: {
    flex: 2,
    backgroundColor: C.red,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  confirmText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  // Başarı modalı
  successCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: C.successBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: C.black,
    marginBottom: 10,
  },
  successDesc: {
    fontSize: 13,
    color: C.gray,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  successBtn: {
    backgroundColor: C.success,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  successBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
