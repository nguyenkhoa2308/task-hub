"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  compact?: boolean;
}

export function PageErrorState({
  title = "Không thể tải dữ liệu",
  description = "Đã có lỗi xảy ra. Vui lòng kiểm tra kết nối và thử lại.",
  onRetry,
  compact = false,
}: PageErrorStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-2xl border border-rose-100 bg-rose-50/40 px-6 text-center ${compact ? "min-h-48 py-8" : "min-h-[42vh] py-12"}`} role="alert">
      <div className="flex size-11 items-center justify-center rounded-full bg-white text-rose-600 shadow-sm">
        <AlertTriangle className="size-5" />
      </div>
      <h2 className="mt-4 text-base font-bold text-slate-900">{title}</h2>
      <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">{description}</p>
      {onRetry && (
        <Button type="button" variant="outline" className="mt-5 gap-2 bg-white" onClick={onRetry}>
          <RefreshCw className="size-4" /> Thử lại
        </Button>
      )}
    </div>
  );
}
