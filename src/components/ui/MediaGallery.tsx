'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { X, Search, Upload, Check } from 'lucide-react'
import { api } from '@/services/api'
import ImageUploader from './ImageUploader'
import { cn } from '@/utils/cn'

interface MediaItem {
  id: string
  url: string
  original_name: string
  alt_text?: string
  caption?: string
  size: number
  created_at: string
}

interface MediaGalleryProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (url: string) => void
  multiple?: boolean
  selectedUrls?: string[]
}

export default function MediaGallery({
  isOpen,
  onClose,
  onSelect,
  multiple = false,
  selectedUrls = [],
}: MediaGalleryProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedItems, setSelectedItems] = useState<string[]>(selectedUrls)
  const [activeTab, setActiveTab] = useState<'gallery' | 'upload'>('gallery')

  const { data: mediaData, isLoading, refetch } = useQuery({
    queryKey: ['media', searchTerm],
    queryFn: async () => {
      const response = await api.get('/media', {
        params: {
          page: 1,
          limit: 100,
          search: searchTerm || undefined,
        },
      })
      return response.data.data as MediaItem[]
    },
    enabled: isOpen,
  })

  const handleSelect = (url: string) => {
    if (multiple) {
      setSelectedItems(prev => 
        prev.includes(url) 
          ? prev.filter(item => item !== url)
          : [...prev, url]
      )
    } else {
      onSelect(url)
      onClose()
    }
  }

  const handleConfirmSelection = () => {
    if (multiple && selectedItems.length > 0) {
      selectedItems.forEach(url => onSelect(url))
      onClose()
    }
  }

  const handleUploadComplete = () => {
    refetch() // Refresh gallery after upload
    setActiveTab('gallery') // Switch back to gallery tab
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />
        
        <div className="relative w-full max-w-6xl transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {multiple ? 'בחר תמונות' : 'בחר תמונה'}
              </h2>
              
              {/* Tabs */}
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('gallery')}
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                    activeTab === 'gallery'
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:text-gray-800'
                  )}
                >
                  גלריה
                </button>
                <button
                  onClick={() => setActiveTab('upload')}
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                    activeTab === 'upload'
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:text-gray-800'
                  )}
                >
                  העלאה חדשה
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {multiple && selectedItems.length > 0 && (
                <button
                  onClick={handleConfirmSelection}
                  className="btn btn-primary btn-sm"
                >
                  <Check className="ml-2 h-4 w-4" />
                  בחר ({selectedItems.length})
                </button>
              )}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'gallery' ? (
              <>
                {/* Search */}
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="חיפוש תמונות..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="form-input pr-10"
                    />
                  </div>
                </div>

                {/* Gallery Grid */}
                {isLoading ? (
                  <div className="grid grid-cols-4 gap-4">
                    {Array(8).fill(0).map((_, i) => (
                      <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : mediaData && mediaData.length > 0 ? (
                  <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 max-h-96 overflow-y-auto">
                    {mediaData.map((item) => (
                      <div
                        key={item.id}
                        className={cn(
                          'relative aspect-square cursor-pointer rounded-lg overflow-hidden group border-2 transition-all',
                          selectedItems.includes(item.url)
                            ? 'border-primary-500 ring-2 ring-primary-200'
                            : 'border-gray-200 hover:border-gray-300'
                        )}
                        onClick={() => handleSelect(item.url)}
                      >
                        <img
                          src={item.url}
                          alt={item.alt_text || item.original_name}
                          className="w-full h-full object-cover"
                        />
                        
                        {/* Selection indicator */}
                        {selectedItems.includes(item.url) && (
                          <div className="absolute inset-0 bg-primary-500 bg-opacity-30 flex items-center justify-center">
                            <Check className="h-6 w-6 text-white" />
                          </div>
                        )}
                        
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all" />
                        
                        {/* Image info */}
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="truncate">{item.original_name}</p>
                          <p>{(item.size / 1024 / 1024).toFixed(1)}MB</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">אין תמונות בגלריה</p>
                    <button
                      onClick={() => setActiveTab('upload')}
                      className="mt-4 btn btn-primary btn-sm"
                    >
                      <Upload className="ml-2 h-4 w-4" />
                      העלה תמונה ראשונה
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div>
                <h3 className="text-lg font-semibold mb-4">העלה תמונות חדשות</h3>
                <ImageUploader
                  value={[]}
                  onChange={handleUploadComplete}
                  multiple={true}
                  maxFiles={10}
                  label=""
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
