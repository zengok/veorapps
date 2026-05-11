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

## 🎨 UX/UI Tasarım Yönergeleri
- [ ] Tüm ekranlarda aynı renk paleti, yazı stili, buton yapısı, kart yapısı ve boşluk sistemi kullanılıyor
- [ ] Login ekranında Veor marka hissi net: logo, başlık, arka plan ve form alanları tutarlı görünüyor
- [ ] Ana sayfa dashboard'u hızlı karar aldırıyor: satış özeti, ciro, stok değeri, kritik stok ve hızlı işlemler kolay okunuyor
- [ ] Satış ekranında ürün arama, kategori seçimi, ürün kartları ve satış modalı tek elle hızlı kullanılabiliyor
- [ ] Sipariş ekranında aktif siparişler, yeni sipariş akışı, işlem butonları ve müşteri notu görsel olarak net ayrılıyor
- [ ] Stok ekranında düşük stok, stokta yok ve normal stok durumları renk/etiket ile kolay ayırt ediliyor
- [ ] Ürün ekleme/düzenleme formunda alan sırası, hata mesajları ve görsel yükleme akışı anlaşılır
- [ ] Excel import sonucu kullanıcıya açık şekilde gösteriliyor: yeni ürün, güncellenen ürün, atlanan satır ve hatalar ayrı görünüyor
- [ ] Boş durumlar özel mesajla gösteriliyor: ürün yok, sipariş yok, bildirim yok, arama sonucu yok
- [ ] Bağlantı hatası, yetki hatası ve işlem başarısızlığı durumlarında kullanıcı ne yapacağını anlayabiliyor
- [ ] Loading durumları kullanıcıyı bekletirken ekranı kilitlenmiş gibi göstermiyor
- [ ] Kritik işlemler yanlış dokunmaya karşı korunuyor: satış yapma, sipariş tamamlama, ürün silme ve satış sıfırlama onay istiyor
- [ ] Buton dokunma alanları küçük ekranlarda rahat basılabilir boyutta
- [ ] Uzun ürün isimleri, uzun müşteri notları ve büyük fiyat değerleri taşma/üst üste binme yapmıyor
- [ ] Yazı kontrastı açık ve koyu zeminlerde okunabilir
- [ ] Alt menü ikonları ve başlıkları anlaşılır, aktif sekme belirgin
- [ ] Bildirimden ilgili stok/sipariş/satış detayına geçiş akışı kullanıcı beklentisine uygun
- [ ] Aynı işlem sonrası geri bildirim tutarlı: başarı, hata, uyarı ve bilgi mesajları aynı görsel dilde
- [ ] Modal, alert ve form ekranlarında kapatma/geri dönme davranışı tahmin edilebilir
- [ ] Uygulama iOS ve Android cihazlarda güvenli alanlara uyuyor; çentik, status bar ve alt navigasyon çakışmıyor
- [ ] Küçük ekran, büyük ekran ve farklı font boyutu ayarlarında arayüz bozulmuyor
- [ ] Ürün görselleri yavaş yüklenirse placeholder düzgün görünüyor
- [ ] Arayüz parfüm/mağaza yönetimi bağlamına uygun, premium ama sade bir marka hissi veriyor
- [ ] Gereksiz açıklama metinleri yerine ikonlar, etiketler ve net işlem adları kullanılıyor
- [ ] Tekrarlanan arayüz parçaları ortak bileşenlerle tutarlı görünüyor: Button, Input, Card, Modal, Badge, EmptyState

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
