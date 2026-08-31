"use client";

import { useEffect, useState, useMemo } from "react";
import { Plus, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetTasksByProject,
  useUpdateTask,
  useDeleteTask,
  useRestoreTask,
} from "@/hooks/use-task";
import { CreateTaskDialog } from "@/components/task/create-task-dialog";
import { TaskDetailModal } from "@/components/task/task-detail-modal";
import { TASK_KANBAN_COLUMNS, TaskKanbanBoard, mapTaskStatusToColumn, type TaskColumnStatus } from "@/components/task/task-kanban-board";

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
  canEdit?: boolean;
  projectStatus?: string;
}


export function KanbanBoard({ projectId, projectMembers = [], canEdit = true, projectStatus = 'PLANNING' }: KanbanBoardProps) {
  const statusLocks: Record<string, string> = { ON_HOLD: 'Dự án đang tạm dừng', COMPLETED: 'Dự án đã hoàn thành', CANCELLED: 'Dự án đã hủy' };
  const projectLockMessage = statusLocks[projectStatus];
  const taskCanEdit = canEdit && !projectLockMessage;
  const queryClient = useQueryClient();
  const [columnLimits, setColumnLimits] = useState<Record<TaskColumnStatus, number>>({
    todo: 20,
    in_progress: 20,
    review: 20,
    done: 20,
  });
  const todoQuery = useGetTasksByProject(projectId || "", { sortBy: "deadline_priority", status: "To Do", page: 1, limit: columnLimits.todo });
  const progressQuery = useGetTasksByProject(projectId || "", { sortBy: "deadline_priority", status: "In Progress", page: 1, limit: columnLimits.in_progress });
  const reviewQuery = useGetTasksByProject(projectId || "", { sortBy: "deadline_priority", status: "Review", page: 1, limit: columnLimits.review });
  const doneQuery = useGetTasksByProject(projectId || "", { sortBy: "deadline_priority", status: "Done", page: 1, limit: columnLimits.done });
  const remoteTasks = useMemo(() => {
    const merged = [
      ...(todoQuery.data?.data || []),
      ...(progressQuery.data?.data || []),
      ...(reviewQuery.data?.data || []),
      ...(doneQuery.data?.data || []),
    ];
    const uniqueById = new Map<string, any>();
    merged.forEach((task: any) => {
      const taskId = task._id || task.id;
      if (taskId) uniqueById.set(taskId, task);
    });
    return Array.from(uniqueById.values());
  }, [todoQuery.data, progressQuery.data, reviewQuery.data, doneQuery.data]);
  const { mutate: updateTaskMutate } = useUpdateTask();
  const { mutate: deleteTaskMutate } = useDeleteTask();
  const { mutate: restoreTaskMutate } = useRestoreTask();

  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskColumnStatus | null>(null);

  // Pending status overrides — prevent flicker when sortBy changes mid-flight
  const [pendingStatusMap, setPendingStatusMap] = useState<Record<string, string>>({});
  const [pendingTaskMap, setPendingTaskMap] = useState<Record<string, KanbanTask>>({});

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedDefaultStatus, setSelectedDefaultStatus] = useState("To Do");
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<KanbanTask | null>(null);

  // Derive display tasks: apply pending overrides, auto-clear when server catches up
  const tasks = useMemo(() => {
    if (!Array.isArray(remoteTasks)) return [];
    const result = remoteTasks.map((t: any) => {
      const taskId = t._id || t.id;
      const pending = pendingStatusMap[taskId];
      if (pending) {
        if (t.status === pending) return t;
        return { ...t, status: pending };
      }
      return t;
    });
    const visibleIds = new Set(result.map((task: any) => task._id || task.id).filter(Boolean));
    Object.entries(pendingTaskMap).forEach(([taskId, task]) => {
      if (!visibleIds.has(taskId)) result.push(task);
    });
    return result;
  }, [remoteTasks, pendingStatusMap, pendingTaskMap]);

  useEffect(() => {
    const caughtUpIds = remoteTasks
      .filter((task: any) => pendingStatusMap[task._id || task.id] === task.status)
      .map((task: any) => task._id || task.id)
      .filter(Boolean);
    if (caughtUpIds.length === 0) return;
    setPendingStatusMap((prev) => {
      const next = { ...prev };
      caughtUpIds.forEach((id: string) => delete next[id]);
      return next;
    });
    setPendingTaskMap((prev) => {
      const next = { ...prev };
      caughtUpIds.forEach((id: string) => delete next[id]);
      return next;
    });
  }, [remoteTasks, pendingStatusMap]);

  // Keep optimistic moves in the same order as the backend, so a task does not
  // jump again when the SSE confirmation replaces it with server data.
  const sortedTasks = useMemo(() => {
    const priorityWeight: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    const now = Date.now();
    const soonThreshold = now + 3 * 24 * 60 * 60 * 1000;
    const bucket = (task: KanbanTask) => {
      if (mapTaskStatusToColumn(task.status) === 'done') return 3;
      if (!task.dueDate) return 2;
      const dueTime = new Date(task.dueDate).getTime();
      if (dueTime < now) return 0;
      if (dueTime <= soonThreshold) return 1;
      return 2;
    };
    return [...tasks].sort((a, b) => {
      const bucketDiff = bucket(a) - bucket(b);
      if (bucketDiff !== 0) return bucketDiff;
      const priorityDiff = (priorityWeight[(b.priority || '').toUpperCase()] || 0)
        - (priorityWeight[(a.priority || '').toUpperCase()] || 0);
      if (priorityDiff !== 0) return priorityDiff;
      const dueDiff = (a.dueDate ? new Date(a.dueDate).getTime() : Infinity)
        - (b.dueDate ? new Date(b.dueDate).getTime() : Infinity);
      if (dueDiff !== 0) return dueDiff;
      const createdDiff = (b.createdAt ? new Date(b.createdAt).getTime() : 0)
        - (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      if (createdDiff !== 0) return createdDiff;
      return (a._id || a.id || '').localeCompare(b._id || b.id || '');
    });
  }, [tasks]);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    if (!taskCanEdit) {
      e.preventDefault();
      toast.error("Bạn đang ở chế độ Chỉ xem (Viewer), không được kéo thả công việc");
      return;
    }
    setDraggingTaskId(taskId);
    e.dataTransfer.setData("text/plain", taskId);
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

    const currentTask = tasks.find((t) => (t._id || t.id) === taskId);
    if (currentTask && mapTaskStatusToColumn(currentTask.status) === targetColumnId) {
      // Nếu thả lại đúng cột cũ thì không làm gì
      return;
    }

    const colConfig = TASK_KANBAN_COLUMNS.find((c) => c.id === targetColumnId);
    const newStatusValue = colConfig?.statusValue || "To Do";
    const startsProject = projectStatus === 'PLANNING' && targetColumnId !== 'todo';
    const allTasksWillBeDone = targetColumnId === 'done' && tasks.length > 0 && tasks.every((task) => {
      const id = task._id || task.id;
      return id === taskId || mapTaskStatusToColumn(task.status) === 'done';
    });

    // Immediately override display status to prevent flicker when sort refetches
    setPendingStatusMap((prev) => ({ ...prev, [taskId]: newStatusValue }));
    if (currentTask) {
      setPendingTaskMap((prev) => ({ ...prev, [taskId]: { ...currentTask, status: newStatusValue } }));
    }

    if (taskId && !taskId.startsWith("temp-")) {
      updateTaskMutate(
        { id: taskId, data: { status: newStatusValue } },
        {
          onSuccess: () => {
            if (startsProject) toast.info('Dự án đã chuyển sang Đang thực hiện');
            if (allTasksWillBeDone) {
              toast.info('Tất cả công việc đã xong. Bạn có thể hoàn thành dự án khi đã bàn giao.');
            }
          },
          onError: () => {
            setPendingStatusMap((prev) => { const next = { ...prev }; delete next[taskId]; return next; });
            setPendingTaskMap((prev) => { const next = { ...prev }; delete next[taskId]; return next; });
            queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
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

  const handleDeleteTask = (taskId: string) => {
    if (!taskId) return;
    deleteTaskMutate(taskId, {
      onSuccess: () => {
        toast.success("Đã chuyển công việc vào thùng rác", {
          duration: 8000,
          action: {
            label: "Hoàn tác",
            onClick: () => restoreTaskMutate(taskId, {
              onSuccess: () => {
                toast.success("Đã khôi phục công việc");
                queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
                queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
                queryClient.invalidateQueries({ queryKey: ["projects"] });
              },
            }),
          },
        });
        queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
        queryClient.invalidateQueries({ queryKey: ["projects"] });
        queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      },
      onError: () => {
        toast.error("Không thể xóa công việc");
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* Kanban Header */}
      <div className="flex items-center justify-between gap-3 bg-white border border-slate-200/80 rounded-2xl px-4 py-2.5 shadow-xs">
        <span className="text-xs text-slate-400">
          Click vào task để xem chi tiết & chỉnh sửa
        </span>
        <Button
          onClick={() => handleOpenCreateModal("To Do")}
          disabled={!taskCanEdit}
          size="sm"
          className="gap-1.5 font-bold cursor-pointer shadow-xs hover:shadow-md transition-all rounded-xl h-8 text-xs"
        >
          <Plus className="size-4" />
          Thêm công việc
        </Button>
      </div>

      {!taskCanEdit && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-amber-800 text-xs font-semibold flex items-center gap-2">
          <Lock className="size-4 text-amber-600 shrink-0" />
          <span>{projectLockMessage || 'Bạn đang ở chế độ Chỉ xem (Viewer). Tính năng kéo thả và chỉnh sửa công việc đã bị khóa.'}</span>
        </div>
      )}

      <TaskKanbanBoard
        tasks={sortedTasks}
        canEdit={taskCanEdit}
        draggingTaskId={draggingTaskId}
        dragOverColumn={dragOverColumn}
        columnTotals={{
          todo: todoQuery.data?.pagination.total || 0,
          in_progress: progressQuery.data?.pagination.total || 0,
          review: reviewQuery.data?.pagination.total || 0,
          done: doneQuery.data?.pagination.total || 0,
        }}
        loadingColumns={{
          todo: todoQuery.isFetching,
          in_progress: progressQuery.isFetching,
          review: reviewQuery.isFetching,
          done: doneQuery.isFetching,
        }}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={(event, columnId) => handleDrop(event, columnId)}
        onTaskClick={setSelectedTaskForDetail}
        onDeleteTask={taskCanEdit ? handleDeleteTask : undefined}
        onCreateTask={taskCanEdit ? handleOpenCreateModal : undefined}
        onLoadMore={(columnId) => setColumnLimits((limits) => ({ ...limits, [columnId]: limits[columnId] + 20 }))}
      />

      {/* Modal Create Task */}
      {projectId && (
        <CreateTaskDialog
          isOpen={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
          projectId={projectId}
          defaultStatus={selectedDefaultStatus}
          projectMembers={projectMembers.filter(m => m.role !== "viewer")}
        />
      )}

      {/* Modal View Detail & Edit Task */}
      {selectedTaskForDetail && (
        <TaskDetailModal
          task={selectedTaskForDetail}
          isOpen={!!selectedTaskForDetail}
          onClose={() => setSelectedTaskForDetail(null)}
          projectMembers={projectMembers}
          refetchTasks={() => queryClient.invalidateQueries({ queryKey: ["tasks", projectId] })}
          canEdit={canEdit}
        />
      )}
    </div>
  );
}
