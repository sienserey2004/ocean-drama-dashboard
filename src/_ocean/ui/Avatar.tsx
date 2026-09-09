import type { ReactNode } from 'react'

type Size = 'sm' | 'md' | 'lg' | 'xl'

interface AvatarProps {
  src?: string | null
  alt?: string
  children?: ReactNode
  size?: Size
  className?: string
}

const sizePx: Record<Size, number> = { sm: 28, md: 36, lg: 48, xl: 64 }

export function Avatar({ src, alt = '', children, size = 'md', className = '' }: AvatarProps) {
  const px = sizePx[size]
  const style = { width: px, height: px }

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        style={style}
        className={`rounded-full object-cover shrink-0 ${className}`}
      />
    )
  }

  return (
    <div
      style={style}
      className={`flex shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary font-semibold ${className}`}
    >
      {children ?? (alt ? alt.charAt(0).toUpperCase() : '?')}
    </div>
  )
}
