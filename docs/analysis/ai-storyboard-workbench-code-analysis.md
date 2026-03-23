# AI 分镜视频生成工作台 — 代码实现与缺口分析

> 基于仓库当前代码、`docs/plans/2026-03-23-daliu-jimeng-implementation.md` 与 `docs/FEATURE_DESIGN.md` 对照整理。  
> 分析日期参考：2026-03。

---

## 1. 产品目标（对照文档）

**目标**：单页三栏工作台 — 左栏运镜技巧、中栏 React Flow 画布（配置节点 + 视频节点）、右栏 AI 对话与结构化分镜（Generative UI），后端通过 Next.js API Routes 代理火山方舟（豆包对话 + Seedream 图像 + Seedance 视频）。

**技术栈（实际 `package.json`）**：Next.js **16.2**、React **19**、TypeScript、Tailwind v4、@xyflow/react、Zustand、Vercel AI SDK（`ai` + `@ai-sdk/react`）、Zod、Framer Motion。实现计划文中写的是 Next 15，以仓库为准。

---

## 2. 架构快照

### 2.1 路由与页面

| 路径 | 作用 |
|------|------|
| `/` | 落地页（`(landing)/page.tsx`：Navbar + Hero） |
| `/app` | 创作台主界面：画布 + 左/右面板 + 知识库入口 |
| `/login`、`/register`、`/forgot-password` | 认证相关 UI（见 §4.2） |
| `/api/chat` | 流式对话 + Tool 调用（分镜生成等） |
| `/api/generate`、`/api/generate/[taskId]` | Seedance 视频任务创建与轮询 |
| `/api/generate-image`、`/api/generate-image/[taskId]` | 图像任务 |
| `/api/generate-frame` | 分镜首尾帧等单帧生成 |
| `/api/generate-multi-frame` | 多帧相关 |
| `/api/enhance-prompt`、`/api/generate-dialogue-summary` | 文案增强与对白摘要 |
| `/api/config` | 服务端配置探测（如 Key 是否配置） |

全局 `layout.tsx` 挂载 `ReactFlowProvider`、`ThemeProvider`、`Sonner`。

### 2.2 状态管理

- **`canvas-store.ts`**：节点/边、全局比例与参考帧模式、选中节点、自动布局、视频历史切换、链式首尾帧与多图等核心逻辑（体量最大）。
- **`technique-store.ts`**：运镜分类与技巧列表。
- **`app-shell-store.ts`**：左/右栏折叠、知识库弹层等壳层 UI 状态；**`AppShellBar` 组件已存在，但 `src/app/app/page.tsx` 当前未渲染该顶栏**，若仅用侧栏 Tab 折叠，体验依赖左/右面板内部实现是否完整。

### 2.3 核心库文件

- **`src/lib/seedance.ts`**：`buildPrompt`、创建/查询视频任务、与模型常量配合。
- **`src/lib/constants.ts`**：运镜数据、`STORYBOARD_SYSTEM_PROMPT`、八要素检查等。
- **`src/lib/volcengine.ts`**：豆包模型封装（对话侧）。

---

## 3. 已具备的能力（按功能域）

### 3.1 画布与节点（F2 大部分）

- 自定义 **ConfigNode** / **VideoNode**，边连接、双击空白添加配置节点、删除/多选、自动布局相关逻辑在 store 中较完整。
- **VideoNode** 支持生成状态、播放器、**`history` 与版本切换**（store 内 `switchVideoVersion` 等与 `FEATURE_DESIGN` F4「生成历史」方向一致）。
- **首尾帧 / 多帧参考**、与上一镜头尾帧衔接等业务在 `use-video-generation` 与 store 中有实现。

### 3.2 运镜技巧（F1）

- 左栏分类 + Chip + Tooltip + 应用到选中配置节点；与 `TECHNIQUE_CATEGORIES` 一致。
- 与计划差异：交互可能是 **悬停展开** 而非严格的「Collapsible 默认全部展开」— 属体验细节，功能覆盖。

### 3.3 AI 分镜对话（F3 核心路径）

- `POST /api/chat`：`streamText` + **Zod tool**（如 `generateStoryboard`），对接豆包（`DOUBAO_API_KEY` / `VOLCENGINE_API_KEY` + `DOUBAO_MODEL_ENDPOINT`）。
- 右栏 `useChat` + **`StoryboardTabs` / Storyboard 卡片**：加入画布、全部加入、已加入状态等 Generative UI 主流程已打通。

