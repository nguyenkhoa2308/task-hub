"use client";

import { FolderKanban, Plus, Calendar, CheckSquare } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Project } from "@/types";

interface ProjectListProps {
  workspaceId: string;
  projects: Project[];
  onCreateProject: () => void;
}

// Cấu hình hiển thị Badge Trạng thái tiếng Việt
const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; dot: string }
> = {
  PLANNING: {
    label: "Lập kế hoạch",
    bg: "bg-purple-50/80 border-purple-200/70",
    text: "text-purple-700",
    dot: "bg-purple-500",
  },
  IN_PROGRESS: {
    label: "Đang thực hiện",
    bg: "bg-blue-50/80 border-blue-200/70",
    text: "text-blue-700",
    dot: "bg-blue-500 animate-pulse",
  },
  COMPLETED: {
    label: "Hoàn thành",
    bg: "bg-emerald-50/80 border-emerald-200/70",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  ON_HOLD: {
    label: "Tạm dừng",
    bg: "bg-amber-50/80 border-amber-200/70",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  CANCELLED: {
    label: "Đã hủy",
    bg: "bg-rose-50/80 border-rose-200/70",
    text: "text-rose-700",
    dot: "bg-rose-500",
  },
};

export function ProjectList({
  workspaceId,
  projects,
  onCreateProject,
}: ProjectListProps) {
  const formatDate = (dateInput: any) => {
    if (!dateInput) return null;
    const date = new Date(dateInput);
    return date.toLocaleDateString("vi-VN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Empty state
  if (!projects || projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 bg-slate-50/50 border border-dashed border-slate-200/80 rounded-2xl text-center">
        <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-xs">
          <FolderKanban className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">Chưa có Dự án nào</h3>
        <p className="text-slate-500 max-w-md mt-1.5 text-sm">
          Workspace này chưa có dự án. Bắt đầu bằng cách tạo dự án đầu tiên!
        </p>
        <Button
          onClick={onCreateProject}
          className="mt-6 gap-2 font-bold cursor-pointer active:scale-97 transition-all shadow-md shadow-blue-500/10"
        >
          <Plus className="h-4 w-4" />
          Tạo Dự án đầu tiên
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
          <FolderKanban className="h-5 w-5 text-blue-600" />
          Danh sách Dự án
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full ml-1">
            {projects.length}
          </span>
        </h2>
        <Button
          onClick={onCreateProject}
          size="sm"
          className="gap-1.5 font-bold cursor-pointer shadow-xs hover:shadow-md transition-all"
        >
          <Plus className="h-4 w-4" />
          Tạo Dự án
        </Button>
      </div>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project: any) => {
          const statusKey = (project.status || "PLANNING").toUpperCase();
          const statusConfig =
            STATUS_CONFIG[statusKey] || STATUS_CONFIG.PLANNING;
          const progress = project.progress ?? 0;
          const taskCount = Array.isArray(project.tasks)
            ? project.tasks.length
            : project.taskCount ?? 0;
          const dueDateFormatted = formatDate(project.dueDate || project.createdAt);

          return (
            <Link
              key={project._id}
              href={`/workspaces/${workspaceId}/projects/${project._id}`}
              className="group block"
            >
              <div className="h-full bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-xl hover:shadow-slate-200/50 hover:border-blue-300 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative overflow-hidden">
                {/* Top Section: Title & Status Badge */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-base font-extrabold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1">
                      {project.title || project.name}
                    </h3>

                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold shrink-0 ${statusConfig.bg} ${statusConfig.text}`}
                    >
                      <span className={`size-1.5 rounded-full ${statusConfig.dot}`} />
                      {statusConfig.label}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-slate-500 text-xs leading-relaxed line-clamp-2 min-h-[36px]">
                    {project.description || "Chưa có mô tả cho dự án này."}
                  </p>
                </div>

                {/* Middle Section: Progress Bar */}
                <div className="mt-5 mb-4 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-500">Tiến độ</span>
                    <span className="text-slate-800 font-bold">{progress}%</span>
                  </div>

                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/40">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500 shadow-xs"
                      style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                    />
                  </div>
                </div>

                {/* Bottom Section: Footer Info & Members */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                  {/* Task Count */}
                  <div className="flex items-center gap-1.5 text-slate-600 font-semibold">
                    <CheckSquare className="h-3.5 w-3.5 text-slate-400" />
                    <span>{taskCount} Công việc</span>
                  </div>

                  {/* Due Date */}
                  {dueDateFormatted && (
                    <div className="flex items-center gap-1 text-slate-400">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Hạn: {dueDateFormatted}</span>
                    </div>
                  )}

                  {/* Members Avatars (If available) */}
                  {Array.isArray(project.members) && project.members.length > 0 && (
                    <div className="flex -space-x-1.5 items-center">
                      {project.members.slice(0, 3).map((m: any, idx: number) => {
                        const user = m.user || m;
                        return (
                          <Avatar
                            key={user._id || idx}
                            className="size-5 border border-white ring-1 ring-slate-100 shrink-0"
                          >
                            <AvatarImage src={user.profileImage} />
                            <AvatarFallback className="text-[9px] bg-blue-100 text-blue-700 font-bold">
                              {user.name?.charAt(0)?.toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                        );
                      })}
                      {project.members.length > 3 && (
                        <span className="size-5 rounded-full bg-slate-100 text-[9px] font-bold text-slate-600 flex items-center justify-center border border-white">
                          +{project.members.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
