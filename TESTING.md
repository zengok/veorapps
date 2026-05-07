# ✅ Veor Collection — Test Checklist

> Production öncesi tüm cihazlarda tamamlanmalıdır.

## 🔐 Kimlik Doğrulama
- [ ] Login çalışıyor (`ortak1@veor.com` / `veor2025`)
- [ ] Yanlış şifre reddediliyor
- [ ] Oturum uygulama kapatılınca korunuyor

## 📊 Dashboard
- [ ] Dashboard verileri doğru hesaplanıyor (bugün, bu hafta, bu ay)
- [ ] Bugünkü Ciro doğru
- [ ] Stok Değeri doğru
- [ ] Kritik stok uyarısı çıkıyor (stok ≤ 3)
- [ ] Pull-to-refresh çalışıyor
- [ ] Hızlı menü butonları doğru sekmeye gidiyor

## 🛍️ Satış
- [ ] Kategori seçimi çalışıyor
- [ ] Stok 0 olan ürün listenin sonunda ve tıklanamıyor
- [ ] Modal açılıyor, +/- adet çalışıyor
- [ ] Toplam canlı hesaplanıyor
- [ ] Satış yapılınca stok düşüyor
- [ ] Stok 1 kalınca bildirim geliyor

## 📋 Sipariş
- [ ] Aktif siparişler listeleniyor
- [ ] Yeni sipariş oluşturuluyor (müşteri notu ile)
- [ ] "Hazırlandı ✓" → sipariş tamamlanıyor, satışa dönüşüyor ve stok düşüyor
- [ ] "İptal" → sipariş kaldırılıyor
- [ ] Pull-to-refresh çalışıyor

## 📦 Stok
- [ ] Yeni ürün ekleniyor
- [ ] Yeni ürün 3 telefonda da görünüyor (pull-to-refresh sonrası)
- [ ] Görsel yükleme çalışıyor
- [ ] Düzenle / Sil çalışıyor
- [ ] Stok 0 kırmızı border, stok ≤ 5 turuncu border

## 🔔 Bildirimler
- [ ] Zil ikonunda badge sayısı doğru
- [ ] Bildirimler ekranı açılıyor
- [ ] "Tümünü Okundu" çalışıyor

## 🌐 Çoklu Cihaz
- [ ] APK 3 telefonda çalışıyor
- [ ] 2 ortak aynı anda kullanabiliyor

## ⏰ Zaman Hesaplamaları
- [ ] Pazartesi 00:00'da haftalık sayaç sıfırlanıyor (tarih bazlı query, otomatik)
- [ ] Ayın 1'i 00:00'da aylık sayaç sıfırlanıyor

## ✍️ Test Sonuçları

| Tarih | Cihaz | Tester | Sonuç |
|---|---|---|---|
| | | | |
| | | | |
| | | | |
