import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "./db";
import { users, accounts, sessions, verificationTokens, impersonationTokens } from "./schema";
import { eq, and, gt } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authConfig } from "@/auth.config";
import { checkLoginRateLimit, resetLoginRateLimit } from "./rate-limit";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    Credentials({
      credentials: {
        email:              { label: "Email", type: "email" },
        password:           { label: "Password", type: "password" },
        impersonationToken: { label: "Impersonation Token", type: "text" },
      },
      async authorize(credentials) {
        // ── Impersonation path ───────────────────────────────────────
        if (credentials?.impersonationToken) {
          const token = credentials.impersonationToken as string;
          const [row] = await db
            .select()
            .from(impersonationTokens)
            .where(
              and(
                eq(impersonationTokens.token, token),
                gt(impersonationTokens.expiresAt, new Date())
              )
            )
            .limit(1);

          if (!row) return null;

          // Consume token (one-time use)
          await db.delete(impersonationTokens).where(eq(impersonationTokens.token, token));

          const [target] = await db
            .select()
            .from(users)
            .where(eq(users.id, row.targetUserId))
            .limit(1);

          if (!target) return null;

          return {
            id: target.id,
            name: target.name,
            email: target.email,
            image: target.image,
            role: target.role,
            groupId: target.groupId,
            impersonatedBy: row.adminId,
          } as never;
        }

        // ── Normal credentials path ──────────────────────────────────
        const parsed = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);
        if (!parsed.success) return null;

        // Rate limit check — block after 10 failed attempts in 15 minutes
        const { blocked } = await checkLoginRateLimit(parsed.data.email).catch(() => ({ blocked: false }));
        if (blocked) return null;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, parsed.data.email))
          .limit(1);

        if (!user || !user.password) return null;

        const valid = await bcrypt.compare(parsed.data.password, user.password);
        if (!valid) return null;

        // Reset counter on successful password match
        await resetLoginRateLimit(parsed.data.email).catch(() => {});

        // Soft-delete check
        if (user.deletedAt) return null;

        // Block check
        if (user.isBlocked) return null;

        // Staff roles bypass email verification; students must be verified
        const staffRoles = ["admin", "manager", "reporter", "worker", "teacher"];
        if (!staffRoles.includes(user.role) && !user.emailVerified) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          groupId: user.groupId,
        } as never;
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
        token.groupId = (user as { groupId?: string }).groupId;
        token.impersonatedBy = (user as { impersonatedBy?: string }).impersonatedBy;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.groupId = token.groupId as string | undefined;
        session.user.impersonatedBy = token.impersonatedBy as string | undefined;
      }
      return session;
    },
  },
});

declare module "next-auth" {
  interface User {
    role?: string;
    groupId?: string | null;
    groupName?: string | null;
    impersonatedBy?: string | null;
  }
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
      groupId?: string | null;
      groupName?: string | null;
      impersonatedBy?: string | null;
    };
  }
}
