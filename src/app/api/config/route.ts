import { NextResponse } from 'next/server'

/** 仅返回是否已配置，绝不返回密钥明文。 */
export async function GET() {
  const configured = Boolean(
    (process.env.VOLCENGINE_API_KEY || process.env.DOUBAO_API_KEY)?.trim()
  )

  if (!configured) {
    return NextResponse.json(
      { configured: false, error: 'API Key not found in environment variables' },
      { status: 503 }
    )
  }

  return NextResponse.json({
    configured: true,
    message: 'Server API key is configured',
  })
}
