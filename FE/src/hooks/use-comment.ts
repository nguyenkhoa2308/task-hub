import { getData, postData, deleteData } from "@/lib/axios";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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
  parentComment?: string | null;
  replyToComment?: string | {
    _id: string;
    text: string;
    author: { _id: string; name: string; email?: string; profileImage?: string; avatarUrl?: string };
  } | null;
  replies?: Comment[];
  mentions?: Array<{
    user: string | { _id: string; name: string; profileImage?: string; avatarUrl?: string };
    offset: number;
    length: number;
  }>;
  reactions?: any[];
  attachments?: any[];
  isEdited?: boolean;
  createdAt: string;
  updatedAt: string;
}

export const useGetComments = (taskId: string, enabled = true) => {
  const query = useInfiniteQuery<{
    data: Comment[];
    totalComments?: number;
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }>({
    queryKey: ["comments", taskId, "infinite"],
    queryFn: async ({ pageParam }) => getData(`/comments/task/${taskId}`, {
      params: { page: pageParam, limit: 20 },
    }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined,
    enabled: !!taskId && enabled,
    refetchInterval: 30_000,        // poll mỗi 30 giây
    refetchOnWindowFocus: true,     // refetch ngay khi user quay lại tab
  });
  const comments = query.data?.pages
    .flatMap((page) => page.data)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || [];
  return {
    ...query,
    data: comments,
    total: query.data?.pages[0]?.totalComments ?? query.data?.pages[0]?.pagination.total ?? 0,
  };
};

export const useGetMentionCandidates = (taskId: string, enabled = true) =>
  useQuery<Array<{ _id: string; name: string; email?: string; profileImage?: string; avatarUrl?: string }>>({
    queryKey: ["comment-mention-candidates", taskId],
    queryFn: () => getData(`/comments/task/${taskId}/mention-candidates`),
    enabled: Boolean(taskId) && enabled,
    staleTime: 60_000,
  });

export const useCreateComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      content?: string;
      text?: string;
      taskId: string;
      mentions?: Array<{ user: string; offset: number; length: number }>;
      parentCommentId?: string;
    }) =>
      postData<Comment>("/comments", data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["comments", variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ["task-activities", variables.taskId] });
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
      queryClient.invalidateQueries({ queryKey: ["task-activities", variables.taskId] });
    },
  });
};
