import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const SortableListItem = ({ id, children }: { id: string, children: (props: {listeners: React.HTMLAttributes<any>}) => React.ReactNode }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      // {...listeners}
    >
      {children({listeners: listeners || {}})}
    </div>
  )
}

export default SortableListItem