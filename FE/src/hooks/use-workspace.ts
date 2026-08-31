import { workspaceSchema } from "@/lib/schema";
import type { z } from "zod";
import { deleteData, getData, patchData, postData } from "@/lib/axios";
import type { Project, WorkSpace } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type WorkspaceForm = z.infer<typeof workspaceSchema>;

export interface DashboardTask {
  _id: string;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  startDate?: string;
  dueDate?: string;
  assignees?: Array<{ name?: string; profileImage?: string }>;
  subtasks?: Array<{ done?: boolean; completed?: boolean }>;
  attachments?: unknown[];
  comments?: unknown[];
  project?: {
    title?: string;
    name?: string;
    workspace?: { name?: string };
  };
}

export interface DashboardStats {
  totalWorkspaces: number;
  totalProjects: number;
  inProgressProjects?: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  todoTasks: number;
  reviewTasks: number;
  overdueTasks: number;
  completionRate: number;
  dailyTaskTrend: Array<{
    date: string;
    created: number;
    completed: number;
    inProgress: number;
  }>;
  projectStatusBreakdown: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  taskPriorityDistribution: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  workspaceProductivity: Array<{
    name: string;
    completed: number;
    total: number;
  }>;
  recentProjects: Array<{
    _id: string;
    title: string;
    description?: string;
    status: string;
    workspaceId: string;
    progress: number;
    totalTasks: number;
    completedTasks: number;
    members?: any[];
    updatedAt?: string;
  }>;
  upcomingTasks7Days: DashboardTask[];
  overdueTasksList?: DashboardTask[];
}

export const useCreateWorkspace = () => {
    return useMutation({
        mutationFn: async (data: WorkspaceForm) => postData("/workspaces", data),
    });
};

export const useUpdateWorkspace = () => {
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<WorkspaceForm> }) =>
            patchData(`/workspaces/${id}`, data),
    });
};

export const useDeleteWorkspace = () => {
    return useMutation({
        mutationFn: async (id: string) => deleteData(`/workspaces/${id}`),
    });
};

export const useGetWorkspaces = () => {
    return useQuery({
        queryKey: ["workspaces"],
        queryFn: async () => getData<WorkSpace[]>("/workspaces"),
    });
};

export const useGetWorkspaceById = (workspaceId: string) => {
    const hasSelectedWorkspace = Boolean(workspaceId && workspaceId !== "all");
    return useQuery({
        queryKey: ["workspace", workspaceId],
        queryFn: async () =>
            getData<WorkSpace>(
                `/workspaces/${workspaceId}`
            ),
        enabled: hasSelectedWorkspace,
    });
};

export const useGetWorkspaceDashboard = (workspaceId?: string) => {
    return useQuery({
        queryKey: ["workspace-dashboard", workspaceId],
        queryFn: async () =>
            getData<DashboardStats>(
                `/workspaces/dashboard/stats${workspaceId ? `?workspaceId=${workspaceId}` : ""}`
            ),
    });
};

export const useInviteMember = (workspaceId: string) => {
    return useMutation({
        mutationFn: async (data: { email: string; role: string }) =>
            postData(`/members/invite/workspace/${workspaceId}`, data),
    });
};

export const useJoinWorkspaceByLink = () => {
    return useMutation({
        mutationFn: async (workspaceId: string) =>
            postData<{ message: string; status?: string; workspace?: any }>(`/workspaces/${workspaceId}/join`, {}),
    });
};

export const useGetPendingMembers = (workspaceId: string) => {
    const hasSelectedWorkspace = Boolean(workspaceId && workspaceId !== "all");
    return useQuery({
        queryKey: ["pending-members", workspaceId],
        queryFn: async () =>
            getData<any[]>(`/members/pending/workspace/${workspaceId}`),
        enabled: hasSelectedWorkspace,
    });
};

export const useApproveMember = (workspaceId: string) => {
    return useMutation({
        mutationFn: async (userId: string) =>
            postData(`/members/approve/workspace/${workspaceId}`, { userId }),
    });
};

export const useRejectMember = (workspaceId: string) => {
    return useMutation({
        mutationFn: async (userId: string) =>
            postData(`/members/reject/workspace/${workspaceId}`, { userId }),
    });
};

export const useGetDeletedWorkspaces = (params?: { page?: number; limit?: number }) => {
    return useQuery({
        queryKey: ["trash-workspaces", params],
        queryFn: async () => getData<{
            data: any[];
            pagination: { page: number; limit: number; total: number; totalPages: number };
        }>("/workspaces/trash/all", { params }),
        placeholderData: (previous) => previous,
    });
};

export const useRestoreWorkspace = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => patchData(`/workspaces/${id}/restore`, {}),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["trash-workspaces"] });
            queryClient.invalidateQueries({ queryKey: ["workspaces"] });
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
        },
    });
};

const useRefreshWorkspaceMembers = (workspaceId: string) => {
    const queryClient = useQueryClient();
    return async () => {
        await Promise.all([
            queryClient.invalidateQueries({ queryKey: ["workspace", workspaceId] }),
            queryClient.invalidateQueries({ queryKey: ["workspaces"] }),
            queryClient.invalidateQueries({ queryKey: ["workspace-dashboard"] }),
        ]);
    };
};

export const useUpdateWorkspaceMemberRole = (workspaceId: string) => {
    const refresh = useRefreshWorkspaceMembers(workspaceId);
    return useMutation({
        mutationFn: ({ userId, role }: { userId: string; role: "admin" | "member" | "viewer" }) =>
            patchData(`/members/workspace/${workspaceId}/${userId}/role`, { role }),
        onSuccess: refresh,
    });
};

export const useRemoveWorkspaceMember = (workspaceId: string) => {
    const refresh = useRefreshWorkspaceMembers(workspaceId);
    return useMutation({
        mutationFn: (userId: string) => deleteData(`/members/workspace/${workspaceId}/${userId}`),
        onSuccess: refresh,
    });
};

export const useLeaveWorkspace = (workspaceId: string) => {
    const refresh = useRefreshWorkspaceMembers(workspaceId);
    return useMutation({
        mutationFn: () => postData(`/members/workspace/${workspaceId}/leave`, {}),
        onSuccess: refresh,
    });
};

export const useTransferWorkspaceOwnership = (workspaceId: string) => {
    const refresh = useRefreshWorkspaceMembers(workspaceId);
    return useMutation({
        mutationFn: (userId: string) =>
            postData(`/members/workspace/${workspaceId}/transfer-ownership`, { userId }),
        onSuccess: refresh,
    });
};

