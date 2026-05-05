# QA Exam Portal — Manual Testing Guide (v15)

> **Canlı mühit:** https://exam-portal-nine-azure.vercel.app  
> **Hazırlanma tarixi:** 2026-05-05  
> **Versiya:** v15  
> **Məqsəd:** Yeni testçilər üçün saytın hər funksiyasını manual yoxlamaq üçün ətraflı bələdçi.

---

## Mündəricat

1. [Test Mühitinin Hazırlanması](#1-test-mühitinin-hazırlanması)
2. [Autentifikasiya Testləri](#2-autentifikasiya-testləri)
3. [Qeydiyyat Testləri](#3-qeydiyyat-testləri)
4. [Dashboard (Tələbə) Testləri](#4-dashboard-tələbə-testləri)
5. [İmtahan Testləri](#5-i̇mtahan-testləri)
6. [Materiallar Testləri](#6-materiallar-testləri)
7. [Mesajlaşma Testləri](#7-mesajlaşma-testləri)
8. [Admin Panel Testləri](#8-admin-panel-testləri)
9. [Sual İdarəetmə Testləri](#9-sual-i̇darəetmə-testləri)
10. [İstifadəçi İdarəetmə Testləri](#10-i̇stifadəçi-i̇darəetmə-testləri)
11. [Müəllim Paneli Testləri](#11-müəllim-paneli-testləri)
12. [API Testləri](#12-api-testləri)
13. [Təhlükəsizlik Testləri](#13-təhlükəsizlik-testləri)
14. [Digər/Köməkçi Testlər](#14-digərköməkçi-testlər)

---

## 1. Test Mühitinin Hazırlanması

### 1.1 Test Hesabları

| Rol | E-poçt | Şifrə | Qeyd |
|-----|--------|-------|------|
| Admin | `admin@exam.local` | `Admin@123` | Tam giriş |
| Teacher (yarat) | `teacher@test.com` | `Teacher@123` | Admin ilə aktiv et |
| Student | `student@test.com` | `Student@123` | Teacher ilə aktiv et |
| Manager | `manager@test.com` | `Manager@123` | Admin ilə yarat |

### 1.2 Test Alətləri
- **Brauzer:** Chrome (son versiya), Firefox
- **API Tool:** Postman, curl, və ya brauzerin DevTools → Network tab
- **Cookie yoxlama:** DevTools → Application → Cookies
- **Console xəta yoxlama:** DevTools → Console

### 1.3 Başlanğıc vəziyyəti
- Ən az 1 qrup yaradılmış olmalıdır (`/admin/groups`)
- Ən az 1 aktiv imtahan olmalıdır (`/admin/exams`)
- Ən az 2 sual imtahana bağlanmış olmalıdır

---

## 2. Autentifikasiya Testləri

### TC-AUTH-001: Uğurlu giriş (tələbə)
**URL:** `/auth/signin`  
**Addımlar:**
1. `/auth/signin` səhifəsini aç
2. E-poçt sahəsinə `student@test.com` daxil et
3. Şifrə sahəsinə `Student@123` daxil et
4. "Daxil ol" düyməsini basın

**Gözlənilən:** `/dashboard` səhifəsinə yönləndirilir, tələbə adı görünür

---

### TC-AUTH-002: Uğurlu giriş (admin)
**Addımlar:** Eyni axın, `admin@exam.local` / `Admin@123`  
**Gözlənilən:** `/admin` səhifəsinə yönləndirilir

---

### TC-AUTH-003: Yanlış şifrə
**Addımlar:**
1. E-poçt: `admin@exam.local`, Şifrə: `YanlisSifre1`
2. "Daxil ol" basın

**Gözlənilən:** "E-poçt və ya şifrə yanlışdır" xəta mesajı görünür, yönləndirilmir

---

### TC-AUTH-004: Boş sahə
**Addımlar:** E-poçt boş buraxıb "Daxil ol" basın  
**Gözlənilən:** Brauzerin native validation işləyir, form göndərilmir

---

### TC-AUTH-005: Brute-force qorunması
**Addımlar:**
1. Yanlış şifrə ilə eyni e-poçt üçün 11 dəfə giriş cəhdi et
2. 11-ci cəhddə nə baş verdiyini gözlə

**Gözlənilən:** 11-ci cəhddən sonra "E-poçt və ya şifrə yanlışdır" (blok — eyni mesaj, amma artıq həqiqi şifrə də işləmir)  
**Qeyd:** 15 dəqiqə sonra blok açılır

---

### TC-AUTH-006: Silinmiş istifadəçi girişi
**Ön şərt:** Admin bir tələbənin hesabını soft-delete etmişdir  
**Gözlənilən:** Giriş uğursuz — xəta mesajı

---

### TC-AUTH-007: Bloklanmış istifadəçi girişi
**Ön şərt:** Admin bir tələbəni bloklamışdır  
**Gözlənilən:** Giriş uğursuz

---

### TC-AUTH-008: Çıxış
**Addımlar:**
1. Daxil ol
2. Dashboard-da profil/çıxış düyməsini basın

**Gözlənilən:** Session silinir, `/auth/signin`-ə yönləndirilir. URL-dən `/dashboard`-a giriş cəhdi → yenidən signin-ə yönlənir.

---

## 3. Qeydiyyat Testləri

### TC-REG-001: Tələbə kimi uğurlu qeydiyyat
**URL:** `/auth/register`  
**Addımlar:**
1. "Tələbə" düyməsini seç (default)
2. Qrup seç (dropdown-dan)
3. Müəllim seç (dropdown-dan)
4. Ad Soyad: "Test Tələbə"
5. E-poçt: `newtestudent@test.com`
6. Şifrə: `Test@1234`
7. Şifrəni təsdiqlə: `Test@1234`
8. "Qeydiyyatdan keç" basın

**Gözlənilən:** 
- Uğur mesajı: "Hesabınız yaradıldı. Admin/müəllim tərəfindən təsdiqlənməsini gözləyin."
- Giriş cəhdi → uğursuz (təsdiqlənməyib)

---

### TC-REG-002: Müəllim kimi uğurlu qeydiyyat
**Addımlar:**
1. "Müəllim" düyməsini seç
2. Qrup dropdown-unun gizləndiyini yoxla ✓
3. Müəllim dropdown-unun gizləndiyini yoxla ✓
4. Ad, e-poçt, şifrə daxil et
5. Göndər

**Gözlənilən:** "Hesabınız yaradıldı. Admin tərəfindən təsdiqlənməsini gözləyin."

---

### TC-REG-003: "Digər" ilə dərhal giriş
**Addımlar:**
1. "Digər" düyməsini seç
2. Qrup seç
3. Müəllim dropdown-unun gizləndiyini yoxla ✓
4. Məlumatları daxil et, göndər

**Gözlənilən:** Qeydiyyatdan sonra dərhal giriş mümkündür (admin təsdiqi yoxdur)

---

### TC-REG-004: Mövcud e-poçt
**Addımlar:** `admin@exam.local` e-poçtu ilə qeydiyyat  
**Gözlənilən:** "Bu e-poçt artıq istifadə edilib" xəta mesajı

---

### TC-REG-005: Şifrə uyğunsuzluğu
**Addımlar:** Şifrə: `Test@123`, Təsdiq: `Test@456`  
**Gözlənilən:** "Şifrələr uyğun deyil" xəta mesajı, form göndərilmir

---

### TC-REG-006: Qısa şifrə
**Addımlar:** 5 simvol şifrə daxil et  
**Gözlənilən:** Validation xətası (minimum 6 simvol)

---

### TC-REG-007: Tələbə — Müəllim seçilmədikdə
**Addımlar:** "Tələbə" seç, müəllim dropdown-unu boş burax, göndər  
**Gözlənilən:** "Müəllim" sahəsi required — form göndərilmir

---

## 4. Dashboard (Tələbə) Testləri

**Ön şərt:** Aktiv (təsdiqlənmiş) tələbə ilə giriş

### TC-DASH-001: Dashboard yüklənməsi
**Addımlar:** `/dashboard` açın  
**Gözlənilən:** 
- Tələbənin adı görünür
- "İmtahana başla" düyməsi mövcuddur
- Nav bar: Materiallar, Mesajlar, Rəylər, Sorğular, Profil

---

### TC-DASH-002: Bildiriş zəngi (bell ikonu)
**Addımlar:**
1. Admin tərəfindən tələbəyə bildiriş göndərilsin
2. Dashboard-u yenilə və ya real-time gözlə
3. Zəng ikonasındakı badge-ə bax

**Gözlənilən:** Badge sayı artır, klikdə bildiriş siyahısı açılır

---

### TC-DASH-003: Elan banneri
**Ön şərt:** Admin aktiv elan yaratmışdır  
**Gözlənilən:** Dashboard üst hissəsində rəngli banner görünür, "×" ilə bağlana bilir

---

### TC-DASH-004: Profil yeniləmə
**Addımlar:**
1. `/profile` açın
2. Adı dəyiş
3. "Yadda saxla" basın

**Gözlənilən:** Uğur mesajı, yenilənmiş ad görünür

---

## 5. İmtahan Testləri

### TC-EXAM-001: İmtahanı başlatma
**Ön şərt:** Aktiv, sualı olan imtahan mövcuddur  
**Addımlar:**
1. Dashboard-da "İmtahana başla" basın
2. İmtahan səhifəsinin yükləndiyini yoxla

**Gözlənilən:**
- Birinci sual görünür
- Taymer başlayır (əgər limit varsa)
- Sual sayğacı: "1 / N"

---

### TC-EXAM-002: Tək cavab (single) seçimi
**Addımlar:**
1. Single tip sualda "Variant B" seç
2. "Variant D" seç

**Gözlənilən:** Yalnız sonuncu seçim aktiv qalır (radio davranışı)

---

### TC-EXAM-003: Çoxlu cavab (multiple) seçimi
**Addımlar:**
1. Multiple tip sualda "Variant A" seç
2. "Variant C" seç

**Gözlənilən:** Hər ikisi seçili qalır (checkbox davranışı)

---

### TC-EXAM-004: Növbəti/əvvəlki naviqasiya
**Addımlar:** "Növbəti →" basın, "← Əvvəlki" basın  
**Gözlənilən:** Sual rəqəmi dəyişir, seçimlər yadda saxlanılır

---

### TC-EXAM-005: Cavab avtomatik saxlanması
**Addımlar:**
1. Sual cavabla
2. Brauzer tabını yenilə (F5)
3. İmtahana qayıt

**Gözlənilən:** Cavab yadda qalıb (30 saniyədə bir avtomatik saxlanır)

---

### TC-EXAM-006: Tab keçidi xəbərdarlığı
**Addımlar:**
1. İmtahan zamanı başqa taba keç
2. Geri qayıt

**Gözlənilən:** Sarı xəbərdarlıq banneri görünür ("Tab dəyişdiniz! X dəfə")

---

### TC-EXAM-007: İmtahanı bitirmə
**Addımlar:**
1. Bütün sualları cavabla (və ya cavabsız burax)
2. "Bitir" düyməsini basın
3. Təsdiq dialogunu qəbul et

**Gözlənilən:** Nəticə səhifəsinə yönləndirilir — bal, faiz, keçdi/kəsildi

---

### TC-EXAM-008: Nəticə səhifəsi
**Gözlənilən:**
- Ümumi bal: `X / Y bal (Z%)`
- Hər sualın düzgün/yanlış cavabı göstərilir
- ≥70%: "Sertifikat yüklə" düyməsi görünür
- <70%: sertifikat düyməsi gizlənir

---

### TC-EXAM-009: Aktiv imtahan yoxdursa
**Ön şərt:** Heç bir imtahan aktiv deyil  
**Addımlar:** `/exam` açın  
**Gözlənilən:** "Aktiv imtahan tapılmadı" mesajı

---

### TC-EXAM-010: Sertifikat yükləmə
**Ön şərt:** ≥70% bal alan tələbə  
**Addımlar:** Nəticə səhifəsindən "Sertifikat yüklə" basın  
**Gözlənilən:** PDF faylı yüklənir, ad, bal, tarix, doğrulama URL-i var

---

## 6. Materiallar Testləri

### TC-MAT-001: Tələbə materiallar siyahısı
**URL:** `/dashboard/materials`  
**Gözlənilən:** Yalnız hazırkı tarix `start_date` ≤ `now` ≤ `end_date` aralığındakı materiallar görünür

---

### TC-MAT-002: Admin material əlavə etmə
**URL:** `/admin/materials`  
**Addımlar:**
1. "Material Əlavə Et" basın
2. Başlıq, URL, qrup, tarix daxil et
3. Saxla

**Gözlənilən:** Material siyahıda görünür

---

### TC-MAT-003: Silinmiş material görünmür
**Addımlar:** Admin bir materiali silsin (soft delete)  
**Gözlənilən:** Tələbə tərəfindən artıq görünmür

---

## 7. Mesajlaşma Testləri

### TC-MSG-001: Mesaj göndərmə
**URL:** `/messages`  
**Addımlar:**
1. Sol sütundan kontakt seç
2. Mesaj yazıb Enter basın

**Gözlənilən:** Mesaj sağ tərəfdə görünür, qarşı tərəfə real-time çatır

---

### TC-MSG-002: Oxunmamış badge
**Ön şərt:** Başqa istifadəçidən mesaj gəlib  
**Gözlənilən:** Kontakt siyahısında ✉ badge görünür

---

## 8. Admin Panel Testləri

### TC-ADMIN-001: Admin dashboard statistikası
**URL:** `/admin`  
**Gözlənilən:** Tələbə sayı, imtahan sayı, son nəticələr kartları görünür

---

### TC-ADMIN-002: Nəticələr siyahısı
**URL:** `/admin/results`  
**Addımlar:** Filter sahəsinə tələbə adını yaz  
**Gözlənilən:** Yalnız uyğun nəticələr görünür

---

### TC-ADMIN-003: Nəticəni sil (soft)
**Addımlar:** Nəticələr siyahısında "Sil" basın  
**Gözlənilən:** Siyahıdan yox olur, DB-də `deleted_at` set olur

---

### TC-ADMIN-004: Analitika
**URL:** `/admin/analytics`  
**Gözlənilən:** Qrafik və statistika kartları görünür

---

### TC-ADMIN-005: Excel export
**URL:** `/admin/results` → "Excel Export"  
**Gözlənilən:** `.xlsx` faylı yüklənir, nəticələr mövcuddur

---

### TC-ADMIN-006: PDF export
**URL:** `/admin/results` → "PDF Export"  
**Gözlənilən:** `.pdf` faylı yüklənir

---

### TC-ADMIN-007: Fəaliyyət jurnalı
**URL:** `/admin/activity`  
**Gözlənilən:** İstifadəçi hərəkətləri (login, create, delete) siyahısında görünür

---

### TC-ADMIN-008: Online istifadəçilər
**URL:** `/admin/online`  
**Gözlənilən:** Son 2 dəqiqədə aktiv olan istifadəçilər siyahısı

---

## 9. Sual İdarəetmə Testləri

### TC-QUEST-001: Sual əlavə etmə
**URL:** `/admin/questions` → "+ Sual Əlavə Et"  
**Addımlar:**
1. Tip: "Tək cavab"
2. Bal: 5
3. Mətn: "Sınaq sualı?"
4. 4 variant daxil et
5. 2-ci variantı düzgün cavab kimi işarələ
6. İmtahan seç
7. Saxla

**Gözlənilən:** Sual siyahıda görünür

---

### TC-QUEST-002: Sual redaktəsi
**Addımlar:** Sual sırasında "Redaktə" basın, mətni dəyiş, saxla  
**Gözlənilən:** Yenilənmiş mətn görünür

---

### TC-QUEST-003: Sual silmə (soft)
**Addımlar:** "Sil" basın, təsdiq et  
**Gözlənilən:** Siyahıdan yox olur (DB-də `deleted_at` var)

---

### TC-QUEST-004: Toplu seçim + imtahana əlavə
**Addımlar:**
1. Bir neçə sualın checkbox-ını seç
2. "İmtahana Əlavə Et" dropdown basın
3. İmtahan seç
4. Saxla

**Gözlənilən:** Seçilmiş suallar həmin imtahana bağlanır

---

### TC-QUEST-005: Admin — sual müəllimi dəyişdirmə
**Ön şərt:** Admin daxil olub  
**Addımlar:**
1. Sual redaktəsini aç
2. "Müəllim" dropdown-undan müəllim seç
3. Saxla

**Gözlənilən:** Sual artıq həmin müəllimə məxsusdur

---

### TC-QUEST-006: Toplu müəllim təyin etmə
**Addımlar:**
1. Bir neçə sual seç
2. "Müəllimə Təhkim Et" dropdown basın
3. Müəllim seç → Saxla

**Gözlənilən:** Seçilmiş sualların müəllimi dəyişir

---

### TC-QUEST-007: CSV import — uğurlu
**Addımlar:**
1. "CSV Şablon" düyməsi ilə şablonu yüklə
2. Şablona suallar əlavə et
3. "CSV İdxal" düyməsi ilə faylı yüklə

**Gözlənilən:** "X yeni sual əlavə edildi" mesajı

---

### TC-QUEST-008: CSV import — teacher sütunu
**Addımlar:**
1. Şablonun sonuncu `teacher` sütununa mövcud müəllimin e-poçtunu yaz
2. Import et

**Gözlənilən:** Sual həmin müəllimə bağlı şəkildə idxal edilir

---

### TC-QUEST-009: CSV import — yanlış format
**Addımlar:** Düzgün formatda olmayan CSV yüklə  
**Gözlənilən:** Xəta mesajı, neçə sətrin xətalı olduğu göstərilir

---

## 10. İstifadəçi İdarəetmə Testləri

### TC-USER-001: Yeni istifadəçi yaratma (admin)
**URL:** `/admin/users` → "+ Yeni İstifadəçi"  
**Addımlar:**
1. Ad, e-poçt, şifrə, rol (teacher), status daxil et
2. Saxla

**Gözlənilən:** Siyahıda görünür, email_verified = NOW()

---

### TC-USER-002: Tələbəni aktiv etmə (approve)
**Addımlar:** Gözləyən tələbənin sırasında "Təsdiqlə" basın  
**Gözlənilən:** Status "Gözlənilir" → "Aktiv" olur, tələbə artıq daxil ola bilir

---

### TC-USER-003: İstifadəçi bloklamaq
**Ön şərt:** Admin daxil olub  
**Addımlar:** "Blokla" basın  
**Gözlənilən:** İstifadəçi bloklanır, sonraki giriş cəhdi bloklanır

---

### TC-USER-004: İstifadəçi filter (qrup)
**Addımlar:** Filter bar-da qrup seç  
**Gözlənilən:** Yalnız həmin qrupun tələbələri görünür

---

### TC-USER-005: İstifadəçi filter (müəllim) — admin
**Addımlar:** Filter bar-da müəllim seç  
**Gözlənilən:** Yalnız həmin müəllimə bağlı tələbələr görünür

---

### TC-USER-006: Soft delete
**Addımlar:**
1. İstifadəçinin "Sil" düyməsini bas
2. Səbəb daxil et
3. Təsdiq et

**Gözlənilən:** Siyahıdan yox olur. Həmin e-poçtla giriş mümkün deyil.

---

### TC-USER-007: Admin impersonation
**Addımlar:**
1. İstifadəçi sırasında "Daxil ol" basın
2. Yeni tabda `/auth/impersonate?token=...` açılır

**Gözlənilən:** Həmin istifadəçi adından dashboard açılır. "İmpersonation aktiv" banneri görünür.

---

## 11. Müəllim Paneli Testləri

**Ön şərt:** Teacher hesabı ilə giriş

### TC-TEACH-001: Müəllim yalnız öz tələbələrini görür
**URL:** `/admin/users`  
**Gözlənilən:** Yalnız `teacher_id = session.user.id` olan tələbələr siyahıda

---

### TC-TEACH-002: Müəllim tələbə əlavə edir
**Addımlar:** "+ Tələbə Əlavə Et" basın, məlumatları daxil et  
**Gözlənilən:** Yaradılan tələbə avtomatik bu müəllimə bağlanır

---

### TC-TEACH-003: Müəllim başqa tələbəni blocklaya bilmir
**Gözlənilən:** Tələbə sırasında "Blokla" düyməsi yoxdur

---

### TC-TEACH-004: Müəllim yalnız öz suallarını görür
**URL:** `/admin/questions`  
**Gözlənilən:** Başqa müəllimə məxsus suallar görünmür

---

### TC-TEACH-005: Müəllim toplu müəllim təyin edə bilmir
**Gözlənilən:** Sual seçimindən sonra "Müəllimə Təhkim Et" düyməsi görünmür

---

### TC-TEACH-006: Müəllim yalnız öz imtahanlarını görür
**URL:** `/admin/exams`  
**Gözlənilən:** Admin tərəfindən yaradılan imtahanlar görünmür

---

### TC-TEACH-007: Müəllim bildiriş göndərir
**URL:** `/admin/notifications`  
**Addımlar:** "Fərdi" tip seç, öz tələbəsini hədəf götür  
**Gözlənilən:** Göndərilir

---

### TC-TEACH-008: Müəllim qrup/hamıya bildiriş göndərə bilmir
**Addımlar:** "Qrup" və ya "Hamıya" növünü seçməyə çalış  
**Gözlənilən:** Bu seçimlər mövcud deyil və ya bloklanır

---

### TC-TEACH-009: Müəllim dashboard statistikası yalnız öz tələbələrini əks etdirir
**URL:** `/admin` (teacher hesabı ilə)  
**Gözlənilən:** Tələbə sayı = yalnız öz tələbə sayı (ümumi deyil)

---

## 12. API Testləri

> **Base URL:** `https://exam-portal-nine-azure.vercel.app`  
> **Auth Cookie:** `next-auth.session-token` (brauzer session-dan)  
> **Postman:** "Cookie Jar" aktiv olmalı, əvvəlcə brauzerda giriş et

---

### TC-API-001: POST `/api/register` — uğurlu qeydiyyat

```http
POST /api/register
Content-Type: application/json

{
  "name": "Test User",
  "email": "apitest@test.com",
  "password": "Test@123",
  "role": "student",
  "groupId": "GROUP_UUID_BURAYA"
}
```

**Gözlənilən:** `201 Created`  
```json
{ "ok": true }
```

---

### TC-API-002: POST `/api/register` — mövcud email

```json
{ "email": "admin@exam.local", ... }
```

**Gözlənilən:** `409 Conflict` — `{ "error": "Bu e-poçt artıq istifadə edilir" }`

---

### TC-API-003: GET `/api/groups`

```http
GET /api/groups
```

**Gözlənilən:** `200 OK`  
```json
[{ "id": "...", "name": "QA Qrupu" }]
```

---

### TC-API-004: GET `/api/admin/questions` — autentifikasiyas

```http
GET /api/admin/questions
# Cookie yoxdur
```

**Gözlənilən:** `401` və ya `403`

---

### TC-API-005: POST `/api/admin/questions` — sual yarat

```http
POST /api/admin/questions
Cookie: next-auth.session-token=...
Content-Type: application/json

{
  "lectureId": 1,
  "text": "API testi sualı?",
  "type": "single",
  "options": ["A", "B", "C", "D"],
  "correctAnswers": [0],
  "difficulty": "medium",
  "points": 5
}
```

**Gözlənilən:** `200 OK` — yaradılmış sual obyekti

---

### TC-API-006: PUT `/api/admin/questions/[id]` — müəllim başqa sualı dəyişə bilmir

**Ön şərt:** Teacher session, başqa teacher-ə məxsus sual ID  
**Gözlənilən:** `403 Forbidden`

---

### TC-API-007: DELETE `/api/admin/questions/[id]` — soft delete

```http
DELETE /api/admin/questions/123
Cookie: ...
```

**Gözlənilən:** `200 OK` — `{ "success": true }`. DB-də `deleted_at` set olur, sual siyahıda görünmür.

---

### TC-API-008: POST `/api/admin/questions/bulk-teacher` — admin only

```http
POST /api/admin/questions/bulk-teacher
Content-Type: application/json

{
  "questionIds": [1, 2, 3],
  "teacherId": "TEACHER_USER_ID"
}
```

**Gözlənilən (admin):** `200 OK` — `{ "updated": 3 }`  
**Gözlənilən (teacher session):** `403 Forbidden`

---

### TC-API-009: POST `/api/admin/users` — teacher öz tələbəsini yaradır

```http
POST /api/admin/users
Cookie: (teacher session)
Content-Type: application/json

{
  "name": "Yeni Tələbə",
  "email": "newtudent@test.com",
  "password": "Test@123"
}
```

**Gözlənilən:** `201` — tələbə yaradılır, `teacher_id` = session müəllim ID-si

---

### TC-API-010: POST `/api/exam/submit` — imtahanı bitir

```http
POST /api/exam/submit
Cookie: (student session)
Content-Type: application/json

{
  "sessionId": "SESSION_UUID",
  "answers": { "42": [0], "43": [1, 2] }
}
```

**Gözlənilən:** `200 OK` — `{ "attemptId": "...", "score": 45, "maxScore": 100, ... }`

---

### TC-API-011: GET `/api/verify/[id]` — public sertifikat yoxlama

```http
GET /api/verify/ATTEMPT_UUID
```

**Gözlənilən (keçib):** `200` — `{ "passed": true, "name": "...", "score": 380, ... }`  
**Gözlənilən (tapılmadı):** `404`

---

### TC-API-012: POST `/api/admin/questions/import` — CSV import

```http
POST /api/admin/questions/import
Cookie: (admin session)
Content-Type: multipart/form-data

file: [CSV fayl]
```

**Gözlənilən:** `200 OK` — `{ "imported": 5, "updated": 0, "errors": [] }`

---

## 13. Təhlükəsizlik Testləri

### TC-SEC-001: Autentifikasiyas API
**Addımlar:** Cookie olmadan `/api/admin/users` GET isteyi et  
**Gözlənilən:** `401` və ya `403` — `401 Unauthorized` gözlənilir

---

### TC-SEC-002: Rol aşımı — tələbə admin endpointinə
**Addımlar:** Tələbə session ilə `DELETE /api/admin/users/SOME_ID` çağır  
**Gözlənilən:** `403 Forbidden`

---

### TC-SEC-003: Teacher başqa müəllimin sualına PUT
**Addımlar:** Teacher-A session ilə Teacher-B-nin sual ID-sinə PUT göndər  
**Gözlənilən:** `403 Forbidden`

---

### TC-SEC-004: SQL Injection cəhdi
**Addımlar:** Login formuna e-poçt sahəsinə `' OR '1'='1` yaz  
**Gözlənilən:** Login uğursuz, server xətası yox (Drizzle ORM parameterized)

---

### TC-SEC-005: XSS cəhdi
**Addımlar:** Sual mətnini `<script>alert(1)</script>` ilə yarat  
**Gözlənilən:** Mətn escape edilərək ekranda düz göstərilir, JS icra edilmir

---

### TC-SEC-006: Rate limit aşımı — hesab kilidi
**Addımlar:** Yanlış şifrə ilə 11 dəfə daxil olmağa çalış  
**Gözlənilən:** 11-ci cəhddən sonra blok aktiv olur (düzgün şifrə ilə belə giriş uğursuz)

---

### TC-SEC-007: Başqa tələbənin nəticəsinə giriş
**Addımlar:** Tələbə-A sessionu ilə Tələbə-B-nin `/api/user/result/ATTEMPT_ID` GET et  
**Gözlənilən:** `403 Forbidden`

---

## 14. Digər/Köməkçi Testlər

### TC-CERT-001: Sertifikat doğrulama (public)
**URL:** `/verify/ATTEMPT_UUID`  
**Gözlənilən:** Yaşıl kart — ad, qrup, bal, faiz, tarix

---

### TC-CERT-002: Yanlış sertifikat ID
**URL:** `/verify/yanlish-id-buraya`  
**Gözlənilən:** Qırmızı kart — "Sertifikat tapılmadı"

---

### TC-NOTIFY-001: Qrupa bildiriş
**Addımlar:** Admin `/admin/notifications`-da "Qrup" tipi seç, qrup seç, göndər  
**Gözlənilən:** Həmin qrupun bütün tələbələrinə real-time çatır

---

### TC-FORM-001: Müəllim sorğu yaratma
**URL:** `/admin/teacher-forms` (teacher)  
**Addımlar:** Sorğu yarat (açıq + seçimli sual), aktiv et  
**Gözlənilən:** Tələbə `/dashboard/surveys`-da görür

---

### TC-FEED-001: Tələbə rəy göndərir
**URL:** `/dashboard/feedback`  
**Addımlar:** Müəlliminə 4 ulduz + şərh göndər  
**Gözlənilən:** Müəllim `/admin/feedback`-da görür

---

### TC-NAV-001: Middleware — icazəsiz giriş yönləndirilməsi
**Addımlar:** Giriş etmədən `/dashboard` açmağa cəhd et  
**Gözlənilən:** `/auth/signin`-ə yönləndirilir

---

### TC-NAV-002: Tələbə admin panelə giriş cəhdi
**Addımlar:** Tələbə session ilə `/admin`-ə get  
**Gözlənilən:** `/dashboard`-a yönləndirilir

---

## Test Nəticəsi Cədvəli

| Test Case | Prioritet | Status | Qeyd |
|-----------|-----------|--------|------|
| TC-AUTH-001 | P1 | | |
| TC-AUTH-003 | P1 | | |
| TC-AUTH-005 | P1 | | |
| TC-REG-001 | P1 | | |
| TC-REG-002 | P1 | | |
| TC-EXAM-001 | P1 | | |
| TC-EXAM-007 | P1 | | |
| TC-EXAM-008 | P1 | | |
| TC-QUEST-001 | P2 | | |
| TC-QUEST-007 | P2 | | |
| TC-USER-002 | P1 | | |
| TC-TEACH-001 | P1 | | |
| TC-TEACH-004 | P1 | | |
| TC-API-006 | P1 | | |
| TC-SEC-001 | P1 | | |
| TC-SEC-003 | P1 | | |
| TC-SEC-006 | P1 | | |

> **P1 = Kritik** — Deploy-dan əvvəl mütləq keçməlidir  
> **P2 = Yüksək** — Sprint-daxilində həll edilməlidir

---

*Son yeniləmə: 2026-05-05 | v15*
