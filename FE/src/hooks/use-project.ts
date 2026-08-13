import { postData } from "@/lib/axios";
import { useMutation } from "@tanstack/react-query";

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

export const UseCreateProject = useCreateProject;

