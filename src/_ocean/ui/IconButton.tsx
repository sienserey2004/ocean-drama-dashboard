import { forwardRef } from 'react'
import type { ButtonHTMLAttributes } from 'react'

type Size = 'sm' | 'md' | 'lg'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: Size
  active?: boolean
  /** Opt out of the default neutral color scheme when the caller needs a custom color. */
  plain?: boolean
}

const sizeClasses: Record<Size, string> = {
  sm: 'p-1.5',
  md: 'p-2',
  lg: 'p-3',
}

// Note: this app's tailwind.config.js sets `important: '#root'`, so every utility
// (including a caller's className) compiles to `!important`. That means a default
// color class defined here can win or lose against a caller's override unpredictably
// (tie broken by generated CSS order, not by prop precedence). To keep overrides
// reliable, the default color/hover scheme only applies when `plain` is not set —
// pass `plain` and your own color classes for any one-off color scheme.
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { size = 'md', active, plain, className = '', children, ...rest },
  ref
) {
  const colorScheme = plain
    ? ''
    : `text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark hover:bg-ocean-card-light dark:hover:bg-ocean-card-dark hover:text-ocean-text-primary-light dark:hover:text-ocean-text-primary-dark ${
        active ? 'bg-primary/10 text-primary' : ''
      }`

  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center rounded-full transition-colors duration-150 disabled:opacity-40 disabled:pointer-events-none ${colorScheme} ${sizeClasses[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
})
