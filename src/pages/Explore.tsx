import { ArrowRight, Pause, Play, Search } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Catalog } from '../components/Catalog'
import { sceneStarts, TemplateStage } from '../components/stage/TemplateStage'
import { Avatar, Button, ButtonLink, PageHeader, SectionHeader } from '../components/ui'
import { FEATURED_COLLECTIONS } from '../data/collections'
import { getCreator } from '../data/creators'
import { SUGGESTED_SEARCHES } from '../data/taxonomy'
import { getTemplate, TEMPLATES, templateDuration } from '../data/templates'
import type { Collection } from '../data/types'
import { useI18n } from '../i18n'
import { cn } from '../lib/cn'
import { useInView, usePlayer, useReducedMotion } from '../lib/hooks'
import { photoUrl } from '../lib/media'

const FEATURED_ID = 'above-the-clouds'

export default function Explore() {
  return (
    <div className="px-4 pb-4 sm:px-6 lg:px-8">
      <Hero />
      <FeaturedCollections />
      <div className="mt-10">
        <Catalog source={TEMPLATES} />
      </div>
    </div>
  )
}

/** Collaboration-style cursor with a coloured name tag. Decorative. */
function CursorTag({ label, accent, spark, className, tagSide = 'right' }: { label: string; accent?: boolean; spark?: boolean; className?: string; tagSide?: 'left' | 'right' }) {
  return (
    <div className={cn('pointer-events-none absolute z-10 hidden select-none xl:block', className)} aria-hidden>
      <div className={cn('flex items-start', tagSide === 'left' && 'flex-row-reverse')}>
        <svg width="18" height="18" viewBox="0 0 18 18" className={cn('drop-shadow', tagSide === 'left' && '-scale-x-100')}>
          <path d="M2 2l13 5.2-5.6 1.6L7.8 15z" fill={accent ? '#3B6FFF' : spark ? '#FF6B2C' : 'var(--surface-3)'} stroke={accent || spark ? '#fff' : 'var(--line-strong)'} strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
        <span
          className={cn(
            'mt-3.5 rounded-md px-2 py-0.5 text-[12px] font-semibold whitespace-nowrap shadow-lg',
            accent ? 'bg-accent text-white' : spark ? 'bg-spark text-white' : 'border border-line-strong bg-surface-2 text-fg',
          )}
        >
          {label}
        </span>
      </div>
    </div>
  )
}

