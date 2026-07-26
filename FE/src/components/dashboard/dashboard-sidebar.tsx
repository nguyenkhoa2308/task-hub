import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  CheckCircle2,
  ChevronsLeft,
  ChevronsRight,
  LayoutDashboard,
  ListCheck,
  LogOut,
  Settings,
  Users,
  Wrench,
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
}: {
  currentWorkspace: WorkSpace | null;
}) {
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const { mutate: logoutAPI } = useLogoutMutation();
  const router = useRouter();

  const [isCollapsed, setIsCollapsed] = useState(false);
  //   const [isMobile, setIsMobile] = useState(false);

  const navItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Workspaces",
      href: "/workspaces",
      icon: Users,
    },
    {
      title: "My Tasks",
      href: "/my-tasks",
      icon: ListCheck,
    },
    {
      title: "Members",
      href: "/members",
      icon: Users,
    },
    {
      title: "Archived",
      href: "/archived",
      icon: CheckCircle2,
    },
    {
      title: "Settings",
      href: "/settings",
      icon: Settings,
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

  return (
    <div
      className={cn(
        "flex flex-col border-r bg-sidebar transition-all duration-300",
        isCollapsed ? "w-16 md:w-[80px]" : "w-16 md:w-[200px]",
        // isMobile ? "absolute inset-y-0 left-0 z-50 h-full" : "",
      )}
    >
      <div className="flex h-14 items-center border-b px-4 mb-4">
        <Link href={"/dashboard"} className="flex items-center">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <Wrench className="size-6 text-blue-600" />
              <span className="font-medium text-lg hidden md:block">
                TaskHub
              </span>
            </div>
          )}

          {isCollapsed && <Wrench className="size-6 text-blue-600" />}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto hidden md:flex items-center justify-center"
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
        />
      </ScrollArea>

      <div className="flex items-center px-3 py-2 border-t-2 border-slate-100">
        <Button
          variant={"ghost"}
          //   size={isCollapsed ? "icon" : "default"}
          onClick={handleLogout}
          className="py-5 text-red-500 hover:text-red-700 hover:bg-red-800/20 w-full justify-start"
        >
          <LogOut className={cn("size-5 ml-1", isCollapsed ? "" : "")} />
          {isCollapsed ? (
            <span className="sr-only">Đăng xuất</span>
          ) : (
            <span className="">Đăng xuất</span>
          )}
        </Button>
      </div>
    </div>
  );
}