### 3.4 视频生成（F4 主路径）

- `POST /api/generate` 使用 `buildPrompt` + `createVideoTask`；客户端 **`use-video-generation`** 内 **3s 间隔、最多 60 次** 轮询，与文档描述一致。
- 支持请求头 **`x-ark-api-key`** 覆盖服务端 Key（与 localStorage 配合，见 §5）。

### 3.5 图像与链式首尾帧

- `use-image-generation`、`use-chain-generation` 与 `/api/generate-frame` 等串联画布上的首/尾帧与链式生成按钮（画布底部「链式首尾帧生成」）。

### 3.6 其他

- **知识库** Dialog（`knowledge-base-button.tsx` + `knowledge-base.ts`）。
- **落地页 + 认证页** 视觉与动效（与真实鉴权无关，见下节）。

---

## 4. 未完成、不完整或与规格不符的部分

### 4.1 功能规格（`FEATURE_DESIGN.md`）逐项缺口

| 编号 | 内容 | 现状 |
|------|------|------|
| **F3** | 对话修改某一镜后，**画布节点与对话结果同步** | 需个案验证；通常「再生成脚本 + 重新加入画布」易重复节点，**缺少明确的「按 shotId 合并更新」产品规则与实现**时即视为缺口。 |
| **F5** | **设置面板**：齿轮入口、API Key（password）、**暗色切换**、首次无 Key 拦截生成 | **未实现独立设置 Dialog**。`next-themes` 已挂载，但无统一设置 UI；**无「未配置 Key 自动弹窗」** 与生成前强制校验的完整产品闭环。 |
| **边界** | 全局网络断开 Banner、视频过期文案统一处理 | 多为 **toast/局部错误**，**无全局网络状态**。 |
| **MVP 外** | 项目保存/加载、时间线拼接、多用户等 | 文档已标为范围外；**画布状态仍无持久化**（刷新丢失）。 |

### 4.2 认证与用户系统

- `/login`、`/register`、`/forgot-password` 为 **纯前端表单 + 动效**，**无 `action`、无 Session、无 OAuth、无数据库**。
- **无 `middleware` 保护 `/app`**，任何人可直接打开创作台。
- 与「多用户、配额、审计」类产品目标差距大；若只做单机工具可接受，若做 SaaS 需整段补全。

### 4.3 环境变量与命名不一致（易踩坑）

- **`.env.example`** 使用 `ARK_API_KEY`、`ARK_ENDPOINT_ID` 等说明性名称。
- **`/api/chat` 等**实际读取 **`DOUBAO_MODEL_ENDPOINT`**（及 `DOUBAO_API_KEY` / `VOLCENGINE_API_KEY`），与示例文件 **不完全对齐**，新成员易配错导致对话 500。
- **视频/图片**：服务端默认 `VOLCENGINE_API_KEY`；前端可选 **`localStorage('ark-api-key')`** 经 **`x-ark-api-key`** 传入。**文档未统一说明「仅服务端 .env」与「浏览器自定义 Key」两种模式**，运维与安全策略需明确。

### 4.4 代码内明确 TODO（技术债）

| 位置 | 内容 |
|------|------|
| `src/hooks/use-chain-generation.ts` | 当 `generateFrame` 返回 **`taskId` 而非即时 `imageUrl`** 时，**轮询未完成**（两处 `// TODO: 实现轮询逻辑`），异步图片管线可能卡住或静默失败。 |
| `src/components/ui/image-upload.tsx` | **云存储上传**未实现，当前多为本地/base64 路径，生产 URL 生命周期需自建。 |
| `src/lib/style-templates.ts` | **Markdown 解析**标记为 TODO，风格模板能力受限。 |

### 4.5 壳层与布局集成不完整

- 存在 **`app-shell-store` + `AppShellBar`**，但 **`src/app/app/page.tsx` 未引入 `AppShellBar`**。左栏已依赖 shell store 做折叠时，**若缺少顶栏，部分折叠/返回首页入口可能仅依赖侧栏 Tab**，与「顶栏统一导航」的设计意图不一致，属于 **集成未完成**。

### 4.6 可观测性、测试与工程化

