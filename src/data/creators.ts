import { PHOTOS } from '../lib/media'
import type { Creator } from './types'

/**
 * SAMPLE PROFILES — fictional creators for the prototype.
 * Names, bios and statistics are placeholders, not real NAIMAKE accounts.
 */
export const CREATORS: Creator[] = [
  {
    id: 'studio-lumen',
    name: 'Studio Lumen',
    handle: 'studiolumen',
    avatar: PHOTOS.videographer,
    cover: PHOTOS.stage,
    location: 'Ho Chi Minh City',
    specialty: 'Product & launch films',
    bio: 'A small motion studio making launch-ready product templates. Clean type, confident pacing, built for shops that ship fast.',
    stats: { followers: 12400, uses: 86200 },
  },
  {
    id: 'ava-nguyen',
    name: 'Ava Nguyen',
    handle: 'ava.makes',
    avatar: PHOTOS.portraitA,
    cover: PHOTOS.floral,
    location: 'Hanoi',
    specialty: 'Fashion & beauty',
    bio: 'Editorial fashion templates with a soft, magazine feel. I design for boutiques, stylists and beauty brands.',
    stats: { followers: 8900, uses: 41500 },
  },
  {
    id: 'kenji-mori',
    name: 'Kenji Mori',
    handle: 'kenji.frames',
    avatar: PHOTOS.portraitB,
    cover: PHOTOS.peaks,
    location: 'Da Nang',
    specialty: 'Travel & cinematic',
    bio: 'Wide shots, slow moves, big skies. Cinematic travel templates for hotels, tour operators and travel creators.',
    stats: { followers: 15100, uses: 63800 },
  },
  {
    id: 'paloma-reyes',
    name: 'Paloma Reyes',
    handle: 'paloma.eats',
    avatar: PHOTOS.portraitC,
    cover: PHOTOS.feast,
    location: 'Hoi An',
    specialty: 'Food & hospitality',
    bio: 'Recipes, menus and café stories. Warm templates that make food look as good as it tastes.',
    stats: { followers: 6700, uses: 29400 },
  },
  {
    id: 'theo-laurent',
    name: 'Theo Laurent',
    handle: 'theo.type',
    avatar: PHOTOS.portraitD,
    cover: PHOTOS.city,
    location: 'Remote',
    specialty: 'Typography & logo reveals',
    bio: 'Kinetic type and logo stings. Sharp, minimal systems that put your words and your mark front and centre.',
    stats: { followers: 9800, uses: 52100 },
  },
  {
    id: 'mai-pham',
    name: 'Mai Pham',
    handle: 'mai.creates',
    avatar: PHOTOS.portraitE,
    cover: PHOTOS.friendsSunset,
    location: 'Can Tho',
    specialty: 'UGC & social',
    bio: 'Creator-style videos that feel native to the feed: honest reviews, quick tips and scroll-stopping hooks.',
    stats: { followers: 11200, uses: 70300 },
  },
]

export function getCreator(id: string): Creator | undefined {
  return CREATORS.find((c) => c.id === id)
}
