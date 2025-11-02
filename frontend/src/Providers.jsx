import { HeroUIProvider } from "@heroui/react";
import { ThemeProvider } from "next-themes";
import { useHref, useNavigate } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";

export default function Providers({ children }) {
  const navigate = useNavigate();

  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
      <HeroUIProvider navigate={navigate} useHref={useHref}>
        <AuthProvider>{children}</AuthProvider>
      </HeroUIProvider>
    </ThemeProvider>
  );
}
