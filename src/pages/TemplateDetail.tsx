import { ArrowLeft, Crown, FileQuestion, Image as ImageIcon, Music, Palette, RectangleHorizontal, ShieldCheck, Sparkles, Stamp, Type } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PlayerControls } from '../components/Player'
import { aspectStyle, TemplateStage } from '../components/stage/TemplateStage'
import { formatDuration, SaveButton } from '../components/TemplateCard'
import { TemplateGrid } from '../components/TemplateGrid'
import { Avatar, Badge, ButtonLink, EmptyState, SectionHeader } from '../components/ui'
import { getCreator } from '../data/creators'
import { getTrack } from '../data/music'
import { getTemplate, TEMPLATES, templateDuration } from '../data/templates'
import type { Template } from '../data/types'
import { useI18n } from '../i18n'
import { cn } from '../lib/cn'
import { useInView, usePlayer, useReducedMotion } from '../lib/hooks'
import { photoUrl } from '../lib/media'

export default function TemplateDetail() {
  const { id = '' } = useParams()
  const template = getTemplate(id)
  const { t } = useI18n()
  if (!template) {
    return (
      <div className="px-4 py-16 sm:px-8">
        <EmptyState
          icon={<FileQuestion size={20} />}
          title={t('detail.notFound')}
          body={t('detail.notFoundBody')}
          action={<ButtonLink to="/">{t('detail.backToExplore')}</ButtonLink>}
        />
      </div>
    )
  }
  return <Detail key={template.id} template={template} />
}

