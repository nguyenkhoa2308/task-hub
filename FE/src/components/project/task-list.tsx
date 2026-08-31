"use client";

import React, { useState } from "react";
import { useDeleteTask, useGetTasksByProject, useRestoreTask } from "@/hooks/use-task";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { TaskGroupedList } from "@/components/task/task-grouped-list";
import type { SharedKanbanTask } from "@/components/task/task-kanban-board";
import { TaskDetailModal } from "@/components/task/task-detail-modal";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CreateTaskDialog } from "@/components/task/create-task-dialog";

export function TaskList({ projectId, canEdit, projectStatus = 'PLANNING', projectMembers = [] }: { projectId: string; canEdit: boolean; projectStatus?: string; projectMembers?: any[] }) {
  const lockLabels: Record<string, string> = { ON_HOLD: 'Dự án đang tạm dừng', COMPLETED: 'Dự án đã hoàn thành', CANCELLED: 'Dự án đã hủy' };
  const lockLabel = lockLabels[projectStatus];
  const taskCanEdit = canEdit && !lockLabel;
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [selectedTask, setSelectedTask] = useState<SharedKanbanTask | null>(null);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const { mutate: deleteTask } = useDeleteTask();
  const { mutate: restoreTask } = useRestoreTask();
  const { data: response, isLoading, isFetching, isError } = useGetTasksByProject(projectId, { page, limit: 25 });
  const tasks = response?.data || [];
  const pagination = response?.pagination;

  const handleDeleteTask = (taskId: string) => {
    deleteTask(taskId, {
      onSuccess: () => {
        toast.success("Đã chuyển công việc vào thùng rác", {
          duration: 8000,
          action: {
            label: "Hoàn tác",
            onClick: () => restoreTask(taskId, {
              onSuccess: () => {
                toast.success("Đã khôi phục công việc");
                queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
                queryClient.invalidateQueries({ queryKey: ["projects"] });
              },
            }),
          },
        });
        queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
        queryClient.invalidateQueries({ queryKey: ["projects"] });
      },
      onError: () => toast.error("Không thể xóa công việc"),
    });
  };

  if (isLoading) {
    return <p className="text-sm text-slate-500">Đang tải danh sách công việc...</p>;
  }

  if (isError) {
    return <p className="text-sm text-rose-600">Không thể tải danh sách công việc.</p>;
  }

  return (
    <div className="space-y-3">
      {lockLabel && <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">{lockLabel}. Hãy mở lại dự án để thay đổi công việc.</div>}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5">
        <span className="text-sm font-semibold text-slate-600">
          {pagination?.total || tasks.length} công việc
        </span>
        <Button
          type="button"
          size="sm"
          disabled={!taskCanEdit}
          onClick={() => setIsCreateTaskOpen(true)}
          className="h-9 gap-1.5 rounded-xl px-3 text-sm font-bold"
        >
          <Plus className="size-4" />
          Thêm công việc
        </Button>
      </div>
      <div className={`transition-opacity ${isFetching ? "opacity-60" : "opacity-100"}`}>
        <TaskGroupedList tasks={tasks} canEdit={taskCanEdit} onTaskClick={setSelectedTask} onDeleteTask={taskCanEdit ? handleDeleteTask : undefined} />
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2.5">
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

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          canEdit={taskCanEdit}
          refetchTasks={() => queryClient.invalidateQueries({ queryKey: ["tasks", projectId] })}
        />
      )}
      <CreateTaskDialog
        isOpen={isCreateTaskOpen}
        onOpenChange={setIsCreateTaskOpen}
        projectId={projectId}
        projectMembers={projectMembers.filter((member) => member.role !== "viewer")}
      />
    </div>
  );
}
