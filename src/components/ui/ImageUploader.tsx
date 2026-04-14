'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Image as ImageIcon, Loader, FolderOpen } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '@/services/api'
import { cn } from '@/utils/cn'
import MediaGallery from './MediaGallery'

interface ImageUploaderProps {
  value: string | string[]
  onChange: (value: string | string[]) => void
  multiple?: boolean
  maxFiles?: number
  maxSize?: number // in MB
  label?: string
  preview?: boolean
}

export default function ImageUploader({
  value,
  onChange,
  multiple = false,
  maxFiles = 10,
  maxSize = 10,
  label = 'העלה תמונות',
  preview = true,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [showGallery, setShowGallery] = useState(false)

  const images = Array.isArray(value) ? value : value ? [value] : []

  const uploadImage = async (file: File): Promise<string | null> => {
    const formData = new FormData()
    formData.append('image', file)

    try {
      const response = await api.post('/media/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0
          setUploadProgress((prev) => ({ ...prev, [file.name]: percentCompleted }))
        },
      })

      return response.data.data.url
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(`שגיאה בהעלאת ${file.name}`)
      return null
    } finally {
      setUploadProgress((prev) => {
        const newProgress = { ...prev }
        delete newProgress[file.name]
        return newProgress
      })
    }
  }

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!multiple && acceptedFiles.length > 1) {
        toast.error('ניתן להעלות תמונה אחת בלבד')
        return
      }

      if (multiple && images.length + acceptedFiles.length > maxFiles) {
        toast.error(`ניתן להעלות עד ${maxFiles} תמונות`)
        return
      }

      setUploading(true)

      try {
        const uploadPromises = acceptedFiles.map(uploadImage)
        const urls = await Promise.all(uploadPromises)
        const validUrls = urls.filter((url): url is string => url !== null)

        if (validUrls.length > 0) {
          if (multiple) {
            const newImages = [...images, ...validUrls]
            onChange(newImages)
          } else {
            onChange(validUrls[0])
          }
          toast.success(`${validUrls.length} תמונות הועלו בהצלחה`)
        }
      } finally {
        setUploading(false)
      }
    },
    [images, multiple, maxFiles, onChange]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
    },
    maxSize: maxSize * 1024 * 1024,
    multiple,
  })

  const removeImage = (index: number) => {
    if (multiple) {
      const newImages = images.filter((_, i) => i !== index)
      onChange(newImages)
    } else {
      onChange('')
    }
  }

  const handleGallerySelect = (url: string) => {
    if (multiple) {
      const newImages = [...images, url]
      onChange(newImages)
    } else {
      onChange(url)
    }
  }

  return (
    <div className="space-y-4">
      {label && <label className="form-label">{label}</label>}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setShowGallery(true)}
          className="btn btn-outline btn-sm"
          disabled={uploading}
        >
          <FolderOpen className="ml-2 h-4 w-4" />
          בחר מהגלריה
        </button>
      </div>

      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
          isDragActive
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-gray-400',
          uploading && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} disabled={uploading} />
        
        {uploading ? (
          <div className="space-y-2">
            <Loader className="h-8 w-8 mx-auto text-primary-600 animate-spin" />
            <p className="text-sm text-gray-600">מעלה תמונות...</p>
            {Object.entries(uploadProgress).map(([filename, progress]) => (
              <div key={filename} className="text-xs text-gray-500">
                {filename}: {progress}%
              </div>
            ))}
          </div>
        ) : isDragActive ? (
          <div className="space-y-2">
            <Upload className="h-8 w-8 mx-auto text-primary-600" />
            <p className="text-sm text-gray-600">שחרר כדי להעלות</p>
          </div>
        ) : (
          <div className="space-y-2">
            <ImageIcon className="h-8 w-8 mx-auto text-gray-400" />
            <p className="text-sm text-gray-600">
              גרור תמונות לכאן או לחץ לבחירה
            </p>
            <p className="text-xs text-gray-500">
              {multiple ? `עד ${maxFiles} תמונות, ` : ''}עד {maxSize}MB לתמונה
            </p>
          </div>
        )}
      </div>

      {preview && images.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {images.map((url, index) => (
            <div key={index} className="relative group">
              <img
                src={url}
                alt={`תמונה ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Media Gallery Modal */}
      <MediaGallery
        isOpen={showGallery}
        onClose={() => setShowGallery(false)}
        onSelect={handleGallerySelect}
        multiple={multiple}
        selectedUrls={images}
      />
    </div>
  )
}
