import Link from "next/link";

import type { LucideIcon } from "lucide-react";

import type { WorkSpace } from "@/types";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "../ui/button";

interface SidebarNavProps extends React.HtmlHTMLAttributes<HTMLElement> {
  items: {
    title: string;
    href: string;
    icon: LucideIcon;
  }[];
  isCollapsed: boolean;
  className?: string;
  currentWorkspace: WorkSpace | null;
}

export default function SidebarNav({
  items,
  isCollapsed,
  className,
  currentWorkspace,
  ...props
}: SidebarNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className={cn("flex flex-col gap-y-2", className)} {...props}>
      {items.map((el) => {
        const Icon = el.icon;
        const isActive = pathname === el.href || pathname.startsWith(el.href + "/");

        const handleClick = () => {
          if (el.href === "/workspaces") {
            router.push(el.href);
          } else if (currentWorkspace && currentWorkspace._id) {
            router.push(`${el.href}?workspaceId=${currentWorkspace._id}`);
          } else {
            router.push(el.href);
          }
        };

        return (
          <Button
            key={el.href}
            variant="ghost"
            className={cn(
              "justify-start hover:bg-blue-800/30 hover:text-blue-700 py-5 active:scale-97 transition-all font-bold",
              isActive && "bg-blue-800/20 text-blue-600",
            )}
            onClick={handleClick}
          >
            <Icon className="size-5 ml-1" />
            {isCollapsed ? (
              <span className="sr-only">{el.title}</span>
            ) : (
              <span className="ml-2">{el.title}</span>
            )}
          </Button>
        );
      })}
    </nav>
  );
}
