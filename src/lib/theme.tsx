import { Monitor, Moon, Sun } from 'lucide-react'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { Popover, CheckOption } from '../components/ui'
import { useMediaQuery } from './hooks'
import { readJSON, writeJSON } from './storage'

export type ThemePref = 'system' | 'light' | 'dark'

const Ctx = createContext<{ pref: ThemePref; resolved: 'light' | 'dark'; setPref: (p: ThemePref) => void }>({
  pref: 'system',
  resolved: 'dark',
  setPref: () => {},
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [pref, setPrefState] = useState<ThemePref>(() => readJSON<ThemePref>('theme', 'system'))
  const systemDark = useMediaQuery('(prefers-color-scheme: dark)')
  const resolved = pref === 'system' ? (systemDark ? 'dark' : 'light') : pref

  useEffect(() => {
    document.documentElement.dataset.theme = resolved
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === 'dark' ? '#0B0B0D' : '#F6F6F3')
  }, [resolved])

  const setPref = (p: ThemePref) => {
    setPrefState(p)
    writeJSON('theme', p)
  }
  return <Ctx.Provider value={{ pref, resolved, setPref }}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => useContext(Ctx)

const OPTIONS: { id: ThemePref; label: string; Icon: typeof Sun }[] = [
  { id: 'light', label: 'Light', Icon: Sun },
  { id: 'dark', label: 'Dark', Icon: Moon },
  { id: 'system', label: 'System', Icon: Monitor },
]

/** Compact theme picker for the top bar. */
export function ThemeToggle() {
  const { pref, resolved, setPref } = useTheme()
  const Icon = resolved === 'dark' ? Moon : Sun
  return (
    <Popover
      align="right"
      bare
      label={
        <>
          <Icon size={17} aria-hidden />
          <span className="sr-only">Theme: {pref}</span>
        </>
      }
    >
      {(close) => (
        <div role="radiogroup" aria-label="Theme" className="min-w-[160px]">
          {OPTIONS.map(({ id, label, Icon: I }) => (
            <CheckOption
              key={id}
              type="radio"
              name="theme"
              checked={pref === id}
              onChange={() => {
                setPref(id)
                close()
              }}
            >
              <I size={14} className="text-muted" aria-hidden /> {label}
            </CheckOption>
          ))}
        </div>
      )}
    </Popover>
  )
}

/** Segmented control version, used in the mobile drawer. */
export function ThemeSegmented() {
  const { pref, setPref } = useTheme()
  return (
    <div className="grid grid-cols-3 gap-1 rounded-xl border border-line bg-fg/[0.03] p-1" role="radiogroup" aria-label="Theme">
      {OPTIONS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={pref === id}
          onClick={() => setPref(id)}
          className={`flex h-9 items-center justify-center gap-1.5 rounded-lg text-[13px] font-medium transition-colors ${pref === id ? 'bg-surface text-fg shadow-sm ring-1 ring-line' : 'text-muted hover:text-fg'}`}
        >
          <Icon size={14} aria-hidden /> {label}
        </button>
      ))}
    </div>
  )
}
