import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react'
import { en, type MessageKey } from './en'

export type Locale = 'en' | 'vi'

// Register additional dictionaries here, e.g. `vi: () => import('./vi')`.
const dictionaries: Record<Locale, Partial<Record<MessageKey, string>>> = {
  en,
  vi: {},
}

type Vars = Record<string, string | number>
export type TFunction = (key: MessageKey, vars?: Vars) => string

interface I18nValue {
  locale: Locale
  t: TFunction
  formatNumber: (n: number) => string
  formatDate: (iso: string) => string
  formatRelative: (iso: string) => string
}

const I18nContext = createContext<I18nValue | null>(null)

function interpolate(message: string, vars?: Vars) {
  if (!vars) return message
  return message.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`))
}

export function I18nProvider({ locale = 'en', children }: { locale?: Locale; children: ReactNode }) {
  const t = useCallback<TFunction>(
    (key, vars) => interpolate(dictionaries[locale][key] ?? en[key] ?? key, vars),
    [locale],
  )

  const value = useMemo<I18nValue>(() => {
    const tag = locale === 'vi' ? 'vi-VN' : 'en-US'
    const compact = new Intl.NumberFormat(tag, { notation: 'compact', maximumFractionDigits: 1 })
    const date = new Intl.DateTimeFormat(tag, { month: 'short', day: 'numeric', year: 'numeric' })
    const rel = new Intl.RelativeTimeFormat(tag, { numeric: 'auto' })
    return {
      locale,
      t,
      formatNumber: (n) => compact.format(n),
      formatDate: (iso) => date.format(new Date(iso)),
      formatRelative: (iso) => {
        const diff = (new Date(iso).getTime() - Date.now()) / 1000
        const abs = Math.abs(diff)
        if (abs < 60) return rel.format(Math.round(diff), 'second')
        if (abs < 3600) return rel.format(Math.round(diff / 60), 'minute')
        if (abs < 86400) return rel.format(Math.round(diff / 3600), 'hour')
        if (abs < 86400 * 30) return rel.format(Math.round(diff / 86400), 'day')
        return date.format(new Date(iso))
      },
    }
  }, [locale, t])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider')
  return ctx
}
