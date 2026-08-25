import { getData, postData, patchData, deleteData } from "@/lib/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface CreateTaskPayload {
  title: string;
  description?: string;
  projectId: string;
  status?: string;
  priority?: string;
  assignees?: string[];
  dueDate?: string;
  tags?: any;
}

export const useCreateTask = () => {
  return useMutation({
    mutationFn: async (data: CreateTaskPayload) => postData("/tasks", data),
  });
};

export const useGetTasksByProject = (
  projectId: string,
  params?: { sortBy?: string; status?: string },
) => {
  return useQuery({
    queryKey: ["tasks", projectId, params],
    queryFn: async () => getData(`/tasks/project/${projectId}`, { params }),
    enabled: !!projectId,
  });
};

export interface GetMyTasksParams {
  status?: string;
  priority?: string;
  workspaceId?: string;
  search?: string;
  sortBy?: string;
  isArchived?: boolean;
}

export const useGetMyTasks = (params?: GetMyTasksParams) => {
  return useQuery({
    queryKey: ["my-tasks", params],
    queryFn: async () => getData("/tasks/me", { params }),
    placeholderData: (prev: any) => prev,
  });
};

export const useGetTaskById = (taskId: string) => {
  return useQuery({
    queryKey: ["task", taskId],
    queryFn: async () => getData(`/tasks/${taskId}`),
    enabled: !!taskId,
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) =>
      patchData(`/tasks/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["task-activities", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["task-activities"] });
      queryClient.invalidateQueries({ queryKey: ["task", variables.id] });
    },
  });
};

export const useDeleteTask = () => {
  return useMutation({
    mutationFn: async (id: string) => deleteData(`/tasks/${id}`),
  });
};
