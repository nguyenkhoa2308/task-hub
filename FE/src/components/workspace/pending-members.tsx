"use client";

import { useApproveMember, useGetPendingMembers, useRejectMember } from "@/hooks/use-workspace";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, X, Clock, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface PendingMembersDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
}

export function PendingMembersDialog({
  isOpen,
  onOpenChange,
  workspaceId,
}: PendingMembersDialogProps) {
  const queryClient = useQueryClient();
  const { data: pendingMembers, isLoading } = useGetPendingMembers(workspaceId);
  const { mutate: approveMember, isPending: isApproving } = useApproveMember(workspaceId);
  const { mutate: rejectMember, isPending: isRejecting } = useRejectMember(workspaceId);

  const handleApprove = (userId: string, userName: string) => {
    approveMember(userId, {
      onSuccess: () => {
        toast.success(`Đã duyệt ${userName} vào workspace`);
        queryClient.invalidateQueries({ queryKey: ["pending-members", workspaceId] });
        queryClient.invalidateQueries({ queryKey: ["workspace", workspaceId] });
      },
      onError: (err: any) => {
        toast.error(err?.message || "Không thể duyệt thành viên");
      },
    });
  };

  const handleReject = (userId: string, userName: string) => {
    rejectMember(userId, {
      onSuccess: () => {
        toast.info(`Đã từ chối yêu cầu của ${userName}`);
        queryClient.invalidateQueries({ queryKey: ["pending-members", workspaceId] });
      },
      onError: (err: any) => {
        toast.error(err?.message || "Không thể từ chối yêu cầu");
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl p-6 max-lg:!fixed max-lg:!inset-y-0 max-lg:!right-0 max-lg:!left-auto max-lg:!top-0 max-lg:!flex max-lg:!h-dvh max-lg:!w-full max-lg:!max-w-none max-lg:!translate-x-0 max-lg:!translate-y-0 max-lg:!flex-col max-lg:!gap-4 max-lg:!overflow-y-auto max-lg:!rounded-none max-lg:!p-4 max-lg:!duration-300 max-lg:data-open:slide-in-from-right-full max-lg:data-open:zoom-in-100 max-lg:data-closed:slide-out-to-right-full max-lg:data-closed:zoom-out-100 sm:max-lg:!w-[480px]">
        <DialogHeader className="shrink-0 space-y-1 pr-9">
          <DialogTitle className="flex items-center gap-2 text-base font-extrabold leading-6 text-slate-800 sm:text-xl">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <UserCheck className="h-5 w-5" />
            </div>
            Duyệt thành viên tham gia
          </DialogTitle>
          <p className="text-xs text-slate-500">
            Danh sách người dùng đang chờ quản trị viên phê duyệt để tham gia Workspace.
          </p>
        </DialogHeader>

        <div className="mt-1 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1 sm:mt-3 sm:max-h-[60vh]">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-36" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : !pendingMembers || pendingMembers.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <div className="size-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Clock className="size-6" />
              </div>
              <p className="text-sm font-semibold text-slate-600">Không có yêu cầu nào</p>
              <p className="text-xs text-slate-400">Tất cả các yêu cầu tham gia đã được xử lý.</p>
            </div>
          ) : (
            pendingMembers.map((member: any) => {
              const u = member.user || {};
              return (
                <div
                  key={u._id || member._id}
                  className="flex flex-col gap-3 rounded-xl border border-slate-200/60 bg-slate-50/70 p-3 transition-all hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <Avatar className="h-9 w-9 border border-slate-200 shrink-0">
                      <AvatarImage src={u.profileImage} />
                      <AvatarFallback className="text-xs font-bold bg-blue-100 text-blue-700">
                        {u.name?.charAt(0).toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{u.name || "Người dùng"}</p>
                      <p className="text-[11px] text-slate-500 truncate">{u.email}</p>
                    </div>
                  </div>

                  <div className="flex w-full shrink-0 items-center gap-1.5 sm:w-auto">
                    <Button
                      size="sm"
                      disabled={isApproving || isRejecting}
                      onClick={() => handleApprove(u._id, u.name)}
                      className="h-8 flex-1 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1 cursor-pointer sm:flex-none"
                    >
                      <Check className="size-3.5" />
                      Duyệt
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isApproving || isRejecting}
                      onClick={() => handleReject(u._id, u.name)}
                      className="h-8 flex-1 px-2.5 rounded-lg border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-bold gap-1 cursor-pointer sm:flex-none"
                    >
                      <X className="size-3.5" />
                      Từ chối
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
