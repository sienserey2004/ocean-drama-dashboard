import hotToast from 'react-hot-toast'

const originalError = hotToast.error

const dedupedError: typeof hotToast.error = (message, options) => {
  const messageKey = typeof message === 'string'
    ? message.trim().toLowerCase().replace(/\s+/g, ' ')
    : undefined
  const stableId = messageKey ? `error:${messageKey}` : options?.id

  // Some flows replace a loading toast by passing its ID. Remove that loading
  // toast before switching to the message-based ID used by every error caller.
  if (options?.id && stableId !== options.id) {
    hotToast.remove(options.id)
  }

  return originalError(message, {
    ...options,
    id: stableId,
  })
}

// Keep the regular react-hot-toast API while giving every error message a
// stable ID. Repeating the same error updates its existing toast instead of
// adding another one to the stack.
const toast = Object.assign(
  ((...args: Parameters<typeof hotToast>) => hotToast(...args)) as typeof hotToast,
  hotToast,
  { error: dedupedError }
)

export default toast
