# QA Exam Portal — Tam Sənədləşmə (v13 — Teacher Data Isolation & Soft Delete)

> **Canlı:** https://exam-portal-nine-azure.vercel.app  
> **Repo:** GitHub — Ehtimad/qa-exam-portal  
> **Son versiya:** v13 — Müəllim məlumat izolyasiyası, Soft Delete

---

## Changelog

### v13 (2026-05-04)
- **Müəllim məlumat izolyasiyası (tam):** Teacher yalnız öz yaratdığı sualları, imtahanları, materialları görür. `WHERE teacher_id = session.user.id` bütün resurslarda tətbiq edildi.
- **Sual sahib sistemi:** `questions.teacher_id` — sual müəllimə məxsusdur; `null` = global (admin/manager yaratdığı).
- **İmtahan sahib sistemi:** `exams.teacher_id` — eyni prinsip.
- **Material sahib sistemi:** `materials.created_by` mövcud sütunu ilə filtrlənir.
- **Nəticə filtri:** `/admin/results` teacher rolunda `WHERE users.teacher_id = session.user.id` tətbiq edir.
- **Bildiriş məhdudiyyəti:** Teacher yalnız öz tələbəsinə fərdi bildiriş göndərə bilir; qrup/hamı növü bloklanır.
- **Soft Delete (hər yerdə):** `exams.deleted_at`, `questions.deleted_at`, `materials.deleted_at` — hard delete tamamilə ləğv edildi. Bütün DELETE endpointlər `deletedAt = new Date()` set edir.
- **Ownership check pattern:** `getExamAndCheckOwnership()`, `getQAndCheckOwnership()`, `getMaterialAndCheckOwnership()` helper funksiyaları — 403 (özün deyil) vs 404 (tapılmadı) ayrımı.
- **RBAC genişləndirildi:** `canManageQuestions` → teacher daxil edildi; `canManageExams` → teacher daxil edildi; `canViewResults` → teacher daxil edildi.

### v12 (2026-05-04)
- **Multi-tenancy:** `teacher_id` sütunu `users` cədvəlinə əlavə edildi. Hər tələbə bir müəllimə bağlıdır.
- **Qeydiyyat:** Tələbə qeydiyyatı zamanı müəllim seçimi əlavə edildi (məcburi). `/api/teachers` endpoint yaradıldı.
- **Approve mexanizmi:** Həm admin, həm də teacher öz tələbəsinin hesabını aktiv edə bilir. `PATCH /api/admin/users` teacher rolunu dəstəkləyir.
- **Müəllim paneli:** Teacher rollu istifadəçi `/admin/users`-da yalnız öz `teacher_id`-si ilə bağlı tələbələri görür.
- **Rəy sistemi:** `feedbacks` cədvəli, `POST/GET /api/admin/feedbacks`. `/admin/feedback` (müəllim/admin üçün). `/dashboard/feedback` (tələbə üçün — rəy ver / gələnlər / göndərilənlər 3 tab).
- **Sorğu modulu:** `teacher_forms` + `teacher_form_answers` cədvəlləri. `/admin/teacher-forms` (müəllim sorğu yaradır, cavabları görür). `/dashboard/surveys` (tələbə cavablayır). Açıq cavab / tək seçim / çoxlu seçim növləri.
- **Naviqasiya:** Admin nav-da Rəylər + Sorğular linkləri əlavə edildi. Dashboard nav-da Sorğular + Rəylər linkləri əlavə edildi.
- **DB migration fix:** `initialized = true` artıq migration bitdikdən sonra set olunur. Yeni API routelar `initDatabase()` çağırır. Self-ref FK constraint kənarlaşdırıldı (app-level validation ilə əvəz edildi).

### v11 (2026-05-04)
- **Bulk select + exam assignment:** Suallar cədvəlində checkbox sütunu əlavə edildi. Toplu seçim sonrası "İmtahana Əlavə Et" dropdown panel açılır, multi-select ilə bir neçə imtahan seçilir. `POST /api/admin/questions/bulk-exam` endpoint yaradıldı (additive, mövcud əlaqələri silmir).
- **Exam dropdown (Add/Edit modal):** İmtahan seçimi daha əvvəlki scrollable checkbox listdən `İmtahan seç...` dropdown + seçilmiş imtahanlar tag (chip) görünüşünə dəyişdirildi.
- **CSV format sadələşdirildi:** `lecture_id` və `difficulty` sütunları şablondan silindi. Yeni format: `id,text,type,option_1..option_6,correct_answers,points,explanation,exam_ids`. Import köhnə formatı da tanıyır (backwards-compat).

