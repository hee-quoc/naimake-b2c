import { X } from 'lucide-react'
import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { Link, type LinkProps } from 'react-router-dom'
import { cn } from '../lib/cn'
import { useEscape } from '../lib/hooks'
import { photoUrl } from '../lib/media'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
type Size = 'sm' | 'md' | 'lg'

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-white font-semibold hover:bg-accent-hover',
  secondary: 'border border-line-strong bg-surface text-fg hover:bg-surface-2 hover:border-fg/25',
  outline: 'border border-line-strong bg-transparent text-fg hover:bg-fg/[0.05] hover:border-fg/25',
  ghost: 'text-muted hover:text-fg hover:bg-fg/[0.06]',
  danger: 'bg-danger text-white hover:bg-danger/90',
}
const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-lg',
  lg: 'h-12 px-5 text-[15px] gap-2 rounded-lg',
}

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', extra?: string) {
  return cn(
    'inline-flex shrink-0 items-center justify-center font-medium whitespace-nowrap transition-colors duration-200 disabled:opacity-50',
    variants[variant],
    sizes[size],
    extra,
  )
}

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }
>(function Button({ variant = 'primary', size = 'md', className, type = 'button', ...rest }, ref) {
  return <button ref={ref} type={type} className={buttonClass(variant, size, className)} {...rest} />
})

export function ButtonLink({ variant = 'primary', size = 'md', className, ...rest }: LinkProps & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...rest} />
}

export function IconButton({
  label,
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-muted transition-colors duration-200 hover:bg-fg/[0.07] hover:text-fg',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}

export function Badge({ tone = 'neutral', children, className }: { tone?: 'neutral' | 'accent' | 'premium' | 'demo'; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] leading-4 font-medium',
        tone === 'neutral' && 'bg-fg/[0.08] text-muted',
        tone === 'accent' && 'bg-accent-soft text-accent-ink',
        tone === 'premium' && 'bg-premium/12 text-premium',
        tone === 'demo' && 'border border-dashed border-fg/20 text-muted',
        className,
      )}
    >
      {children}
    </span>
  )
}

export function Avatar({ photo, name, size = 24, className }: { photo: string; name: string; size?: number; className?: string }) {
  return (
    <img
      src={photoUrl(photo, size * 3, size * 3)}
      alt={name}
      width={size}
      height={size}
      loading="lazy"
      className={cn('shrink-0 rounded-full bg-surface-3 object-cover', className)}
      style={{ width: size, height: size }}
    />
  )
}

/** NAIMAKE symbol: electric-blue tile, play-shaped "N" and an orange spark. */
export function BrandMark({ size = 22, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="8" fill="#3B6FFF" />
      <path d="M10 22.5V9.5l12 13V9.5" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="25" cy="7" r="3.2" fill="#FF6B2C" stroke="#3B6FFF" strokeWidth="1.2" />
    </svg>
  )
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 font-display text-[16px] font-bold tracking-[0.06em] text-fg', className)}>
      <BrandMark />
      NAIMAKE
    </span>
  )
}

/** Locks body scroll and traps focus inside `ref` while mounted. */
function useModal(ref: React.RefObject<HTMLElement | null>, onClose: () => void) {
  useEscape(true, onClose)
  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const el = ref.current
    const focusables = () =>
      Array.from(el?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') ?? []).filter(
        (n) => !n.hasAttribute('disabled'),
      )
    ;(el?.querySelector<HTMLElement>('[data-autofocus]') ?? focusables()[0] ?? el)?.focus()
    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !el) return
      const f = focusables()
      if (!f.length) return
      const first = f[0]
      const last = f[f.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', trap)
    return () => {
      document.removeEventListener('keydown', trap)
      document.body.style.overflow = prevOverflow
      prevFocus?.focus?.()
    }
  }, [ref])
}

export function Dialog({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'sm',
  badge,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md'
  badge?: ReactNode
}) {
  if (!open) return null
  return createPortal(
    <DialogInner onClose={onClose} title={title} footer={footer} size={size} badge={badge}>
      {children}
    </DialogInner>,
    document.body,
  )
}

function DialogInner({ onClose, title, children, footer, size, badge }: Omit<Parameters<typeof Dialog>[0], 'open'>) {
  const ref = useRef<HTMLDivElement>(null)
  const id = useId()
  useModal(ref, onClose)
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div className="fade-in absolute inset-0 bg-scrim backdrop-blur-[2px]" onClick={onClose} />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        tabIndex={-1}
        className={cn(
          'dialog-in relative w-full rounded-t-2xl border border-line-strong bg-surface shadow-[0_24px_60px_-16px_rgb(0_0_0/0.45)] sm:rounded-2xl',
          size === 'sm' ? 'sm:max-w-md' : 'sm:max-w-xl',
        )}
      >
        <div className="flex items-center justify-between gap-3 px-5 pt-5">
          <div className="flex items-center gap-2">
            <h2 id={id} className="text-[17px] font-semibold tracking-tight">
              {title}
            </h2>
            {badge}
          </div>
          <IconButton label="Close" onClick={onClose} className="-mr-2">
            <X size={18} />
          </IconButton>
        </div>
        <div className="px-5 pt-3 pb-5 text-sm text-muted">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line px-5 py-4">{footer}</div>}
      </div>
    </div>
  )
}

