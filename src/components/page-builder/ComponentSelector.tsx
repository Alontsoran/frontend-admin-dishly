import { useState } from 'react'
import { X, Search } from 'lucide-react'
import { getAllComponentDefinitions } from './componentDefinitions'
import { cn } from '@/utils/cn'

interface ComponentSelectorProps {
  onSelect: (type: string, props?: any) => void
  onClose: () => void
  homePageMode?: boolean
}

export default function ComponentSelector({ onSelect, onClose, homePageMode = false }: ComponentSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState<'all' | 'basic' | 'homepage'>('all')
  const definitions = getAllComponentDefinitions()

  // רכיבים מיוחדים לדף הבית
  const homepageComponents = ['hero', 'categoriesGrid', 'homeStats', 'popularPages', 'testimonials', 'processFlow', 'techNetwork']
  const basicComponents = ['pageHero', 'text', 'image', 'gallery', 'servicesList', 'contactForm', 'faq']

  const filteredDefinitions = definitions.filter((def) => {
    const matchesSearch = 
      def.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      def.type.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (!matchesSearch) return false

    if (activeCategory === 'homepage') {
      return homepageComponents.includes(def.type)
    } else if (activeCategory === 'basic') {
      return basicComponents.includes(def.type)
    }
    
    return true
  })

  const categories = [
    {
      name: 'הירו (כותרת עליונה)',
      types: ['pageHero', 'hero'],
    },
    {
      name: 'תוכן בסיסי',
      types: ['text', 'image', 'gallery', 'video', 'divider', 'spacer'],
    },
    {
      name: 'אינטראקטיבי',
      types: ['contactForm', 'faq', 'tabs', 'accordion', 'counter', 'progressBar'],
    },
    {
      name: 'שיווק ותהליכים',
      types: ['servicesList', 'testimonials', 'cta', 'processFlow', 'techNetwork', 'newsletter', 'socialLinks'],
    },
    {
      name: 'תוכן מועיל',
      types: ['tips', 'process', 'statistics', 'valuesSection', 'timelineSection'],
    },
    {
      name: 'ניווט',
      types: ['breadcrumbs', 'map'],
    },
    {
      name: 'דינמי',
      types: ['recentPosts', 'categories', 'categoriesGrid', 'homeStats', 'popularPages'],
    },
    {
      name: 'פריסה',
      types: ['columns'],
    },
  ]

  const handleSelect = (type: string) => {
    const definition = definitions.find((d) => d.type === type)
    if (definition) {
      onSelect(type, definition.defaultProps)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />
        
        <div className="relative w-full max-w-4xl transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900">בחר רכיב</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Category Tabs */}
          {homePageMode && (
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveCategory('all')}
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                    activeCategory === 'all'
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  כל הרכיבים
                </button>
                <button
                  onClick={() => setActiveCategory('homepage')}
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                    activeCategory === 'homepage'
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  רכיבי דף הבית
                </button>
                <button
                  onClick={() => setActiveCategory('basic')}
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                    activeCategory === 'basic'
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  רכיבים בסיסיים
                </button>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="border-b border-gray-200 p-4">
            <div className="relative">
              <input
                type="text"
                placeholder="חיפוש רכיבים..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input pr-10"
              />
              <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>

          {/* Component Grid */}
          <div className="max-h-[60vh] overflow-y-auto p-6">
            {searchTerm ? (
              <div className="grid grid-cols-3 gap-4">
                {filteredDefinitions.map((def) => {
                  const Icon = def.icon
                  return (
                    <button
                      key={def.type}
                      onClick={() => handleSelect(def.type)}
                      className="group flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-primary-500 hover:shadow-md transition-all"
                    >
                      <Icon className="h-8 w-8 text-gray-400 group-hover:text-primary-600 mb-2" />
                      <span className="text-sm font-medium text-gray-700 group-hover:text-primary-600">
                        {def.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="space-y-8">
                {categories.map((category) => (
                  <div key={category.name}>
                    <h3 className="mb-4 font-semibold text-gray-900">
                      {category.name}
                    </h3>
                    <div className="grid grid-cols-4 gap-3">
                      {category.types.map((type) => {
                        const def = definitions.find((d) => d.type === type)
                        if (!def) return null
                        const Icon = def.icon
                        return (
                          <button
                            key={type}
                            onClick={() => handleSelect(type)}
                            className="group flex flex-col items-center p-3 rounded-lg border border-gray-200 hover:border-primary-500 hover:shadow-md transition-all"
                          >
                            <Icon className="h-6 w-6 text-gray-400 group-hover:text-primary-600 mb-2" />
                            <span className="text-xs font-medium text-gray-700 group-hover:text-primary-600 text-center">
                              {def.label}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
