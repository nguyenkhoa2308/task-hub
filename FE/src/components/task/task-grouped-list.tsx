"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronDown, MessageCircle, Paperclip, Plus, Flag } from "lucide-react";
import { TaskActionMenu } from "./task-action-menu";
import { TaskDeleteConfirmDialog } from "./task-delete-confirm-dialog";
import { mapTaskStatusToColumn, TASK_KANBAN_COLUMNS, TaskKanbanBoard, type SharedKanbanTask, type TaskColumnStatus } from "./task-kanban-board";

interface TaskGroupedListProps<T extends SharedKanbanTask> {
  tasks: T[];
  onTaskClick?: (task: T) => void;
  onDeleteTask?: (taskId: string) => void;
  canEdit?: boolean;
  showTaskContext?: boolean;
}

export function TaskGroupedList<T extends SharedKanbanTask>({ tasks, onTaskClick, onDeleteTask, canEdit = true, showTaskContext = false }: TaskGroupedListProps<T>) {
  const [collapsed, setCollapsed] = useState<Partial<Record<TaskColumnStatus, boolean>>>({});
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [openedAt] = useState(() => Date.now());
  const gridClass = showTaskContext
    ? "grid-cols-[minmax(200px,1.5fr)_minmax(180px,1.2fr)_130px_140px_120px_100px_145px_115px_70px_70px_40px]"
    : "grid-cols-[minmax(200px,1.5fr)_minmax(180px,1.2fr)_120px_100px_145px_115px_70px_70px_40px]";

  return (
    <>
      <div className="lg:hidden">
        <TaskKanbanBoard
          tasks={tasks}
          canEdit={canEdit}
          mobileList
          disableDrag
          showTaskContext={showTaskContext}
          onTaskClick={(task) => onTaskClick?.(task)}
          onDeleteTask={onDeleteTask}
          onDragStart={() => undefined}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={() => undefined}
          onDrop={() => undefined}
        />
      </div>
      <div className="hidden space-y-4 lg:block">
        {TASK_KANBAN_COLUMNS.map((column) => {
          const groupTasks = tasks.filter((task) => mapTaskStatusToColumn(task.status) === column.id);
          const isCollapsed = collapsed[column.id];

          return (
            <section key={column.id} className="overflow-hidden rounded-xl border border-slate-200/80 bg-white">
              <button
                type="button"
                onClick={() => setCollapsed((value) => ({ ...value, [column.id]: !value[column.id] }))}
                className={`flex w-full items-center justify-between px-3 py-2.5 text-left ${column.headerBg}`}
              >
                <span className="flex items-center gap-2">
                  <ChevronDown className={`size-3.5 text-slate-400 transition-transform ${isCollapsed ? "-rotate-90" : ""}`} />
                  <span className={`size-2 rounded-full ${column.dotColor}`} />
                  <span className="text-sm font-extrabold text-slate-800">{column.title}</span>
                  <span className={`text-xs font-bold ${column.badge}`}>{groupTasks.length}</span>
                </span>
                <Plus className="size-4 text-slate-400" />
              </button>

              {!isCollapsed && (
                <div className="overflow-x-auto -ml-4 pl-4 pr-3">
                  <div className={showTaskContext ? "min-w-[1310px]" : "min-w-[1040px]"}>
                    <div className={`grid ${gridClass} border-y border-slate-200/70 bg-slate-50/60 text-sm font-bold text-slate-600`}>
                      <div className="px-3 py-2 flex items-center justify-center">Tên công việc</div>
                      <div className="border-l border-slate-200/60 px-3 py-2 flex items-center justify-center">Mô tả</div>
                      {showTaskContext && <div className="border-l border-slate-200/60 px-3 py-2 flex items-center justify-center">Workspace</div>}
                      {showTaskContext && <div className="border-l border-slate-200/60 px-3 py-2 flex items-center justify-center">Dự án</div>}
                      <div className="border-l border-slate-200/60 px-3 py-2 flex items-center justify-center">Người thực hiện</div>
                      <div className="border-l border-slate-200/60 px-3 py-2 flex items-center justify-center">Ngày bắt đầu</div>
                      <div className="border-l border-slate-200/60 px-3 py-2 flex items-center justify-center">Hạn chót</div>
                      <div className="border-l border-slate-200/60 px-3 py-2 flex items-center justify-center">Độ ưu tiên</div>
                      <div className="border-l border-slate-200/60 px-3 py-2 flex items-center justify-center">Đính kèm</div>
                      <div className="border-l border-slate-200/60 px-3 py-2 flex items-center justify-center">Bình luận</div>
                      <div className="border-l border-slate-200/60 px-3 py-2 flex items-center justify-center" />
                    </div>

                    {groupTasks.length === 0 ? (
                      <div className="px-4 py-7 text-center text-xs text-slate-400">Chưa có công việc trong trạng thái này</div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {groupTasks.map((task) => {
                          const normalizedPriority = task.priority?.toUpperCase();
                          const isOverdue = Boolean(task.dueDate && new Date(task.dueDate).getTime() < openedAt && column.id !== "done");
                          const priority = normalizedPriority === "HIGH"
                            ? "bg-rose-50 text-rose-700"
                            : normalizedPriority === "LOW"
                              ? "bg-blue-50 text-blue-700"
                              : "bg-amber-50 text-amber-700";
                          const dueDateObj = task.dueDate ? new Date(task.dueDate) : null;
                          const diffTime = dueDateObj ? (openedAt - dueDateObj.getTime()) : 0;
                          const daysOverdue = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

                          return (
                            <div
                              role="button"
                              tabIndex={0}
                              key={task._id || task.id}
                              onClick={() => onTaskClick?.(task)}
                              onKeyDown={(event) => { if (event.key === "Enter") onTaskClick?.(task); }}
                              className={`relative group grid w-full ${gridClass} cursor-pointer text-left text-[13px] transition-colors ${isOverdue ? "bg-rose-50/20 hover:bg-rose-50/40" : "hover:bg-slate-50/80"}`}
                            >
                              {isOverdue && (
                                <div className="absolute left-1 -top-1.5 z-10 group/tooltip">
                                  <Flag className="size-5 text-rose-500 fill-rose-500 -scale-x-100 -rotate-[20deg] drop-shadow-sm" />
                                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 hidden group-hover/tooltip:block bg-slate-900 text-white text-xs font-medium px-2.5 py-1 rounded-md shadow-md whitespace-nowrap z-50 transition-opacity">
                                    Quá hạn {daysOverdue} ngày
                                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
                                  </div>
                                </div>
                              )}
                              <span className={`flex min-w-0 items-center gap-2 pr-3 pl-7 py-3 font-bold ${isOverdue ? "text-rose-800" : "text-slate-900"}`}>
                                <span className="truncate">{task.title}</span>
                              </span>
                              <span className="truncate border-l border-slate-100 px-3 py-3 text-slate-600">{task.description || "—"}</span>
                              {showTaskContext && <span className="truncate border-l border-slate-100 px-3 py-3 font-medium text-slate-600">{task.project?.workspace?.name || "—"}</span>}
                              {showTaskContext && <span className="truncate border-l border-slate-100 px-3 py-3 font-medium text-blue-600">{task.project?.title || task.project?.name || "—"}</span>}
                              <span className="flex items-center border-l border-slate-100 px-3 py-2.5">
                                {task.assignees && task.assignees.length > 0 ? (
                                  <span className="flex -space-x-1.5 items-center">
                                    {task.assignees.slice(0, 2).map((assignee, index) => {
                                      const user = assignee.user || assignee;
                                      return <Avatar key={index} className="size-6 border-2 border-white"><AvatarImage src={user.profileImage} /><AvatarFallback className="text-[9px]">{user.name?.charAt(0)?.toUpperCase() || "?"}</AvatarFallback></Avatar>;
                                    })}
                                    {task.assignees.length > 2 && (
                                      <span className="flex size-6 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-[10px] font-bold text-slate-700">+{task.assignees.length - 2}</span>
                                    )}
                                  </span>
                                ) : <span className="text-slate-400">Chưa giao</span>}
                              </span>
                              <span className="border-l border-slate-100 px-3 py-2.5 font-medium text-slate-600">{task.startDate ? new Date(task.startDate).toLocaleDateString("vi-VN") : "—"}</span>
                              <span className={`flex items-center gap-2 border-l border-slate-100 px-3 py-2.5 font-medium ${isOverdue ? "text-rose-600 font-semibold" : "text-slate-600"}`}>
                                <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString("vi-VN") : "—"}</span>
                              </span>
                              <span className="border-l border-slate-100 px-3 py-2.5"><span className={`rounded-md px-2 py-1 text-xs font-semibold ${priority}`}>{normalizedPriority === "HIGH" ? "Cao" : normalizedPriority === "LOW" ? "Thấp" : "Trung bình"}</span></span>
                              <span className="flex items-center justify-center gap-1 border-l border-slate-100 px-2 py-2.5 text-slate-500"><Paperclip className="size-3" />{task.attachments?.length || 0}</span>
                              <span className="flex items-center justify-center gap-1 border-l border-slate-100 px-2 py-2.5 text-slate-500"><MessageCircle className="size-3" />{task.comments?.length || 0}</span>
                              <span className="flex items-center justify-center border-l border-slate-100 px-1 py-2.5">
                                <TaskActionMenu
                                  onView={onTaskClick ? () => onTaskClick(task) : undefined}
                                  canDelete={canEdit && !!onDeleteTask && !!(task._id || task.id)}
                                  onDelete={(task._id || task.id) ? () => setDeleteTaskId((task._id || task.id)!) : undefined}
                                />
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>
      <TaskDeleteConfirmDialog
        open={!!deleteTaskId}
        onOpenChange={(open) => { if (!open) setDeleteTaskId(null); }}
        onConfirm={() => {
          if (deleteTaskId) onDeleteTask?.(deleteTaskId);
          setDeleteTaskId(null);
        }}
      />
    </>
  );
}
