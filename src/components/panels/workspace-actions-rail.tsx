'use client'

import Link from 'next/link'
import { FileJson, FileText, FolderKanban, LayoutGrid, LogOut, Save, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ProjectCanvasSnapshot } from '@/stores/canvas-store'

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

export type WorkspaceActionsRailProps = {
  projectId: string | null
  loadingProject: boolean
  saveState: SaveState
  lastSavedAt: string | null
  stateSnapshots: ProjectCanvasSnapshot[]
  onManualSave: () => void
  onSnapshot: () => void
  onRestoreSnapshot: (id: string) => void
  onExportJson: () => void
  onExportMarkdown: () => void
  onSignOut: () => void
  signOutLoading: boolean
}

function StatusLine({
  loadingProject,
  saveState,
  lastSavedAt,
  projectId,
}: Pick<WorkspaceActionsRailProps, 'loadingProject' | 'saveState' | 'lastSavedAt' | 'projectId'>) {
  if (loadingProject) {
    return <span className="text-zinc-500">加载项目…</span>
  }
  if (saveState === 'saving') {
    return <span className="text-amber-700/90">保存中…</span>
  }
  if (saveState === 'saved') {
    return (
      <span className="text-emerald-800/90">
        已保存{lastSavedAt ? ` · ${lastSavedAt}` : ''}
      </span>
    )
  }
  if (saveState === 'error') {
    return <span className="text-red-700/90">保存失败（将自动重试）</span>
  }
  return <span className="text-zinc-600">{projectId ? '项目已连接' : '未连接项目'}</span>
}

export function WorkspaceActionsRail({
  projectId,
  loadingProject,
  saveState,
  lastSavedAt,
  stateSnapshots,
  onManualSave,
  onSnapshot,
  onRestoreSnapshot,
  onExportJson,
  onExportMarkdown,
  onSignOut,
  signOutLoading,
}: WorkspaceActionsRailProps) {
  return (
    <div
      className={cn(
        'group fixed right-3 sm:right-4 z-[100] flex flex-row-reverse items-start gap-0',
        'top-12 sm:top-14'
      )}
    >
      {/* 触发按钮：始终在视口右侧 */}
      <button
        type="button"
        className={cn(
          'relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full',
          'border border-zinc-200/90 bg-white/95 text-zinc-700 shadow-[0_4px_24px_-4px_rgba(15,23,42,0.18),0_0_0_1px_rgba(255,255,255,0.8)_inset]',
          'backdrop-blur-md transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          'hover:scale-[1.03] hover:border-zinc-300/90 hover:shadow-[0_12px_40px_-8px_rgba(15,23,42,0.22)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(0_90%_50%)]/35 focus-visible:ring-offset-2',
          'group-hover:border-[hsl(0_85%_55%)]/35 group-hover:text-[hsl(0_72%_38%)] group-hover:shadow-[0_12px_36px_-6px_rgba(220,38,38,0.18)]',
          'group-focus-within:border-[hsl(0_85%_55%)]/35 group-focus-within:text-[hsl(0_72%_38%)] group-focus-within:shadow-[0_12px_36px_-6px_rgba(220,38,38,0.18)]'
        )}
        aria-haspopup="true"
        aria-label="打开项目、导出与账户菜单"
        title="项目、导出与账户"
      >
        <LayoutGrid className="size-[1.15rem]" strokeWidth={2} />
      </button>

      {/* 展开面板：与按钮相邻，整块区域保持 hover，避免移入时折叠 */}
      <div
        className={cn(
          'mr-2 max-h-0 max-w-0 overflow-hidden opacity-0 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          'group-hover:max-h-[min(90vh,36rem)] group-hover:max-w-[min(20rem,calc(100vw-4.5rem))] group-hover:opacity-100',
          'group-focus-within:max-h-[min(90vh,36rem)] group-focus-within:max-w-[min(20rem,calc(100vw-4.5rem))] group-focus-within:opacity-100',
          'pointer-events-none group-hover:pointer-events-auto group-focus-within:pointer-events-auto'
        )}
      >
        <div
          className={cn(
            'w-[min(20rem,calc(100vw-4.5rem))] rounded-2xl border border-zinc-200/70',
            'bg-white/[0.92] shadow-[0_24px_64px_-16px_rgba(15,23,42,0.2),0_0_0_1px_rgba(255,255,255,0.65)_inset]',
            'backdrop-blur-xl backdrop-saturate-150',
            'p-2.5 flex flex-col gap-2.5'
          )}
        >
          <div
            className="rounded-xl bg-zinc-50/90 px-3 py-2 text-[11px] leading-snug text-zinc-600 border border-zinc-100/90"
            role="status"
          >
            <StatusLine
              loadingProject={loadingProject}
              saveState={saveState}
              lastSavedAt={lastSavedAt}
              projectId={projectId}
            />
          </div>

          {projectId && (
            <div className="flex flex-col gap-1">
              <p className="px-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                项目
              </p>
              <Link href="/projects" className="block w-full">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 w-full justify-start gap-2 border-zinc-200/90 bg-white/80 text-xs font-medium text-zinc-800 shadow-sm hover:bg-white"
                >
                  <FolderKanban className="size-3.5 text-zinc-500" />
                  我的项目
                </Button>
              </Link>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 w-full justify-start gap-2 border-zinc-200/90 bg-white/80 text-xs font-medium text-zinc-800 shadow-sm hover:bg-white"
                onClick={onManualSave}
              >
                <Save className="size-3.5 text-zinc-500" />
                立即保存
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 w-full justify-start gap-2 border-zinc-200/90 bg-white/80 text-xs font-medium text-zinc-800 shadow-sm hover:bg-white"
                onClick={onSnapshot}
              >
                <Sparkles className="size-3.5 text-zinc-500" />
                里程碑快照
              </Button>
              {stateSnapshots.length > 0 && (
                <select
                  className="h-9 w-full rounded-lg border border-zinc-200/90 bg-white/90 px-2.5 text-xs text-zinc-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-[hsl(0_90%_50%)]/25"
                  defaultValue=""
                  aria-label="恢复快照"
                  onChange={(e) => {
                    const id = e.target.value
                    if (!id) return
                    onRestoreSnapshot(id)
                    e.target.value = ''
                  }}
                >
                  <option value="">恢复快照…</option>
                  {stateSnapshots.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div className="flex flex-col gap-1">
            <p className="px-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">导出</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 w-full justify-start gap-2 border-zinc-200/90 bg-white/80 text-xs font-medium text-zinc-800 shadow-sm hover:bg-white"
              onClick={onExportJson}
            >
              <FileJson className="size-3.5 text-zinc-500" />
              导出 JSON
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 w-full justify-start gap-2 border-zinc-200/90 bg-white/80 text-xs font-medium text-zinc-800 shadow-sm hover:bg-white"
              onClick={onExportMarkdown}
            >
              <FileText className="size-3.5 text-zinc-500" />
              导出分镜 MD
            </Button>
          </div>

          <div className="border-t border-zinc-100 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={signOutLoading}
              className="h-9 w-full justify-start gap-2 border-zinc-200/90 bg-white/80 text-xs font-medium text-zinc-800 shadow-sm hover:bg-red-50/80 hover:border-red-200/80 hover:text-red-900"
              onClick={onSignOut}
            >
              <LogOut className="size-3.5 text-zinc-500" />
              {signOutLoading ? '退出中…' : '退出登录'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
