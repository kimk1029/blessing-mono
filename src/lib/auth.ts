import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { prisma } from "./prisma";
import { getLevelFromPoints } from "./level";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          select: {
            id: true,
            username: true,
            email: true,
            password: true,
            affiliation: true,
            points: true,
            last_login_reward_date: true,
            created_at: true,
          },
        });

        if (!user) return null;

        const isMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        );
        if (!isMatch) return null;

        // 로그인 보상: 하루 1회 +1 포인트
        const today = new Date().toISOString().slice(0, 10);
        if (user.last_login_reward_date !== today) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              points: { increment: 1 },
              last_login_reward_date: today,
            },
          });
          user.points += 1;
        }

        const level = getLevelFromPoints(user.points);

        return {
          id: String(user.id),
          name: user.username,
          email: user.email,
          affiliation: user.affiliation,
          points: user.points,
          level,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.affiliation = (user as any).affiliation;
        token.points = (user as any).points;
        token.level = (user as any).level;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).affiliation = token.affiliation;
        (session.user as any).points = token.points;
        (session.user as any).level = token.level;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: { strategy: "jwt" },
});
