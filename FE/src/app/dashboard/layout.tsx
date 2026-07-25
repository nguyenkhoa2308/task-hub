"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/lib/redux/hooks";
import { Loading } from "@/components/ui/loading";

export default function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const router = useRouter();
    const { isLoading, isAuthenticated } = useAppSelector((state) => state.auth);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.replace("/auth/sign-in");
        }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading || !isAuthenticated) {
        return <Loading text="Đang tải..." />;
    }

    return (
        <div className="flex h-screen w-full">

            {/* SidebarComponent */}

            <div className="flex flex-1 flex-col h-full">

                {/* Header */}

                <main className="flex-1 overflow-y-auto h-full w-full">
                    <div className="mx-auto container px-2 sm:px-6 lg:px-8 py-0 md:py-8 w-full h-full">
                        {children}
                    </div>
                </main>
            </div>

            {/* Create Workspace Component */}
        </div>
    );
}
