import { z } from "zod";
import { baseProcedure, createTRPCRouter } from "../init";
import { menuRouter } from "@/modules/admin/server/procedure";
import { cartRouter } from "@/modules/cart/server/procedure";
export const appRouter = createTRPCRouter({
  menu: menuRouter,
  cart: cartRouter,
});
export type AppRouter = typeof appRouter;
