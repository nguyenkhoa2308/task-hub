"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function useCommentSSE(taskId: string, enabled = true) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!taskId || !enabled) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:2308";
    const source = new EventSource(`${apiUrl}/comments/task/${taskId}/sse`, { withCredentials: true });
    source.onmessage = () => {
      queryClient.invalidateQueries({ queryKey: ["comments", taskId] });
    };
    source.onerror = () => {
      // EventSource reconnects automatically.
    };
    return () => source.close();
  }, [enabled, queryClient, taskId]);
}
