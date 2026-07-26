"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Plus, PlusCircle } from "lucide-react";

import type { WorkSpace } from "@/types";
import { useLogoutMutation } from "@/hooks/use-auth";
import { logout } from "@/lib/redux/features/authSlice";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";

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

  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const { mutate: logoutAPI } = useLogoutMutation();

  const workspaces = [];

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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={"outline"}
              className="inline-flex items-center gap-2 whitespace-nowrap"
            >
              {selectedWorkspace ? (
                <>
                  {selectedWorkspace.color && (
                    <WorksapceAvatar
                      color={selectedWorkspace.color}
                      name={selectedWorkspace.name}
                    />
                  )}
                  <span className="font-medium">{selectedWorkspace.name}</span>
                </>
              ) : (
                <span className="font-medium">Select workspace</span>
              )}
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start" className="w-auto">
            <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              {workspaces.map((ws) => (
                <DropdownMenuItem
                  key={ws._id}
                  onClick={() => onWorkspaceSelected(ws)}
                >
                  {ws.color && (
                    <WorksapceAvatar color={ws.color} name={ws.name} />
                  )}
                  <span className="ml-2">{ws.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>

            <DropdownMenuGroup>
              <DropdownMenuItem onClick={onCreateWorkspace}>
                <PlusCircle className="w-4 h-4 mr-2" />
                <span>Create Workspace</span>
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
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/user/profile`} className="w-full">
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                Log Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
