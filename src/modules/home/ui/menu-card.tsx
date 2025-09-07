import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

// Types
interface MenuItem {
  id: string;
  name: string;
  price: string;
  discount: number;
  orderCount: number;
  category: string;
}
interface Category {
  id: string;
  category: string;
}

interface Props {
  updateCart: (item: string, change: number) => void;
}

export default function MenuCard({ updateCart }: Props) {
  const trpc = useTRPC();
  const { data: menuItems } = useSuspenseQuery(trpc.menu.getAll.queryOptions());
  const { data: categoriesDataRaw } = useSuspenseQuery(
    trpc.menu.getManyCategories.queryOptions()
  );
  const categoriesData = (
    Array.isArray(categoriesDataRaw) ? categoriesDataRaw : []
  ) as Category[];

  // Track quantity for each menu item, sync with localStorage cart
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // Sync quantities with localStorage cart on mount and when cart changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    const cartStr = localStorage.getItem("cart");
    const cart: { item: string; quantity: number }[] = cartStr
      ? JSON.parse(cartStr)
      : [];
    const newQuantities: Record<string, number> = {};
    cart.forEach(({ item, quantity }) => {
      newQuantities[item] = quantity;
    });
    setQuantities(newQuantities);
    // Listen for cart changes from other tabs/windows
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "cart") {
        const cartStr = e.newValue;
        const cart: { item: string; quantity: number }[] = cartStr
          ? JSON.parse(cartStr)
          : [];
        const newQuantities: Record<string, number> = {};
        cart.forEach(({ item, quantity }) => {
          newQuantities[item] = quantity;
        });
        setQuantities(newQuantities);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Group menu items by category
  const categories = useMemo(() => {
    const map: Record<string, MenuItem[]> = {};
    (menuItems ?? []).forEach((item: MenuItem) => {
      const cat = item.category ?? "Uncategorized";
      if (!map[cat]) map[cat] = [];
      map[cat].push(item);
    });
    return Object.entries(map).map(([id, items]) => ({
      id,
      name: categoriesData.find((c) => c.id === id)?.category || id,
      items,
    }));
  }, [menuItems, categoriesData]);

  // Handlers
  const handleAdd = (id: string) => {
    setQuantities((prev) => ({ ...prev, [id]: 1 }));
    updateCart(id, 1);
  };
  const handleInc = (id: string) => {
    setQuantities((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    updateCart(id, 1);
  };
  const handleDec = (id: string) => {
    setQuantities((prev) => {
      const qty = (prev[id] || 0) - 1;
      if (qty <= 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: qty };
    });
    updateCart(id, -1);
  };

  return (
    <div className="w-full max-w-3xl mx-auto py-8 bg-gradient-to-br from-blue-100 via-blue-200 to-blue-400 rounded-xl shadow-xl border border-blue-200">
      {categories.length === 0 ? (
        <div className="text-center text-sm text-blue-700">
          No categories found
        </div>
      ) : (
        categories.map((cat) => (
          <div key={cat.id} className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg font-semibold text-blue-900">
                {cat.name}
              </span>
              <span className="text-blue-400">▼</span>
            </div>
            {cat.items.length === 0 ? (
              <div className="text-sm text-blue-500 ml-4">
                No items in this category
              </div>
            ) : (
              <div className="space-y-2 ml-4">
                {cat.items.map((item) => (
                  <div
                    key={item.id}
                    className="relative flex items-center justify-between border border-blue-300 rounded-xl p-4 bg-blue-50 shadow-md"
                  >
                    {/* Discount box */}
                    {item.discount > 0 && (
                      <div className="absolute -top-3 -right-3 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded shadow-lg">
                        {item.discount}% OFF
                      </div>
                    )}
                    {/* Card layout: left=name, middle=price, right=controls */}
                    <span className="font-medium text-blue-900 w-1/3 truncate">
                      {item.name}
                    </span>
                    <span className="text-blue-700 w-1/3 text-center">
                      {item.price}
                    </span>
                    <div className="flex gap-2 items-center w-1/3 justify-end">
                      {quantities[item.id] ? (
                        <>
                          <Button
                            size="icon"
                            variant="outline"
                            className="border-blue-400 text-blue-700 hover:bg-blue-700 hover:text-white"
                            onClick={() => handleDec(item.id)}
                          >
                            -
                          </Button>
                          <span className="px-2 font-semibold text-blue-800">
                            {quantities[item.id]}
                          </span>
                          <Button
                            size="icon"
                            variant="outline"
                            className="border-blue-400 text-blue-700 hover:bg-blue-700 hover:text-white"
                            onClick={() => handleInc(item.id)}
                          >
                            +
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="default"
                          className="bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold shadow-lg hover:bg-blue-700"
                          onClick={() => handleAdd(item.id)}
                        >
                          Add
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
