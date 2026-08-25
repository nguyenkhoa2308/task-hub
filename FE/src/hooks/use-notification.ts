import { useEffect } from "react";
import { getData, patchData } from "@/lib/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface NotificationItem {
  _id: string;
  recipient: string;
  sender: {
    _id: string;
    name: string;
    email: string;
    profileImage?: string;
  };
  type: "TASK_ASSIGNED" | "NEW_COMMENT" | "TASK_DUE_SOON" | "WORKSPACE_INVITE" | "TASK_UPDATED";
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export const useGetNotifications = () => {
  return useQuery<NotificationItem[]>({
    queryKey: ["notifications"],
    queryFn: async () => getData("/notifications"),
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
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-notification-count"] });
    },
  });
};

export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => patchData("/notifications/read-all", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
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
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
            queryClient.invalidateQueries({ queryKey: ["unread-notification-count"] });
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
