"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Plus, PlusCircle, ChevronDown } from "lucide-react";

import type { WorkSpace } from "@/types";
import { useLogoutMutation } from "@/hooks/use-auth";
import { logout } from "@/lib/redux/features/authSlice";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { useGetWorkspaces } from "@/hooks/use-workspace";
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

  const handleLogout = () => {
    logoutAPI(undefined, {
      onSettled: () => {
        dispatch(logout());
        router.replace("/auth/sign-in");
      },
    });
  };

  return (
    <div className="bg-background sticky top-0 z-40 border-b">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
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
          <Button variant="ghost" size="icon">
            <Bell />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {/* <button className="rounded-full border p-1 w-8 h-8"> */}
              <Avatar className="h-8 w-8 cursor-pointer">
                <AvatarImage src={user?.profileImage} alt={user?.name} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {user?.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {/* </button> */}
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
