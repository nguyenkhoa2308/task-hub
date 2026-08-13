"use client";

import { FolderKanban, Plus, Calendar } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { Project } from "@/types";

interface ProjectListProps {
    workspaceId: string;
    projects: Project[];
    onCreateProject: () => void;
}

export function ProjectList({ workspaceId, projects, onCreateProject }: ProjectListProps) {
    const formatDate = (dateInput: any) => {
        if (!dateInput) return "";
        const date = new Date(dateInput);
        return date.toLocaleDateString("vi-VN", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    // Empty state
    if (!projects || projects.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 px-4 bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl text-center">
                <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                    <FolderKanban className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">
                    Chưa có Project nào
                </h3>
                <p className="text-slate-500 max-w-md mt-2 text-sm">
                    Workspace này chưa có project. Bắt đầu bằng cách tạo project đầu tiên!
                </p>
                <Button onClick={onCreateProject} className="mt-6 gap-2 cursor-pointer active:scale-97 transition-all">
                    <Plus className="h-4 w-4" />
                    Tạo Project đầu tiên
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <FolderKanban className="h-5 w-5 text-blue-600" />
                    Danh sách Project
                    <span className="text-sm font-medium text-slate-400 ml-1">
                        ({projects.length})
                    </span>
                </h2>
            </div>

            <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                    <Link
                        key={project._id}
                        href={`/workspaces/${workspaceId}/projects/${project._id}`}
                        className="group"
                    >
                        <Card className="h-full border border-slate-200/60 shadow-xs hover:shadow-md hover:border-blue-200 hover:-translate-y-0.5 transition-all duration-300 rounded-xl bg-white flex flex-col justify-between">
                            <CardHeader className="pb-2">
                                <div className="flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                                        <FolderKanban className="h-4 w-4 text-white" />
                                    </div>
                                    <CardTitle className="text-base font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                                        {project.title || project.name}
                                    </CardTitle>
                                </div>
                            </CardHeader>

                            <CardContent className="flex-1 pb-3">
                                <p className="text-slate-500 text-sm line-clamp-2 min-h-[40px]">
                                    {project.description || "Chưa có mô tả cho project này."}
                                </p>
                            </CardContent>

                            <CardFooter className="border-t border-slate-100/80 pt-3 flex items-center justify-between text-xs text-slate-400">
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-3.5 w-3.5" />
                                    {formatDate(project.createdAt)}
                                </span>
                                <span className="text-blue-500 font-bold text-[13px] inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                                    Mở →
                                </span>
                            </CardFooter>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
