import { forwardRef } from 'react'
import type { SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  fullWidth?: boolean
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, fullWidth, className = '', children, id, ...rest },
  ref
) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label htmlFor={selectId} className="mb-1.5 block text-xs font-semibold text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={`w-full appearance-none rounded-xl border border-ocean-border-light dark:border-ocean-border-dark bg-ocean-surface-light dark:bg-ocean-surface-dark px-3.5 py-2.5 pr-9 text-sm text-ocean-text-primary-light dark:text-ocean-text-primary-dark outline-none focus:border-primary ${className}`}
          {...rest}
        >
          {children}
        </select>
        <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark" />
      </div>
    </div>
  )
})
