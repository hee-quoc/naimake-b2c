import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import type { Aspect, Customization, FontId, Scene, Template, TextRole } from '../../data/types'
import { cn } from '../../lib/cn'
import { photoUrl } from '../../lib/media'
import { defaultCustomization } from '../../store/AppStore'

/** Cross-fade length between scenes, in seconds. */
const TRANSITION = 0.45

export function sceneStarts(t: Template): number[] {
  let acc = 0
  return t.scenes.map((s) => {
    const start = acc
    acc += s.duration
    return start
  })
}

export function sceneAt(t: Template, time: number): { index: number; local: number } {
  const starts = sceneStarts(t)
  for (let i = t.scenes.length - 1; i >= 0; i--) {
    if (time >= starts[i]) return { index: i, local: time - starts[i] }
  }
  return { index: 0, local: time }
}

/** A frame where the first scene's text is fully visible — used for posters. */
export function posterTime(t: Template): number {
  return Math.min(t.scenes[0].duration - TRANSITION - 0.05, 0.6 + t.scenes[0].texts.length * 0.3)
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n))
const easeOut = (n: number) => 1 - Math.pow(1 - n, 3)

function readableOn(hex: string): string {
  const v = hex.replace('#', '')
  const full = v.length === 3 ? v.split('').map((c) => c + c).join('') : v
  const n = parseInt(full, 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 150 ? '#0A0A0B' : '#FFFFFF'
}

const FONT_FAMILY: Record<FontId, string> = {
  sans: 'var(--font-sans)',
  display: 'var(--font-sans)',
  serif: 'var(--font-serif)',
  mono: 'var(--font-mono)',
}

/** Average glyph width (in em) per font, used to keep the longest word on one line. */
const GLYPH: Record<FontId, number> = { display: 0.66, serif: 0.46, mono: 0.62, sans: 0.58 }

function headlineStyle(font: FontId, big: boolean, value: string): CSSProperties {
  const scale = big ? 1.4 : 1
  const longest = Math.max(4, ...value.split(/\s+/).map((w) => w.length))
  const fit = (base: number) => `min(${base * scale}cqmin, calc((100cqw - 16cqmin) / ${(longest * GLYPH[font]).toFixed(2)}))`
  switch (font) {
    case 'display':
      return { fontWeight: 800, fontSize: fit(12), lineHeight: 0.92, letterSpacing: '-0.045em', textTransform: 'uppercase' }
    case 'serif':
      return { fontWeight: 400, fontSize: fit(12.5), lineHeight: 0.98, letterSpacing: '-0.015em' }
    case 'mono':
      return { fontWeight: 500, fontSize: fit(7.5), lineHeight: 1.08, letterSpacing: '-0.02em', textTransform: 'uppercase' }
    default:
      return { fontWeight: 650, fontSize: fit(10), lineHeight: 1, letterSpacing: '-0.035em' }
  }
}

interface StageProps {
  template: Template
  custom?: Customization
  time: number
  playing?: boolean
  /** Thumb uses smaller images; full is for the detail page and workspace. */
  quality?: 'thumb' | 'full'
  /** Disable Ken Burns and text movement (reduced motion). */
  still?: boolean
  /** Show where the logo would go even when none is uploaded (workspace). */
  placeholders?: boolean
  /** Text slot ids to outline (workspace focus). */
  highlight?: string | null
  eager?: boolean
  className?: string
}

export function TemplateStage({
  template,
  custom,
  time,
  playing = false,
  quality = 'thumb',
  still = false,
  placeholders = false,
  highlight = null,
  eager = false,
  className,
}: StageProps) {
  const c = custom ?? defaultCustomization(template)
  const { index, local } = sceneAt(template, time)
  const scene = template.scenes[index]
  const next = template.scenes[index + 1]
  const fadeStart = scene.duration - TRANSITION
  const incoming = next && local > fadeStart ? clamp01((local - fadeStart) / TRANSITION) : 0

  return (
    <div
      className={cn('stage relative isolate h-full w-full overflow-hidden select-none', className)}
      style={{ background: c.colors.secondary, fontFamily: FONT_FAMILY[template.font] }}
      aria-hidden
    >
      <SceneLayer
        template={template}
        scene={scene}
        local={local}
        c={c}
        playing={playing}
        quality={quality}
        still={still}
        placeholders={placeholders}
        highlight={highlight}
        eager={eager}
      />
      {incoming > 0 && next && (
        <div className="absolute inset-0" style={{ opacity: incoming }}>
          <SceneLayer
            template={template}
            scene={next}
            local={0}
            c={c}
            playing={playing}
            quality={quality}
            still={still}
            placeholders={placeholders}
            highlight={highlight}
            eager
          />
        </div>
      )}
    </div>
  )
}

interface LayerProps {
  template: Template
  scene: Scene
  local: number
  c: Customization
  playing: boolean
  quality: 'thumb' | 'full'
  still: boolean
  placeholders: boolean
  highlight: string | null
  eager: boolean
}

function SceneLayer({ template, scene, local, c, playing, quality, still, placeholders, highlight, eager }: LayerProps) {
  const p = clamp01(local / scene.duration)
  const vertical = c.ratio === '9:16'
  const isSplit = scene.layout === 'split'
  const slot = template.mediaSlots.find((s) => s.id === scene.media)
  const override = scene.media ? c.media[scene.media] : undefined
  const width = quality === 'full' ? 1400 : 640
  const src = override?.src ?? (slot ? photoUrl(slot.photo, width) : undefined)

  const enter = (i: number) => {
    const e = easeOut(clamp01((local - (0.18 + i * 0.2)) / 0.55))
    return { opacity: e, transform: still ? undefined : `translateY(${(1 - e) * 5}cqmin)` } as CSSProperties
  }

  const texts = scene.texts
    .map((id) => template.textSlots.find((s) => s.id === id))
    .filter((s): s is NonNullable<typeof s> => !!s)

  const renderText = (role: TextRole, id: string, i: number, extra?: CSSProperties) => (
    <StageText
      key={id + i}
      role={role}
      value={c.texts[id] ?? ''}
      font={template.font}
      colors={c.colors}
      big={scene.layout === 'stack'}
      style={{ ...enter(i), ...extra }}
      highlighted={highlight === id}
    />
  )

  const mediaBox: CSSProperties = isSplit
    ? vertical
      ? { position: 'absolute', left: 0, right: 0, top: 0, height: '58%' }
      : { position: 'absolute', top: 0, bottom: 0, right: 0, width: '56%' }
    : { position: 'absolute', inset: 0 }

  return (
    <div className="absolute inset-0">
      {src && (
        <div style={mediaBox} className="overflow-hidden">
          <StageMedia
            key={src}
            src={src}
            kind={override?.kind ?? 'image'}
            transform={still ? 'scale(1.02)' : motionTransform(scene.motion, p)}
            playing={playing}
            eager={eager}
          />
        </div>
      )}
      <Overlay layout={scene.layout} hasMedia={!!src} />

      {template.showLogo && scene.layout !== 'logo' && (c.logo || placeholders) && (
        <div className="absolute top-[5cqmin] left-[5cqmin] z-10" style={{ height: '7cqmin' }}>
          {c.logo ? (
            <img src={c.logo} alt="" className="h-full w-auto max-w-[30cqmin] object-contain" />
          ) : (
            <div
              className="flex h-full items-center rounded-[1.2cqmin] border border-dashed px-[2cqmin] text-[2.6cqmin] font-semibold tracking-wider uppercase"
              style={{ borderColor: `${c.colors.text}80`, color: c.colors.text }}
            >
              Logo
            </div>
          )}
        </div>
      )}

      <LayoutBox layout={scene.layout} vertical={vertical} colors={c.colors}>
        {scene.layout === 'logo' ? (
          <>
            <div style={{ ...enterScale(local, still), height: '20cqmin' }} className="mb-[4cqmin] flex items-center justify-center">
              {c.logo ? (
                <img src={c.logo} alt="" className="h-full w-auto max-w-[60cqmin] object-contain" />
              ) : (
                <LogoMark color={c.colors.primary} bg={c.colors.secondary} label={c.texts.brand ?? ''} />
              )}
            </div>
            {texts.map((s, i) => renderText(s.role, s.id, i + 1))}
          </>
        ) : scene.layout === 'card' ? (
          <div
            className="flex w-full flex-wrap items-center justify-between gap-[3cqmin] rounded-[3cqmin] p-[4.5cqmin]"
            style={{ background: `${c.colors.secondary}E6`, ...enter(0), transform: still ? undefined : enter(0).transform }}
          >
            {texts.map((s, i) => renderText(s.role, s.id, i + 0.5, s.role === 'headline' ? { fontSize: '7.5cqmin' } : undefined))}
          </div>
        ) : (
          texts.map((s, i) => renderText(s.role, s.id, i))
        )}
      </LayoutBox>
    </div>
  )
}

function enterScale(local: number, still: boolean): CSSProperties {
  const e = easeOut(clamp01((local - 0.1) / 0.7))
  return { opacity: e, transform: still ? undefined : `scale(${0.86 + 0.14 * e})` }
}

function motionTransform(motion: Scene['motion'], p: number): string {
  switch (motion) {
    case 'zoom-in':
      return `scale(${1.04 + 0.1 * p})`
    case 'zoom-out':
      return `scale(${1.14 - 0.1 * p})`
    case 'pan-left':
      return `scale(1.12) translateX(${3 - 6 * p}%)`
    case 'pan-right':
      return `scale(1.12) translateX(${-3 + 6 * p}%)`
    case 'pan-up':
      return `scale(1.12) translateY(${3 - 6 * p}%)`
    default:
      return 'scale(1.02)'
  }
}

function StageMedia({
  src,
  kind,
  transform,
  playing,
  eager,
}: {
  src: string
  kind: 'image' | 'video'
  transform: string
  playing: boolean
  eager: boolean
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)

  // Cached and data-URL images can finish before React attaches onLoad.
  useEffect(() => {
    const img = imgRef.current
    if (img?.complete && img.naturalWidth > 0) setLoaded(true)
  }, [])

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (playing) void v.play().catch(() => {})
    else v.pause()
  }, [playing, src])

  if (failed) {
    return <div className="absolute inset-0 bg-gradient-to-br from-surface-3 to-surface" />
  }

  const common = 'absolute inset-0 h-full w-full object-cover transition-opacity duration-200'
  return (
    <>
      {!loaded && <div className="skeleton absolute inset-0" />}
      {kind === 'video' ? (
        <video
          ref={videoRef}
          src={src}
          muted
          loop
          playsInline
          preload="metadata"
          onLoadedData={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={cn(common, loaded ? 'opacity-100' : 'opacity-0')}
          style={{ transform }}
        />
      ) : (
        <img
          ref={imgRef}
          src={src}
          alt=""
          draggable={false}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={cn(common, loaded ? 'opacity-100' : 'opacity-0')}
          style={{ transform }}
        />
      )}
    </>
  )
}

