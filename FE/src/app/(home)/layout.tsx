"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

import type { WorkSpace } from "@/types";
import { useAppSelector } from "@/lib/redux/hooks";
import { useGetWorkspaces } from "@/hooks/use-workspace";

import { Loading } from "@/components/ui/loading";
import DashboardHeader from "@/components/dashboard/dashboard-header";
import DashboardSidebar from "@/components/dashboard/dashboard-sidebar";
import CreateWorkspace from "@/components/workspace/create-workspace";

function DashboardLayoutContent({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: workspaces = [], isSuccess: hasLoadedWorkspaces } = useGetWorkspaces();

  const { isLoading, isAuthenticated } = useAppSelector((state) => state.auth);
  const [isCreateWorkSpace, setIsCreateWorkSpace] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
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
    } else if (pathname === "/members") {
      const wsId = searchParams.get("workspaceId");
      const found = wsId ? workspaces.find((w: any) => w._id === wsId) : undefined;
      setCurrentWorkSpace(found || null);
    } else if (pathname.startsWith("/workspaces/")) {
      const parts = pathname.split("/");
      const wsId = parts[2];
      if (wsId) {
        const found = workspaces.find((w: any) => w._id === wsId);
        if (found) setCurrentWorkSpace(found);
      }
    }
  }, [pathname, searchParams, workspaces]);

  useEffect(() => {
    if (!hasLoadedWorkspaces || !currentWorkSpace?._id || currentWorkSpace._id === "all") return;
    const stillExists = workspaces.some((workspace: any) => workspace._id === currentWorkSpace._id);
    if (stillExists) return;

    const removedWorkspaceId = currentWorkSpace._id;
    setCurrentWorkSpace(null);
    if (pathname === "/dashboard" && searchParams.get("workspaceId") === removedWorkspaceId) {
      router.replace("/dashboard");
    } else if (pathname === "/members" && searchParams.get("workspaceId") === removedWorkspaceId) {
      router.replace("/members");
    } else if (pathname.startsWith(`/workspaces/${removedWorkspaceId}`)) {
      router.replace("/workspaces");
    }
  }, [currentWorkSpace, hasLoadedWorkspaces, pathname, router, searchParams, workspaces]);

  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [pathname, searchParams]);

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
    } else if (pathname === "/members") {
      if (workspace._id && workspace._id !== "all") {
        router.push(`/members?workspaceId=${workspace._id}`);
      } else {
        router.push("/members");
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
    <div className="flex h-screen w-full overflow-hidden">
      {/* SidebarComponent */}
      <DashboardSidebar
        currentWorkspace={currentWorkSpace}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />

      <div className="flex flex-1 flex-col h-full min-w-0">
        {/* Header */}
        <DashboardHeader
          onMenuClick={() => setIsMobileSidebarOpen(true)}
          onWorkspaceSelected={handleWorkspaceSelected}
          selectedWorkspace={currentWorkSpace}
          onCreateWorkspace={() => setIsCreateWorkSpace(true)}
        />

        <main className="scrollbar-stable flex-1 overflow-y-auto overflow-x-hidden h-full w-full">
          <div className="h-full min-w-0 px-2 pt-4 pb-0 sm:px-6 md:py-8 lg:px-8">
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

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Suspense fallback={<Loading text="Đang tải..." />}>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </Suspense>
  );
}

