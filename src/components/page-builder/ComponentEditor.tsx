import { useState, useEffect, useRef } from 'react'
import { ComponentType } from '@/types'
import { getComponentDefinition } from './componentDefinitions'
import { Check, X } from 'lucide-react'
import RichTextEditor from '@/components/ui/RichTextEditor'
import ImageUploader from '@/components/ui/ImageUploader'
import IconPicker from '@/components/ui/IconPicker'
import CategorySelector from '@/components/ui/CategorySelector'

interface ComponentEditorProps {
  type: ComponentType
  props: Record<string, any>
  onSave: (props: Record<string, any>, shouldClose?: boolean) => void
  onCancel: () => void
  sourcePageId?: string // For preventing self-linking in RichTextEditor
}

export default function ComponentEditor({
  type,
  props,
  onSave,
  onCancel,
  sourcePageId,
}: ComponentEditorProps) {
  const [formData, setFormData] = useState(props)
  const definition = getComponentDefinition(type)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Auto-save with debounce (500ms delay) - DON'T close editor
  useEffect(() => {
    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Set new timeout to save after 500ms of inactivity
    saveTimeoutRef.current = setTimeout(() => {
      onSave(formData, false) // false = don't close editor
    }, 500)

    // Cleanup on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [formData, onSave])

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }))
  }

  const handleSave = () => {
    // Save immediately when clicking save button AND close editor
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    onSave(formData, true) // true = close editor
  }

  const renderField = (field: any) => {
    const value = formData[field.name] ?? field.defaultValue

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className="form-input"
          />
        )

      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            rows={field.rows || 3}
            className="form-input"
          />
        )
      
      case 'richtext':
        return (
          <RichTextEditor
            value={value || ''}
            onChange={(newValue) => handleFieldChange(field.name, newValue)}
            placeholder={field.placeholder}
            sourcePageId={sourcePageId}
          />
        )

      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            min={field.min}
            max={field.max}
            className="form-input"
          />
        )

      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="form-input"
          >
            <option value="">בחר...</option>
            {field.options?.map((option: any) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )

      case 'checkbox':
        return (
          <input
            type="checkbox"
            checked={value || false}
            onChange={(e) => handleFieldChange(field.name, e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
        )

      case 'color':
        return (
          <input
            type="color"
            value={value || '#000000'}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="h-10 w-full"
          />
        )

      case 'image':
        return (
          <ImageUploader
            value={value || ''}
            onChange={(url) => handleFieldChange(field.name, url)}
            multiple={false}
          />
        )

      case 'icon':
        return (
          <IconPicker
            value={value || ''}
            onChange={(iconName) => handleFieldChange(field.name, iconName)}
            label=""
          />
        )

      case 'categories':
        return (
          <CategorySelector
            value={value || []}
            onChange={(categoryIds) => handleFieldChange(field.name, categoryIds)}
            multiple={field.multiple !== false}
            label=""
            allowCustomization={true}
          />
        )

      case 'array':
        return (
          <ArrayField
            field={field}
            value={value || []}
            onChange={(newValue) => handleFieldChange(field.name, newValue)}
          />
        )

      default:
        return null
    }
  }

  if (!definition) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">אין הגדרות זמינות לרכיב זה</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">{definition.label}</h3>
      
      <div className="space-y-4">
        {definition.fields.map((field) => (
          <div key={field.name}>
            <label className="form-label">
              {field.label}
              {field.required && <span className="text-red-500 mr-1">*</span>}
            </label>
            {renderField(field)}
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <button
          onClick={onCancel}
          className="btn btn-outline btn-sm"
        >
          <X className="ml-2 h-4 w-4" />
          ביטול
        </button>
        <button
          onClick={handleSave}
          className="btn btn-primary btn-sm"
        >
          <Check className="ml-2 h-4 w-4" />
          שמור
        </button>
      </div>
    </div>
  )
}

interface ArrayFieldProps {
  field: any
  value: any[]
  onChange: (value: any[]) => void
}

function ArrayField({ field, value, onChange }: ArrayFieldProps) {
  const itemFields = field.fields || field.itemFields || []
  
  const handleAdd = () => {
    const newItem = itemFields.reduce((acc: any, f: any) => {
      acc[f.name] = f.defaultValue || ''
      return acc
    }, {})
    onChange([...value, newItem])
  }

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  const handleItemChange = (index: number, itemField: any, itemValue: any) => {
    const newValue = [...value]
    newValue[index] = {
      ...newValue[index],
      [itemField.name]: itemValue,
    }
    onChange(newValue)
  }

  return (
    <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
      {value.length === 0 && (
        <p className="text-gray-500 text-sm text-center py-4">
          אין {field.itemLabel || 'פריטים'} כרגע. לחץ על "הוסף" כדי להתחיל.
        </p>
      )}
      
      {value.map((item, index) => (
        <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3 bg-white">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-700">
              {field.itemLabel || 'פריט'} {index + 1}
            </h4>
            <button
              onClick={() => handleRemove(index)}
              className="text-red-600 text-sm hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
            >
              🗑️ הסר
            </button>
          </div>
          
          {itemFields.map((itemField: any) => (
            <div key={itemField.name}>
              <label className="text-sm text-gray-600">
                {itemField.label}
                {process.env.NODE_ENV === 'development' && (
                  <span className="text-xs text-purple-600 ml-2">
                    [type: {itemField.type}]
                  </span>
                )}
              </label>
              {itemField.type === 'image' ? (
                <ImageUploader
                  value={item[itemField.name] || ''}
                  onChange={(url) => handleItemChange(index, itemField, url)}
                  multiple={false}
                />
              ) : itemField.type === 'icon' ? (
                <IconPicker
                  value={item[itemField.name] || ''}
                  onChange={(iconName) => handleItemChange(index, itemField, iconName)}
                  label=""
                />
              ) : itemField.type === 'color' ? (
                <input
                  type="color"
                  value={item[itemField.name] || '#2563EB'}
                  onChange={(e) => handleItemChange(index, itemField, e.target.value)}
                  className="w-full h-12 rounded border border-gray-300"
                />
              ) : itemField.type === 'select' ? (
                <select
                  value={item[itemField.name] || ''}
                  onChange={(e) => handleItemChange(index, itemField, e.target.value)}
                  className="form-input"
                >
                  {itemField.options?.map((option: any) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : itemField.type === 'checkbox' ? (
                <label className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    checked={item[itemField.name] || false}
                    onChange={(e) => handleItemChange(index, itemField, e.target.checked)}
                    className="form-checkbox"
                  />
                  <span className="text-sm">{itemField.label}</span>
                </label>
              ) : itemField.type === 'textarea' ? (
                <textarea
                  value={item[itemField.name] || ''}
                  onChange={(e) => handleItemChange(index, itemField, e.target.value)}
                  rows={itemField.rows || 3}
                  placeholder={itemField.placeholder}
                  className="form-input"
                />
              ) : (
                <input
                  type={itemField.type === 'number' ? 'number' : 'text'}
                  value={item[itemField.name] || ''}
                  onChange={(e) => handleItemChange(index, itemField, e.target.value)}
                  placeholder={itemField.placeholder}
                  className="form-input"
                  min={itemField.min}
                  max={itemField.max}
                />
              )}
            </div>
          ))}
        </div>
      ))}
      
      <button
        onClick={handleAdd}
        className="btn btn-primary btn-sm w-full flex items-center justify-center gap-2"
      >
        ➕ הוסף {field.itemLabel || 'פריט'}
      </button>
    </div>
  )
}
