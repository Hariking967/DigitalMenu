export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (session?.user.email == process.env.ADMIN_EMAIL) {
    redirect("/admin");
  } else if (session?.user.email == process.env.WORKER_EMAIL) {
    redirect("/worker");
  } else {
    redirect("/menu");
  }
}
