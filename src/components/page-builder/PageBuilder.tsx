import { PageComponent } from '@/types'
import SortableComponent from './SortableComponent'

interface PageBuilderProps {
  components: PageComponent[]
  onEdit: (index: number, props: any, shouldClose?: boolean) => void
  onDelete: (index: number) => void
  onDuplicate: (index: number) => void
  onAddAfter: (index: number) => void
  onToggleVisibility?: (index: number, isVisible: boolean) => void
  sourcePageId?: string // For preventing self-linking
}

export default function PageBuilder({
  components,
  onEdit,
  onDelete,
  onDuplicate,
  onAddAfter,
  onToggleVisibility,
  sourcePageId,
}: PageBuilderProps) {
  return (
    <div className="space-y-4">
      {components.map((component, index) => (
        <SortableComponent
          key={component.id}
          id={component.id}
          component={component}
          index={index}
          onEdit={(props, shouldClose) => onEdit(index, props, shouldClose)}
          onDelete={() => onDelete(index)}
          onDuplicate={() => onDuplicate(index)}
          onAddAfter={() => onAddAfter(index)}
          onToggleVisibility={onToggleVisibility ? (isVisible) => onToggleVisibility(index, isVisible) : undefined}
          sourcePageId={sourcePageId}
        />
      ))}
    </div>
  )
}
