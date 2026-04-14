import { useState, useEffect } from 'react'
import { Plus, X, Settings, Trash2 } from 'lucide-react'

interface SidebarItem {
  id: string
  type: 'related_pages' | 'related_posts' | 'recent_posts' | 'testimonials' | 'custom_content' | 'categories'
  title: string
  config: {
    categoryId?: string
    limit?: number
    customContent?: string
    pageIds?: string[]
    postIds?: string[]
  }
  order: number
  isActive: boolean
}

interface SidebarConfig {
  id?: string
  pageId: string
  items: SidebarItem[]
  isActive: boolean
}

interface Category {
  id: string
  name: string
  slug: string
}

interface SidebarManagerProps {
  pageId: string
  onClose?: () => void
}

const itemTypeOptions = [
  { value: 'related_pages', label: 'דפים קשורים', description: 'דפים מאותה קטגוריה או דפים ספציפיים' },
  { value: 'related_posts', label: 'פוסטים קשורים', description: 'פוסטים מאותה קטגוריה' },
  { value: 'recent_posts', label: 'פוסטים אחרונים', description: 'הפוסטים החדשים ביותר' },
  { value: 'testimonials', label: 'המלצות לקוחות', description: 'חוות דעת ועדויות לקוחות' },
  { value: 'categories', label: 'קטגוריות', description: 'רשימת קטגוריות' },
  { value: 'custom_content', label: 'תוכן מותאם', description: 'תוכן HTML מותאם אישית' },
]

