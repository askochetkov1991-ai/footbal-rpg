import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/utils";

const variants = {
  primary:
    "bg-orange-500 text-white hover:bg-orange-400 disabled:bg-orange-500/40",
  secondary:
    "bg-gray-700 text-white hover:bg-gray-600 disabled:bg-gray-700/40",
  ghost: "bg-transparent text-gray-200 hover:bg-white/5",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  full?: boolean;
  children: ReactNode;
};

export function Button({ variant = "primary", full, className, children, ...props }: Props) {
  return (
    <button
      className={cn(
        "rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed",
        variants[variant],
        full && "w-full",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
