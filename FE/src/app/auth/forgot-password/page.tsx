"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";

import { forgotPasswordSchema } from "@/lib/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { useForgotPasswordMutation } from "@/hooks/use-auth";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const { mutate, isPending } = useForgotPasswordMutation();

  const handleOnSubmit = (values: ForgotPasswordFormData) => {
    mutate(values, {
      onSuccess: () => {
        toast.success("Mã OTP đã được gửi đến email của bạn!");
        router.push(
          `/auth/reset-password?email=${encodeURIComponent(values.email)}`
        );
      },
      onError: (error: any) => {
        toast.error(error.message || "Đã có lỗi xảy ra");
      },
    });
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-gray-50 selection:bg-blue-800/10 font-sans">
      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md py-12 bg-white rounded-2xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.05),0_10px_10px_-5px_rgba(0,0,0,0.02)] border border-gray-300/20">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 rotate-3 hover:rotate-0 transition-transform duration-500">
                <Mail className="w-7 h-7" />
              </div>
            </div>
            <CardTitle className="text-2xl text-primary font-bold">
              Quên mật khẩu?
            </CardTitle>
            <CardDescription className="text-gray-500 leading-relaxed">
              Nhập email đã đăng ký để nhận mã OTP đặt lại mật khẩu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(handleOnSubmit)} noValidate>
              <FieldGroup>
                <Controller
                  name="email"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldContent>
                        <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                        <Input
                          {...field}
                          id={field.name}
                          type="email"
                          placeholder="example@email.com"
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </FieldContent>
                    </Field>
                  )}
                />

                <Button
                  type="submit"
                  disabled={isPending}
                  className="w-full h-12"
                >
                  {isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Gửi mã OTP"
                  )}
                </Button>
              </FieldGroup>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col items-center justify-center gap-2">
            <Link
              href="/auth/sign-in"
              className="flex items-center gap-1 text-gray-500 hover:text-blue-800 font-semibold transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại đăng nhập
            </Link>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
