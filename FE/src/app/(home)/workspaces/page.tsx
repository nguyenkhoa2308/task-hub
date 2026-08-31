"use client";

import { useState } from "react";
import Link from "next/link";
import { LayoutGrid, List, Plus, Users, Calendar, ArrowRight, BriefcaseBusiness } from "lucide-react";

import { useGetWorkspaces } from "@/hooks/use-workspace";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import WorksapceAvatar from "@/components/workspace/workspace-avatar";
import CreateWorkspace from "@/components/workspace/create-workspace";
import { cn } from "@/lib/utils";
import type { WorkSpace } from "@/types";
import { PageErrorState } from "@/components/ui/page-state";

export default function WorkspacesPage() {
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const { data: workspaces = [], isLoading, isError, refetch } = useGetWorkspaces();

    // Helper to format date
    const formatDate = (dateInput: WorkSpace["createdAt"]) => {
        if (!dateInput) return "";
        const date = new Date(dateInput);
        return date.toLocaleDateString("vi-VN", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    return (
        <div className="w-full space-y-6 pb-12">
            {/* Page Header */}
            <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="flex items-center gap-2.5 text-2xl font-extrabold tracking-tight text-slate-800">
                        <BriefcaseBusiness className="size-7 shrink-0 text-blue-600" />
                        Workspace
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Quản lý không gian làm việc, dự án và đội ngũ của bạn.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* View Mode Toggle */}
                    <div className="hidden items-center gap-1 rounded-xl bg-slate-100 p-1 sm:flex">
                        <button
                            onClick={() => setViewMode("grid")}
                            className={cn(
                                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer",
                                viewMode === "grid"
                                    ? "bg-white text-blue-600 shadow-sm"
                                    : "text-slate-500 hover:text-slate-800"
                            )}
                            title="Xem dạng lưới"
                        >
                            <LayoutGrid className="size-4" />
                            Lưới
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className={cn(
                                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer",
                                viewMode === "list"
                                    ? "bg-white text-blue-600 shadow-sm"
                                    : "text-slate-500 hover:text-slate-800"
                            )}
                            title="Xem dạng danh sách"
                        >
                            <List className="size-4" />
                            Danh sách
                        </button>
                    </div>

                    <Button onClick={() => setIsCreateOpen(true)} className="w-full gap-2 bg-blue-600 hover:bg-blue-700 cursor-pointer sm:w-auto">
                        <Plus className="size-4" />
                        Tạo workspace
                    </Button>
                </div>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className={cn(
                    "grid gap-4",
                    viewMode === "grid"
                        ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4"
                        : "grid-cols-1"
                )}>
                    {[...Array(6)].map((_, i) => (
                        <Card key={i} className="animate-pulse rounded-2xl border-slate-200 shadow-none">
                            <CardHeader className="flex flex-row items-center gap-4">
                                <div className="w-12 h-12 bg-slate-200 rounded-xl" />
                                <div className="space-y-2 flex-1">
                                    <div className="h-4 bg-slate-200 rounded-md w-3/4" />
                                    <div className="h-3 bg-slate-200 rounded-md w-1/2" />
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="h-3 bg-slate-200 rounded-md w-full" />
                                <div className="h-3 bg-slate-200 rounded-md w-5/6" />
                            </CardContent>
                            <CardFooter className="border-t pt-4 border-slate-100 flex justify-between">
                                <div className="h-3 bg-slate-200 rounded-md w-20" />
                                <div className="h-3 bg-slate-200 rounded-md w-24" />
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}

            {!isLoading && isError && (
                <PageErrorState title="Không thể tải workspace" onRetry={() => refetch()} />
            )}

            {/* Empty State */}
            {!isLoading && !isError && workspaces.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 px-4 bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl text-center">
                    <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                        <LayoutGrid className="h-8 w-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Không tìm thấy Workspace nào</h3>
                    <p className="text-slate-500 max-w-md mt-2 text-sm">
                        Bạn chưa tạo hoặc chưa tham gia vào không gian làm việc nào. Bắt đầu bằng cách tạo Workspace đầu tiên của bạn!
                    </p>
                    <Button onClick={() => setIsCreateOpen(true)} className="mt-6 gap-2">
                        <Plus className="h-4 w-4" />
                        Tạo Workspace đầu tiên
                    </Button>
                </div>
            )}

            {/* Mobile View */}
            {!isLoading && !isError && workspaces.length > 0 && (
                <div className="space-y-3 sm:hidden">
                    {workspaces.map((ws) => (
                        <Link key={ws._id} href={`/workspaces/${ws._id}`} className="block">
                            <article className="rounded-2xl border border-slate-200 bg-white p-4 active:bg-slate-50">
                                <div className="flex items-start gap-3">
                                    <div className="shrink-0 rounded-xl bg-slate-50 p-1">
                                        <WorksapceAvatar color={ws.color} name={ws.name} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-start justify-between gap-3">
                                            <h2 className="truncate text-base font-extrabold text-slate-900">{ws.name}</h2>
                                            <ArrowRight className="mt-0.5 size-4 shrink-0 text-slate-400" />
                                        </div>
                                        <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-500">
                                            {ws.description || "Chưa có mô tả cho workspace này."}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                                    <span className="flex items-center gap-1.5">
                                        <Users className="size-3.5 text-slate-400" />
                                        <strong className="text-slate-700">{ws.members?.length || 1}</strong> thành viên
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Calendar className="size-3.5 text-slate-400" />
                                        {formatDate(ws.createdAt)}
                                    </span>
                                </div>
                            </article>
                        </Link>
                    ))}
                </div>
            )}

            {/* Grid View */}
            {!isLoading && !isError && workspaces.length > 0 && viewMode === "grid" && (
                <div className="hidden grid-cols-1 gap-4 sm:grid sm:grid-cols-2 xl:grid-cols-4">
                    {workspaces.map((ws) => (
                        <Link key={ws._id} href={`/workspaces/${ws._id}`} className="group">
                            <Card className="flex h-full min-h-56 flex-col justify-between rounded-2xl border border-slate-200 bg-white shadow-xs transition-colors hover:border-blue-300 hover:bg-slate-50/30">
                                <CardHeader className="flex flex-row items-start gap-4">
                                    <div className="p-1">
                                        <WorksapceAvatar color={ws.color} name={ws.name} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <CardTitle className="text-base font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                                            {ws.name}
                                        </CardTitle>
                                        <CardDescription className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                                            <Calendar className="h-3 w-3" />
                                            Tạo ngày {formatDate(ws.createdAt)}
                                        </CardDescription>
                                    </div>
                                </CardHeader>

                                <CardContent className="flex-1 pb-4">
                                    <p className="text-slate-500 text-xs sm:text-sm line-clamp-2 min-h-[40px]">
                                        {ws.description || "Chưa có mô tả cho Workspace này."}
                                    </p>
                                </CardContent>

                                <CardFooter className="border-t border-slate-100/80 pt-4 flex items-center justify-between text-xs text-slate-500">
                                    <span className="flex items-center gap-1">
                                        <Users className="h-4 w-4 text-slate-400" />
                                        <strong>{ws.members?.length || 1}</strong> thành viên
                                    </span>
                                    <span className="text-blue-500 text-[13px] font-bold inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                                        Truy cập <ArrowRight className="h-4 w-4" />
                                    </span>
                                </CardFooter>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}

            {/* List View */}
            {!isLoading && !isError && workspaces.length > 0 && viewMode === "list" && (
                <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs sm:block">
                    {workspaces.map((ws) => (
                        <Link key={ws._id} href={`/workspaces/${ws._id}`} className="group block border-b border-slate-100 last:border-b-0">
                            <div className="flex flex-col justify-between gap-4 p-4 transition-colors hover:bg-slate-50/70 sm:flex-row sm:items-center sm:px-5">
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className="p-0.5">
                                        <WorksapceAvatar color={ws.color} name={ws.name} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-base font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                                            {ws.name}
                                        </h3>
                                        <p className="text-slate-500 text-xs sm:text-sm line-clamp-1 mt-0.5">
                                            {ws.description || "Chưa có mô tả cho Workspace này."}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 text-xs text-slate-500 shrink-0">
                                    <span className="flex items-center gap-1">
                                        <Users className="h-3.5 w-3.5 text-slate-400" />
                                        <strong>{ws.members?.length || 1}</strong> thành viên
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                        {formatDate(ws.createdAt)}
                                    </span>
                                    <span className="text-blue-500 font-semibold inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                                        Truy cập <ArrowRight className="h-3 w-3" />
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Modal Creating Workspace */}
            <CreateWorkspace
                isCreateWorkSpace={isCreateOpen}
                setIsCreateWorkSpace={setIsCreateOpen}
            />
        </div>
    );
}
