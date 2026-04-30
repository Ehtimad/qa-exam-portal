# QA Exam Portal — Tam Sənədləşmə (v4)

> **Canlı:** https://exam-portal-nine-azure.vercel.app  
> **Repo:** https://github.com/Ehtimad/qa-exam-portal  
> **Son commit:** `f4916dc` — home page, sertifikat yoxlama

---

## 1. Texniki Stack

| Texnologiya | Versiya | Məqsəd |
|---|---|---|
| Next.js | 15.x | App Router, SSR/SSG |
| NextAuth | v5 beta | JWT autentifikasiya |
| Drizzle ORM | 0.38.x | Type-safe DB sorğuları |
| Neon PostgreSQL | Serverless | Əsas verilənlər bazası |
| TailwindCSS | 3.x | UI stilləmə |
| jsPDF + autotable | — | PDF generasiyası |
| xlsx | — | Excel export |
| bcryptjs | — | Şifrə hashleme |
| zod | — | Schema validasiyası |

---

## 2. Rol Sistemi (RBAC)

### 2.1 Rollar

| Rol | Açıqlama | Admin panelə giriş |
|---|---|---|
| `student` | İmtahan verir, öz nəticəsinə baxır | ❌ |
| `admin` | Tam sistemə nəzarət | ✅ Tam |
| `manager` | Suallar, qruplar, imtahanlar, nəticələr | ✅ Geniş |
| `reporter` | Yalnız nəticələr, analitika, export | ✅ Məhdud |
| `worker` | Sual yükləmə/import, sual idarəsi | ✅ Məhdud |

### 2.2 İcazə Matriksi

| Funksiya | admin | manager | reporter | worker |
|---|---|---|---|---|
| İstifadəçiləri gör/idarə et | ✅ | ❌ | ❌ | ❌ |
| Rol təyin et | ✅ | ❌ | ❌ | ❌ |
| İstifadəçini sil | ✅ | ❌ | ❌ | ❌ |
| Impersonation | ✅ | ❌ | ❌ | ❌ |
| Sualları idarə et (CRUD) | ✅ | ✅ | ❌ | ✅ |
| Sual import/şablon | ✅ | ✅ | ❌ | ✅ |
| Sual-qrup təyinatı | ✅ | ✅ | ❌ | ✅ |
| Qrupları idarə et | ✅ | ✅ | ❌ | ❌ |
| İmtahanları idarə et | ✅ | ✅ | ❌ | ❌ |
| Nəticələri gör | ✅ | ✅ | ✅ | ❌ |
| Export (PDF/Excel) | ✅ | ✅ | ✅ | ❌ |
| Analitika | ✅ | ✅ | ✅ | ❌ |

### 2.3 Rol Təyin Etmə

```
Admin Panel → İstifadəçilər → [istifadəçi sətri] → Redaktə → Rol dropdown → Saxla
```

### 2.4 RBAC Faylı

`lib/rbac.ts` — bütün icazə yoxlamaları mərkəzləşdirilmiş helper funksiyalar:
```typescript
isStaff(role)          // admin|manager|reporter|worker
canManageUsers(role)   // yalnız admin
canManageQuestions(role)
canManageGroups(role)
canManageExams(role)
canViewResults(role)
canExportResults(role)
canViewAnalytics(role)
canUploadQuestions(role)
canDeleteUsers(role)
canAssignRoles(role)
```

---

## 3. Verilənlər Bazası Sxemi

Bütün migrasiyanlar `lib/init-db.ts`-də `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` ilə həyata keçirilir — mövcud data silinmir.

### `groups`
```sql
id TEXT PRIMARY KEY
name TEXT UNIQUE NOT NULL
created_at TIMESTAMPTZ
```

### `users`
```sql
id TEXT PRIMARY KEY
name TEXT
email TEXT UNIQUE NOT NULL
email_verified TIMESTAMPTZ
image TEXT
password TEXT
role TEXT DEFAULT 'student'          -- student|admin|manager|reporter|worker
group_name TEXT                       -- legacy (köhnə sütun, qorunur)
group_id TEXT → groups(id)
is_blocked BOOLEAN DEFAULT false
last_seen_at TIMESTAMPTZ
created_at TIMESTAMPTZ
```

