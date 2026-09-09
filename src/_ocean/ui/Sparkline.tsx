import { useId } from 'react'

interface SparklineProps {
  data: number[]
  height?: number
  color?: string
  strokeWidth?: number
  className?: string
}

// Minimal hand-rolled replacement for the previous MUI charting library's LineChart —
// the app only ever rendered a single-series area sparkline with no axes/tooltip/legend,
// so a full charting library was never actually needed.
export function Sparkline({ data, height = 180, color = '#0EA5E9', strokeWidth = 4, className = '' }: SparklineProps) {
  const gradientId = useId()
  const width = 300

  if (!data.length) return null

  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const stepX = data.length > 1 ? width / (data.length - 1) : 0
  const pad = strokeWidth
  const points = data.map((value, i) => {
    const x = i * stepX
    const y = pad + (height - pad * 2) * (1 - (value - min) / range)
    return [x, y] as const
  })

  const linePath = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ')
  const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={`w-full ${className}`} style={{ height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.35} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