### v10 (2026-05-04)
- **Exam multi-select in Add/Edit modals:** Sual əlavə etmə və redaktə modallarına "İmtahanlar" çox seçimli bölmə əlavə edildi. Sual saxlanıldıqda exam əlaqələri avtomatik yenilənir (`PUT /api/admin/questions/[id]/exams`). Ayrıca "İmtahan Əlavə Et" modal aradan qaldırıldı.
- **CSV template:** `exam_id` sütunu `exam_ids`-ə dəyişdirildi. Bir neçə imtahan UUID-si nöqtəli vergüllə ayrıla bilər (`uuid-1;uuid-2`).
- **CSV import:** Çoxlu imtahan ID dəstəyi — hər biri `examQuestions` cədvəlinə əlavə edilir.

### v9 (2026-05-01)
- **Pagination:** Suallar, istifadəçilər, nəticələr, fəaliyyət jurnalı səhifələrindəm hər səhifədə 10/25/50/100 sətir seçimi əlavə edildi. URL parametrləri: `page`, `perPage`. `PerPageSelect` paylaşılan client komponenti yaradıldı.
- **Impersonation fix:** `auth.config.ts` middleware-də `/auth/impersonate` marşrutu artıq "logged-in redirect" qaydası ilə bloklnmır. İmpersonation edilmiş staff istifadəçi `/dashboard`-a yönləndirilmir.
- **Exam modal loading fix:** İmtahan seçimi modalı boş halda "Yüklənir..." əvəzinə "İmtahan tapılmadı. Əvvəlcə imtahan yaradın." mesajı göstərir. Yüklənmə halı `examLoading` state ilə ayrıca idarə olunur.

### v8 (2026-05-04)
- **Sual→İmtahan məntiqi:** Suallar artıq qrupa deyil, birbaşa imtahana bağlanır. QuestionsClient-də "İmtahan Əlavə Et" modal əlavə edildi (`/api/admin/questions/[id]/exams`).
- **CSV şablon:** `exam_id` sütunu əlavə edildi. Import zamanı sual avtomatik həmin imtahana əlavə edilir.
- **Analitika:** "Mühazirə üzrə Xəta Analizi" və "Ən Çətin 10 Sual" bölmələri tamamilə silindi.
- **Real-time silinmə:** Admin bildiriş/elanı sildiyi anda istifadəçi tərəfində Pusher hadisəsi ilə avtomatik yox olur (`notification-deleted`, `ad-deleted`, `ad-updated`).
- **Mesaj admin idarəsi:** Admin mesajları silə və redaktə edə bilər. `DELETE /api/messages`, `PATCH /api/messages` endpointləri əlavə edildi. Pusher hadisələri: `message-deleted`, `message-updated`.
- **Paylaşılan AdminNav:** `app/admin/layout.tsx` ilə bütün admin səhifələrini əhatə edir; hər səhifədən ayrı nav blokları silindi.
- **NavBadges:** Real-time Pusher badge sayacları Mesajlar və Bildirişlər üçün.
- **notification_reads:** Qrup/hamı tipli bildirişlər üçün oxunma statusu `notification_reads` cədvəlində saxlanır.

### v7 (2026-05-01)
- Paylaşılan AdminNav layout, CollapsibleSection, NavBadges, bildiriş silmə, analitika collapse, impersonation log yeniləmə.

### v6 (əvvəlki)
- Fəaliyyət jurnalı, yeni istifadəçi yaratma, Online Users səhifəsi, müəllim rolu.

---

## 1. Texniki Stack

| Texnologiya | Versiya | Məqsəd |
|---|---|---|
| Next.js | 15.x | App Router, SSR/SSG |
| NextAuth | v5 beta | JWT autentifikasiya |
| Drizzle ORM | 0.38.x | Type-safe DB sorğuları |
| Neon PostgreSQL | Serverless | Əsas verilənlər bazası |
| Pusher Channels | — | Real-time mesajlaşma + bildirişlər |
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
| `teacher` | Yalnız **öz** tələbələri/sualları/imtahanları/materialları/nəticələri | ✅ Məhdud |

### 2.2 İcazə Matriksi (v13)

