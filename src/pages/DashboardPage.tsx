import { useQuery } from '@tanstack/react-query'
import {
  FileText,
  FolderTree,
  Image,
  Users,
  Eye,
  Clock,
  Sparkles,
  TrendingUp,
  Award,
  AlertCircle,
  Phone,
  MapPin,
  Star,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '@/services/api'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { cn } from '@/utils/cn'

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
interface DashboardStats {
  pages:       { total: number; published: number; draft: number }
  categories:  { total: number; active: number }
  media:       { total: number; totalSize: number }
  users:       { total: number; active: number }
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  new:       { label: 'חדש',        color: 'bg-blue-100 text-blue-800' },
  contacted: { label: 'יצרנו קשר', color: 'bg-yellow-100 text-yellow-800' },
  qualified: { label: 'מוסמך',     color: 'bg-purple-100 text-purple-800' },
  proposal:  { label: 'הצעת מחיר', color: 'bg-orange-100 text-orange-800' },
  won:       { label: 'נסגר ✓',    color: 'bg-green-100 text-green-800' },
  lost:      { label: 'אבד',       color: 'bg-red-100 text-red-800' },
}

// ─────────────────────────────────────────────────────────
// Score badge
// ─────────────────────────────────────────────────────────
function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 75 ? 'text-green-700' :
    score >= 50 ? 'text-yellow-700' :
    score >= 25 ? 'text-orange-700' : 'text-gray-400'
  return (
    <span className={cn('flex items-center gap-0.5 text-xs font-semibold', color)}>
      <Star className="h-3 w-3" />
      {score}
    </span>
  )
}

