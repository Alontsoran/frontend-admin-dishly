import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'
import { Eye, EyeOff, ExternalLink, Edit2, RefreshCw } from 'lucide-react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useState } from 'react'

interface OfflineComponent {
  componentId: string
  componentType: string
  pageId: string
  pageTitle: string
  pageSlug: string
  props: Record<string, any>
}

export default function OfflineComponentsReport() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activatingId, setActivatingId] = useState<string | null>(null)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['offline-components'],
    queryFn: async () => {
      const response = await api.get('/pages/reports/offline-components')
      return response.data
    },
  })

  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({ pageId, componentId, isVisible }: { pageId: string; componentId: string; isVisible: boolean }) => {
      const response = await api.patch(`/pages/${pageId}/components/${componentId}/visibility`, { isVisible })
      return response.data
    },
    onSuccess: () => {
      toast.success('✅ הקומפוננטה הופעלה בהצלחה!')
      queryClient.invalidateQueries({ queryKey: ['offline-components'] })
      queryClient.invalidateQueries({ queryKey: ['page'] })
    },
    onError: (error: any) => {
      toast.error(`❌ שגיאה: ${error.response?.data?.error || error.message}`)
    },
    onSettled: () => {
      setActivatingId(null)
    },
  })

  const offlineComponents: OfflineComponent[] = data?.data || []
  const count = data?.count || 0

  const handleActivate = async (component: OfflineComponent) => {
    setActivatingId(component.componentId)
    toggleVisibilityMutation.mutate({
      pageId: component.pageId,
      componentId: component.componentId,
      isVisible: true,
    })
  }

  const handleEdit = (component: OfflineComponent) => {
    navigate(`/pages/${component.pageId}/edit`)
  }

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">שגיאה בטעינת הדוח: {error instanceof Error ? error.message : 'שגיאה לא ידועה'}</p>
          <button
            onClick={() => refetch()}
            className="mt-4 btn btn-outline btn-sm"
          >
            נסה שוב
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">דוח קומפוננטות אופליין</h1>
          <p className="text-gray-600">
            רשימת כל הקומפוננטות שהוסתרו ולא מוצגות באתר
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="btn btn-outline btn-sm flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          רענן
        </button>
      </div>

      {/* Summary Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="bg-amber-100 p-4 rounded-lg">
            <EyeOff className="h-8 w-8 text-amber-600" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">{count}</h2>
            <p className="text-gray-600">קומפוננטות אופליין</p>
          </div>
        </div>
      </div>

      {/* Table */}
      {count === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Eye className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">אין קומפוננטות אופליין</h3>
          <p className="text-gray-600">כל הקומפוננטות מוצגות באתר</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    סוג קומפוננטה
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    דף
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    פעולות
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {offlineComponents.map((component) => (
                  <tr key={component.componentId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="bg-amber-100 p-2 rounded">
                          <EyeOff className="h-4 w-4 text-amber-600" />
                        </div>
                        <span className="font-medium text-gray-900">{component.componentType}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{component.pageTitle}</div>
                        <div className="text-sm text-gray-500">/{component.pageSlug}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500 font-mono">{component.componentId}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-left">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleActivate(component)}
                          disabled={activatingId === component.componentId || toggleVisibilityMutation.isPending}
                          className="btn btn-primary btn-sm flex items-center gap-2"
                          title="הפעל קומפוננטה"
                        >
                          {activatingId === component.componentId ? (
                            <>
                              <RefreshCw className="h-4 w-4 animate-spin" />
                              מפעיל...
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4" />
                              הפעל
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleEdit(component)}
                          className="btn btn-outline btn-sm flex items-center gap-2"
                          title="ערוך קומפוננטה"
                        >
                          <Edit2 className="h-4 w-4" />
                          ערוך
                        </button>
                        <button
                          onClick={() => navigate(`/pages/${component.pageId}/edit`)}
                          className="btn btn-ghost btn-sm flex items-center gap-2"
                          title="ערוך דף"
                        >
                          <ExternalLink className="h-4 w-4" />
                          דף
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
