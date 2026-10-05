import { Bookmark, Clapperboard, Compass, Flame, FolderOpen, Info, Menu, Search, Sparkles, X } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { CATEGORIES } from '../data/taxonomy'
import { useI18n } from '../i18n'
import { cn } from '../lib/cn'
import { readJSON, writeJSON } from '../lib/storage'
import { ThemeSegmented, ThemeToggle } from '../lib/theme'
import { useAppStore } from '../store/AppStore'
import { Button, Dialog, IconButton, Sheet, Wordmark } from './ui'

const TOP_LINKS = [
  { to: '/', key: 'nav.explore', end: true },
  { to: '/collections', key: 'nav.collections' },
  { to: '/creators', key: 'nav.creators' },
  { to: '/pricing', key: 'nav.pricing' },
] as const

export function useGoToCatalog() {
  const navigate = useNavigate()
  return (search = '') => navigate({ pathname: '/', search }, { state: { scrollTo: 'catalog' } })
}

function SearchForm({ autoFocus, onDone, className }: { autoFocus?: boolean; onDone?: () => void; className?: string }) {
  const { t } = useI18n()
  const [params] = useSearchParams()
  const location = useLocation()
  const [q, setQ] = useState(location.pathname === '/' ? (params.get('q') ?? '') : '')
  const go = useGoToCatalog()
  useEffect(() => {
    setQ(location.pathname === '/' ? (params.get('q') ?? '') : '')
  }, [params, location.pathname])
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const next = new URLSearchParams(location.pathname === '/' ? params : undefined)
    if (q.trim()) next.set('q', q.trim())
    else next.delete('q')
    go(next.toString() ? `?${next}` : '')
    onDone?.()
  }
  return (
    <form role="search" onSubmit={submit} className={cn('relative', className)}>
      <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-faint" aria-hidden />
      <input
        type="search"
        value={q}
        autoFocus={autoFocus}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t('hero.searchPlaceholder')}
        aria-label={t('nav.search')}
        className="h-9 w-full rounded-lg border border-line bg-fg/[0.04] pr-3 pl-9 text-[13px] text-fg placeholder:text-faint transition-colors focus:border-accent focus:ring-3 focus:ring-accent/25 focus:outline-none"
      />
    </form>
  )
}

