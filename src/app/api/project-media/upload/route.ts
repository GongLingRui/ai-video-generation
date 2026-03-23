import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { randomUUID } from 'crypto'

const MAX_BYTES = 120 * 1024 * 1024 // 120MB 上限（含较大视频）

const ALLOWED_PREFIX = ['image/', 'video/']

function extFromMime(mime: string): string {
  if (mime === 'image/jpeg' || mime === 'image/jpg') return 'jpg'
  if (mime === 'image/png') return 'png'
  if (mime === 'image/webp') return 'webp'
  if (mime === 'image/gif') return 'gif'
  if (mime === 'video/mp4') return 'mp4'
  if (mime === 'video/webm') return 'webm'
  return 'bin'
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file')
    const projectId = formData.get('projectId')

    if (!(file instanceof File) || typeof projectId !== 'string' || !projectId.trim()) {
      return NextResponse.json({ error: '缺少 file 或 projectId' }, { status: 400 })
    }

    const { data: project, error: pErr } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId.trim())
      .eq('user_id', user.id)
      .maybeSingle()

    if (pErr || !project) {
      return NextResponse.json({ error: '项目不存在或无权访问' }, { status: 403 })
    }

    const mime = file.type || 'application/octet-stream'
    if (!ALLOWED_PREFIX.some((p) => mime.startsWith(p))) {
      return NextResponse.json({ error: '仅支持图片或视频文件' }, { status: 400 })
    }

    const buf = Buffer.from(await file.arrayBuffer())
    if (buf.length > MAX_BYTES) {
      return NextResponse.json({ error: `文件过大（>${Math.floor(MAX_BYTES / 1024 / 1024)}MB）` }, { status: 400 })
    }

    const ext = extFromMime(mime)
    const path = `${user.id}/${project.id}/${randomUUID()}.${ext}`

    const { error: upErr } = await supabase.storage.from('project-media').upload(path, buf, {
      contentType: mime,
      upsert: false,
    })

    if (upErr) {
      console.error('[project-media/upload]', upErr)
      return NextResponse.json({ error: upErr.message || '存储上传失败' }, { status: 500 })
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('project-media').getPublicUrl(path)

    return NextResponse.json({ url: publicUrl })
  } catch (e) {
    console.error('[project-media/upload]', e)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
