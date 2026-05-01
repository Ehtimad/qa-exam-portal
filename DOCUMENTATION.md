# QA Exam Portal — Tam Sənədləşmə (v5 — LMS Upgrade)

> **Canlı:** https://exam-portal-nine-azure.vercel.app  
> **Repo:** GitHub — MarchGroupExam/exam-portal  
> **Son versiya:** v5 — Real-time mesajlaşma, materiallar, bildirişlər, elanlar, soft delete, teacher rolu

---

## 1. Texniki Stack

| Texnologiya | Versiya | Məqsəd |
|---|---|---|
| Next.js | 15.x | App Router, SSR/SSG |
| NextAuth | v5 beta | JWT autentifikasiya |
| Drizzle ORM | 0.38.x | Type-safe DB sorğuları |
| Neon PostgreSQL | Serverless | Əsas verilənlər bazası |
| Pusher | — | Real-time mesajlaşma + bildirişlər |
| pusher-js | — | Browser Pusher client |
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
| `student` | İmtahan verir, öz nəticəsinə baxır, materiallar, mesajlar | ❌ |
| `admin` | Tam sistemə nəzarət | ✅ Tam |
| `manager` | Suallar, qruplar, imtahanlar, nəticələr, materiallar, elanlar | ✅ Geniş |
| `reporter` | Yalnız nəticələr, analitika, export | ✅ Məhdud |
| `worker` | Sual yükləmə/import, sual idarəsi | ✅ Məhdud |
| `teacher` | Materiallar, bildirişlər, tələbə siyahısı | ✅ Məhdud |

### 2.2 İcazə Matriksi

| Funksiya | admin | manager | reporter | worker | teacher |
|---|---|---|---|---|---|
| İstifadəçiləri gör/idarə et | ✅ | ❌ | ❌ | ❌ | ❌ |
| Rol təyin et | ✅ | ❌ | ❌ | ❌ | ❌ |
| İstifadəçini sil (soft) | ✅ | ❌ | ❌ | ❌ | ❌ |
| Impersonation | ✅ | ❌ | ❌ | ❌ | ❌ |
| Sualları idarə et | ✅ | ✅ | ❌ | ✅ | ❌ |
| Sual import/şablon | ✅ | ✅ | ❌ | ✅ | ❌ |
| Qrupları idarə et | ✅ | ✅ | ❌ | ❌ | ❌ |
| İmtahanları idarə et | ✅ | ✅ | ❌ | ❌ | ❌ |
| Nəticələri gör | ✅ | ✅ | ✅ | ❌ | ❌ |
| Export (PDF/Excel) | ✅ | ✅ | ✅ | ❌ | ❌ |
| Analitika | ✅ | ✅ | ✅ | ❌ | ❌ |
| Materialları idarə et | ✅ | ✅ | ❌ | ❌ | ✅ |
| Tələbə siyahısına bax | ✅ | ✅ | ✅ | ❌ | ✅ |
| Bildiriş göndər | ✅ | ✅ | ❌ | ❌ | ✅ |
| Elanları idarə et | ✅ | ✅ | ❌ | ❌ | ❌ |

### 2.3 `lib/rbac.ts` — Bütün helper funksiyalar

```typescript
isStaff(role)              // admin|manager|reporter|worker|teacher
canManageUsers(role)       // yalnız admin
canManageQuestions(role)   // admin|manager|worker
canManageGroups(role)      // admin|manager
canManageExams(role)       // admin|manager
canViewResults(role)       // admin|manager|reporter
canExportResults(role)     // admin|manager|reporter
canViewAnalytics(role)     // admin|manager|reporter
canUploadQuestions(role)   // admin|manager|worker
canDeleteUsers(role)       // yalnız admin
canAssignRoles(role)       // yalnız admin
canManageMaterials(role)   // admin|manager|teacher
canViewStudents(role)      // admin|manager|reporter|teacher
canSendNotifications(role) // admin|manager|teacher
canManageAds(role)         // admin|manager
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
role TEXT DEFAULT 'student'          -- student|admin|manager|reporter|worker|teacher
group_name TEXT                       -- legacy (köhnə sütun)
group_id TEXT → groups(id)
is_blocked BOOLEAN DEFAULT false
is_student BOOLEAN DEFAULT true      -- v5: tələbə/işçi fərqi
last_seen_at TIMESTAMPTZ             -- heartbeat (30s interval)
deleted_at TIMESTAMPTZ               -- v5: soft delete
deletion_reason TEXT                 -- v5: silmə səbəbi
created_at TIMESTAMPTZ
```

