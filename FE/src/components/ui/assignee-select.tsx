"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AssigneeSelectProps {
  value: string[];
  onChange: (v: string[]) => void;
  members: any[];
  placeholder?: string;
}

export function AssigneeSelect({
  value,
  onChange,
  members,
  placeholder = "Chọn người thực hiện...",
}: AssigneeSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

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
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full min-h-14 flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm hover:border-slate-300 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
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
                    <AvatarFallback className="bg-blue-600 text-white text-[10px] font-bold">
                      {u.name?.charAt(0)?.toUpperCase() || "U"}
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

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 top-[calc(100%+4px)] left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
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
                      <AvatarFallback className="bg-blue-600 text-white font-bold text-[9px]">
                        {u.name?.charAt(0)?.toUpperCase() || "U"}
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
        </div>
      )}
    </div>
  );
}
