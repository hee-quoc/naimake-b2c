import { Check, FileQuestion, MapPin, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { TemplateGrid } from '../components/TemplateGrid'
import { Badge, Button, ButtonLink, EmptyState, PageHeader } from '../components/ui'
import { CREATOR_COLLECTIONS } from '../data/collections'
import { CREATORS, getCreator } from '../data/creators'
import { TEMPLATES } from '../data/templates'
import type { Creator } from '../data/types'
import { useI18n } from '../i18n'
import { cn } from '../lib/cn'
import { photoUrl } from '../lib/media'
import { useAppStore } from '../store/AppStore'
import { CollectionCard } from './Explore'

function FollowButton({ creator, size = 'md' }: { creator: Creator; size?: 'sm' | 'md' }) {
  const { following, toggleFollow } = useAppStore()
  const { t } = useI18n()
  const on = following.includes(creator.id)
  return (
    <Button
      variant={on ? 'outline' : 'primary'}
      size={size}
      aria-pressed={on}
      onClick={(e) => {
        e.preventDefault()
        toggleFollow(creator.id)
      }}
    >
      {on ? <Check size={15} aria-hidden /> : <Plus size={15} aria-hidden />}
      {on ? t('creator.following') : t('creator.follow')}
    </Button>
  )
}

export function CreatorsPage() {
  const { t, formatNumber } = useI18n()
  return (
    <div className="px-4 pt-8 sm:px-6 lg:px-8">
      <PageHeader title={t('creators.title')} subtitle={t('creators.subtitle')} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {CREATORS.map((c) => {
          const count = TEMPLATES.filter((x) => x.creatorId === c.id).length
          return (
            <Link
              key={c.id}
              to={`/creators/${c.id}`}
              className="group overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface transition-colors duration-200 hover:border-line-strong"
            >
              <div className="relative h-28">
                <img src={photoUrl(c.cover, 800, 240)} alt="" loading="lazy" className="h-full w-full object-cover transition-[filter] duration-200 group-hover:brightness-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent" />
              </div>
              <div className="relative -mt-8 px-4 pb-4">
                <img src={photoUrl(c.avatar, 160, 160)} alt="" className="size-14 rounded-full object-cover ring-4 ring-surface" loading="lazy" />
                <div className="mt-2 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold">{c.name}</h2>
                    <p className="truncate text-[13px] text-muted">{c.specialty}</p>
                  </div>
                  <FollowButton creator={c} size="sm" />
                </div>
                <p className="mt-3 text-[12px] text-faint">
                  {t('creators.templates', { n: count })} · {formatNumber(c.stats.followers)} {t('creator.followers')} · {t('demo.sample')}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export function CreatorProfilePage() {
  const { id = '' } = useParams()
  const { t, formatNumber } = useI18n()
  const creator = getCreator(id)
  const [tab, setTab] = useState<'templates' | 'collections'>('templates')
  const { following } = useAppStore()
  if (!creator) {
    return (
      <div className="px-4 py-16 sm:px-8">
        <EmptyState icon={<FileQuestion size={20} />} title={t('creator.notFound')} body="" action={<ButtonLink to="/creators">{t('creators.title')}</ButtonLink>} />
      </div>
    )
  }
  const templates = TEMPLATES.filter((x) => x.creatorId === creator.id)
  const collections = CREATOR_COLLECTIONS.filter((c) => c.creatorId === creator.id)
  const followers = creator.stats.followers + (following.includes(creator.id) ? 1 : 0)

  return (
    <div className="pb-4">
      <div className="relative h-44 sm:h-60">
        <img src={photoUrl(creator.cover, 1800, 480)} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/30 to-transparent" />
      </div>
      <div className="relative -mt-14 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <img src={photoUrl(creator.avatar, 240, 240)} alt="" className="size-24 rounded-full object-cover ring-4 ring-bg sm:size-28" />
            <div className="pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">{creator.name}</h1>
                <Badge tone="demo">{t('creator.sampleProfile')}</Badge>
              </div>
              <p className="mt-0.5 text-sm text-muted">
                @{creator.handle} · {creator.specialty}
              </p>
            </div>
          </div>
          <FollowButton creator={creator} />
        </div>
        <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-muted">{creator.bio}</p>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px]">
          <span className="flex items-center gap-1.5 text-muted">
            <MapPin size={14} aria-hidden /> {creator.location}
          </span>
          <span>
            <strong className="font-semibold">{formatNumber(followers)}</strong> <span className="text-muted">{t('creator.followers')}</span>
          </span>
          <span>
            <strong className="font-semibold">{formatNumber(creator.stats.uses)}</strong> <span className="text-muted">{t('creator.uses')}</span>
          </span>
          <span className="text-[11.5px] text-faint">({t('demo.sample')})</span>
        </div>

        <div className="mt-8 mb-6 flex gap-1 border-b border-line" role="tablist">
          {(['templates', 'collections'] as const).map((k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={tab === k}
              onClick={() => setTab(k)}
              className={cn(
                '-mb-px border-b-2 px-3 py-2.5 text-sm font-medium transition-colors',
                tab === k ? 'border-accent text-fg' : 'border-transparent text-muted hover:text-fg',
              )}
            >
              {k === 'templates' ? t('creator.templates') : t('creator.collections')}
              <span className="ml-1.5 font-mono text-[11px] text-faint">{k === 'templates' ? templates.length : collections.length}</span>
            </button>
          ))}
        </div>
        <div role="tabpanel">
          {tab === 'templates' ? (
            <TemplateGrid templates={templates} maxColumns={4} />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {collections.map((c) => (
                <CollectionCard key={c.id} collection={c} tall />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
