import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCustomerAuthConfiguration, getCustomerUser, safeReturnTo } from "../customer-auth";
import { StoreFooter, StoreHeader } from "../storefront-context";
import CustomerLogin from "./customer-login";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in securely to your K1 Nuts account.",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ return_to?: string; error?: string }>;
}) {
  const params = await searchParams;
  const returnTo = safeReturnTo(params.return_to);
  if (await getCustomerUser()) redirect(returnTo);
  const configuration = getCustomerAuthConfiguration();

  return (
    <main className="brandSite customerLoginPage">
      <StoreHeader />
      <section className="customerLoginShell">
        <div className="customerLoginVisual">
          <img src="/categories/healthy-snacks.webp" alt="K1 healthy snacks crafted in Kashmir" />
          <div>
            <small>YOUR K1 ACCOUNT</small>
            <h1>Good food.<br /><em>Your way.</em></h1>
            <p>Save delivery addresses, track every order and review products you have purchased.</p>
          </div>
        </div>
        <CustomerLogin
          configuration={configuration}
          returnTo={returnTo}
          initialError={params.error || ""}
        />
      </section>
      <StoreFooter />
    </main>
  );
}
