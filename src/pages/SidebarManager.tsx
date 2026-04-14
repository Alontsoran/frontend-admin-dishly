import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Link as LinkIcon,
  Save,
  ArrowLeft,
  Eye,
  EyeOff,
  Copy,
  FileText
} from 'lucide-react'
import toast from 'react-hot-toast'

interface SidebarLink {
  id: string
  page_id?: string
  post_id?: string 
  title: string
  type: 'page' | 'post'
  is_active: boolean
  order_index: number
}

interface SidebarSettings {
  id?: string
  page_id?: string
  show_related_posts: boolean
  show_testimonials: boolean
  show_custom_links: boolean
  is_active?: boolean
  links: SidebarLink[]
}

export default function SidebarManager() {
  const { pageId } = useParams<{ pageId: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copying, setCopying] = useState(false)
  const [pages, setPages] = useState<any[]>([])
  const [posts, setPosts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [otherPageSettings, setOtherPageSettings] = useState<any[]>([])
  const [showCopyModal, setShowCopyModal] = useState(false)
  const [showLinkSelector, setShowLinkSelector] = useState(false)
  const [settings, setSettings] = useState<SidebarSettings>({
    show_related_posts: true,
    show_testimonials: true,
    show_custom_links: true,
    links: []
  })

  useEffect(() => {
    fetchData()
    fetchOtherPagesSettings()
    if (pageId && pageId !== 'default') {
      fetchSidebarSettings()
    } else {
      setLoading(false)
    }
  }, [pageId])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      
      // Fetch pages
      const pagesResponse = await fetch('/api/pages', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (pagesResponse.ok) {
        const pagesData = await pagesResponse.json()
        setPages(pagesData.data || [])
      }

      // Fetch posts
      const postsResponse = await fetch('/api/posts', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (postsResponse.ok) {
        const postsData = await postsResponse.json()
        setPosts(postsData.data || [])
      }

      // Fetch categories
      const categoriesResponse = await fetch('/api/categories', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json()
        setCategories(categoriesData.data || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  const fetchSidebarSettings = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      const url = pageId === 'default' 
        ? '/api/sidebar/page/default'
        : `/api/sidebar/page/${pageId}`
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.data) {
          setSettings(data.data)
        }
      } else if (response.status === 404) {
        // No settings found - use default
        setSettings({
          page_id: pageId === 'default' ? undefined : pageId,
          show_related_posts: true,
          show_testimonials: true,
          show_custom_links: true,
          is_active: true,
          links: []
        })
      }
    } catch (error) {
      console.error('Error fetching sidebar settings:', error)
      // toast.error('שגיאה בטעינת הגדרות הסיידבר') // Don't show error for 404
    } finally {
      setLoading(false)
    }
  }

  const fetchOtherPagesSettings = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/sidebar', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setOtherPageSettings(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching other pages settings:', error)
    }
  }

  const copyFromPage = async (fromPageId: string) => {
    setCopying(true)
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/sidebar/${fromPageId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.data) {
          // Copy settings but remove ID and page_id to create new settings
          const copiedSettings = {
            ...data.data,
            id: undefined,
            page_id: pageId === 'default' ? null : pageId,
            links: data.data.links.map((link: any) => ({
              ...link,
              id: `temp-${Date.now()}-${Math.random()}`
            }))
          }
          setSettings(copiedSettings)
          toast.success('הגדרות הועתקו בהצלחה')
          setShowCopyModal(false)
        }
      } else {
        throw new Error('Failed to copy settings')
      }
    } catch (error) {
      console.error('Error copying settings:', error)
      toast.error('שגיאה בהעתקת הגדרות')
    } finally {
      setCopying(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const token = localStorage.getItem('auth_token')
      const url = pageId === 'default' 
        ? '/api/sidebar/page/default'
        : `/api/sidebar/page/${pageId}`
      const method = settings.id ? 'PUT' : 'POST'

      const payload = {
        page_id: pageId === 'default' ? null : pageId,
        show_related_posts: settings.show_related_posts,
        show_testimonials: settings.show_testimonials,
        show_custom_links: settings.show_custom_links,
        is_active: settings.is_active !== undefined ? settings.is_active : true,
        items: (settings.links || []).map((link, index) => ({
          page_id: link.page_id || null,
          post_id: link.post_id || null,
          title: link.title,
          type: link.type,
          is_active: link.is_active,
          order_index: index
        }))
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const data = await response.json()
        setSettings(data.data)
        toast.success('הגדרות הסיידבר נשמרו בהצלחה')
      } else {
        throw new Error('Failed to save sidebar settings')
      }
    } catch (error) {
      console.error('Error saving sidebar settings:', error)
      toast.error('שגיאה בשמירת הגדרות הסיידבר')
    } finally {
      setSaving(false)
    }
  }

  const addSelectedItem = (item: any, type: 'page' | 'post') => {
    const newLink: SidebarLink = {
      id: `temp-${Date.now()}`,
      page_id: type === 'page' ? item.id : undefined,
      post_id: type === 'post' ? item.id : undefined,
      title: item.title,
      type: type,
      is_active: true,
      order_index: (settings.links || []).length
    }
    setSettings(prev => ({
      ...prev,
      links: [...(prev.links || []), newLink]
    }))
    toast.success(`${type === 'page' ? 'עמוד' : 'פוסט'} נוסף לסיידבר`)
  }

  const updateLink = (index: number, updates: Partial<SidebarLink>) => {
    setSettings(prev => ({
      ...prev,
      links: (prev.links || []).map((link, i) => 
        i === index ? { ...link, ...updates } : link
      )
    }))
  }

  const removeLink = (index: number) => {
    setSettings(prev => ({
      ...prev,
      links: (prev.links || []).filter((_, i) => i !== index)
    }))
  }

  const moveLink = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= (settings.links || []).length) return
    
    setSettings(prev => {
      const newLinks = [...(prev.links || [])]
      const [moved] = newLinks.splice(fromIndex, 1)
      newLinks.splice(toIndex, 0, moved)
      return { ...prev, links: newLinks }
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const currentPage = pages.find(p => p.id === pageId)

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/pages')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
            חזרה לדפים
          </button>
          <div>
            <h1 className="text-2xl font-bold">
              ניהול סיידבר
            </h1>
            <p className="text-gray-600">
              {pageId === 'default' 
                ? 'הגדרות ברירת מחדל לכל הדפים'
                : currentPage 
                  ? `הגדרות עבור: ${currentPage.title}`
                  : 'הגדרות סיידבר'
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCopyModal(true)}
            className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            <Copy className="h-4 w-4" />
            העתק מעמוד אחר
          </button>
          
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? 'שומר...' : 'שמור'}
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {/* General Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">הגדרות כלליות</h2>
          
          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.show_related_posts}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  show_related_posts: e.target.checked 
                }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>הצג פוסטים קשורים</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.show_testimonials}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  show_testimonials: e.target.checked 
                }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>הצג המלצות לקוחות</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.show_custom_links}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  show_custom_links: e.target.checked 
                }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>הצג קישורים מותאמים אישית</span>
            </label>
          </div>
        </div>

        {/* Custom Links */}
        {settings.show_custom_links && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">קישורים מותאמים אישית</h2>
                <button
                  onClick={() => setShowLinkSelector(true)}
                  className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700"
                >
                  <Plus className="h-4 w-4" />
                  הוסף עמוד או פוסט
                </button>
            </div>

            {!settings.links || settings.links.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                אין קישורים מותאמים אישית. לחץ על "הוסף עמוד או פוסט" כדי להתחיל.
              </p>
            ) : (
              <div className="space-y-4">
                {settings.links.map((link, index) => (
                  <div key={link.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                    {/* Drag Handle */}
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => moveLink(index, index - 1)}
                        disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        <GripVertical className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => moveLink(index, index + 1)}
                        disabled={index === (settings.links || []).length - 1}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        <GripVertical className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Title */}
                      <input
                        type="text"
                        placeholder="כותרת התצוגה"
                        value={link.title}
                        onChange={(e) => updateLink(index, { title: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />

                      {/* Content Info */}
                      <div className="px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-600">
                        {link.type === 'page' ? (
                          <span>📄 עמוד: {pages.find(p => p.id === link.page_id)?.title || 'לא נמצא'}</span>
                        ) : (
                          <span>📝 פוסט: {posts.find(p => p.id === link.post_id)?.title || 'לא נמצא'}</span>
                        )}
                      </div>

                      {/* Type Display */}
                      <div className="px-3 py-2 bg-blue-50 rounded-lg text-sm text-blue-700 text-center">
                        {link.type === 'page' ? 'עמוד' : 'פוסט'}
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateLink(index, { is_active: !link.is_active })}
                        className={`p-2 rounded-lg ${
                          link.is_active 
                            ? 'text-green-600 hover:bg-green-50' 
                            : 'text-gray-400 hover:bg-gray-50'
                        }`}
                        title={link.is_active ? 'פעיל' : 'לא פעיל'}
                      >
                        {link.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>

                      <div className="text-gray-400">
                        <LinkIcon className="h-4 w-4" />
                      </div>

                      <button
                        onClick={() => removeLink(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Preview */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">תצוגה מקדימה</h2>
          <div className="bg-white rounded-lg shadow-sm p-6 max-w-sm">
            <h3 className="font-bold text-gray-900 mb-4">סיידבר</h3>
            
            {settings.show_custom_links && (settings.links || []).filter(l => l.is_active && l.title).length > 0 && (
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-2">קישורים קשורים</h4>
                <ul className="space-y-1">
                  {(settings.links || [])
                    .filter(l => l.is_active && l.title)
                    .map((link) => (
                      <li key={link.id} className="flex items-center gap-2 text-sm text-blue-600">
                        <span>→</span>
                        <span>{link.title}</span>
                        {link.type === 'page' ? (
                          <span className="text-xs bg-blue-100 text-blue-700 px-1 rounded">עמוד</span>
                        ) : (
                          <span className="text-xs bg-green-100 text-green-700 px-1 rounded">פוסט</span>
                        )}
                      </li>
                    ))}
                </ul>
              </div>
            )}

            {settings.show_related_posts && (
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-2">פוסטים אחרונים</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div>• איך לבחור צבעים לבית</div>
                  <div>• טיפים לניהול לקוחות יעיל</div>
                  <div>• כל מה שחשוב לדעת על פרקט</div>
                </div>
              </div>
            )}

            {settings.show_testimonials && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2">המלצות לקוחות</h4>
                <div className="bg-orange-50 rounded-lg p-3">
                  <div className="flex items-center mb-1">
                    <div className="flex text-yellow-500 text-sm">★★★★★</div>
                  </div>
                  <p className="text-sm text-gray-700 italic">
                    "שירות מקצועי ואמין. ממליץ בחום!"
                  </p>
                  <p className="text-xs text-gray-500 mt-1">- יוסי כהן</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Copy Modal */}
      {showCopyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">העتק הגדרות סיידבר מעמוד אחר</h3>
              <button
                onClick={() => setShowCopyModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Default Settings */}
              <div
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => copyFromPage('default')}
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div>
                    <h4 className="font-medium">הגדרות ברירת מחדל</h4>
                    <p className="text-sm text-gray-600">העתק הגדרות ברירת מחדל לעמוד זה</p>
                  </div>
                </div>
              </div>

              {/* Other Pages */}
              {pages
                .filter(page => page.id !== pageId)
                .map((page) => {
                  const hasSettings = otherPageSettings.some(s => s.page_id === page.id)
                  return (
                    <div
                      key={page.id}
                      className={`p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer ${
                        !hasSettings ? 'opacity-50' : ''
                      }`}
                      onClick={() => hasSettings && copyFromPage(page.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-gray-600" />
                          <div>
                            <h4 className="font-medium">{page.title}</h4>
                            <p className="text-sm text-gray-600">
                              {hasSettings 
                                ? 'העתק הגדרות מעמוד זה' 
                                : 'אין הגדרות סיידבר לעמוד זה'
                              }
                            </p>
                          </div>
                        </div>
                        {hasSettings && (
                          <Copy className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                  )
                })}

              {pages.filter(page => page.id !== pageId).length === 0 && (
                <p className="text-gray-500 text-center py-8">
                  אין עמודים אחרים במערכת
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
              <button
                onClick={() => setShowCopyModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Link Selector Modal */}
      {showLinkSelector && (
        <LinkSelectorModal
          pages={pages}
          posts={posts}
          categories={categories}
          onSelect={addSelectedItem}
          onClose={() => setShowLinkSelector(false)}
        />
      )}

      {/* Loading overlay for copying */}
      {copying && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span>מעתיק הגדרות...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface LinkSelectorModalProps {
  pages: any[]
  posts: any[]
  categories: any[]
  onSelect: (item: any, type: 'page' | 'post') => void
  onClose: () => void
}

function LinkSelectorModal({ pages, posts, categories, onSelect, onClose }: LinkSelectorModalProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<string | 'all'>('all')
  const [filterType, setFilterType] = useState<'all' | 'page' | 'post'>('all')

  // Combine pages and posts, ensuring no duplicates and proper typing
  const allItems = [
    ...pages.map(page => ({ ...page, type: 'page' as const })),
    ...posts.filter(post => post.type === 'post').map(post => ({ ...post, type: 'post' as const }))
  ];

  // Remove duplicates by ID
  const uniqueItems = allItems.filter((item, index, self) => 
    index === self.findIndex(i => i.id === item.id)
  );

  const filteredItems = uniqueItems
    .filter(item => 
      (filterType === 'all' || item.type === filterType) &&
      (filterCategory === 'all' || item.category_id === filterCategory) &&
      item.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a.title.localeCompare(b.title))

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">בחר עמוד או פוסט לסיידבר</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold"
          >
            ✕
          </button>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 flex gap-4 flex-wrap">
          <div className="flex-1 min-w-64">
            <input
              type="text"
              placeholder="חפש עמוד או פוסט..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-48"
          >
            <option value="all">כל הקטגוריות</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as 'all' | 'page' | 'post')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">הכל</option>
            <option value="page">עמודים</option>
            <option value="post">פוסטים</option>
          </select>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto border rounded-lg p-2">
          {filteredItems.length === 0 ? (
            <p className="text-gray-500 text-center py-8">לא נמצאו פריטים תואמים.</p>
          ) : (
            <div className="space-y-2">
              {filteredItems.map((item, index) => {
                const category = categories.find(c => c.id === item.category_id)
                const uniqueKey = `${item.type}-${item.id}-${index}` // Extra index for absolute uniqueness
                return (
                  <div
                    key={uniqueKey}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => {
                      onSelect(item, item.type)
                      onClose()
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${item.type === 'page' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                        {item.type === 'page' ? (
                          <FileText className="h-5 w-5" />
                        ) : (
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-lg">{item.title}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            item.type === 'page' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {item.type === 'page' ? 'עמוד' : 'פוסט'}
                          </span>
                          {category && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                              📁 {category.name}
                            </span>
                          )}
                          <span className="text-gray-500">
                            /{item.slug}
                          </span>
                        </div>
                        {item.meta_description && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                            {item.meta_description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center text-blue-600">
                      <Plus className="h-5 w-5" />
                      <span className="ml-1 text-sm">הוסף</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            ביטול
          </button>
        </div>
      </div>
    </div>
  )
}
