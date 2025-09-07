import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { db } from "@/db";
import { menu } from "@/db/schema";
import { category } from "@/db/schema";
import { eq, like, desc } from "drizzle-orm";
import { z } from "zod";
import { nanoid } from "nanoid";

export const menuRouter = createTRPCRouter({
  // Get all menu items
  getAll: protectedProcedure.query(async () => {
    const data = await db.select().from(menu).orderBy(desc(menu.id)); // Could also orderBy createdAt if exists
    return data;
  }),

  // Get menu items by name (case-insensitive partial match)
  getByName: protectedProcedure
    .input(z.string().min(1, "Name is required"))
    .query(async ({ input }) => {
      const data = await db
        .select()
        .from(menu)
        .where(like(menu.name, `%${input}%`));
      return data;
    }),

  // Create a menu item
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required"),
        price: z.string().min(1, "Price is required"), // text in DB
        discount: z.coerce.number().default(0), // integer
        orderCount: z.coerce.number().default(0), // integer
        category: z.string().min(1, "Category is required"), // FK reference
      })
    )
    .mutation(async ({ input }) => {
      const [newMenuItem] = await db
        .insert(menu)
        .values({
          id: nanoid(),
          ...input,
        })
        .returning();
      return newMenuItem;
    }),

  // Update a menu item
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        price: z.string().optional(),
        discount: z.coerce.number().optional(),
        orderCount: z.coerce.number().optional(),
        category: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...rest } = input;
      const [updatedMenuItem] = await db
        .update(menu)
        .set(rest)
        .where(eq(menu.id, id))
        .returning();
      return updatedMenuItem;
    }),

  // Delete a menu item
  delete: protectedProcedure
    .input(z.string().min(1, "ID is required"))
    .mutation(async ({ input }) => {
      const [deletedMenuItem] = await db
        .delete(menu)
        .where(eq(menu.id, input))
        .returning();
      return deletedMenuItem;
    }),

  // ----------------------
  // Category Operations
  // ----------------------
  getManyCategories: protectedProcedure.query(async () => {
    const data = await db.select().from(category).orderBy(desc(category.id));
    return data;
  }),

  getCategoryById: protectedProcedure
    .input(z.string().min(1, "ID is required"))
    .query(async ({ input }) => {
      const [cat] = await db
        .select()
        .from(category)
        .where(eq(category.id, input));
      return cat;
    }),

  createCategory: protectedProcedure
    .input(
      z.object({
        category: z.string().min(1, "Category name is required"),
      })
    )
    .mutation(async ({ input }) => {
      const [newCategory] = await db
        .insert(category)
        .values({ id: nanoid(), category: input.category })
        .returning();
      return newCategory;
    }),
});