### `questions`
```sql
id INTEGER PRIMARY KEY               -- lib/questions.ts ilə eyni ID-lər
lecture_id INTEGER
text TEXT
type TEXT                             -- 'single' | 'multiple'
options TEXT                          -- JSON: string[]
correct_answers TEXT                  -- JSON: number[] (0-based)
difficulty TEXT                       -- 'easy' | 'medium' | 'hard'
points INTEGER
image_url TEXT
explanation TEXT                      -- yanlış cavab üçün izah
created_at TIMESTAMPTZ
```

### `question_groups` *(M2M)*
```sql
question_id INTEGER → questions(id) ON DELETE CASCADE
group_id TEXT → groups(id) ON DELETE CASCADE
PRIMARY KEY (question_id, group_id)
```

### `exams`
```sql
id TEXT PRIMARY KEY
title TEXT
group_id TEXT → groups(id)           -- NULL = bütün qruplar
time_limit_minutes INTEGER            -- NULL = limitsiz
is_active BOOLEAN DEFAULT false
shuffle_questions BOOLEAN DEFAULT true
shuffle_options BOOLEAN DEFAULT true
created_at TIMESTAMPTZ
```

### `exam_questions` *(M2M)*
```sql
exam_id TEXT → exams(id) ON DELETE CASCADE
question_id INTEGER → questions(id) ON DELETE CASCADE
PRIMARY KEY (exam_id, question_id)
```

### `exam_sessions`
```sql
id TEXT PRIMARY KEY
user_id TEXT → users(id) ON DELETE CASCADE
exam_id TEXT → exams(id)
question_order TEXT                   -- JSON: number[]
option_orders TEXT                    -- JSON: {[qId]: number[]}
answers TEXT DEFAULT '{}'             -- JSON: {[qId]: number[]}
tab_switches INTEGER DEFAULT 0
elapsed_seconds INTEGER DEFAULT 0    -- taymer bərpası üçün
started_at TIMESTAMPTZ
last_active_at TIMESTAMPTZ
status TEXT DEFAULT 'in_progress'    -- in_progress|submitted|abandoned
```

### `exam_attempts`
```sql
id TEXT PRIMARY KEY                   -- sertifikat ID kimi istifadə edilir
user_id TEXT → users(id) ON DELETE CASCADE
exam_id TEXT → exams(id)
answers TEXT                          -- JSON: {[qId]: number[]}
score DOUBLE PRECISION
max_score DOUBLE PRECISION
total_questions INTEGER
correct_answers INTEGER
tab_switches INTEGER DEFAULT 0
question_order TEXT                   -- JSON (nullable, legacy uyumluluğu)
option_orders TEXT                    -- JSON (nullable, legacy uyumluluğu)
duration INTEGER                      -- saniyə
started_at TIMESTAMPTZ
completed_at TIMESTAMPTZ
```

### `impersonation_tokens`
```sql
token TEXT PRIMARY KEY
admin_id TEXT → users(id) ON DELETE CASCADE
target_user_id TEXT → users(id) ON DELETE CASCADE
expires_at TIMESTAMPTZ
created_at TIMESTAMPTZ
```

---

## 4. Fayl Strukturu

