"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ExportReportButton({ scope, id, label = "Xuất CSV" }: { scope: "workspace" | "project"; id: string; label?: string }) {
  const [loading, setLoading] = useState(false);
  const download = async () => {
    setLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:2308";
      const response = await fetch(`${baseUrl}/reports/${scope}/${id}.csv`, { credentials: "include" });
      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.message || "Không thể xuất báo cáo");
      }
      const blob = await response.blob();
      const disposition = response.headers.get("content-disposition") || "";
      const filename = disposition.match(/filename="?([^";]+)"?/i)?.[1] || `${scope}-report.csv`;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      toast.success("Đã xuất báo cáo CSV");
    } catch (error: any) {
      toast.error(error?.message || "Không thể xuất báo cáo");
    } finally {
      setLoading(false);
    }
  };
  return <Button type="button" variant="outline" onClick={download} disabled={loading} className="gap-2">{loading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}{label}</Button>;
}