function Hero() {
  const { t } = useI18n()
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')
  useEffect(() => setQ(params.get('q') ?? ''), [params])

  const search = (value: string) => {
    const next = new URLSearchParams(params)
    if (value.trim()) next.set('q', value.trim())
    else next.delete('q')
    setParams(next, { replace: true })
    requestAnimationFrame(() => document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }
  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    search(q)
  }

  return (
    <section className="relative -mx-4 px-4 pt-8 pb-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 lg:pt-12">
      <div className="grid-backdrop pointer-events-none absolute inset-0 -z-0" aria-hidden />
      <div className="relative grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)] lg:gap-12 xl:grid-cols-[minmax(0,1fr)_minmax(0,460px)]">
        <div className="relative">
          <CursorTag label="You" accent className="-top-7 -left-6 float-slow" />
          <CursorTag label="Mai · editing" className="-top-5 right-[4%] float-slower" tagSide="left" />

          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-3 py-1 text-[12px] font-medium text-muted backdrop-blur">
            <span className="size-2 rounded-full bg-spark" aria-hidden />
            {t('hero.eyebrow')}
          </span>
          <h1 className="mt-4 font-display text-[44px] leading-[0.92] font-bold tracking-[-0.05em] sm:text-[64px] xl:text-[76px]">
            {t('hero.titleLead')}
            <br />
            {t('hero.titleAccent')}
            <span className="text-spark">.</span>
          </h1>
          <p className="mt-4 text-base text-muted sm:text-lg">{t('hero.subtitle')}</p>
          <form role="search" onSubmit={onSubmit} className="relative mt-6 max-w-xl">
            <Search size={18} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-faint" aria-hidden />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('hero.searchPlaceholder')}
              aria-label={t('hero.searchPlaceholder')}
              className="h-12 w-full rounded-lg border border-line bg-surface pr-24 pl-11 text-[15px] text-fg placeholder:text-faint transition-[border-color,box-shadow] duration-200 focus:border-accent focus:ring-3 focus:ring-accent/25 focus:outline-none"
            />
            <button
              type="submit"
              className="absolute top-1.5 right-1.5 bottom-1.5 inline-flex items-center rounded-md border border-line-strong bg-surface-2 px-3.5 text-[13px] font-medium text-fg transition-colors duration-200 hover:bg-surface-3"
            >
              {t('nav.search')}
            </button>
          </form>
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            <Button
              size="lg"
              className="mr-3 h-11"
              onClick={() => document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            >
              {t('hero.cta')} <ArrowRight size={16} aria-hidden />
            </Button>
            <span className="mr-1 text-[13px] text-faint">{t('hero.try')}</span>
            {SUGGESTED_SEARCHES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => search(s)}
                className="inline-flex h-8 items-center rounded-full border border-line bg-surface/60 px-3 text-[12.5px] text-muted transition-colors duration-200 hover:border-line-strong hover:text-fg"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <FeaturedPreview />
      </div>
    </section>
  )
}

function FeaturedPreview() {
  const { t } = useI18n()
  const template = getTemplate(FEATURED_ID)!
  const creator = getCreator(template.creatorId)
  const reduced = useReducedMotion()
  const [ref, inView] = useInView<HTMLDivElement>()
  const duration = templateDuration(template)
  const player = usePlayer(duration, { initial: 1.6 })
  const [userPaused, setUserPaused] = useState(false)
  const { play, pause } = player
  const starts = sceneStarts(template)

  useEffect(() => {
    if (inView && !reduced && !userPaused) play()
    else pause()
  }, [inView, reduced, userPaused, play, pause])

  return (
    <div ref={ref} className="relative hidden sm:block">
      <CursorTag label="Kenji · Above the Clouds" className="-top-8 left-6 float-slower" />
      <CursorTag label="Brand kit" spark className="-right-4 -bottom-9 float-slow" tagSide="left" />

      {/* Editor-style frame */}
      <div className="rounded-2xl border border-line bg-surface p-2 shadow-[0_30px_80px_-30px_rgb(0_0_0/0.6)]">
        <div className="flex items-center gap-2 px-2 pt-1 pb-2">
          <span className="flex gap-1" aria-hidden>
            <span className="size-2.5 rounded-full bg-fg/20" />
            <span className="size-2.5 rounded-full bg-fg/20" />
            <span className="size-2.5 rounded-full bg-fg/20" />
          </span>
          <span className="ml-1 truncate text-[11.5px] font-medium text-faint">{t('hero.featured')} · {template.title}</span>
          <button
            type="button"
            onClick={() => {
              setUserPaused(player.playing)
              player.toggle()
            }}
            aria-label={player.playing ? t('player.pause') : t('player.play')}
            className="ml-auto flex size-7 items-center justify-center rounded-full text-muted transition-colors hover:bg-fg/[0.07] hover:text-fg"
          >
            {player.playing ? <Pause size={13} className="fill-current" /> : <Play size={13} className="fill-current" />}
          </button>
        </div>
        <div className="relative aspect-video overflow-hidden rounded-xl">
          <TemplateStage template={template} time={player.time} playing={player.playing} quality="full" still={reduced} eager />
          <Link to={`/templates/${template.id}`} className="absolute inset-0" aria-label={template.title} />
        </div>
        {/* Mini timeline */}
        <div className="flex gap-1 px-1 pt-2 pb-1" aria-hidden>
          {template.scenes.map((s, i) => {
            const fill = Math.max(0, Math.min(1, (player.time - starts[i]) / s.duration))
            return (
              <div key={s.id} className="relative h-6 overflow-hidden rounded-md bg-fg/[0.06]" style={{ flex: s.duration }}>
                <div className="absolute inset-y-0 left-0 bg-accent/35" style={{ width: `${fill * 100}%` }} />
                <span className={cn('relative block truncate px-2 text-[10.5px] leading-6 font-medium', fill > 0 && fill < 1 ? 'text-fg' : 'text-muted')}>
                  {s.name}
                </span>
              </div>
            )
          })}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3 px-1">
        <div className="flex min-w-0 flex-1 items-center gap-2 text-sm">
          {creator && (
            <Link to={`/creators/${creator.id}`} className="flex min-w-0 items-center gap-1.5 text-muted hover:text-fg">
              <Avatar photo={creator.avatar} name="" size={20} />
              <span className="truncate text-[13px]">{creator.name}</span>
            </Link>
          )}
        </div>
        <ButtonLink to={`/workspace/new/${template.id}`} size="sm">
          {t('card.use')} <ArrowRight size={14} aria-hidden />
        </ButtonLink>
      </div>
    </div>
  )
}

function FeaturedCollections() {
  const { t } = useI18n()
  return (
    <section className="mt-8" aria-labelledby="featured-collections">
      <SectionHeader
        title={t('collections.featured')}
        action={
          <Link to="/collections" className="inline-flex items-center gap-1 text-[13px] font-medium text-muted hover:text-fg">
            {t('collections.seeAll')} <ArrowRight size={14} aria-hidden />
          </Link>
        }
      />
      <div className="scrollbar-none -mx-4 flex snap-x gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 xl:grid-cols-4">
        {FEATURED_COLLECTIONS.map((c) => (
          <CollectionCard key={c.id} collection={c} />
        ))}
      </div>
    </section>
  )
}

const COLLECTION_TAG: Record<string, string> = {
  'made-for-social': '9:16 ready',
  'product-launch': 'Launch',
  'cinematic-stories': 'Cinematic',
  'creator-favorites': 'Community',
}

export function CollectionCard({ collection, tall }: { collection: Collection; tall?: boolean }) {
  const { t } = useI18n()
  const creator = collection.creatorId ? getCreator(collection.creatorId) : undefined
  const tag = COLLECTION_TAG[collection.id] ?? creator?.name ?? 'Curated'
  const thumbs = collection.templateIds
    .slice(0, 3)
    .map((id) => getTemplate(id))
    .filter((x) => !!x)
  return (
    <Link
      to={`/collections/${collection.id}`}
      className="group relative flex w-[78vw] max-w-[320px] shrink-0 snap-start flex-col justify-end overflow-hidden rounded-[var(--radius-card)] ring-1 ring-line transition-shadow duration-200 hover:ring-fg/25 sm:w-auto sm:max-w-none"
      style={{ height: tall ? 220 : 132 }}
    >
      <img
        src={photoUrl(collection.cover, 720, tall ? 440 : 300)}
        alt=""
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition-[filter] duration-200 group-hover:brightness-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/0" />
      <div className="absolute top-3 right-3 flex -space-x-2" aria-hidden>
        {thumbs.map((tp) => {
          const slot = tp.mediaSlots.find((s) => s.id === tp.scenes[0].media)
          return slot ? (
            <img key={tp.id} src={photoUrl(slot.photo, 80, 80)} alt="" loading="lazy" className="size-7 rounded-md object-cover ring-2 ring-black/60" />
          ) : (
            <span key={tp.id} className="size-7 rounded-md ring-2 ring-black/60" style={{ background: tp.palette.secondary }} />
          )
        })}
      </div>
      <span className="absolute top-3 left-3 rounded-md bg-spark px-2 py-0.5 text-[11.5px] font-semibold text-white">{tag}</span>
      <div className="relative p-4">
        <h3 className="font-display text-[19px] leading-[1.1] font-bold tracking-[-0.03em] text-white">{collection.title}</h3>
        <p className="mt-1 text-[12.5px] text-white/70">{t('collections.count', { n: collection.templateIds.length })}</p>
      </div>
    </Link>
  )
}

export function TrendingPage() {
  const { t } = useI18n()
  return (
    <div className="px-4 pt-8 sm:px-6 lg:px-8">
      <PageHeader title={t('catalog.trendingTitle')} subtitle={t('catalog.trendingSubtitle')} />
      <Catalog source={TEMPLATES} defaultSort="trending" />
    </div>
  )
}

const NEW_SINCE = '2026-09-01'
const NEW_TEMPLATES = TEMPLATES.filter((tp) => tp.createdAt >= NEW_SINCE)

export function NewPage() {
  const { t } = useI18n()
  return (
    <div className="px-4 pt-8 sm:px-6 lg:px-8">
      <PageHeader title={t('catalog.newTitle')} subtitle={t('catalog.newSubtitle')} />
      <Catalog source={NEW_TEMPLATES} defaultSort="newest" />
    </div>
  )
}
