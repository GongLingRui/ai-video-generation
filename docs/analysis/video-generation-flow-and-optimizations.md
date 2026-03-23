# AI Video 项目功能检查、保存问题修复与视频生成流程分析（2026-04-03）

我看了你现在的文档和核心代码，结论很明确: 这个项目已经不是“缺一个页面”的阶段了，基础工作台其实已经成形，包括 `落地页 -> 登录/项目列表 -> 创作台 -> 对话生成分镜 -> 加入画布 -> 生成视频 -> 自动保存项目` 这条主链路都已经有了。真正还缺的，主要是两层:

1. `产品闭环层` 还没补完，所以它更像一个“可演示的创作工作台”，还不是“稳定可交付的视频生产系统”。
2. `质量控制层` 基本没建立，所以现在视频质量差，核心原因不是 UI 不够，而是生成前、中、后的控制点太少。

## 当前已经有的东西
目前代码里已经具备这些能力:

- `Supabase 登录态 + /app 路由保护 + 项目自动保存` 已经接上了，不只是静态壳子。
- `AI 对话生成分镜 -> 加入画布 -> 节点化编辑 -> 调视频生成` 的主流程已经打通。
- 有 `首尾帧参考`、`多帧参考`、`版本历史`、`项目持久化` 这些中层能力。
- 还有一套“三阶段”数据结构: `concept / planning / storyboard`，说明你的方向是对的。

但问题是，这些“好东西”很多还停留在“结构存在”，没有真正进入最终生成质量闭环。

## 这个项目还缺哪些部分
我按优先级给你拆一下。

### P0: 最该补的
- `真正的三阶段工作流`
现在数据结构里有 `concept / planning / storyboard`，但右侧对话渲染实际上主要还是吃 `generateStoryboard` 的结果，前两阶段没有真正成为用户必经流程。结果就是用户一句需求，系统直接下沉到“分镜 prompt”，中间缺少“创意澄清”和“视频规划”两层，天然会让输出发散。
- `结构化分镜 -> 最终视频 prompt` 的映射层
这是现在质量低的第一大原因。系统已经采集了 `8 要素`、`一致性备注`、`首尾帧 prompt`、`角色特征`、`场景特征`，但真正发给视频模型的仍然是一个很薄的拼接 prompt。

```111:124:src/hooks/use-video-generation.ts
const res = await fetch('/api/generate', {
  method: 'POST',
  headers: customHeaders,
  body: JSON.stringify({
    prompt: nodeData.prompt,
    negativePrompt: nodeData.negativePrompt,
    techniques: nodeData.techniques,
    ratio: nodeData.ratio,
    duration: nodeData.duration,
    resolution: nodeData.resolution,
    firstFrameUrl,
    lastFrameUrl,
    referenceImageUrls,
  }),
```

```27:31:src/lib/seedance.ts
if (cameraKeywords.length > 0) parts.push(`Camera: ${cameraKeywords.join(', ')}`)
if (styleKeywords.length > 0) parts.push(`Style: ${styleKeywords.join(', ')}`)
if (negativePrompt) parts.push(`Avoid: ${negativePrompt}`)

return parts.join('. ') + '.'
```

这意味着你前面收集的丰富语义，最后大部分没真正参与生成。
- `质量控制闭环`
现在没有“自动评分 / 自动重试 / 多结果比选 / 失败原因归因 / 质量门槛”。生成完就是生成完，最多手动切版本。对视频生成来说，这会直接把质量拉低。
- `链式首尾帧异步轮询补完`
这条链路现在有明显断点，代码里直接留了 `TODO`。如果首尾帧生成不稳定，跨镜头连续性一定会掉。

```73:76:src/hooks/use-chain-generation.ts
} else if (firstResult.taskId) {
  // 轮询模式（暂时简化处理）
  // TODO: 实现轮询逻辑
}
```

```100:103:src/hooks/use-chain-generation.ts
} else if (lastResult.taskId) {
  // TODO: 实现轮询逻辑
}
```

