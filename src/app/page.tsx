import { redirect } from "next/navigation";
import { getDemoSessionProfile } from "@/lib/demo/session";
import { getHomePathForRole } from "@/lib/demo/constants";

export default async function HomePage() {
  const profile = getDemoSessionProfile();

  if (profile) {
    redirect(getHomePathForRole(profile.role));
  }

  redirect("/login");
}
