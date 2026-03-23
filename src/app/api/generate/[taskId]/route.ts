import { NextResponse } from 'next/server'
import { queryVideoTask } from '@/lib/seedance'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const apiKey = request.headers.get('x-ark-api-key') || undefined
    const { taskId } = await params
    const result = await queryVideoTask(taskId, apiKey)
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
