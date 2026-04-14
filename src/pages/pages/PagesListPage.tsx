import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  FileText,
  Home,
  FolderTree,
  PenTool,
  Sidebar,
  ExternalLink,
  X,
  Link2,
  Clock,
  Brain,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '@/services/api'
import { Page, PageType } from '@/types'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { invalidatePageCache } from '@/services/pageCache'
import { PUBLIC_SITE_URL } from '@/config/site'

const pageTypeIcons: Record<PageType, any> = {
  home: Home,
  page: FileText,
  category: FolderTree,
  post: PenTool,
}

export default function PagesListPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<PageType | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [previewPage, setPreviewPage] = useState<Page | null>(null)
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null)
  const queryClient = useQueryClient()

  // Fetch categories for filter
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/categories')
      return response.data.data || []
    },
  })

  const { data: pagesData, isLoading } = useQuery({
    queryKey: ['pages', { search: searchTerm, type: filterType, status: filterStatus, category: filterCategory }],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append('limit', '1000') // משוך את כל הדפים
      if (searchTerm) params.append('search', searchTerm)
      if (filterType !== 'all') params.append('type', filterType)
      if (filterStatus === 'published') params.append('isPublished', 'true')
      if (filterStatus === 'draft') params.append('isPublished', 'false')
      if (filterCategory !== 'all') params.append('categoryId', filterCategory)
      
      console.log('📄 Loading all pages with params:', params.toString())
      const response = await api.get(`/pages?${params}`)
      console.log('📄 Loaded pages count:', response.data.data?.length || 0)
      return response.data
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/pages/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages'] })
      invalidatePageCache() // Invalidate autocomplete cache
      toast.success('הדף נמחק בהצלחה')
    },
    onError: () => {
      toast.error('אירעה שגיאה במחיקת הדף')
    },
  })

  const togglePublishMutation = useMutation({
    mutationFn: async (page: Page) => {
      await api.patch(`/pages/${page.id}/toggle-publish`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages'] })
      invalidatePageCache() // Invalidate autocomplete cache
      toast.success('סטטוס הדף עודכן בהצלחה')
    },
    onError: () => {
      toast.error('אירעה שגיאה בעדכון סטטוס הדף')
    },
  })

  const duplicateMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/pages/${id}/duplicate`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages'] })
      invalidatePageCache() // Invalidate autocomplete cache
      toast.success('הדף שוכפל בהצלחה')
    },
    onError: () => {
      toast.error('אירעה שגיאה בשכפול הדף')
    },
  })

  // Auto-link all pages mutation
  const autoLinkAllMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/pages/auto-link-all')
      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pages'] })
      invalidatePageCache() // Invalidate autocomplete cache
      toast.success(`✅ עובד ${data.data.processed} דפים, עודכן ${data.data.updated} דפים`)
    },
    onError: (error: any) => {
      toast.error('שגיאה בהוספת קישורים: ' + (error.response?.data?.message || error.message))
    },
  })

  const handleDelete = (page: Page) => {
    if (window.confirm(`האם אתה בטוח שברצונך למחוק את הדף "${page.title}"?`)) {
      deleteMutation.mutate(page.id)
    }
  }

  const pages = pagesData?.data || []
  const categories = categoriesData || []

  // Enhanced search - filter pages client-side for better UX
  const filteredPages = useMemo(() => {
    let filtered = pages

    // Client-side search for better performance
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter((page: Page) =>
        page.title.toLowerCase().includes(term) ||
        page.slug.toLowerCase().includes(term) ||
        (page.meta_title && page.meta_title.toLowerCase().includes(term)) ||
        (page.meta_description && page.meta_description.toLowerCase().includes(term)) ||
        (page.category?.name && page.category.name.toLowerCase().includes(term))
      )
    }

    return filtered
  }, [pages, searchTerm])

  const getPreviewUrl = (page: Page) => {
    if (page.slug === 'home' || page.type === 'home') {
      return `${PUBLIC_SITE_URL}/`
    }
    return `${PUBLIC_SITE_URL}/${page.slug}`
  }

  const handlePreviewButtonHover = (page: Page) => {
    // Clear any existing timeout
    if (hoverTimeout) {
      clearTimeout(hoverTimeout)
    }
    
    // Set a timeout to open preview after 1 second of hovering
    const timeout = setTimeout(() => {
      setPreviewPage(page)
    }, 1000)
    
    setHoverTimeout(timeout)
  }

  const handlePreviewButtonLeave = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout)
      setHoverTimeout(null)
    }
  }

  const closePreview = () => {
    setPreviewPage(null)
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout)
      }
    }
  }, [hoverTimeout])

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            ניהול דפים
            {!isLoading && (
              <span className="text-lg font-normal text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                {filteredPages.length} מתוך {pages.length} דפים
              </span>
            )}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            ניהול דפי האתר, דפי תוכן וקטגוריות
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              if (window.confirm('האם אתה בטוח שברצונך להוסיף קישורים אוטומטית לכל הדפים הקיימים? זה עלול לקחת כמה דקות.')) {
                autoLinkAllMutation.mutate()
              }
            }}
            disabled={autoLinkAllMutation.isPending}
            className="btn btn-outline btn-md flex items-center gap-2"
            title="הוסף קישורים אוטומטית לכל הדפים הקיימים"
          >
            <Link2 className="h-4 w-4" />
            {autoLinkAllMutation.isPending ? 'מעבד...' : 'הוסף קישורים אוטומטית'}
          </button>
          <Link
            to="/pages/new"
            className="btn btn-primary btn-md"
          >
            <Plus className="ml-2 h-4 w-4" />
            דף חדש
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="relative">
            <input
              type="text"
              placeholder="חיפוש לפי כותרת, URL, תיאור או קטגוריה..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input pr-10"
            />
            <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>
        
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as PageType | 'all')}
          className="form-input"
        >
          <option value="all">כל הסוגים</option>
          <option value="home">דף בית</option>
          <option value="page">דף תוכן</option>
          <option value="category">דף קטגוריה</option>
        </select>
        
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="form-input"
        >
          <option value="all">כל הקטגוריות</option>
          {categories.map((cat: any) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as 'all' | 'published' | 'draft')}
          className="form-input"
        >
          <option value="all">כל הסטטוסים</option>
          <option value="published">מפורסמים</option>
          <option value="draft">טיוטות</option>
        </select>
      </div>

      {/* Pages Table */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredPages.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">אין דפים</h3>
          <p className="mt-1 text-sm text-gray-500">
            התחל ביצירת הדף הראשון שלך
          </p>
          <div className="mt-6">
            <Link
              to="/pages/new"
              className="btn btn-primary btn-sm"
            >
              <Plus className="ml-2 h-4 w-4" />
              צור דף חדש
            </Link>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  כותרת
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  סוג
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  סטטוס
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  עודכן
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  קישורים
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  עיבוד AI אחרון
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">פעולות</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredPages.map((page: Page) => {
                const Icon = pageTypeIcons[page.type] || FileText
                return (
                  <tr 
                    key={page.id} 
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Icon className="ml-3 h-5 w-5 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {page.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            /{page.slug}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {page.type === 'home' && 'דף בית'}
                        {page.type === 'page' && 'דף תוכן'}
                        {page.type === 'category' && 'דף קטגוריה'}
                        {page.type === 'post' && 'פוסט'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {page.is_published ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">מפורסם</span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">טיוטה</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(page.updated_at).toLocaleDateString('he-IL')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {(page as any).linkCount !== undefined ? (
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            (page as any).linkCount === 0 
                              ? 'bg-red-100 text-red-800' 
                              : (page as any).linkCount < 3 
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            <Link2 className="h-3 w-3" />
                            {(page as any).linkCount || 0}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {page.last_ai_processed_at ? (
                        <div className="flex items-center gap-2">
                          <Brain className="h-4 w-4 text-purple-500" />
                          <span className="text-gray-700">
                            {new Date(page.last_ai_processed_at).toLocaleString('he-IL', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          לא עובד
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setPreviewPage(page)
                          }}
                          onMouseEnter={() => handlePreviewButtonHover(page)}
                          onMouseLeave={handlePreviewButtonLeave}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          title="תצוגה מקדימה באתר - עמד על הכפתור כדי לראות תצוגה מקדימה"
                        >
                          <ExternalLink className="h-4 w-4" />
                          תצוגה מקדימה
                        </button>
                        <Link
                          to={`/pages/${page.id}/edit`}
                          className="text-primary-600 hover:text-primary-900"
                          title="עריכה"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <Link
                          to={`/pages/${page.id}/sidebar`}
                          className="text-blue-600 hover:text-blue-900"
                          title="ניהול סיידבר"
                        >
                          <Sidebar className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => togglePublishMutation.mutate(page)}
                          className="text-gray-600 hover:text-gray-900"
                          title={page.is_published ? 'הסתר' : 'פרסם'}
                        >
                          {page.is_published ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => duplicateMutation.mutate(page.id)}
                          className="text-gray-600 hover:text-gray-900"
                          title="שכפל"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(page)}
                          className="text-red-600 hover:text-red-900"
                          title="מחק"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Preview Modal */}
      {previewPage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75" onClick={closePreview}>
          <div className="relative w-full h-full max-w-7xl max-h-[90vh] m-4 bg-white rounded-lg shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">תצוגה מקדימה: {previewPage.title}</h2>
                <p className="text-sm text-gray-500">{getPreviewUrl(previewPage)}</p>
              </div>
              <button
                onClick={closePreview}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="סגור"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Preview iframe */}
            <div className="h-[calc(90vh-80px)] overflow-auto bg-gray-200">
              <iframe
                src={getPreviewUrl(previewPage)}
                className="w-full h-full min-h-[600px] border-0"
                title="תצוגה מקדימה"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
