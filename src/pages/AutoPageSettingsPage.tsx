import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  FilePlus2,
  Plus,
  Trash2,
  RefreshCw,
  Settings2,
  ListTodo,
  FolderPlus,
  CheckCircle,
  XCircle,
  Loader2,
  LayoutList,
  Square,
  ListOrdered,
  Activity,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  RotateCcw,
} from 'lucide-react'
import { api } from '@/services/api'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

interface AutoPageSettings {
  enabled: boolean
  intervalMinutes: number
  intervalMinMinutes?: number
  intervalMaxMinutes?: number
}

interface TopicWithStatus {
  id: string
  title: string
  keywords: string[]
  slug: string
  hasPage: boolean
}

type RunStatus = 'processing' | 'completed' | 'failed'

interface RunRecord {
  id: string
  topicTitle: string
  slug: string
  status: RunStatus
  startedAt: string
  completedAt?: string
  error?: string
  pageId?: string
}

interface ScheduleItem {
  slug: string
  title: string
  scheduledAt: string
  failureCount?: number
}

interface JobsState {
  nextTopic: { title: string; slug: string } | null
  currentRun: RunRecord | null
  history: RunRecord[]
  queueRunning: boolean
  schedule?: ScheduleItem[]
}

function StatusBar({
  queueRunning, currentRun, history, pendingCount, completedCount, totalCount, scheduleCount,
}: {
  queueRunning: boolean
  currentRun: RunRecord | null
  history: RunRecord[]
  pendingCount: number
  completedCount: number
  totalCount: number
  scheduleCount: number
}) {
  const lastCompleted = history.find(r => r.status === 'completed')
  const lastFailed = history.find(r => r.status === 'failed')
  const failedCount = history.filter(r => r.status === 'failed').length

  const overallStatus = currentRun
    ? 'running'
    : queueRunning
    ? 'active'
    : failedCount > 0 && !lastCompleted
    ? 'error'
    : 'idle'

  const statusColors = {
    running: 'bg-amber-50 border-amber-300',
    active: 'bg-green-50 border-green-300',
    error: 'bg-red-50 border-red-300',
    idle: 'bg-gray-50 border-gray-200',
  }

  return (
    <div className={`rounded-xl border-2 p-4 ${statusColors[overallStatus]}`}>
      <div className="flex flex-wrap gap-4 items-start">
        {/* מצב כולל */}
        <div className="flex items-center gap-2 min-w-[140px]">
          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
            overallStatus === 'running' ? 'bg-amber-400 animate-pulse' :
            overallStatus === 'active' ? 'bg-green-400 animate-pulse' :
            overallStatus === 'error' ? 'bg-red-400' :
            'bg-gray-300'
          }`} />
          <div>
            <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">מצב</div>
            <div className="font-bold text-gray-900 text-sm">
              {overallStatus === 'running' ? 'יוצר דף כעת' :
               overallStatus === 'active' ? 'טור פעיל' :
               overallStatus === 'error' ? 'שגיאות בטור' :
               'טור כבוי'}
            </div>
          </div>
        </div>

        {/* סה"כ / נוצרו / ממתינים */}
        <div className="flex gap-5 flex-wrap">
          <StatPill label="סה״כ נושאים" value={totalCount} color="gray" />
          <StatPill label="נוצרו דפים" value={completedCount} color="green" />
          <StatPill label="ממתינים" value={pendingCount} color={pendingCount > 0 ? 'amber' : 'gray'} />
          {scheduleCount > 0 && <StatPill label="בלוח זמנים" value={scheduleCount} color="blue" />}
          {failedCount > 0 && <StatPill label="נכשלו" value={failedCount} color="red" />}
        </div>

        {/* פרטי ריצה אחרונה */}
        <div className="flex-1 min-w-[200px] text-xs text-gray-500 space-y-1">
          {lastCompleted && (
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
              <span>הושלם לאחרונה: <strong className="text-gray-700">{lastCompleted.topicTitle}</strong></span>
              <span className="text-gray-400">
                ({lastCompleted.completedAt
                  ? new Date(lastCompleted.completedAt).toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' })
                  : '—'})
              </span>
            </div>
          )}
          {lastFailed && (
            <div className="flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
              <span>כישלון אחרון: <strong className="text-red-700">{lastFailed.topicTitle}</strong></span>
            </div>
          )}
          {!lastCompleted && !lastFailed && (
            <span className="text-gray-400">אין היסטוריית ריצות עדיין</span>
          )}
        </div>
      </div>
    </div>
  )
}

function StatPill({ label, value, color }: { label: string; value: number; color: 'gray' | 'green' | 'amber' | 'blue' | 'red' }) {
  const colors = {
    gray:  'bg-gray-100 text-gray-700',
    green: 'bg-green-100 text-green-800',
    amber: 'bg-amber-100 text-amber-800',
    blue:  'bg-blue-100 text-blue-800',
    red:   'bg-red-100 text-red-800',
  }
  return (
    <div className={`px-3 py-1.5 rounded-lg ${colors[color]} text-center`}>
      <div className="text-lg font-black leading-tight">{value}</div>
      <div className="text-[11px] font-medium">{label}</div>
    </div>
  )
}

function CurrentRunCard({
  currentRun, onReset, resetting,
}: {
  currentRun: RunRecord | null
  onReset: () => void
  resetting: boolean
}) {
  const elapsed = useElapsed(currentRun?.startedAt)
  if (!currentRun) return null

  return (
    <div className="p-4 rounded-xl bg-amber-50 border-2 border-amber-300">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-0.5">יוצר דף כעת</div>
            <div className="font-bold text-gray-900">{currentRun.topicTitle}</div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-gray-400 font-mono">{currentRun.slug}</span>
              {elapsed && (
                <span className="text-xs text-amber-700 font-semibold flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {elapsed} בריצה
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onReset}
          disabled={resetting}
          className="px-3 py-1.5 text-sm font-medium text-amber-800 bg-amber-200 rounded-lg hover:bg-amber-300 disabled:opacity-50"
          title="אם הטור תקוע ולא מתקדם – איפוס יאפשר הרצה מחדש"
        >
          {resetting ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'איפוס ריצה תקועה'}
        </button>
      </div>
    </div>
  )
}

function useElapsed(startedAt: string | undefined) {
  const [elapsed, setElapsed] = useState('')
  useEffect(() => {
    if (!startedAt) { setElapsed(''); return }
    const tick = () => {
      const ms = Date.now() - new Date(startedAt).getTime()
      const s = Math.floor(ms / 1000)
      if (s < 60) setElapsed(`${s}ש`)
      else if (s < 3600) setElapsed(`${Math.floor(s / 60)}ד ${s % 60}ש`)
      else setElapsed(`${Math.floor(s / 3600)}ש ${Math.floor((s % 3600) / 60)}ד`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [startedAt])
  return elapsed
}

export default function AutoPageSettingsPage() {
  const queryClient = useQueryClient()
  const [newTitle, setNewTitle] = useState('')
  const [newKeywords, setNewKeywords] = useState('')
  const [intervalInput, setIntervalInput] = useState('')
  const [intervalMinInput, setIntervalMinInput] = useState('')
  const [intervalMaxInput, setIntervalMaxInput] = useState('')
  const [bulkTopicsText, setBulkTopicsText] = useState('')
  const [expandedErrors, setExpandedErrors] = useState<Record<string, boolean>>({})
  const toggleError = (id: string) => setExpandedErrors(p => ({ ...p, [id]: !p[id] }))

  const { data: settings, isLoading: loadingSettings } = useQuery<AutoPageSettings>({
    queryKey: ['auto-page-settings'],
    queryFn: async () => {
      const res = await api.get('/auto-page/settings')
      return res.data.data
    },
  })

  const { data: topics = [], isLoading: loadingTopics } = useQuery<TopicWithStatus[]>({
    queryKey: ['auto-page-topics'],
    queryFn: async () => {
      const res = await api.get('/auto-page/topics')
      return res.data.data
    },
  })

  const { data: jobs, isLoading: loadingJobs, isError: jobsError, refetch: refetchJobs } = useQuery<JobsState>({
    queryKey: ['auto-page-jobs'],
    queryFn: async () => {
      const res = await api.get('/auto-page/jobs')
      return res.data.data
    },
    refetchInterval: (query) => {
      const state = query.state.data as JobsState | undefined
      return state?.queueRunning || state?.currentRun ? 2500 : 8000
    },
    retry: 2,
  })

  const updateSettingsMutation = useMutation({
    mutationFn: async (payload: {
      enabled?: boolean
      intervalMinutes?: number
      intervalMinMinutes?: number | null
      intervalMaxMinutes?: number | null
    }) => {
      await api.put('/auto-page/settings', payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auto-page-settings'] })
      toast.success('ההגדרות נשמרו')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'שגיאה בשמירה')
    },
  })

  const addTopicMutation = useMutation({
    mutationFn: async (payload: { title: string; keywords: string[] }) => {
      await api.post('/auto-page/topics', payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auto-page-topics'] })
      setNewTitle('')
      setNewKeywords('')
      toast.success('נושא נוסף')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'שגיאה בהוספה')
    },
  })

  const addTopicsBulkMutation = useMutation({
    mutationFn: async (topics: { title: string; keywords: string[] }[]) => {
      const res = await api.post('/auto-page/topics/bulk', { topics })
      return res.data
    },
    onSuccess: (data: { count?: number }) => {
      queryClient.invalidateQueries({ queryKey: ['auto-page-topics'] })
      setBulkTopicsText('')
      toast.success(`נוספו ${data?.count ?? 0} נושאים`)
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'שגיאה בהוספת רשימה')
    },
  })

  const deleteTopicMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/auto-page/topics/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auto-page-topics'] })
      toast.success('נושא הוסר')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'שגיאה במחיקה')
    },
  })

  const setQueueRunningMutation = useMutation({
    mutationFn: async (running: boolean) => {
      await api.put('/auto-page/queue-running', { running })
    },
    onSuccess: (_data, running) => {
      queryClient.invalidateQueries({ queryKey: ['auto-page-jobs'] })
      toast.success(running ? 'הטור הופעל – הדפים יווצרו אחד אחרי השני' : 'הטור נעצר')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'שגיאה')
    },
  })

  const resetStuckRunMutation = useMutation({
    mutationFn: async () => {
      await api.post('/auto-page/reset-run')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auto-page-jobs'] })
      toast.success('ריצה תקועה אופסה – אפשר להריץ שוב')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'שגיאה באיפוס')
    },
  })

  const removeFromScheduleMutation = useMutation({
    mutationFn: async (slug: string) => {
      await api.post('/auto-page/schedule/remove', { slug })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auto-page-jobs'] })
      toast.success('הוסר מהתור')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'שגיאה בהסרה מהתור')
    },
  })

  const seedCategoriesMutation = useMutation({
    mutationFn: async () => {
      await api.post('/auto-page/seed-categories')
    },
    onSuccess: () => {
      toast.success('קטגוריות נוצרו/עודכנו בהצלחה')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'שגיאה ביצירת קטגוריות')
    },
  })

  const resetTopicsDefaultsMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/auto-page/topics/reset-defaults')
      return res.data as { data?: { count?: number }; message?: string }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['auto-page-topics'] })
      const n = data?.data?.count
      toast.success(
        typeof n === 'number'
          ? `נשמרו ${n} נושאי ברירת מחדל (DoWe)`
          : data?.message || 'רשימת הנושאים עודכנה מברירת המחדל',
      )
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'שגיאה באיפוס נושאים')
    },
  })

  const handleResetTopicsToDefaults = () => {
    const ok = window.confirm(
      'לאשר החלפת רשימת הנושאים לערכי ברירת המחדל של DoWe?\n\n' +
        'פעולה זו דורסת את כל הנושאים שהוגדרו ידנית (כולל מילות מפתח).\n' +
        'דפים שכבר נוצרו לא נמחקים — רק רשימת הטור מתעדכנת.',
    )
    if (ok) resetTopicsDefaultsMutation.mutate()
  }

  const handleToggleEnabled = () => {
    if (!settings) return
    updateSettingsMutation.mutate({ enabled: !settings.enabled })
  }

  useEffect(() => {
    if (settings) {
      setIntervalInput(String(settings.intervalMinutes))
      setIntervalMinInput(settings.intervalMinMinutes != null ? String(settings.intervalMinMinutes) : '')
      setIntervalMaxInput(settings.intervalMaxMinutes != null ? String(settings.intervalMaxMinutes) : '')
    }
  }, [settings?.intervalMinutes, settings?.intervalMinMinutes, settings?.intervalMaxMinutes])

  const handleIntervalBlur = () => {
    const n = Math.max(1, Math.min(1440, parseInt(intervalInput, 10) || 5))
    setIntervalInput(String(n))
    updateSettingsMutation.mutate({ intervalMinutes: n })
  }

  const handleIntervalMinBlur = () => {
    const raw = intervalMinInput.trim()
    if (!raw) {
      updateSettingsMutation.mutate({ intervalMinMinutes: null })
      return
    }
    const n = Math.max(1, Math.min(43200, parseInt(raw, 10) || 1440))
    setIntervalMinInput(String(n))
    updateSettingsMutation.mutate({ intervalMinMinutes: n })
  }

  const handleIntervalMaxBlur = () => {
    const raw = intervalMaxInput.trim()
    if (!raw) {
      updateSettingsMutation.mutate({ intervalMaxMinutes: null })
      return
    }
    const n = Math.max(1, Math.min(43200, parseInt(raw, 10) || 2880))
    setIntervalMaxInput(String(n))
    updateSettingsMutation.mutate({ intervalMaxMinutes: n })
  }

  const handleAddTopic = () => {
    const title = newTitle.trim()
    if (!title) {
      toast.error('יש להזין כותרת')
      return
    }
    const keywords = newKeywords
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    addTopicMutation.mutate({ title, keywords })
  }

  const parseBulkTopics = (text: string): { title: string; keywords: string[] }[] => {
    return text
      .split(/\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        if (line.includes('|')) {
          const [title, rest] = line.split('|').map((s) => s.trim())
          const keywords = rest ? rest.split(',').map((s) => s.trim()).filter(Boolean) : []
          return { title: title || line, keywords }
        }
        return { title: line, keywords: [] }
      })
      .filter((t) => t.title.length > 0)
  }

  const handleAddBulkTopics = () => {
    const topics = parseBulkTopics(bulkTopicsText)
    if (topics.length === 0) {
      toast.error('הזן לפחות שורה אחת (כותרת לכל שורה)')
      return
    }
    if (topics.length > 500) {
      toast.error('עד 500 נושאים בפעם אחת')
      return
    }
    addTopicsBulkMutation.mutate(topics)
  }

  const pendingQueue = topics.filter((t) => !t.hasPage)
  const pendingCount = pendingQueue.length

  if (loadingSettings || settings === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <FilePlus2 className="w-7 h-7" />
        יצירת דפים אוטומטית (AI)
      </h1>

      {/* Seed categories */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FolderPlus className="w-5 h-5" />
          קטגוריות ליצירת דפים
        </h2>
        <p className="text-gray-600 text-sm mb-4">
          יוצר/מעדכן את קטגוריות DoWe (חתונה ואירועים): אישורי הגעה, הושבה, מחירים, מדריכים ועוד. מומלץ לפני שיוך אוטומטי של דפים לקטגוריות.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => seedCategoriesMutation.mutate()}
            disabled={seedCategoriesMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {seedCategoriesMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FolderPlus className="w-4 h-4" />}
            צור/עדכן קטגוריות
          </button>
          <button
            type="button"
            onClick={handleResetTopicsToDefaults}
            disabled={resetTopicsDefaultsMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
            title="מחליף את רשימת הנושאים בערכים מהקונפיג (מילות מפתח SEO לחתונה)"
          >
            {resetTopicsDefaultsMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
            סנכרן נושאים מברירת מחדל (DoWe)
          </button>
        </div>
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3">
          <strong>סנכרון נושאים:</strong> דורס את כל הנושאים בטבלה ומחליף ברשימה המלאה מהשרת (~60 נושאי SEO). השתמש אחרי שדרוג או כדי למלא מחדש את הטור.
        </p>
      </div>

      {/* Settings card */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Settings2 className="w-5 h-5" />
          הגדרות
        </h2>
        <div className="flex flex-wrap items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={handleToggleEnabled}
              className="rounded border-gray-300"
            />
            <span>הפעל יצירת דפים אוטומטית</span>
          </label>
          <div className="flex items-center gap-2">
            <span className="text-gray-600">כל</span>
            <input
              type="number"
              min={1}
              max={1440}
              value={intervalInput}
              onChange={(e) => setIntervalInput(e.target.value)}
              onBlur={handleIntervalBlur}
              className="w-20 rounded border border-gray-300 px-2 py-1 text-center"
            />
            <span className="text-gray-600">דקות</span>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-4 mb-2">תזמון טור (מרווח רנדומלי בין דף לדף):</p>
        <div className="flex flex-wrap items-center gap-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <label className="text-gray-600 text-sm">מינימום (דקות)</label>
            <input
              type="number"
              min={1}
              max={43200}
              placeholder="1440"
              value={intervalMinInput}
              onChange={(e) => setIntervalMinInput(e.target.value)}
              onBlur={handleIntervalMinBlur}
              className="w-24 rounded border border-gray-300 px-2 py-1 text-center"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-gray-600 text-sm">מקסימום (דקות)</label>
            <input
              type="number"
              min={1}
              max={43200}
              placeholder="2880"
              value={intervalMaxInput}
              onChange={(e) => setIntervalMaxInput(e.target.value)}
              onBlur={handleIntervalMaxBlur}
              className="w-24 rounded border border-gray-300 px-2 py-1 text-center"
            />
          </div>
          <span className="text-xs text-gray-500">1440 = יום, 2880 = יומיים. אם מגדירים שניהם – כל דף ייווצר בעיכוב אקראי בטווח.</span>
        </div>
      </div>

      {/* ── לוח אבחון מלא ── */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            סטטוס יצירת דפים
          </h2>
          <button
            type="button"
            onClick={() => refetchJobs()}
            disabled={loadingJobs}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingJobs ? 'animate-spin' : ''}`} />
            רענן
          </button>
        </div>

        {loadingJobs && !jobs ? (
          <div className="flex justify-center py-6"><LoadingSpinner /></div>
        ) : jobsError ? (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex items-center justify-between">
            <p className="text-red-800 font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              שגיאה בטעינת סטטוס הטור
            </p>
            <button type="button" onClick={() => refetchJobs()} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">
              נסה שוב
            </button>
          </div>
        ) : (
          <div className="space-y-5">

            {/* ── Status Bar ── */}
            <StatusBar
              queueRunning={jobs?.queueRunning ?? false}
              currentRun={jobs?.currentRun ?? null}
              history={jobs?.history ?? []}
              pendingCount={pendingCount}
              completedCount={topics.filter(t => t.hasPage).length}
              totalCount={topics.length}
              scheduleCount={jobs?.schedule?.length ?? 0}
            />

            {/* ── ריצה נוכחית ── */}
            <CurrentRunCard
              currentRun={jobs?.currentRun ?? null}
              onReset={() => resetStuckRunMutation.mutate()}
              resetting={resetStuckRunMutation.isPending}
            />

            {/* ── כפתורי הרצה ── */}
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-800">הרצת הטור</div>
                  <div className="text-sm text-gray-500 mt-0.5">
                    {jobs?.queueRunning
                      ? 'הטור פעיל – הדפים נוצרים אחד אחרי השני. רענון דף לא עוצר.'
                      : 'מפעיל דגל ב-DB – השרת יריץ את כל הממתינים לפי לוח הזמנים.'}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {jobs?.queueRunning ? (
                    <button
                      type="button"
                      onClick={() => setQueueRunningMutation.mutate(false)}
                      disabled={setQueueRunningMutation.isPending}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50"
                    >
                      <Square className="w-4 h-4" />
                      עצור טור
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setQueueRunningMutation.mutate(true)}
                      disabled={pendingCount === 0 || setQueueRunningMutation.isPending}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 font-medium"
                    >
                      <ListOrdered className="w-5 h-5" />
                      הרץ את כל הטור
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ── לוח זמנים ── */}
            {jobs?.schedule && jobs.schedule.length > 0 && (
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <div className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  לוח זמנים – {jobs.schedule.length} דפים בתור
                  <span className="text-xs font-normal text-gray-500">
                    (הבא: {new Date(jobs.schedule[0].scheduledAt).toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' })})
                  </span>
                </div>
                <div className="border border-gray-200 rounded-lg overflow-hidden max-h-[300px] overflow-y-auto bg-white">
                  <table className="w-full text-right">
                    <thead className="bg-gray-100 border-b border-gray-200 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-xs font-semibold text-gray-600 w-10">#</th>
                        <th className="px-3 py-2 text-xs font-semibold text-gray-600">נושא</th>
                        <th className="px-3 py-2 text-xs font-semibold text-gray-600 w-40">מתי ייווצר</th>
                        <th className="px-3 py-2 text-xs font-semibold text-gray-600 w-20">כשלונות</th>
                        <th className="px-3 py-2 text-xs font-semibold text-gray-600 w-24">פעולה</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {jobs.schedule.map((item, i) => (
                        <tr key={`${item.slug}-${i}`} className={i === 0 ? 'bg-blue-50/50' : 'hover:bg-gray-50/50'}>
                          <td className="px-3 py-2 text-sm font-medium text-gray-600">{i + 1}</td>
                          <td className="px-3 py-2">
                            <div className="font-medium text-gray-900">{item.title}</div>
                            <div className="text-xs text-gray-400 font-mono">{item.slug}</div>
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">
                            {i === 0 && (
                              <span className="text-xs text-blue-600 font-semibold block">הבא בתור</span>
                            )}
                            {new Date(item.scheduledAt).toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' })}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {(item.failureCount ?? 0) > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                                <AlertTriangle className="w-3 h-3" />
                                {item.failureCount}/3
                              </span>
                            ) : (
                              <span className="text-gray-300 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <button
                              type="button"
                              onClick={() => removeFromScheduleMutation.mutate(item.slug)}
                              disabled={removeFromScheduleMutation.isPending && removeFromScheduleMutation.variables === item.slug}
                              className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-md hover:bg-red-100 disabled:opacity-50"
                            >
                              <Trash2 className="w-3 h-3" />
                              הסר
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── היסטוריית הרצות מלאה ── */}
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                היסטוריית הרצות
                {jobs?.history?.length ? (
                  <span className="text-xs font-normal text-gray-400">(נשמר ב-DB – עמיד בפני אתחולים)</span>
                ) : null}
              </div>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-right">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-600">נושא</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-600 w-28">סטטוס</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-600 w-36">תאריך</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-600 w-28">משך</th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-600">פרטים</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {!jobs?.history?.length ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                          עדיין לא בוצעו הרצות
                        </td>
                      </tr>
                    ) : (
                      jobs.history.map((run) => {
                        const durationSec = run.completedAt && run.startedAt
                          ? Math.round((new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime()) / 1000)
                          : null
                        const isExpanded = expandedErrors[run.id]
                        return (
                          <tr key={run.id} className={run.status === 'failed' ? 'bg-red-50/40 hover:bg-red-50' : 'hover:bg-gray-50/50'}>
                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-900">{run.topicTitle}</div>
                              <div className="text-xs text-gray-400 font-mono">{run.slug}</div>
                            </td>
                            <td className="px-4 py-3">
                              {run.status === 'processing' && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  <Loader2 className="w-3 h-3 animate-spin" />בעבודה
                                </span>
                              )}
                              {run.status === 'completed' && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <CheckCircle className="w-3 h-3" />הושלם
                                </span>
                              )}
                              {run.status === 'failed' && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  <XCircle className="w-3 h-3" />נכשל
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                              {run.completedAt
                                ? new Date(run.completedAt).toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' })
                                : new Date(run.startedAt).toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' })}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {durationSec !== null
                                ? durationSec < 60
                                  ? `${durationSec}ש׳`
                                  : `${Math.floor(durationSec / 60)}ד׳ ${durationSec % 60}ש׳`
                                : '—'}
                            </td>
                            <td className="px-4 py-3">
                              {run.status === 'completed' && run.pageId && (
                                <Link to={`/pages/${run.pageId}/edit`} className="inline-flex items-center gap-1 text-primary-600 hover:underline text-sm">
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  עריכת דף
                                </Link>
                              )}
                              {run.status === 'failed' && run.error && (
                                <div>
                                  <button
                                    type="button"
                                    onClick={() => toggleError(run.id)}
                                    className="inline-flex items-center gap-1 text-xs text-red-700 font-medium hover:text-red-900"
                                  >
                                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                    {isExpanded ? 'הסתר שגיאה' : 'הצג שגיאה'}
                                  </button>
                                  {isExpanded && (
                                    <pre className="mt-2 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-800 whitespace-pre-wrap break-all max-w-xs">
                                      {run.error}
                                    </pre>
                                  )}
                                </div>
                              )}
                              {run.status !== 'failed' && !run.pageId && '—'}
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── כל הנושאים הממתינים ── */}
            <details className="group">
              <summary className="cursor-pointer text-sm font-semibold text-gray-700 flex items-center gap-2 select-none list-none py-2">
                <LayoutList className="w-4 h-4" />
                כל הנושאים הממתינים ({pendingCount})
                <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden max-h-[300px] overflow-y-auto">
                <table className="w-full text-right">
                  <thead className="bg-gray-100 border-b border-gray-200 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-xs font-semibold text-gray-600 w-12">#</th>
                      <th className="px-3 py-2 text-xs font-semibold text-gray-600">נושא</th>
                      <th className="px-3 py-2 text-xs font-semibold text-gray-600 w-48">slug</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pendingQueue.length === 0 ? (
                      <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">כל הנושאים כבר קיימים כדפים</td></tr>
                    ) : (
                      pendingQueue.map((t, i) => (
                        <tr key={t.id} className={i === 0 && !jobs?.currentRun ? 'bg-primary-50' : 'hover:bg-gray-50/50'}>
                          <td className="px-3 py-2 text-sm font-medium text-gray-500">{i + 1}</td>
                          <td className="px-3 py-2">
                            <div className="font-medium text-gray-900">{t.title}</div>
                            {i === 0 && !jobs?.currentRun && <span className="text-xs text-primary-600 font-medium">הבא בתור</span>}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-400 font-mono">{t.slug}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </details>

          </div>
        )}
      </div>

      {/* Topics list */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <ListTodo className="w-5 h-5" />
          נושאים ליצירת דפים
        </h2>

        {/* הוספת רשימת נושאים (מילות מפתח SEO / נושאים לדפי נחיתה) */}
        <div className="mb-6 p-4 bg-green-50/70 border border-green-200 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">הוספת רשימת נושאים</h3>
          <p className="text-sm text-gray-600 mb-3">
            שורה אחת = נושא אחד לדף נפרד. אופציונלי: <code className="bg-white px-1 rounded">כותרת | מילה1, מילה2</code> למילות מפתח.
          </p>
          <textarea
            value={bulkTopicsText}
            onChange={(e) => setBulkTopicsText(e.target.value)}
            placeholder={'אישורי הגעה לחתונה מחיר | אישור הגעה, מחיר, RSVP\nסידור הושבה לחתונה | הושבה, אולם, שולחנות\nמערכת לניהול חתונה | DoWe, רשימת מוזמנים\n...'}
            rows={6}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm font-mono"
          />
          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={handleAddBulkTopics}
              disabled={addTopicsBulkMutation.isPending || !bulkTopicsText.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {addTopicsBulkMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ListTodo className="w-4 h-4" />}
              הוסף את כל הנושאים ({parseBulkTopics(bulkTopicsText).length})
            </button>
            <span className="text-xs text-gray-500">עד 500 נושאים בפעם אחת</span>
          </div>
        </div>

        {/* Add topic form */}
        <div className="flex flex-wrap gap-3 mb-6 p-4 bg-gray-50 rounded-lg">
          <input
            type="text"
            placeholder="כותרת הנושא"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="flex-1 min-w-[200px] rounded border border-gray-300 px-3 py-2"
          />
          <input
            type="text"
            placeholder="מילות מפתח (מופרדות בפסיק)"
            value={newKeywords}
            onChange={(e) => setNewKeywords(e.target.value)}
            className="flex-1 min-w-[200px] rounded border border-gray-300 px-3 py-2"
          />
          <button
            type="button"
            onClick={handleAddTopic}
            disabled={addTopicMutation.isPending}
            className="inline-flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            הוסף נושא
          </button>
        </div>

        {loadingTopics ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : (
          <ul className="space-y-2">
            {topics.length === 0 ? (
              <li className="text-gray-500 py-4">אין נושאים. הוסף נושא למעלה.</li>
            ) : (
              topics.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-4 py-2 px-3 rounded-lg hover:bg-gray-50"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-gray-900">{t.title}</span>
                    {t.keywords.length > 0 && (
                      <span className="text-gray-500 text-sm mr-2">
                        {' '}
                        ({t.keywords.join(', ')})
                      </span>
                    )}
                    {t.hasPage && (
                      <span className="inline-block mr-2 px-2 py-0.5 text-xs rounded bg-green-100 text-green-800">
                        קיים דף
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteTopicMutation.mutate(t.id)}
                    disabled={deleteTopicMutation.isPending}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                    title="הסר נושא"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </div>
  )
}
