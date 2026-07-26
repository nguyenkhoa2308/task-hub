"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import type { WorkSpace } from "@/types";
import { useAppSelector } from "@/lib/redux/hooks";

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
  const { isLoading, isAuthenticated } = useAppSelector((state) => state.auth);
  const [isCreateWorkSpace, setIsCreateWorkSpace] = useState(false);
  const [currentWorkSpace, setCurrentWorkSpace] = useState<WorkSpace | null>(
    null,
  );

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/auth/sign-in");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return <Loading text="Đang tải..." />;
  }

  const handleWorkspaceSelected = (workspace: WorkSpace) => {
    setCurrentWorkSpace(workspace);
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
          <div className="mx-auto container px-2 sm:px-6 lg:px-8 py-0 md:py-8 w-full h-full">
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
