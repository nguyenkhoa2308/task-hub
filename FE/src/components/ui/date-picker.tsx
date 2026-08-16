"use client";

import React from "react";
import { DatePicker as AntDatePicker, ConfigProvider } from "antd";
import viVN from "antd/locale/vi_VN";
import dayjs from "dayjs";
import "dayjs/locale/vi";

dayjs.locale("vi");

interface DatePickerProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  fontSize?: number;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Chọn ngày...",
  disabled = false,
  className = "",
  fontSize = 13,
}: DatePickerProps) {
  const dayjsValue = value && dayjs(value).isValid() ? dayjs(value) : null;

  const handleChange = (date: dayjs.Dayjs | null) => {
    if (date && date.isValid()) {
      onChange(date.format("YYYY-MM-DD"));
    } else {
      onChange("");
    }
  };

  return (
    <ConfigProvider
      locale={viVN}
      theme={{
        token: {
          colorPrimary: "#2563eb",
          borderRadius: 12,
          fontSize: fontSize,
        },
      }}
    >
      <AntDatePicker
        value={dayjsValue}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        format="DD/MM/YYYY"
        getPopupContainer={() => document.body}
        className={`w-full h-10 rounded-xl border-slate-200 ${className}`}
      />
    </ConfigProvider>
  );
}
