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
      Alert.alert('Giriş Başarısız', error.response?.data?.error || 'Bir hata oluştu.');
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
    backgroundColor: 'rgba(26, 26, 26, 0.7)', // Yarı saydam siyah katman
  },
  formContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Form arka planı için biraz daha koyu
    padding: 20,
    borderRadius: 15,
  },
  logo: {
    width: 250,
    height: 120,
    marginBottom: 40,
  },
  input: {
    width: '100%',
    backgroundColor: 'rgba(51, 51, 51, 0.8)',
    color: '#FFF',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#444',
  },
  button: {
    width: '100%',
    backgroundColor: '#D4AF37',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
