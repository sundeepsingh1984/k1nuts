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
  searchTerm?: string | null;
  device?: string | null;
  createdAt: number;
};

type SupportConversation = {
  id: number;
  customerName: string | null;
  customerEmail: string | null;
  status: string;
  lastMessageAt: number;
  lastMessage: string;
  unread: number;
};

type SupportMessage = {
  id: number;
  sender: "customer" | "bot" | "admin";
  body: string;
  createdAt: number;
  readAt: number | null;
};

type CampaignData = {
  campaigns: Array<{
    id: number;
    name: string;
    channel: "email" | "whatsapp";
    subject: string | null;
    status: string;
    audienceCount: number;
    sentCount: number;
    failedCount: number;
    createdAt: number;
  }>;
  audience: { email: number; whatsapp: number };
  configuration: {
    email: boolean;
    whatsapp: boolean;
    identity: {
      chatgpt: boolean;
      firebaseProjectConfigured: boolean;
      externalLoginActive: boolean;
    };
  };
  campaignLimit: number;
};

type GstData = {
  period: string;
  settings: {
    enabled: boolean;
    legalName: string;
    tradeName: string;
    gstin: string;
    pan: string | null;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    stateName: string;
    stateCode: string;
    postalCode: string;
    invoicePrefix: string;
    eInvoiceApplicable: boolean;
  };
  taxProfiles: Array<{
    productSlug: string;
    hsnCode: string;
    gstRateBps: number;
    cessRateBps: number;
    unitCode: string;
  }>;
  missingTaxProfiles: string[];
  invoices: Array<{
    id: number;
    orderId: number;
    invoiceNumber: string;
    buyerLegalName: string;
    totalPaise: number;
    invoiceDate: number;
    status: string;
  }>;
  summary: {
    issuedInvoices: number;
    taxableValuePaise: number;
    cgstPaise: number;
    sgstPaise: number;
    igstPaise: number;
    cessPaise: number;
    grossTaxPaise: number;
    invoiceValuePaise: number;
    unadjustedReturns: number;
    unadjustedReturnValuePaise: number;
  };
  gstr1: {
    b2bInvoices: number;
    b2clInvoices: number;
    b2csInvoices: number;
    documentsIssued: number;
    hsnRows: Array<{
      hsnCode: string;
      gstRateBps: number;
      unitCode: string;
      quantity: number;
      taxableValuePaise: number;
      cgstPaise: number;
      sgstPaise: number;
      igstPaise: number;
      cessPaise: number;
    }>;
  };
  gstr3b: {
    table31a: {
      taxableValuePaise: number;
      integratedTaxPaise: number;
      centralTaxPaise: number;
      stateTaxPaise: number;
      cessPaise: number;
    };
    table31c: {
      outwardValuePaise: number;
    };
  };
  reconciliation: {
    unadjustedReturns: Array<{
      id: number;
      orderId: number;
      status: string;
      amountPaise: number;
      createdAt: number;
    }>;
    note: string;
  };
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
    description: string;
    short: string;
    accent: string;
    image: string;
    badge: string;
    active: boolean;
    variants: Array<{
      label: string;
      weightGrams: number;
      sku: string;
      mrpPaise: number;
      pricePaise: number;
      stock: number;
    }>;
  }>;
  customCategories: Array<{
    slug: string;
    name: string;
    kicker: string;
    description: string;
    emoji: string;
    tone: string;
    image: string;
    active: boolean;
    sortOrder: number;
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
  insights: {
    rangeDays: number;
    topPages: Array<{ path: string; views: number; visitors: number }>;
    topProducts: Array<{
      product_slug: string;
      views: number;
      adds: number;
      visitors: number;
      units: number;
    }>;
    topSearches: Array<{
      search_term: string;
      searches: number;
      average_results: number;
      zero_results: number;
    }>;
    funnel: {
      pageViews: number;
      sessions: number;
      productViews: number;
      addToCarts: number;
      checkouts: number;
    };
    performance: { lcpMs: number; ttfbMs: number; cls: number };
    devices: Array<{ device: string; sessions: number }>;
    seo: {
      indexablePages: number;
      productsWithDescriptions: number;
      productsWithImages: number;
      productCount: number;
    };
  };
  integrations: {
    shiprocket: boolean;
    amazon: boolean;
    email: boolean;
    whatsapp: boolean;
    identity: CampaignData["configuration"]["identity"];
  };
};

type ProductEditorItem = {
  slug: string;
  name: string;
  category: string;
  categorySlug: string;
  description: string;
  short: string;
  image: string;
  badge: string;
  accent: string;
  active: boolean;
  managed: string;
  variants: Array<{
    label: string;
    weightGrams: number;
    sku: string;
    mrpPaise: number;
    pricePaise: number;
    stock: number;
  }>;
};

function adminCategories(data: DashboardData) {
  const overrides = new Map(
    data.customCategories.map((category) => [category.slug, category]),
  );
  const coreSlugs = new Set(categories.map((category) => category.slug));
  return [
    ...categories.map((category, index) => ({
      ...category,
      active: overrides.get(category.slug)?.active ?? true,
      sortOrder: overrides.get(category.slug)?.sortOrder ?? index * 10,
      ...(overrides.get(category.slug) ?? {}),
      managed: overrides.has(category.slug) ? "ADMIN" : "CORE",
    })),
    ...data.customCategories
      .filter((category) => !coreSlugs.has(category.slug))
      .map((category) => ({ ...category, managed: "ADMIN" })),
  ].sort((left, right) => left.sortOrder - right.sortOrder);
}

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
  customCategories: [],
  orders: [],
  returns: [],
  insights: {
    rangeDays: 30,
    topPages: [],
    topProducts: [],
    topSearches: [],
    funnel: {
      pageViews: 0,
      sessions: 0,
      productViews: 0,
      addToCarts: 0,
      checkouts: 0,
    },
    performance: { lcpMs: 0, ttfbMs: 0, cls: 0 },
    devices: [],
    seo: {
      indexablePages: 1 + products.length,
      productsWithDescriptions: products.length,
      productsWithImages: products.length,
      productCount: products.length,
    },
  },
  integrations: {
    shiprocket: false,
    amazon: false,
    email: false,
    whatsapp: false,
    identity: {
      chatgpt: true,
      firebaseProjectConfigured: false,
      externalLoginActive: false,
    },
  },
};

const emptyCampaignData: CampaignData = {
  campaigns: [],
  audience: { email: 0, whatsapp: 0 },
  configuration: {
    email: false,
    whatsapp: false,
    identity: emptyData.integrations.identity,
  },
  campaignLimit: 250,
};