function Detail({ template }: { template: Template }) {
  const { t, formatNumber } = useI18n()
  const navigate = useNavigate()
  const creator = getCreator(template.creatorId)
  const duration = templateDuration(template)
  const reduced = useReducedMotion()
  const player = usePlayer(duration)
  const [ref, inView] = useInView<HTMLDivElement>()
  const { play, pause } = player

  // Autoplay muted while visible; never autoplay with reduced motion.
  useEffect(() => {
    if (inView && !reduced) play()
    else pause()
  }, [inView, reduced, play, pause])

  const related = TEMPLATES.filter((x) => x.id !== template.id && (x.category === template.category || x.styles.some((s) => template.styles.includes(s))))
    .sort((a, b) => Number(b.category === template.category) - Number(a.category === template.category) || b.trend - a.trend)
    .slice(0, 8)
  const moreFromCreator = TEMPLATES.filter((x) => x.creatorId === template.creatorId && x.id !== template.id).slice(0, 8)

  const landscape = template.aspect === '16:9'
  const useHref = `/workspace/new/${template.id}`

  return (
    <div className="px-4 pt-4 pb-28 sm:px-6 lg:px-8 lg:pt-6 lg:pb-8">
      <button
        type="button"
        onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
        className="mb-4 inline-flex items-center gap-1.5 rounded-md text-[13px] text-muted hover:text-fg"
      >
        <ArrowLeft size={15} aria-hidden /> {t('detail.back')}
      </button>

      <div className={cn('grid gap-6 lg:gap-10', landscape ? 'xl:grid-cols-[minmax(0,1fr)_380px]' : 'lg:grid-cols-[minmax(0,1fr)_380px]')}>
        {/* Player */}
        <div ref={ref} className="min-w-0">
          <div className="flex items-center justify-center rounded-[18px] border border-line bg-surface p-3 sm:p-6">
            <div
              className="relative w-full overflow-hidden rounded-xl"
              style={{
                ...aspectStyle(template.aspect),
                maxWidth: template.aspect === '9:16' ? 'min(100%, calc((100dvh - 260px) * 9 / 16))' : template.aspect === '1:1' ? 'min(100%, calc(100dvh - 260px))' : '100%',
                minWidth: template.aspect === '9:16' ? 'min(100%, 280px)' : undefined,
              }}
            >
              <TemplateStage template={template} time={player.time} playing={player.playing} quality="full" still={reduced} eager />
            </div>
          </div>
          <div className="mt-3 px-1">
            <PlayerControls template={template} player={player} duration={duration} />
          </div>
        </div>

        {/* Info & actions */}
        <aside className="min-w-0 lg:sticky lg:top-20 lg:self-start" aria-label="Template details">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone="demo">{t('demo.badge')}</Badge>
            <Badge>{t(`category.${template.category}`)}</Badge>
            {template.tier === 'premium' ? (
              <Badge tone="premium">
                <Crown size={11} aria-hidden /> {t('tier.premium')}
              </Badge>
            ) : (
              <Badge tone="accent">{t('tier.free')}</Badge>
            )}
          </div>
          <h1 className="mt-3 font-display text-[32px] leading-[1.02] font-bold tracking-[-0.04em] sm:text-[40px]">{template.title}</h1>
          {creator && (
            <Link to={`/creators/${creator.id}`} className="mt-3 inline-flex items-center gap-2 rounded-lg text-sm text-muted hover:text-fg">
              <Avatar photo={creator.avatar} name="" size={24} />
              <span className="font-medium text-fg">{creator.name}</span>
              <span className="text-faint">@{creator.handle}</span>
            </Link>
          )}
          <p className="mt-4 text-[15px] leading-relaxed text-muted">{template.description}</p>

          <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line text-sm">
            <Meta label={t('detail.duration')} value={formatDuration(duration)} />
            <Meta label={t('detail.aspect')} value={template.aspect} />
            <Meta label={t('detail.scenes')} value={String(template.scenes.length)} />
            <Meta
              label={t('detail.slots')}
              value={[template.mediaSlots.length ? t('detail.mediaSlots', { n: template.mediaSlots.length }) : null, t('detail.textSlots', { n: template.textSlots.length })]
                .filter(Boolean)
                .join(' · ')}
            />
            <Meta label={t('detail.outputs')} value={template.ratios.join(' · ')} wide />
          </dl>

          <div className="mt-5 hidden gap-2 lg:flex">
            <ButtonLink to={useHref} size="lg" className="flex-1">
              <Sparkles size={16} aria-hidden /> {t('detail.use')}
            </ButtonLink>
            <SaveButton templateId={template.id} withLabel className={cn('h-12 rounded-xl border border-line-strong px-4 text-[15px] font-medium hover:bg-fg/[0.06]')} />
          </div>

          <div className="mt-5 rounded-xl border border-line bg-surface p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ShieldCheck size={16} className="text-success" aria-hidden /> {t('detail.license')} · {t(`tier.${template.tier}`)}
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">
              {template.tier === 'free' ? t('detail.licenseFree') : t('detail.licensePremium')}
            </p>
            <p className="mt-2 text-[12px] text-faint">{t('detail.licensePlaceholder')}</p>
          </div>
          <p className="mt-3 text-[12px] text-faint">
            {formatNumber(template.uses)} uses · {t('demo.sample')}
          </p>
        </aside>
      </div>

      <Customizable template={template} />

      {related.length > 0 && (
        <section className="mt-14">
          <SectionHeader title={t('detail.related')} />
          <TemplateGrid templates={related} maxColumns={4} />
        </section>
      )}
      {creator && moreFromCreator.length > 0 && (
        <section className="mt-14">
          <SectionHeader
            title={t('detail.moreFrom', { name: creator.name })}
            action={
              <Link to={`/creators/${creator.id}`} className="text-[13px] font-medium text-muted hover:text-fg">
                {t('detail.viewProfile')}
              </Link>
            }
          />
          <TemplateGrid templates={moreFromCreator} maxColumns={4} />
        </section>
      )}

      {/* Mobile sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-line bg-bg/90 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl lg:hidden">
        <SaveButton templateId={template.id} withLabel className="h-12 rounded-xl border border-line-strong px-4 text-[14px] font-medium" />
        <ButtonLink to={useHref} size="lg" className="flex-1">
          <Sparkles size={16} aria-hidden /> {t('detail.use')}
        </ButtonLink>
      </div>
    </div>
  )
}

function Meta({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={cn('bg-surface px-3.5 py-3', wide && 'col-span-2')}>
      <dt className="text-[11.5px] text-faint">{label}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  )
}

function Customizable({ template }: { template: Template }) {
  const { t } = useI18n()
  const items: { icon: ReactNode; title: string; body: string; extra?: ReactNode }[] = [
    {
      icon: <ImageIcon size={17} />,
      title: t('detail.c.media'),
      body: template.mediaSlots.length ? t('detail.c.mediaBody', { n: template.mediaSlots.length }) : t('detail.noMedia'),
      extra: template.mediaSlots.length > 0 && (
        <div className="mt-3 flex gap-1.5">
          {template.mediaSlots.map((s) => (
            <figure key={s.id} className="min-w-0 flex-1">
              <img src={photoUrl(s.photo, 200, 200)} alt="" loading="lazy" className="aspect-square w-full rounded-lg object-cover" />
              <figcaption className="mt-1 truncate text-[11px] text-faint">{s.label}</figcaption>
            </figure>
          ))}
        </div>
      ),
    },
    {
      icon: <Type size={17} />,
      title: t('detail.c.text'),
      body: t('detail.c.textBody', { n: template.textSlots.length }),
      extra: (
        <ul className="mt-3 flex flex-col gap-1">
          {template.textSlots.slice(0, 4).map((s) => (
            <li key={s.id} className="flex items-baseline justify-between gap-3 text-[12.5px]">
              <span className="shrink-0 text-faint">{s.label}</span>
              <span className="truncate text-fg/80">{s.default}</span>
            </li>
          ))}
        </ul>
      ),
    },
    {
      icon: <Palette size={17} />,
      title: t('detail.c.colors'),
      body: t('detail.c.colorsBody'),
      extra: (
        <div className="mt-3 flex gap-1.5">
          {[template.palette.primary, template.palette.secondary, template.palette.text].map((c, i) => (
            <span key={i} className="size-7 rounded-lg ring-1 ring-fg/15" style={{ background: c }} title={c} />
          ))}
        </div>
      ),
    },
    ...(template.showLogo ? [{ icon: <Stamp size={17} />, title: t('detail.c.logo'), body: t('detail.c.logoBody') }] : []),
    { icon: <Music size={17} />, title: t('detail.c.music'), body: `${t('detail.c.musicBody')} Default: ${getTrack(template.music).title}.` },
    { icon: <RectangleHorizontal size={17} />, title: t('detail.c.ratio'), body: t('detail.c.ratioBody', { list: template.ratios.join(', ') }) },
  ]
  return (
    <section className="mt-14" aria-labelledby="customize">
      <SectionHeader title={t('detail.customize')} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((it) => (
          <div key={it.title} className="rounded-[var(--radius-card)] border border-line bg-surface p-4">
            <div className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-lg bg-fg/[0.06] text-muted" aria-hidden>
                {it.icon}
              </span>
              <h3 className="text-[14px] font-medium">{it.title}</h3>
            </div>
            <p className="mt-2.5 text-[13px] leading-relaxed text-muted">{it.body}</p>
            {it.extra}
          </div>
        ))}
      </div>
    </section>
  )
}
