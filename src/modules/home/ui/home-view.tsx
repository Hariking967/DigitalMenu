"use client";

import React, { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Search from "./search";
import Popular from "./popular";
import MenuCard from "./menu-card";
import { Button } from "@/components/ui/button";

export default function HomeView() {
  const router = useRouter();
  const { data, isPending } = authClient.useSession();

  // Track cart length for View Cart button
  const [cartLength, setCartLength] = useState(0);

  useEffect(() => {
    if (!localStorage.getItem("cart")) {
      localStorage.setItem("cart", JSON.stringify([]));
    }

    const cartStr = localStorage.getItem("cart");
    setCartLength(cartStr ? JSON.parse(cartStr).length : 0);
    // Listen for cart changes from other tabs/windows
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "cart") {
        const cartStr = e.newValue;
        setCartLength(cartStr ? JSON.parse(cartStr).length : 0);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Update cart length after every updateCart call
  const updateCart = (item: string, change: number) => {
    if (typeof window === "undefined") return;
    const cartStr = localStorage.getItem("cart");
    let cart: { item: string; quantity: number }[] = cartStr
      ? JSON.parse(cartStr)
      : [];
    const idx = cart.findIndex((cart_item) => cart_item.item === item);

    if (idx !== -1) {
      const new_quantity = cart[idx].quantity + change;
      if (new_quantity <= 0) {
        cart.splice(idx, 1);
      } else {
        cart[idx].quantity = new_quantity;
      }
    } else if (change > 0) {
      cart.push({ item, quantity: change });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    setCartLength(cart.length);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-200 to-blue-400 flex flex-col items-center py-10 px-2">
      <div className="w-full max-w-3xl">
        <Search />
        <Popular />
        <MenuCard updateCart={updateCart} />
      </div>
      {cartLength > 0 && (
        <Button
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 px-8 py-3 text-lg font-semibold shadow-lg bg-gradient-to-r from-blue-500 to-blue-700 border border-blue-400 text-white hover:bg-blue-700"
          variant="default"
          onClick={() => router.push("/cart")}
        >
          View Cart <span className="ml-2 text-blue-100">({cartLength})</span>
        </Button>
      )}
    </div>
  );
}
