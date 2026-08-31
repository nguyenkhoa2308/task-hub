import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  Archive,
  ChevronsLeft,
  ChevronsRight,
  LayoutDashboard,
  ListCheck,
  LogOut,
  Users,
  Wrench,
  Trash2,
  X,
} from "lucide-react";

import type { WorkSpace } from "@/types";

import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { logout } from "@/lib/redux/features/authSlice";
import { useLogoutMutation } from "@/hooks/use-auth";

import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import SidebarNav from "./sidebar-nav";

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

  const [isCollapsed, setIsCollapsed] = useState(false);
  //   const [isMobile, setIsMobile] = useState(false);

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
        isCollapsed ? "lg:w-[80px]" : "lg:w-[200px]",
      )}
    >
      <div className="flex h-14 items-center border-b px-4 mb-4">
        <Link href={"/dashboard"} className="flex items-center">
          <div className={cn("items-center gap-2", isCollapsed ? "flex lg:hidden" : "flex")}>
              <Wrench className="size-6 text-blue-600" />
              <span className="text-lg font-bold">
                TaskHub
              </span>
          </div>

          {isCollapsed && <Wrench className="hidden size-6 text-blue-600 lg:block" />}
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
      </ScrollArea>

      <div className="flex items-center px-3 py-2 border-t-2 border-slate-100">
        <Button
          variant={"ghost"}
          //   size={isCollapsed ? "icon" : "default"}
          onClick={handleLogout}
          className="py-5 text-red-500 hover:text-red-700 hover:bg-red-800/20 w-full justify-start font-bold"
        >
          <LogOut className={cn("size-5 ml-1", isCollapsed ? "" : "")} />
          <span className={cn(isCollapsed && "lg:sr-only")}>Đăng xuất</span>
        </Button>
      </div>
    </div>
  </>
  );
}
