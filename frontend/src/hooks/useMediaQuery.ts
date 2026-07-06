import { useState, useEffect, useLayoutEffect } from 'react'

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    const mq = window.matchMedia(query)
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [query])

  // DevTools emulation fallback: resize event fires when toggling device mode
  useLayoutEffect(() => {
    const onResize = () => setMatches(window.matchMedia(query).matches)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [query])

  return matches
}
