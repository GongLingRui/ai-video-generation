'use client'

import * as React from 'react'
import { Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type StageStatus = 'pending' | 'loading' | 'done'

type Stage = {
  id: 'concept' | 'planning' | 'storyboard'
  name: string
  icon: string
}

interface ThreeStageProgressProps {
  currentStage: 'concept' | 'planning' | 'storyboard' | 'complete'
  stageStatus: {
    concept: StageStatus
    planning: StageStatus
    storyboard: StageStatus
  }
  className?: string
}

const STAGES: Stage[] = [
  { id: 'concept', name: '创意构思', icon: '💡' },
  { id: 'planning', name: '视频规划', icon: '📋' },
  { id: 'storyboard', name: '分镜脚本', icon: '🎬' },
]

function ThreeStageProgress({
  currentStage,
  stageStatus,
  className,
}: ThreeStageProgressProps) {
  return (
    <div className={cn('flex items-center gap-2 p-3 bg-muted/30 rounded-xl border border-border/10', className)}>
      {STAGES.map((stage, index) => {
        const isActive = currentStage === stage.id
        const status = stageStatus[stage.id]
        const isComplete = status === 'done'
        const isLoading = status === 'loading'

        return (
          <React.Fragment key={stage.id}>
            {/* Stage */}
            <div
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-xs font-medium',
                isActive
                  ? 'border-primary/30 bg-primary/5 text-primary'
                  : 'border-border/10 bg-card/50 text-muted-foreground',
                isComplete && 'border-green-500/20 bg-green-500/5'
              )}
            >
              <span className="text-sm">{stage.icon}</span>
              <span>{stage.name}</span>

              {isComplete && (
                <Check className="h-3.5 w-3.5 text-green-500 ml-1" />
              )}

              {isLoading && (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary ml-1" />
              )}
            </div>

            {/* Arrow */}
            {index < STAGES.length - 1 && (
              <div className="text-muted-foreground/40 text-xs">→</div>
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

export { ThreeStageProgress }
