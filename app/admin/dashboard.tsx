"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  categories,
  formatInr,
  getProductVariants,
  products,
} from "../store-data";

type Activity = {
  id: number;
  event: string;
  path: string;
  productSlug?: string | null;
  createdAt: number;
};

type DashboardData = {
  metrics: {
    salesPaise: number;
    orders: number;
    customers: number;
    returns: number;
    returnPaise: number;
    cancelledPaise: number;
    catalogueProducts: number;
  };
  daily: Array<{ day: string; orders: number; sales_paise: number }>;
  customProducts: Array<{
    slug: string;
    name: string;
    category: string;
    categorySlug: string;
    image: string;
    active: boolean;
    variants: Array<{
      label: string;
      sku: string;
      mrpPaise: number;
      pricePaise: number;
      stock: number;
    }>;
  }>;
  orders: Array<{
    id: number;
    orderNumber: string;
    status: string;
    paymentStatus: string;
    totalPaise: number;
    placedAt: number;
    carrier: string | null;
    trackingNumber: string | null;
    shipment: { provider: string; status: string } | null;
  }>;
  returns: Array<{
    id: number;
    orderId: number;
    status: string;
    reason: string;
    amountPaise: number;
    createdAt: number;
  }>;
  integrations: { shiprocket: boolean; amazon: boolean };
};

const emptyData: DashboardData = {
  metrics: {
    salesPaise: 0,
    orders: 0,
    customers: 0,
    returns: 0,
    returnPaise: 0,
    cancelledPaise: 0,
    catalogueProducts: products.length,
  },
  daily: [],
  customProducts: [],
  orders: [],
  returns: [],
  integrations: { shiprocket: false, amazon: false },
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
];

export default function AdminDashboard({
  displayName,
}: {
  displayName: string;
}) {
  const [activity, setActivity] = useState<Activity[]>(demoActivity);
  const [data, setData] = useState<DashboardData>(emptyData);
  const [tab, setTab] = useState("overview");
  const [toast, setToast] = useState("");
  const [renderedAt] = useState(Date.now);

  const loadDashboard = useCallback(async () => {
    const response = await fetch("/api/admin/dashboard", { cache: "no-store" });
    if (response.ok) setData((await response.json()) as DashboardData);
  }, []);

  useEffect(() => {
    fetch("/api/events")
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load activity.");
        return (await response.json()) as { events?: Activity[] };
      })
      .then((result) => result.events?.length && setActivity(result.events))
      .catch(() => undefined);
    const timer = window.setTimeout(() => void loadDashboard(), 0);
    return () => window.clearTimeout(timer);
  }, [loadDashboard]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 4200);
    return () => window.clearTimeout(timer);
  }, [toast]);

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
            "returns",
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
            <small>K1 COMMERCE · LIVE DATA</small>
            <h1>{displayName}</h1>
          </div>
          <div>
            <button
              aria-label="Refresh dashboard"
              onClick={() => loadDashboard()}
            >
              ↻
            </button>
            <span>LIVE STORE</span>
          </div>
        </header>

        {tab === "overview" ? (
          <AdminOverview
            data={data}
            activity={activity}
            renderedAt={renderedAt}
          />
        ) : (
          <AdminModule
            tab={tab}
            data={data}
            reload={loadDashboard}
            setToast={setToast}
          />
        )}
      </section>
      {toast && <div className="adminToast">✓ {toast}</div>}
    </main>
  );
}

