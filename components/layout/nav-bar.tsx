// components/layout/Navbar.tsx
'use client';

import { useSession, signOut } from "next-auth/react";
import Link from 'next/link';
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Avatar,
} from "@nextui-org/react";
import { LogOut, Settings, CreditCard, Home, Mail } from "lucide-react";

export default function AdminNavbar() {
  const { data: session } = useSession();

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: '/login' });
  };

  return (
    <Navbar isBordered maxWidth="full" className="sm:px-4">
      <NavbarBrand>
        <Link href="/" className="font-bold text-inherit">
          SAdmin
        </Link>
      </NavbarBrand>

      <NavbarContent justify="end">
        <Dropdown placement="bottom-end">
          <DropdownTrigger>
            <Avatar
              as="button"
              className="transition-transform"
              size="sm"
              name={session?.user?.name || 'Admin'}
              showFallback
            />
          </DropdownTrigger>
          <DropdownMenu aria-label="Profile Actions">
            <DropdownItem key="profile" className="h-14 gap-2">
              <p className="font-semibold">Signed in as</p>
              <p className="font-semibold">{session?.user?.email}</p>
            </DropdownItem>
            <DropdownItem
              key="dashboard"
              startContent={<Home size={16} />}
              as={Link}
              href="/"
            >
              Dashboard
            </DropdownItem>
            <DropdownItem
              key="subscriptions"
              startContent={<CreditCard size={16} />}
              as={Link}
              href="/subscriptions"
            >
              Subscriptions
            </DropdownItem>
            <DropdownItem
              key="email"
              startContent={<Mail size={16} />}
              as={Link}
              href="/email"
            >
              Send Emails
            </DropdownItem>
            <DropdownItem
              key="logout"
              color="danger"
              startContent={<LogOut size={16} />}
              onPress={handleLogout}
            >
              Log Out
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </NavbarContent>
    </Navbar>
  );
}