import { CheckCircle2, Download, FlaskConical } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Badge, Button, Dialog } from '../../components/ui'
import type { Customization, Template } from '../../data/types'
import { useI18n } from '../../i18n'
import { cn } from '../../lib/cn'

const RESOLUTIONS = [
  { id: '720p', label: '720p', pro: false },
  { id: '1080p', label: '1080p', pro: false },
  { id: '4k', label: '4K', pro: true },
]
const FORMATS = [
  { id: 'mp4', label: 'MP4 (H.264)' },
  { id: 'mov', label: 'MOV' },
  { id: 'gif', label: 'GIF' },
]
const FPS = ['24', '30', '60']

export function ExportDialog({
  open,
  onClose,
  template,
  title,
  custom,
}: {
  open: boolean
  onClose: () => void
  template: Template
  title: string
  custom: Customization
}) {
  const { t } = useI18n()
  const [res, setRes] = useState('1080p')
  const [format, setFormat] = useState('mp4')
  const [fps, setFps] = useState('30')
  const [phase, setPhase] = useState<'options' | 'running' | 'done'>('options')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (open) {
      setPhase('options')
      setProgress(0)
    }
  }, [open])

  useEffect(() => {
    if (phase !== 'running') return
    const id = window.setInterval(() => {
      setProgress((p) => {
        const next = Math.min(100, p + 4 + Math.random() * 9)
        if (next >= 100) {
          window.clearInterval(id)
          window.setTimeout(() => setPhase('done'), 250)
        }
        return next
      })
    }, 160)
    return () => window.clearInterval(id)
  }, [phase])

  const downloadJson = () => {
    const data = {
      note: 'NAIMAKE prototype — project settings only. No video was rendered.',
      template: { id: template.id, title: template.title },
      project: title,
      export: { resolution: res, format, fps: Number(fps), ratio: custom.ratio },
      customization: {
        ...custom,
        media: Object.fromEntries(Object.entries(custom.media).map(([k, m]) => [k, { name: m.name, kind: m.kind }])),
        logo: custom.logo ? '(embedded image omitted)' : null,
      },
    }
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.replace(/[^\w-]+/g, '-').toLowerCase() || 'project'}-settings.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('export.title')}
      size="md"
      badge={
        <Badge tone="demo">
          <FlaskConical size={11} aria-hidden /> {t('export.demo')}
        </Badge>
      }
      footer={
        phase === 'done' ? (
          <>
            <Button variant="outline" onClick={downloadJson}>
              <Download size={15} aria-hidden /> {t('export.downloadJson')}
            </Button>
            <Button onClick={onClose}>{t('export.close')}</Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={onClose}>
              {t('export.cancel')}
            </Button>
            <Button onClick={() => setPhase('running')} disabled={phase === 'running'} data-autofocus>
              {phase === 'running' ? t('export.running') : t('export.start')}
            </Button>
          </>
        )
      }
    >
      <div className="mb-4 rounded-lg border border-dashed border-line-strong bg-fg/[0.02] px-3 py-2.5 text-[12.5px] leading-relaxed">{t('export.demoNote')}</div>

      {phase === 'done' ? (
        <div className="flex flex-col items-center py-6 text-center">
          <CheckCircle2 size={36} className="text-success" aria-hidden />
          <h3 className="mt-3 text-base font-semibold text-fg">{t('export.doneTitle')}</h3>
          <p className="mt-1.5 max-w-sm">{t('export.doneBody')}</p>
          <p className="mt-3 font-mono text-[11.5px] text-faint">
            {res} · {format.toUpperCase()} · {fps} fps · {custom.ratio}
          </p>
        </div>
      ) : (
        <fieldset disabled={phase === 'running'} className="flex flex-col gap-4">
          <OptionRow label={t('export.resolution')}>
            {RESOLUTIONS.map((r) => (
              <Seg key={r.id} active={res === r.id} onClick={() => setRes(r.id)}>
                {r.label}
                {r.pro && <span className="ml-1 rounded bg-premium/15 px-1 text-[10px] text-premium">{t('export.proOnly')}</span>}
              </Seg>
            ))}
          </OptionRow>
          <OptionRow label={t('export.format')}>
            {FORMATS.map((f) => (
              <Seg key={f.id} active={format === f.id} onClick={() => setFormat(f.id)}>
                {f.label}
              </Seg>
            ))}
          </OptionRow>
          <OptionRow label={t('export.fps')}>
            {FPS.map((f) => (
              <Seg key={f} active={fps === f} onClick={() => setFps(f)}>
                {f} fps
              </Seg>
            ))}
          </OptionRow>
          <OptionRow label={t('export.ratio')}>
            <span className="text-[13px] text-fg">{custom.ratio}</span>
          </OptionRow>
          <p className="text-[12px] text-faint">{t('export.watermark')}</p>

          {phase === 'running' && (
            <div className="mt-1" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)} aria-label={t('export.running')}>
              <div className="mb-1.5 flex justify-between text-[12px]">
                <span>{t('export.running')}</span>
                <span className="font-mono">{Math.round(progress)}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-fg/10">
                <div className="h-full rounded-full bg-accent transition-[width] duration-200" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
        </fieldset>
      )}
    </Dialog>
  )
}

function OptionRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4">
      <span className="w-24 shrink-0 text-[12.5px] text-muted">{label}</span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  )
}

function Seg({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex h-8 items-center rounded-lg border px-3 text-[12.5px] font-medium transition-colors',
        active ? 'border-accent bg-accent-soft text-fg' : 'border-line text-muted hover:border-line-strong hover:text-fg',
      )}
    >
      {children}
    </button>
  )
}
