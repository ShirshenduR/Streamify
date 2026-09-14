"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { PageLoader } from "@/components/common/States";
import SetupNotice from "@/components/common/SetupNotice";
import { useAuth } from "@/hooks/useAuth";

export default function AuthGate({ children }) {
  const { status, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "ready" && !user) {
      const next = pathname && pathname !== "/" ? `?next=${encodeURIComponent(pathname)}` : "";
      router.replace(`/${next}`);
    }
  }, [status, user, router, pathname]);

  if (status === "unconfigured") return <SetupNotice />;
  if (status === "loading") return <PageLoader label="Starting Streamify" />;
  if (!user) return <PageLoader label="Redirecting to sign in" />;

  return children;
}
