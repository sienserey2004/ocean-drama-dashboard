import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { IconButton } from './IconButton'

interface ModalProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  maxWidth?: 'sm' | 'md' | 'lg'
}

const widthClasses = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' }

export function Modal({ open, onClose, children, maxWidth = 'sm' }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center overflow-y-auto p-4">
      <div className="fixed inset-0 bg-black/50 animate-fade-in" onClick={onClose} />
      <div
        className={`relative my-auto w-full ${widthClasses[maxWidth]} animate-zoom-in rounded-3xl bg-ocean-card-light dark:bg-ocean-card-dark border border-ocean-border-light dark:border-ocean-border-dark shadow-soft`}
      >
        {children}
      </div>
    </div>,
    document.body
  )
}

export function ModalHeader({ children, onClose }: { children: ReactNode; onClose?: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3 px-6 pt-6">
      <h2 className="text-lg font-bold text-ocean-text-primary-light dark:text-ocean-text-primary-dark">{children}</h2>
      {onClose && (
        <IconButton size="sm" onClick={onClose} aria-label="Close">
          <X size={18} />
        </IconButton>
      )}
    </div>
  )
}

export function ModalBody({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`px-6 py-4 text-sm text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark ${className}`}>{children}</div>
}

export function ModalFooter({ children }: { children: ReactNode }) {
  return <div className="flex items-center justify-end gap-3 px-6 pb-6 pt-2">{children}</div>
}
