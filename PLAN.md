# Captain Calculation Web — Akış Planı

Tenis lig takım kaptanı için lig giderini oyunculara dağıtan, tek sayfa, DB'siz Next.js uygulaması.

## Tech Stack
- Next.js 15 (App Router) + TypeScript
- Tailwind CSS
- localStorage (state persistence)
- `papaparse` (CSV import), `xlsx` (Excel export)
- Tek route (`/`), wizard görünümlü tek sayfa

## Genel Konsept
- **Kasa = kaptanın yönettiği ortak hesap.** Lig ücreti L kasadan ödenir.
- Oyuncular kasaya **avans** verir (a_i).
- Oyuncuya düşen **pay** (share_i) seçilen kurala göre hesaplanır.
- **net_i = a_i − share_i** → pozitifse kasadan alacak, negatifse kasaya borç.
- Mahsup ya **kasa merkezli** ya **peer-to-peer** (min transfer).

## İki Üst-Mod (en önemli toggle)
- **Mod 1 — Tam Mahsup**: Σ net_i = 0 zorunlu. Tolerans kullanılırsa "yeniden dağıt" davranışı uygulanır.
- **Mod 2 — Açık Kasa**: Kasada artık para kalabilir. Tolerans / muaf-kasa-üstlensin gibi seçenekler kasa bakiyesine yazılır. Bilgi olarak gösterilir.

## Konfigürasyonlar

### Lig & Maliyet
- `L` (lig ücreti)
- Kaptan adı (oyuncular arasında işaretlenmiş)
- Sponsor/dış katkı (varsayılan: L'den düşer)
- Maliyet kuralı:
  - **M1**: Eşit (L/N)
  - **M2**: Gerçek maç başı (L / M veya L / (M+W))
  - **M3**: Beklenen — planlanan toplam maç sayısı input

### Lig Metadata (opsiyonel ama kullanışlı)
- Kadro büyüklüğü
- Lig maçı sayısı (örn 12)
- Lig maçı başına oyuncu sayısı (örn 12)
- Bu üçü → planlanan_maç = lig_maçı × oyuncu_per_maç (M3 için otomatik çıkarım)
- Validasyon için üst sınır

### WO
- WO sayısı (global)
- Dağıtım kapsamı: tüm kadro / en az 1 maç oynayanlar
- Default: maç_birim = L / (M + W)

### Oyuncu Bayrakları (per-player)
- `kaptan` (1 kişi)
- `avans muaf` (a_i = 0 kilitli)
- `payı kaptan üstlensin` (share_i kaptana eklenir)
- `payı takıma dağıt` (share_i kalan oyunculara eşit)
- `payı kasa üstlensin` (sadece Mod 2'de; share_i kasaya yazılır)

### Tolerans (opsiyonel)
- Tip:
  - **Maç bandı**: ortalama ± X maç
  - **Para eşiği**: |net_i| ≤ X TL
  - İkisi de aktif olabilir
- Davranış (Mod 1: zorunlu yeniden dağıt; Mod 2: seçilebilir):
  - Yeniden dağıt (forgiven olanlar avansla kilitli, kalan maliyet diğerlerine)
  - Kasaya bırak

### Minimum Giriş Ücreti (opsiyonel)
- Hiç oynamayan oyunculardan kesilir (m_i = 0 ise)
- Geri kalan avans iade edilir

### Mahsup Modu
- Kasa merkezli
- Peer-to-peer (greedy min-transfer)

## Algoritma Pipeline (sıra önemli)
1. **L_dağıt** = L − sponsor
2. **Base share** her oyuncu için maliyet kuralı + WO ile hesaplanır
3. **Özel oyuncu kuralları** uygulanır (muaf / kaptan üstlensin / takıma dağıt / kasa üstlensin)
4. **Net hesabı**: net_i = a_i − share_i
5. **Tolerans**: forgiven setini belirle, davranışa göre yeniden dağıt veya kasaya bırak
6. **Min giriş ücreti**: m_i = 0 olanlardan kesinti
7. **Mahsup tablosu**: kasa veya P2P matrix
8. **Kasa bakiyesi**: Mod 2'de hesapla & göster

## Wizard Adımları (tek sayfada step navigator)
1. **Kurulum** — L, kaptan adı, mod (1/2), maliyet kuralı, sponsor, lig metadata, WO scope, tolerans, min ücret, mahsup modu
2. **Kadro** — oyuncu listesi (manuel ekle / CSV import), her oyuncu için bayraklar
3. **İlk Ücretler** — avanslar (manuel / eşit dağıt butonu / CSV)
4. **Maç Verileri** — m_i, W (manuel / CSV)
5. **Sonuç** — pay/net tablosu, transfer matrisi, kasa bakiyesi (Mod 2), Excel export

Step'ler arası ileri-geri serbest. Her step'te değişiklik canlı sonuç ekranını günceller.

## Persistence
- **localStorage**: tüm config + oyuncu listesi (her değişiklikte yazılır)
- **JSON Export**: tüm state'i tek dosyaya alır (paylaşım/yedek)
- **JSON Import**: dosyadan geri yükler
- **Reset**: localStorage temizlenir, kullanıcı uyarılır

## CSV Formatları (öneri, sonra detaylandırılacak)
- **Oyuncu listesi**: `name,is_captain,exempt_advance,share_covered_by_captain,share_distributed_to_team,share_covered_by_kasa`
- **Avans**: `name,advance`
- **Maç**: `name,matches`

Türkçe karakter desteği için UTF-8 BOM + virgül ayraç. Excel'de doğru açılır.

## Excel Export
- `.xlsx` formatı (xlsx kütüphanesi)
- 3 sayfa: Özet, Detay (oyuncu bazlı), Transfer Matrisi (P2P modu)

## Dosya Yapısı (tahmini)
```
captain-calculation-web/
├── PLAN.md                       (bu dosya)
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx              (wizard ana sayfa)
│   │   └── globals.css
│   ├── components/
│   │   ├── wizard/
│   │   │   ├── StepNavigator.tsx
│   │   │   ├── Step1Setup.tsx
│   │   │   ├── Step2Roster.tsx
│   │   │   ├── Step3Advances.tsx
│   │   │   ├── Step4Matches.tsx
│   │   │   └── Step5Results.tsx
│   │   ├── ResultTable.tsx
│   │   └── TransferMatrix.tsx
│   ├── lib/
│   │   ├── types.ts              (Player, Config, Result)
│   │   ├── algorithm.ts          (pipeline + cost calc + tolerance + settlement)
│   │   ├── min-transfer.ts       (P2P greedy algorithm)
│   │   ├── csv.ts                (papaparse helpers)
│   │   ├── excel.ts              (xlsx export)
│   │   ├── storage.ts            (localStorage)
│   │   └── validation.ts
│   └── hooks/
│       └── useCalculatorState.ts
```

## Test Case'leri (algoritma için)
- Düz per-match (Case 1)
- Özel oyuncu + sponsor (Case 2)
- Tolerans Mod 1 yeniden dağıt (Case 3a)
- Tolerans Mod 2 kasaya bırak (Case 3b)
- Min giriş ücreti
- WO sadece oynayanlara
- P2P min transfer

İmplementasyon sırasında bu case'ler unit test gibi çalıştırılacak.