| Funksiya | admin | manager | reporter | worker | teacher |
|---|---|---|---|---|---|
| İstifadəçiləri gör/idarə et | ✅ | ❌ | ❌ | ❌ | ✅ (yalnız öz tələbələri) |
| Rol təyin et | ✅ | ❌ | ❌ | ❌ | ❌ |
| İstifadəçini sil (soft) | ✅ | ❌ | ❌ | ❌ | ❌ |
| Impersonation | ✅ | ❌ | ❌ | ❌ | ❌ |
| Sualları idarə et | ✅ | ✅ | ❌ | ✅ | ✅ (yalnız öz sualları) |
| Sual import/şablon | ✅ | ✅ | ❌ | ✅ | ❌ |
| Qrupları idarə et | ✅ | ✅ | ❌ | ❌ | ❌ |
| İmtahanları idarə et | ✅ | ✅ | ❌ | ❌ | ✅ (yalnız öz imtahanları) |
| Nəticələri gör | ✅ | ✅ | ✅ | ❌ | ✅ (yalnız öz tələbələri) |
| Export (PDF/Excel) | ✅ | ✅ | ✅ | ❌ | ❌ |
| Analitika | ✅ | ✅ | ✅ | ❌ | ❌ |
| Materialları idarə et | ✅ | ✅ | ❌ | ❌ | ✅ (yalnız öz materialları) |
| Tələbə siyahısına bax | ✅ | ✅ | ✅ | ❌ | ✅ (yalnız öz tələbələri) |
| Bildiriş göndər | ✅ | ✅ | ❌ | ❌ | ✅ (yalnız öz tələbəsinə, fərdi) |
| Elanları idarə et | ✅ | ✅ | ❌ | ❌ | ❌ |

### 2.3 `lib/rbac.ts` — Bütün helper funksiyalar

