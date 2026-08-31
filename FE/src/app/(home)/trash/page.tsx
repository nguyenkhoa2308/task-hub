"use client";

import { useEffect, useState } from "react";
import { Building2, CalendarClock, ChevronLeft, ChevronRight, FolderKanban, ListTodo, RotateCcw, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useGetDeletedTasks, useRestoreTask } from "@/hooks/use-task";
import { useGetDeletedProjects, useRestoreProject } from "@/hooks/use-project";
import { useGetDeletedWorkspaces, useRestoreWorkspace } from "@/hooks/use-workspace";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageErrorState } from "@/components/ui/page-state";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useEmptyTrash, usePermanentDeleteTrash } from "@/hooks/use-trash";

export default function TrashPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [projectPage, setProjectPage] = useState(1);
  const [workspacePage, setWorkspacePage] = useState(1);
  const [activeTab, setActiveTab] = useState<"tasks" | "projects" | "workspaces">("tasks");
  const [selected, setSelected] = useState<Record<"tasks" | "projects" | "workspaces", string[]>>({ tasks: [], projects: [], workspaces: [] });
  const [deleteMode, setDeleteMode] = useState<"selected" | "all" | null>(null);
  const { data, isLoading, isFetching, isError, refetch: refetchTasks } = useGetDeletedTasks({ page, limit: 25 });
  const { data: deletedProjectResponse, isLoading: isLoadingProjects, isFetching: isFetchingProjects, isError: isProjectsError, refetch: refetchProjects } = useGetDeletedProjects({ page: projectPage, limit: 12 });
  const { data: deletedWorkspaceResponse, isLoading: isLoadingWorkspaces, isFetching: isFetchingWorkspaces, isError: isWorkspacesError, refetch: refetchWorkspaces } = useGetDeletedWorkspaces({ page: workspacePage, limit: 12 });
  const { mutate: restoreTask, isPending } = useRestoreTask();
  const { mutate: restoreProject, isPending: isRestoringProject } = useRestoreProject();
  const { mutate: restoreWorkspace, isPending: isRestoringWorkspace } = useRestoreWorkspace();
  const { mutate: permanentlyDelete, isPending: isPermanentlyDeleting } = usePermanentDeleteTrash();
  const { mutate: emptyTrash, isPending: isEmptying } = useEmptyTrash();
  const tasks = data?.data || [];
  const pagination = data?.pagination;
  const deletedProjects = deletedProjectResponse?.data || [];
  const projectPagination = deletedProjectResponse?.pagination;
  const deletedWorkspaces = deletedWorkspaceResponse?.data || [];
  const workspacePagination = deletedWorkspaceResponse?.pagination;
  const skeletonCount = 12;
  const [showSkeleton, setShowSkeleton] = useState(true);
  const currentItems = activeTab === "tasks" ? tasks : activeTab === "projects" ? deletedProjects : deletedWorkspaces;
  const selectedIds = selected[activeTab];
  const toggleSelected = (id: string) => setSelected((current) => ({
    ...current,
    [activeTab]: current[activeTab].includes(id) ? current[activeTab].filter((item) => item !== id) : [...current[activeTab], id],
  }));
  const confirmPermanentDelete = () => {
    if (deleteMode === "all") {
      emptyTrash(undefined, {
        onSuccess: (result) => { toast.success(`Đã dọn ${result.deleted} mục`); setSelected({ tasks: [], projects: [], workspaces: [] }); setDeleteMode(null); },
        onError: (error: Error) => toast.error(error.message),
      });
      return;
    }
    permanentlyDelete({ kind: activeTab, ids: selectedIds }, {
      onSuccess: (result) => { toast.success(`Đã xóa vĩnh viễn ${result.deleted} mục`); setSelected((current) => ({ ...current, [activeTab]: [] })); setDeleteMode(null); },
      onError: (error: Error) => toast.error(error.message),
    });
  };

  useEffect(() => {
    if (isLoading || isFetching || isLoadingProjects || isLoadingWorkspaces) {
      setShowSkeleton(true);
      return;
    }

    const timeout = window.setTimeout(() => setShowSkeleton(false), 450);
    return () => window.clearTimeout(timeout);
  }, [isFetching, isLoading, isLoadingProjects, isLoadingWorkspaces]);

  const restore = (taskId: string) => {
    restoreTask(taskId, {
      onSuccess: () => {
        toast.success("Đã khôi phục công việc");
        queryClient.invalidateQueries({ queryKey: ["trash-tasks"] });
        queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
        queryClient.invalidateQueries({ queryKey: ["projects"] });
      },
      onError: (error: Error) => toast.error(error.message || "Không thể khôi phục công việc"),
    });
  };

  const restoreDeletedProject = (projectId: string) => {
    restoreProject(projectId, {
      onSuccess: () => {
        toast.success("Đã khôi phục dự án");
        queryClient.invalidateQueries({ queryKey: ["trash-projects"] });
        queryClient.invalidateQueries({ queryKey: ["projects"] });
        queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      },
      onError: (error: Error) => toast.error(error.message || "Không thể khôi phục dự án"),
    });
  };

  const restoreDeletedWorkspace = (workspaceId: string) => {
    restoreWorkspace(workspaceId, {
      onSuccess: () => toast.success("Đã khôi phục workspace và các dự án bên trong"),
      onError: (error: Error) => toast.error(error.message || "Không thể khôi phục workspace"),
    });
  };

  return (
    <div className="w-full space-y-6 pb-12">
      <div className="border-b border-slate-200/80 pb-5">
        <h1 className="flex items-center gap-2.5 text-2xl font-extrabold tracking-tight text-slate-800"><Trash2 className="size-7 text-blue-600" />Thùng rác</h1>
        <p className="mt-1 text-sm text-slate-500">Khôi phục dữ liệu đã xoá trước khi hệ thống tự động xoá vĩnh viễn sau 30 ngày.</p>
      </div>

      <div className="flex w-full gap-6 overflow-x-auto border-b border-slate-200 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {[
          { id: "tasks" as const, label: "Công việc", icon: ListTodo, total: pagination?.total ?? tasks.length },
          { id: "projects" as const, label: "Dự án", icon: FolderKanban, total: projectPagination?.total || 0 },
          { id: "workspaces" as const, label: "Workspace", icon: Building2, total: workspacePagination?.total || 0 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`relative flex h-11 shrink-0 items-center gap-2 px-0.5 text-sm font-bold transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full ${isActive ? "text-blue-700 after:bg-blue-600" : "text-slate-500 after:bg-transparent hover:text-slate-800"}`}>
              <Icon className="size-4 shrink-0" />
              <span>{tab.label}</span>
              <span className={`min-w-5 shrink-0 rounded-full px-1.5 py-0.5 text-center text-[11px] ${isActive ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-500"}`}>{tab.total > 9 ? "9+" : tab.total}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-600">
          <input type="checkbox" className="size-4 rounded" checked={currentItems.length > 0 && currentItems.every((item: any) => selectedIds.includes(item._id))} onChange={(event) => setSelected((current) => ({ ...current, [activeTab]: event.target.checked ? currentItems.map((item: any) => item._id) : [] }))} />
          Chọn trang hiện tại
        </label>
        <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:items-center">
          {selectedIds.length > 0 && <Button variant="destructive" size="sm" onClick={() => setDeleteMode("selected")} className="w-full justify-center font-bold sm:w-auto"><Trash2 className="mr-1.5 size-4" />Xóa vĩnh viễn ({selectedIds.length})</Button>}
          <Button variant="outline" size="sm" className="w-full justify-center font-bold text-rose-600 hover:text-rose-700 sm:w-auto" onClick={() => setDeleteMode("all")} disabled={(pagination?.total || 0) + (projectPagination?.total || 0) + (workspacePagination?.total || 0) === 0}>Dọn sạch thùng rác</Button>
        </div>
      </div>

      {activeTab === "projects" && showSkeleton && <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 12 }).map((_, index) => <div key={index} className="h-[210px] overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="flex justify-between border-b border-slate-100 px-4 py-3"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-20" /></div><div className="space-y-3 px-4 py-4"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-2/3" /><Skeleton className="h-4 w-32" /></div></div>)}</div>}

      {!showSkeleton && activeTab === "projects" && isProjectsError && <PageErrorState compact title="Không thể tải dự án trong thùng rác" onRetry={() => refetchProjects()} />}
      {!showSkeleton && activeTab === "projects" && !isProjectsError && deletedProjects.length === 0 && <div className="flex min-h-[40vh] flex-col items-center justify-center text-center"><FolderKanban className="size-10 text-slate-300" /><h2 className="mt-4 text-lg font-bold text-slate-900">Không có dự án trong thùng rác</h2><p className="mt-1 text-sm text-slate-500">Dự án đã xoá sẽ xuất hiện tại đây để bạn khôi phục.</p></div>}
      {!showSkeleton && activeTab === "projects" && deletedProjects.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {deletedProjects.map((project: any) => (
            <article key={project._id} className={`relative flex min-h-[210px] flex-col rounded-xl border bg-white ${selected.projects.includes(project._id) ? "border-blue-400 ring-2 ring-blue-100" : "border-slate-200"}`}>
              <input type="checkbox" aria-label={`Chọn dự án ${project.title}`} checked={selected.projects.includes(project._id)} onChange={() => toggleSelected(project._id)} className="absolute left-3 top-3 z-10 size-4 rounded" />
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600"><Trash2 className="size-3.5" />Dự án đã xoá</span><span className="flex items-center gap-1.5 text-[11px] text-slate-400"><CalendarClock className="size-3.5" />{project.deletedAt ? new Date(project.deletedAt).toLocaleDateString("vi-VN") : "—"}</span></div>
              <div className="flex-1 px-4 py-4"><h2 className="line-clamp-2 text-base font-bold leading-6 text-slate-900">{project.title}</h2><p className="mt-1.5 line-clamp-2 text-sm leading-5 text-slate-500">{project.description || "Dự án không có mô tả."}</p><p className="mt-4 flex items-center gap-2 truncate text-xs text-slate-600"><Building2 className="size-3.5 shrink-0 text-slate-400" />{project.workspace?.name || "Không xác định workspace"}</p></div>
              <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3"><span className={`rounded-md px-2 py-1 text-[10px] font-semibold ${project.expiresAt && Math.ceil((new Date(project.expiresAt).getTime() - Date.now()) / 86400000) <= 7 ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}>Tự xoá sau {project.expiresAt ? Math.max(0, Math.ceil((new Date(project.expiresAt).getTime() - Date.now()) / 86400000)) : 30} ngày</span><Button variant="ghost" size="sm" disabled={isRestoringProject} onClick={() => restoreDeletedProject(project._id)} className="h-8 gap-1.5 px-2.5 text-blue-600 hover:bg-blue-50 hover:text-blue-700"><RotateCcw className="size-3.5" />Khôi phục</Button></div>
            </article>
          ))}
        </div>
      )}

      {activeTab === "workspaces" && showSkeleton && <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, index) => <div key={index} className="h-[190px] overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="flex justify-between border-b border-slate-100 px-4 py-3"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-20" /></div><div className="space-y-3 px-4 py-4"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-28" /></div></div>)}</div>}
      {!showSkeleton && activeTab === "workspaces" && isWorkspacesError && <PageErrorState compact title="Không thể tải workspace trong thùng rác" onRetry={() => refetchWorkspaces()} />}
      {!showSkeleton && activeTab === "workspaces" && !isWorkspacesError && deletedWorkspaces.length === 0 && <div className="flex min-h-[40vh] flex-col items-center justify-center text-center"><Building2 className="size-10 text-slate-300" /><h2 className="mt-4 text-lg font-bold text-slate-900">Không có workspace trong thùng rác</h2><p className="mt-1 text-sm text-slate-500">Workspace bạn đã xóa sẽ xuất hiện tại đây.</p></div>}
      {!showSkeleton && activeTab === "workspaces" && deletedWorkspaces.length > 0 && <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{deletedWorkspaces.map((workspace: any) => {
        const daysRemaining = workspace.expiresAt ? Math.max(0, Math.ceil((new Date(workspace.expiresAt).getTime() - Date.now()) / 86400000)) : 30;
        return <article key={workspace._id} className={`relative flex min-h-[190px] flex-col rounded-xl border bg-white ${selected.workspaces.includes(workspace._id) ? "border-blue-400 ring-2 ring-blue-100" : "border-slate-200"}`}><div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><span className="inline-flex items-center gap-2 text-xs font-medium text-rose-600"><input type="checkbox" aria-label={`Chọn workspace ${workspace.name}`} checked={selected.workspaces.includes(workspace._id)} onChange={() => toggleSelected(workspace._id)} className="size-4 rounded" /><Trash2 className="size-3.5" />Workspace đã xoá</span><span className="flex items-center gap-1.5 text-[11px] text-slate-400"><CalendarClock className="size-3.5" />{workspace.deletedAt ? new Date(workspace.deletedAt).toLocaleDateString("vi-VN") : "—"}</span></div><div className="flex-1 px-4 py-4"><h2 className="line-clamp-2 text-base font-bold leading-6 text-slate-900">{workspace.name}</h2><p className="mt-1.5 line-clamp-2 text-sm leading-5 text-slate-500">{workspace.description || "Workspace không có mô tả."}</p><p className="mt-4 text-xs font-medium text-slate-500">{workspace.members?.filter((member: any) => member.status !== "pending").length || 1} thành viên</p></div><div className="flex items-center justify-between border-t border-slate-100 px-4 py-3"><span className={`rounded-md px-2 py-1 text-[10px] font-semibold ${daysRemaining <= 7 ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}>Tự xoá sau {daysRemaining} ngày</span><Button variant="ghost" size="sm" disabled={isRestoringWorkspace} onClick={() => restoreDeletedWorkspace(workspace._id)} className="h-8 gap-1.5 px-2.5 text-blue-600 hover:bg-blue-50 hover:text-blue-700"><RotateCcw className="size-3.5" />Khôi phục</Button></div></article>;
      })}</div>}

      {activeTab === "tasks" && (showSkeleton ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: skeletonCount }).map((_, index) => (
            <div key={index} className="h-[244px] overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><Skeleton className="h-4 w-16" /><Skeleton className="h-3 w-28" /></div>
              <div className="space-y-2.5 px-4 py-3.5"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-2/3" /><div className="space-y-1.5 pt-1"><Skeleton className="h-3.5 w-36" /><Skeleton className="h-3.5 w-44" /></div></div>
              <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3"><Skeleton className="h-6 w-16" /><Skeleton className="h-8 w-24" /></div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <PageErrorState compact title="Không thể tải công việc trong thùng rác" onRetry={() => refetchTasks()} />
      ) : tasks.length === 0 ? (
        <div className="flex min-h-[45vh] flex-col items-center justify-center text-center"><Trash2 className="size-10 text-slate-300" /><h2 className="mt-4 text-lg font-bold text-slate-900">Thùng rác đang trống</h2><p className="mt-1 text-sm text-slate-500">Các công việc đã xoá sẽ xuất hiện tại đây để bạn có thể khôi phục.</p></div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {tasks.map((task: any) => {
            const expiresAt = task.expiresAt ? new Date(task.expiresAt) : null;
            const daysRemaining = expiresAt ? Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000))) : 30;
            const expiryStyle = daysRemaining <= 7 ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700";
            return (
              <article key={task._id} className={`relative flex min-h-[244px] flex-col rounded-xl border bg-white ${selected.tasks.includes(task._id) ? "border-blue-400 ring-2 ring-blue-100" : "border-slate-200"}`}>
                <input type="checkbox" aria-label={`Chọn công việc ${task.title}`} checked={selected.tasks.includes(task._id)} onChange={() => toggleSelected(task._id)} className="absolute left-3 top-3 z-10 size-4 rounded" />
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600"><Trash2 className="size-3.5" />Đã xoá</span>
                  <span className="flex items-center gap-1.5 text-[11px] text-slate-400"><CalendarClock className="size-3.5" />{task.deletedAt ? new Date(task.deletedAt).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}</span>
                </div>

                <div className="flex-1 px-4 py-4">
                  <h2 className="line-clamp-2 text-base font-bold leading-6 text-slate-900">{task.title}</h2>
                  <p className="mt-1.5 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">{task.description || "Công việc không có mô tả."}</p>

                  <div className="mt-4 space-y-2 text-xs text-slate-600">
                    <div className="flex min-w-0 items-center gap-2"><Building2 className="size-3.5 shrink-0 text-slate-400" /><span className="truncate">{task.project?.workspace?.name || "Không xác định workspace"}</span></div>
                    <div className="flex min-w-0 items-center gap-2"><FolderKanban className="size-3.5 shrink-0 text-slate-400" /><span className="truncate">{task.project?.title || task.project?.name || "Không xác định dự án"}</span></div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
                  <span title={expiresAt ? `Tự động xoá ngày ${expiresAt.toLocaleString("vi-VN")}` : undefined} className={`rounded-md px-2 py-1 text-[10px] font-semibold ${expiryStyle}`}>Tự xoá sau {daysRemaining} ngày</span>
                  <Button variant="ghost" size="sm" disabled={isPending} onClick={() => restore(task._id)} className="h-8 gap-1.5 px-2.5 text-blue-600 hover:bg-blue-50 hover:text-blue-700"><RotateCcw className="size-3.5" />Khôi phục</Button>
                </div>
              </article>
            );
          })}
        </div>
      ))}

      {activeTab === "tasks" && pagination && pagination.totalPages > 1 && <div className="flex items-center justify-between"><span className="text-xs text-slate-500">{pagination.total} công việc</span><div className="flex items-center gap-2"><Button variant="outline" size="sm" disabled={page <= 1 || isFetching} onClick={() => setPage((value) => value - 1)}><ChevronLeft className="size-4" />Trước</Button><span className="text-xs font-semibold text-slate-600">{page} / {pagination.totalPages}</span><Button variant="outline" size="sm" disabled={page >= pagination.totalPages || isFetching} onClick={() => setPage((value) => value + 1)}>Sau<ChevronRight className="size-4" /></Button></div></div>}
      {activeTab === "projects" && projectPagination && projectPagination.totalPages > 1 && <div className="flex items-center justify-between"><span className="text-xs text-slate-500">{projectPagination.total} dự án</span><div className="flex items-center gap-2"><Button variant="outline" size="sm" disabled={projectPage <= 1 || isFetchingProjects} onClick={() => setProjectPage((value) => value - 1)}><ChevronLeft className="size-4" />Trước</Button><span className="text-xs font-semibold text-slate-600">{projectPage} / {projectPagination.totalPages}</span><Button variant="outline" size="sm" disabled={projectPage >= projectPagination.totalPages || isFetchingProjects} onClick={() => setProjectPage((value) => value + 1)}>Sau<ChevronRight className="size-4" /></Button></div></div>}
      {activeTab === "workspaces" && workspacePagination && workspacePagination.totalPages > 1 && <div className="flex items-center justify-between"><span className="text-xs text-slate-500">{workspacePagination.total} workspace</span><div className="flex items-center gap-2"><Button variant="outline" size="sm" disabled={workspacePage <= 1 || isFetchingWorkspaces} onClick={() => setWorkspacePage((value) => value - 1)}><ChevronLeft className="size-4" />Trước</Button><span className="text-xs font-semibold text-slate-600">{workspacePage} / {workspacePagination.totalPages}</span><Button variant="outline" size="sm" disabled={workspacePage >= workspacePagination.totalPages || isFetchingWorkspaces} onClick={() => setWorkspacePage((value) => value + 1)}>Sau<ChevronRight className="size-4" /></Button></div></div>}

      <Dialog open={deleteMode !== null} onOpenChange={(open) => !open && setDeleteMode(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{deleteMode === "all" ? "Dọn sạch thùng rác?" : `Xóa vĩnh viễn ${selectedIds.length} mục?`}</DialogTitle>
            <DialogDescription>
              Dữ liệu, bình luận, lịch sử và tệp đính kèm liên quan sẽ bị xóa vĩnh viễn. Thao tác này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteMode(null)} disabled={isPermanentlyDeleting || isEmptying}>Hủy</Button>
            <Button variant="destructive" onClick={confirmPermanentDelete} disabled={isPermanentlyDeleting || isEmptying || (deleteMode === "selected" && selectedIds.length === 0)}>
              {isPermanentlyDeleting || isEmptying ? "Đang xóa..." : "Xóa vĩnh viễn"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
