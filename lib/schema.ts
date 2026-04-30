import {
  pgTable, text, boolean, timestamp,
  doublePrecision, integer, primaryKey,
} from "drizzle-orm/pg-core";

// ─── GROUPS ─────────────────────────────────────────────────────────────
export const groups = pgTable("groups", {
  id:        text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name:      text("name").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── USERS ──────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id:            text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name:          text("name"),
  email:         text("email").unique().notNull(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image:         text("image"),
  password:      text("password"),
  role:          text("role").notNull().default("student"),
  groupName:     text("group_name"),   // legacy — kept for existing rows
  groupId:       text("group_id").references(() => groups.id, { onDelete: "set null" }),
  isBlocked:     boolean("is_blocked").notNull().default(false),
  lastSeenAt:    timestamp("last_seen_at"),
  createdAt:     timestamp("created_at").notNull().defaultNow(),
});

// ─── NEXTAUTH ────────────────────────────────────────────────────────────
export const accounts = pgTable("accounts", {
  userId:            text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type:              text("type").notNull(),
  provider:          text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refresh_token:     text("refresh_token"),
  access_token:      text("access_token"),
  expires_at:        integer("expires_at"),
  token_type:        text("token_type"),
  scope:             text("scope"),
  id_token:          text("id_token"),
  session_state:     text("session_state"),
}, (t) => ({ pk: primaryKey({ columns: [t.provider, t.providerAccountId] }) }));

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId:       text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires:      timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token:      text("token").notNull(),
  expires:    timestamp("expires", { mode: "date" }).notNull(),
}, (t) => ({ pk: primaryKey({ columns: [t.identifier, t.token] }) }));

// ─── IMPERSONATION TOKENS ────────────────────────────────────────────────
export const impersonationTokens = pgTable("impersonation_tokens", {
  token:        text("token").primaryKey(),
  adminId:      text("admin_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  targetUserId: text("target_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt:    timestamp("expires_at").notNull(),
  createdAt:    timestamp("created_at").notNull().defaultNow(),
});

// ─── QUESTIONS ──────────────────────────────────────────────────────────
// INTEGER primary key — same IDs as legacy lib/questions.ts (1-100)
// so exam_attempts.answers JSON keys stay valid
export const questions = pgTable("questions", {
  id:             integer("id").primaryKey(),
  lectureId:      integer("lecture_id").notNull(),
  text:           text("text").notNull(),
  type:           text("type").notNull(),            // "single" | "multiple"
  options:        text("options").notNull(),          // JSON: string[]
  correctAnswers: text("correct_answers").notNull(),  // JSON: number[]
  difficulty:     text("difficulty").notNull(),       // "easy"|"medium"|"hard"
  points:         integer("points").notNull(),
  imageUrl:       text("image_url"),
  explanation:    text("explanation"),
  createdAt:      timestamp("created_at").notNull().defaultNow(),
});

// ─── EXAMS ──────────────────────────────────────────────────────────────
export const exams = pgTable("exams", {
  id:               text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title:            text("title").notNull(),
  groupId:          text("group_id").references(() => groups.id, { onDelete: "set null" }),
  timeLimitMinutes: integer("time_limit_minutes"),   // null = unlimited
  isActive:         boolean("is_active").notNull().default(false),
  shuffleQuestions: boolean("shuffle_questions").notNull().default(true),
  shuffleOptions:   boolean("shuffle_options").notNull().default(true),
  createdAt:        timestamp("created_at").notNull().defaultNow(),
});

// ─── QUESTION ↔ GROUPS (many-to-many) ────────────────────────────────────
export const questionGroups = pgTable("question_groups", {
  questionId: integer("question_id").notNull().references(() => questions.id, { onDelete: "cascade" }),
  groupId:    text("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
}, (t) => ({ pk: primaryKey({ columns: [t.questionId, t.groupId] }) }));

// ─── EXAM ↔ QUESTIONS (many-to-many) ─────────────────────────────────────
export const examQuestions = pgTable("exam_questions", {
  examId:     text("exam_id").notNull().references(() => exams.id, { onDelete: "cascade" }),
  questionId: integer("question_id").notNull().references(() => questions.id, { onDelete: "cascade" }),
}, (t) => ({ pk: primaryKey({ columns: [t.examId, t.questionId] }) }));

// ─── EXAM SESSIONS ("continue later") ────────────────────────────────────
export const examSessions = pgTable("exam_sessions", {
  id:            text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId:        text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  examId:        text("exam_id").references(() => exams.id, { onDelete: "cascade" }),
  questionOrder: text("question_order").notNull(),  // JSON: number[]
  optionOrders:  text("option_orders").notNull(),   // JSON: {[qId]: number[]}
  answers:       text("answers").notNull().default("{}"),
  tabSwitches:    integer("tab_switches").notNull().default(0),
  elapsedSeconds: integer("elapsed_seconds").notNull().default(0),
  startedAt:      timestamp("started_at").notNull().defaultNow(),
  lastActiveAt:   timestamp("last_active_at").notNull().defaultNow(),
  status:         text("status").notNull().default("in_progress"),
  // "in_progress" | "submitted" | "abandoned"
});

// ─── EXAM ATTEMPTS ───────────────────────────────────────────────────────
// New nullable columns added via ALTER TABLE — existing rows unaffected
export const examAttempts = pgTable("exam_attempts", {
  id:             text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId:         text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  examId:         text("exam_id").references(() => exams.id, { onDelete: "set null" }),
  answers:        text("answers").notNull(),
  score:          doublePrecision("score").notNull(),
  maxScore:       doublePrecision("max_score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  correctAnswers: integer("correct_answers").notNull(),
  tabSwitches:    integer("tab_switches").notNull().default(0),
  questionOrder:  text("question_order"),   // nullable for legacy rows
  optionOrders:   text("option_orders"),    // nullable for legacy rows
  duration:       integer("duration"),
  startedAt:      timestamp("started_at").notNull().defaultNow(),
  completedAt:    timestamp("completed_at").notNull().defaultNow(),
});

// ─── TYPES ──────────────────────────────────────────────────────────────
export type QuestionGroup = typeof questionGroups.$inferSelect;
export type User         = typeof users.$inferSelect;
export type NewUser      = typeof users.$inferInsert;
export type Question     = typeof questions.$inferSelect;
export type NewQuestion  = typeof questions.$inferInsert;
export type Exam         = typeof exams.$inferSelect;
export type ExamSession  = typeof examSessions.$inferSelect;
export type ExamAttempt  = typeof examAttempts.$inferSelect;
export type Group        = typeof groups.$inferSelect;
