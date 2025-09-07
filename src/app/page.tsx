import HomeView from "@/modules/home/ui/home-view";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function Home() {
  return <HomeView />;
}
