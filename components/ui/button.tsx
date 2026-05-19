import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-accent',
  {
    variants: {
      variant: {
        primary: 'bg-accent text-accent-foreground hover:bg-accent-hover',
        secondary:
          'bg-transparent border border-border-strong text-foreground hover:bg-surface',
        ghost: 'bg-transparent text-foreground hover:bg-surface',
        destructive: 'bg-destructive text-foreground hover:opacity-90',
      },
      size: {
        sm: 'h-8 px-3 rounded-[2px]',
        md: 'h-10 px-4 rounded-[2px]',
        lg: 'h-12 px-6 rounded-[2px] text-base',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
}