- **`/api/chat` 内 `convertMessages` 等大量 `console.log`**：开发友好，**生产需收敛或分级日志**。
- **无自动化测试**（未发现 `*.test.*` / e2e 配置）：回归依赖手工。
- **`use-image-generation.ts.bak`**：备份文件宜移出 `src` 或删除，避免混淆。

### 4.7 计划文档与代码的结构性差异

- 实现计划提到 **「三个 Zustand store」**；实际另有 **`app-shell-store`**，且 **technique 数据主要在 `constants` + technique-store**，以代码为准即可，但文档需同步以免误导。

---

## 5. 风险与一致性小结

1. **双轨密钥**：环境变量 + 浏览器 `ark-api-key` 并存，需文档写清「推荐仅服务端 Key」或「团队共用浏览器 Key」的风险（XSS、泄露）。
2. **异步图像 taskId**：链式首尾帧在未补全轮询前，**与 `/api/generate-image` 异步模式不闭环**。
3. **刷新丢画布**：无持久化，不适合作为用户「项目」唯一载体。
4. **鉴权缺失**：`/app` 公开，若 API Key 仅放服务端仍安全；若依赖前端传 Key，则创作台暴露面大。

---

## 6. 建议实施优先级（路线图）

以下按 **依赖顺序与用户可见价值** 排列，便于排期。

1. **P0 — 配置与文档**  
   - 统一 `.env.example` 与代码中真实变量名（`DOUBAO_MODEL_ENDPOINT`、`VOLCENGINE_API_KEY` / `ARK_API_KEY` 映射说明）。  
   - 在 README 或 `docs/` 写清：对话 vs 视频 vs 图片 各自依赖的 Key 与 Endpoint。

2. **P0 — 链式生成图片轮询**  
   - 在 `use-chain-generation` 中复用与 `use-image-generation` 一致的 **`/api/generate-image/[taskId]` 轮询**，消除 TODO。

3. **P1 — F5 设置面板**  
   - 齿轮 Dialog：`ark-api-key` 读写 localStorage、主题 `setTheme`、可选「使用服务端默认 Key」开关。  
   - 生成前检测：无 Key 且无服务端配置时 toast + 打开设置。

4. **P1 — 工作台壳层合入**  
   - 在 `app/page.tsx` 挂载 **`AppShellBar`**，并统一顶栏与 `pt` 留白，避免侧栏与画布工具条重叠（若设计已定型）。

5. **P2 — 画布持久化（MVP+）**  
   - LocalStorage 序列化 nodes/edges + 版本号，或导出/导入 JSON 文件。

6. **P2 — 分镜与画布同步策略**  
   - 产品定义：同一 `shotId` 是更新节点还是新建节点；在 store 中实现 **upsert**。

7. **P3 — 认证与多用户**  
   - NextAuth / Clerk 等 + `middleware` 保护 `/app`；API 侧按用户限流与计费。

8. **P3 — 测试与日志**  
   - 为核心 API route 与 `buildPrompt` 增加单元测试；生产环境关闭冗长 chat 日志。

---

## 7. 附录：关键文件索引

| 领域 | 路径 |
|------|------|
| 创作台入口 | `src/app/app/page.tsx` |
| 画布 | `src/components/panels/canvas-panel.tsx` |
| 左/右栏 | `src/components/panels/left-panel.tsx`、`right-panel.tsx` |
| 节点 | `src/components/nodes/config-node.tsx`、`video-node.tsx` |
| 画布状态 | `src/stores/canvas-store.ts` |
| 对话 API | `src/app/api/chat/route.ts` |
| 视频 API | `src/app/api/generate/route.ts`、`generate/[taskId]/route.ts` |
| Seedance 封装 | `src/lib/seedance.ts` |
| 视频生成 Hook | `src/hooks/use-video-generation.ts` |
| 链式图片 | `src/hooks/use-chain-generation.ts` |
| 规格对照 | `docs/FEATURE_DESIGN.md` |
| 实现计划 | `docs/plans/2026-03-23-daliu-jimeng-implementation.md` |

---

## 8. 结论

当前仓库已经构成 **可用的 AI 分镜 + 画布 + Seedance 视频生成闭环**，与内部计划/功能文档相比，主要缺口集中在：**设置与密钥体验（F5）、链式帧异步轮询 TODO、环境变量命名统一、画布/分镜长期同步规则、鉴权与持久化、以及壳层组件与页面的完全集成**。按 §6 优先级补齐后，更接近「可对外演示 / 小团队内测」的完整工作台形态。
