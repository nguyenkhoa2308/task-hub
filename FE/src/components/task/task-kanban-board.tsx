"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CalendarDays, ChevronDown, Link2, ListChecks, MessageCircle, Plus } from "lucide-react";
import { TaskActionMenu } from "./task-action-menu";
import { TaskDeleteConfirmDialog } from "./task-delete-confirm-dialog";
import { useMemo, useState } from "react";

export type TaskColumnStatus = "todo" | "in_progress" | "review" | "done";

export interface SharedKanbanTask {
  _id?: string;
  id?: string;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  startDate?: string;
  dueDate?: string;
  createdAt?: string;
  assignees?: Array<{
    name?: string;
    profileImage?: string;
    user?: { name?: string; profileImage?: string };
  }>;
  subtasks?: Array<{ done?: boolean; completed?: boolean }>;
  attachments?: unknown[];
  comments?: unknown[];
  project?: { title?: string; name?: string; workspace?: { name?: string } };
}

export const TASK_KANBAN_COLUMNS = [
  { id: "todo" as const, statusValue: "To Do", title: "Cần làm", headerBg: "bg-sky-50", dotColor: "bg-sky-500", badge: "text-sky-700" },
  { id: "in_progress" as const, statusValue: "In Progress", title: "Đang thực hiện", headerBg: "bg-amber-50", dotColor: "bg-amber-500", badge: "text-amber-700" },
  { id: "review" as const, statusValue: "Review", title: "Đang review", headerBg: "bg-rose-50", dotColor: "bg-rose-500", badge: "text-rose-700" },
  { id: "done" as const, statusValue: "Done", title: "Hoàn thành", headerBg: "bg-emerald-50", dotColor: "bg-emerald-500", badge: "text-emerald-700" },
];

export function mapTaskStatusToColumn(status?: string): TaskColumnStatus {
  if (!status) return "todo";
  const normalized = status.toUpperCase();
  if (normalized.includes("PROGRESS")) return "in_progress";
  if (normalized.includes("REVIEW")) return "review";
  if (normalized.includes("DONE") || normalized.includes("COMPLETED")) return "done";
  return "todo";
}

interface TaskKanbanBoardProps<T extends SharedKanbanTask> {
  tasks: T[];
  canEdit?: boolean;
  draggingTaskId?: string | null;
  dragOverColumn?: TaskColumnStatus | null;
  columnTotals?: Partial<Record<TaskColumnStatus, number>>;
  loadingColumns?: Partial<Record<TaskColumnStatus, boolean>>;
  onDragStart: (event: React.DragEvent, taskId: string) => void;
  onDragOver: (event: React.DragEvent, columnId: TaskColumnStatus) => void;
  onDragLeave: (event: React.DragEvent, columnId: TaskColumnStatus) => void;
  onDrop: (event: React.DragEvent, columnId: TaskColumnStatus, statusValue: string) => void;
  onTaskClick: (task: T) => void;
  onCreateTask?: (statusValue: string) => void;
  onLoadMore?: (columnId: TaskColumnStatus) => void;
  showTaskContext?: boolean;
  onDeleteTask?: (taskId: string) => void;
  mobileList?: boolean;
  disableDrag?: boolean;
}

