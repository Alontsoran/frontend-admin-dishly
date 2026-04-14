import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Upload, Image as ImageIcon, Trash2, Copy, Check } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { api } from '@/services/api'

interface MediaFile {
  id: string
  filename: string
  url: string
  size: number
  mime_type: string
  created_at: string
}

export default function MediaPage() {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)

  // Fetch media files
  const { data: mediaFiles = [], isLoading } = useQuery<MediaFile[]>({
    queryKey: ['media'],
    queryFn: async () => {
      const response = await api.get('/media')
      return response.data.data || []
    },
  })

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (files: FileList) => {
      const formData = new FormData()
      Array.from(files).forEach((file) => {
        formData.append('images', file) // Changed from 'files' to 'images' to match backend
      })
      const response = await api.post('/media/upload-gallery', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] })
      toast.success('התמונות הועלו בהצלחה!')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    },
    onError: (error: any) => {
      console.error('Upload error:', error)
      console.error('Error response:', error.response?.data)
      const errorMessage = error.response?.data?.message || error.message || 'שגיאה בהעלאת תמונות'
      toast.error(errorMessage)
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/media/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] })
      toast.success('התמונה נמחקה בהצלחה!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'שגיאה במחיקת תמונה')
    },
  })

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      await uploadMutation.mutateAsync(files)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק תמונה זו?')) return
    await deleteMutation.mutateAsync(id)
    setSelectedFiles(prev => prev.filter(fileId => fileId !== id))
  }

  const handleBulkDelete = async () => {
    if (selectedFiles.length === 0) return
    if (!confirm(`האם אתה בטוח שברצונך למחוק ${selectedFiles.length} תמונות?`)) return

    const deletePromises = selectedFiles.map(id => deleteMutation.mutateAsync(id))
    await Promise.all(deletePromises)
    setSelectedFiles([])
  }

  const toggleFileSelection = (id: string) => {
    setSelectedFiles(prev =>
      prev.includes(id) ? prev.filter(fileId => fileId !== id) : [...prev, id]
    )
  }

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url)
    setCopiedUrl(url)
    toast.success('הקישור הועתק ללוח!')
    setTimeout(() => setCopiedUrl(null), 2000)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">ניהול מדיה</h1>
        <p className="mt-2 text-gray-600">העלה וניהל תמונות לאתר</p>
      </div>

      {/* Upload Section */}
      <div className="mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">העלאת תמונות</h2>
            {selectedFiles.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                מחק {selectedFiles.length} נבחרות
              </button>
            )}
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors"
          >
            <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              לחץ להעלאת תמונות
            </p>
            <p className="text-sm text-gray-500">
              אפשר לבחור מספר תמונות בבת אחת (JPG, PNG, WebP, GIF)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {uploading && (
            <div className="mt-4 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="mt-2 text-sm text-gray-600">מעלה תמונות...</p>
            </div>
          )}
        </div>
      </div>

      {/* Media Grid */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          התמונות שלי ({mediaFiles.length})
        </h2>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-sm text-gray-600">טוען תמונות...</p>
          </div>
        ) : mediaFiles.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">אין תמונות עדיין</p>
            <p className="text-sm text-gray-400 mt-2">העלה תמונות כדי להתחיל</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {mediaFiles.map((file) => (
              <div
                key={file.id}
                className={`relative group rounded-lg overflow-hidden border-2 transition-all ${
                  selectedFiles.includes(file.id)
                    ? 'border-primary-500 ring-2 ring-primary-200'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Selection Checkbox */}
                <div className="absolute top-2 left-2 z-10">
                  <input
                    type="checkbox"
                    checked={selectedFiles.includes(file.id)}
                    onChange={() => toggleFileSelection(file.id)}
                    className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                  />
                </div>

                {/* Image */}
                <div className="aspect-square bg-gray-100">
                  <img
                    src={file.url}
                    alt={file.filename}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Overlay Actions */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => copyToClipboard(file.url)}
                    className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                    title="העתק קישור"
                  >
                    {copiedUrl === file.url ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <Copy className="w-5 h-5 text-gray-700" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(file.id)}
                    className="p-2 bg-white rounded-lg hover:bg-red-50 transition-colors"
                    title="מחק"
                  >
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </button>
                </div>

                {/* File Info */}
                <div className="p-2 bg-white">
                  <p className="text-xs text-gray-600 truncate" title={file.filename}>
                    {file.filename}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-400">
                      {formatFileSize(file.size)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDate(file.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