### P1: 会明显提升产品完成度的
- `角色圣经 / 场景圣经 / 风格圣经`
现在有“一致性检查展示”，但没有真正的“可复用约束资产”。应该把角色外观、服装、场景、色调、镜头语言沉淀成项目级配置，后续所有镜头强制继承。
- `项目管理完善`
已有自动保存和项目列表，但还缺:
  - 项目重命名
  - 项目复制
  - 项目版本快照
  - 回滚
  - 导入导出 JSON
- `素材资产管理`
图片上传目前还是临时路径思路，没有完整云存储与素材库。
- `生成参数面板`
当前全局控制太薄，主要是模型、参考模式、比例、时长，缺少真正影响质量的参数，比如一致性强度、镜头运动强度、主体锁定、风格强度、重试策略、质量档位。

```19:24:src/components/ui/global-config-bar.tsx
<div className="flex cursor-help items-center gap-2 rounded-lg border border-black/10 bg-zinc-100/90 px-2.5 sm:px-3 py-1.5" title="视频生成模型（未来扩展）">
  <Video className="h-4 w-4 text-zinc-600 shrink-0" />
  <span className="text-xs font-semibold text-zinc-900 hidden sm:inline">Seedance 1.5 Pro</span>
</div>
```

### P2: 从 Demo 走向可运营产品
- `时间线/拼接/字幕/配音/音乐`
现在是“单镜头生成器 + 节点工作台”，但还不是完整视频生产链。
- `可观测性与测试`
缺少核心生成链路的自动化测试、失败统计、日志分级。
- `权限/配额/团队协作`
如果要做 SaaS，这些还远远不够。

## 为什么现在视频生成质量低
这里我按影响度排序。

### 1. 最大问题: 结构化信息没有真正喂给生成模型
这是最关键的。系统前面采集得很丰富，后面却只拼了一个浅层 prompt。  
结果就是:
- 角色细节没锁住
- 场景特征没锁住
- 镜头意图没锁住
- 前后镜语义关系没锁住

所以生成结果只能靠模型“猜”，质量自然不稳。

### 2. 缺少“跨镜头一致性控制包”
你现在有首尾帧衔接，但这只解决了“上一镜尾 -> 下一镜头开”的局部连续性，解决不了:
- 同一角色脸型/服装漂移
- 同一场景灯光和色调漂移
- 镜头语言前后不统一
- 整条视频叙事节奏断裂

也就是说，你现在有“帧衔接”，但还没有“镜头级世界观约束”。

### 3. 缺少生成前的规划层
虽然系统定义了 `concept -> planning -> storyboard`，但当前主流程还是更偏“直接出分镜”。这会让模型在缺少约束时直接开始写 shot，导致:
- 分镜数量随意
- 每镜信息密度不均
- 节奏不稳
- 关键转场和叙事高潮容易丢

### 4. 缺少生成后的筛选与重试机制
现在视频节点只有“历史版本切换”，但没有:
- 自动比较哪个版本更好
- 失败后针对性补救
- 按维度评分，如主体一致性、动作可读性、镜头稳定性

```145:157:src/components/nodes/video-node.tsx
{data.history.map((entry, i) => (
  <div
    key={entry.id}
    className={`h-6 w-10 rounded-lg bg-muted border text-[10px] flex items-center justify-center cursor-pointer hover:border-ring shrink-0 ${data.videoUrl === entry.videoUrl ? 'border-ring bg-ring/10' : 'border-border/10'}`}
    onClick={() => handleSwitchVersion(entry.id)}
  >
    v{i + 1}
  </div>
))}
```

这更像“手动多抽几次”，不是质量闭环。

### 5. 首尾帧链路还不稳定
链式首尾帧是你现在最重要的连续性机制，但轮询没补完，等于最关键的桥梁还可能断。

### 6. 没有后处理层
在 `createVideoTask` 里直接把音频关掉了，而且项目里也没看到时间线拼接、字幕、配音、节奏重组这一层。

