import type { NextAuthConfig } from "next-auth";
import { isStaff } from "@/lib/rbac";

export const authConfig = {
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin",
  },
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = auth?.user?.role as string | undefined;
      const staff = isStaff(role);
      const path = nextUrl.pathname;

      if (path.startsWith("/admin") && !staff) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }
      if (
        (path.startsWith("/dashboard") ||
          path.startsWith("/exam") ||
          path.startsWith("/results") ||
          path.startsWith("/profile")) &&
        !isLoggedIn
      ) {
        return Response.redirect(new URL("/auth/signin", nextUrl));
      }
      // Redirect logged-in staff directly to /admin (skip if impersonating)
      const impersonatedBy = (auth as { user?: { impersonatedBy?: string } } | null)?.user?.impersonatedBy;
      if (path === "/dashboard" && staff && !impersonatedBy) {
        return Response.redirect(new URL("/admin", nextUrl));
      }
      // Allow /auth/impersonate even when logged in (so the new tab can sign in as target user)
      if (path.startsWith("/auth/") && !path.startsWith("/auth/impersonate") && isLoggedIn) {
        return Response.redirect(new URL(staff ? "/admin" : "/dashboard", nextUrl));
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
        token.groupId = (user as { groupId?: string }).groupId;
        token.impersonatedBy = (user as { impersonatedBy?: string }).impersonatedBy;
      }
      return token;
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.groupId = token.groupId as string | undefined;
        session.user.impersonatedBy = token.impersonatedBy as string | undefined;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
