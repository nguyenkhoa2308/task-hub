"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  PlusCircle,
  ChevronDown,
  CheckCheck,
  LogOut,
  UserRound,
  Search,
  FolderKanban,
  ListTodo,
  BriefcaseBusiness,
  Loader2,
  Menu,
  X,
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
  type NotificationItem,
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
import { useGlobalSearch } from "@/hooks/use-global-search";

interface DashboardHeaderProps {
  onMenuClick: () => void;
  onWorkspaceSelected: (workspace: WorkSpace) => void;
  selectedWorkspace: WorkSpace | null;
  onCreateWorkspace: () => void;
}

export default function DashboardHeader({
  onMenuClick,
  onWorkspaceSelected,
  selectedWorkspace,
  onCreateWorkspace,
}: DashboardHeaderProps) {
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDesktopNotificationOpen, setIsDesktopNotificationOpen] = useState(false);
  const [isDesktopProfileOpen, setIsDesktopProfileOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { data: searchResults, isFetching: isSearching } = useGlobalSearch(debouncedSearch);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchText.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [searchText]);

  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, []);

  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const { mutate: logoutAPI } = useLogoutMutation();

  const { data: workspaces = [] } = useGetWorkspaces();

  // Notifications API & SSE Stream
  const isNotificationRealtimeConnected = useSSENotifications();
  const isNotificationPanelOpen = isNotificationOpen || isDesktopNotificationOpen;
  const {
    data: notificationPages,
    isLoading: isLoadingNotis,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetNotifications({
    enabled: isNotificationPanelOpen,
    realtimeConnected: isNotificationRealtimeConnected,
  });
  const notifications = Array.from(
    new Map(
      (Array.isArray(notificationPages?.pages)
        ? notificationPages.pages.flatMap((page) => Array.isArray(page?.data) ? page.data : [])
        : [])
        .map((notification) => [notification._id, notification]),
    ).values(),
  ) as NotificationItem[];
  const { data: unreadData } = useGetUnreadNotificationCount({
    realtimeConnected: isNotificationRealtimeConnected,
  });
  const { mutate: markAsRead } = useMarkNotificationAsRead();
  const { mutate: markAllAsRead } = useMarkAllNotificationsAsRead();

  const visibleUnreadCount = notifications.filter((notification) => !notification.isRead).length;
  const unreadCount = Math.max(unreadData?.unreadCount || 0, visibleUnreadCount);

  const handleLogout = () => {
    logoutAPI(undefined, {
      onSettled: () => {
        dispatch(logout());
        router.replace("/auth/sign-in");
      },
    });
  };

  const handleNotificationClick = (item: any) => {
    setIsNotificationOpen(false);
    setIsDesktopNotificationOpen(false);
    if (!item.isRead) {
      markAsRead(item._id);
    }
    if (item.link) {
      router.push(item.link);
    }
  };

  const openSearchResult = (link: string) => {
    setIsSearchOpen(false);
    setSearchText("");
    router.push(link);
  };

  return (
    <div className="bg-background sticky top-0 z-40 border-b">
      <div className="flex h-14 items-center justify-between gap-2 px-3 py-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 shrink-0 lg:hidden"
            onClick={onMenuClick}
            aria-label="Mở menu"
          >
            <Menu className="size-5" />
          </Button>
          {/* Workspace Selector Dropdown */}
          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="inline-flex h-9 min-w-0 max-w-[150px] items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-medium text-slate-700 shadow-xs transition-all hover:bg-slate-50 sm:max-w-[220px] sm:px-3 lg:max-w-[260px]"
              >
                {selectedWorkspace ? (
                  <>
                    {selectedWorkspace.color && (
                      <div className="shrink-0">
                        <WorksapceAvatar
                          color={selectedWorkspace.color}
                          name={selectedWorkspace.name}
                        />
                      </div>
                    )}
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">{selectedWorkspace.name}</span>
                  </>
                ) : (
                  <span className="text-sm font-medium text-slate-500">Chọn Workspace</span>
                )}
                <ChevronDown className={cn("size-4 shrink-0 text-slate-400 transition-transform duration-200", isDropdownOpen ? "rotate-0" : "rotate-180")} />
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
                      <div className="flex">
                        <WorksapceAvatar color={ws.color} name={ws.name} />
                      </div>
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
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="relative hidden md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input ref={searchInputRef} value={searchText} onChange={(event) => { setSearchText(event.target.value); setIsSearchOpen(true); }} onFocus={() => setIsSearchOpen(true)} onBlur={() => window.setTimeout(() => setIsSearchOpen(false), 150)} placeholder="Tìm workspace, dự án, công việc" className="h-9 w-72 rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-12 text-xs outline-none transition-all focus:w-96 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100" />
            <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] font-semibold text-slate-400">Ctrl K</kbd>
            {isSearchOpen && searchText.trim().length >= 2 && (
              <div className="absolute right-0 top-11 z-50 w-[420px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                {isSearching ? <div className="flex items-center justify-center gap-2 py-10 text-xs text-slate-500"><Loader2 className="size-4 animate-spin" />Đang tìm...</div> : (() => {
                  const groups = [
                    { key: "workspaces", label: "Workspace", icon: BriefcaseBusiness, items: searchResults?.workspaces || [], link: (item: any) => `/workspaces/${item._id}`, title: (item: any) => item.name },
                    { key: "projects", label: "Dự án", icon: FolderKanban, items: searchResults?.projects || [], link: (item: any) => `/workspaces/${item.workspace?._id || item.workspace}/projects/${item._id}`, title: (item: any) => item.title },
                    { key: "tasks", label: "Công việc", icon: ListTodo, items: searchResults?.tasks || [], link: (item: any) => `/workspaces/${item.project?.workspace?._id || item.project?.workspace}/projects/${item.project?._id}?taskId=${item._id}`, title: (item: any) => item.title },
                  ];
                  const total = groups.reduce((sum, group) => sum + group.items.length, 0);
                  if (total === 0) return <div className="py-10 text-center text-xs text-slate-500">Không tìm thấy kết quả phù hợp.</div>;
                  return <div className="max-h-[460px] overflow-y-auto p-2">{groups.filter((group) => group.items.length > 0).map((group) => <div key={group.key} className="mb-2 last:mb-0"><p className="px-2 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{group.label}</p>{group.items.map((item: any) => <button key={item._id} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => openSearchResult(group.link(item))} className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left hover:bg-slate-50"><span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><group.icon className="size-4" /></span><span className="min-w-0"><span className="block truncate text-sm font-bold text-slate-800">{group.title(item)}</span><span className="block truncate text-[11px] text-slate-500">{item.description || item.project?.title || item.workspace?.name || ""}</span></span></button>)}</div>)}</div>;
                })()}
              </div>
            )}
          </div>
          {(isNotificationOpen || isProfileOpen) && (
            <button
              type="button"
              aria-label="Đóng bảng điều khiển"
              className="fixed inset-0 z-[45] bg-slate-950/45 backdrop-blur-[1px] lg:hidden"
              onClick={() => {
                setIsNotificationOpen(false);
                setIsProfileOpen(false);
              }}
            />
          )}
          <div className="flex items-center gap-2 lg:hidden">
            <Button variant="ghost" size="icon" className="relative rounded-full" onClick={() => setIsNotificationOpen(true)} aria-label="Mở thông báo">
              <Bell className="size-5 text-slate-600" />
              {unreadCount > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-rose-500 px-1 text-[10px] font-bold text-white">{unreadCount > 99 ? "99+" : unreadCount}</span>}
            </Button>
            <button type="button" onClick={() => setIsProfileOpen(true)} aria-label="Mở tài khoản">
              <Avatar className="size-8 border border-slate-200">
                <AvatarImage src={user?.profileImage} alt={user?.name} />
                <AvatarFallback className="bg-slate-100 text-xs font-bold text-slate-700">{(user?.name || user?.email || "U").charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
            </button>
          </div>
          {/* Notification Bell Dropdown */}
          <div className="hidden lg:block">
            <DropdownMenu open={isDesktopNotificationOpen} onOpenChange={setIsDesktopNotificationOpen}>
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

              <DropdownMenuContent align="end" className="w-80 overflow-hidden rounded-2xl border border-slate-200 p-0 shadow-xl sm:w-96 max-md:!fixed max-md:!inset-y-0 max-md:!right-0 max-md:!left-auto max-md:!top-0 max-md:!z-[60] max-md:!flex max-md:!h-dvh max-md:!w-[86vw] max-md:!max-w-[340px] max-md:!translate-x-0 max-md:!translate-y-0 max-md:!flex-col max-md:!rounded-none max-md:!duration-300 max-md:data-[state=open]:slide-in-from-right-full max-md:data-[state=open]:zoom-in-100 max-md:data-[state=closed]:slide-out-to-right-full max-md:data-[state=closed]:zoom-out-100">
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 p-3.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="shrink-0 text-sm font-extrabold text-slate-800">Thông báo</span>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-700 rounded-full">
                        {unreadCount} chưa đọc
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllAsRead()}
                      className="flex shrink-0 cursor-pointer items-center gap-1 whitespace-nowrap text-xs font-semibold text-blue-600 transition-colors hover:text-blue-700"
                    >
                      <CheckCheck className="size-3.5" />
                      <span>Đọc tất cả</span>
                    </button>
                  )}
                  <button type="button" className="ml-1 rounded-md p-1 text-slate-500 hover:bg-slate-200 md:hidden" onClick={() => setIsNotificationOpen(false)} aria-label="Đóng thông báo">
                    <X className="size-5" />
                  </button>
                </div>

                {/* Notification List */}
                <div className="max-h-[380px] divide-y divide-slate-100 overflow-y-auto max-md:max-h-none max-md:flex-1">
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
                        className={`p-3.5 flex gap-3 hover:bg-slate-50 transition-colors cursor-pointer relative ${!item.isRead ? "bg-blue-50/40" : "bg-white"
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
                            {item.sender?.name && (
                              <span className="font-semibold text-slate-800">{item.sender.name} </span>
                            )}
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
                {hasNextPage && (
                  <div className="border-t border-slate-100 p-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isFetchingNextPage}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        fetchNextPage();
                      }}
                      className="w-full text-xs font-semibold text-blue-600"
                    >
                      {isFetchingNextPage ? "Đang tải..." : "Tải thêm thông báo"}
                    </Button>
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* User Profile Dropdown */}
          <div className="hidden lg:block">
            <DropdownMenu open={isDesktopProfileOpen} onOpenChange={setIsDesktopProfileOpen}>
              <DropdownMenuTrigger asChild>
                <button type="button" className="flex h-11 items-center gap-2 rounded-lg border border-transparent px-2 py-1.5 text-left transition-colors hover:border-slate-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30">
                  <Avatar className="size-8 border border-slate-200">
                    <AvatarImage src={user?.profileImage} alt={user?.name} />
                    <AvatarFallback className="bg-slate-100 text-xs font-bold text-slate-700">
                      {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden max-w-40 leading-tight lg:block">
                    <p className="truncate text-sm font-bold text-slate-800">{user?.name || "Tài khoản"}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">Tài khoản cá nhân</p>
                  </div>
                  <ChevronDown className="hidden size-3.5 text-slate-400 lg:block" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" sideOffset={8} className="w-72 rounded-xl border-slate-200 p-1.5 shadow-lg max-md:!fixed max-md:!inset-y-0 max-md:!right-0 max-md:!left-auto max-md:!top-0 max-md:!z-[60] max-md:!h-dvh max-md:!w-[86vw] max-md:!max-w-[340px] max-md:!translate-x-0 max-md:!translate-y-0 max-md:!rounded-none max-md:!p-4 max-md:!duration-300 max-md:data-[state=open]:slide-in-from-right-full max-md:data-[state=open]:zoom-in-100 max-md:data-[state=closed]:slide-out-to-right-full max-md:data-[state=closed]:zoom-out-100">
                <DropdownMenuLabel className="p-2.5 font-normal">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar className="size-10 border border-slate-200">
                      <AvatarImage src={user?.profileImage} alt={user?.name} />
                      <AvatarFallback className="bg-slate-100 text-sm font-bold text-slate-700">{(user?.name || user?.email || "U").charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{user?.name || "Tài khoản của tôi"}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">{user?.email}</p>
                    </div>
                    <button type="button" className="ml-auto rounded-md p-1 text-slate-500 hover:bg-slate-100 md:hidden" onClick={() => setIsProfileOpen(false)} aria-label="Đóng tài khoản">
                      <X className="size-5" />
                    </button>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem asChild className="rounded-lg p-2.5 cursor-pointer">
                  <Link href="/user/profile" onClick={() => setIsProfileOpen(false)} className="flex w-full items-center gap-3">
                    <span className="flex size-8 items-center justify-center rounded-md bg-slate-100 text-slate-600"><UserRound className="size-4" /></span>
                    <span className="min-w-0"><span className="block text-sm font-medium text-slate-800">Hồ sơ cá nhân</span><span className="block text-[11px] text-slate-400">Thông tin và ảnh đại diện</span></span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer rounded-lg p-2.5 text-rose-600 focus:bg-rose-50 focus:text-rose-700">
                  <span className="flex size-8 items-center justify-center rounded-md bg-rose-50"><LogOut className="size-4" /></span>
                  <span className="text-sm font-medium">Đăng xuất</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      <aside className={cn(
        "fixed inset-y-0 right-0 z-[60] flex w-[86vw] max-w-[340px] flex-col border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300 ease-out lg:hidden",
        isNotificationOpen ? "translate-x-0" : "translate-x-full",
      )}>
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 px-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-extrabold text-slate-800">Thông báo</span>
            {unreadCount > 0 && <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">{unreadCount} chưa đọc</span>}
          </div>
          <button type="button" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" onClick={() => setIsNotificationOpen(false)} aria-label="Đóng thông báo"><X className="size-5" /></button>
        </div>
        {unreadCount > 0 && <button type="button" onClick={() => markAllAsRead()} className="flex items-center justify-center gap-1.5 border-b border-slate-100 px-4 py-2.5 text-xs font-semibold text-blue-600"><CheckCheck className="size-3.5" />Đọc tất cả</button>}
        <div className="min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto">
          {isLoadingNotis ? <div className="py-10 text-center text-xs text-slate-400">Đang tải thông báo...</div> : notifications.length === 0 ? (
            <div className="py-12 text-center"><Bell className="mx-auto size-8 text-slate-300" /><p className="mt-2 text-xs font-semibold text-slate-500">Chưa có thông báo nào</p></div>
          ) : notifications.map((item) => (
            <button key={item._id} type="button" onClick={() => handleNotificationClick(item)} className={cn("flex w-full gap-3 p-3.5 text-left transition-colors hover:bg-slate-50", !item.isRead && "bg-blue-50/40")}>
              <Avatar className="size-9 shrink-0 ring-2 ring-slate-100"><AvatarImage src={item.sender?.profileImage} alt={item.sender?.name} /><AvatarFallback className="bg-slate-200 text-xs font-bold text-slate-700">{item.sender?.name?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback></Avatar>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2"><span className="truncate text-xs font-extrabold text-slate-800">{item.title}</span><span className="shrink-0 text-[10px] text-slate-400">{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: vi })}</span></span>
                <span className="mt-1 block text-xs leading-snug text-slate-600">{item.sender?.name && <strong className="font-semibold text-slate-800">{item.sender.name} </strong>}{item.message}</span>
              </span>
              {!item.isRead && <span className="size-2 shrink-0 self-center rounded-full bg-blue-600" />}
            </button>
          ))}
        </div>
        {hasNextPage && <div className="shrink-0 border-t border-slate-100 p-3"><Button variant="ghost" size="sm" disabled={isFetchingNextPage} onClick={() => fetchNextPage()} className="w-full text-xs font-semibold text-blue-600">{isFetchingNextPage ? "Đang tải..." : "Tải thêm thông báo"}</Button></div>}
      </aside>

      <aside className={cn(
        "fixed inset-y-0 right-0 z-[60] flex w-[86vw] max-w-[340px] flex-col border-l border-slate-200 bg-white p-4 shadow-2xl transition-transform duration-300 ease-out lg:hidden",
        isProfileOpen ? "translate-x-0" : "translate-x-full",
      )}>
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <Avatar className="size-11 border border-slate-200"><AvatarImage src={user?.profileImage} alt={user?.name} /><AvatarFallback className="bg-slate-100 font-bold">{(user?.name || user?.email || "U").charAt(0).toUpperCase()}</AvatarFallback></Avatar>
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-900">{user?.name || "Tài khoản của tôi"}</p><p className="truncate text-xs text-slate-500">{user?.email}</p></div>
          <button type="button" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" onClick={() => setIsProfileOpen(false)} aria-label="Đóng tài khoản"><X className="size-5" /></button>
        </div>
        <div className="mt-4 space-y-2">
          <Link href="/user/profile" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 rounded-xl p-3 hover:bg-slate-50"><span className="flex size-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600"><UserRound className="size-4" /></span><span><span className="block text-sm font-semibold text-slate-800">Hồ sơ cá nhân</span><span className="block text-xs text-slate-400">Thông tin và ảnh đại diện</span></span></Link>
          <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl p-3 text-rose-600 hover:bg-rose-50"><span className="flex size-9 items-center justify-center rounded-lg bg-rose-50"><LogOut className="size-4" /></span><span className="text-sm font-semibold">Đăng xuất</span></button>
        </div>
      </aside>
    </div>
  );
}
