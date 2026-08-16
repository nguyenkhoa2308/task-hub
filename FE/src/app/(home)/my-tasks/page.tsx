"use client";

import { useState, useMemo } from "react";
import {
  ListCheck,
  LayoutGrid,
  ListTodo,
  ArrowUpDown,
  Filter,
  Search,
  Clock,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Plus,
  GripVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

import { useGetMyTasks, useUpdateTask, useDeleteTask } from "@/hooks/use-task";
import { TaskDetailModal } from "@/components/task/task-detail-modal";
import { useQueryClient } from "@tanstack/react-query";

export type ViewMode = "list" | "kanban";
export type SortOption = "newest" | "oldest" | "dueDate_asc" | "dueDate_desc" | "priority";
export type FilterOption = "all" | "todo" | "in_progress" | "done" | "archived" | "high_priority";

const KANBAN_COLUMNS = [
  { id: "To Do", title: "Cần làm", badgeBg: "bg-slate-100 text-slate-700", dotColor: "bg-slate-400" },
  { id: "In Progress", title: "Đang làm", badgeBg: "bg-blue-100 text-blue-700", dotColor: "bg-blue-500 animate-pulse" },
  { id: "Done", title: "Hoàn thành", badgeBg: "bg-emerald-100 text-emerald-700", dotColor: "bg-emerald-500" },
];

export default function MyTasksPage() {
  const queryClient = useQueryClient();
  const { data: rawTasks, isLoading, isError, refetch } = useGetMyTasks();
  const { mutate: updateTaskMutate } = useUpdateTask();
  const { mutate: deleteTaskMutate } = useDeleteTask();

  // Local Controls State
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [filter, setFilter] = useState<FilterOption>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [selectedWorkspaceFilter, setSelectedWorkspaceFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [selectedTask, setSelectedTask] = useState<any | null>(null);

  // Drag Drop State for Kanban View
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  // Extract unique workspaces list from user's tasks
  const workspaces = useMemo(() => {
    if (!Array.isArray(rawTasks)) return [];
    const map = new Map<string, { id: string; name: string }>();
    rawTasks.forEach((t) => {
      const ws = t.project?.workspace;
      if (ws && (ws._id || ws.id)) {
        const id = ws._id || ws.id;
        if (!map.has(id)) {
          map.set(id, { id, name: ws.name || "Workspace" });
        }
      }
    });
    return Array.from(map.values());
  }, [rawTasks]);

  // Filter & Sort Tasks
  const processedTasks = useMemo(() => {
    if (!Array.isArray(rawTasks)) return [];

    let list = [...rawTasks];

    // 0. Workspace Filter
    if (selectedWorkspaceFilter !== "all") {
      list = list.filter((t) => {
        const wsId = t.project?.workspace?._id || t.project?.workspace?.id || t.project?.workspace;
        return wsId === selectedWorkspaceFilter;
      });
    }

    // 1. Search Query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          t.title?.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query)
      );
    }

    // 2. Filter
    switch (filter) {
      case "todo":
        list = list.filter((t) => !t.isArchived && (t.status === "To Do" || t.status === "todo"));
        break;
      case "in_progress":
        list = list.filter((t) => !t.isArchived && (t.status === "In Progress" || t.status === "in_progress"));
        break;
      case "done":
        list = list.filter((t) => !t.isArchived && (t.status === "Done" || t.status === "done" || t.status === "Completed"));
        break;
      case "archived":
        list = list.filter((t) => t.isArchived === true);
        break;
      case "high_priority":
        list = list.filter((t) => !t.isArchived && t.priority === "High");
        break;
      case "all":
      default:
        list = list.filter((t) => !t.isArchived);
        break;
    }

    // 3. Sort
    list.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt || Date.now()).getTime() - new Date(a.createdAt || Date.now()).getTime();
      }
      if (sortBy === "oldest") {
        return new Date(a.createdAt || Date.now()).getTime() - new Date(b.createdAt || Date.now()).getTime();
      }
      if (sortBy === "dueDate_asc") {
        const aTime = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const bTime = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        return aTime - bTime;
      }
      if (sortBy === "dueDate_desc") {
        const aTime = a.dueDate ? new Date(a.dueDate).getTime() : -Infinity;
        const bTime = b.dueDate ? new Date(b.dueDate).getTime() : -Infinity;
        return bTime - aTime;
      }
      if (sortBy === "priority") {
        const priScore: Record<string, number> = { High: 3, Medium: 2, Low: 1 };
        return (priScore[b.priority || "Medium"] || 2) - (priScore[a.priority || "Medium"] || 2);
      }
      return 0;
    });

    return list;
  }, [rawTasks, filter, sortBy, searchQuery]);

  // Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("text/plain", taskId);
    setDraggingTaskId(taskId);
  };

  const handleDrop = (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    setDragOverCol(null);
    const taskId = e.dataTransfer.getData("text/plain") || draggingTaskId;
    setDraggingTaskId(null);

    if (!taskId) return;

    updateTaskMutate(
      { id: taskId, data: { status: targetStatus } },
      {
        onSuccess: () => {
          toast.success(`Đã chuyển sang "${targetStatus}"`);
          refetch();
          queryClient.invalidateQueries({ queryKey: ["projects"] });
        },
        onError: () => {
          toast.error("Cập nhật thất bại");
        },
      }
    );
  };

  const handleDeleteTask = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    if (confirm("Bạn có chắc chắn muốn xóa công việc này?")) {
      deleteTaskMutate(taskId, {
        onSuccess: () => {
          toast.success("Đã xóa công việc");
          refetch();
          queryClient.invalidateQueries({ queryKey: ["projects"] });
        },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-72 rounded-xl" />
        <Skeleton className="h-12 w-full rounded-2xl" />
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-20 text-center space-y-4">
        <AlertCircle className="size-10 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Không thể tải danh sách công việc</h2>
        <Button onClick={() => refetch()} variant="outline">Thử lại</Button>
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
            Công việc của tôi (My Tasks)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý tất cả công việc được giao hoặc do bạn khởi tạo.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              viewMode === "list"
                ? "bg-white text-blue-600 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <ListTodo className="size-4" />
            Danh sách (List)
          </button>
          <button
            onClick={() => setViewMode("kanban")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              viewMode === "kanban"
                ? "bg-white text-blue-600 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <LayoutGrid className="size-4" />
            Bảng (Kanban)
          </button>
        </div>
      </div>

      {/* Control Bar: Search + Filter Tabs + Sort */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white border border-slate-200/80 p-3.5 rounded-2xl shadow-xs">
        
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          {[
            { id: "all", label: "Tất cả" },
            { id: "todo", label: "Cần làm" },
            { id: "in_progress", label: "Đang làm" },
            { id: "done", label: "Hoàn thành" },
            { id: "high_priority", label: "Ưu tiên cao" },
            { id: "archived", label: "Đã lưu trữ" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id as FilterOption)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                filter === item.id
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Search, Workspace & Sort Controls */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap">
          {/* Workspace Filter Select */}
          {workspaces.length > 0 && (
            <div className="w-48">
              <Select value={selectedWorkspaceFilter} onValueChange={setSelectedWorkspaceFilter}>
                <SelectTrigger className="h-9 text-xs font-semibold rounded-xl bg-slate-50">
                  <SelectValue placeholder="Tất cả Workspace" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả Workspace</SelectItem>
                  {workspaces.map((ws) => (
                    <SelectItem key={ws.id} value={ws.id}>
                      {ws.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Search Input */}
          <div className="relative flex-1 sm:w-52">
            <Search className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm tên công việc..."
              className="pl-9 h-9 text-xs rounded-xl bg-slate-50 border-slate-200"
            />
          </div>

          {/* Sort Select */}
          <div className="w-44">
            <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
              <SelectTrigger className="h-9 text-xs font-semibold rounded-xl bg-slate-50">
                <SelectValue placeholder="Sắp xếp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Mới nhất trước</SelectItem>
                <SelectItem value="oldest">Cũ nhất trước</SelectItem>
                <SelectItem value="dueDate_asc">Hạn chót gần nhất</SelectItem>
                <SelectItem value="dueDate_desc">Hạn chót xa nhất</SelectItem>
                <SelectItem value="priority">Mức ưu tiên cao</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

      </div>

      {/* Main View Area */}
      {processedTasks.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-200 rounded-2xl py-16 text-center space-y-3">
          <ListTodo className="size-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">Không tìm thấy công việc nào</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm để xem danh sách công việc.
          </p>
        </div>
      ) : viewMode === "list" ? (
        /* VIETNAMESE & ENHANCED FONT & DISTINCT COLOR LIST VIEW */
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs divide-y divide-slate-100">
          {processedTasks.map((task) => {
            const isDone = task.status === "Done" || task.status === "done" || task.status === "Completed";
            const isInProgress = task.status === "In Progress" || task.status === "in_progress";
            const isOverdue =
              task.dueDate &&
              new Date(task.dueDate).getTime() < Date.now() &&
              !isDone;

            const formatLongDateVi = (dString?: string) => {
              if (!dString) return null;
              const date = new Date(dString);
              return date.toLocaleDateString("vi-VN", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              });
            };

            const getStatusBadge = () => {
              if (isDone) {
                return (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                    Hoàn thành
                  </span>
                );
              }
              if (isInProgress) {
                return (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-sky-50 text-sky-700 border border-sky-200/80">
                    Đang làm
                  </span>
                );
              }
              return (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200/80">
                  Cần làm
                </span>
              );
            };

            const getPriorityBadge = () => {
              const pri = task.priority;
              if (pri === "High") {
                return (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 border border-rose-200/80">
                    Ưu tiên cao
                  </span>
                );
              }
              if (pri === "Low") {
                return (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                    Ưu tiên thấp
                  </span>
                );
              }
              return (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200/80">
                  Ưu tiên trung bình
                </span>
              );
            };

            return (
              <div
                key={task._id || task.id}
                onClick={() => setSelectedTask(task)}
                className="group p-5 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
              >
                {/* Left Side: Status Icon + Title + Badges */}
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  {/* Status Circle Icon */}
                  <div
                    className={`size-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      isDone
                        ? "bg-emerald-100 text-emerald-600"
                        : isInProgress
                        ? "bg-amber-100 text-amber-600"
                        : "bg-blue-100 text-blue-600"
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="size-4.5" />
                    ) : (
                      <Clock className="size-4.5" />
                    )}
                  </div>

                  <div className="space-y-2 min-w-0 flex-1">
                    {/* Title + External Arrow */}
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                        {task.title}
                      </h3>
                      <span className="text-slate-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                        ↗
                      </span>
                    </div>

                    {/* Status & Priority Badges Row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {getStatusBadge()}
                      {getPriorityBadge()}
                    </div>
                  </div>
                </div>

                {/* Right Side: Due Date + Project Name + Modified Date */}
                <div className="flex flex-col items-start sm:items-end justify-center text-sm space-y-1 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  {/* Due Date */}
                  {task.dueDate ? (
                    <div
                      className={`font-semibold ${
                        isOverdue
                          ? "text-rose-600 font-bold"
                          : isDone
                          ? "text-slate-400"
                          : "text-amber-600 font-bold"
                      }`}
                    >
                      Hạn: {formatLongDateVi(task.dueDate)}
                      {isOverdue && (
                        <span className="bg-rose-100 text-rose-700 text-[11px] font-bold px-2 py-0.5 rounded-md ml-1.5 border border-rose-200 inline-block">
                          Quá hạn
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="text-slate-400 italic text-xs">Chưa có hạn</div>
                  )}

                  {/* Project Name */}
                  <div className="text-slate-600 font-medium text-xs sm:text-sm">
                    Dự án:{" "}
                    <span className="font-bold text-slate-800">
                      {task.project?.title || task.project?.name || "Chưa gắn dự án"}
                    </span>
                  </div>

                  {/* Modified Date */}
                  {task.updatedAt && (
                    <div className="text-slate-400 text-xs">
                      Cập nhật: {formatLongDateVi(task.updatedAt)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* KANBAN VIEW */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {KANBAN_COLUMNS.map((col) => {
            const colTasks = processedTasks.filter((t) => {
              if (col.id === "To Do") return t.status === "To Do" || t.status === "todo";
              if (col.id === "In Progress") return t.status === "In Progress" || t.status === "in_progress";
              if (col.id === "Done") return t.status === "Done" || t.status === "done";
              return false;
            });

            const isHovered = dragOverCol === col.id;

            return (
              <div
                key={col.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dragOverCol !== col.id) setDragOverCol(col.id);
                }}
                onDragLeave={() => setDragOverCol(null)}
                onDrop={(e) => handleDrop(e, col.id)}
                className={`bg-slate-50/60 border rounded-2xl p-4 min-h-[460px] flex flex-col transition-all ${
                  isHovered
                    ? "border-blue-400 ring-2 ring-blue-500/20 bg-blue-50/50"
                    : "border-slate-200/80"
                }`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/60">
                  <div className="flex items-center gap-2">
                    <span className={`size-2.5 rounded-full ${col.dotColor}`} />
                    <h3 className="font-extrabold text-sm text-slate-800">{col.title}</h3>
                    <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${col.badgeBg}`}>
                      {colTasks.length}
                    </span>
                  </div>
                </div>

                {/* Column Task Cards */}
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[580px]">
                  {colTasks.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                      {isHovered ? "Thả vào đây" : "Chưa có công việc"}
                    </div>
                  ) : (
                    colTasks.map((task) => (
                      <div
                        key={task._id || task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task._id || task.id)}
                        onClick={() => setSelectedTask(task)}
                        className="group bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-xs hover:shadow-md hover:border-blue-400 transition-all cursor-pointer space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider border ${
                              task.priority === "High"
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : task.priority === "Low"
                                ? "bg-slate-100 text-slate-600 border-slate-200"
                                : "bg-blue-50 text-blue-700 border-blue-200"
                            }`}
                          >
                            {task.priority || "Medium"}
                          </span>

                          <GripVertical className="size-3.5 text-slate-300 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>

                        <h4 className="text-sm font-bold text-slate-800 line-clamp-2 group-hover:text-blue-600 transition-colors">
                          {task.title}
                        </h4>

                        {task.project && (
                          <span className="inline-block text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md truncate max-w-full">
                            📁 {task.project?.title || task.project?.name || "Project"}
                          </span>
                        )}

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                          {task.dueDate ? (
                            <span className="flex items-center gap-1 font-medium text-slate-500">
                              <Clock className="size-3" />
                              {new Date(task.dueDate).toLocaleDateString("vi-VN")}
                            </span>
                          ) : (
                            <span />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          refetchTasks={refetch}
        />
      )}
    </div>
  );
}
