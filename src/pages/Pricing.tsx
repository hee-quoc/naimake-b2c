import { Check, Info, Minus } from 'lucide-react'
import { useState } from 'react'
import { Button, PageHeader } from '../components/ui'
import { useI18n } from '../i18n'
import { cn } from '../lib/cn'
import { useToast } from '../store/Toast'

/** PLACEHOLDER PROPOSAL — not official NAIMAKE pricing. */
const PLANS = [
  {
    id: 'free',
    name: 'Free',
    monthly: 0,
    blurb: 'For trying things out and occasional posts.',
    highlights: ['All free templates', '5 exports / month', '720p exports', 'Small watermark'],
  },
  {
    id: 'pro',
    name: 'Pro',
    monthly: 12,
    blurb: 'For creators and shops posting every week.',
    highlights: ['Free + Premium templates', 'Unlimited exports', 'Up to 4K exports', 'No watermark', 'Brand kit'],
  },
  {
    id: 'team',
    name: 'Team',
    monthly: 29,
    perSeat: true,
    blurb: 'For agencies and brands working together.',
    highlights: ['Everything in Pro', 'Shared projects & brand kits', 'Comments & approvals', 'Roles and permissions'],
  },
] as const

type Cell = boolean | string
const ROWS: { group: string; rows: { label: string; values: [Cell, Cell, Cell] }[] }[] = [
  {
    group: 'Template access',
    rows: [
      { label: 'Free templates', values: [true, true, true] },
      { label: 'Premium templates', values: [false, true, true] },
      { label: 'Commercial use in paid ads', values: [false, true, true] },
    ],
  },
  {
    group: 'Exports',
    rows: [
      { label: 'Exports per month', values: ['5', 'Unlimited', 'Unlimited'] },
      { label: 'Max resolution', values: ['720p', '4K', '4K'] },
      { label: 'Watermark', values: ['Small NAIMAKE mark', 'None', 'None'] },
    ],
  },
  {
    group: 'Collaboration',
    rows: [
      { label: 'Saved projects', values: ['10', 'Unlimited', 'Unlimited'] },
      { label: 'Shared brand kits', values: [false, '1 kit', 'Unlimited'] },
      { label: 'Shared projects & comments', values: [false, false, true] },
      { label: 'Seats', values: ['1', '1', 'From 3'] },
    ],
  },
]

export default function PricingPage() {
  const { t } = useI18n()
  const toast = useToast()
  const [yearly, setYearly] = useState(true)
  const price = (m: number) => (yearly ? Math.round(m * 0.8) : m)

  return (
    <div className="px-4 pt-8 sm:px-6 lg:px-8">
      <PageHeader title={t('pricing.title')} subtitle={t('pricing.subtitle')}>
        <div className="inline-flex rounded-xl border border-line bg-surface p-1" role="radiogroup" aria-label="Billing period">
          {[false, true].map((y) => (
            <button
              key={String(y)}
              type="button"
              role="radio"
              aria-checked={yearly === y}
              onClick={() => setYearly(y)}
              className={cn('h-8 rounded-lg px-3 text-[13px] font-medium transition-colors', yearly === y ? 'bg-fg text-bg' : 'text-muted hover:text-fg')}
            >
              {y ? t('pricing.yearly') : t('pricing.monthly')}
              {y && <span className={cn('ml-1.5 text-[11px]', 'text-spark')}>{t('pricing.save')}</span>}
            </button>
          ))}
        </div>
      </PageHeader>

      <div className="mb-6 flex gap-2.5 rounded-xl border border-dashed border-line-strong bg-fg/[0.02] px-4 py-3 text-[13px] leading-relaxed text-muted">
        <Info size={16} className="mt-0.5 shrink-0 text-accent-hover" aria-hidden />
        <p>{t('pricing.placeholder')}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {PLANS.map((p) => {
          const featured = p.id === 'pro'
          return (
            <div key={p.id} className={cn('relative flex flex-col rounded-[var(--radius-card)] border p-6', featured ? 'border-accent/60 bg-accent-soft/30' : 'border-line bg-surface')}>
              {featured && <span className="absolute top-5 right-5 rounded-full bg-spark px-2 py-0.5 text-[11px] font-semibold text-white">{t('pricing.popular')}</span>}
              <h2 className="text-lg font-semibold">{p.name}</h2>
              <p className="mt-1 text-[13px] text-muted">{p.blurb}</p>
              <div className="mt-5 flex items-baseline gap-1.5">
                <span className="text-4xl font-semibold tracking-[-0.04em]">${price(p.monthly)}</span>
                <span className="text-[13px] text-muted">{'perSeat' in p ? t('pricing.perSeat') : t('pricing.perMonth')}</span>
              </div>
              <p className="mt-1 h-4 text-[12px] text-faint">{yearly && p.monthly > 0 ? t('pricing.billedYearly') : ''}</p>
              <ul className="mt-5 flex flex-1 flex-col gap-2.5 text-[13.5px]">
                {p.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-2">
                    <Check size={15} className="mt-0.5 shrink-0 text-accent-hover" aria-hidden /> {h}
                  </li>
                ))}
              </ul>
              <Button variant={featured ? 'primary' : 'outline'} size="lg" className="mt-6 w-full" onClick={() => toast(t('pricing.ctaNote'), { kind: 'info' })}>
                {t(`pricing.cta.${p.id}`)}
              </Button>
            </div>
          )
        })}
      </div>

      <section className="mt-14" aria-labelledby="compare">
        <h2 id="compare" className="mb-4 text-xl font-semibold tracking-tight">
          {t('pricing.compare')}
        </h2>
        <div className="scrollbar-thin overflow-x-auto rounded-[var(--radius-card)] border border-line">
          <table className="w-full min-w-[620px] text-left text-[13.5px]">
            <thead>
              <tr className="border-b border-line bg-surface">
                <th scope="col" className="px-4 py-3 font-medium text-muted">
                  {t('pricing.feature')}
                </th>
                {PLANS.map((p) => (
                  <th key={p.id} scope="col" className="w-[22%] px-4 py-3 font-semibold">
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            {ROWS.map((g) => (
              <tbody key={g.group}>
                <tr>
                  <th colSpan={4} scope="colgroup" className="bg-fg/[0.02] px-4 pt-4 pb-2 text-[11px] font-medium tracking-[0.08em] text-faint uppercase">
                    {g.group}
                  </th>
                </tr>
                {g.rows.map((r) => (
                  <tr key={r.label} className="border-t border-line">
                    <th scope="row" className="px-4 py-3 font-normal text-muted">
                      {r.label}
                    </th>
                    {r.values.map((v, i) => (
                      <td key={i} className="px-4 py-3">
                        {v === true ? (
                          <Check size={16} className="text-accent-hover" aria-label="Included" />
                        ) : v === false ? (
                          <Minus size={16} className="text-faint" aria-label="Not included" />
                        ) : (
                          v
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>
      </section>
    </div>
  )
}
