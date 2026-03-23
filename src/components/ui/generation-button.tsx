import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Play, Loader2, Check, AlertCircle, Square } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const generationButtonVariants = cva(
  'w-full',
  {
    variants: {
      state: {
        idle: '',
        generating: '',
        done: '',
        error: 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/15',
      },
    },
    defaultVariants: { state: 'idle' },
  }
)

const stateConfig = {
  idle: { icon: Play, label: '生成视频', variant: 'default' as const },
  generating: { icon: Square, label: '停止生成', variant: 'destructive' as const },
  done: { icon: Check, label: '重新生成', variant: 'default' as const },
  error: { icon: AlertCircle, label: '重试', variant: 'outline' as const },
} as const

interface GenerationButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof generationButtonVariants> {
  onStatusChange?: (isGenerating: boolean) => void
}

const GenerationButton = React.forwardRef<HTMLButtonElement, GenerationButtonProps>(
  ({ className, state = 'idle', onStatusChange, ...props }, ref) => {
    const config = stateConfig[state!]
    const Icon = config.icon
    const isGenerating = state === 'generating'

    // Notify parent of generating state changes
    React.useEffect(() => {
      onStatusChange?.(isGenerating)
    }, [isGenerating, onStatusChange])

    return (
      <Button
        ref={ref}
        variant={config.variant}
        size="sm"
        className={cn(generationButtonVariants({ state }), className)}
        {...props}
      >
        <Icon className={cn('h-3.5 w-3.5 mr-1.5', state === 'generating' && 'animate-spin', Icon === Square && 'animate-none')} />
        {config.label}
      </Button>
    )
  }
)
GenerationButton.displayName = 'GenerationButton'

export { GenerationButton, generationButtonVariants }
