"use client";

import { HeroUIProvider } from "@heroui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ThemeProvider } from "next-themes";
import { useState } from "react";

import { AuthProvider } from "@/hooks/useAuth";

import { PwaProvider } from "./PwaProvider";
import { ToastProvider } from "./ToastProvider";

export default function Providers({ children }) {
  const router = useRouter();
  // Created per mount so a server render never shares a cache between requests.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            staleTime: 60_000,
          },
        },
      })
  );

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <HeroUIProvider navigate={(href) => router.push(href)} useHref={(href) => href}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ToastProvider>
              <PwaProvider>{children}</PwaProvider>
            </ToastProvider>
          </AuthProvider>
        </QueryClientProvider>
      </HeroUIProvider>
    </ThemeProvider>
  );
}