```
exam-portal/
├── app/
│   ├── page.tsx                          # Ana səhifə (public, sertifikat yoxlama)
│   ├── layout.tsx
│   │
│   ├── auth/
│   │   ├── signin/page.tsx               # Giriş
│   │   ├── register/page.tsx             # Qeydiyyat
│   │   └── impersonate/page.tsx          # Admin impersonation token handler
│   │
│   ├── dashboard/
│   │   ├── page.tsx                      # Tələbə kabinetı
│   │   └── results/[id]/page.tsx         # Detallı nəticə + PDF/sertifikat düymələri
│   │
│   ├── exam/
│   │   ├── page.tsx                      # Server: sessiya yarat/yüklə
│   │   └── ExamClient.tsx                # Client: sual UI, taymer, anti-cheat
│   │
│   ├── profile/
│   │   ├── page.tsx                      # Server: DB-dən groupId yüklə
│   │   └── ProfileForm.tsx               # Client: ad, qrup dropdown, şifrə dəyişmə
│   │
│   ├── verify/
│   │   ├── page.tsx                      # Sertifikat ID formu (public)
│   │   └── [id]/page.tsx                 # Doğrulama nəticəsi (public)
│   │
│   ├── admin/
│   │   ├── page.tsx                      # Dashboard (bütün staff)
│   │   ├── users/                        # Yalnız admin
│   │   │   ├── page.tsx
│   │   │   ├── UserActions.tsx           # Redaktə modal (rol dropdown daxil)
│   │   │   └── UsersFilterBar.tsx
│   │   ├── results/                      # admin, manager, reporter
│   │   │   ├── page.tsx
│   │   │   ├── [id]/page.tsx
│   │   │   ├── ResetButton.tsx
│   │   │   └── ResultsFilterBar.tsx
│   │   ├── questions/                    # admin, manager, worker
│   │   │   ├── page.tsx
│   │   │   └── QuestionsClient.tsx       # CRUD + qrup təyinatı modal
│   │   ├── exams/                        # admin, manager
│   │   │   ├── page.tsx
│   │   │   ├── ExamsClient.tsx
│   │   │   └── [id]/
│   │   ├── groups/                       # admin, manager
│   │   │   ├── page.tsx
│   │   │   └── GroupsClient.tsx
│   │   └── analytics/                    # admin, manager, reporter
│   │       └── page.tsx
│   │
│   └── api/
│       ├── auth/[...nextauth]/route.ts   # NextAuth handler
│       ├── register/route.ts             # Qeydiyyat
│       ├── groups/route.ts               # Public qrup siyahısı (dropdown üçün)
│       │
│       ├── exam/
│       │   ├── save/route.ts             # Cavabları + elapsed_seconds saxla
│       │   ├── submit/route.ts           # İmtahanı bitir, attempt yarat
│       │   ├── session/route.ts          # Aktiv sessiya yoxla
│       │   └── abandon/route.ts          # Sessiyanı tərk et
│       │
│       ├── user/
│       │   ├── profile/route.ts          # Profil yenilə (groupId, şifrə)
│       │   ├── heartbeat/route.ts        # last_seen_at yenilə
│       │   ├── result/[id]/route.ts      # Şəxsi nəticə PDF
│       │   └── certificate/[id]/route.ts # Sertifikat PDF (≥70%)
│       │
│       ├── verify/
│       │   └── [id]/route.ts             # PUBLIC sertifikat doğrulama API
│       │
│       └── admin/
│           ├── users/
│           │   ├── route.ts              # GET siyahı, PATCH verify/block
│           │   └── [id]/
│           │       ├── route.ts          # PUT yenilə (rol daxil), DELETE
│           │       └── impersonate/route.ts
│           ├── results/
│           │   ├── route.ts
│           │   └── [id]/route.ts
│           ├── questions/
│           │   ├── route.ts              # GET, POST
│           │   ├── [id]/route.ts         # GET, PUT, DELETE
│           │   ├── [id]/groups/route.ts  # GET/PUT qrup təyinatı
│           │   ├── import/route.ts       # CSV import
│           │   └── template/route.ts     # CSV şablon yüklə
│           ├── exams/
│           │   ├── route.ts
│           │   └── [id]/route.ts
│           ├── groups/
│           │   ├── route.ts
│           │   └── [id]/route.ts
│           └── export/
│               ├── results/route.ts      # Excel export
│               └── pdf/route.ts          # PDF export
│
├── lib/
│   ├── auth.ts                           # NextAuth konfiqurasiyası
│   ├── auth.config.ts                    # Middleware route qoruması
│   ├── db.ts                             # Neon DB bağlantısı
│   ├── init-db.ts                        # DB init + migrasiyanlar + seeding
│   ├── schema.ts                         # Drizzle cədvəl definisiyaları
│   ├── rbac.ts                           # Rol-based icazə funksiyaları
│   ├── scoring.ts                        # Bal hesablama məntiqi
│   └── questions.ts                      # Sual seed data (100 sual)
│
└── auth.config.ts                        # Edge middleware konfiq
```

---

## 5. Bütün Funksiyalar (Son Versiya)

### 5.1 İctimai Səhifələr (Auth tələb etmir)

#### Ana Səhifə (`/`)
- Hero bölməsi, qeydiyyat/giriş düymələri
- Sertifikat yoxlama formu
- Statistika kartları (100 sual, 70% keçmə, PDF sertifikat)

