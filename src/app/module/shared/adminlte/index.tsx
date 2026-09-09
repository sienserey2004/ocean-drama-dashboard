/**
 * AdminLTE 3 building blocks.
 *
 * Thin wrappers over the class names in `adminlte.css` so pages read like
 * AdminLTE markup without every file hand-writing `<div className="small-box bg-info">`.
 * Wrap any page that uses these in <AdminLTE> so the scoped styles apply.
 */
import { useEffect, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, X } from 'lucide-react'
import './adminlte.css'

/** AdminLTE's contextual color names. */
export type LteColor =
  | 'primary' | 'info' | 'success' | 'warning' | 'danger'
  | 'secondary' | 'purple' | 'indigo' | 'teal' | 'orange' | 'maroon' | 'navy'

/** Scope wrapper — every AdminLTE style is nested under `.adminlte`. */
export function AdminLTE({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`adminlte ${className}`}>{children}</div>
}

/** Page title + breadcrumb trail, AdminLTE's `content-header`. */
export function ContentHeader({
  title,
  description,
  breadcrumb = [],
  actions,
}: {
  title: string
  description?: string
  breadcrumb?: { label: string; to?: string }[]
  actions?: ReactNode
}) {
  return (
    <div className="content-header">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1>{title}</h1>
          {description && <p className="description">{description}</p>}
        </div>
        <div className="flex items-center gap-3">
          {actions}
          {breadcrumb.length > 0 && (
            <ol className="breadcrumb">
              {breadcrumb.map((crumb, i) => {
                const last = i === breadcrumb.length - 1
                return (
                  <li key={crumb.label} className={`breadcrumb-item ${last ? 'active' : ''}`}>
                    {crumb.to && !last ? <Link to={crumb.to}>{crumb.label}</Link> : crumb.label}
                  </li>
                )
              })}
            </ol>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * The signature AdminLTE stat tile: solid color, oversized number, ghosted
 * icon in the corner, optional footer link.
 */
export function SmallBox({
  color = 'info',
  value,
  label,
  icon,
  footerText,
  to,
  onClick,
}: {
  color?: LteColor
  value: ReactNode
  label: string
  icon?: ReactNode
  footerText?: string
  to?: string
  onClick?: () => void
}) {
  const footer = footerText && (
    <>
      {footerText} <ArrowRight size={14} />
    </>
  )

  return (
    <div className={`small-box lte-bg-${color}`}>
      <div className="inner">
        <h3>{value}</h3>
        <p>{label}</p>
      </div>
      {icon && <div className="icon">{icon}</div>}
      {footerText &&
        (to ? (
          <Link to={to} className="small-box-footer">{footer}</Link>
        ) : (
          <button type="button" className="small-box-footer" onClick={onClick}>{footer}</button>
        ))}
    </div>
  )
}

/** White tile with a colored icon block on the left. */
export function InfoBox({
  color = 'info',
  icon,
  text,
  number,
  progress,
  progressDescription,
}: {
  color?: LteColor
  icon: ReactNode
  text: string
  number: ReactNode
  progress?: number
  progressDescription?: string
}) {
  return (
    <div className="info-box">
      <span className={`info-box-icon lte-bg-${color}`}>{icon}</span>
      <div className="info-box-content">
        <span className="info-box-text">{text}</span>
        <span className="info-box-number">{number}</span>
        {progress !== undefined && (
          <>
            <div className="progress">
              <div className={`progress-bar lte-bg-${color}`} style={{ width: `${Math.min(100, progress)}%` }} />
            </div>
            {progressDescription && <span className="progress-description">{progressDescription}</span>}
          </>
        )}
      </div>
    </div>
  )
}

/** AdminLTE card. `outline` draws the 3px accent stripe on top. */
export function AdminCard({
  title,
  icon,
  tools,
  outline,
  footer,
  bodyClassName = '',
  className = '',
  children,
}: {
  title?: ReactNode
  icon?: ReactNode
  tools?: ReactNode
  outline?: LteColor
  footer?: ReactNode
  bodyClassName?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={`card ${outline ? `card-outline card-${outline}` : ''} ${className}`}>
      {title && (
        <div className="card-header">
          <h3 className="card-title">
            {icon}
            {title}
          </h3>
          {tools && <div className="card-tools">{tools}</div>}
        </div>
      )}
      <div className={`card-body ${bodyClassName}`}>{children}</div>
      {footer && <div className="card-footer">{footer}</div>}
    </div>
  )
}

/** Small colored pill, AdminLTE's `badge`. */
export function LteBadge({ color = 'secondary', children }: { color?: LteColor; children: ReactNode }) {
  return <span className={`badge lte-bg-${color}`}>{children}</span>
}

/** Horizontal bar used inside cards and table cells. */
export function ProgressBar({
  value,
  color = 'primary',
  size = 'sm',
}: {
  value: number
  color?: LteColor
  size?: 'xs' | 'sm' | 'md'
}) {
  return (
    <div className={`progress ${size === 'md' ? '' : `progress-${size}`}`}>
      <div className={`progress-bar lte-bg-${color}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  )
}

/**
 * AdminLTE / Bootstrap pagination. Renders first, last and current ± 1 with
 * ellipses for the gaps — the same range logic MUI's Pagination uses.
 */
export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number
  totalPages: number
  onChange: (page: number) => void
}) {
  if (totalPages <= 1) return null

  const range: (number | '...')[] = [1]
  const left = Math.max(2, page - 1)
  const right = Math.min(totalPages - 1, page + 1)
  if (left > 2) range.push('...')
  for (let i = left; i <= right; i++) range.push(i)
  if (right < totalPages - 1) range.push('...')
  if (totalPages > 1) range.push(totalPages)

  return (
    <ul className="pagination">
      <li className={`page-item ${page <= 1 ? 'disabled' : ''}`}>
        <button type="button" className="page-link" onClick={() => onChange(page - 1)} aria-label="Previous page">
          «
        </button>
      </li>
      {range.map((p, i) =>
        p === '...' ? (
          <li key={`gap-${i}`} className="page-item disabled">
            <span className="page-link">…</span>
          </li>
        ) : (
          <li key={p} className={`page-item ${p === page ? 'active' : ''}`}>
            <button type="button" className="page-link" onClick={() => onChange(p)}>
              {p}
            </button>
          </li>
        )
      )}
      <li className={`page-item ${page >= totalPages ? 'disabled' : ''}`}>
        <button type="button" className="page-link" onClick={() => onChange(page + 1)} aria-label="Next page">
          »
        </button>
      </li>
    </ul>
  )
}

/**
 * AdminLTE modal.
 *
 * Rendered inline rather than through a portal, so it must sit inside an
 * <AdminLTE> wrapper. `.lte-modal-backdrop` is z-index 1400, which is what
 * puts it above the shell chrome (header 1100, sidebar 1200) — a portalled
 * dialog at a lower z-index disappears behind them.
 *
 * Put action buttons in a `<div className="modal-footer">` as the last child;
 * the stylesheet bleeds it to the body edges.
 */
export function LteDialog({
  open,
  title,
  icon,
  onClose,
  size = 'md',
  bodyClassName = '',
  children,
}: {
  open: boolean
  title: ReactNode
  icon?: ReactNode
  onClose: () => void
  size?: 'md' | 'lg'
  bodyClassName?: string
  children: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="lte-modal-backdrop"
      role="presentation"
      onMouseDown={e => e.target === e.currentTarget && onClose()}
    >
      <section
        className={`lte-modal-dialog lte-modal-${size}`}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
      >
        <div className="lte-modal-header">
          <h3>{icon}{title}</h3>
          <button type="button" className="btn-tool" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className={`lte-modal-body ${bodyClassName}`}>{children}</div>
      </section>
    </div>
  )
}
