import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// Use the lightweight Edge-compatible config (no DB adapter)
export const { auth: middleware } = NextAuth(authConfig);

export default middleware;

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
