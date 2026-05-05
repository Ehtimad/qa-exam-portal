# QA Online Exam Portal — Quraşdırma Təlimatı (v15)

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
Qeydiyyat → "Tələbə" seç → Qrup + Müəllim seç
  ↓
Admin/Müəllim /admin/users → "Təsdiqlə"
  ↓
/dashboard → /exam → /dashboard/materials → /messages
```

### Müəllim:
```
Qeydiyyat → "Müəllim" seç (qrup lazım deyil)
  ↓
Admin /admin/users → "Təsdiqlə"
  ↓
/admin → öz tələbələri/sualları/imtahanları/materialları
```

### Digər (işçi, reporter, və s.):
```
Qeydiyyat → "Digər" seç
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

## 8. v15 Xüsusiyyətlər

| Xüsusiyyət | Açıqlama |
|---|---|
| **3-yollu qeydiyyat** | "Tələbə / Müəllim / Digər" seçimi; müəllim admin təsdiqi ilə aktivləşir |
| **Müəllim qeydiyyatı** | Müəllim qeydiyyatı zamanı qrup seçimi tələb olunmur |
| **Tələbə yaratma (müəllim)** | Müəllim öz panelindən birbaşa tələbə əlavə edə bilir |
| **Sual müəllimi (admin UI)** | Sual add/edit modalında müəllim seçimi dropdown-u (yalnız admin) |
| **Toplu müəllim təyin etmə** | Suallar cədvəlində seçilənləri "Müəllimə Təhkim Et" ilə toplu təyin et |
| **CSV teacher sütunu** | CSV import-da `teacher` sütunu — e-poçt və ya ID qəbul edir |
| **CSV şablon yeniləndi** | Şablonda `teacher` sütunu + mövcud müəllimlər istinad bloku |
| **İstifadəçi filter (müəllim)** | Admin users səhifəsində müəllim filter dropdown-u |
| **Brute-force qorunması** | 15 dəqiqədə 10 yanlış cəhd → email bloklanır (`login_rate_limits` cədvəli) |

---

## 9. v14 Xüsusiyyətlər

| Xüsusiyyət | Açıqlama |
|---|---|
| **Dashboard izolyasiyası** | Müəllim dashboard-da yalnız öz tələbə sayı/cəhdlərini görür |
| **Blok/İmpersonation məhdudiyyəti** | Müəllim digər istifadəçiləri blok edə / impersonate edə bilməz |

---

## 10. v13 Xüsusiyyətlər

| Xüsusiyyət | Açıqlama |
|---|---|
| **Müəllim məlumat izolyasiyası** | Teacher yalnız öz `teacher_id`-si ilə bağlı resurslara baxır/idarə edir |
| **Soft Delete (hər yerdə)** | `deleted_at` timestamp — exams, questions, materials, users. Hard delete yoxdur |
| **Ownership check** | GET/PUT/DELETE hər endpointdə `forbidden` yoxlaması (403 vs 404) |

---

## 11. v12 Xüsusiyyətlər

| Xüsusiyyət | Açıqlama |
|---|---|
| Real-time mesajlaşma | Pusher ap2 cluster, private kanallar |
| Bildiriş sistemi | fərdi/qrup/hamıya, anlıq bell ikonu |
| Material planlaması | start/end tarix, qrupa görə |
| Soft delete (users) | `deleted_at` + `deletion_reason`, səbəb məcburi |
| Teacher rolu | tam panel: materiallar + bildirişlər + tələbə siyahısı |
| Heartbeat | hər 30s `last_seen_at` yenilənir |
| Fəaliyyət jurnalı | `activity_logs` cədvəli, `/admin/activity` səhifəsi |
| Rəy sistemi | Tələbə müəllimə, müəllim tələbəyə 1-5 ulduz + şərh |
| Sorğu modulu | Müəllim sorğu yaradır (açıq/seçimli), tələbə cavablayır |

---

## 12. DB Statusu (Neon)

Mövcud data (toxunulmayıb — heç bir sətir silinməyib):
- İstifadəçilər, imtahan nəticələri, suallar, qruplar

Yeni sütunlar (əlavə edilib, `ADD COLUMN IF NOT EXISTS`):
- `users.teacher_id` — müəllim-tələbə əlaqəsi
- `users.deleted_at`, `users.deletion_reason`
- `exams.teacher_id`, `exams.deleted_at`
- `questions.teacher_id`, `questions.deleted_at`, `questions.explanation`
- `materials.deleted_at`

Yeni cədvəllər (yaradılıb):
- `materials`, `messages`, `notifications`, `advertisements`, `activity_logs`
- `feedbacks`, `teacher_forms`, `teacher_form_answers`
- `login_rate_limits` — brute-force qorunması (v15)
