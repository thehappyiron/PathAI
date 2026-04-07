"use client";

import React from "react";
import clsx from "clsx";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 font-body font-semibold rounded-pill transition-all duration-300 cursor-pointer select-none",
        {
          // Variants
          "bg-accent-gold text-white hover:bg-accent-gold-dark hover:shadow-gold active:scale-[0.98]":
            variant === "primary",
          "bg-transparent text-ink border border-border-strong hover:bg-ink hover:text-white hover:border-ink":
            variant === "secondary",
          "bg-transparent text-ink-muted hover:text-ink hover:bg-black/[0.04]":
            variant === "ghost",
          "bg-accent-crimson text-white hover:bg-red-800":
            variant === "danger",
          // Sizes
          "text-sm px-5 py-2.5": size === "sm",
          "text-body px-8 py-3.5": size === "md",
          "text-lg px-10 py-4": size === "lg",
          // States
          "opacity-50 pointer-events-none": disabled || loading,
        },
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            className="opacity-25"
          />
          <path
            d="M4 12a8 8 0 018-8"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            className="opacity-75"
          />
        </svg>
      ) : (
        icon
      )}
      {children}
    </button>
  );
}
