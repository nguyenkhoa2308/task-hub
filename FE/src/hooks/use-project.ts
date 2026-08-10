import { postData } from "@/lib/axios";
import { useMutation } from "@tanstack/react-query";

export interface CreateProjectData {
    name: string;
    description?: string;
    workspaceId: string;
}

export const useCreateProject = () => {
    return useMutation({
        mutationFn: async (data: CreateProjectData) =>
            postData(`/projects/workspace/${data.workspaceId}/create`, {
                name: data.name,
                description: data.description,
            }),
    });
};
