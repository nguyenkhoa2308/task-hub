import { useEffect } from "react";
import { getData, patchData } from "@/lib/axios";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface NotificationItem {
  _id: string;
  recipient: string;
  sender?: {
    _id: string;
    name: string;
    email: string;
    profileImage?: string;
  };
  type: "TASK_ASSIGNED" | "NEW_COMMENT" | "COMMENT_MENTION" | "COMMENT_REPLY" | "TASK_DUE_SOON" | "TASK_OVERDUE" | "WORKSPACE_INVITE" | "TASK_UPDATED";
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

interface NotificationPage {
  data: NotificationItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

const NOTIFICATIONS_QUERY_KEY = ["notifications", "infinite-v2"] as const;

export const useGetNotifications = () => {
  return useInfiniteQuery<NotificationPage>({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: async ({ pageParam }) => getData("/notifications", {
      params: { page: pageParam, limit: 20 },
    }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (
      lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined
    ),
    refetchInterval: 15_000, // Fallback polling 15s
  });
};

export const useGetUnreadNotificationCount = () => {
  return useQuery<{ unreadCount: number }>({
    queryKey: ["unread-notification-count"],
    queryFn: async () => getData("/notifications/unread-count"),
    refetchInterval: 15_000,
  });
};

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (notificationId: string) =>
      patchData(`/notifications/${notificationId}/read`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["unread-notification-count"] });
    },
  });
};

export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => patchData("/notifications/read-all", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["unread-notification-count"] });
    },
  });
};

// Hook mở kết nối 1 chiều SSE (Server-Sent Events) với NestJS Backend
export const useSSENotifications = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Gọi endpoint /api/notifications/sse
    const sseUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/notifications/sse`;
    
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(sseUrl, { withCredentials: true });

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data) {
            queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, (current: any) => {
              if (!current?.pages?.length) return current;
              if (current.pages.some((page: NotificationPage) => page.data.some((item) => item._id === data._id))) {
                return current;
              }
              const firstPage = current.pages[0] as NotificationPage;
              const total = firstPage.pagination.total + 1;
              return {
                ...current,
                pages: [
                  {
                    ...firstPage,
                    data: [data, ...firstPage.data],
                    pagination: {
                      ...firstPage.pagination,
                      total,
                      totalPages: Math.ceil(total / firstPage.pagination.limit),
                    },
                  },
                  ...current.pages.slice(1),
                ],
              };
            });
            queryClient.setQueryData(
              ["unread-notification-count"],
              (current: { unreadCount: number } | undefined) => ({
                unreadCount: (current?.unreadCount || 0) + 1,
              }),
            );
          }
        } catch (e) {
          // Ignore parse errors
        }
      };

      eventSource.onerror = () => {
        // EventSource will automatically reconnect if connection drops
      };
    } catch (e) {
      // Ignore initial connection errors
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [queryClient]);
};
