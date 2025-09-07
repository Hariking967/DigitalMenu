import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { db } from "@/db/index";
import { menu } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const cartRouter = createTRPCRouter({
  getMenuItemById: baseProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const items = await db.select().from(menu).where(eq(menu.id, input.id));
      return items[0] ?? null;
    }),
});
