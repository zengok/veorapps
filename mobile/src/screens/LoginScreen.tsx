import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { radius, shadow, spacing, type ThemeColors } from '../theme';
import { useTheme } from '../contexts/ThemeContext';

export default function LoginScreen() {
  const { login } = useAuth();
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validate = (): string | null => {
    if (!email.trim()) return 'E-posta gerekli';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Geçerli bir e-posta girin';
    if (!password) return 'Şifre gerekli';
    if (password.length < 6) return 'Şifre en az 6 karakter olmalı';
    return null;
  };

  const handleLogin = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Giriş başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brand}>
          <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.brandName}>VEOR COLLECTION</Text>
          <Text style={styles.brandSub}>Stok & Satış Yönetimi</Text>
        </View>

        {/* Form kartı */}
        <View style={styles.card}>
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Text style={styles.label}>E-POSTA</Text>
          <TextInput
            style={styles.input}
            placeholder="ortak@veor.com"
            placeholderTextColor={colors.muted}
            value={email}
            onChangeText={(t) => { setEmail(t); setError(''); }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />

          <Text style={[styles.label, { marginTop: 16 }]}>ŞİFRE</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={colors.muted}
            value={password}
            onChangeText={(t) => { setPassword(t); setError(''); }}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.82}
          >
            {loading ? (
              <ActivityIndicator color={colors.black} size="small" />
            ) : (
              <Text style={styles.buttonText}>GİRİŞ YAP</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>© 2025 Veor Collection</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.mode === 'dark' ? colors.appBg : 'rgba(26,26,26,0.88)' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 28 },

  brand: { alignItems: 'center', marginBottom: 40 },
  logo: {
    width: 104,
    height: 104,
    marginBottom: 16,
  },
  brandName: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 5,
    color: colors.gold,
  },
  brandSub: {
    fontSize: 11,
    color: colors.muted,
    letterSpacing: 2,
    marginTop: 6,
  },

  card: {
    backgroundColor: colors.mode === 'dark' ? colors.surface : '#242424',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.mode === 'dark' ? colors.border : '#333',
    padding: spacing.xxl,
    ...shadow.lifted,
  },

  errorBox: {
    backgroundColor: colors.redBg,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: colors.red,
  },
  errorText: { color: colors.red, fontSize: 13 },

  label: {
    color: colors.muted,
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.mode === 'dark' ? colors.surfaceSoft : '#2c2c2c',
    borderWidth: 1,
    borderColor: colors.mode === 'dark' ? colors.borderSoft : '#3a3a3a',
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    color: colors.white,
    fontSize: 15,
  },

  button: {
    backgroundColor: colors.gold,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: { opacity: 0.55 },
  buttonText: {
    color: colors.black,
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 2,
  },

  footer: {
    color: colors.mode === 'dark' ? colors.faint : '#444',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 32,
  },
});
