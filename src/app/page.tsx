import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const role = (session.user as { role?: string })?.role;

  switch (role) {
    case "ADMIN":
      redirect("/admin");
    case "MANAGER":
      redirect("/manager");
    case "TENANT":
      redirect("/tenant");
    default:
      redirect("/login");
  }
}