export default function AdminDashboard({
  displayName,
}: {
  displayName: string;
}) {
  const [activity, setActivity] = useState<Activity[]>([]);
  const [data, setData] = useState<DashboardData>(emptyData);
  const [campaignData, setCampaignData] =
    useState<CampaignData>(emptyCampaignData);
  const [tab, setTab] = useState("overview");
  const [toast, setToast] = useState("");
  const [renderedAt, setRenderedAt] = useState(0);

  async function signOut() {
    await fetch("/api/admin/session", { method: "DELETE" });
    window.location.replace("/admin/login");
  }

  const loadDashboard = useCallback(async () => {
    const response = await fetch("/api/admin/dashboard", { cache: "no-store" });
    if (response.ok) setData((await response.json()) as DashboardData);
  }, []);

  const loadCampaigns = useCallback(async () => {
    const response = await fetch("/api/admin/campaigns", {
      cache: "no-store",
    });
    if (response.ok) setCampaignData((await response.json()) as CampaignData);
  }, []);

  useEffect(() => {
    fetch("/api/events")
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load activity.");
        return (await response.json()) as { events?: Activity[] };
      })
      .then((result) => {
        if (result.events) setActivity(result.events);
        setRenderedAt(Date.now());
      })
      .catch(() => undefined);
    const timer = window.setTimeout(() => void loadDashboard(), 0);
    const campaignTimer = window.setTimeout(() => void loadCampaigns(), 0);
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(campaignTimer);
    };
  }, [loadCampaigns, loadDashboard]);

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
            "insights",
            "products",
            "categories",
            "orders",
            "support",
            "gst",
            "returns",
            "customers",
            "reviews",
            "offers",
            "campaigns",
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
            <button className="adminSignOut" onClick={() => void signOut()}>
              SIGN OUT
            </button>
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
            campaignData={campaignData}
            reload={loadDashboard}
            reloadCampaigns={loadCampaigns}
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
  campaignData,
  reload,
  reloadCampaigns,
  setToast,
}: {
  tab: string;
  data: DashboardData;
  campaignData: CampaignData;
  reload: () => Promise<void>;
  reloadCampaigns: () => Promise<void>;
  setToast: (value: string) => void;
}) {
  const labels: Record<string, [string, string]> = {
    insights: [
      "Growth & behaviour insights",
      "Pages, product demand, searches, conversion, devices, speed and SEO.",
    ],
    products: [
      "Product catalogue",
      "Add products, pack sizes, SKUs, stock and pricing.",
    ],
    categories: [
      "Store categories",
      "Add or edit collections and publish them automatically across menus and pages.",
    ],
    orders: [
      "Order operations",
      "Create shipments and keep fulfilment moving.",
    ],
    support: [
      "Customer support inbox",
      "Read live K1 Concierge conversations, reply personally and resolve requests.",
    ],
    gst: [
      "GST & invoicing",
      "Issue compliant tax invoices and prepare monthly outward-supply data.",
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
    campaigns: [
      "Marketing campaigns",
      "Reach only opted-in customers by email or approved WhatsApp templates.",
    ],
    integrations: [
      "Platform integrations",
      "Shipping, campaign delivery and customer identity connection health.",
    ],
  };
  const [title, note] = labels[tab] ?? [tab, ""];
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductEditorItem | null>(null);

  return (
    <div className="adminModule">
      <div className="moduleHead">
        <div>
          <small>K1 OPERATIONS</small>
          <h2>{title}</h2>
          <p>{note}</p>
        </div>
        {tab === "products" && (
          <button onClick={() => {
            setEditingProduct(null);
            setShowProductForm((open) => !open);
          }}>
            {showProductForm ? "CLOSE FORM" : "+ ADD PRODUCT"}
          </button>
        )}
      </div>

      {tab === "insights" ? (
        <InsightsPanel data={data} />
      ) : tab === "products" ? (
        <>
          {showProductForm && (
            <ProductForm
              key={editingProduct?.slug ?? "new-product"}
              initialProduct={editingProduct}
              categories={adminCategories(data)}
              onSaved={async (message) => {
                setToast(message);
                setShowProductForm(false);
                await reload();
              }}
            />
          )}
          <ProductCatalogueTable
            data={data}
            onEdit={(product) => {
              setEditingProduct(product);
              setShowProductForm(true);
            }}
          />
        </>
      ) : tab === "categories" ? (
        <CategoryManager data={data} reload={reload} setToast={setToast} />
      ) : tab === "orders" ? (
        <OrdersTable data={data} reload={reload} setToast={setToast} />
      ) : tab === "support" ? (
        <SupportPanel setToast={setToast} />
      ) : tab === "gst" ? (
        <GstPanel data={data} setToast={setToast} />
      ) : tab === "returns" ? (
        <ReturnsTable data={data} />
      ) : tab === "integrations" ? (
        <IntegrationPanel reload={reload} setToast={setToast} />
      ) : tab === "campaigns" ? (
        <CampaignPanel
          data={campaignData}
          reload={reloadCampaigns}
          setToast={setToast}
        />
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

function percent(part: number, total: number) {
  return total ? `${((part / total) * 100).toFixed(1)}%` : "0.0%";
}

function productLabel(slug: string) {
  return (
    products.find((product) => product.slug === slug)?.name ||
    slug.replaceAll("-", " ")
  );
}

function InsightsPanel({ data }: { data: DashboardData }) {
  const { insights } = data;
  const seoComplete = insights.seo.productCount
    ? Math.round(
        ((insights.seo.productsWithDescriptions +
          insights.seo.productsWithImages) /
          (insights.seo.productCount * 2)) *
          100,
      )
    : 100;
  const summary = [
    ["SESSIONS", insights.funnel.sessions, `${insights.rangeDays} DAYS`],
    ["PAGE VIEWS", insights.funnel.pageViews, "FIRST-PARTY"],
    [
      "CART RATE",
      percent(insights.funnel.addToCarts, insights.funnel.productViews),
      "PRODUCT → CART",
    ],
    ["SEO COVERAGE", `${seoComplete}%`, `${insights.seo.indexablePages} URLS`],
  ];
  const funnel = [
    ["Store visits", insights.funnel.sessions],
    ["Product views", insights.funnel.productViews],
    ["Added to cart", insights.funnel.addToCarts],
    ["Checkout starts", insights.funnel.checkouts],
  ];

  return (
    <div className="insightsWorkspace">
      <div className="insightSummary">
        {summary.map(([label, value, note]) => (
          <article key={String(label)}>
            <small>{label}</small>
            <b>{value}</b>
            <span>{note}</span>
          </article>
        ))}
      </div>

      <div className="insightTopGrid">
        <article className="funnelPanel">
          <header>
            <div>
              <small>CONVERSION JOURNEY</small>
              <h3>From visit to checkout</h3>
            </div>
            <span>LAST {insights.rangeDays} DAYS</span>
          </header>
          {funnel.map(([label, value], index) => (
            <div className="funnelStep" key={String(label)}>
              <span>{label}</span>
              <i>
                <b
                  style={{
                    width: `${Math.max(
                      Number(value) ? 8 : 0,
                      insights.funnel.sessions
                        ? (Number(value) / insights.funnel.sessions) * 100
                        : 0,
                    )}%`,
                  }}
                />
              </i>
              <strong>{value}</strong>
              {index > 0 && (
                <em>
                  {percent(Number(value), Number(funnel[index - 1][1]))}
                </em>
              )}
            </div>
          ))}
        </article>
        <article className="speedPanel">
          <header>
            <small>REAL-USER SPEED</small>
            <h3>Core experience pulse</h3>
          </header>
          <div>
            <span>
              <b>{insights.performance.lcpMs || "—"}</b>
              <small>ms · LCP</small>
            </span>
            <span>
              <b>{insights.performance.ttfbMs || "—"}</b>
              <small>ms · TTFB</small>
            </span>
            <span>
              <b>{insights.performance.cls || "—"}</b>
              <small>CLS</small>
            </span>
          </div>
          <p>
            Collected from real storefront sessions without third-party tracking
            scripts or advertising cookies.
          </p>
        </article>
      </div>

      <div className="insightTables">
        <InsightTable
          title="Most visited pages"
          columns={["PAGE", "VIEWS", "VISITORS"]}
          rows={insights.topPages.map((row) => [
            row.path,
            row.views,
            row.visitors,
          ])}
          empty="Page traffic will appear after visits."
        />
        <InsightTable
          title="Product demand"
          columns={["PRODUCT", "VIEWS", "CARTS", "SOLD"]}
          rows={insights.topProducts.map((row) => [
            productLabel(row.product_slug),
            row.views,
            row.adds,
            row.units,
          ])}
          empty="Product interest will appear after shoppers browse."
        />
        <InsightTable
          title="Search intelligence"
          columns={["QUERY", "SEARCHES", "AVG RESULTS", "NO RESULT"]}
          rows={insights.topSearches.map((row) => [
            row.search_term,
            row.searches,
            row.average_results,
            row.zero_results,
          ])}
          empty="Customer searches will appear here."
        />
      </div>

      <div className="seoPanel">
        <div>
          <small>SEO READINESS</small>
          <h3>{seoComplete}% catalogue coverage</h3>
          <p>
            Dynamic titles, descriptions, canonical links, Product schema,
            category schema, sitemap and crawler controls are published.
          </p>
        </div>
        <span>
          <b>{insights.seo.productsWithDescriptions}</b>
          descriptions
        </span>
        <span>
          <b>{insights.seo.productsWithImages}</b>
          product images
        </span>
        <span>
          <b>{insights.seo.indexablePages}</b>
          discoverable URLs
        </span>
      </div>
    </div>
  );
}

function InsightTable({
  title,
  columns,
  rows,
  empty,
}: {
  title: string;
  columns: string[];
  rows: Array<Array<string | number>>;
  empty: string;
}) {
  return (
    <article className="insightTable">
      <h3>{title}</h3>
      <div className="insightTableHead">
        {columns.map((column) => (
          <b key={column}>{column}</b>
        ))}
      </div>
      {rows.length ? (
        rows.slice(0, 8).map((row, index) => (
          <div className="insightTableRow" key={`${row[0]}-${index}`}>
            {row.map((cell, cellIndex) => (
              <span key={`${cell}-${cellIndex}`}>{cell}</span>
            ))}
          </div>
        ))
      ) : (
        <p className="insightEmpty">{empty}</p>
      )}
    </article>
  );
}

function CampaignPanel({
  data,
  reload,
  setToast,
}: {
  data: CampaignData;
  reload: () => Promise<void>;
  setToast: (value: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: "",
    channel: "email" as "email" | "whatsapp",
    subject: "",
    message: "",
    templateName: "",
    templateLanguage: "en_US",
  });
  const ready = data.configuration[form.channel];
  const audience = data.audience[form.channel];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent)
      .submitter as HTMLButtonElement | null;
    const sendNow = submitter?.value === "send";
    setBusy(true);
    const response = await fetch("/api/admin/campaigns", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...form, sendNow }),
    });
    const result = (await response.json()) as {
      error?: string;
      savedAsDraft?: boolean;
    };
    setBusy(false);
    if (!response.ok) {
      setToast(result.error || "Campaign could not be saved");
      return;
    }
    setToast(
      result.savedAsDraft
        ? `Draft saved · ${result.error}`
        : sendNow
          ? "Campaign delivery completed"
          : "Campaign saved as draft",
    );
    setForm({ ...form, name: "", subject: "", message: "" });
    await reload();
  }

  async function sendExisting(id: number) {
    setBusy(true);
    const response = await fetch("/api/admin/campaigns", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ campaignId: id, sendNow: true }),
    });
    const result = (await response.json()) as { error?: string };
    setBusy(false);
    setToast(
      response.ok && !result.error
        ? "Campaign delivery completed"
        : result.error || "Campaign could not be sent",
    );
    await reload();
  }

  return (
    <div className="campaignWorkspace">
      <div className="campaignAudience">
        <article>
          <small>EMAIL AUDIENCE</small>
          <b>{data.audience.email}</b>
          <span>explicitly opted in</span>
        </article>
        <article>
          <small>WHATSAPP AUDIENCE</small>
          <b>{data.audience.whatsapp}</b>
          <span>phone + channel consent</span>
        </article>
        <article>
          <small>SAFE RUN LIMIT</small>
          <b>{data.campaignLimit}</b>
          <span>recipients per campaign</span>
        </article>
      </div>
      <form className="campaignComposer" onSubmit={submit}>
        <header>
          <div>
            <small>NEW CAMPAIGN</small>
            <h3>Compose a customer message</h3>
          </div>
          <span className={ready ? "ready" : ""}>
            {ready ? "DELIVERY READY" : "PROVIDER SETUP REQUIRED"}
          </span>
        </header>
        <div className="campaignFormGrid">
          <label>
            Campaign name
            <input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="September pantry offer"
              required
            />
          </label>
          <label>
            Channel
            <select
              value={form.channel}
              onChange={(event) =>
                setForm({
                  ...form,
                  channel: event.target.value as "email" | "whatsapp",
                })
              }
            >
              <option value="email">Email</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </label>
          {form.channel === "email" ? (
            <label className="wide">
              Email subject
              <input
                value={form.subject}
                onChange={(event) =>
                  setForm({ ...form, subject: event.target.value })
                }
                placeholder="Goodness for your September pantry"
                required
              />
            </label>
          ) : (
            <>
              <label>
                Approved template name
                <input
                  value={form.templateName}
                  onChange={(event) =>
                    setForm({ ...form, templateName: event.target.value })
                  }
                  placeholder="k1_monthly_offer"
                  required
                />
              </label>
              <label>
                Template language
                <input
                  value={form.templateLanguage}
                  onChange={(event) =>
                    setForm({ ...form, templateLanguage: event.target.value })
                  }
                  required
                />
              </label>
            </>
          )}
          <label className="wide">
            Message {form.channel === "whatsapp" && "· template body variable"}
            <textarea
              value={form.message}
              onChange={(event) =>
                setForm({ ...form, message: event.target.value })
              }
              placeholder="Share the offer, benefit and one clear next step."
              maxLength={1800}
              required
            />
          </label>
        </div>
        <div className="campaignActions">
          <p>
            Audience now: <b>{audience}</b>. Sending respects saved consent and
            never exposes provider credentials to the browser.
          </p>
          <button name="campaignAction" value="draft" disabled={busy}>
            SAVE DRAFT
          </button>
          <button
            className="adminPrimary"
            name="campaignAction"
            value="send"
            disabled={busy}
          >
            {busy
              ? "WORKING…"
              : ready
                ? `SEND TO ${audience} CUSTOMERS →`
                : "SAVE + REVIEW SETUP →"}
          </button>
        </div>
      </form>

      <div className="campaignHistory">
        <header>
          <h3>Campaign history</h3>
          <span>{data.campaigns.length} RECENT</span>
        </header>
        {data.campaigns.length ? (
          data.campaigns.map((campaign) => (
            <article key={campaign.id}>
              <div>
                <small>{campaign.channel.toUpperCase()}</small>
                <b>{campaign.name}</b>
                <span>
                  {new Date(campaign.createdAt).toLocaleDateString("en-IN")}
                </span>
              </div>
              <div>
                <small>AUDIENCE</small>
                <b>{campaign.audienceCount}</b>
              </div>
              <div>
                <small>DELIVERED / FAILED</small>
                <b>
                  {campaign.sentCount} / {campaign.failedCount}
                </b>
              </div>
              <span className={`campaignStatus ${campaign.status}`}>
                {campaign.status}
              </span>
              {["draft", "failed"].includes(campaign.status) && (
                <button disabled={busy} onClick={() => sendExisting(campaign.id)}>
                  SEND NOW
                </button>
              )}
            </article>
          ))
        ) : (
          <p className="insightEmpty">Your first campaign will appear here.</p>
        )}
      </div>
    </div>
  );
}

