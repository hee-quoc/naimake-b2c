import { ArrowDownUp, ChevronDown, SearchX, SlidersHorizontal, TriangleAlert, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ASPECTS, CATEGORIES, DURATIONS, SORTS, STYLES, type SortId } from '../data/taxonomy'
import type { Template } from '../data/types'
import { useI18n } from '../i18n'
import type { MessageKey } from '../i18n/en'
import { applyFilters, fetchTemplates, filtersFromParams, paramsFromFilters, type Filters } from '../lib/catalog'
import { cn } from '../lib/cn'
import { Button, CheckOption, Chip, EmptyState, Popover, Sheet } from './ui'
import { TemplateGrid, TemplateGridSkeleton } from './TemplateGrid'

type ListKey = 'ratio' | 'dur' | 'style'

export function Catalog({
  source,
  defaultSort = 'trending',
  showCategories = true,
  maxColumns,
  id = 'catalog',
}: {
  source: Template[]
  defaultSort?: SortId
  showCategories?: boolean
  maxColumns?: number
  id?: string
}) {
  const { t } = useI18n()
  const [params, setParams] = useSearchParams()
  const filters = useMemo(() => filtersFromParams(params, defaultSort), [params, defaultSort])
  const [state, setState] = useState<{ status: 'loading' | 'ready' | 'error'; items: Template[] }>({ status: 'loading', items: [] })
  const [attempt, setAttempt] = useState(0)
  const [sheetOpen, setSheetOpen] = useState(false)
  const key = paramsFromFilters(filters, defaultSort).toString()

  useEffect(() => {
    const ctrl = new AbortController()
    setState((s) => ({ ...s, status: 'loading' }))
    fetchTemplates(source, filters, ctrl.signal)
      .then((items) => setState({ status: 'ready', items }))
      .catch((err: unknown) => {
        if ((err as Error).name !== 'AbortError') setState({ status: 'error', items: [] })
      })
    return () => ctrl.abort()
    // `key` captures every filter value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, source, attempt])

  const update = (patch: Partial<Filters>) => {
    const next = paramsFromFilters({ ...filters, ...patch }, defaultSort)
    const simulate = params.get('simulate')
    if (simulate) next.set('simulate', simulate)
    setParams(next, { replace: true })
  }
  const toggleIn = (k: ListKey, value: string) => {
    const cur = filters[k] as string[]
    update({ [k]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value] } as Partial<Filters>)
  }

  const active: { label: string; remove: () => void }[] = [
    ...(filters.q ? [{ label: `“${filters.q}”`, remove: () => update({ q: '' }) }] : []),
    ...(filters.cat !== 'all' && !showCategories ? [{ label: t(`category.${filters.cat}`), remove: () => update({ cat: 'all' }) }] : []),
    ...filters.ratio.map((r) => ({ label: r, remove: () => toggleIn('ratio', r) })),
    ...filters.dur.map((d) => ({ label: t(`duration.${d}`), remove: () => toggleIn('dur', d) })),
    ...(filters.tier !== 'any' ? [{ label: t(`tier.${filters.tier}`), remove: () => update({ tier: 'any' }) }] : []),
    ...filters.style.map((s) => ({ label: t(`style.${s}`), remove: () => toggleIn('style', s) })),
  ]
  const clearAll = () => update({ q: '', cat: 'all', ratio: [], dur: [], tier: 'any', style: [] })
  const filterCount = filters.ratio.length + filters.dur.length + filters.style.length + (filters.tier !== 'any' ? 1 : 0)
  const previewCount = applyFilters(source, filters).length

  const groups = (
    <>
      <FilterGroup title={t('catalog.aspect')}>
        {ASPECTS.map((a) => (
          <CheckOption key={a} checked={filters.ratio.includes(a)} onChange={() => toggleIn('ratio', a)}>
            <AspectGlyph aspect={a} /> {a}
          </CheckOption>
        ))}
      </FilterGroup>
      <FilterGroup title={t('catalog.duration')}>
        {DURATIONS.map((d) => (
          <CheckOption key={d} checked={filters.dur.includes(d)} onChange={() => toggleIn('dur', d)}>
            {t(`duration.${d}`)}
          </CheckOption>
        ))}
      </FilterGroup>
      <FilterGroup title={t('catalog.price')}>
        {(['any', 'free', 'premium'] as const).map((v) => (
          <CheckOption key={v} type="radio" name={`${id}-tier`} checked={filters.tier === v} onChange={() => update({ tier: v })}>
            {v === 'any' ? t('catalog.any') : t(`tier.${v}`)}
          </CheckOption>
        ))}
      </FilterGroup>
      <FilterGroup title={t('catalog.style')}>
        {STYLES.map((s) => (
          <CheckOption key={s} checked={filters.style.includes(s)} onChange={() => toggleIn('style', s)}>
            {t(`style.${s}`)}
          </CheckOption>
        ))}
      </FilterGroup>
    </>
  )

  const countLabel = (n: number) => (n === 1 ? t('catalog.result') : t('catalog.results', { n }))

  return (
    <section id={id} aria-label={t('catalog.title')} className="scroll-mt-24">
      {showCategories && (
        <div className="scrollbar-none -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="toolbar" aria-label={t('nav.categories')}>
          <Chip active={filters.cat === 'all'} onClick={() => update({ cat: 'all' })}>
            {t('category.all')}
          </Chip>
          {CATEGORIES.map((c) => (
            <Chip key={c} active={filters.cat === c} onClick={() => update({ cat: c })}>
              {t(`category.${c}`)}
            </Chip>
          ))}
        </div>
      )}

      <div className="mb-3 flex flex-wrap items-center gap-2">
        {/* Desktop filter popovers */}
        <div className="hidden flex-wrap items-center gap-2 md:flex">
          <FilterPopover label={t('catalog.aspect')} count={filters.ratio.length}>
            {ASPECTS.map((a) => (
              <CheckOption key={a} checked={filters.ratio.includes(a)} onChange={() => toggleIn('ratio', a)}>
                <AspectGlyph aspect={a} /> {a}
              </CheckOption>
            ))}
          </FilterPopover>
          <FilterPopover label={t('catalog.duration')} count={filters.dur.length}>
            {DURATIONS.map((d) => (
              <CheckOption key={d} checked={filters.dur.includes(d)} onChange={() => toggleIn('dur', d)}>
                {t(`duration.${d}`)}
              </CheckOption>
            ))}
          </FilterPopover>
          <FilterPopover label={t('catalog.price')} count={filters.tier !== 'any' ? 1 : 0}>
            {(['any', 'free', 'premium'] as const).map((v) => (
              <CheckOption key={v} type="radio" name={`${id}-tier-d`} checked={filters.tier === v} onChange={() => update({ tier: v })}>
                {v === 'any' ? t('catalog.any') : t(`tier.${v}`)}
              </CheckOption>
            ))}
          </FilterPopover>
          <FilterPopover label={t('catalog.style')} count={filters.style.length}>
            {STYLES.map((s) => (
              <CheckOption key={s} checked={filters.style.includes(s)} onChange={() => toggleIn('style', s)}>
                {t(`style.${s}`)}
              </CheckOption>
            ))}
          </FilterPopover>
        </div>

        {/* Mobile filter sheet trigger */}
        <Button variant="outline" size="sm" className="h-9 md:hidden" onClick={() => setSheetOpen(true)}>
          <SlidersHorizontal size={15} aria-hidden />
          {t('catalog.filters')}
          {filterCount > 0 && <span className="rounded-full bg-accent px-1.5 text-[11px] text-white">{filterCount}</span>}
        </Button>

        <div className="ml-auto flex items-center gap-3">
          <span className="hidden text-[13px] text-faint sm:inline" aria-live="polite">
            {state.status === 'ready' ? countLabel(state.items.length) : ''}
          </span>
          <Popover
            align="right"
            label={
              <>
                <ArrowDownUp size={14} aria-hidden />
                <span className="sr-only">{t('catalog.sort')}: </span>
                {t(`sort.${filters.sort}`)}
                <ChevronDown size={14} aria-hidden />
              </>
            }
          >
            {(close) =>
              SORTS.map((s) => (
                <CheckOption
                  key={s}
                  type="radio"
                  name={`${id}-sort`}
                  checked={filters.sort === s}
                  onChange={() => {
                    update({ sort: s })
                    close()
                  }}
                >
                  {t(`sort.${s}`)}
                </CheckOption>
              ))
            }
          </Popover>
        </div>
      </div>

      {active.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-1.5">
          {active.map((a) => (
            <button
              key={a.label}
              type="button"
              onClick={a.remove}
              aria-label={t('catalog.removeFilter', { label: a.label })}
              className="inline-flex h-7 items-center gap-1 rounded-full border border-line-strong bg-fg/[0.03] pr-2 pl-3 text-[12.5px] text-fg transition-colors hover:border-fg/30"
            >
              {a.label}
              <X size={13} className="text-muted" aria-hidden />
            </button>
          ))}
          <button type="button" onClick={clearAll} className="ml-1 rounded-md px-2 py-1 text-[12.5px] font-medium text-accent-hover hover:bg-accent-soft">
            {t('catalog.clearAll')}
          </button>
        </div>
      )}

      <div className="mt-2">
        {state.status === 'loading' && <TemplateGridSkeleton maxColumns={maxColumns} />}
        {state.status === 'error' && (
          <EmptyState
            icon={<TriangleAlert size={20} />}
            title={t('catalog.errorTitle')}
            body={t('catalog.errorBody')}
            action={
              <Button variant="outline" onClick={() => setAttempt((a) => a + 1)}>
                {t('catalog.retry')}
              </Button>
            }
          />
        )}
        {state.status === 'ready' && state.items.length === 0 && (
          <EmptyState
            icon={<SearchX size={20} />}
            title={t('catalog.emptyTitle')}
            body={t('catalog.emptyBody')}
            action={
              <Button variant="outline" onClick={clearAll}>
                {t('catalog.clearAll')}
              </Button>
            }
          />
        )}
        {state.status === 'ready' && state.items.length > 0 && (
          <div className="page-enter">
            <TemplateGrid templates={state.items} maxColumns={maxColumns} />
          </div>
        )}
      </div>

      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={t('catalog.filters')}
        footer={
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => update({ ratio: [], dur: [], tier: 'any', style: [] })}>
              {t('catalog.clearAll')}
            </Button>
            <Button className="flex-[2]" onClick={() => setSheetOpen(false)}>
              {t('catalog.showResults', { n: previewCount })}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-5">{groups}</div>
      </Sheet>
    </section>
  )
}

function FilterPopover({ label, count, children }: { label: string; count: number; children: React.ReactNode }) {
  return (
    <Popover
      active={count > 0}
      label={
        <>
          {label}
          {count > 0 && <span className="rounded-full bg-accent px-1.5 text-[11px] leading-4 text-white">{count}</span>}
          <ChevronDown size={14} aria-hidden />
        </>
      }
    >
      {() => <div role="group" aria-label={label}>{children}</div>}
    </Popover>
  )
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-1 text-xs font-medium tracking-wide text-faint uppercase">{title}</legend>
      <div className="-mx-2.5">{children}</div>
    </fieldset>
  )
}

export function AspectGlyph({ aspect, className }: { aspect: string; className?: string }) {
  const dims = aspect === '9:16' ? 'w-[9px] h-[14px]' : aspect === '16:9' ? 'w-[15px] h-[9px]' : 'w-[12px] h-[12px]'
  return <span className={cn('inline-block rounded-[2px] border-[1.5px] border-current opacity-70', dims, className)} aria-hidden />
}

// Re-exported for pages that label categories outside the catalog.
export const categoryKey = (c: string) => `category.${c}` as MessageKey
