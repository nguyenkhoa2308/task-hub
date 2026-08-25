import { getData } from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";

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
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
}

export const useGetTaskActivities = (taskId: string) => {
  return useQuery<ActivityLog[]>({
    queryKey: ["task-activities", taskId],
    queryFn: async () => getData(`/activities/task/${taskId}`),
    enabled: !!taskId,
    staleTime: 0,                   // Tải dữ liệu tươi lập tức
    refetchInterval: 3_000,         // Poll mỗi 3 giây khi mở modal
    refetchOnWindowFocus: true,
  });
};
