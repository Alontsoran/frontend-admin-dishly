import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search, Filter, RefreshCw, Phone, Mail, MapPin, Sun,
  ChevronDown, ChevronUp, X, Check, Clock, Star,
  AlertCircle, TrendingUp, Users, Award,
  Send, Eye,
} from 'lucide-react'
import { api } from '@/services/api'
import { cn } from '@/utils/cn'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
/** ליד מה-API (שדות qualification היסטוריים משם solar_leads) */
interface LeadRecord {
  id: string
  first_name: string
  last_name: string | null
  phone: string
  email: string | null
  city: string | null
  property_type: string | null
  roof_size: string | null
  monthly_kwh: string | null
  has_electricity_contract: boolean | null
  electricity_supplier: string | null
  solar_purpose: string | null
  system_type: string | null
  budget_range: string | null
  preferred_contact_time: string | null
  message: string | null
  status: string
  lead_score: number
  assigned_to: string | null
  notes: string | null
  estimated_price_ils: number | null
  estimated_system_kw: number | null
  dynamics_lead_id: string | null
  dynamics_synced: boolean
  dynamics_sync_error: string | null
  source_page: string | null
  utm_source: string | null
  utm_campaign: string | null
  email_sent: boolean
  created_at: string
  updated_at: string
  activities?: LeadActivity[]
}

interface LeadActivity {
  id: string
  activity_type: string
  description: string
  metadata: Record<string, unknown>
  created_at: string
}

// ─────────────────────────────────────────────────────────
// Label dictionaries
// ─────────────────────────────────────────────────────────
const PROPERTY_TYPE_LABELS: Record<string, string> = {
  house: 'בית פרטי',
  apartment: 'דירה',
  business: 'עסק',
  other: 'אחר',
}
const ROOF_SIZE_LABELS: Record<string, string> = {
  under_30: '<30 מ"ר',
  '30_50': '30–50 מ"ר',
  '50_100': '50–100 מ"ר',
  '100_200': '100–200 מ"ר',
  over_200: '>200 מ"ר',
}
const KWH_LABELS: Record<string, string> = {
  under_300: '<300 kWh',
  '300_500': '300–500 kWh',
  '500_800': '500–800 kWh',
  '800_1200': '800–1200 kWh',
  over_1200: '>1200 kWh',
}
const BUDGET_LABELS: Record<string, string> = {
  under_40k: 'עד 40K ₪',
  '40k_60k': '40-60K ₪',
  '60k_80k': '60-80K ₪',
  '80k_120k': '80-120K ₪',
  over_120k: '>120K ₪',
  not_sure: 'לא יודע',
}
const PURPOSE_LABELS: Record<string, string> = {
  savings: 'חסכון',
  green: 'סביבה',
  sell_electricity: 'מכירת חשמל',
  backup: 'גיבוי',
  all: 'הכל',
}
const CONTACT_TIME_LABELS: Record<string, string> = {
  morning: 'בוקר',
  noon: 'צהריים',
  afternoon: 'אחה"צ',
  evening: 'ערב',
  anytime: 'כל שעה',
}
const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  new:       { label: 'חדש',          color: 'bg-blue-100 text-blue-800',   dot: 'bg-blue-500' },
  contacted: { label: 'יצרנו קשר',    color: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-500' },
  qualified: { label: 'מוסמך',        color: 'bg-purple-100 text-purple-800', dot: 'bg-purple-500' },
  proposal:  { label: 'הצעת מחיר',   color: 'bg-orange-100 text-orange-800', dot: 'bg-orange-500' },
  won:       { label: 'נסגר ✓',       color: 'bg-green-100 text-green-800',  dot: 'bg-green-500' },
  lost:      { label: 'אבד',          color: 'bg-red-100 text-red-800',     dot: 'bg-red-500' },
  duplicate: { label: 'כפול',         color: 'bg-gray-100 text-gray-600',   dot: 'bg-gray-400' },
  invalid:   { label: 'לא תקין',      color: 'bg-gray-100 text-gray-600',   dot: 'bg-gray-400' },
}
const ACTIVITY_LABELS: Record<string, { label: string; icon: string }> = {
  created:            { label: 'ליד נוצר',            icon: '🆕' },
  status_changed:     { label: 'שינוי סטטוס',          icon: '🔄' },
  note_added:         { label: 'הערה נוספה',            icon: '📝' },
  call_made:          { label: 'שיחת טלפון',           icon: '📞' },
  email_sent:         { label: 'מייל נשלח',            icon: '📧' },
  whatsapp_sent:      { label: 'וואטסאפ נשלח',         icon: '💬' },
  meeting_scheduled:  { label: 'פגישה נקבעה',          icon: '📅' },
  proposal_sent:      { label: 'הצעת מחיר נשלחה',      icon: '📋' },
  dynamics_synced:    { label: 'סונכרן ל-Dynamics',    icon: '☁️' },
  assigned:           { label: 'הוקצה לנציג',           icon: '👤' },
}

