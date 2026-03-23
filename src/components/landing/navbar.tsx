"use client"

import { motion } from "framer-motion"
import { Sparkles, Menu, X, User, LogOut } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useUserStore } from "@/stores/user-store"
import { createClient } from "@/lib/supabase/client"
import type { Session } from "@supabase/supabase-js"

const navItems = [
  { label: "首页", href: "/" },
  { label: "创作台", href: "/app" },
  { label: "我的项目", href: "/projects" },
]

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const { user, loading, fetchUser, signOut } = useUserStore()

  useEffect(() => {
    fetchUser()

    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      useUserStore.getState().setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [fetchUser])

  const nickname = user?.user_metadata?.nickname || user?.email?.split('@')[0] || "用户"
  const firstChar = nickname.charAt(0).toUpperCase()

  const handleSignOut = async () => {
    await signOut()
    window.location.href = "/"
  }

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 glass-nav"
    >
      <div className="container mx-auto flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="gradient-primary rounded-xl p-2">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground tracking-tight">Daliu Jimeng</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {!loading && (
            user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-lg font-bold text-primary-foreground shadow-md hover:shadow-lg transition-shadow"
                >
                  {firstChar}
                </button>
                {dropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setDropdownOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute right-0 mt-2 w-48 py-2 bg-white rounded-xl shadow-lg border border-black/10 z-20"
                    >
                      <div className="px-4 py-2 border-b border-black/5">
                        <p className="text-sm font-medium text-foreground truncate">{nickname}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <Link
                        href="/profile"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-black/5 transition-colors"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <User className="w-4 h-4" />
                        个人信息
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        退出登录
                      </button>
                    </motion.div>
                  </>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="btn-gradient px-6 py-2.5 text-sm hidden md:inline-block"
              >
                登录 / 注册
              </Link>
            )
          )}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="md:hidden px-6 pb-4 space-y-3"
        >
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="block text-sm font-medium text-muted-foreground py-2"
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          {user ? (
            <>
              <Link href="/profile" className="block text-sm font-medium text-foreground py-2" onClick={() => setMobileOpen(false)}>
                个人信息
              </Link>
              <button onClick={() => { handleSignOut(); setMobileOpen(false) }} className="block w-full text-left text-sm font-medium text-red-600 py-2">
                退出登录
              </button>
            </>
          ) : (
            <Link href="/login" className="btn-gradient block text-center px-6 py-2.5 text-sm">
              登录 / 注册
            </Link>
          )}
        </motion.div>
      )}
    </motion.nav>
  )
}
