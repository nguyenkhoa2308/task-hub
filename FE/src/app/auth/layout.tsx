"use client"

import { useAppSelector } from "@/lib/redux/hooks";
import { redirect } from "next/navigation";


export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { isLoading, isAuthenticated } = useAppSelector((state) => state.auth);

  if (isLoading) {
    return <div>Đang tải...</div>;
  }

  if (isAuthenticated) {
    return redirect('/');
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      {children}
    </div>
  );
}
