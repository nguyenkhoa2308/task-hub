"use client";

import { useState } from "react";
import Link from "next/link";
import { LayoutGrid, List, PlusCircle, Users, Calendar, ArrowRight } from "lucide-react";

import { useGetWorkspaces } from "@/hooks/use-workspace";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import WorksapceAvatar from "@/components/workspace/workspace-avatar";
import CreateWorkspace from "@/components/workspace/create-workspace";
import { cn } from "@/lib/utils";

export default function WorkspacesPage() {
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const { data: workspaces = [], isLoading } = useGetWorkspaces();

    // Helper to format date
    const formatDate = (dateInput: any) => {
        if (!dateInput) return "";
        const date = new Date(dateInput);
        return date.toLocaleDateString("vi-VN", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6 border-slate-100">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                        Workspace của bạn
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm sm:text-base">
                        Quản lý và cộng tác công việc trong các workspace.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* View Mode Toggle */}
                    <div className="inline-flex rounded-lg bg-slate-100 p-1 border border-slate-200/50">
                        <button
                            onClick={() => setViewMode("grid")}
                            className={cn(
                                "p-1.5 rounded-md transition-all cursor-pointer",
                                viewMode === "grid"
                                    ? "bg-white text-blue-600 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700"
                            )}
                            title="Xem dạng lưới"
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className={cn(
                                "p-1.5 rounded-md transition-all cursor-pointer",
                                viewMode === "list"
                                    ? "bg-white text-blue-600 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700"
                            )}
                            title="Xem dạng danh sách"
                        >
                            <List className="h-4 w-4" />
                        </button>
                    </div>

                    <Button onClick={() => setIsCreateOpen(true)} className="gap-2 active:scale-97 transition-all cursor-pointer">
                        <PlusCircle className="h-4 w-4" />
                        Tạo Workspace
                    </Button>
                </div>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className={cn(
                    "grid gap-6",
                    viewMode === "grid"
                        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                        : "grid-cols-1"
                )}>
                    {[...Array(6)].map((_, i) => (
                        <Card key={i} className="animate-pulse border-slate-100 shadow-xs">
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

            {/* Empty State */}
            {!isLoading && workspaces.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 px-4 bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl text-center">
                    <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                        <LayoutGrid className="h-8 w-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Không tìm thấy Workspace nào</h3>
                    <p className="text-slate-500 max-w-md mt-2 text-sm">
                        Bạn chưa tạo hoặc chưa tham gia vào không gian làm việc nào. Bắt đầu bằng cách tạo Workspace đầu tiên của bạn!
                    </p>
                    <Button onClick={() => setIsCreateOpen(true)} className="mt-6 gap-2">
                        <PlusCircle className="h-4 w-4" />
                        Tạo Workspace đầu tiên
                    </Button>
                </div>
            )}

            {/* Grid View */}
            {!isLoading && workspaces.length > 0 && viewMode === "grid" && (
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                    {workspaces.map((ws: any) => (
                        <Link key={ws._id} href={`/workspaces/${ws._id}`} className="group">
                            <Card className="h-full border border-slate-200/60 shadow-xs hover:shadow-md hover:border-blue-200 hover:-translate-y-0.5 transition-all duration-300 rounded-xl bg-white flex flex-col justify-between">
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
            {!isLoading && workspaces.length > 0 && viewMode === "list" && (
                <div className="space-y-4">
                    {workspaces.map((ws: any) => (
                        <Link key={ws._id} href={`/workspaces/${ws._id}`} className="block group">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-slate-200/60 rounded-xl bg-white hover:border-blue-200 hover:shadow-xs transition-all">
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