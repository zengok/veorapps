# Veor Collection API

Veor Collection parfüm envanter ve satış yönetim sistemi için RESTful backend API.

## 📚 API Dokümantasyonu

> **Swagger UI (interaktif):** [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
>
> **OpenAPI JSON Spec:** [http://localhost:3000/api-docs.json](http://localhost:3000/api-docs.json)

Swagger UI üzerinden tüm endpoint'leri test edebilir, Bearer token girebilir ve request/response şemalarını inceleyebilirsiniz.

---

## 🚀 Kurulum

### Gereksinimler
- Node.js 18+
- PostgreSQL 15+
- Cloudinary hesabı (medya yönetimi için)

### 1. Bağımlılıkları kur
```bash
cd backend
npm install
```

### 2. `.env` dosyasını oluştur
```bash
cp .env.example .env
# .env dosyasını kendi değerlerinizle güncelleyin
```

### 3. Veritabanını oluştur ve migrate et
```bash
npm run db:create    # PostgreSQL veritabanını oluşturur
npm run db:migrate   # Tabloları oluşturur
npm run db:seed      # Demo veriyi ekler
```

### 4. Sunucuyu başlat
```bash
npm start
```

---

## 🔌 API Endpoint Grupları

| Grup | Base URL | Açıklama |
|------|----------|----------|
| Auth | `/api/auth` | Giriş, çıkış, token yenileme, şifre değişimi |
| Products | `/api/products` | Ürün CRUD, stok, resim yükleme |
| Sales | `/api/sales` | Satış oluşturma, iptal, Excel export |
| Categories | `/api/categories` | Kategori yönetimi |
| Users | `/api/users` | Kullanıcı yönetimi ve profil |
| Analytics | `/api/analytics` | Dashboard, trend, top ürün/satıcı |
| Media | `/api/media` | Cloudinary medya upload/delete |

---

## 🔐 Kimlik Doğrulama

```bash
# Giriş yap ve token al
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "batuhan", "password": "Veor2024!"}'

# Token ile korumalı endpoint'e erişim
curl http://localhost:3000/api/products \
  -H "Authorization: Bearer <token>"
```

---

## 🛡️ Güvenlik Özellikleri

- **Helmet.js** – HTTP güvenlik başlıkları (CSP, HSTS, X-Frame-Options, vb.)
- **Rate Limiting** – Login: 5/15dk, API: 100/15dk
- **Account Lockout** – 5 başarısız denemede 15 dakika kilitleme
- **JWT Token Rotation** – Refresh token her kullanımda yenilenir
- **Token Blacklist** – Logout sonrası access token geçersiz kılınır
- **Input Sanitization** – XSS ve NoSQL injection koruması
- **Sequelize ORM** – Otomatik prepared statements (SQL injection koruması)

---

## ☁️ Cloudinary Medya Yönetimi

Ürün resimleri Cloudinary üzerinde yönetilir:
- **Auto-optimize:** WebP/AVIF dönüşümü, kalite optimizasyonu
- **Çoklu çözünürlük:** thumbnail (100x100), medium (300x300), large (800x800), placeholder
- **Cascade delete:** Ürün silindiğinde Cloudinary görseli de otomatik silinir

---

## 🗄️ Veritabanı Komutları

```bash
npm run db:migrate        # Migration çalıştır
npm run db:migrate:undo   # Son migration'ı geri al
npm run db:seed           # Seed data ekle
npm run migrate-data      # SQLite'tan PostgreSQL'e veri aktar
```

---

## 📖 Güvenlik Politikası

Detaylı güvenlik dokümantasyonu için → [SECURITY.md](./SECURITY.md)
