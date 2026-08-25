import { workspaceSchema } from "@/lib/schema";
import type { z } from "zod";
import { deleteData, getData, patchData, postData } from "@/lib/axios";
import type { Project, WorkSpace } from "@/types";
import { useMutation, useQuery } from "@tanstack/react-query";

export type WorkspaceForm = z.infer<typeof workspaceSchema>;

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
  upcomingTasks7Days: any[];
  overdueTasksList?: any[];
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
        queryFn: async () => getData<any[]>("/workspaces"),
    });
};

export const useGetWorkspaceById = (workspaceId: string) => {
    return useQuery({
        queryKey: ["workspace", workspaceId],
        queryFn: async () =>
            getData<WorkSpace>(
                `/workspaces/${workspaceId}`
            ),
        enabled: !!workspaceId,
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
    return useQuery({
        queryKey: ["pending-members", workspaceId],
        queryFn: async () =>
            getData<any[]>(`/members/pending/workspace/${workspaceId}`),
        enabled: !!workspaceId,
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
