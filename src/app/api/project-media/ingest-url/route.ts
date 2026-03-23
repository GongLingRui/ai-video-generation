import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { randomUUID } from 'crypto'

const MAX_IMAGE_BYTES = 20 * 1024 * 1024
const MAX_VIDEO_BYTES = 120 * 1024 * 1024

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const body = (await request.json()) as {
      projectId?: string
      url?: string
      kind?: 'image' | 'video'
    }

    const projectId = typeof body.projectId === 'string' ? body.projectId.trim() : ''
    const remoteUrl = typeof body.url === 'string' ? body.url.trim() : ''
    const kind = body.kind === 'video' ? 'video' : 'image'

    if (!projectId || !remoteUrl) {
      return NextResponse.json({ error: '缺少 projectId 或 url' }, { status: 400 })
    }

    let parsed: URL
    try {
      parsed = new URL(remoteUrl)
    } catch {
      return NextResponse.json({ error: '无效 URL' }, { status: 400 })
    }

    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return NextResponse.json({ error: '仅支持 http(s) 链接' }, { status: 400 })
    }

    const { data: project, error: pErr } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (pErr || !project) {
      return NextResponse.json({ error: '项目不存在或无权访问' }, { status: 403 })
    }

    const maxBytes = kind === 'video' ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES

    const fetched = await fetch(remoteUrl, {
      redirect: 'follow',
      headers: { 'User-Agent': 'AI-Video-ProjectMediaIngest/1.0' },
    })

    if (!fetched.ok) {
      return NextResponse.json({ error: `无法下载资源（HTTP ${fetched.status}）` }, { status: 502 })
    }

    const lenHeader = fetched.headers.get('content-length')
    if (lenHeader) {
      const n = Number(lenHeader)
      if (Number.isFinite(n) && n > maxBytes) {
        return NextResponse.json({ error: '远程文件过大' }, { status: 400 })
      }
    }

    const buf = Buffer.from(await fetched.arrayBuffer())
    if (buf.length > maxBytes) {
      return NextResponse.json({ error: '文件过大' }, { status: 400 })
    }

    const mime =
      fetched.headers.get('content-type')?.split(';')[0]?.trim() ||
      (kind === 'video' ? 'video/mp4' : 'image/jpeg')

    if (kind === 'image' && !mime.startsWith('image/')) {
      return NextResponse.json({ error: 'URL 内容不是图片' }, { status: 400 })
    }
    if (kind === 'video' && !mime.startsWith('video/')) {
      return NextResponse.json({ error: 'URL 内容不是视频' }, { status: 400 })
    }

    const ext =
      mime.includes('png') ? 'png'
      : mime.includes('webp') ? 'webp'
      : mime.includes('gif') ? 'gif'
      : mime.includes('webm') ? 'webm'
      : mime.includes('mp4') ? 'mp4'
      : kind === 'video' ? 'mp4' : 'jpg'

    const path = `${user.id}/${project.id}/${randomUUID()}.${ext}`

    const { error: upErr } = await supabase.storage.from('project-media').upload(path, buf, {
      contentType: mime,
      upsert: false,
    })

    if (upErr) {
      console.error('[project-media/ingest-url]', upErr)
      return NextResponse.json({ error: upErr.message || '存储上传失败' }, { status: 500 })
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('project-media').getPublicUrl(path)

    return NextResponse.json({ url: publicUrl })
  } catch (e) {
    console.error('[project-media/ingest-url]', e)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
