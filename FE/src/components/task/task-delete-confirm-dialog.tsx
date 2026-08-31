"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface TaskDeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export function TaskDeleteConfirmDialog({ open, onOpenChange, onConfirm, isDeleting = false }: TaskDeleteConfirmDialogProps) {
  const [confirmText, setConfirmText] = useState("");

  const close = () => {
    setConfirmText("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) close(); else onOpenChange(true); }}>
      <DialogContent
        className="sm:max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        onPointerDownOutside={(event) => {
          event.preventDefault();
          event.detail.originalEvent.preventDefault();
          event.detail.originalEvent.stopPropagation();
          close();
        }}
        onEscapeKeyDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
          close();
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-lg font-extrabold text-slate-800">Xác nhận xóa công việc</DialogTitle>
          <DialogDescription className="mt-2 text-slate-500">Hành động này không thể hoàn tác. Công việc sẽ bị xóa vĩnh viễn khỏi dự án.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <p className="text-xs font-semibold leading-relaxed text-slate-700">Để xác nhận xóa, vui lòng nhập <strong className="rounded border border-rose-100 bg-rose-50 px-2 py-0.5 font-bold text-rose-600">DELETE</strong> vào ô dưới đây:</p>
          <Input value={confirmText} onChange={(event) => setConfirmText(event.target.value.toUpperCase())} placeholder="Nhập DELETE..." className="h-10 rounded-xl border-slate-200 bg-slate-50 text-sm font-bold uppercase text-slate-800" />
        </div>
        <DialogFooter className="mt-4 gap-3 border-t border-slate-100 pt-4">
          <Button variant="outline" onClick={close} className="h-10 rounded-xl px-4 font-semibold">Hủy</Button>
          <Button variant="destructive" disabled={isDeleting || confirmText !== "DELETE"} onClick={onConfirm} className="h-10 rounded-xl px-5 font-bold">
            {isDeleting ? "Đang xóa..." : "Tôi hiểu, hãy xóa công việc"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
