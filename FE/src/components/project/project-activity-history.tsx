"use client";

import { History, Loader2 } from "lucide-react";
import type { ActivityLog } from "@/hooks/use-activity";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const STATUS_LABELS: Record<string, string> = {
  PLANNING: "Lập kế hoạch",
  IN_PROGRESS: "Đang thực hiện",
  COMPLETED: "Hoàn thành",
  ON_HOLD: "Tạm dừng",
  CANCELLED: "Đã huỷ",
};

interface ProjectActivityHistoryProps {
  activities: ActivityLog[];
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
}

export function ProjectActivityHistory({
  activities,
  hasMore,
  isLoadingMore,
  onLoadMore,
}: ProjectActivityHistoryProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-50">
            <History className="size-4.5 text-blue-600" />
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-extrabold text-slate-800">Lịch sử dự án</h3>
            <p className="truncate text-xs text-slate-500">Các thay đổi trạng thái gần đây</p>
          </div>
        </div>
        {activities.length > 0 && (
          <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
            {activities.length}
          </span>
        )}
      </div>
      {activities.length === 0 ? (
        <p className="py-4 text-center text-sm text-slate-400">Chưa có thay đổi trạng thái nào.</p>
      ) : (
        <div>
          <div className="max-h-[360px] divide-y divide-slate-100 overflow-y-auto">
            {activities.map((activity) => {
              const fromValue = String(activity.details?.fromStatus || "");
              const toValue = String(activity.details?.toStatus || "");
              const from = STATUS_LABELS[fromValue] || fromValue;
              const to = STATUS_LABELS[toValue] || toValue;
              return (
                <div key={activity._id} className="group grid grid-cols-[28px_minmax(0,1fr)] gap-2.5 px-4 py-3 transition-colors hover:bg-slate-50 sm:grid-cols-[28px_minmax(0,1fr)_auto] sm:items-center sm:px-5">
                  <Avatar className="size-7 ring-4 ring-white">
                    <AvatarImage
                      src={activity.user?.profileImage}
                      alt={activity.user?.name || "Thành viên"}
                    />
                    <AvatarFallback className="bg-slate-100 text-xs font-extrabold text-slate-600">
                      {(activity.user?.name || "T").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-sm">
                      <span className="font-bold text-slate-800">{activity.user?.name || "Thành viên"}</span>
                      {from && to ? (
                        <>
                          <span className="text-slate-500">đã chuyển</span>
                          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-600">{from}</span>
                          <span className="text-slate-400">→</span>
                          <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-xs font-semibold text-blue-700">{to}</span>
                        </>
                      ) : (
                        <span className="text-slate-500">đã tạo dự án</span>
                      )}
                      {Boolean(activity.details?.automatic) && (
                        <span className="rounded-md bg-cyan-50 px-1.5 py-0.5 text-[11px] font-semibold text-cyan-700">Tự động</span>
                      )}
                    </div>
                  </div>
                  <time className="col-start-2 shrink-0 whitespace-nowrap text-xs text-slate-400 sm:col-start-3">
                    {new Date(activity.createdAt).toLocaleString("vi-VN", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </time>
                </div>
              );
            })}
          </div>
          {hasMore && (
            <div className="border-t border-slate-100 p-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full text-xs font-bold text-slate-600"
                disabled={isLoadingMore}
                onClick={onLoadMore}
              >
                {isLoadingMore && <Loader2 className="mr-2 size-4 animate-spin" />}
                Xem hoạt động cũ hơn
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
