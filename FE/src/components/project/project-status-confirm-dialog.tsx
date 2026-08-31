"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const STATUS_COPY: Record<string, { title: string; description: string; action: string; danger?: boolean }> = {
  COMPLETED: {
    title: "Hoàn thành dự án?",
    description: "Các công việc sẽ chuyển sang chế độ chỉ xem. Bạn vẫn có thể mở lại dự án về Đang thực hiện khi phát sinh bàn giao hoặc bảo hành.",
    action: "Hoàn thành dự án",
  },
  ON_HOLD: {
    title: "Tạm dừng dự án?",
    description: "Tạo, sửa và kéo thả công việc sẽ bị khóa cho tới khi dự án được tiếp tục.",
    action: "Tạm dừng dự án",
  },
  CANCELLED: {
    title: "Huỷ dự án?",
    description: "Dự án và các công việc vẫn được giữ để tra cứu, nhưng mọi thao tác chỉnh sửa sẽ bị khóa.",
    action: "Huỷ dự án",
    danger: true,
  },
  IN_PROGRESS: {
    title: "Đưa dự án về Đang thực hiện?",
    description: "Các thành viên có quyền sẽ có thể tiếp tục tạo, sửa và kéo thả công việc.",
    action: "Tiếp tục dự án",
  },
  PLANNING: {
    title: "Đưa dự án về Lập kế hoạch?",
    description: "Các công việc sẽ được mở lại để chuẩn bị trước khi dự án bắt đầu.",
    action: "Chuyển về lập kế hoạch",
  },
};

export function ProjectStatusConfirmDialog({
  open,
  status,
  isPending,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  status: string;
  isPending?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const copy = STATUS_COPY[status] || STATUS_COPY.IN_PROGRESS;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-extrabold text-slate-900">{copy.title}</DialogTitle>
          <DialogDescription className="pt-1 text-sm leading-6 text-slate-600">{copy.description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-3 gap-2 border-t border-slate-100 pt-4">
          <Button variant="outline" disabled={isPending} onClick={() => onOpenChange(false)}>Quay lại</Button>
          <Button variant={copy.danger ? "destructive" : "default"} disabled={isPending} onClick={onConfirm}>
            {isPending ? "Đang cập nhật..." : copy.action}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
