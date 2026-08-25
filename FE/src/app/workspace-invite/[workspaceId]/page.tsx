"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGetWorkspaceById, useJoinWorkspaceByLink } from "@/hooks/use-workspace";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, CheckCircle2, AlertCircle, ArrowRight, Building } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function WorkspaceInvitePage() {
  const params = useParams<{ workspaceId: string }>();
  const workspaceId = params.workspaceId;
  const router = useRouter();

  const { data: workspace, isLoading, isError } = useGetWorkspaceById(workspaceId);
  const { mutate: joinWorkspace, isPending: isJoining } = useJoinWorkspaceByLink();

  const [joinState, setJoinState] = useState<"none" | "active" | "pending">("none");

  const handleJoin = () => {
    if (!workspaceId) return;
    joinWorkspace(workspaceId, {
      onSuccess: (res: any) => {
        if (res?.status === "pending") {
          setJoinState("pending");
          toast.info(res?.message || "Yêu cầu tham gia đã được gửi! Vui lòng chờ phê duyệt.");
        } else {
          setJoinState("active");
          toast.success("Tham gia workspace thành công!");
          setTimeout(() => {
            router.push(`/workspaces/${workspaceId}`);
          }, 1500);
        }
      },
      onError: (err: any) => {
        toast.error(err?.message || "Không thể tham gia workspace");
      },
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200/80 rounded-3xl p-8 max-w-md w-full shadow-xs text-center space-y-4">
          <Skeleton className="size-16 rounded-2xl mx-auto" />
          <Skeleton className="h-6 w-3/4 mx-auto rounded-lg" />
          <Skeleton className="h-4 w-1/2 mx-auto rounded-md" />
          <Skeleton className="h-11 w-full rounded-xl pt-4" />
        </div>
      </div>
    );
  }

  if (isError || !workspace) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200/80 rounded-3xl p-8 max-w-md w-full shadow-xs text-center space-y-4">
          <div className="size-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="size-7" />
          </div>
          <h1 className="text-xl font-bold text-slate-800">Lời mời không hợp lệ</h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            Workspace này không tồn tại hoặc đường link mời đã hết hạn.
          </p>
          <Link href="/workspaces">
            <Button className="mt-2 rounded-xl font-bold bg-slate-900 hover:bg-slate-800 text-xs h-10 px-5">
              Về danh sách Workspace
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/80 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200/80 rounded-3xl p-8 max-w-md w-full shadow-md text-center space-y-6">
        {/* Workspace Avatar */}
        <div
          className="size-16 rounded-2xl flex items-center justify-center shadow-md mx-auto"
          style={{ backgroundColor: workspace.color || "#3b82f6" }}
        >
          <span className="text-2xl font-black text-white">
            {workspace.name?.charAt(0).toUpperCase()}
          </span>
        </div>

        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200/60 inline-flex items-center gap-1.5 mb-2">
            <Building className="size-3" /> Lời mời tham gia Workspace
          </span>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            {workspace.name}
          </h1>
          {workspace.description && (
            <p className="text-xs text-slate-500 mt-1.5 max-w-xs mx-auto line-clamp-2">
              {workspace.description}
            </p>
          )}
        </div>

        {/* Member Stats */}
        <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-3 flex items-center justify-center gap-2 text-xs font-semibold text-slate-600">
          <Users className="size-4 text-slate-400" />
          <span>{workspace.members?.length || 0} thành viên đã tham gia</span>
        </div>

        {joinState === "active" ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 text-xs font-bold flex items-center justify-center gap-2">
            <CheckCircle2 className="size-5 text-emerald-600" />
            Đã tham gia! Đang chuyển hướng...
          </div>
        ) : joinState === "pending" ? (
          <div className="p-4 bg-amber-50 border border-amber-200/80 rounded-2xl text-amber-800 text-xs text-left space-y-1.5">
            <div className="font-bold flex items-center gap-2 text-amber-900 text-sm">
              <AlertCircle className="size-4 text-amber-600 shrink-0" />
              Yêu cầu đã được gửi!
            </div>
            <p className="text-[11px] leading-relaxed text-amber-700">
              Yêu cầu tham gia của bạn đang chờ Quản trị viên của workspace phê duyệt. Bạn sẽ nhận được thông báo khi được chấp nhận.
            </p>
          </div>
        ) : (
          <Button
            onClick={handleJoin}
            disabled={isJoining}
            className="w-full h-11 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white text-xs cursor-pointer shadow-md transition-all gap-2"
          >
            {isJoining ? "Đang xử lý..." : "Chấp nhận lời mời & Tham gia"}
            <ArrowRight className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