### `questions`
```sql
id INTEGER PRIMARY KEY
lecture_id INTEGER
text TEXT
type TEXT                             -- 'single' | 'multiple'
options TEXT                          -- JSON: string[]
correct_answers TEXT                  -- JSON: number[] (0-based)
difficulty TEXT                       -- 'easy' | 'medium' | 'hard'
points INTEGER
image_url TEXT
explanation TEXT
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
group_id TEXT → groups(id)
time_limit_minutes INTEGER
is_active BOOLEAN DEFAULT false
shuffle_questions BOOLEAN DEFAULT true
shuffle_options BOOLEAN DEFAULT true
target_type TEXT DEFAULT 'all'       -- v5: 'all' | 'student' | 'non-student'
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
question_order TEXT    -- JSON: number[]
option_orders TEXT     -- JSON: {[qId]: number[]}
answers TEXT DEFAULT '{}'
tab_switches INTEGER DEFAULT 0
elapsed_seconds INTEGER DEFAULT 0
started_at TIMESTAMPTZ
last_active_at TIMESTAMPTZ
status TEXT DEFAULT 'in_progress'
```

### `exam_attempts`
```sql
id TEXT PRIMARY KEY                  -- sertifikat ID kimi istifadə edilir
user_id TEXT → users(id) ON DELETE CASCADE
exam_id TEXT → exams(id)
answers TEXT
score DOUBLE PRECISION
max_score DOUBLE PRECISION
total_questions INTEGER
correct_answers INTEGER
tab_switches INTEGER DEFAULT 0
question_order TEXT
option_orders TEXT
duration INTEGER                     -- saniyə
started_at TIMESTAMPTZ
completed_at TIMESTAMPTZ
```

### `materials` *(v5)*
```sql
id TEXT PRIMARY KEY
title TEXT NOT NULL
content_url TEXT NOT NULL            -- material linki
group_id TEXT → groups(id)           -- NULL = bütün qruplar
start_date TIMESTAMPTZ DEFAULT NOW() -- görünmə başlama tarixi
end_date TIMESTAMPTZ                 -- NULL = limitsiz
created_by TEXT → users(id)
created_at TIMESTAMPTZ
```

### `messages` *(v5)*
```sql
id TEXT PRIMARY KEY
sender_id TEXT → users(id) ON DELETE CASCADE
receiver_id TEXT → users(id) ON DELETE CASCADE
content TEXT NOT NULL
is_read BOOLEAN DEFAULT false
created_at TIMESTAMPTZ
```

### `notifications` *(v5)*
```sql
id TEXT PRIMARY KEY
user_id TEXT → users(id)             -- NULL = group/all bildirişi
group_id TEXT → groups(id)           -- NULL = all bildirişi
title TEXT NOT NULL
message TEXT NOT NULL
type TEXT DEFAULT 'all'              -- 'individual' | 'group' | 'all'
is_read BOOLEAN DEFAULT false
created_at TIMESTAMPTZ
```