#### Sertifikat Yoxlama (`/verify`)
- ID daxil etmə formu
- `?id=...` query ilə gəldikdə `/verify/[id]`-ə yönlənir

#### Sertifikat Doğrulama Nəticəsi (`/verify/[id]`)
- **Keçibsə:** yaşıl kart — ad, qrup, bal, faiz, tarix, ID
- **Keçməyibsə / tapılmadısa:** qırmızı kart — səbəb

#### Doğrulama API (`GET /api/verify/[id]`)
```json
// Uğurlu (keçən cəhd):
{ "valid": true, "id": "...", "studentName": "...", "groupName": "...",
  "score": 85, "maxScore": 100, "pct": 85, "completedAt": "..." }

// Uğursuz:
{ "valid": false, "error": "Sertifikat tapılmadı" }
```

---

### 5.2 Tələbə Funksiyaları

#### Qeydiyyat (`/auth/register`)
- Ad, email, şifrə, qrup seçimi
- Admin email təsdiqini gözləyir (`email_verified = NULL`)

#### Giriş (`/auth/signin`)
- Email + şifrə
- Bloklanmış istifadəçilər girə bilmir
- Staff rolları email təsdiqini bypass edir

#### Tələbə Kabinetı (`/dashboard`)
- Cəhd sayı, ən yüksək bal, dinamik maksimum bal
- İmtahana başla / Davam et düymələri
- Keçmiş nəticələr cədvəli (tarix, bal, faiz, süre)
- Detallı bax linki

#### İmtahan (`/exam`)
- Suallar növbəsi DB-dən yüklənir
- Sual və seçimlər shuffle olunur
- Taymer (limitli imtahanlarda)
- Avtomatik saxlama (hər cavab dəyişdikdə)
- Tab-switch detection (anti-cheat)
- Bitir düyməsi → nəticəyə yönlənir

#### Detallı Nəticə (`/dashboard/results/[id]`)
- Hər sual üçün: seçilmiş vs düzgün cavab
- Yanlış cavablar üçün amber "izah" bloku
- "Nəticəni PDF Yüklə" düyməsi
- "Sertifikat Yüklə" düyməsi (yalnız ≥70% keçənlər)

#### Profil (`/profile`)
- Ad dəyişmə
- Qrup dropdown (DB-dən yüklənir)
- Qrup dəyişdikdə aktiv exam sessiyası sıfırlanır
- Şifrə dəyişmə (cari şifrə tələb olunur)

---

### 5.3 İmtahan Məntiqi

#### Sessiya Axını
```
/exam GET
  └─ Mövcud in_progress sessiya? → davam et
  └─ Aktiv exam (qrupa görə, sonra global)?
       └─ exam_questions-dan suallar
  └─ question_groups M2M-dan?
  └─ Bütün suallar (fallback)
  └─ Yeni exam_session yarat
```

#### Sessiya Bərpası
- `elapsed_seconds` hər saxlamada DB-yə yazılır
- Yenidən açdıqda: `Date.now() - elapsed * 1000` ilə taymer davam edir
- Cavablar, tab switch sayı da bərpa olunur

#### Dinamik Maksimum Bal
```
1. Aktiv exam → exam_questions → SUM(questions.points)
2. question_groups M2M → SUM(questions.points)
3. Bütün suallar → SUM(questions.points)
```

#### Anti-Cheat
- `window.blur` → `tabSwitches++` → DB-yə yazılır
- Nəticə səhifəsində tab switch sayı göstərilir

---

### 5.4 PDF və Export

| Fayl | URL | Giriş | Məzmun |
|---|---|---|---|
| Admin nəticə PDF | `GET /api/admin/export/pdf` | admin, manager, reporter | Bütün imtahan nəticələri |
| Excel export | `GET /api/admin/export/results` | admin, manager, reporter | Bütün nəticələr `.xlsx` |
| Şəxsi nəticə PDF | `GET /api/user/result/[id]` | Öz nəticəsi | Sual-cavab breakdown |
| Sertifikat PDF | `GET /api/user/certificate/[id]` | Öz nəticəsi ≥70% | Dekorativ sertifikat |

