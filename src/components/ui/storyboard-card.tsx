import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Shot } from '@/types'

const storyboardCardVariants = cva(
  'rounded-xl border p-3 transition-all',
  {
    variants: {
      status: {
        draft: 'border-dashed border-muted-foreground/20 bg-muted/40',
        confirmed: 'border-border/10 bg-card hover:shadow-md',
        onCanvas: 'border-primary/20 bg-primary/5 opacity-60',
      },
    },
    defaultVariants: { status: 'draft' },
  }
)

interface StoryboardCardProps
  extends VariantProps<typeof storyboardCardVariants> {
  shot: Shot
  onAddToCanvas?: (shot: Shot) => void
  className?: string
}

function StoryboardCard({ shot, status, onAddToCanvas, className }: StoryboardCardProps) {
  const isOnCanvas = status === 'onCanvas'

  return (
    <div className={cn(storyboardCardVariants({ status }), className)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-foreground">
          #{shot.id} {shot.title}
        </span>
        {isOnCanvas && <Check className="h-3.5 w-3.5 text-primary" />}
      </div>
      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
        {shot.description}
      </p>
      {shot.suggested_techniques.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {shot.suggested_techniques.map((t) => (
            <Badge key={t} variant="secondary" className="text-[10px] px-1.5 py-0">
              {t}
            </Badge>
          ))}
        </div>
      )}
      {!isOnCanvas && (
        <Button
          size="sm"
          variant="outline"
          className="w-full h-7 text-xs"
          onClick={() => onAddToCanvas?.(shot)}
        >
          加入画布
        </Button>
      )}
    </div>
  )
}

export { StoryboardCard, storyboardCardVariants }
