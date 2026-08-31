import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

import {
  Archive,
  ChevronsLeft,
  ChevronsRight,
  LayoutDashboard,
  ListCheck,
  LogOut,
  Minus,
  Plus,
  UserRound,
  Users,
  Trash2,
  X,
} from "lucide-react";

import type { Project, WorkSpace } from "@/types";

import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { logout } from "@/lib/redux/features/authSlice";
import { useLogoutMutation } from "@/hooks/use-auth";
import { useGetProjectsByWorkspace } from "@/hooks/use-project";

import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import SidebarNav from "./sidebar-nav";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Skeleton } from "../ui/skeleton";

export default function DashboardSidebar({
  currentWorkspace,
  isMobileOpen = false,
  onMobileClose,
}: {
  currentWorkspace: WorkSpace | null;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}) {
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const { mutate: logoutAPI } = useLogoutMutation();
  const router = useRouter();
  const pathname = usePathname();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [areProjectsOpen, setAreProjectsOpen] = useState(true);

  const workspaceId =
    currentWorkspace?._id && currentWorkspace._id !== "all"
      ? currentWorkspace._id
      : "";
  const { data: projectsResponse, isLoading: areProjectsLoading } =
    useGetProjectsByWorkspace(workspaceId);
  const projects = useMemo<Project[]>(() => {
    if (Array.isArray(projectsResponse)) return projectsResponse;
    const response = projectsResponse as { data?: Project[] } | undefined;
    if (Array.isArray(response?.data)) {
      return response.data;
    }
    return [];
  }, [projectsResponse]);

  const ownerId =
    typeof currentWorkspace?.owner === "string"
      ? currentWorkspace.owner
      : currentWorkspace?.owner?._id;
  const membership = currentWorkspace?.members?.find(
    (member) => member.user?._id === user?._id,
  );
  const workspaceRole =
    ownerId === user?._id ? "owner" : membership?.role;
  const roleLabel: Record<string, string> = {
    owner: "Chủ sở hữu",
    admin: "Quản trị viên",
    member: "Thành viên",
    viewer: "Người xem",
  };

  const navItems = [
    {
      title: "Tổng quan",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Workspace",
      href: "/workspaces",
      icon: Users,
    },
    {
      title: "Công việc",
      href: "/my-tasks",
      icon: ListCheck,
    },
    {
      title: "Thành viên",
      href: "/members",
      icon: Users,
    },
    {
      title: "Lưu trữ",
      href: "/archived",
      icon: Archive,
    },
    {
      title: "Thùng rác",
      href: "/trash",
      icon: Trash2,
    },
  ];

  const handleLogout = () => {
    logoutAPI(undefined, {
      onSettled: () => {
        dispatch(logout());
        router.replace("/auth/sign-in");
      },
    });
  };

  return (<>
    <button
      type="button"
      aria-label="Đóng menu"
      onClick={onMobileClose}
      className={cn(
        "fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-[1px] transition-opacity duration-300 lg:hidden",
        isMobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    />
    <div
      className={cn(
        "fixed inset-y-0 left-0 z-[60] flex w-[86vw] max-w-[340px] flex-col border-r bg-sidebar shadow-2xl transition-transform duration-300 ease-out lg:static lg:z-auto lg:max-w-none lg:translate-x-0 lg:shadow-none",
        isMobileOpen ? "translate-x-0" : "-translate-x-full",
        isCollapsed ? "lg:w-[80px]" : "lg:w-[248px]",
      )}
    >
      <div className="flex h-14 items-center border-b px-4 mb-4">
        <Link href={"/dashboard"} className="flex items-center">
          <div className={cn("items-center gap-2", isCollapsed ? "flex lg:hidden" : "flex")}>
              <Image src="/logo.png" alt="" width={24} height={24} className="size-6 rounded-lg object-contain" />
              <span className="text-lg font-bold">
                TaskHub
              </span>
          </div>

          {isCollapsed && <Image src="/logo.png" alt="Task Hub" width={24} height={24} className="hidden size-6 rounded-lg object-contain lg:block" />}
        </Link>
        <Button variant="ghost" size="icon" className="ml-auto lg:hidden" onClick={onMobileClose} aria-label="Đóng menu">
          <X className="size-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto hidden lg:flex items-center justify-center"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <ChevronsRight className="size-4" />
          ) : (
            <ChevronsLeft className="size-4" />
          )}
        </Button>
      </div>

      <ScrollArea className="flex-1 px-3 py-2">
        <SidebarNav
          items={navItems}
          isCollapsed={isCollapsed}
          className={cn(isCollapsed && "")}
          currentWorkspace={currentWorkspace}
          mobileExpanded
          onNavigate={onMobileClose}
        />

        <div className={cn("mt-6 border-t border-slate-200 pt-4", isCollapsed && "lg:hidden")}>
          <button
            type="button"
            onClick={() => setAreProjectsOpen((open) => !open)}
            className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-[11px] font-extrabold tracking-[0.08em] text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
            aria-expanded={areProjectsOpen}
            aria-controls="sidebar-workspace-projects"
          >
            <span>DỰ ÁN</span>
            {areProjectsOpen ? (
              <Minus className="size-4" aria-hidden="true" />
            ) : (
              <Plus className="size-4" aria-hidden="true" />
            )}
          </button>

          {areProjectsOpen && (
            <div id="sidebar-workspace-projects" className="mt-2 space-y-1">
              {!workspaceId ? (
                <p className="px-2 py-2 text-xs leading-5 text-slate-400">
                  Chọn một workspace để xem dự án.
                </p>
              ) : areProjectsLoading ? (
                <div className="space-y-2 px-2 py-1">
                  {[0, 1, 2].map((item) => (
                    <Skeleton key={item} className="h-8 w-full rounded-lg" />
                  ))}
                </div>
              ) : projects.length === 0 ? (
                <p className="px-2 py-2 text-xs leading-5 text-slate-400">
                  Workspace này chưa có dự án.
                </p>
              ) : (
                projects.map((project) => {
                  const href = `/workspaces/${workspaceId}/projects/${project._id}`;
                  const isActive = pathname === href;
                  return (
                    <Link
                      key={project._id}
                      href={href}
                      onClick={onMobileClose}
                      className={cn(
                        "group flex min-h-9 items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950",
                        isActive && "bg-blue-50 text-blue-700",
                      )}
                    >
                      <span
                        className="size-2 shrink-0 rounded-sm bg-blue-500"
                        style={currentWorkspace?.color ? { backgroundColor: currentWorkspace.color } : undefined}
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1 truncate">
                        {project.title || project.name || "Dự án chưa đặt tên"}
                      </span>
                    </Link>
                  );
                })
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t border-slate-200 p-3">
        <Link
          href="/user/profile"
          onClick={onMobileClose}
          className={cn(
            "flex min-w-0 items-center gap-3 rounded-xl p-2 transition-colors hover:bg-slate-100",
            isCollapsed && "lg:justify-center lg:px-0",
          )}
        >
          <Avatar className="size-9 shrink-0 border border-slate-200">
            <AvatarImage src={user?.profileImage} alt={user?.name} />
            <AvatarFallback className="bg-slate-100 text-xs font-bold text-slate-700">
              {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className={cn("min-w-0 flex-1", isCollapsed && "lg:sr-only")}>
            <span className="block truncate text-sm font-extrabold text-slate-850">
              {user?.name || "Tài khoản"}
            </span>
            <span className="mt-0.5 block truncate text-xs text-slate-500">
              {workspaceId
                ? (workspaceRole && roleLabel[workspaceRole]) || "Thành viên"
                : "Tài khoản cá nhân"}
            </span>
          </span>
          <UserRound className={cn("size-4 shrink-0 text-slate-400", isCollapsed && "lg:hidden")} aria-hidden="true" />
        </Link>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className={cn(
            "mt-1 h-9 w-full justify-start gap-2.5 rounded-lg px-2.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600",
            isCollapsed && "lg:justify-center lg:px-0",
          )}
        >
          <LogOut className="size-4" />
          <span className={cn(isCollapsed && "lg:sr-only")}>Đăng xuất</span>
        </Button>
      </div>
    </div>
  </>
  );
}
