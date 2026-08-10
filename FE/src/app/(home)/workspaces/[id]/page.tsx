"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

import { useGetWorkspaceById } from "@/hooks/use-workspace";
import { Loading } from "@/components/ui/loading";
import { WorkspaceHeader } from "@/components/workspace/workspace-header";
import { ProjectList } from "@/components/workspace/project-list";
import { CreateProjectDialog } from "@/components/workspace/create-project";
import { InviteMemberDialog } from "@/components/workspace/invite-member";
import type { Member } from "@/types";

export default function WorkspaceDetailPage() {
    const params = useParams<{ id: string }>();
    const workspaceId = params.id;

    const [isCreateProject, setIsCreateProject] = useState(false);
    const [isInviteMember, setIsInviteMember] = useState(false);

    const { data, isLoading } = useGetWorkspaceById(workspaceId);

    if (isLoading) {
        return <Loading variant="inline" size="lg" text="Đang tải workspace..." />;
    }

    if (!data?.workspace) {
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
                workspace={data.workspace}
                members={(data.workspace.members as Member[]) || []}
                onCreateProject={() => setIsCreateProject(true)}
                onInviteMember={() => setIsInviteMember(true)}
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
            />

            <InviteMemberDialog
                isOpen={isInviteMember}
                onOpenChange={setIsInviteMember}
                workspaceId={workspaceId}
            />
        </div>
    );
}