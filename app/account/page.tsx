import { Suspense } from "react";
import { requireCustomerUser } from "../customer-auth";
import { StoreFooter, StoreHeader } from "../storefront-context";
import { AccountDashboard } from "./account-dashboard";

export const dynamic = "force-dynamic";

type AccountTab = "profile" | "addresses" | "orders";

async function ProtectedAccount({ initialTab }: { initialTab: AccountTab }) {
  const user = await requireCustomerUser("/account");
  return (
    <AccountDashboard
      initialTab={initialTab}
      authenticatedUser={{
        displayName: user.displayName,
        email: user.email,
      }}
    />
  );
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const requestedTab = (await searchParams).tab;
  const initialTab: AccountTab =
    requestedTab === "addresses" || requestedTab === "orders"
      ? requestedTab
      : "profile";
  return (
    <main className="brandSite accountPage">
      <StoreHeader />
      <Suspense
        fallback={
          <section className="accountLoading">
            <img src="/k1-logo.jpeg" alt="K1 Nut's" />
            <p>Preparing your K1 account…</p>
          </section>
        }
      >
        <ProtectedAccount initialTab={initialTab} />
      </Suspense>
      <StoreFooter />
    </main>
  );
}
