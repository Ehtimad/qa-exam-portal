# QA Online Exam Portal — Quraşdırma Təlimatı

## Texniki Stack

| Komponent | Texnologiya |
|-----------|-------------|
| Framework | Next.js 15 (App Router) |
| CSS | Tailwind CSS |
| Database | SQLite via Turso/libSQL |
| ORM | Drizzle ORM |
| Auth | NextAuth.js v5 |
| Deploy | Vercel |

---

## 1. Lokal Geliştirme

```bash
# 1. Reponu klonla
git clone <repo-url>
cd exam-portal

# 2. Paketləri qur
npm install

# 3. .env faylını yarat
cp .env.example .env
# .env faylında dəyərləri dəyişdir

# 4. Veritabanını yarat (lokal SQLite)
npm run db:migrate

# 5. İlk Admin istifadəçisi yarat
npm run db:seed-admin

# 6. Dev serveri başlat
npm run dev
```

→ http://localhost:3000 ünvanında açılar.

---

## 2. Vercel + Turso Deploy

### Addım 1: Turso veritabanı yarat

```bash
# Turso CLI qur
brew install tursodatabase/tap/turso

# Giriş et
turso auth login

# Veritabanı yarat
turso db create qa-exam-db

# URL və token al
turso db show qa-exam-db --url
turso db tokens create qa-exam-db
```

### Addım 2: Vercel-ə deploy et

```bash
# Vercel CLI qur
npm i -g vercel

# Deploy
vercel

# Environment dəyişənlərini əlavə et:
# TURSO_DATABASE_URL=libsql://qa-exam-db-xxx.turso.io
# TURSO_AUTH_TOKEN=eyJ...
# AUTH_SECRET=<random 32 char string>
# AUTH_URL=https://your-app.vercel.app
# AUTH_GOOGLE_ID=<optional>
# AUTH_GOOGLE_SECRET=<optional>
```

### Addım 3: Canlı veritabanını qur

```bash
TURSO_DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=... npm run db:migrate
TURSO_DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=... npm run db:seed-admin
```

---

## 3. Admin Hesabı

Default credentials (dəyişdirin!):
- E-poçt: `admin@exam.local`
- Şifrə: `Admin@123`

Öz admin hesabını yaratmaq üçün:
```bash
ADMIN_EMAIL=siz@example.com ADMIN_PASSWORD=güclüşifrə npm run db:seed-admin
```

---

## 4. İstifadəçi Axışı

```
Tələbə qeydiyyatdan keçir
  ↓
Admin /admin/users-da "Təsdiq et" düyməsinə basır
  ↓
Tələbə /exam-ə gedir → 100 sual
  ↓
Bütün sualları cavablandırır (Required!)
  ↓
"Bitir" düyməsinə basır → Bal hesablanır
  ↓
/dashboard-da keçmiş nəticələrə baxa bilir
```

---

## 5. İmtahan Quruluşu

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

Çətinlik: Asan (3 bal) • Orta (5 bal) • Çətin (8 bal)

Keçid balı: 70% (350 bal)