```typescript
isStaff(role)              // admin|manager|reporter|worker|teacher
canManageUsers(role)       // yalnız admin
canManageQuestions(role)   // admin|manager|worker|teacher
canManageGroups(role)      // admin|manager
canManageExams(role)       // admin|manager|teacher
canViewResults(role)       // admin|manager|reporter|teacher
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
group_name TEXT                       -- legacy
group_id TEXT → groups(id)
is_blocked BOOLEAN DEFAULT false
is_student BOOLEAN DEFAULT true      -- qeydiyyatda toggle ilə təyin edilir
last_seen_at TIMESTAMPTZ             -- heartbeat (30s interval)
deleted_at TIMESTAMPTZ               -- soft delete tarixi
deletion_reason TEXT                 -- silmə səbəbi (admin tərəfindən məcburi)
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
target_type TEXT DEFAULT 'all'        -- 'all' | 'student' | 'non-student'
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

### `materials`
```sql
id TEXT PRIMARY KEY
title TEXT NOT NULL
content_url TEXT NOT NULL
group_id TEXT → groups(id)           -- NULL = bütün qruplar
start_date TIMESTAMPTZ DEFAULT NOW()
end_date TIMESTAMPTZ                 -- NULL = limitsiz
created_by TEXT → users(id)
created_at TIMESTAMPTZ
```

### `messages`
```sql
id TEXT PRIMARY KEY
sender_id TEXT → users(id) ON DELETE CASCADE
receiver_id TEXT → users(id) ON DELETE CASCADE
content TEXT NOT NULL
is_read BOOLEAN DEFAULT false
created_at TIMESTAMPTZ
```

### `notifications`
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

### `advertisements`
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

### `activity_logs`
```sql
id TEXT PRIMARY KEY
actor_id TEXT → users(id) ON DELETE SET NULL   -- kim etdi
actor_email TEXT                                -- logging üçün e-poçt
action TEXT NOT NULL                            -- user.create | user.delete | user.block | user.unblock | user.verify | exam.start | exam.submit | material.upload | notification.send | impersonation.start
target_type TEXT                                -- 'user' | 'exam' | 'material' | ...
target_id TEXT                                  -- hədəf resursun ID-si
details TEXT                                    -- JSON formatında əlavə məlumat
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
│   │   ├── register/page.tsx             # Qeydiyyat (isStudent toggle)
│   │   └── impersonate/page.tsx          # Admin impersonation
│   │
│   ├── dashboard/
│   │   ├── page.tsx                      # Tələbə kabinetı (Heartbeat, AdsBanner, Bell)
│   │   ├── materials/page.tsx            # Tələbə materialları (tarix-filtrli)
│   │   └── results/[id]/page.tsx         # Detallı nəticə + PDF/sertifikat
│   │
│   ├── messages/
│   │   ├── page.tsx                      # Real-time chat (server wrapper)
│   │   └── MessagesClient.tsx            # Pusher ilə chat UI
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
│   │   ├── page.tsx                      # Rol-filtrli nav (teacher vs admin)
│   │   ├── users/
│   │   │   ├── page.tsx                  # Soft-delete filter, Create button
│   │   │   ├── UserActions.tsx           # CreateUserModal, SoftDeleteModal
│   │   │   ├── CreateUserButton.tsx      # Client wrapper for create modal
│   │   │   └── UsersFilterBar.tsx
│   │   ├── results/
│   │   │   └── [id]/page.tsx             # PDF + Sertifikat yükləmə (admin)
│   │   ├── questions/
│   │   ├── exams/
│   │   ├── groups/
│   │   ├── analytics/                    # + User stats + Aktiv istifadəçi sırası
│   │   ├── online/page.tsx               # Standalone Online Users
│   │   ├── activity/page.tsx             # Fəaliyyət jurnalı (filter + page)
│   │   ├── materials/                    # Material CRUD (nav bar əlavə edildi)
│   │   │   ├── page.tsx
│   │   │   └── MaterialsClient.tsx
│   │   ├── notifications/                # Bildiriş göndərmə (nav bar əlavə edildi)
│   │   │   ├── page.tsx
│   │   │   └── NotificationsAdminClient.tsx
│   │   └── advertisements/               # Elan CRUD (nav bar əlavə edildi)
│   │       ├── page.tsx
│   │       └── AdsClient.tsx
│   │
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── register/route.ts             # isStudent flag
│       ├── groups/route.ts
│       ├── exam/ ...
│       ├── user/
│       │   ├── profile/route.ts
│       │   ├── heartbeat/route.ts
│       │   ├── result/[id]/route.ts
│       │   └── certificate/[id]/route.ts
│       ├── verify/[id]/route.ts          # PUBLIC
│       ├── messages/
│       │   ├── route.ts
│       │   └── contacts/route.ts
│       ├── materials/route.ts
│       ├── notifications/route.ts
│       ├── advertisements/route.ts
│       ├── pusher/auth/route.ts
│       └── admin/
│           ├── users/ [id]/ impersonate/
│           ├── results/
│           ├── questions/
│           ├── exams/
│           ├── groups/
│           ├── materials/ [id]/
│           ├── notifications/
│           ├── advertisements/ [id]/
│           └── export/
│
├── components/
│   ├── Heartbeat.tsx                     # 30s interval, last_seen_at yenilə
│   ├── NotificationBell.tsx              # Bell + unread badge, Pusher real-time
│   ├── AdsBanner.tsx                     # Rol-filtrli elan banneri
│   └── ui/PasswordInput.tsx
│
└── lib/
    ├── auth.ts                           # soft delete yoxlaması, teacher staff
    ├── auth.config.ts
    ├── db.ts
    ├── init-db.ts                        # DB init + migrasiyanlar (safe ALTER TABLE)
    ├── schema.ts                         # Drizzle cədvəl definisiyaları
    ├── rbac.ts                           # 6 rol, bütün icazə funksiyaları
    ├── pusher.ts                         # Server Pusher client
    ├── pusher-client.ts                  # Browser Pusher client (singleton)
    ├── scoring.ts
    └── questions.ts
```

---

## 5. Bütün Funksiyalar

### 5.1 İctimai Səhifələr

#### Ana Səhifə (`/`)
- Hero bölməsi, qeydiyyat/giriş düymələri
- Sertifikat yoxlama formu (ID daxil et)

#### Sertifikat Doğrulama (`/verify/[id]`)
- **Keçibsə:** yaşıl kart — ad, qrup, bal, faiz, tarix
- **Tapılmadısa:** qırmızı kart

---

### 5.2 Tələbə Funksiyaları

#### Qeydiyyat (`/auth/register`)
- **"Tələbəsən?"** mavi toggle
- `isStudent = true` → admin təsdiqi gözlənilir (`email_verified = NULL`)
- `isStudent = false` → dərhal giriş (`email_verified = NOW()`)

#### Tələbə Kabinetı (`/dashboard`)
- Heartbeat hər 30s — `last_seen_at` yenilənir
- Rol-filtrli AdsBanner (bağlanabilir)
- NotificationBell — zəng ikonu, unread badge, real-time
- Materiallar + Mesajlar nav linkləri

#### Materiallar (`/dashboard/materials`)
- `startDate ≤ NOW() ≤ endDate` filtrli
- Qrupa aid + hamıya açıq materiallar

#### Real-time Mesajlaşma (`/messages`)
- Pusher `private-user-{id}` kanalı
- Sol: istifadəçi siyahısı + unread badge
- Sağ: söhbət, Enter ilə göndər

#### Bildirişlər
- Dashboard nav-da zəng ikonu
- Real-time Pusher, oxundu markası

---

### 5.3 Soft Delete

```
Admin → İstifadəçilər → Sil
  → Modal: "Silmə səbəbini daxil edin" (məcburi)
  → DELETE /api/admin/users/[id]  { reason: "..." }
  → users.deleted_at = NOW(), users.deletion_reason = reason
  → Auth.ts login-i bloklar (deleted_at !== null)
