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