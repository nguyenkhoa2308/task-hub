"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import LoginForm from "@/components/auth/login-form";
export default function SignInPage() {
  return (
    <div className="min-h-screen w-full flex flex-col bg-gray-50 selection:bg-blue-800/10 font-sans">
      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md py-12 bg-white rounded-2xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.05),0_10px_10px_-5px_rgba(0,0,0,0.02)] border border-gray-300/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-primary font-bold">Chào mừng bạn trở lại</CardTitle>
            <CardDescription className="text-gray-500 leading-relaxed">
              Đăng nhập vào tài khoản của bạn để tiếp tục
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
          <CardFooter className="flex flex-col items-center justify-center gap-2">
            <p className="text-gray-500 flex items-center justify-center">
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
