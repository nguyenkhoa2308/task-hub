"use client";

import {
  Archive,
  Building2,
  CalendarDays,
  CheckCircle2,
  FileText,
  FolderKanban,
  ListChecks,
  MessageCircle,
  RotateCcw,
  Users,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Person {
  _id?: string;
  name?: string;
  email?: string;
  profileImage?: string;
}

interface ArchivedTaskSummary {
  _id: string;
  title: string;
  status?: string;
  priority?: string;
  dueDate?: string;
  subtasks?: Array<{ completed?: boolean; done?: boolean }>;
}

export interface ArchivedTaskDetail extends ArchivedTaskSummary {
  description?: string;
  startDate?: string;
  archivedAt?: string;
  updatedAt?: string;
  assignees?: Array<Person | { user?: Person }>;
  attachments?: unknown[];
  comments?: unknown[];
  project?: {
    title?: string;
    name?: string;
    workspace?: { name?: string };
  };
}

export interface ArchivedProjectDetail {
  _id: string;
  title: string;
  description?: string;
  status?: string;
  progress?: number;
  startDate?: string;
  dueDate?: string;
  archivedAt?: string;
  workspace?: { name?: string };
  members?: Array<{ user?: Person; role?: string }>;
  tasks?: ArchivedTaskSummary[];
}

type ArchivedDetail =
  | { kind: "task"; item: ArchivedTaskDetail }
  | { kind: "project"; item: ArchivedProjectDetail };

interface ArchivedDetailDialogProps {
  detail: ArchivedDetail | null;
  onOpenChange: (open: boolean) => void;
  onRestore: (kind: ArchivedDetail["kind"], id: string) => void;
  isRestoring?: boolean;
}

const formatDate = (value?: string) =>
  value ? new Intl.DateTimeFormat("vi-VN").format(new Date(value)) : "Chưa đặt";

const statusLabel = (status?: string) => {
  const value = status?.toUpperCase() || "";
  if (value.includes("DONE") || value.includes("COMPLETED")) return "Hoàn thành";
  if (value.includes("PROGRESS")) return "Đang thực hiện";
  if (value.includes("REVIEW")) return "Đang review";
  if (value.includes("HOLD")) return "Tạm dừng";
  if (value.includes("CANCEL")) return "Đã hủy";
  if (value.includes("PLANNING")) return "Lập kế hoạch";
  return "Cần làm";
};

const priorityLabel = (priority?: string) => {
  const value = priority?.toUpperCase();
  if (value === "HIGH") return "Cao";
  if (value === "LOW") return "Thấp";
  return "Trung bình";
};

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
        {icon}
        {label}
      </div>
      <div className="mt-1.5 text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}

export function ArchivedDetailDialog({
  detail,
  onOpenChange,
  onRestore,
  isRestoring = false,
}: ArchivedDetailDialogProps) {
  const item = detail?.item;
  const isTask = detail?.kind === "task";
  const project = detail?.kind === "project" ? detail.item : null;
  const task = detail?.kind === "task" ? detail.item : null;
  const subtasks = task?.subtasks || [];
  const completedSubtasks = subtasks.filter((subtask) => subtask.completed || subtask.done).length;
  const assignees: Person[] = (task?.assignees || []).map((assignee) => {
    if ("user" in assignee) return assignee.user || {};
    return assignee as Person;
  });

  return (
    <Dialog open={Boolean(detail)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto p-0 sm:max-w-2xl max-lg:!fixed max-lg:!inset-y-0 max-lg:!right-0 max-lg:!left-auto max-lg:!top-0 max-lg:!h-dvh max-lg:!max-h-none max-lg:!w-full max-lg:!max-w-none max-lg:!translate-x-0 max-lg:!translate-y-0 max-lg:!rounded-none max-lg:!duration-300 max-lg:data-open:slide-in-from-right-full max-lg:data-open:zoom-in-100 max-lg:data-closed:slide-out-to-right-full max-lg:data-closed:zoom-out-100 sm:max-lg:!w-[600px]">
        {item && detail && (
          <>
            <DialogHeader className="border-b border-slate-200 px-6 py-5 pr-14">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-blue-700">
                <Archive className="size-4" />
                Chi tiết chỉ đọc
              </div>
              <DialogTitle className="text-xl font-bold leading-7 text-slate-900">
                {item.title}
              </DialogTitle>
              <DialogDescription>
                {isTask ? "Công việc đã lưu trữ" : "Dự án đã lưu trữ"} · {formatDate(item.archivedAt)}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 px-6 py-1">
              <p className="text-sm leading-6 text-slate-600">
                {item.description || (isTask ? "Công việc không có mô tả." : "Dự án không có mô tả.")}
              </p>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <InfoItem icon={<CheckCircle2 className="size-4" />} label="Trạng thái" value={statusLabel(item.status)} />
                {isTask ? (
                  <InfoItem icon={<ListChecks className="size-4" />} label="Ưu tiên" value={priorityLabel(task?.priority)} />
                ) : (
                  <InfoItem icon={<ListChecks className="size-4" />} label="Tiến độ" value={`${project?.progress || 0}%`} />
                )}
                <InfoItem icon={<CalendarDays className="size-4" />} label="Thời gian" value={`${formatDate(item.startDate)} – ${formatDate(item.dueDate)}`} />
              </div>

              {task && (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <InfoItem icon={<Building2 className="size-4" />} label="Workspace" value={task.project?.workspace?.name || "Không xác định"} />
                    <InfoItem icon={<FolderKanban className="size-4" />} label="Dự án" value={task.project?.title || task.project?.name || "Không xác định"} />
                  </div>

                  {subtasks.length > 0 && (
                    <section>
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-900">Tiến độ công việc phụ</h3>
                        <span className="text-xs font-semibold text-slate-500">{completedSubtasks}/{subtasks.length}</span>
                      </div>
                      <div className="flex gap-1">
                        {subtasks.map((subtask, index) => (
                          <span key={index} className={`h-2 flex-1 rounded-full ${subtask.completed || subtask.done ? "bg-emerald-500" : "bg-slate-200"}`} />
                        ))}
                      </div>
                    </section>
                  )}

                  <section>
                    <h3 className="mb-2 text-sm font-bold text-slate-900">Người thực hiện</h3>
                    {assignees.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {assignees.map((person, index) => (
                          <div key={person._id || index} className="flex items-center gap-2 rounded-full border border-slate-200 py-1 pl-1 pr-3">
                            <Avatar className="size-7">
                              <AvatarImage src={person.profileImage} />
                              <AvatarFallback>{(person.name || person.email || "U").charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-semibold text-slate-700">{person.name || person.email || "Thành viên"}</span>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-sm text-slate-500">Chưa phân công người thực hiện.</p>}
                  </section>

                  <div className="flex gap-5 border-t border-slate-100 pt-4 text-xs font-medium text-slate-500">
                    <span className="flex items-center gap-1.5"><FileText className="size-4" />{task.attachments?.length || 0} tệp đính kèm</span>
                    <span className="flex items-center gap-1.5"><MessageCircle className="size-4" />{task.comments?.length || 0} bình luận</span>
                  </div>
                </>
              )}

              {project && (
                <>
                  <InfoItem icon={<Building2 className="size-4" />} label="Workspace" value={project.workspace?.name || "Không xác định"} />

                  <section>
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900"><Users className="size-4" />Thành viên</h3>
                      <span className="text-xs text-slate-500">{project.members?.length || 0} người</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(project.members || []).map((member, index) => {
                        const person = member.user || {};
                        return (
                          <div key={person._id || index} className="flex items-center gap-2 rounded-full border border-slate-200 py-1 pl-1 pr-3">
                            <Avatar className="size-7"><AvatarImage src={person.profileImage} /><AvatarFallback>{(person.name || person.email || "U").charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                            <span className="text-xs font-semibold text-slate-700">{person.name || person.email || "Thành viên"}</span>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  <section>
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900">Công việc trong dự án</h3>
                      <span className="text-xs text-slate-500">{project.tasks?.length || 0} công việc</span>
                    </div>
                    <div className="overflow-hidden rounded-xl border border-slate-200">
                      {(project.tasks || []).length > 0 ? project.tasks?.slice(0, 8).map((projectTask) => (
                        <div key={projectTask._id} className="flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-2.5 last:border-b-0">
                          <span className="min-w-0 truncate text-sm font-semibold text-slate-800">{projectTask.title}</span>
                          <span className="shrink-0 text-xs text-slate-500">{statusLabel(projectTask.status)}</span>
                        </div>
                      )) : <p className="px-3 py-5 text-center text-sm text-slate-500">Dự án chưa có công việc.</p>}
                    </div>
                    {(project.tasks?.length || 0) > 8 && <p className="mt-2 text-xs text-slate-500">Và {(project.tasks?.length || 0) - 8} công việc khác.</p>}
                  </section>
                </>
              )}
            </div>

            <DialogFooter className="border-t border-slate-200 px-6 py-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Đóng</Button>
              <Button disabled={isRestoring} onClick={() => onRestore(detail.kind, item._id)} className="gap-2 bg-blue-600 hover:bg-blue-700">
                <RotateCcw className="size-4" />
                Đưa trở lại
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
