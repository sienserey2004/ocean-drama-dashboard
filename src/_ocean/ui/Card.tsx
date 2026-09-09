import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean
  children: ReactNode
}

export function Card({ hoverable, className = '', children, ...rest }: CardProps) {
  return (
    <div
      className={`rounded-2xl bg-ocean-card-light dark:bg-ocean-card-dark border border-ocean-border-light dark:border-ocean-border-dark shadow-soft transition-all duration-300 ${hoverable ? 'hover:-translate-y-1 hover:border-primary' : ''} ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}

export function CardContent({ className = '', children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-5 ${className}`} {...rest}>
      {children}
    </div>
  )
}
