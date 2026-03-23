"use client"

import { motion } from "framer-motion"
import {
  ArrowRight,
  Film,
  Atom,
  Zap,
  Shield,
  Wand2,
  Play,
  Star,
  TrendingUp,
  Users,
  Clock,
  Sparkles,
} from "lucide-react"
import { useRouter } from "next/navigation"

const features = [
  {
    icon: Film,
    title: "AI 分镜脚本",
    desc: "用文字描述你的创意，AI 自动生成专业分镜脚本，包含构图、光线、动作等八大要素"
  },
  {
    icon: Wand2,
    title: "首尾帧衔接",
    desc: "智能衔接相邻分镜，自动保持视觉连续性，让视频过渡自然流畅"
  },
  {
    icon: Zap,
    title: "专业运镜技巧",
    desc: "内置 33 种运镜技巧，涵盖角度、视图、动作、风格，一键应用到任意分镜"
  },
]

const advantages = [
  {
    icon: Atom,
    title: "可视化编辑",
    desc: "三栏式工作台，拖拽点击即可完成分镜配置，所见即所得的创作体验"
  },
  {
    icon: TrendingUp,
    title: "链式生成",
    desc: "多镜头自动衔接，尾帧自动作为下一镜头首帧，批量生成连贯视频序列"
  },
  {
    icon: Shield,
    title: "多模型驱动",
    desc: "豆包大模型生成脚本，Seedream 生成图像，Seedance 生成视频，一站式搞定"
  },
]

const stats = [
  { icon: Users, value: "33+", label: "专业运镜技巧" },
  { icon: Play, value: "8", label: "分镜要素覆盖" },
  { icon: Star, value: "3", label: "AI 模型协同" },
  { icon: TrendingUp, value: "∞", label: "创意无上限" },
]

const steps = [
  {
    step: "01",
    title: "描述你的创意",
    desc: "用自然语言告诉 AI 你想要什么风格的视频，比如：一个宇航员在火星表面探索"
  },
  {
    step: "02",
    title: "生成与调整",
    desc: "AI 生成专业分镜脚本，你可以选择运镜技巧、调整时长、添加首尾帧参考"
  },
  {
    step: "03",
    title: "一键出片",
    desc: "点击生成，AI 自动完成首尾帧和视频的批量生产，导出高清成片"
  },
]

const testimonials = [
  {
    name: "陈小鱼",
    role: "短视频创作者",
    text: "以前花 3 小时写分镜，现在 5 分钟搞定。AI 生成的脚本比我自己想的还专业！"
  },
  {
    name: "林导",
    role: "品牌广告导演",
    text: "链式衔接功能太实用了，多镜头视频一键生成，客户看了直接拍板通过。"
  },
  {
    name: "苏小漫",
    role: "内容策划",
    text: "运镜技巧库简直是救星，不用懂专业术语，点一点就能做出电影感。"
  },
]

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
} as const

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] as const } },
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: "easeOut" as const } },
}

