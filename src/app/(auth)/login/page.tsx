"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Sparkles, Mail, Lock } from "lucide-react"
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

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get("next")?.startsWith("/") ? searchParams.get("next")! : "/app"
  const urlError = searchParams.get("error")
  const urlMessage = searchParams.get("message")

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(() => {
    if (urlError === "auth_callback") return "登录验证失败，请重试"
    if (urlError === "missing_code") return "链接无效或已过期"
    if (urlError === "server_config") return "服务端未配置 Supabase"
    return null
  })
  const [info, setInfo] = useState<string | null>(() =>
    urlMessage === "password_updated" ? "密码已更新，请使用新密码登录" : null
  )
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setLoading(true)
    try {
      const supabase = createClient()
      const { error: signError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (signError) {
        setError(signError.message === "Invalid login credentials" ? "邮箱或密码错误" : signError.message)
        setLoading(false)
        return
      }
      router.push(next)
      router.refresh()
    } catch {
      setError("无法连接认证服务，请检查网络或环境变量")
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
          欢迎开启创意之旅
        </motion.h1>

        <motion.p
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="mt-2 text-center text-sm text-muted-foreground"
        >
          输入您的账号密码，开启 AI 视频生成新视界
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
              placeholder="密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-black/10 bg-white/80 px-11 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-200 outline-none focus:border-primary/50 focus:bg-white focus:shadow-[0_0_0_3px_hsl(0_95%_55%/_0.15)]"
              required
              autoComplete="current-password"
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
            {loading ? "登录中…" : "登录"}
          </motion.button>
        </motion.form>

        <motion.div
          custom={5}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="mt-6 flex items-center justify-between text-sm"
        >
          <Link href="/forgot-password" className="text-muted-foreground transition-colors hover:text-foreground">
            忘记密码？
          </Link>
          <Link href="/register" className="font-medium text-primary transition-colors hover:opacity-80">
            立即注册新账号
          </Link>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
          加载中…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
