import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** Pill button. Primary = ink, secondary = 1.5px ink outline, icon buttons = round white with a hairline. */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full font-medium leading-none transition-[background-color,border-color,color,opacity] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-accent text-accent-fg hover:bg-accent-hover disabled:bg-surface-2 disabled:text-text-2 disabled:opacity-100",
        secondary: "border-[1.5px] border-line-strong bg-transparent text-text hover:bg-text/[0.04]",
        ghost: "text-text-2 hover:bg-surface-2 hover:text-text",
        destructive: "border-[1.5px] border-critical/50 bg-transparent text-critical hover:bg-critical/[0.06]",
        brand: "bg-brand text-white hover:brightness-95",
        link: "rounded-none px-0 text-text underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-3.5 text-caption [&_svg]:size-3.5",
        md: "h-10 px-[18px] text-caption [&_svg]:size-4",
        lg: "h-11 px-[22px] text-body [&_svg]:size-4",
        icon: "size-10 [&_svg]:size-[18px]",
        "icon-sm": "size-8 [&_svg]:size-4",
      },
    },
    compoundVariants: [
      { variant: "secondary", size: ["icon", "icon-sm"], className: "border border-line bg-surface hover:bg-surface-2" },
      { variant: "ghost", size: ["icon", "icon-sm"], className: "text-text" },
    ],
    defaultVariants: { variant: "secondary", size: "md" },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, disabled, ...props }, ref) => {
    if (asChild) {
      return (
        <Slot className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}>
          {children}
        </Slot>
      );
    }
    return (
      <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} disabled={disabled || loading} {...props}>
        {loading ? <Loader2 className="animate-spin" /> : null}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
