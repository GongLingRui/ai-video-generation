/**
 * Polls `/api/generate-image/[taskId]` until the image is ready or failed.
 * Shared by single-shot and chain frame generation.
 */
export async function pollImageUntilDone(
  taskId: string,
  options: { interval: number; maxAttempts: number; signal: AbortSignal }
): Promise<string> {
  const arkApiKey = typeof window !== 'undefined' ? localStorage.getItem('ark-api-key') || '' : ''
  const pollHeaders: Record<string, string> = {}
  if (arkApiKey) {
    pollHeaders['x-ark-api-key'] = arkApiKey
  }

  for (let i = 0; i < options.maxAttempts; i++) {
    if (options.signal.aborted) {
      throw new DOMException('Polling aborted', 'AbortError')
    }

    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(resolve, options.interval)
      options.signal.addEventListener(
        'abort',
        () => {
          clearTimeout(timer)
          reject(new DOMException('Polling aborted', 'AbortError'))
        },
        { once: true }
      )
    })

    const res = await fetch(`/api/generate-image/${taskId}`, {
      headers: pollHeaders,
      signal: options.signal,
    })
    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: '查询图片任务失败' }))
      throw new Error(errData.error || '查询图片任务失败')
    }

    const data = await res.json()

    if (data.status === 'succeeded' && data.imageUrl) {
      return data.imageUrl
    }
    if (data.status === 'failed' || data.status === 'expired') {
      throw new Error(data.error || '图片生成失败')
    }
  }
  throw new Error('生成超时，请重试')
}
