import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin",
  },
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAdmin = auth?.user?.role === "admin";
      const path = nextUrl.pathname;

      if (path.startsWith("/admin") && !isAdmin) {
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
      // Redirect logged-in admin directly to /admin
      if (path === "/dashboard" && isAdmin) {
        return Response.redirect(new URL("/admin", nextUrl));
      }
      if (path.startsWith("/auth/") && isLoggedIn) {
        return Response.redirect(new URL(isAdmin ? "/admin" : "/dashboard", nextUrl));
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
