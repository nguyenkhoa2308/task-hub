"use client"

import Link from "next/link";
import RegisterForm from "@/components/auth/register-form";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

export default function SignUpPage() {
  return (
    <div className="min-h-screen w-full flex flex-col bg-gray-50 selection:bg-blue-800/10 font-sans">
      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-[440px] bg-white rounded-2xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.05),0_10px_10px_-5px_rgba(0,0,0,0.02)] border border-[#c3c6d7]/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-primary font-bold">Tạo tài khoản mới</CardTitle>
            <CardDescription className="text-gray-500 leading-relaxed">Điền thông tin bên dưới để tham gia Task Hub</CardDescription>
          </CardHeader>
          <CardContent>
            <RegisterForm />
          </CardContent>
          <CardFooter className="flex flex-col items-center justify-center gap-2">
            <p className="text-gray-500 flex items-center justify-center">Bạn đã có tài khoản?{' '}
              <Link href="/auth/sign-in" className="ml-1 font-semibold text-blue-800 hover:underline transition-all">Đăng nhập</Link>
            </p>
          </CardFooter>
        </Card>
      </main>
    </div >
  );
}
