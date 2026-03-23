import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function downloadVideo(url: string, filename?: string): Promise<boolean> {
  try {
    // Try fetch first with CORS mode
    const response = await fetch(url, {
      mode: 'cors',
      credentials: 'omit',
    })

    if (response.ok) {
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = blobUrl
      link.download = filename || `video-${Date.now()}.mp4`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      URL.revokeObjectURL(blobUrl)
      return true
    }

    throw new Error('下载视频失败')
  } catch (error) {
    // Fallback: open URL in new tab for download
    // This works for most video URLs from CDNs that can't be fetched as blob due to CORS
    // User can right-click -> Save Video As in the new tab
    window.open(url, '_blank', 'noopener,noreferrer')
    return false
  }
}
