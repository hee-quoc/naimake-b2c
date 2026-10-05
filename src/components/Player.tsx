import { Pause, Play, RotateCcw, VolumeX } from 'lucide-react'
import type { Customization, Template } from '../data/types'
import { useI18n } from '../i18n'
import type { Player } from '../lib/hooks'
import { sceneStarts } from './stage/TemplateStage'

export function formatTime(s: number) {
  const m = Math.floor(s / 60)
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}

/** Playback bar with per-scene segments; shared by the detail page and the workspace. */
export function PlayerControls({
  template,
  player,
  duration,
  onSeekScene,
  showAudioNote = true,
}: {
  template: Template
  custom?: Customization
  player: Player
  duration: number
  onSeekScene?: (index: number) => void
  showAudioNote?: boolean
}) {
  const { t } = useI18n()
  const starts = sceneStarts(template)
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={player.toggle}
        aria-label={player.playing ? t('player.pause') : t('player.play')}
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-fg text-bg transition-colors hover:bg-fg/90"
      >
        {player.playing ? <Pause size={15} className="fill-current" /> : <Play size={15} className="ml-0.5 fill-current" />}
      </button>
      <button
        type="button"
        onClick={() => player.seek(0)}
        aria-label={t('player.restart')}
        className="hidden size-8 shrink-0 items-center justify-center rounded-full text-muted hover:bg-fg/[0.06] hover:text-fg sm:flex"
      >
        <RotateCcw size={15} />
      </button>
      <div className="relative flex h-9 flex-1 items-center">
        <div className="pointer-events-none absolute inset-x-0 flex h-1.5 gap-0.5" aria-hidden>
          {template.scenes.map((s, i) => {
            const segStart = starts[i]
            const fill = Math.max(0, Math.min(1, (player.time - segStart) / s.duration))
            return (
              <div key={s.id} className="relative h-full overflow-hidden rounded-full bg-fg/12" style={{ flex: s.duration }}>
                <div className="absolute inset-y-0 left-0 bg-accent" style={{ width: `${fill * 100}%` }} />
              </div>
            )
          })}
        </div>
        <input
          type="range"
          min={0}
          max={duration}
          step={0.05}
          value={player.time}
          onChange={(e) => {
            const v = Number(e.target.value)
            player.seek(v)
            if (onSeekScene) {
              let idx = 0
              starts.forEach((st, i) => {
                if (v >= st) idx = i
              })
              onSeekScene(idx)
            }
          }}
          aria-label={t('player.seek')}
          aria-valuetext={`${formatTime(player.time)} of ${formatTime(duration)}`}
          className="absolute inset-0 w-full cursor-pointer opacity-0"
        />
      </div>
      <span className="shrink-0 font-mono text-[11.5px] text-muted tabular-nums">
        {formatTime(player.time)} / {formatTime(duration)}
      </span>
      {showAudioNote && (
        <span className="hidden shrink-0 items-center gap-1 text-[11.5px] text-faint xl:flex" title={t('player.noAudio')}>
          <VolumeX size={14} aria-hidden /> {t('player.noAudio')}
        </span>
      )}
    </div>
  )
}