export default function SidebarManager({ pageId, onClose }: SidebarManagerProps) {
  const [sidebarConfig, setSidebarConfig] = useState<SidebarConfig>({
    pageId,
    items: [],
    isActive: true,
  })
  
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAddItem, setShowAddItem] = useState(false)
  const [editingItem, setEditingItem] = useState<SidebarItem | null>(null)

  // Fetch sidebar config and categories
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const token = localStorage.getItem('auth_token')
        
        // Fetch sidebar config
        const sidebarResponse = await fetch(`/api/sidebar/page/${pageId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        
        if (sidebarResponse.ok) {
          const sidebarData = await sidebarResponse.json()
          if (sidebarData.data) {
            setSidebarConfig(sidebarData.data)
          }
        }

        // Fetch categories
        const categoriesResponse = await fetch('/api/categories', {
          headers: { Authorization: `Bearer ${token}` },
        })
        
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json()
          setCategories(categoriesData.data || [])
        }
      } catch (error) {
        console.error('Error fetching sidebar data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [pageId])

  const handleSave = async () => {
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/sidebar/page/${pageId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: sidebarConfig.items,
          isActive: sidebarConfig.isActive,
        }),
      })

      if (!response.ok) throw new Error('Failed to save sidebar')

      console.log('Sidebar saved successfully')
      onClose?.()
    } catch (error) {
      console.error('Error saving sidebar:', error)
      alert('שגיאה בשמירת הסיידבר')
    } finally {
      setSaving(false)
    }
  }

  const addNewItem = () => {
    const newItem: SidebarItem = {
      id: `item_${Date.now()}`,
      type: 'recent_posts',
      title: 'פוסטים אחרונים',
      config: { limit: 5 },
      order: sidebarConfig.items.length,
      isActive: true,
    }
    
    setEditingItem(newItem)
    setShowAddItem(true)
  }

  const saveItem = (item: SidebarItem) => {
    const existingIndex = sidebarConfig.items.findIndex(i => i.id === item.id)
    
    if (existingIndex >= 0) {
      // Update existing
      const updatedItems = [...sidebarConfig.items]
      updatedItems[existingIndex] = item
      setSidebarConfig(prev => ({ ...prev, items: updatedItems }))
    } else {
      // Add new
      setSidebarConfig(prev => ({
        ...prev,
        items: [...prev.items, item],
      }))
    }
    
    setEditingItem(null)
    setShowAddItem(false)
  }

  const removeItem = (itemId: string) => {
    if (confirm('האם אתה בטוח שברצונך להסיר פריט זה?')) {
      setSidebarConfig(prev => ({
        ...prev,
        items: prev.items.filter(item => item.id !== itemId),
      }))
    }
  }

  const moveItem = (fromIndex: number, toIndex: number) => {
    const items = [...sidebarConfig.items]
    const [movedItem] = items.splice(fromIndex, 1)
    items.splice(toIndex, 0, movedItem)
    
    // Update order
    items.forEach((item, index) => {
      item.order = index
    })
    
    setSidebarConfig(prev => ({ ...prev, items }))
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white rounded-lg text-right overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                ניהול סיידבר הדף
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            {/* Sidebar Active Toggle */}
            <div className="mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={sidebarConfig.isActive}
                  onChange={(e) => setSidebarConfig(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="mr-2 text-sm font-medium text-gray-700">
                  הפעל סיידבר בדף זה
                </span>
              </label>
            </div>

            {/* Sidebar Items */}
            {sidebarConfig.isActive && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-md font-medium text-gray-800">פריטי הסיידבר</h4>
                  <button
                    onClick={addNewItem}
                    className="btn btn-primary btn-sm flex items-center gap-2"
                  >
                    <Plus size={16} />
                    הוסף פריט
                  </button>
                </div>

                {sidebarConfig.items.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    אין פריטי סיידבר. הוסף את הפריט הראשון!
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sidebarConfig.items
                      .sort((a, b) => a.order - b.order)
                      .map((item, index) => (
                        <SidebarItemCard
                          key={item.id}
                          item={item}
                          onEdit={() => {
                            setEditingItem(item)
                            setShowAddItem(true)
                          }}
                          onRemove={() => removeItem(item.id)}
                          onMoveUp={() => index > 0 && moveItem(index, index - 1)}
                          onMoveDown={() => index < sidebarConfig.items.length - 1 && moveItem(index, index + 1)}
                          canMoveUp={index > 0}
                          canMoveDown={index < sidebarConfig.items.length - 1}
                        />
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              {saving ? 'שומר...' : 'שמור'}
            </button>
            <button
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              ביטול
            </button>
          </div>
        </div>
      </div>

      {/* Item Editor Modal */}
      {showAddItem && editingItem && (
        <SidebarItemEditor
          item={editingItem}
          categories={categories}
          onSave={saveItem}
          onClose={() => {
            setShowAddItem(false)
            setEditingItem(null)
          }}
        />
      )}
    </div>
  )
}

interface SidebarItemCardProps {
  item: SidebarItem
  onEdit: () => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  canMoveUp: boolean
  canMoveDown: boolean
}

function SidebarItemCard({ item, onEdit, onRemove, onMoveUp, onMoveDown, canMoveUp, canMoveDown }: SidebarItemCardProps) {
  const typeOption = itemTypeOptions.find(opt => opt.value === item.type)
  
  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h5 className="font-medium text-gray-800">{item.title}</h5>
          <p className="text-sm text-gray-500">{typeOption?.label}</p>
          {item.config.limit && (
            <p className="text-xs text-gray-400">מקסימום: {item.config.limit} פריטים</p>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Move buttons */}
          <div className="flex flex-col">
            <button
              onClick={onMoveUp}
              disabled={!canMoveUp}
              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              ↑
            </button>
            <button
              onClick={onMoveDown}
              disabled={!canMoveDown}
              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              ↓
            </button>
          </div>
          
          <button
            onClick={onEdit}
            className="p-2 text-blue-600 hover:text-blue-800"
          >
            <Settings size={16} />
          </button>
          
          <button
            onClick={onRemove}
            className="p-2 text-red-600 hover:text-red-800"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

interface SidebarItemEditorProps {
  item: SidebarItem
  categories: Category[]
  onSave: (item: SidebarItem) => void
  onClose: () => void
}

function SidebarItemEditor({ item: initialItem, categories, onSave, onClose }: SidebarItemEditorProps) {
  const [item, setItem] = useState<SidebarItem>(initialItem)

  const handleSave = () => {
    if (!item.title.trim()) {
      alert('נא להזין כותרת לפריט')
      return
    }
    
    onSave(item)
  }

  return (
    <div className="fixed inset-0 z-60 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white rounded-lg text-right overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {initialItem.id.startsWith('item_') && initialItem.id.includes(Date.now().toString().slice(-5)) ? 'פריט חדש' : 'עריכת פריט'}
              </h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  כותרת הפריט
                </label>
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => setItem(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  סוג הפריט
                </label>
                <select
                  value={item.type}
                  onChange={(e) => setItem(prev => ({ 
                    ...prev, 
                    type: e.target.value as SidebarItem['type'],
                    config: { limit: 5 } // Reset config when type changes
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {itemTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {itemTypeOptions.find(opt => opt.value === item.type)?.description}
                </p>
              </div>

              {/* Type-specific configuration */}
              {(item.type === 'related_posts' || item.type === 'related_pages') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    קטגוריה (אופציונלי)
                  </label>
                  <select
                    value={item.config.categoryId || ''}
                    onChange={(e) => setItem(prev => ({
                      ...prev,
                      config: { ...prev.config, categoryId: e.target.value || undefined }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">כל הקטגוריות</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Limit */}
              {item.type !== 'custom_content' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    מספר פריטים להצגה
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={item.config.limit || 5}
                    onChange={(e) => setItem(prev => ({
                      ...prev,
                      config: { ...prev.config, limit: parseInt(e.target.value) || 5 }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              )}

              {/* Custom Content */}
              {item.type === 'custom_content' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    תוכן HTML
                  </label>
                  <textarea
                    value={item.config.customContent || ''}
                    onChange={(e) => setItem(prev => ({
                      ...prev,
                      config: { ...prev.config, customContent: e.target.value }
                    }))}
                    rows={6}
                    placeholder="<div>התוכן שלך כאן...</div>"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
                  />
                </div>
              )}

              {/* Active Toggle */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={item.isActive}
                    onChange={(e) => setItem(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="mr-2 text-sm font-medium text-gray-700">
                    פריט פעיל
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              onClick={handleSave}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              שמור
            </button>
            <button
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              ביטול
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
