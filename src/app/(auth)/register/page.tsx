"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Sparkles, Mail, Lock, User } from "lucide-react"
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

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)

    if (password.length < 6) {
      setError("密码至少 6 位")
      return
    }
    if (password !== confirmPassword) {
      setError("两次输入的密码不一致")
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const origin = typeof window !== "undefined" ? window.location.origin : ""
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${origin}/auth/callback?next=/app`,
          data: {
            full_name: name.trim() || undefined,
          },
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        setLoading(false)
        return
      }

      if (data.session) {
        router.push("/app")
        router.refresh()
        return
      }

      setInfo("我们已向您的邮箱发送确认链接，请点击邮件中的链接完成注册后再登录。")
      setLoading(false)
    } catch {
      setError("注册失败，请检查网络或 Supabase 配置")
      setLoading(false)
    }
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
          创建您的账号
        </motion.h1>

        <motion.p
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="mt-2 text-center text-sm text-muted-foreground"
        >
          注册即可免费体验 AI 视频生成
        </motion.p>

        <motion.form
          custom={3}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          onSubmit={handleSubmit}
          className="mt-8 space-y-4"
        >
          {info && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {info}
            </div>
          )}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="relative">
            <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
            <input
              type="text"
              placeholder="您的昵称（可选）"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-black/10 bg-white/80 px-11 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-200 outline-none focus:border-primary/50 focus:bg-white focus:shadow-[0_0_0_3px_hsl(0_95%_55%/_0.15)]"
              autoComplete="name"
            />
          </div>

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

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
            <input
              type="password"
              placeholder="设置密码（至少 6 位）"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-black/10 bg-white/80 px-11 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-200 outline-none focus:border-primary/50 focus:bg-white focus:shadow-[0_0_0_3px_hsl(0_95%_55%/_0.15)]"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
            <input
              type="password"
              placeholder="确认密码"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl border border-black/10 bg-white/80 px-11 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-200 outline-none focus:border-primary/50 focus:bg-white focus:shadow-[0_0_0_3px_hsl(0_95%_55%/_0.15)]"
              required
              minLength={6}
              autoComplete="new-password"
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
            {loading ? "提交中…" : "注册"}
          </motion.button>
        </motion.form>

        <motion.div
          custom={5}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="mt-6 text-center text-sm"
        >
          <span className="text-muted-foreground">已有账号？</span>{" "}
          <Link href="/login" className="font-medium text-primary transition-colors hover:opacity-80">
            立即登录
          </Link>
        </motion.div>
      </motion.div>
    </div>
  )
}
