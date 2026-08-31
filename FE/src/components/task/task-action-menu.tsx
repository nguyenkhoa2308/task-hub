"use client";

import { Eye, MoreHorizontal, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface TaskActionMenuProps {
  onView?: () => void;
  onDelete?: () => void;
  canDelete?: boolean;
}

export function TaskActionMenu({ onView, onDelete, canDelete = false }: TaskActionMenuProps) {

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Mở menu công việc"
          >
            <MoreHorizontal className="size-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44" onClick={(event) => event.stopPropagation()}>
          {onView && <DropdownMenuItem onSelect={(event) => { event.stopPropagation(); onView(); }}><Eye className="size-4" />Xem chi tiết</DropdownMenuItem>}
          {canDelete && onDelete && <DropdownMenuItem variant="destructive" onSelect={(event) => { event.stopPropagation(); onDelete(); }}><Trash2 className="size-4" />Xóa công việc</DropdownMenuItem>}
        </DropdownMenuContent>
      </DropdownMenu>

    </>
  );
}
