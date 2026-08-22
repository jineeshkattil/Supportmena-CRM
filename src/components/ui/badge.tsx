import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring/30 focus:ring-offset-1",
  {
    variants: {
      variant: {
        default:
          "bg-primary/10 text-primary ring-1 ring-inset ring-primary/20 hover:bg-primary/15",
        secondary:
          "bg-muted text-foreground/70 ring-1 ring-inset ring-border",
        destructive:
          "bg-red-50 text-red-700 ring-1 ring-inset ring-red-100",
        outline:
          "text-foreground ring-1 ring-inset ring-border",
        success:
          "bg-green-50 text-green-700 ring-1 ring-inset ring-green-100",
        warning:
          "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-100",
        info:
          "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-100",
        purple:
          "bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-100",
        orange:
          "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