```

---

### 5.4 Material Sistemi

#### Admin (`/admin/materials`)
- Başlıq, URL, qrup, başlanğıc/bitmə tarixi
- `canManageMaterials`: admin, manager, teacher

#### Tələbə görünüşü
- Yalnız aktiv (tarix aralığında) materiallar

---

### 5.5 Bildiriş Sistemi

| Növ | Hədəf | Pusher kanalı |
|---|---|---|
| `all` | Hamıya | `notifications` |
| `group` | Qrupa | `group-{groupId}` |
| `individual` | Fərdi | `private-user-{userId}` |

---

### 5.6 Elan Sistemi

- Rol-filtrli: `all`, `student`, digər rollar
- Toggle: aktiv/deaktiv
- `AdsBanner`: dashboard-da, bağlanabilir

---

### 5.7 Real-time Arxitektura (Pusher)

```
Server → pusher.trigger() → Pusher cloud (ap2) → pusher-js → Browser
```

**Quraşdırılmış credentials:**
```
PUSHER_APP_ID = 2149059
PUSHER_KEY    = a11d4fbad3508c00e265
PUSHER_CLUSTER = ap2
```

---

### 5.8 İmtahan Məntiqi

#### Sessiya Axını
```
/exam GET
  └─ Mövcud in_progress sessiya? → davam et
  └─ Aktiv exam (qrupa görə, sonra global)
  └─ Dinamik MAX = SUM(questions.points)
  └─ Shuffle suallar + seçimlər
  └─ Yeni exam_session yarat
```

#### Sessiya Bərpası
- `elapsed_seconds` DB-yə yazılır → taymer bərpası

#### Anti-Cheat
- `window.blur` → `tabSwitches++` → DB-yə yazılır

---

### 5.9 PDF və Export

| Fayl | URL | Giriş |
|---|---|---|
| Admin nəticə PDF | `GET /api/admin/export/pdf` | reporter+ |
| Excel export | `GET /api/admin/export/results` | reporter+ |
| Şəxsi nəticə PDF | `GET /api/user/result/[id]` | Öz nəticəsi |
| Sertifikat PDF | `GET /api/user/certificate/[id]` | ≥70% |

**Sertifikat alt hissəsi:**
- `Sertifikat ID: [uuid]`
- `Yoxlama: https://exam-portal-nine-azure.vercel.app/verify/[id]`

---

## 6. API Cədvəli (Tam — v5)

### Public
| Method | URL | Açıqlama |
|---|---|---|
| GET | `/api/verify/[id]` | Sertifikat doğrulama |
| GET | `/api/groups` | Qrup siyahısı |

### Auth tələb edən
| Method | URL | Açıqlama |
|---|---|---|
| POST | `/api/register` | Qeydiyyat (isStudent flag) |
| GET,POST | `/api/messages` | Söhbət yüklə / göndər |
| GET | `/api/messages/contacts` | İstifadəçilər + unread |
| GET | `/api/materials` | Aktiv materiallar |
| GET | `/api/notifications` | Bildirişlər |
| PATCH | `/api/notifications` | Oxundu işarələ |
| GET | `/api/advertisements` | Aktiv elanlar |
| POST | `/api/pusher/auth` | Pusher kanal auth |
| POST | `/api/user/heartbeat` | last_seen_at yenilə |
| POST | `/api/exam/save` | Cavabları saxla |
| POST | `/api/exam/submit` | İmtahanı bitir |
| PUT | `/api/user/profile` | Profil yenilə |
| GET | `/api/user/certificate/[id]` | Sertifikat PDF |

