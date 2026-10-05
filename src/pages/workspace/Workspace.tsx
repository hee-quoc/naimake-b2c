import { ArrowLeft, Check, Download, FileQuestion, Save } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PlayerControls } from '../../components/Player'
import { sceneAt, sceneStarts, TemplateStage } from '../../components/stage/TemplateStage'
import { Badge, Button, ButtonLink, Dialog, EmptyState, Wordmark } from '../../components/ui'
import { aspectValue } from '../../data/taxonomy'
import { getTemplate, templateDuration } from '../../data/templates'
import type { Aspect, Customization, Template } from '../../data/types'
import { useI18n } from '../../i18n'
import { cn } from '../../lib/cn'
import { useElementWidth, useMediaQuery, usePlayer, useReducedMotion } from '../../lib/hooks'
import { fileToDataUrl } from '../../lib/image'
import { defaultCustomization, useAppStore } from '../../store/AppStore'
import { useToast } from '../../store/Toast'
import { ThemeToggle } from '../../lib/theme'
import { ControlsPanel, ScenesPanel } from './panels'
import { ExportDialog } from './ExportDialog'

export default function Workspace() {
  const { templateId, projectId } = useParams()
  const { getProject } = useAppStore()
  const { t } = useI18n()
  const project = projectId ? getProject(projectId) : undefined
  const template = getTemplate(project?.templateId ?? templateId ?? '')

  if (!template || (projectId && !project)) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-6">
        <div className="w-full max-w-md">
          <EmptyState
            icon={<FileQuestion size={20} />}
            title={projectId ? t('ws.projectNotFound') : t('detail.notFound')}
            body={projectId ? t('ws.projectNotFoundBody') : t('detail.notFoundBody')}
            action={<ButtonLink to={projectId ? '/projects' : '/'}>{projectId ? t('nav.projects') : t('detail.backToExplore')}</ButtonLink>}
          />
        </div>
      </div>
    )
  }
  return (
    <Editor
      key={project?.id ?? template.id}
      template={template}
      projectId={project?.id}
      initialTitle={project?.title ?? template.title}
      initialCustom={project?.customization ?? defaultCustomization(template)}
    />
  )
}

/** Fits a box of the given aspect ratio inside the measured container. */
function useFit(aspect: Aspect) {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const ar = aspectValue(aspect)
  const box = size.w / Math.max(1, size.h) > ar ? { width: size.h * ar, height: size.h } : { width: size.w, height: size.w / ar }
  return [ref, box] as const
}

