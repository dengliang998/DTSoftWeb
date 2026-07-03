const debounceByFrame = (fn) => {
  let frame

  return (...args) => {
    if (frame) {
      cancelAnimationFrame(frame)
    }

    frame = requestAnimationFrame(() => {
      fn(...args)
    })
  }
}

export const installResizeObserverPatch = () => {
  if (typeof window === 'undefined') return

  const OriginalResizeObserver = window.ResizeObserver
  if (OriginalResizeObserver) {
    window.ResizeObserver = class extends OriginalResizeObserver {
      constructor(callback) {
        super(debounceByFrame(callback))
      }
    }
  }

  const originalError = console.error
  console.error = function (...args) {
    if (args[0] && typeof args[0] === 'string' && args[0].includes('ResizeObserver loop')) {
      return
    }
    originalError.apply(console, args)
  }
}