### `advertisements` *(v5)*
```sql
id TEXT PRIMARY KEY
title TEXT NOT NULL
content TEXT NOT NULL
target_role TEXT DEFAULT 'all'       -- 'all' | spesifik rol
is_active BOOLEAN DEFAULT true
created_at TIMESTAMPTZ
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
│   │   ├── register/page.tsx             # Qeydiyyat (isStudent toggle ilə)
│   │   └── impersonate/page.tsx          # Admin impersonation token handler
│   │
│   ├── dashboard/
│   │   ├── page.tsx                      # Tələbə kabinetı (Heartbeat, AdsBanner, NotificationBell)
│   │   ├── materials/page.tsx            # v5: Tələbə materialları (tarix-filtrli)
│   │   └── results/[id]/page.tsx         # Detallı nəticə + PDF/sertifikat
│   │
│   ├── messages/
│   │   ├── page.tsx                      # v5: Real-time chat (server wrapper)
│   │   └── MessagesClient.tsx            # v5: Pusher ilə chat UI
│   │
│   ├── exam/
│   │   ├── page.tsx
│   │   └── ExamClient.tsx
│   │
│   ├── profile/
│   │   ├── page.tsx
│   │   └── ProfileForm.tsx
│   │
│   ├── verify/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   │
│   ├── admin/
│   │   ├── page.tsx                      # Dashboard
│   │   ├── users/
│   │   │   ├── page.tsx
│   │   │   ├── UserActions.tsx           # v5: SoftDeleteModal (səbəb tələb edir)
│   │   │   └── UsersFilterBar.tsx
│   │   ├── results/
│   │   ├── questions/
│   │   ├── exams/
│   │   ├── groups/
│   │   ├── analytics/
│   │   ├── materials/                    # v5: Admin material CRUD
│   │   │   ├── page.tsx
│   │   │   └── MaterialsClient.tsx
│   │   ├── notifications/                # v5: Bildiriş göndərmə
│   │   │   ├── page.tsx
│   │   │   └── NotificationsAdminClient.tsx
│   │   └── advertisements/               # v5: Elan CRUD
│   │       ├── page.tsx
│   │       └── AdsClient.tsx
│   │
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── register/route.ts             # v5: isStudent flag dəstəyi
│       ├── groups/route.ts
│       │
│       ├── exam/...
│       │
│       ├── user/
│       │   ├── profile/route.ts
│       │   ├── heartbeat/route.ts        # last_seen_at yenilə (30s)
│       │   ├── result/[id]/route.ts
│       │   └── certificate/[id]/route.ts
│       │
│       ├── verify/[id]/route.ts
│       │
│       ├── messages/                     # v5: Real-time mesajlaşma
│       │   ├── route.ts                  # GET (söhbət), POST (göndər)
│       │   └── contacts/route.ts         # GET (istifadəçi siyahısı + unread)
│       │
│       ├── materials/route.ts            # v5: GET (cari user üçün filtrli)
│       │
│       ├── notifications/route.ts        # v5: GET (user bildirişləri), PATCH (oxundu)
│       │
│       ├── advertisements/route.ts       # v5: GET (aktiv elanlar, rol-filtrli)
│       │
│       ├── pusher/
│       │   └── auth/route.ts             # v5: Pusher channel auth
│       │
│       └── admin/
│           ├── users/
│           │   ├── route.ts
│           │   └── [id]/
│           │       ├── route.ts          # v5: DELETE → soft delete (səbəb tələb edir)
│           │       └── impersonate/route.ts
│           ├── results/...
│           ├── questions/...
│           ├── exams/...
│           ├── groups/...
│           ├── materials/                # v5: Admin material CRUD
│           │   ├── route.ts
│           │   └── [id]/route.ts
│           ├── notifications/route.ts    # v5: Bildiriş göndər + siyahı
│           ├── advertisements/           # v5: Elan CRUD
│           │   ├── route.ts
│           │   └── [id]/route.ts
│           └── export/...
│
├── components/
│   ├── Heartbeat.tsx                     # v5: 30s interval, last_seen_at yenilə
│   ├── NotificationBell.tsx              # v5: Bell + unread badge, Pusher real-time
│   ├── AdsBanner.tsx                     # v5: Rol-filtrli elan banneri
│   └── ui/
│       └── PasswordInput.tsx
│
└── lib/
    ├── auth.ts                           # v5: soft delete yoxlaması, teacher staff
    ├── auth.config.ts
    ├── db.ts
    ├── init-db.ts                        # v5: yeni sütun+cədvəl migrasiyanları
    ├── schema.ts                         # v5: 4 yeni cədvəl, yeni sütunlar
    ├── rbac.ts                           # v5: teacher rolu, yeni icazə funksiyaları
    ├── pusher.ts                         # v5: Server Pusher client
    ├── pusher-client.ts                  # v5: Browser Pusher client (singleton)
    ├── scoring.ts
    └── questions.ts
```

---

## 5. Bütün Funksiyalar (Son Versiya v5)

### 5.1 İctimai Səhifələr

#### Ana Səhifə (`/`)
- Hero bölməsi, qeydiyyat/giriş düymələri
- Sertifikat yoxlama formu
- Statistika kartları

#### Sertifikat Doğrulama (`/verify/[id]`)
- **Keçibsə:** yaşıl kart — ad, qrup, bal, faiz, tarix, ID
- **Keçməyibsə / tapılmadısa:** qırmızı kart — səbəb

---

### 5.2 Tələbə Funksiyaları

