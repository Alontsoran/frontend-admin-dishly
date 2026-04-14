import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Edit2, Copy, Trash2, Plus, Eye, EyeOff } from 'lucide-react'
import { PageComponent } from '@/types'
import ComponentPreview from './ComponentPreview'
import ComponentEditor from './ComponentEditor'
import { cn } from '@/utils/cn'
import { useState } from 'react'

interface SortableComponentProps {
  id: string
  component: PageComponent
  index: number
  onEdit: (props: any, shouldClose?: boolean) => void
  onDelete: () => void
  onDuplicate: () => void
  onAddAfter: () => void
  onToggleVisibility?: (isVisible: boolean) => void
  sourcePageId?: string // For preventing self-linking
}

export default function SortableComponent({
  id,
  component,
  index: _index,
  onEdit,
  onDelete,
  onDuplicate,
  onAddAfter,
  onToggleVisibility,
  sourcePageId,
}: SortableComponentProps) {
  const [isEditing, setIsEditing] = useState(false)
  const isVisible = component.isVisible !== false // Default to true
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleSave = (newProps: any, shouldClose: boolean = false) => {
    onEdit(newProps, shouldClose)
    if (shouldClose) {
      setIsEditing(false)
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative bg-white rounded-lg border transition-all',
        isDragging ? 'opacity-50 shadow-lg' : 'shadow-sm hover:shadow-md',
        isEditing ? 'border-primary-500' : 'border-gray-200',
        !isVisible && 'opacity-40 bg-gray-50 border-amber-300'
      )}
    >
      {/* Drag Handle and Actions - Always visible for better UX */}
      <div className="absolute -top-3 left-3 flex gap-2 bg-white border border-gray-200 rounded-lg shadow-md p-2 opacity-90 group-hover:opacity-100 transition-all duration-200 z-10">
        <button
          className="drag-handle p-2 hover:bg-gray-100 rounded-md transition-colors tooltip"
          {...attributes}
          {...listeners}
          title="גרור לסידור מחדש"
        >
          <GripVertical className="h-4 w-4 text-gray-500" />
        </button>
        {onToggleVisibility && (
          <button
            onClick={() => onToggleVisibility(!isVisible)}
            className={cn(
              "p-2 rounded-md transition-colors",
              isVisible
                ? "hover:bg-gray-50 text-gray-600"
                : "bg-amber-100 text-amber-700 hover:bg-amber-200"
            )}
            title={isVisible ? 'הסתר רכיב' : 'הצג רכיב'}
          >
            {isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
        )}
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={cn(
            "p-2 rounded-md transition-colors",
            isEditing 
              ? "bg-blue-100 text-blue-700 hover:bg-blue-200" 
              : "hover:bg-blue-50 text-blue-600"
          )}
          title={isEditing ? 'ביטול עריכה' : 'ערוך רכיב'}
        >
          <Edit2 className="h-4 w-4" />
        </button>
        <button
          onClick={onDuplicate}
          className="p-2 hover:bg-green-50 rounded-md transition-colors text-green-600"
          title="שכפל רכיב"
        >
          <Copy className="h-4 w-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 hover:bg-red-50 rounded-md transition-colors text-red-600"
          title="מחק רכיב"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Component Content */}
      <div className="p-4 lg:p-6">
        {isEditing ? (
          <ComponentEditor
            type={component.type}
            props={component.props}
            onSave={handleSave}
            onCancel={() => setIsEditing(false)}
            sourcePageId={sourcePageId}
          />
        ) : (
          <ComponentPreview
            key={`${component.id}-${JSON.stringify(component.props)}`}
            type={component.type}
            props={component.props}
          />
        )}
      </div>

      {/* Add Component Button */}
      <div
        className={cn(
          'absolute left-1/2 -translate-x-1/2 -bottom-4 opacity-0 group-hover:opacity-100 transition-all duration-200',
          isDragging && 'hidden'
        )}
      >
        <button
          onClick={onAddAfter}
          className="bg-primary-600 text-white p-2.5 rounded-full hover:bg-primary-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          title="הוסף רכיב אחרי"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
