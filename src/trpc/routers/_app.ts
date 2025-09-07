import { z } from "zod";
import { baseProcedure, createTRPCRouter } from "../init";
import { menuRouter } from "@/modules/admin/server/procedure";
export const appRouter = createTRPCRouter({
  menu: menuRouter,
});
export type AppRouter = typeof appRouter;
