import { FC } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SidebarWrapper } from './SidebarWrapper';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface ExamSidebarProps {
  questions: { id: string; type: 'multiple-choice' | 'true-false'; label: string; }[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onReorder: (newOrder: string[]) => void;
}

import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function DraggableSidebarItem({ id, selected, children, onClick }: { id: string; selected: boolean; children: React.ReactNode; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.7 : 1,
        zIndex: isDragging ? 10 : undefined,
      }}
      {...attributes}
      {...listeners}
      className={cn(
        'rounded-lg border bg-card shadow-sm group cursor-pointer',
        selected && 'ring-2 ring-primary ring-offset-2',
        isDragging && 'bg-muted',
        'transition-all duration-150'
      )}
    >
      <Button
        variant={selected ? 'default' : 'ghost'}
        className={cn(
          'w-full justify-start px-3 py-2 rounded-lg text-left text-sm font-medium',
          selected ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
          isDragging && 'opacity-80',
          'transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
        )}
        onClick={onClick}
        tabIndex={0}
      >
        {children}
      </Button>
    </li>
  );
}


const ExamSidebar: FC<ExamSidebarProps> = ({ questions, selectedId, onSelect, onAdd, onReorder }) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      const oldIndex = questions.findIndex(q => q.id === active.id);
      const newIndex = questions.findIndex(q => q.id === over.id);
      const newOrder = arrayMove(questions.map(q => q.id), oldIndex, newIndex);
      onReorder(newOrder);
    }
  };

  return (
    <SidebarWrapper className="w-72 min-w-[16rem] bg-background border-r flex flex-col h-full shadow-md">
      <div className="flex-1 overflow-y-auto">
        <ScrollArea className="h-full px-2 pt-4 pb-2">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={questions.map(q => q.id)} strategy={verticalListSortingStrategy}>
              <ul className="space-y-2">
                {questions.map((q, idx) => (
                  <DraggableSidebarItem
                    key={q.id}
                    id={q.id}
                    selected={q.id === selectedId}
                    onClick={() => onSelect(q.id)}
                  >
                    <span className="mr-2 text-xs text-muted-foreground">{idx + 1}</span>
                    <span className="inline-block px-2 py-0.5 rounded bg-muted text-xs text-muted-foreground mr-2">
                      {q.type === 'multiple-choice' ? 'Multiple choice' : 'True/False'}
                    </span>
                    <span className="truncate max-w-[120px] align-middle text-sm">
                      {q.label || <span className="italic text-muted-foreground">Untitled</span>}
                    </span>
                  </DraggableSidebarItem>
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        </ScrollArea>
      </div>
      <div className="px-4 py-2 border-t bg-background flex flex-col gap-2">
        <Button className="w-full" onClick={onAdd} variant="outline">+ Add Question</Button>
        <Button className="w-full" variant="secondary">Result Screen</Button>
      </div>
    </SidebarWrapper>
  );
};

export default ExamSidebar;
