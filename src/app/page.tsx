import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/session";

export default async function HomePage() {
  const profile = await getSessionProfile();

  if (profile) {
    if (profile.role === "student") {
      redirect("/student");
    }

    if (profile.role === "parent") {
      redirect("/parent");
    }

    if (profile.role === "institution_admin" || profile.role === "system_admin") {
      redirect("/admin");
    }

    redirect("/dashboard");
  }

  redirect("/login");
}
