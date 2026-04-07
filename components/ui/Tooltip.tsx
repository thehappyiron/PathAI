"use client";

import React, { useState } from "react";
import clsx from "clsx";

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export default function Tooltip({
  children,
  content,
  position = "top",
  className,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className={clsx("relative inline-flex", className)}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          className={clsx(
            "absolute z-50 px-3 py-1.5 text-xs text-white bg-ink rounded-lg font-body whitespace-nowrap",
            "animate-fade-in pointer-events-none",
            {
              "bottom-full left-1/2 -translate-x-1/2 mb-2": position === "top",
              "top-full left-1/2 -translate-x-1/2 mt-2": position === "bottom",
              "right-full top-1/2 -translate-y-1/2 mr-2": position === "left",
              "left-full top-1/2 -translate-y-1/2 ml-2": position === "right",
            }
          )}
        >
          {content}
          <div
            className={clsx("absolute w-2 h-2 bg-ink rotate-45", {
              "top-full left-1/2 -translate-x-1/2 -mt-1": position === "top",
              "bottom-full left-1/2 -translate-x-1/2 mb-0 -mb-1":
                position === "bottom",
              "left-full top-1/2 -translate-y-1/2 -ml-1": position === "left",
              "right-full top-1/2 -translate-y-1/2 -mr-1": position === "right",
            })}
          />
        </div>
      )}
    </div>
  );
}
