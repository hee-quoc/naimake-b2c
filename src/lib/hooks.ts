import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (cb: () => void) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', cb)
      return () => mql.removeEventListener('change', cb)
    },
    [query],
  )
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false)
}

export const useReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)')
/** True on devices whose primary pointer can hover (mouse / trackpad). */
export const useCanHover = () => useMediaQuery('(hover: hover) and (pointer: fine)')

/** Tracks whether an element is in the viewport. */
export function useInView<T extends Element>(rootMargin = '0px'): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin })
    io.observe(el)
    return () => io.disconnect()
  }, [rootMargin])
  return [ref, inView]
}

export function useElementWidth<T extends Element>(): [React.RefObject<T | null>, number] {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, width]
}

export interface Player {
  time: number
  playing: boolean
  play: () => void
  pause: () => void
  toggle: () => void
  seek: (t: number) => void
}

/** A requestAnimationFrame clock that drives template previews. */
export function usePlayer(duration: number, { loop = true, initial = 0 } = {}): Player {
  const [time, setTime] = useState(initial)
  const [playing, setPlaying] = useState(false)
  const timeRef = useRef(initial)

  useEffect(() => {
    if (!playing) return
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      let next = timeRef.current + dt
      if (next >= duration) {
        if (loop) next = next % duration
        else {
          next = duration
          setPlaying(false)
        }
      }
      timeRef.current = next
      setTime(next)
      if (next < duration || loop) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, duration, loop])

  const seek = useCallback(
    (t: number) => {
      const clamped = Math.max(0, Math.min(duration, t))
      timeRef.current = clamped
      setTime(clamped)
    },
    [duration],
  )
  const play = useCallback(() => {
    if (timeRef.current >= duration) seek(0)
    setPlaying(true)
  }, [duration, seek])
  const pause = useCallback(() => setPlaying(false), [])
  const toggle = useCallback(() => (playing ? pause() : play()), [playing, pause, play])

  return { time, playing, play, pause, toggle, seek }
}

/** Calls `onEscape` when Escape is pressed while `active`. */
export function useEscape(active: boolean, onEscape: () => void) {
  useEffect(() => {
    if (!active) return
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onEscape()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [active, onEscape])
}
