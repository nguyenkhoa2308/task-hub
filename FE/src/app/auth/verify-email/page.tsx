"use client"

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { useVerifyEmailMutation, useResendVerificationMutation } from "@/hooks/use-auth";
import { toast } from "sonner";
import { HelpCircle, ShieldCheck, Lock, Loader2 } from "lucide-react";
import Link from "next/link";

export default function VerifyEmailPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const email = searchParams.get("email");

    const [otp, setOtp] = useState("");
    const { mutate, isPending } = useVerifyEmailMutation();
const { mutate: resendMutate, isPending: isResending } = useResendVerificationMutation();

    const [timeLeft, setTimeLeft] = useState(59);

    useEffect(() => {
        if (timeLeft <= 0) return;
        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft]);

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (otp.length !== 6) return;
        if (!email) {
            toast.error("Không tìm thấy email cần xác thực");
            return;
        }
        mutate({ email, otp }, {
            onSuccess: () => {
                toast.success("Xác thực email thành công!");
                router.push("/auth/sign-in");
            },
            onError: (error: any) => {
                toast.error(error.message || "Mã OTP không hợp lệ hoặc đã hết hạn");
            },
        });
    };
    // Resend verification email handler
    const handleResend = () => {
        if (!email) {
            toast.error("Không tìm thấy email");
            return;
        }
        resendMutate({ email }, {
            onSuccess: () => {
                toast.success("Email xác thực đã được gửi lại");
                setTimeLeft(59);
            },
            onError: (error: any) => {
                toast.error(error.message || "Gửi lại email thất bại");
            },
        });
    };


    if (!email) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
                <p className="text-gray-500 mb-4">Thiếu thông tin email. Vui lòng quay lại.</p>
                <Link href="/auth/sign-in" className="text-[#004ac6] hover:underline">
                    Quay lại Đăng nhập
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full flex flex-col bg-gray-50 selection:bg-blue-800/10 font-sans">
            {/* Header */}
            <header className="bg-transparent top-0 z-50">
                <div className="flex justify-between items-center w-full px-6 py-8 max-w-7xl mx-auto">
                    <div className="text-xl tracking-tight font-bold text-blue-600">Task Hub</div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="text-slate-500 hover:text-blue-600 hover:bg-transparent transition-all active:scale-95 cursor-pointer">
                            <HelpCircle className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-grow flex items-center justify-center px-4 py-8">
                <Card className="w-full max-w-[440px] bg-white rounded-2xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.05),0_10px_10px_-5px_rgba(0,0,0,0.02)] border border-[#c3c6d7]/20">
                    <CardHeader className="text-center">
                        <div className="flex justify-center mb-8">
                            <div className="w-14 h-14 bg-[#eff4ff] rounded-2xl flex items-center justify-center text-[#004ac6] rotate-3 hover:rotate-0 transition-transform duration-500">
                                <ShieldCheck className="w-7 h-7" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl text-[#0b1c30] mb-4 tracking-tight font-bold">Xác thực tài khoản</CardTitle>
                        <CardDescription className="text-[14px] text-[#434655] leading-relaxed">
                            Chúng tôi đã gửi mã xác thực gồm 6 chữ số đến email <br />
                            <strong className="text-[#0b1c30]">{email}</strong>.
                            <span className="block mt-1">Vui lòng nhập mã để tiếp tục.</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="py-4">
                        <form className="space-y-8" onSubmit={handleSubmit}>
                            <div className="flex justify-center w-full">
                                <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                                    <InputOTPGroup className="flex justify-between gap-2 sm:gap-3 w-full">
                                        {[0, 1, 2, 3, 4, 5].map((index) => (
                                            <InputOTPSlot
                                                key={index}
                                                index={index}
                                                className="!w-11 !h-14 sm:!w-[52px] sm:!h-14 text-center text-xl font-semibold !border !border-[#c3c6d7]/40 !rounded-xl bg-[#eff4ff]/30 text-[#0b1c30] transition-all focus-visible:!ring-1 focus-visible:!ring-[#004ac6] focus-visible:!border-[#004ac6]"
                                            />
                                        ))}
                                    </InputOTPGroup>
                                </InputOTP>
                            </div>

                            <div className="pt-4">
                                <Button
                                    type="submit"
                                    disabled={otp.length !== 6 || isPending}
                                    className="w-full h-14 bg-[#004ac6] hover:bg-[#003ea8] text-white font-medium text-[14px] rounded-xl shadow-lg shadow-[#004ac6]/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center"
                                >
                                    {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Xác nhận"}
                                </Button>
                            </div>
                        </form>
                        <div className="mt-8 text-center">
                            <p className="text-[14px] text-[#434655] flex items-center justify-center">
                                Bạn không nhận được mã?
                                <Button
                                    variant="link"
                                    disabled={timeLeft > 0 || isResending}
                                    onClick={handleResend}
                                    className={`ml-1 p-0 h-auto font-semibold transition-all ${timeLeft > 0 || isResending ? 'text-[#004ac6] opacity-60 cursor-not-allowed' : 'text-[#004ac6] hover:underline cursor-pointer'}`}
                                >
                                    {isResending ? "Đang gửi..." : timeLeft > 0 ? `Gửi lại mã (sau ${timeLeft}s)` : "Gửi lại mã ngay"}
                                </Button>
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </main>

            {/* Footer */}
            <footer className="mt-auto py-8">
                <div className="flex flex-col items-center gap-4 w-full">
                    <div className="flex gap-8">
                        <a href="#" className="text-[12px] font-semibold text-[#434655]/60 hover:text-[#004ac6] transition-colors">Support</a>
                        <a href="#" className="text-[12px] font-semibold text-[#434655]/60 hover:text-[#004ac6] transition-colors">Privacy</a>
                        <a href="#" className="text-[12px] font-semibold text-[#434655]/60 hover:text-[#004ac6] transition-colors">Terms</a>
                    </div>
                    <div className="text-[11px] font-semibold text-[#565e74]/40">© 2024 Task Hub Security</div>
                </div>
            </footer>
        </div>
    );
}