import { redirect } from "next/navigation";
import { getDemoSessionProfile } from "@/lib/demo/session";

export default async function HomePage() {
  const profile = getDemoSessionProfile();

  if (profile) {
    redirect("/dashboard");
  }

  redirect("/login");
}
