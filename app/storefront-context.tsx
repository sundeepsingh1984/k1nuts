"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { formatInr, type StoreProduct } from "./store-data";

type CartLine = { product: StoreProduct; quantity: number };
type StoreContextValue = {
  cart: CartLine[];
  count: number;
  add: (product: StoreProduct) => void;
  remove: (slug: string) => void;
  openCart: () => void;
  signedIn: boolean;
};

const StoreContext = createContext<StoreContextValue | null>(null);

export function StorefrontProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const pathname = usePathname();
  const count = cart.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = cart.reduce(
    (sum, line) => sum + line.product.price * line.quantity,
    0,
  );

  const track = useCallback(
    (event: string, productSlug?: string) => {
      fetch("/api/events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ event, path: pathname, productSlug }),
      }).catch(() => {});
    },
    [pathname],
  );

  useEffect(() => {
    track("page_view");
  }, [track]);

  useEffect(() => {
    fetch("/api/account/session", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((session) => setSignedIn(Boolean(session?.signedIn)))
      .catch(() => setSignedIn(false));
  }, []);

  const add = useCallback(
    (product: StoreProduct) => {
      setCart((lines) => {
        const found = lines.find((line) => line.product.slug === product.slug);
        return found
          ? lines.map((line) =>
              line.product.slug === product.slug
                ? { ...line, quantity: line.quantity + 1 }
                : line,
            )
          : [...lines, { product, quantity: 1 }];
      });
      setCartOpen(true);
      track("add_to_cart", product.slug);
    },
    [track],
  );

  function startCheckout() {
    if (!signedIn) {
      setCartOpen(false);
      track("checkout_login_gate");
      window.location.href =
        "/signin-with-chatgpt?return_to=%2Faccount%3Ftab%3Daddresses%26checkout%3D1";
      return;
    }
    track("begin_checkout");
    window.location.href = "/account?tab=addresses&checkout=1";
  }

  const value = useMemo(
    () => ({
      cart,
      count,
      add,
      remove: (slug: string) =>
        setCart((lines) => lines.filter((line) => line.product.slug !== slug)),
      openCart: () => setCartOpen(true),
      signedIn,
    }),
    [add, cart, count, signedIn],
  );

  return (
    <StoreContext.Provider value={value}>
      {children}
      <button
        type="button"
        aria-label="Close shopping bag"
        className={`commerceOverlay ${cartOpen ? "show" : ""}`}
        onClick={() => {
          setCartOpen(false);
        }}
      />
      <aside className={`commerceDrawer ${cartOpen ? "open" : ""}`}>
        <div className="drawerTop">
          <div>
            <small>YOUR K1 BAG</small>
            <h2>
              {count} item{count === 1 ? "" : "s"}
            </h2>
          </div>
          <button onClick={() => setCartOpen(false)}>×</button>
        </div>
        <div className="drawerLines">
          {cart.length === 0 ? (
            <div className="bagEmpty">
              <img src="/k1-logo.jpeg" alt="K1 Nut's" />
              <h3>Your pantry awaits.</h3>
              <Link href="/#healthy" onClick={() => setCartOpen(false)}>
                DISCOVER HEALTHY BITES →
              </Link>
            </div>
          ) : (
            cart.map((line) => (
              <div className="drawerLine" key={line.product.slug}>
                <img src={line.product.image} alt="" />
                <div>
                  <Link
                    href={`/product/${line.product.slug}`}
                    onClick={() => setCartOpen(false)}
                  >
                    {line.product.name}
                  </Link>
                  <small>
                    {line.product.weight} · Qty {line.quantity} · 50% OFF
                  </small>
                  <b>₹{formatInr(line.product.price * line.quantity)}</b>
                </div>
                <button onClick={() => value.remove(line.product.slug)}>
                  ×
                </button>
              </div>
            ))
          )}
        </div>
        {cart.length > 0 && (
          <div className="drawerCheckout">
            <div>
              <span>Subtotal</span>
              <b>₹{formatInr(subtotal)}</b>
            </div>
            <small>
              Launch prices include 50% discount on MRP. Shipping calculated at
              checkout.
            </small>
            <button onClick={startCheckout}>
              {signedIn ? "SECURE CHECKOUT" : "LOG IN TO CHECKOUT"}
              <span>→</span>
            </button>
          </div>
        )}
      </aside>
    </StoreContext.Provider>
  );
}

export function useStore() {
  const value = useContext(StoreContext);
  if (!value) throw new Error("Store context missing");
  return value;
}

export function StoreHeader() {
  const { count, openCart, signedIn } = useStore();
  return (
    <>
      <div className="brandBar saleBar">
        <strong>LAUNCH OFFER · FLAT 50% OFF MRP STOREWIDE</strong>
        <span>✦</span> FREE PAN-INDIA SHIPPING ABOVE ₹799
      </div>
      <header className="storeHeader">
        <Link href="/" className="realLogo">
          <img
            src="/k1-logo.jpeg"
            alt="K1 Nut's — Delicacy from the Himalayas"
          />
          <span>
            <b>K1 NUT&apos;S</b>
            <small>DELICACY FROM THE HIMALAYAS</small>
          </span>
        </Link>
        <nav>
          <Link href="/#healthy">Healthy Bites</Link>
          <Link href="/#categories">Shop</Link>
          <Link href="/#story">Our Story</Link>
          <Link href="/#testimonials">Reviews</Link>
        </nav>
        <div className="headerTools">
          <Link href="/admin" className="adminLink">
            Admin
          </Link>
          <Link
            href={
              signedIn
                ? "/account"
                : "/signin-with-chatgpt?return_to=%2Faccount"
            }
            className="accountLink"
            title={signedIn ? "My account" : "Sign in"}
          >
            {signedIn ? "MY K1" : "SIGN IN"}
          </Link>
          <button className="headerBag" onClick={openCart}>
            BAG <b>{count}</b>
          </button>
        </div>
      </header>
    </>
  );
}

export function StoreFooter() {
  return (
    <footer className="newFooter">
      <div>
        <img src="/k1-logo.jpeg" alt="K1 Nut's" />
        <p>
          Delicacy from the Himalayas.
          <br />
          Proudly made in Kashmir.
        </p>
      </div>
      <div>
        <b>SHOP</b>
        <Link href="/category/healthy-snacks">Healthy Snacks</Link>
        <Link href="/category/nuts">Nuts</Link>
        <Link href="/category/dry-fruits-berries">Dry Fruits & Berries</Link>
      </div>
      <div>
        <b>SUPPORT</b>
        <a href="tel:+919086025119">+91 90860 25119</a>
        <a href="tel:+919541243120">+91 95412 43120</a>
        <span>
          Aluchi Bagh, Srinagar
          <br />
          Jammu & Kashmir 190008
        </span>
      </div>
      <div>
        <b>SECURE COMMERCE</b>
        <span>Razorpay · PhonePe · UPI</span>
        <span>Shiprocket · Delhivery</span>
        <Link href="/admin">Store administration</Link>
      </div>
      <small>
        © 2026 K1 Nut&apos;s · ESTD 2023 · Digital pack renders use K1 branding;
        statutory print copy requires final compliance approval.
      </small>
    </footer>
  );
}

export function AddToCartButton({ product }: { product: StoreProduct }) {
  const { add } = useStore();
  return (
    <button className="brandButton" onClick={() => add(product)}>
      ADD TO BAG <span>₹{formatInr(product.price)}</span>
    </button>
  );
}
