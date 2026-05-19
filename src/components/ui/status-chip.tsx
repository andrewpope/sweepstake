import { cva, type VariantProps } from 'class-variance-authority'
import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const chipVariants = cva(
  'inline-flex items-center font-mono font-semibold uppercase text-[11px] tracking-wider px-2 py-0.5 rounded-[2px]',
  {
    variants: {
      tone: {
        success: 'bg-success/20 text-success',
        destructive: 'bg-destructive/20 text-destructive',
        info: 'bg-info/20 text-info',
        warning: 'bg-warning/20 text-warning',
        neutral: 'bg-surface-elevated text-muted-foreground border border-border',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
)

export type StatusChipProps = HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof chipVariants>

export function StatusChip({ className, tone, ...props }: StatusChipProps) {
  return <span className={cn(chipVariants({ tone }), className)} {...props} />
}
