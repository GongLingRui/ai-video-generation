# 技术揭秘：Next.js+火山引擎+Supabase，怎么搭出一个AI视频工作台？

> 项目地址：https://github.com/GongLingRui/ai-video-generation
>
> 从灵感到成片，AI 全程辅助 —— 让每个人都能做导演。

---

前面六篇文章，我 mostly 从用户视角介绍了平台的功能。今天换换口味，从工程师视角拆解一下这个平台的技术架构。

如果你对 AI 应用开发感兴趣，或者正在规划自己的 AI 视频项目，这篇文章应该能给你一些参考。

---

## 整体架构概览

平台采用经典的全栈架构：

```
前端 (Next.js App Router)  ←→  API 路由 (Next.js)  ←→  AI 模型 / 数据库 / 存储
```

所有代码都在一个 Next.js 项目里，前后端同构，部署简单。数据层用 Supabase（PostgreSQL + Auth + Storage），AI 层用火山引擎的 ARK API（豆包对话 + Seedance 视频 + Seedream 图片）。

---

## 前端：Next.js 16 + React 19 + React Flow

### 为什么选 Next.js？

**App Router**：平台有大量需要服务端渲染的页面（项目列表、落地页），同时工作台页面需要复杂的客户端交互。App Router 的 Server Component / Client Component 划分，让两者可以共存。

**API Routes**：所有 AI 相关的接口（聊天、视频生成、图片生成）都封装在 Next.js 的 API Routes 里。前后端共享类型定义，调用链清晰。

**部署友好**：Vercel 一键部署，自带 Edge Network、自动 HTTPS、Serverless 伸缩。对于个人开发者来说，运维成本几乎为零。

### React Flow：画布编辑器的基石

React Flow 是一个专门用于构建节点编辑图的 React 库。平台里的画布、节点、连线、拖拽、缩放，全部是 React Flow 提供的底层能力。

它的设计很精巧：

- **节点自定义**：Config Node 和 Video Node 都是自定义 React 组件，可以包含任意复杂的 UI。
- **状态可控**：节点的位置、选中状态、连接关系，全部存储在 Zustand store 里，和 React Flow 的内部状态双向同步。
- **性能优化**：支持虚拟渲染，即使有几十个节点，画布依然流畅。

### Zustand：轻量状态管理

平台有三个主要的状态库：

- **Canvas Store**：存储画布上的所有节点、边、全局配置（模型选择、比例、时长）。这是最大的 store，也是自动保存的核心数据源。
- **User Store**：管理用户的登录状态、profile 信息。
- **Project Store**：管理项目列表的增删改查。

Zustand 的优势是 API 极简，没有 Provider 嵌套地狱，TypeScript 支持也很好。对于一个中等复杂度的项目，完全够用。

### Tailwind CSS + shadcn/ui：快速搭建高颜值 UI

平台的所有 UI 组件，基础层来自 shadcn/ui（Button、Dialog、Input、Tabs……），业务层在此基础上自定义。

Tailwind CSS v4 的原子化写法，让样式代码非常紧凑。配合 shadcn 的设计系统，即使是个人开发者，也能做出看起来像专业产品的界面。

---

## AI 层：Vercel AI SDK + 火山引擎 ARK API

### Vercel AI SDK

这是整个平台 AI 能力的"胶水层"。它提供了：

- **streamText**：流式输出 AI 的回复，用户不需要等 AI 全部生成完才看到结果。
- **Tool Calling**：AI 可以调用预定义的函数（generateConcept、generatePlanning、generateStoryboard）。这是三阶段分镜生成的技术基础。
- **useChat Hook**：前端直接消费流式响应，一行代码搞定聊天 UI。

### 火山引擎（Volcano Engine）ARK API

平台接入了火山引擎的三类模型：

| 模型 | 用途 | API 封装 |
|------|------|---------|
| 豆包（Doubao）| 对话/分镜生成 | `getDoubaoModel()` 返回 AI SDK 兼容的 provider |
| Seedance 1.5 Pro | 视频生成（T2V/I2V）| `createVideoTask()` + `queryVideoTask()` |
| Seedance 1.0 Pro | 视频生成（R2V 首尾帧）| 同上，模型 ID 切换 |
| Seedream 5.0 | 图片生成 | `createImageTask()` + `queryImageTask()` |

一个有趣的实现细节：视频和图片的生成都是**异步任务**。你先提交一个任务，拿到 taskId，然后轮询查询任务状态，直到完成。

平台封装了一套统一的轮询逻辑，同时支持服务端轮询（API Route 内）和客户端轮询（浏览器端），用户可以根据场景选择。

### 智能模型切换

当用户为镜头同时配置了首帧和尾帧时，平台会自动切换视频模型：

```typescript
const modelId = hasFirstFrame && hasLastFrame
  ? SEEDANCE_1_0_PRO  // 支持 R2V
  : SEEDANCE_1_5_PRO  // 支持 T2V/I2V
```

这个切换对用户完全透明，但背后需要精确理解每个模型的能力边界。

---

## 数据层：Supabase

### PostgreSQL + Row Level Security

平台的所有持久化数据都存在 Supabase 的 PostgreSQL 里：

| 表 | 用途 |
|----|------|
| profiles | 用户信息 |
| projects | 项目数据（含完整的画布状态 JSON）|
| project_snapshots | 项目历史版本 |
| generation_tasks | AI 生成任务记录 |
| assets | 生成的媒体资源 |

**Row Level Security（RLS）**是 Supabase 的核心安全机制。每个表都配置了策略，确保用户只能访问自己的数据。即使 API 被绕过，数据库层面也会拒绝越权访问。

### Supabase Auth

认证系统基于 Supabase Auth，支持：

- 邮箱/密码注册登录
- Google OAuth
- GitHub OAuth

Session 管理通过 `@supabase/ssr` 实现，支持 Next.js App Router 的 Server Component 和 Middleware。

### Supabase Storage

生成的图片和视频，在拿到临时 URL 后，平台会自动下载并上传到 Supabase Storage 的 `project-media` bucket 中。

为什么这么做？因为 AI 模型返回的临时 URL 有过期时间（通常是几小时到几天）。如果不持久化，过几天用户再打开项目，视频就播放不了了。上传到 Supabase Storage 后，链接永久有效，项目数据才是完整的。

---

## 自动保存：防抖 + 增量更新

工作台最怕的就是"做了一小时，页面崩溃，全部丢失"。

平台的自动保存机制：

1. **防抖触发**：画布状态变化后，等待 1.2 秒没有再操作，才触发保存。避免频繁写入。
2. **增量对比**：保存前对比当前状态和上一次的 snapshot，如果没有变化，跳过写入。
3. **乐观更新**：保存请求发出后，UI 不阻塞，用户可以继续操作。
4. **版本快照**：支持手动创建"里程碑"快照，任何时候可以回滚到之前的版本。

---

## 一个技术选型的思考

有人可能会问：为什么不直接用某个 AI 视频工具的 API，而要自己搭这么一套平台？

答案是：**没有任何一个现成的 API 能同时提供"分镜生成 + 视频生成 + 一致性控制"的完整工作流。**

平台的本质，是把多个独立的 AI 能力（大语言模型的分镜生成、视频模型的片段生成、图片模型的参考图生成）**编排**成一个连贯的创作流程。这个编排层，就是平台最大的技术价值。

---

> 项目地址：https://github.com/GongLingRui/ai-video-generation

最后一篇文章，我会带大家一起走一遍完整的实战流程：从打开网站到下载成片，手把手教你用 AI 分镜工作台做一条短片。零基础上手，看完就能动手做。
