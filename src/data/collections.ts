import { PHOTOS } from '../lib/media'
import type { Collection } from './types'

/** Curated demo collections. */
export const FEATURED_COLLECTIONS: Collection[] = [
  {
    id: 'made-for-social',
    title: 'Made for Social',
    description: 'Vertical templates sized and paced for TikTok, Reels and Shorts.',
    cover: PHOTOS.pinkWall,
    templateIds: [
      'flash-sale',
      'honest-review',
      'launch-drop',
      'sixty-second-recipe',
      'train-with-me',
      'kinetic-statement',
      'morning-cafe',
      'wanderlust-diary',
      'sneaker-drop',
    ],
  },
  {
    id: 'product-launch',
    title: 'Product Launch Essentials',
    description: 'Reveal, explain and sell — everything you need for launch week.',
    cover: PHOTOS.store,
    templateIds: [
      'launch-drop',
      'quiet-precision',
      'sneaker-drop',
      'retro-product-story',
      'new-season',
      'clean-logo-reveal',
      'flash-sale',
    ],
  },
  {
    id: 'cinematic-stories',
    title: 'Cinematic Stories',
    description: 'Slow moves, wide frames and refined type for stories that need room.',
    cover: PHOTOS.valley,
    templateIds: [
      'above-the-clouds',
      'forty-eight-hours',
      'menu-launch',
      'wanderlust-diary',
      'cinematic-sting',
      'editorial-lookbook',
    ],
  },
  {
    id: 'creator-favorites',
    title: 'Creator Favorites',
    description: 'The templates creators in the demo community reach for most.',
    cover: PHOTOS.friendsSunset,
    templateIds: [
      'channel-intro',
      'honest-review',
      'street-style',
      'quote-in-motion',
      'sixty-second-recipe',
      'party-invite',
      'weekend-escape',
    ],
  },
]

/** Collections curated by (sample) creators, shown on their profiles. */
export const CREATOR_COLLECTIONS: Collection[] = [
  {
    id: 'lumen-launch-kit',
    title: 'Lumen Launch Kit',
    description: 'Studio Lumen’s go-to set for product drops.',
    cover: PHOTOS.headphones,
    creatorId: 'studio-lumen',
    templateIds: ['launch-drop', 'sneaker-drop', 'quiet-precision', 'cinematic-sting'],
  },
  {
    id: 'soft-editorial',
    title: 'Soft Editorial',
    description: 'Ava’s fashion edits for boutiques and stylists.',
    cover: PHOTOS.tealFashion,
    creatorId: 'ava-nguyen',
    templateIds: ['editorial-lookbook', 'street-style', 'new-season'],
  },
  {
    id: 'slow-travel',
    title: 'Slow Travel',
    description: 'Kenji’s cinematic travel set.',
    cover: PHOTOS.turquoiseLake,
    creatorId: 'kenji-mori',
    templateIds: ['above-the-clouds', 'wanderlust-diary', 'forty-eight-hours', 'weekend-escape'],
  },
  {
    id: 'table-for-two',
    title: 'Table for Two',
    description: 'Paloma’s menus, recipes and café stories.',
    cover: PHOTOS.dinner,
    creatorId: 'paloma-reyes',
    templateIds: ['menu-launch', 'sixty-second-recipe', 'slice-of-the-week', 'morning-cafe'],
  },
  {
    id: 'type-only',
    title: 'Type Only',
    description: 'Theo’s footage-free typography and logo systems.',
    cover: PHOTOS.city,
    creatorId: 'theo-laurent',
    templateIds: ['kinetic-statement', 'quote-in-motion', 'breaking-headline', 'clean-logo-reveal'],
  },
  {
    id: 'feed-native',
    title: 'Feed Native',
    description: 'Mai’s UGC-style set for shops and creators.',
    cover: PHOTOS.denim,
    creatorId: 'mai-pham',
    templateIds: ['honest-review', 'flash-sale', 'train-with-me', 'channel-intro', 'party-invite'],
  },
]

export const ALL_COLLECTIONS = [...FEATURED_COLLECTIONS, ...CREATOR_COLLECTIONS]

export function getCollection(id: string): Collection | undefined {
  return ALL_COLLECTIONS.find((c) => c.id === id)
}
