import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import DashboardLayout from './layouts/DashboardLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import PagesListPage from './pages/pages/PagesListPage'
import PageEditorPage from './pages/pages/PageEditorPage'
import HomePageEditor from './pages/HomePageEditor'
import Posts from './pages/Posts'
import PostEditor from './pages/PostEditor'
import AIPostGenerator from './pages/AIPostGenerator'
import CategoriesPage from './pages/CategoriesPage'
import MediaPage from './pages/MediaPage'
import ImagesManagerPage from './pages/ImagesManagerPage'
import UsersPage from './pages/UsersPage'
import SettingsPage from './pages/SettingsPage'
import EnvSettingsPage from './pages/EnvSettingsPage'
import ComponentsPage from './pages/ComponentsPage'
import SidebarManager from './pages/SidebarManager'
import AccessibilityPage from './pages/AccessibilityPage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'
import OfflineComponentsReport from './pages/OfflineComponentsReport'
import LinksReportPage from './pages/LinksReportPage'
import AILinkMonitoringPage from './pages/AILinkMonitoringPage'
import AutoPageSettingsPage from './pages/AutoPageSettingsPage'
import LeadsPage from './pages/LeadsPage'
import VendorsListPage from './pages/vendors/VendorsListPage'
import VendorEditorPage from './pages/vendors/VendorEditorPage'
import LoadingSpinner from './components/ui/LoadingSpinner'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<DashboardLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="leads" element={<LeadsPage />} />
        <Route path="homepage" element={<HomePageEditor />} />
        <Route path="pages">
          <Route index element={<PagesListPage />} />
          <Route path="new" element={<PageEditorPage />} />
          <Route path=":id/edit" element={<PageEditorPage />} />
          <Route path=":pageId/sidebar" element={<SidebarManager />} />
        </Route>
        <Route path="vendors">
          <Route index element={<VendorsListPage />} />
          <Route path=":id/edit" element={<VendorEditorPage />} />
        </Route>
        <Route path="posts">
          <Route index element={<Posts />} />
          <Route path="new" element={<PostEditor />} />
          <Route path="ai-generator" element={<AIPostGenerator />} />
          <Route path=":id" element={<PostEditor />} />
        </Route>
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="media" element={<MediaPage />} />
        <Route path="images-manager" element={<ImagesManagerPage />} />
        <Route path="components" element={<ComponentsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="env-settings" element={<EnvSettingsPage />} />
        <Route path="sidebar" element={<SidebarManager />} />
        <Route path="accessibility" element={<AccessibilityPage />} />
        <Route path="privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="reports/offline-components" element={<OfflineComponentsReport />} />
        <Route path="reports/links" element={<LinksReportPage />} />
        <Route path="ai-monitoring" element={<AILinkMonitoringPage />} />
        <Route path="auto-page" element={<AutoPageSettingsPage />} />
      </Route>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
