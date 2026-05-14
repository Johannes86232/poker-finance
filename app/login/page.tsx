"use client"

import Image from "next/image"
import { signIn } from "next-auth/react"
import { useEffect } from "react"

export default function LoginPage() {
  useEffect(() => {
    // Telegram widget callback
    ;(window as any).onTelegramAuth = async (user: Record<string, string>) => {
      await signIn("telegram", {
        ...user,
        callbackUrl: "/",
      })
    }

    // Load Telegram widget script
    const script = document.createElement("script")
    script.src = "https://telegram.org/js/telegram-widget.js?22"
    script.setAttribute("data-telegram-login", process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME!)
    script.setAttribute("data-size", "large")
    script.setAttribute("data-onauth", "onTelegramAuth(user)")
    script.setAttribute("data-request-access", "write")
    script.async = true
    document.getElementById("telegram-widget")?.appendChild(script)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-200 p-10 w-full max-w-sm text-center shadow-sm">
        {/* Logo */}
        <Image src="/logo.png" alt="Poker in Asia" width={200} height={60} className="mx-auto mb-5" />

        <p className="text-sm text-gray-500 mb-8">Sign in to view your ledger</p>

        {/* How it works */}
        <div className="bg-gray-50 rounded-xl p-4 text-left mb-8">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            How it works
          </p>
          <div className="space-y-2">
            {[
              "Click the button below",
              "Telegram verifies your identity",
              "You're in — no password needed",
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-blue-400 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <span className="text-sm text-gray-600">{step}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Telegram Widget */}
        <div id="telegram-widget" className="flex justify-center" />

        <p className="text-xs text-gray-400 mt-5">
          Your Telegram account must be linked by an admin before you can access the ledger.
        </p>
      </div>
    </div>
  )
}
