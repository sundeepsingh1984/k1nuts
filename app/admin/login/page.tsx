import { redirect } from "next/navigation";
import Link from "next/link";
import { adminCredentialsConfigured, getAdminUser } from "../../admin-auth";
import AdminLoginForm from "./login-form";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await getAdminUser()) redirect("/admin");
  const configured = await adminCredentialsConfigured();

  return (
    <main className="adminLoginPage">
      <section className="adminLoginStory" aria-label="K1 administration">
        <Link href="/" className="adminLoginBrand">
          <img src="/k1-logo.jpeg" alt="K1 Nut's" />
          <span>
            <b>K1 NUT&apos;S</b>
            <small>DELICACY FROM THE HIMALAYAS</small>
          </span>
        </Link>
        <div>
          <small>PRIVATE STORE OPERATIONS</small>
          <h1>Calm control for a growing K1 store.</h1>
          <p>
            Orders, stock, customer conversations, shipping, campaigns and GST
            working data live in one protected workspace.
          </p>
        </div>
        <ul>
          <li>Live commerce pulse</li>
          <li>Customer support inbox</li>
          <li>Secure eight-hour sessions</li>
        </ul>
      </section>
      <section className="adminLoginCard">
        <div>
          <small>WELCOME BACK</small>
          <h2>Administrator sign in</h2>
          <p>Enter the private K1 operations credentials.</p>
        </div>
        <AdminLoginForm configured={configured} />
        <Link href="/">← Return to storefront</Link>
      </section>
    </main>
  );
}