/** Bottom sheet on mobile, left drawer when `side="left"`. */
export function Sheet({
  open,
  onClose,
  title,
  side = 'bottom',
  children,
  footer,
}: {
  open: boolean
  onClose: () => void
  title: string
  side?: 'bottom' | 'left'
  children: ReactNode
  footer?: ReactNode
}) {
  if (!open) return null
  return createPortal(
    <SheetInner onClose={onClose} title={title} side={side} footer={footer}>
      {children}
    </SheetInner>,
    document.body,
  )
}

function SheetInner({ onClose, title, side, children, footer }: Omit<Parameters<typeof Sheet>[0], 'open'>) {
  const ref = useRef<HTMLDivElement>(null)
  const id = useId()
  useModal(ref, onClose)
  return (
    <div className="fixed inset-0 z-[70]">
      <div className="fade-in absolute inset-0 bg-scrim" onClick={onClose} />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        tabIndex={-1}
        className={cn(
          'absolute flex flex-col border-line-strong bg-surface shadow-2xl',
          side === 'bottom'
            ? 'sheet-up inset-x-0 bottom-0 max-h-[85dvh] rounded-t-2xl border-t'
            : 'drawer-in inset-y-0 left-0 w-[min(320px,86vw)] border-r',
        )}
      >
        {side === 'bottom' && <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-fg/15" aria-hidden />}
        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          <h2 id={id} className="text-base font-semibold">
            {title}
          </h2>
          <IconButton label="Close" onClick={onClose} className="-mr-2">
            <X size={18} />
          </IconButton>
        </div>
        <div className="scrollbar-thin flex-1 overflow-y-auto px-5 pb-5">{children}</div>
        {footer && <div className="border-t border-line px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{footer}</div>}
      </div>
    </div>
  )
}

export function Popover({
  label,
  active,
  children,
  align = 'left',
  bare = false,
}: {
  label: ReactNode
  active?: boolean
  children: (close: () => void) => ReactNode
  align?: 'left' | 'right'
  /** Icon-button trigger without a border. */
  bare?: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const id = useId()
  const close = useCallback(() => setOpen(false), [])
  useEscape(open, close)
  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          bare
            ? 'inline-flex size-9 items-center justify-center rounded-lg text-muted transition-colors duration-200 hover:bg-fg/[0.07] hover:text-fg'
            : 'inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[13px] font-medium transition-colors duration-200',
          !bare && (active ? 'border-accent/45 bg-accent-soft text-accent-ink' : 'border-line bg-fg/[0.02] text-muted hover:border-line-strong hover:text-fg'),
        )}
      >
        {label}
      </button>
      {open && (
        <div
          id={id}
          className={cn(
            'dialog-in absolute top-[calc(100%+6px)] z-40 min-w-[200px] rounded-xl border border-line-strong bg-surface-2 p-1.5 shadow-[0_24px_60px_-16px_rgb(0_0_0/0.45)]',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          {children(close)}
        </div>
      )}
    </div>
  )
}

export function CheckOption({
  checked,
  onChange,
  children,
  type = 'checkbox',
  name,
}: {
  checked: boolean
  onChange: () => void
  children: ReactNode
  type?: 'checkbox' | 'radio'
  name?: string
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-fg hover:bg-fg/[0.05]">
      <input type={type} name={name} checked={checked} onChange={onChange} className="peer sr-only" />
      <span
        className={cn(
          'flex size-4 items-center justify-center border transition-colors duration-200 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent',
          type === 'radio' ? 'rounded-full' : 'rounded-[5px]',
          checked ? 'border-accent bg-accent' : 'border-fg/25',
        )}
        aria-hidden
      >
        {checked && (type === 'radio' ? <span className="size-1.5 rounded-full bg-white" /> : <CheckMark />)}
      </span>
      {children}
    </label>
  )
}

function CheckMark() {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path d="M2.5 6.2 5 8.5l4.5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Chip({
  active,
  children,
  onClick,
  className,
}: {
  active?: boolean
  children: ReactNode
  onClick?: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex h-8 shrink-0 items-center rounded-full border px-3.5 text-[13px] font-medium whitespace-nowrap transition-colors duration-200',
        active ? 'border-accent/45 bg-accent-soft text-accent-ink' : 'border-transparent bg-fg/[0.05] text-muted hover:bg-fg/[0.09] hover:text-fg',
        className,
      )}
    >
      {children}
    </button>
  )
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode
  title: string
  body: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center rounded-[var(--radius-card)] border border-dashed border-line-strong px-6 py-16 text-center">
      <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-fg/[0.05] text-muted">{icon}</div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function SectionHeader({ title, action, eyebrow }: { title: string; action?: ReactNode; eyebrow?: ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        {eyebrow}
        <h2 className="text-lg font-semibold tracking-tight sm:text-xl">{title}</h2>
      </div>
      {action}
    </div>
  )
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-[34px] leading-[1] font-bold tracking-[-0.04em] sm:text-[48px]">{title}</h1>
        {subtitle && <p className="mt-2 max-w-xl text-[15px] text-muted">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}
