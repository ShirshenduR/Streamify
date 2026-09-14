import AppShell from "@/components/layout/AppShell";
import AuthGate from "@/components/layout/AuthGate";
import { PlayerProvider } from "@/hooks/usePlayer";

export default function AppLayout({ children }) {
  return (
    <AuthGate>
      <PlayerProvider>
        <AppShell>{children}</AppShell>
      </PlayerProvider>
    </AuthGate>
  );
}
