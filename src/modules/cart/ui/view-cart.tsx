"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTRPC } from "@/trpc/client";
import { QueryClient } from "@tanstack/react-query";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ViewCart() {
  const router = useRouter();
  const trpc = useTRPC();
  const [cart, setCart] = useState<{ item: string; quantity: number }[]>([]);
  const [items, setItems] = useState<Record<string, { name: string }>>({});

  // Load cart from localStorage and fetch item names
  useEffect(() => {
    const loadCart = async () => {
      const cartStr = localStorage.getItem("cart");
      const cartArr: { item: string; quantity: number }[] = cartStr
        ? JSON.parse(cartStr)
        : [];
      setCart(cartArr);
      // Fetch all item names in parallel using queryOptions and queryClient
      const queryClient = new QueryClient();
      const promises = cartArr.map(async (cartItem) => {
        const queryOptions = trpc.cart.getMenuItemById.queryOptions({
          id: cartItem.item,
        });
        const data = await queryClient.fetchQuery(queryOptions);
        return { id: cartItem.item, name: data?.name ?? "Unknown" };
      });
      const results = await Promise.all(promises);
      const itemsObj: Record<string, { name: string }> = {};
      results.forEach(({ id, name }) => {
        itemsObj[id] = { name };
      });
      setItems(itemsObj);
    };
    loadCart();
    // Listen for cart changes from other tabs/windows
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "cart") loadCart();
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [trpc]);

  // updateCart logic from home-view.tsx
  const updateCart = useCallback((item: string, change: number) => {
    const cartStr = localStorage.getItem("cart");
    const cartArr: { item: string; quantity: number }[] = cartStr
      ? JSON.parse(cartStr)
      : [];
    const idx = cartArr.findIndex((cart_item) => cart_item.item === item);
    if (idx !== -1) {
      const new_quantity = cartArr[idx].quantity + change;
      if (new_quantity <= 0) {
        cartArr.splice(idx, 1);
      } else {
        cartArr[idx].quantity = new_quantity;
      }
    } else if (change > 0) {
      cartArr.push({ item, quantity: change });
    }
    localStorage.setItem("cart", JSON.stringify(cartArr));
    setCart(cartArr);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-200 to-blue-400 flex flex-col items-center py-10 px-2">
      <h1 className="text-3xl font-bold mb-8 text-blue-900 drop-shadow-lg">
        Your Cart
      </h1>
      <div className="w-full max-w-xl space-y-6">
        {cart.length === 0 ? (
          <Card className="bg-blue-50 border-blue-200 text-blue-700 shadow-md">
            <CardHeader>
              <CardTitle>Your cart is empty</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-blue-500">
                Browse the menu and add items to your cart!
              </p>
            </CardContent>
          </Card>
        ) : (
          cart.map((cartItem) => (
            <Card
              key={cartItem.item}
              className="bg-blue-50 border-blue-300 shadow-lg"
            >
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-blue-900 text-lg">
                  {items[cartItem.item]?.name ?? "Loading..."}
                </CardTitle>
                <div className="flex gap-2 items-center">
                  <Button
                    variant="outline"
                    className="border-blue-400 text-blue-700"
                    onClick={() => updateCart(cartItem.item, -1)}
                  >
                    -
                  </Button>
                  <span className="font-bold text-blue-800 px-2">
                    {cartItem.quantity}
                  </span>
                  <Button
                    variant="outline"
                    className="border-blue-400 text-blue-700"
                    onClick={() => updateCart(cartItem.item, 1)}
                  >
                    +
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>
      <div className="flex gap-4 mt-12 w-full max-w-xl justify-between">
        <Button
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl shadow-xl"
          onClick={() => router.push("/menu")}
        >
          Browse Menu
        </Button>
        <Button
          className="bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold px-6 py-3 rounded-xl shadow-xl"
          onClick={() => {}}
        >
          Proceed Payment
        </Button>
      </div>
    </div>
  );
}
