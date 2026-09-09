"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";

type Profile = {
  displayName: string;
  email: string;
  phone: string | null;
  billingLegalName: string | null;
  billingGstin: string | null;
  marketingOptIn: boolean;
  whatsappMarketingOptIn: boolean;
};
type Address = {
  id: number;
  label: string;
  recipientName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
};
type OrderItem = {
  id: number;
  productSlug: string;
  productName: string;
  quantity: number;
  unitPricePaise: number;
};
type Order = {
  id: number;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalPaise: number;
  carrier: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  placedAt: number;
  updatedAt: number;
  items: OrderItem[];
  invoice: {
    id: number;
    invoiceNumber: string;
    status: string;
  } | null;
};
type AccountData = {
  profile: Profile;
  addresses: Address[];
  orders: Order[];
};
type Tab = "profile" | "addresses" | "orders";

const emptyAddress = {
  label: "Home",
  recipientName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "Jammu & Kashmir",
  postalCode: "",
  country: "India",
  isDefault: true,
};

const orderStages = [
  ["confirmed", "Confirmed"],
  ["packed", "Packed"],
  ["shipped", "Shipped"],
  ["out_for_delivery", "Out for delivery"],
  ["delivered", "Delivered"],
] as const;

function rupees(paise: number) {
  return (paise / 100).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });
}

