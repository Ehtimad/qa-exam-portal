# QA Exam Portal — Sənədləşmə (v3)

## Canlı Link

**Production:** https://exam-portal-nine-azure.vercel.app

---

## Texniki Stack

| Texnologiya | Versiya |
|---|---|
| Next.js | 15.x (App Router) |
| NextAuth | v5 beta (JWT strategy) |
| Drizzle ORM | 0.38.x |
| Neon PostgreSQL | Serverless |
| TailwindCSS | 3.x |
| jsPDF + autotable | PDF generasiyası |
| xlsx | Excel export |
| bcryptjs | Şifrə hashleme |
| zod | Schema validasiyası |

---

## Rol Sistemi (RBAC)

### Mövcud Rollar

| Rol | Açıqlama |
|---|---|
| `student` | İmtahan verir, öz nəticələrinə baxır |
| `admin` | Tam sistemə nəzarət |
| `manager` | Suallar, qruplar, imtahanlar, nəticələr |
| `reporter` | Yalnız nəticələr + analitika + export |
| `worker` | Sual yükləmə/import, sual idarəetməsi |

### İcazə Matriksi

| Funksiya | admin | manager | reporter | worker |
|---|---|---|---|---|
| İstifadəçiləri idarə et | ✅ | ❌ | ❌ | ❌ |
| Rol təyin et | ✅ | ❌ | ❌ | ❌ |
| Sualları idarə et | ✅ | ✅ | ❌ | ✅ |
| Sual import et | ✅ | ✅ | ❌ | ✅ |
| Qrupları idarə et | ✅ | ✅ | ❌ | ❌ |
| İmtahanları idarə et | ✅ | ✅ | ❌ | ❌ |
| Nəticələri gör | ✅ | ✅ | ✅ | ❌ |
| Export (PDF/Excel) | ✅ | ✅ | ✅ | ❌ |
| Analitika | ✅ | ✅ | ✅ | ❌ |
| İstifadəçini sil | ✅ | ❌ | ❌ | ❌ |
| Impersonation | ✅ | ❌ | ❌ | ❌ |

### Rol Təyin Etmə

Admin → İstifadəçilər → Redaktə → Rol dropdown

---

## Admin Panel Bölmələri

| Bölmə | URL | Giriş |
|---|---|---|
| Dashboard | `/admin` | Bütün staff |
| İstifadəçilər | `/admin/users` | Yalnız admin |
| Nəticələr | `/admin/results` | admin, manager, reporter |
| Suallar | `/admin/questions` | admin, manager, worker |
| İmtahanlar | `/admin/exams` | admin, manager |
| Qruplar | `/admin/groups` | admin, manager |
| Analitika | `/admin/analytics` | admin, manager, reporter |

---

## Verilənlər Bazası Sxemi

### `users`
```
id, name, email, email_verified, image, password,
role (student|admin|manager|reporter|worker),
group_name (legacy), group_id → groups,
is_blocked, last_seen_at, created_at
```

### `groups`
```
id, name, created_at
```

### `questions`
```
id (INT), lecture_id, text, type (single|multiple),
options (JSON), correct_answers (JSON),
difficulty, points, image_url, explanation, created_at
```

### `question_groups` (M2M)
```
question_id → questions, group_id → groups
PK(question_id, group_id)
```

### `exams`
```
id, title, group_id → groups, time_limit_minutes,
is_active, shuffle_questions, shuffle_options, created_at
```

### `exam_questions` (M2M)
```
exam_id → exams, question_id → questions
```

### `exam_sessions`
```
id, user_id, exam_id, question_order (JSON), option_orders (JSON),
answers (JSON), tab_switches, elapsed_seconds,
started_at, last_active_at, status (in_progress|submitted|abandoned)
```

### `exam_attempts`
```
id, user_id, exam_id, answers (JSON),
score, max_score, total_questions, correct_answers,
tab_switches, question_order (JSON), option_orders (JSON),
duration, started_at, completed_at
```

### `impersonation_tokens`
```
token, admin_id, target_user_id, expires_at, created_at
```

---

## Əsas Funksiyalar

### İmtahan Axını
1. User `/exam` → aktiv imtahan axtarılır (qrupa, sonra global)
2. Fallback: `question_groups` M2M, sonra bütün suallar
3. Suallar shuffle edilir → `exam_sessions`-a yazılır

### Sessiya Bərpası
- `elapsed_seconds` DB-də saxlanılır
- Yenidən girdikdə dəqiq vaxtdan davam edir

### Anti-Cheat
- `window.blur` → tab-switch sayılır, DB-yə yazılır

### Dinamik Bal
Aktiv imtahanın → `question_groups` → bütün suallar, `SUM(points)` ilə hesablanır

### M2M Sual-Qrup
- Bir sual → bir neçə qrup
- Admin panelindən "Qrup Təyin Et" → checkbox

### Export
- Excel: `/api/admin/export/results`
- PDF nəticə: `/api/admin/export/pdf`
- Şəxsi PDF: `/api/user/result/[id]`
- Sertifikat (≥70%): `/api/user/certificate/[id]`

### Impersonation
`POST /api/admin/users/[id]/impersonate` → 5-dəqiqəlik token → `/auth/impersonate?token=...`

### CSV Import
Format: `id, lecture_id, text, type, option_1..6, correct_answers, difficulty, points, explanation`
- `correct_answers`: `;` ilə 1-based (e.g. `"1;3"`)
- Şablon: `/api/admin/questions/template`

---

## Mühit Dəyişənləri

```env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://your-domain.com
ADMIN_EMAIL=admin@exam.local
ADMIN_PASSWORD=Admin@123
ADMIN_NAME=Admin
```

---

## Qeydlər

- DB `init-db.ts` ilk sorğuda avtomatik işləyir
- `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` ilə mövcud data qorunur
- Sual seeding `ON CONFLICT DO UPDATE` ilə həmişə upsert edir
- Staff rolları email təsdiqindən keçmir (avtomatik aktiv)
