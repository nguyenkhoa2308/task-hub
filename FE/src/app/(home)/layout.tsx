"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

import type { WorkSpace } from "@/types";
import { useAppSelector } from "@/lib/redux/hooks";
import { useGetWorkspaces } from "@/hooks/use-workspace";

import { Loading } from "@/components/ui/loading";
import DashboardHeader from "@/components/dashboard/dashboard-header";
import DashboardSidebar from "@/components/dashboard/dashboard-sidebar";
import CreateWorkspace from "@/components/workspace/create-workspace";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: workspaces = [] } = useGetWorkspaces();

  const { isLoading, isAuthenticated } = useAppSelector((state) => state.auth);
  const [isCreateWorkSpace, setIsCreateWorkSpace] = useState(false);
  const [currentWorkSpace, setCurrentWorkSpace] = useState<WorkSpace | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/auth/sign-in");
    }
  }, [isLoading, isAuthenticated, router]);

  // Sync currentWorkSpace với pathname và query searchParams
  useEffect(() => {
    if (pathname === "/dashboard") {
      const wsId = searchParams.get("workspaceId");
      if (wsId && wsId !== "all") {
        const found = workspaces.find((w: any) => w._id === wsId);
        if (found) setCurrentWorkSpace(found);
      } else {
        setCurrentWorkSpace({ _id: "all", name: "Tất cả Workspace", color: "#3b82f6" } as any);
      }
    } else if (pathname.startsWith("/workspaces/")) {
      const parts = pathname.split("/");
      const wsId = parts[2];
      if (wsId) {
        const found = workspaces.find((w: any) => w._id === wsId);
        if (found) setCurrentWorkSpace(found);
      }
    }
  }, [pathname, searchParams, workspaces]);

  if (isLoading || !isAuthenticated) {
    return <Loading text="Đang tải..." />;
  }

  const handleWorkspaceSelected = (workspace: WorkSpace) => {
    setCurrentWorkSpace(workspace);
    if (pathname === "/dashboard") {
      if (!workspace._id || workspace._id === "all") {
        router.push("/dashboard");
      } else {
        router.push(`/dashboard?workspaceId=${workspace._id}`);
      }
    } else {
      if (workspace._id && workspace._id !== "all") {
        router.push(`/workspaces/${workspace._id}`);
      } else {
        router.push("/dashboard");
      }
    }
  };

  return (
    <div className="flex h-screen w-full">
      {/* SidebarComponent */}
      <DashboardSidebar currentWorkspace={currentWorkSpace} />

      <div className="flex flex-1 flex-col h-full">
        {/* Header */}
        <DashboardHeader
          onWorkspaceSelected={handleWorkspaceSelected}
          selectedWorkspace={currentWorkSpace}
          onCreateWorkspace={() => setIsCreateWorkSpace(true)}
        />

        <main className="flex-1 overflow-y-auto h-full w-full">
          <div className="px-2 sm:px-6 lg:px-8 py-0 md:py-8 w-full h-full">
            {children}
          </div>
        </main>
      </div>

      {/* Create Workspace Component */}
      <CreateWorkspace
        isCreateWorkSpace={isCreateWorkSpace}
        setIsCreateWorkSpace={setIsCreateWorkSpace}
      />
    </div>
  );
}

