import { Bookmark, Crown, Play } from 'lucide-react'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { getCreator } from '../data/creators'
import { templateDuration } from '../data/templates'
import type { Template } from '../data/types'
import { useI18n } from '../i18n'
import { cn } from '../lib/cn'
import { useCanHover, useInView, usePlayer, useReducedMotion } from '../lib/hooks'
import { useAppStore } from '../store/AppStore'
import { useToast } from '../store/Toast'
import { aspectStyle, posterTime, TemplateStage } from './stage/TemplateStage'
import { Avatar } from './ui'

/** On touch devices only one card previews at a time. */
const PreviewCtx = createContext<{ activeId: string | null; setActiveId: (id: string | null) => void }>({
  activeId: null,
  setActiveId: () => {},
})

export function PreviewProvider({ children }: { children: ReactNode }) {
  const [activeId, setActiveId] = useState<string | null>(null)
  return <PreviewCtx.Provider value={{ activeId, setActiveId }}>{children}</PreviewCtx.Provider>
}

export function formatDuration(s: number) {
  return `0:${String(Math.round(s)).padStart(2, '0')}`
}

export function SaveButton({ templateId, className, withLabel }: { templateId: string; className?: string; withLabel?: boolean }) {
  const { isSaved, setSaved } = useAppStore()
  const { t } = useI18n()
  const toast = useToast()
  const saved = isSaved(templateId)
  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? t('card.unsave') : t('card.save')}
      title={saved ? t('card.unsave') : t('card.save')}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        setSaved(templateId, !saved)
        toast(saved ? t('saved.removed') : t('saved.added'), {
          kind: saved ? 'info' : 'success',
          action: { label: t('saved.undo'), onClick: () => setSaved(templateId, saved) },
        })
      }}
      className={cn(
        'inline-flex items-center justify-center gap-2 transition-colors duration-200',
        withLabel ? '' : 'size-8 rounded-[9px] bg-black/55 text-white backdrop-blur-md hover:bg-black/75',
        className,
      )}
    >
      <Bookmark size={withLabel ? 16 : 15} className={cn(saved && 'fill-current')} aria-hidden />
      {withLabel && <span>{saved ? t('detail.saved') : t('detail.save')}</span>}
    </button>
  )
}

export function TemplateCard({ template, footer }: { template: Template; footer?: ReactNode }) {
  const { t } = useI18n()
  const canHover = useCanHover()
  const reduced = useReducedMotion()
  const { isSaved } = useAppStore()
  const { activeId, setActiveId } = useContext(PreviewCtx)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [ref, inView] = useInView<HTMLElement>('80px')
  const creator = getCreator(template.creatorId)
  const duration = templateDuration(template)
  const poster = posterTime(template)
  const player = usePlayer(duration, { initial: poster })

  const selected = canHover ? hovered || focused : activeId === template.id
  const shouldPlay = selected && inView && !reduced
  const { play, pause, seek } = player

  useEffect(() => {
    if (shouldPlay) {
      seek(0)
      play()
    } else {
      pause()
      seek(poster)
    }
  }, [shouldPlay, play, pause, seek, poster])

  // A touch-selected card that scrolls away is deselected.
  useEffect(() => {
    if (!inView && activeId === template.id) setActiveId(null)
  }, [inView, activeId, template.id, setActiveId])

  const detailHref = `/templates/${template.id}`
  const useHref = `/workspace/new/${template.id}`

  return (
    <article
      ref={ref}
      className="group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocused(false)
      }}
    >
      <div
        className={cn(
          '@container relative overflow-hidden rounded-[var(--radius-card)] bg-surface-2 ring-1 ring-line transition-[box-shadow,filter] duration-200',
          selected && 'ring-fg/30',
        )}
        style={aspectStyle(template.aspect)}
      >
        <TemplateStage template={template} time={player.time} playing={shouldPlay} still={reduced} />

        {/* Primary hit area: opens detail on desktop, toggles preview on touch */}
        {canHover ? (
          <Link to={detailHref} className="absolute inset-0 z-0 rounded-[var(--radius-card)]" aria-label={template.title} />
        ) : (
          <button
            type="button"
            className="absolute inset-0 z-0"
            aria-label={selected ? t('card.stopPreview', { title: template.title }) : t('card.playPreview', { title: template.title })}
            aria-pressed={selected}
            onClick={() => setActiveId(selected ? null : template.id)}
          />
        )}

        <div className="pointer-events-none absolute inset-x-2 top-2 z-10 flex items-start justify-between gap-2">
          <div className="flex gap-1">
            {template.tier === 'premium' ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-black/55 px-1.5 py-0.5 text-[11px] font-medium text-[#FF8A4C] backdrop-blur-md">
                <Crown size={11} aria-hidden /> {t('tier.premium')}
              </span>
            ) : (
              <span className="rounded-md bg-black/55 px-1.5 py-0.5 text-[11px] font-medium text-white/90 backdrop-blur-md">{t('tier.free')}</span>
            )}
          </div>
          <SaveButton
            templateId={template.id}
            className={cn(
              'pointer-events-auto',
              canHover && !isSaved(template.id) && 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100',
            )}
          />
        </div>

        {!canHover && !selected && (
          <span className="pointer-events-none absolute right-2 bottom-2 z-10 inline-flex size-7 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-md">
            <Play size={12} className="fill-current" aria-hidden />
          </span>
        )}

        <div
          className={cn(
            'absolute inset-x-0 bottom-0 z-10 flex gap-1.5 @max-[240px]:flex-col-reverse bg-gradient-to-t from-black/70 to-transparent p-2 pt-10 transition-opacity duration-200',
            selected ? 'opacity-100' : 'pointer-events-none opacity-0',
            canHover && 'group-focus-within:pointer-events-auto group-focus-within:opacity-100',
          )}
        >
          <Link
            to={detailHref}
            tabIndex={selected || canHover ? 0 : -1}
            className="flex h-8 flex-1 items-center justify-center rounded-lg whitespace-nowrap @max-[240px]:flex-none bg-white/15 px-2 text-[12.5px] font-medium text-white backdrop-blur-md transition-colors hover:bg-white/25"
          >
            {t('card.preview')}
          </Link>
          <Link
            to={useHref}
            tabIndex={selected || canHover ? 0 : -1}
            className="flex h-8 flex-[1.4] items-center justify-center rounded-lg whitespace-nowrap @max-[240px]:flex-none bg-accent px-2 text-[12.5px] font-semibold text-white transition-colors duration-200 hover:bg-accent-hover"
          >
            {t('card.use')}
          </Link>
        </div>
      </div>

      <div className="mt-2.5 px-0.5">
        <Link to={detailHref} className="block truncate text-[14px] font-medium text-fg hover:text-fg" tabIndex={-1}>
          {template.title}
        </Link>
        <div className="mt-1 flex items-center gap-1.5 text-[12px] text-muted">
          {creator && (
            <Link to={`/creators/${creator.id}`} className="flex min-w-0 items-center gap-1.5 hover:text-fg">
              <Avatar photo={creator.avatar} name="" size={16} />
              <span className="truncate">{creator.name}</span>
            </Link>
          )}
          <span className="ml-auto flex shrink-0 items-center gap-1.5 font-mono text-[11px] text-faint">
            <span>{formatDuration(duration)}</span>
            <span aria-hidden>·</span>
            <span>{template.aspect}</span>
          </span>
        </div>
        {footer}
      </div>
    </article>
  )
}