#### Qeydiyyat (`/auth/register`) — *v5 yeniləndi*
- **"Tələbəsən?"** toggle (default: Bəli)
- `isStudent = true` → `email_verified = NULL` → admin təsdiqi gözlənilir
- `isStudent = false` → `email_verified = NOW()` → dərhal giriş
- Qrup dropdown DB-dən yüklənir

#### Tələbə Kabinetı (`/dashboard`) — *v5 yeniləndi*
- **Heartbeat:** Hər 30 saniyədə `POST /api/user/heartbeat` — `last_seen_at` yenilənir
- **AdsBanner:** Rol-filtrli aktiv elanlar göstərilir (bağlanabilir)
- **NotificationBell:** Zəng ikonu, oxunmamış bildiriş sayı badge, Pusher real-time
- **Materiallar linki:** `/dashboard/materials`
- **Mesajlar linki:** `/messages`

#### Materiallar (`/dashboard/materials`) — *v5 yeni*
- Cari tarixdə aktiv materiallar (startDate ≤ NOW() ≤ endDate)
- Qrupa aid materiallar + hamıya açıq materiallar
- Hər material xarici linkdə açılır

#### Real-time Mesajlaşma (`/messages`) — *v5 yeni*
- Sol panel: bütün istifadəçilər, oxunmamış sayı badge
- Sağ panel: söhbət bölməsi
- Pusher `private-user-{id}` kanalı ilə anlıq çatdırılma
- Enter ilə göndər
- Oxundu markası

#### Bildirişlər — *v5 yeni*
- Dashboard nav-da zəng ikonu
- Real-time Pusher ilə gəlir
- Tıklayanda oxundu olaraq işarələnir
- 3 növ: fərdi, qrupa, hamıya

---

### 5.3 Soft Delete (İstifadəçi Silmə) — *v5 yeni*

```
Admin → İstifadəçilər → [sətir] → "Sil" düyməsi
  → Modal açılır: "Silmə səbəbini daxil edin"
  → Səbəb boş olarsa → xəta
  → DELETE /api/admin/users/[id]  { reason: "..." }
  → users.deleted_at = NOW(), users.deletion_reason = reason
  → Cədvəldə "Silinmiş" etiketi, bütün düymələr gizlənir
```

**Əsas fərq:** Köhnə versiyada hard delete (sıradından çıxarılırdı). İndi soft delete — data qalır, giriş bloklanır.

**Avtomatik blok:** `lib/auth.ts`-də `deletedAt !== null` yoxlaması — login cəhdi rədd edilir.

---

### 5.4 Material Sistemi — *v5 yeni*

#### Admin Material İdarəetməsi (`/admin/materials`)
- Başlıq, URL, qrup (boş = hamıya), başlanğıc tarixi, bitmə tarixi
- Redaktə, sil
- `canManageMaterials` icazəsi: admin, manager, teacher

#### Tarix Filtri
```
startDate ≤ NOW() ≤ endDate (endDate NULL olarsa limitsiz)
```

---

### 5.5 Bildiriş Sistemi — *v5 yeni*

#### Göndərmə (`/admin/notifications`)
- **Hamıya:** `type = "all"` → Pusher `notifications` kanalı
- **Qrupa:** `type = "group"` + `groupId` → Pusher `group-{groupId}` kanalı
- **Fərdi:** `type = "individual"` + `userId` → Pusher `private-user-{userId}` kanalı

#### Qəbul
- `NotificationBell` komponenti real-time Pusher ilə dinləyir
- DB-dən son 50 bildiriş yüklənir
- Oxundu toggle: `PATCH /api/notifications`

---

### 5.6 Elan Sistemi — *v5 yeni*

#### Admin Elan İdarəetməsi (`/admin/advertisements`)
- Başlıq, mətn, hədəf rol (`all`, `student`, digər rollar), aktiv/deaktiv
- Toggle ilə sürətli aktiv/deaktiv
- `canManageAds` icazəsi: admin, manager

#### Göstərilmə
- `AdsBanner` komponenti dashboard-da yüklənir
- `GET /api/advertisements` → rola görə filtrli aktiv elanlar
- Hər elanı bağlamaq olar (session state-da dismiss)

---

### 5.7 Real-time Arxitektura (Pusher) — *v5 yeni*

```
Göndərici → API Route → pusher.trigger() → Pusher cloud → pusher-js → Browser
```

**Kanallar:**
| Kanal | Məqsəd |
|---|---|
| `private-user-{userId}` | Fərdi mesaj + bildiriş |
| `group-{groupId}` | Qrup bildirişi |
| `notifications` | Hamıya broadcast |

