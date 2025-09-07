"use client";

import React from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Search from "./search";
import Popular from "./popular";
import MenuCard from "./menu-card";

export default function HomeView() {
  const router = useRouter();
  const { data, isPending } = authClient.useSession();

  return (
    <>
      <Search />
      <Popular />
      <MenuCard />
    </>
  );
}
