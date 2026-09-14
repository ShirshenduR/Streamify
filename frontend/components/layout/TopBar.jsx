"use client";

import {
  Avatar,
  cn,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/react";
import { Download, LibraryBig, LogOut, Search, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import Logo from "@/components/common/Logo";
import ThemeToggle from "@/components/common/ThemeToggle";
import { usePwa } from "@/components/providers/PwaProvider";
import { useAuth } from "@/hooks/useAuth";
import { initialsOf } from "@/lib/format";
import SearchField from "./SearchField";

function ProfileMenu() {
  const { user, signOut } = useAuth();
  const { canInstall, promptInstall } = usePwa();
  const router = useRouter();

  return (
    <Dropdown
      placement="bottom-end"
      classNames={{ content: "glass" }}
      showArrow={false}
      offset={10}
    >
      <DropdownTrigger>
        <button
          type="button"
          aria-label="Account menu"
          className="rounded-full outline-none transition hover:opacity-90"
        >
          <Avatar
            isBordered
            size="sm"
            src={user?.photoURL || undefined}
            name={initialsOf(user?.displayName || user?.email || "?")}
            className="size-8 text-tiny"
          />
        </button>
      </DropdownTrigger>
      <DropdownMenu aria-label="Account" variant="flat" className="max-w-[260px]">
        <DropdownItem key="account" isReadOnly className="h-auto gap-1 py-2 opacity-100">
          <p className="text-xs font-medium text-foreground-500">Signed in as</p>
          <p className="truncate text-sm font-semibold">{user?.email}</p>
        </DropdownItem>
        <DropdownItem key="profile" as={Link} href="/profile" startContent={<User />}>
          Profile &amp; stats
        </DropdownItem>
        <DropdownItem key="library" as={Link} href="/library" startContent={<LibraryBig />}>
          Library
        </DropdownItem>
        {canInstall ? (
          <DropdownItem key="install" onPress={promptInstall} startContent={<Download />}>
            Install app
          </DropdownItem>
        ) : null}
        <DropdownItem
          key="logout"
          color="danger"
          className="text-danger"
          startContent={<LogOut />}
          onPress={async () => {
            await signOut();
            router.replace("/");
          }}
        >
          Log out
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
}

export default function TopBar({ className }) {
  return (
    <header
      className={cn(
        "glass-bar z-40 flex h-14 shrink-0 items-center gap-3 px-3 sm:h-16 sm:px-5 lg:px-6",
        className
      )}
    >
      <Link href="/home" className="flex items-center gap-2.5 lg:hidden">
        <Logo size={22} showWordmark={false} />
        <span className="text-[15px] font-bold tracking-tight">Streamify</span>
      </Link>

      <SearchField className="hidden flex-1 lg:block lg:max-w-xl" />

      <div className="ml-auto flex items-center gap-1">
        <Link
          href="/search"
          aria-label="Search"
          className="grid size-9 place-items-center rounded-full text-foreground-500 transition hover:bg-white/10 hover:text-foreground lg:hidden"
        >
          <Search className="size-4" />
        </Link>
        <ThemeToggle />
        <ProfileMenu />
      </div>
    </header>
  );
}
