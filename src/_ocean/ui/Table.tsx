import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react'

// Always scrolls horizontally on narrow viewports — fixes the audit finding
// that tables had no min-width/overflow handling on mobile.
export function TableContainer({ children, minWidth = 500, className = '' }: { children: ReactNode; minWidth?: number; className?: string }) {
  return (
    <div className={`overflow-x-auto rounded-2xl border border-ocean-border-light dark:border-ocean-border-dark ${className}`}>
      <div style={{ minWidth }}>{children}</div>
    </div>
  )
}

export function Table({ children, className = '' }: HTMLAttributes<HTMLTableElement>) {
  return <table className={`w-full border-collapse text-sm ${className}`}>{children}</table>
}

export function THead({ children }: { children: ReactNode }) {
  return <thead className="bg-ocean-background-light dark:bg-ocean-background-dark">{children}</thead>
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-ocean-border-light dark:divide-ocean-border-dark">{children}</tbody>
}

export function TR({ children, className = '', ...rest }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={`hover:bg-ocean-background-light dark:hover:bg-ocean-background-dark ${className}`} {...rest}>
      {children}
    </tr>
  )
}

export function TH({ children, className = '', ...rest }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={`px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark ${className}`}
      {...rest}
    >
      {children}
    </th>
  )
}

export function TD({ children, className = '', ...rest }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={`px-4 py-3 text-ocean-text-primary-light dark:text-ocean-text-primary-dark ${className}`} {...rest}>
      {children}
    </td>
  )
}
