'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useShallow } from 'zustand/shallow'
import { LeftPanel } from '@/components/panels/left-panel'
import { CanvasPanel } from '@/components/panels/canvas-panel'
import { RightPanel } from '@/components/panels/right-panel'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { KnowledgeBaseButton } from '@/components/ui/knowledge-base-button'
import { WorkspaceActionsRail } from '@/components/panels/workspace-actions-rail'
import { createClient } from '@/lib/supabase/client'
import { useCanvasStore } from '@/stores/canvas-store'
import { toast } from 'sonner'
import { createProject, getProject, updateProjectState } from '@/lib/projects'
import { buildStoryboardMarkdownExport, downloadTextFile } from '@/lib/export-storyboard'
import { MEDIA_SESSION_RETENTION_NOTICE } from '@/lib/constants'

function createDebounced(fn: () => void, waitMs: number) {
  let t: ReturnType<typeof setTimeout> | null = null
  const debounced = () => {
    if (t) clearTimeout(t)
    t = setTimeout(() => {
      t = null
      fn()
    }, waitMs)
  }
  debounced.flush = () => {
    if (t) {
      clearTimeout(t)
      t = null
      fn()
    }
  }
  return debounced as (() => void) & { flush: () => void }
}

let inFlightAutoCreate: Promise<string> | null = null

function getOrCreateAutoProjectId(snapshot: ReturnType<ReturnType<typeof useCanvasStore.getState>['getPersistableState']>) {
  if (inFlightAutoCreate) {
    return inFlightAutoCreate
  }
  inFlightAutoCreate = createProject(`未命名项目 ${new Date().toLocaleString()}`, snapshot)
    .then((created) => created.id)
    .finally(() => {
      inFlightAutoCreate = null
    })
  return inFlightAutoCreate
}

