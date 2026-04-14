import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  ChevronRight,
  FolderTree,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '@/services/api'
import { Category } from '@/types'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { cn } from '@/utils/cn'
import { slugify } from '@/utils/slugify'
import { PUBLIC_SITE_URL } from '@/config/site'

const categorySchema = z.object({
  name: z.string().min(1, 'שם חובה'),
  slug: z.string().min(1, 'כתובת URL חובה').regex(/^[a-zA-Z0-9\u0590-\u05FF\-]+$/, 'הכתובת יכולה להכיל אותיות בעברית או אנגלית, מספרים ומקפים'),
  description: z.string().optional(),
  parentId: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  orderIndex: z.number().optional(),
})

type CategoryFormData = z.infer<typeof categorySchema>

export default function CategoriesPage() {
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
  })

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/categories')
      return response.data.data as Category[]
    },
  })

  // Fetch pages to show count per category
  const { data: pagesData } = useQuery({
    queryKey: ['pages', 'all'],
    queryFn: async () => {
      const response = await api.get('/pages', { params: { limit: 1000 } })
      return response.data.data
    },
  })

  // Get page count for each category
  const getCategoryPageCount = (categoryId: string) => {
    if (!pagesData) return 0
    return pagesData.filter((page: any) => page.category_id === categoryId).length
  }

  // Get pages for a category
  const getCategoryPages = (categoryId: string) => {
    if (!pagesData) return []
    return pagesData.filter((page: any) => page.category_id === categoryId)
  }

  // Toggle category expansion
  const toggleCategoryExpansion = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const createMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      // Map frontend fields to backend fields
      const payload = {
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        parentId: data.parentId || null,
        metaTitle: data.metaTitle || null,
        metaDescription: data.metaDescription || null,
        orderIndex: data.orderIndex || 0,
      };
      
      if (editingCategory) {
        return api.patch(`/categories/${editingCategory.id}`, payload)
      } else {
        return api.post('/categories', payload)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success(editingCategory ? 'הקטגוריה עודכנה בהצלחה' : 'הקטגוריה נוצרה בהצלחה')
      setShowForm(false)
      setEditingCategory(null)
      reset()
    },
    onError: () => {
      toast.error('אירעה שגיאה')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/categories/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('הקטגוריה נמחקה בהצלחה')
    },
    onError: () => {
      toast.error('אירעה שגיאה במחיקת הקטגוריה')
    },
  })

  const toggleStatusMutation = useMutation({
    mutationFn: async (id: string) => {
      const category = categories?.find(c => c.id === id);
      if (category) {
        return api.patch(`/categories/${id}`, {
          is_active: !category.is_active
        });
      }
      throw new Error('Category not found');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['pages', 'all'] })
      toast.success('סטטוס הקטגוריה עודכן')
    },
  })

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setValue('name', category.name)
    setValue('slug', category.slug)
    setValue('description', category.description || '')
    setValue('parentId', category.parent_id || '')
    setValue('metaTitle', category.meta_title || '')
    setValue('metaDescription', category.meta_description || '')
    setValue('orderIndex', category.order_index || 0)
    setShowForm(true)
  }

  const handleDelete = (category: Category) => {
    if (window.confirm(`האם אתה בטוח שברצונך למחוק את הקטגוריה "${category.name}"?`)) {
      deleteMutation.mutate(category.id)
    }
  }

  const onSubmit = (data: CategoryFormData) => {
    // Convert empty parentId to undefined
    const submitData = {
      ...data,
      parentId: data.parentId || undefined
    }
    createMutation.mutate(submitData)
  }

  const buildCategoryTree = (categories: Category[]): Category[] => {
    const categoryMap = new Map<string, Category>()
    const rootCategories: Category[] = []

    // First pass: create map
    categories.forEach((cat) => {
      categoryMap.set(cat.id, { ...cat, children: [] })
    })

    // Second pass: build tree
    categories.forEach((cat) => {
      const category = categoryMap.get(cat.id)!
      if (cat.parent_id) {
        const parent = categoryMap.get(cat.parent_id)
        if (parent) {
          parent.children = parent.children || []
          parent.children.push(category)
        }
      } else {
        rootCategories.push(category)
      }
    })

    return rootCategories
  }

  const renderCategory = (category: Category, level = 0) => (
    <div key={category.id}>
      <div
        className={cn(
          'flex items-center justify-between p-3 hover:bg-gray-50',
          level > 0 && 'border-r-2 border-gray-200'
        )}
        style={{ paddingRight: `${level * 2 + 1}rem` }}
      >
        <div className="flex items-center flex-1">
          {category.children && category.children.length > 0 && (
            <ChevronRight className="h-4 w-4 text-gray-400 ml-2" />
          )}
          <FolderTree className="h-4 w-4 text-gray-400 ml-2" />
          <div className="flex-1">
            <div className="font-medium text-gray-900">{category.name}</div>
            <div className="text-sm text-gray-500">/{category.slug}</div>
            <button
              onClick={() => toggleCategoryExpansion(category.id)}
              className="text-xs text-blue-600 mt-1 hover:text-blue-800 underline"
            >
              {getCategoryPageCount(category.id)} דפים קשורים
              {expandedCategories.has(category.id) ? ' ▼' : ' ►'}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'badge',
              category.is_active ? 'badge-success' : 'badge-warning'
            )}
          >
            {category.is_active ? 'פעיל' : 'לא פעיל'}
          </span>
          <button
            onClick={() => toggleStatusMutation.mutate(category.id)}
            className="text-gray-600 hover:text-gray-900"
            title={category.is_active ? 'הסתר' : 'הפעל'}
          >
            {category.is_active ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={() => handleEdit(category)}
            className="text-primary-600 hover:text-primary-900"
            title="ערוך"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(category)}
            className="text-red-600 hover:text-red-900"
            title="מחק"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      {/* Show linked pages if category is expanded */}
      {expandedCategories.has(category.id) && (
        <div className="ml-8 mt-2 space-y-1">
          {getCategoryPages(category.id).map((page: any) => (
            <div key={page.id} className="flex items-center justify-between p-2 bg-blue-50 rounded border-r-4 border-blue-200">
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">{page.title}</div>
                <div className="text-xs text-gray-500">/{page.slug}</div>
              </div>
              <div className="flex items-center gap-1">
                <span className={`badge ${page.is_published ? 'badge-success' : 'badge-warning'}`}>
                  {page.is_published ? 'פורסם' : 'טיוטה'}
                </span>
                <a
                  href={`${PUBLIC_SITE_URL}/${page.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-xs"
                  title="צפה באתר"
                >
                  <Eye className="h-3 w-3" />
                </a>
              </div>
            </div>
          ))}
          {getCategoryPages(category.id).length === 0 && (
            <div className="text-xs text-gray-500 italic p-2">
              אין דפים קשורים לקטגוריה זו
            </div>
          )}
        </div>
      )}
      
      {category.children?.map((child) => renderCategory(child, level + 1))}
    </div>
  )

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const categoryTree = buildCategoryTree(categories || [])

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ניהול קטגוריות</h1>
          <p className="mt-1 text-sm text-gray-600">
            ניהול קטגוריות התוכן באתר
          </p>
        </div>
        <button
          onClick={() => {
            setEditingCategory(null)
            reset()
            setShowForm(true)
          }}
          className="btn btn-primary btn-md"
        >
          <Plus className="ml-2 h-4 w-4" />
          קטגוריה חדשה
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="mb-6 card">
          <div className="card-header">
            <h2 className="text-lg font-semibold">
              {editingCategory ? 'עריכת קטגוריה' : 'יצירת קטגוריה חדשה'}
            </h2>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="card-body space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="form-label">שם *</label>
                <input
                  {...register('name')}
                  type="text"
                  className={cn('form-input', errors.name && 'border-red-300')}
                  onChange={(e) => {
                    const value = e.target.value;
                    setValue('name', value);
                    // Auto-generate slug from name if it's a new category
                    if (!editingCategory && value) {
                      setValue('slug', slugify(value));
                    }
                  }}
                />
                {errors.name && (
                  <p className="form-error">{errors.name.message}</p>
                )}
              </div>
              
              <div>
                <label className="form-label">כתובת URL *</label>
                <input
                  {...register('slug')}
                  type="text"
                  dir="ltr"
                  className={cn('form-input', errors.slug && 'border-red-300')}
                />
                {errors.slug && (
                  <p className="form-error">{errors.slug.message}</p>
                )}
              </div>
              
              <div>
                <label className="form-label">קטגוריית אב</label>
                <select {...register('parentId')} className="form-input">
                  <option value="">ללא (קטגוריה ראשית)</option>
                  {categories?.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="form-label">סדר תצוגה</label>
                <input
                  {...register('orderIndex', { valueAsNumber: true })}
                  type="number"
                  className="form-input"
                  defaultValue={0}
                />
              </div>
            </div>

            <div>
              <label className="form-label">תיאור</label>
              <textarea
                {...register('description')}
                rows={3}
                className="form-input"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="form-label">Meta Title</label>
                <input
                  {...register('metaTitle')}
                  type="text"
                  className="form-input"
                />
              </div>
              
              <div>
                <label className="form-label">Meta Description</label>
                <textarea
                  {...register('metaDescription')}
                  rows={2}
                  className="form-input"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingCategory(null)
                  reset()
                }}
                className="btn btn-outline btn-sm"
              >
                ביטול
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="btn btn-primary btn-sm"
              >
                {createMutation.isPending ? 'שומר...' : 'שמור'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories Tree */}
      {categoryTree.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <FolderTree className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">אין קטגוריות</h3>
          <p className="mt-1 text-sm text-gray-500">
            התחל ביצירת הקטגוריה הראשונה שלך
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          {categoryTree.map((category) => renderCategory(category))}
        </div>
      )}
    </div>
  )
}
