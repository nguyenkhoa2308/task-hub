"use client";

import { useEffect, useState } from "react";
import { Archive, Building2, CalendarClock, ChevronLeft, ChevronRight, Eye, FolderKanban, ListTodo, RotateCcw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useGetMyTasks, useUpdateTask } from "@/hooks/use-task";
import { useGetArchivedProjects, useUpdateProject } from "@/hooks/use-project";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageErrorState } from "@/components/ui/page-state";
import {
  ArchivedDetailDialog,
  type ArchivedProjectDetail,
  type ArchivedTaskDetail,
} from "@/components/archive/archived-detail-dialog";

export default function ArchivedPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [projectPage, setProjectPage] = useState(1);
  const [activeTab, setActiveTab] = useState<"tasks" | "projects">("tasks");
  const [selectedDetail, setSelectedDetail] = useState<
    { kind: "task"; item: ArchivedTaskDetail }
    | { kind: "project"; item: ArchivedProjectDetail }
    | null
  >(null);
  const { data, isLoading, isFetching, isError, refetch: refetchTasks } = useGetMyTasks({ isArchived: true, sortBy: "newest", page, limit: 25 });
  const { data: archivedProjectResponse, isLoading: isLoadingProjects, isFetching: isFetchingProjects, isError: isProjectsError, refetch: refetchProjects } = useGetArchivedProjects({ page: projectPage, limit: 12 });
  const { mutate: updateTask, isPending } = useUpdateTask();
  const { mutate: updateProject, isPending: isRestoringProject } = useUpdateProject();
  const tasks = data?.data || [];
  const pagination = data?.pagination;
  const archivedProjects = archivedProjectResponse?.data || [];
  const projectPagination = archivedProjectResponse?.pagination;
  const [showSkeleton, setShowSkeleton] = useState(true);

  useEffect(() => {
    if (isLoading || isFetching || isLoadingProjects) {
      setShowSkeleton(true);
      return;
    }
    const timeout = window.setTimeout(() => setShowSkeleton(false), 450);
    return () => window.clearTimeout(timeout);
  }, [isFetching, isLoading, isLoadingProjects]);

  const unarchive = (taskId: string) => {
    updateTask({ id: taskId, data: { isArchived: false } }, {
      onSuccess: () => {
        toast.success("Đã đưa công việc trở lại My Tasks");
        setSelectedDetail(null);
        queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
      },
      onError: (error: Error) => toast.error(error.message || "Không thể đưa công việc trở lại"),
    });
  };

  const restoreProject = (projectId: string) => {
    updateProject({ id: projectId, data: { isArchived: false } }, {
      onSuccess: () => {
        toast.success("Đã khôi phục dự án");
        setSelectedDetail(null);
        queryClient.invalidateQueries({ queryKey: ["archived-projects"] });
        queryClient.invalidateQueries({ queryKey: ["projects"] });
      },
      onError: (error: Error) => toast.error(error.message || "Không thể đưa dự án trở lại"),
    });
  };

  return (
    <div className="w-full space-y-6 pb-12">
      <div className="border-b border-slate-200/80 pb-5">
        <h1 className="flex items-center gap-2.5 text-2xl font-extrabold tracking-tight text-slate-800"><Archive className="size-7 text-blue-600" />Đã lưu trữ</h1>
        <p className="mt-1 text-sm text-slate-500">Cất những công việc và dự án chưa cần theo dõi nhưng vẫn muốn giữ lại.</p>
      </div>

      <div className="flex w-full gap-6 overflow-x-auto border-b border-slate-200 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button type="button" onClick={() => setActiveTab("tasks")} className={`relative flex h-11 shrink-0 items-center gap-2 px-0.5 text-sm font-bold transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full ${activeTab === "tasks" ? "text-blue-700 after:bg-blue-600" : "text-slate-500 after:bg-transparent hover:text-slate-800"}`}><ListTodo className="size-4 shrink-0" /><span>Công việc</span><span className={`min-w-5 rounded-full px-1.5 py-0.5 text-center text-[11px] ${activeTab === "tasks" ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-500"}`}>{(pagination?.total ?? tasks.length) > 9 ? "9+" : (pagination?.total ?? tasks.length)}</span></button>
        <button type="button" onClick={() => setActiveTab("projects")} className={`relative flex h-11 shrink-0 items-center gap-2 px-0.5 text-sm font-bold transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full ${activeTab === "projects" ? "text-blue-700 after:bg-blue-600" : "text-slate-500 after:bg-transparent hover:text-slate-800"}`}><FolderKanban className="size-4 shrink-0" /><span>Dự án</span><span className={`min-w-5 rounded-full px-1.5 py-0.5 text-center text-[11px] ${activeTab === "projects" ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-500"}`}>{(projectPagination?.total || 0) > 9 ? "9+" : (projectPagination?.total || 0)}</span></button>
      </div>

      <p className="rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm text-blue-800">
        Mục đã lưu trữ được giữ ở chế độ chỉ đọc. Hãy đưa mục trở lại trước khi chỉnh sửa.
      </p>

      {activeTab === "projects" && showSkeleton && <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 12 }).map((_, index) => <div key={index} className="h-[190px] overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="flex justify-between border-b border-slate-100 px-4 py-3"><Skeleton className="h-4 w-20" /><Skeleton className="h-3 w-20" /></div><div className="space-y-3 px-4 py-4"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-2/3" /><Skeleton className="h-4 w-32" /></div></div>)}</div>}
      {!showSkeleton && activeTab === "projects" && isProjectsError && <PageErrorState compact title="Không thể tải dự án lưu trữ" onRetry={() => refetchProjects()} />}

      {!showSkeleton && activeTab === "projects" && archivedProjects.length > 0 && (
        <section className="space-y-3">
          <div><h2 className="text-base font-bold text-slate-900">Dự án đã lưu trữ</h2><p className="text-xs text-slate-500">Khôi phục dự án để đưa nó trở lại workspace.</p></div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {archivedProjects.map((project: any) => (
              <article key={project._id} onClick={() => setSelectedDetail({ kind: "project", item: project })} className="flex min-h-[190px] cursor-pointer flex-col rounded-xl border border-slate-200 bg-white transition-colors hover:border-blue-300">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700"><FolderKanban className="size-3.5" />Dự án</span><span className="flex items-center gap-1.5 text-[11px] text-slate-400"><CalendarClock className="size-3.5" />{project.archivedAt ? new Date(project.archivedAt).toLocaleDateString("vi-VN") : "—"}</span></div>
                <div className="flex-1 px-4 py-4"><h3 className="line-clamp-2 text-base font-bold leading-6 text-slate-900">{project.title}</h3><p className="mt-1.5 line-clamp-2 text-sm leading-5 text-slate-500">{project.description || "Dự án không có mô tả."}</p><p className="mt-4 flex items-center gap-2 truncate text-xs text-slate-600"><Building2 className="size-3.5 shrink-0 text-slate-400" />{project.workspace?.name || "Không xác định workspace"}</p></div>
                <div className="flex justify-end gap-1 border-t border-slate-100 px-4 py-3"><Button variant="ghost" size="sm" onClick={(event) => { event.stopPropagation(); setSelectedDetail({ kind: "project", item: project }); }} className="h-8 gap-1.5 px-2.5 text-slate-600"><Eye className="size-3.5" />Chi tiết</Button><Button variant="ghost" size="sm" disabled={isRestoringProject} onClick={(event) => { event.stopPropagation(); restoreProject(project._id); }} className="h-8 gap-1.5 px-2.5 text-blue-600 hover:bg-blue-50 hover:text-blue-700"><RotateCcw className="size-3.5" />Đưa trở lại</Button></div>
              </article>
            ))}
          </div>
        </section>
      )}

      {!showSkeleton && activeTab === "projects" && archivedProjects.length === 0 && !isProjectsError && (
        <div className="flex min-h-[40vh] flex-col items-center justify-center text-center"><FolderKanban className="size-10 text-slate-300" /><h2 className="mt-4 text-lg font-bold text-slate-900">Chưa có dự án lưu trữ</h2><p className="mt-1 text-sm text-slate-500">Dự án được lưu trữ sẽ xuất hiện tại đây.</p></div>
      )}

      {activeTab === "tasks" && (showSkeleton ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 12 }).map((_, index) => (
            <div key={index} className="h-[244px] overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><Skeleton className="h-4 w-20" /><Skeleton className="h-3 w-24" /></div>
              <div className="space-y-2.5 px-4 py-3.5"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-2/3" /><div className="space-y-1.5 pt-1"><Skeleton className="h-3.5 w-36" /><Skeleton className="h-3.5 w-44" /></div></div>
              <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3"><Skeleton className="h-6 w-16" /><Skeleton className="h-8 w-28" /></div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <PageErrorState compact title="Không thể tải công việc lưu trữ" onRetry={() => refetchTasks()} />
      ) : tasks.length === 0 && archivedProjects.length === 0 ? (
        <div className="flex min-h-[45vh] flex-col items-center justify-center text-center"><Archive className="size-10 text-slate-300" /><h2 className="mt-4 text-lg font-bold text-slate-900">Chưa có mục lưu trữ</h2><p className="mt-1 text-sm text-slate-500">Công việc và dự án đã lưu trữ sẽ xuất hiện tại đây.</p></div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {tasks.map((task: any) => {
            const archivedDate = task.archivedAt || task.updatedAt;
            const status = String(task.status || "").toLowerCase();
            const statusLabel = status.includes("done") ? "Hoàn thành" : status.includes("progress") ? "Đang làm" : status.includes("review") ? "Đang review" : "Cần làm";
            return (
              <article key={task._id} onClick={() => setSelectedDetail({ kind: "task", item: task })} className="flex min-h-[244px] cursor-pointer flex-col rounded-xl border border-slate-200 bg-white transition-colors hover:border-blue-300">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700"><Archive className="size-3.5" />Đã lưu trữ</span><span className="flex items-center gap-1.5 text-[11px] text-slate-400"><CalendarClock className="size-3.5" />{archivedDate ? new Date(archivedDate).toLocaleDateString("vi-VN") : "—"}</span></div>
                <div className="flex-1 px-4 py-4"><h2 className="line-clamp-2 text-base font-bold leading-6 text-slate-900">{task.title}</h2><p className="mt-1.5 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">{task.description || "Công việc không có mô tả."}</p><div className="mt-4 space-y-2 text-xs text-slate-600"><div className="flex min-w-0 items-center gap-2"><Building2 className="size-3.5 shrink-0 text-slate-400" /><span className="truncate">{task.project?.workspace?.name || "Không xác định workspace"}</span></div><div className="flex min-w-0 items-center gap-2"><FolderKanban className="size-3.5 shrink-0 text-slate-400" /><span className="truncate">{task.project?.title || task.project?.name || "Không xác định dự án"}</span></div></div></div>
                <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3"><span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">{statusLabel}</span><div className="flex gap-1"><Button variant="ghost" size="sm" onClick={(event) => { event.stopPropagation(); setSelectedDetail({ kind: "task", item: task }); }} className="h-8 gap-1.5 px-2.5 text-slate-600"><Eye className="size-3.5" />Chi tiết</Button><Button variant="ghost" size="sm" disabled={isPending} onClick={(event) => { event.stopPropagation(); unarchive(task._id); }} className="h-8 gap-1.5 px-2.5 text-blue-600 hover:bg-blue-50 hover:text-blue-700"><RotateCcw className="size-3.5" />Đưa trở lại</Button></div></div>
              </article>
            );
          })}
        </div>
      ))}

      {activeTab === "tasks" && pagination && pagination.totalPages > 1 && <div className="flex items-center justify-between"><span className="text-xs text-slate-500">{pagination.total} công việc</span><div className="flex items-center gap-2"><Button variant="outline" size="sm" disabled={page <= 1 || isFetching} onClick={() => setPage((value) => value - 1)}><ChevronLeft className="size-4" />Trước</Button><span className="text-xs font-semibold text-slate-600">{page} / {pagination.totalPages}</span><Button variant="outline" size="sm" disabled={page >= pagination.totalPages || isFetching} onClick={() => setPage((value) => value + 1)}>Sau<ChevronRight className="size-4" /></Button></div></div>}
      {activeTab === "projects" && projectPagination && projectPagination.totalPages > 1 && <div className="flex items-center justify-between"><span className="text-xs text-slate-500">{projectPagination.total} dự án</span><div className="flex items-center gap-2"><Button variant="outline" size="sm" disabled={projectPage <= 1 || isFetchingProjects} onClick={() => setProjectPage((value) => value - 1)}><ChevronLeft className="size-4" />Trước</Button><span className="text-xs font-semibold text-slate-600">{projectPage} / {projectPagination.totalPages}</span><Button variant="outline" size="sm" disabled={projectPage >= projectPagination.totalPages || isFetchingProjects} onClick={() => setProjectPage((value) => value + 1)}>Sau<ChevronRight className="size-4" /></Button></div></div>}

      <ArchivedDetailDialog
        detail={selectedDetail}
        onOpenChange={(open) => { if (!open) setSelectedDetail(null); }}
        onRestore={(kind, id) => kind === "task" ? unarchive(id) : restoreProject(id)}
        isRestoring={isPending || isRestoringProject}
      />
    </div>
  );
}
