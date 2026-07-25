"use client";

import { useEffect } from "react";
import { useGetMeQuery } from "@/hooks/use-auth";
import { useAppDispatch } from "@/lib/redux/hooks";
import { loginSuccess, logout, setLoading } from "@/lib/redux/features/authSlice";

export default function AuthInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const { data, isLoading, isError } = useGetMeQuery();

  useEffect(() => {
    if (isLoading) {
      dispatch(setLoading(true));
    } else {
      const user = (data as any)?.user;
      if (user) {
        dispatch(loginSuccess(user));
      } else {
        dispatch(logout());
      }
    }
  }, [data, isLoading, isError, dispatch]);

  return <>{children}</>;
}
