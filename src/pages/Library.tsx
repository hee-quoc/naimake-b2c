import { Bookmark, Copy, FolderOpen, MoreHorizontal, Pencil, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { aspectStyle, posterTime, TemplateStage } from '../components/stage/TemplateStage'
import { TemplateGrid } from '../components/TemplateGrid'
import { Badge, Button, ButtonLink, Dialog, EmptyState, PageHeader, Popover } from '../components/ui'
import { getTemplate } from '../data/templates'
import type { Project, Template } from '../data/types'
import { useI18n } from '../i18n'
import { useAppStore } from '../store/AppStore'
import { useToast } from '../store/Toast'

export function SavedPage() {
  const { t } = useI18n()
  const { saved, setSaved } = useAppStore()
  const toast = useToast()
  const templates = saved.map((id) => getTemplate(id)).filter((x): x is Template => !!x)

  return (
    <div className="px-4 pt-8 sm:px-6 lg:px-8">
      <PageHeader title={t('saved.title')} subtitle={t('saved.subtitle')} />
      {templates.length === 0 ? (
        <EmptyState icon={<Bookmark size={20} />} title={t('saved.emptyTitle')} body={t('saved.emptyBody')} action={<ButtonLink to="/">{t('saved.browse')}</ButtonLink>} />
      ) : (
        <TemplateGrid
          templates={templates}
          renderFooter={(tp) => (
            <button
              type="button"
              onClick={() => {
                setSaved(tp.id, false)
                toast(t('saved.removed'), { kind: 'info', action: { label: t('saved.undo'), onClick: () => setSaved(tp.id, true) } })
              }}
              className="mt-2 inline-flex items-center gap-1 rounded-md text-[12px] text-faint hover:text-danger"
              aria-label={`${t('saved.remove')} ${tp.title}`}
            >
              <X size={13} aria-hidden /> {t('saved.remove')}
            </button>
          )}
        />
      )}
    </div>
  )
}

export function ProjectsPage() {
  const { t } = useI18n()
  const { projects, deleteProject, duplicateProject } = useAppStore()
  const toast = useToast()
  const [pendingDelete, setPendingDelete] = useState<Project | null>(null)
  const sorted = [...projects].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

  return (
    <div className="px-4 pt-8 sm:px-6 lg:px-8">
      <PageHeader title={t('projects.title')} subtitle={t('projects.subtitle')} />
      {sorted.length === 0 ? (
        <EmptyState icon={<FolderOpen size={20} />} title={t('projects.emptyTitle')} body={t('projects.emptyBody')} action={<ButtonLink to="/">{t('saved.browse')}</ButtonLink>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {sorted.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              onDuplicate={() => {
                duplicateProject(p.id, t('projects.copy', { title: p.title }))
                toast(t('projects.duplicated'))
              }}
              onDelete={() => setPendingDelete(p)}
            />
          ))}
        </div>
      )}

      <Dialog
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        title={t('projects.deleteTitle')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setPendingDelete(null)} data-autofocus>
              {t('projects.cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (pendingDelete) deleteProject(pendingDelete.id)
                setPendingDelete(null)
                toast(t('projects.deleted'), { kind: 'info' })
              }}
            >
              <Trash2 size={15} aria-hidden /> {t('projects.confirmDelete')}
            </Button>
          </>
        }
      >
        {t('projects.deleteBody', { title: pendingDelete?.title ?? '' })}
      </Dialog>
    </div>
  )
}

function ProjectCard({ project, onDuplicate, onDelete }: { project: Project; onDuplicate: () => void; onDelete: () => void }) {
  const { t, formatRelative } = useI18n()
  const navigate = useNavigate()
  const template = getTemplate(project.templateId)
  if (!template) return null
  const href = `/workspace/${project.id}`
  return (
    <article className="group overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface transition-colors duration-200 hover:border-line-strong">
      <Link to={href} className="relative block bg-surface-2" aria-label={`${t('projects.continue')}: ${project.title}`}>
        <div className="flex aspect-video items-center justify-center bg-[radial-gradient(circle_at_center,var(--surface-2),var(--surface))] p-3">
          <div className="h-full overflow-hidden rounded-lg ring-1 ring-line" style={aspectStyle(project.customization.ratio)}>
            <TemplateStage template={template} custom={project.customization} time={posterTime(template)} still />
          </div>
        </div>
        {project.id.startsWith('demo-') && (
          <span className="absolute top-2.5 left-2.5">
            <Badge tone="demo" className="bg-black/50 backdrop-blur">
              {t('projects.demoTag')}
            </Badge>
          </span>
        )}
      </Link>
      <div className="flex items-start gap-2 p-3.5">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[14px] font-medium">{project.title}</h2>
          <p className="mt-0.5 truncate text-[12px] text-faint">
            {template.title} · {t('projects.edited', { when: formatRelative(project.updatedAt) })}
          </p>
        </div>
        <Popover
          align="right"
          label={
            <>
              <MoreHorizontal size={16} aria-hidden />
              <span className="sr-only">{t('projects.more', { title: project.title })}</span>
            </>
          }
        >
          {(close) => (
            <div className="flex flex-col">
              <MenuItem icon={<Pencil size={14} />} onClick={() => navigate(href)}>
                {t('projects.continue')}
              </MenuItem>
              <MenuItem
                icon={<Copy size={14} />}
                onClick={() => {
                  close()
                  onDuplicate()
                }}
              >
                {t('projects.duplicate')}
              </MenuItem>
              <MenuItem
                danger
                icon={<Trash2 size={14} />}
                onClick={() => {
                  close()
                  onDelete()
                }}
              >
                {t('projects.delete')}
              </MenuItem>
            </div>
          )}
        </Popover>
      </div>
      <div className="flex gap-2 px-3.5 pb-3.5">
        <ButtonLink to={href} size="sm" variant="secondary" className="flex-1">
          <Pencil size={13} aria-hidden /> {t('projects.continue')}
        </ButtonLink>
        <Button size="sm" variant="outline" onClick={onDuplicate} aria-label={`${t('projects.duplicate')} ${project.title}`}>
          <Copy size={13} aria-hidden />
        </Button>
        <Button size="sm" variant="outline" onClick={onDelete} aria-label={`${t('projects.delete')} ${project.title}`} className="hover:text-danger">
          <Trash2 size={13} aria-hidden />
        </Button>
      </div>
    </article>
  )
}

function MenuItem({ icon, children, onClick, danger }: { icon: React.ReactNode; children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] hover:bg-fg/[0.06] ${danger ? 'text-danger' : 'text-fg'}`}
    >
      <span aria-hidden className="opacity-80">
        {icon}
      </span>
      {children}
    </button>
  )
}
