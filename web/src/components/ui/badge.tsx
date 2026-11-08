import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Chip: subtle pill, status dot, ink label.
 * Tone variants draw a coloured dot instead of tinting the whole chip, so a table full of them stays calm.
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-[3px] text-[12px] font-medium leading-[18px] text-text [&_svg]:size-3",
  {
    variants: {
      variant: {
        neutral: "bg-surface-2",
        outline: "border border-line bg-surface py-[2px] text-text-2",
        accent: "bg-accent-subtle",
        success: "bg-surface-2 before:content-[''] before:dot before:bg-dot-ok",
        warning: "bg-surface-2 before:content-[''] before:dot before:bg-dot-warn",
        critical: "bg-critical/10 text-critical before:content-[''] before:dot before:bg-dot-flag",
        info: "bg-surface-2 before:content-[''] before:dot before:bg-dot-info",
        mono: "bg-surface-2 px-2 font-mono text-[11px] tracking-[0.02em]",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
