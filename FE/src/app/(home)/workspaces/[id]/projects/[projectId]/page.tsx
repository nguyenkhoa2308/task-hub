"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  FolderKanban,
  LayoutGrid,
  ListTodo,
  Plus,
  Settings,
  Users,
  AlertCircle,
  Trash2,
  Save,
  Archive,
  AlertTriangle,
  Tag,
  CheckCircle2,
} from "lucide-react";

import { useGetProjectById, useUpdateProject, useDeleteProject } from "@/hooks/use-project";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { KanbanBoard } from "@/components/project/kanban-board";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { ProjectStatus } from "@/types";

// Cấu hình nhãn và màu sắc Trạng thái
const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; dot: string }
> = {
  PLANNING: {
    label: "Lập kế hoạch",
    bg: "bg-purple-50 border-purple-200/80",
    text: "text-purple-700",
    dot: "bg-purple-500",
  },
  IN_PROGRESS: {
    label: "Đang thực hiện",
    bg: "bg-blue-50 border-blue-200/80",
    text: "text-blue-700",
    dot: "bg-blue-500 animate-pulse",
  },
  COMPLETED: {
    label: "Hoàn thành",
    bg: "bg-emerald-50 border-emerald-200/80",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  ON_HOLD: {
    label: "Tạm dừng",
    bg: "bg-amber-50 border-amber-200/80",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  CANCELLED: {
    label: "Đã hủy",
    bg: "bg-rose-50 border-rose-200/80",
    text: "text-rose-700",
    dot: "bg-rose-500",
  },
};

const ROLE_LABELS: Record<string, string> = {
  manager: "Người quản lý",
  contributor: "Người đóng góp",
  viewer: "Người xem",
};

export default function ProjectDetailPage() {
  const params = useParams<{ id: string; projectId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const workspaceId = params.id;
  const projectId = params.projectId;

  const [activeTab, setActiveTab] = useState<"board" | "list" | "members" | "settings">("board");

  const { data: project, isLoading, isError } = useGetProjectById(projectId);
  const { mutate: updateProjectMutate, isPending: isUpdating } = useUpdateProject();
  const { mutate: deleteProjectMutate, isPending: isDeleting } = useDeleteProject();

  // Settings State Form
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState<string>("PLANNING");
  const [editStartDate, setEditStartDate] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editTags, setEditTags] = useState("");

  const projectData: any = project;

  useEffect(() => {
    if (projectData) {
      setEditTitle(projectData.title || projectData.name || "");
      setEditDescription(projectData.description || "");
      setEditStatus(projectData.status || "PLANNING");
      setEditStartDate(projectData.startDate ? new Date(projectData.startDate).toISOString().split("T")[0] : "");
      setEditDueDate(projectData.dueDate ? new Date(projectData.dueDate).toISOString().split("T")[0] : "");
      setEditTags(Array.isArray(projectData.tags) ? projectData.tags.join(", ") : projectData.tags || "");
    }
  }, [projectData]);

  const formatDate = (dateInput?: any) => {
    if (!dateInput) return "Chưa đặt";
    const date = new Date(dateInput);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) {
      toast.error("Tên dự án không được để trống");
      return;
    }

    updateProjectMutate(
      {
        id: projectId,
        data: {
          title: editTitle.trim(),
          description: editDescription.trim(),
          status: editStatus,
          startDate: editStartDate || undefined,
          dueDate: editDueDate || undefined,
          tags: editTags,
        },
      },
      {
        onSuccess: () => {
          toast.success("Đã lưu thông tin cài đặt dự án!");
          queryClient.invalidateQueries({ queryKey: ["project", projectId] });
          queryClient.invalidateQueries({ queryKey: ["projects", workspaceId] });
        },
        onError: (err: any) => {
          toast.error(err?.message || "Không thể cập nhật cài đặt dự án");
        },
      }
    );
  };

  const handleToggleArchive = () => {
    const isArchivedNow = !projectData?.isArchived;
    updateProjectMutate(
      {
        id: projectId,
        data: { isArchived: isArchivedNow },
      },
      {
        onSuccess: () => {
          toast.success(isArchivedNow ? "Đã lưu trữ dự án" : "Đã hủy lưu trữ dự án");
          queryClient.invalidateQueries({ queryKey: ["project", projectId] });
        },
      }
    );
  };

  const handleDeleteProject = () => {
    if (confirm("Bạn có chắc chắn muốn xóa vĩnh viễn dự án này không? Tất cả công việc và dữ liệu sẽ bị xóa hoàn toàn.")) {
      deleteProjectMutate(projectId, {
        onSuccess: () => {
          toast.success("Đã xóa dự án thành công");
          router.push(`/workspaces/${workspaceId}`);
        },
        onError: (err: any) => {
          toast.error(err?.message || "Không thể xóa dự án");
        },
      });
    }
  };

  // Loading Skeleton State
  if (isLoading) {
    return (
      <div className="space-y-8 animate-in fade-in-50 duration-300">
        <div className="space-y-4 border-b border-slate-100 pb-6">
          <Skeleton className="h-4 w-48 rounded-md" />
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pt-2">
            <div className="flex items-start gap-4">
              <Skeleton className="size-12 rounded-xl shrink-0" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-64 rounded-lg" />
                <Skeleton className="h-4 w-96 rounded-md" />
              </div>
            </div>
            <Skeleton className="h-9 w-32 rounded-lg" />
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-10 w-80 rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <Skeleton className="h-64 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (isError || !project) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="size-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-4">
          <AlertCircle className="size-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Không tìm thấy Dự án</h2>
        <p className="text-slate-500 mt-2 text-sm max-w-md">
          Dự án này không tồn tại hoặc bạn không có quyền truy cập.
        </p>
        <Link href={`/workspaces/${workspaceId}`} className="mt-6">
          <Button variant="outline" className="gap-2 font-semibold">
            <ArrowLeft className="size-4" />
            Quay lại Workspace
          </Button>
        </Link>
      </div>
    );
  }

  const statusKey = (projectData?.status || "PLANNING").toUpperCase();
  const statusConfig = STATUS_CONFIG[statusKey] || STATUS_CONFIG.PLANNING;
  const progress = projectData?.progress ?? 0;
  const membersList = projectData?.members || [];
  const workspaceName = projectData?.workspace?.name || "Workspace";

  return (
    <div className="space-y-8">
      {/* Top Header & Breadcrumb */}
      <div className="border-b border-slate-200/80 pb-6 space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link
            href={`/workspaces/${workspaceId}`}
            className="hover:text-blue-600 transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="size-3.5" />
            {workspaceName}
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-bold truncate max-w-xs">
            {projectData?.title || projectData?.name}
          </span>
        </div>

        {/* Title & Action Buttons */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="size-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
              <FolderKanban className="size-6" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
                  {projectData?.title || projectData?.name}
                </h1>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${statusConfig.bg} ${statusConfig.text}`}
                >
                  <span className={`size-1.5 rounded-full ${statusConfig.dot}`} />
                  {statusConfig.label}
                </span>

                {projectData?.isArchived && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-xs font-bold bg-slate-100 text-slate-600 border-slate-200">
                    <Archive className="size-3" />
                    Đã lưu trữ
                  </span>
                )}
              </div>

              <p className="text-slate-500 text-sm max-w-2xl leading-relaxed">
                {projectData?.description || "Chưa có mô tả cho dự án này."}
              </p>
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab("settings")}
              className={`border-slate-200 font-semibold gap-1.5 cursor-pointer ${activeTab === "settings" ? "bg-slate-100 border-slate-300 text-blue-600" : ""
                }`}
            >
              <Settings className="size-4" />
              Cài đặt Dự án
            </Button>
          </div>
        </div>

        {/* Project Meta Info Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-3 p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/70">
            <div className="size-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Calendar className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400">Ngày bắt đầu</p>
              <p className="text-base font-bold text-slate-800">{formatDate(projectData.startDate)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/70">
            <div className="size-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Clock className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400">Hạn hoàn thành</p>
              <p className="text-base font-bold text-slate-800">{formatDate(projectData.dueDate)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/70">
            <div className="size-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 font-black text-sm">
              {progress}%
            </div>
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-500">Tiến độ</span>
                <span className="font-extrabold text-slate-800">{progress}%</span>
              </div>
              <div className="h-2 w-full bg-slate-200/70 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Tabs Header */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-px overflow-x-auto">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("board")}
              className={`flex items-center gap-2 px-4 py-2.5 font-bold text-sm border-b-2 transition-all cursor-pointer ${activeTab === "board"
                ? "border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl"
                : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
            >
              <LayoutGrid className="size-4" />
              Bảng Kanban
            </button>

            <button
              onClick={() => setActiveTab("list")}
              className={`flex items-center gap-2 px-4 py-2.5 font-bold text-sm border-b-2 transition-all cursor-pointer ${activeTab === "list"
                ? "border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl"
                : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
            >
              <ListTodo className="size-4" />
              Danh sách công việc
            </button>

            <button
              onClick={() => setActiveTab("members")}
              className={`flex items-center gap-2 px-4 py-2.5 font-bold text-sm border-b-2 transition-all cursor-pointer ${activeTab === "members"
                ? "border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl"
                : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
            >
              <Users className="size-4" />
              Thành viên ({membersList.length})
            </button>

            <button
              onClick={() => setActiveTab("settings")}
              className={`flex items-center gap-2 px-4 py-2.5 font-bold text-sm border-b-2 transition-all cursor-pointer ${activeTab === "settings"
                ? "border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl"
                : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
            >
              <Settings className="size-4" />
              Cài đặt Dự án
            </button>
          </div>
        </div>

        {/* TAB 1: KANBAN BOARD */}
        {activeTab === "board" && (
          <KanbanBoard projectId={projectId} projectMembers={membersList} />
        )}

        {/* TAB 2: TASK LIST VIEW */}
        {activeTab === "list" && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center space-y-3">
            <ListTodo className="size-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">
              Danh sách Công việc
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Chưa có công việc nào trong dự án này. Hãy tạo công việc mới ở Bảng Kanban để theo dõi tiến độ!
            </p>
          </div>
        )}

        {/* TAB 3: MEMBERS VIEW */}
        {activeTab === "members" && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Users className="size-5 text-blue-600" />
              Thành viên Dự án ({membersList.length})
            </h3>

            {membersList.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                Chưa có thông tin thành viên dự án.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {membersList.map((m: any, index: number) => {
                  const user = m.user || m;
                  const roleLabel = ROLE_LABELS[m.role] || m.role || "Thành viên";

                  return (
                    <div
                      key={user._id || index}
                      className="flex items-center gap-3 p-3 border border-slate-200/70 rounded-xl bg-slate-50/50 hover:bg-white hover:border-blue-300 hover:shadow-xs transition-all"
                    >
                      <Avatar className="size-10 border border-white shrink-0">
                        <AvatarImage src={user.profileImage} />
                        <AvatarFallback className="bg-blue-600 text-white font-bold text-sm">
                          {user.name?.charAt(0)?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-slate-800 truncate">
                          {user.name || "Thành viên"}
                        </h4>
                        <p className="text-xs text-slate-400 truncate">
                          {user.email}
                        </p>
                      </div>

                      <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200/60 px-2.5 py-0.5 rounded-full shrink-0">
                        {roleLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: SETTINGS VIEW */}
        {activeTab === "settings" && (
          <div className="space-y-8 pb-12">
            {/* Form Chỉnh Sửa Dự Án */}
            <form onSubmit={handleSaveSettings} className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="space-y-1">
                  <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                    <Settings className="size-5 text-blue-600" />
                    Cài đặt chung Dự án
                  </h3>
                  <p className="text-sm text-slate-500">
                    Cập nhật tiêu đề, mô tả, ngày bắt đầu và các thông tin dự án.
                  </p>
                </div>

                <Button type="submit" disabled={isUpdating} className="gap-2 font-bold cursor-pointer">
                  <Save className="size-4" />
                  {isUpdating ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>
              </div>

              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-extrabold text-slate-700 mb-1.5">
                    Tên dự án <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Nhập tên dự án..."
                    className="h-10 rounded-xl border-slate-200 font-semibold"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-extrabold text-slate-700 mb-1.5">
                    Mô tả dự án
                  </label>
                  <Textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Nhập mô tả dự án..."
                    rows={3}
                    className="rounded-xl border-slate-200 max-h-32 overflow-y-auto resize-none [field-sizing:fixed]"
                  />
                </div>

                {/* Dates & Status Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Status */}
                  <div>
                    <label className="block text-sm font-extrabold text-slate-700 mb-1.5">
                      Trạng thái dự án
                    </label>
                    <Select value={editStatus} onValueChange={setEditStatus}>
                      <SelectTrigger className="w-full h-10 rounded-xl border-slate-200 bg-white text-sm font-semibold">
                        <SelectValue placeholder="Chọn trạng thái" />
                      </SelectTrigger>
                      <SelectContent position="popper" align="start" className="w-[var(--radix-select-trigger-width)] z-[100]">
                        <SelectItem value="PLANNING" className="font-medium py-2">Lập kế hoạch</SelectItem>
                        <SelectItem value="IN_PROGRESS" className="font-medium py-2">Đang thực hiện</SelectItem>
                        <SelectItem value="COMPLETED" className="font-medium py-2">Hoàn thành</SelectItem>
                        <SelectItem value="ON_HOLD" className="font-medium py-2">Tạm dừng</SelectItem>
                        <SelectItem value="CANCELLED" className="font-medium py-2">Đã hủy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Start Date */}
                  <div>
                    <label className="block text-sm font-extrabold text-slate-700 mb-1.5">
                      Ngày bắt đầu
                    </label>
                    <DatePicker
                      value={editStartDate}
                      onChange={setEditStartDate}
                      placeholder="Chọn ngày bắt đầu..."
                      fontSize={14}
                      className="text-sm"
                    />
                  </div>

                  {/* Due Date */}
                  <div>
                    <label className="block text-sm font-extrabold text-slate-700 mb-1.5">
                      Hạn hoàn thành
                    </label>
                    <DatePicker
                      value={editDueDate}
                      onChange={setEditDueDate}
                      placeholder="Chọn hạn hoàn thành..."
                      fontSize={14}
                      className="text-sm"
                    />
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-extrabold text-slate-700 mb-1.5">
                    Thẻ / Nhãn (phân cách bằng dấu phẩy)
                  </label>
                  <Input
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                    placeholder="frontend, backend, design..."
                    className="h-10 rounded-xl border-slate-200"
                  />
                </div>
              </div>
            </form>

            {/* Quản lý Thành viên Dự Án (Project Members) */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                    <Users className="size-5 text-blue-600" />
                    Thành viên Dự án ({membersList.length})
                  </h3>
                  <p className="text-sm text-slate-500">
                    Danh sách thành viên có quyền truy cập vào dự án này.
                  </p>
                </div>
              </div>

              {membersList.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">
                  Chưa có thông tin thành viên dự án.
                </p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {membersList.map((m: any, index: number) => {
                    const user = m.user || m;
                    const roleLabel = ROLE_LABELS[m.role] || m.role || "Thành viên";

                    return (
                      <div key={user._id || index} className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-xl bg-blue-50 flex items-center justify-center">
                            <span className="text-xs font-bold text-blue-600">{index + 1}</span>
                          </div>
                          <Avatar className="size-9 border border-white shrink-0">
                            <AvatarImage src={user.profileImage} />
                            <AvatarFallback className="bg-blue-600 text-white font-bold text-xs">
                              {user.name?.charAt(0)?.toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="text-sm font-bold text-slate-800">{user.name || "Thành viên"}</h4>
                            <p className="text-xs text-slate-400">{user.email}</p>
                          </div>
                        </div>

                        <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
                          {roleLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Lưu Trữ Dự Án (Archive) */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                    <Archive className="size-5 text-slate-600" />
                    Lưu trữ Dự án
                  </h3>
                  <p className="text-sm text-slate-500">
                    {projectData?.isArchived
                      ? "Dự án hiện đang bị lưu trữ. Bạn có thể khôi phục để làm việc tiếp."
                      : "Lưu trữ dự án để ẩn khỏi danh sách làm việc chính mà không mất dữ liệu."}
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleToggleArchive}
                  className="font-semibold cursor-pointer border-slate-200"
                >
                  <Archive className="size-4 mr-1.5" />
                  {projectData?.isArchived ? "Khôi phục Dự án" : "Lưu trữ Dự án"}
                </Button>
              </div>
            </div>

            {/* Danger Zone (Vùng Nguy Hiểm) */}
            <div className="bg-rose-50/60 border border-rose-200/80 rounded-2xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-extrabold text-rose-700 flex items-center gap-2">
                    <AlertTriangle className="size-5 text-rose-600" />
                    Vùng nguy hiểm
                  </h3>
                  <p className="text-sm text-rose-600/80 max-w-md font-semibold">
                    Xóa vĩnh viễn dự án này cùng tất cả công việc, dữ liệu liên quan. Hành động này không thể hoàn tác!
                  </p>
                </div>

                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDeleteProject}
                  disabled={isDeleting}
                  className="font-bold cursor-pointer shadow-xs shrink-0"
                >
                  <Trash2 className="size-4 mr-1.5" />
                  {isDeleting ? "Đang xóa..." : "Xóa Dự án Vĩnh viễn"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
