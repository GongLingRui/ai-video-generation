import { createOpenAI } from '@ai-sdk/openai'

export function getVolcengineProvider(apiKey?: string) {
  const key = apiKey || process.env.DOUBAO_API_KEY || process.env.VOLCENGINE_API_KEY
  if (!key) throw new Error('DOUBAO_API_KEY not configured')

  return createOpenAI({
    baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
    apiKey: key,
  })
}

export function getDoubaoModel(apiKey?: string, endpointId?: string) {
  const provider = getVolcengineProvider(apiKey)
  const epId = endpointId || process.env.DOUBAO_MODEL_ENDPOINT
  if (!epId) throw new Error('DOUBAO_MODEL_ENDPOINT not configured')
  return provider.chat(epId)
}
