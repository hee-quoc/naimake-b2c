import type { MusicTrack } from './types'

/** Placeholder track list. No audio is bundled with the prototype. */
export const MUSIC: MusicTrack[] = [
  { id: 'pulse', title: 'Pulse Line', mood: 'Energetic', bpm: 124 },
  { id: 'glass', title: 'Glass Hours', mood: 'Minimal', bpm: 96 },
  { id: 'golden', title: 'Golden Coast', mood: 'Uplifting', bpm: 110 },
  { id: 'velvet', title: 'Velvet Room', mood: 'Elegant', bpm: 88 },
  { id: 'horizon', title: 'Wide Horizon', mood: 'Cinematic', bpm: 72 },
  { id: 'pop', title: 'Pop Fizz', mood: 'Playful', bpm: 128 },
  { id: 'tape', title: 'Cassette Summer', mood: 'Retro', bpm: 102 },
  { id: 'none', title: 'No music', mood: 'Silent', bpm: 0 },
]

export function getTrack(id: string): MusicTrack {
  return MUSIC.find((m) => m.id === id) ?? MUSIC[0]
}
