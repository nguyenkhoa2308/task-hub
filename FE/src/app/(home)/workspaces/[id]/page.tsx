"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

import { useGetWorkspaceById, useGetPendingMembers } from "@/hooks/use-workspace";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkspaceHeader } from "@/components/workspace/workspace-header";
import { ProjectList } from "@/components/workspace/project-list";
import { CreateProjectDialog } from "@/components/workspace/create-project";
import { InviteMemberDialog } from "@/components/workspace/invite-member";
import { PendingMembersDialog } from "@/components/workspace/pending-members";
import type { Member } from "@/types";

export default function WorkspaceDetailPage() {
    const params = useParams<{ id: string }>();
    const workspaceId = params.id;

    const [isCreateProject, setIsCreateProject] = useState(false);
    const [isInviteMember, setIsInviteMember] = useState(false);
    const [isPendingMembers, setIsPendingMembers] = useState(false);

    const { data, isLoading } = useGetWorkspaceById(workspaceId);
    const { data: pendingMembers } = useGetPendingMembers(workspaceId);
    const pendingCount = pendingMembers?.length || 0;

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
                onCreateProject={() => setIsCreateProject(true)}
                onInviteMember={() => setIsInviteMember(true)}
                onOpenPendingMembers={() => setIsPendingMembers(true)}
                pendingCount={pendingCount}
            />

            <ProjectList
                workspaceId={workspaceId}
                projects={data.projects || []}
                onCreateProject={() => setIsCreateProject(true)}
            />

            <CreateProjectDialog
                isOpen={isCreateProject}
                onOpenChange={setIsCreateProject}
                workspaceId={workspaceId}
                workspaceMembers={(data.members as any) || []}
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
        </div>
    );
}