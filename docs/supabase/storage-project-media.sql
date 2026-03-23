-- Supabase Storage：项目内图片/视频持久化（需在 Dashboard → Storage 中创建同名 bucket，或执行下方 insert）
--
-- 1) 在 Supabase SQL 编辑器执行本文件
-- 2) 若 bucket 已存在可跳过 insert into storage.buckets
--
-- Bucket：公开读，便于 <img>/<video> 直接使用稳定 URL；写权限仅限本人路径 {auth.uid()}/...

insert into storage.buckets (id, name, public)
values ('project-media', 'project-media', true)
on conflict (id) do update set public = excluded.public;

-- 读：公开（URL 中含随机 UUID，不易枚举）
drop policy if exists "project_media_public_read" on storage.objects;
create policy "project_media_public_read"
on storage.objects for select
to public
using (bucket_id = 'project-media');

-- 写：仅本人根目录
drop policy if exists "project_media_insert_own" on storage.objects;
create policy "project_media_insert_own"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'project-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "project_media_update_own" on storage.objects;
create policy "project_media_update_own"
on storage.objects for update
to authenticated
using (
  bucket_id = 'project-media'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'project-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "project_media_delete_own" on storage.objects;
create policy "project_media_delete_own"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'project-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);