**Sertifikat PDF məzmunu:**
- Tələbə adı, tarix, bal, faiz
- Alt hissədə: `Sertifikat ID: [id]`
- Alt hissədə: `Yoxlama: https://...vercel.app/verify/[id]`

---

### 5.5 Sual İdarəetməsi

#### Sual CRUD
- Əlavə et, redaktə et, sil
- Sahələr: mətn, tip (tək/çoxlu), 2-8 seçim, düzgün cavablar, bal, izah

#### Sual-Qrup Təyinatı (M2M)
```
Admin → Suallar → [sual sətri] → "Qrup Təyin Et" → checkbox modal → Saxla
API: GET/PUT /api/admin/questions/[id]/groups
```

#### CSV Import
```
POST /api/admin/questions/import
```
Format:
```csv
id,lecture_id,text,type,option_1,option_2,option_3,option_4,option_5,option_6,correct_answers,difficulty,points,explanation
,1,"Test nədir?","single","Cavab 1","Cavab 2","Cavab 3","","","","2","easy","5","İzah mətni"
```
- `id` boş → avtomatik təyin
- `correct_answers`: `;` ilə 1-based indekslər (`"1"`, `"1;3"`)
- `ON CONFLICT DO UPDATE` — upsert, köhnə data silinmir
- Cavab: `{ imported, updated, errors, total }`

#### CSV Şablon
```
GET /api/admin/questions/template → sual-sablon.csv
```

#### Sual Seeding
`lib/init-db.ts` hər startup-da `ON CONFLICT DO UPDATE` ilə 100 sualı DB-yə yazır.

---

### 5.6 İstifadəçi İdarəetməsi

#### Siyahı (`/admin/users`)
- **Sistem İşçiləri** bölməsi (admin, manager, reporter, worker)
- **Tələbələr** bölməsi
- Filterlər: axtarış, qrup, status

#### Əməliyyatlar
- **Təsdiqlə / Ləğv et** — `email_verified` toggle
- **Blokla / Bloku aç** — `is_blocked` toggle
- **Redaktə** — ad, email, rol, qrup, şifrə
- **Giriş (Impersonation)** — admin kimi o userin hesabına keç
- **Sil** — yalnız admin

#### Impersonation Axını
```
Admin → [user] → Giriş düyməsi
  → POST /api/admin/users/[id]/impersonate
  → 5 dəqiqəlik one-time token yaradılır
  → /auth/impersonate?token=... yeni tab açılır
  → Token yoxlanılır → user sessiyası başlayır
  → Dashboard-da "Admin görünüşü" badge görünür
```

---

### 5.7 İmtahan İdarəetməsi

- İmtahan yarat: başlıq, qrup (nullable), vaxt limiti, shuffle parametrləri
- Sualları imtahana əlavə et/çıxar
- Aktiv/passiv toggle
- Bir qrupa bir aktiv imtahan

---

### 5.8 Qrup İdarəetməsi

- Qrup yarat, adını dəyiş, sil
- Hər qrupda tələbə sayı göstərilir
- Qrup silinəndə: `group_id = NULL` (users, exams)

---

### 5.9 Analitika

- **Online istifadəçilər** (son 5 dəqiqə, `last_seen_at`)
- **Mühazirə üzrə xəta analizi** — hər mühazirə üçün xəta faizi, proqres bar
- **Ən çətin 10 sual** (ən az 3 cəhd, ən yüksək xəta faizi)

---

## 6. API Cədvəli (Tam)

### Public (auth yoxdur)
| Method | URL | Açıqlama |
|---|---|---|
| GET | `/api/verify/[id]` | Sertifikat doğrulama |
| GET | `/api/groups` | Qrup siyahısı (dropdown üçün) |

### Auth tələb edən (student+)
| Method | URL | Açıqlama |
|---|---|---|
| POST | `/api/register` | Qeydiyyat |
| GET | `/api/exam/session` | Aktiv sessiyaya bax |
| POST | `/api/exam/save` | Cavabları + elapsed_seconds saxla |
| POST | `/api/exam/submit` | İmtahanı bitir |
| POST | `/api/exam/abandon` | Sessiyanı tərk et |
| PUT | `/api/user/profile` | Profil yenilə |
| POST | `/api/user/heartbeat` | last_seen_at yenilə |
| GET | `/api/user/result/[id]` | Şəxsi nəticə PDF |
| GET | `/api/user/certificate/[id]` | Sertifikat PDF |

