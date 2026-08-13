"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft, Home, RefreshCw } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App Error:", error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6 bg-card border border-border p-8 rounded-2xl shadow-lg relative overflow-hidden">
        {/* Subtle decorative background gradient */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-destructive/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative mx-auto w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="w-10 h-10 text-destructive" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">
            Đã xảy ra sự cố
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Ứng dụng gặp sự cố trong khi tải trang này. Bạn có thể thử tải lại hoặc quay về trang chủ.
          </p>
          {error?.digest && (
            <p className="text-xs text-muted-foreground/60 font-mono pt-1">
              Error Digest: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button
            onClick={() => reset()}
            variant="default"
            className="gap-2 font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Thử lại
          </Button>
          <Button
            asChild
            variant="outline"
            className="gap-2 font-medium"
          >
            <Link href="/dashboard">
              <Home className="w-4 h-4" />
              Về Trang chủ
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
