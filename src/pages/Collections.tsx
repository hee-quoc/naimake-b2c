import { ArrowLeft, FileQuestion } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Catalog } from '../components/Catalog'
import { Avatar, ButtonLink, EmptyState, PageHeader, SectionHeader } from '../components/ui'
import { CREATOR_COLLECTIONS, FEATURED_COLLECTIONS, getCollection } from '../data/collections'
import { getCreator } from '../data/creators'
import { getTemplate } from '../data/templates'
import type { Template } from '../data/types'
import { useI18n } from '../i18n'
import { photoUrl } from '../lib/media'
import { CollectionCard } from './Explore'

export function CollectionsPage() {
  const { t } = useI18n()
  return (
    <div className="px-4 pt-8 sm:px-6 lg:px-8">
      <PageHeader title={t('collections.title')} subtitle={t('collections.subtitle')} />
      <section>
        <SectionHeader title={t('collections.curated')} />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {FEATURED_COLLECTIONS.map((c) => (
            <CollectionCard key={c.id} collection={c} tall />
          ))}
        </div>
      </section>
      <section className="mt-12">
        <SectionHeader title={t('collections.fromCreators')} />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {CREATOR_COLLECTIONS.map((c) => (
            <CollectionCard key={c.id} collection={c} />
          ))}
        </div>
      </section>
    </div>
  )
}

export function CollectionDetailPage() {
  const { id = '' } = useParams()
  const { t } = useI18n()
  const collection = getCollection(id)
  const source = useMemo(
    () => (collection?.templateIds.map((tid) => getTemplate(tid)).filter((x): x is Template => !!x) ?? []),
    [collection],
  )
  if (!collection) {
    return (
      <div className="px-4 py-16 sm:px-8">
        <EmptyState icon={<FileQuestion size={20} />} title={t('collections.notFound')} body="" action={<ButtonLink to="/collections">{t('collections.title')}</ButtonLink>} />
      </div>
    )
  }
  const creator = collection.creatorId ? getCreator(collection.creatorId) : undefined
  return (
    <div className="px-4 pt-4 sm:px-6 lg:px-8 lg:pt-6">
      <Link to="/collections" className="mb-4 inline-flex items-center gap-1.5 rounded-md text-[13px] text-muted hover:text-fg">
        <ArrowLeft size={15} aria-hidden /> {t('collections.title')}
      </Link>
      <header className="relative mb-8 overflow-hidden rounded-[18px] ring-1 ring-line">
        <img src={photoUrl(collection.cover, 1600, 500)} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/10" />
        <div className="relative px-6 py-10 sm:px-10 sm:py-14">
          <div className="text-[11px] font-medium tracking-[0.12em] text-white/60 uppercase">
            {creator ? t('collections.fromCreators') : t('collections.curated')}
          </div>
          <h1 className="mt-2 max-w-xl text-3xl font-semibold tracking-[-0.035em] text-white sm:text-[44px] sm:leading-[1.05]">{collection.title}</h1>
          <p className="mt-3 max-w-lg text-[15px] text-white/75">{collection.description}</p>
          <div className="mt-4 flex items-center gap-3 text-[13px] text-white/70">
            <span>{t('collections.count', { n: source.length })}</span>
            {creator && (
              <Link to={`/creators/${creator.id}`} className="flex items-center gap-1.5 hover:text-white">
                <Avatar photo={creator.avatar} name="" size={18} /> {creator.name}
              </Link>
            )}
          </div>
        </div>
      </header>
      <Catalog source={source} id="collection-catalog" />
    </div>
  )
}
