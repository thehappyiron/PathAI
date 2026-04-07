"use client";

import React from "react";
import clsx from "clsx";

interface ProgressBarProps {
  value: number; // 0–100
  color?: "gold" | "jade" | "crimson" | "sky";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  animated?: boolean;
  className?: string;
}

export default function ProgressBar({
  value,
  color = "gold",
  size = "md",
  showLabel = false,
  animated = true,
  className,
}: ProgressBarProps) {
  const clampedValue = Math.max(0, Math.min(100, value));

  const colorMap = {
    gold: "bg-[#C9A84C]",
    jade: "bg-[#2D6A4F]",
    crimson: "bg-[#9B2335]",
    sky: "bg-[#1B4F72]",
  };

  const trackMap = {
    gold: "bg-[#C9A84C]/10",
    jade: "bg-[#2D6A4F]/10",
    crimson: "bg-[#9B2335]/10",
    sky: "bg-[#1B4F72]/10",
  };

  return (
    <div className={clsx("w-full", className)}>
      {showLabel && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-ink-muted font-body">Progress</span>
          <span className="text-xs font-mono text-ink font-medium">
            {clampedValue}%
          </span>
        </div>
      )}
      <div
        className={clsx("rounded-full overflow-hidden", trackMap[color], {
          "h-1.5": size === "sm",
          "h-2.5": size === "md",
          "h-4": size === "lg",
        })}
      >
        <div
          className={clsx(
            "h-full rounded-full",
            colorMap[color],
            animated &&
              "transition-all duration-700 ease-out"
          )}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}
