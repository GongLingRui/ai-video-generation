'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import type { ImageGenMode } from '@/types'
import { pollImageUntilDone } from '@/lib/poll-image-task'

export function useImageGeneration(nodeId: string) {
  const [status, setStatus] = useState<'idle' | 'generating' | 'selecting' | 'done'>('idle')
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  const generate = useCallback(
    async (mode: ImageGenMode, prompt: string): Promise<string> => {
      abortControllerRef.current?.abort()
      const controller = new AbortController()
      abortControllerRef.current = controller

      setStatus('generating')

      try {
        const arkApiKey = typeof window !== 'undefined' ? localStorage.getItem('ark-api-key') || '' : ''
        const customHeaders: Record<string, string> = {
          'Content-Type': 'application/json',
        }
        if (arkApiKey) {
          customHeaders['x-ark-api-key'] = arkApiKey
        }

        const res = await fetch('/api/generate-image', {
          method: 'POST',
          headers: customHeaders,
          body: JSON.stringify({ mode, prompt }),
          signal: controller.signal,
        })

        if (!res.ok) {
          const errData = await res.json()
          throw new Error(errData.error || '创建图片任务失败')
        }

        const data = await res.json()

        // Handle direct URL response (no polling needed)
        if (data.imageUrl) {
          console.log('[useImageGeneration] Got direct image URL:', data.imageUrl)
          setStatus('selecting')
          return data.imageUrl
        }

        // Handle task ID response (polling required)
        if (data.taskId) {
          console.log('[useImageGeneration] Got task ID, polling...')
          const imageUrl = await pollImageUntilDone(data.taskId, {
            interval: 2000,
            maxAttempts: 60,
            signal: controller.signal,
          })
          setStatus('selecting')
          return imageUrl
        }

        throw new Error('API response did not contain imageUrl or taskId')
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          throw error
        }
        const message = error instanceof Error ? error.message : '未知错误'
        setStatus('idle')
        toast.error(message)
        throw error
      }
    },
    [nodeId]
  )

  return { status, generate }
}
