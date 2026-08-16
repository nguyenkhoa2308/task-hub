"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, GripVertical, Clock, Trash2, ArrowUpDown, Filter, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetTasksByProject,
  useUpdateTask,
  useDeleteTask,
} from "@/hooks/use-task";
import { CreateTaskDialog } from "@/components/task/create-task-dialog";
import { TaskDetailModal } from "@/components/task/task-detail-modal";

export type TaskColumnStatus = "todo" | "in_progress" | "done";
export type SortOption = "deadline_priority" | "priority_only" | "deadline_only" | "title_az";

export interface KanbanTask {
  _id?: string;
  id?: string;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  assignees?: any[];
  dueDate?: string;
  createdAt?: string;
}

interface KanbanBoardProps {
  projectId?: string;
  projectMembers?: any[];
}

const COLUMNS: {
  id: TaskColumnStatus;
  statusValue: string;
  title: string;
  accentBg: string;
  borderColor: string;
  dotColor: string;
  badgeBg: string;
  badgeText: string;
}[] = [
    {
      id: "todo",
      statusValue: "To Do",
      title: "Cần làm",
      accentBg: "bg-slate-50/80",
      borderColor: "border-slate-200/80",
      dotColor: "bg-slate-400",
      badgeBg: "bg-white",
      badgeText: "text-slate-600",
    },
    {
      id: "in_progress",
      statusValue: "In Progress",
      title: "Đang làm",
      accentBg: "bg-blue-50/40",
      borderColor: "border-blue-200/80",
      dotColor: "bg-blue-500 animate-pulse",
      badgeBg: "bg-blue-100/80",
      badgeText: "text-blue-700",
    },
    {
      id: "done",
      statusValue: "Done",
      title: "Hoàn thành",
      accentBg: "bg-emerald-50/40",
      borderColor: "border-emerald-200/80",
      dotColor: "bg-emerald-500",
      badgeBg: "bg-emerald-100/80",
      badgeText: "text-emerald-700",
    },
  ];

const mapStatusToColumn = (status?: string): TaskColumnStatus => {
  if (!status) return "todo";
  const upper = status.toUpperCase();
  if (upper.includes("PROGRESS")) return "in_progress";
  if (upper.includes("DONE") || upper.includes("COMPLETED")) return "done";
  return "todo";
};

const PRIORITY_SCORE: Record<string, number> = {
  High: 3,
  Medium: 2,
  Low: 1,
};