function TopNav({ onMenu, onSignIn }: { onMenu: () => void; onSignIn: () => void }) {
  const { t } = useI18n()
  const [searchOpen, setSearchOpen] = useState(false)
  const go = useGoToCatalog()
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg/85 backdrop-blur-xl">
      <div className="flex h-14 items-center gap-2 px-3 sm:px-5">
        <IconButton label={t('nav.menu')} onClick={onMenu} className="lg:hidden">
          <Menu size={20} />
        </IconButton>
        <Link to="/" className="mr-1 shrink-0 rounded-md py-1 sm:mr-3 lg:mr-6" aria-label="NAIMAKE home">
          <Wordmark />
        </Link>
        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {TOP_LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={'end' in l}
              className={({ isActive }) =>
                cn(
                  'relative rounded-lg px-3 py-1.5 text-[13.5px] font-medium transition-colors duration-200',
                  isActive ? 'text-fg' : 'text-muted hover:text-fg',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {t(l.key)}
                  {isActive && <span className="absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-accent" aria-hidden />}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex min-w-0 items-center gap-1 sm:gap-2">
          <SearchForm className="hidden w-56 lg:block xl:w-72" />
          <IconButton label={t('nav.search')} className="lg:hidden" onClick={() => setSearchOpen((s) => !s)} aria-expanded={searchOpen}>
            {searchOpen ? <X size={19} /> : <Search size={19} />}
          </IconButton>
          <span className="max-sm:hidden">
            <ThemeToggle />
          </span>
          <Button variant="ghost" size="sm" className="max-sm:hidden" onClick={onSignIn}>
            {t('nav.signIn')}
          </Button>
          <Button size="sm" onClick={() => go()}>
            <Sparkles size={14} aria-hidden />
            <span className="hidden min-[400px]:inline">{t('nav.startCreating')}</span>
            <span className="min-[400px]:hidden">Create</span>
          </Button>
        </div>
      </div>
      {searchOpen && (
        <div className="fade-in border-t border-line px-3 py-2.5 lg:hidden">
          <SearchForm autoFocus onDone={() => setSearchOpen(false)} />
        </div>
      )}
    </header>
  )
}

function SideLinks({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useI18n()
  const { saved, projects } = useAppStore()
  const location = useLocation()
  const [params] = useSearchParams()
  const currentCat = location.pathname === '/' ? params.get('cat') : null
  const go = useGoToCatalog()

  const items: { to: string; label: string; icon: ReactNode; count?: number; end?: boolean }[] = [
    { to: '/', label: t('nav.discover'), icon: <Compass size={17} />, end: true },
    { to: '/trending', label: t('nav.trending'), icon: <Flame size={17} className="text-spark" /> },
    { to: '/new', label: t('nav.new'), icon: <Sparkles size={17} /> },
    { to: '/saved', label: t('nav.saved'), icon: <Bookmark size={17} />, count: saved.length },
    { to: '/projects', label: t('nav.projects'), icon: <FolderOpen size={17} />, count: projects.length },
  ]
  const linkClass = (active: boolean) =>
    cn(
      'flex h-9 items-center gap-3 rounded-lg px-3 text-[13.5px] font-medium transition-colors duration-200',
      active ? 'bg-accent-soft text-fg [&_svg]:text-accent' : 'text-muted hover:bg-fg/[0.04] hover:text-fg',
    )

  return (
    <>
      <ul className="flex flex-col gap-0.5">
        {items.map((it) => (
          <li key={it.to}>
            <NavLink to={it.to} end={it.end} onClick={onNavigate} className={({ isActive }) => linkClass(isActive && !(it.end && currentCat))}>
              <span aria-hidden className="text-current opacity-80">
                {it.icon}
              </span>
              <span className="flex-1">{it.label}</span>
              {!!it.count && <span className="font-mono text-[11px] text-faint">{it.count}</span>}
            </NavLink>
          </li>
        ))}
      </ul>
      <div className="mt-6 mb-2 px-3 text-[11px] font-medium tracking-[0.08em] text-faint uppercase">{t('nav.categories')}</div>
      <ul className="flex flex-col gap-0.5">
        {CATEGORIES.map((c) => (
          <li key={c}>
            <button
              type="button"
              onClick={() => {
                go(`?cat=${c}`)
                onNavigate?.()
              }}
              aria-current={currentCat === c ? 'page' : undefined}
              className={cn(linkClass(currentCat === c), 'w-full text-left font-normal')}
            >
              <span className={cn('size-1.5 rounded-full', currentCat === c ? 'bg-accent' : 'bg-current opacity-40')} aria-hidden />
              {t(`category.${c}`)}
            </button>
          </li>
        ))}
      </ul>
    </>
  )
}

function DemoBanner() {
  const { t } = useI18n()
  const [hidden, setHidden] = useState(() => readJSON('bannerHidden', false))
  if (hidden) return null
  return (
    <div className="flex items-center justify-center gap-2 border-b border-line bg-surface px-10 py-1.5 text-center text-[12px] text-muted relative">
      <Info size={13} className="shrink-0 text-spark" aria-hidden />
      <span>{t('demo.banner')}</span>
      <button
        type="button"
        aria-label="Dismiss notice"
        onClick={() => {
          setHidden(true)
          writeJSON('bannerHidden', true)
        }}
        className="absolute right-2 rounded-md p-1 text-faint hover:text-fg"
      >
        <X size={13} />
      </button>
    </div>
  )
}

function Footer() {
  const { t } = useI18n()
  return (
    <footer className="mt-20 border-t border-line px-4 py-8 text-[12.5px] text-faint sm:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Wordmark className="text-[13px] text-muted" />
        <p className="max-w-2xl">{t('footer.note')}</p>
      </div>
    </footer>
  )
}

/** Scrolls to top on route change, or to the catalog when asked. */
function ScrollManager() {
  const location = useLocation()
  const prevPath = useRef(location.pathname)
  useEffect(() => {
    const state = location.state as { scrollTo?: string } | null
    if (state?.scrollTo) {
      requestAnimationFrame(() => {
        document.getElementById(state.scrollTo!)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    } else if (prevPath.current !== location.pathname) {
      window.scrollTo(0, 0)
    }
    prevPath.current = location.pathname
  }, [location])
  return null
}

export function AppLayout() {
  const { t } = useI18n()
  const [drawer, setDrawer] = useState(false)
  const [signIn, setSignIn] = useState(false)
  const location = useLocation()
  return (
    <div className="min-h-dvh">
      <ScrollManager />
      <a href="#main" className="sr-only z-[90] rounded-md bg-accent px-3 py-2 text-sm text-white focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
        Skip to content
      </a>
      <DemoBanner />
      <TopNav onMenu={() => setDrawer(true)} onSignIn={() => setSignIn(true)} />
      <div className="flex">
        <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-[232px] shrink-0 overflow-y-auto border-r border-line px-3 py-5 lg:block scrollbar-thin" aria-label={t('nav.library')}>
          <nav aria-label="Library">
            <SideLinks />
          </nav>
        </aside>
        <main id="main" className="min-w-0 flex-1">
          <div key={location.pathname} className="page-enter">
            <Outlet />
          </div>
          <Footer />
        </main>
      </div>

      <Sheet open={drawer} onClose={() => setDrawer(false)} title="Menu" side="left">
        <nav aria-label="Mobile">
          <ul className="mb-5 flex flex-col gap-0.5 border-b border-line pb-5">
            {TOP_LINKS.map((l) => (
              <li key={l.to}>
                <NavLink
                  to={l.to}
                  end={'end' in l}
                  onClick={() => setDrawer(false)}
                  className={({ isActive }) =>
                    cn('flex h-10 items-center rounded-lg px-3 text-[15px] font-medium', isActive ? 'bg-accent-soft text-fg' : 'text-muted')
                  }
                >
                  {t(l.key)}
                </NavLink>
              </li>
            ))}
            <li>
              <button
                type="button"
                className="flex h-10 w-full items-center rounded-lg px-3 text-[15px] font-medium text-muted"
                onClick={() => {
                  setDrawer(false)
                  setSignIn(true)
                }}
              >
                {t('nav.signIn')}
              </button>
            </li>
          </ul>
          <SideLinks onNavigate={() => setDrawer(false)} />
          <div className="mt-6 border-t border-line pt-5">
            <ThemeSegmented />
          </div>
        </nav>
      </Sheet>

      <SignInDialog open={signIn} onClose={() => setSignIn(false)} />
    </div>
  )
}

export function SignInDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n()
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('signIn.title')}
      footer={
        <Button onClick={onClose} data-autofocus>
          {t('signIn.ok')}
        </Button>
      }
    >
      <div className="flex gap-3">
        <Clapperboard size={18} className="mt-0.5 shrink-0 text-accent-hover" aria-hidden />
        <p>{t('signIn.body')}</p>
      </div>
    </Dialog>
  )
}