export function HeroSection() {
  const router = useRouter()

  return (
    <>
      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-28 pb-24 overflow-hidden">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto"
        >
          {/* Badge */}
          <motion.div
            variants={fadeUp}
            className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium gradient-subtle text-foreground"
          >
            <Zap className="h-3.5 w-3.5 text-primary" />
            AI 分镜视频工作台 · 三栏式创作台
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-4xl sm:text-5xl md:text-7xl font-extrabold leading-[1.1] tracking-tight"
          >
            <span className="gradient-text">智能分镜</span>
            <br />
            <span className="text-foreground">让视频创作更简单</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mt-6 text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed"
          >
            输入创意描述，AI 自动生成分镜脚本，搭配专业运镜技巧，
            <br className="hidden sm:block" />
            一键生成连贯的分镜视频。从灵感到成片，只需三步。
          </motion.p>

          {/* CTA Buttons */}
          <motion.div variants={fadeUp} className="mt-10 flex flex-col sm:flex-row items-center gap-4">
            <motion.button
              onClick={() => router.push("/app")}
              className="btn-gradient flex items-center gap-3 px-10 py-5 text-lg glow-soft"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              开始创作
              <ArrowRight className="h-5 w-5" />
            </motion.button>

            {/* <motion.button
              className="flex items-center gap-2 rounded-2xl px-8 py-5 text-base font-medium text-foreground bg-secondary transition-all duration-300 hover:bg-secondary/80"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Play className="h-4 w-4" />
              观看演示
            </motion.button> */}
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={fadeUp}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10 w-full max-w-3xl"
          >
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl md:text-3xl font-bold gradient-text">{s.value}</div>
                <div className="mt-1 text-xs text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Decorative gradient line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      </section>

      {/* Features */}
      <section className="relative py-24 px-6">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.p variants={fadeUp} className="text-sm font-semibold tracking-widest uppercase text-primary mb-3">
              核心能力
            </motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-bold text-foreground">
              专业级 <span className="gradient-text">分镜视频</span> 工作台
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-4 text-muted-foreground max-w-xl mx-auto">
              融合 AI 脚本生成、专业运镜技巧与链式视频衔接，三位一体打造流畅创作体验
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {features.map((f) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                className="soft-card soft-card-hover flex flex-col items-center gap-4 p-10 text-center"
                whileHover={{ y: -6 }}
              >
                <div className="gradient-primary rounded-2xl p-4">
                  <f.icon className="h-7 w-7 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-bold text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative py-24 px-6 section-divider">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.p variants={fadeUp} className="text-sm font-semibold tracking-widest uppercase text-primary mb-3">
              创作流程
            </motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-bold text-foreground">
              三步完成 <span className="gradient-text">分镜视频</span>
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {steps.map((s, i) => (
              <motion.div
                key={s.step}
                variants={fadeUp}
                className="relative soft-card p-8 text-center"
              >
                <div className="text-5xl font-black gradient-text opacity-30 mb-4">{s.step}</div>
                <h3 className="text-lg font-bold text-foreground mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="h-5 w-5 text-primary/30" />
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Advantages */}
      <section className="relative py-24 px-6">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.p variants={fadeUp} className="text-sm font-semibold tracking-widest uppercase text-primary mb-3">
              核心优势
            </motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-bold text-foreground">
              为什么创作者 <span className="gradient-text">选择我们</span>
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {advantages.map((a) => (
              <motion.div
                key={a.title}
                variants={scaleIn}
                className="soft-card soft-card-hover p-8 flex flex-col items-start gap-4"
                whileHover={{ y: -4 }}
              >
                <div className="feature-icon-bg rounded-2xl p-3">
                  <a.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground">{a.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{a.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative py-24 px-6 section-divider">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.p variants={fadeUp} className="text-sm font-semibold tracking-widest uppercase text-primary mb-3">
              创作者说
            </motion.p>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-bold text-foreground">
              听听他们怎么评价 <span className="gradient-text">AI 分镜台</span>
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {testimonials.map((t) => (
              <motion.div
                key={t.name}
                variants={fadeUp}
                className="soft-card soft-card-hover p-8"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-foreground text-sm leading-relaxed mb-6">"{t.text}"</p>
                <div>
                  <div className="font-semibold text-foreground text-sm">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 px-6">
        <div className="container mx-auto max-w-3xl">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="gradient-primary rounded-4xl p-12 md:p-16 text-center relative overflow-hidden"
          >
            {/* Decorative circles */}
            <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-white/10 animate-pulse-soft" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-white/5 animate-float-slow" />

            <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold text-primary-foreground relative z-10">
              准备好开启 AI 创作之旅了吗？
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-4 text-primary-foreground/80 relative z-10">
              用 AI 将你的想象力转化为专业分镜视频，从今天开始
            </motion.p>
            <motion.button
              variants={fadeUp}
              onClick={() => router.push("/app")}
              className="mt-8 relative z-10 rounded-2xl bg-white px-10 py-4 text-base font-semibold text-foreground transition-all duration-300 hover:shadow-lg"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              免费开始
              <ArrowRight className="inline-block ml-2 h-5 w-5" />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="container mx-auto max-w-5xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="gradient-primary rounded-lg p-1.5">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold text-foreground">Daliu Jimeng</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">关于我们</a>
            <a href="#" className="hover:text-foreground transition-colors">隐私政策</a>
            <a href="#" className="hover:text-foreground transition-colors">服务条款</a>
            <a href="#" className="hover:text-foreground transition-colors">联系我们</a>
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" /> © 2026 Daliu Jimeng. All rights reserved.
          </div>
        </div>
      </footer>
    </>
  )
}
