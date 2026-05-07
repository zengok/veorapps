import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi, setOnUnauthorized } from '../services/api';
import type { User } from '../types';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove(['@veor_token', '@veor_user']);
    setUser(null);
    setToken(null);
  }, []);

  // 401 geldiğinde api.ts buraya bildirir
  useEffect(() => {
    setOnUnauthorized(logout);
  }, [logout]);

  // Uygulama açılışında saklı oturum kontrolü
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const [[, storedToken], [, storedUser]] = await AsyncStorage.multiGet([
          '@veor_token',
          '@veor_user',
        ]);
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser) as User);
          // Token hâlâ geçerli mi kontrol et
          const res = await authApi.me();
          if (res.data) setUser(res.data);
        }
      } catch {
        await logout();
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [logout]);

  const login = async (email: string, password: string): Promise<void> => {
    const res = await authApi.login(email, password);
    if (!res.success || !res.data) throw new Error(res.error ?? 'Giriş başarısız');

    const { token: tok, user: usr } = res.data;
    await AsyncStorage.multiSet([
      ['@veor_token', tok],
      ['@veor_user', JSON.stringify(usr)],
    ]);
    setToken(tok);
    setUser(usr);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
