import { useState, useMemo, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Upload, Image as ImageIcon, Edit2, Save, X, Search, ExternalLink } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { api } from '@/services/api'
import { Page, PageComponent } from '@/types'

interface ImageItem {
  id: string // Unique ID for this image instance
  url: string
  alt: string
  description: string
  pageId: string
  pageTitle: string
  pageSlug: string
  componentType: string
  componentId: string
  componentIndex: number
  imageIndex?: number // For gallery images
  fieldName?: string // The field name where the image is stored (e.g., 'src', 'backgroundImage', 'avatar')
  arrayFieldName?: string // If image is in an array, the array field name (e.g., 'images', 'members')
  isBroken?: boolean // Whether the image is broken/empty
  originalUrl?: string // Original URL before Next.js optimization
}

export default function ImagesManagerPage() {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<{ alt: string; description: string }>({ alt: '', description: '' })
  const [uploading, setUploading] = useState(false)
  const [uploadForm, setUploadForm] = useState<{ alt: string; description: string }>({ alt: '', description: '' })
  const [showBrokenOnly, setShowBrokenOnly] = useState(false)
  const [imageStatus, setImageStatus] = useState<Record<string, boolean>>({}) // Track which images are broken

  // Fetch all pages
  const { data: pages = [], isLoading } = useQuery<Page[]>({
    queryKey: ['pages'],
    queryFn: async () => {
      const response = await api.get('/pages')
      return response.data.data || []
    },
  })

  // Helper function to check if a string is an image URL
  const isImageUrl = (url: any): boolean => {
    if (typeof url !== 'string' || !url) return false
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp']
    const lowerUrl = url.toLowerCase()
    return imageExtensions.some(ext => lowerUrl.includes(ext)) || 
           lowerUrl.startsWith('http') && (lowerUrl.includes('image') || lowerUrl.includes('supabase'))
  }

  // Helper function to extract original URL from Next.js optimized URL
  const extractOriginalUrl = (url: string): string => {
    if (url.includes('/_next/image?')) {
      const match = url.match(/url=([^&]+)/)
      if (match) {
        return decodeURIComponent(match[1])
      }
    }
    return url
  }

  // Helper function to check if URL might be broken/empty
  const isPotentiallyBroken = (url: string): boolean => {
    if (!url || url.trim() === '') return true
    
    // Next.js optimized URLs that might be broken
    if (url.includes('/_next/image?')) {
      const originalUrl = extractOriginalUrl(url)
      // Check if it's a local path that might not exist
      if (originalUrl.startsWith('/img/') || originalUrl.startsWith('/images/')) {
        // These are local paths that might be broken
        return false // We'll check them with image load
      }
    }
    
    // Empty or placeholder URLs
    if (url === '#' || url === 'undefined' || url === 'null' || url.includes('placeholder')) {
      return true
    }
    
    return false
  }

  // Extract all images from pages
  const images = useMemo(() => {
    const imageList: ImageItem[] = []

    pages.forEach((page) => {
      const extractImages = (components: PageComponent[], parentIndex = 0, path: string[] = []) => {
        components.forEach((component, index) => {
          const componentId = component.id || `${page.id}-${parentIndex}-${index}`
          const currentPath = [...path, component.type]

          // Helper to extract image from any object
          const extractImageFromObject = (obj: any, arrayFieldName: string | undefined, context: string) => {
            if (obj && typeof obj === 'object') {
              // Check common image field names
              const imageFields = ['src', 'url', 'image', 'avatar', 'backgroundImage', 'background', 'photo', 'picture']
              
              for (const field of imageFields) {
                const value = obj[field]
                if (value && isImageUrl(value)) {
                  const originalUrl = extractOriginalUrl(value)
                  imageList.push({
                    id: `${componentId}-${context}-${field}-${Date.now()}-${Math.random()}`,
                    url: value,
                    originalUrl: originalUrl !== value ? originalUrl : undefined,
                    alt: obj.alt || obj.altText || obj.title || '',
                    description: obj.caption || obj.description || obj.desc || '',
                    pageId: page.id,
                    pageTitle: page.title,
                    pageSlug: page.slug,
                    componentType: component.type,
                    componentId: componentId,
                    componentIndex: index,
                    fieldName: field,
                    arrayFieldName: arrayFieldName,
                    isBroken: isPotentiallyBroken(value),
                  })
                }
              }
            }
          }

          // Extract images from component props
          if (component.props) {
            // Direct image fields
            extractImageFromObject(component.props, undefined, 'props')

            // Check all props for image URLs
            Object.keys(component.props).forEach((key) => {
              const value = component.props[key]
              
              // If it's a direct image URL
              if (isImageUrl(value)) {
                const originalUrl = extractOriginalUrl(value)
                imageList.push({
                  id: `${componentId}-${key}-${Date.now()}-${Math.random()}`,
                  url: value,
                  originalUrl: originalUrl !== value ? originalUrl : undefined,
                  alt: component.props[`${key}Alt`] || component.props.alt || '',
                  description: component.props[`${key}Description`] || component.props.caption || component.props.description || '',
                  pageId: page.id,
                  pageTitle: page.title,
                  pageSlug: page.slug,
                  componentType: component.type,
                  componentId: componentId,
                  componentIndex: index,
                  fieldName: key,
                  isBroken: isPotentiallyBroken(value),
                })
              }
              
              // If it's an array, check each item
              if (Array.isArray(value)) {
                value.forEach((item: any, itemIndex: number) => {
                  if (typeof item === 'object' && item !== null) {
                    extractImageFromObject(item, key, `array-${itemIndex}`)
                    
                    // Also check all fields in the object
                    Object.keys(item).forEach((itemKey) => {
                      if (isImageUrl(item[itemKey])) {
                        const originalUrl = extractOriginalUrl(item[itemKey])
                        imageList.push({
                          id: `${componentId}-${key}-${itemIndex}-${itemKey}-${Date.now()}-${Math.random()}`,
                          url: item[itemKey],
                          originalUrl: originalUrl !== item[itemKey] ? originalUrl : undefined,
                          alt: item.alt || item.altText || item[`${itemKey}Alt`] || '',
                          description: item.caption || item.description || item.desc || item[`${itemKey}Description`] || '',
                          pageId: page.id,
                          pageTitle: page.title,
                          pageSlug: page.slug,
                          componentType: component.type,
                          componentId: componentId,
                          componentIndex: index,
                          imageIndex: itemIndex,
                          fieldName: itemKey,
                          arrayFieldName: key,
                          isBroken: isPotentiallyBroken(item[itemKey]),
                        })
                      }
                    })
                  } else if (isImageUrl(item)) {
                    const originalUrl = extractOriginalUrl(item)
                    imageList.push({
                      id: `${componentId}-${key}-${itemIndex}-${Date.now()}-${Math.random()}`,
                      url: item,
                      originalUrl: originalUrl !== item ? originalUrl : undefined,
                      alt: '',
                      description: '',
                      pageId: page.id,
                      pageTitle: page.title,
                      pageSlug: page.slug,
                      componentType: component.type,
                      componentId: componentId,
                      componentIndex: index,
                      imageIndex: itemIndex,
                      arrayFieldName: key,
                      isBroken: isPotentiallyBroken(item),
                    })
                  }
                })
              }
            })
          }

          // Recursively check children
          if (component.children && component.children.length > 0) {
            extractImages(component.children, index, currentPath)
          }
        })
      }

      extractImages(page.content || [])
    })

    // Remove duplicates based on URL and component
    const uniqueImages = imageList.filter((img, index, self) =>
      index === self.findIndex((i) => 
        i.url === img.url && 
        i.pageId === img.pageId && 
        i.componentId === img.componentId &&
        (i.imageIndex === undefined || i.imageIndex === img.imageIndex)
      )
    )

    return uniqueImages
  }, [pages])

  // Filter images by search term and broken status
  const filteredImages = useMemo(() => {
    let filtered = images

    // Filter by broken status
    if (showBrokenOnly) {
      filtered = filtered.filter((img) => img.isBroken || imageStatus[img.id] === false)
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (img) =>
          img.url.toLowerCase().includes(term) ||
          (img.originalUrl && img.originalUrl.toLowerCase().includes(term)) ||
          img.alt.toLowerCase().includes(term) ||
          img.description.toLowerCase().includes(term) ||
          img.pageTitle.toLowerCase().includes(term)
      )
    }

    return filtered
  }, [images, searchTerm, showBrokenOnly, imageStatus])

  // Update image mutation
  const updateImageMutation = useMutation({
    mutationFn: async ({ imageItem, alt, description }: { imageItem: ImageItem; alt: string; description: string }) => {
      // Get the page
      const page = pages.find((p) => p.id === imageItem.pageId)
      if (!page) throw new Error('Page not found')

      // Clone the content array
      const updatedContent = JSON.parse(JSON.stringify(page.content))

      // Find and update the component
      const updateComponent = (components: PageComponent[]): boolean => {
        for (let i = 0; i < components.length; i++) {
          const component = components[i]
          
          // Check if this is the component we're looking for
          const componentMatches = (component.id === imageItem.componentId) || 
                                  (i === imageItem.componentIndex && component.type === imageItem.componentType)

          if (componentMatches && component.props) {
            // If image is in an array
            if (imageItem.arrayFieldName && imageItem.imageIndex !== undefined) {
              const array = component.props[imageItem.arrayFieldName]
              if (Array.isArray(array) && array[imageItem.imageIndex]) {
                const item = array[imageItem.imageIndex]
                if (imageItem.fieldName && item[imageItem.fieldName] === imageItem.url) {
                  // Update alt and description in the item
                  item.alt = alt
                  item.altText = alt
                  item.caption = description
                  item.description = description
                  item.desc = description
                  return true
                } else if (!imageItem.fieldName && item === imageItem.url) {
                  // Direct URL in array - can't update alt/desc for this case
                  return true
                }
              }
            }
            
            // If image is a direct field
            if (imageItem.fieldName && component.props[imageItem.fieldName] === imageItem.url) {
              // Try to update alt/desc fields
              if (component.props[`${imageItem.fieldName}Alt`] !== undefined) {
                component.props[`${imageItem.fieldName}Alt`] = alt
              }
              if (component.props[`${imageItem.fieldName}Description`] !== undefined) {
                component.props[`${imageItem.fieldName}Description`] = description
              }
              // Also update common alt/desc fields
              if (component.props.alt !== undefined) component.props.alt = alt
              if (component.props.caption !== undefined) component.props.caption = description
              if (component.props.description !== undefined) component.props.description = description
              return true
            }
            
            // Fallback: search all props for the URL
            for (const key in component.props) {
              if (component.props[key] === imageItem.url) {
                // Found the URL, try to update alt/desc
                if (component.props[`${key}Alt`] !== undefined) {
                  component.props[`${key}Alt`] = alt
                }
                if (component.props[`${key}Description`] !== undefined) {
                  component.props[`${key}Description`] = description
                }
                if (component.props.alt !== undefined) component.props.alt = alt
                if (component.props.caption !== undefined) component.props.caption = description
                return true
              }
            }
          }

          // Check children
          if (component.children && updateComponent(component.children)) {
            return true
          }
        }
        return false
      }

      updateComponent(updatedContent)

      // Update the page
      const response = await api.put(`/pages/${imageItem.pageId}`, {
        content: updatedContent,
      })

      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages'] })
      setEditingId(null)
      toast.success('התמונה עודכנה בהצלחה!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'שגיאה בעדכון תמונה')
    },
  })

  // Upload image mutation
  const uploadImageMutation = useMutation({
    mutationFn: async ({ file, alt, description }: { file: File; alt: string; description: string }) => {
      const formData = new FormData()
      formData.append('image', file)
      if (alt) formData.append('altText', alt)
      if (description) formData.append('caption', description)

      const response = await api.post('/media/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] })
      queryClient.invalidateQueries({ queryKey: ['pages'] })
      setUploadForm({ alt: '', description: '' })
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      toast.success('התמונה הועלתה בהצלחה!')
    },
    onError: (error: any) => {
      setUploading(false)
      toast.error(error.response?.data?.message || 'שגיאה בהעלאת תמונה')
    },
  })

  const handleEdit = (image: ImageItem) => {
    setEditingId(image.id)
    setEditForm({
      alt: image.alt,
      description: image.description,
    })
  }

  const handleSave = (image: ImageItem) => {
    updateImageMutation.mutate({
      imageItem: image,
      alt: editForm.alt,
      description: editForm.description,
    })
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditForm({ alt: '', description: '' })
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!uploadForm.alt.trim()) {
      toast.error('נא להזין טקסט חלופי (ALT)')
      return
    }

    setUploading(true)
    try {
      await uploadImageMutation.mutateAsync({
        file,
        alt: uploadForm.alt,
        description: uploadForm.description,
      })
    } finally {
      setUploading(false)
    }
  }

  const handlePageClick = (slug: string) => {
    window.open(`/${slug}`, '_blank')
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">ניהול תמונות מכל העמודים</h1>
        <p className="mt-2 text-gray-600">צפה וערוך את כל התמונות מכל העמודים במקום אחד</p>
      </div>

      {/* Upload Section */}
      <div className="mb-6 bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">העלאת תמונה חדשה</h2>
        <div
          onDrop={(e) => {
            e.preventDefault()
            const file = e.dataTransfer.files[0]
            if (file && file.type.startsWith('image/')) {
              if (!uploadForm.alt.trim()) {
                toast.error('נא להזין טקסט חלופי (ALT) לפני העלאת התמונה')
                return
              }
              setUploading(true)
              uploadImageMutation.mutate({
                file,
                alt: uploadForm.alt,
                description: uploadForm.description,
              })
            }
          }}
          onDragOver={(e) => e.preventDefault()}
          onDragEnter={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors mb-4"
        >
          <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-700 mb-2">
            גרור תמונה לכאן או לחץ להעלאה
          </p>
          <p className="text-sm text-gray-500">
            JPG, PNG, WebP, GIF (עד 10MB)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">טקסט חלופי (ALT) *</label>
            <input
              type="text"
              value={uploadForm.alt}
              onChange={(e) => setUploadForm({ ...uploadForm, alt: e.target.value })}
              placeholder="תיאור התמונה (חובה)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">תיאור (DESC)</label>
            <input
              type="text"
              value={uploadForm.description}
              onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
              placeholder="תיאור מפורט (אופציונלי)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
        {uploading && (
          <div className="mt-4 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-sm text-gray-600">מעלה תמונה...</p>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="mb-4 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="חפש תמונות לפי URL, ALT, תיאור או שם עמוד..."
            className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
          <input
            type="checkbox"
            checked={showBrokenOnly}
            onChange={(e) => setShowBrokenOnly(e.target.checked)}
            className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
          />
          <span className="text-sm font-medium text-gray-700">הצג רק תמונות ריקות/לא תקינות</span>
        </label>
      </div>

      {/* Images Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  תמונה
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  URL
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ALT
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  תיאור
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  עמוד
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  סוג רכיב
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  פעולות
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    <p className="mt-2 text-sm text-gray-600">טוען תמונות...</p>
                  </td>
                </tr>
              ) : filteredImages.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <ImageIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">לא נמצאו תמונות</p>
                  </td>
                </tr>
              ) : (
                filteredImages.map((image) => {
                  const isBroken = image.isBroken || imageStatus[image.id] === false
                  return (
                    <tr 
                      key={image.id} 
                      className={`hover:bg-gray-50 ${isBroken ? 'bg-red-50 border-l-4 border-red-500' : ''}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 ${isBroken ? 'border-2 border-red-500' : ''}`}>
                          <img
                            src={image.originalUrl || image.url}
                            alt={image.alt || 'תמונה'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              setImageStatus((prev) => ({ ...prev, [image.id]: false }))
                              target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23fee2e2" width="100" height="100"/%3Ctext fill="%23dc2626" font-family="sans-serif" font-size="12" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3Eתמונה ריקה%3C/text%3E%3C/svg%3E'
                            }}
                            onLoad={() => {
                              setImageStatus((prev) => ({ ...prev, [image.id]: true }))
                            }}
                          />
                          {isBroken && (
                            <div className="absolute top-1 right-1 bg-red-500 text-white text-xs px-1 rounded z-10">
                              ריקה
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <p className={`text-sm truncate ${isBroken ? 'text-red-600 font-semibold' : 'text-gray-900'}`} title={image.url}>
                            {image.originalUrl || image.url}
                          </p>
                          {image.originalUrl && image.originalUrl !== image.url && (
                            <p className="text-xs text-gray-500 truncate mt-1" title={image.url}>
                              Next.js: {image.url.substring(0, 50)}...
                            </p>
                          )}
                        </div>
                      </td>
                    <td className="px-6 py-4">
                      {editingId === image.id ? (
                        <input
                          type="text"
                          value={editForm.alt}
                          onChange={(e) => setEditForm({ ...editForm, alt: e.target.value })}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          autoFocus
                        />
                      ) : (
                        <p className="text-sm text-gray-900">{image.alt || '-'}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === image.id ? (
                        <input
                          type="text"
                          value={editForm.description}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-sm text-gray-900">{image.description || '-'}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handlePageClick(image.pageSlug)}
                        className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-800"
                      >
                        {image.pageTitle}
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {image.componentType === 'image' ? 'תמונה' : image.componentType === 'gallery' ? 'גלריה' : 'הירו'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {editingId === image.id ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleSave(image)}
                            disabled={updateImageMutation.isPending}
                            className="text-green-600 hover:text-green-900"
                          >
                            <Save className="w-5 h-5" />
                          </button>
                          <button
                            onClick={handleCancel}
                            className="text-red-600 hover:text-red-900"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEdit(image)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                      )}
                    </td>
                  </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        {filteredImages.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              סה"כ {filteredImages.length} תמונות מתוך {images.length}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

