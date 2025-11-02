import { useAuth } from "@/hooks/useAuth";
import { Avatar, Button } from "@heroui/react";
import { useNavigate } from "react-router-dom";

export default function Profile({ onPlaySong }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="w-full h-full">
      <div className="w-full max-w-md mx-auto flex flex-col items-center">
        <div className="flex flex-col items-center justify-center gap-4 mb-8">
          <Avatar className="w-28 h-28 text-large" isBordered src={user?.photoURL} />
          <div className="flex flex-col items-center gap-0.5">
            <p className="text-foreground text-xl font-bold mb-0.5">{user?.displayName}</p>
            <p className="text-foreground font-normal text-medium">{user?.email}</p>
          </div>
          <Button onPress={handleLogout} color="primary">
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