function Overlay({ layout, hasMedia }: { layout: Scene['layout']; hasMedia: boolean }) {
  if (!hasMedia || layout === 'split') return null
  const bg =
    layout === 'lower' || layout === 'card'
      ? 'linear-gradient(to top, rgba(0,0,0,.78) 0%, rgba(0,0,0,.25) 45%, rgba(0,0,0,.05) 100%)'
      : layout === 'caption'
        ? 'linear-gradient(to top, rgba(0,0,0,.35), rgba(0,0,0,0) 50%)'
        : 'rgba(0,0,0,.38)'
  return <div className="absolute inset-0" style={{ background: bg }} />
}

function LayoutBox({
  layout,
  vertical,
  colors,
  children,
}: {
  layout: Scene['layout']
  vertical: boolean
  colors: Customization['colors']
  children: ReactNode
}) {
  const pad = 'p-[7cqmin]'
  switch (layout) {
    case 'lower':
      return <div className={cn('absolute inset-0 flex flex-col items-start justify-end gap-[2.4cqmin]', pad)}>{children}</div>
    case 'center':
    case 'logo':
      return <div className={cn('absolute inset-0 flex flex-col items-center justify-center gap-[2.6cqmin] text-center', pad)}>{children}</div>
    case 'stack':
      return <div className={cn('absolute inset-0 flex flex-col items-start justify-center gap-[2cqmin]', pad)}>{children}</div>
    case 'card':
      return <div className={cn('absolute inset-0 flex flex-col justify-end', 'p-[5cqmin]')}>{children}</div>
    case 'caption':
      return <div className={cn('absolute inset-0 flex flex-col items-center justify-end gap-[2cqmin] pb-[22%] text-center', pad)}>{children}</div>
    case 'split':
      return (
        <div
          className={cn('absolute flex flex-col justify-center gap-[2.6cqmin]', pad)}
          style={{ background: colors.secondary, ...(vertical ? { left: 0, right: 0, bottom: 0, height: '42%' } : { left: 0, top: 0, bottom: 0, width: '44%' }) }}
        >
          {children}
        </div>
      )
  }
}

