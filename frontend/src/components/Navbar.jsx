import { useAuth } from "@/hooks/useAuth";
import { usePlayer } from "@/hooks/usePlayer";
import { useSearchList } from "@/hooks/useSearch";
import {
  Autocomplete,
  AutocompleteItem,
  Avatar,
  cn,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Input,
  Link,
  Navbar,
  NavbarBrand,
  NavbarContent,
  Spinner,
} from "@heroui/react";
import { SearchIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";
import AppLogo from "./AppLogo";
import SongItem from "./SongItem";

export default function Appbar() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const { theme, setTheme } = useTheme();
  let searchList = useSearchList();
  const { playSong } = usePlayer();
  const searchMode = useMemo(() => pathname === "/search", [pathname]);

  const toggleTheme = useCallback(
    () => setTheme(theme === "light" ? "dark" : "light"),
    [theme, setTheme]
  );

  return (
    <Navbar
      isBordered
      maxWidth="full"
      className=""
      classNames={{ base: "h-14 md:h-16", wrapper: "px-4" }}
    >
      <NavbarBrand
        as={Link}
        href="home"
        className={cn("text-inherit", searchMode ? "hidden lg:inline-flex" : "")}
      >
        <AppLogo width={36} height={36} />
        <p className="ms-2 font-bold text-inherit">Streamify</p>
      </NavbarBrand>
      <NavbarContent
        className={cn("hidden lg:flex gap-4 flex-1", searchMode ? "flex" : "")}
        justify="center"
      >
        {searchMode ? (
          <Input
            aria-label="Type to search"
            value={searchList.filterText}
            onValueChange={searchList.setFilterText}
            placeholder="Type to search..."
            startContent={<SearchIcon />}
            isClearable
          />
        ) : (
          <Autocomplete
            aria-label="Type to search"
            inputValue={searchList.filterText}
            isLoading={searchList.isLoading}
            items={searchList.items}
            onInputChange={searchList.setFilterText}
            placeholder="Type to search..."
            startContent={<SearchIcon />}
            menuTrigger="input"
            shouldCloseOnBlur={false}
            classNames={{
              base: "hidden lg:flex max-w-full h-10",
              selectorButton: "hidden",
            }}
            disableSelectorIconRotation
            listboxProps={{
              emptyContent: searchList.isLoading ? (
                <div className="flex justify-center py-2">
                  <Spinner size="sm" aria-label="Searching" />
                </div>
              ) : searchList.items.length === 0 ? (
                <div className="py-2 text-center text-default-400 text-sm">No results found</div>
              ) : null,
            }}
          >
            {(song) => (
              <AutocompleteItem key={song.id} onPress={() => playSong(song)}>
                <SongItem song={song} />
              </AutocompleteItem>
            )}
          </Autocomplete>
        )}
      </NavbarContent>
      <NavbarContent
        as="div"
        justify="end"
        className={cn(searchMode ? "hidden lg:inline-flex" : "")}
      >
        <Dropdown placement="bottom-end">
          <DropdownTrigger className="cursor-pointer">
            <Avatar
              isBordered
              as="button"
              className="transition-transform"
              name={user?.displayName}
              size="sm"
              src={user?.photoURL || "https://randomuser.me/api/portraits/women/44.jpg"}
            />
          </DropdownTrigger>
          <DropdownMenu aria-label="Profile Actions" variant="flat">
            <DropdownItem key="profile" className="h-14 gap-2">
              <p className="font-semibold">Signed in as</p>
              <p className="font-semibold">{user.email}</p>
            </DropdownItem>
            <DropdownItem key="theme" onPress={toggleTheme}>
              Switch to {theme === "light" ? "Dark" : "Light"} theme
            </DropdownItem>
            <DropdownItem key="profile" as={Link} href="profile" className="text-inherit">
              Profile
            </DropdownItem>
            <DropdownItem key="library" as={Link} href="library" className="text-inherit">
              Library
            </DropdownItem>
            <DropdownItem key="logout" color="danger" onPress={() => logout()}>
              Log Out
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </NavbarContent>
    </Navbar>
  );
}
