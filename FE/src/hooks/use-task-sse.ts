import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

const normalizeStatus = (status?: string) => {
  const value = (status || '').toUpperCase();
  if (value.includes('PROGRESS')) return 'IN_PROGRESS';
  if (value.includes('REVIEW')) return 'REVIEW';
  if (value.includes('DONE') || value.includes('COMPLETED')) return 'DONE';
  return 'TO_DO';
};

export const useSSETasks = (projectId?: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const sseUrl = `${
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
    }/tasks/sse`;

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(sseUrl, { withCredentials: true });

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data) {
            // Invalidate task queries
            if (projectId && data.projectId === projectId) {
              const projectTaskQueries = queryClient.getQueryCache().findAll({
                queryKey: ["tasks", projectId],
              });
              projectTaskQueries.forEach((query) => {
                const params = query.queryKey[2] as { status?: string; limit?: number } | undefined;
                queryClient.setQueryData(query.queryKey, (current: any) => {
                  if (!current?.data || !data.task?._id) return current;
                  const taskId = data.task._id;
                  const currentIndex = current.data.findIndex(
                    (task: any) => (task._id || task.id) === taskId,
                  );
                  const withoutTask = current.data.filter(
                    (task: any) => (task._id || task.id) !== taskId,
                  );
                  const matchesColumn = !params?.status
                    || normalizeStatus(params.status) === normalizeStatus(data.task.status);
                  const shouldRemove = data.action === 'delete' || !matchesColumn;
                  const nextData = shouldRemove
                    ? withoutTask
                    : [data.task, ...withoutTask].slice(0, params?.limit || current.data.length + 1);
                  const totalDelta = currentIndex >= 0 && shouldRemove
                    ? -1
                    : currentIndex < 0 && !shouldRemove ? 1 : 0;
                  return {
                    ...current,
                    data: nextData,
                    pagination: current.pagination
                      ? { ...current.pagination, total: Math.max(0, current.pagination.total + totalDelta) }
                      : current.pagination,
                  };
                });
              });
            }

            // Invalidate specific task
            if (data.task?._id) {
              queryClient.invalidateQueries({ queryKey: ["task", data.task._id] });
              queryClient.invalidateQueries({ queryKey: ["task-activities", data.task._id] });
            }

            // Invalidate lists and activity logs
            if (!projectId) {
              queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
            }
            queryClient.invalidateQueries({ queryKey: ["projects"], refetchType: "none" });
            if (data.projectId) {
              queryClient.invalidateQueries({ queryKey: ["project", data.projectId] });
            }
          }
        } catch (e) {
          // Ignore JSON parse errors
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
  }, [projectId, queryClient]);
};
