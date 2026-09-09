type Color = 'primary' | 'danger' | 'success' | 'warning'

interface LinearProgressBarProps {
  value: number
  color?: Color
  className?: string
}

const colorClasses: Record<Color, string> = {
  primary: 'bg-primary',
  danger: 'bg-danger',
  success: 'bg-success',
  warning: 'bg-warning',
}

export function LinearProgressBar({ value, color = 'primary', className = '' }: LinearProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))
  return (
    <div className={`h-1.5 w-full overflow-hidden rounded-full bg-ocean-border-light dark:bg-ocean-border-dark ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-500 ${colorClasses[color]}`}
        style={{ width: `${clamped}%` }}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  )
}