### Admin API
| Method | URL | İcazə |
|---|---|---|
| GET | `/api/admin/users` | admin |
| PATCH | `/api/admin/users` | admin |
| PUT | `/api/admin/users/[id]` | admin |
| DELETE | `/api/admin/users/[id]` | admin (reason məcburi) |
| POST | `/api/admin/users/[id]/impersonate` | admin |
| GET,POST | `/api/admin/questions` | worker+ |
| GET,PUT,DELETE | `/api/admin/questions/[id]` | worker+ |
| GET,PUT | `/api/admin/questions/[id]/groups` | worker+ |
| POST | `/api/admin/questions/import` | worker+ |
| GET,POST | `/api/admin/exams` | manager+ |
| GET,PUT,DELETE | `/api/admin/exams/[id]` | manager+ |
| GET,POST | `/api/admin/groups` | manager+ |
| PUT,DELETE | `/api/admin/groups/[id]` | manager+ |
| GET | `/api/admin/results` | reporter+ |
| GET,DELETE | `/api/admin/results/[id]` | reporter+ |
| GET | `/api/admin/export/results` | reporter+ |
| GET | `/api/admin/export/pdf` | reporter+ |
| GET,POST | `/api/admin/materials` | teacher+ |
| PUT,DELETE | `/api/admin/materials/[id]` | teacher+ |
| GET,POST | `/api/admin/notifications` | teacher+ |
| GET,POST | `/api/admin/advertisements` | manager+ |
| PUT,DELETE | `/api/admin/advertisements/[id]` | manager+ |

---

## 7. Admin Panel Səhifələri

| URL | Giriş | Funksiya |
|---|---|---|
| `/admin` | Bütün staff | Dashboard |
| `/admin/users` | admin | İstifadəçilər (soft delete, 6 rol) |
| `/admin/results` | reporter+ | Nəticələr, filter, export |
| `/admin/questions` | worker+ | CRUD, import |
| `/admin/exams` | manager+ | İmtahanlar CRUD |
| `/admin/groups` | manager+ | Qruplar CRUD |
| `/admin/analytics` | reporter+ | Online users, xəta analizi |
| `/admin/materials` | teacher+ | Material CRUD, tarix planlaması |
| `/admin/notifications` | teacher+ | Bildiriş göndər |
| `/admin/advertisements` | manager+ | Elan CRUD |
| `/messages` | Hamı | Real-time chat |

---

## 8. Mühit Dəyişənləri

```env
# Neon PostgreSQL
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# NextAuth
AUTH_SECRET=random-32-char-string
AUTH_URL=http://localhost:3000
NEXTAUTH_URL=https://exam-portal-nine-azure.vercel.app

# Pusher (ap2 cluster)
PUSHER_APP_ID=2149059
PUSHER_KEY=a11d4fbad3508c00e265
PUSHER_SECRET=1bad7423ee063bae67ed
PUSHER_CLUSTER=ap2
NEXT_PUBLIC_PUSHER_KEY=a11d4fbad3508c00e265
NEXT_PUBLIC_PUSHER_CLUSTER=ap2

# Admin seed
ADMIN_EMAIL=admin@exam.local
ADMIN_PASSWORD=Admin@123
ADMIN_NAME=Admin
```

---

## 9. Deployment (Vercel)

1. GitHub-a push → Vercel avtomatik deploy
2. Vercel Dashboard → Settings → Environment Variables-a yuxarıdakıları əlavə et
3. İlk deploy: `instrumentation.ts` → `initDatabase()` — bütün cədvəllər, sütunlar yaranır

### DB Migration qeydi
Yeni sütunlar (`is_student`, `deleted_at`, `deletion_reason`) artıq Neon DB-yə əlavə edilib.  
Yeni cədvəllər (`materials`, `messages`, `notifications`, `advertisements`) yaradılıb.  
Mövcud data (12 user, 7 nəticə) toxunulmayıb.

---

## 10. Əsas Qeydlər

- **Mövcud data qorunur:** `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
- **Soft delete:** `deleted_at` + `deletion_reason` — admin məcburi səbəb yazır; hard delete yoxdur
- **isStudent flag:** qeydiyyatda toggle — `true` → admin təsdiqi, `false` → dərhal giriş
- **Heartbeat:** hər 30s `POST /api/user/heartbeat` — online status üçün
- **Teacher rolu:** staff kimi giriş, materiallar + bildirişlər + tələbə siyahısı
- **Pusher cluster:** ap2 (Asia Pacific)
- **Sertifikat ID:** `exam_attempts.id` (UUID)
- **Tab-switch:** `window.blur` → imtahan zamanı sayılır
