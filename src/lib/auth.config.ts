import type { NextAuthConfig } from "next-auth";

// bcrypt를 사용하지 않는 가벼운 설정 - 미들웨어용
export const authConfig: NextAuthConfig = {
  providers: [], // 미들웨어에서는 provider 불필요
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const protectedPaths = ["/profile", "/posts/write", "/church", "/chat"];
      const isProtected = protectedPaths.some((p) =>
        nextUrl.pathname.startsWith(p)
      );
      if (isProtected && !isLoggedIn) {
        return Response.redirect(new URL("/login", nextUrl));
      }
      return true;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: { strategy: "jwt" },
};
