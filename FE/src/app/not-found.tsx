"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileQuestion, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6 bg-card border border-border p-8 rounded-2xl shadow-lg relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative mx-auto w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-4xl font-extrabold text-primary select-none">404</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">
            Không tìm thấy trang
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Trang bạn đang tìm kiếm không tồn tại, đã bị xóa hoặc đường dẫn bị thay đổi.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button
            asChild
            variant="default"
            className="gap-2 font-medium"
          >
            <Link href="/dashboard">
              <Home className="w-4 h-4" />
              Về Trang chủ
            </Link>
          </Button>
          <Button
            onClick={() => window.history.back()}
            variant="outline"
            className="gap-2 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </Button>
        </div>
      </div>
    </div>
  );
}
