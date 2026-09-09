interface DividerProps {
  className?: string
  vertical?: boolean
}

export function Divider({ className = '', vertical }: DividerProps) {
  if (vertical) {
    return <div className={`w-px self-stretch bg-ocean-border-light dark:bg-ocean-border-dark ${className}`} />
  }
  return <hr className={`border-t border-ocean-border-light dark:border-ocean-border-dark ${className}`} />
}
