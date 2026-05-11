# 🌸 Veor Collection

**Veor Collection** — Parfüm stok takip, satış yönetimi ve sipariş sistemi. 3 ortak için tasarlanmış React Native mobil uygulama + Node.js backend.

---

## 📱 Özellikler

| Özellik | Açıklama |
|---|---|
| 📊 Dashboard | Günlük/haftalık/aylık satış özeti, ciro ve stok değeri |
| 🛍️ Satış Girişi | Ürün seçimi, adet belirleme, otomatik stok düşürme |
| 📋 Sipariş Yönetimi | Sipariş oluşturma, hazırlandı işaretleme, satışa otomatik dönüştürme |
| 📦 Stok Yönetimi | Ürün ekleme/düzenleme/silme, Cloudinary görsel yükleme |
| 🔔 Bildirimler | Kritik stok uyarıları (polling 30sn), uygulama içi bildirimler |
| 🔐 Kimlik Doğrulama | JWT tabanlı, 3 ortak hesabı |

---

## 🏗️ Teknik Mimari

```
veorapps/
├── backend/          # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── controllers/    # İş mantığı katmanı
│   │   ├── routes/         # API endpoint tanımları
│   │   ├── middleware/      # Auth, rate limit, validation
│   │   └── utils/          # Yardımcı fonksiyonlar
│   ├── prisma/
│   │   ├── schema.prisma   # Veritabanı şeması
│   │   └── seed.ts         # İlk veriler (3 ortak hesabı)
│   └── render.yaml         # Render.com deploy config
│
└── mobile/           # React Native + Expo + TypeScript
    ├── src/
    │   ├── components/     # DashboardCard, ProductCard, OrderItem vb.
    │   ├── screens/        # HomeScreen, SaleScreen, OrderScreen, StockScreen, NotificationScreen
    │   ├── navigation/     # Stack + Bottom Tab navigator
    │   ├── contexts/       # AuthContext, NotificationContext
    │   ├── services/       # API katmanı (axios)
    │   ├── types/          # TypeScript tip tanımları
    │   └── utils/          # formatCurrency vb.
    ├── assets/             # icon.png, splash.png, logo.png, adaptive-icon.png
    └── eas.json            # EAS build profilleri
```

**Teknoloji Stack:**

| Katman | Teknoloji |
|---|---|
| Mobile | React Native, Expo SDK 51, TypeScript |
| Navigation | React Navigation v6 (Stack + Bottom Tabs) |
| Backend | Node.js 20, Express, TypeScript |
| Veritabanı | PostgreSQL (Neon.tech), Prisma ORM |
| Kimlik Doğrulama | JWT (jsonwebtoken) |
| Görseller | Cloudinary (multer + multipart upload) |
| Güvenlik | Helmet, express-rate-limit, bcrypt |
| Deploy | Render.com (backend), EAS (APK) |

---

## 🖥️ Local Geliştirme

### Gereksinimler
- Node.js v20+
- npm v9+
- Expo Go app (iOS/Android) veya Android emülatör

### Backend

```bash
cd backend

# Bağımlılıkları yükle
npm install

# .env dosyasını oluştur
cp .env.example .env
# .env içindeki değerleri doldur (DATABASE_URL, JWT_SECRET, Cloudinary)

# Veritabanı migration ve seed
npx prisma migrate dev
npx prisma db seed

# Geliştirme sunucusunu başlat (http://localhost:4000)
npm run dev
```

### Mobile

```bash
cd mobile

# Bağımlılıkları yükle
npm install

# .env dosyasını oluştur
cp .env.example .env
```

`.env` dosyasını düzenle — `X` yerine bilgisayarının local IP'sini yaz:
```
# Terminalde: ipconfig getifaddr en0
EXPO_PUBLIC_API_URL=http://192.168.1.X:4000/api
```

```bash
# Expo geliştirme sunucusunu başlat
npx expo start

# QR kodu Expo Go uygulamasıyla tara (telefon ve bilgisayar aynı Wi-Fi'da olmalı)
```

### Asset Dosyaları

`mobile/assets/` klasörüne şu dosyalar gereklidir:

| Dosya | Boyut | Açıklama |
|---|---|---|
| `icon.png` | 1024×1024 | Uygulama ikonu |
| `adaptive-icon.png` | 1024×1024 | Android adaptive icon (ön plan) |
| `splash.png` | 1284×2778 | Açılış ekranı |
| `logo.png` | Herhangi | Login/header logosu |
| `background.png` | Herhangi | Login arka plan görseli |

---

## 🚀 Production Deploy

**→ Adım adım Türkçe rehber için: [DEPLOYMENT.md](./DEPLOYMENT.md)**

Kısa özet:
1. **Neon.tech** → PostgreSQL veritabanı (ücretsiz)
2. **Cloudinary** → Görsel depolama (ücretsiz)
3. **Render.com** → Backend deploy (ücretsiz)
4. **UptimeRobot** → Backend'i uyanık tut (ücretsiz)
5. **EAS Build** → Android APK üret → ortaklara dağıt

**Toplam maliyet: 0₺**

---

## 🔧 Sorun Giderme

**→ [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)**

---

## ✅ Test

**→ [TESTING.md](./TESTING.md)**

---

## 📋 API Endpoints

| Method | Endpoint | Açıklama |
|---|---|---|
| `POST` | `/api/auth/login` | Giriş |
| `GET` | `/api/auth/me` | Mevcut kullanıcı |
| `GET` | `/api/products` | Ürün listesi (category filtresi) |
| `POST` | `/api/products` | Yeni ürün (multipart) |
| `PUT` | `/api/products/:id` | Ürün güncelle (multipart) |
| `DELETE` | `/api/products/:id` | Ürün sil |
| `POST` | `/api/sales` | Satış oluştur |
| `GET` | `/api/sales` | Satış listesi |
| `POST` | `/api/orders` | Sipariş oluştur |
| `GET` | `/api/orders` | Sipariş listesi (status filtresi) |
| `PATCH` | `/api/orders/:id/complete` | Siparişi tamamla → satışa çevir |
| `DELETE` | `/api/orders/:id` | Siparişi iptal et |
| `GET` | `/api/dashboard` | Dashboard istatistikleri |
| `GET` | `/api/notifications` | Bildirimler |
| `PATCH` | `/api/notifications/:id/read` | Bildirimi okundu işaretle |
| `PATCH` | `/api/notifications/read-all` | Tümünü okundu işaretle |
| `GET` | `/health` | Sağlık kontrolü |

---

## 👥 Ortaklar

| Hesap | E-posta | Şifre |
|---|---|---|
| Gökhan Özen | `ortak1@veor.com` | `veor2025` |
| Batuhan Işık | `ortak2@veor.com` | `veor2025` |
| Barış Egemen Bulut | `ortak3@veor.com` | `veor2025` |

> ⚠️ Production'da şifreleri değiştirin!