**Tələb olunan env vars:**
```env
PUSHER_APP_ID=...
PUSHER_KEY=...
PUSHER_SECRET=...
PUSHER_CLUSTER=eu
NEXT_PUBLIC_PUSHER_KEY=...
NEXT_PUBLIC_PUSHER_CLUSTER=eu
```

---

### 5.8 İmtahan Məntiqi (Dəyişməyib)

#### Sessiya Axını
```
/exam GET
  └─ Mövcud in_progress sessiya? → davam et
  └─ Aktiv exam (qrupa görə, sonra global)
  └─ exam_questions-dan suallar
  └─ question_groups M2M (fallback)
  └─ Bütün suallar (fallback)
  └─ Yeni exam_session yarat
```

#### Dinamik Maksimum Bal
```
SUM(questions.points) aktiv imtahan suallarından
```

---

### 5.9 PDF və Export

| Fayl | URL | Giriş | Məzmun |
|---|---|---|---|
| Admin nəticə PDF | `GET /api/admin/export/pdf` | admin, manager, reporter | Bütün nəticələr |
| Excel export | `GET /api/admin/export/results` | admin, manager, reporter | `.xlsx` |
| Şəxsi nəticə PDF | `GET /api/user/result/[id]` | Öz nəticəsi | Sual-cavab |
| Sertifikat PDF | `GET /api/user/certificate/[id]` | Öz nəticəsi ≥70% | Dekorativ |

---

### 5.10 Sertifikat Doğrulama

- **ID:** `exam_attempts.id` (UUID)
- **PDF alt hissəsi:** `Yoxlama: https://...vercel.app/verify/[id]`
- **Public API:** `GET /api/verify/[id]` — auth yoxdur

---

## 6. API Cədvəli (Tam — v5)

### Public (auth yoxdur)
| Method | URL | Açıqlama |
|---|---|---|
| GET | `/api/verify/[id]` | Sertifikat doğrulama |
| GET | `/api/groups` | Qrup siyahısı |

### Auth tələb edən (student+)
| Method | URL | Açıqlama |
|---|---|---|
| POST | `/api/register` | Qeydiyyat (isStudent flag) |
| GET,POST | `/api/messages` | Söhbət yüklə / mesaj göndər |
| GET | `/api/messages/contacts` | İstifadəçi siyahısı + unread |
| GET | `/api/materials` | Aktiv materiallar (tarix-filtrli) |
| GET | `/api/notifications` | İstifadəçi bildirişləri |
| PATCH | `/api/notifications` | Oxundu işarələ |
| GET | `/api/advertisements` | Aktiv elanlar (rol-filtrli) |
| POST | `/api/pusher/auth` | Pusher kanal autentifikasiyası |
| POST | `/api/user/heartbeat` | last_seen_at yenilə |
| GET,POST | `/api/exam/session` | Exam sessiya |
| POST | `/api/exam/save` | Cavabları saxla |
| POST | `/api/exam/submit` | İmtahanı bitir |
| PUT | `/api/user/profile` | Profil yenilə |
| GET | `/api/user/result/[id]` | Nəticə PDF |
| GET | `/api/user/certificate/[id]` | Sertifikat PDF |

### Admin API (rol-based)
| Method | URL | İcazə | Açıqlama |
|---|---|---|---|
| GET | `/api/admin/users` | admin | İstifadəçi siyahısı |
| PATCH | `/api/admin/users` | admin | verify/block/unblock |
| PUT | `/api/admin/users/[id]` | admin | Yenilə (rol, qrup, şifrə) |
| DELETE | `/api/admin/users/[id]` | admin | Soft delete (reason tələb olunur) |
| POST | `/api/admin/users/[id]/impersonate` | admin | Token yarat |
| GET,POST | `/api/admin/questions` | worker+ | Sual CRUD |
| GET,PUT,DELETE | `/api/admin/questions/[id]` | worker+ | Sual CRUD |
| GET,PUT | `/api/admin/questions/[id]/groups` | worker+ | Qrup təyinatı |
| POST | `/api/admin/questions/import` | worker+ | CSV import |
| GET | `/api/admin/questions/template` | worker+ | Şablon |
| GET,POST | `/api/admin/exams` | manager+ | İmtahan CRUD |
| GET,PUT,DELETE | `/api/admin/exams/[id]` | manager+ | İmtahan CRUD |
| GET,POST | `/api/admin/groups` | manager+ | Qrup CRUD |
| PUT,DELETE | `/api/admin/groups/[id]` | manager+ | Qrup CRUD |
| GET | `/api/admin/results` | reporter+ | Nəticə siyahısı |
| GET,DELETE | `/api/admin/results/[id]` | reporter+ | Nəticə detail/reset |
| GET | `/api/admin/export/results` | reporter+ | Excel export |
| GET | `/api/admin/export/pdf` | reporter+ | PDF export |
| GET,POST | `/api/admin/materials` | teacher+ | Material CRUD |
| PUT,DELETE | `/api/admin/materials/[id]` | teacher+ | Material CRUD |
| GET,POST | `/api/admin/notifications` | teacher+ | Bildiriş göndər/siyahı |
| GET,POST | `/api/admin/advertisements` | manager+ | Elan CRUD |
| PUT,DELETE | `/api/admin/advertisements/[id]` | manager+ | Elan CRUD |

