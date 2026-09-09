interface TabItem {
  value: string
  label: string
}

interface TabsProps {
  items: TabItem[]
  value: string
  onChange: (value: string) => void
  className?: string
}

export function Tabs({ items, value, onChange, className = '' }: TabsProps) {
  return (
    <div className={`flex gap-1 border-b border-ocean-border-light dark:border-ocean-border-dark ${className}`}>
      {items.map((item) => (
        <button
          key={item.value}
          onClick={() => onChange(item.value)}
          className={`relative px-4 py-2.5 text-sm font-semibold transition-colors ${
            value === item.value
              ? 'text-primary'
              : 'text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark hover:text-ocean-text-primary-light dark:hover:text-ocean-text-primary-dark'
          }`}
        >
          {item.label}
          {value === item.value && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />}
        </button>
      ))}
    </div>
  )
}
