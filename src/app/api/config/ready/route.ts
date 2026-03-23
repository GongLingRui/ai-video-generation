import { NextResponse } from 'next/server'

/**
 * 不返回任何密钥，仅告知服务端是否配置了各能力所需环境变量。
 */
export async function GET() {
  const serverVideoKey = Boolean(process.env.VOLCENGINE_API_KEY?.trim())
  const serverChatKey = Boolean(
    (process.env.DOUBAO_API_KEY || process.env.VOLCENGINE_API_KEY)?.trim() &&
      process.env.DOUBAO_MODEL_ENDPOINT?.trim()
  )

  return NextResponse.json({
    serverVideoKey,
    serverChatKey,
    browserOverrideKey: false,
  })
}
