import { useMemo, type ReactNode } from 'react'
import { aspectValue } from '../data/taxonomy'
import type { Aspect, Template } from '../data/types'
import { useElementWidth } from '../lib/hooks'
import { aspectStyle } from './stage/TemplateStage'
import { TemplateCard } from './TemplateCard'

function columnCount(width: number, max: number) {
  const n = width < 340 ? 1 : width < 700 ? 2 : width < 1000 ? 3 : width < 1500 ? 4 : 5
  return Math.min(n, max)
}

/** Greedy masonry: each item goes to the currently shortest column, keeping rows visually balanced. */
function distribute<T>(items: T[], cols: number, aspectOf: (item: T) => Aspect): T[][] {
  const columns: T[][] = Array.from({ length: cols }, () => [])
  const heights = new Array(cols).fill(0)
  for (const item of items) {
    let target = 0
    for (let i = 1; i < cols; i++) if (heights[i] < heights[target] - 0.01) target = i
    columns[target].push(item)
    heights[target] += 1 / aspectValue(aspectOf(item)) + 0.22
  }
  return columns
}

export function TemplateGrid({
  templates,
  maxColumns = 5,
  renderFooter,
}: {
  templates: Template[]
  maxColumns?: number
  renderFooter?: (t: Template) => ReactNode
}) {
  const [ref, width] = useElementWidth<HTMLDivElement>()
  const cols = columnCount(width || 1200, maxColumns)
  const columns = useMemo(() => distribute(templates, cols, (t) => t.aspect), [templates, cols])
  return (
    <div ref={ref} className="flex items-start gap-3 sm:gap-4">
      {columns.map((col, i) => (
        <div key={i} className="flex min-w-0 flex-1 flex-col gap-5 sm:gap-6">
          {col.map((t) => (
            <TemplateCard key={t.id} template={t} footer={renderFooter?.(t)} />
          ))}
        </div>
      ))}
    </div>
  )
}

const SKELETON_ASPECTS: Aspect[] = ['9:16', '1:1', '16:9', '9:16', '16:9', '9:16', '1:1', '9:16', '16:9', '1:1', '9:16', '16:9']

export function TemplateGridSkeleton({ count = 12, maxColumns = 5 }: { count?: number; maxColumns?: number }) {
  const [ref, width] = useElementWidth<HTMLDivElement>()
  const cols = columnCount(width || 1200, maxColumns)
  const items = SKELETON_ASPECTS.slice(0, count).map((a, i) => ({ a, i }))
  const columns = distribute(items, cols, (x) => x.a)
  return (
    <div ref={ref} className="flex items-start gap-3 sm:gap-4" aria-busy="true" aria-label="Loading templates">
      {columns.map((col, i) => (
        <div key={i} className="flex min-w-0 flex-1 flex-col gap-5 sm:gap-6">
          {col.map(({ a, i: k }) => (
            <div key={k}>
              <div className="skeleton rounded-[var(--radius-card)]" style={aspectStyle(a)} />
              <div className="skeleton mt-3 h-3.5 w-2/3 rounded" />
              <div className="skeleton mt-2 h-3 w-1/2 rounded" />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
