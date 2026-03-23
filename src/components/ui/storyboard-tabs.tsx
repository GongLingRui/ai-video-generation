'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Check, ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Shot, StoryboardOverview } from '@/types'
import type { ConceptResult } from '@/types/concept'
import type { PlanningResult } from '@/types/planning'

interface StoryboardTabsProps {
  overview: StoryboardOverview
  shots: Shot[]
  onAddToCanvas: (shot: Shot) => void
  onAddAllToCanvas: (shots: Shot[]) => void
  addedShotIds: Set<string>
  // 三阶段数据（可选）
  conceptResult?: ConceptResult
  planningResult?: PlanningResult
  className?: string
}

type TabValue = 'overview' | 'details'

function StoryboardTabs({
  overview,
  shots,
  onAddToCanvas,
  onAddAllToCanvas,
  addedShotIds,
  conceptResult,
  planningResult,
  className,
}: StoryboardTabsProps) {
  const [activeTab, setActiveTab] = React.useState<TabValue>('overview')

  return (
    <div className={cn('w-full space-y-3', className)}>
      {/* Tab Headers */}
      <div className="flex gap-2 border-b border-border/10 pb-2">
        <Button
          variant={activeTab === 'overview' ? 'default' : 'ghost'}
          size="sm"
          className="h-8 text-xs"
          onClick={() => setActiveTab('overview')}
        >
          总览表格
        </Button>
        <Button
          variant={activeTab === 'details' ? 'default' : 'ghost'}
          size="sm"
          className="h-8 text-xs"
          onClick={() => setActiveTab('details')}
        >
          分镜细节 ({shots.length}镜)
        </Button>
      </div>

      {/* Tab Content - 支持横向滚动 */}
      <div className="overflow-x-auto -mx-4 px-4">
        <div className="min-w-max">
          <ScrollArea className="max-h-[500px]">
            {activeTab === 'overview' && (
              <OverviewTabContent
                overview={overview}
                shots={shots}
                conceptResult={conceptResult}
                planningResult={planningResult}
                onAddAllToCanvas={onAddAllToCanvas}
              />
            )}
            {activeTab === 'details' && (
              <DetailsTabContent
                shots={shots}
                addedShotIds={addedShotIds}
                onAddToCanvas={onAddToCanvas}
                onAddAllToCanvas={onAddAllToCanvas}
              />
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}

// Overview Tab: HTML Table + Style Info
function OverviewTabContent({
  overview,
  shots,
  conceptResult,
  planningResult,
  onAddAllToCanvas,
}: {
  overview: StoryboardOverview
  shots: Shot[]
  conceptResult?: ConceptResult
  planningResult?: PlanningResult
  onAddAllToCanvas: (shots: Shot[]) => void
}) {
  return (
    <div className="space-y-3 pr-2">
      {/* Style Profile Card */}
      <div className="bg-muted/30 rounded-xl p-3 border border-border/10">
        <h3 className="text-xs font-semibold mb-2">风格总览</h3>
        <div className="grid grid-cols-1 gap-2 text-xs">
          <div>
            <span className="text-muted-foreground">色彩方案:</span>
            <span className="ml-2">{overview.style_profile.color_scheme}</span>
          </div>
          <div>
            <span className="text-muted-foreground">整体情绪:</span>
            <span className="ml-2">{overview.style_profile.mood}</span>
          </div>
          <div>
            <span className="text-muted-foreground">视觉风格:</span>
            <span className="ml-2">{overview.style_profile.visual_style}</span>
          </div>
        </div>
      </div>

      {/* Consistency Report */}
      <div className="bg-muted/30 rounded-xl p-3 border border-border/10">
        <h3 className="text-xs font-semibold mb-2">一致性检查</h3>
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'text-xs',
                overview.consistency_report.character_consistency
                  ? 'text-green-500'
                  : 'text-amber-500'
              )}
            >
              {overview.consistency_report.character_consistency ? '✓' : '⚠'}
            </span>
            <span>角色一致性</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'text-xs',
                overview.consistency_report.scene_consistency
                  ? 'text-green-500'
                  : 'text-amber-500'
              )}
            >
              {overview.consistency_report.scene_consistency ? '✓' : '⚠'}
            </span>
            <span>场景一致性</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'text-xs',
                overview.consistency_report.style_consistency ? 'text-green-500' : 'text-amber-500'
              )}
            >
              {overview.consistency_report.style_consistency ? '✓' : '⚠'}
            </span>
            <span>风格一致性</span>
          </div>
          {overview.consistency_report.notes.length > 0 && (
            <div className="mt-2 text-muted-foreground">
              备注: {overview.consistency_report.notes.join('; ')}
            </div>
          )}
        </div>
      </div>

      {/* HTML Table */}
      <div className="bg-background rounded-xl border border-border/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[800px] w-full text-[10px]">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-2 py-2 text-left font-semibold whitespace-nowrap">ID</th>
                <th className="px-2 py-2 text-left font-semibold whitespace-nowrap">时长</th>
                <th className="px-2 py-2 text-left font-semibold whitespace-nowrap">景别</th>
                <th className="px-2 py-2 text-left font-semibold whitespace-nowrap">转场</th>
                <th className="px-2 py-2 text-left font-semibold whitespace-nowrap">核心信息</th>
                <th className="px-2 py-2 text-left font-semibold whitespace-nowrap">画面关键词</th>
                <th className="px-2 py-2 text-left font-semibold whitespace-nowrap">角色特征</th>
                <th className="px-2 py-2 text-left font-semibold whitespace-nowrap">场景特征</th>
                <th className="px-2 py-2 text-left font-semibold whitespace-nowrap">一致性</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/10">
              {shots.map((shot, index) => (
                <tr
                  key={shot.id}
                  className={index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}
                >
                  <td className="px-2 py-2 whitespace-nowrap font-medium">#{shot.id}</td>
                  <td className="px-2 py-2 whitespace-nowrap">{shot.duration}s</td>
                  <td className="px-2 py-2 whitespace-nowrap">{shot.shot_size || '-'}</td>
                  <td className="px-2 py-2 whitespace-nowrap">{shot.transition || '-'}</td>
                  <td className="px-2 py-2 max-w-[120px] truncate" title={shot.core_info || undefined}>
                    {shot.core_info || '-'}
                  </td>
                  <td className="px-2 py-2 max-w-[100px] truncate" title={shot.visual_keywords?.join(', ')}>
                    {shot.visual_keywords?.join(', ') || '-'}
                  </td>
                  <td className="px-2 py-2 max-w-[80px] truncate" title={shot.character_features || undefined}>
                    {shot.character_features || '-'}
                  </td>
                  <td className="px-2 py-2 max-w-[80px] truncate" title={shot.scene_features || undefined}>
                    {shot.scene_features || '-'}
                  </td>
                  <td className="px-2 py-2 max-w-[80px] truncate" title={shot.consistency_notes || undefined}>
                    {shot.consistency_notes || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Button */}
      <Button onClick={() => onAddAllToCanvas(shots)} className="w-full" size="sm">
        全部加入画布 ({shots.length}镜)
      </Button>
    </div>
  )
}

// Details Tab: Expandable Shot Cards
function DetailsTabContent({
  shots,
  addedShotIds,
  onAddToCanvas,
  onAddAllToCanvas,
}: {
  shots: Shot[]
  addedShotIds: Set<string>
  onAddToCanvas: (shot: Shot) => void
  onAddAllToCanvas: (shots: Shot[]) => void
}) {
  // 8字段展开状态管理
  const [expandedEightFields, setExpandedEightFields] = React.useState<Set<number>>(new Set())

  // 8字段编辑状态管理
  const [eightFieldsEdit, setEightFieldsEdit] = React.useState<Map<number, Record<string, string>>>(new Map())

  const toggleEightFields = (shotId: number) => {
    setExpandedEightFields((prev) => {
      const next = new Set(prev)
      if (next.has(shotId)) {
        next.delete(shotId)
      } else {
        next.add(shotId)
      }
      return next
    })
  }

  // 更新8字段编辑内容
  const updateEightField = (shotId: number, field: string, value: string) => {
    setEightFieldsEdit((prev) => {
      const next = new Map(prev)
      const shotData = next.get(shotId) || {}
      shotData[field] = value
      next.set(shotId, shotData)
      return next
    })
  }

  // 处理加入画布，合并编辑后的8字段内容
  const handleAddToCanvas = (shot: Shot) => {
    const editedFields = eightFieldsEdit.get(shot.id)
    if (editedFields && Object.keys(editedFields).length > 0) {
      // 将编辑后的8字段内容合并到shot中
      const updatedShot = {
        ...shot,
        composition: editedFields.composition || shot.composition,
        lighting: editedFields.lighting || shot.lighting,
        subject: editedFields.subject || shot.subject,
        background: editedFields.background || shot.background,
        action_movement: editedFields.action_movement || shot.action_movement,
        text_overlay: editedFields.text_overlay || shot.text_overlay,
        transition_detail: editedFields.transition_detail || shot.transition_detail,
        audio: editedFields.audio || shot.audio,
        first_frame_prompt: editedFields.first_frame_prompt || shot.first_frame_prompt,
        last_frame_prompt: editedFields.last_frame_prompt || shot.last_frame_prompt,
      }
      onAddToCanvas(updatedShot)
    } else {
      onAddToCanvas(shot)
    }
  }

  // 处理全部加入画布，合并编辑后的8字段内容
  const handleAddAllToCanvas = () => {
    const updatedShots = shots.map((shot) => {
      const editedFields = eightFieldsEdit.get(shot.id)
      if (editedFields && Object.keys(editedFields).length > 0) {
        return {
          ...shot,
          composition: editedFields.composition || shot.composition,
          lighting: editedFields.lighting || shot.lighting,
          subject: editedFields.subject || shot.subject,
          background: editedFields.background || shot.background,
          action_movement: editedFields.action_movement || shot.action_movement,
          text_overlay: editedFields.text_overlay || shot.text_overlay,
          transition_detail: editedFields.transition_detail || shot.transition_detail,
          audio: editedFields.audio || shot.audio,
          first_frame_prompt: editedFields.first_frame_prompt || shot.first_frame_prompt,
          last_frame_prompt: editedFields.last_frame_prompt || shot.last_frame_prompt,
        }
      }
      return shot
    })
    onAddAllToCanvas(updatedShots)
  }

  return (
    <div className="space-y-3 pr-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold">分镜详情</span>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={handleAddAllToCanvas}
        >
          全部加入画布
        </Button>
      </div>

      {shots.map((shot) => {
        const shotKey = String(shot.id)
        const isAdded = addedShotIds.has(shotKey)
        const isEightFieldsExpanded = expandedEightFields.has(shot.id)
        // 获取编辑后的8字段内容，如果没有编辑过则使用原始数据
        const editedFields = eightFieldsEdit.get(shot.id) || {}
        const composition = editedFields.composition || shot.composition || ''
        const lighting = editedFields.lighting || shot.lighting || ''
        const subject = editedFields.subject || shot.subject || ''
        const background = editedFields.background || shot.background || ''
        const actionMovement = editedFields.action_movement || shot.action_movement || ''
        const textOverlay = editedFields.text_overlay || shot.text_overlay || ''
        const transitionDetail = editedFields.transition_detail || shot.transition_detail || ''
        const audio = editedFields.audio || shot.audio || ''

        return (
          <div
            key={shot.id}
            className="bg-muted/30 rounded-xl p-3 border border-border/10 space-y-2"
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-xs font-semibold">
                  分镜 #{shot.id}: {shot.title}
                </h4>
                <div className="flex gap-2 mt-1 text-[10px] text-muted-foreground">
                  <span>{shot.duration}s</span>
                  <span>•</span>
                  <span>{shot.shot_size || '未指定景别'}</span>
                  <span>•</span>
                  <span>{shot.transition || 'cut'}</span>
                </div>
              </div>
              <Button
                size="sm"
                variant={isAdded ? 'outline' : 'default'}
                disabled={isAdded}
                className="h-7 text-[10px]"
                onClick={() => handleAddToCanvas(shot)}
              >
                {isAdded && <Check className="h-3 w-3 mr-1" />}
                {isAdded ? '已添加' : '加入画布'}
              </Button>
            </div>

            {/* Core Info */}
            {shot.core_info && (
              <div className="text-xs">
                <span className="font-medium">核心信息:</span>
                <span className="ml-2">{shot.core_info}</span>
              </div>
            )}

            {/* Description */}
            <div className="text-xs bg-background rounded-lg p-2">
              <span className="font-medium">画面描述:</span>
              <p className="mt-1 text-muted-foreground text-[10px] leading-relaxed">
                {shot.description}
              </p>
            </div>

            {/* Frame Prompts - 可编辑 */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-2 text-[10px]">
                <div className="font-medium mb-1">首帧Prompt（可编辑）:</div>
                <Textarea
                  value={shot.first_frame_prompt || ''}
                  onChange={(e) => updateEightField(shot.id, 'first_frame_prompt', e.target.value)}
                  placeholder="首帧图生成提示词..."
                  className="min-h-[60px] text-[9px] resize-none nodrag"
                  rows={3}
                />
              </div>
              <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-2 text-[10px]">
                <div className="font-medium mb-1">尾帧Prompt（可编辑）:</div>
                <Textarea
                  value={shot.last_frame_prompt || ''}
                  onChange={(e) => updateEightField(shot.id, 'last_frame_prompt', e.target.value)}
                  placeholder="尾帧图生成提示词..."
                  className="min-h-[60px] text-[9px] resize-none nodrag"
                  rows={3}
                />
              </div>
            </div>

            {/* Metadata */}
            <div className="space-y-2 text-xs">
              {shot.visual_keywords && shot.visual_keywords.length > 0 && (
                <div>
                  <span className="font-medium">关键词:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {shot.visual_keywords.map((kw, i) => (
                      <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0">
                        {kw}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {shot.character_features && (
                <div>
                  <span className="font-medium">角色特征:</span>
                  <div className="text-muted-foreground text-[10px] mt-1">
                    {shot.character_features}
                  </div>
                </div>
              )}
              {shot.scene_features && (
                <div>
                  <span className="font-medium">场景特征:</span>
                  <div className="text-muted-foreground text-[10px] mt-1">
                    {shot.scene_features}
                  </div>
                </div>
              )}
            </div>

            {/* Techniques */}
            {shot.suggested_techniques.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {shot.suggested_techniques.map((t) => (
                  <Badge key={t} variant="secondary" className="text-[10px] px-1.5 py-0">
                    {t}
                  </Badge>
                ))}
              </div>
            )}

            {/* Consistency Notes */}
            {shot.consistency_notes && (
              <div className="text-[10px] bg-amber-50 dark:bg-amber-950/20 rounded-lg p-2">
                <span className="font-medium">一致性备注:</span>
                <span className="ml-2">{shot.consistency_notes}</span>
              </div>
            )}

            {/* 8要素详细描述 - 始终显示 */}
            <div className="pt-2 border-t border-border/10">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-[10px] font-medium w-full justify-start"
                onClick={() => toggleEightFields(shot.id)}
              >
                {isEightFieldsExpanded ? (
                  <ChevronDown className="h-3 w-3 mr-1" />
                ) : (
                  <ChevronRight className="h-3 w-3 mr-1" />
                )}
                8要素详细描述（可编辑）
              </Button>

              {isEightFieldsExpanded && (
                <div className="mt-2 space-y-2 text-[10px]">
                  <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-2">
                    <label className="font-medium">1. 构图</label>
                    <Textarea
                      value={composition}
                      onChange={(e) => updateEightField(shot.id, 'composition', e.target.value)}
                      placeholder="主体位置、视角、构图方式、景深控制..."
                      className="mt-1 min-h-[60px] text-[9px] resize-none nodrag"
                      rows={3}
                    />
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-950/20 rounded-lg p-2">
                    <label className="font-medium">2. 光线</label>
                    <Textarea
                      value={lighting}
                      onChange={(e) => updateEightField(shot.id, 'lighting', e.target.value)}
                      placeholder="光源方向、光质、光影对比度、光线氛围..."
                      className="mt-1 min-h-[60px] text-[9px] resize-none nodrag"
                      rows={3}
                    />
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-2">
                    <label className="font-medium">3. 主体</label>
                    <Textarea
                      value={subject}
                      onChange={(e) => updateEightField(shot.id, 'subject', e.target.value)}
                      placeholder="人物特征、物体特征、主体状态..."
                      className="mt-1 min-h-[60px] text-[9px] resize-none nodrag"
                      rows={3}
                    />
                  </div>
                  <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-2">
                    <label className="font-medium">4. 背景</label>
                    <Textarea
                      value={background}
                      onChange={(e) => updateEightField(shot.id, 'background', e.target.value)}
                      placeholder="环境特征、空间关系、背景元素、色彩基调..."
                      className="mt-1 min-h-[60px] text-[9px] resize-none nodrag"
                      rows={3}
                    />
                  </div>
                  <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-2">
                    <label className="font-medium">5. 动作/运动</label>
                    <Textarea
                      value={actionMovement}
                      onChange={(e) => updateEightField(shot.id, 'action_movement', e.target.value)}
                      placeholder="主体动作、镜头运动、运动速度、运动轨迹..."
                      className="mt-1 min-h-[60px] text-[9px] resize-none nodrag"
                      rows={3}
                    />
                  </div>
                  <div className="bg-indigo-50 dark:bg-indigo-950/20 rounded-lg p-2">
                    <label className="font-medium">6. 文字叠加</label>
                    <Textarea
                      value={textOverlay}
                      onChange={(e) => updateEightField(shot.id, 'text_overlay', e.target.value)}
                      placeholder="本镜头需要叠加的文字内容，如无则填写'无'..."
                      className="mt-1 min-h-[40px] text-[9px] resize-none nodrag"
                      rows={2}
                    />
                  </div>
                  <div className="bg-pink-50 dark:bg-pink-950/20 rounded-lg p-2">
                    <label className="font-medium">7. 转场</label>
                    <Textarea
                      value={transitionDetail}
                      onChange={(e) => updateEightField(shot.id, 'transition_detail', e.target.value)}
                      placeholder="转场类型、转场时机、转场效果、衔接方式..."
                      className="mt-1 min-h-[60px] text-[9px] resize-none nodrag"
                      rows={3}
                    />
                  </div>
                  <div className="bg-cyan-50 dark:bg-cyan-950/20 rounded-lg p-2">
                    <label className="font-medium">8. 音频</label>
                    <Textarea
                      value={audio}
                      onChange={(e) => updateEightField(shot.id, 'audio', e.target.value)}
                      placeholder="背景音乐、音效、旁白/对白、音频氛围..."
                      className="mt-1 min-h-[60px] text-[9px] resize-none nodrag"
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export { StoryboardTabs }
