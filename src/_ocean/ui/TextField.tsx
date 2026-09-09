import { forwardRef } from 'react'
import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  startAdornment?: ReactNode
  endAdornment?: ReactNode
  fullWidth?: boolean
  containerClassName?: string
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, error, startAdornment, endAdornment, fullWidth, className = '', containerClassName = '', id, ...rest },
  ref
) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${containerClassName}`}>
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-xs font-semibold text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark">
          {label}
        </label>
      )}
      <div
        className={`flex items-center gap-2 rounded-xl border bg-ocean-surface-light dark:bg-ocean-surface-dark px-3.5 py-2.5 transition-colors ${
          error ? 'border-danger' : 'border-ocean-border-light dark:border-ocean-border-dark focus-within:border-primary'
        }`}
      >
        {startAdornment}
        <input
          ref={ref}
          id={inputId}
          className={`w-full bg-transparent text-sm text-ocean-text-primary-light dark:text-ocean-text-primary-dark placeholder:text-ocean-text-secondary-light dark:placeholder:text-ocean-text-secondary-dark outline-none ${className}`}
          {...rest}
        />
        {endAdornment}
      </div>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  )
})

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  fullWidth?: boolean
  containerClassName?: string
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { label, error, fullWidth, className = '', containerClassName = '', id, ...rest },
  ref
) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${containerClassName}`}>
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-xs font-semibold text-ocean-text-secondary-light dark:text-ocean-text-secondary-dark">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        className={`w-full rounded-xl border bg-ocean-surface-light dark:bg-ocean-surface-dark px-3.5 py-2.5 text-sm text-ocean-text-primary-light dark:text-ocean-text-primary-dark placeholder:text-ocean-text-secondary-light dark:placeholder:text-ocean-text-secondary-dark outline-none transition-colors ${
          error ? 'border-danger' : 'border-ocean-border-light dark:border-ocean-border-dark focus:border-primary'
        } ${className}`}
        {...rest}
      />
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  )
})
