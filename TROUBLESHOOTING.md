# 🔧 Veor Collection — Sorun Giderme Rehberi

---

## 📡 Bağlantı Sorunları

### ❌ "Telefon backend'e bağlanamıyor"

**Kontrol listesi (sırayla):**

1. **Render URL doğru mu?**
   - `mobile/eas.json` → `EXPO_PUBLIC_API_URL` değeri: `https://veor-collection.onrender.com/api`
   - Tarayıcıdan `https://veor-collection.onrender.com/health` aç → `{"status":"ok"}` görmeli

2. **Render servisi uyanık mı? (Cold Start)**
   - Render Free plan 15 dakika kullanılmazsa uyku moduna girer
   - İlk istek **30-60 saniye** sürebilir — bu normaldir, bekle
   - UptimeRobot kurulduysa sorun yaşanmaz (bkz. DEPLOYMENT.md §D)

3. **UptimeRobot çalışıyor mu?**
   - uptimerobot.com → Dashboard → Monitörün durumu **yeşil (Up)** olmalı
   - Son kontrol zamanı 5 dakikadan eski ise monitörü kontrol et

4. **Local geliştirmede "bağlanamıyor"**
   - `mobile/.env` dosyasındaki IP doğru mu?
   - `EXPO_PUBLIC_API_URL=http://192.168.1.X:4000/api` → X = bilgisayarın local IP'si
   - Telefon ve bilgisayar aynı Wi-Fi ağında mı?
   - Terminalde `ipconfig getifaddr en0` komutuyla IP'yi öğren

---

## 🖼️ Görsel Sorunları

### ❌ "Görsel yüklenmiyor" / "Fotoğraf seçilemiyor"

1. **Cloudinary credentials yanlış mı?**
   - Render → Environment Variables → `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` değerlerini kontrol et
   - Cloudinary Dashboard → Settings → Access Keys ile karşılaştır

2. **Dosya boyutu çok büyük mü?**
   - Maksimum dosya boyutu: **5MB**
   - Uygulama görselleri `800x800` ve `quality: 0.7` ile sıkıştırıyor
   - Ham görsel çok büyükse telefon galerisinden küçük boyutlu bir fotoğraf seç

3. **Galeri izni verilmedi mi?**
   - Android: Ayarlar → Uygulamalar → Veor Collection → İzinler → Depolama ✓
   - Uygulamayı kapatıp tekrar aç

4. **Render backend log'unu kontrol et:**
   - Render Dashboard → Web Service → **Logs** sekmesi
   - `Cloudinary upload error` veya benzeri hata mesajı var mı?

---

## 🔔 Bildirim Sorunları

### ❌ "Stok uyarı bildirimi gelmiyor"

1. **Uygulama açık olmalı**
   - Bildirimler, uygulama **açıkken** 30 saniyede bir polling ile kontrol edilir
   - Uygulama arka planda kapalıysa bildirim gelmez (bu bir kısıtlama, normal)

2. **Bildirim izni verildi mi?**
   - Android: Ayarlar → Uygulamalar → Veor Collection → Bildirimler → İzin ver ✓
   - Uygulama ilk açıldığında izin sorar — **"İzin Ver"** seçilmeli

3. **Polling süresi hakkında**
   - Her 30 saniyede bir backend'e istek atılır
   - Stok kritik seviyeye düştükten sonra maksimum **30 saniye** bekle

4. **Bildirimler ekranını manuel kontrol et:**
   - Header'daki 🔔 ikona dokun → Bildirimler listesini gör
   - "Tümünü Okundu" basılmış olabilir — listedeki bildirim sayısını kontrol et

---

## 🔄 Senkronizasyon Sorunları

### ❌ "Stok/Satış değişikliği diğer telefonda görünmüyor"

1. **Pull-to-refresh yap**
   - İlgili ekranda (Stok, Sipariş, Ana Sayfa) ekranı **aşağı çek** → yenile
   - Dashboard otomatik güncellenir ama manuel yenileme en hızlı yol

2. **Sekme yenileme**
   - Bottom tab'da başka bir sekmeye geç → tekrar ilgili sekmeye geri dön
   - `useFocusEffect` her sekme odaklanmasında veriyi yeniler

3. **Polling 30sn bekle**
   - Bildirimler 30 saniyede bir yenilenir
   - Satış/stok verileri ise manuel veya sekme geçişinde yenilenir

---

## 🔐 Giriş Sorunları

### ❌ "Giriş yapılamıyor"

1. **E-posta / şifre yanlış mı?**
   - Seed'den gelen hesaplar: `ortak1@veor.com` / `veor2025`
   - Büyük/küçük harf duyarlıdır

2. **Backend'e ulaşılamıyor mu?**
   - "Bağlantı Sorunları" bölümünü kontrol et

3. **Token geçersiz hata aldıysan:**
   - Uygulamayı tamamen kapat ve yeniden aç (logout → login)
   - Telefon saati doğru mu? JWT token süre doğrulaması yapar

### ❌ "JWT_SECRET değiştirildi / tüm kullanıcılar çıktı"
- Bu normaldir — JWT_SECRET değiştiğinde tüm token'lar geçersiz olur
- Tüm ortaklar tekrar giriş yapmalı

---

## 📦 APK Sorunları

### ❌ "APK yüklenmiyor"

1. **"Bilinmeyen kaynaklardan yükleme" izni:**
   - Android 8+: Tarayıcı uygulaması → Ayarlar → Bilinmeyen uygulamalara izin ver ✓
   - Eski Android: Ayarlar → Güvenlik → Bilinmeyen kaynaklar ✓

2. **"Uygulama yüklenemedi" hatası:**
   - Telefon depolama alanı dolu olabilir (en az 100MB boş alan gerekir)
   - İndirilmiş APK dosyası bozuk olabilir — yeniden indir

3. **Eski sürüm kaldırılmadı:**
   - Güncelleme APK'sı aynı `package` ID'ye sahip, otomatik güncellemeli
   - Sorun yaşarsa eski uygulamayı kaldır → yeni APK'yı kur

---

## 🛠️ Backend Build Sorunları

### ❌ "Render build başarısız"

1. **Prisma generate hatası:**
   ```
   Error: Cannot find module '@prisma/client'
   ```
   - `render.yaml` → `buildCommand`'ın `npx prisma generate` içerdiğini doğrula
   - `package.json` → `"postinstall": "prisma generate"` var mı?

2. **TypeScript derleme hatası:**
   - Render → Logs → hata satırını bul
   - Local'de `cd backend && npm run build` çalıştır → aynı hatayı gör ve düzelt

3. **Migrate hatası:**
   - `DATABASE_URL` doğru girildi mi? Neon bağlantı stringi `?sslmode=require` ile bitiyor mu?
   - Neon Dashboard → Proje ayarları → Connection string'i yeniden kopyala

---

## 📞 Yardım

Çözülemeyen sorunlar için:
- Render Logs: `render.com → Web Service → Logs`
- Expo Build Logs: `expo.dev → Projects → Builds`
- Neon Logs: `neon.tech → Project → Operations`
