"use client";

import { useEffect } from "react";
import { PageErrorState } from "@/components/ui/page-state";

export default function HomeRouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Home route error", error);
  }, [error]);

  return (
    <PageErrorState
      title="Trang này đang gặp sự cố"
      description="Dữ liệu của bạn không bị ảnh hưởng. Hãy thử tải lại phần nội dung này."
      onRetry={reset}
    />
  );
}
