import { createClient } from '@/lib/supabase/client'

export type ProjectRow = {
  id: string
  user_id: string
  title: string
  state: any
  created_at: string
  updated_at: string
}

export async function listProjects(): Promise<ProjectRow[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('updated_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as ProjectRow[]
}

export async function createProject(title: string, state: any): Promise<ProjectRow> {
  const supabase = createClient()
  const { data: auth } = await supabase.auth.getUser()
  const user = auth.user
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      title,
      state,
    })
    .select('*')
    .single()

  if (error) throw error
  return data as ProjectRow
}

export async function getProject(id: string): Promise<ProjectRow | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return (data as ProjectRow) ?? null
}

export async function updateProjectState(id: string, patch: { title?: string; state?: any }): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('projects')
    .update({
      ...(patch.title !== undefined ? { title: patch.title } : {}),
      ...(patch.state !== undefined ? { state: patch.state } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) throw error
}

export async function deleteProject(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)
  if (error) throw error
}

/** 复制项目（标题加「副本」，状态拷贝自源项目） */
export async function duplicateProject(sourceId: string): Promise<ProjectRow> {
  const src = await getProject(sourceId)
  if (!src) throw new Error('Project not found')
  let state = src.state
  if (typeof state === 'string') {
    try {
      state = JSON.parse(state)
    } catch {
      state = {}
    }
  }
  const title = `${src.title}（副本）`
  return createProject(title, state)
}

