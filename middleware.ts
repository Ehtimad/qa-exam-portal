import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session;
  const isAdmin = session?.user?.role === "admin";
  const isApproved = session?.user?.approved;

  const isAuthPage =
    nextUrl.pathname.startsWith("/auth/");
  const isAdminPage = nextUrl.pathname.startsWith("/admin");
  const isDashboard = nextUrl.pathname.startsWith("/dashboard");
  const isExam = nextUrl.pathname.startsWith("/exam");
  const isResults = nextUrl.pathname.startsWith("/results");

  if (isAdminPage && !isAdmin) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  if ((isDashboard || isExam || isResults) && !isLoggedIn) {
    return NextResponse.redirect(new URL("/auth/signin", nextUrl));
  }

  if (isExam && isLoggedIn && !isApproved) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
