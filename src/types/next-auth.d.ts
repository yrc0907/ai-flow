import { DefaultSession, DefaultJWT } from "next-auth";

declare module "next-auth" {
  /**
   * 扩展默认的Session类型
   */
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }

  /**
   * 扩展默认的User类型
   */
  interface User {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
  }
}

declare module "next-auth/jwt" {
  /** 扩展JWT类型 */
  interface JWT extends DefaultJWT {
    id: string;
  }
} 