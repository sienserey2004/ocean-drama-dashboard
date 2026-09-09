import { useState } from 'react'
import type { ReactNode } from 'react'

interface TooltipProps {
  title: string
  children: ReactNode
  placement?: 'top' | 'bottom' | 'left' | 'right'
}

const placementClasses: Record<NonNullable<TooltipProps['placement']>, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
}

export function Tooltip({ title, children, placement = 'top' }: TooltipProps) {
  const [open, setOpen] = useState(false)

  if (!title) return <>{children}</>

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && (
        <span
          role="tooltip"
          className={`pointer-events-none absolute z-50 whitespace-nowrap rounded-md bg-ocean-text-primary-dark dark:bg-ocean-card-dark px-2 py-1 text-xs font-medium text-white shadow-soft ${placementClasses[placement]}`}
        >
          {title}
        </span>
      )}
    </span>
  )
}
