"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatInr, products } from "../store-data";
type Activity = {
  id: number;
  event: string;
  path: string;
  productSlug?: string | null;
  createdAt: number;
};
const demoActivity: Activity[] = [
  {
    id: 1,
    event: "page_view",
    path: "/product/kashmiri-mewa-bites",
    createdAt: Date.now() - 120000,
  },
  {
    id: 2,
    event: "add_to_cart",
    path: "/product/chocolate-truffle-bites",
    productSlug: "chocolate-truffle-bites",
    createdAt: Date.now() - 420000,
  },
  {
    id: 3,
    event: "checkout_login_gate",
    path: "/",
    createdAt: Date.now() - 720000,
  },
];
export default function AdminDashboard({
  displayName,
}: {
  displayName: string;
}) {
  const [activity, setActivity] = useState<Activity[]>(demoActivity);
  const [tab, setTab] = useState("overview");
  const [toast, setToast] = useState("");
  const [renderedAt] = useState(Date.now);
  useEffect(() => {
    fetch("/api/events")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => data.events?.length && setActivity(data.events))
      .catch(() => {});
  }, []);
  return (
    <main className="adminShell">
      <aside className="adminSide">
        <Link href="/" className="adminBrand">
          <img src="/k1-logo.jpeg" alt="K1 Nut's" />
          <span>
            <b>K1 CONTROL</b>
            <small>STORE OPERATIONS</small>
          </span>
        </Link>
        <nav>
          {[
            "overview",
            "products",
            "orders",
            "customers",
            "reviews",
            "offers",
            "integrations",
          ].map((item) => (
            <button
              key={item}
              className={tab === item ? "active" : ""}
              onClick={() => setTab(item)}
            >
              <span>{item.slice(0, 1).toUpperCase()}</span>
              {item}
            </button>
          ))}
        </nav>
        <Link href="/">← VIEW STOREFRONT</Link>
      </aside>
      <section className="adminMain">
        <header>
          <div>
            <small>GOOD EVENING</small>
            <h1>{displayName}</h1>
          </div>
          <div>
            <button>⌕</button>
            <button>◉</button>
            <span>LIVE STORE</span>
          </div>
        </header>
        {tab === "overview" ? (
          <>
            <div className="adminHero">
              <div>
                <small>STORE PULSE</small>
                <h2>
                  Your K1 commerce
                  <br />
                  command centre.
                </h2>
                <p>
                  Activity, conversion signals and operations in one calm view.
                </p>
              </div>
              <div className="pulseOrb">
                <b>82</b>
                <span>HEALTH SCORE</span>
              </div>
            </div>
            <div className="metricGrid">
              {[
                ["SESSIONS", "1,248", "+18.4%"],
                ["ADD TO BAGS", "186", "+12.7%"],
                ["CHECKOUTS", "74", "+8.2%"],
                ["REVENUE PREVIEW", "₹86.4K", "+22.1%"],
              ].map((row) => (
                <article key={row[0]}>
                  <small>{row[0]}</small>
                  <b>{row[1]}</b>
                  <span>{row[2]}</span>
                  <i />
                </article>
              ))}
            </div>
            <div className="adminColumns">
              <article className="trafficChart">
                <div>
                  <h3>Store activity</h3>
                  <span>LAST 7 DAYS</span>
                </div>
                <div className="bars">
                  {[42, 68, 52, 84, 63, 93, 76].map((h, i) => (
                    <i key={i} style={{ height: `${h}%` }}>
                      <span>{["M", "T", "W", "T", "F", "S", "S"][i]}</span>
                    </i>
                  ))}
                </div>
              </article>
              <article className="liveActivity">
                <div>
                  <h3>Live activity</h3>
                  <span>{activity.length} EVENTS</span>
                </div>
                {activity.slice(0, 5).map((event) => (
                  <p key={event.id}>
                    <i className={event.event} />
                    <span>
                      <b>{event.event.replaceAll("_", " ")}</b>
                      <small>{event.productSlug ?? event.path}</small>
                    </span>
                    <em>
                      {Math.max(
                        1,
                        Math.floor((renderedAt - event.createdAt) / 60000),
                      )}
                      m
                    </em>
                  </p>
                ))}
              </article>
            </div>
          </>
        ) : (
          <AdminModule tab={tab} setToast={setToast} />
        )}
      </section>
      {toast && <div className="adminToast">✓ {toast}</div>}
    </main>
  );
}
function AdminModule({
  tab,
  setToast,
}: {
  tab: string;
  setToast: (v: string) => void;
}) {
  const labels: Record<string, [string, string]> = {
    products: [
      "Product catalogue",
      "Edit pricing, stock, packaging and visibility.",
    ],
    orders: ["Order operations", "Fulfil, refund and track every order."],
    customers: ["Customer directory", "Profiles, lifetime value and segments."],
    reviews: [
      "Reviews & testimonials",
      "Approve verified reviews for the storefront.",
    ],
    offers: ["Coupons & offers", "Create promotional codes and thresholds."],
    integrations: [
      "Commerce integrations",
      "Connect payment, shipping and analytics providers.",
    ],
  };
  const [title, note] = labels[tab] ?? [tab, ""];
  return (
    <div className="adminModule">
      <div className="moduleHead">
        <div>
          <small>K1 OPERATIONS</small>
          <h2>{title}</h2>
          <p>{note}</p>
        </div>
        <button
          onClick={() => setToast(`${title} settings saved in demo mode`)}
        >
          + ADD NEW
        </button>
      </div>
      {tab === "products" ? (
        <div className="productTable">
          <div>
            <b>PRODUCT</b>
            <b>CATEGORY</b>
            <b>SALE PRICE</b>
            <b>STATUS</b>
          </div>
          {products.slice(0, 10).map((p) => (
            <div key={p.slug}>
              <span>
                {p.image ? (
                  <img src={p.image} alt="" />
                ) : (
                  <i style={{ background: p.accent }}>{p.emoji}</i>
                )}
                <b>{p.name}</b>
              </span>
              <span>{p.category}</span>
              <span>₹{formatInr(p.price)} · 50% OFF</span>
              <span>
                <em>ACTIVE</em>
                <button>•••</button>
              </span>
            </div>
          ))}
        </div>
      ) : tab === "integrations" ? (
        <div className="integrationGrid">
          {[
            ["Razorpay", "PAYMENTS"],
            ["PhonePe", "PAYMENTS"],
            ["Shiprocket", "SHIPPING"],
            ["Delhivery", "SHIPPING"],
            ["Amazon Shipping", "SHIPPING"],
            ["GA4 / Meta Pixel", "ANALYTICS"],
          ].map(([name, type], i) => (
            <article key={name}>
              <small>{type}</small>
              <h3>{name}</h3>
              <p>
                {i < 2
                  ? "Accept secure online payments."
                  : i < 5
                    ? "Rates, labels and order tracking."
                    : "Conversion and campaign events."}
              </p>
              <button
                onClick={() =>
                  setToast(`${name} requires merchant credentials`)
                }
              >
                {i === 5 ? "CONFIGURE" : "CONNECT"} →
              </button>
            </article>
          ))}
        </div>
      ) : (
        <div className="emptyModule">
          <span>⌁</span>
          <h3>{title} workspace</h3>
          <p>
            The management interface is ready for the corresponding live service
            and database workflow.
          </p>
          <button onClick={() => setToast("Demo operation recorded")}>
            CREATE SAMPLE RECORD
          </button>
        </div>
      )}
    </div>
  );
}
