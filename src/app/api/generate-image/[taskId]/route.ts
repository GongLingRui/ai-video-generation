import { NextRequest, NextResponse } from 'next/server'
import { queryImageTask } from '@/lib/seedance'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params
    const arkApiKey = request.headers.get('x-ark-api-key') || undefined

    const result = await queryImageTask(taskId, arkApiKey)
    return NextResponse.json(result)
  } catch (error) {
    console.error('[generate-image/[taskId]] Error:', error)
    const message = error instanceof Error ? error.message : '查询失败'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