```92:101:src/lib/seedance.ts
body: JSON.stringify({
  model: SEEDANCE_MODEL,
  content,
  ratio,
  duration: clampedDuration,
  resolution,
  watermark: false,
  return_last_frame: true,
  generate_audio: false,
}),
```

这意味着现在得到的是“原始生成片段”，不是“成片”。

## 一个更准确的判断
你这个项目现在的短板，不是“少了几个页面”，而是少了一个完整的 `视频生产系统方法论`。  
目前更像:

- 前端工作台: `70-80%`
- 项目系统: `55-65%`
- AI 分镜系统: `60-70%`
- 视频质量控制系统: `25-35%`
- 后期成片系统: `10-20%`

## 我建议的下一步路线
如果你想最快把质量拉起来，优先顺序应该是:

1. 先补 `结构化分镜 -> 视频模型输入` 映射层，把 `8要素 / 一致性 / 角色特征 / 场景特征 / 首尾帧 prompt` 全部真正参与生成。
2. 再补 `角色/场景/风格圣经`，做项目级一致性约束。
3. 补 `链式首尾帧轮询 + 失败重试 + 自动评分`，形成最小质量闭环。
4. 把“三阶段流程”从数据结构升级成真实交互流程，别再直接跳到 storyboard。
5. 最后再做 `时间线/字幕/配音/拼接`，把它从生成工具变成成片工具。

如果你愿意，我下一步可以直接给你出一份更具体的落地方案:  
`按 2 周版本拆解的功能路线图`，或者直接帮你画一版 `当前架构图 + 质量优化改造图`。

## 1. 本次检查范围

本次重点覆盖以下模块：

- 项目持久化：自动建项目、自动保存、切换项目加载
  - `src/app/app/app-client.tsx`
  - `src/lib/projects.ts`
  - `src/stores/canvas-store.ts`
- 视频生成主链路（单分镜）
  - `src/hooks/use-video-generation.ts`
  - `src/app/api/generate/route.ts`
  - `src/app/api/generate/[taskId]/route.ts`
  - `src/lib/seedance.ts`
- 首尾帧/链式生成
  - `src/hooks/use-chain-generation.ts`
  - `src/app/api/generate-frame/route.ts`
  - `src/lib/poll-image-task.ts`
- 多帧参考（九宫格）
  - `src/components/nodes/config-node.tsx`
  - `src/app/api/generate-multi-frame/route.ts`

## 2. 保存问题结论与修复

### 2.1 现象

用户反馈“保存时会保存成多个项目”。

### 2.2 根因分析

自动建项目逻辑位于 `AppClient`：当页面进入 `/app` 且没有 `projectId`，并且画布出现内容时，会自动调用 `createProject`。

原逻辑只在组件实例内用 `autoCreateStartedRef` 防重；在以下场景会失效：

- 开发模式下的重复挂载（React 严格模式相关行为）
- 快速重挂载/路由过渡导致的并发 effect

这会使同一会话触发多次 `createProject`，从而出现“多个重复项目”。

### 2.3 已完成修复

已在 `src/app/app/app-client.tsx` 完成两层修复：

1. **跨挂载共享自动创建锁**（模块级 `inFlightAutoCreate`）
   - 同一时间只允许一个 `createProject` 请求在飞行中；后续调用复用同一个 Promise。
2. **离开上下文时 flush 防抖保存**
   - 在项目上下文销毁时触发 `debouncedSave.flush()`，减少最后一次编辑未保存风险。

### 2.4 修复代码位置

- `src/app/app/app-client.tsx`
  - 新增：`inFlightAutoCreate` 与 `getOrCreateAutoProjectId(...)`
  - 调整：自动建项目 effect 改为复用 in-flight Promise
  - 新增：卸载/切换项目时 `debouncedSave.flush()`

## 3. 视频生成流程与逻辑分析

### 3.1 单分镜视频生成（主链路）

