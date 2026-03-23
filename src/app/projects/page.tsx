'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Plus, ChevronLeft, FolderOpen, Pencil, Trash2, Check, X, MoreHorizontal, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createProject, listProjects, updateProjectState, deleteProject, duplicateProject } from '@/lib/projects'
import { useCanvasStore } from '@/stores/canvas-store'
import { useUserStore } from '@/stores/user-store'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

type ProjectItem = { id: string; title: string; updated_at: string }

export default function ProjectsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const getPersistableState = useCanvasStore((s) => s.getPersistableState)
  const { user, fetchUser } = useUserStore()

  // 编辑状态
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)

  // 删除对话框状态
  const [deleteDialogId, setDeleteDialogId] = useState<string | null>(null)
  const [deleteDialogTitle, setDeleteDialogTitle] = useState('')
  const [deleting, setDeleting] = useState(false)

  // 更多菜单状态
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      await fetchUser()
      if (!useUserStore.getState().user) {
        router.push('/login')
        return
      }
      const rows = await listProjects()
      setProjects(rows.map((p) => ({ id: p.id, title: p.title, updated_at: p.updated_at })))
      setLoading(false)
    }
    run().catch((e) => {
      console.error('[ProjectsPage] Load failed:', e)
      setLoading(false)
    })
  }, [router, fetchUser])

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const sorted = useMemo(() => {
    return [...projects].sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1))
  }, [projects])

  const handleCreate = async () => {
    setCreating(true)
    try {
      const snapshot = getPersistableState()
      const p = await createProject(`未命名项目 ${new Date().toLocaleString()}`, snapshot)
      router.push(`/app?projectId=${p.id}`)
    } finally {
      setCreating(false)
    }
  }

  // 开始编辑标题
  const handleStartEdit = (project: ProjectItem) => {
    setEditingId(project.id)
    setEditingTitle(project.title)
    setMenuOpenId(null)
  }

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!editingId || !editingTitle.trim()) return
    setSavingId(editingId)
    try {
      await updateProjectState(editingId, { title: editingTitle.trim() })
      setProjects((prev) =>
        prev.map((p) => (p.id === editingId ? { ...p, title: editingTitle.trim() } : p))
      )
      setEditingId(null)
      setEditingTitle('')
    } catch (e) {
      console.error('[ProjectsPage] Update title failed:', e)
    } finally {
      setSavingId(null)
    }
  }

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingTitle('')
  }

  // 打开删除对话框
  const handleOpenDelete = (project: ProjectItem) => {
    setDeleteDialogId(project.id)
    setDeleteDialogTitle(project.title)
    setMenuOpenId(null)
  }

  const handleDuplicate = async (project: ProjectItem) => {
    setMenuOpenId(null)
    setDuplicatingId(project.id)
    try {
      const row = await duplicateProject(project.id)
      router.push(`/app?projectId=${row.id}`)
    } catch (e) {
      console.error('[ProjectsPage] Duplicate failed:', e)
      toast.error(e instanceof Error ? e.message : '复制项目失败')
    } finally {
      setDuplicatingId(null)
    }
  }

  // 确认删除
  const handleConfirmDelete = async () => {
    if (!deleteDialogId) return
    setDeleting(true)
    try {
      await deleteProject(deleteDialogId)
      setProjects((prev) => prev.filter((p) => p.id !== deleteDialogId))
      setDeleteDialogId(null)
      setDeleteDialogTitle('')
    } catch (e) {
      console.error('[ProjectsPage] Delete project failed:', e)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">加载中…</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="glass-nav sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between gap-4 px-6 py-4">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="h-5 w-5" />
            <span className="text-sm">返回首页</span>
          </Link>
          <Button onClick={handleCreate} disabled={creating} className="btn-gradient">
            <Plus className="w-4 h-4 mr-2" />
            {creating ? '创建中…' : '新建项目'}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10 max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">我的项目</h1>
          <p className="text-sm text-muted-foreground mt-1">点击项目即可跳转到创作台并继续创作（自动保存）。</p>
        </motion.div>

        {sorted.length === 0 ? (
          <div className="soft-card p-10 text-center">
            <div className="mx-auto mb-3 w-12 h-12 rounded-2xl bg-black/5 flex items-center justify-center">
              <FolderOpen className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">还没有项目，先创建一个吧。</p>
            <div className="mt-5">
              <Button onClick={handleCreate} disabled={creating} className="btn-gradient">
                <Plus className="w-4 h-4 mr-2" />
                {creating ? '创建中…' : '新建项目'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sorted.map((p) => (
              <div
                key={p.id}
                className="soft-card p-5 hover:shadow-lg transition-shadow group relative"
              >
                {/* 更多操作按钮 */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div ref={menuOpenId === p.id ? menuRef : undefined} className="relative">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setMenuOpenId(menuOpenId === p.id ? null : p.id)
                      }}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                    {menuOpenId === p.id && (
                      <div className="absolute right-0 top-full mt-1 w-40 rounded-lg bg-background border border-border/10 shadow-lg py-1 z-10">
                        <button
                          className="w-full px-3 py-2 text-left text-sm hover:bg-muted/50 flex items-center gap-2"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleStartEdit(p)
                          }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          重命名
                        </button>
                        <button
                          type="button"
                          className="w-full px-3 py-2 text-left text-sm hover:bg-muted/50 flex items-center gap-2 disabled:opacity-50"
                          disabled={duplicatingId === p.id}
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleDuplicate(p)
                          }}
                        >
                          <Copy className="w-3.5 h-3.5" />
                          {duplicatingId === p.id ? '复制中…' : '复制项目'}
                        </button>
                        <button
                          className="w-full px-3 py-2 text-left text-sm hover:bg-muted/50 flex items-center gap-2 text-red-500"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleOpenDelete(p)
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          删除
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <Link href={`/app?projectId=${p.id}`} className="block">
                  <div className="flex items-start justify-between gap-3 pr-6">
                    <div className="min-w-0 flex-1">
                      {editingId === p.id ? (
                        <Input
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit()
                            if (e.key === 'Escape') handleCancelEdit()
                          }}
                          onClick={(e) => e.preventDefault()}
                          autoFocus
                          className="text-sm font-semibold"
                        />
                      ) : (
                        <p className="font-semibold text-foreground truncate">{p.title}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        最近更新：{new Date(p.updated_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </Link>

                {/* 编辑时的保存/取消按钮 */}
                {editingId === p.id && (
                  <div className="flex items-center gap-2 mt-3" onClick={(e) => e.preventDefault()}>
                    <Button
                      size="sm"
                      variant="default"
                      className="h-7 text-xs"
                      onClick={handleSaveEdit}
                      disabled={savingId === p.id}
                    >
                      <Check className="w-3 h-3 mr-1" />
                      保存
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={handleCancelEdit}
                    >
                      <X className="w-3 h-3 mr-1" />
                      取消
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 删除确认对话框 */}
      <Dialog open={!!deleteDialogId} onOpenChange={(open) => !open && setDeleteDialogId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除项目</DialogTitle>
            <DialogDescription>
              确定要删除「{deleteDialogTitle}」吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogId(null)} disabled={deleting}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={deleting}>
              {deleting ? '删除中…' : '删除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
