import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import crypto from "crypto"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    CredentialsProvider({
      id: "telegram",
      name: "Telegram",
      credentials: {},
      async authorize(credentials) {
        const data = credentials as Record<string, string>
        const { hash, ...rest } = data

        // Verify Telegram hash
        const checkString = Object.keys(rest)
          .sort()
          .map((k) => `${k}=${rest[k]}`)
          .join("\n")

        const secret = crypto
          .createHash("sha256")
          .update(process.env.TELEGRAM_BOT_TOKEN!)
          .digest()

        const hmac = crypto
          .createHmac("sha256", secret)
          .update(checkString)
          .digest("hex")

        if (hmac !== hash) {
          throw new Error("Invalid Telegram authentication")
        }

        // Check auth is not older than 24h
        const authDate = parseInt(rest.auth_date)
        const now = Math.floor(Date.now() / 1000)
        if (now - authDate > 86400) {
          throw new Error("Authentication expired")
        }

        return {
          id: rest.id,
          name: rest.first_name + (rest.last_name ? ` ${rest.last_name}` : ""),
          image: rest.photo_url || null,
          telegramUsername: rest.username || null,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.telegramId = user.id
        token.telegramUsername = (user as any).telegramUsername
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.telegramId as string
      ;(session.user as any).telegramUsername = token.telegramUsername
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
})
