import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getTemplate } from '../data/templates'
import type { Customization, Project, Template } from '../data/types'
import { readJSON, writeJSON } from '../lib/storage'

export function defaultCustomization(t: Template): Customization {
  return {
    texts: Object.fromEntries(t.textSlots.map((s) => [s.id, s.default])),
    media: {},
    colors: { ...t.palette },
    logo: null,
    music: t.music,
    ratio: t.aspect,
  }
}

/** Session-only media (object URLs) cannot be restored after reload, so drop it before persisting. */
function persistable(c: Customization): Customization {
  return {
    ...c,
    media: Object.fromEntries(Object.entries(c.media).filter(([, m]) => m.persist)),
  }
}

const uid = () => Math.random().toString(36).slice(2, 10)

function seedProjects(): Project[] {
  const now = Date.now()
  const make = (templateId: string, title: string, hoursAgo: number, edit: (c: Customization) => void): Project | null => {
    const t = getTemplate(templateId)
    if (!t) return null
    const c = defaultCustomization(t)
    edit(c)
    const iso = new Date(now - hoursAgo * 3600_000).toISOString()
    return { id: `demo-${templateId}`, templateId, title, createdAt: iso, updatedAt: iso, customization: c }
  }
  return [
    make('flash-sale', 'October sale — demo', 3, (c) => {
      c.texts.deal = '30% off today'
      c.colors.primary = '#3B6FFF'
    }),
    make('wanderlust-diary', 'Da Lat weekend — demo', 50, (c) => {
      c.texts.title = 'Three days in Da Lat'
    }),
  ].filter((p): p is Project => p !== null)
}

interface AppStore {
  saved: string[]
  isSaved: (id: string) => boolean
  toggleSaved: (id: string) => boolean
  setSaved: (id: string, value: boolean) => void
  projects: Project[]
  getProject: (id: string) => Project | undefined
  saveProject: (p: { id?: string; templateId: string; title: string; customization: Customization }) => {
    project: Project
    ok: boolean
  }
  duplicateProject: (id: string, title: string) => Project | undefined
  deleteProject: (id: string) => void
  following: string[]
  toggleFollow: (creatorId: string) => void
}

const Ctx = createContext<AppStore | null>(null)

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [saved, setSavedIds] = useState<string[]>(() => readJSON('saved', ['editorial-lookbook', 'menu-launch']))
  const [projects, setProjects] = useState<Project[]>(() => {
    const existing = readJSON<Project[] | null>('projects', null)
    return existing ?? seedProjects()
  })
  const [following, setFollowing] = useState<string[]>(() => readJSON('following', []))

  useEffect(() => void writeJSON('saved', saved), [saved])
  useEffect(() => void writeJSON('following', following), [following])
  // Projects are written synchronously in saveProject so we can report quota errors.
  useEffect(() => void writeJSON('projects', projects.map((p) => ({ ...p, customization: persistable(p.customization) }))), [projects])

  const isSaved = useCallback((id: string) => saved.includes(id), [saved])
  const setSaved = useCallback((id: string, value: boolean) => {
    setSavedIds((prev) => (value ? (prev.includes(id) ? prev : [id, ...prev]) : prev.filter((x) => x !== id)))
  }, [])
  const toggleSaved = useCallback(
    (id: string) => {
      const next = !saved.includes(id)
      setSaved(id, next)
      return next
    },
    [saved, setSaved],
  )

  const getProject = useCallback((id: string) => projects.find((p) => p.id === id), [projects])

  const saveProject = useCallback<AppStore['saveProject']>(
    ({ id, templateId, title, customization }) => {
      const now = new Date().toISOString()
      const existing = id ? projects.find((p) => p.id === id) : undefined
      const project: Project = existing
        ? { ...existing, title, customization, updatedAt: now }
        : { id: uid(), templateId, title, customization, createdAt: now, updatedAt: now }
      const next = existing ? projects.map((p) => (p.id === project.id ? project : p)) : [project, ...projects]
      const ok = writeJSON(
        'projects',
        next.map((p) => ({ ...p, customization: persistable(p.customization) })),
      )
      if (ok) setProjects(next)
      return { project, ok }
    },
    [projects],
  )

  const duplicateProject = useCallback(
    (id: string, title: string) => {
      const src = projects.find((p) => p.id === id)
      if (!src) return undefined
      const now = new Date().toISOString()
      const copy: Project = { ...src, id: uid(), title, createdAt: now, updatedAt: now }
      setProjects((prev) => [copy, ...prev])
      return copy
    },
    [projects],
  )

  const deleteProject = useCallback((id: string) => setProjects((prev) => prev.filter((p) => p.id !== id)), [])

  const toggleFollow = useCallback(
    (creatorId: string) =>
      setFollowing((prev) => (prev.includes(creatorId) ? prev.filter((x) => x !== creatorId) : [...prev, creatorId])),
    [],
  )

  const value = useMemo(
    () => ({
      saved,
      isSaved,
      toggleSaved,
      setSaved,
      projects,
      getProject,
      saveProject,
      duplicateProject,
      deleteProject,
      following,
      toggleFollow,
    }),
    [saved, isSaved, toggleSaved, setSaved, projects, getProject, saveProject, duplicateProject, deleteProject, following, toggleFollow],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAppStore(): AppStore {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAppStore must be used inside AppStoreProvider')
  return ctx
}
