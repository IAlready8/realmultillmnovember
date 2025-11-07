// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'

// Import Prisma adapter if needed
// import { PrismaAdapter } from '@next-auth/prisma-adapter'
// import { prisma } from '@/lib/prisma'

// For now, using a simple credentials provider for demonstration
const handler = NextAuth({
  // adapter: PrismaAdapter(prisma), // Uncomment when Prisma is fully set up
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        // In a real implementation, you would verify credentials against your database
        // For demo purposes, we'll accept any non-empty credentials
        if (credentials?.email && credentials?.password) {
          return {
            id: '1',
            email: credentials.email,
            name: credentials.email.split('@')[0],
            image: null
          }
        }
        return null
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || ''
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || ''
    })
  ],
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error' // Error code passed in query string as ?error=
  },
  callbacks: {
    async session({ session, token, user }) {
      // Add custom session properties here
      // In a real app, you might add user roles, permissions, etc.
      return session
    },
    async jwt({ token, user, account, profile }) {
      // Add custom JWT properties here
      if (user) {
        token.id = user.id
      }
      return token
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt', // Use JWT for session management
    maxAge: 30 * 24 * 60 * 60 // 30 days
  }
})

export { handler as GET, handler as POST }