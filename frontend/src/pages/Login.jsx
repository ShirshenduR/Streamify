import AppLogo from "@/components/AppLogo";
import { Google } from "@/components/icons/Google";
import { useAuth } from "@/hooks/useAuth";
import { auth, provider } from "@/utils/firebaseConfig";
import { Button, Link } from "@heroui/react";
import { signInWithPopup } from "firebase/auth";
import { useEffect, useMemo } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";

const Login = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = useMemo(() => searchParams.get("next") ?? "home", [searchParams]);

  useEffect(() => {
    if (user) {
      navigate(next, { replace: true });
    }
  }, [user, navigate]);

  const handleGoogleLogin = () => {
    signInWithPopup(auth, provider)
      .then((result) => {
        navigate(next, { replace: true });
      })
      .catch((error) => {
        console.error("Login Error:", error.message);
      });
  };

  if (user) {
    return <Navigate to={next} replace />;
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen text-center p-4">
      <div className="mb-6">
        <AppLogo />
      </div>
      <h1 className="text-4xl font-bold py-2 text-primary">Streamify</h1>
      <h2 className="text-xl font-semibold mb-8">Stream and Download millions of songs</h2>
      <Button onPress={handleGoogleLogin} variant="solid" color="primary" startContent={<Google />}>
        Continue with Google
      </Button>

      <footer className="absolute bottom-6 text-xs text-muted-foreground">
        <p>
          By continuing, you agree to our{" "}
          <Link href="/terms" className="text-xs">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-xs">
            Privacy Policy
          </Link>
        </p>
      </footer>
    </div>
  );
};

export default Login;
