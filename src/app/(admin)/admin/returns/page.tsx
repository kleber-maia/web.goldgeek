import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getAllReturns } from "@/lib/actions/admin/shipping.actions";
import ReturnsClient from "./ReturnsClient";

export default async function ReturnsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/admin/login");
  }

  if (session.type !== "admin") {
    redirect("/admin/login?error=unauthorized");
  }

  const result = await getAllReturns();
  const returns = result.data || [];

  return <ReturnsClient returns={returns} />;
}
