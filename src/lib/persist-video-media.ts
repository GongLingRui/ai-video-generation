import { useCanvasStore } from '@/stores/canvas-store'
import { ingestRemoteUrlToProjectMedia, isPersistedProjectMediaUrl } from '@/lib/project-media'

/** 视频生成完成后，将临时 CDN 地址转存到 Supabase Storage 并写回画布 */
export async function persistVideoResultToProjectStorage(
  configNodeId: string,
  projectId: string | null | undefined,
  result: { videoUrl: string; assembledPrompt?: string; lastFrameUrl?: string }
): Promise<void> {
  if (!projectId?.trim()) return

  const nv =
    result.videoUrl && !isPersistedProjectMediaUrl(result.videoUrl)
      ? await ingestRemoteUrlToProjectMedia(projectId, result.videoUrl, 'video')
      : null
  const nlf =
    result.lastFrameUrl && !isPersistedProjectMediaUrl(result.lastFrameUrl)
      ? await ingestRemoteUrlToProjectMedia(projectId, result.lastFrameUrl, 'image')
      : null

  if (nv || nlf) {
    useCanvasStore.getState().patchVideoNodeMediaUrls(configNodeId, {
      ...(nv ? { videoUrl: nv } : {}),
      ...(nlf ? { lastFrameUrl: nlf } : {}),
    })
  }
}
