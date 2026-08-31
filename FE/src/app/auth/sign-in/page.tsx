"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import LoginForm from "@/components/auth/login-form";
export default function SignInPage() {
  return (
    <div className="min-h-dvh w-full flex flex-col bg-gray-50 selection:bg-blue-800/10 font-sans">
      {/* Main Content */}
      <main className="flex flex-1 items-start justify-center sm:items-center sm:px-4 sm:py-8">
        <Card className="min-h-dvh w-full max-w-md rounded-none border-0 bg-white py-8 shadow-none sm:min-h-0 sm:rounded-2xl sm:border sm:border-gray-300/20 sm:py-10 sm:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.05),0_10px_10px_-5px_rgba(0,0,0,0.02)]">
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
