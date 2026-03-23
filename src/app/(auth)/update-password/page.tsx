'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Lock, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FloatingOrbs } from '@/components/landing/floating-orbs'
import { createClient } from '@/lib/supabase/client'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' as const },
  }),
}

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 6) {
      setError('密码至少 6 位')
      return
    }
    if (password !== confirm) {
      setError('两次输入的密码不一致')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (updateError) {
      if (updateError.message.toLowerCase().includes('auth') || updateError.message.toLowerCase().includes('session')) {
        setError('链接已失效，请重新申请重置邮件')
        return
      }
      setError(updateError.message)
      return
    }

    router.push('/login?message=password_updated')
    router.refresh()
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6">
      <FloatingOrbs />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="soft-card relative z-10 w-full max-w-md p-10"
        style={{ borderRadius: '2rem' }}
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
          设置新密码
        </motion.h1>

        <motion.p
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="mt-2 text-center text-sm text-muted-foreground"
        >
          请输入新密码完成重置
        </motion.p>

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
            <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
            <input
              type="password"
              placeholder="新密码（至少 6 位）"
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
              placeholder="确认新密码"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
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
            {loading ? '保存中…' : '保存新密码'}
          </motion.button>
        </motion.form>

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