---

## 7. Admin Panel Səhifələri (v5)

| URL | Giriş | Funksiya |
|---|---|---|
| `/admin` | Bütün staff | Dashboard |
| `/admin/users` | admin | İstifadəçilər (soft delete, 6 rol) |
| `/admin/results` | reporter+ | Nəticələr, filter, export |
| `/admin/results/[id]` | reporter+ | Detallı nəticə |
| `/admin/questions` | worker+ | Suallar CRUD, import |
| `/admin/exams` | manager+ | İmtahanlar CRUD |
| `/admin/exams/[id]` | manager+ | İmtahan suallarını idarə et |
| `/admin/groups` | manager+ | Qruplar CRUD |
| `/admin/analytics` | reporter+ | Online users, xəta analizi |
| `/admin/materials` | teacher+ | Material CRUD, tarix planlaması |
| `/admin/notifications` | teacher+ | Bildiriş göndər (hamıya/qrupa/fərdi) |
| `/admin/advertisements` | manager+ | Elan CRUD, aktiv/deaktiv |
| `/messages` | Hamı | Real-time chat (admin + tələbə) |

---

## 8. Mühit Dəyişənləri

```env
# Neon PostgreSQL
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# NextAuth
AUTH_SECRET=random-secret-min-32-chars
AUTH_URL=http://localhost:3000
NEXTAUTH_URL=https://exam-portal-nine-azure.vercel.app

# Pusher (pusher.com dashboard-dan alın)
PUSHER_APP_ID=your_app_id
PUSHER_KEY=your_pusher_key
PUSHER_SECRET=your_pusher_secret
PUSHER_CLUSTER=eu
NEXT_PUBLIC_PUSHER_KEY=your_pusher_key
NEXT_PUBLIC_PUSHER_CLUSTER=eu

# Admin seed (DB boş olduqda)
ADMIN_EMAIL=admin@exam.local
ADMIN_PASSWORD=Admin@123
ADMIN_NAME=Admin
```

---

## 9. Deployment

### Vercel
1. GitHub-a push → Vercel avtomatik deploy
2. Dashboard → Settings → Environment Variables → yuxarıdakıları əlavə et
3. İlk deploy: `lib/init-db.ts` bütün cədvəlləri yaradır, yeni sütunları əlavə edir

### Pusher quraşdırma
1. [pusher.com](https://pusher.com) → App yaradın (Channels)
2. App Keys bölməsindən: App ID, Key, Secret, Cluster alın
3. Vercel env vars-a əlavə edin

---

## 10. Əsas Qeydlər

- **Mövcud data qorunur:** `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
- **Soft delete:** `deleted_at` + `deletion_reason` — hard delete yoxdur, admin məcburi səbəb yazmalıdır
- **isStudent flag:** Qeydiyyatda toggle — `true` → admin təsdiqi, `false` → dərhal giriş
- **Heartbeat:** Hər 30s `Heartbeat` komponenti `POST /api/user/heartbeat` çağırır
- **Teacher rolu:** staff kimi giriş edir, materiallar + bildirişlər + tələbə siyahısı
- **Sertifikat ID:** `exam_attempts.id` (UUID) — həm PDF-də, həm `/verify/[id]`-də
- **Pusher private kanallar:** `pusher/auth/route.ts` autentifikasiya edir
- **Tab-switch:** `window.blur` — imtahan zamanı sayılır, nəticədə göstərilir
