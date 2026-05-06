# Veor Collection API – Security Documentation

## Genel Bakış

Bu belge, Veor Collection API'sinde uygulanan güvenlik katmanlarını açıklar.

---

## 1. HTTP Güvenlik Başlıkları (Helmet.js)

Her API yanıtında aşağıdaki başlıklar otomatik olarak eklenir:

| Başlık | Değer | Açıklama |
|---|---|---|
| `Content-Security-Policy` | `default-src 'self'` | Yalnızca aynı kaynaktan içerik yüklenir |
| `X-Frame-Options` | `DENY` | Clickjacking saldırılarını önler |
| `X-Content-Type-Options` | `nosniff` | MIME sniffing saldırılarını önler |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | HTTPS zorunlu kılar (HSTS) |
| `X-XSS-Protection` | `1; mode=block` | Browser XSS koruması |
| `Referrer-Policy` | `no-referrer` | Referrer bilgisi gönderilmez |

---

## 2. Rate Limiting

### API Genel Limit
- **Kural:** Her IP için 15 dakikada maksimum **100 istek**
- **Aşıldığında:** `429 Too Many Requests` döner

### Login Endpoint Limiti
- **Kural:** Her IP için 15 dakikada maksimum **5 istek**
- **Aşıldığında:** `429 Too Many Requests` döner
- **Amaç:** Brute force saldırılarını önler

### IP Whitelist
`.env` dosyasındaki `RATE_LIMIT_WHITELIST` ile belirlenen IP'ler (örn: dahili sunucu IP'leri) rate limiting'ten muaf tutulur.

---

## 3. Hesap Kilitleme (Account Lockout)

- **Tetikleyici:** Arka arkaya **5 başarısız giriş denemesi**
- **Kilitleme Süresi:** **15 dakika**
- **Sıfırlama:** Başarılı girişten sonra deneme sayacı otomatik olarak sıfırlanır
- **API Yanıtı:** `423 Locked` + kalan dakika bilgisi

---

## 4. JWT Token Güvenliği

### Access Token
- Kısa ömürlü (`JWT_EXPIRES_IN` – varsayılan: 1 saat)
- Her istekte `Authorization: Bearer <token>` başlığıyla gönderilir

### Refresh Token Rotation
- Refresh token kullanıldığında **hem access hem refresh token yenilenir**
- Kullanılan eski refresh token geçersiz kılınır
- Böylece çalınan refresh token'lar bir kereden fazla kullanılamaz

### Token Blacklist (Logout)
- Kullanıcı çıkış yaptığında mevcut access token bir blacklist'e eklenir
- Sonraki isteklerde blacklist kontrolü yapılır
- **Not:** Bu in-memory çözüm geliştirme içindir. Production'da **Redis** kullanılmalıdır.

---

## 5. Şifre Politikası

`changePassword` endpoint'inde zorunlu kurallar:

- Minimum **8 karakter**
- En az bir **büyük harf** (A-Z)
- En az bir **küçük harf** (a-z)
- En az bir **rakam** (0-9)
- En az bir **özel karakter**: `@$!%*?&._-#`

---

## 6. Input Sanitization

- **XSS Temizleme (`xss-clean`):** Request body, query ve params'taki tehlikeli HTML/JS karakterleri temizlenir
- **NoSQL Injection (`express-mongo-sanitize`):** `$` ve `.` ile başlayan anahtarlar kaldırılır
- **SQL Injection:** Sequelize ORM parametreli sorguları otomatik olarak kullanır
- **Body Limiti:** Request body boyutu maksimum **10kb** ile sınırlandırılmıştır (DoS önleme)

---

## 7. HTTPS / TLS

### Production Ortamında
- HTTP istekleri otomatik olarak HTTPS'e yönlendirilir (`301 Redirect`)
- HSTS başlığı 1 yıl (365 gün) süreyle zorunlu HTTPS'i bildirir

### Development Ortamında
- HTTPS zorunluluğu devre dışıdır (local geliştirme için)

### Mobile App (Certificate Pinning Rehberi)
React Native uygulamasında sertifika sabitleme için:
```javascript
// Önerilen: react-native-ssl-pinning paketi
import { fetch } from 'react-native-ssl-pinning';

fetch('https://api.yourdomain.com/api/auth/login', {
  method: 'POST',
  sslPinning: {
    certs: ['cert_sha256_hash'] // Sunucu sertifikasının SHA256 hash'i
  },
  body: JSON.stringify({ username, password })
});
```

---

## 8. CORS Politikası

- Yalnızca `.env` dosyasındaki `CORS_ORIGIN` değişkeninde listelenen origin'lere izin verilir
- `OPTIONS` preflight istekleri desteklenir
- İzin verilen header'lar: `Content-Type`, `Authorization`, `Bypass-Tunnel-Reminder`

---

## 9. Hata Yanıtı Güvenliği

### Development
Stack trace dahil detaylı hata bilgisi döner.

### Production
- Stack trace **gizlenir**
- Operational hatalar güvenli mesajlarla döner
- Beklenmedik hatalar `"Bilinmeyen bir hata oluştu!"` mesajıyla maskelenir

---

## 10. Gelecek Geliştirmeler (Roadmap)

- [ ] Redis ile distributed rate limiting ve token blacklist
- [ ] 2FA (Two-Factor Authentication)
- [ ] API Key yönetimi (harici entegrasyonlar için)
- [ ] Audit log tablosuna güvenlik olaylarını kaydetme
- [ ] WAF (Web Application Firewall) entegrasyonu

---

*Son güncelleme: Mayıs 2026*