function Editor({
  template,
  projectId,
  initialTitle,
  initialCustom,
}: {
  template: Template
  projectId?: string
  initialTitle: string
  initialCustom: Customization
}) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const toast = useToast()
  const { saveProject } = useAppStore()
  const reduced = useReducedMotion()
  const desktop = useMediaQuery('(min-width: 1024px)')
  const [custom, setCustom] = useState<Customization>(initialCustom)
  const [title, setTitle] = useState(initialTitle)
  const [dirty, setDirty] = useState(!projectId)
  const [savedOnce, setSavedOnce] = useState(!!projectId)
  const [focusText, setFocusText] = useState<string | null>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const [leaveOpen, setLeaveOpen] = useState(false)
  const [mobileTab, setMobileTab] = useState<'edit' | 'scenes'>('edit')
  const objectUrls = useRef<string[]>([])

  const duration = templateDuration(template)
  const starts = useMemo(() => sceneStarts(template), [template])
  const player = usePlayer(duration, { initial: Math.min(1.4, template.scenes[0].duration - 0.5) })
  const { index: current } = sceneAt(template, player.time)
  const scene = template.scenes[current]

  const [fitRef, box] = useFit(custom.ratio)

  useEffect(() => () => objectUrls.current.forEach((u) => URL.revokeObjectURL(u)), [])

  // Warn before closing the tab with unsaved changes.
  useEffect(() => {
    if (!dirty) return
    const h = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', h)
    return () => window.removeEventListener('beforeunload', h)
  }, [dirty])

  const change = useCallback((fn: (c: Customization) => Customization) => {
    setCustom(fn)
    setDirty(true)
  }, [])

  const goToScene = useCallback(
    (i: number) => {
      player.pause()
      const s = template.scenes[i]
      player.seek(starts[i] + Math.min(s.duration - 0.5, 0.6 + s.texts.length * 0.3))
    },
    [player, starts, template.scenes],
  )

  const onFocusText = (id: string | null) => {
    setFocusText(id)
    if (!id) return
    if (scene.texts.includes(id)) return
    const idx = template.scenes.findIndex((s) => s.texts.includes(id))
    if (idx >= 0) goToScene(idx)
  }

  const onError = (msg: string) => toast(msg, { kind: 'error' })

  const onMedia = async (slotId: string, f: File) => {
    try {
      if (f.type.startsWith('video/')) {
        const src = URL.createObjectURL(f)
        objectUrls.current.push(src)
        change((c) => ({ ...c, media: { ...c.media, [slotId]: { src, kind: 'video', name: f.name, persist: false } } }))
      } else {
        const src = await fileToDataUrl(f, 1600)
        change((c) => ({ ...c, media: { ...c.media, [slotId]: { src, kind: 'image', name: f.name, persist: true } } }))
      }
      const idx = template.scenes.findIndex((s) => s.media === slotId)
      if (idx >= 0 && template.scenes[current].media !== slotId) goToScene(idx)
    } catch {
      onError(t('ws.uploadError'))
    }
  }

  const onLogo = async (f: File) => {
    try {
      const src = await fileToDataUrl(f, 512, true)
      change((c) => ({ ...c, logo: src }))
    } catch {
      onError(t('ws.uploadError'))
    }
  }

  const save = () => {
    const { project, ok } = saveProject({ id: projectId, templateId: template.id, title: title.trim() || t('ws.untitled'), customization: custom })
    if (!ok) {
      toast(t('ws.toastStorage'), { kind: 'error' })
      return
    }
    setDirty(false)
    setSavedOnce(true)
    toast(t('ws.toastSaved'))
    if (!projectId) navigate(`/workspace/${project.id}`, { replace: true })
  }

  const back = () => {
    if (dirty && savedOnce) setLeaveOpen(true)
    else if (dirty && !savedOnce && JSON.stringify(custom) !== JSON.stringify(defaultCustomization(template))) setLeaveOpen(true)
    else leave()
  }
  const leave = () => navigate(projectId ? '/projects' : `/templates/${template.id}`)

  const hasVideo = Object.values(custom.media).some((m) => m.kind === 'video')

  const scenesPanel = (
    <ScenesPanel
      template={template}
      custom={custom}
      current={current}
      onSelect={goToScene}
      onMedia={onMedia}
      onResetMedia={(id) =>
        change((c) => {
          const media = { ...c.media }
          delete media[id]
          return { ...c, media }
        })
      }
      onError={onError}
    />
  )
  const controlsPanel = (
    <ControlsPanel
      template={template}
      custom={custom}
      currentTexts={scene.texts}
      onText={(id, v) => change((c) => ({ ...c, texts: { ...c.texts, [id]: v } }))}
      onFocusText={onFocusText}
      onColor={(k, v) => change((c) => ({ ...c, colors: { ...c.colors, [k]: v } }))}
      onResetColors={() => change((c) => ({ ...c, colors: { ...template.palette } }))}
      onLogo={onLogo}
      onRemoveLogo={() => change((c) => ({ ...c, logo: null }))}
      onMusic={(id) => change((c) => ({ ...c, music: id }))}
      onRatio={(r) => change((c) => ({ ...c, ratio: r }))}
      onError={onError}
      hasVideo={hasVideo}
    />
  )

  return (
    <div className="flex h-dvh flex-col bg-bg">
      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line px-2 sm:px-3">
        <button type="button" onClick={back} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-[13px] text-muted hover:bg-fg/[0.05] hover:text-fg" aria-label={t('ws.back')}>
          <ArrowLeft size={17} aria-hidden />
          <span className="hidden md:inline">{t('ws.back')}</span>
        </button>
        <span className="hidden h-5 w-px bg-line lg:block" aria-hidden />
        <Wordmark className="hidden text-[13px] lg:inline-flex [&_svg]:size-5" />
        <div className="mx-auto flex min-w-0 items-center gap-2">
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              setDirty(true)
            }}
            aria-label={t('ws.projectName')}
            className="h-9 w-[9rem] min-w-0 rounded-lg border border-transparent bg-transparent px-2 text-center text-[13.5px] font-medium hover:border-line focus:border-accent focus:ring-3 focus:ring-accent/25 focus:outline-none sm:w-64"
          />
          <span className={cn('hidden items-center gap-1 text-[11.5px] sm:flex', dirty ? 'text-faint' : 'text-success')} aria-live="polite">
            {dirty ? t('ws.unsaved') : (
              <>
                <Check size={12} aria-hidden /> {t('ws.saved')}
              </>
            )}
          </span>
        </div>
        <span className="max-sm:hidden">
          <ThemeToggle />
        </span>
        <Button variant="outline" size="sm" onClick={save} disabled={!dirty && savedOnce}>
          <Save size={14} aria-hidden /> <span className="hidden sm:inline">{t('ws.save')}</span>
        </Button>
        <Button size="sm" onClick={() => setExportOpen(true)}>
          <Download size={14} aria-hidden /> <span className="hidden min-[420px]:inline">{t('ws.export')}</span>
        </Button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Left: scenes & media */}
        {desktop && (
          <aside className="scrollbar-thin w-[272px] shrink-0 overflow-y-auto border-r border-line" aria-label={t('ws.scenes')}>
            {scenesPanel}
          </aside>
        )}

        {/* Center: preview */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center bg-[radial-gradient(circle_at_center,var(--surface-2)_0%,var(--bg)_70%)] p-4 max-lg:h-[52dvh] max-lg:flex-none sm:p-8">
            <div className="mb-2 flex items-center gap-2 text-[11.5px] text-faint">
              <Badge tone="demo">{t('demo.badge')}</Badge>
              <span>{t('ws.sceneOf', { n: current + 1, total: template.scenes.length })} · {scene.name}</span>
            </div>
            <div ref={fitRef} className="flex min-h-0 w-full flex-1 items-center justify-center">
              <div className="overflow-hidden rounded-xl shadow-[0_24px_60px_-16px_rgb(0_0_0/0.45)] ring-1 ring-line-strong" style={{ width: box.width, height: box.height }}>
                {box.width > 0 && (
                  <TemplateStage
                    template={template}
                    custom={custom}
                    time={player.time}
                    playing={player.playing}
                    quality="full"
                    still={reduced}
                    placeholders
                    highlight={player.playing ? null : focusText}
                    eager
                  />
                )}
              </div>
            </div>
          </div>

          {/* Bottom: scene strip + playback */}
          <div className="shrink-0 border-t border-line bg-surface px-3 pt-3 pb-3 sm:px-4">
            <PlayerControls template={template} player={player} duration={duration} />
            <SceneStrip template={template} custom={custom} current={current} onSelect={goToScene} />
          </div>

          {/* Mobile panels */}
          {!desktop && (
          <div className="min-h-0 flex-1 overflow-y-auto border-t border-line">
            <div className="sticky top-0 z-10 flex gap-1 border-b border-line bg-bg/95 p-1.5 backdrop-blur" role="tablist">
              {(['edit', 'scenes'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={mobileTab === tab}
                  onClick={() => setMobileTab(tab)}
                  className={cn('h-9 flex-1 rounded-lg text-[13px] font-medium', mobileTab === tab ? 'bg-fg/[0.08] text-fg' : 'text-muted')}
                >
                  {tab === 'edit' ? t('ws.panelEdit') : t('ws.panelScenes')}
                </button>
              ))}
            </div>
            <div role="tabpanel">{mobileTab === 'edit' ? controlsPanel : scenesPanel}</div>
          </div>
          )}
        </div>

        {/* Right: controls */}
        {desktop && (
          <aside className="scrollbar-thin w-[320px] shrink-0 overflow-y-auto border-l border-line" aria-label="Customization">
            {controlsPanel}
          </aside>
        )}
      </div>

      <ExportDialog open={exportOpen} onClose={() => setExportOpen(false)} template={template} title={title} custom={custom} />
      <Dialog
        open={leaveOpen}
        onClose={() => setLeaveOpen(false)}
        title={t('ws.leaveTitle')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setLeaveOpen(false)} data-autofocus>
              {t('ws.stay')}
            </Button>
            <Button variant="danger" onClick={leave}>
              {t('ws.leave')}
            </Button>
          </>
        }
      >
        {t('ws.leaveBody')}
      </Dialog>
    </div>
  )
}

