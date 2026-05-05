# QA Exam Portal — Test Automation Specification (v15)

> **Məqsəd:** Bu sənəd avtomatlaşdırılmış test scriptlərinin (Playwright/Cypress/Jest) yazılması üçün "source of truth" rolunu oynayır.  
> **Canlı URL:** https://exam-portal-nine-azure.vercel.app  
> **Base API URL:** https://exam-portal-nine-azure.vercel.app

---

## Mündəricat

1. [Test Mühiti Konfiqurasiyası](#1-test-mühiti-konfiqurasiyası)
2. [Element Selektorları](#2-element-selektorları)
3. [Auth Test Spesifikasiyaları](#3-auth-test-spesifikasiyaları)
4. [Registration Test Spesifikasiyaları](#4-registration-test-spesifikasiyaları)
5. [Exam Flow Test Spesifikasiyaları](#5-exam-flow-test-spesifikasiyaları)
6. [Admin Panel Test Spesifikasiyaları](#6-admin-panel-test-spesifikasiyaları)
7. [API Test Spesifikasiyaları](#7-api-test-spesifikasiyaları)
8. [RBAC/Authorization Test Spesifikasiyaları](#8-rbacauthorization-test-spesifikasiyaları)
9. [Rate Limiting Test Spesifikasiyaları](#9-rate-limiting-test-spesifikasiyaları)
10. [Test Fixtures və Helpers](#10-test-fixtures-və-helpers)

---

## 1. Test Mühiti Konfiqurasiyası

### 1.1 Playwright konfiqurasiyası (tövsiyə edilən)

```typescript
// playwright.config.ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  baseURL: process.env.TEST_BASE_URL ?? "https://exam-portal-nine-azure.vercel.app",
  timeout: 30_000,
  retries: 1,
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { channel: "chrome" } },
    { name: "firefox" },
  ],
});
```

### 1.2 Test istifadəçiləri (env dəyişənləri)

```env
TEST_ADMIN_EMAIL=admin@exam.local
TEST_ADMIN_PASSWORD=Admin@123
TEST_TEACHER_EMAIL=teacher@test.com
TEST_TEACHER_PASSWORD=Teacher@123
TEST_STUDENT_EMAIL=student@test.com
TEST_STUDENT_PASSWORD=Student@123
TEST_BASE_URL=https://exam-portal-nine-azure.vercel.app
```

### 1.3 Cookie-based Auth Helper (Playwright)

```typescript
// helpers/auth.ts
import { type Page } from "@playwright/test";

export async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/auth/signin");
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(dashboard|admin)/);
}

export async function loginAsAdmin(page: Page) {
  await loginAs(page, process.env.TEST_ADMIN_EMAIL!, process.env.TEST_ADMIN_PASSWORD!);
}

export async function loginAsTeacher(page: Page) {
  await loginAs(page, process.env.TEST_TEACHER_EMAIL!, process.env.TEST_TEACHER_PASSWORD!);
}

export async function loginAsStudent(page: Page) {
  await loginAs(page, process.env.TEST_STUDENT_EMAIL!, process.env.TEST_STUDENT_PASSWORD!);
}
```

---

## 2. Element Selektorları

> **Qeyd:** Layihədə `data-testid` atributları hələ yoxdur. Aşağıdakı selektorlar mövcud CSS class-larına, tip atributlarına və mətn məzmununa əsaslanır. Gələcəkdə `data-testid` əlavə etmək tövsiyə edilir.

### 2.1 Sign-In Formu (`/auth/signin`)

```typescript
const SELECTORS = {
  emailInput:    'input[type="email"]',
  passwordInput: 'input[type="password"]',
  submitButton:  'button[type="submit"]',
  errorMessage:  '.bg-red-50.border-red-200',        // xəta bloku
  registerLink:  'a[href="/auth/register"]',
};
```

### 2.2 Register Formu (`/auth/register`)

```typescript
const SELECTORS = {
  // Rol seçim düymələri (grid içindəki 3 button)
  roleStudent:   'button:has-text("Tələbə")',
  roleTeacher:   'button:has-text("Müəllim")',
  roleOther:     'button:has-text("Digər")',

  groupSelect:   'select[required]',               // qrup dropdown
  teacherSelect: 'select:not([required])',          // müəllim dropdown (optional)

  nameInput:     'input[placeholder="Əli Əliyev"]',
  emailInput:    'input[type="email"]',
  passwordInput: 'input[placeholder="Ən az 6 simvol"]',
  confirmInput:  'input[placeholder="Şifrəni təkrar daxil et"]',
  submitButton:  'button[type="submit"]',
  errorMessage:  '.bg-red-50.border-red-200',
  successMsg:    '.bg-green-50',                   // uğur mesajı
  pendingMsg:    '.bg-amber-50',                   // gözlənilir mesajı
};
```

### 2.3 Dashboard (`/dashboard`)

```typescript
const SELECTORS = {
  startExamBtn:     'a[href="/exam"], button:has-text("İmtahana başla")',
  notificationBell: 'button[aria-label="Bildirişlər"], button:has(.bell-icon)',
  unreadBadge:      '.notification-badge, span.bg-red-500',
  adsBanner:        '.ads-banner, [data-component="ads-banner"]',
  closeBannerBtn:   'button:has-text("×"), button[aria-label="Bağla"]',
  materialsLink:    'a[href="/dashboard/materials"]',
  messagesLink:     'a[href="/messages"]',
};
```

### 2.4 İmtahan (`/exam`)

```typescript
const SELECTORS = {
  questionText:   'h2, .question-text, p.text-xl',
  optionButtons:  'button.option-btn, label:has(input[type="radio"]), label:has(input[type="checkbox"])',
  nextBtn:        'button:has-text("Növbəti"), button:has-text("→")',
  prevBtn:        'button:has-text("Əvvəlki"), button:has-text("←")',
  submitBtn:      'button:has-text("Bitir"), button:has-text("Göndər")',
  progressText:   'text=/\\d+ \\/ \\d+/',           // "3 / 10" pattern
  timerDisplay:   'text=/\\d+:\\d{2}/',             // "14:59" pattern
  tabWarnBanner:  'text=/Tab dəyişdiniz/', 
  confirmedModal: 'button:has-text("Bəli"), button:has-text("Təsdiq")',
};
```

### 2.5 Admin — Suallar (`/admin/questions`)

```typescript
const SELECTORS = {
  addBtn:          'button:has-text("+ Sual Əlavə Et")',
  searchInput:     'input[placeholder="Sual axtar..."]',
  checkboxAll:     'thead input[type="checkbox"]',
  rowCheckbox:     'tbody input[type="checkbox"]',
  editBtn:         'button:has-text("Redaktə")',
  deleteBtn:       'button:has-text("Sil")',
  bulkExamBtn:     'button:has-text("İmtahana Əlavə Et")',
  bulkTeacherBtn:  'button:has-text("Müəllimə Təhkim Et")',
  csvImportLabel:  'label:has-text("CSV İdxal")',
  csvFileInput:    'input[type="file"][accept=".csv"]',
  csvTemplateBtn:  'a:has-text("CSV Şablon")',
  pageSizeSelect:  'select:has(option:has-text("/ səhifə"))',
  paginationNext:  'button:has-text("Sonra")',

  // Modal
  modal:           '.fixed.inset-0.bg-black\\/50',
  modalTitle:      'h2:has-text("sual")',
  typeSelect:      'select:has(option[value="single"])',
  pointsInput:     'input[type="number"][min="1"]',
  textArea:        'textarea',
  teacherSelect:   'select:has(option:has-text("Müəllimsiz"))',   // admin only
  saveBtn:         'button:has-text("Saxla")',
  cancelBtn:       'button:has-text("Ləğv et")',
};
```

### 2.6 Admin — İstifadəçilər (`/admin/users`)

```typescript
const SELECTORS = {
  createUserBtn:    'button:has-text("+ Yeni İstifadəçi"), button:has-text("+ Tələbə Əlavə Et")',
  searchInput:      'input[placeholder*="axtar"]',
  groupFilter:      'select:has(option:has-text("Bütün qruplar"))',
  teacherFilter:    'select:has(option:has-text("Bütün müəllimlər"))',
  statusFilter:     'select:has(option:has-text("Bütün statuslar"))',
  approveBtn:       'button:has-text("Təsdiqlə")',
  blockBtn:         'button:has-text("Blokla")',
  unblockBtn:       'button:has-text("Bloku açın")',
  deleteBtn:        'button:has-text("Sil")',
  impersonateBtn:   'button:has-text("Daxil ol"), button:has-text("Impersonate")',
  
  // Create modal
  nameInput:        '.modal input[placeholder*="Ad"]',
  emailInput:       '.modal input[type="email"]',
  passwordInput:    '.modal input[type="password"]',
  roleSelect:       '.modal select',
  teacherDropdown:  '.modal select:has(option:has-text("Müəllim seç"))',
};
```

---

## 3. Auth Test Spesifikasiyaları

```typescript
describe("Authentication", () => {

  it("should redirect authenticated admin to /admin", async () => {
    // GET /auth/signin while logged in as admin
    // Expected: redirect to /admin
  });

  it("should redirect authenticated student to /dashboard", async () => {
    // GET /auth/signin while logged in as student
    // Expected: redirect to /dashboard
  });

  it("should sign in successfully with valid admin credentials", async () => {
    // POST /api/auth/callback/credentials
    // Body: { email: TEST_ADMIN_EMAIL, password: TEST_ADMIN_PASSWORD }
    // Expected: redirect to /admin, session cookie set
  });

  it("should sign in successfully with valid student credentials", async () => {
    // Expected: redirect to /dashboard
  });

  it("should return error for invalid password", async () => {
    // Body: { email: TEST_ADMIN_EMAIL, password: "wrongpassword" }
    // Expected: error message visible on page, no redirect
    // Selector: '.bg-red-50.border-red-200' contains "E-poçt və ya şifrə yanlışdır"
  });

  it("should return error for non-existent email", async () => {
    // Body: { email: "nonexistent@test.com", password: "anypassword" }
    // Expected: error message, no redirect
  });

  it("should block login after 10 failed attempts within 15 minutes", async () => {
    // Loop 11 times: POST with wrong password for same email
    // Expected: 11th attempt still fails (even with correct password)
    // Verify: login_rate_limits.attempts > 10
  });

  it("should sign out successfully and clear session", async () => {
    // POST /api/auth/signout
    // Expected: session cookie cleared, redirect to /auth/signin
    // Verify: GET /dashboard → redirect to /auth/signin
  });

  it("should redirect unauthenticated user from /dashboard to /auth/signin", async () => {
    // GET /dashboard without cookie
    // Expected: 307 redirect to /auth/signin
  });

  it("should redirect student from /admin to /dashboard", async () => {
    // GET /admin with student session
    // Expected: redirect to /dashboard
  });

});
```

---

## 4. Registration Test Spesifikasiyaları

```typescript
describe("Registration", () => {

  it("should register a new student successfully", async () => {
    // POST /api/register
    // Body: { name, email, password, role: "student", groupId }
    // Expected: 201 { ok: true }
    // Verify: user created in DB with emailVerified = null, role = "student"
  });

  it("should register a new teacher successfully", async () => {
    // Body: { name, email, password, role: "teacher" }  (no groupId)
    // Expected: 201 { ok: true }
    // Verify: emailVerified = null, role = "teacher"
  });

  it("should register 'other' role with immediate access", async () => {
    // Body: { name, email, password, role: "other", groupId }
    // Expected: 201 { ok: true }
    // Verify: emailVerified = NOW() (not null)
  });

  it("should reject duplicate email", async () => {
    // Body: { email: "admin@exam.local", ... }
    // Expected: 409 { error: "Bu e-poçt artıq istifadə edilir" }
  });

  it("should reject password shorter than 6 chars", async () => {
    // Body: { password: "abc" }
    // Expected: 400 (zod validation failure)
  });

  it("should require groupId for student role", async () => {
    // Body: { role: "student" } without groupId
    // Expected: 400 validation error
  });

  it("should not require groupId for teacher role", async () => {
    // Body: { role: "teacher" } without groupId
    // Expected: 201 success
  });

  it("should show 3-role selector on register page", async () => {
    // Navigate to /auth/register
    // Verify: 3 buttons present: "Tələbə", "Müəllim", "Digər"
  });

  it("should hide group/teacher dropdowns when Müəllim role selected", async () => {
    // Click "Müəllim" button
    // Verify: group select NOT visible
    // Verify: teacher select NOT visible
  });

  it("should show group AND teacher dropdowns when Tələbə selected", async () => {
    // Click "Tələbə" button (default)
    // Verify: group select IS visible
    // Verify: teacher select IS visible
  });

  it("should prevent login for unverified student account", async () => {
    // Student registered but not approved
    // POST /api/auth/callback/credentials with valid creds
    // Expected: login fails
  });

});
```

---

## 5. Exam Flow Test Spesifikasiyaları

```typescript
describe("Exam Flow", () => {

  it("should load exam with questions in shuffled order", async () => {
    // GET /exam as authenticated student
    // Expected: 200, exam session created in DB
    // Verify: questions displayed, different order on reload (shuffle)
  });

  it("should save answer on option selection (single)", async () => {
    // Click first option in single-type question
    // Click second option
    // Verify: only second option selected (radio behavior)
    // POST /api/exam/save called with correct payload
  });

  it("should allow multiple selection for multiple-type question", async () => {
    // Click options A and C in multiple-type question
    // Verify: both A and C selected (checkbox behavior)
  });

  it("should persist answers on page reload", async () => {
    // Answer question 1, reload page
    // Verify: question 1 still shows answered
    // Source: /api/exam/session returns saved answers
  });

  it("should increment tab_switches on window blur", async () => {
    // Focus another page element to trigger blur event
    // Verify: warning banner visible
    // Verify: POST /api/exam/save increments tabSwitches
  });

  it("should count down timer correctly", async () => {
    // Verify timer starts at time_limit_minutes
    // Wait 5 seconds
    // Verify timer decreased by ~5 seconds
  });

  it("should submit exam and return score", async () => {
    // POST /api/exam/submit
    // Body: { sessionId, answers: { "Q_ID": [answerIdx] } }
    // Expected: 200 { attemptId, score, maxScore, passed }
    // Verify: exam_attempts row created
    // Verify: exam_sessions.status = "submitted"
  });

  it("should show certificate button when score >= 70%", async () => {
    // Navigate to result page with attempt where score >= 70%
    // Verify: "Sertifikat yüklə" button visible
  });

  it("should hide certificate button when score < 70%", async () => {
    // Navigate to result page with attempt where score < 70%
    // Verify: "Sertifikat yüklə" button NOT visible
  });

  it("should show no-exam message when no active exam", async () => {
    // No active exams in DB
    // GET /exam
    // Verify: "Aktiv imtahan tapılmadı" message
  });

  it("should restore in-progress session on re-entry", async () => {
    // Start exam, answer 3 questions, close tab
    // Navigate to /exam again
    // Verify: same session resumed, answers preserved
  });

});
```

---

## 6. Admin Panel Test Spesifikasiyaları

### 6.1 Sual İdarəetmə

```typescript
describe("Questions Management", () => {

  it("should create a new question", async () => {
    // POST /api/admin/questions
    // Body: { lectureId:1, text:"...", type:"single", options:["A","B","C","D"],
    //         correctAnswers:[0], difficulty:"medium", points:5 }
    // Expected: 200, { id: number, text, type, ... }
  });

  it("should update question with new teacherId (admin only)", async () => {
    // PUT /api/admin/questions/[id]
    // Body: { ...existing, teacherId: "TEACHER_ID" }
    // Expected: 200, updated.teacherId = "TEACHER_ID"
  });

  it("should soft-delete a question", async () => {
    // DELETE /api/admin/questions/[id]
    // Expected: 200 { success: true }
    // Verify: GET /api/admin/questions list does NOT include deleted question
    // Verify: DB questions.deleted_at IS NOT NULL
  });

  it("should bulk assign questions to teacher", async () => {
    // POST /api/admin/questions/bulk-teacher
    // Body: { questionIds: [1,2,3], teacherId: "TEACHER_ID" }
    // Expected: 200 { updated: 3 }
  });

  it("should bulk assign questions to exam", async () => {
    // POST /api/admin/questions/bulk-exam
    // Body: { questionIds: [1,2], examIds: ["EXAM_UUID"] }
    // Expected: 200 { updated: 2 }
  });

  it("should import questions from valid CSV", async () => {
    // POST /api/admin/questions/import multipart/form-data
    // File: valid CSV with 3 questions
    // Expected: 200 { imported: 3, updated: 0, errors: [] }
  });

  it("should import CSV and assign teacher by email", async () => {
    // CSV last column: teacher = "teacher@test.com"
    // Expected: imported question.teacherId = teacher user ID
  });

  it("should report error rows for malformed CSV lines", async () => {
    // CSV with 2 valid rows + 1 row with missing correct_answers column
    // Expected: { imported: 2, errors: ["Sətir 3: ..."] }
  });

  it("should return CSV template with teacher column", async () => {
    // GET /api/admin/questions/template
    // Expected: 200, Content-Type: text/csv
    // Verify: header contains "teacher" column
    // Verify: teacher reference comments present if teachers exist
  });

  it("should paginate questions list at page boundary", async () => {
    // Add 26 questions, set pageSize=25
    // Verify: page 1 has 25 rows, page 2 has 1 row
    // Verify: pagination controls visible
  });

  it("should filter questions by search text", async () => {
    // Type "unikal" in search input
    // Verify: only questions containing "unikal" in text are shown
  });

});
```

### 6.2 İstifadəçi İdarəetmə

```typescript
describe("User Management", () => {

  it("should create user with all fields", async () => {
    // POST /api/admin/users
    // Body: { name, email, password, role: "teacher" }
    // Expected: 201 user object with emailVerified set (admin creates = auto-verified)
  });

  it("should approve pending student", async () => {
    // PATCH /api/admin/users { userId, action: "approve" }
    // Expected: 200, user.emailVerified IS NOT NULL
  });

  it("should block user", async () => {
    // PATCH /api/admin/users { userId, action: "block" }
    // Expected: 200, user.isBlocked = true
  });

  it("should soft-delete user with reason", async () => {
    // DELETE /api/admin/users/[id]
    // Body: { reason: "Test silmə" }
    // Expected: 200 { success: true }
    // Verify: user.deleted_at IS NOT NULL
    // Verify: user.deletion_reason = "Test silmə"
  });

  it("should filter users by teacher", async () => {
    // GET /admin/users with teacherFilter set
    // UI: select teacher in filter bar
    // Verify: only students with teacher_id = selectedTeacherId shown
  });

  it("should create student as teacher (teacher creates own student)", async () => {
    // POST /api/admin/users with teacher session
    // Body: { name, email, password }  // role forced to student
    // Expected: 201, student.teacherId = teacher.id
  });

  it("should deny teacher from creating admin-role user", async () => {
    // POST /api/admin/users with teacher session
    // Body: { role: "admin", ... }
    // Expected: role is forced to "student" regardless
  });

});
```

---

## 7. API Test Spesifikasiyaları

### 7.1 Request/Response Şablonları

#### POST `/api/register`

```typescript
// Schema validation:
interface RegisterBody {
  name: string;          // min 1 char
  email: string;         // valid email format
  password: string;      // min 6, max 100
  groupId?: string;      // required for student, optional for teacher
  teacherId?: string;    // optional
  role?: "student" | "teacher";  // default: "student"
}

// Success response:
// 201 { ok: true }

// Error responses:
// 400 { error: "Məlumatlar düzgün deyil" }       — zod validation
// 409 { error: "Bu e-poçt artıq istifadə edilir" }
```

#### GET `/api/admin/questions`

```typescript
// Headers required:
// Cookie: next-auth.session-token=<jwt>
// (or Authorization header with bearer token if API mode)

// Query params: none required (returns all non-deleted)

// Success response (200):
// Array<{
//   id: number,
//   lectureId: number,
//   text: string,
//   type: "single" | "multiple",
//   options: string[],         // parsed JSON
//   correctAnswers: number[],  // parsed JSON, 0-based
//   difficulty: "easy" | "medium" | "hard",
//   points: number,
//   imageUrl: string | null,
//   explanation: string | null,
//   teacherId: string | null,
//   deletedAt: null            // never included (filtered out)
// }>

// Error: 403 { error: "Forbidden" }
```

#### POST `/api/admin/questions`

```typescript
interface CreateQuestionBody {
  lectureId: number;        // min 1 (integer)
  text: string;             // min 5 chars
  type: "single" | "multiple";
  options: string[];        // min 2, max 8 items, each min 1 char
  correctAnswers: number[]; // 0-based indices, min 1 item
  difficulty: "easy" | "medium" | "hard";
  points: number;           // min 1 (integer)
  imageUrl?: string | null; // must be valid URL if provided
  explanation?: string | null;
  teacherId?: string | null; // admin only (ignored for teacher actor)
}

// Success: 200 (created question object)
// 400: { error: "Məlumatlar düzgün deyil" }  — zod failure
// 403: { error: "Forbidden" }
```

#### PUT `/api/admin/questions/[id]`

```typescript
// Same schema as POST CreateQuestionBody (all fields required)
// + teacherId only applied if actor is admin/manager

// 200: updated question object
// 400: validation error
// 403: forbidden (teacher trying to edit another teacher's question)
// 404: { error: "Tapılmadı" }
```

#### DELETE `/api/admin/questions/[id]`

```typescript
// No body required
// 200: { success: true }
// 403: forbidden
// 404: not found

// Side effect: questions.deleted_at = NOW()
// exam_questions rows NOT deleted (M2M preserved)
```

#### POST `/api/admin/questions/bulk-teacher`

```typescript
interface BulkTeacherBody {
  questionIds: number[];     // non-empty array
  teacherId: string | null;  // null = unassign (back to admin)
}

// 200: { updated: number }
// 400: { error: "questionIds tələb olunur" }
// 403: { error: "Forbidden" } — teacher actors blocked
```

#### POST `/api/admin/users`

```typescript
interface CreateUserBody {
  name: string;
  email: string;
  password: string;
  role?: "student" | "admin" | "manager" | "reporter" | "worker" | "teacher";
  groupId?: string;
  teacherId?: string;       // admin only
  isStudent?: boolean;
}

// 201: created user object (password field excluded)
// 409: duplicate email
// 403: forbidden (if not admin or teacher)
```

#### DELETE `/api/admin/users/[id]`

```typescript
interface DeleteUserBody {
  reason: string;   // required, min 1 char
}

// 200: { success: true }
// 400: { error: "Silmə səbəbi daxil edilməlidir" }  — missing reason
// 403: forbidden
// 404: not found

// Side effect: users.deleted_at = NOW(), users.deletion_reason = reason
// Does NOT hard delete
```

#### POST `/api/exam/submit`

```typescript
interface SubmitBody {
  sessionId: string;
  answers: Record<string, number[]>;  // { "questionId": [selectedOptionIdx] }
}

// 200: {
//   attemptId: string,
//   score: number,
//   maxScore: number,
//   totalQuestions: number,
//   correctAnswers: number,
//   tabSwitches: number,
//   duration: number,         // seconds
//   passed: boolean           // score/maxScore >= 0.7
// }
// 400: session not found or already submitted
// 403: not authenticated
```

#### POST `/api/admin/notifications`

```typescript
interface SendNotificationBody {
  title: string;
  message: string;
  type: "all" | "group" | "individual";
  userId?: string;    // required if type = "individual"
  groupId?: string;   // required if type = "group"
}

// Teacher actor: only "individual" type allowed, userId must be own student
// 200: { success: true }
// 400: { error: "..." }   — missing required fields for type
// 403: teacher sending group/all, or targeting non-own student
```

---

## 8. RBAC/Authorization Test Spesifikasiyaları

```typescript
describe("Role-Based Access Control", () => {

  // ── Admin capabilities ──────────────────────────────────────────
  it("admin should access /admin", async () => {
    // GET /admin with admin session → 200
  });

  it("admin should bulk-assign teacher", async () => {
    // POST /api/admin/questions/bulk-teacher → 200
  });

  it("admin should impersonate any user", async () => {
    // POST /api/admin/users/[id]/impersonate → 200 { token }
  });

  it("admin should delete any user", async () => {
    // DELETE /api/admin/users/[id] { reason } → 200
  });

  // ── Teacher capabilities ─────────────────────────────────────────
  it("teacher should see only own questions via GET /api/admin/questions", async () => {
    // Create Q1 for teacher-A, Q2 for teacher-B
    // GET with teacher-A session
    // Verify: response includes Q1, does NOT include Q2
  });

  it("teacher should NOT edit another teacher's question", async () => {
    // PUT /api/admin/questions/[Q2_id] with teacher-A session
    // Expected: 403
  });

  it("teacher should NOT bulk-assign teacher", async () => {
    // POST /api/admin/questions/bulk-teacher with teacher session
    // Expected: 403
  });

  it("teacher should NOT delete another teacher's student", async () => {
    // Teacher-A tries DELETE /api/admin/users/[student_of_teacher_B]
    // Expected: 403
  });

  it("teacher should create student (own)", async () => {
    // POST /api/admin/users with teacher session (no role field)
    // Expected: 201, student.teacherId = teacher.id
  });

  it("teacher should only see own students in GET /api/admin/users", async () => {
    // GET /api/admin/users with teacher session
    // Expected: only users where teacher_id = session.user.id
  });

  it("teacher sending 'all' notification should be blocked", async () => {
    // POST /api/admin/notifications { type: "all" } with teacher session
    // Expected: 403
  });

  // ── Student capabilities ─────────────────────────────────────────
  it("student should NOT access any /api/admin/* endpoint", async () => {
    // GET /api/admin/questions with student session → 403
    // GET /api/admin/users with student session → 403
  });

  it("student should access own exam result", async () => {
    // GET /api/user/result/[OWN_ATTEMPT_ID] → 200
  });

  it("student should NOT access another student's result", async () => {
    // GET /api/user/result/[OTHER_STUDENT_ATTEMPT_ID] → 403
  });

  // ── Unauthenticated ──────────────────────────────────────────────
  it("unauthenticated request to /api/admin/* should return 401 or 403", async () => {
    // GET /api/admin/questions (no cookie) → 401 or 403
  });

});
```

---

## 9. Rate Limiting Test Spesifikasiyaları

```typescript
describe("Rate Limiting (Brute-force Protection)", () => {

  it("should allow login within first 10 attempts", async () => {
    // POST /api/auth/callback/credentials (wrong password) x 9 times for email X
    // 10th attempt with CORRECT password
    // Expected: 10th attempt succeeds (login_rate_limits.attempts = 10 <= 10)
  });

  it("should block login on 11th attempt (even with correct password)", async () => {
    // POST wrong password x 10 times for email Y
    // 11th attempt with CORRECT password
    // Expected: login fails
    // DB: login_rate_limits WHERE email = Y → attempts > 10
  });

  it("should reset rate limit counter on successful login", async () => {
    // POST wrong password x 5 times for email Z
    // POST correct password → login succeeds
    // DB: login_rate_limits WHERE email = Z → row deleted or attempts = 0
    // Verify: wrong password again doesn't get blocked early
  });

  it("should use 15-minute sliding window", async () => {
    // POST wrong password x 10 for email W
    // Wait > 15 minutes (or mock time)
    // POST wrong password again
    // Expected: new window starts, attempts = 1 (not blocked)
  });

  it("should not block login if rate limit DB is unavailable", async () => {
    // Mock checkLoginRateLimit to throw
    // Attempt login with correct credentials
    // Expected: login succeeds (catch block returns { blocked: false })
  });

});
```

---

## 10. Test Fixtures və Helpers

### 10.1 API Helper (fetch wrapper)

```typescript
// helpers/api.ts
const BASE_URL = process.env.TEST_BASE_URL!;

export class ApiClient {
  private cookies: string = "";

  async login(email: string, password: string): Promise<void> {
    // Use playwright/fetch to POST to /api/auth/callback/credentials
    // Extract and store session cookie
  }

  async get(path: string): Promise<Response> {
    return fetch(`${BASE_URL}${path}`, {
      headers: { Cookie: this.cookies },
    });
  }

  async post(path: string, body: unknown): Promise<Response> {
    return fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: this.cookies,
      },
      body: JSON.stringify(body),
    });
  }

  async delete(path: string, body?: unknown): Promise<Response> {
    return fetch(`${BASE_URL}${path}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Cookie: this.cookies,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  }
}
```

### 10.2 Test Data Factories

```typescript
// fixtures/factories.ts

export function makeQuestion(overrides = {}) {
  return {
    lectureId: 1,
    text: `Test sualı ${Date.now()}`,
    type: "single" as const,
    options: ["Variant A", "Variant B", "Variant C", "Variant D"],
    correctAnswers: [0],
    difficulty: "medium" as const,
    points: 5,
    ...overrides,
  };
}

export function makeUser(overrides = {}) {
  const id = Date.now();
  return {
    name: `Test User ${id}`,
    email: `testuser${id}@test.com`,
    password: "Test@1234",
    role: "student" as const,
    ...overrides,
  };
}

export function makeExam(overrides = {}) {
  return {
    title: `Test İmtahan ${Date.now()}`,
    isActive: true,
    shuffleQuestions: true,
    shuffleOptions: false,
    timeLimitMinutes: 60,
    ...overrides,
  };
}
```

### 10.3 CSV Test Fixtures

```
# valid_import.csv
id,text,type,option_1,option_2,option_3,option_4,option_5,option_6,correct_answers,points,explanation,exam_ids,teacher
,Avtomatlaşdırılmış test sualı 1,single,A variantı,B variantı,C variantı,D variantı,,,1,5,,, 
,Çoxlu cavablı sual,multiple,Düzgün 1,Düzgün 2,Yanlış,Yanlış 2,,,1;2,5,,, 
```

```
# invalid_import.csv (yanlış format — 5 sütun)
id,text,type
,Natamam sətir,single
```

```
# teacher_column.csv (teacher e-poçt ilə)
id,text,type,option_1,option_2,option_3,option_4,option_5,option_6,correct_answers,points,explanation,exam_ids,teacher
,Müəllim sualı,single,A,B,C,D,,,1,5,,,teacher@test.com
```

### 10.4 Playwright Auth State Fixture

```typescript
// fixtures/auth-state.ts
import { chromium, type BrowserContext } from "@playwright/test";

export async function createAdminContext(): Promise<BrowserContext> {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto(`${BASE_URL}/auth/signin`);
  await page.fill('input[type="email"]', process.env.TEST_ADMIN_EMAIL!);
  await page.fill('input[type="password"]', process.env.TEST_ADMIN_PASSWORD!);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/admin/);
  
  // Save auth state for reuse
  await context.storageState({ path: "auth-state-admin.json" });
  return context;
}
```

### 10.5 Gözlənilən HTTP Status Kodları Xülasəsi

| Endpoint | Uğurlu | Auth yoxdur | İcazə yoxdur | Tapılmadı | Validation |
|----------|--------|-------------|--------------|-----------|------------|
| `POST /api/register` | 201 | — | — | — | 400 |
| `GET /api/admin/questions` | 200 | 403 | 403 | — | — |
| `POST /api/admin/questions` | 200 | 403 | 403 | — | 400 |
| `PUT /api/admin/questions/[id]` | 200 | 403 | 403 | 404 | 400 |
| `DELETE /api/admin/questions/[id]` | 200 | 403 | 403 | 404 | — |
| `POST /api/admin/questions/bulk-teacher` | 200 | 403 | 403 | — | 400 |
| `POST /api/admin/users` | 201 | 403 | 403 | — | 400 |
| `DELETE /api/admin/users/[id]` | 200 | 403 | 403 | 404 | 400 |
| `POST /api/exam/submit` | 200 | 403 | — | 400 | 400 |
| `GET /api/verify/[id]` | 200 | — | — | 404 | — |
| `POST /api/admin/questions/import` | 200 | 403 | 403 | — | 400 |

---

## Qeyd: data-testid Əlavə Etmək Tövsiyəsi

Avtomatlaşdırılmış testləri daha sabit etmək üçün aşağıdakı əsas elementlərə `data-testid` atributu əlavə edilməsini tövsiyə edirik:

```tsx
// app/auth/signin/page.tsx
<input data-testid="email-input" type="email" ... />
<input data-testid="password-input" type="password" ... />
<button data-testid="submit-btn" type="submit">...</button>
<div data-testid="error-message" className="bg-red-50...">...</div>

// app/auth/register/page.tsx
<button data-testid="role-student" ...>Tələbə</button>
<button data-testid="role-teacher" ...>Müəllim</button>
<button data-testid="role-other" ...>Digər</button>

// app/exam/ExamClient.tsx
<div data-testid="question-text">...</div>
<button data-testid="submit-exam">Bitir</button>
<span data-testid="timer">14:59</span>

// app/admin/questions/QuestionsClient.tsx
<button data-testid="add-question-btn">...</button>
<button data-testid="bulk-teacher-btn">...</button>
```

Bu dəyişiklik selektorları kövrək (brittle) `has-text` yoxlamalardan daha etibarlı `data-testid` atributlarına keçirəcək.

---

*Son yeniləmə: 2026-05-05 | v15*
