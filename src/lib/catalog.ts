import { getCreator } from '../data/creators'
import { durationBucket, type DurationBucket, type SortId } from '../data/taxonomy'
import { templateDuration } from '../data/templates'
import type { Aspect, CategoryId, StyleId, Template, Tier } from '../data/types'
import { en } from '../i18n/en'

export interface Filters {
  q: string
  cat: CategoryId | 'all'
  ratio: Aspect[]
  dur: DurationBucket[]
  tier: Tier | 'any'
  style: StyleId[]
  sort: SortId
}

const list = <T extends string>(v: string | null) => (v ? (v.split(',').filter(Boolean) as T[]) : [])

export function filtersFromParams(p: URLSearchParams, defaultSort: SortId = 'trending'): Filters {
  return {
    q: p.get('q') ?? '',
    cat: (p.get('cat') as CategoryId) ?? 'all',
    ratio: list<Aspect>(p.get('ratio')),
    dur: list<DurationBucket>(p.get('dur')),
    tier: (p.get('tier') as Tier) ?? 'any',
    style: list<StyleId>(p.get('style')),
    sort: (p.get('sort') as SortId) ?? defaultSort,
  }
}

export function paramsFromFilters(f: Filters, defaultSort: SortId = 'trending'): URLSearchParams {
  const p = new URLSearchParams()
  if (f.q) p.set('q', f.q)
  if (f.cat !== 'all') p.set('cat', f.cat)
  if (f.ratio.length) p.set('ratio', f.ratio.join(','))
  if (f.dur.length) p.set('dur', f.dur.join(','))
  if (f.tier !== 'any') p.set('tier', f.tier)
  if (f.style.length) p.set('style', f.style.join(','))
  if (f.sort !== defaultSort) p.set('sort', f.sort)
  return p
}

function haystack(t: Template): string {
  const creator = getCreator(t.creatorId)
  return [
    t.title,
    t.description,
    en[`category.${t.category}`],
    ...t.styles.map((s) => en[`style.${s}`]),
    ...t.tags,
    creator?.name ?? '',
    creator?.handle ?? '',
  ]
    .join(' ')
    .toLowerCase()
}

/** Matches when every word of the query appears somewhere in the template's searchable text. */
export function matchesQuery(t: Template, q: string): boolean {
  const words = q.toLowerCase().trim().split(/\s+/).filter(Boolean)
  if (!words.length) return true
  const text = haystack(t)
  // Allow simple plurals ("ads" → "ad").
  return words.every((w) => text.includes(w) || (w.length > 3 && w.endsWith('s') && text.includes(w.slice(0, -1))))
}

export function applyFilters(items: Template[], f: Filters): Template[] {
  const out = items.filter(
    (t) =>
      (f.cat === 'all' || t.category === f.cat) &&
      (!f.ratio.length || f.ratio.includes(t.aspect)) &&
      (!f.dur.length || f.dur.includes(durationBucket(templateDuration(t)))) &&
      (f.tier === 'any' || t.tier === f.tier) &&
      (!f.style.length || f.style.some((s) => t.styles.includes(s))) &&
      matchesQuery(t, f.q),
  )
  const sorted = [...out]
  if (f.sort === 'trending') sorted.sort((a, b) => b.trend - a.trend)
  if (f.sort === 'newest') sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  if (f.sort === 'most-used') sorted.sort((a, b) => b.uses - a.uses)
  return sorted
}

/**
 * Mock catalog request with network-like latency, so loading and error states are real.
 * Add `simulate=error` to the URL query to force a failure.
 */
export function fetchTemplates(items: Template[], f: Filters, signal: AbortSignal): Promise<Template[]> {
  const fail = new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('simulate') === 'error'
  return new Promise((resolve, reject) => {
    const id = window.setTimeout(() => {
      if (fail) reject(new Error('Simulated network error'))
      else resolve(applyFilters(items, f))
    }, 380)
    signal.addEventListener('abort', () => {
      window.clearTimeout(id)
      reject(new DOMException('Aborted', 'AbortError'))
    })
  })
}
