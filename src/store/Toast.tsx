import { Check, Info, TriangleAlert, X } from 'lucide-react'
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { cn } from '../lib/cn'

type ToastKind = 'success' | 'info' | 'error'
interface ToastItem {
  id: number
  message: string
  kind: ToastKind
  action?: { label: string; onClick: () => void }
}

type ShowToast = (message: string, opts?: { kind?: ToastKind; action?: ToastItem['action'] }) => void

const Ctx = createContext<ShowToast>(() => {})
let counter = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: number) => setItems((prev) => prev.filter((t) => t.id !== id)), [])

  const show = useCallback<ShowToast>(
    (message, opts) => {
      const id = ++counter
      setItems((prev) => [...prev.slice(-2), { id, message, kind: opts?.kind ?? 'success', action: opts?.action }])
      window.setTimeout(() => dismiss(id), 3600)
    },
    [dismiss],
  )

  return (
    <Ctx.Provider value={show}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-20 z-[80] flex flex-col items-center gap-2 px-4 lg:bottom-6"
      >
        {items.map((t) => {
          const Icon = t.kind === 'success' ? Check : t.kind === 'error' ? TriangleAlert : Info
          return (
            <div
              key={t.id}
              role="status"
              className="dialog-in pointer-events-auto flex items-center gap-3 rounded-xl border border-line-strong bg-surface-2/95 py-2.5 pr-2 pl-3.5 text-sm shadow-2xl shadow-black/50 backdrop-blur"
            >
              <Icon
                size={16}
                className={cn(t.kind === 'success' && 'text-success', t.kind === 'error' && 'text-danger', t.kind === 'info' && 'text-muted')}
                aria-hidden
              />
              <span>{t.message}</span>
              {t.action && (
                <button
                  className="rounded-md px-2 py-1 font-medium text-accent-hover hover:bg-white/5"
                  onClick={() => {
                    t.action?.onClick()
                    dismiss(t.id)
                  }}
                >
                  {t.action.label}
                </button>
              )}
              <button className="rounded-md p-1 text-faint hover:bg-white/5 hover:text-fg" onClick={() => dismiss(t.id)} aria-label="Dismiss">
                <X size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </Ctx.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(Ctx)
