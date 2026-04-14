'use client'

import { useState } from 'react'
import { Upload, Link as LinkIcon, X } from 'lucide-react'
import { cn } from '@/utils/cn'

interface SimpleImagePickerProps {
  value: string
  onChange: (value: string) => void
  label?: string
}

export default function SimpleImagePicker({
  value,
  onChange,
  label = 'תמונה',
}: SimpleImagePickerProps) {
  const [mode, setMode] = useState<'url' | 'upload'>('url')
  const [urlInput, setUrlInput] = useState(value || '')

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim())
    }
  }

  const clearImage = () => {
    onChange('')
    setUrlInput('')
  }

  return (
    <div className="space-y-3">
      {label && <label className="form-label">{label}</label>}

      {/* Mode Toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode('url')}
          className={cn(
            'px-3 py-2 text-sm rounded-lg transition-colors',
            mode === 'url'
              ? 'bg-primary-100 text-primary-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          <LinkIcon className="h-4 w-4 ml-1" />
          URL
        </button>
        <button
          type="button"
          onClick={() => setMode('upload')}
          className={cn(
            'px-3 py-2 text-sm rounded-lg transition-colors',
            mode === 'upload'
              ? 'bg-primary-100 text-primary-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          <Upload className="h-4 w-4 ml-1" />
          העלאה
        </button>
      </div>

      {/* Current Image */}
      {value && (
        <div className="relative inline-block">
          <img
            src={value}
            alt="תמונה נבחרת"
            className="h-32 w-32 object-cover rounded-lg border"
          />
          <button
            type="button"
            onClick={clearImage}
            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* URL Mode */}
      {mode === 'url' && (
        <div className="flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="form-input flex-1"
            dir="ltr"
          />
          <button
            type="button"
            onClick={handleUrlSubmit}
            className="btn btn-primary btn-sm"
            disabled={!urlInput.trim()}
          >
            הוסף
          </button>
        </div>
      )}

      {/* Upload Mode */}
      {mode === 'upload' && (
        <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
          <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
          <p className="text-sm text-gray-600">
            העלאת תמונות זמנית לא זמינה
          </p>
          <p className="text-xs text-gray-500 mt-1">
            השתמש ב-URL עד שנתקן את ה-Storage
          </p>
        </div>
      )}
    </div>
  )
}
