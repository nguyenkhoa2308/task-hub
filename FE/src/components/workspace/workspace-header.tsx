"use client";

import { Users, Plus, UserPlus, ArrowLeft, UserCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import WorksapceAvatar from "@/components/workspace/workspace-avatar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Member, WorkSpace } from "@/types";

interface WorkspaceHeaderProps {
    workspace: WorkSpace;
    members: Member[];
    onCreateProject: () => void;
    onInviteMember: () => void;
    onOpenPendingMembers?: () => void;
    pendingCount?: number;
}

export function WorkspaceHeader({
    workspace,
    members = [],
    onCreateProject,
    onInviteMember,
    onOpenPendingMembers,
    pendingCount = 0,
}: WorkspaceHeaderProps) {
    const maxVisible = 5;
    const visibleMembers = members.slice(0, maxVisible);
    const remaining = members.length - maxVisible;

    return (
        <div className="border-b border-slate-100 pb-6">
            {/* Back button */}
            <Link
                href="/workspaces"
                className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 transition-colors mb-4 group"
            >
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                <span className="font-semibold">Quay lại Workspaces</span>
            </Link>

            {/* Top section */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                    <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm"
                        style={{ backgroundColor: workspace.color }}
                    >
                        <span className="text-xl font-bold text-white">
                            {workspace.name.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div>
                        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                            {workspace.name}
                        </h1>
                        {workspace.description && (
                            <p className="text-slate-500 mt-1 text-sm max-w-lg">
                                {workspace.description}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {onOpenPendingMembers && (
                        <Button
                            variant="outline"
                            onClick={onOpenPendingMembers}
                            className={`gap-2 cursor-pointer transition-all font-bold relative ${
                                pendingCount > 0
                                    ? "border-amber-300 bg-amber-50/80 text-amber-800 hover:bg-amber-100/80"
                                    : "text-slate-700 hover:bg-slate-50"
                            }`}
                        >
                            <UserCheck className={`h-4 w-4 ${pendingCount > 0 ? "text-amber-600" : "text-slate-500"}`} />
                            <span>Duyệt yêu cầu</span>
                            {pendingCount > 0 && (
                                <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-600 text-white font-extrabold">
                                    {pendingCount}
                                </span>
                            )}
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        onClick={onInviteMember}
                        className="gap-2 cursor-pointer active:scale-97 transition-all"
                    >
                        <UserPlus className="h-4 w-4" />
                        Mời thành viên
                    </Button>
                    <Button
                        onClick={onCreateProject}
                        className="gap-2 cursor-pointer active:scale-97 transition-all"
                    >
                        <Plus className="h-4 w-4" />
                        Tạo Project
                    </Button>
                </div>
            </div>

            {/* Members row */}
            {members.length > 0 && (
                <div className="flex items-center gap-3 mt-5">
                    <div className="flex items-center gap-1.5 text-sm text-slate-500">
                        <Users className="h-4 w-4" />
                        <span className="font-semibold">{members.length}</span> thành viên
                    </div>
                    <div className="h-4 w-px bg-slate-200" />
                    <div className="flex -space-x-2">
                        {visibleMembers.map((member, index) => (
                            <Avatar
                                key={member.user?._id || index}
                                className="h-7 w-7 border-2 border-white ring-0"
                                title={member.user?.name}
                            >
                                <AvatarImage src={member.user?.profileImage} />
                                <AvatarFallback className="text-[10px] font-semibold">
                                    {member.user?.name?.charAt(0).toUpperCase() || "?"}
                                </AvatarFallback>
                            </Avatar>
                        ))}
                        {remaining > 0 && (
                            <div className="h-7 w-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center">
                                <span className="text-[10px] font-bold text-slate-500">
                                    +{remaining}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
