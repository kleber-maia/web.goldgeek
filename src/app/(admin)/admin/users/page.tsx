import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getAllAdminUsers } from "@/lib/actions/admin/user.actions";
import UsersClient from "./UsersClient";

export default async function AdminUsersPage() {
  const session = await getSession();

  if (!session) {
    redirect("/admin/login");
  }

  if (session.type !== "admin") {
    redirect("/admin/login?error=unauthorized");
  }

  const result = await getAllAdminUsers();
  const users = (result.data || []) as Array<{
    id: string;
    email: string;
    createdAt: Date;
  }>;

  return <UsersClient users={users} currentUserId={session.id} />;
}
