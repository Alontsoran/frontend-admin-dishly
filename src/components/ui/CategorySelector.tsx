'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Check, X, Plus, Palette } from 'lucide-react'
import { api } from '@/services/api'
import IconPicker from './IconPicker'
import { cn } from '@/utils/cn'

interface Category {
  id: string
  name: string
  slug: string
  description?: string
  is_active: boolean
  custom_icon?: string
  custom_color?: string
}

interface CategorySelectorProps {
  value: string[] // מערך של category IDs
  onChange: (categoryIds: string[]) => void
  multiple?: boolean
  label?: string
  allowCustomization?: boolean // אפשר עריכת אייקון וצבע
}

export default function CategorySelector({
  value = [],
  onChange,
  multiple = true,
  label = 'בחר קטגוריות',
  allowCustomization = true
}: CategorySelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [customizations, setCustomizations] = useState<Record<string, { icon?: string, color?: string }>>({})

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/categories', {
        params: { isActive: true, limit: 100 }
      })
      return response.data.data as Category[]
    },
  })

  const selectedCategories = categories.filter(cat => value.includes(cat.id))

  const handleToggleCategory = (categoryId: string) => {
    if (multiple) {
      const newValue = value.includes(categoryId)
        ? value.filter(id => id !== categoryId)
        : [...value, categoryId]
      onChange(newValue)
    } else {
      onChange([categoryId])
      setIsOpen(false)
    }
  }

  const handleCustomization = (categoryId: string, customization: { icon?: string, color?: string }) => {
    setCustomizations(prev => ({
      ...prev,
      [categoryId]: { ...prev[categoryId], ...customization }
    }))
  }

  return (
    <div>
      {label && <label className="form-label">{label}</label>}
      
      {/* Selected Categories Display */}
      <div className="mb-4">
        {selectedCategories.length > 0 ? (
          <div className="space-y-2">
            {selectedCategories.map((category) => {
              const customIcon = customizations[category.id]?.icon
              const customColor = customizations[category.id]?.color || '#2563EB'
              
              return (
                <div key={category.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                      style={{ backgroundColor: customColor }}
                    >
                      {customIcon ? '🎯' : category.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium">{category.name}</div>
                      <div className="text-sm text-gray-500">{category.slug}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {allowCustomization && (
                      <button
                        type="button"
                        onClick={() => setEditingCategory(category.id)}
                        className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                        title="עצב קטגוריה"
                      >
                        <Palette className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleToggleCategory(category.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="הסר"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-gray-500 text-sm p-3 bg-gray-50 rounded border-2 border-dashed">
            לא נבחרו קטגוריות
          </div>
        )}
      </div>

      {/* Add Categories Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-400 hover:bg-primary-50 transition-colors text-gray-600 hover:text-primary-600"
      >
        <Plus className="h-5 w-5" />
        <span>בחר קטגוריות להצגה</span>
      </button>

      {/* Categories Selection Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity"
              onClick={() => setIsOpen(false)}
            />
            
            <div className="relative w-full max-w-2xl transform overflow-hidden rounded-lg bg-white shadow-xl">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900">בחר קטגוריות</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Categories List */}
              <div className="max-h-96 overflow-y-auto p-6">
                {isLoading ? (
                  <div className="space-y-3">
                    {Array(6).fill(0).map((_, i) => (
                      <div key={i} className="animate-pulse flex items-center p-3 bg-gray-100 rounded-lg">
                        <div className="w-10 h-10 bg-gray-300 rounded-full mr-3"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-300 rounded w-1/3 mb-2"></div>
                          <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {categories.map((category) => {
                      const isSelected = value.includes(category.id)
                      
                      return (
                        <div
                          key={category.id}
                          className={cn(
                            'flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all',
                            isSelected
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          )}
                          onClick={() => handleToggleCategory(category.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                              <span className="text-primary-600 font-bold">
                                {category.name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{category.name}</div>
                              <div className="text-sm text-gray-500">/{category.slug}</div>
                              {category.description && (
                                <div className="text-xs text-gray-400 mt-1">
                                  {category.description}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {isSelected && (
                            <div className="bg-primary-600 text-white rounded-full p-1">
                              <Check className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                      )
                    })}
                    
                    {categories.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        אין קטגוריות זמינות
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 px-6 py-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    נבחרו {selectedCategories.length} מתוך {categories.length}
                  </span>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="btn btn-primary btn-sm"
                  >
                    אישור
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Customization Modal */}
      {editingCategory && allowCustomization && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity"
              onClick={() => setEditingCategory(null)}
            />
            
            <div className="relative w-full max-w-md transform overflow-hidden rounded-lg bg-white shadow-xl">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  עצב קטגוריה: {categories.find(c => c.id === editingCategory)?.name}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="form-label">אייקון מותאם</label>
                    <IconPicker
                      value={customizations[editingCategory]?.icon || ''}
                      onChange={(icon) => handleCustomization(editingCategory, { icon })}
                    />
                  </div>
                  
                  <div>
                    <label className="form-label">צבע מותאם</label>
                    <input
                      type="color"
                      value={customizations[editingCategory]?.color || '#2563EB'}
                      onChange={(e) => handleCustomization(editingCategory, { color: e.target.value })}
                      className="w-full h-12 rounded border border-gray-300"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 mt-6">
                  <button
                    onClick={() => setEditingCategory(null)}
                    className="btn btn-outline btn-sm"
                  >
                    ביטול
                  </button>
                  <button
                    onClick={() => setEditingCategory(null)}
                    className="btn btn-primary btn-sm"
                  >
                    שמור
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