function StageText({
  role,
  value,
  font,
  colors,
  big,
  style,
  highlighted,
}: {
  role: TextRole
  value: string
  font: FontId
  colors: Customization['colors']
  big: boolean
  style: CSSProperties
  highlighted: boolean
}) {
  if (!value.trim()) return null
  const ring = highlighted ? { outline: '0.5cqmin solid #3B6FFF', outlineOffset: '1cqmin' } : {}
  const base: CSSProperties = { color: colors.text, overflowWrap: 'anywhere', maxWidth: '100%', ...ring, ...style }

  switch (role) {
    case 'headline':
      return <div style={{ ...headlineStyle(font, big, value), ...base, overflowWrap: 'break-word' }}>{value}</div>
    case 'eyebrow':
      return (
        <div
          style={{
            ...base,
            color: colors.primary,
            fontFamily: font === 'serif' ? 'var(--font-sans)' : undefined,
            fontSize: '3.4cqmin',
            fontWeight: 600,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}
        >
          {value}
        </div>
      )
    case 'body':
      return (
        <div style={{ ...base, fontFamily: font === 'serif' ? 'var(--font-sans)' : undefined, fontSize: '4.4cqmin', fontWeight: 450, lineHeight: 1.3, opacity: (base.opacity as number) * 0.92, maxWidth: '78cqmin' }}>
          {value}
        </div>
      )
    case 'price':
      return <div style={{ ...base, color: colors.primary, fontSize: '11cqmin', fontWeight: 750, letterSpacing: '-0.04em', lineHeight: 1, fontFamily: 'var(--font-sans)' }}>{value}</div>
    case 'cta':
      return (
        <div
          style={{
            ...base,
            background: colors.primary,
            color: readableOn(colors.primary),
            fontFamily: 'var(--font-sans)',
            fontSize: '3.8cqmin',
            fontWeight: 650,
            padding: '2cqmin 4.2cqmin',
            borderRadius: '99cqmin',
            whiteSpace: 'nowrap',
          }}
        >
          {value}
        </div>
      )
    case 'caption':
      return (
        <div
          style={{
            ...base,
            background: colors.secondary,
            color: colors.text,
            fontFamily: 'var(--font-sans)',
            fontSize: '5.2cqmin',
            fontWeight: 700,
            lineHeight: 1.25,
            padding: '1.8cqmin 3.4cqmin',
            borderRadius: '2.2cqmin',
            maxWidth: '82cqmin',
            boxDecorationBreak: 'clone',
          }}
        >
          {value}
        </div>
      )
  }
}

function LogoMark({ color, bg, label }: { color: string; bg: string; label: string }) {
  const initials =
    label
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('') || 'N'
  return (
    <div
      className="flex aspect-square h-full items-center justify-center rounded-[4cqmin] text-[8cqmin] font-bold tracking-tight"
      style={{ background: color, color: readableOn(color) === '#FFFFFF' ? '#FFFFFF' : bg, fontFamily: 'var(--font-sans)' }}
    >
      {initials}
    </div>
  )
}

export function aspectStyle(a: Aspect): CSSProperties {
  return { aspectRatio: a === '9:16' ? '9 / 16' : a === '16:9' ? '16 / 9' : '1 / 1' }
}