function ProductCatalogueTable({
  data,
  onEdit,
}: {
  data: DashboardData;
  onEdit: (product: ProductEditorItem) => void;
}) {
  const overrides = new Map(
    data.customProducts.map((product) => [product.slug, product]),
  );
  const coreSlugs = new Set(products.map((product) => product.slug));
  const coreRows: ProductEditorItem[] = products.map((product) => {
    const override = overrides.get(product.slug);
    if (override) return { ...override, managed: "ADMIN" };
    return {
      slug: product.slug,
      name: product.name,
      category: product.category,
      categorySlug: product.categorySlug,
      description: product.description,
      short: product.short,
      accent: product.accent,
      image: product.image || "/k1-logo.jpeg",
      badge: product.badge || "K1 SELECTED",
      active: true,
      managed: "CORE",
      variants: getProductVariants(product).map((variant) => ({
        label: variant.label,
        weightGrams: variant.weightGrams,
        sku: variant.sku,
        mrpPaise: variant.mrp * 100,
        pricePaise: variant.price * 100,
        stock: variant.stock,
      })),
    };
  });
  const rows: ProductEditorItem[] = [
    ...coreRows,
    ...data.customProducts
      .filter((product) => !coreSlugs.has(product.slug))
      .map((product) => ({ ...product, managed: "ADMIN" })),
  ];
  return (
    <div className="productTable productTablePro">
      <div>
        <b>PRODUCT</b>
        <b>CATEGORY</b>
        <b>VARIANTS</b>
        <b>STOCK / STATUS</b>
        <b>ACTIONS</b>
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
          <span className="adminProductActions">
            <button onClick={() => onEdit(product)}>EDIT</button>
            <a href={`/product/${product.slug}`} target="_blank" rel="noreferrer">
              VIEW
            </a>
          </span>
        </div>
      ))}
    </div>
  );
}

