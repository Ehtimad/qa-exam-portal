# QA Online Exam Portal — Quraşdırma Təlimatı (v5)

## Texniki Stack

| Komponent | Texnologiya |
|-----------|-------------|
| Framework | Next.js 15 (App Router) |
| CSS | Tailwind CSS |
| Database | Neon PostgreSQL (Serverless) |
| ORM | Drizzle ORM |
| Auth | NextAuth.js v5 |
| Real-time | Pusher (Channels) |
| Deploy | Vercel |

---

## 1. Lokal Geliştirme

```bash
# 1. Reponu klonla
git clone <repo-url>
cd exam-portal

# 2. Paketləri qur
npm install

# 3. .env.local faylını yarat
cp .env.example .env.local
# Aşağıdakı dəyərləri doldurun:

# 4. Dev serveri başlat
npm run dev
```

→ http://localhost:3000 ünvanında açılar.  
İlk açılışda `lib/init-db.ts` cədvəlləri yaradır, admin + 100 sualı seed edir.

---

## 2. Mühit Dəyişənləri (`.env.local`)

```env
# Neon PostgreSQL (neon.tech-dən alın)
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# NextAuth
AUTH_SECRET=ən_az_32_simvol_random_string
AUTH_URL=http://localhost:3000
NEXTAUTH_URL=https://sizin-app.vercel.app

# Pusher (pusher.com → Channels → App yaradın)
PUSHER_APP_ID=your_app_id
PUSHER_KEY=your_pusher_key
PUSHER_SECRET=your_pusher_secret
PUSHER_CLUSTER=eu
NEXT_PUBLIC_PUSHER_KEY=your_pusher_key
NEXT_PUBLIC_PUSHER_CLUSTER=eu

# Admin seed (DB boş olduqda istifadə edilir)
ADMIN_EMAIL=admin@exam.local
ADMIN_PASSWORD=Admin@123
ADMIN_NAME=Admin
```

---

## 3. Vercel Deploy

### Addım 1: Neon DB yarat
1. [neon.tech](https://neon.tech) → Yeni project yarat
2. Connection string-i kopyala → `DATABASE_URL`

### Addım 2: Pusher App yarat
1. [pusher.com](https://pusher.com) → Channels → "Create app"
2. App Keys bölməsindən: **App ID**, **Key**, **Secret**, **Cluster** alın
3. Vercel env vars-a əlavə edin

### Addım 3: Vercel-ə deploy et
```bash
# Vercel CLI (istəyə bağlı)
npm i -g vercel
vercel

# Yaxud: GitHub repo-nu Vercel-ə connect edin
# push etdikdə avtomatik deploy
```

### Addım 4: Vercel Environment Variables
Vercel Dashboard → Project → Settings → Environment Variables:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Neon connection string |
| `AUTH_SECRET` | Random 32+ char string |
| `NEXTAUTH_URL` | `https://sizin-app.vercel.app` |
| `PUSHER_APP_ID` | Pusher app id |
| `PUSHER_KEY` | Pusher key |
| `PUSHER_SECRET` | Pusher secret |
| `PUSHER_CLUSTER` | `eu` (və ya sizin cluster) |
| `NEXT_PUBLIC_PUSHER_KEY` | Pusher key (eyni) |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | `eu` (eyni) |

---

## 4. Admin Hesabı

Default credentials:
- E-poçt: `admin@exam.local`
- Şifrə: `Admin@123`

**İlk girişdən sonra dərhəl şifrəni dəyişin!**

---

## 5. İstifadəçi Axışı

### Tələbə (isStudent = true):
```
Qeydiyyat → "Tələbəsən?" toggle = ON
  ↓
Admin /admin/users → "Təsdiqlə" düyməsi
  ↓
Tələbə /dashboard-a giriş edə bilir
  ↓
/exam → İmtahan verir
  ↓
/dashboard/materials → Materialları görür
  ↓
/messages → Mesajlaşır
```

### Qeyri-tələbə (isStudent = false):
```
Qeydiyyat → "Tələbəsən?" toggle = OFF
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

| Rol | Kim üçün | Giriş |
|-----|----------|-------|
| `student` | İmtahan verənlər | Dashboard, Exam, Materials, Messages |
| `admin` | Sistem admini | Hər yer |
| `manager` | Kurs meneceri | Admin (geniş) |
| `reporter` | Analitik | Nəticələr, Analytics |
| `worker` | Sual hazırlayan | Suallar, Import |
| `teacher` | Müəllim | Materiallar, Bildirişlər |

---

## 8. Yeni v5 Xüsusiyyətlər

- **Real-time mesajlaşma** — Pusher ilə anlıq chat
- **Bildiriş sistemi** — fərdi/qrup/hamıya, real-time
- **Material planlaması** — start/end tarix, qrupa görə
- **Elan banneri** — rol-filtrli, bağlanabilir
- **Soft delete** — istifadəçilər silinmir, deaktiv olunur (səbəb məcburi)
- **Teacher rolu** — materiallar + bildirişlər + tələbə siyahısı
- **isStudent toggle** — qeydiyyatda tələbə/qeyri-tələbə seçimi
- **Heartbeat** — hər 30s `last_seen_at` yenilənir (online statusu üçün)
