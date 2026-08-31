import { getData } from "@/lib/axios";
import { useInfiniteQuery } from "@tanstack/react-query";

export interface ActivityLog {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    profileImage?: string;
  };
  action: string;
  resourceType: string;
  resourceId: string;
  details?: {
    description?: string;
    title?: string;
    text?: string;
    [key: string]: unknown;
  };
  createdAt: string;
  updatedAt: string;
}

interface ActivityPage {
  data: ActivityLog[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

const useActivities = (
  resource: "task" | "project",
  id: string,
  enabled: boolean,
  limit: number,
) => {
  const query = useInfiniteQuery<ActivityPage>({
    queryKey: [`${resource}-activities`, id, "infinite"],
    queryFn: async ({ pageParam }) => getData(`/activities/${resource}/${id}`, {
      params: { page: pageParam, limit },
    }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined,
    enabled: Boolean(id) && enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: resource === "task",
  });
  return {
    ...query,
    data: query.data?.pages.flatMap((page) => page.data) || [],
    total: query.data?.pages[0]?.pagination.total || 0,
  };
};

export const useGetTaskActivities = (taskId: string, enabled = true) =>
  useActivities("task", taskId, enabled, 20);

export const useGetProjectActivities = (projectId: string, enabled = true) =>
  useActivities("project", projectId, enabled, 30);
