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
      <DialogContent className="max-w-md rounded-2xl p-6">
        <DialogHeader className="space-y-1">
          <DialogTitle className="font-extrabold text-xl flex items-center gap-2 text-slate-800">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <UserCheck className="h-5 w-5" />
            </div>
            Duyệt thành viên tham gia
          </DialogTitle>
          <p className="text-xs text-slate-500">
            Danh sách người dùng đang chờ quản trị viên phê duyệt để tham gia Workspace.
          </p>
        </DialogHeader>

        <div className="mt-3 space-y-3 max-h-[60vh] overflow-y-auto pr-1">
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
                  className="flex items-center justify-between p-3 bg-slate-50/70 border border-slate-200/60 rounded-xl hover:bg-slate-50 transition-all"
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

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      size="sm"
                      disabled={isApproving || isRejecting}
                      onClick={() => handleApprove(u._id, u.name)}
                      className="h-8 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1 cursor-pointer"
                    >
                      <Check className="size-3.5" />
                      Duyệt
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isApproving || isRejecting}
                      onClick={() => handleReject(u._id, u.name)}
                      className="h-8 px-2.5 rounded-lg border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-bold gap-1 cursor-pointer"
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
