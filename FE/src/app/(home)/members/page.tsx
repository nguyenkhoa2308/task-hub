"use client";

import { type ReactNode, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BriefcaseBusiness, Clock3, Mail, Search, UserPlus, Users } from "lucide-react";

import { useAppSelector } from "@/lib/redux/hooks";
import { useGetPendingMembers, useGetWorkspaceById, useGetWorkspaces } from "@/hooks/use-workspace";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { InviteMemberDialog } from "@/components/workspace/invite-member";
import { PendingMembersDialog } from "@/components/workspace/pending-members";
import { MemberActions } from "@/components/workspace/member-actions";
import { PageErrorState } from "@/components/ui/page-state";

const roleLabels: Record<string, string> = {
  owner: "Chủ sở hữu",
  admin: "Quản trị viên",
  member: "Thành viên",
  viewer: "Người xem",
};

const roleStyles: Record<string, string> = {
  owner: "bg-violet-50 text-violet-700 ring-violet-200",
  admin: "bg-blue-50 text-blue-700 ring-blue-200",
  member: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  viewer: "bg-slate-50 text-slate-600 ring-slate-200",
};

function MembersPageHeader({ actions }: { actions?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="flex items-center gap-2.5 text-2xl font-extrabold tracking-tight text-slate-800">
          <Users className="size-7 shrink-0 text-blue-600" />
          Thành viên
        </h1>
        <p className="mt-1 text-sm text-slate-500">Quản lý thành viên và quyền truy cập theo từng workspace.</p>
      </div>
      {actions}
    </div>
  );
}

