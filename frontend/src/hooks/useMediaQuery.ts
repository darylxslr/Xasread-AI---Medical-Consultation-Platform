import { useState, useEffect } from 'react'

export function useMediaQuery(query: string): boolean {
  const breakpoint = parseInt(query.match(/\d+/)?.[0] || '640', 10)
  const isMaxWidth = query.includes('max-width')

  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false
    return isMaxWidth ? window.innerWidth <= breakpoint : window.innerWidth >= breakpoint
  })

  useEffect(() => {
    const handler = () => {
      setMatches(isMaxWidth ? window.innerWidth <= breakpoint : window.innerWidth >= breakpoint)
    }
    handler()
    window.addEventListener('resize', handler)

    const mq = window.matchMedia(query)
    const mqHandler = (e: MediaQueryListEvent) => setMatches(e.matches)
    mq.addEventListener('change', mqHandler)

    return () => {
      window.removeEventListener('resize', handler)
      mq.removeEventListener('change', mqHandler)
    }
  }, [breakpoint, isMaxWidth, query])

  return matches
}
