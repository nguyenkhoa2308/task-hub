"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { useDeleteWorkspace, useGetWorkspaceById, useGetPendingMembers, useUpdateWorkspace } from "@/hooks/use-workspace";
import { useAppSelector } from "@/lib/redux/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkspaceHeader } from "@/components/workspace/workspace-header";
import { ProjectList } from "@/components/workspace/project-list";
import { CreateProjectDialog } from "@/components/workspace/create-project";
import { InviteMemberDialog } from "@/components/workspace/invite-member";
import { PendingMembersDialog } from "@/components/workspace/pending-members";
import type { Member } from "@/types";
import { PageErrorState } from "@/components/ui/page-state";
import { FolderKanban, Settings, Trash2, UserCheck, UserPlus, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ExportReportButton } from "@/components/report/export-report-button";

const WORKSPACE_COLORS = ["#2563eb", "#7c3aed", "#db2777", "#dc2626", "#d97706", "#059669", "#0891b2", "#475569"];

export default function WorkspaceDetailPage() {
    const params = useParams<{ id: string }>();
    const workspaceId = params.id;
    const router = useRouter();
    const queryClient = useQueryClient();
    const currentUser = useAppSelector((state) => state.auth.user);

    const [isCreateProject, setIsCreateProject] = useState(false);
    const [isInviteMember, setIsInviteMember] = useState(false);
    const [isPendingMembers, setIsPendingMembers] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("projects");
    const { mutate: deleteWorkspace, isPending: isDeleting } = useDeleteWorkspace();
    const { mutate: updateWorkspace, isPending: isSavingSettings } = useUpdateWorkspace();
    const [settings, setSettings] = useState({ name: "", description: "", color: "#2563eb", allowMembersCreateProjects: true, allowMembersInvite: false, defaultProjectPrivate: false });

    const { data, isLoading, isError, refetch } = useGetWorkspaceById(workspaceId);
    const { data: pendingMembers } = useGetPendingMembers(workspaceId);
    const pendingCount = pendingMembers?.length || 0;
    const ownerId = typeof data?.owner === "string" ? data.owner : (data?.owner as any)?._id;
    const isOwner = ownerId === currentUser?._id;
    const currentMembership = data?.members?.find((member: any) => (member.user?._id || member.user) === currentUser?._id) as any;
    const canManageWorkspace = isOwner || ['owner', 'admin'].includes(currentMembership?.role);
    const canCreateProject = canManageWorkspace || (currentMembership?.role === 'member' && data?.allowMembersCreateProjects !== false);
    const canInviteMember = canManageWorkspace || (currentMembership?.role === 'member' && Boolean(data?.allowMembersInvite));

    useEffect(() => {
        if (!data) return;
        setSettings({ name: data.name, description: data.description || "", color: data.color || "#2563eb", allowMembersCreateProjects: data.allowMembersCreateProjects !== false, allowMembersInvite: Boolean(data.allowMembersInvite), defaultProjectPrivate: Boolean(data.defaultProjectPrivate) });
    }, [data]);

    const saveSettings = () => {
        if (settings.name.trim().length < 3) return toast.error("Tên workspace phải có ít nhất 3 ký tự");
        updateWorkspace({ id: workspaceId, data: { ...settings, name: settings.name.trim(), description: settings.description.trim() } }, {
            onSuccess: () => { toast.success("Đã lưu cài đặt workspace"); queryClient.invalidateQueries({ queryKey: ["workspace", workspaceId] }); queryClient.invalidateQueries({ queryKey: ["workspaces"] }); },
            onError: (error: Error) => toast.error(error.message || "Không thể lưu cài đặt"),
        });
    };

    const handleDeleteWorkspace = () => {
        deleteWorkspace(workspaceId, {
            onSuccess: () => {
                toast.success("Đã chuyển workspace vào thùng rác");
                queryClient.invalidateQueries({ queryKey: ["workspaces"] });
                queryClient.invalidateQueries({ queryKey: ["trash-workspaces"] });
                queryClient.invalidateQueries({ queryKey: ["projects"] });
                queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
                setIsDeleteOpen(false);
                router.push("/workspaces");
            },
            onError: (error: any) => toast.error(error.message || "Không thể xóa workspace"),
        });
    };

    if (isLoading) {
        return (
            <div className="space-y-8 animate-in fade-in-50 duration-300">
                {/* Header Skeleton */}
                <div className="border-b border-slate-100 pb-6 space-y-4">
                    <Skeleton className="h-4 w-36 rounded-md" />
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pt-2">
                        <div className="flex items-start gap-4">
                            <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
                            <div className="space-y-2">
                                <Skeleton className="h-7 w-48 rounded-lg" />
                                <Skeleton className="h-4 w-80 rounded-md" />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-9 w-32 rounded-lg" />
                            <Skeleton className="h-9 w-32 rounded-lg" />
                        </div>
                    </div>
                    <div className="flex items-center gap-3 pt-3">
                        <Skeleton className="h-4 w-28 rounded-md" />
                        <div className="h-4 w-px bg-slate-200" />
                        <div className="flex -space-x-2">
                            <Skeleton className="h-7 w-7 rounded-full border-2 border-white" />
                            <Skeleton className="h-7 w-7 rounded-full border-2 border-white" />
                            <Skeleton className="h-7 w-7 rounded-full border-2 border-white" />
                        </div>
                    </div>
                </div>

                {/* Project List Skeleton */}
                <div className="space-y-5">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-6 w-44 rounded-md" />
                    </div>
                    <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="border border-slate-200/60 rounded-xl p-5 bg-white space-y-4 shadow-xs">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
                                    <Skeleton className="h-5 w-3/4 rounded-md" />
                                </div>
                                <div className="space-y-2 py-2">
                                    <Skeleton className="h-3.5 w-full rounded-md" />
                                    <Skeleton className="h-3.5 w-4/5 rounded-md" />
                                </div>
                                <div className="border-t border-slate-100/80 pt-3 flex items-center justify-between">
                                    <Skeleton className="h-3.5 w-24 rounded-md" />
                                    <Skeleton className="h-3.5 w-12 rounded-md" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (isError) {
        return <PageErrorState title="Không thể tải workspace" description="Workspace không tồn tại, bạn không có quyền truy cập hoặc kết nối đang gặp sự cố." onRetry={() => refetch()} />;
    }

    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <h2 className="text-lg font-bold text-slate-800">
                    Không tìm thấy Workspace
                </h2>
                <p className="text-slate-500 mt-2 text-sm">
                    Workspace này không tồn tại hoặc bạn không có quyền truy cập.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <WorkspaceHeader
                workspace={data}
                members={(data.members as Member[]) || []}
                onCreateProject={canCreateProject ? () => setIsCreateProject(true) : undefined}
                pendingCount={pendingCount}
            />

            <div className="flex w-full border-b border-slate-200">
                {([
                    { id: "projects", label: "Dự án", icon: FolderKanban },
                    { id: "members", label: "Thành viên", icon: Users },
                    ...(canManageWorkspace ? [{ id: "settings", label: "Cài đặt", icon: Settings }] : []),
                ] as const).map((tab) => <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`relative flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap px-1 pb-3 text-xs font-bold after:absolute after:inset-x-2 after:-bottom-px after:h-0.5 sm:flex-none sm:gap-2 sm:px-4 sm:text-sm ${activeTab === tab.id ? "text-blue-700 after:bg-blue-600" : "text-slate-500 after:bg-transparent hover:text-slate-800"}`}><tab.icon className="size-4 shrink-0" /><span>{tab.label}</span>{tab.id === "members" && pendingCount > 0 && <span className="rounded-full bg-amber-100 px-1.5 text-[10px] text-amber-700">{pendingCount}</span>}</button>)}
            </div>

            {activeTab === "projects" && <ProjectList
                workspaceId={workspaceId}
                projects={data.projects || []}
                onCreateProject={canCreateProject ? () => setIsCreateProject(true) : undefined}
            />}

            {activeTab === "members" && <section className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-base font-bold text-slate-900">Thành viên workspace</h2><p className="mt-0.5 text-xs text-slate-500">Quản lý người tham gia và yêu cầu đang chờ.</p></div><div className="grid grid-cols-2 gap-2 sm:flex">{canManageWorkspace && <Button variant="outline" onClick={() => setIsPendingMembers(true)} className="gap-2 px-3"><UserCheck className="size-4" /><span className="truncate">Duyệt yêu cầu</span>{pendingCount > 0 && <span className="rounded-full bg-amber-100 px-1.5 text-[10px] font-bold text-amber-700">{pendingCount}</span>}</Button>}{canInviteMember && <Button onClick={() => setIsInviteMember(true)} className="gap-2 px-3"><UserPlus className="size-4" /><span className="truncate">Mời thành viên</span></Button>}</div></div>
                <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">{((data.members as any[]) || []).filter((member) => member.status !== "pending").map((member) => { const user = member.user || {}; return <div key={user._id || user} className="flex items-center gap-3 px-3 py-3.5 sm:px-4"><Avatar className="size-9 shrink-0"><AvatarImage src={user.profileImage} alt={user.name} /><AvatarFallback>{user.name?.charAt(0)?.toUpperCase() || "?"}</AvatarFallback></Avatar><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-800">{user.name || "Thành viên"}</p><p className="truncate text-xs text-slate-500">{user.email}</p></div><span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600 sm:px-2.5 sm:text-xs">{member.role}</span></div>; })}</div>
            </section>}

            {activeTab === "settings" && canManageWorkspace && <section className="space-y-4">
                <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 sm:space-y-6 sm:p-6">
                    <div><h2 className="font-bold text-slate-900">Thông tin chung</h2><p className="mt-1 text-sm text-slate-500">Tên, mô tả, màu nhận diện và quyền mặc định.</p></div>
                    <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-1.5"><label className="text-xs font-bold text-slate-600">Tên workspace</label><Input value={settings.name} onChange={(event) => setSettings((current) => ({ ...current, name: event.target.value }))} /></div><div className="space-y-1.5"><label className="text-xs font-bold text-slate-600">Màu nhận diện</label><div className="flex min-h-10 flex-wrap items-center gap-2">{WORKSPACE_COLORS.map((color) => <button key={color} type="button" aria-label={`Chọn màu ${color}`} onClick={() => setSettings((current) => ({ ...current, color }))} className={`size-7 rounded-lg ${settings.color === color ? "ring-2 ring-blue-400 ring-offset-2" : ""}`} style={{ backgroundColor: color }} />)}</div></div></div>
                    <div className="space-y-1.5"><label className="text-xs font-bold text-slate-600">Mô tả</label><Textarea value={settings.description} onChange={(event) => setSettings((current) => ({ ...current, description: event.target.value }))} className="min-h-24 resize-none" /></div>
                    <div className="space-y-3 border-t border-slate-100 pt-5"><h3 className="text-sm font-bold text-slate-800">Quyền và mặc định</h3>{[
                        { key: "allowMembersCreateProjects", title: "Cho phép member tạo dự án", description: "Viewer vẫn chỉ có quyền xem." },
                        { key: "allowMembersInvite", title: "Cho phép member mời thành viên", description: "Member không thể mời admin." },
                        { key: "defaultProjectPrivate", title: "Dự án mới mặc định riêng tư", description: "Có thể đổi lại khi tạo dự án." },
                    ].map((item) => <label key={item.key} className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-slate-200 p-3.5"><span><span className="block text-sm font-bold text-slate-800">{item.title}</span><span className="mt-0.5 block text-xs text-slate-500">{item.description}</span></span><input type="checkbox" checked={Boolean(settings[item.key as keyof typeof settings])} onChange={(event) => setSettings((current) => ({ ...current, [item.key]: event.target.checked }))} className="mt-1 size-4 rounded" /></label>)}</div>
                    <div className="grid grid-cols-1 gap-2 border-t border-slate-100 pt-5 sm:flex sm:items-center sm:justify-between sm:gap-3"><ExportReportButton scope="workspace" id={workspaceId} /><Button onClick={saveSettings} disabled={isSavingSettings} className="w-full sm:w-auto">{isSavingSettings ? "Đang lưu..." : "Lưu thay đổi"}</Button></div>
                </div>
                {isOwner && <div className="flex flex-col items-stretch gap-4 rounded-2xl border border-rose-200 bg-rose-50/40 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"><div><h2 className="font-bold text-rose-800">Vùng nguy hiểm</h2><p className="mt-1 text-sm text-rose-600">Chuyển workspace và toàn bộ dự án bên trong vào thùng rác.</p></div><Button variant="destructive" onClick={() => setIsDeleteOpen(true)} className="w-full shrink-0 sm:w-auto"><Trash2 className="mr-2 size-4" />Xóa workspace</Button></div>}
            </section>}

            <CreateProjectDialog
                isOpen={isCreateProject}
                onOpenChange={setIsCreateProject}
                workspaceId={workspaceId}
                workspaceMembers={(data.members as any) || []}
                defaultProjectPrivate={Boolean(data.defaultProjectPrivate)}
            />

            <InviteMemberDialog
                isOpen={isInviteMember}
                onOpenChange={setIsInviteMember}
                workspaceId={workspaceId}
            />

            <PendingMembersDialog
                isOpen={isPendingMembers}
                onOpenChange={setIsPendingMembers}
                workspaceId={workspaceId}
            />
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Chuyển workspace vào thùng rác?</DialogTitle><DialogDescription>Workspace và các dự án bên trong sẽ bị ẩn khỏi thành viên. Bạn có thể khôi phục nguyên trạng từ Thùng rác.</DialogDescription></DialogHeader>
                    <DialogFooter><Button variant="outline" disabled={isDeleting} onClick={() => setIsDeleteOpen(false)}>Hủy</Button><Button variant="destructive" disabled={isDeleting} onClick={handleDeleteWorkspace}>{isDeleting ? "Đang xử lý..." : "Chuyển vào thùng rác"}</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
