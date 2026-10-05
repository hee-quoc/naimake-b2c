export type Aspect = '9:16' | '16:9' | '1:1'
export type Tier = 'free' | 'premium'
export type CategoryId =
  | 'social-ads'
  | 'product'
  | 'ugc'
  | 'fashion'
  | 'food'
  | 'travel'
  | 'events'
  | 'typography'
  | 'logo-reveal'
export type StyleId = 'minimal' | 'bold' | 'cinematic' | 'playful' | 'elegant' | 'retro'
export type FontId = 'sans' | 'display' | 'serif' | 'mono'

/** How the text of a scene is arranged over its media. */
export type SceneLayout = 'lower' | 'center' | 'stack' | 'card' | 'split' | 'caption' | 'logo'
export type SceneMotion = 'zoom-in' | 'zoom-out' | 'pan-left' | 'pan-right' | 'pan-up' | 'still'

export type TextRole = 'eyebrow' | 'headline' | 'body' | 'cta' | 'price' | 'caption'

export interface TextSlot {
  id: string
  label: string
  role: TextRole
  default: string
  maxLength: number
}

export interface MediaSlot {
  id: string
  label: string
  /** Unsplash photo id used as the default demo media. */
  photo: string
}

export interface Scene {
  id: string
  name: string
  /** Seconds */
  duration: number
  /** Media slot id; omit for a solid brand-colour background. */
  media?: string
  layout: SceneLayout
  motion: SceneMotion
  texts: string[]
}

export interface Palette {
  primary: string
  secondary: string
  text: string
}

export interface Template {
  id: string
  title: string
  description: string
  category: CategoryId
  styles: StyleId[]
  creatorId: string
  aspect: Aspect
  /** Output ratios this template can be exported in. The first is the native ratio. */
  ratios: Aspect[]
  tier: Tier
  /** Sample usage count for sorting — demo data. */
  uses: number
  /** Sample trending score — demo data. */
  trend: number
  createdAt: string
  font: FontId
  palette: Palette
  music: string
  showLogo: boolean
  mediaSlots: MediaSlot[]
  textSlots: TextSlot[]
  scenes: Scene[]
  tags: string[]
}

export interface Creator {
  id: string
  name: string
  handle: string
  avatar: string
  cover: string
  location: string
  specialty: string
  bio: string
  /** Sample statistics — not real figures. */
  stats: { followers: number; uses: number }
}

export interface Collection {
  id: string
  title: string
  description: string
  cover: string
  templateIds: string[]
  creatorId?: string
}

export interface MusicTrack {
  id: string
  title: string
  mood: string
  bpm: number
}

/** Everything a user can change on a template inside the workspace. */
export interface Customization {
  texts: Record<string, string>
  /** Slot id → image/video URL (object URL or data URL). Missing = template default. */
  media: Record<string, MediaOverride>
  colors: Palette
  logo: string | null
  music: string
  ratio: Aspect
}

export interface MediaOverride {
  src: string
  kind: 'image' | 'video'
  name: string
  /** Object URLs do not survive a reload, so they are not persisted. */
  persist: boolean
}

export interface Project {
  id: string
  templateId: string
  title: string
  updatedAt: string
  createdAt: string
  customization: Customization
}
