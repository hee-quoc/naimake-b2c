import { ChevronDown, ImagePlus, Music2, RotateCcw, Trash2, Upload, Video } from 'lucide-react'
import { useId, useRef, useState, type ReactNode } from 'react'
import { MUSIC } from '../../data/music'
import type { Aspect, Customization, MediaOverride, Template } from '../../data/types'
import { AspectGlyph } from '../../components/Catalog'
import { sceneStarts, TemplateStage } from '../../components/stage/TemplateStage'
import { useI18n } from '../../i18n'
import { cn } from '../../lib/cn'
import { photoUrl } from '../../lib/media'

const MAX_BYTES = 50 * 1024 * 1024

export function Group({ title, defaultOpen = true, children, icon }: { title: string; defaultOpen?: boolean; children: ReactNode; icon?: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen)
  const id = useId()
  return (
    <section className="border-b border-line last:border-b-0">
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center gap-2 px-4 py-3.5 text-left text-[13px] font-semibold tracking-tight hover:bg-fg/[0.02]"
        >
          {icon && <span className="text-muted" aria-hidden>{icon}</span>}
          <span className="flex-1">{title}</span>
          <ChevronDown size={15} className={cn('text-faint transition-transform duration-200', open && 'rotate-180')} aria-hidden />
        </button>
      </h3>
      {open && (
        <div id={id} className="fade-in px-4 pb-4">
          {children}
        </div>
      )}
    </section>
  )
}

/** Hidden file input + trigger. Validates type and size before handing the file over. */
export function FilePick({
  accept,
  onFile,
  onError,
  children,
  className,
  label,
}: {
  accept: string
  onFile: (f: File) => void
  onError: (msg: string) => void
  children: ReactNode
  className?: string
  label: string
}) {
  const ref = useRef<HTMLInputElement>(null)
  const { t } = useI18n()
  return (
    <>
      <button type="button" className={className} onClick={() => ref.current?.click()} aria-label={label}>
        {children}
      </button>
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          const f = e.target.files?.[0]
          e.target.value = ''
          if (!f) return
          const okType = accept.split(',').some((a) => (a.endsWith('/*') ? f.type.startsWith(a.slice(0, -1)) : f.type === a))
          if (!okType) return onError(t('ws.uploadError'))
          if (f.size > MAX_BYTES) return onError(t('ws.uploadTooBig'))
          onFile(f)
        }}
      />
    </>
  )
}

