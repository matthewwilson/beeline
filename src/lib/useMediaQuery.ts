import { useEffect, useState } from 'react'

// The one place JS knows the layout breakpoint. Keep in sync with the `--desktop`
// custom media in src/styles/media.css (the single CSS source).
const DESKTOP_QUERY = '(min-width: 820px)'

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' && 'matchMedia' in window ? window.matchMedia(query).matches : false,
  )

  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = (): void => setMatches(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])

  return matches
}

export function useIsDesktop(): boolean {
  return useMediaQuery(DESKTOP_QUERY)
}