function ProductForm({
  onSaved,
  initialProduct,
  categories: catalogueCategories,
}: {
  onSaved: (message: string) => void;
  initialProduct: ProductEditorItem | null;
  categories: Array<{ slug: string; name: string; active: boolean }>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(() =>
    initialProduct
      ? {
          name: initialProduct.name,
          slug: initialProduct.slug,
          categorySlug: initialProduct.categorySlug,
          short: initialProduct.short,
          description: initialProduct.description,
          image: initialProduct.image,
          badge: initialProduct.badge,
          accent: initialProduct.accent,
          active: initialProduct.active,
          variants: initialProduct.variants.map((variant) => ({
            label: variant.label,
            weightGrams: variant.weightGrams,
            mrp: variant.mrpPaise / 100,
            stock: variant.stock,
            sku: variant.sku,
          })),
        }
      : {
          name: "",
          slug: "",
          categorySlug: catalogueCategories.find((category) => category.active)?.slug || "nuts",
          short: "",
          description: "",
          image: "",
          badge: "K1 SELECTED",
          accent: "#356055",
          active: true,
          variants: [
            { label: "250g", weightGrams: 250, mrp: 599, stock: 25, sku: "" },
            { label: "500g", weightGrams: 500, mrp: 1198, stock: 20, sku: "" },
            { label: "1kg", weightGrams: 1000, mrp: 2396, stock: 10, sku: "" },
          ],
        },
  );

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const response = await fetch("/api/admin/products", {
      method: initialProduct ? "PUT" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    const result = (await response.json()) as { error?: string };
    setBusy(false);
    if (!response.ok) return setError(result.error || "Unable to add product.");
    onSaved(
      initialProduct
        ? `${form.name} was updated across the storefront`
        : `${form.name} and all three variants are now live`,
    );
  }

  return (
    <form className="adminProductForm" onSubmit={submit}>
      <header>
        <div>
          <small>{initialProduct ? "EDIT CATALOGUE ITEM" : "NEW CATALOGUE ITEM"}</small>
          <h3>{initialProduct ? `Editing ${initialProduct.name}` : "Product and pack variants"}</h3>
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
            disabled={Boolean(initialProduct)}
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
            {catalogueCategories.filter((category) => category.active || category.slug === form.categorySlug).map((category) => (
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
        {busy
          ? initialProduct
            ? "SAVING…"
            : "CREATING…"
          : initialProduct
            ? "SAVE PRODUCT CHANGES →"
            : "CREATE PRODUCT + 3 VARIANTS →"}
      </button>
    </form>
  );
}

type AdminCategoryItem = ReturnType<typeof adminCategories>[number];

function CategoryManager({
  data,
  reload,
  setToast,
}: {
  data: DashboardData;
  reload: () => Promise<void>;
  setToast: (value: string) => void;
}) {
  const [editing, setEditing] = useState<AdminCategoryItem | null>(null);
  const [creating, setCreating] = useState(false);
  const rows = adminCategories(data);

  async function toggle(category: AdminCategoryItem) {
    const response = await fetch("/api/admin/categories", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...category, active: !category.active }),
    });
    const result = (await response.json()) as { error?: string };
    setToast(
      response.ok
        ? `${category.name} is now ${category.active ? "hidden" : "live"}`
        : result.error || "Category status could not be changed",
    );
    if (response.ok) await reload();
  }

  return (
    <div className="categoryAdminWorkspace">
      <div className="categoryAdminActions">
        <p>
          Categories saved here appear automatically in the Shop menu, home
          page, sitemap and their own collection page.
        </p>
        <button
          onClick={() => {
            setEditing(null);
            setCreating((value) => !value);
          }}
        >
          {creating ? "CLOSE FORM" : "+ ADD CATEGORY"}
        </button>
      </div>
      {(creating || editing) && (
        <CategoryForm
          key={editing?.slug ?? "new-category"}
          category={editing}
          onSaved={async (message) => {
            setToast(message);
            setCreating(false);
            setEditing(null);
            await reload();
          }}
        />
      )}
      <div className="categoryAdminGrid">
        {rows.map((category, index) => (
          <article key={category.slug}>
            <img src={category.image} alt="" loading="lazy" />
            <div>
              <small>{String(index + 1).padStart(2, "0")} · {category.managed} CATEGORY</small>
              <h3>{category.name}</h3>
              <p>{category.description}</p>
              <span className={category.active ? "live" : "draft"}>
                {category.active ? "LIVE ON STORE" : "HIDDEN"}
              </span>
            </div>
            <footer>
              <button onClick={() => {
                setCreating(false);
                setEditing(category);
              }}>EDIT</button>
              <button onClick={() => void toggle(category)}>
                {category.active ? "HIDE" : "PUBLISH"}
              </button>
              {category.active && (
                <a href={`/category/${category.slug}`} target="_blank" rel="noreferrer">VIEW ↗</a>
              )}
            </footer>
          </article>
        ))}
      </div>
    </div>
  );
}

function CategoryForm({
  category,
  onSaved,
}: {
  category: AdminCategoryItem | null;
  onSaved: (message: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(() =>
    category
      ? { ...category }
      : {
          name: "",
          slug: "",
          kicker: "K1 curated collection",
          description: "",
          emoji: "✦",
          tone: "#356055",
          image: "",
          active: true,
          sortOrder: 100,
          managed: "ADMIN",
        },
  );

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const response = await fetch("/api/admin/categories", {
      method: category ? "PUT" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    const result = (await response.json()) as { error?: string };
    setBusy(false);
    if (!response.ok) {
      setError(result.error || "Category could not be saved.");
      return;
    }
    onSaved(
      category
        ? `${form.name} was updated everywhere`
        : `${form.name} is now available across the store`,
    );
  }

  return (
    <form className="adminCategoryForm" onSubmit={submit}>
      <header>
        <div>
          <small>{category ? "EDIT COLLECTION" : "NEW COLLECTION"}</small>
          <h3>{category ? `Editing ${category.name}` : "Create a store category"}</h3>
        </div>
        <span>A CATEGORY PAGE AND MENU LINK ARE CREATED AUTOMATICALLY</span>
      </header>
      <div className="adminFormGrid">
        <label>
          Category name
          <input
            value={form.name}
            onChange={(event) => setForm({
              ...form,
              name: event.target.value,
              slug: category
                ? form.slug
                : event.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
            })}
            required
          />
        </label>
        <label>
          URL slug
          <input value={form.slug} disabled={Boolean(category)} onChange={(event) => setForm({ ...form, slug: event.target.value })} required />
        </label>
        <label>
          Short kicker
          <input value={form.kicker} onChange={(event) => setForm({ ...form, kicker: event.target.value })} required />
        </label>
        <label>
          Display order
          <input type="number" min="0" max="999" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: Number(event.target.value) })} />
        </label>
        <label>
          Accent colour
          <input type="color" value={form.tone} onChange={(event) => setForm({ ...form, tone: event.target.value })} />
        </label>
        <label>
          Menu symbol
          <input value={form.emoji} maxLength={8} onChange={(event) => setForm({ ...form, emoji: event.target.value })} />
        </label>
        <label className="wide">
          Description
          <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required />
        </label>
        <label className="wide">
          Category image URL or local asset path
          <input value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value })} placeholder="/categories/your-category.webp" required />
        </label>
      </div>
      {error && <p className="adminFormError">{error}</p>}
      <button className="adminPrimary" disabled={busy}>
        {busy ? "SAVING…" : category ? "SAVE CATEGORY CHANGES →" : "CREATE CATEGORY →"}
      </button>
    </form>
  );
}

