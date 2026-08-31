"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  ListCheck,
  LayoutGrid,
  ListTodo,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

import { useGetMyTasks, useUpdateTask, useDeleteTask, useRestoreTask } from "@/hooks/use-task";
import { TaskDetailModal } from "@/components/task/task-detail-modal";
import { TaskKanbanBoard, mapTaskStatusToColumn, type TaskColumnStatus } from "@/components/task/task-kanban-board";
import { TaskGroupedList } from "@/components/task/task-grouped-list";
import { useQueryClient } from "@tanstack/react-query";
import { useSSETasks } from "@/hooks/use-task-sse";


export type ViewMode = "list" | "kanban";
export type SortOption = "newest" | "oldest" | "dueDate_asc" | "dueDate_desc" | "priority";
export type FilterOption = "all" | "todo" | "in_progress" | "review" | "done" | "archived" | "high_priority";

export default function MyTasksPage() {
  const queryClient = useQueryClient();
  useSSETasks();

  // Local Controls State
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [filter, setFilter] = useState<FilterOption>("all");
  const [page, setPage] = useState(1);
  const [pageOpenedAt] = useState(() => Date.now());

  // Construct BE query params — default sort: deadline + priority
  const queryParams = useMemo(() => {
    const params: any = { sortBy: "deadline_priority", page, limit: 25 };

    switch (filter) {
      case "todo":
        params.status = "To Do";
        params.isArchived = false;
        break;
      case "in_progress":
        params.status = "In Progress";
        params.isArchived = false;
        break;
      case "review":
        params.status = "Review";
        params.isArchived = false;
        break;
      case "done":
        params.status = "Done";
        params.isArchived = false;
        break;
      case "high_priority":
        params.priority = "High";
        params.isArchived = false;
        break;
      case "archived":
        params.isArchived = true;
        break;
      case "all":
      default:
        params.isArchived = false;
        break;
    }

    return params;
  }, [filter, page]);

  // Fetch tasks with Backend filtering
  const { data: taskResponse, isLoading, isFetching, isError } = useGetMyTasks(queryParams);
  const rawTasks = taskResponse?.data;
  const pagination = taskResponse?.pagination;
  const { mutate: updateTaskMutate } = useUpdateTask();
  const { mutate: deleteTaskMutate } = useDeleteTask();
  const { mutate: restoreTaskMutate } = useRestoreTask();

  // Debounce isFetching to avoid skeleton flicker on fast responses (>300ms only)
  const [debouncedFetching, setDebouncedFetching] = useState(false);
  useEffect(() => {
    if (isFetching && !isLoading) {
      const t = setTimeout(() => setDebouncedFetching(true), 300);
      return () => clearTimeout(t);
    } else {
      setDebouncedFetching(false);
    }
  }, [isFetching, isLoading]);

  // Modal State
  const [selectedTask, setSelectedTask] = useState<any | null>(null);

  // Drag Drop State for Kanban View
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<TaskColumnStatus | null>(null);

  // Pending status overrides — track in-flight updates to prevent flicker
  // useState so changes trigger re-render immediately
  const [pendingStatusMap, setPendingStatusMap] = useState<Record<string, string>>({});

  // Processed tasks — apply pending status overrides to prevent race condition flicker
  // Auto-clear pending entry when server data has caught up to the expected status
  const processedTasks = useMemo(() => {
    if (!Array.isArray(rawTasks)) return [];
    const toClean: string[] = [];
    const result = rawTasks.map((t: any) => {
      const taskId = t._id || t.id;
      const pending = pendingStatusMap[taskId];
      if (pending) {
        if (t.status === pending) {
          // Server has caught up — schedule cleanup (can't call setState in useMemo)
          toClean.push(taskId);
          return t;
        }
        return { ...t, status: pending };
      }
      return t;
    });
    // Schedule cleanup outside memo using microtask
    if (toClean.length > 0) {
      Promise.resolve().then(() => {
        setPendingStatusMap((prev) => {
          const next = { ...prev };
          toClean.forEach((id) => delete next[id]);
          return next;
        });
      });
    }
    return result;
  }, [rawTasks, pendingStatusMap]);


  // Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("text/plain", taskId);
    setDraggingTaskId(taskId);
  };

  const handleDrop = useCallback((e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    setDragOverCol(null);
    const taskId = e.dataTransfer.getData("text/plain") || draggingTaskId;
    setDraggingTaskId(null);

    if (!taskId) return;

    const currentTask = processedTasks.find((task) => (task._id || task.id) === taskId);
    if (currentTask && mapTaskStatusToColumn(currentTask.status) === mapTaskStatusToColumn(targetStatus)) {
      return;
    }

    // Immediately override display status to prevent flicker when filter refetches
    setPendingStatusMap((prev) => ({ ...prev, [taskId]: targetStatus }));

    updateTaskMutate(
      { id: taskId, data: { status: targetStatus } },
      {
        onSuccess: () => {
          toast.success(`Đã chuyển sang "${targetStatus}"`);
        },
        onError: () => {
          setPendingStatusMap((prev) => { const next = { ...prev }; delete next[taskId]; return next; });
          queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
          toast.error("Cập nhật thất bại");
        },
      }
    );
  }, [draggingTaskId, processedTasks, updateTaskMutate, queryClient]);

  const handleDeleteTask = (taskId: string) => {
    deleteTaskMutate(taskId, {
      onSuccess: () => {
        toast.success("Đã chuyển công việc vào thùng rác", {
          duration: 8000,
          action: {
            label: "Hoàn tác",
            onClick: () => restoreTaskMutate(taskId, {
              onSuccess: () => {
                toast.success("Đã khôi phục công việc");
                queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
                queryClient.invalidateQueries({ queryKey: ["tasks"] });
                queryClient.invalidateQueries({ queryKey: ["projects"] });
              },
            }),
          },
        });
        queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
        queryClient.invalidateQueries({ queryKey: ["projects"] });
      },
    });
  };


  if (isError) {
    return (
      <div className="py-20 text-center space-y-4">
        <AlertCircle className="size-10 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Không thể tải danh sách công việc</h2>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["my-tasks"] })} variant="outline">Thử lại</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2.5">
            <ListCheck className="size-7 text-blue-600" />
            Công việc của tôi
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý tất cả công việc được giao hoặc do bạn khởi tạo.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="hidden items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0 self-start sm:self-auto lg:flex">
          <button
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${viewMode === "list"
              ? "bg-white text-blue-600 shadow-xs"
              : "text-slate-500 hover:text-slate-800"
              }`}
          >
            <ListTodo className="size-4" />
            Danh sách
          </button>
          <button
            onClick={() => setViewMode("kanban")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${viewMode === "kanban"
              ? "bg-white text-blue-600 shadow-xs"
              : "text-slate-500 hover:text-slate-800"
              }`}
          >
            <LayoutGrid className="size-4" />
            Bảng
          </button>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex items-center gap-5 overflow-x-auto border-b border-slate-200 scrollbar-none">
        {[
          { id: "all", label: "Tất cả" },
          { id: "todo", label: "Cần làm" },
          { id: "in_progress", label: "Đang làm" },
          { id: "review", label: "Đang review" },
          { id: "done", label: "Hoàn thành" },
          { id: "high_priority", label: "Ưu tiên cao" },
          { id: "archived", label: "Đã lưu trữ" },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setFilter(item.id as FilterOption);
              setPage(1);
            }}
            className={`relative px-0.5 pb-3 text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer ${filter === item.id
              ? "text-blue-600 after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:rounded-full after:bg-blue-600"
              : "text-slate-500 hover:text-slate-900"
              }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Main View Area */}
      {(isLoading || debouncedFetching) ? (
        viewMode === "list" ? (
          /* List skeleton */
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden divide-y divide-slate-100">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-5 flex items-center gap-4" style={{ opacity: 1 - i * 0.15 }}>
                <Skeleton className="size-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/5 rounded-lg" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-20 rounded-md" />
                    <Skeleton className="h-5 w-20 rounded-md" />
                    <Skeleton className="h-5 w-28 rounded-md" />
                  </div>
                </div>
                <div className="hidden sm:flex gap-2 items-center shrink-0">
                  <Skeleton className="h-5 w-24 rounded-md" />
                  <Skeleton className="size-7 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Kanban skeleton */
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {["Cần làm", "Đang làm", "Đang review", "Hoàn thành"].map((col) => (
              <div key={col} className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Skeleton className="size-2.5 rounded-full" />
                  <Skeleton className="h-4 w-24 rounded" />
                </div>
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="border border-slate-100 rounded-xl p-3.5 space-y-2.5" style={{ opacity: 1 - i * 0.2 }}>
                    <Skeleton className="h-4 w-4/5 rounded" />
                    <Skeleton className="h-3 w-3/5 rounded" />
                    <div className="flex gap-1.5 pt-0.5">
                      <Skeleton className="h-4 w-14 rounded" />
                      <Skeleton className="h-4 w-14 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )
      ) : processedTasks.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-200 rounded-2xl py-16 text-center space-y-3">
          <ListTodo className="size-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">Không tìm thấy công việc nào</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm để xem danh sách công việc.
          </p>
        </div>
      ) : (
        <>
          <div className={`w-full transition-opacity lg:hidden ${isFetching ? "opacity-60" : "opacity-100"}`}>
            <TaskGroupedList tasks={processedTasks} showTaskContext onTaskClick={setSelectedTask} onDeleteTask={handleDeleteTask} />
          </div>
          <div className="hidden lg:block">
            {viewMode === "list" ? (
              <div className={`w-full transition-opacity ${isFetching ? "opacity-60" : "opacity-100"}`}>
                <TaskGroupedList tasks={processedTasks} showTaskContext onTaskClick={setSelectedTask} onDeleteTask={handleDeleteTask} />
              </div>
            ) : (
              <TaskKanbanBoard
                tasks={processedTasks}
                showTaskContext
                draggingTaskId={draggingTaskId}
                dragOverColumn={dragOverCol}
                onDragStart={handleDragStart}
                onDragOver={(event, columnId) => {
                  event.preventDefault();
                  setDragOverCol(columnId);
                }}
                onDragLeave={() => setDragOverCol(null)}
                onDrop={(event, _columnId, statusValue) => handleDrop(event, statusValue)}
                onTaskClick={setSelectedTask}
                onDeleteTask={handleDeleteTask}
              />
            )}
          </div>
        </>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs text-slate-500">
            Hiển thị {(page - 1) * pagination.limit + 1}–{Math.min(page * pagination.limit, pagination.total)} trong {pagination.total} công việc
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1 || isFetching} onClick={() => setPage((value) => value - 1)}>
              <ChevronLeft className="size-4" /> Trước
            </Button>
            <span className="min-w-16 text-center text-xs font-semibold text-slate-600">{page} / {pagination.totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= pagination.totalPages || isFetching} onClick={() => setPage((value) => value + 1)}>
              Sau <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          refetchTasks={() => queryClient.invalidateQueries({ queryKey: ["my-tasks"] })}
        />
      )}
    </div>
  );
}
