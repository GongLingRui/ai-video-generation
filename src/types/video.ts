export type GenerateVideoRequest = {
  prompt: string
  ratio: string
  duration: number
  firstFrameUrl?: string
}

export type GenerateVideoResponse = {
  taskId: string
}

export type VideoTaskStatus = {
  status: 'queued' | 'running' | 'succeeded' | 'failed'
  videoUrl?: string
  lastFrameUrl?: string
  error?: string
}
