import { cn } from "@heroui/react";

export default function Page({ children, className }) {
  return <div className={cn("w-full h-full pb-32", className)}>{children}</div>;
}
