"use client";

import React from "react";
import clsx from "clsx";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "gold" | "jade" | "crimson" | "sky" | "neutral";
  size?: "sm" | "md";
  className?: string;
}

export default function Badge({
  children,
  variant = "neutral",
  size = "sm",
  className,
}: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center font-body font-medium rounded-pill whitespace-nowrap",
        {
          "bg-[#C9A84C]/10 text-[#A07830]": variant === "gold",
          "bg-[#2D6A4F]/10 text-[#2D6A4F]": variant === "jade",
          "bg-[#9B2335]/10 text-[#9B2335]": variant === "crimson",
          "bg-[#1B4F72]/10 text-[#1B4F72]": variant === "sky",
          "bg-black/[0.05] text-ink-muted": variant === "neutral",
          "text-xs px-2.5 py-0.5": size === "sm",
          "text-sm px-3 py-1": size === "md",
        },
        className
      )}
    >
      {children}
    </span>
  );
}
