import { useState, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Plus, GripVertical, Calendar, Clock, Loader2,
  Flag, AlertCircle, ChevronUp, Minus, ArrowDown,
} from 'lucide-react'
import { projectsApi } from '../../api'
import {
  formatDate, getPriorityClass, classNames, capitalize,
} from '../../utils'
import toast from 'react-hot-toast'

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done'

export interface Task {
  id: number
  title: string
  description?: string
  status: TaskStatus
  priority: string
  estimated_hours?: number
  due_date?: string
  position: number
  project_id: number
}

interface Column {
  id: TaskStatus
  label: string
  color: string
  bgColor: string
  dotColor: string
  count: number
}

const COLUMNS: Column[] = [
  { id: 'todo',        label: 'To Do',       color: 'text-slate-600',  bgColor: 'bg-slate-100',   dotColor: 'bg-slate-400',   count: 0 },
  { id: 'in_progress', label: 'In Progress', color: 'text-blue-700',   bgColor: 'bg-blue-50',     dotColor: 'bg-blue-500',    count: 0 },
  { id: 'review',      label: 'In Review',   color: 'text-purple-700', bgColor: 'bg-purple-50',   dotColor: 'bg-purple-500',  count: 0 },
  { id: 'done',        label: 'Done',        color: 'text-emerald-700',bgColor: 'bg-emerald-50',  dotColor: 'bg-emerald-500', count: 0 },
]

const PRIORITY_ICONS: Record<string, React.ReactNode> = {
  urgent: <AlertCircle size={12} className="text-red-500" />,
  high:   <ChevronUp   size={12} className="text-orange-500" />,
  medium: <Minus       size={12} className="text-amber-500" />,
  low:    <ArrowDown   size={12} className="text-slate-400" />,
}

// ─── Sortable Task Card ────────────────────────────────────────────────────
interface TaskCardProps {
  task: Task
  onEdit: (t: Task) => void
  onDelete: (t: Task) => void
  isDragging?: boolean
}

function TaskCard({ task, onEdit, onDelete, isDragging = false }: TaskCardProps) {
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging: isSortableDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={classNames(
        'kanban-card group select-none',
        isDragging ? 'shadow-card-lg rotate-1 scale-105' : ''
      )}
    >
      <div className="flex items-start gap-2">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 p-0.5 rounded text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors cursor-grab active:cursor-grabbing flex-shrink-0"
        >
          <GripVertical size={14} />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className="text-sm font-medium text-slate-800 leading-snug">{task.title}</p>
            <div className="flex items-center gap-1 flex-shrink-0">
              {PRIORITY_ICONS[task.priority]}
            </div>
          </div>

          {task.description && (
            <p className="text-xs text-slate-500 mb-2 line-clamp-2">{task.description}</p>
          )}

          <div className="flex items-center justify-between flex-wrap gap-1.5">
            <div className="flex items-center gap-1.5">
              {task.due_date && (
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <Calendar size={11} />
                  {formatDate(task.due_date, 'MMM d')}
                </span>
              )}
              {task.estimated_hours && (
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <Clock size={11} />
                  {task.estimated_hours}h
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onEdit(task)}
                className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 hover:bg-brand-50 hover:text-brand-700 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(task)}
                className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                Del
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Column Component ──────────────────────────────────────────────────────
interface KanbanColumnProps {
  column: Column
  tasks: Task[]
  onAddTask: (status: TaskStatus) => void
  onEdit: (t: Task) => void
  onDelete: (t: Task) => void
}

function KanbanColumn({ column, tasks, onAddTask, onEdit, onDelete }: KanbanColumnProps) {
  const taskIds = tasks.map((t) => t.id)

  return (
    <div className="kanban-column">
      {/* Column Header */}
      <div className={classNames('kanban-column-header', column.bgColor)}>
        <div className="flex items-center gap-2">
          <div className={classNames('w-2 h-2 rounded-full', column.dotColor)} />
          <span className={classNames('text-sm font-semibold', column.color)}>
            {column.label}
          </span>
          <span className={classNames(
            'inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold',
            column.color, column.bgColor
          )}>
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAddTask(column.id)}
          className={classNames(
            'p-1 rounded-lg transition-colors hover:bg-white/60',
            column.color
          )}
        >
          <Plus size={15} />
        </button>
      </div>

      {/* Drop Zone */}
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2.5 min-h-16">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
          {tasks.length === 0 && (
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center">
              <p className="text-xs text-slate-400">Drop tasks here</p>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  )
}

// ─── Quick Task Form ───────────────────────────────────────────────────────
interface QuickTaskFormProps {
  status: TaskStatus
  projectId: number
  onSave: () => void
  onCancel: () => void
}

function QuickTaskForm({ status, projectId, onSave, onCancel }: QuickTaskFormProps) {
  const [title, setTitle]       = useState('')
  const [priority, setPriority] = useState('medium')
  const [saving, setSaving]     = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    try {
      await projectsApi.createTask(projectId, {
        title: title.trim(),
        status,
        priority,
        project_id: projectId,
      })
      toast.success('Task created!')
      onSave()
    } catch {
      toast.error('Failed to create task')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="kanban-card border-2 border-brand-300">
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && onCancel()}
        placeholder="Task title…"
        className="w-full text-sm bg-transparent outline-none text-slate-800 placeholder-slate-400 mb-2"
      />
      <div className="flex items-center gap-2">
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-700 outline-none focus:border-brand-400"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
        <div className="flex gap-1.5 ml-auto">
          <button
            type="button"
            onClick={onCancel}
            className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!title.trim() || saving}
            className="text-xs px-2.5 py-1 rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors disabled:opacity-50 flex items-center gap-1"
          >
            {saving && <Loader2 size={11} className="animate-spin" />}
            Add
          </button>
        </div>
      </div>
    </form>
  )
}

