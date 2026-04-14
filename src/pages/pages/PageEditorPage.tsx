import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import toast from 'react-hot-toast'
import { Save, ArrowRight, Eye, Plus } from 'lucide-react'
import { api } from '@/services/api'
import { Page, PageComponent } from '@/types'
import { invalidatePageCache } from '@/services/pageCache'
import PageBuilder from '@/components/page-builder/PageBuilder'
import ComponentSelector from '@/components/page-builder/ComponentSelector'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { PUBLIC_SITE_URL } from '@/config/site'
import AIContentGenerator from '@/components/ai/AIContentGenerator'
import SmartAIForm from '@/components/ai/SmartAIForm'
import { cn } from '@/utils/cn'
import { slugify } from '@/utils/slugify'

const pageSchema = z.object({
  title: z.string().min(1, 'כותרת חובה'),
  slug: z.string().min(1, 'כתובת URL חובה').regex(/^[a-zA-Z0-9\u0590-\u05FF\-]+$/, 'הכתובת יכולה להכיל אותיות בעברית או אנגלית, מספרים ומקפים'),
  type: z.enum(['home', 'page', 'category', 'post']).default('page'),
  categoryId: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  metaKeywords: z.string().optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().optional(),
  isPublished: z.boolean().default(true),
})

type PageFormData = z.infer<typeof pageSchema>