function GstPanel({
  data,
  setToast,
}: {
  data: DashboardData;
  setToast: (value: string) => void;
}) {
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [gst, setGst] = useState<GstData | null>(null);
  const [settings, setSettings] = useState<GstData["settings"] | null>(null);
  const [busy, setBusy] = useState(false);
  const [taxDraft, setTaxDraft] = useState({
    target: `product:${products[0]?.slug || ""}`,
    hsnCode: "",
    gstRate: 5,
    cessRate: 0,
    classificationNote: "",
  });
  const allProducts = [
    ...products.map((product) => ({
      slug: product.slug,
      name: product.name,
      categorySlug: product.categorySlug,
    })),
    ...data.customProducts.map((product) => ({
      slug: product.slug,
      name: product.name,
      categorySlug: product.categorySlug,
    })),
  ];

  const load = useCallback(async () => {
    const response = await fetch(`/api/admin/gst?period=${period}`, {
      cache: "no-store",
    });
    const result = (await response.json()) as GstData & { error?: string };
    if (!response.ok) {
      setToast(result.error || "GST report could not be loaded");
      return;
    }
    setGst(result);
    setSettings(result.settings);
  }, [period, setToast]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function saveSettings(event: FormEvent) {
    event.preventDefault();
    if (!settings) return;
    setBusy(true);
    const response = await fetch("/api/admin/gst", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(settings),
    });
    const result = (await response.json()) as { error?: string };
    setBusy(false);
    setToast(response.ok ? "GST business settings saved" : result.error || "Unable to save GST settings");
    if (response.ok) await load();
  }

  async function saveTaxProfile(event: FormEvent) {
    event.preventDefault();
    const [scope, value] = taxDraft.target.split(":");
    const productSlugs =
      scope === "category"
        ? allProducts
            .filter((product) => product.categorySlug === value)
            .map((product) => product.slug)
        : [value];
    setBusy(true);
    const response = await fetch("/api/admin/gst", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...taxDraft, productSlugs }),
    });
    const result = (await response.json()) as {
      error?: string;
      updatedProducts?: number;
    };
    setBusy(false);
    setToast(
      response.ok
        ? `${result.updatedProducts} tax classification${result.updatedProducts === 1 ? "" : "s"} verified`
        : result.error || "Unable to save tax classification",
    );
    if (response.ok) await load();
  }

  async function issueInvoice(orderId: number) {
    setBusy(true);
    const response = await fetch("/api/admin/gst/invoices", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ orderId }),
    });
    const result = (await response.json()) as {
      error?: string;
      invoice?: { invoiceNumber: string };
    };
    setBusy(false);
    setToast(
      response.ok
        ? `Tax invoice ${result.invoice?.invoiceNumber} issued`
        : result.error || "Invoice could not be issued",
    );
    if (response.ok) await load();
  }

  if (!gst || !settings) {
    return <div className="accountSkeleton">Preparing GST ledger…</div>;
  }
  const invoicedOrders = new Set(gst.invoices.map((invoice) => invoice.orderId));
  const invoiceCandidates = data.orders.filter(
    (order) => order.paymentStatus === "paid" && !invoicedOrders.has(order.id),
  );
  const summary = [
    ["GST COLLECTED", `₹${formatInr(gst.summary.grossTaxPaise / 100)}`, period],
    ["TAXABLE SALES", `₹${formatInr(gst.summary.taxableValuePaise / 100)}`, "OUTWARD"],
    ["INVOICES", String(gst.summary.issuedInvoices), "ISSUED"],
    ["GROSS SALES", `₹${formatInr(gst.summary.invoiceValuePaise / 100)}`, "TAX INCLUSIVE"],
  ];

  return (
    <div className="gstWorkspace">
      <div className="gstToolbar">
        <label>
          RETURN PERIOD
          <input type="month" value={period} onChange={(event) => setPeriod(event.target.value)} />
        </label>
        <div>
          <a href={`/api/admin/gst?period=${period}&download=csv`}>
            DOWNLOAD GST WORKING CSV
          </a>
          <a href={`/api/admin/gst?period=${period}&download=json`}>
            DOWNLOAD JSON
          </a>
        </div>
      </div>
      <div className="insightSummary gstSummary">
        {summary.map(([label, value, note]) => (
          <article key={label}>
            <small>{label}</small>
            <b>{value}</b>
            <span>{note}</span>
          </article>
        ))}
      </div>
      <div className="gstReturnGrid">
        <article>
          <small>GSTR-3B · TABLE 3.1(a)</small>
          <h3>Outward taxable supplies</h3>
          {[
            ["Taxable value", gst.gstr3b.table31a.taxableValuePaise],
            ["Integrated tax", gst.gstr3b.table31a.integratedTaxPaise],
            ["Central tax", gst.gstr3b.table31a.centralTaxPaise],
            ["State tax", gst.gstr3b.table31a.stateTaxPaise],
            ["Cess", gst.gstr3b.table31a.cessPaise],
            ["Nil / exempt outward · 3.1(c)", gst.gstr3b.table31c.outwardValuePaise],
          ].map(([label, value]) => (
            <p key={String(label)}>
              <span>{label}</span>
              <b>₹{formatInr(Number(value) / 100)}</b>
            </p>
          ))}
        </article>
        <article>
          <small>GSTR-1 · OUTWARD SUPPLIES</small>
          <h3>Invoice reporting map</h3>
          <p><span>B2B invoice level</span><b>{gst.gstr1.b2bInvoices}</b></p>
          <p><span>B2C large · inter-state over ₹1 lakh</span><b>{gst.gstr1.b2clInvoices}</b></p>
          <p><span>B2C other · state/rate summary</span><b>{gst.gstr1.b2csInvoices}</b></p>
          <p><span>Documents issued</span><b>{gst.gstr1.documentsIssued}</b></p>
        </article>
        <article className="gstReadiness">
          <small>FILING READINESS</small>
          <h3>{gst.missingTaxProfiles.length ? "Action required" : "Tax masters ready"}</h3>
          <p>
            {gst.missingTaxProfiles.length
              ? `${gst.missingTaxProfiles.length} catalogue products still need a verified HSN and rate.`
              : "Every current catalogue product has a saved tax classification."}
          </p>
          <strong>{settings.enabled ? "GST INVOICING ENABLED" : "GST SETTINGS NOT ENABLED"}</strong>
        </article>
      </div>

      {gst.summary.unadjustedReturns > 0 && (
        <section className="gstReconciliationAlert">
          <div>
            <small>RETURN / CREDIT-NOTE RECONCILIATION</small>
            <h3>
              {gst.summary.unadjustedReturns} return
              {gst.summary.unadjustedReturns === 1 ? "" : "s"} need tax review
            </h3>
            <p>{gst.reconciliation.note}</p>
          </div>
          <strong>
            ₹{formatInr(gst.summary.unadjustedReturnValuePaise / 100)} NOT
            NETTED
          </strong>
        </section>
      )}

      <section className="gstConfigGrid">
        <form className="gstSettings" onSubmit={saveSettings}>
          <header>
            <div>
              <small>BUSINESS TAX IDENTITY</small>
              <h3>Invoice settings</h3>
            </div>
            <label className="gstToggle">
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(event) => setSettings({ ...settings, enabled: event.target.checked })}
              />
              Enable issuing
            </label>
          </header>
          <div className="gstFormGrid">
            {([
              ["legalName", "GST legal name"],
              ["tradeName", "Trade name"],
              ["gstin", "GSTIN"],
              ["pan", "PAN"],
              ["addressLine1", "Registered address"],
              ["addressLine2", "Address line 2"],
              ["city", "City"],
              ["stateName", "State / UT"],
              ["stateCode", "GST state code"],
              ["postalCode", "PIN code"],
              ["invoicePrefix", "Invoice prefix · max 4"],
            ] as const).map(([field, label]) => (
              <label key={field} className={field.startsWith("address") ? "wide" : ""}>
                {label}
                <input
                  value={settings[field] ?? ""}
                  onChange={(event) =>
                    setSettings({ ...settings, [field]: event.target.value })
                  }
                  maxLength={field === "gstin" ? 15 : field === "invoicePrefix" ? 4 : undefined}
                />
              </label>
            ))}
          </div>
          <label className="gstComplianceCheck">
            <input
              type="checkbox"
              checked={settings.eInvoiceApplicable}
              onChange={(event) =>
                setSettings({ ...settings, eInvoiceApplicable: event.target.checked })
              }
            />
            This GSTIN is covered by the B2B e-invoice mandate. B2B invoice issue will stay blocked until an authorised IRP/GSP returns the IRN and signed QR code.
          </label>
          <button className="adminPrimary" disabled={busy}>SAVE GST SETTINGS</button>
        </form>

        <form className="gstTaxMaster" onSubmit={saveTaxProfile}>
          <header>
            <small>PRODUCT TAX MASTER</small>
            <h3>Verify HSN and GST rate</h3>
            <p>Rates vary by classification and product condition. Save only a CA-verified classification.</p>
          </header>
          <label>
            Apply to
            <select value={taxDraft.target} onChange={(event) => setTaxDraft({ ...taxDraft, target: event.target.value })}>
              <optgroup label="One product">
                {allProducts.map((product) => (
                  <option value={`product:${product.slug}`} key={product.slug}>{product.name}</option>
                ))}
              </optgroup>
              <optgroup label="Entire category">
                {categories.map((category) => (
                  <option value={`category:${category.slug}`} key={category.slug}>{category.name} · all products</option>
                ))}
              </optgroup>
            </select>
          </label>
          <div className="gstRateGrid">
            <label>
              HSN code
              <input value={taxDraft.hsnCode} onChange={(event) => setTaxDraft({ ...taxDraft, hsnCode: event.target.value.replace(/\D/g, "") })} minLength={4} maxLength={8} required />
            </label>
            <label>
              GST %
              <select value={taxDraft.gstRate} onChange={(event) => setTaxDraft({ ...taxDraft, gstRate: Number(event.target.value) })}>
                {[0, 5, 12, 18, 28, 40].map((rate) => <option value={rate} key={rate}>{rate}%</option>)}
              </select>
            </label>
            <label>
              Cess %
              <input type="number" min="0" max="100" step="0.01" value={taxDraft.cessRate} onChange={(event) => setTaxDraft({ ...taxDraft, cessRate: Number(event.target.value) })} />
            </label>
            <div className="gstFixedUqc">
              <small>UQC</small>
              <b>NOS</b>
              <span>Retail pack count; pack size remains on each invoice line.</span>
            </div>
          </div>
          <label>
            Classification note / CA reference
            <textarea value={taxDraft.classificationNote} onChange={(event) => setTaxDraft({ ...taxDraft, classificationNote: event.target.value })} placeholder="Why this HSN and rate applies" />
          </label>
          <button className="adminPrimary" disabled={busy}>VERIFY TAX CLASSIFICATION →</button>
        </form>
      </section>

      <section className="gstInvoiceDesk">
        <header>
          <div>
            <small>INVOICE CONTROL</small>
            <h3>Paid orders awaiting invoice</h3>
          </div>
          <span>{invoiceCandidates.length} READY</span>
        </header>
        {invoiceCandidates.length ? invoiceCandidates.map((order) => (
          <article key={order.id}>
            <div><small>ORDER</small><b>{order.orderNumber}</b></div>
            <div><small>VALUE</small><b>₹{formatInr(order.totalPaise / 100)}</b></div>
            <div><small>PLACED</small><b>{new Date(order.placedAt).toLocaleDateString("en-IN")}</b></div>
            <button disabled={busy} onClick={() => issueInvoice(order.id)}>ISSUE TAX INVOICE</button>
          </article>
        )) : <p className="insightEmpty">No paid orders are waiting for an invoice.</p>}
      </section>

      <section className="gstInvoiceDesk">
        <header>
          <div>
            <small>MONTHLY REGISTER</small>
            <h3>Issued tax invoices</h3>
          </div>
          <span>{gst.invoices.length} DOCUMENTS</span>
        </header>
        {gst.invoices.map((invoice) => (
          <article key={invoice.id}>
            <div><small>INVOICE</small><b>{invoice.invoiceNumber}</b></div>
            <div><small>RECIPIENT</small><b>{invoice.buyerLegalName}</b></div>
            <div><small>VALUE</small><b>₹{formatInr(invoice.totalPaise / 100)}</b></div>
            <Link href={`/invoice/${invoice.id}`}>VIEW / PRINT ↗</Link>
          </article>
        ))}
      </section>
      <p className="gstDisclaimer">
        Working exports support reconciliation and return preparation. Review them with your tax professional and use the latest GST Offline Utility or an authorised GSP for portal filing; this module does not submit a return or claim filing success.
      </p>
    </div>
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

