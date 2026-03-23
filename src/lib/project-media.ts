/**
 * 项目媒体：上传到 Supabase Storage，画布中保存稳定 HTTPS URL。
 */

const BUCKET = 'project-media'

function supabasePublicBase(): string | null {
  const u = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!u) return null
  return u.replace(/\/$/, '')
}

/** 是否已是本项目 Storage 公链（避免重复拉取上传） */
export function isPersistedProjectMediaUrl(url: string): boolean {
  if (!url || url.startsWith('data:') || url.startsWith('blob:')) return false
  try {
    const base = supabasePublicBase()
    if (!base) return false
    const parsed = new URL(url)
    return (
      parsed.href.startsWith(`${base}/storage/v1/object/public/${BUCKET}/`) ||
      parsed.pathname.includes(`/storage/v1/object/public/${BUCKET}/`)
    )
  } catch {
    return false
  }
}

export async function uploadFileToProjectMedia(
  file: File,
  projectId: string
): Promise<{ url: string } | null> {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('projectId', projectId)
  const res = await fetch('/api/project-media/upload', { method: 'POST', body: fd })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || '上传失败')
  }
  return res.json() as Promise<{ url: string }>
}

export type IngestKind = 'image' | 'video'

/** 将外部临时 URL 拉取并写入 Storage，返回公链；失败返回 null（保留原 URL） */
export async function ingestRemoteUrlToProjectMedia(
  projectId: string,
  remoteUrl: string,
  kind: IngestKind = 'image'
): Promise<string | null> {
  if (!projectId?.trim() || !remoteUrl?.trim()) return null
  if (isPersistedProjectMediaUrl(remoteUrl)) return remoteUrl
  if (remoteUrl.startsWith('data:') || remoteUrl.startsWith('blob:')) return null

  const res = await fetch('/api/project-media/ingest-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId, url: remoteUrl, kind }),
  })
  if (!res.ok) {
    console.warn('[project-media] ingest failed', await res.text())
    return null
  }
  const data = (await res.json()) as { url?: string }
  return data.url ?? null
}
