"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { BookOpen, ChevronRight } from "lucide-react"
import { knowledgeCategories, type KnowledgeCategory, type KnowledgeItem } from "@/lib/knowledge-base"
import { cn } from "@/lib/utils"

interface KnowledgeBaseButtonProps {
  className?: string
}

export function KnowledgeBaseButton({ className }: KnowledgeBaseButtonProps) {
  const [open, setOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<KnowledgeItem | null>(null)

  return (
    <>
      {/* 悬浮按钮 */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger
          className={cn(
            "fixed bottom-6 left-6 z-50 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110",
            "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground",
            "inline-flex shrink-0 items-center justify-center cursor-pointer border-0 outline-none",
            "focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px",
            className
          )}
        >
          <BookOpen className="h-6 w-6" />
          <span className="sr-only">知识库</span>
        </DialogTrigger>

        {/* 知识库对话框 */}
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden p-0">
          <div className="flex flex-col h-full">
            {/* 头部 */}
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/10">
              <DialogTitle className="text-2xl flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-primary" />
                知识库
              </DialogTitle>
              <DialogDescription>
                专业的电影摄影、剧本创作和分镜设计指南
              </DialogDescription>
            </DialogHeader>

            {/* 内容区域 */}
            <div className="flex-1 overflow-hidden">
              {selectedItem ? (
                // 详细内容视图
                <div className="h-full flex flex-col">
                  <div className="px-6 py-4 border-b border-border/10 flex items-center bg-muted/30">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedItem(null)}
                      className="gap-2"
                    >
                      <ChevronRight className="h-4 w-4 rotate-180" />
                      返回列表
                    </Button>
                  </div>
                  <ScrollArea className="flex-1 px-6 py-4">
                    <div className="max-w-3xl">
                      <h2 className="text-2xl font-bold mb-2">{selectedItem.title}</h2>
                      <p className="text-muted-foreground mb-4">{selectedItem.description}</p>
                      {selectedItem.tags && (
                        <div className="flex flex-wrap gap-2 mb-6">
                          {selectedItem.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        {selectedItem.content.split('\n').map((line, index) => {
                          // 处理标题
                          if (line.startsWith('## ')) {
                            return (
                              <h3 key={index} className="text-xl font-semibold mt-6 mb-3 text-foreground">
                                {line.replace('## ', '')}
                              </h3>
                            )
                          }
                          if (line.startsWith('### ')) {
                            return (
                              <h4 key={index} className="text-lg font-semibold mt-4 mb-2 text-foreground">
                                {line.replace('### ', '')}
                              </h4>
                            )
                          }
                          // 处理列表
                          if (line.match(/^\d+\. /)) {
                            return (
                              <li key={index} className="ml-4 mb-1 text-foreground">
                                {line.replace(/^\d+\. /, '')}
                              </li>
                            )
                          }
                          if (line.startsWith('- **')) {
                            const match = line.match(/- \*\*(.+?)\*\*[:：](.+)/)
                            if (match) {
                              return (
                                <li key={index} className="ml-4 mb-2">
                                  <span className="font-semibold">{match[1]}</span>: {match[2]}
                                </li>
                              )
                            }
                          }
                          if (line.startsWith('- ')) {
                            return (
                              <li key={index} className="ml-4 mb-1 text-foreground">
                                {line.replace('- ', '')}
                              </li>
                            )
                          }
                          // 处理普通段落
                          if (line.trim()) {
                            return (
                              <p key={index} className="mb-2 text-foreground leading-relaxed">
                                {line}
                              </p>
                            )
                          }
                          return <br key={index} />
                        })}
                      </div>
                    </div>
                  </ScrollArea>
                </div>
              ) : (
                // 分类列表视图
                <Tabs defaultValue="cinematography" className="h-full flex flex-col">
                  <div className="px-6 pt-4 border-b border-border/10">
                    <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
                      {knowledgeCategories.map((category) => (
                        <TabsTrigger key={category.id} value={category.id} className="gap-2">
                          <span>{category.icon}</span>
                          <span className="hidden sm:inline">{category.title}</span>
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>
                  <ScrollArea className="flex-1 px-6 py-4">
                    {knowledgeCategories.map((category) => (
                      <TabsContent key={category.id} value={category.id} className="mt-0">
                        <div className="space-y-3">
                          {category.content.map((item) => (
                            <button
                              key={item.id}
                              onClick={() => setSelectedItem(item)}
                              className="w-full text-left p-4 rounded-xl border border-border/10 hover:border-border/30 hover:bg-muted/50 transition-all duration-200 group"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-1">
                                    {item.title}
                                  </h3>
                                  <p className="text-sm text-muted-foreground line-clamp-2">
                                    {item.description}
                                  </p>
                                  {item.tags && (
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                      {item.tags.map((tag) => (
                                        <Badge key={tag} variant="outline" className="text-xs">
                                          {tag}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-0.5" />
                              </div>
                            </button>
                          ))}
                        </div>
                      </TabsContent>
                    ))}
                  </ScrollArea>
                </Tabs>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
