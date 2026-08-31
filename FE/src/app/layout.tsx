import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import QueryProvider from "@/providers/query-provider";
import StoreProvider from "@/providers/store-provider";
import AuthInitializer from "@/providers/auth-initializer";

const nunito = Nunito({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Task Hub | Quản lý công việc rõ ràng hơn",
  description:
    "Task Hub giúp đội nhóm quản lý workspace, dự án, công việc và trao đổi trong một nơi.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={cn("h-full", "antialiased", "font-sans", nunito.variable)}
    >
      <body className="min-h-full flex flex-col">
        <StoreProvider>
          <QueryProvider>
            <AuthInitializer>{children}</AuthInitializer>
          </QueryProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
