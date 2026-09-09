import { forwardRef } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Spinner } from './Spinner'

type Variant = 'contained' | 'outlined' | 'text'
type Color = 'primary' | 'danger' | 'default'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  color?: Color
  size?: Size
  fullWidth?: boolean
  loading?: boolean
  startIcon?: ReactNode
  endIcon?: ReactNode
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-6 py-2 text-sm gap-2',
  lg: 'px-8 py-3 text-base gap-2',
}

function toneClasses(variant: Variant, color: Color) {
  const solid = color === 'danger' ? 'bg-danger' : color === 'default' ? 'bg-ocean-card-light dark:bg-ocean-card-dark' : 'bg-primary'
  const solidHover = color === 'danger' ? 'hover:bg-danger/90' : color === 'default' ? 'hover:bg-ocean-border-light dark:hover:bg-ocean-border-dark' : 'hover:bg-primary-dark'
  const solidText = color === 'default' ? 'text-ocean-text-primary-light dark:text-ocean-text-primary-dark' : 'text-white'
  const outlineColor = color === 'danger' ? 'border-danger text-danger hover:bg-danger/10' : color === 'default' ? 'border-ocean-border-light dark:border-ocean-border-dark text-ocean-text-primary-light dark:text-ocean-text-primary-dark hover:bg-ocean-card-light dark:hover:bg-ocean-card-dark' : 'border-primary text-primary hover:bg-primary/10'
  const textColor = color === 'danger' ? 'text-danger hover:bg-danger/10' : color === 'default' ? 'text-ocean-text-primary-light dark:text-ocean-text-primary-dark hover:bg-ocean-card-light dark:hover:bg-ocean-card-dark' : 'text-primary hover:bg-primary/10'

  if (variant === 'outlined') return `border ${outlineColor}`
  if (variant === 'text') return textColor
  return `${solid} ${solidHover} ${solidText}`
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'contained', color = 'primary', size = 'md', fullWidth, loading, disabled, startIcon, endIcon, className = '', children, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed ${sizeClasses[size]} ${toneClasses(variant, color)} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {loading ? <Spinner size={16} /> : startIcon}
      {children}
      {!loading && endIcon}
    </button>
  )
})
