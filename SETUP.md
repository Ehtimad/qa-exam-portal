# QA Online Exam Portal — Quraşdırma Təlimatı (v13)

## Texniki Stack

| Komponent | Texnologiya |
|-----------|-------------|
| Framework | Next.js 15 (App Router) |
| CSS | Tailwind CSS |
| Database | Neon PostgreSQL (Serverless) |
| ORM | Drizzle ORM |
| Auth | NextAuth.js v5 |
| Real-time | Pusher Channels (ap2) |
| Deploy | Vercel |

---

## 1. Lokal Geliştirme

```bash
# 1. Reponu klonla
git clone https://github.com/Ehtimad/qa-exam-portal.git
cd exam-portal

# 2. Paketləri qur
npm install

# 3. .env.local faylını yarat (aşağıdakı mühit dəyişənlərini əlavə et)
# 4. Dev serveri başlat
npm run dev
```

→ http://localhost:3000  
İlk açılışda `instrumentation.ts` → `initDatabase()` — cədvəllər yaranır, admin + suallar seed edilir.

---

## 2. Mühit Dəyişənləri (`.env.local`)

```env
# Neon PostgreSQL
DATABASE_URL=postgresql://neondb_owner:XXXX@ep-XXXX.eu-west-2.aws.neon.tech/neondb?sslmode=require

# NextAuth
AUTH_SECRET=ən_az_32_simvol_random_string
AUTH_URL=http://localhost:3000
NEXTAUTH_URL=https://sizin-app.vercel.app

# Pusher (ap2 cluster — quraşdırılmış)
PUSHER_APP_ID=2149059
PUSHER_KEY=a11d4fbad3508c00e265
PUSHER_SECRET=1bad7423ee063bae67ed
PUSHER_CLUSTER=ap2
NEXT_PUBLIC_PUSHER_KEY=a11d4fbad3508c00e265
NEXT_PUBLIC_PUSHER_CLUSTER=ap2

# Admin seed (DB boş olduqda)
ADMIN_EMAIL=admin@exam.local
ADMIN_PASSWORD=Admin@123
ADMIN_NAME=Admin
```

---

## 3. Vercel Deploy

