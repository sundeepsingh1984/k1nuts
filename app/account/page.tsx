import { Suspense } from "react";
import { requireCustomerUser } from "../customer-auth";
import { StoreFooter, StoreHeader } from "../storefront-context";
import { AccountDashboard } from "./account-dashboard";

export const dynamic = "force-dynamic";

async function ProtectedAccount() {
  const user = await requireCustomerUser("/account");
  return (
    <AccountDashboard
      authenticatedUser={{
        displayName: user.displayName,
        email: user.email,
      }}
    />
  );
}

export default function AccountPage() {
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
        <ProtectedAccount />
      </Suspense>
      <StoreFooter />
    </main>
  );
}
