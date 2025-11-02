import { Tab, Tabs } from "@heroui/react";
import { HomeIcon, LibraryBigIcon, SearchIcon, UserIcon } from "lucide-react";
import { useLocation } from "react-router-dom";

export default function BottomMenu() {
  const { pathname } = useLocation();
  return (
    <Tabs
      classNames={{
        base: "w-full flex lg:hidden p-2 border-t-1 border-t-content2",
        tabList: "w-full rounded-none bg-transparent",
        cursor: "rounded-none shadow-none",
      }}
      variant="light"
      aria-label="Options"
      selectedKey={pathname}
    >
      <Tab key="/home" title={<HomeIcon />} href="home" />
      <Tab key="/search" title={<SearchIcon />} href="search" />
      <Tab key="/library" title={<LibraryBigIcon />} href="library" />
      <Tab key="/profile" title={<UserIcon />} href="profile" />
    </Tabs>
  );
}