### Admin API (rol-based)
| Method | URL | İcazə | Açıqlama |
|---|---|---|---|
| GET | `/api/admin/users` | admin | İstifadəçi siyahısı |
| PATCH | `/api/admin/users` | admin | verify/block/unblock |
| GET,PUT,DELETE | `/api/admin/users/[id]` | admin | Yenilə / Sil |
| POST | `/api/admin/users/[id]/impersonate` | admin | Token yarat |
| GET,POST | `/api/admin/questions` | manager+ | Sual CRUD |
| GET,PUT,DELETE | `/api/admin/questions/[id]` | manager+ | Sual CRUD |
| GET,PUT | `/api/admin/questions/[id]/groups` | manager+ | Qrup təyinatı |
| POST | `/api/admin/questions/import` | worker+ | CSV import |
| GET | `/api/admin/questions/template` | worker+ | Şablon yüklə |
| GET,POST | `/api/admin/exams` | manager+ | İmtahan CRUD |
| GET,PUT,DELETE | `/api/admin/exams/[id]` | manager+ | İmtahan CRUD |
| GET,POST | `/api/admin/groups` | manager+ | Qrup CRUD |
| PUT,DELETE | `/api/admin/groups/[id]` | manager+ | Qrup CRUD |
| GET | `/api/admin/results` | reporter+ | Nəticə siyahısı |
| GET,DELETE | `/api/admin/results/[id]` | reporter+ | Nəticə detail/reset |
| GET | `/api/admin/export/results` | reporter+ | Excel export |
| GET | `/api/admin/export/pdf` | reporter+ | PDF export |

---

## 7. Admin Panel Səhifələri

| URL | Giriş | Funksiya |
|---|---|---|
| `/admin` | Bütün staff | Dashboard: statistika, son nəticələr |
| `/admin/users` | admin | İstifadəçilər (staff + tələbə bölmələri) |
| `/admin/results` | reporter+ | Nəticələr, filter, reset, export |
| `/admin/results/[id]` | reporter+ | Detallı nəticə (sual-cavab) |
| `/admin/questions` | worker+ | Suallar CRUD, import, qrup təyinatı |
| `/admin/exams` | manager+ | İmtahanlar CRUD, sual əlavəsi |
| `/admin/exams/[id]` | manager+ | İmtahan suallarını idarə et |
| `/admin/groups` | manager+ | Qruplar CRUD |
| `/admin/analytics` | reporter+ | Online users, xəta analizi, çətin suallar |

---

## 8. Mühit Dəyişənləri

```env
# Neon PostgreSQL
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# NextAuth
NEXTAUTH_SECRET=random-secret-min-32-chars
NEXTAUTH_URL=https://exam-portal-nine-azure.vercel.app

# İlk admin hesabı (DB boş olduqda yaradılır)
ADMIN_EMAIL=admin@exam.local
ADMIN_PASSWORD=Admin@123
ADMIN_NAME=Admin
```

---

## 9. Deployment

### Vercel
1. GitHub repo-ya push → Vercel avtomatik deploy
2. Dashboard → Settings → Environment Variables → yuxarıdakıları əlavə et
3. İlk deploy: `lib/init-db.ts` bütün cədvəlləri yaradır, admin + 100 sualı seed edir

### Yerli işlətmə
```bash
cd exam-portal
npm install
cp .env.example .env.local   # DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL doldurun
npm run dev
```

---

## 10. Əsas Qeydlər

- **Mövcud data qorunur:** Bütün migrasiyanlar `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` ilə
- **Sual seeding:** Hər startup-da `ON CONFLICT (id) DO UPDATE SET` — 100 sual həmişə aktual
- **Sertifikat ID:** `exam_attempts.id` (UUID) — həm PDF-də, həm `/verify/[id]`-də istifadə edilir
- **Staff email bypass:** admin, manager, reporter, worker — email təsdiqi olmadan girə bilər
- **Qrup dəyişikliyi:** Həm admin edit, həm user profil üzərindən qrup dəyişdikdə `in_progress` exam sessiyası silinir
- **Tab-switch:** `window.blur` eventi — imtahan zamanı səhifə dəyişildikdə sayılır