1. 用户在节点点击生成（`config-node` 调 `useVideoGeneration.generate`）
2. `useVideoGeneration` 根据模式拼装参考素材：
   - `first-last`：首帧/尾帧/额外参考图
   - `multi-frame`：仅发送 `referenceImageUrls=[multiFrameImageUrl]`
3. 调 `/api/generate`
4. API 校验 URL、模型 key，调用 `createVideoTask`
5. 轮询 `/api/generate/[taskId]` 直到成功/失败
6. 成功后写入 store：`setVideoResult(configNodeId, videoUrl, prompt, lastFrameUrl)`

### 3.2 首尾帧参考逻辑（first-last）

首帧优先级（`use-video-generation.ts`）：

- 手动上传首帧 `nodeData.firstFrameUrl`
- 否则取上一分镜视频尾帧 `getPreviousNodeLastFrame(nodeId)`
- 否则无首帧

尾帧：直接使用当前节点 `lastFrameUrl`（如有）。

### 3.3 链式首尾帧生成逻辑

`use-chain-generation.ts` 顺序处理 shots：

- 第一个分镜：可生成首帧 + 尾帧
- 后续分镜：首帧继承上一个分镜尾帧，主要生成当前尾帧
- 每个分镜间加 2 秒延迟，降低限流风险
- 支持 `AbortController` 中断

### 3.4 多帧参考（九宫格）逻辑

1. `config-node` 中编辑/增强 `multiFramePrompt`
2. 调 `/api/generate-multi-frame` 生成 3x3 九宫格图
3. 成功后写入 `multiFrameImageUrl`
4. 生成视频时切到 `multi-frame` 模式，将该图作为 `referenceImageUrls` 传给视频接口

## 4. 当前发现的可优化点（按优先级）

### P0（建议优先）

1. **多帧参考异步任务未闭环**
   - `/api/generate-multi-frame` 返回 `taskId` 时，前端仅提示“已创建任务”，未继续轮询取图。
   - 结果：部分情况下九宫格不会自动落到节点，影响后续视频生成。

2. **自动建项目缺少后端幂等保障**
   - 当前已做前端并发防重，但从工程稳健性看，建议后端再加“幂等 key / 去重策略”。

### P1

1. **尾帧单独重生可能污染视频历史**
   - `config-node` 中生成尾帧时调用 `setVideoResult(...)`，该方法会追加 `history`。
   - 如果本次仅更新尾帧、不产生新视频，历史可能被“伪版本”污染。

2. **保存一致性可再增强**
   - 目前依赖防抖 + flush，建议补“显式保存按钮 + 保存版本号/etag”防止并发覆盖。

### P2

1. **接口与日志较多 `any` 与调试输出**
   - 部分关键链路有 ESLint `no-explicit-any` 错误，建议补类型定义，减少线上不确定性。
2. **多帧参考生成参数语义可更清晰**
   - 目前复用 `createImageTask(..., 'initial-character')` 生成九宫格，语义上可拆分专用模式。

## 5. 本次执行的检查与验证

已执行：

- `npx eslint src/app/app/app-client.tsx`（通过）
- `npx eslint src/hooks/use-video-generation.ts src/hooks/use-chain-generation.ts src/app/api/generate/route.ts src/app/api/generate-frame/route.ts src/app/api/generate-multi-frame/route.ts src/lib/seedance.ts`
  - 结果：发现历史问题 2 项（`seedance.ts` 一个 `any` error，`generate-multi-frame` 一个未使用变量 warning）

全量 `npm run lint` 未通过（仓库存在较多历史 lint 问题），因此本次采取“核心链路定向检查 + 针对性修复”的方式。

## 6. 后续建议落地顺序

1. 先补 `generate-multi-frame` 的 taskId 轮询闭环（用户可见收益最高）。
2. 再处理“尾帧重生不应新增视频历史”语义拆分。
3. 增加项目保存幂等与版本冲突防护（后端/数据库层）。
4. 最后统一清理关键链路 TS 类型与 lint 问题。

