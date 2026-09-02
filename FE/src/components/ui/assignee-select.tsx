"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AssigneeSelectProps {
  value: string[];
  onChange: (v: string[]) => void;
  members: any[];
  placeholder?: string;
  disabled?: boolean;
}

export function AssigneeSelect({
  value,
  onChange,
  members,
  placeholder = "Chọn người thực hiện...",
  disabled = false,
}: AssigneeSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const toggle = (userId: string) => {
    if (value.includes(userId)) {
      onChange(value.filter((id) => id !== userId));
    } else {
      onChange([...value, userId]);
    }
  };

  const filtered = members.filter((m) => {
    const u = m.user || m;
    const name = (u.name || "").toLowerCase();
    const email = (u.email || "").toLowerCase();
    return name.includes(search.toLowerCase()) || email.includes(search.toLowerCase());
  });

  const selectedMembers = members.filter((m) => {
    const u = m.user || m;
    return value.includes(u._id || u);
  });

  return (
    <PopoverPrimitive.Root
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setSearch("");
      }}
    >
      {/* Trigger */}
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={`w-full min-h-14 flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 ${disabled ? "opacity-60 cursor-not-allowed bg-slate-50" : "hover:border-slate-300 cursor-pointer"}`}
        >
          {selectedMembers.length === 0 ? (
            <span className="text-slate-400 font-normal">{placeholder}</span>
          ) : (
            <div className="flex items-center gap-1.5 flex-wrap flex-1">
              {selectedMembers.map((m) => {
                const u = m.user || m;
                return (
                  <div
                    key={u._id || u}
                    className="flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg px-2 py-1 text-[13px] font-bold"
                  >
                    <Avatar className="size-6 shrink-0">
                      <AvatarImage src={u.profileImage} />
                      <AvatarFallback className="text-[10px] font-semibold">
                        {u.name?.charAt(0)?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    {u.name || "Thành viên"}
                  </div>
                );
              })}
            </div>
          )}
          <ChevronDown
            className={`size-4 text-slate-400 transition-transform shrink-0 ml-auto ${open ? "rotate-180" : ""}`}
          />
        </button>
      </PopoverPrimitive.Trigger>

      {/* Dropdown in Portal */}
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          style={{ width: "var(--radix-popover-trigger-width)" }}
          className="z-[100] bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden p-0 duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
        >
          {/* Search */}
          <div className="p-2 border-b border-slate-100">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm thành viên..."
              className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 placeholder:text-slate-400"
              autoFocus
            />
          </div>

          {/* List */}
          <div className="max-h-44 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">Không tìm thấy thành viên</p>
            ) : (
              filtered.map((m) => {
                const u = m.user || m;
                const userId = u._id || u;
                const isChecked = value.includes(userId);

                return (
                  <div
                    key={userId}
                    onClick={() => toggle(userId)}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer select-none transition-colors ${isChecked ? "bg-blue-50" : "hover:bg-slate-50"
                      }`}
                  >
                    {/* Checkbox */}
                    <div
                      className={`size-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${isChecked ? "bg-blue-600 border-blue-600" : "border-slate-300 bg-white"
                        }`}
                    >
                      {isChecked && <Check className="size-2.5 text-white stroke-[3]" />}
                    </div>

                    <Avatar className="size-8 shrink-0">
                      <AvatarImage src={u.profileImage} />
                      <AvatarFallback className="text-[9px] font-semibold">
                        {u.name?.charAt(0)?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-sm font-semibold text-slate-800 truncate">
                        {u.name || "Thành viên"}
                      </span>
                      <span className="text-xs text-slate-400 truncate">{u.email}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

