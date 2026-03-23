# 项目结构规范

## 目录树

```
daliu-jimeng/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # 根 layout（字体、全局 providers）
│   │   ├── page.tsx                  # 唯一页面入口（三栏布局）
│   │   ├── globals.css               # 全局样式（从根目录 global.css 移入）
│   │   ├── actions.tsx               # Server Actions（AI SDK streamUI）
│   │   └── api/
│   │       ├── generate/
│   │       │   ├── route.ts          # POST: 创建 Seedance 视频任务
│   │       │   └── [taskId]/
│   │       │       └── route.ts      # GET: 查询任务状态
│   │       └── chat/
│   │           └── route.ts          # POST: 备用 chat endpoint
│   │
│   ├── components/
│   │   ├── ui/                       # shadcn/ui 基础组件 + 自定义 cva 组件
│   │   │   ├── button.tsx            # shadcn/ui
│   │   │   ├── input.tsx             # shadcn/ui
│   │   │   ├── textarea.tsx          # shadcn/ui
│   │   │   ├── badge.tsx             # shadcn/ui
│   │   │   ├── select.tsx            # shadcn/ui
│   │   │   ├── scroll-area.tsx       # shadcn/ui
│   │   │   ├── collapsible.tsx       # shadcn/ui
│   │   │   ├── tooltip.tsx           # shadcn/ui
│   │   │   ├── dialog.tsx            # shadcn/ui
│   │   │   ├── sonner.tsx            # shadcn/ui toast
│   │   │   ├── technique-chip.tsx    # 自定义：运镜技巧标签
│   │   │   ├── storyboard-card.tsx   # 自定义：分镜卡片（Generative UI）
│   │   │   └── generation-button.tsx # 自定义：生成按钮（带状态）
│   │   │
│   │   ├── panels/                   # 三大面板
│   │   │   ├── left-panel.tsx        # 运镜技巧面板
│   │   │   ├── canvas-panel.tsx      # xyflow 画布面板
│   │   │   └── right-panel.tsx       # AI 对话面板
│   │   │
│   │   ├── nodes/                    # xyflow 自定义节点
│   │   │   ├── config-node.tsx       # 配置节点
│   │   │   └── video-node.tsx        # 视频展示节点
│   │   │
│   │   └── providers/                # Context Providers
│   │       └── app-providers.tsx     # 组合 provider（Theme, ReactFlow, Toaster）
│   │
│   ├── stores/                       # Zustand stores
│   │   ├── canvas-store.ts           # 画布状态
│   │   └── technique-store.ts        # 运镜选项数据
│   │
│   ├── hooks/                        # 自定义 Hooks
│   │   ├── use-video-generation.ts   # 视频生成轮询逻辑
│   │   └── use-canvas-layout.ts      # 画布自动布局计算
│   │
│   ├── lib/                          # 工具和配置
│   │   ├── utils.ts                  # cn() 等通用工具
│   │   ├── motion.ts                 # Framer Motion 预设动画
│   │   ├── seedance.ts               # Seedance API client
│   │   ├── volcengine.ts             # 火山方舟 AI provider 配置
│   │   └── constants.ts              # 运镜选项数据、system prompt 等
│   │
│   └── types/                        # TypeScript 类型定义
│       ├── index.ts                  # 统一导出
│       ├── canvas.ts                 # 节点、边、画布相关类型
│       ├── technique.ts              # 运镜技巧相关类型
│       ├── video.ts                  # 视频生成相关类型
│       └── chat.ts                   # 对话和分镜相关类型
│
├── docs/                             # 项目文档
│   ├── plans/                        # 设计文档
│   ├── UI_DESIGN.md
│   ├── CODE_LOGIC.md
│   ├── PROJECT_STRUCTURE.md
│   └── FEATURE_DESIGN.md
│
├── public/                           # 静态资源
├── .env.local                        # 环境变量（API Keys）
├── next.config.ts
├── tailwind.config.ts                # 如需额外配置（v4 大部分在 CSS 中）
├── tsconfig.json
├── package.json
└── components.json                   # shadcn/ui 配置
```

## 文件放置原则

### 单文件 vs 目录

- **单文件组件**：逻辑简单、无子组件、< 200 行 → 直接 `component-name.tsx`
- **目录组件**：有子组件或辅助文件 → `component-name/index.tsx` + 子文件

### 放在哪里？

| 判断标准 | 位置 |
|---------|------|
| shadcn/ui 原生组件或 cva 自定义基础组件 | `components/ui/` |
| 三大面板之一的顶层组件 | `components/panels/` |
| xyflow 自定义节点 | `components/nodes/` |
| 被多个面板使用的组合组件 | `components/shared/`（按需创建） |
| 全局 Provider | `components/providers/` |
| Zustand store | `stores/` |
| 可复用逻辑封装 | `hooks/` |
| 纯函数工具、API client、常量 | `lib/` |
| TypeScript 类型 | `types/` |

### 不允许

- 在 `app/` 目录下放组件文件（除 `layout.tsx`, `page.tsx`, `actions.tsx`）
- 在 `components/` 下创建超过一层的嵌套目录
- 类型定义散落在组件文件中（提取到 `types/`）

## 环境变量

```bash
# .env.local
ARK_API_KEY=your-volcengine-api-key      # 火山方舟 API Key（用于 Seedance + 豆包）
ARK_ENDPOINT_ID=your-doubao-endpoint-id  # 豆包模型的 endpoint ID
```

## Path Alias

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

所有 import 使用 `@/` 前缀，不使用相对路径（除同目录文件）。
