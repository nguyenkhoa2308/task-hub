import { getData, postData, patchData, deleteData, uploadData } from "@/lib/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface CreateTaskPayload {
  title: string;
  description?: string;
  projectId: string;
  status?: string;
  priority?: string;
  assignees?: string[];
  startDate?: string;
  dueDate?: string;
  tags?: any;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedTasks<T = any> {
  data: T[];
  pagination: PaginationMeta;
}

export const useCreateTask = () => {
  return useMutation({
    mutationFn: async (data: CreateTaskPayload) => postData("/tasks", data),
  });
};

export const useGetTasksByProject = (
  projectId: string,
  params?: { sortBy?: string; status?: string; page?: number; limit?: number },
) => {
  return useQuery<PaginatedTasks>({
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
  page?: number;
  limit?: number;
}

export const useGetMyTasks = (params?: GetMyTasksParams) => {
  return useQuery<PaginatedTasks>({
    queryKey: ["my-tasks", params],
    queryFn: async () => getData("/tasks/me", { params }),
    placeholderData: (prev: any) => prev,
  });
};

export const useGetTaskById = (taskId: string, enabled = true) => {
  return useQuery({
    queryKey: ["task", taskId],
    queryFn: async () => getData(`/tasks/${taskId}`),
    enabled: !!taskId && enabled,
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) =>
      patchData(`/tasks/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["task-activities", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["task", variables.id] });
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => deleteData(`/tasks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trash-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
};

export const useRestoreTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => patchData(`/tasks/${id}/restore`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trash-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
};

export const useGetDeletedTasks = (params?: { page?: number; limit?: number }) => {
  return useQuery<PaginatedTasks>({
    queryKey: ["trash-tasks", params],
    queryFn: async () => getData("/tasks/trash", { params }),
    placeholderData: (previous) => previous,
  });
};

export const useUploadTaskAttachment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, file }: { taskId: string; file: File }) => {
      const formData = new FormData();
      formData.append("file", file);
      return uploadData<any>(`/tasks/${taskId}/attachments`, formData);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["task", variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
    },
  });
};
