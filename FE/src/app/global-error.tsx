"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft, Home, RefreshCw } from "lucide-react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="vi" className="h-full">
      <body className="h-full flex items-center justify-center bg-background text-foreground antialiased p-4">
        <div className="max-w-md w-full text-center space-y-6 bg-card border border-border p-8 rounded-2xl shadow-xl">
          <div className="relative mx-auto w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center animate-pulse">
            <AlertCircle className="w-10 h-10 text-destructive" />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight">
              Đã xảy ra lỗi hệ thống
            </h1>
            <p className="text-muted-foreground text-sm">
              Rất tiếc! Hệ thống đã gặp một lỗi không mong muốn. Đội ngũ kỹ thuật đã được ghi nhận vấn đề này.
            </p>
            {error?.digest && (
              <p className="text-xs text-muted-foreground/60 font-mono mt-1">
                Mã lỗi (Digest): {error.digest}
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
      </body>
    </html>
  );
}
