"use client"

import Link from "next/link";
import RegisterForm from "@/components/auth/register-form";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

export default function SignUpPage() {
  return (
    <div className="min-h-dvh w-full flex flex-col bg-gray-50 selection:bg-blue-800/10 font-sans">
      {/* Main Content */}
      <main className="flex flex-1 items-start justify-center sm:items-center sm:px-4 sm:py-8">
        <Card className="min-h-dvh w-full max-w-[440px] rounded-none border-0 bg-white py-7 shadow-none sm:min-h-0 sm:rounded-2xl sm:border sm:border-[#c3c6d7]/20 sm:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.05),0_10px_10px_-5px_rgba(0,0,0,0.02)]">
          <CardHeader className="px-5 text-center sm:px-6">
            <CardTitle className="text-xl font-bold text-primary sm:text-2xl">Tạo tài khoản mới</CardTitle>
            <CardDescription className="text-gray-500 leading-relaxed">Điền thông tin bên dưới để tham gia Task Hub</CardDescription>
          </CardHeader>
          <CardContent className="px-5 sm:px-6">
            <RegisterForm />
          </CardContent>
          <CardFooter className="flex flex-col items-center justify-center gap-2 px-5 sm:px-6">
            <p className="flex flex-wrap items-center justify-center text-center text-sm text-gray-500">Bạn đã có tài khoản?{' '}
              <Link href="/auth/sign-in" className="ml-1 font-semibold text-blue-800 hover:underline transition-all">Đăng nhập</Link>
            </p>
          </CardFooter>
        </Card>
      </main>
    </div >
  );
}
