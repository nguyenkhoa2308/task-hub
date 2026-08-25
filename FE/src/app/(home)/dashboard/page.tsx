"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  FolderKanban,
  TrendingUp,
  ListTodo,
  ArrowRight,
  RefreshCw,
  Calendar,
  Sparkles,
  Building2,
  PieChart as PieChartIcon,
  BarChart3,
  Activity,
  ChevronRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { useGetWorkspaces, useGetWorkspaceDashboard } from "@/hooks/use-workspace";
import { TaskDetailModal } from "@/components/task/task-detail-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { format, differenceInDays } from "date-fns";

const PROJECT_STATUS_LABELS: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  PLANNING: { label: "Lập kế hoạch", bg: "bg-purple-50 border-purple-200", text: "text-purple-700", dot: "bg-purple-500" },
  IN_PROGRESS: { label: "Đang thực hiện", bg: "bg-blue-50 border-blue-200", text: "text-blue-700", dot: "bg-blue-500" },
  COMPLETED: { label: "Hoàn thành", bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
  ON_HOLD: { label: "Tạm dừng", bg: "bg-amber-50 border-amber-200", text: "text-amber-700", dot: "bg-amber-500" },
  CANCELLED: { label: "Đã hủy", bg: "bg-rose-50 border-rose-200", text: "text-rose-700", dot: "bg-rose-500" },
};

