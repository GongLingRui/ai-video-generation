"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Sparkles, Mail, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { FloatingOrbs } from "@/components/landing/floating-orbs"
import { createClient } from "@/lib/supabase/client"

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const supabase = createClient()
      const origin = typeof window !== "undefined" ? window.location.origin : ""
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${origin}/auth/callback?next=/update-password`,
      })
      if (resetError) {
        setError(resetError.message)
        setLoading(false)
        return
      }
      setSent(true)
    } catch {
      setError("发送失败，请检查网络或 Supabase 配置")
    }
    setLoading(false)
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6">
      <FloatingOrbs />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="soft-card relative z-10 w-full max-w-md p-10"
        style={{ borderRadius: "2rem" }}
      >
        <motion.div
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary"
        >
          <Sparkles className="h-7 w-7 text-primary-foreground" />
        </motion.div>

        <motion.h1
          custom={1}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="text-center text-2xl font-bold text-foreground"
        >
          重置密码
        </motion.h1>

        <motion.p
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="mt-2 text-center text-sm text-muted-foreground"
        >
          {sent ? "若该邮箱已注册，您将收到重置邮件" : "输入您的注册邮箱，我们将发送重置链接"}
        </motion.p>

        {sent ? (
          <motion.div
            custom={3}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mt-8 space-y-4"
          >
            <div className="rounded-2xl bg-green-50 p-6 text-center text-sm text-green-800">
              邮件已发送。请打开邮箱中的链接，在本站设置新密码。若未收到，请检查垃圾箱或稍后再试。
            </div>
            <motion.button
              type="button"
              custom={4}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              onClick={() => {
                setSent(false)
                setEmail("")
              }}
              className="btn-gradient mt-4 w-full py-4 text-base"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              重新发送
            </motion.button>
          </motion.div>
        ) : (
          <motion.form
            custom={3}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            onSubmit={handleSubmit}
            className="mt-8 space-y-4"
          >
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {error}
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
              <input
                type="email"
                placeholder="邮箱地址"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-black/10 bg-white/80 px-11 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-200 outline-none focus:border-primary/50 focus:bg-white focus:shadow-[0_0_0_3px_hsl(0_95%_55%/_0.15)]"
                required
                autoComplete="email"
              />
            </div>

            <motion.button
              type="submit"
              custom={4}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              disabled={loading}
              className="btn-gradient mt-4 w-full py-4 text-base disabled:opacity-60"
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.97 }}
            >
              {loading ? "发送中…" : "发送重置链接"}
            </motion.button>
          </motion.form>
        )}

        <motion.div
          custom={5}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="mt-6 text-center"
        >
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            返回登录
          </Link>
        </motion.div>
      </motion.div>
    </div>
  )
}
