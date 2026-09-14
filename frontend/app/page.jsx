import { Suspense } from "react";

import LoginScreen from "@/components/auth/LoginScreen";
import { PageLoader } from "@/components/common/States";

export const metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  // useSearchParams needs a Suspense boundary so this route can still be
  // statically rendered up to the boundary.
  return (
    <Suspense fallback={<PageLoader label="Loading" />}>
      <LoginScreen />
    </Suspense>
  );
}
