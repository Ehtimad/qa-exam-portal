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
  id:              text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name:            text("name"),
  email:           text("email").unique().notNull(),
  emailVerified:   timestamp("email_verified", { mode: "date" }),
  image:           text("image"),
  password:        text("password"),
  role:            text("role").notNull().default("student"),
  // student | admin | manager | reporter | worker | teacher
  isStudent:       boolean("is_student").notNull().default(true),
  groupName:       text("group_name"),    // legacy — kept for existing rows
  groupId:         text("group_id").references(() => groups.id, { onDelete: "set null" }),
  isBlocked:       boolean("is_blocked").notNull().default(false),
  lastSeenAt:      timestamp("last_seen_at"),
  createdAt:       timestamp("created_at").notNull().defaultNow(),
  // soft delete
  deletedAt:       timestamp("deleted_at"),
  deletionReason:  text("deletion_reason"),
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

// ─── QUESTIONS ───────────────────────────────────────────────────────────
export const questions = pgTable("questions", {
  id:             integer("id").primaryKey(),
  lectureId:      integer("lecture_id").notNull(),
  text:           text("text").notNull(),
  type:           text("type").notNull(),           // "single" | "multiple"
  options:        text("options").notNull(),         // JSON: string[]
  correctAnswers: text("correct_answers").notNull(), // JSON: number[]
  difficulty:     text("difficulty").notNull(),      // "easy"|"medium"|"hard"
  points:         integer("points").notNull(),
  imageUrl:       text("image_url"),
  explanation:    text("explanation"),
  createdAt:      timestamp("created_at").notNull().defaultNow(),
});

// ─── EXAMS ───────────────────────────────────────────────────────────────
export const exams = pgTable("exams", {
  id:               text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title:            text("title").notNull(),
  groupId:          text("group_id").references(() => groups.id, { onDelete: "set null" }),
  timeLimitMinutes: integer("time_limit_minutes"),
  isActive:         boolean("is_active").notNull().default(false),
  shuffleQuestions: boolean("shuffle_questions").notNull().default(true),
  shuffleOptions:   boolean("shuffle_options").notNull().default(true),
  targetType:       text("target_type").notNull().default("all"),
  // "all" | "student" | "non-student"
  createdAt:        timestamp("created_at").notNull().defaultNow(),
});

// ─── QUESTION ↔ GROUPS (M2M) ─────────────────────────────────────────────
export const questionGroups = pgTable("question_groups", {
  questionId: integer("question_id").notNull().references(() => questions.id, { onDelete: "cascade" }),
  groupId:    text("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
}, (t) => ({ pk: primaryKey({ columns: [t.questionId, t.groupId] }) }));

// ─── EXAM ↔ QUESTIONS (M2M) ──────────────────────────────────────────────
export const examQuestions = pgTable("exam_questions", {
  examId:     text("exam_id").notNull().references(() => exams.id, { onDelete: "cascade" }),
  questionId: integer("question_id").notNull().references(() => questions.id, { onDelete: "cascade" }),
}, (t) => ({ pk: primaryKey({ columns: [t.examId, t.questionId] }) }));

// ─── EXAM SESSIONS ───────────────────────────────────────────────────────
export const examSessions = pgTable("exam_sessions", {
  id:             text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId:         text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  examId:         text("exam_id").references(() => exams.id, { onDelete: "cascade" }),
  questionOrder:  text("question_order").notNull(),
  optionOrders:   text("option_orders").notNull(),
  answers:        text("answers").notNull().default("{}"),
  tabSwitches:    integer("tab_switches").notNull().default(0),
  elapsedSeconds: integer("elapsed_seconds").notNull().default(0),
  startedAt:      timestamp("started_at").notNull().defaultNow(),
  lastActiveAt:   timestamp("last_active_at").notNull().defaultNow(),
  status:         text("status").notNull().default("in_progress"),
});

// ─── EXAM ATTEMPTS ───────────────────────────────────────────────────────
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
  questionOrder:  text("question_order"),
  optionOrders:   text("option_orders"),
  duration:       integer("duration"),
  startedAt:      timestamp("started_at").notNull().defaultNow(),
  completedAt:    timestamp("completed_at").notNull().defaultNow(),
});

