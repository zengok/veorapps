import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ImageBackground, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';

export default function LoginScreen({ setUserToken }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Hata', 'Lütfen kullanıcı adı ve şifre giriniz.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/login', {
        username: username.toLowerCase().trim(),
        password
      });

      const token = response.data.token;
      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('userInfo', JSON.stringify(response.data.user));
      
      setUserToken(token);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Sunucuya bağlanılamadı, internetinizi kontrol edin.';
      Alert.alert('Giriş Başarısız', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground 
      source={require('../../assets/backgraound.png')} 
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.formContainer}>
          <Image 
            source={require('../../assets/logo.png')} 
            style={styles.logo} 
            resizeMode="contain"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Kullanıcı Adı"
            placeholderTextColor="#888"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Şifre"
            placeholderTextColor="#888"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          
          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.buttonText}>Giriş Yap</Text>
            )}
          </TouchableOpacity>
        </View>
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
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(22, 19, 11, 0.90)', // Dark glass surface
  },
  formContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(31, 27, 19, 0.85)',
    padding: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4d4635',
  },
  logo: {
    width: 250,
    height: 120,
    marginBottom: 40,
  },
  input: {
    width: '100%',
    backgroundColor: '#16130b',
    color: '#eae1d4',
    borderRadius: 4,
    padding: 15,
    marginBottom: 20,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#4d4635',
  },
  button: {
    width: '100%',
    backgroundColor: '#d4af37',
    padding: 15,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#f2ca50',
  },
  buttonText: {
    color: '#16130b',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
