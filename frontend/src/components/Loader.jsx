import { Spinner } from "@heroui/react";

export default function Loader() {
  return (
    <div className="w-full h-screen grid items-center justify-center">
      <Spinner />
    </div>
  );
}
