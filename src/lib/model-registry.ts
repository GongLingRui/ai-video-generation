import { SEEDANCE_MODEL, SEEDANCE_LITE_MODEL, IMAGE_MODEL } from '@/lib/constants'

export type VideoModelKey = 'seedance15Pro' | 'seedance10Pro'
export type ImageModelKey = 'seedream50'
export type ChatModelKey = 'doubaoChatDefault'

export type ModelOption<K extends string> = {
  key: K
  label: string
  description?: string
}

export const VIDEO_MODEL_OPTIONS: readonly ModelOption<VideoModelKey>[] = [
  {
    key: 'seedance15Pro',
    label: 'Seedance 1.5 Pro',
    description: '默认视频模型（不支持首尾帧模式）',
  },
  {
    key: 'seedance10Pro',
    label: 'Seedance 1.0 Pro',
    description: '支持首尾帧生视频（r2v 模式）',
  },
] as const

export const IMAGE_MODEL_OPTIONS: readonly ModelOption<ImageModelKey>[] = [
  {
    key: 'seedream50',
    label: 'Seedream 5.0',
    description: '默认图片模型（当前项目默认）',
  },
] as const

export const CHAT_MODEL_OPTIONS: readonly ModelOption<ChatModelKey>[] = [
  {
    key: 'doubaoChatDefault',
    label: 'Doubao (Default Endpoint)',
    description: '使用 DOUBAO_MODEL_ENDPOINT 指定的默认端点',
  },
] as const

export function getDefaultVideoModelKey(): VideoModelKey {
  return 'seedance15Pro'
}

export function getDefaultImageModelKey(): ImageModelKey {
  return 'seedream50'
}

export function getDefaultChatModelKey(): ChatModelKey {
  return 'doubaoChatDefault'
}

export function resolveVideoModelId(key: VideoModelKey): string {
  switch (key) {
    case 'seedance15Pro':
      return SEEDANCE_MODEL
    case 'seedance10Pro':
      return SEEDANCE_LITE_MODEL
  }
}

export function resolveImageModelId(key: ImageModelKey): string {
  switch (key) {
    case 'seedream50':
      return IMAGE_MODEL
  }
}

export function resolveChatEndpointId(key: ChatModelKey): string | undefined {
  switch (key) {
    case 'doubaoChatDefault':
      return process.env.DOUBAO_MODEL_ENDPOINT
  }
}

export function isVideoModelKey(value: unknown): value is VideoModelKey {
  return typeof value === 'string' && VIDEO_MODEL_OPTIONS.some((o) => o.key === value)
}

export function isImageModelKey(value: unknown): value is ImageModelKey {
  return typeof value === 'string' && IMAGE_MODEL_OPTIONS.some((o) => o.key === value)
}

export function isChatModelKey(value: unknown): value is ChatModelKey {
  return typeof value === 'string' && CHAT_MODEL_OPTIONS.some((o) => o.key === value)
}

