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
    let cart: { item: string; quantity: number }[] = cartStr
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
        let cart: { item: string; quantity: number }[] = cartStr
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
    <div className="w-full max-w-3xl mx-auto py-8">
      {categories.length === 0 ? (
        <div className="text-center text-sm text-muted-foreground">
          No categories found
        </div>
      ) : (
        categories.map((cat) => (
          <div key={cat.id} className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg font-semibold">{cat.name}</span>
              <span className="text-muted-foreground">▼</span>
            </div>
            {cat.items.length === 0 ? (
              <div className="text-sm text-muted-foreground ml-4">
                No items in this category
              </div>
            ) : (
              <div className="space-y-2 ml-4">
                {cat.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center border rounded-md p-3"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {item.price} • discount: {item.discount ?? 0}
                      </span>
                    </div>
                    <div className="flex gap-2 items-center">
                      {quantities[item.id] ? (
                        <>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => handleDec(item.id)}
                          >
                            -
                          </Button>
                          <span className="px-2 font-semibold">
                            {quantities[item.id]}
                          </span>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => handleInc(item.id)}
                          >
                            +
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="default"
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
