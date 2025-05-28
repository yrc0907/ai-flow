import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { verifyPassword } from "@/lib/auth";
import prisma from "@/lib/prisma";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("认证失败: 缺少邮箱或密码");
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user) {
          console.log(`认证失败: 用户 ${credentials.email} 不存在`);
          return null;
        }

        const isPasswordValid = await verifyPassword(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          console.log(`认证失败: 用户 ${credentials.email} 密码错误`);
          return null;
        }

        console.log(`用户 ${credentials.email} 认证成功，ID: ${user.id}`);
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30天
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        console.log(`JWT回调: 设置用户ID ${user.id} 到token`);
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        console.log(`Session回调: 设置token ID ${token.id} 到session`);
        session.user.id = token.id as string;
      } else {
        console.error("Session回调: 无法设置用户ID，token或session.user不存在");
        console.log("Token:", JSON.stringify(token));
        console.log("Session:", JSON.stringify(session));
      }
      return session;
    },
  },
  debug: true, // 始终启用调试
  logger: {
    error(code, metadata) {
      console.error(`NextAuth错误 [${code}]:`, metadata);
    },
    warn(code) {
      console.warn(`NextAuth警告 [${code}]`);
    },
    debug(code, metadata) {
      console.log(`NextAuth调试 [${code}]:`, metadata);
    },
  },
});

export { handler as GET, handler as POST }; 