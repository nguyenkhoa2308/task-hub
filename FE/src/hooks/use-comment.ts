import { getData, postData, deleteData } from "@/lib/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface Comment {
  _id: string;
  text: string;
  content?: string;
  author: {
    _id: string;
    name: string;
    email: string;
    profileImage?: string;
    avatarUrl?: string;
  };
  task: string;
  mentions?: any[];
  reactions?: any[];
  attachments?: any[];
  isEdited?: boolean;
  createdAt: string;
  updatedAt: string;
}

export const useGetComments = (taskId: string) => {
  return useQuery<Comment[]>({
    queryKey: ["comments", taskId],
    queryFn: async () => getData(`/comments/task/${taskId}`),
    enabled: !!taskId,
    refetchInterval: 30_000,        // poll mỗi 30 giây
    refetchOnWindowFocus: true,     // refetch ngay khi user quay lại tab
  });
};

export const useCreateComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { content?: string; text?: string; taskId: string }) =>
      postData<Comment>("/comments", data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["comments", variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ["task-activities", variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ["task-activities"] });
    },
  });
};

export const useDeleteComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ commentId }: { commentId: string; taskId: string }) =>
      deleteData(`/comments/${commentId}`),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["comments", variables.taskId] });
    },
  });
};