import { useSearchParams, useRouter } from "next/navigation";

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedWorkspaceId = searchParams.get("workspaceId") || "all";
  const [selectedTask, setSelectedTask] = useState<any | null>(null);

  const { data: workspaces } = useGetWorkspaces();
  const {
    data: stats,
    isLoading: isLoadingStats,
    isFetching: isFetchingStats,
    refetch,
    isRefetching,
  } = useGetWorkspaceDashboard(selectedWorkspaceId === "all" ? undefined : selectedWorkspaceId);

  const showSkeleton = isLoadingStats || isFetchingStats;

  const handleWorkspaceChange = (wsId: string) => {
    if (wsId === "all") {
      router.push("/dashboard");
    } else {
      router.push(`/dashboard?workspaceId=${wsId}`);
    }
  };

  const formatDueDate = (dateString?: string) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return format(date, "dd/MM/yyyy");
    } catch {
      return null;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const p = priority?.toLowerCase();
    if (p === "high" || p === "cao") {
      return <span className="px-2.5 py-0.5 text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 rounded-full">Cao</span>;
    }
    if (p === "medium" || p === "trung bình") {
      return <span className="px-2.5 py-0.5 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded-full">Trung bình</span>;
    }
    return <span className="px-2.5 py-0.5 text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 rounded-full">Thấp</span>;
  };

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase();
    if (s === "done" || s === "completed" || s === "hoàn thành") {
      return <span className="px-2.5 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">Hoàn thành</span>;
    }
    if (s === "in_progress" || s === "in progress" || s === "đang thực hiện") {
      return <span className="px-2.5 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-md">Đang làm</span>;
    }
    if (s === "review" || s === "đang review") {
      return <span className="px-2.5 py-0.5 text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200 rounded-md">Review</span>;
    }
    return <span className="px-2.5 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 rounded-md">Cần làm</span>;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-2xl shadow-xs">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
            Dashboard Báo cáo & Thống kê
          </h1>
          <p className="text-slate-500 text-sm sm:text-base mt-1">
            Theo dõi xu hướng công việc, tiến độ dự án và hiệu suất toàn diện
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all hover:text-slate-900 active:scale-95 disabled:opacity-50"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`size-4 ${isRefetching ? "animate-spin" : ""}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* 4 Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {showSkeleton ? (
          <>
            <Skeleton className="h-28 w-full rounded-2xl bg-slate-100/80" />
            <Skeleton className="h-28 w-full rounded-2xl bg-slate-100/80" />
            <Skeleton className="h-28 w-full rounded-2xl bg-slate-100/80" />
            <Skeleton className="h-28 w-full rounded-2xl bg-slate-100/80" />
          </>
        ) : (
          <>
            {/* Card 1: Total Projects */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-purple-300 hover:shadow-md transition-all group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Tổng số dự án</span>
                <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                  <FolderKanban className="size-5" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{stats?.totalProjects || 0}</div>
                <div className="text-xs text-slate-500 mt-1">
                  <span className="font-semibold text-purple-600">{stats?.inProgressProjects || 0}</span> dự án đang thực hiện
                </div>
              </div>
            </div>

            {/* Card 2: Total Tasks */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-blue-300 hover:shadow-md transition-all group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Tổng công việc</span>
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <ListTodo className="size-5" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{stats?.totalTasks || 0}</div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <TrendingUp className="size-3.5 text-emerald-600" />
                  <span className="font-semibold text-emerald-600">{stats?.completedTasks || 0}</span> công việc đã hoàn thành
                </div>
              </div>
            </div>

            {/* Card 3: To Do */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-slate-300 hover:shadow-md transition-all group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Cần làm</span>
                <div className="p-2 bg-slate-100 text-slate-600 rounded-xl">
                  <CheckCircle2 className="size-5" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{stats?.todoTasks || 0}</div>
                <div className="text-xs text-slate-500 mt-1">Công việc đang chờ bắt đầu</div>
              </div>
            </div>

            {/* Card 4: In Progress */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-sky-300 hover:shadow-md transition-all group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Đang thực hiện</span>
                <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
                  <Clock className="size-5" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-sky-600 tracking-tight">{stats?.inProgressTasks || 0}</div>
                <div className="text-xs text-slate-500 mt-1">Công việc đang được xử lý</div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 4 Charts Grid (2x2) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {showSkeleton ? (
          <>
            <Skeleton className="h-80 w-full rounded-2xl bg-slate-100/80" />
            <Skeleton className="h-80 w-full rounded-2xl bg-slate-100/80" />
            <Skeleton className="h-80 w-full rounded-2xl bg-slate-100/80" />
            <Skeleton className="h-80 w-full rounded-2xl bg-slate-100/80" />
          </>
        ) : (
          <>
            {/* Chart 1: Task Trend (Line Chart) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="size-5 text-blue-600" />
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Xu hướng công việc</h2>
                    <p className="text-xs text-slate-500">Biến động trạng thái công việc hàng ngày (7 ngày qua)</p>
                  </div>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats?.dailyTaskTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: "12px", fontSize: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                    <Line type="monotone" dataKey="created" name="Tạo mới" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="completed" name="Hoàn thành" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="inProgress" name="Đang làm" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Project Status Breakdown (Pie/Donut Chart) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <PieChartIcon className="size-5 text-purple-600" />
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Trạng thái dự án</h2>
                    <p className="text-xs text-slate-500">Phân bổ trạng thái của tất cả dự án</p>
                  </div>
                </div>
              </div>

              {!stats?.projectStatusBreakdown || stats.projectStatusBreakdown.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-sm">
                  <PieChartIcon className="size-10 mb-2 opacity-30" />
                  Chưa có dữ liệu dự án
                </div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.projectStatusBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {stats.projectStatusBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: "12px", fontSize: "12px" }}
                      />
                      <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Chart 3: Task Priority Distribution (Pie/Donut Chart) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <PieChartIcon className="size-5 text-rose-500" />
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Độ ưu tiên công việc</h2>
                    <p className="text-xs text-slate-500">Phân bổ mức độ ưu tiên công việc</p>
                  </div>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats?.taskPriorityDistribution || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {stats?.taskPriorityDistribution?.map((entry, index) => (
                        <Cell key={`cell-pri-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: "12px", fontSize: "12px" }}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 4: Workspace Productivity (Bar Chart) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="size-5 text-emerald-600" />
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Năng suất Workspace</h2>
                    <p className="text-xs text-slate-500">Số lượng công việc hoàn thành theo từng dự án</p>
                  </div>
                </div>
              </div>

              {!stats?.workspaceProductivity || stats.workspaceProductivity.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-sm">
                  <BarChart3 className="size-10 mb-2 opacity-30" />
                  Chưa có thông tin năng suất
                </div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.workspaceProductivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: "12px", fontSize: "12px" }}
                      />
                      <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                      <Bar dataKey="completed" name="Đã hoàn thành" fill="#10b981" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="total" name="Tổng công việc" fill="#cbd5e1" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Bottom Grid: Recent Projects | Upcoming | Overdue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {showSkeleton ? (
          <>
            <Skeleton className="h-96 w-full rounded-2xl bg-slate-100/80" />
            <Skeleton className="h-96 w-full rounded-2xl bg-slate-100/80" />
            <Skeleton className="h-96 w-full rounded-2xl bg-slate-100/80" />
          </>
        ) : (
          <>
            {/* Recent Projects (Hiển thị 3 cái + Nút Xem tất cả) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <FolderKanban className="size-5 text-blue-600" />
                    <h2 className="text-base font-bold text-slate-900">Dự án gần đây</h2>
                  </div>
                </div>

                {!stats?.recentProjects || stats.recentProjects.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    <FolderKanban className="size-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Chưa có dự án nào</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {stats.recentProjects.slice(0, 3).map((project) => {
                      const statusConfig = PROJECT_STATUS_LABELS[project.status] || PROJECT_STATUS_LABELS.PLANNING;

                      return (
                        <Link
                          key={project._id}
                          href={`/workspaces/${project.workspaceId}/projects/${project._id}`}
                          className="block p-4 bg-slate-50/70 border border-slate-200/80 hover:border-blue-300 rounded-xl transition-all hover:bg-slate-100/60 group"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                              {project.title}
                              <ChevronRight className="size-3.5 text-slate-400 group-hover:translate-x-1 transition-transform" />
                            </div>
                            <span className={`px-2.5 py-0.5 text-xs font-semibold border rounded-md ${statusConfig.bg} ${statusConfig.text}`}>
                              {statusConfig.label}
                            </span>
                          </div>

                          {project.description && (
                            <p className="text-xs text-slate-500 line-clamp-1 mb-2.5">{project.description}</p>
                          )}

                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                              <span>
                                {project.completedTasks} / {project.totalTasks} công việc
                              </span>
                              <span className="font-bold text-slate-700">{project.progress}%</span>
                            </div>
                            <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(project.progress, 100)}%` }}
                              />
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Nút Xem tất cả dự án */}
              <div className="pt-2">
                <Link
                  href="/workspaces"
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all hover:text-slate-900"
                >
                  <span>Xem tất cả dự án</span>
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>

            {/* Công việc sắp tới (7 ngày) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="size-5 text-amber-500" />
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Sắp tới</h2>
                    <p className="text-xs text-slate-500">Hạn chót trong 7 ngày tới</p>
                  </div>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">
                  {stats?.upcomingTasks7Days?.length || 0}
                </span>
              </div>

              {!stats?.upcomingTasks7Days || stats.upcomingTasks7Days.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <CheckCircle2 className="size-8 mx-auto mb-2 opacity-30 text-emerald-500" />
                  <p className="text-sm font-medium text-slate-600">Không có công việc nào trong 7 ngày tới</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {stats.upcomingTasks7Days.map((task: any) => {
                    const daysRemaining = task.dueDate ? differenceInDays(new Date(task.dueDate), new Date()) : 0;
                    return (
                      <div
                        key={task._id}
                        onClick={() => setSelectedTask(task)}
                        className="p-3.5 bg-slate-50/70 border border-slate-200 hover:border-blue-300 rounded-xl flex items-center justify-between cursor-pointer transition-all hover:bg-slate-100/60"
                      >
                        <div className="space-y-1 min-w-0 flex-1 mr-2">
                          <div className="font-bold text-sm text-slate-800 truncate">{task.title}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-1.5">
                            <span className="text-blue-600 font-semibold truncate">{task.project?.title || "Dự án"}</span>
                            <span>•</span>
                            {getPriorityBadge(task.priority)}
                          </div>
                        </div>
                        <div className="text-right space-y-1 shrink-0">
                          <div className={`text-xs font-bold flex items-center justify-end gap-1 ${daysRemaining <= 1 ? "text-amber-600" : "text-slate-700"}`}>
                            <Clock className="size-3" />
                            {daysRemaining <= 0 ? "Hôm nay" : `${daysRemaining} ngày`}
                          </div>
                          {getStatusBadge(task.status)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Công việc quá hạn */}
            <div className="bg-white border border-rose-200/60 rounded-2xl p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-rose-100/80 pb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="size-5 text-rose-500" />
                  <div>
                    <h2 className="text-base font-bold text-rose-700">Quá hạn</h2>
                    <p className="text-xs text-slate-500">Công việc chưa hoàn thành đã qua hạn</p>
                  </div>
                </div>
                {(stats?.overdueTasksList?.length || 0) > 0 && (
                  <span className="text-xs font-bold px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full">
                    {stats!.overdueTasksList!.length}
                  </span>
                )}
              </div>

              {!stats?.overdueTasksList || stats.overdueTasksList.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <CheckCircle2 className="size-8 mx-auto mb-2 opacity-30 text-emerald-500" />
                  <p className="text-sm font-medium text-slate-600">Không có công việc nào bị quá hạn</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {stats.overdueTasksList.map((task: any) => {
                    const overdueDays = task.dueDate ? differenceInDays(new Date(), new Date(task.dueDate)) : 0;
                    return (
                      <div
                        key={task._id}
                        onClick={() => setSelectedTask(task)}
                        className="p-3.5 bg-rose-50/40 border border-rose-200/80 hover:border-rose-400 rounded-xl flex items-center justify-between cursor-pointer transition-all hover:bg-rose-50/80"
                      >
                        <div className="space-y-1 min-w-0 flex-1 mr-2">
                          <div className="font-bold text-sm text-slate-900 truncate flex items-center gap-1.5">
                            <AlertTriangle className="size-3.5 text-rose-600 shrink-0" />
                            <span className="truncate">{task.title}</span>
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-1.5">
                            <span className="text-blue-600 font-semibold truncate">{task.project?.title || "Dự án"}</span>
                            <span>•</span>
                            {getPriorityBadge(task.priority)}
                          </div>
                        </div>
                        <div className="text-right space-y-1 shrink-0">
                          <div className="text-xs font-extrabold text-rose-600 flex items-center justify-end gap-1">
                            <Clock className="size-3" />
                            <span>{overdueDays > 0 ? `${overdueDays} ngày` : "Hôm nay"}</span>
                          </div>
                          {getStatusBadge(task.status)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          refetchTasks={refetch}
        />
      )}
    </div>
  );
}



