import { getData, postData, patchData, deleteData } from "@/lib/axios";
import { useMutation, useQuery } from "@tanstack/react-query";

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

export const useGetTasksByProject = (projectId: string) => {
  return useQuery({
    queryKey: ["tasks", projectId],
    queryFn: async () => getData(`/tasks/project/${projectId}`),
    enabled: !!projectId,
  });
};

export const useGetMyTasks = () => {
  return useQuery({
    queryKey: ["my-tasks"],
    queryFn: async () => getData("/tasks/me"),
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
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) =>
      patchData(`/tasks/${id}`, data),
  });
};

export const useDeleteTask = () => {
  return useMutation({
    mutationFn: async (id: string) => deleteData(`/tasks/${id}`),
  });
};