export function AccountDashboard({
  authenticatedUser,
}: {
  authenticatedUser: { displayName: string; email: string };
}) {
  const [tab, setTab] = useState<Tab>(() => {
    if (typeof window === "undefined") return "profile";
    const requestedTab = new URLSearchParams(window.location.search).get("tab");
    return requestedTab === "addresses" || requestedTab === "orders"
      ? requestedTab
      : "profile";
  });
  const [data, setData] = useState<AccountData | null>(null);
  const [profile, setProfile] = useState({
    displayName: authenticatedUser.displayName,
    phone: "",
    billingLegalName: "",
    billingGstin: "",
    marketingOptIn: false,
    whatsappMarketingOptIn: false,
  });
  const [addressDraft, setAddressDraft] = useState(emptyAddress);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const loadAccount = useCallback(async () => {
    const response = await fetch("/api/account", { cache: "no-store" });
    if (!response.ok) return;
    const next = (await response.json()) as AccountData;
    setData(next);
    setProfile({
      displayName: next.profile.displayName,
      phone: next.profile.phone ?? "",
      billingLegalName: next.profile.billingLegalName ?? "",
      billingGstin: next.profile.billingGstin ?? "",
      marketingOptIn: next.profile.marketingOptIn,
      whatsappMarketingOptIn: next.profile.whatsappMarketingOptIn,
    });
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadAccount(), 0);
    return () => window.clearTimeout(timer);
  }, [loadAccount]);

  function changeTab(next: Tab) {
    setTab(next);
    window.history.replaceState(null, "", `/account?tab=${next}`);
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    const response = await fetch("/api/account", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(profile),
    });
    const result = (await response.json()) as { error?: string };
    setNotice(
      response.ok
        ? "Profile updated."
        : result.error || "Unable to save profile.",
    );
    setBusy(false);
    if (response.ok) loadAccount();
  }

  async function saveAddress(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    const response = await fetch("/api/account/addresses", {
      method: editingAddressId ? "PUT" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...addressDraft, id: editingAddressId }),
    });
    const result = (await response.json()) as { error?: string };
    setNotice(
      response.ok
        ? "Delivery address saved."
        : result.error || "Unable to save address.",
    );
    setBusy(false);
    if (response.ok) {
      setShowAddressForm(false);
      setEditingAddressId(null);
      setAddressDraft(emptyAddress);
      loadAccount();
    }
  }

  function editAddress(address: Address) {
    setEditingAddressId(address.id);
    setAddressDraft({
      label: address.label,
      recipientName: address.recipientName,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2 ?? "",
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      isDefault: address.isDefault,
    });
    setShowAddressForm(true);
  }

  async function deleteAddress(id: number) {
    if (!window.confirm("Remove this delivery address?")) return;
    await fetch(`/api/account/addresses?id=${id}`, { method: "DELETE" });
    setNotice("Delivery address removed.");
    loadAccount();
  }

  const currentOrders =
    data?.orders.filter(
      (order) => !["delivered", "cancelled"].includes(order.status),
    ) ?? [];
  const pastOrders =
    data?.orders.filter((order) =>
      ["delivered", "cancelled"].includes(order.status),
    ) ?? [];

  return (
    <section className="accountWorkspace">
      <aside className="accountNav">
        <p className="brandEyebrow light">
          <span /> K1 MEMBERS
        </p>
        <div className="accountIdentity">
          <i>
            {(data?.profile.displayName ?? authenticatedUser.displayName).slice(
              0,
              1,
            )}
          </i>
          <h1>{data?.profile.displayName ?? authenticatedUser.displayName}</h1>
          <span>{authenticatedUser.email}</span>
        </div>
        <nav>
          {(["profile", "addresses", "orders"] as Tab[]).map((item, index) => (
            <button
              key={item}
              className={tab === item ? "active" : ""}
              onClick={() => changeTab(item)}
            >
              <b>0{index + 1}</b>
              {item === "profile"
                ? "My profile"
                : item === "addresses"
                  ? "Delivery addresses"
                  : "Orders & tracking"}
            </button>
          ))}
        </nav>
        <a href="/api/auth/logout">SIGN OUT →</a>
      </aside>

      <div className="accountContent">
        <header className="accountContentHead">
          <div>
            <small>PRIVATE · SECURE · YOURS</small>
            <h2>
              {tab === "profile"
                ? "Your K1 profile"
                : tab === "addresses"
                  ? "Where goodness arrives"
                  : "Every order, in one place"}
            </h2>
          </div>
          <Link href="/#categories">CONTINUE SHOPPING ↗</Link>
        </header>

        {notice && <p className="accountNotice">{notice}</p>}
        {!data ? (
          <div className="accountSkeleton">Loading your account securely…</div>
        ) : tab === "profile" ? (
          <form className="profileForm" onSubmit={saveProfile}>
            <div className="accountPanelIntro">
              <span>01</span>
              <div>
                <h3>Personal details</h3>
                <p>
                  Used for order updates, delivery coordination and invoices.
                </p>
              </div>
            </div>
            <div className="accountFormGrid">
              <label>
                Display name
                <input
                  value={profile.displayName}
                  onChange={(event) =>
                    setProfile({ ...profile, displayName: event.target.value })
                  }
                  required
                />
              </label>
              <label>
                Email
                <input value={data.profile.email} readOnly />
              </label>
              <label>
                Mobile number
                <input
                  value={profile.phone}
                  onChange={(event) =>
                    setProfile({ ...profile, phone: event.target.value })
                  }
                  placeholder="+91 98765 43210"
                  inputMode="tel"
                />
              </label>
              <label>
                Billing legal name · optional
                <input
                  value={profile.billingLegalName}
                  onChange={(event) =>
                    setProfile({
                      ...profile,
                      billingLegalName: event.target.value,
                    })
                  }
                  placeholder="For business invoices"
                />
              </label>
              <label>
                GSTIN · optional
                <input
                  value={profile.billingGstin}
                  onChange={(event) =>
                    setProfile({
                      ...profile,
                      billingGstin: event.target.value.toUpperCase(),
                    })
                  }
                  placeholder="15-character GSTIN"
                  maxLength={15}
                />
              </label>
            </div>
            <label className="accountCheck consentCheck">
              <input
                type="checkbox"
                checked={profile.marketingOptIn}
                onChange={(event) =>
                  setProfile({
                    ...profile,
                    marketingOptIn: event.target.checked,
                  })
                }
              />
              Email me K1 offers, new arrivals and useful product notes. I can
              opt out here at any time.
            </label>
            <label className="accountCheck consentCheck">
              <input
                type="checkbox"
                checked={profile.whatsappMarketingOptIn}
                onChange={(event) =>
                  setProfile({
                    ...profile,
                    whatsappMarketingOptIn: event.target.checked,
                  })
                }
              />
              Send K1 offers and recommendations to my saved number on
              WhatsApp. I can opt out here or by replying STOP.
            </label>
            <button className="brandButton" disabled={busy}>
              {busy ? "SAVING…" : "SAVE PROFILE →"}
            </button>
          </form>
        ) : tab === "addresses" ? (
          <div className="addressWorkspace">
            <div className="accountActionLine">
              <p>
                {data.addresses.length} saved delivery address
                {data.addresses.length === 1 ? "" : "es"}
              </p>
              <button
                className="brandButton"
                onClick={() => {
                  setEditingAddressId(null);
                  setAddressDraft({
                    ...emptyAddress,
                    recipientName: data.profile.displayName,
                    phone: data.profile.phone ?? "",
                    isDefault: data.addresses.length === 0,
                  });
                  setShowAddressForm(true);
                }}
              >
                + ADD ADDRESS
              </button>
            </div>
            {showAddressForm && (
              <form className="addressForm" onSubmit={saveAddress}>
                <div className="accountPanelIntro">
                  <span>+</span>
                  <div>
                    <h3>
                      {editingAddressId
                        ? "Edit address"
                        : "New delivery address"}
                    </h3>
                    <p>Complete fields help carriers deliver without delay.</p>
                  </div>
                </div>
                <div className="accountFormGrid">
                  {(
                    [
                      ["label", "Address label", "Home"],
                      ["recipientName", "Recipient name", "Full name"],
                      ["phone", "Phone", "+91"],
                      ["line1", "Address line 1", "House, street, area"],
                      ["line2", "Address line 2", "Landmark (optional)"],
                      ["city", "City", "Srinagar"],
                      ["state", "State", "Jammu & Kashmir"],
                      ["postalCode", "PIN code", "190008"],
                      ["country", "Country", "India"],
                    ] as const
                  ).map(([field, label, placeholder]) => (
                    <label
                      key={field}
                      className={field.startsWith("line") ? "wide" : ""}
                    >
                      {label}
                      <input
                        value={addressDraft[field] as string}
                        onChange={(event) =>
                          setAddressDraft({
                            ...addressDraft,
                            [field]: event.target.value,
                          })
                        }
                        placeholder={placeholder}
                        required={field !== "line2"}
                      />
                    </label>
                  ))}
                </div>
                <label className="accountCheck">
                  <input
                    type="checkbox"
                    checked={addressDraft.isDefault}
                    onChange={(event) =>
                      setAddressDraft({
                        ...addressDraft,
                        isDefault: event.target.checked,
                      })
                    }
                  />
                  Use as my default delivery address
                </label>
                <div className="accountFormActions">
                  <button className="brandButton" disabled={busy}>
                    {busy ? "SAVING…" : "SAVE ADDRESS →"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddressForm(false)}
                  >
                    CANCEL
                  </button>
                </div>
              </form>
            )}
            <div className="addressGrid">
              {data.addresses.map((address) => (
                <article key={address.id}>
                  <div>
                    <span>{address.label}</span>
                    {address.isDefault && <b>DEFAULT</b>}
                  </div>
                  <h3>{address.recipientName}</h3>
                  <p>
                    {address.line1}
                    {address.line2 ? `, ${address.line2}` : ""}
                    <br />
                    {address.city}, {address.state} {address.postalCode}
                    <br />
                    {address.country} · {address.phone}
                  </p>
                  <footer>
                    <button onClick={() => editAddress(address)}>EDIT</button>
                    <button onClick={() => deleteAddress(address.id)}>
                      REMOVE
                    </button>
                  </footer>
                </article>
              ))}
              {!data.addresses.length && !showAddressForm && (
                <div className="accountEmpty">
                  <span>⌂</span>
                  <h3>No delivery address yet.</h3>
                  <p>
                    Add one now so checkout is faster when payment goes live.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="ordersWorkspace">
            <OrderGroup title="ACTIVE ORDERS" orders={currentOrders} />
            <OrderGroup title="ORDER HISTORY" orders={pastOrders} />
            {!data.orders.length && (
              <div className="accountEmpty orderEmpty">
                <span>01</span>
                <h3>Your first K1 order will appear here.</h3>
                <p>
                  Order status, carrier, tracking number and review eligibility
                  will stay together in this timeline.
                </p>
                <Link className="brandButton" href="/#categories">
                  EXPLORE THE PANTRY →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function OrderGroup({ title, orders }: { title: string; orders: Order[] }) {
  if (!orders.length) return null;
  return (
    <section className="orderGroup">
      <h3>{title}</h3>
      {orders.map((order) => {
        const stageIndex = orderStages.findIndex(
          ([status]) => status === order.status,
        );
        return (
          <article className="orderCard" key={order.id}>
            <header>
              <div>
                <small>ORDER</small>
                <b>{order.orderNumber}</b>
              </div>
              <div>
                <small>PLACED</small>
                <b>{new Date(order.placedAt).toLocaleDateString("en-IN")}</b>
              </div>
              <div>
                <small>TOTAL</small>
                <b>{rupees(order.totalPaise)}</b>
              </div>
              <span>{order.status.replaceAll("_", " ")}</span>
            </header>
            {order.status !== "cancelled" && (
              <div className="orderTimeline">
                {orderStages.map(([status, label], index) => (
                  <div
                    className={index <= stageIndex ? "complete" : ""}
                    key={status}
                  >
                    <i />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="orderItems">
              {order.items.map((item) => (
                <p key={item.id}>
                  <span>
                    {item.quantity} × {item.productName}
                  </span>
                  <b>{rupees(item.unitPricePaise * item.quantity)}</b>
                  {order.paymentStatus === "paid" && (
                    <Link href={`/product/${item.productSlug}#product-reviews`}>
                      REVIEW PRODUCT →
                    </Link>
                  )}
                </p>
              ))}
            </div>
            {(order.trackingNumber || order.carrier) && (
              <footer>
                <span>
                  {order.carrier || "Delivery partner"} ·{" "}
                  {order.trackingNumber || "Tracking pending"}
                </span>
                {order.trackingUrl && (
                  <a href={order.trackingUrl} target="_blank" rel="noreferrer">
                    TRACK LIVE ↗
                  </a>
                )}
              </footer>
            )}
            {order.invoice && (
              <footer className="orderInvoiceLink">
                <span>Tax invoice · {order.invoice.invoiceNumber}</span>
                <Link href={`/invoice/${order.invoice.id}`}>
                  VIEW / SAVE PDF ↗
                </Link>
              </footer>
            )}
          </article>
        );
      })}
    </section>
  );
}
