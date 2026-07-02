import Link from "next/link";

import LoginForm from "@/components/auth/login-form";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";

export default function SignInPage() {
  return (
    <div className="flex w-full min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm">
        <Card className="w-full shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              Chào mừng bạn trở lại
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Đăng nhập vào tài khoản của bạn để tiếp tục
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
          <CardFooter className="flex flex-col items-center justify-center gap-2">
            <div className="flex items-center justify-center">
              <p className="text-sm text-muted-foreground">
                Bạn không có tài khoản?{" "}
                <Link
                  href="/auth/sign-up"
                  className="font-medium text-primary hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  Đăng ký
                </Link>
              </p>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
