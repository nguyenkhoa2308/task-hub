"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Plus,
  PlusCircle,
  ChevronDown,
  CheckCheck,
  MessageSquare,
  UserPlus,
  Clock,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

import type { WorkSpace } from "@/types";
import { useLogoutMutation } from "@/hooks/use-auth";
import { logout } from "@/lib/redux/features/authSlice";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { useGetWorkspaces } from "@/hooks/use-workspace";
import {
  useGetNotifications,
  useGetUnreadNotificationCount,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useSSENotifications,
} from "@/hooks/use-notification";
import { cn } from "@/lib/utils";

import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import WorksapceAvatar from "../workspace/workspace-avatar";

interface DashboardHeaderProps {
  onWorkspaceSelected: (workspace: WorkSpace) => void;
  selectedWorkspace: WorkSpace | null;
  onCreateWorkspace: () => void;
}

export default function DashboardHeader({
  onWorkspaceSelected,
  selectedWorkspace,
  onCreateWorkspace,
}: DashboardHeaderProps) {
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const { mutate: logoutAPI } = useLogoutMutation();

  const { data: workspaces = [] } = useGetWorkspaces();

  // Notifications API & SSE Stream
  useSSENotifications();
  const { data: notifications = [], isLoading: isLoadingNotis } = useGetNotifications();
  const { data: unreadData } = useGetUnreadNotificationCount();
  const { mutate: markAsRead } = useMarkNotificationAsRead();
  const { mutate: markAllAsRead } = useMarkAllNotificationsAsRead();

  const unreadCount = unreadData?.unreadCount || 0;

  const handleLogout = () => {
    logoutAPI(undefined, {
      onSettled: () => {
        dispatch(logout());
        router.replace("/auth/sign-in");
      },
    });
  };

  const handleNotificationClick = (item: any) => {
    if (!item.isRead) {
      markAsRead(item._id);
    }
    if (item.link) {
      router.push(item.link);
    }
  };

  return (
    <div className="bg-background sticky top-0 z-40 border-b">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
        {/* Workspace Selector Dropdown */}
        <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="inline-flex items-center gap-2.5 px-3 py-1.5 h-9 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium transition-all shadow-xs select-none cursor-pointer"
            >
              {selectedWorkspace ? (
                <>
                  {selectedWorkspace.color && (
                    <WorksapceAvatar
                      color={selectedWorkspace.color}
                      name={selectedWorkspace.name}
                    />
                  )}
                  <span className="text-sm font-semibold max-w-[150px] truncate">{selectedWorkspace.name}</span>
                </>
              ) : (
                <span className="text-sm font-medium text-slate-500">Chọn Workspace</span>
              )}
              <ChevronDown className={cn("h-4 w-4 text-slate-400 shrink-0 ml-1 transition-transform duration-200", isDropdownOpen ? "rotate-0" : "rotate-180")} />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start" className="w-[240px] p-1.5 rounded-xl">
            <DropdownMenuLabel className="px-2.5 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Workspace của bạn
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="-mx-1.5 my-1.5" />

            <DropdownMenuGroup className="space-y-1">
              <DropdownMenuItem
                onClick={() => onWorkspaceSelected({ _id: "all", name: "Tất cả Workspace", color: "#3b82f6" } as any)}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-colors focus:bg-slate-100"
              >
                <span className="text-sm font-semibold text-blue-600">🌐 Tất cả Workspace</span>
              </DropdownMenuItem>
              {workspaces.map((ws) => (
                <DropdownMenuItem
                  key={ws._id}
                  onClick={() => onWorkspaceSelected(ws)}
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-colors focus:bg-slate-100"
                >
                  {ws.color && (
                    <WorksapceAvatar color={ws.color} name={ws.name} />
                  )}
                  <span className="text-sm font-medium text-slate-700 truncate">{ws.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="-mx-1.5 my-1.5" />

            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={onCreateWorkspace}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer text-blue-600 focus:text-blue-600 focus:bg-blue-50/50"
              >
                <PlusCircle className="w-4 h-4" />
                <span className="text-sm font-semibold">Tạo Workspace mới</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-2">
          {/* Notification Bell Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative cursor-pointer rounded-full hover:bg-slate-100">
                <Bell className="size-5 text-slate-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-2xs animate-pulse">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-80 sm:w-96 p-0 rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
              <div className="p-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-800 text-sm">Thông báo</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-700 rounded-full">
                      {unreadCount} chưa đọc
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllAsRead()}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <CheckCheck className="size-3.5" />
                    <span>Đọc tất cả</span>
                  </button>
                )}
              </div>

              {/* Notification List */}
              <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
                {isLoadingNotis ? (
                  <div className="py-8 text-center text-xs text-slate-400">Đang tải thông báo...</div>
                ) : notifications.length === 0 ? (
                  <div className="py-10 text-center space-y-1">
                    <Bell className="size-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-semibold text-slate-500">Chưa có thông báo nào</p>
                    <p className="text-[11px] text-slate-400">Các thông báo mới sẽ xuất hiện tại đây</p>
                  </div>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item._id}
                      onClick={() => handleNotificationClick(item)}
                      className={`p-3.5 flex gap-3 hover:bg-slate-50 transition-colors cursor-pointer relative ${
                        !item.isRead ? "bg-blue-50/40" : "bg-white"
                      }`}
                    >
                      <Avatar className="size-9 shrink-0 ring-2 ring-slate-100">
                        <AvatarImage src={item.sender?.profileImage} alt={item.sender?.name} />
                        <AvatarFallback className="text-xs font-bold bg-slate-200 text-slate-700">
                          {item.sender?.name?.charAt(0)?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-extrabold text-slate-800 line-clamp-1">{item.title}</span>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: vi })}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 leading-snug">
                          <span className="font-semibold text-slate-800">{item.sender?.name} </span>
                          {item.message}
                        </p>
                      </div>

                      {!item.isRead && (
                        <div className="size-2 rounded-full bg-blue-600 shrink-0 self-center" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="h-8 w-8 cursor-pointer">
                <AvatarImage src={user?.profileImage} alt={user?.name} />
                <AvatarFallback className="text-sm">
                  {user?.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Tài khoản của tôi</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/user/profile`} className="w-full">
                  Hồ sơ
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="font-bold cursor-pointer text-red-500 hover:!bg-red-500/20 hover:!text-red-700">
                Đăng xuất
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
