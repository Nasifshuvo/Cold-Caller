import NextAuth from "next-auth"

declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    role: string;
    balanceInSeconds: string;
  }
  
  interface Session {
    user: {
      id: string;
      email: string;
      role: string;
      balanceInSeconds: string;
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    balanceInSeconds: string;
  }
}

export { NextAuth }; 