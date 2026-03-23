"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Sparkles, User, Mail, Lock, ChevronLeft, Save } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { useUserStore } from "@/stores/user-store"

export default function ProfilePage() {
  const router = useRouter()
  const { user, fetchUser } = useUserStore()
  const [loading, setLoading] = useState(true)
  const [nickname, setNickname] = useState("")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    const checkUser = async () => {
      await fetchUser()
      const currentUser = useUserStore.getState().user
      if (!currentUser) {
        router.push("/login")
        return
      }
      setNickname(currentUser.user_metadata?.nickname || "")
      setLoading(false)
    }
    checkUser()
  }, [fetchUser, router])

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    setMessage(null)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        data: { nickname }
      })
      if (error) {
        setMessage({ type: "error", text: error.message })
      } else {
        setMessage({ type: "success", text: "保存成功" })
        useUserStore.getState().fetchUser()
      }
    } catch {
      setMessage({ type: "error", text: "保存失败，请重试" })
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">加载中…</div>
      </div>
    )
  }

  const nickname_display = user?.user_metadata?.nickname || user?.email?.split('@')[0] || "用户"
  const firstChar = nickname_display.charAt(0).toUpperCase()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass-nav sticky top-0 z-50">
        <div className="container mx-auto flex items-center gap-4 px-6 py-4">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="h-5 w-5" />
            <span className="text-sm">返回首页</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 max-w-xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center text-3xl font-bold text-primary-foreground mx-auto mb-4 shadow-lg">
            {firstChar}
          </div>
          <h1 className="text-2xl font-bold text-foreground">{nickname_display}</h1>
          <p className="text-muted-foreground text-sm mt-1">{user?.email}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="soft-card p-8 space-y-6"
        >
          <div className="flex items-center gap-3 pb-4 border-b border-black/5">
            <User className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold text-foreground">个人信息</h2>
          </div>

          {message && (
            <div className={`rounded-xl px-4 py-3 text-sm ${message.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
              {message.text}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                昵称
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="设置您的昵称"
                className="w-full rounded-xl border border-black/10 bg-white/80 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-200 outline-none focus:border-primary/50 focus:bg-white focus:shadow-[0_0_0_3px_hsl(0_95%_55%/_0.15)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                邮箱
              </label>
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-black/10 bg-black/5 text-muted-foreground text-sm">
                <Mail className="h-4 w-4" />
                {user?.email}
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">邮箱不可更改</p>
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full btn-gradient py-3"
          >
            {saving ? "保存中…" : (
              <>
                <Save className="w-4 h-4 mr-2" />
                保存修改
              </>
            )}
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 soft-card p-6"
        >
          <div className="flex items-center gap-3 pb-4 border-b border-black/5">
            <Lock className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold text-foreground">账号安全</h2>
          </div>
          <Link href="/update-password" className="block mt-4 text-sm text-primary hover:underline">
            修改密码
          </Link>
        </motion.div>
      </main>
    </div>
  )
}
