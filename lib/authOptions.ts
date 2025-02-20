import type { AuthOptions, User } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import prisma from "@/lib/prisma"
import { compare } from "bcrypt"

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials): Promise<User | null> {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password required')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })
        
        if (!user) {
          throw new Error('User doesn\'t exist')
        }

        // Check if user is an admin
        if (!user.isAdmin) {
          throw new Error('Not authorized to access admin panel')
        }

        const isPasswordValid = await compare(credentials.password, user.password)
        if (!isPasswordValid) {
          throw new Error('Invalid password')
        }

        if (!user.emailVerified) {
          throw new Error('Email not verified')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          emailVerified: user.emailVerified,
          isAdmin: user.isAdmin // Include admin status
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60 // 24 hours
  },
  pages: {
    signIn: "/login",
    error: "/login" // Redirect to login page on error
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id
        token.emailVerified = user.emailVerified
        token.isAdmin = user.isAdmin
      }
      return token
    },
    session: async ({ session, token }) => {
      if (session?.user) {
        session.user.id = token.id
        session.user.emailVerified = token.emailVerified
        session.user.isAdmin = token.isAdmin
      }
      return session
    },    
  },
  events: {
    async signIn({ user }) {
      if (!user.isAdmin) {
        throw new Error('Not authorized to access admin panel')
      }
      if (!user.emailVerified) {
        throw new Error('Please verify your email before logging in.')
      }
    }
  },
  secret: process.env.SECRET,
}