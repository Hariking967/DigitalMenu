"use client";

import React from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ChevronDownIcon, LogOut, List, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { data } = authClient.useSession();

  const navLinks = [
    { name: "Menu", href: "/menu", icon: <List className="h-4 w-4" /> },
    {
      name: "Orders",
      href: "/orders",
      icon: <ShoppingCart className="h-4 w-4" />,
    },
  ];

  return (
    <div className="fixed top-0 left-0 z-50 flex h-16 w-full items-center justify-between border-b border-blue-200 bg-gradient-to-br from-blue-100 via-blue-200 to-blue-400 px-4 md:px-8 shadow-lg backdrop-blur-md">
      {/* Nav Links */}
      <div className="flex gap-2 md:gap-3">
        {navLinks.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "group relative flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300",
                "hover:bg-blue-700 hover:text-white hover:shadow-md",
                active
                  ? "bg-blue-600 text-white shadow-md border border-blue-400"
                  : "text-blue-700 border border-blue-200"
              )}
            >
              {link.icon}
              <span>{link.name}</span>
              <span
                className={cn(
                  "pointer-events-none absolute inset-x-2 -bottom-[6px] h-[2px] rounded-full transition-all duration-300",
                  active
                    ? "bg-blue-600 opacity-100"
                    : "bg-blue-400 opacity-0 group-hover:opacity-100"
                )}
              />
            </Link>
          );
        })}
      </div>

      {/* Username with Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex items-center gap-2 rounded-xl bg-blue-100 px-4 py-2 text-sm font-bold text-blue-700 shadow-md transition",
              "hover:bg-blue-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            )}
          >
            <span className="max-w-[140px] truncate">
              {data?.user.name ?? "Guest"}
            </span>
            <ChevronDownIcon className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={8}
          className={cn(
            "w-48 rounded-xl border border-blue-200 bg-white p-2 shadow-xl",
            "animate-in fade-in-0 zoom-in-95",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
          )}
        >
          <DropdownMenuItem
            className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-red-600 transition hover:bg-blue-50"
            onClick={() => {
              authClient.signOut({
                fetchOptions: {
                  onSuccess: () => router.push("/auth/sign-in"),
                },
              });
            }}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
