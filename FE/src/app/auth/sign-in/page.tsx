"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import LoginForm from "@/components/auth/login-form";
export default function SignInPage() {
  return (
    <div className="min-h-dvh w-full flex flex-col bg-gray-50 selection:bg-blue-800/10 font-sans">
      {/* Main Content */}
      <main className="flex flex-1 items-center justify-center px-4 py-6 sm:py-8">
        <Card className="w-full max-w-md rounded-2xl border border-gray-300/20 bg-white py-8 shadow-[0_20px_25px_-5px_rgba(0,0,0,0.05),0_10px_10px_-5px_rgba(0,0,0,0.02)] sm:py-10">
          <CardHeader className="px-5 text-center sm:px-6">
            <CardTitle className="text-xl font-bold text-primary sm:text-2xl">Chào mừng bạn trở lại</CardTitle>
            <CardDescription className="text-gray-500 leading-relaxed">
              Đăng nhập vào tài khoản của bạn để tiếp tục
            </CardDescription>
          </CardHeader>
          <CardContent className="px-5 sm:px-6">
            <LoginForm />
          </CardContent>
          <CardFooter className="flex flex-col items-center justify-center gap-2 px-5 sm:px-6">
            <p className="flex flex-wrap items-center justify-center text-center text-sm text-gray-500">
              Bạn không có tài khoản?{' '}
              <Link href="/auth/sign-up" className="ml-1 font-semibold text-blue-800 hover:underline transition-all">
                Đăng ký ngay
              </Link>
            </p>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
