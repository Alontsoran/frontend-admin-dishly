'use client'

import React, { useState } from 'react'
import { Search, X } from 'lucide-react'
import * as Icons from 'lucide-react'
import { cn } from '@/utils/cn'

interface IconPickerProps {
  value: string
  onChange: (iconName: string) => void
  label?: string
}

// כל האייקונים הזמינים
const availableIcons = {
  // בית ובנייה
  'home': Icons.Home,
  'building': Icons.Building,
  'building-2': Icons.Building2,
  'house': Icons.House,
  'warehouse': Icons.Warehouse,
  
  // כלי עבודה
  'hammer': Icons.Hammer,
  'wrench': Icons.Wrench,
  'screwdriver': Icons.Wrench,
  'drill': Icons.Drill,
  'pickaxe': Icons.Pickaxe,
  'construction': Icons.Construction,
  
  // צביעה ועיצוב
  'palette': Icons.Palette,
  'paint-bucket': Icons.PaintBucket,
  'brush': Icons.Brush,
  'spray-can': Icons.SprayCan,
  'pipette': Icons.Pipette,
  
  // חשמל ואינסטלציה
  'zap': Icons.Zap,
  'plug': Icons.Plug,
  'cable': Icons.Cable,
  'battery': Icons.Battery,
  'lightbulb': Icons.Lightbulb,
  'flame': Icons.Flame,
  
  // מים ואמבטיות
  'droplets': Icons.Droplets,
  'waves': Icons.Waves,
  'bath': Icons.Bath,
  'shower-head': Icons.ShowerHead,
  
  // מדידה ותכנון
  'ruler': Icons.Ruler,
  'compass': Icons.Compass,
  'triangle': Icons.Triangle,
  'square': Icons.Square,
  'circle': Icons.Circle,
  'pentagon': Icons.Pentagon,
  
  // חומרים
  'brick-wall': Icons.BrickWall,
  'fence': Icons.Fence,
  'tree-pine': Icons.TreePine,
  'mountain': Icons.Mountain,
  
  // אנשים ושירות
  'users': Icons.Users,
  'user': Icons.User,
  'hard-hat': Icons.HardHat,
  'shield': Icons.Shield,
  'shield-check': Icons.ShieldCheck,
  'award': Icons.Award,
  'star': Icons.Star,
  'thumbs-up': Icons.ThumbsUp,
  
  // זמן וכסף
  'clock': Icons.Clock,
  'calendar': Icons.Calendar,
  'calculator': Icons.Calculator,
  'coins': Icons.Coins,
  'credit-card': Icons.CreditCard,
  'banknote': Icons.Banknote,
  
  // תחבורה ומיקום
  'map-pin': Icons.MapPin,
  'map': Icons.Map,
  'truck': Icons.Truck,
  'car': Icons.Car,
  'bike': Icons.Bike,
  
  // טכנולוגיה
  'smartphone': Icons.Smartphone,
  'tablet': Icons.Tablet,
  'laptop': Icons.Laptop,
  'monitor': Icons.Monitor,
  'wifi': Icons.Wifi,
  
  // אחרים
  'heart': Icons.Heart,
  'gift': Icons.Gift,
  'trophy': Icons.Trophy,
  'target': Icons.Target,
  'trending-up': Icons.TrendingUp,
  'activity': Icons.Activity,
}

const iconNames = Object.keys(availableIcons)

export default function IconPicker({ value, onChange, label }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filteredIcons = iconNames.filter(name =>
    name.toLowerCase().includes(search.toLowerCase())
  )

  const selectedIcon = availableIcons[value as keyof typeof availableIcons]

  return (
    <div>
      {label && <label className="form-label">{label}</label>}
      
      {/* Icon Display & Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-3 w-full p-3 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
      >
        {selectedIcon ? (
          <>
            {React.createElement(selectedIcon, { className: "h-6 w-6 text-gray-600" })}
            <span className="text-gray-700">{value}</span>
          </>
        ) : (
          <span className="text-gray-500">בחר אייקון...</span>
        )}
      </button>

      {/* Icon Picker Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity"
              onClick={() => setIsOpen(false)}
            />
            
            <div className="relative w-full max-w-4xl transform overflow-hidden rounded-lg bg-white shadow-xl">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900">בחר אייקון</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Search */}
              <div className="p-6 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="חיפוש אייקון..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Icons Grid */}
              <div className="p-6 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-8 md:grid-cols-12 gap-3">
                  {filteredIcons.map((iconName) => {
                    const IconComponent = availableIcons[iconName as keyof typeof availableIcons]
                    const isSelected = value === iconName
                    
                    // Skip if icon component doesn't exist
                    if (!IconComponent) {
                      console.warn(`Icon "${iconName}" not found in availableIcons`)
                      return null
                    }
                    
                    return (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => {
                          onChange(iconName)
                          setIsOpen(false)
                        }}
                        className={cn(
                          'flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all hover:border-gray-400',
                          isSelected
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        )}
                        title={iconName}
                      >
                        {React.createElement(IconComponent, { className: "h-6 w-6 text-gray-600" })}
                        <span className="text-xs text-gray-500 truncate w-full text-center">
                          {iconName}
                        </span>
                      </button>
                    )
                  }).filter(Boolean)}
                </div>

                {filteredIcons.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    לא נמצאו אייקונים התואמים לחיפוש
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-4 text-center">
                <p className="text-sm text-gray-500">
                  נמצאו {filteredIcons.length} אייקונים מתוך {iconNames.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

