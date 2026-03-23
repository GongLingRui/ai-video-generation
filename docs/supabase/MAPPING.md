## Supabase/PostgreSQL 表与代码映射（不含社区）

### `public.projects`
- **用途**：我的项目列表 + 创作台自动保存/恢复（核心表）。
- **关键字段**：
  - `id`: 项目 ID
  - `user_id`: 所属用户（RLS 按此隔离）
  - `title`: 项目标题
  - `state jsonb`: 创作台完整快照（画布 nodes/edges + 三阶段结果等）
  - `state_version int`: 与 `state.version` 对齐，便于后续迁移
  - `updated_at`: 用于“最近更新”排序
- **当前代码读写点**：
  - 列表：`src/lib/projects.ts` 的 `listProjects()`
  - 新建：`src/lib/projects.ts` 的 `createProject()`
  - 读取：`src/lib/projects.ts` 的 `getProject()`
  - 更新（自动保存）：`src/lib/projects.ts` 的 `updateProjectState()`
  - UI：
    - 我的项目页：`src/app/projects/page.tsx`
    - 创作台加载/自动保存：`src/app/app/app-client.tsx`

### `public.project_snapshots`
- **用途**：项目快照历史（可用于“手动保存点/里程碑/迁移前备份/崩溃恢复”）。
- **当前代码**：未接入（只提供表结构）。
- **建议用法**：
  - 点击“保存版本/创建里程碑”时写入一条 snapshot
  - 只保留最近 N 条（可在服务端做清理策略）

### `public.generation_tasks`
- **用途**：持久化“生成任务”（图片/视频）请求参数、外部 provider 的 `taskId`、状态流转与错误信息。
- **当前代码**：未接入（目前生成任务主要走 `/api/generate*` 与外部接口轮询）。
- **建议用法**：
  - 在调用 `/api/generate`、`/api/generate-image` 时创建一条 `generation_tasks`
  - 轮询 `/api/generate/[taskId]`、`/api/generate-image/[taskId]` 时更新 `status/result/error`
  - 这样可以在“我的项目”里展示任务历史、失败重试、统计等

### `public.assets`
- **用途**：持久化生成产物（图片/视频）的引用与元数据；同时支持：
  - **Supabase Storage**：`storage_bucket` + `storage_path`
  - **外部 URL**：`external_url`
- **当前代码**：未接入（产物 URL 暂时存在画布快照里）。
- **建议用法**：
  - 生成成功后写入 `assets`，并可关联 `generation_task_id`
  - `metadata` 建议保存：prompt、模型、分辨率、尺寸、帧信息、来源等

### `public.profiles`
- **用途**：用户资料（昵称/头像等）的“数据库化”落地（避免只依赖 `auth.user_metadata`）。
- **当前代码**：未接入（目前昵称写在 Supabase Auth 的 `user_metadata`，见 `src/app/profile/page.tsx`）。
- **建议用法**：
  - 登录后可同步 `user_metadata` 到 `profiles`
  - 或将个人信息页改为写 `profiles`

## 建表执行方式
- 推荐直接执行：`docs/supabase/schema.sql`
- 如果你之前已经执行过 `projects.sql`，也没问题；但以后建议以 `schema.sql` 为准统一维护。

