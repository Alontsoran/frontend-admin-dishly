import { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import {
  Home,
  FileText,
  FolderTree,
  Image,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Package,
  User,
  Monitor,
  PenTool,
  Sidebar,
  Images,
  EyeOff,
  Link2,
  Brain,
  FilePlus2,
  Inbox,
  KeyRound,
  Store,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/utils/cn'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'

// Badge for new leads count
function NewLeadsBadge() {
  const { data } = useQuery({
    queryKey: ['leads-new-count'],
    queryFn: () =>
      api.get('/contact?status=new&limit=1').then((r) => r.data.pagination?.total ?? 0),
    refetchInterval: 30_000,
    staleTime: 20_000,
  })
  if (!data || data === 0) return null
  return (
    <span className="mr-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1.5 text-xs font-bold text-white">
      {data > 99 ? '99+' : data}
    </span>
  )
}

const navigation = [
  { name: 'לוח בקרה',             href: '/',                             icon: Home },
  { name: 'פניות לידים',           href: '/leads',                        icon: Inbox,    badge: NewLeadsBadge },
  { name: 'דף הבית',              href: '/homepage',                     icon: Monitor },
  { name: 'דפים',                 href: '/pages',                        icon: FileText },
  { name: 'ספקים (דפי נחיתה)',   href: '/vendors',                      icon: Store },
  { name: 'פוסטים',               href: '/posts',                        icon: PenTool },
  { name: 'קטגוריות',             href: '/categories',                   icon: FolderTree },
  { name: 'מדיה',                 href: '/media',                        icon: Image },
  { name: 'ניהול תמונות',          href: '/images-manager',               icon: Images },
  { name: 'רכיבים',               href: '/components',                   icon: Package },
  { name: 'ניהול סיידבר',          href: '/sidebar',                      icon: Sidebar },
  { name: 'קומפוננטות אופליין',    href: '/reports/offline-components',   icon: EyeOff },
  { name: 'דיווח קישורים',         href: '/reports/links',                icon: Link2 },
  { name: 'מוניטורינג AI',         href: '/ai-monitoring',                icon: Brain },
  { name: 'יצירת דפים אוטומטית',   href: '/auto-page',                    icon: FilePlus2 },
  { name: 'משתמשים',              href: '/users',                        icon: Users },
  { name: 'הגדרות',               href: '/settings',                     icon: Settings },
  { name: 'משתני שרת / API',      href: '/env-settings',                 icon: KeyRound },
]

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen]         = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const location = useLocation()
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Mobile sidebar overlay ─────────────────────────── */}
      <div
        className={cn('fixed inset-0 z-40 lg:hidden', sidebarOpen ? 'block' : 'hidden')}
      >
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="fixed inset-y-0 right-0 flex w-64 flex-col bg-white shadow-xl">
          <div className="flex h-16 items-center justify-between px-4 border-b">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-orange-500">Do</span><span className="text-lg font-bold text-gray-900">We</span>
              <span className="text-sm font-medium text-gray-500">Admin</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-4">
            {navigation.map((item) => {
              const isActive =
                location.pathname === item.href ||
                (item.href !== '/' && location.pathname.startsWith(item.href))
              const Badge = (item as any).badge
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-orange-50 text-orange-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <item.icon
                    className={cn(
                      'h-5 w-5 shrink-0',
                      isActive ? 'text-orange-500' : 'text-gray-400 group-hover:text-gray-600'
                    )}
                  />
                  <span className="flex-1">{item.name}</span>
                  {Badge && <Badge />}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* ── Desktop sidebar ────────────────────────────────── */}
      <div
        className={cn(
          'hidden lg:fixed lg:inset-y-0 lg:right-0 lg:z-30 lg:flex lg:flex-col transition-all duration-300',
          sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'
        )}
      >
        <div className="flex grow flex-col overflow-y-auto border-l border-gray-200 bg-white">
          {/* Logo / brand */}
          <div className="flex h-16 shrink-0 items-center justify-between px-3 border-b border-gray-100">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2 px-1">
                <span className="text-xl font-bold leading-tight"><span className="text-orange-500">Do</span><span className="text-gray-900">We</span></span>
                <span className="text-xs font-medium text-gray-400 mt-0.5">Admin</span>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title={sidebarCollapsed ? 'הרחב תפריט' : 'מזער תפריט'}
            >
              <Menu className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col px-2 py-4">
            <ul className="flex flex-1 flex-col gap-y-0.5">
              <li className="flex-1">
                <ul className="space-y-0.5">
                  {navigation.map((item) => {
                    const isActive =
                      location.pathname === item.href ||
                      (item.href !== '/' && location.pathname.startsWith(item.href))
                    const Badge = (item as any).badge
                    return (
                      <li key={item.name}>
                        <Link
                          to={item.href}
                          className={cn(
                            'group flex items-center gap-3 rounded-lg p-2 text-sm font-medium transition-colors',
                            sidebarCollapsed && 'justify-center',
                            isActive
                              ? 'bg-orange-50 text-orange-700'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          )}
                          title={sidebarCollapsed ? item.name : undefined}
                        >
                          <item.icon
                            className={cn(
                              'h-5 w-5 shrink-0',
                              isActive
                                ? 'text-orange-500'
                                : 'text-gray-400 group-hover:text-gray-600'
                            )}
                          />
                          {!sidebarCollapsed && (
                            <>
                              <span className="flex-1 leading-5">{item.name}</span>
                              {Badge && <Badge />}
                            </>
                          )}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </li>

              {/* User + logout */}
              <li>
                <div className="border-t border-gray-100 pt-3">
                  <div className={cn('flex items-center gap-3 px-2 py-2', sidebarCollapsed && 'justify-center')}>
                    <div className="h-8 w-8 shrink-0 rounded-full bg-orange-100 flex items-center justify-center">
                      <User className="h-4 w-4 text-orange-600" />
                    </div>
                    {!sidebarCollapsed && (
                      <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                        <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={logout}
                    className={cn(
                      'group flex w-full items-center gap-3 rounded-lg p-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-red-600 transition-colors',
                      sidebarCollapsed && 'justify-center'
                    )}
                    title={sidebarCollapsed ? 'התנתק' : undefined}
                  >
                    <LogOut className="h-5 w-5 shrink-0 text-gray-400 group-hover:text-red-500" />
                    {!sidebarCollapsed && 'התנתק'}
                  </button>
                </div>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* ── Main content ──────────────────────────────────── */}
      <div
        className={cn(
          'transition-all duration-300',
          sidebarCollapsed ? 'lg:pr-16' : 'lg:pr-64'
        )}
      >
        {/* Mobile top bar */}
        <div className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-white px-4 shadow-sm lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-1.5">
            <span className="text-base font-bold"><span className="text-orange-500">Do</span>We</span>
          </div>
          <button onClick={logout} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100">
            <LogOut className="h-5 w-5" />
          </button>
        </div>

        {/* Page content */}
        <main className="min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
