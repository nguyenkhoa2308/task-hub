import type { WorkspaceForm } from "@/components/workspace/create-workspace";
import { getData, postData } from "@/lib/axios";
import type { Project, WorkSpace } from "@/types";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useCreateWorkspace = () => {
    return useMutation({
        mutationFn: async (data: WorkspaceForm) => postData("/workspaces", data),
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

export const useInviteMember = (workspaceId: string) => {
    return useMutation({
        mutationFn: async (data: { email: string; role: string }) =>
            postData(`/members/invite/workspace/${workspaceId}`, data),
    });
};