// types/next-auth.d.ts
import 'next-auth'
import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      isAdmin: boolean
      emailVerified: Date | null
    } & DefaultSession['user']
  }

  interface User {
    isAdmin: boolean
    emailVerified: Date | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    isAdmin: boolean
    emailVerified: Date | null
  }
}