function AdminOverview({
  data,
  activity,
  renderedAt,
}: {
  data: DashboardData;
  activity: Activity[];
  renderedAt: number;
}) {
  const maximum = Math.max(1, ...data.daily.map((day) => Number(day.orders)));
  const returnRate = data.metrics.orders
    ? (data.metrics.returns / data.metrics.orders) * 100
    : 0;
  const health = Math.max(
    0,
    Math.round(
      100 -
        returnRate * 2 -
        (data.integrations.shiprocket ? 0 : 8) -
        (data.integrations.amazon ? 0 : 4),
    ),
  );
  const metricRows = [
    [
      "NET SALES",
      `₹${formatInr(data.metrics.salesPaise / 100)}`,
      "PAID ORDERS",
    ],
    ["ORDERS", String(data.metrics.orders), "ALL TIME"],
    ["RETURNS", String(data.metrics.returns), `${returnRate.toFixed(1)}% RATE`],
    ["CUSTOMERS", String(data.metrics.customers), "REGISTERED"],
  ];

  return (
    <>
      <div className="adminHero">
        <div>
          <small>STORE PULSE</small>
          <h2>
            The numbers behind
            <br />
            every K1 order.
          </h2>
          <p>
            Sales, fulfilment, returns and customer activity calculated from the
            live commerce database.
          </p>
        </div>
        <div className="pulseOrb">
          <b>{health}</b>
          <span>HEALTH SCORE</span>
        </div>
      </div>
      <div className="metricGrid">
        {metricRows.map((row) => (
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
            <h3>Orders · last 7 days</h3>
            <span>LIVE DATABASE</span>
          </div>
          <div className="bars">
            {(data.daily.length
              ? data.daily
              : Array.from({ length: 7 }, (_, index) => ({
                  day: String(index),
                  orders: 0,
                  sales_paise: 0,
                }))
            ).map((day) => (
              <i
                key={day.day}
                style={{
                  height: `${Math.max(4, (Number(day.orders) / maximum) * 100)}%`,
                }}
                title={`${day.orders} orders · ₹${formatInr(Number(day.sales_paise) / 100)}`}
              >
                <span>
                  {/^\d$/.test(day.day)
                    ? ["M", "T", "W", "T", "F", "S", "S"][Number(day.day)]
                    : new Date(`${day.day}T00:00:00`).toLocaleDateString(
                        "en-IN",
                        {
                          weekday: "narrow",
                        },
                      )}
                </span>
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
  );
}

function AdminModule({
  tab,
  data,
  reload,
  setToast,
}: {
  tab: string;
  data: DashboardData;
  reload: () => Promise<void>;
  setToast: (value: string) => void;
}) {
  const labels: Record<string, [string, string]> = {
    products: [
      "Product catalogue",
      "Add products, pack sizes, SKUs, stock and pricing.",
    ],
    orders: [
      "Order operations",
      "Create shipments and keep fulfilment moving.",
    ],
    returns: [
      "Returns intelligence",
      "Monitor requests, refunds and return value.",
    ],
    customers: [
      "Customer directory",
      "Profiles, repeat orders and lifetime value.",
    ],
    reviews: [
      "Reviews & testimonials",
      "Verified purchase reviews from product pages.",
    ],
    offers: [
      "Coupons & offers",
      "Store-wide 50% pricing and future campaign rules.",
    ],
    integrations: [
      "Shipping integrations",
      "Shiprocket and Amazon Shipping connection health.",
    ],
  };
  const [title, note] = labels[tab] ?? [tab, ""];
  const [showProductForm, setShowProductForm] = useState(false);

  return (
    <div className="adminModule">
      <div className="moduleHead">
        <div>
          <small>K1 OPERATIONS</small>
          <h2>{title}</h2>
          <p>{note}</p>
        </div>
        {tab === "products" && (
          <button onClick={() => setShowProductForm((open) => !open)}>
            {showProductForm ? "CLOSE FORM" : "+ ADD PRODUCT"}
          </button>
        )}
      </div>

      {tab === "products" ? (
        <>
          {showProductForm && (
            <ProductForm
              onSaved={async (message) => {
                setToast(message);
                setShowProductForm(false);
                await reload();
              }}
            />
          )}
          <ProductCatalogueTable data={data} />
        </>
      ) : tab === "orders" ? (
        <OrdersTable data={data} reload={reload} setToast={setToast} />
      ) : tab === "returns" ? (
        <ReturnsTable data={data} />
      ) : tab === "integrations" ? (
        <IntegrationPanel data={data} setToast={setToast} />
      ) : tab === "customers" ? (
        <div className="emptyModule compact">
          <span>{data.metrics.customers}</span>
          <h3>registered K1 customers</h3>
          <p>
            Customer identities and delivery addresses remain protected in D1.
          </p>
        </div>
      ) : tab === "reviews" ? (
        <div className="emptyModule compact">
          <span>★</span>
          <h3>Verified-purchase review system is live</h3>
          <p>Only paid purchasers can publish on a product description page.</p>
        </div>
      ) : (
        <div className="emptyModule compact">
          <span>50%</span>
          <h3>Store-wide launch offer</h3>
          <p>
            Every generated pack variant keeps the current 50% off MRP rule.
          </p>
        </div>
      )}
    </div>
  );
}

function ProductCatalogueTable({ data }: { data: DashboardData }) {
  const rows = [
    ...products.map((product) => ({
      slug: product.slug,
      name: product.name,
      category: product.category,
      image: product.image || "/k1-logo.jpeg",
      active: true,
      managed: "CORE",
      variants: getProductVariants(product).map((variant) => ({
        label: variant.label,
        pricePaise: variant.price * 100,
        stock: variant.stock,
      })),
    })),
    ...data.customProducts.map((product) => ({ ...product, managed: "ADMIN" })),
  ];
  return (
    <div className="productTable productTablePro">
      <div>
        <b>PRODUCT</b>
        <b>CATEGORY</b>
        <b>VARIANTS</b>
        <b>STOCK / STATUS</b>
      </div>
      {rows.map((product) => (
        <div key={`${product.managed}-${product.slug}`}>
          <span>
            <img src={product.image} alt="" loading="lazy" />
            <span>
              <b>{product.name}</b>
              <small>{product.managed} CATALOGUE</small>
            </span>
          </span>
          <span>{product.category}</span>
          <span className="adminVariantStack">
            {product.variants.map((variant) => (
              <small key={variant.label}>
                {variant.label} · ₹{formatInr(Number(variant.pricePaise) / 100)}
              </small>
            ))}
          </span>
          <span>
            <b>
              {product.variants.reduce((sum, item) => sum + item.stock, 0)}{" "}
              units
            </b>
            <em>{product.active ? "ACTIVE" : "DRAFT"}</em>
          </span>
        </div>
      ))}
    </div>
  );
}

function ProductForm({ onSaved }: { onSaved: (message: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    slug: "",
    categorySlug: "nuts",
    short: "",
    description: "",
    image: "",
    badge: "K1 SELECTED",
    accent: "#8a5a2b",
    variants: [
      { label: "250g", weightGrams: 250, mrp: 599, stock: 25, sku: "" },
      { label: "500g", weightGrams: 500, mrp: 1198, stock: 20, sku: "" },
      { label: "1kg", weightGrams: 1000, mrp: 2396, stock: 10, sku: "" },
    ],
  });

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const response = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    const result = (await response.json()) as { error?: string };
    setBusy(false);
    if (!response.ok) return setError(result.error || "Unable to add product.");
    onSaved(`${form.name} and all three variants are now live`);
  }

  return (
    <form className="adminProductForm" onSubmit={submit}>
      <header>
        <div>
          <small>NEW CATALOGUE ITEM</small>
          <h3>Product and pack variants</h3>
        </div>
        <span>SALE PRICE IS AUTOMATICALLY 50% OF MRP</span>
      </header>
      <div className="adminFormGrid">
        <label>
          Product name
          <input
            value={form.name}
            onChange={(event) =>
              setForm({
                ...form,
                name: event.target.value,
                slug: event.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/(^-|-$)/g, ""),
              })
            }
            required
          />
        </label>
        <label>
          URL slug
          <input
            value={form.slug}
            onChange={(event) => setForm({ ...form, slug: event.target.value })}
            required
          />
        </label>
        <label>
          Category
          <select
            value={form.categorySlug}
            onChange={(event) =>
              setForm({ ...form, categorySlug: event.target.value })
            }
          >
            {categories.map((category) => (
              <option value={category.slug} key={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Badge
          <input
            value={form.badge}
            onChange={(event) =>
              setForm({ ...form, badge: event.target.value })
            }
          />
        </label>
        <label className="wide">
          Short selling line
          <input
            value={form.short}
            onChange={(event) =>
              setForm({ ...form, short: event.target.value })
            }
            required
          />
        </label>
        <label className="wide">
          Product description
          <textarea
            value={form.description}
            onChange={(event) =>
              setForm({ ...form, description: event.target.value })
            }
            required
          />
        </label>
        <label className="wide">
          Branded product image URL
          <input
            type="url"
            value={form.image}
            onChange={(event) =>
              setForm({ ...form, image: event.target.value })
            }
            placeholder="https://…/k1-product-pack.webp"
            required
          />
        </label>
      </div>
      <div className="adminVariantEditor">
        <div>
          <b>PACK SIZE</b>
          <b>SKU</b>
          <b>MRP</b>
          <b>SALE</b>
          <b>STOCK</b>
        </div>
        {form.variants.map((variant, index) => (
          <div key={variant.label}>
            <b>{variant.label}</b>
            <input
              value={variant.sku}
              placeholder={`Auto: K1-${form.slug || "PRODUCT"}-${variant.weightGrams}`}
              onChange={(event) => {
                const variants = [...form.variants];
                variants[index] = { ...variant, sku: event.target.value };
                setForm({ ...form, variants });
              }}
            />
            <input
              type="number"
              min="1"
              value={variant.mrp}
              onChange={(event) => {
                const variants = [...form.variants];
                variants[index] = {
                  ...variant,
                  mrp: Number(event.target.value),
                };
                setForm({ ...form, variants });
              }}
            />
            <span>₹{formatInr(variant.mrp / 2)}</span>
            <input
              type="number"
              min="0"
              value={variant.stock}
              onChange={(event) => {
                const variants = [...form.variants];
                variants[index] = {
                  ...variant,
                  stock: Number(event.target.value),
                };
                setForm({ ...form, variants });
              }}
            />
          </div>
        ))}
      </div>
      {error && <p className="adminFormError">{error}</p>}
      <button className="adminPrimary" disabled={busy}>
        {busy ? "CREATING…" : "CREATE PRODUCT + 3 VARIANTS →"}
      </button>
    </form>
  );
}

function OrdersTable({
  data,
  reload,
  setToast,
}: {
  data: DashboardData;
  reload: () => Promise<void>;
  setToast: (value: string) => void;
}) {
  async function shippingAction(action: string, orderId: number) {
    setToast("Contacting shipping provider…");
    const response = await fetch("/api/admin/shipping", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, orderId }),
    });
    const result = (await response.json()) as { error?: string };
    setToast(
      response.ok
        ? "Shipping record updated"
        : result.error || "Shipping failed",
    );
    if (response.ok) await reload();
  }

  if (!data.orders.length) {
    return (
      <div className="emptyModule compact">
        <span>00</span>
        <h3>No orders yet</h3>
        <p>Paid checkout orders will appear here with shipment controls.</p>
      </div>
    );
  }
  return (
    <div className="adminOrderTable">
      {data.orders.map((order) => (
        <article key={order.id}>
          <div>
            <small>ORDER</small>
            <b>{order.orderNumber}</b>
            <span>{new Date(order.placedAt).toLocaleDateString("en-IN")}</span>
          </div>
          <div>
            <small>TOTAL</small>
            <b>₹{formatInr(order.totalPaise / 100)}</b>
            <span>{order.paymentStatus}</span>
          </div>
          <div>
            <small>FULFILMENT</small>
            <b>{order.carrier || order.shipment?.provider || "Not assigned"}</b>
            <span>{order.trackingNumber || order.status}</span>
          </div>
          <div className="orderAdminActions">
            {!order.shipment && (
              <>
                <button
                  disabled={!data.integrations.shiprocket}
                  onClick={() => shippingAction("shiprocket_create", order.id)}
                >
                  SHIP WITH SHIPROCKET
                </button>
                <button
                  disabled={!data.integrations.amazon}
                  onClick={() => shippingAction("amazon_create", order.id)}
                >
                  SHIP WITH AMAZON
                </button>
              </>
            )}
            {order.shipment && (
              <button onClick={() => shippingAction("sync_tracking", order.id)}>
                SYNC TRACKING
              </button>
            )}
            <span>{order.status.replaceAll("_", " ")}</span>
          </div>
        </article>
      ))}
    </div>
  );
}

function ReturnsTable({ data }: { data: DashboardData }) {
  if (!data.returns.length) {
    return (
      <div className="returnSummary">
        <article>
          <small>RETURN REQUESTS</small>
          <b>0</b>
          <span>No active returns</span>
        </article>
        <article>
          <small>RETURN VALUE</small>
          <b>₹0</b>
          <span>Live from order returns</span>
        </article>
        <div className="emptyModule compact">
          <span>✓</span>
          <h3>A clean returns desk</h3>
          <p>New return records will automatically change store metrics.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="adminOrderTable">
      {data.returns.map((item) => (
        <article key={item.id}>
          <div>
            <small>RETURN</small>
            <b>#{item.id}</b>
            <span>Order #{item.orderId}</span>
          </div>
          <div>
            <small>AMOUNT</small>
            <b>₹{formatInr(item.amountPaise / 100)}</b>
            <span>{item.status}</span>
          </div>
          <div className="wideReturnReason">
            <small>REASON</small>
            <b>{item.reason}</b>
          </div>
        </article>
      ))}
    </div>
  );
}

function IntegrationPanel({
  data,
  setToast,
}: {
  data: DashboardData;
  setToast: (value: string) => void;
}) {
  async function test(provider: "shiprocket" | "amazon") {
    if (!data.integrations[provider]) {
      setToast(
        `${provider === "shiprocket" ? "Shiprocket" : "Amazon"} credentials are required`,
      );
      return;
    }
    setToast("Testing secure connection…");
    const response = await fetch("/api/admin/shipping", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: `test_${provider}` }),
    });
    const result = (await response.json()) as { error?: string };
    setToast(
      response.ok
        ? `${provider} connection successful`
        : result.error || "Connection failed",
    );
  }

  const cards = [
    {
      key: "shiprocket" as const,
      name: "Shiprocket",
      note: "Create external orders, assign AWBs and synchronize tracking.",
    },
    {
      key: "amazon" as const,
      name: "Amazon Shipping",
      note: "LWA authorization, Shipping V2 rates, purchase and tracking.",
    },
  ];
  return (
    <div className="integrationGrid integrationGridPro">
      {cards.map((card) => (
        <article key={card.key}>
          <div
            className={`integrationState ${data.integrations[card.key] ? "ready" : ""}`}
          >
            <i />{" "}
            {data.integrations[card.key]
              ? "CREDENTIALS READY"
              : "SETUP REQUIRED"}
          </div>
          <small>SHIPPING API</small>
          <h3>{card.name}</h3>
          <p>{card.note}</p>
          <ul>
            <li>Secrets remain server-side</li>
            <li>Live API errors are surfaced to operations</li>
            <li>Tracking updates customer order history</li>
          </ul>
          <button onClick={() => test(card.key)}>
            {data.integrations[card.key]
              ? "TEST CONNECTION"
              : "VIEW REQUIRED SETUP"}{" "}
            →
          </button>
        </article>
      ))}
    </div>
  );
}
