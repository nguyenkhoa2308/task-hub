"use client";

import { useState } from "react";
import { Crown, LogOut, MoreHorizontal, Shield, UserMinus } from "lucide-react";
import { toast } from "sonner";
import {
  useLeaveWorkspace,
  useRemoveWorkspaceMember,
  useTransferWorkspaceOwnership,
  useUpdateWorkspaceMemberRole,
} from "@/hooks/use-workspace";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ConfirmAction = "remove" | "leave" | "transfer" | null;

export function MemberActions({
  workspaceId, memberId, memberName, memberRole, requesterRole, isCurrentUser,
}: {
  workspaceId: string;
  memberId: string;
  memberName: string;
  memberRole: string;
  requesterRole?: string;
  isCurrentUser: boolean;
}) {
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const updateRole = useUpdateWorkspaceMemberRole(workspaceId);
  const removeMember = useRemoveWorkspaceMember(workspaceId);
  const leaveWorkspace = useLeaveWorkspace(workspaceId);
  const transferOwnership = useTransferWorkspaceOwnership(workspaceId);
  const isOwner = requesterRole === "owner";
  const canManageTarget = !isCurrentUser && memberRole !== "owner"
    && (isOwner || (requesterRole === "admin" && memberRole !== "admin"));
  const canLeave = isCurrentUser && memberRole !== "owner";

  if (!canManageTarget && !canLeave) return null;

  const changeRole = async (role: "admin" | "member" | "viewer") => {
    try {
      await updateRole.mutateAsync({ userId: memberId, role });
      toast.success("Đã cập nhật vai trò thành viên");
    } catch (error: any) {
      toast.error(error.message || "Không thể cập nhật vai trò");
    }
  };

  const confirm = async () => {
    try {
      if (confirmAction === "remove") await removeMember.mutateAsync(memberId);
      if (confirmAction === "leave") await leaveWorkspace.mutateAsync();
      if (confirmAction === "transfer") await transferOwnership.mutateAsync(memberId);
      toast.success(confirmAction === "transfer" ? "Đã chuyển quyền sở hữu" : confirmAction === "leave" ? "Bạn đã rời workspace" : "Đã xóa thành viên");
      setConfirmAction(null);
    } catch (error: any) {
      toast.error(error.message || "Không thể thực hiện thao tác");
    }
  };

  const isPending = removeMember.isPending || leaveWorkspace.isPending || transferOwnership.isPending;
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-9 rounded-lg" aria-label={`Thao tác với ${memberName}`}>
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {canManageTarget && <>
            <DropdownMenuItem disabled={memberRole === "member" || updateRole.isPending} onSelect={() => changeRole("member")}><Shield /> Đặt làm thành viên</DropdownMenuItem>
            <DropdownMenuItem disabled={memberRole === "viewer" || updateRole.isPending} onSelect={() => changeRole("viewer")}><Shield /> Đặt làm người xem</DropdownMenuItem>
            {isOwner && <DropdownMenuItem disabled={memberRole === "admin" || updateRole.isPending} onSelect={() => changeRole("admin")}><Shield /> Đặt làm quản trị viên</DropdownMenuItem>}
            {isOwner && <DropdownMenuItem onSelect={() => setConfirmAction("transfer")}><Crown /> Chuyển quyền sở hữu</DropdownMenuItem>}
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => setConfirmAction("remove")}><UserMinus /> Xóa khỏi workspace</DropdownMenuItem>
          </>}
          {canLeave && <DropdownMenuItem variant="destructive" onSelect={() => setConfirmAction("leave")}><LogOut /> Rời workspace</DropdownMenuItem>}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirmAction !== null} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmAction === "transfer" ? "Chuyển quyền sở hữu?" : confirmAction === "leave" ? "Rời workspace?" : "Xóa thành viên?"}</DialogTitle>
            <DialogDescription>
              {confirmAction === "transfer"
                ? `${memberName} sẽ trở thành owner mới, còn bạn chuyển thành quản trị viên.`
                : confirmAction === "leave"
                  ? "Bạn sẽ mất quyền truy cập workspace và các dự án bên trong."
                  : `${memberName} sẽ mất quyền truy cập workspace và các dự án bên trong.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAction(null)} disabled={isPending}>Hủy</Button>
            <Button variant={confirmAction === "transfer" ? "default" : "destructive"} onClick={confirm} disabled={isPending}>
              {isPending ? "Đang xử lý..." : "Xác nhận"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
