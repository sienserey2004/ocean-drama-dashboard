import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

interface MenuProps {
  open: boolean
  onClose: () => void
  anchorRef?: React.RefObject<HTMLElement | null>
  children: ReactNode
  align?: 'left' | 'right'
  className?: string
}

export function Menu({ open, onClose, anchorRef, children, align = 'right', className = '' }: MenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onClickOutside(e: MouseEvent) {
      const target = e.target as Node
      if (menuRef.current?.contains(target)) return
      if (anchorRef?.current?.contains(target)) return
      onClose()
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open, onClose, anchorRef])

  if (!open) return null

  return (
    <div
      ref={menuRef}
      className={`absolute z-50 mt-2 min-w-[180px] animate-zoom-in rounded-2xl border border-ocean-border-light dark:border-ocean-border-dark bg-ocean-card-light dark:bg-ocean-card-dark py-1.5 shadow-soft ${
        align === 'right' ? 'right-0' : 'left-0'
      } ${className}`}
    >
      {children}
    </div>
  )
}

export function MenuItem({ children, onClick, danger, className = '' }: { children: ReactNode; onClick?: () => void; danger?: boolean; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium transition-colors ${
        danger
          ? 'text-danger hover:bg-danger/10'
          : 'text-ocean-text-primary-light dark:text-ocean-text-primary-dark hover:bg-ocean-background-light dark:hover:bg-ocean-background-dark'
      } ${className}`}
    >
      {children}
    </button>
  )
}
