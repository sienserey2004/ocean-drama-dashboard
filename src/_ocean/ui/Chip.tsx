import type { ReactNode } from 'react'

type Color = 'primary' | 'danger' | 'success' | 'warning' | 'default'
type Size = 'sm' | 'md'

interface ChipProps {
  label: ReactNode
  color?: Color
  size?: Size
  icon?: ReactNode
  onDelete?: () => void
  className?: string
}

const colorClasses: Record<Color, string> = {
  primary: 'bg-primary/10 text-primary',
  danger: 'bg-danger/10 text-danger',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  default: 'bg-ocean-card-light dark:bg-ocean-card-dark text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark',
}

export function Chip({ label, color = 'default', size = 'md', icon, onDelete, className = '' }: ChipProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-sm font-semibold ${
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
      } ${colorClasses[color]} ${className}`}
    >
      {icon}
      {label}
      {onDelete && (
        <button onClick={onDelete} className="ml-0.5 opacity-70 hover:opacity-100" aria-label="Remove">
          ×
        </button>
      )}
    </span>
  )
}

export function Badge({ children, count, color = 'danger' }: { children: ReactNode; count?: number; color?: Color }) {
  return (
    <span className="relative inline-flex">
      {children}
      {!!count && count > 0 && (
        <span
          className={`absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white ${
            color === 'danger' ? 'bg-danger' : 'bg-primary'
          }`}
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </span>
  )
}
