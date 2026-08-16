import { getData, postData, patchData, deleteData } from "@/lib/axios";
import { useMutation, useQuery } from "@tanstack/react-query";

export interface CreateProjectPayload {
    projectData: any;
    workspaceId: string;
}

export const useCreateProject = () => {
    return useMutation({
        mutationFn: async (data: CreateProjectPayload) =>
            postData(`/projects/workspace/${data.workspaceId}/create`, data.projectData),
    });
};

export const useGetProjectsByWorkspace = (workspaceId: string) => {
    return useQuery({
        queryKey: ["projects", workspaceId],
        queryFn: async () => getData(`/projects/workspace/${workspaceId}`),
        enabled: !!workspaceId,
    });
};

export const useGetProjectById = (projectId: string) => {
    return useQuery({
        queryKey: ["project", projectId],
        queryFn: async () => getData(`/projects/${projectId}`),
        enabled: !!projectId,
    });
};

export const useUpdateProject = () => {
    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) =>
            patchData(`/projects/${id}`, data),
    });
};

export const useDeleteProject = () => {
    return useMutation({
        mutationFn: async (id: string) => deleteData(`/projects/${id}`),
    });
};

export const UseCreateProject = useCreateProject;