### Addım 1: GitHub → Vercel
1. [vercel.com](https://vercel.com) → Import Git Repository
2. `Ehtimad/qa-exam-portal` seç → Deploy

### Addım 2: Environment Variables
Vercel Dashboard → Project → Settings → Environment Variables:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Neon connection string |
| `AUTH_SECRET` | 32+ char random string |
| `NEXTAUTH_URL` | `https://sizin-app.vercel.app` |
| `PUSHER_APP_ID` | `2149059` |
| `PUSHER_KEY` | `a11d4fbad3508c00e265` |
| `PUSHER_SECRET` | `1bad7423ee063bae67ed` |
| `PUSHER_CLUSTER` | `ap2` |
| `NEXT_PUBLIC_PUSHER_KEY` | `a11d4fbad3508c00e265` |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | `ap2` |

> **Qeyd:** Pusher credentials artıq Vercel-ə əlavə edilib (ap2 cluster).

### Addım 3: Deploy
Push etdikdə Vercel avtomatik deploy edir.

---

## 4. Admin Hesabı

Default credentials:
- E-poçt: `admin@exam.local`
- Şifrə: `Admin@123`

**İlk girişdən sonra şifrəni dəyişin!**

---

## 5. İstifadəçi Axışı

### Tələbə:
```
Qeydiyyat → "Tələbəsən?" = ON (mavi toggle)
  ↓
Admin /admin/users → "Təsdiqlə"
  ↓
/dashboard → /exam → /dashboard/materials → /messages
```

### Qeyri-tələbə (işçi, reporter, və s.):
```
Qeydiyyat → "Tələbəsən?" = OFF
  ↓
Dərhal giriş (admin təsdiqi yoxdur)
```

---

## 6. İmtahan Quruluşu

| Mühazirə | Mövzu | Sual sayı |
|----------|-------|-----------|
| M1 | Testing Əsasları | 14 |
| M2 | SDLC-də Test | 14 |
| M3 | Statik Test | 14 |
| M4 | Test Analizi | 15 |
| M5 | Test İdarəetməsi | 14 |
| M6 | Test Alətləri | 15 |
| M7 | Yekun Mövzular | 14 |
| **Cəmi** | | **100 sual / 500 bal** |

Keçid balı: **70%** (350 bal)

---

## 7. Rol Sistemi

| Rol | Giriş |
|-----|-------|
| `student` | Dashboard, Exam, Materials, Sorğular, Rəylər, Messages |
| `admin` | Hər yer (tam giriş) |
| `manager` | Admin (geniş) |
| `reporter` | Nəticələr, Analytics |
| `worker` | Suallar, Import |
| `teacher` | Yalnız **öz** tələbələri/sualları/imtahanları/materialları/nəticələri |

---

## 8. v13 Xüsusiyyətlər

| Xüsusiyyət | Açıqlama |
|---|---|
| **Müəllim məlumat izolyasiyası** | Teacher yalnız öz `teacher_id`-si ilə bağlı resurslara baxır/idarə edir |
| **Sual izolyasiyası** | Teacher öz yaratdığı sualları görür (`teacher_id` = user.id) |
| **İmtahan izolyasiyası** | Teacher öz imtahanlarını görür; admin imtahanları görünmür |
| **Material izolyasiyası** | Teacher öz yüklədiklərini görür (`created_by` filter) |
| **Nəticə izolyasiyası** | Teacher yalnız öz tələbələrinin nəticələrini görür |
| **Bildiriş məhdudiyyəti** | Teacher yalnız öz tələbəsinə fərdi bildiriş göndərə bilir |
| **Soft Delete (hər yerdə)** | `deleted_at` timestamp — exams, questions, materials, users. Hard delete yoxdur |
| **Ownership check** | GET/PUT/DELETE hər endpointdə `forbidden` yoxlaması (403 vs 404) |

---

## 9. v12 Xüsusiyyətlər

| Xüsusiyyət | Açıqlama |
|---|---|
| Real-time mesajlaşma | Pusher ap2 cluster, private kanallar |
| Bildiriş sistemi | fərdi/qrup/hamıya, anlıq bell ikonu |
| Material planlaması | start/end tarix, qrupa görə |
| Elan banneri | rol-filtrli, bağlanabilir |
| Soft delete | `deleted_at` + `deletion_reason`, səbəb məcburi |
| Teacher rolu | tam panel: materiallar + bildirişlər + tələbə siyahısı |
| isStudent toggle | qeydiyyatda tələbə/qeyri-tələbə seçimi |
| Heartbeat | hər 30s `last_seen_at` yenilənir |
| Fəaliyyət jurnalı | `activity_logs` cədvəli, `/admin/activity` səhifəsi |
| Admin istifadəçi yaratma | bütün 6 rol dəstəyi, avtomatik email-verify |
| Online Users səhifəsi | `/admin/online` — müstəqil real-time siyahı |
| Sertifikat (admin görünüşü) | admin nəticə səhifəsindən birbaşa yüklə |
| Analitika yeniləndi | tələbə vs qeyri-tələbə, aktiv istifadəçi sıralaması |
| Back/nav düymələri | bütün alt-səhifələrdə naviqasiya barları |
| **Multi-tenancy (v12)** | `teacher_id` — hər tələbə bir müəllimə bağlıdır |
| **Müəllim approve (v12)** | Həm admin, həm teacher öz tələbəsini activate edə bilir |
| **Rəy sistemi (v12)** | Tələbə müəllimə, müəllim tələbəyə 1-5 ulduz + şərh |
| **Sorğu modulu (v12)** | Müəllim sorğu yaradır (açıq/seçimli), tələbə cavablayır |
| **Qeydiyyatda müəllim seçimi (v12)** | Tələbə qeydiyyatda öz müəllimini seçir |

---

## 9. DB Statusu (Neon)

Mövcud data (toxunulmayıb):
- **12 istifadəçi** (8 tələbə, 1 admin, 1 manager, digərləri)
- **7 imtahan nəticəsi**
- **33 sual** (DB-də), 100 sual (seed data)
- **2 qrup**

Yeni sütunlar (əlavə edilib, data pozulmayıb):
- `users.is_student`, `users.deleted_at`, `users.deletion_reason`
- `users.teacher_id` — müəllim-tələbə əlaqəsi (v12)
- `exams.target_type`
- `exams.teacher_id`, `exams.deleted_at` — müəllim sahib + soft delete (v13)
- `questions.teacher_id`, `questions.deleted_at` — müəllim sahib + soft delete (v13)
- `materials.deleted_at` — soft delete (v13)

Yeni cədvəllər (yaradılıb):
- `materials`, `messages`, `notifications`, `advertisements`, `activity_logs`
- `feedbacks` — rəy sistemi (v12)
- `teacher_forms` — müəllim sorğuları (v12)
- `teacher_form_answers` — sorğu cavabları (v12)