// ─────────────────────────────────────────────────────────
// Score badge
// ─────────────────────────────────────────────────────────
function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 75 ? 'bg-green-100 text-green-700 border-green-200' :
    score >= 50 ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
    score >= 25 ? 'bg-orange-100 text-orange-700 border-orange-200' :
                  'bg-gray-100 text-gray-500 border-gray-200'
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold', color)}>
      <Star className="h-3 w-3" />
      {score}
    </span>
  )
}

// ─────────────────────────────────────────────────────────
// Lead Detail Slide-over
// ─────────────────────────────────────────────────────────
function LeadDetail({
  lead,
  onClose,
  onRefresh,
}: {
  lead: LeadRecord
  onClose: () => void
  onRefresh: () => void
}) {
  const [newNote, setNewNote] = useState('')
  const [newStatus, setNewStatus] = useState(lead.status)
  const qc = useQueryClient()

  const updateMutation = useMutation({
    mutationFn: (updates: Partial<LeadRecord>) =>
      api.patch(`/contact/${lead.id}`, updates).then((r) => r.data),
    onSuccess: () => {
      toast.success('ליד עודכן')
      qc.invalidateQueries({ queryKey: ['leads'] })
      onRefresh()
    },
    onError: () => toast.error('שגיאה בעדכון'),
  })

  const activityMutation = useMutation({
    mutationFn: (body: { activity_type: string; description: string }) =>
      api.post(`/contact/${lead.id}/activity`, body).then((r) => r.data),
    onSuccess: () => {
      toast.success('הערה נשמרה')
      setNewNote('')
      qc.invalidateQueries({ queryKey: ['leads'] })
      onRefresh()
    },
    onError: () => toast.error('שגיאה בשמירה'),
  })

  const syncMutation = useMutation({
    mutationFn: () => api.post(`/contact/${lead.id}/sync-dynamics`).then((r) => r.data),
    onSuccess: () => {
      toast.success('סונכרן ל-Dynamics ✓')
      qc.invalidateQueries({ queryKey: ['leads'] })
      onRefresh()
    },
    onError: (e: any) => toast.error(`שגיאת Dynamics: ${e?.response?.data?.message || e.message}`),
  })

  const handleStatusSave = () => {
    if (newStatus !== lead.status) {
      updateMutation.mutate({ status: newStatus as LeadRecord['status'] })
    }
  }

  const handleAddNote = () => {
    if (!newNote.trim()) return
    activityMutation.mutate({ activity_type: 'note_added', description: newNote.trim() })
  }

  const fullName = [lead.first_name, lead.last_name].filter(Boolean).join(' ')
  const sc = STATUS_CONFIG[lead.status] ?? STATUS_CONFIG.new

  return (
    <div className="fixed inset-0 z-50 flex justify-end" dir="rtl">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="relative z-10 flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b bg-gradient-to-l from-orange-50 to-yellow-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-2xl">
              ☀️
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{fullName}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <ScoreBadge score={lead.lead_score} />
                <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', sc.color)}>
                  <span className={cn('h-1.5 w-1.5 rounded-full', sc.dot)} />
                  {sc.label}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Contact info */}
          <section>
            <h3 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">פרטי קשר</h3>
            <div className="grid grid-cols-2 gap-3">
              <a href={`tel:${lead.phone}`} className="flex items-center gap-2 rounded-lg border p-3 hover:bg-gray-50 transition-colors">
                <Phone className="h-4 w-4 text-green-600 shrink-0" />
                <span className="text-sm font-medium">{lead.phone}</span>
              </a>
              {lead.email && (
                <a href={`mailto:${lead.email}`} className="flex items-center gap-2 rounded-lg border p-3 hover:bg-gray-50 transition-colors">
                  <Mail className="h-4 w-4 text-blue-600 shrink-0" />
                  <span className="text-sm truncate">{lead.email}</span>
                </a>
              )}
              {lead.city && (
                <div className="flex items-center gap-2 rounded-lg border p-3">
                  <MapPin className="h-4 w-4 text-red-500 shrink-0" />
                  <span className="text-sm">{lead.city}</span>
                </div>
              )}
              {lead.preferred_contact_time && (
                <div className="flex items-center gap-2 rounded-lg border p-3">
                  <Clock className="h-4 w-4 text-purple-500 shrink-0" />
                  <span className="text-sm">{CONTACT_TIME_LABELS[lead.preferred_contact_time] ?? lead.preferred_contact_time}</span>
                </div>
              )}
            </div>
            {/* Quick action buttons */}
            <div className="flex gap-2 mt-3">
              <a
                href={`https://wa.me/972${lead.phone.replace(/^0/, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-green-500 py-2.5 text-sm font-medium text-white hover:bg-green-600 transition-colors"
              >
                💬 וואטסאפ
              </a>
              <a
                href={`tel:${lead.phone}`}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-blue-500 py-2.5 text-sm font-medium text-white hover:bg-blue-600 transition-colors"
              >
                📞 חייג
              </a>
            </div>
          </section>

          {/* פרטי שאלון (שדות היסטוריים) */}
          <section>
            <h3 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">פרטי הפרויקט</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {lead.property_type && (
                <InfoChip icon="🏠" label="סוג נכס" value={PROPERTY_TYPE_LABELS[lead.property_type] ?? lead.property_type} />
              )}
              {lead.roof_size && (
                <InfoChip icon="📐" label="שטח גג" value={ROOF_SIZE_LABELS[lead.roof_size] ?? lead.roof_size} />
              )}
              {lead.monthly_kwh && (
                <InfoChip icon="⚡" label="צריכה חודשית" value={KWH_LABELS[lead.monthly_kwh] ?? lead.monthly_kwh} />
              )}
              {lead.budget_range && (
                <InfoChip icon="💰" label="תקציב" value={BUDGET_LABELS[lead.budget_range] ?? lead.budget_range} />
              )}
              {lead.solar_purpose && (
                <InfoChip icon="🎯" label="מטרה" value={PURPOSE_LABELS[lead.solar_purpose] ?? lead.solar_purpose} />
              )}
              {lead.system_type && (
                <InfoChip icon="🔋" label="סוג מערכת" value={lead.system_type} />
              )}
              {lead.has_electricity_contract !== null && (
                <InfoChip
                  icon="📋"
                  label="חוזה חשמל"
                  value={lead.has_electricity_contract ? `כן — ${lead.electricity_supplier || ''}` : 'לא'}
                />
              )}
            </div>

            {lead.estimated_system_kw && (
              <div className="mt-3 rounded-lg bg-orange-50 p-3 flex items-center gap-3">
                <Sun className="h-5 w-5 text-orange-500 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">הערכת מערכת</p>
                  <p className="font-semibold text-gray-900">{lead.estimated_system_kw} kW
                    {lead.estimated_price_ils && <span className="text-gray-600 font-normal"> · {lead.estimated_price_ils.toLocaleString('he-IL')} ₪</span>}
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* Message */}
          {lead.message && (
            <section>
              <h3 className="mb-2 text-sm font-semibold text-gray-500 uppercase tracking-wide">הודעה</h3>
              <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700 whitespace-pre-wrap">{lead.message}</p>
            </section>
          )}

          {/* Status update */}
          <section>
            <h3 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">עדכון סטטוס</h3>
            <div className="flex gap-2">
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                {Object.entries(STATUS_CONFIG).map(([v, c]) => (
                  <option key={v} value={v}>{c.label}</option>
                ))}
              </select>
              <button
                onClick={handleStatusSave}
                disabled={newStatus === lead.status || updateMutation.isPending}
                className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50 transition-colors"
              >
                <Check className="h-4 w-4" />
                שמור
              </button>
            </div>
          </section>

          {/* Add note */}
          <section>
            <h3 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">הוסף הערה</h3>
            <div className="flex flex-col gap-2">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="כתוב הערה, תוצאת שיחה, פרטי פגישה..."
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
              />
              <button
                onClick={handleAddNote}
                disabled={!newNote.trim() || activityMutation.isPending}
                className="self-end flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900 disabled:opacity-50 transition-colors"
              >
                <Send className="h-4 w-4" />
                שלח הערה
              </button>
            </div>
          </section>

          {/* Attribution */}
          {(lead.source_page || lead.utm_source || lead.utm_campaign) && (
            <section>
              <h3 className="mb-2 text-sm font-semibold text-gray-500 uppercase tracking-wide">מקור הגעה</h3>
              <div className="space-y-1 text-xs text-gray-500">
                {lead.source_page && <p>עמוד: <span className="text-gray-700">{lead.source_page}</span></p>}
                {lead.utm_source && <p>מקור: <span className="text-gray-700">{lead.utm_source}</span></p>}
                {lead.utm_campaign && <p>קמפיין: <span className="text-gray-700">{lead.utm_campaign}</span></p>}
              </div>
            </section>
          )}

          {/* Dynamics sync status */}
          <section className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-700">Dynamics 365</h3>
                {lead.dynamics_synced ? (
                  <p className="text-xs text-green-600 mt-0.5">
                    ✓ מסונכרן · ID: {lead.dynamics_lead_id}
                  </p>
                ) : lead.dynamics_sync_error ? (
                  <p className="text-xs text-red-500 mt-0.5">⚠ {lead.dynamics_sync_error}</p>
                ) : (
                  <p className="text-xs text-gray-400 mt-0.5">לא מסונכרן</p>
                )}
              </div>
              {!lead.dynamics_synced && (
                <button
                  onClick={() => syncMutation.mutate()}
                  disabled={syncMutation.isPending}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  <RefreshCw className={cn('h-3 w-3', syncMutation.isPending && 'animate-spin')} />
                  סנכרן
                </button>
              )}
            </div>
          </section>

          {/* Activity timeline */}
          {lead.activities && lead.activities.length > 0 && (
            <section>
              <h3 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">היסטוריה</h3>
              <ol className="space-y-3">
                {lead.activities.map((a) => {
                  const cfg = ACTIVITY_LABELS[a.activity_type] ?? { label: a.activity_type, icon: '•' }
                  return (
                    <li key={a.id} className="flex gap-3">
                      <span className="text-base shrink-0">{cfg.icon}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{cfg.label}</p>
                        {a.description && (
                          <p className="text-sm text-gray-600 mt-0.5">{a.description}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(a.created_at).toLocaleString('he-IL')}
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ol>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoChip({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg bg-gray-50 p-2.5">
      <span className="text-base shrink-0">{icon}</span>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-800">{value}</p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────
export default function LeadsPage() {
  const [selectedLead, setSelectedLead] = useState<LeadRecord | null>(null)
  const [filters, setFilters] = useState({
    status: '',
    city: '',
    property_type: '',
    min_score: '',
    dynamics_synced: '',
  })
  const [searchText, setSearchText] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(0)
  const LIMIT = 25

  const qc = useQueryClient()

  // ── Stats ──
  const { data: statsData } = useQuery({
    queryKey: ['lead-stats'],
    queryFn: () => api.get('/contact/stats').then((r) => r.data.data),
    refetchInterval: 60_000,
  })

  // ── Leads list ──
  const {
    data: leadsData,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['leads', filters, page],
    queryFn: () => {
      const params = new URLSearchParams({
        limit: String(LIMIT),
        offset: String(page * LIMIT),
        ...(filters.status          && { status:          filters.status }),
        ...(filters.city            && { city:            filters.city }),
        ...(filters.property_type   && { property_type:   filters.property_type }),
        ...(filters.min_score       && { min_score:        filters.min_score }),
        ...(filters.dynamics_synced && { dynamics_synced:  filters.dynamics_synced }),
      })
      return api.get(`/contact?${params}`).then((r) => r.data)
    },
    refetchInterval: 30_000,
  })

  // ── Single lead (with activities) ──
  const { data: detailData, refetch: refetchDetail } = useQuery({
    queryKey: ['lead-detail', selectedLead?.id],
    queryFn: () =>
      api.get(`/contact/${selectedLead!.id}`).then((r) => r.data.data),
    enabled: !!selectedLead,
  })

  // deleteMutation — זמין להרחבה עתידית

  const leads: LeadRecord[] = leadsData?.data ?? []
  const total: number       = leadsData?.pagination?.total ?? 0
  const totalPages          = Math.ceil(total / LIMIT)

  const filteredLeads = searchText
    ? leads.filter((l) =>
        `${l.first_name} ${l.last_name ?? ''} ${l.phone} ${l.city ?? ''}`.toLowerCase()
          .includes(searchText.toLowerCase())
      )
    : leads

  const funnel: { status: string; count: number; pct: number }[] = statsData?.funnel ?? []
  const daily:  { day: string; total_leads: number; won: number }[] = statsData?.daily ?? []

  const totalNew = funnel.find((f) => f.status === 'new')?.count ?? 0
  const totalWon = funnel.find((f) => f.status === 'won')?.count   ?? 0
  const totalAll = funnel.reduce((s, f) => s + (f.count ?? 0), 0)
  const avgScore = daily.length
    ? Math.round(daily.reduce((s, d) => s + (Number((d as any).avg_score) || 0), 0) / daily.length)
    : 0

  const handleOpenLead = useCallback((lead: LeadRecord) => {
    setSelectedLead(lead)
  }, [])

  const handleCloseDetail = () => setSelectedLead(null)

  const handleRefreshDetail = () => {
    refetchDetail()
    refetch()
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* ── Header ── */}
      <div className="sticky top-0 z-20 border-b bg-white shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                ☀️ ניהול פניות לידים
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {total.toLocaleString('he-IL')} פניות סה"כ
                {isFetching && <span className="mr-2 text-xs text-blue-500">מרענן...</span>}
              </p>
            </div>
            <button
              onClick={() => { refetch(); qc.invalidateQueries({ queryKey: ['lead-stats'] }) }}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
              רענן
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard
            icon={<Users className="h-5 w-5 text-blue-600" />}
            label="סה״כ פניות"
            value={totalAll}
            sub="כולל כל הסטטוסים"
            color="bg-blue-50 border-blue-100"
          />
          <KpiCard
            icon={<AlertCircle className="h-5 w-5 text-orange-500" />}
            label="פניות חדשות"
            value={totalNew}
            sub="ממתינות לטיפול"
            color="bg-orange-50 border-orange-100"
            highlight={totalNew > 0}
          />
          <KpiCard
            icon={<Award className="h-5 w-5 text-green-600" />}
            label="עסקאות שנסגרו"
            value={totalWon}
            sub={totalAll ? `${Math.round((totalWon / totalAll) * 100)}% המרה` : '—'}
            color="bg-green-50 border-green-100"
          />
          <KpiCard
            icon={<TrendingUp className="h-5 w-5 text-purple-600" />}
            label="ניקוד ממוצע"
            value={avgScore}
            sub="מתוך 100"
            color="bg-purple-50 border-purple-100"
          />
        </div>

        {/* ── Search + Filter bar ── */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="חפש לפי שם, טלפון, עיר..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2.5 pr-9 pl-4 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            {searchText && (
              <button onClick={() => setSearchText('')} className="absolute left-3 top-1/2 -translate-y-1/2">
                <X className="h-4 w-4 text-gray-400" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors',
              showFilters
                ? 'border-orange-300 bg-orange-50 text-orange-700'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            )}
          >
            <Filter className="h-4 w-4" />
            פילטרים
            {Object.values(filters).some(Boolean) && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-xs text-white">
                {Object.values(filters).filter(Boolean).length}
              </span>
            )}
            {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        {/* ── Filters panel ── */}
        {showFilters && (
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">סטטוס</label>
                <select
                  value={filters.status}
                  onChange={(e) => { setFilters((f) => ({ ...f, status: e.target.value })); setPage(0) }}
                  className="w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  <option value="">הכל</option>
                  {Object.entries(STATUS_CONFIG).map(([v, c]) => (
                    <option key={v} value={v}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">עיר</label>
                <input
                  type="text"
                  value={filters.city}
                  onChange={(e) => { setFilters((f) => ({ ...f, city: e.target.value })); setPage(0) }}
                  placeholder="כל עיר"
                  className="w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">סוג נכס</label>
                <select
                  value={filters.property_type}
                  onChange={(e) => { setFilters((f) => ({ ...f, property_type: e.target.value })); setPage(0) }}
                  className="w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  <option value="">הכל</option>
                  {Object.entries(PROPERTY_TYPE_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">ניקוד מינימלי</label>
                <input
                  type="number"
                  min={0} max={100}
                  value={filters.min_score}
                  onChange={(e) => { setFilters((f) => ({ ...f, min_score: e.target.value })); setPage(0) }}
                  placeholder="0–100"
                  className="w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Dynamics</label>
                <select
                  value={filters.dynamics_synced}
                  onChange={(e) => { setFilters((f) => ({ ...f, dynamics_synced: e.target.value })); setPage(0) }}
                  className="w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  <option value="">הכל</option>
                  <option value="true">מסונכרן</option>
                  <option value="false">לא מסונכרן</option>
                </select>
              </div>
            </div>
            {Object.values(filters).some(Boolean) && (
              <button
                onClick={() => { setFilters({ status: '', city: '', property_type: '', min_score: '', dynamics_synced: '' }); setPage(0) }}
                className="mt-3 text-sm text-red-500 hover:text-red-700"
              >
                × נקה פילטרים
              </button>
            )}
          </div>
        )}

        {/* ── Status quick-filter tabs ── */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setFilters((f) => ({ ...f, status: '' })); setPage(0) }}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              !filters.status ? 'bg-gray-800 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'
            )}
          >
            הכל ({totalAll})
          </button>
          {funnel.map((f) => {
            const cfg = STATUS_CONFIG[f.status]
            if (!cfg) return null
            return (
              <button
                key={f.status}
                onClick={() => { setFilters((fi) => ({ ...fi, status: f.status })); setPage(0) }}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                  filters.status === f.status ? 'bg-gray-800 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'
                )}
              >
                {cfg.label} ({f.count})
              </button>
            )
          })}
        </div>

        {/* ── Leads table ── */}
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center text-gray-400">
              <Sun className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">אין פניות תואמות</p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      <th className="px-4 py-3">ניקוד</th>
                      <th className="px-4 py-3">לקוח</th>
                      <th className="px-4 py-3">טלפון</th>
                      <th className="px-4 py-3">עיר</th>
                      <th className="px-4 py-3">נכס</th>
                      <th className="px-4 py-3">תקציב</th>
                      <th className="px-4 py-3">סטטוס</th>
                      <th className="px-4 py-3">Dynamics</th>
                      <th className="px-4 py-3">תאריך</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredLeads.map((lead) => {
                      const sc = STATUS_CONFIG[lead.status] ?? STATUS_CONFIG.new
                      return (
                        <tr
                          key={lead.id}
                          onClick={() => handleOpenLead(lead)}
                          className="cursor-pointer hover:bg-orange-50 transition-colors group"
                        >
                          <td className="px-4 py-3">
                            <ScoreBadge score={lead.lead_score} />
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-gray-900">
                              {lead.first_name} {lead.last_name ?? ''}
                            </p>
                            {lead.email && (
                              <p className="text-xs text-gray-400 truncate max-w-[160px]">{lead.email}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 font-mono">{lead.phone}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{lead.city ?? '—'}</td>
                          <td className="px-4 py-3">
                            {lead.property_type
                              ? <span className="text-xs">{PROPERTY_TYPE_LABELS[lead.property_type] ?? lead.property_type}</span>
                              : <span className="text-gray-300">—</span>
                            }
                          </td>
                          <td className="px-4 py-3">
                            {lead.budget_range
                              ? <span className="text-xs text-emerald-700 font-medium">{BUDGET_LABELS[lead.budget_range] ?? lead.budget_range}</span>
                              : <span className="text-gray-300">—</span>
                            }
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', sc.color)}>
                              <span className={cn('h-1.5 w-1.5 rounded-full', sc.dot)} />
                              {sc.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {lead.dynamics_synced
                              ? <span className="text-xs text-green-600">✓ מסונכרן</span>
                              : lead.dynamics_sync_error
                              ? <span className="text-xs text-red-400">⚠ שגיאה</span>
                              : <span className="text-xs text-gray-300">—</span>
                            }
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-400">
                            {new Date(lead.created_at).toLocaleDateString('he-IL')}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleOpenLead(lead) }}
                              className="rounded-lg p-1.5 text-gray-400 hover:bg-orange-100 hover:text-orange-600 opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="lg:hidden divide-y">
                {filteredLeads.map((lead) => {
                  const sc = STATUS_CONFIG[lead.status] ?? STATUS_CONFIG.new
                  return (
                    <div
                      key={lead.id}
                      onClick={() => handleOpenLead(lead)}
                      className="p-4 hover:bg-orange-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-gray-900">
                              {lead.first_name} {lead.last_name ?? ''}
                            </p>
                            <ScoreBadge score={lead.lead_score} />
                          </div>
                          <p className="text-sm text-gray-600 mt-0.5 font-mono">{lead.phone}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            {lead.city && <span>📍 {lead.city}</span>}
                            {lead.property_type && <span>{PROPERTY_TYPE_LABELS[lead.property_type]}</span>}
                            {lead.budget_range && <span className="text-emerald-600 font-medium">{BUDGET_LABELS[lead.budget_range]}</span>}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', sc.color)}>
                            {sc.label}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(lead.created_at).toLocaleDateString('he-IL')}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              מציג {page * LIMIT + 1}–{Math.min((page + 1) * LIMIT, total)} מתוך {total.toLocaleString('he-IL')}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="rounded-lg border px-3 py-1.5 text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                הקודם
              </button>
              <span className="flex items-center px-3 text-sm text-gray-600">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="rounded-lg border px-3 py-1.5 text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                הבא
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Lead detail slide-over ── */}
      {selectedLead && (
        <LeadDetail
          lead={detailData ?? selectedLead}
          onClose={handleCloseDetail}
          onRefresh={handleRefreshDetail}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// KPI Card sub-component
// ─────────────────────────────────────────────────────────
function KpiCard({
  icon,
  label,
  value,
  sub,
  color,
  highlight = false,
}: {
  icon: React.ReactNode
  label: string
  value: number
  sub: string
  color: string
  highlight?: boolean
}) {
  return (
    <div className={cn('rounded-xl border p-5 transition-shadow hover:shadow-md', color, highlight && 'ring-2 ring-orange-400')}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
        {icon}
      </div>
      <p className={cn('text-3xl font-bold', highlight ? 'text-orange-600' : 'text-gray-900')}>
        {value.toLocaleString('he-IL')}
      </p>
      <p className="mt-1 text-xs text-gray-500">{sub}</p>
    </div>
  )
}