export function TaskKanbanBoard<T extends SharedKanbanTask>({
  tasks,
  canEdit = true,
  draggingTaskId,
  dragOverColumn,
  columnTotals,
  loadingColumns,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onTaskClick,
  onCreateTask,
  onLoadMore,
  showTaskContext = false,
  onDeleteTask,
  mobileList = false,
  disableDrag = false,
}: TaskKanbanBoardProps<T>) {
  const [openedAt] = useState(() => Date.now());
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [collapsedColumns, setCollapsedColumns] = useState<Partial<Record<TaskColumnStatus, boolean>>>({});
  const uniqueTasks = useMemo(() => {
    const byId = new Map<string, T>();
    const withoutId: T[] = [];
    tasks.forEach((task) => {
      const taskId = task._id || task.id;
      if (taskId) byId.set(taskId, task);
      else withoutId.push(task);
    });
    return [...byId.values(), ...withoutId];
  }, [tasks]);

  return (
    <>
    <div className={mobileList ? "space-y-4" : "grid grid-cols-1 items-start gap-4 md:grid-cols-2 lg:grid-cols-4"}>
      {TASK_KANBAN_COLUMNS.map((column) => {
        const columnTasks = uniqueTasks.filter((task) => mapTaskStatusToColumn(task.status) === column.id);
        const total = columnTotals?.[column.id] ?? columnTasks.length;
        const isHovered = dragOverColumn === column.id;

        return (
          <div
            key={column.id}
            onDragOver={(event) => onDragOver(event, column.id)}
            onDragLeave={(event) => onDragLeave(event, column.id)}
            onDrop={(event) => onDrop(event, column.id, column.statusValue)}
            className={`flex flex-col rounded-2xl border border-slate-100 bg-white p-2 transition-colors ${mobileList ? "min-h-0" : "min-h-[440px]"} ${isHovered ? "border-blue-300 bg-blue-50/20 ring-2 ring-blue-500/10" : ""}`}
          >
            <div
              onClick={() => mobileList && setCollapsedColumns((current) => ({ ...current, [column.id]: !current[column.id] }))}
              className={`flex items-center justify-between rounded-xl px-3 py-2.5 ${column.headerBg} ${mobileList ? "cursor-pointer" : "mb-2"}`}
            >
              <div className="flex items-center gap-2">
                {mobileList && <ChevronDown className={`size-3.5 text-slate-400 transition-transform ${collapsedColumns[column.id] ? "-rotate-90" : ""}`} />}
                <span className={`size-2.5 rounded-full ${column.dotColor}`} />
                <h3 className="text-sm font-extrabold text-slate-800">{column.title}</h3>
                <span className={`text-[11px] font-bold ${column.badge}`}>{total}</span>
              </div>
              {canEdit && onCreateTask && (
                <button type="button" onClick={(event) => { event.stopPropagation(); onCreateTask(column.statusValue); }} className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-white hover:text-blue-600" title={`Thêm vào ${column.title}`}>
                  <Plus className="size-4" />
                </button>
              )}
            </div>

            <div className={mobileList
              ? `mt-2 grid flex-1 grid-cols-1 gap-3 p-0.5 sm:grid-cols-2 ${collapsedColumns[column.id] ? "hidden" : ""}`
              : "flex-1 space-y-2 p-0.5"
            }>
              {columnTasks.length === 0 ? (
                <div className={`rounded-xl border border-dashed py-12 text-center text-xs font-semibold ${mobileList ? "sm:col-span-2" : ""} ${isHovered ? "border-blue-400 bg-white/80 text-blue-600" : "border-slate-200/80 bg-white/40 text-slate-400"}`}>
                  {isHovered ? "Thả công việc vào đây" : "Chưa có công việc"}
                </div>
              ) : columnTasks.map((task) => {
                const taskId = task._id || task.id || "";
                const isDone = mapTaskStatusToColumn(task.status) === "done";
                const isOverdue = Boolean(task.dueDate && new Date(task.dueDate).getTime() < openedAt && !isDone);
                const subtaskCount = task.subtasks?.length || 0;
                const completedSubtasks = task.subtasks?.filter((subtask) => subtask.done || subtask.completed).length || 0;

                return (
                  <div
                    key={taskId}
                    draggable={canEdit && !disableDrag}
                    onDragStart={(event) => onDragStart(event, taskId)}
                    onClick={() => onTaskClick(task)}
                    className={`group relative cursor-pointer rounded-xl border bg-white p-3.5 transition-[border-color,box-shadow] duration-200 hover:border-slate-300 hover:shadow-[0_3px_12px_rgba(15,23,42,0.06)] ${isOverdue ? "border-rose-300 ring-1 ring-rose-300/30" : "border-slate-200/80"} ${draggingTaskId === taskId ? "border-dashed border-blue-400" : ""}`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
                      <span className="flex items-center gap-1"><CalendarDays className="size-3" />Hạn: {task.dueDate ? new Date(task.dueDate).toLocaleDateString("vi-VN") : "Chưa đặt"}</span>
                      <TaskActionMenu onView={() => onTaskClick(task)} canDelete={canEdit && !!onDeleteTask && !!taskId} onDelete={taskId ? () => setDeleteTaskId(taskId) : undefined} />
                    </div>

                    <h4 className="mt-2 truncate text-base font-bold leading-6 text-slate-950">{task.title}</h4>

                    <p className="mt-1 truncate text-[13px] leading-5 text-slate-600">{task.description || "Chưa có mô tả"}</p>

                    {showTaskContext && task.project && (
                      <p className="mt-1.5 truncate text-[11px] font-semibold text-blue-600">
                        {task.project.workspace?.name ? `${task.project.workspace.name} / ` : ""}{task.project.title || task.project.name || "Dự án"}
                      </p>
                    )}

                    {subtaskCount > 0 && (
                      <>
                        <div className="mt-3 flex items-center justify-between text-[11px] font-medium text-slate-500">
                          <span className="flex items-center gap-1"><ListChecks className="size-3.5" />Tiến độ</span>
                          <span className="font-semibold text-slate-700">{completedSubtasks}/{subtaskCount}</span>
                        </div>
                        <div className="mt-1.5 flex gap-1" aria-label={`${completedSubtasks} trên ${subtaskCount} công việc phụ hoàn thành`}>
                          {task.subtasks?.map((subtask, index) => (
                            <span
                              key={index}
                              className={`h-1.5 min-w-0 flex-1 rounded-full ${subtask.done || subtask.completed ? "bg-emerald-500" : "bg-slate-200"}`}
                            />
                          ))}
                        </div>
                      </>
                    )}

                    <div className="mt-3 flex min-h-6 items-center justify-between">
                      <span className="text-[11px] font-medium text-slate-500">Thực hiện bởi</span>
                      {task.assignees && task.assignees.length > 0 ? (
                        <div className="flex -space-x-1.5">
                          {task.assignees.slice(0, 2).map((assignee, index) => {
                            const user = assignee.user || assignee;
                            return <Avatar key={index} className="size-6 border-2 border-white"><AvatarImage src={user.profileImage} /><AvatarFallback className="text-[9px]">{user.name?.charAt(0)?.toUpperCase() || "?"}</AvatarFallback></Avatar>;
                          })}
                          {task.assignees.length > 2 && (
                            <span className="flex size-6 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-[10px] font-bold text-slate-700">+{task.assignees.length - 2}</span>
                          )}
                        </div>
                      ) : <span className="text-[11px] text-slate-400">Chưa giao</span>}
                    </div>

                    <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
                      <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold ${task.priority?.toUpperCase() === "HIGH" ? "bg-rose-50 text-rose-700" : task.priority?.toUpperCase() === "LOW" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"}`}>
                        <span className={`size-1.5 rounded-full ${task.priority?.toUpperCase() === "HIGH" ? "bg-rose-500" : task.priority?.toUpperCase() === "LOW" ? "bg-blue-500" : "bg-amber-500"}`} />
                        {task.priority?.toUpperCase() === "HIGH" ? "Cao" : task.priority?.toUpperCase() === "LOW" ? "Thấp" : "Trung bình"}
                      </span>
                      <span className="flex items-center gap-3 text-[11px] font-medium text-slate-500">
                        <span className="flex items-center gap-1"><Link2 className="size-3" />{task.attachments?.length || 0}</span>
                        <span className="flex items-center gap-1"><MessageCircle className="size-3" />{task.comments?.length || 0}</span>
                      </span>
                    </div>
                  </div>
                );
              })}

              {columnTasks.length < total && onLoadMore && (
                <Button variant="ghost" size="sm" disabled={loadingColumns?.[column.id]} onClick={() => onLoadMore(column.id)} className={`w-full border border-dashed border-slate-300 bg-white/60 text-xs font-semibold text-slate-500 hover:border-blue-300 hover:text-blue-600 ${mobileList ? "sm:col-span-2" : ""}`}>
                  {loadingColumns?.[column.id] ? "Đang tải..." : `Tải thêm (${columnTasks.length}/${total})`}
                </Button>
              )}
            </div>
          </div>
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
