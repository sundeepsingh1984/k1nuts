import { redirect } from "next/navigation";
import { getAdminUser } from "../admin-auth";
import AdminDashboard from "./dashboard";
export const dynamic = "force-dynamic";
export default async function AdminPage() {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  return <AdminDashboard displayName={user.displayName} />;
}