export function AppClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const projectId = searchParams.get('projectId')

  const hydratePersistedState = useCanvasStore((s) => s.hydratePersistedState)
  const getPersistableState = useCanvasStore((s) => s.getPersistableState)
  const resetCanvas = useCanvasStore((s) => s.resetCanvas)
  const pushStateSnapshot = useCanvasStore((s) => s.pushStateSnapshot)
  const restoreStateSnapshot = useCanvasStore((s) => s.restoreStateSnapshot)
  const stateSnapshots = useCanvasStore((s) => s.stateSnapshots)

  const persistableSlices = useCanvasStore(useShallow((s) => ({
    nodes: s.nodes,
    edges: s.edges,
    nodeCounter: s.nodeCounter,
    globalConfig: s.globalConfig,
    conceptResult: s.conceptResult,
    planningResult: s.planningResult,
    storyboardResult: s.storyboardResult,
    currentStage: s.currentStage,
    stageStatus: s.stageStatus,
    stateSnapshots: s.stateSnapshots,
  })))

  const [loadingProject, setLoadingProject] = useState(false)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const [signOutLoading, setSignOutLoading] = useState(false)
  const saveProjectIdRef = useRef<string | null>(null)
  /** 避免在远端状态 hydrate 完成前自动保存，用空画布覆盖 Supabase（典型竞态：打开项目即空白）。 */
  const allowAutoSaveRef = useRef(false)
  const autoCreateStartedRef = useRef(false)

  const debouncedSave = useMemo(() => {
    return createDebounced(async () => {
      const id = saveProjectIdRef.current
      if (!id) return
      if (!allowAutoSaveRef.current) return
      setSaveState('saving')
      try {
        const snapshot = getPersistableState()
        await updateProjectState(id, { state: snapshot })
        setSaveState('saved')
        setLastSavedAt(new Date().toLocaleTimeString())
      } catch (e) {
        console.error('[AppClient] Auto-save failed:', e)
        setSaveState('error')
      }
    }, 1200)
  }, [getPersistableState])

  // Load project when entering with projectId
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      if (!projectId) {
        saveProjectIdRef.current = null
        allowAutoSaveRef.current = false
        setSaveState('idle')
        setLastSavedAt(null)
        resetCanvas()
        return
      }

      allowAutoSaveRef.current = false
      setLoadingProject(true)
      setSaveState('idle')
      setLastSavedAt(null)
      saveProjectIdRef.current = projectId

      try {
        const p = await getProject(projectId)
        if (cancelled) return
        if (!p) {
          resetCanvas()
          return
        }
        let rawState = p.state
        if (typeof rawState === 'string') {
          try {
            rawState = JSON.parse(rawState)
          } catch {
            rawState = null
          }
        }
        const version = rawState != null && typeof rawState === 'object' ? Number((rawState as { version?: unknown }).version) : NaN
        if (rawState && version === 1) {
          hydratePersistedState(rawState as Parameters<typeof hydratePersistedState>[0])
        } else {
          resetCanvas()
        }
      } catch (e) {
        console.error('[AppClient] Load project failed:', e)
        resetCanvas()
      } finally {
        if (!cancelled) {
          setLoadingProject(false)
          allowAutoSaveRef.current = true
        }
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [projectId, hydratePersistedState, resetCanvas])

  // Canvas changes -> auto save (debounced)
  useEffect(() => {
    if (!projectId) return
    saveProjectIdRef.current = projectId
    debouncedSave()
  }, [projectId, debouncedSave])

  // Trigger saves on state change
  useEffect(() => {
    if (!projectId) return
    debouncedSave()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    projectId,
    persistableSlices.nodes,
    persistableSlices.edges,
    persistableSlices.nodeCounter,
    persistableSlices.globalConfig,
    persistableSlices.conceptResult,
    persistableSlices.planningResult,
    persistableSlices.storyboardResult,
    persistableSlices.currentStage,
    persistableSlices.stageStatus,
    persistableSlices.stateSnapshots,
  ])

  const handleManualSave = () => {
    debouncedSave.flush()
    toast.message('正在保存到云端…')
  }

  const handleExportJson = () => {
    const snap = getPersistableState()
    downloadTextFile(
      `project-${projectId || 'draft'}-${Date.now()}.json`,
      JSON.stringify(snap, null, 2),
      'application/json'
    )
    toast.success('已下载项目 JSON')
  }

  const handleExportMarkdown = () => {
    const s = useCanvasStore.getState()
    const md = buildStoryboardMarkdownExport({
      nodes: s.nodes,
      globalConfig: s.globalConfig,
      title: projectId || '草稿',
    })
    downloadTextFile(`storyboard-${projectId || 'draft'}-${Date.now()}.md`, md, 'text/markdown;charset=utf-8')
    toast.success('已下载分镜 Markdown')
  }

  const handleSnapshot = () => {
    const label = window.prompt('快照名称（可选）', `里程碑 ${new Date().toLocaleString()}`)
    if (label === null) return
    pushStateSnapshot(label)
    toast.success('已创建本地里程碑快照（随项目保存）')
  }

  const handleRestoreSnapshot = (id: string) => {
    if (window.confirm('用该快照覆盖当前画布？未保存的修改将丢失。')) {
      restoreStateSnapshot(id)
      toast.success('已恢复快照')
    }
  }

  const handleSignOut = async () => {
    setSignOutLoading(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/login')
      router.refresh()
    } finally {
      setSignOutLoading(false)
    }
  }

  // Flush pending save when leaving current project context
  useEffect(() => {
    return () => {
      if (projectId) {
        debouncedSave.flush()
      }
    }
  }, [projectId, debouncedSave])

  // Ensure a project exists for sessions entered without projectId
  useEffect(() => {
    if (projectId) {
      autoCreateStartedRef.current = false
      return
    }
    const hasContent = persistableSlices.nodes.length > 0 || persistableSlices.edges.length > 0
    if (!hasContent) return
    if (autoCreateStartedRef.current) return
    autoCreateStartedRef.current = true

    ;(async () => {
      try {
        const snapshot = getPersistableState()
        const createdId = await getOrCreateAutoProjectId(snapshot)
        router.replace(`/app?projectId=${createdId}`)
      } catch (e) {
        console.error('[AppClient] Auto-create project failed:', e)
        autoCreateStartedRef.current = false
      }
    })()
  }, [projectId, persistableSlices.nodes.length, persistableSlices.edges.length, getPersistableState, router])

  return (
    <div className="flex h-screen overflow-hidden relative dot-grid-bg flex-col">
      {/* <div className="fixed left-2 right-2 sm:left-4 sm:right-4 top-12 sm:top-14 z-[99] pointer-events-none">
        <p className="text-[11px] sm:text-xs text-zinc-600/95 leading-relaxed max-w-2xl pr-14 sm:pr-[5.5rem] pointer-events-auto rounded-xl border border-zinc-200/55 bg-white/[0.78] px-3.5 py-2 shadow-[0_8px_32px_-12px_rgba(15,23,42,0.12)] backdrop-blur-md ring-1 ring-white/50">
          {MEDIA_SESSION_RETENTION_NOTICE}
        </p>
      </div> */}

      <WorkspaceActionsRail
        projectId={projectId}
        loadingProject={loadingProject}
        saveState={saveState}
        lastSavedAt={lastSavedAt}
        stateSnapshots={stateSnapshots}
        onManualSave={handleManualSave}
        onSnapshot={handleSnapshot}
        onRestoreSnapshot={handleRestoreSnapshot}
        onExportJson={handleExportJson}
        onExportMarkdown={handleExportMarkdown}
        onSignOut={handleSignOut}
        signOutLoading={signOutLoading}
      />

      <ErrorBoundary fallbackClassName="flex-1">
        <CanvasPanel />
      </ErrorBoundary>
      <ErrorBoundary fallbackClassName="absolute right-5 top-5 bottom-5 w-[360px] z-40">
        <RightPanel />
      </ErrorBoundary>
      <ErrorBoundary fallbackClassName="absolute left-5 top-5 bottom-5 w-64 z-40">
        <LeftPanel />
      </ErrorBoundary>
      <ErrorBoundary fallbackClassName="fixed bottom-6 left-6 z-50">
        <KnowledgeBaseButton />
      </ErrorBoundary>
    </div>
  )
}