// ─── Main Kanban Board ─────────────────────────────────────────────────────
interface KanbanBoardProps {
  tasks: Task[]
  projectId: number
  onTasksChange: (tasks: Task[]) => void
  onEditTask: (task: Task) => void
  onDeleteTask: (task: Task) => void
}

export function KanbanBoard({
  tasks,
  projectId,
  onTasksChange,
  onEditTask,
  onDeleteTask,
}: KanbanBoardProps) {
  const [activeTask, setActiveTask]     = useState<Task | null>(null)
  const [addingTo, setAddingTo]         = useState<TaskStatus | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  )

  const getTasksByStatus = (status: TaskStatus) =>
    tasks
      .filter((t) => t.status === status)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))

  const findTask = (id: number) => tasks.find((t) => t.id === id)
  const findColumn = (taskId: number): TaskStatus | null => {
    const task = findTask(taskId)
    return task ? task.status : null
  }

  const handleDragStart = (event: DragStartEvent) => {
    const task = findTask(Number(event.active.id))
    if (task) setActiveTask(task)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = Number(active.id)
    const overId = Number(over.id)

    if (activeId === overId) return

    // Over a column ID (string) or a task ID (number)
    const overIsColumn = COLUMNS.some((c) => c.id === over.id)

    if (overIsColumn) {
      const newStatus = over.id as TaskStatus
      onTasksChange(
        tasks.map((t) => t.id === activeId ? { ...t, status: newStatus } : t)
      )
    } else {
      const activeStatus = findColumn(activeId)
      const overStatus   = findColumn(overId)
      if (!activeStatus || !overStatus) return

      if (activeStatus !== overStatus) {
        onTasksChange(
          tasks.map((t) => t.id === activeId ? { ...t, status: overStatus } : t)
        )
      }
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const activeId = Number(active.id)
    const overId   = Number(over.id)
    const overIsColumn = COLUMNS.some((c) => c.id === over.id)

    let finalStatus: TaskStatus
    if (overIsColumn) {
      finalStatus = over.id as TaskStatus
    } else {
      const overTask = findTask(overId)
      if (!overTask) return
      finalStatus = overTask.status
    }

    const activeTask = findTask(activeId)
    if (!activeTask) return

    // Reorder within the same column
    const colTasks = getTasksByStatus(finalStatus)

    if (activeId !== overId && !overIsColumn) {
      const oldIdx = colTasks.findIndex((t) => t.id === activeId)
      const newIdx = colTasks.findIndex((t) => t.id === overId)
      if (oldIdx !== -1 && newIdx !== -1) {
        const reordered = arrayMove(colTasks, oldIdx, newIdx)
        const updated = tasks.map((t) => {
          const idx = reordered.findIndex((r) => r.id === t.id)
          if (idx !== -1) return { ...t, status: finalStatus, position: idx }
          return t
        })
        onTasksChange(updated)
      }
    }

    // Persist status change to backend
    try {
      await projectsApi.updateTask(activeId, {
        status: finalStatus,
        position: colTasks.findIndex((t) => t.id === activeId),
      })
    } catch {
      toast.error('Failed to save task position')
    }
  }

  const handleTaskAdded = useCallback(async () => {
    // Reload tasks from parent
    const res = await projectsApi.listTasks(projectId)
    onTasksChange(res.data)
    setAddingTo(null)
  }, [projectId, onTasksChange])

  const columnsWithCounts = COLUMNS.map((col) => ({
    ...col,
    count: getTasksByStatus(col.id).length,
  }))

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[500px]">
        {columnsWithCounts.map((column) => {
          const colTasks = getTasksByStatus(column.id)
          return (
            <div key={column.id} className="kanban-column">
              {/* Column Header */}
              <div className={classNames('kanban-column-header', column.bgColor)}>
                <div className="flex items-center gap-2">
                  <div className={classNames('w-2 h-2 rounded-full', column.dotColor)} />
                  <span className={classNames('text-sm font-semibold', column.color)}>
                    {column.label}
                  </span>
                  <span className={classNames(
                    'inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold',
                    column.color, column.bgColor
                  )}>
                    {colTasks.length}
                  </span>
                </div>
                <button
                  onClick={() => setAddingTo(column.id)}
                  className={classNames(
                    'p-1 rounded-lg transition-colors hover:bg-white/60',
                    column.color
                  )}
                >
                  <Plus size={15} />
                </button>
              </div>

              {/* Task list */}
              <SortableContext
                items={colTasks.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <div
                  id={column.id}
                  className="flex flex-col gap-2.5 flex-1 min-h-16"
                >
                  {colTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onEdit={onEditTask}
                      onDelete={onDeleteTask}
                    />
                  ))}

                  {/* Quick Add form */}
                  {addingTo === column.id && (
                    <QuickTaskForm
                      status={column.id}
                      projectId={projectId}
                      onSave={handleTaskAdded}
                      onCancel={() => setAddingTo(null)}
                    />
                  )}

                  {colTasks.length === 0 && addingTo !== column.id && (
                    <button
                      onClick={() => setAddingTo(column.id)}
                      className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-brand-300 hover:bg-brand-50/30 transition-colors group"
                    >
                      <p className="text-xs text-slate-400 group-hover:text-brand-500">
                        + Add task
                      </p>
                    </button>
                  )}
                </div>
              </SortableContext>
            </div>
          )
        })}
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeTask && (
          <TaskCard
            task={activeTask}
            onEdit={() => {}}
            onDelete={() => {}}
            isDragging
          />
        )}
      </DragOverlay>
    </DndContext>
  )
}
