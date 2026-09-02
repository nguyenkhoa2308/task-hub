import { useEffect, useRef, useState } from "react";
import { getData, patchData } from "@/lib/axios";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData } from "@tanstack/react-query";

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

interface NotificationRealtimePayload {
  notification: NotificationItem;
  unreadCount: number;
}

const NOTIFICATIONS_QUERY_KEY = ["notifications", "infinite-v2"] as const;
const UNREAD_COUNT_QUERY_KEY = ["unread-notification-count"] as const;
const FALLBACK_POLL_INTERVAL = 60_000;
const INITIAL_SSE_RECONNECT_DELAY = 1_000;
const MAX_SSE_RECONNECT_DELAY = 30_000;

interface RealtimeQueryOptions {
  enabled?: boolean;
  realtimeConnected?: boolean;
}

export const useGetNotifications = ({
  enabled = true,
  realtimeConnected = false,
}: RealtimeQueryOptions = {}) => {
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
    enabled,
    refetchInterval: realtimeConnected ? false : FALLBACK_POLL_INTERVAL,
  });
};

export const useGetUnreadNotificationCount = ({
  realtimeConnected = false,
}: Pick<RealtimeQueryOptions, "realtimeConnected"> = {}) => {
  return useQuery<{ unreadCount: number }>({
    queryKey: UNREAD_COUNT_QUERY_KEY,
    queryFn: async () => getData("/notifications/unread-count"),
    refetchInterval: realtimeConnected ? false : FALLBACK_POLL_INTERVAL,
  });
};

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (notificationId: string) =>
      patchData(`/notifications/${notificationId}/read`, {}),
    onSuccess: (_, notificationId) => {
      queryClient.setQueryData<InfiniteData<NotificationPage>>(
        NOTIFICATIONS_QUERY_KEY,
        (current) => current ? {
          ...current,
          pages: current.pages.map((page) => ({
            ...page,
            data: page.data.map((item) => item._id === notificationId ? { ...item, isRead: true } : item),
          })),
        } : current,
      );
      queryClient.setQueryData<{ unreadCount: number }>(UNREAD_COUNT_QUERY_KEY, (current) => ({
        unreadCount: Math.max(0, (current?.unreadCount || 0) - 1),
      }));
    },
  });
};

export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => patchData("/notifications/read-all", {}),
    onSuccess: () => {
      queryClient.setQueryData<InfiniteData<NotificationPage>>(
        NOTIFICATIONS_QUERY_KEY,
        (current) => current ? {
          ...current,
          pages: current.pages.map((page) => ({
            ...page,
            data: page.data.map((item) => ({ ...item, isRead: true })),
          })),
        } : current,
      );
      queryClient.setQueryData(UNREAD_COUNT_QUERY_KEY, { unreadCount: 0 });
    },
  });
};

// Hook mở kết nối 1 chiều SSE (Server-Sent Events) với NestJS Backend
export const useSSENotifications = () => {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const hasConnectedRef = useRef(false);

  useEffect(() => {
    const sseUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:2308"}/notifications/sse`;
    let eventSource: EventSource | null = null;
    let reconnectTimer: number | null = null;
    let reconnectDelay = INITIAL_SSE_RECONNECT_DELAY;
    let isDisposed = false;
    let isRecoveringSession = false;
    let shouldResync = false;

    const handleNotification = (event: MessageEvent<string>) => {
      try {
        const payload = JSON.parse(event.data) as NotificationRealtimePayload | NotificationItem;
        const notification = "notification" in payload ? payload.notification : payload;
        if (!notification?._id) return;

        void queryClient.cancelQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
        void queryClient.cancelQueries({ queryKey: UNREAD_COUNT_QUERY_KEY });
        const hadNotificationCache = Boolean(
          queryClient.getQueryData<InfiniteData<NotificationPage>>(NOTIFICATIONS_QUERY_KEY),
        );
        queryClient.setQueryData<InfiniteData<NotificationPage>>(NOTIFICATIONS_QUERY_KEY, (current) => {
          if (!current?.pages?.length) {
            return {
              pages: [{
                data: [notification],
                pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
              }],
              pageParams: [1],
            };
          }
          if (current.pages.some((page) => page.data.some((item) => item._id === notification._id))) {
            return current;
          }
          const firstPage = current.pages[0] as NotificationPage;
          const total = firstPage.pagination.total + 1;
          return {
            ...current,
            pages: [
              {
                ...firstPage,
                data: [notification, ...firstPage.data],
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
        if (!hadNotificationCache) {
          queryClient.invalidateQueries({
            queryKey: NOTIFICATIONS_QUERY_KEY,
            refetchType: "none",
          });
        }
        if ("notification" in payload) {
          queryClient.setQueryData(UNREAD_COUNT_QUERY_KEY, {
            unreadCount: payload.unreadCount,
          });
        } else {
          queryClient.setQueryData(
            UNREAD_COUNT_QUERY_KEY,
            (current: { unreadCount: number } | undefined) => ({
              unreadCount: (current?.unreadCount || 0) + 1,
            }),
          );
        }
      } catch {
        // Ignore malformed SSE messages and keep the stream alive.
      }
    };

    function scheduleReconnect() {
      if (isDisposed || isRecoveringSession || reconnectTimer !== null) return;
      isRecoveringSession = true;

      void getData("/auth/me")
        .catch(() => undefined)
        .finally(() => {
          isRecoveringSession = false;
          if (isDisposed) return;
          reconnectTimer = window.setTimeout(() => {
            reconnectTimer = null;
            connect();
          }, reconnectDelay);
          reconnectDelay = Math.min(reconnectDelay * 2, MAX_SSE_RECONNECT_DELAY);
        });
    }

    function connect() {
      if (isDisposed) return;

      try {
        const source = new EventSource(sseUrl, { withCredentials: true });
        eventSource = source;
        source.onopen = () => {
          if (eventSource !== source) return;
          setIsConnected(true);
          reconnectDelay = INITIAL_SSE_RECONNECT_DELAY;
          if (hasConnectedRef.current || shouldResync) {
            queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_QUERY_KEY });
            queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
          }
          shouldResync = false;
          hasConnectedRef.current = true;
        };
        source.onmessage = handleNotification;
        source.onerror = () => {
          if (eventSource !== source) return;
          setIsConnected(false);
          shouldResync = true;
          source.close();
          eventSource = null;
          scheduleReconnect();
        };
      } catch {
        setIsConnected(false);
        shouldResync = true;
        scheduleReconnect();
      }
    }

    connect();

    return () => {
      isDisposed = true;
      if (reconnectTimer !== null) window.clearTimeout(reconnectTimer);
      eventSource?.close();
    };
  }, [queryClient]);

  return isConnected;
};
