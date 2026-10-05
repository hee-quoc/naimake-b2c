import { Compass } from 'lucide-react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/Layout'
import { PreviewProvider } from './components/TemplateCard'
import { ButtonLink, EmptyState } from './components/ui'
import { I18nProvider, useI18n } from './i18n'
import { ThemeProvider } from './lib/theme'
import { CollectionDetailPage, CollectionsPage } from './pages/Collections'
import { CreatorProfilePage, CreatorsPage } from './pages/Creators'
import Explore, { NewPage, TrendingPage } from './pages/Explore'
import { ProjectsPage, SavedPage } from './pages/Library'
import PricingPage from './pages/Pricing'
import TemplateDetail from './pages/TemplateDetail'
import Workspace from './pages/workspace/Workspace'
import { AppStoreProvider } from './store/AppStore'
import { ToastProvider } from './store/Toast'

function NotFound() {
  const { t } = useI18n()
  return (
    <div className="px-4 py-16 sm:px-8">
      <EmptyState icon={<Compass size={20} />} title={t('common.notFound')} body={t('common.notFoundBody')} action={<ButtonLink to="/">{t('common.goHome')}</ButtonLink>} />
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
    <I18nProvider locale="en">
      <AppStoreProvider>
        <ToastProvider>
          <PreviewProvider>
            {/* Hash routing keeps the prototype deployable as static files, like the existing NAIMAKE creator app. */}
            <HashRouter>
              <Routes>
                <Route path="/workspace/new/:templateId" element={<Workspace />} />
                <Route path="/workspace/:projectId" element={<Workspace />} />
                <Route element={<AppLayout />}>
                  <Route index element={<Explore />} />
                  <Route path="trending" element={<TrendingPage />} />
                  <Route path="new" element={<NewPage />} />
                  <Route path="collections" element={<CollectionsPage />} />
                  <Route path="collections/:id" element={<CollectionDetailPage />} />
                  <Route path="creators" element={<CreatorsPage />} />
                  <Route path="creators/:id" element={<CreatorProfilePage />} />
                  <Route path="templates/:id" element={<TemplateDetail />} />
                  <Route path="saved" element={<SavedPage />} />
                  <Route path="projects" element={<ProjectsPage />} />
                  <Route path="pricing" element={<PricingPage />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </HashRouter>
          </PreviewProvider>
        </ToastProvider>
      </AppStoreProvider>
    </I18nProvider>
    </ThemeProvider>
  )
}
