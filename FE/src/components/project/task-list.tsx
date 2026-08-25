"use client";

import React from "react";
import { useGetTasksByProject } from "@/hooks/use-task";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Edit2, Trash2 } from "lucide-react";

export function TaskList({ projectId, canEdit }: { projectId: string; canEdit: boolean }) {
  const { data: tasks = [], isLoading, isError } = useGetTasksByProject(projectId);

  if (isLoading) {
    return <p className="text-sm text-slate-500">Đang tải danh sách công việc...</p>;
  }

  if (isError) {
    return <p className="text-sm text-rose-600">Không thể tải danh sách công việc.</p>;
  }

  if (tasks.length === 0) {
    return (
      <p className="text-sm text-slate-500">Chưa có công việc nào trong dự án này.</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border border-slate-200/80 rounded-xl bg-white">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Tiêu đề</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Ưu tiên</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Hạn</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Trạng thái</th>
            {canEdit && <th className="px-4 py-2 text-center text-xs font-semibold text-slate-600">Thao tác</th>}
          </tr>
        </thead>
        <tbody>
          {tasks.map((t: any) => (
            <tr key={t._id} className="border-t border-slate-200/50">
              <td className="px-4 py-2 text-sm text-slate-800">{t.title}</td>
              <td className="px-4 py-2 text-sm text-slate-800">{t.priority || "-"}</td>
              <td className="px-4 py-2 text-sm text-slate-800">
                {t.dueDate ? new Date(t.dueDate).toLocaleDateString("vi-VN") : "-"}
              </td>
              <td className="px-4 py-2 text-sm text-slate-800">{t.status || "-"}</td>
              {canEdit && (
                <td className="px-4 py-2 flex items-center justify-center gap-2">
                  {/* Placeholder actions – can be wired later */}
                  <Button variant="ghost" size="sm" className="p-1 text-blue-600">
                    <Edit2 className="size-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="p-1 text-emerald-600">
                    <CheckCircle2 className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1 text-rose-600"
                    onClick={() => toast.info(`Xóa công việc ${t.title} - chưa thực hiện`)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
