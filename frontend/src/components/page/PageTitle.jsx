import { cn } from "@heroui/react";

export default function PageTitle({ children, className }) {
  return <h2 className={cn("text-xl font-semibold mb-8", className)}>{children}</h2>;
}
