import Link from "next/link";
import { requireChatGPTUser } from "../chatgpt-auth";
import { isAdminEmail } from "../admin-auth";
import AdminDashboard from "./dashboard";
export const dynamic = "force-dynamic";
export default async function AdminPage() {
  const user = await requireChatGPTUser("/admin");
  if (!isAdminEmail(user.email)) {
    return (
      <main className="adminDenied">
        <h1>Admin access required</h1>
        <p>This account is not on the K1 operations allowlist.</p>
        <Link href="/">RETURN TO STOREFRONT</Link>
      </main>
    );
  }
  return <AdminDashboard displayName={user.displayName} />;
}
