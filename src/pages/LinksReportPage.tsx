import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Link2, ExternalLink, FileText, ArrowLeft, RefreshCw, Brain, Trash2, X } from 'lucide-react'
import { api } from '@/services/api'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import toast from 'react-hot-toast'
import { invalidatePageCache } from '@/services/pageCache'

interface LinkInfo {
  keyword: string
  href: string
  isInternal: boolean
  targetPageId: string | null
  targetPageTitle: string | null
  targetPageSlug: string | null
  componentPath: string
  componentType: string
}

interface PageReport {
  pageId: string
  pageTitle: string
  pageSlug: string
  totalLinks: number
  links: LinkInfo[]
}

interface LinksReportData {
  totalPages: number
  pagesWithLinks: number
  totalLinks: number
  pages: PageReport[]
}

export default function LinksReportPage() {
  const queryClient = useQueryClient()
  
  const { data, isLoading, error, refetch } = useQuery<LinksReportData>({
    queryKey: ['links-report'],
    queryFn: async () => {
      const response = await api.get('/pages/reports/links')
      return response.data.data
    },
    retry: 1,
  })

  // Auto-link all pages mutation (old algorithm)
  const autoLinkAllMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/pages/auto-link-all')
      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pages'] })
      queryClient.invalidateQueries({ queryKey: ['links-report'] })
      invalidatePageCache() // Invalidate autocomplete cache
      toast.success(`✅ נוספו ${data.data.queued || data.data.processed || 0} דפים לתור. העיבוד יתחיל אוטומטית.`)
      // Refresh the report after a short delay
      setTimeout(() => {
        refetch()
      }, 1000)
    },
    onError: (error: any) => {
      toast.error('שגיאה בהוספת קישורים: ' + (error.response?.data?.message || error.message))
    },
  })

  // AI-powered auto-link mutation
  const aiProcessMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/pages/ai-process-all')
      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pages'] })
      queryClient.invalidateQueries({ queryKey: ['links-report'] })
      invalidatePageCache()
      toast.success(`🤖 AI עובד ${data.data.processed} דפים, עודכן ${data.data.updated} דפים`)
      setTimeout(() => {
        refetch()
      }, 2000) // Longer delay for AI processing
    },
    onError: (error: any) => {
      toast.error('שגיאה בעיבוד AI: ' + (error.response?.data?.message || error.message))
    },
  })

  // Remove ALL auto-generated links mutation
  const removeAllLinksMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/pages/remove-all-auto-links-all')
      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pages'] })
      queryClient.invalidateQueries({ queryKey: ['links-report'] })
      invalidatePageCache()
      toast.success(`🗑️ הוסרו ${data.data.totalLinksRemoved || 0} קישורים מ-${data.data.pagesUpdated || 0} דפים`)
      setTimeout(() => {
        refetch()
      }, 1000)
    },
    onError: (error: any) => {
      toast.error('שגיאה בהסרת קישורים: ' + (error.response?.data?.message || error.message))
    },
  })

  // Remove duplicate links mutation
  const removeDuplicatesMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/pages/remove-duplicate-links-all')
      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pages'] })
      queryClient.invalidateQueries({ queryKey: ['links-report'] })
      invalidatePageCache()
      toast.success(`✅ הוסרו ${data.data.totalLinksRemoved || 0} קישורים כפולים מ-${data.data.pagesUpdated || 0} דפים`)
      setTimeout(() => {
        refetch()
      }, 1000)
    },
    onError: (error: any) => {
      toast.error('שגיאה בהסרת כפילויות: ' + (error.response?.data?.message || error.message))
    },
  })

  // Remove single-word links mutation
  const removeSingleWordLinksMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/pages/remove-single-word-links-all')
      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pages'] })
      queryClient.invalidateQueries({ queryKey: ['links-report'] })
      invalidatePageCache()
      toast.success(`✅ הוסרו ${data.data.totalLinksRemoved || 0} קישורים עם מילה אחת מ-${data.data.pagesUpdated || 0} דפים`)
      setTimeout(() => {
        refetch()
      }, 1000)
    },
    onError: (error: any) => {
      toast.error('שגיאה בהסרת קישורים עם מילה אחת: ' + (error.response?.data?.message || error.message))
    },
  })

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-800">שגיאה בטעינת הדיווח: {(error as any).message}</p>
          <button
            onClick={() => refetch()}
            className="mt-2 btn btn-outline btn-sm"
          >
            נסה שוב
          </button>
        </div>
      </div>
    )
  }

  if (!data || data.pages.length === 0) {
    return (
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/pages" className="btn btn-ghost btn-sm">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">דיווח קישורים</h1>
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <Link2 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">אין קישורים</h3>
          <p className="mt-1 text-sm text-gray-500">
            לא נמצאו קישורים בדפים הקיימים
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/pages" className="btn btn-ghost btn-sm">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">דיווח קישורים</h1>
            <p className="text-sm text-gray-500 mt-1">
              סטטיסטיקות מפורטות על כל הקישורים בכל הדפים
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              if (window.confirm('🤖 האם אתה בטוח שברצונך לעבד את כל הדפים עם AI? זה עלול לקחת כמה דקות אבל יהיה הרבה יותר חכם (מזהה גם חצי מילים וביטויים).')) {
                aiProcessMutation.mutate()
              }
            }}
            disabled={aiProcessMutation.isPending || autoLinkAllMutation.isPending}
            className="btn btn-primary btn-sm flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
            title="עיבוד AI - מזהה גם חצי מילים וביטויים"
          >
            <Brain className={`h-4 w-4 ${aiProcessMutation.isPending ? 'animate-pulse' : ''}`} />
            {aiProcessMutation.isPending ? 'AI מעבד...' : '🤖 עיבוד AI'}
          </button>
          <button
            onClick={() => {
              if (window.confirm('האם אתה בטוח שברצונך להוסיף קישורים אוטומטית לכל הדפים הקיימים? זה עלול לקחת כמה דקות.')) {
                autoLinkAllMutation.mutate()
              }
            }}
            disabled={autoLinkAllMutation.isPending || aiProcessMutation.isPending}
            className="btn btn-outline btn-sm flex items-center gap-2"
            title="הוסף קישורים אוטומטית (אלגוריתם רגיל)"
          >
            <RefreshCw className={`h-4 w-4 ${autoLinkAllMutation.isPending ? 'animate-spin' : ''}`} />
            {autoLinkAllMutation.isPending ? 'מעבד...' : 'הרץ מחדש - הוסף קישורים'}
          </button>
          <button
            onClick={() => refetch()}
            className="btn btn-outline btn-sm"
            disabled={aiProcessMutation.isPending || autoLinkAllMutation.isPending}
          >
            רענן דיווח
          </button>
        </div>

        {/* Cleanup Actions */}
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <span className="text-sm font-semibold text-yellow-800">🧹 פעולות ניקוי:</span>
          <button
            onClick={() => {
              if (window.confirm('⚠️ האם אתה בטוח שברצונך להסיר את כל הקישורים האוטומטיים מכל הדפים?\n\nפעולה זו תסיר את כל הקישורים שהוספה המערכת האוטומטית.')) {
                removeAllLinksMutation.mutate()
              }
            }}
            disabled={removeAllLinksMutation.isPending || removeDuplicatesMutation.isPending || aiProcessMutation.isPending || autoLinkAllMutation.isPending}
            className="btn btn-error btn-sm flex items-center gap-2"
            title="הסר את כל הקישורים האוטומטיים מכל הדפים"
          >
            <Trash2 className={`h-4 w-4 ${removeAllLinksMutation.isPending ? 'animate-spin' : ''}`} />
            {removeAllLinksMutation.isPending ? 'מסיר...' : 'הסר כל הקישורים'}
          </button>
          <button
            onClick={() => {
              if (window.confirm('האם אתה בטוח שברצונך להסיר קישורים כפולים מכל הדפים?\n\nפעולה זו תשאיר רק קישור אחד לכל מילת מפתח/יעד.')) {
                removeDuplicatesMutation.mutate()
              }
            }}
            disabled={removeAllLinksMutation.isPending || removeDuplicatesMutation.isPending || removeSingleWordLinksMutation.isPending || aiProcessMutation.isPending || autoLinkAllMutation.isPending}
            className="btn btn-warning btn-sm flex items-center gap-2"
            title="הסר קישורים כפולים - השאר רק קישור אחד לכל מילת מפתח"
          >
            <X className={`h-4 w-4 ${removeDuplicatesMutation.isPending ? 'animate-spin' : ''}`} />
            {removeDuplicatesMutation.isPending ? 'מסיר כפילויות...' : 'הסר כפילויות'}
          </button>
          <button
            onClick={() => {
              if (window.confirm('האם אתה בטוח שברצונך להסיר את כל הקישורים עם מילה אחת מכל הדפים?\n\nפעולה זו תסיר את כל הקישורים עם מילה אחת ותשאיר רק קישורים עם 2+ מילים.\n\nלאחר מכן תוכל להריץ מחדש את ה-AI כדי ליצור קישורים עם ביטויים של 2+ מילים בלבד.')) {
                removeSingleWordLinksMutation.mutate()
              }
            }}
            disabled={removeAllLinksMutation.isPending || removeDuplicatesMutation.isPending || removeSingleWordLinksMutation.isPending || aiProcessMutation.isPending || autoLinkAllMutation.isPending}
            className="btn btn-warning btn-sm flex items-center gap-2"
            title="הסר קישורים עם מילה אחת - השאר רק קישורים עם 2+ מילים"
          >
            <X className={`h-4 w-4 ${removeSingleWordLinksMutation.isPending ? 'animate-spin' : ''}`} />
            {removeSingleWordLinksMutation.isPending ? 'מסיר קישורים עם מילה אחת...' : 'הסר קישורים עם מילה אחת'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">סה"כ דפים</p>
              <p className="text-2xl font-bold text-gray-900">{data.totalPages}</p>
            </div>
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">דפים עם קישורים</p>
              <p className="text-2xl font-bold text-gray-900">{data.pagesWithLinks}</p>
            </div>
            <Link2 className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">סה"כ קישורים</p>
              <p className="text-2xl font-bold text-gray-900">{data.totalLinks}</p>
            </div>
            <ExternalLink className="h-8 w-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Pages List */}
      <div className="space-y-4">
        {data.pages.map((page) => (
          <div
            key={page.pageId}
            className="rounded-lg border border-gray-200 bg-white overflow-hidden"
          >
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{page.pageTitle}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    /{page.pageSlug} • {page.totalLinks} קישורים
                  </p>
                </div>
                <Link
                  to={`/pages/${page.pageId}/edit`}
                  className="btn btn-outline btn-sm"
                >
                  <FileText className="h-4 w-4 ml-2" />
                  ערוך דף
                </Link>
              </div>
            </div>
            <div className="px-6 py-4">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        מילת מפתח
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        קישור
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        דף יעד
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        מיקום בקומפוננטה
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {page.links.map((link, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">
                            "{link.keyword}"
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {link.isInternal ? (
                              <Link2 className="h-4 w-4 text-blue-500" />
                            ) : (
                              <ExternalLink className="h-4 w-4 text-gray-400" />
                            )}
                            <a
                              href={link.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline"
                            >
                              {link.href}
                            </a>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {link.isInternal && link.targetPageTitle ? (
                            <Link
                              to={`/pages/${link.targetPageId}/edit`}
                              className="text-sm text-blue-600 hover:underline"
                            >
                              {link.targetPageTitle}
                            </Link>
                          ) : (
                            <span className="text-sm text-gray-500">
                              {link.isInternal ? 'דף לא נמצא' : 'קישור חיצוני'}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-gray-500 font-mono">
                            {link.componentPath}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

