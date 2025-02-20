
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { Link } from "@nextui-org/react";


export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="h-screen overflow-y-hidden relative">
      <div className="absolute left-8 top-8 flex cursor-pointer items-center w-fit px-4 py-2 hover:bg-zinc-200 hover:px-4 hover:py-2 hover:rounded-full">
        <Link href="/" className="gap-2">
          <ArrowLeftIcon className="h-5 w-5 font-bold" />
          <p className="font-semibold">Go back Home</p>
        </Link>
      </div>
      {children}
    </div>
  );
}
