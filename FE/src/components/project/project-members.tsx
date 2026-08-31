"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, UserPlus, Trash2, Shield, Check, Lock, Globe } from "lucide-react";
import { toast } from "sonner";
import type { MemberProps } from "@/types";

interface ProjectMembersDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  isPrivate?: boolean;
  workspaceMembers: any[];
  currentProjectMembers: any[];
  onUpdateProject: (data: { members?: any[]; isPrivate?: boolean }) => Promise<any>;
  canManageMembers?: boolean;
}

export function ProjectMembersDialog({
  isOpen,
  onOpenChange,
  projectId,
  isPrivate = false,
  workspaceMembers = [],
  currentProjectMembers = [],
  onUpdateProject,
  canManageMembers = true,
}: ProjectMembersDialogProps) {
  const [selectedUserToInvite, setSelectedUserToInvite] = useState<string>("");
  const [selectedRoleToInvite, setSelectedRoleToInvite] = useState<string>("contributor");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [privacySetting, setPrivacySetting] = useState<boolean>(isPrivate);

  // Normalize project members: [{ user: userId, role: "contributor" }]
  const getCleanMemberList = () => {
    return currentProjectMembers.map((m: any) => ({
      user: typeof m.user === "object" ? m.user._id : m.user,
      role: m.role || "contributor",
    }));
  };

  // Filter workspace members who are NOT YET in the project
  const currentMemberUserIds = new Set(
    currentProjectMembers.map((m: any) => (typeof m.user === "object" ? m.user._id : m.user))
  );

  const availableWorkspaceMembers = workspaceMembers.filter(
    (wm: any) => {
      const uId = typeof wm.user === "object" ? wm.user._id : wm.user;
      return !currentMemberUserIds.has(uId);
    }
  );

  const handleAddMember = async () => {
    if (!selectedUserToInvite) {
      toast.error("Vui lòng chọn thành viên để thêm");
      return;
    }
    setIsSubmitting(true);
    try {
      const currentList = getCleanMemberList();
      const updatedList = [
        ...currentList,
        { user: selectedUserToInvite, role: selectedRoleToInvite },
      ];
      await onUpdateProject({ members: updatedList });
      toast.success("Đã thêm thành viên vào dự án!");
      setSelectedUserToInvite("");
    } catch (err: any) {
      toast.error(err?.message || "Không thể thêm thành viên");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangeRole = async (targetUserId: string, newRole: string) => {
    setIsSubmitting(true);
    try {
      const currentList = getCleanMemberList();
      const updatedList = currentList.map((m) =>
        m.user === targetUserId ? { ...m, role: newRole } : m
      );
      await onUpdateProject({ members: updatedList });
      toast.success("Đã cập nhật vai trò thành viên");
    } catch (err: any) {
      toast.error(err?.message || "Không thể cập nhật vai trò");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMember = async (targetUserId: string, userName: string) => {
    if (currentProjectMembers.length <= 1) {
      toast.error("Dự án phải có ít nhất 1 thành viên");
      return;
    }
    setIsSubmitting(true);
    try {
      const currentList = getCleanMemberList();
      const updatedList = currentList.filter((m) => m.user !== targetUserId);
      await onUpdateProject({ members: updatedList });
      toast.success(`Đã xóa ${userName} khỏi dự án`);
    } catch (err: any) {
      toast.error(err?.message || "Không thể xóa thành viên");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePrivacy = async (newIsPrivate: boolean) => {
    setPrivacySetting(newIsPrivate);
    setIsSubmitting(true);
    try {
      await onUpdateProject({ isPrivate: newIsPrivate });
      toast.success(newIsPrivate ? "Đã chuyển dự án sang chế độ Riêng tư 🔒" : "Đã chuyển dự án sang chế độ Công khai 🌐");
    } catch (err: any) {
      setPrivacySetting(!newIsPrivate);
      toast.error(err?.message || "Không thể thay đổi chế độ riêng tư");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl p-6 max-md:!fixed max-md:!inset-y-0 max-md:!right-0 max-md:!left-auto max-md:!top-0 max-md:!flex max-md:!h-dvh max-md:!w-[86vw] max-md:!max-w-[340px] max-md:!translate-x-0 max-md:!translate-y-0 max-md:!flex-col max-md:!gap-4 max-md:!rounded-none max-md:!p-4 max-md:!duration-300 max-md:data-open:slide-in-from-right-full max-md:data-open:zoom-in-100 max-md:data-closed:slide-out-to-right-full max-md:data-closed:zoom-out-100">
        <DialogHeader className="shrink-0 space-y-1 pr-9">
          <DialogTitle className="flex items-center gap-2 text-base font-extrabold leading-6 text-slate-800 sm:text-xl">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Users className="h-5 w-5" />
            </div>
            Thành viên & Quyền hạn Dự án
          </DialogTitle>
          <p className="text-xs text-slate-500">
            Quản lý danh sách thành viên và phân quyền làm việc trong dự án này.
          </p>
        </DialogHeader>

        {/* Privacy Toggle Section */}
        {canManageMembers && (
          <div className="mt-2 flex flex-col items-stretch gap-3 rounded-xl border border-slate-200/80 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-0.5 pr-2">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                {privacySetting ? (
                  <>
                    <Lock className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                    <span>Dự án Riêng tư (Private)</span>
                  </>
                ) : (
                  <>
                    <Globe className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                    <span>Dự án Công khai (Public)</span>
                  </>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                {privacySetting
                  ? "Chỉ những người có tên dưới đây mới truy cập được dự án."
                  : "Owner/Admin Workspace có thể truy cập dự án này."}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => handleTogglePrivacy(!privacySetting)}
              className="h-8 w-full shrink-0 rounded-lg text-xs font-bold sm:w-auto"
            >
              {privacySetting ? "Đổi sang Công khai" : "Đổi sang Riêng tư"}
            </Button>
          </div>
        )}

        {/* Add Member Form */}
        {canManageMembers && availableWorkspaceMembers.length > 0 && (
          <div className="space-y-2 mt-3 pt-2 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <UserPlus className="h-3.5 w-3.5 text-blue-600" /> Thêm thành viên từ Workspace
            </label>
            <div className="grid grid-cols-1 gap-2 sm:flex">
              <Select value={selectedUserToInvite} onValueChange={setSelectedUserToInvite}>
                <SelectTrigger className="h-9 text-xs rounded-xl flex-1 bg-white">
                  <SelectValue placeholder="Chọn thành viên..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {availableWorkspaceMembers.map((wm: any) => {
                    const u = typeof wm.user === "object" ? wm.user : wm;
                    return (
                      <SelectItem key={u._id} value={u._id} className="text-xs">
                        {u.name} ({u.email})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              <Select value={selectedRoleToInvite} onValueChange={setSelectedRoleToInvite}>
                <SelectTrigger className="h-9 w-full rounded-xl bg-white text-xs sm:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="manager" className="text-xs font-semibold">Quản lý (Manager)</SelectItem>
                  <SelectItem value="contributor" className="text-xs font-semibold">Thực hiện (Contributor)</SelectItem>
                  <SelectItem value="viewer" className="text-xs font-semibold">Người xem (Viewer)</SelectItem>
                </SelectContent>
              </Select>

              <Button
                size="sm"
                disabled={isSubmitting || !selectedUserToInvite}
                onClick={handleAddMember}
                className="h-9 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shrink-0 cursor-pointer"
              >
                Thêm
              </Button>
            </div>
          </div>
        )}

        {/* Current Project Members List */}
        <div className="mt-3 flex min-h-0 flex-1 flex-col space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span>Danh sách thành viên ({currentProjectMembers.length})</span>
          </div>

          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1 sm:max-h-[45vh]">
            {currentProjectMembers.map((m: any) => {
              const u = typeof m.user === "object" ? m.user : { _id: m.user, name: "Người dùng", email: "" };
              const currentRole = m.role || "contributor";

              return (
                <div
                  key={u._id}
                  className="flex flex-col gap-2.5 rounded-xl border border-slate-200/60 bg-slate-50/80 p-2.5 transition-all hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <Avatar className="h-8 w-8 border border-slate-200 shrink-0">
                      <AvatarImage src={u.profileImage} />
                      <AvatarFallback className="text-xs font-bold bg-blue-100 text-blue-700">
                        {u.name?.charAt(0).toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{u.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{u.email}</p>
                    </div>
                  </div>

                  <div className="flex w-full shrink-0 items-center gap-1.5 sm:w-auto">
                    {canManageMembers ? (
                      <Select
                        value={currentRole}
                        onValueChange={(newRole) => handleChangeRole(u._id, newRole)}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger className="h-8 flex-1 rounded-lg bg-white text-[11px] font-semibold sm:w-32 sm:flex-none">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="manager" className="text-xs font-semibold">Quản lý</SelectItem>
                          <SelectItem value="contributor" className="text-xs font-semibold">Thực hiện</SelectItem>
                          <SelectItem value="viewer" className="text-xs font-semibold">Người xem</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
                        {currentRole === "manager" ? "Quản lý" : currentRole === "viewer" ? "Người xem" : "Thực hiện"}
                      </span>
                    )}

                    {canManageMembers && (
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={isSubmitting}
                        onClick={() => handleRemoveMember(u._id, u.name)}
                        className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
