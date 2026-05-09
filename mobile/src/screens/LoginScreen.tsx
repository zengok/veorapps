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
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

const C = {
  black: '#1a1a1a',
  darkCard: '#242424',
  gold: '#c9a961',
  goldDim: '#a88940',
  white: '#ffffff',
  gray: '#888888',
  inputBg: '#2c2c2c',
  border: '#3a3a3a',
  error: '#e05555',
};

export default function LoginScreen() {
  const { login } = useAuth();
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
        {/* Logo / Marka */}
        <View style={styles.brand}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoLetter}>V</Text>
          </View>
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
            placeholderTextColor={C.gray}
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
            placeholderTextColor={C.gray}
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
              <ActivityIndicator color={C.black} size="small" />
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'rgba(26,26,26,0.85)' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 28 },

  brand: { alignItems: 'center', marginBottom: 40 },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: C.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoLetter: { fontSize: 36, fontWeight: '700', color: C.gold },
  brandName: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 5,
    color: C.gold,
  },
  brandSub: {
    fontSize: 11,
    color: C.gray,
    letterSpacing: 2,
    marginTop: 6,
  },

  card: {
    backgroundColor: C.darkCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
    padding: 24,
  },

  errorBox: {
    backgroundColor: '#3a1a1a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: C.error,
  },
  errorText: { color: C.error, fontSize: 13 },

  label: {
    color: C.gray,
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: C.inputBg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: C.white,
    fontSize: 15,
  },

  button: {
    backgroundColor: C.gold,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: { opacity: 0.55 },
  buttonText: {
    color: C.black,
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 2,
  },

  footer: {
    color: '#444',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 32,
  },
});
