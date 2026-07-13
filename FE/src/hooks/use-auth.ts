import { useMutation } from "@tanstack/react-query";
import { postData } from "@/lib/axios";
import type { SignUpFormData } from "@/components/auth/register-form";
import { SigninFormData } from "@/components/auth/login-form";


export const useSignUpMutation = () => {
    return useMutation({
        mutationFn: (data: Omit<SignUpFormData, "confirmPassword">) => postData("/auth/register", data),
    });
};

export const useSignInMutation = () => {
    return useMutation({
        mutationFn: (data: SigninFormData) => postData("/auth/login", data),
    })
}

export const useResendVerificationMutation = () => {
    return useMutation({
        mutationFn: (data: { email: string }) => postData("/auth/resend-verification", data),
    });
};

export const useVerifyEmailMutation = () => {
    return useMutation({
        mutationFn: (data: { email: string; otp: string }) => postData("/auth/verify-email", data),
    });
};

export const useForgotPasswordMutation = () => {
    return useMutation({
        mutationFn: (data: { email: string }) => postData("/auth/forgot-password", data),
    });
};

export const useResetPasswordMutation = () => {
    return useMutation({
        mutationFn: (data: { email: string; otp: string; newPassword: string }) =>
            postData("/auth/reset-password", data),
    });
};