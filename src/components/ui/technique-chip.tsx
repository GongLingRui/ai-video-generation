import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const techniqueChipVariants = cva(
  'inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-semibold tracking-wide transition-all duration-200 cursor-pointer border select-none shadow-sm hover:shadow-md active:scale-[0.97]',
  {
    variants: {
      variant: {
        idle: 'bg-white/70 text-black/70 border-black/[0.06] hover:bg-white hover:text-black/90 hover:border-black/10',
        applied: 'bg-primary/12 text-primary border-primary/20 hover:bg-primary/18 shadow-[0_1px_4px_rgba(201,100,66,0.15)]',
      },
      size: {
        sm: 'text-[10px] px-2 py-1 rounded-lg',
        default: 'text-[11px] px-3 py-1.5',
      },
    },
    defaultVariants: { variant: 'idle', size: 'default' },
  }
)

interface TechniqueChipProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof techniqueChipVariants> {
  label: string
  onRemove?: () => void
  removable?: boolean
}

const TechniqueChip = React.forwardRef<HTMLDivElement, TechniqueChipProps>(
  ({ className, variant, size, label, onRemove, removable = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(techniqueChipVariants({ variant, size }), className)}
        {...props}
      >
        {label}
        {removable && (
          <X
            className="h-3 w-3 opacity-60 hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation()
              onRemove?.()
            }}
          />
        )}
      </div>
    )
  }
)
TechniqueChip.displayName = 'TechniqueChip'

export { TechniqueChip, techniqueChipVariants }