export function KanbanBoard({ projectId, projectMembers = [] }: KanbanBoardProps) {
  const queryClient = useQueryClient();
  const { data: remoteTasks, refetch } = useGetTasksByProject(projectId || "");
  const { mutate: updateTaskMutate } = useUpdateTask();
  const { mutate: deleteTaskMutate } = useDeleteTask();

  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("deadline_priority");

  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskColumnStatus | null>(null);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedDefaultStatus, setSelectedDefaultStatus] = useState("To Do");

  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<KanbanTask | null>(null);

  useEffect(() => {
    if (Array.isArray(remoteTasks)) {
      setTasks(remoteTasks);
    }
  }, [remoteTasks]);

  // Sort Tasks Logic
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      if (sortBy === "deadline_priority") {
        // Option 3: Deadline gần/quá hạn lên đầu -> Rảnh -> xếp theo Priority
        const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;

        if (aDate !== bDate) return aDate - bDate;

        const aPri = PRIORITY_SCORE[a.priority || "Medium"] || 2;
        const bPri = PRIORITY_SCORE[b.priority || "Medium"] || 2;
        return bPri - aPri;
      }

      if (sortBy === "priority_only") {
        const aPri = PRIORITY_SCORE[a.priority || "Medium"] || 2;
        const bPri = PRIORITY_SCORE[b.priority || "Medium"] || 2;
        if (aPri !== bPri) return bPri - aPri;

        const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        return aDate - bDate;
      }

      if (sortBy === "deadline_only") {
        const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        return aDate - bDate;
      }

      if (sortBy === "title_az") {
        return a.title.localeCompare(b.title);
      }

      return 0;
    });
  }, [tasks, sortBy]);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("text/plain", taskId);
    setDraggingTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent, columnId: TaskColumnStatus) => {
    e.preventDefault();
    if (dragOverColumn !== columnId) {
      setDragOverColumn(columnId);
    }
  };

  const handleDragLeave = (e: React.DragEvent, columnId: TaskColumnStatus) => {
    e.preventDefault();
    if (dragOverColumn === columnId) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetColumnId: TaskColumnStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskId = e.dataTransfer.getData("text/plain") || draggingTaskId;
    setDraggingTaskId(null);

    if (!taskId) return;

    const colConfig = COLUMNS.find((c) => c.id === targetColumnId);
    const newStatusValue = colConfig?.statusValue || "To Do";

    setTasks((prev) =>
      prev.map((t) =>
        t._id === taskId || t.id === taskId ? { ...t, status: newStatusValue } : t
      )
    );

    if (taskId && !taskId.startsWith("temp-")) {
      updateTaskMutate(
        { id: taskId, data: { status: newStatusValue } },
        {
          onSuccess: () => {
            refetch();
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            queryClient.invalidateQueries({ queryKey: ["project", projectId] });
          },
          onError: () => {
            refetch();
            toast.error("Không thể cập nhật trạng thái công việc");
          },
        }
      );
    }

    toast.success(`Đã chuyển công việc sang "${colConfig?.title}"`);
  };

  const handleOpenCreateModal = (statusValue: string = "To Do") => {
    setSelectedDefaultStatus(statusValue);
    setIsCreateModalOpen(true);
  };

  const handleDeleteTask = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    if (!taskId) return;

    if (confirm("Bạn có chắc chắn muốn xóa công việc này?")) {
      deleteTaskMutate(taskId, {
        onSuccess: () => {
          toast.success("Đã xóa công việc");
          refetch();
        },
        onError: () => {
          toast.error("Không thể xóa công việc");
        },
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Kanban Header Actions & Sort Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200/80 rounded-2xl p-3 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-500 flex items-center gap-1.5 pl-1">
            <ArrowUpDown className="size-4 text-blue-600" /> Sắp xếp:
          </span>
          <div className="w-56">
            <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
              <SelectTrigger className="h-8 text-[13px] font-semibold rounded-xl bg-slate-50">
                <SelectValue placeholder="Chọn kiểu sắp xếp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="deadline_priority">Hạn chót + Độ ưu tiên</SelectItem>
                <SelectItem value="priority_only">Độ ưu tiên trước</SelectItem>
                <SelectItem value="deadline_only">Hạn chót gần nhất</SelectItem>
                <SelectItem value="title_az">Tên A - Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 hidden sm:inline">
            Click vào task để xem chi tiết & chỉnh sửa
          </span>
          <Button
            onClick={() => handleOpenCreateModal("To Do")}
            size="sm"
            className="gap-1.5 font-bold cursor-pointer shadow-xs hover:shadow-md transition-all rounded-xl h-8 text-xs"
          >
            <Plus className="size-4" />
            Thêm công việc
          </Button>
        </div>
      </div>

      {/* Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {COLUMNS.map((col) => {
          const columnTasks = sortedTasks.filter(
            (t) => mapStatusToColumn(t.status) === col.id
          );
          const isHovered = dragOverColumn === col.id;

          return (
            <div
              key={col.id}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={(e) => handleDragLeave(e, col.id)}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`rounded-2xl p-4 transition-all duration-200 flex flex-col min-h-[440px] ${col.accentBg
                } border ${isHovered
                  ? "border-blue-400 ring-2 ring-blue-500/20 bg-blue-50/60 shadow-lg scale-[1.01]"
                  : col.borderColor
                }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/60">
                <div className="flex items-center gap-2">
                  <span className={`size-2.5 rounded-full ${col.dotColor}`} />
                  <h3 className="font-extrabold text-sm text-slate-800 tracking-tight">
                    {col.title}
                  </h3>
                  <span
                    className={`text-xs font-extrabold px-2 py-0.5 rounded-full border border-slate-200/60 ${col.badgeBg} ${col.badgeText}`}
                  >
                    {columnTasks.length}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenCreateModal(col.statusValue)}
                  className="p-1 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                  title={`Thêm công việc vào ${col.title}`}
                >
                  <Plus className="size-4" />
                </button>
              </div>

              {/* Task List in Column */}
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[580px] pr-0.5">
                {columnTasks.length === 0 ? (
                  <div
                    className={`py-12 text-center text-xs font-semibold rounded-xl border border-dashed transition-colors ${isHovered
                      ? "border-blue-400 text-blue-600 bg-white/80"
                      : "border-slate-200/80 text-slate-400 bg-white/40"
                      }`}
                  >
                    {isHovered ? "Thả công việc vào đây" : "Chưa có công việc nào"}
                  </div>
                ) : (
                  columnTasks.map((task) => {
                    const taskId = task._id || task.id || "";
                    const isBeingDragged = draggingTaskId === taskId;

                    // Check if overdue
                    const isOverdue = task.dueDate && new Date(task.dueDate).getTime() < Date.now() && task.status !== "Done";

                    return (
                      <div
                        key={taskId}
                        draggable
                        onDragStart={(e) => handleDragStart(e, taskId)}
                        onClick={() => setSelectedTaskForDetail(task)}
                        className={`group bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-xs hover:shadow-md hover:border-blue-400 transition-all duration-200 cursor-pointer relative ${isBeingDragged
                          ? "opacity-40 scale-95 border-dashed border-blue-400"
                          : ""
                          }`}
                      >
                        {/* Priority Badge & Actions */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider border ${task.priority === "High"
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : task.priority === "Low"
                                  ? "bg-slate-100 text-slate-600 border-slate-200"
                                  : "bg-blue-50 text-blue-700 border-blue-200"
                                }`}
                            >
                              {task.priority || "Medium"}
                            </span>

                            {isOverdue && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-rose-500 text-white animate-pulse">
                                Quá hạn
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={(e) => handleDeleteTask(e, taskId)}
                              className="p-1 text-slate-400 hover:text-rose-500 rounded-md transition-colors"
                              title="Xóa công việc"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                            <GripVertical className="size-3.5 text-slate-300 cursor-grab active:cursor-grabbing" />
                          </div>
                        </div>

                        {/* Task Title & Description */}
                        <h4 className="text-sm font-bold text-slate-800 line-clamp-2 mb-1 group-hover:text-blue-600 transition-colors">
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
                            {task.description}
                          </p>
                        )}

                        {/* Task Footer Meta */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                          {task.dueDate ? (
                            <span className={`flex items-center gap-1 font-medium ${isOverdue ? "text-rose-600 font-bold" : "text-slate-500"}`}>
                              <Clock className="size-3" />
                              {new Date(task.dueDate).toLocaleDateString("vi-VN")}
                            </span>
                          ) : (
                            <span />
                          )}

                          {Array.isArray(task.assignees) && task.assignees.length > 0 && (
                            <div className="flex -space-x-1.5">
                              {task.assignees.slice(0, 3).map((u: any, idx: number) => {
                                const userObj = u.user || u;
                                return (
                                  <Avatar key={idx} className="size-5 border border-white">
                                    <AvatarImage src={userObj?.profileImage} />
                                    <AvatarFallback className="text-[9px] bg-blue-100 text-blue-700 font-bold">
                                      {userObj?.name?.charAt(0) || "U"}
                                    </AvatarFallback>
                                  </Avatar>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Create Task */}
      {projectId && (
        <CreateTaskDialog
          isOpen={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
          projectId={projectId}
          defaultStatus={selectedDefaultStatus}
          projectMembers={projectMembers}
        />
      )}

      {/* Modal View Detail & Edit Task */}
      {selectedTaskForDetail && (
        <TaskDetailModal
          task={selectedTaskForDetail}
          isOpen={!!selectedTaskForDetail}
          onClose={() => setSelectedTaskForDetail(null)}
          projectMembers={projectMembers}
          refetchTasks={refetch}
        />
      )}
    </div>
  );
}