export default function MembersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaceParam = searchParams.get("workspaceId") || "";
  const workspaceId = workspaceParam === "all" ? "" : workspaceParam;
  const { user: currentUser } = useAppSelector((state) => state.auth);
  const { data: workspaces = [], isLoading: isLoadingWorkspaces, isError: isWorkspacesError, refetch: refetchWorkspaces } = useGetWorkspaces();
  const [search, setSearch] = useState("");
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isPendingOpen, setIsPendingOpen] = useState(false);
  const { data: workspace, isLoading, isError, refetch } = useGetWorkspaceById(workspaceId);

  const members = useMemo(() => {
    const active = (workspace?.members || []).filter((member: any) => member.status !== "pending");
    const keyword = search.trim().toLowerCase();
    if (!keyword) return active;
    return active.filter((member: any) => {
      const person = member.user || {};
      return `${person.name || ""} ${person.email || ""}`.toLowerCase().includes(keyword);
    });
  }, [search, workspace?.members]);

  const currentMembership = (workspace?.members || []).find(
    (member: any) => (member.user?._id || member.user) === currentUser?._id,
  ) as any;
  const ownerId = typeof workspace?.owner === "string" ? workspace.owner : workspace?.owner?._id;
  const canManage = ownerId === currentUser?._id || ["owner", "admin"].includes(currentMembership?.role);
  const { data: pendingMembers = [] } = useGetPendingMembers(workspaceId, canManage);
  if (!workspaceId) {
    return (
      <div className="w-full space-y-6 pb-12">
        <MembersPageHeader />

        {isLoadingWorkspaces ? (
          <Skeleton className="h-72 w-full rounded-xl" />
        ) : isWorkspacesError ? (
          <PageErrorState title="Không thể tải danh sách workspace" onRetry={() => refetchWorkspaces()} />
        ) : workspaces.length === 0 ? (
          <div className="flex min-h-[45vh] flex-col items-center justify-center text-center">
            <BriefcaseBusiness className="size-10 text-slate-300" />
            <h2 className="mt-4 text-lg font-bold text-slate-900">Bạn chưa có workspace</h2>
            <p className="mt-1 text-sm text-slate-500">Tạo workspace từ thanh điều hướng để bắt đầu quản lý thành viên.</p>
          </div>
        ) : (
          <div className="flex min-h-[45vh] flex-col items-center justify-center text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-blue-50 text-blue-600"><BriefcaseBusiness className="size-5" /></div>
            <h2 className="mt-4 text-lg font-bold text-slate-900">Chọn một workspace</h2>
            <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">Sử dụng bộ chọn workspace ở góc trên bên trái để xem danh sách thành viên tương ứng.</p>
          </div>
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full space-y-6 pb-12">
        <MembersPageHeader />
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 p-4">
            <div className="space-y-2"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-64" /></div>
            <Skeleton className="h-10 w-72 rounded-xl" />
          </div>
          <div className="divide-y divide-slate-100">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="grid gap-3 px-5 py-4 lg:grid-cols-[minmax(240px,1fr)_180px_170px] lg:items-center">
                <div className="flex items-center gap-3"><Skeleton className="size-10 rounded-full" /><div className="space-y-2"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-52" /></div></div>
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-3 w-28 lg:ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return <div className="w-full space-y-6 pb-12"><MembersPageHeader /><PageErrorState title="Không thể tải thành viên" onRetry={() => refetch()} /></div>;
  }

  if (!workspace) {
    return (
      <div className="flex min-h-[55vh] flex-col items-center justify-center text-center">
        <Users className="size-10 text-slate-300" />
        <h1 className="mt-4 text-lg font-bold text-slate-900">Không thể mở workspace này</h1>
        <p className="mt-1 text-sm text-slate-500">Workspace không tồn tại hoặc bạn không có quyền truy cập.</p>
        <Button variant="outline" className="mt-5" onClick={() => router.push("/members")}>Chọn workspace khác</Button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-12">
      <MembersPageHeader actions={canManage ? (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setIsPendingOpen(true)}><Clock3 className="size-4" /> Chờ duyệt {pendingMembers.length > 0 && <span className="rounded-full bg-amber-100 px-1.5 text-xs text-amber-700">{pendingMembers.length}</span>}</Button>
            <Button className="gap-2 bg-blue-600 hover:bg-blue-700" onClick={() => setIsInviteOpen(true)}><UserPlus className="size-4" /> Mời thành viên</Button>
          </div>
        ) : undefined} />

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 className="font-bold text-slate-900">Danh sách thành viên</h2><p className="mt-0.5 text-xs text-slate-500">Theo dõi người tham gia và vai trò trong workspace.</p></div>
          <div className="relative w-full sm:w-72"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm tên hoặc email..." className="h-10 rounded-xl pl-9" /></div>
        </div>

        {members.length === 0 ? (
          <div className="p-12 text-center"><Users className="mx-auto size-9 text-slate-300" /><p className="mt-3 font-semibold text-slate-800">{search ? "Không tìm thấy thành viên" : "Workspace chưa có thành viên"}</p><p className="mt-1 text-sm text-slate-500">{search ? "Thử tìm bằng tên hoặc email khác." : "Mời đồng đội để bắt đầu cộng tác."}</p></div>
        ) : (
          <div className="divide-y divide-slate-100">
            {members.map((member: any) => {
              const person = member.user || {};
              const avatarFallback = (person.name || person.email || "U").trim().charAt(0).toUpperCase();
              return (
                <div key={member._id || person._id} className="relative grid gap-3 px-4 py-4 transition-colors hover:bg-slate-50/70 lg:grid-cols-[minmax(240px,1fr)_160px_150px_40px] lg:items-center lg:px-5">
                  <div className="flex min-w-0 items-center gap-3 pr-10 lg:pr-0">
                    <Avatar className="size-11 shrink-0 ring-1 ring-slate-200"><AvatarImage src={person.profileImage || undefined} alt={person.name || person.email} /><AvatarFallback className="bg-slate-100 font-bold text-slate-600">{avatarFallback}</AvatarFallback></Avatar>
                    <div className="min-w-0">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <p className="truncate text-sm font-bold text-slate-900">{person.name || "Chưa cập nhật tên"}</p>
                        {person._id === currentUser?._id && <span className="shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">Bạn</span>}
                      </div>
                      <p title={person.email || undefined} className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-slate-500"><Mail className="size-3.5 shrink-0" /><span className="truncate">{person.email || "Chưa có email"}</span></p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 lg:contents">
                    <div><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${roleStyles[member.role] || roleStyles.member}`}>{roleLabels[member.role] || "Thành viên"}</span></div>
                    <p className="whitespace-nowrap text-xs text-slate-500 lg:text-right">Tham gia {member.joinedAt ? new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(member.joinedAt)) : "trước đây"}</p>
                  </div>
                  <div className="absolute right-3 top-3 lg:static">
                    <MemberActions
                      workspaceId={workspaceId}
                      memberId={person._id}
                      memberName={person.name || person.email || "thành viên này"}
                      memberRole={member.role}
                      requesterRole={currentMembership?.role}
                      isCurrentUser={person._id === currentUser?._id}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <InviteMemberDialog isOpen={isInviteOpen} onOpenChange={setIsInviteOpen} workspaceId={workspaceId} />
      <PendingMembersDialog isOpen={isPendingOpen} onOpenChange={setIsPendingOpen} workspaceId={workspaceId} />
    </div>
  );
}
