import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

interface MenuItem {
  id: string;
  name: string;
  price: string;
  discount: number;
  orderCount: number;
  category: string;
}

export default function Search({
  updateCart,
}: {
  updateCart: (item: string, change: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const trpc = useTRPC();
  const { data: menuItems } = useSuspenseQuery(trpc.menu.getAll.queryOptions());

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

  // Filter menu items by query
  const filteredItems = (menuItems ?? []).filter((item: MenuItem) =>
    item.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      <Button
        className="mb-4 bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold shadow-lg hover:bg-blue-700"
        onClick={() => setOpen(true)}
      >
        Search Menu
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-900/40">
          <div className="bg-gradient-to-br from-blue-100 via-blue-200 to-blue-400 rounded-xl shadow-xl border border-blue-200 w-full max-w-lg p-6 relative">
            <button
              className="absolute top-2 right-2 text-blue-700 hover:text-blue-900 text-xl font-bold"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="text-xl font-bold text-blue-900 mb-4 text-center">
              Search Menu Items
            </h2>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type item name..."
              className="w-full mb-6 px-4 py-2 rounded-lg border border-blue-300 bg-blue-50 text-blue-900 focus:border-blue-400"
              autoFocus
            />
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredItems.length === 0 ? (
                <div className="text-center text-blue-700">No items found</div>
              ) : (
                filteredItems.map((item: MenuItem) => (
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
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