// ─── MATERIALS ───────────────────────────────────────────────────────────
export const materials = pgTable("materials", {
  id:         text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title:      text("title").notNull(),
  contentUrl: text("content_url").notNull(),
  groupId:    text("group_id").references(() => groups.id, { onDelete: "cascade" }),
  // null = all groups
  startDate:  timestamp("start_date").notNull().defaultNow(),
  endDate:    timestamp("end_date"),  // null = no expiry
  createdBy:  text("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt:  timestamp("created_at").notNull().defaultNow(),
});

// ─── MESSAGES ────────────────────────────────────────────────────────────
export const messages = pgTable("messages", {
  id:         text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  senderId:   text("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  receiverId: text("receiver_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content:    text("content").notNull(),
  isRead:     boolean("is_read").notNull().default(false),
  createdAt:  timestamp("created_at").notNull().defaultNow(),
});

// ─── NOTIFICATIONS ───────────────────────────────────────────────────────
export const notifications = pgTable("notifications", {
  id:        text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId:    text("user_id").references(() => users.id, { onDelete: "cascade" }),
  // null = broadcast to all
  groupId:   text("group_id").references(() => groups.id, { onDelete: "cascade" }),
  // null = all groups
  title:     text("title").notNull(),
  message:   text("message").notNull(),
  type:      text("type").notNull().default("all"),
  // "individual" | "group" | "all"
  isRead:    boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── ADVERTISEMENTS ──────────────────────────────────────────────────────
export const advertisements = pgTable("advertisements", {
  id:         text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title:      text("title").notNull(),
  content:    text("content").notNull(),
  targetRole: text("target_role").notNull().default("all"),
  // "all" | "student" | specific role
  isActive:   boolean("is_active").notNull().default(true),
  createdAt:  timestamp("created_at").notNull().defaultNow(),
});

// ─── NOTIFICATION READS ──────────────────────────────────────────────────
export const notificationReads = pgTable("notification_reads", {
  notificationId: text("notification_id").notNull().references(() => notifications.id, { onDelete: "cascade" }),
  userId:         text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
}, (t) => ({ pk: primaryKey({ columns: [t.notificationId, t.userId] }) }));

// ─── ACTIVITY LOGS ───────────────────────────────────────────────────────
export const activityLogs = pgTable("activity_logs", {
  id:         text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  actorId:    text("actor_id").references(() => users.id, { onDelete: "set null" }),
  actorEmail: text("actor_email"),
  action:     text("action").notNull(),
  // e.g. "user.create" | "user.delete" | "user.block" | "exam.start"
  // "exam.submit" | "material.upload" | "material.delete"
  // "notification.send" | "impersonation.start"
  targetType: text("target_type"),   // "user" | "exam" | "material" | etc.
  targetId:   text("target_id"),
  details:    text("details"),       // JSON extra info
  createdAt:  timestamp("created_at").notNull().defaultNow(),
});

// ─── TYPES ───────────────────────────────────────────────────────────────
export type QuestionGroup  = typeof questionGroups.$inferSelect;
export type User           = typeof users.$inferSelect;
export type NewUser        = typeof users.$inferInsert;
export type Question       = typeof questions.$inferSelect;
export type NewQuestion    = typeof questions.$inferInsert;
export type Exam           = typeof exams.$inferSelect;
export type ExamSession    = typeof examSessions.$inferSelect;
export type ExamAttempt    = typeof examAttempts.$inferSelect;
export type Group          = typeof groups.$inferSelect;
export type Material       = typeof materials.$inferSelect;
export type Message        = typeof messages.$inferSelect;
export type Notification   = typeof notifications.$inferSelect;
export type Advertisement  = typeof advertisements.$inferSelect;
export type ActivityLog    = typeof activityLogs.$inferSelect;
export type NotificationRead = typeof notificationReads.$inferSelect;