// ─────────────────────────────────────────────────────────
// Main dashboard
// ─────────────────────────────────────────────────────────
export default function DashboardPage() {
  // CMS stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await api.get<{ data: DashboardStats }>('/stats/dashboard')
      return response.data.data
    },
  })

  // Lead stats (טבלת solar_leads ב-API — שם היסטורי)
  const { data: leadStats } = useQuery({
    queryKey: ['lead-stats'],
    queryFn: () => api.get('/contact/stats').then((r) => r.data.data),
    refetchInterval: 60_000,
  })

  const funnel: { status: string; count: number }[] = leadStats?.funnel ?? []
  const totalLeads   = funnel.reduce((s, f) => s + (f.count ?? 0), 0)
  const newLeads     = funnel.find((f) => f.status === 'new')?.count   ?? 0
  const wonLeads     = funnel.find((f) => f.status === 'won')?.count   ?? 0
  const qualifiedLeads = funnel.find((f) => f.status === 'qualified')?.count ?? 0

  if (statsLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="p-6" dir="rtl">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-orange-100 p-2.5">
            <Sparkles className="h-6 w-6 text-orange-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">לוח בקרה</h1>
            <p className="text-sm text-gray-500">סקירה כללית — פניות ולידים (DoWe)</p>
          </div>
        </div>
      </div>

      {/* ── Lead KPIs (primary) ── */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800">פניות לידים</h2>
          <Link to="/leads" className="text-sm text-orange-500 hover:text-orange-600 font-medium">
            נהל פניות ←
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <LeadKpiCard
            icon={<TrendingUp className="h-5 w-5 text-blue-600" />}
            label="סה״כ פניות"
            value={totalLeads}
            sub="כולל כל הסטטוסים"
            href="/leads"
            color="bg-blue-50 border-blue-100"
          />
          <LeadKpiCard
            icon={<AlertCircle className="h-5 w-5 text-orange-500" />}
            label="פניות חדשות"
            value={newLeads}
            sub="ממתינות לטיפול"
            href="/leads?status=new"
            color="bg-orange-50 border-orange-100"
            highlight={newLeads > 0}
          />
          <LeadKpiCard
            icon={<Star className="h-5 w-5 text-purple-600" />}
            label="מוסמכים"
            value={qualifiedLeads}
            sub="לידים שאושרו"
            href="/leads?status=qualified"
            color="bg-purple-50 border-purple-100"
          />
          <LeadKpiCard
            icon={<Award className="h-5 w-5 text-green-600" />}
            label="נסגרו"
            value={wonLeads}
            sub={totalLeads ? `${Math.round((wonLeads / totalLeads) * 100)}% המרה` : '—'}
            href="/leads?status=won"
            color="bg-green-50 border-green-100"
          />
        </div>
      </div>

      {/* ── CMS Stats ── */}
      <div className="mb-8">
        <h2 className="text-base font-semibold text-gray-800 mb-4">תוכן האתר</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { name: 'דפים',      href: '/pages',      icon: FileText,   value: stats?.pages.total ?? 0,      desc: `${stats?.pages.published ?? 0} מפורסמים`,   color: 'bg-slate-100 text-slate-600' },
            { name: 'קטגוריות',  href: '/categories', icon: FolderTree, value: stats?.categories.total ?? 0, desc: `${stats?.categories.active ?? 0} פעילות`,    color: 'bg-slate-100 text-slate-600' },
            { name: 'מדיה',      href: '/media',      icon: Image,      value: stats?.media.total ?? 0,      desc: formatBytes(stats?.media.totalSize ?? 0),      color: 'bg-slate-100 text-slate-600' },
            { name: 'משתמשים',   href: '/users',      icon: Users,      value: stats?.users.total ?? 0,      desc: `${stats?.users.active ?? 0} פעילים`,         color: 'bg-slate-100 text-slate-600' },
          ].map((c) => (
            <Link
              key={c.name}
              to={c.href}
              className="flex items-center gap-3 rounded-xl border bg-white p-4 hover:shadow-md transition-shadow"
            >
              <div className={cn('rounded-lg p-2', c.color)}>
                <c.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500">{c.name}</p>
                <p className="text-xl font-bold text-gray-900">{c.value}</p>
                <p className="text-xs text-gray-400">{c.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Bottom 2-col ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Leads */}
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h2 className="font-semibold text-gray-900">פניות אחרונות</h2>
            <Link to="/leads" className="text-sm text-orange-500 hover:text-orange-600">
              צפה בכל
            </Link>
          </div>
          <div className="divide-y">
            <RecentLeads />
          </div>
        </div>

        {/* Recent Pages */}
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h2 className="font-semibold text-gray-900">דפים אחרונים</h2>
            <Link to="/pages" className="text-sm text-orange-500 hover:text-orange-600">
              צפה בכל
            </Link>
          </div>
          <div className="divide-y">
            <RecentPages />
          </div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="mt-8">
        <h2 className="mb-4 text-base font-semibold text-gray-800">פעולות מהירות</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Link
            to="/leads"
            className="flex items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
          >
            <AlertCircle className="h-4 w-4" />
            פניות חדשות
          </Link>
          <Link
            to="/pages/new"
            className="flex items-center justify-center gap-2 rounded-xl border bg-white py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <FileText className="h-4 w-4" />
            דף חדש
          </Link>
          <Link
            to="/posts/ai-generator"
            className="flex items-center justify-center gap-2 rounded-xl border bg-white py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <TrendingUp className="h-4 w-4" />
            מאמר AI
          </Link>
          <Link
            to="/settings"
            className="flex items-center justify-center gap-2 rounded-xl border bg-white py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            הגדרות
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Recent Leads sub-component
// ─────────────────────────────────────────────────────────
function RecentLeads() {
  const { data, isLoading } = useQuery({
    queryKey: ['recent-leads'],
    queryFn: () => api.get('/contact?limit=6&offset=0').then((r) => r.data.data),
    refetchInterval: 30_000,
  })

  if (isLoading) return <div className="p-4"><LoadingSpinner /></div>
  if (!data || data.length === 0) {
    return <p className="p-4 text-sm text-gray-400">אין פניות עדיין</p>
  }

  return (
    <>
      {data.map((lead: any) => {
        const sc = STATUS_CONFIG[lead.status] ?? STATUS_CONFIG.new
        return (
          <Link
            key={lead.id}
            to="/leads"
            className="flex items-center gap-3 px-5 py-3 hover:bg-orange-50 transition-colors"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-600">
              {lead.first_name?.[0] ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {lead.first_name} {lead.last_name ?? ''}
                </p>
                <ScoreBadge score={lead.lead_score} />
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                <Phone className="h-3 w-3" />
                <span className="font-mono">{lead.phone}</span>
                {lead.city && <><MapPin className="h-3 w-3" /><span>{lead.city}</span></>}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', sc.color)}>
                {sc.label}
              </span>
              <span className="text-xs text-gray-400">
                {new Date(lead.created_at).toLocaleDateString('he-IL')}
              </span>
            </div>
          </Link>
        )
      })}
    </>
  )
}

// ─────────────────────────────────────────────────────────
// Recent Pages sub-component
// ─────────────────────────────────────────────────────────
function RecentPages() {
  const { data, isLoading } = useQuery({
    queryKey: ['recent-pages'],
    queryFn: () => api.get('/pages?limit=5').then((r) => r.data.data),
  })

  if (isLoading) return <div className="p-4"><LoadingSpinner /></div>
  if (!data || data.length === 0) {
    return <p className="p-4 text-sm text-gray-400">אין דפים עדיין</p>
  }

  return (
    <>
      {data.map((page: any) => (
        <Link
          key={page.id}
          to={`/pages/${page.id}/edit`}
          className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{page.title}</p>
            <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
              <Clock className="h-3 w-3" />
              <span>{new Date(page.updatedAt ?? page.createdAt).toLocaleDateString('he-IL')}</span>
            </div>
          </div>
          {page.isPublished && (
            <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 shrink-0 mr-2">
              <Eye className="h-3 w-3" />
              פורסם
            </span>
          )}
        </Link>
      ))}
    </>
  )
}

// ─────────────────────────────────────────────────────────
// Lead KPI Card
// ─────────────────────────────────────────────────────────
function LeadKpiCard({
  icon, label, value, sub, href, color, highlight = false,
}: {
  icon: React.ReactNode
  label: string
  value: number
  sub: string
  href: string
  color: string
  highlight?: boolean
}) {
  return (
    <Link
      to={href}
      className={cn(
        'rounded-xl border p-5 transition-all hover:shadow-md',
        color,
        highlight && 'ring-2 ring-orange-400 shadow-orange-100 shadow-md'
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
        {icon}
      </div>
      <p className={cn('text-3xl font-bold', highlight ? 'text-orange-600' : 'text-gray-900')}>
        {value.toLocaleString('he-IL')}
      </p>
      <p className="mt-1 text-xs text-gray-500">{sub}</p>
    </Link>
  )
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}
