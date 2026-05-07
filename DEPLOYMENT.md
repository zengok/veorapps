# 🚀 Veor Collection — Deployment Rehberi

> Bu rehber, Veor Collection uygulamasını tamamen ücretsiz cloud servisler kullanarak production'a almak için adım adım Türkçe talimatlar içerir.

---

## A) Veritabanı — Neon.tech (PostgreSQL)

1. **[neon.tech](https://neon.tech)** adresine git → **Sign up** (GitHub ile)
2. **New Project** → İsim: `veor-collection` → Region: **EU Frankfurt** (Türkiye'ye en yakın)
3. Proje oluşturulduktan sonra **Dashboard → Connection String** bölümünü aç
4. `postgresql://...` formatındaki bağlantı stringini kopyala ve güvenli bir yere kaydet
5. ⚠️ Bağlantı stringi şu şekilde görünür:
   ```
   postgresql://kullanici:sifre@ep-xxx.eu-central-1.aws.neon.tech/veor-collection?sslmode=require
   ```

---

## B) Görsel Depolama — Cloudinary

1. **[cloudinary.com](https://cloudinary.com)** → **Sign up** (ücretsiz plan: 25GB depolama)
2. E-posta doğrulaması yap
3. **Dashboard** → sol üstteki hesap bilgilerinden şunları kopyala:
   - **Cloud Name** (örn: `dxyz123abc`)
   - **API Key** (örn: `123456789012345`)
   - **API Secret** (örn: `abcdefg...`)

---

## C) Backend — Render.com

### 1. GitHub Hazırlığı
```bash
# veorapps/backend klasörünü ayrı bir repo olarak push et
cd /Users/macbook/Desktop/veorapps

# Eğer monorepo kullanıyorsan backend/ subfolder olarak da push edebilirsin
git add .
git commit -m "feat: production ready"
git push origin main
```

### 2. Render.com Kurulumu
1. **[render.com](https://render.com)** → **Sign up** (GitHub ile)
2. Dashboard → **New +** → **Web Service**
3. GitHub reposunu bağla → `veorapps` reposunu seç
4. Ayarlar:
   | Alan | Değer |
   |---|---|
   | **Name** | `veor-collection` |
   | **Region** | Frankfurt (EU Central) |
   | **Branch** | `main` |
   | **Root Directory** | `backend` *(monorepo ise)* |
   | **Build Command** | `npm install && npx prisma generate && npx prisma migrate deploy && npm run build` |
   | **Start Command** | `npm start` |
   | **Plan** | **Free** |

### 3. Environment Variables
Render → Web Service → **Environment** sekmesi → aşağıdaki değişkenleri ekle:

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | *(Neon'dan kopyaladığın postgresql://... string)* |
| `JWT_SECRET` | *(32+ karakter random string — [buradan üret](https://randomkeygen.com))* |
| `CLOUDINARY_CLOUD_NAME` | *(Cloudinary Cloud Name)* |
| `CLOUDINARY_API_KEY` | *(Cloudinary API Key)* |
| `CLOUDINARY_API_SECRET` | *(Cloudinary API Secret)* |

### 4. Deploy
- **Save** → Deploy otomatik başlar (~5 dakika)
- Canlı URL: **`https://veor-collection.onrender.com`**
- Deploy log'u izle → `Server running on port ...` mesajını bekle

### 5. Test
```bash
# Tarayıcıda veya Postman'da test et:
https://veor-collection.onrender.com/health
# Yanıt: {"status":"ok","timestamp":"..."}
```

### 6. Seed Verilerini Yükle
1. Render Dashboard → Web Service → **Shell** sekmesi
2. Aşağıdaki komutu çalıştır:
   ```bash
   npx prisma db seed
   ```
3. Seed sonrası oluşan kullanıcılar:
   | E-posta | Şifre |
   |---|---|
   | `ortak1@veor.com` | `veor2025` |
   | `ortak2@veor.com` | `veor2025` |
   | `ortak3@veor.com` | `veor2025` |

---

## D) Uygulamayı Uyanık Tut — UptimeRobot

> Render Free plan'da servis 15 dakika kullanılmazsa uyku moduna girer. İlk istek 30-60sn sürebilir. Bu adımla engelliyoruz.

1. **[uptimerobot.com](https://uptimerobot.com)** → **Sign up** (ücretsiz)
2. Dashboard → **Add New Monitor**
3. Ayarlar:
   | Alan | Değer |
   |---|---|
   | **Monitor Type** | HTTP(s) |
   | **Friendly Name** | Veor Collection API |
   | **URL** | `https://veor-collection.onrender.com/health` |
   | **Monitoring Interval** | 5 minutes |
4. **Create Monitor** → artık 5 dakikada bir ping atıyor, servis uyanık kalıyor

---

## E) Mobile APK Build — EAS (Expo Application Services)

### 1. Hazırlık
```bash
cd /Users/macbook/Desktop/veorapps/mobile

# EAS CLI'yi global yükle
npm install -g eas-cli

# Expo hesabına giriş (expo.dev'de hesap aç)
eas login

# Projeyi EAS'a bağla (projectId otomatik app.json'a yazılır)
eas init
```

### 2. API URL Doğrulaması
`mobile/eas.json` dosyasındaki `production` profilinde URL'i kontrol et:
```json
"EXPO_PUBLIC_API_URL": "https://veor-collection.onrender.com/api"
```

### 3. APK Build
```bash
# Production APK build başlat (~15-20 dakika)
eas build --platform android --profile production
```

### 4. APK Dağıtımı
- Build tamamlandığında terminalde **indirme linki** ve **QR kod** çıkar
- Linki 3 ortakla paylaş (WhatsApp, Telegram vb.)
- Her ortak telefonuna şu adımları uygular:

**Android APK Kurulum Adımları:**
1. APK linkini telefonun tarayıcısında aç
2. İndirme başladıktan sonra **"Aç"** veya **"Yükle"** butonuna bas
3. Eğer **"Bilinmeyen kaynaklardan yükleme"** uyarısı gelirse:
   - Android 8+: Ayarlar → Uygulamalar → Tarayıcı → Bilinmeyen kaynaklara izin ver ✓
   - Eski Android: Ayarlar → Güvenlik → Bilinmeyen kaynaklar ✓
4. APK'yı kur → **Veor Collection** uygulaması açılır

---

## F) İlk Kullanım

1. APK'yı aç → **Login ekranı** görünür
2. Seed'den gelen bilgilerle giriş yap (her ortağa ayrı hesap):
   - Ortak 1: `ortak1@veor.com` / `veor2025`
   - Ortak 2: `ortak2@veor.com` / `veor2025`
   - Ortak 3: `ortak3@veor.com` / `veor2025`
3. **Stok** sekmesine git → **"+ Yeni Ürün"** ile gerçek parfümleri ekle (görsel, fiyat, stok)
4. Artık tüm ortaklar satış girebilir, sipariş oluşturabilir

---

## G) Gelecekteki Güncellemeler

### Backend Güncelleme (otomatik)
```bash
git add .
git commit -m "fix: ..."
git push origin main
# Render otomatik deploy yapar (~3-4 dakika)
```

### Mobile Güncelleme (yeni APK)
```bash
cd mobile
# app.json'da versionCode'u artır (1 → 2)
eas build --platform android --profile production
# Yeni APK linkini ortaklarla paylaş
```

---

## H) Maliyet Özeti

| Servis | Plan | Aylık Maliyet |
|---|---|---|
| Neon.tech (Veritabanı) | Free (3GB) | **0₺** |
| Cloudinary (Görseller) | Free (25GB) | **0₺** |
| Render.com (Backend) | Free (750h/ay) | **0₺** |
| UptimeRobot (Monitor) | Free (50 monitor) | **0₺** |
| Expo EAS (APK Build) | Free (30 build/ay) | **0₺** |
| **TOPLAM** | | **0₺** |

> ⚠️ Render Free plan: Ayda 750 saat compute saatine sahip. UptimeRobot ile sürekli uyanık tutulduğunda ~720 saat harcıyor. Yoğun trafikte ücretli plana geçiş gerekebilir (aylık ~7$).