export default function PageEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEditMode = !!id

  const [components, setComponents] = useState<PageComponent[]>([])
  const [showComponentSelector, setShowComponentSelector] = useState(false)
  const [selectedComponentIndex, setSelectedComponentIndex] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'content' | 'settings'>('content')
  const [previewCollapsed, setPreviewCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<PageFormData>({
    resolver: zodResolver(pageSchema),
    defaultValues: {
      type: 'page',
      isPublished: true,
    },
  })

  const pageType = watch('type')
  const formData = watch() // Watch all form data for tracking changes

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
      // Auto-collapse preview on smaller screens for better editing experience
      if (window.innerWidth < 1280) {
        setPreviewCollapsed(true)
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Fetch page data if editing
  const { data: page, isLoading } = useQuery({
    queryKey: ['page', id],
    queryFn: async () => {
      const response = await api.get(`/pages/${id}`)
      return response.data.data as Page
    },
    enabled: isEditMode,
  })

  // Fetch categories for dropdown
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/categories')
      return response.data.data
    },
  })

  // Track unsaved changes
  useEffect(() => {
    if (isEditMode && page) {
      setHasUnsavedChanges(true)
    }
  }, [formData, components, isEditMode, page])

  // Set form data when page is loaded
  useEffect(() => {
    if (page) {
      console.log('🔍 Loading page data:', page);
      console.log('📊 META data from DB:', {
        meta_title: page.meta_title,
        meta_description: page.meta_description,
        meta_keywords: page.meta_keywords,
        og_title: page.og_title,
        og_description: page.og_description,
        og_image: page.og_image
      });

      setValue('title', page.title)
      setValue('slug', page.slug)
      setValue('type', page.type)
      setValue('categoryId', page.category_id || '')
      setValue('metaTitle', page.meta_title || '')
      setValue('metaDescription', page.meta_description || '')
      setValue('metaKeywords', page.meta_keywords || '')
      setValue('ogTitle', page.og_title || '')
      setValue('ogDescription', page.og_description || '')
      setValue('ogImage', page.og_image || '')
      setValue('isPublished', page.is_published ?? true)
      
      setComponents(page.content || [])

      console.log('✅ Form values set:', {
        metaTitle: page.meta_title || '',
        metaDescription: page.meta_description || '',
        metaKeywords: page.meta_keywords || '',
        componentsCount: page.content?.length,
      });
    }
  }, [page, setValue])

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: PageFormData & { content: PageComponent[] }) => {
      console.log('💾 Saving page...', { isEditMode, id, dataKeys: Object.keys(data) })
      
      // הצג הודעת טעינה
      toast.loading('שומר את הדף...', { id: 'saving-page' })
      
      if (isEditMode) {
        return api.patch(`/pages/${id}`, data)
      } else {
        return api.post('/pages', data)
      }
    },
    onSuccess: (response) => {
      console.log('✅ Page saved successfully!', response.data)
      
      // הסר את הודעת הטעינהימלי
      toast.dismiss('saving-page')
      
      // אפס את דגל השינויים מיד
      setHasUnsavedChanges(false)
      
      if (isEditMode) {
        // במצב עריכה - רענן את הדף הנוכחי
        toast.success('✅ הדף נשמר בהצלחה! מרענן...')
        
        // רענן את הנתונים
        queryClient.invalidateQueries({ queryKey: ['page', id] })
        queryClient.invalidateQueries({ queryKey: ['pages'] })
        invalidatePageCache() // Invalidate autocomplete cache
        
        // הודעה סופית
        setTimeout(() => {
          toast.success('✅ העריכה נשמרה!')
        }, 300)
      } else {
        // דף חדש - נווט לרשימת הדפים
        toast.success('הדף נוצר בהצלחה!')
        queryClient.invalidateQueries({ queryKey: ['pages'] })
        invalidatePageCache() // Invalidate autocomplete cache
        setTimeout(() => navigate('/pages'), 500)
      }
    },
    onError: (error: any) => {
      console.error('❌ Save error:', error)
      toast.dismiss('saving-page')
      toast.error('אירעה שגיאה בשמירת הדף: ' + (error.response?.data?.message || error.message))
    },
  })

  const onSubmit = async (data: PageFormData) => {
    console.log('💾 Submitting form data:', data);
    console.log('📄 Components data:', components);
    
    // בדיקת URL כפול רק לדפים חדשים
    if (!isEditMode) {
      try {
        const response = await api.get(`/pages/slug/${data.slug}`)
        if (response.data.data) {
          toast.error(`⚠️ כתובת URL "${data.slug}" כבר קיימת במערכת! אנא בחר כתובת אחרת.`)
          return
        }
      } catch (error: any) {
        // 404 = URL לא קיים, זה טוב!
        if (error.response?.status !== 404) {
          console.error('Error checking slug:', error)
        }
      }
    }
    
    const submitData = {
      ...data,
      content: components,
    };
    
    console.log('🚀 Final submission data:', submitData);
    
    saveMutation.mutate(submitData)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      setComponents((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over?.id)
        return arrayMove(items, oldIndex, newIndex)
      })
      setHasUnsavedChanges(true)
    }
  }

  const handleAddComponent = (type: string, props: any) => {
    const newComponent: PageComponent = {
      id: `component-${Date.now()}`,
      type: type as any,
      props,
      order: components.length,
    }

    if (selectedComponentIndex !== null) {
      // Insert after selected component
      const newComponents = [...components]
      newComponents.splice(selectedComponentIndex + 1, 0, newComponent)
      setComponents(newComponents)
    } else {
      // Add to end
      setComponents([...components, newComponent])
    }

    setShowComponentSelector(false)
    setSelectedComponentIndex(null)
    setHasUnsavedChanges(true)
  }

  // Handle AI generated content
  const handleAIContentGenerated = (aiResult: {
    components: PageComponent[]
    metaTitle: string
    metaDescription: string
    metaKeywords: string
    ogTitle: string
    ogDescription: string
  }) => {
    console.log('🎯 AI Content generated:', aiResult)
    console.log('🎯 Number of components:', aiResult.components?.length)
    
    // עדכן רכיבים
    console.log('🎯 Current components before update:', components)
    setComponents(aiResult.components)
    console.log('🎯 Components after update:', aiResult.components)
    
    // עדכן META fields
    setValue('metaTitle', aiResult.metaTitle)
    setValue('metaDescription', aiResult.metaDescription) 
    setValue('metaKeywords', aiResult.metaKeywords)
    setValue('ogTitle', aiResult.ogTitle)
    setValue('ogDescription', aiResult.ogDescription)
    
    setHasUnsavedChanges(true)
    toast.success('🤖 תוכן AI נטען לדף!')
  }

  const handleEditComponent = (index: number, props: any, shouldClose?: boolean) => {
    console.log('✏️ Editing component at index:', index, 'shouldClose:', shouldClose)
    console.log('📝 New props:', props)
    
    setComponents(prevComponents => {
      const newComponents = [...prevComponents]
      newComponents[index] = {
        ...newComponents[index],
        props: props,
      }
      return newComponents
    })
    
    setHasUnsavedChanges(true)
  }

  const handleDeleteComponent = (index: number) => {
    setComponents(components.filter((_, i) => i !== index))
    setHasUnsavedChanges(true)
  }

  const handleDuplicateComponent = (index: number) => {
    const component = components[index]
    const newComponent: PageComponent = {
      ...component,
      id: `component-${Date.now()}`,
    }
    const newComponents = [...components]
    newComponents.splice(index + 1, 0, newComponent)
    setComponents(newComponents)
    setHasUnsavedChanges(true)
  }

  const handleToggleVisibility = (index: number, isVisible: boolean) => {
    setComponents(prevComponents => {
      const newComponents = [...prevComponents]
      newComponents[index] = {
        ...newComponents[index],
        isVisible: isVisible,
      }
      return newComponents
    })
    setHasUnsavedChanges(true)
  }

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/pages')}
                className="text-gray-500 hover:text-gray-700"
              >
                <ArrowRight className="h-5 w-5" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">
                {isEditMode ? 'עריכת דף' : 'יצירת דף חדש'}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              {/* View Site Button */}
              {isEditMode && (
                <a
                  href={`${PUBLIC_SITE_URL}/${page?.slug === 'home' ? '' : page?.slug ?? ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline btn-lg flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  צפייה באתר
                </a>
              )}
              
              {/* Manual Save Button */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSubmit(onSubmit)}
                  disabled={saveMutation.isPending}
                  className={cn(
                    'btn btn-primary btn-lg flex items-center gap-2 shadow-sm hover:shadow-md transition-all',
                    saveMutation.isPending && 'opacity-50',
                    hasUnsavedChanges && 'ring-2 ring-amber-400 animate-pulse'
                  )}
                >
                  <Save className="h-4 w-4" />
                  {saveMutation.isPending 
                    ? (isEditMode ? 'שומר...' : 'יוצר...') 
                    : (isEditMode ? 'שמור שינויים' : 'צור דף')
                  }
                </button>
                
                {/* Unsaved changes indicator */}
                {hasUnsavedChanges && (
                  <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                    <span className="text-sm font-medium">⚠️ יש שינויים שלא נשמרו</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Tabs */}
          <div className="mt-4 flex gap-4 border-t border-gray-200 -mb-px">
            <button
              onClick={() => setActiveTab('content')}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                activeTab === 'content'
                  ? 'text-primary-600 border-primary-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              )}
            >
              📝 עריכה + תצוגה
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                activeTab === 'settings'
                  ? 'text-primary-600 border-primary-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              )}
            >
              ⚙️ הגדרות
            </button>
          </div>
        </div>
      </div>

      {/* Content - Split Screen Layout */}
      <div className="p-4 lg:p-6">
        {activeTab === 'content' ? (
          <div className={`min-h-[calc(100vh-240px)] ${
            isMobile || previewCollapsed 
              ? 'block' 
              : 'grid lg:grid-cols-[60%_40%] xl:grid-cols-[65%_35%] gap-4 lg:gap-6 items-start'
          }`}>
            {/* Left Side - Content Editor */}
            <div className={`overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-sm ${
              isMobile && !previewCollapsed ? 'mb-6' : ''
            }`}>
              <div className="p-4 lg:p-6">
                {/* Basic Page Info - Always Visible */}
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <h3 className="text-base font-semibold text-gray-900 mb-4">מידע בסיסי</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="form-label">כותרת הדף *</label>
                      <input
                        {...register('title')}
                        type="text"
                        className={cn('form-input', errors.title && 'border-red-300')}
                        placeholder="לדוגמה: אישורי הגעה לחתונה — מדריך מלא"
                        onChange={(e) => {
                          const value = e.target.value;
                          setValue('title', value);
                          // Auto-generate slug from title only for new pages or if slug is empty
                          if (value && (!isEditMode || !watch('slug'))) {
                            setValue('slug', slugify(value));
                          }
                        }}
                      />
                      {errors.title && (
                        <p className="form-error">{errors.title.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="form-label">כתובת URL *</label>
                      <div className="flex gap-2">
                        <input
                          {...register('slug')}
                          type="text"
                          dir="ltr"
                          className={cn('form-input flex-1', errors.slug && 'border-red-300')}
                          placeholder="shiputs-dira-tel-aviv"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const title = watch('title');
                            if (title) {
                              setValue('slug', slugify(title));
                            }
                          }}
                          className="btn btn-outline btn-sm"
                          title="יצר מהכותרת"
                        >
                          🔄
                        </button>
                      </div>
                      {errors.slug && (
                        <p className="form-error">{errors.slug.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="form-label">קטגוריה</label>
                      <select
                        {...register('categoryId')}
                        className="form-input"
                      >
                        <option value="">בחר קטגוריה (אופציונלי)</option>
                        {categories?.map((cat: any) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        שייך את הדף לקטגוריה כדי שיופיע בתפריט
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Add Component Button */}
                <div className="mb-8 text-center">
                  {/* Warning if basic info is missing */}
                  {(!watch('title')?.trim() || !watch('slug')?.trim() || !watch('categoryId')) && (
                    <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-right">
                      <div className="flex items-start gap-3">
                        <div className="text-yellow-600 mt-1">⚠️</div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-yellow-800 mb-2">מלא מידע בסיסי לפני יצירת תוכן AI</h4>
                          <p className="text-sm text-yellow-700 mb-2">כדי להשתמש ביצירת תוכן AI, יש למלא את השדות הבאים בטאב "הגדרות":</p>
                          <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
                            {!watch('title')?.trim() && <li>כותרת דף</li>}
                            {!watch('slug')?.trim() && <li>כתובת URL</li>}
                            {!watch('categoryId') && <li>קטגוריה</li>}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-3 justify-between mb-6 flex-wrap">
                    <div className="flex gap-3 flex-wrap">
                      <button
                        onClick={() => {
                          setSelectedComponentIndex(null)
                          setShowComponentSelector(true)
                        }}
                        className="btn btn-primary btn-lg flex items-center gap-2 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <Plus className="h-4 w-4" />
                        הוסף רכיב
                      </button>
                      
                      {/* Preview toggle button */}
                      <button
                        onClick={() => setPreviewCollapsed(!previewCollapsed)}
                        className="btn btn-outline btn-lg text-gray-600 flex items-center gap-2"
                        title={previewCollapsed ? 'הרחב תצוגה מקדימה' : 'מזער תצוגה מקדימה'}
                      >
                        <Eye className="h-4 w-4" />
                        {previewCollapsed ? 'הצג תצוגה' : 'הסתר תצוגה'}
                      </button>
                      
                      <AIContentGenerator
                        onContentGenerated={handleAIContentGenerated}
                        existingContent={components}
                        pageTitle={watch('title')}
                        pageSlug={watch('slug')}
                        categoryId={watch('categoryId')}
                      />
                      
                      <SmartAIForm
                        onContentGenerated={handleAIContentGenerated}
                        pageTitle={watch('title')}
                        pageType={watch('type')}
                        pageSlug={watch('slug')}
                        categoryId={watch('categoryId')}
                      />
                    </div>
                  </div>
                  
                  {/* Debug Info */}
                  {process.env.NODE_ENV === 'development' && components.length > 0 && (
                    <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg mb-6 border border-blue-200">
                      🔧 דיבוג: {components.length} רכיבים בדף
                    </div>
                  )}
                </div>

                {/* Page Builder */}
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={components.map((c) => c.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <PageBuilder
                      components={components}
                      onEdit={handleEditComponent}
                      onDelete={handleDeleteComponent}
                      onDuplicate={handleDuplicateComponent}
                      onAddAfter={(index) => {
                        setSelectedComponentIndex(index)
                        setShowComponentSelector(true)
                      }}
                      onToggleVisibility={handleToggleVisibility}
                      sourcePageId={id} // Pass page ID to prevent self-linking
                    />
                  </SortableContext>
                </DndContext>

                {components.length === 0 && (
                  <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center bg-gray-50">
                    <div className="text-gray-400 mb-4">
                      <div className="text-6xl mb-4">📄</div>
                    </div>
                    <h3 className="text-lg font-medium text-gray-700 mb-2">הדף ריק</h3>
                    <p className="text-base text-gray-500 mb-6">
                      עדיין אין רכיבים בדף זה. לחץ על "הוסף רכיב" כדי להתחיל ליצור תוכן
                    </p>
                    <button
                      onClick={() => {
                        setSelectedComponentIndex(null)
                        setShowComponentSelector(true)
                      }}
                      className="btn btn-primary btn-lg"
                    >
                      <Plus className="ml-2 h-4 w-4" />
                      הוסף רכיב ראשון
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Side - Live Preview (Collapsible & Sticky) */}
            {!previewCollapsed && (
              <div className={`bg-gray-100 border border-gray-200 rounded-lg overflow-hidden shadow-sm ${
                isMobile 
                  ? 'mt-6 h-[70vh]' 
                  : 'sticky top-20 h-[calc(100vh-140px)] max-h-[800px]'
              }`}>
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                  <span className="text-base font-medium text-gray-700 flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    תצוגה מקדימה - עדכון אוטומטי
                  </span>
                  <div className="flex gap-2">
                    {/* Responsive size buttons */}
                    <div className="hidden lg:flex gap-1">
                      <button
                        className="p-2 hover:bg-gray-200 rounded-md text-sm transition-colors"
                        title="תצוגה מלאה"
                        onClick={() => {
                          const iframe = document.querySelector('.preview-iframe') as HTMLIFrameElement;
                          if (iframe) iframe.style.width = '100%';
                        }}
                      >
                        🖥️
                      </button>
                      <button
                        className="p-2 hover:bg-gray-200 rounded-md text-sm transition-colors"
                        title="תצוגת טאבלט"
                        onClick={() => {
                          const iframe = document.querySelector('.preview-iframe') as HTMLIFrameElement;
                          if (iframe) iframe.style.width = '768px';
                        }}
                      >
                        📱
                      </button>
                      <button
                        className="p-2 hover:bg-gray-200 rounded-md text-sm transition-colors"
                        title="תצוגת מובייל"
                        onClick={() => {
                          const iframe = document.querySelector('.preview-iframe') as HTMLIFrameElement;
                          if (iframe) iframe.style.width = '375px';
                        }}
                      >
                        📲
                      </button>
                    </div>
                    <button
                      onClick={() => setPreviewCollapsed(true)}
                      className="p-2 hover:bg-gray-200 rounded-md transition-colors"
                      title="מזער תצוגה מקדימה"
                    >
                      <span className="text-sm">✕</span>
                    </button>
                  </div>
                </div>
                <div className="h-[calc(100%-64px)] overflow-auto flex justify-center bg-gray-200">
                  {watch('slug') ? (
                    <iframe
                      src={watch('slug') === 'home' ? `${PUBLIC_SITE_URL}/` : `${PUBLIC_SITE_URL}/${watch('slug')}`}
                      className="preview-iframe w-full min-h-[200vh] border-0 bg-white max-w-none transition-all duration-300"
                      title="תצוגה מקדימה"
                      key={`preview-${components.length}-${JSON.stringify(components.slice(0, 3))}`}
                      loading="lazy"
                      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500 w-full">
                      <div className="text-center p-8">
                        <Eye className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-600 mb-2">תצוגה מקדימה</h3>
                        <p className="text-base text-gray-500">הזן כתובת URL כדי לראות תצוגה מקדימה</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Floating Preview Toggle for Mobile */}
            {previewCollapsed && (
              <div className="fixed bottom-8 left-8 z-30">
                <button
                  onClick={() => setPreviewCollapsed(false)}
                  className="bg-primary-600 hover:bg-primary-700 text-white p-4 rounded-full shadow-lg transition-colors"
                  title="הרחב תצוגה מקדימה"
                >
                  <Eye className="w-6 h-6" />
                </button>
              </div>
            )}
          </div>
        ) : activeTab === 'settings' ? (
          <div className="max-w-3xl mx-auto">
            <form className="space-y-6 bg-white rounded-lg shadow p-6">
              {/* Basic Info */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">מידע בסיסי</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="form-label">כותרת *</label>
                    <input
                      {...register('title')}
                      type="text"
                      className={cn('form-input', errors.title && 'border-red-300')}
                      onChange={(e) => {
                        const value = e.target.value;
                        setValue('title', value);
                        // Auto-generate slug from title only for new pages or if slug is empty
                        if (value && (!isEditMode || !watch('slug'))) {
                          setValue('slug', slugify(value));
                        }
                      }}
                    />
                    {errors.title && (
                      <p className="form-error">{errors.title.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="form-label">כתובת URL *</label>
                    <div className="flex gap-2">
                      <input
                        {...register('slug')}
                        type="text"
                        dir="ltr"
                        className={cn('form-input flex-1', errors.slug && 'border-red-300')}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const title = watch('title');
                          if (title) {
                            setValue('slug', slugify(title));
                          }
                        }}
                        className="btn btn-outline btn-sm"
                        title="יצר מהכותרת"
                      >
                        🔄
                      </button>
                    </div>
                    {errors.slug && (
                      <p className="form-error">{errors.slug.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="form-label">סוג דף *</label>
                    <select
                      {...register('type')}
                      className={cn('form-input', errors.type && 'border-red-300')}
                    >
                      <option value="page">דף תוכן</option>
                      <option value="home">דף בית</option>
                      <option value="category">דף קטגוריה</option>
                    </select>
                  </div>
                  
                  {pageType === 'category' && (
                    <div>
                      <label className="form-label">קטגוריה</label>
                      <select
                        {...register('categoryId')}
                        className="form-input"
                      >
                        <option value="">בחר קטגוריה</option>
                        {categories?.map((cat: any) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* SEO */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">SEO</h2>
                <div className="space-y-4">
                  <div>
                    <label className="form-label">Meta Title</label>
                    <input
                      {...register('metaTitle')}
                      type="text"
                      className="form-input"
                      placeholder={`${watch('title') || 'DoWe'} — ניהול חתונה ואירועים`}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      כותרת שתופיע בGoogle ובשיתוף ברשתות חברתיות
                    </p>
                  </div>
                  
                  <div>
                    <label className="form-label">Meta Description</label>
                    <textarea
                      {...register('metaDescription')}
                      rows={3}
                      className="form-input"
                      placeholder="תיאור קצר שיופיע בתוצאות Google..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {watch('metaDescription')?.length || 0}/160 תווים (מומלץ 150-160)
                    </p>
                  </div>
                  
                  <div>
                    <label className="form-label">Meta Keywords</label>
                    <input
                      {...register('metaKeywords')}
                      type="text"
                      className="form-input"
                      placeholder="מילה1, מילה2, מילה3"
                    />
                  </div>
                </div>
              </div>

              {/* Open Graph */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Open Graph</h2>
                <div className="space-y-4">
                  <div>
                    <label className="form-label">OG Title</label>
                    <input
                      {...register('ogTitle')}
                      type="text"
                      className="form-input"
                    />
                  </div>
                  
                  <div>
                    <label className="form-label">OG Description</label>
                    <textarea
                      {...register('ogDescription')}
                      rows={3}
                      className="form-input"
                    />
                  </div>
                  
                  <div>
                    <label className="form-label">OG Image URL</label>
                    <input
                      {...register('ogImage')}
                      type="text"
                      dir="ltr"
                      className="form-input"
                    />
                  </div>
                </div>
              </div>
            </form>
          </div>
        ) : null}
      </div>

      {/* Component Selector Modal */}
      {showComponentSelector && (
        <ComponentSelector
          onSelect={handleAddComponent}
          onClose={() => {
            setShowComponentSelector(false)
            setSelectedComponentIndex(null)
          }}
        />
      )}
    </div>
  )
}
