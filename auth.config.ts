import type { NextAuthConfig } from "next-auth";

// Lightweight config for Edge middleware — no DB adapter here
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
      const isApproved = auth?.user?.approved;

      const path = nextUrl.pathname;

      if (path.startsWith("/admin") && !isAdmin) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }
      if (
        (path.startsWith("/dashboard") ||
          path.startsWith("/exam") ||
          path.startsWith("/results")) &&
        !isLoggedIn
      ) {
        return Response.redirect(new URL("/auth/signin", nextUrl));
      }
      if (path.startsWith("/exam") && isLoggedIn && !isApproved && !isAdmin) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }
      if (path.startsWith("/auth/") && isLoggedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
        token.approved = (user as { approved?: boolean }).approved;
      }
      return token;
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.approved = token.approved as boolean;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
