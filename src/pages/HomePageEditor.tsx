'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DndContext, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus, Eye, Save, Monitor, Smartphone, Tablet } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '@/services/api'
import { PageComponent } from '@/types'
import ComponentSelector from '@/components/page-builder/ComponentSelector'
import SortableComponent from '@/components/page-builder/SortableComponent'
import { cn } from '@/utils/cn'
import { PUBLIC_SITE_URL } from '@/config/site'

interface HomePageData {
  content: PageComponent[]
  metaTitle?: string
  metaDescription?: string
  ogTitle?: string
  ogDescription?: string
}

export default function HomePageEditor() {
  const queryClient = useQueryClient()
  const [components, setComponents] = useState<PageComponent[]>([])
  const [showComponentSelector, setShowComponentSelector] = useState(false)
  const [selectedComponentIndex, setSelectedComponentIndex] = useState<number | null>(null)
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [activeTab, setActiveTab] = useState<'editor' | 'seo' | 'preview'>('editor')
  const [seoData, setSeoData] = useState({
    metaTitle: '',
    metaDescription: '',
    ogTitle: '',
    ogDescription: '',
  })

  // Fetch homepage data
  const { data: homepage, isLoading } = useQuery({
    queryKey: ['homepage'],
    queryFn: async () => {
      try {
        const response = await api.get('/pages', {
          params: { type: 'home', limit: 1 }
        })
        return response.data.data?.[0] || null
      } catch {
        return null
      }
    },
  })

  // Load homepage content
  useEffect(() => {
    if (homepage) {
      setComponents(homepage.content || [])
      setSeoData({
        metaTitle: homepage.meta_title || '',
        metaDescription: homepage.meta_description || '',
        ogTitle: homepage.og_title || '',
        ogDescription: homepage.og_description || '',
      })
    }
  }, [homepage])

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: HomePageData) => {
      console.log('💾 Saving homepage...', data)
      
      // הצג הודעת טעינה
      toast.loading('שומר את דף הבית...', { id: 'saving-homepage' })
      
      if (homepage) {
        return api.patch(`/pages/${homepage.id}`, data)
      } else {
        return api.post('/pages', {
          ...data,
          title: 'דף הבית',
          slug: 'home',
          type: 'home',
          is_published: true,
        })
      }
    },
    onSuccess: () => {
      console.log('✅ Homepage saved successfully!')
      
      // הסר את הודעת הטעינה
      toast.dismiss('saving-homepage')
      
      // הצג הודעת הצלחה
      toast.success('דף הבית נשמר בהצלחה! מרענן...')
      
      // רענן את הדף
      toast.loading('מרענן את הנתונים...', { id: 'refreshing-homepage' })
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['homepage'] })
      
      // הסר את הודעת הרענון אחרי רגע
      setTimeout(() => {
        toast.dismiss('refreshing-homepage')
        toast.success('✅ דף הבית עודכן בהצלחה!')
      }, 500)
    },
    onError: (error: any) => {
      console.error('❌ Homepage save error:', error)
      toast.dismiss('saving-homepage')
      toast.error('שגיאה בשמירת דף הבית: ' + (error.response?.data?.message || error.message))
    },
  })

  const handleSave = () => {
    saveMutation.mutate({
      content: components,
      ...seoData,
    })
  }

  const handleAddComponent = (type: string) => {
    const newComponent: PageComponent = {
      id: `component-${Date.now()}`,
      type: type as any,
      order: selectedComponentIndex !== null ? selectedComponentIndex + 1 : components.length,
      props: {},
    }

    if (selectedComponentIndex !== null) {
      const newComponents = [...components]
      newComponents.splice(selectedComponentIndex + 1, 0, newComponent)
      setComponents(newComponents)
    } else {
      setComponents([...components, newComponent])
    }

    setShowComponentSelector(false)
    setSelectedComponentIndex(null)
  }

  const handleEditComponent = (index: number, newProps: any) => {
    const updatedComponents = [...components]
    updatedComponents[index] = {
      ...updatedComponents[index],
      props: newProps,
    }
    setComponents(updatedComponents)
  }

  const handleDeleteComponent = (index: number) => {
    setComponents(components.filter((_, i) => i !== index))
  }

  const handleDuplicateComponent = (index: number) => {
    const component = components[index]
    const duplicated: PageComponent = {
      ...component,
      id: `component-${Date.now()}`,
      order: component.order + 1,
    }
    
    const newComponents = [...components]
    newComponents.splice(index + 1, 0, duplicated)
    setComponents(newComponents)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      setComponents((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over?.id)

        const newItems = [...items]
        const [reorderedItem] = newItems.splice(oldIndex, 1)
        newItems.splice(newIndex, 0, reorderedItem)

        // Update order
        return newItems.map((item, index) => ({
          ...item,
          order: index,
        }))
      })
    }
  }

  const previewSizes = {
    desktop: 'w-full',
    tablet: 'w-[768px]',
    mobile: 'w-[375px]',
  }

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p>טוען את דף הבית...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">עריכת דף הבית</h1>
            <p className="text-gray-600">עצב את דף הבית עם רכיבים דינמיים</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Preview Mode Buttons */}
            {activeTab === 'preview' && (
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setPreviewMode('desktop')}
                  className={cn(
                    'p-2 rounded transition-colors',
                    previewMode === 'desktop' ? 'bg-white shadow' : 'hover:bg-white/50'
                  )}
                >
                  <Monitor className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPreviewMode('tablet')}
                  className={cn(
                    'p-2 rounded transition-colors',
                    previewMode === 'tablet' ? 'bg-white shadow' : 'hover:bg-white/50'
                  )}
                >
                  <Tablet className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPreviewMode('mobile')}
                  className={cn(
                    'p-2 rounded transition-colors',
                    previewMode === 'mobile' ? 'bg-white shadow' : 'hover:bg-white/50'
                  )}
                >
                  <Smartphone className="h-4 w-4" />
                </button>
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="btn btn-primary"
            >
              <Save className="ml-2 h-4 w-4" />
              {saveMutation.isPending ? 'שומר...' : 'שמור דף הבית'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={() => setActiveTab('editor')}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'editor'
                ? 'text-primary-600 border-primary-600'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            )}
          >
            עריכה
          </button>
          <button
            onClick={() => setActiveTab('seo')}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'seo'
                ? 'text-primary-600 border-primary-600'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            )}
          >
            SEO
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'preview'
                ? 'text-primary-600 border-primary-600'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            )}
          >
            תצוגה מקדימה
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'editor' && (
          <div className="p-6">
            {/* Add Component Button */}
            <div className="mb-6 text-center">
              <button
                onClick={() => {
                  setSelectedComponentIndex(null)
                  setShowComponentSelector(true)
                }}
                className="btn btn-outline btn-lg"
              >
                <Plus className="ml-2 h-5 w-5" />
                הוסף רכיב לדף הבית
              </button>
            </div>

            {/* Components */}
            <DndContext onDragEnd={handleDragEnd}>
              <SortableContext
                items={components.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-6 max-w-6xl mx-auto">
                  {components.map((component, index) => (
                    <SortableComponent
                      key={component.id}
                      id={component.id}
                      component={component}
                      index={index}
                      onEdit={(newProps) => handleEditComponent(index, newProps)}
                      onDelete={() => handleDeleteComponent(index)}
                      onDuplicate={() => handleDuplicateComponent(index)}
                      onAddAfter={() => {
                        setSelectedComponentIndex(index)
                        setShowComponentSelector(true)
                      }}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {components.length === 0 && (
              <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center max-w-2xl mx-auto">
                <div className="text-gray-400 mb-4">
                  <Monitor className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  דף הבית ריק
                </h3>
                <p className="text-gray-500 mb-6">
                  התחל לבנות את דף הבית עם רכיבים דינמיים
                </p>
                <button
                  onClick={() => setShowComponentSelector(true)}
                  className="btn btn-primary"
                >
                  <Plus className="ml-2 h-5 w-5" />
                  הוסף רכיב ראשון
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'seo' && (
          <div className="p-6">
            <div className="max-w-2xl mx-auto space-y-6">
              <h3 className="text-lg font-semibold">הגדרות SEO לדף הבית</h3>
              
              <div>
                <label className="form-label">Meta Title</label>
                <input
                  type="text"
                  value={seoData.metaTitle}
                  onChange={(e) => setSeoData({ ...seoData, metaTitle: e.target.value })}
                  className="form-input"
                  placeholder="דף הבית — DoWe"
                />
              </div>

              <div>
                <label className="form-label">Meta Description</label>
                <textarea
                  value={seoData.metaDescription}
                  onChange={(e) => setSeoData({ ...seoData, metaDescription: e.target.value })}
                  rows={3}
                  className="form-input"
                  placeholder="התיאור שיופיע בGoogle..."
                />
              </div>

              <div>
                <label className="form-label">Open Graph Title</label>
                <input
                  type="text"
                  value={seoData.ogTitle}
                  onChange={(e) => setSeoData({ ...seoData, ogTitle: e.target.value })}
                  className="form-input"
                  placeholder="כותרת לשיתוף ברשתות חברתיות"
                />
              </div>

              <div>
                <label className="form-label">Open Graph Description</label>
                <textarea
                  value={seoData.ogDescription}
                  onChange={(e) => setSeoData({ ...seoData, ogDescription: e.target.value })}
                  rows={2}
                  className="form-input"
                  placeholder="תיאור לשיתוף ברשתות חברתיות"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'preview' && (
          <div className="p-6">
            <div className="flex justify-center">
              <div className={`${previewSizes[previewMode]} transition-all duration-300`}>
                <div className="bg-white rounded-lg shadow-lg overflow-hidden p-8 text-center">
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">תצוגה מקדימה</h3>
                    <p className="text-gray-600">לצפייה בדף הבית המעודכן, לחצו על הכפתור למטה</p>
                  </div>
                  <a
                    href={PUBLIC_SITE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-lg inline-flex items-center gap-2"
                  >
                    <Eye className="h-5 w-5" />
                    פתח את האתר בטאב חדש
                  </a>
                  <div className="mt-4 text-sm text-gray-500">
                    השינויים שתעשו כאן יופיעו באתר לאחר שמירה
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Component Selector Modal */}
      {showComponentSelector && (
        <ComponentSelector
          onSelect={handleAddComponent}
          onClose={() => {
            setShowComponentSelector(false)
            setSelectedComponentIndex(null)
          }}
          homePageMode={true} // מצב מיוחד לדף הבית
        />
      )}
    </div>
  )
}
