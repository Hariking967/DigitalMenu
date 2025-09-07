"use client";

import React, { useMemo, useState } from "react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, Plus, OctagonAlertIcon } from "lucide-react";
import {
  useQueryClient,
  useSuspenseQuery,
  useMutation,
} from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertTitle } from "@/components/ui/alert";

const editSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  price: z.string().min(1, "Price is required"),
  discount: z.coerce.number().min(0),
  orderCount: z.coerce.number().min(0),
  category: z.string().min(1, "Category is required"),
});

type EditForm = z.infer<typeof editSchema>;
type CategoryType = { id: string; category: string }[];
type MenuItemType = {
  id: string;
  name: string;
  price: string;
  discount: number;
  orderCount: number;
  category: string;
};

export default function MenuManager() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: menuItems } = useSuspenseQuery(trpc.menu.getAll.queryOptions());
  const { data: categoriesDataRaw } = useSuspenseQuery(
    trpc.menu.getManyCategories.queryOptions()
  );
  const categoriesData = (
    Array.isArray(categoriesDataRaw) ? categoriesDataRaw : []
  ) as CategoryType;

  const createMutation = useMutation(
    trpc.menu.create.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries(trpc.menu.getAll.queryOptions()),
      onError: (err) => console.error("Create error:", err),
    })
  );

  const updateMutation = useMutation(
    trpc.menu.update.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries(trpc.menu.getAll.queryOptions()),
      onError: (err) => console.error("Update error:", err),
    })
  );

  const deleteMutation = useMutation(
    trpc.menu.delete.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries(trpc.menu.getAll.queryOptions()),
      onError: (err) => console.error("Delete error:", err),
    })
  );

  const createCategoryMutation = useMutation(
    trpc.menu.createCategory.mutationOptions({
      onSuccess: async (newCat) => {
        await queryClient.invalidateQueries(
          trpc.menu.getManyCategories.queryOptions()
        );
        form.setValue("category", newCat.id); // auto-select new category
      },
      onError: (err) => alert(err ?? "Failed to create category"),
    })
  );

  const categories = useMemo(() => {
    const map: Record<
      string,
      {
        id: string;
        name: string;
        price: string;
        discount: number;
        orderCount: number;
        category: string;
      }[]
    > = {};
    (menuItems ?? []).forEach(
      (item: {
        id: string;
        name: string;
        price: string;
        discount: number;
        orderCount: number;
        category: string;
      }) => {
        const cat = item.category ?? "Uncategorized";
        if (!map[cat]) map[cat] = [];
        map[cat].push(item);
      }
    );
    return Object.entries(map).map(([name, items]) => ({ name, items }));
  }, [menuItems]);

  const [editingItem, setEditingItem] = useState<
    ({ isNew?: boolean } & Partial<MenuItemType>) | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const form = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      id: "",
      name: "",
      price: "",
      discount: 0,
      orderCount: 0,
      category: "",
    },
  });

  const openCreate = () => {
    setError(null);
    // Set default category to first in the list if available
    const defaultCategory =
      categoriesData.length > 0 ? categoriesData[0].id : "";
    setEditingItem({ isNew: true });
    form.reset({
      id: "",
      name: "",
      price: "",
      discount: 0,
      orderCount: 0,
      category: defaultCategory,
    });
  };

  const openEdit = (item: {
    id: string;
    name: string;
    price: string;
    discount: number;
    orderCount: number;
    category: string;
  }) => {
    setError(null);
    setEditingItem(item);
    form.reset({
      id: item.id,
      name: item.name ?? "",
      price: item.price ?? "",
      discount: item.discount ?? 0,
      orderCount: item.orderCount ?? 0,
      category:
        item.category ??
        (categoriesData.length > 0 ? categoriesData[0].id : ""),
    });
  };

  const onUpdate = async (values: EditForm) => {
    try {
      setError(null);
      setLoading(true);
      await updateMutation.mutateAsync(values);
      setEditingItem(null);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      setError(null);
      setLoading(true);
      await deleteMutation.mutateAsync(id);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const onCreate = async (values: Omit<EditForm, "id">) => {
    try {
      setError(null);
      setLoading(true);
      await createMutation.mutateAsync(values);
      setEditingItem(null);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    if (newCategoryName.trim()) {
      setShowCategoryDialog(false); // Close dialog immediately
      const newCat = await createCategoryMutation.mutateAsync({
        category: newCategoryName.trim(),
      });
      setNewCategoryName("");
      form.setValue("category", newCat.id); // select new category
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Menu Manager</h1>
        <Button onClick={openCreate} variant="outline" size="sm">
          <Plus className="mr-2 h-4 w-4" /> New Item
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent>
          {categoriesData.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground">
              No categories found
            </div>
          ) : (
            categoriesData.map((cat) => {
              const items = (menuItems ?? []).filter(
                (item: {
                  id: string;
                  name: string;
                  price: string;
                  discount: number;
                  orderCount: number;
                  category: string;
                }) => item.category === cat.id
              );
              return (
                <div key={cat.id} className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg font-semibold">
                      {cat.category}
                    </span>
                    <span className="text-muted-foreground">▼</span>
                  </div>
                  {items.length === 0 ? (
                    <div className="text-sm text-muted-foreground ml-4">
                      No items in this category
                    </div>
                  ) : (
                    <div className="space-y-2 ml-4">
                      {items.map(
                        (item: {
                          id: string;
                          name: string;
                          price: string;
                          discount: number;
                          orderCount: number;
                          category: string;
                        }) => (
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
                            <div className="flex gap-2">
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => openEdit(item)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="destructive"
                                onClick={() => onDelete(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem?.isNew ? "Create Menu Item" : "Edit Menu Item"}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((vals: EditForm) => {
                if (editingItem?.isNew) {
                  const { id, ...rest } = vals;
                  return onCreate(rest);
                } else {
                  return onUpdate(vals);
                }
              })}
              className="space-y-4 mt-2"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Burger" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input placeholder="9.99" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="discount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount (%)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="orderCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order Count</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="border rounded-md p-2 w-full"
                        value={
                          field.value ||
                          (categoriesData.length > 0
                            ? categoriesData[0].id
                            : "")
                        }
                        onChange={(e) => {
                          field.onChange(e.target.value);
                        }}
                      >
                        {categoriesData.map(
                          (cat: { id: string; category: string }) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.category}
                            </option>
                          )
                        )}
                      </select>
                    </FormControl>
                    <div className="flex gap-2 mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowCategoryDialog(true)}
                      >
                        + Create Category
                      </Button>
                    </div>
                    <Dialog
                      open={showCategoryDialog}
                      onOpenChange={setShowCategoryDialog}
                    >
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create New Category</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Input
                            placeholder="Category name"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                          />
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              type="button"
                              onClick={() => setShowCategoryDialog(false)}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="button"
                              onClick={handleCreateCategory}
                              disabled={!newCategoryName.trim()}
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!!error && (
                <Alert className="bg-destructive/10 border-none">
                  <OctagonAlertIcon className="h-4 w-4 !text-destructive" />
                  <AlertTitle>{error}</AlertTitle>
                </Alert>
              )}

              <DialogFooter className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setEditingItem(null)}
                  type="button"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {editingItem?.isNew
                    ? loading
                      ? "Creating..."
                      : "Create"
                    : loading
                    ? "Updating..."
                    : "Update"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