export function ScenesPanel({
  template,
  custom,
  current,
  onSelect,
  onMedia,
  onResetMedia,
  onError,
}: {
  template: Template
  custom: Customization
  current: number
  onSelect: (i: number) => void
  onMedia: (slotId: string, f: File) => void
  onResetMedia: (slotId: string) => void
  onError: (msg: string) => void
}) {
  const { t } = useI18n()
  const starts = sceneStarts(template)
  return (
    <div className="flex flex-col gap-1.5 p-3">
      <div className="px-1 pt-1 pb-2 text-[11px] font-medium tracking-[0.08em] text-faint uppercase">{t('ws.scenes')}</div>
      {template.scenes.map((s, i) => {
        const active = i === current
        const slot = template.mediaSlots.find((m) => m.id === s.media)
        return (
          <div key={s.id} className={cn('rounded-xl border transition-colors duration-200', active ? 'border-accent/50 bg-accent-soft/40' : 'border-transparent hover:bg-fg/[0.03]')}>
            <button type="button" onClick={() => onSelect(i)} aria-current={active ? 'step' : undefined} className="flex w-full items-center gap-3 p-2 text-left">
              <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface-3">
                <TemplateStage template={template} custom={{ ...custom, ratio: '1:1' }} time={starts[i] + Math.min(s.duration - 0.5, 1.4)} still />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-medium">
                  {i + 1}. {s.name}
                </span>
                <span className="font-mono text-[11px] text-faint">{s.duration.toFixed(1)}s</span>
              </span>
            </button>
            {active && (
              <div className="px-2 pb-2.5">
                {slot ? (
                  <MediaSlotRow
                    label={slot.label}
                    defaultSrc={photoUrl(slot.photo, 160, 160)}
                    override={custom.media[slot.id]}
                    onFile={(f) => onMedia(slot.id, f)}
                    onReset={() => onResetMedia(slot.id)}
                    onError={onError}
                  />
                ) : (
                  <p className="px-1 text-[12px] leading-relaxed text-faint">{t('ws.noMedia')}</p>
                )}
              </div>
            )}
          </div>
        )
      })}

      {template.mediaSlots.length > 0 && (
        <>
          <div className="mt-4 px-1 pb-2 text-[11px] font-medium tracking-[0.08em] text-faint uppercase">All media</div>
          <div className="flex flex-col gap-1.5 px-1">
            {template.mediaSlots.map((slot) => (
              <MediaSlotRow
                key={slot.id}
                label={slot.label}
                defaultSrc={photoUrl(slot.photo, 160, 160)}
                override={custom.media[slot.id]}
                onFile={(f) => onMedia(slot.id, f)}
                onReset={() => onResetMedia(slot.id)}
                onError={onError}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function MediaSlotRow({
  label,
  defaultSrc,
  override,
  onFile,
  onReset,
  onError,
}: {
  label: string
  defaultSrc: string
  override?: MediaOverride
  onFile: (f: File) => void
  onReset: () => void
  onError: (msg: string) => void
}) {
  const { t } = useI18n()
  return (
    <div className="flex items-center gap-2.5 rounded-lg bg-fg/[0.03] p-1.5">
      <span className="relative size-10 shrink-0 overflow-hidden rounded-md bg-surface-3">
        {override?.kind === 'video' ? (
          <video src={override.src} muted playsInline preload="metadata" className="h-full w-full object-cover" />
        ) : (
          <img src={override?.src ?? defaultSrc} alt="" className="h-full w-full object-cover" loading="lazy" />
        )}
        {override?.kind === 'video' && <Video size={12} className="absolute right-0.5 bottom-0.5 text-white drop-shadow" aria-hidden />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12.5px] font-medium">{label}</span>
        <span className="block truncate text-[11px] text-faint">{override ? override.name : 'Demo media'}</span>
      </span>
      {override && (
        <button type="button" onClick={onReset} aria-label={`${t('ws.reset')} ${label}`} title={t('ws.reset')} className="rounded-md p-1.5 text-faint hover:bg-fg/[0.06] hover:text-fg">
          <RotateCcw size={14} />
        </button>
      )}
      <FilePick
        accept="image/*,video/*"
        onFile={onFile}
        onError={onError}
        label={`${t('ws.replace')} ${label}`}
        className="inline-flex h-7 items-center gap-1 rounded-md bg-fg/[0.08] px-2 text-[12px] font-medium hover:bg-fg/[0.14]"
      >
        <Upload size={12} aria-hidden /> {t('ws.replace')}
      </FilePick>
    </div>
  )
}

const SWATCHES = ['#3B6FFF', '#FF5B3A', '#FFD23F', '#3DF5B4', '#4DA3FF', '#FF8AD8', '#FFFFFF', '#0A0A0B']

export function ControlsPanel({
  template,
  custom,
  currentTexts,
  onText,
  onFocusText,
  onColor,
  onResetColors,
  onLogo,
  onRemoveLogo,
  onMusic,
  onRatio,
  onError,
  hasVideo,
}: {
  template: Template
  custom: Customization
  currentTexts: string[]
  onText: (id: string, v: string) => void
  onFocusText: (id: string | null) => void
  onColor: (k: keyof Customization['colors'], v: string) => void
  onResetColors: () => void
  onLogo: (f: File) => void
  onRemoveLogo: () => void
  onMusic: (id: string) => void
  onRatio: (r: Aspect) => void
  onError: (msg: string) => void
  hasVideo: boolean
}) {
  const { t } = useI18n()
  return (
    <div>
      <Group title={t('ws.text')}>
        <p className="mb-3 text-[11.5px] text-faint">{t('ws.textHint')}</p>
        <div className="flex flex-col gap-3">
          {template.textSlots.map((s) => {
            const value = custom.texts[s.id] ?? ''
            const inScene = currentTexts.includes(s.id)
            const id = `text-${s.id}`
            return (
              <div key={s.id}>
                <div className="mb-1 flex items-center justify-between">
                  <label htmlFor={id} className={cn('text-[12px] font-medium', inScene ? 'text-fg' : 'text-muted')}>
                    {s.label}
                    {inScene && <span className="ml-1.5 inline-block size-1.5 -translate-y-px rounded-full bg-accent align-middle" aria-label="in current scene" />}
                  </label>
                  <span className={cn('font-mono text-[10.5px]', value.length >= s.maxLength ? 'text-danger' : 'text-faint')}>
                    {value.length}/{s.maxLength}
                  </span>
                </div>
                <input
                  id={id}
                  value={value}
                  maxLength={s.maxLength}
                  onChange={(e) => onText(s.id, e.target.value)}
                  onFocus={() => onFocusText(s.id)}
                  onBlur={() => onFocusText(null)}
                  className={cn(
                    'h-9 w-full rounded-lg border bg-fg/[0.03] px-3 text-[13px] text-fg transition-colors focus:border-accent focus:ring-3 focus:ring-accent/25 focus:outline-none',
                    inScene ? 'border-line-strong' : 'border-line',
                  )}
                />
              </div>
            )
          })}
        </div>
      </Group>

      <Group title={t('ws.colors')}>
        <div className="flex flex-col gap-2.5">
          {(
            [
              ['primary', t('ws.primary')],
              ['secondary', t('ws.background')],
              ['text', t('ws.textColor')],
            ] as const
          ).map(([k, label]) => (
            <ColorRow key={k} label={label} value={custom.colors[k]} onChange={(v) => onColor(k, v)} />
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Primary colour presets">
          {SWATCHES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onColor('primary', c)}
              aria-label={`Set primary colour to ${c}`}
              className={cn('size-6 rounded-md ring-1 ring-fg/15 transition-transform hover:scale-110', custom.colors.primary.toLowerCase() === c.toLowerCase() && 'ring-2 ring-fg')}
              style={{ background: c }}
            />
          ))}
        </div>
        <button type="button" onClick={onResetColors} className="mt-3 inline-flex items-center gap-1 text-[12px] text-muted hover:text-fg">
          <RotateCcw size={12} aria-hidden /> {t('ws.resetColors')}
        </button>
      </Group>

      <Group title={t('ws.logo')}>
        {template.showLogo ? (
          <div className="flex items-center gap-3">
            <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-line-strong bg-[repeating-conic-gradient(var(--line)_0_25%,transparent_0_50%)] bg-[length:12px_12px]">
              {custom.logo ? <img src={custom.logo} alt="Your logo" className="max-h-full max-w-full object-contain p-1" /> : <ImagePlus size={18} className="text-faint" aria-hidden />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap gap-1.5">
                <FilePick
                  accept="image/png,image/svg+xml,image/jpeg,image/webp"
                  onFile={onLogo}
                  onError={onError}
                  label={t('ws.logoUpload')}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-fg/[0.08] px-3 text-[12.5px] font-medium hover:bg-fg/[0.14]"
                >
                  <Upload size={13} aria-hidden /> {t('ws.logoUpload')}
                </FilePick>
                {custom.logo && (
                  <button type="button" onClick={onRemoveLogo} aria-label={t('ws.logoRemove')} className="inline-flex h-8 items-center rounded-lg px-2 text-faint hover:bg-fg/[0.06] hover:text-danger">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <p className="mt-1.5 text-[11.5px] text-faint">{t('ws.logoHint')}</p>
            </div>
          </div>
        ) : (
          <p className="text-[12px] text-faint">{t('ws.logoNotUsed')}</p>
        )}
      </Group>

      <Group title={t('ws.music')} defaultOpen={false}>
        <div className="flex flex-col gap-0.5" role="radiogroup" aria-label={t('ws.music')}>
          {MUSIC.map((m) => (
            <label key={m.id} className={cn('flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 hover:bg-fg/[0.04]', custom.music === m.id && 'bg-fg/[0.06]')}>
              <input type="radio" name="music" className="sr-only peer" checked={custom.music === m.id} onChange={() => onMusic(m.id)} />
              <span className={cn('flex size-7 items-center justify-center rounded-md peer-focus-visible:outline-2 peer-focus-visible:outline-accent', custom.music === m.id ? 'bg-accent text-white' : 'bg-fg/[0.06] text-muted')} aria-hidden>
                <Music2 size={13} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-medium">{m.title}</span>
                <span className="text-[11px] text-faint">
                  {m.mood}
                  {m.bpm ? ` · ${m.bpm} BPM` : ''}
                </span>
              </span>
            </label>
          ))}
        </div>
        <p className="mt-2 text-[11.5px] text-faint">{t('ws.musicNote')}</p>
      </Group>

      <Group title={t('ws.ratio')}>
        <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label={t('ws.ratio')}>
          {(['9:16', '1:1', '16:9'] as Aspect[]).map((r) => {
            const available = template.ratios.includes(r)
            return (
              <button
                key={r}
                type="button"
                role="radio"
                aria-checked={custom.ratio === r}
                disabled={!available}
                onClick={() => onRatio(r)}
                title={available ? r : `${r} isn’t available for this template`}
                className={cn(
                  'flex h-14 flex-col items-center justify-center gap-1.5 rounded-lg border text-[12px] font-medium transition-colors',
                  custom.ratio === r ? 'border-accent bg-accent-soft text-fg' : 'border-line text-muted hover:border-line-strong hover:text-fg',
                  !available && 'opacity-35 hover:border-line hover:text-muted',
                )}
              >
                <AspectGlyph aspect={r} />
                {r}
              </button>
            )
          })}
        </div>
      </Group>

      {hasVideo && <p className="px-4 py-3 text-[11.5px] text-faint">{t('ws.videoSession')}</p>}
    </div>
  )
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const id = useId()
  const [draft, setDraft] = useState<string | null>(null)
  return (
    <div className="flex items-center gap-2.5">
      <label htmlFor={id} className="w-20 text-[12px] text-muted">
        {label}
      </label>
      <span className="relative size-8 shrink-0 overflow-hidden rounded-lg ring-1 ring-fg/15" style={{ background: value }}>
        <input id={id} type="color" value={value} onChange={(e) => onChange(e.target.value.toUpperCase())} className="absolute inset-0 size-full cursor-pointer opacity-0" />
      </span>
      <input
        aria-label={`${label} hex value`}
        value={draft ?? value}
        onChange={(e) => {
          const v = e.target.value
          setDraft(v)
          if (/^#[0-9a-fA-F]{6}$/.test(v)) onChange(v.toUpperCase())
        }}
        onBlur={() => setDraft(null)}
        className="h-8 min-w-0 flex-1 rounded-lg border border-line bg-fg/[0.03] px-2.5 font-mono text-[12px] uppercase focus:border-accent focus:ring-3 focus:ring-accent/25 focus:outline-none"
      />
    </div>
  )
}
