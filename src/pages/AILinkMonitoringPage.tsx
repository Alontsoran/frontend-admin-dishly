import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { 
  Brain, 
  Play, 
  Square, 
  RefreshCw, 
  Trash2, 
  RotateCcw,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Activity
} from 'lucide-react'
import { api } from '@/services/api'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

interface LinkDetail {
  keyword: string
  targetPageId: string
  targetPageSlug: string
  targetPageTitle: string
}

interface ProcessingJob {
  pageId: string
  pageTitle: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  startedAt: string
  completedAt?: string
  linksAdded?: number
  linksDetails?: LinkDetail[]
  error?: string
}

interface WorkerState {
  isRunning: boolean
  currentJobs: ProcessingJob[]
  completedJobs: ProcessingJob[]
  stats: {
    totalProcessed: number
    totalUpdated: number
    totalErrors: number
    lastRun?: string
  }
}

export default function AILinkMonitoringPage() {
  const queryClient = useQueryClient()
  
  const { data: state, isLoading, refetch } = useQuery<WorkerState>({
    queryKey: ['ai-worker-state'],
    queryFn: async () => {
      const response = await api.get('/pages/ai-worker/state')
      return response.data.data
    },
    refetchInterval: 3000, // Refresh every 3 seconds
  })

  const controlMutation = useMutation({
    mutationFn: async (action: string) => {
      const response = await api.post('/pages/ai-worker/control', { action })
      return response.data
    },
    onSuccess: (_data, action) => {
      queryClient.invalidateQueries({ queryKey: ['ai-worker-state'] })
      toast.success(`✅ ${action === 'start' ? 'Worker started' : action === 'stop' ? 'Worker stopped' : 'Action completed'}`)
    },
    onError: (error: any) => {
      toast.error('שגיאה: ' + (error.response?.data?.message || error.message))
    },
  })

  const processSingleMutation = useMutation({
    mutationFn: async ({ pageId, forceReprocess }: { pageId: string; forceReprocess?: boolean }) => {
      const url = `/pages/ai-worker/process/${pageId}${forceReprocess ? '?forceReprocess=true' : ''}`
      const response = await api.post(url)
      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ai-worker-state'] })
      queryClient.invalidateQueries({ queryKey: ['pages'] })
      toast.success(`✅ ${data.data.linksAdded || 0} links added`)
    },
    onError: (error: any) => {
      toast.error('שגיאה: ' + (error.response?.data?.message || error.message))
    },
  })

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString('he-IL')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="badge badge-success">הושלם</span>
      case 'processing':
        return <span className="badge badge-warning animate-pulse">מעבד</span>
      case 'pending':
        return <span className="badge badge-info">ממתין</span>
      case 'failed':
        return <span className="badge badge-error">נכשל</span>
      default:
        return <span className="badge">{status}</span>
    }
  }

  if (isLoading && !state) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!state) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-800">שגיאה בטעינת מצב ה-worker</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/pages" className="btn btn-ghost btn-sm">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Brain className="h-6 w-6 text-purple-600" />
              מוניטורינג AI Link Worker
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              מעקב ושליטה על עיבוד קישורים אוטומטיים עם AI
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => refetch()}
            className="btn btn-outline btn-sm"
          >
            <RefreshCw className="h-4 w-4 ml-2" />
            רענן
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">סטטוס Worker</p>
              <p className="text-xl font-bold mt-1">
                {state.isRunning ? (
                  <span className="text-green-600 flex items-center gap-2">
                    <Activity className="h-5 w-5 animate-pulse" />
                    פעיל
                  </span>
                ) : (
                  <span className="text-gray-400">מושבת</span>
                )}
              </p>
            </div>
            <Brain className={`h-8 w-8 ${state.isRunning ? 'text-green-500' : 'text-gray-400'}`} />
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">סה"כ עובד</p>
              <p className="text-2xl font-bold text-gray-900">{state.stats.totalProcessed}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">עודכן</p>
              <p className="text-2xl font-bold text-green-600">{state.stats.totalUpdated}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">שגיאות</p>
              <p className="text-2xl font-bold text-red-600">{state.stats.totalErrors}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-lg font-semibold mb-4">לוח בקרה</h2>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => controlMutation.mutate('start')}
            disabled={state.isRunning || controlMutation.isPending}
            className="btn btn-success btn-sm flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            הפעל Worker
          </button>
          <button
            onClick={() => controlMutation.mutate('stop')}
            disabled={!state.isRunning || controlMutation.isPending}
            className="btn btn-error btn-sm flex items-center gap-2"
          >
            <Square className="h-4 w-4" />
            עצור Worker
          </button>
          <button
            onClick={() => {
              if (window.confirm('האם אתה בטוח שברצונך לנקות את רשימת העבודות שהושלמו?')) {
                controlMutation.mutate('clear-completed')
              }
            }}
            disabled={controlMutation.isPending}
            className="btn btn-outline btn-sm flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            נקה הושלמו
          </button>
          <button
            onClick={() => {
              if (window.confirm('האם אתה בטוח שברצונך לאפס את הסטטיסטיקות?')) {
                controlMutation.mutate('reset-stats')
              }
            }}
            disabled={controlMutation.isPending}
            className="btn btn-outline btn-sm flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            אפס סטטיסטיקות
          </button>
        </div>
        {state.stats.lastRun && (
          <p className="text-sm text-gray-500 mt-3">
            <Clock className="h-4 w-4 inline ml-1" />
            ריצה אחרונה: {formatDate(state.stats.lastRun)}
          </p>
        )}
      </div>

      {/* Current Jobs */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-white overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              עבודות פעילות ({state.currentJobs.length})
            </h2>
            <div className="text-sm text-gray-500">
              ממתינים: {state.currentJobs.filter(j => j.status === 'pending').length} | 
              מעבד: {state.currentJobs.filter(j => j.status === 'processing').length}
            </div>
          </div>
        </div>
        <div className="p-6">
          {state.currentJobs.length === 0 ? (
            <p className="text-gray-500 text-center py-8">אין עבודות פעילות כרגע</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">דף</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">סטטוס</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">התחיל</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">פעולות</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {state.currentJobs.map((job) => (
                    <tr key={job.pageId} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Link
                          to={`/pages/${job.pageId}/edit`}
                          className="text-sm font-medium text-blue-600 hover:underline"
                        >
                          {job.pageTitle}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(job.status)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatDate(job.startedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => processSingleMutation.mutate({ pageId: job.pageId, forceReprocess: true })}
                          disabled={processSingleMutation.isPending}
                          className="btn btn-ghost btn-xs"
                          title="עבד מחדש (force reprocess)"
                        >
                          <RefreshCw className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Completed Jobs */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">
            עבודות שהושלמו ({state.completedJobs.length})
          </h2>
        </div>
        <div className="p-6">
          {state.completedJobs.length === 0 ? (
            <p className="text-gray-500 text-center py-8">אין עבודות שהושלמו</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">דף</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">סטטוס</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">קישורים</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">פרטי קישורים</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">התחיל</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">הושלם</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">פעולות</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {state.completedJobs.slice(0, 50).map((job) => (
                    <tr key={`${job.pageId}-${job.startedAt}`} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Link
                          to={`/pages/${job.pageId}/edit`}
                          className="text-sm font-medium text-blue-600 hover:underline"
                        >
                          {job.pageTitle}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(job.status)}</td>
                      <td className="px-4 py-3">
                        {job.linksAdded !== undefined ? (
                          <span className="text-sm font-medium text-green-600">
                            {job.linksAdded}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {job.linksDetails && job.linksDetails.length > 0 ? (
                          <div className="space-y-1 max-w-md">
                            {job.linksDetails.map((link, idx) => (
                              <div key={idx} className="text-xs bg-blue-50 p-2 rounded border border-blue-200">
                                <span className="font-semibold text-blue-700">"{link.keyword}"</span>
                                <span className="text-gray-500 mx-1">→</span>
                                <Link
                                  to={`/pages/${link.targetPageId}/edit`}
                                  className="text-blue-600 hover:underline"
                                  target="_blank"
                                >
                                  {link.targetPageTitle}
                                </Link>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">אין קישורים</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatDate(job.startedAt)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatDate(job.completedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => processSingleMutation.mutate({ pageId: job.pageId, forceReprocess: true })}
                            disabled={processSingleMutation.isPending}
                            className="btn btn-ghost btn-xs"
                            title="עבד מחדש (force reprocess)"
                          >
                            <RefreshCw className="h-3 w-3" />
                          </button>
                          {job.error && (
                            <span className="text-xs text-red-600" title={job.error}>
                              ⚠️
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

