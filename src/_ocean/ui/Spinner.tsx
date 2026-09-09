interface SpinnerProps {
  size?: number
  className?: string
}

export function Spinner({ size = 24, className = '' }: SpinnerProps) {
  return (
    <svg
      className={`animate-spin text-current ${className}`}
      style={{ width: size, height: size }}
      viewBox="0 0 24 24"
      fill="none"
      aria-label="Loading"
      role="status"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

export function FullPageSpinner() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-ocean-background-light dark:bg-ocean-background-dark">
      <Spinner size={40} className="text-primary" />
    </div>
  )
}

// Used as a Suspense fallback for lazy-loaded routes.
export function RouteLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Spinner size={32} className="text-primary" />
    </div>
  )
}