function SceneStrip({
  template,
  custom,
  current,
  onSelect,
}: {
  template: Template
  custom: Customization
  current: number
  onSelect: (i: number) => void
}) {
  const starts = sceneStarts(template)
  const [ref, width] = useElementWidth<HTMLDivElement>()
  const compact = width > 0 && width < 420
  return (
    <div ref={ref} className="mt-2.5 flex gap-1.5" role="list" aria-label="Scene strip">
      {template.scenes.map((s, i) => (
        <button
          key={s.id}
          type="button"
          role="listitem"
          onClick={() => onSelect(i)}
          aria-label={`Scene ${i + 1}: ${s.name}`}
          aria-current={i === current ? 'step' : undefined}
          className={cn(
            'relative h-14 min-w-0 overflow-hidden rounded-lg ring-1 transition-shadow duration-200',
            i === current ? 'ring-2 ring-accent' : 'ring-line hover:ring-fg/30',
          )}
          style={{ flex: s.duration }}
        >
          <TemplateStage template={template} custom={{ ...custom, ratio: '16:9' }} time={starts[i] + Math.min(s.duration - 0.5, 1.4)} still />
          <span className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-black/80 to-transparent px-1.5 pt-3 pb-1 text-[10.5px] font-medium text-white">
            <span className="truncate">{compact ? i + 1 : `${i + 1}. ${s.name}`}</span>
            {!compact && <span className="font-mono text-white/70">{s.duration}s</span>}
          </span>
        </button>
      ))}
    </div>
  )
}
