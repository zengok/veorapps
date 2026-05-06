import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// LÜTFEN DİKKAT: Sanal sunucunuzun IP adresi buraya yazılmalı.
// Geliştirme aşamasında bilgisayarınızın yerel IP'sini yazabilirsiniz (örn: 192.168.1.50)
const API_URL = 'http://172.21.52.63:3000/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Localtunnel uyarı ekranını geçmek için özel başlık:
    config.headers['Bypass-Tunnel-Reminder'] = 'true';
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
