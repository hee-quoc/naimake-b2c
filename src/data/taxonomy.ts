import type { Aspect, CategoryId, StyleId } from './types'

// Labels live in the i18n dictionaries under `category.*`, `style.*`, `duration.*`.
export const CATEGORIES: CategoryId[] = [
  'social-ads',
  'product',
  'ugc',
  'fashion',
  'food',
  'travel',
  'events',
  'typography',
  'logo-reveal',
]

export const STYLES: StyleId[] = ['minimal', 'bold', 'cinematic', 'playful', 'elegant', 'retro']

export const ASPECTS: Aspect[] = ['9:16', '16:9', '1:1']

export const DURATIONS = ['short', 'medium', 'long'] as const
export type DurationBucket = (typeof DURATIONS)[number]

export function durationBucket(seconds: number): DurationBucket {
  if (seconds <= 10) return 'short'
  if (seconds <= 20) return 'medium'
  return 'long'
}

export const SORTS = ['trending', 'newest', 'most-used'] as const
export type SortId = (typeof SORTS)[number]

export const SUGGESTED_SEARCHES = ['Product Ads', 'UGC', 'Fashion', 'Food', 'Travel']

export function aspectValue(a: Aspect): number {
  return a === '9:16' ? 9 / 16 : a === '16:9' ? 16 / 9 : 1
}