type IntegrationProviderStatus = {
  provider: string;
  group: string;
  name: string;
  note: string;
  testable: boolean;
  configured: boolean;
  source: "admin" | "environment" | "none";
  values: Record<string, string>;
  secretHints: Record<string, string>;
  lastTestStatus: "passed" | "failed" | null;
  lastTestMessage: string | null;
  lastTestedAt: number | null;
  fields: Array<{
    key: string;
    label: string;
    type: "text" | "email" | "password" | "select";
    required?: boolean;
    placeholder?: string;
    help?: string;
    options?: Array<{ value: string; label: string }>;
  }>;
};

function IntegrationPanel({
  reload,
  setToast,
}: {
  reload: () => Promise<void>;
  setToast: (value: string) => void;
}) {
  const [providers, setProviders] = useState<IntegrationProviderStatus[]>([]);
  const [selected, setSelected] = useState("");
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState("");

  useEffect(() => {
    let activeRequest = true;
    fetch("/api/admin/integrations", { cache: "no-store" })
      .then(async (response) => ({
        ok: response.ok,
        result: (await response.json()) as {
          providers?: IntegrationProviderStatus[];
          error?: string;
        },
      }))
      .then(({ ok, result }) => {
        if (!activeRequest) return;
        if (ok) setProviders(result.providers || []);
        else setToast(result.error || "Could not load integrations");
      })
      .catch(() => {
        if (activeRequest) setToast("Could not load integrations");
      });
    return () => {
      activeRequest = false;
    };
  }, [setToast]);

  const active = providers.find((provider) => provider.provider === selected);
  function openProvider(provider: IntegrationProviderStatus) {
    setSelected(provider.provider);
    setDraft({ ...provider.values });
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!active) return;
    setBusy("save");
    const response = await fetch("/api/admin/integrations", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ provider: active.provider, values: draft }),
    });
    const result = (await response.json()) as {
      providers?: IntegrationProviderStatus[];
      error?: string;
    };
    setBusy("");
    if (!response.ok) {
      setToast(result.error || "Could not save integration");
      return;
    }
    setProviders(result.providers || []);
    setDraft(
      result.providers?.find((provider) => provider.provider === active.provider)
        ?.values || {},
    );
    setToast(`${active.name} settings saved securely`);
    await reload();
  }

  async function test() {
    if (!active) return;
    setBusy("test");
    setToast(`Testing ${active.name}…`);
    const response = await fetch("/api/admin/integrations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ provider: active.provider }),
    });
    const result = (await response.json()) as {
      providers?: IntegrationProviderStatus[];
      message?: string;
      error?: string;
    };
    setBusy("");
    if (result.providers) setProviders(result.providers);
    setToast(response.ok ? result.message || "Connection successful" : result.error || "Connection failed");
  }

  const configuredCount = providers.filter((provider) => provider.configured).length;
  return (
    <div className="integrationWorkspace integrationManager">
      <section className="integrationSummary">
        <div>
          <small>SECURE PROVIDER VAULT</small>
          <h3>Connect services without touching code.</h3>
          <p>
            Add or rotate credentials here. Secrets are encrypted in the database,
            masked after saving and never returned to this browser.
          </p>
        </div>
        <b>{configuredCount}<span> / {providers.length} ready</span></b>
      </section>

      <div className="integrationManagerGrid">
        <div className="integrationProviderList">
          {providers.map((provider) => (
            <button
              className={selected === provider.provider ? "active" : ""}
              key={provider.provider}
              onClick={() => openProvider(provider)}
              type="button"
            >
              <span className={`integrationDot ${provider.configured ? "ready" : ""}`} />
              <span>
                <small>{provider.group}</small>
                <b>{provider.name}</b>
                <em>
                  {provider.configured
                    ? provider.source === "admin" ? "ADMIN MANAGED" : "ENVIRONMENT MANAGED"
                    : "SETUP REQUIRED"}
                </em>
              </span>
              <i>→</i>
            </button>
          ))}
        </div>

        {active ? (
          <form className="integrationEditor" onSubmit={save}>
            <header>
              <div>
                <small>{active.group} INTEGRATION</small>
                <h3>{active.name}</h3>
                <p>{active.note}</p>
              </div>
              <span className={active.configured ? "ready" : ""}>
                <i /> {active.configured ? "READY" : "INCOMPLETE"}
              </span>
            </header>
            <div className="integrationFormGrid">
              {active.fields.map((field) => (
                <label key={field.key}>
                  <span>
                    {field.label} {field.required && <em>Required</em>}
                  </span>
                  {field.type === "select" ? (
                    <select
                      value={draft[field.key] || ""}
                      onChange={(event) => setDraft((current) => ({ ...current, [field.key]: event.target.value }))}
                    >
                      <option value="">Choose…</option>
                      {field.options?.map((option) => (
                        <option value={option.value} key={option.value}>{option.label}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      value={draft[field.key] || ""}
                      placeholder={
                        field.type === "password" && active.secretHints[field.key]
                          ? `Saved ${active.secretHints[field.key]} · leave blank to keep`
                          : field.placeholder || ""
                      }
                      autoComplete="off"
                      onChange={(event) => setDraft((current) => ({ ...current, [field.key]: event.target.value }))}
                    />
                  )}
                  {(field.help || (field.type === "password" && active.secretHints[field.key])) && (
                    <small>{field.help || `A saved credential ending ${active.secretHints[field.key]} is active.`}</small>
                  )}
                </label>
              ))}
            </div>
            {active.lastTestMessage && (
              <p className={`integrationTestResult ${active.lastTestStatus || ""}`}>
                <b>{active.lastTestStatus === "passed" ? "LAST TEST PASSED" : "LAST TEST FAILED"}</b>
                {active.lastTestMessage}
                {active.lastTestedAt && <span>{new Date(active.lastTestedAt).toLocaleString()}</span>}
              </p>
            )}
            <footer>
              <p>
                Existing environment variables remain a fallback. Saving here makes
                this provider admin-managed.
              </p>
              {active.testable && (
                <button type="button" disabled={!active.configured || Boolean(busy)} onClick={() => void test()}>
                  {busy === "test" ? "TESTING…" : "TEST CONNECTION"}
                </button>
              )}
              <button className="adminPrimary" type="submit" disabled={Boolean(busy)}>
                {busy === "save" ? "SAVING…" : "SAVE SETTINGS"}
              </button>
            </footer>
          </form>
        ) : (
          <section className="integrationEmpty">
            <span>↗</span>
            <h3>Choose an integration</h3>
            <p>Select a provider to view its required fields and connection status.</p>
          </section>
        )}
      </div>

      <section className="identityIntegration integrationNotice">
        <div>
          <small>ACTIVATION NOTE</small>
          <h3>Credentials are only one part of go-live.</h3>
          <p>
            Payment webhooks, OAuth redirect URLs and WhatsApp templates must also be
            approved in each provider console. K1 keeps checkout inactive until those
            callbacks are verified, preventing accidental live charges.
          </p>
        </div>
        <span className="ready"><i /> ENCRYPTED AT REST</span>
        <span className="ready"><i /> MASKED IN ADMIN</span>
      </section>
    </div>
  );
}

function SupportPanel({
  setToast,
}: {
  setToast: (value: string) => void;
}) {
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  const loadConversations = useCallback(async () => {
    const response = await fetch("/api/admin/support", { cache: "no-store" });
    if (!response.ok) return;
    const result = (await response.json()) as {
      conversations: SupportConversation[];
    };
    setConversations(result.conversations);
    setSelectedId((current) => current ?? result.conversations[0]?.id ?? null);
  }, []);

  const loadMessages = useCallback(async () => {
    if (!selectedId) return;
    const response = await fetch(
      `/api/admin/support?conversationId=${selectedId}`,
      { cache: "no-store" },
    );
    if (!response.ok) return;
    const result = (await response.json()) as { messages: SupportMessage[] };
    setMessages(result.messages);
  }, [selectedId]);

  useEffect(() => {
    const initial = window.setTimeout(() => void loadConversations(), 0);
    const timer = window.setInterval(() => void loadConversations(), 4000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, [loadConversations]);

  useEffect(() => {
    const initial = window.setTimeout(() => void loadMessages(), 0);
    const timer = window.setInterval(() => void loadMessages(), 3500);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, [loadMessages]);

  const selected = conversations.find(
    (conversation) => conversation.id === selectedId,
  );

  async function submitReply(event: FormEvent) {
    event.preventDefault();
    if (!selectedId || !draft.trim()) return;
    setBusy(true);
    const response = await fetch("/api/admin/support", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ conversationId: selectedId, message: draft }),
    });
    setBusy(false);
    if (!response.ok) {
      setToast("Reply could not be sent");
      return;
    }
    setDraft("");
    setToast("Reply sent to the customer");
    await Promise.all([loadMessages(), loadConversations()]);
  }

  async function changeStatus(status: "open" | "resolved") {
    if (!selectedId) return;
    const response = await fetch("/api/admin/support", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ conversationId: selectedId, status }),
    });
    if (response.ok) {
      setToast(status === "resolved" ? "Conversation resolved" : "Conversation reopened");
      await loadConversations();
    }
  }

  return (
    <div className="supportInbox">
      <aside className="supportConversationList">
        <header>
          <div>
            <small>LIVE INBOX</small>
            <b>{conversations.length} conversations</b>
          </div>
          <span>{conversations.reduce((sum, item) => sum + Number(item.unread), 0)} NEW</span>
        </header>
        <div>
          {conversations.map((conversation) => (
            <button
              className={conversation.id === selectedId ? "active" : ""}
              key={conversation.id}
              onClick={() => setSelectedId(conversation.id)}
            >
              <span>
                <b>{conversation.customerName || `Guest ${conversation.id}`}</b>
                <small>{conversation.status.toUpperCase()} · {new Date(conversation.lastMessageAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</small>
              </span>
              {Number(conversation.unread) > 0 && <i>{conversation.unread}</i>}
              <p>{conversation.lastMessage || "Conversation started"}</p>
            </button>
          ))}
          {!conversations.length && (
            <div className="supportInboxEmpty">
              <b>No conversations yet</b>
              <p>New K1 Concierge requests will appear here automatically.</p>
            </div>
          )}
        </div>
      </aside>
      <section className="supportThread">
        {selected ? (
          <>
            <header>
              <div>
                <small>CUSTOMER CONVERSATION</small>
                <h3>{selected.customerName || `Guest ${selected.id}`}</h3>
                <p>{selected.customerEmail || "Anonymous storefront visitor"}</p>
              </div>
              <button
                onClick={() => void changeStatus(selected.status === "resolved" ? "open" : "resolved")}
              >
                {selected.status === "resolved" ? "REOPEN" : "MARK RESOLVED"}
              </button>
            </header>
            <div className="supportThreadMessages" aria-live="polite">
              {messages.map((message) => (
                <article className={message.sender} key={message.id}>
                  <small>{message.sender === "customer" ? "CUSTOMER" : message.sender === "admin" ? "YOU · K1 TEAM" : "CONCIERGE"}</small>
                  <p>{message.body}</p>
                  <time>{new Date(message.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</time>
                </article>
              ))}
            </div>
            <form onSubmit={submitReply}>
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                maxLength={1000}
                placeholder="Write a personal reply from K1…"
                required
              />
              <button disabled={busy}>{busy ? "SENDING…" : "SEND REPLY →"}</button>
            </form>
          </>
        ) : (
          <div className="supportThreadEmpty">
            <span>✦</span>
            <h3>K1 Concierge inbox</h3>
            <p>Select a customer conversation to read and reply.</p>
          </div>
        )}
      </section>
    </div>
  );
}
