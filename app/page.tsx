"use client";

import { useEffect, useMemo, useState } from "react";

type Product = { id: number; name: string; note: string; price: number; old: number; rating: string; color: string; emoji: string; badge?: string };

const products: Product[] = [
  { id: 1, name: "Royal Mamra Almonds", note: "Kashmir · Hand selected", price: 849, old: 999, rating: "4.9", color: "#c8a878", emoji: "🌰", badge: "BESTSELLER" },
  { id: 2, name: "Afghan Anjeer", note: "Naturally sun-dried", price: 699, old: 799, rating: "4.8", color: "#c98770", emoji: "🍂", badge: "NEW HARVEST" },
  { id: 3, name: "Premium Pistachios", note: "Roasted · Lightly salted", price: 749, old: 899, rating: "4.9", color: "#a9b58b", emoji: "🥜" },
  { id: 4, name: "Medjoul Dates", note: "Soft, rich & caramel-like", price: 599, old: 699, rating: "4.7", color: "#9c654a", emoji: "🫘", badge: "15% OFF" },
];

const categories = [
  ["Dry Fruits", "Almonds, cashews & more", "🌰", "#f3dfbf"],
  ["Nuts & Seeds", "Everyday power snacks", "🥜", "#dfe9ca"],
  ["Gift Boxes", "Thoughtfully curated", "🎁", "#f0d1c4"],
  ["Healthy Bites", "Clean snacking", "🍯", "#d8e4da"],
];

export default function Home() {
  const [cart, setCart] = useState<Product[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [trackOpen, setTrackOpen] = useState(false);
  const [checkout, setCheckout] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(false);
  const [toast, setToast] = useState("");
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    const onScroll = () => document.documentElement.style.setProperty("--scroll", `${window.scrollY}px`);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2400);
    return () => clearTimeout(timer);
  }, [toast]);

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price, 0), [cart]);
  const total = discount ? Math.round(subtotal * .9) : subtotal;

  function add(product: Product) {
    setCart((items) => [...items, product]);
    setToast(`${product.name} added to your bag`);
  }

  return (
    <main>
      <div className="offerbar">FRESH HARVEST SALE <span>•</span> 15% OFF ABOVE ₹1,499 <span>•</span> USE CODE <b>NUTTY15</b></div>
      <nav className="nav">
        <a className="brand" href="#top" aria-label="Nourish and Nut home"><span className="brandmark">N</span><span>NOURISH<br/><i>& NUT</i></span></a>
        <button className="menubtn" onClick={() => setMenu(!menu)} aria-label="Toggle navigation">☰</button>
        <div className={`navlinks ${menu ? "show" : ""}`}>
          <a href="#shop">Shop</a><a href="#categories">Categories</a><a href="#gifting">Gifting</a><a href="#story">Our story</a>
        </div>
        <div className="navtools">
          <button onClick={() => setTrackOpen(true)} aria-label="Track order">⌖ <span>Track</span></button>
          <button onClick={() => setLoginOpen(true)} aria-label="Log in">♙</button>
          <button className="bagbtn" onClick={() => setCartOpen(true)} aria-label={`Shopping bag with ${cart.length} items`}>Bag <b>{cart.length}</b></button>
        </div>
      </nav>

      <section className="hero" id="top">
        <div className="grain" />
        <div className="leaf leaf1">⌇</div><div className="leaf leaf2">⌇</div>
        <div className="heroCopy reveal">
          <p className="eyebrow"><span/> NATURE, PERFECTED</p>
          <h1>Snack better.<br/><em>Live fuller.</em></h1>
          <p className="heroText">Honest, wholesome dry fruits sourced from the world&apos;s finest farms — packed fresh for your everyday rituals.</p>
          <div className="heroActions"><a href="#shop" className="primary">EXPLORE THE HARVEST <b>→</b></a><button onClick={() => setTrackOpen(true)} className="textBtn">TRACK AN ORDER</button></div>
          <div className="trust"><div><b>100%</b><span>Natural</span></div><div><b>48h</b><span>Farm to pack</span></div><div><b>4.9★</b><span>3,200+ reviews</span></div></div>
        </div>
        <div className="heroVisual" aria-label="Artistic bowl of premium dry fruits">
          <div className="orbit orbit1"><span>PISTACHIO</span></div><div className="orbit orbit2"/>
          <div className="sun"/><div className="bowl"><div className="nuts">🌰 🥜<br/>🫘 🌰 🥜</div></div>
          <div className="floatcard cardOne"><span>FROM THE FARM</span><b>Kashmir<br/>Almonds</b></div>
          <div className="floatcard cardTwo"><b>Zero</b><span>Preservatives</span></div>
        </div>
        <div className="scrollHint">SCROLL TO DISCOVER <span>↓</span></div>
      </section>

      <section className="promise"><span>✦</span><p>Pure ingredients. Mindful sourcing. <em>Nothing else.</em></p><span>✦</span></section>

      <section className="categories section" id="categories">
        <div className="sectionHead"><div><p className="eyebrow"><span/> FIND YOUR FAVOURITE</p><h2>Goodness, <em>by the handful.</em></h2></div><a href="#shop">VIEW ALL CATEGORIES →</a></div>
        <div className="categoryGrid">
          {categories.map(([name, note, icon, bg], i) => <a href="#shop" className="category" key={name} style={{"--bg": bg, "--delay": `${i * 80}ms`} as React.CSSProperties}>
            <div className="catArt"><span>{icon}</span></div><div><b>{name}</b><small>{note}</small></div><i>↗</i>
          </a>)}
        </div>
      </section>

      <section className="products section" id="shop">
        <div className="sectionHead"><div><p className="eyebrow"><span/> CROWD FAVOURITES</p><h2>Most loved, <em>always fresh.</em></h2></div><div className="arrows"><button aria-label="Previous products">←</button><button aria-label="Next products">→</button></div></div>
        <div className="productGrid">
          {products.map((p, i) => <article className="product" key={p.id} style={{"--delay": `${i * 100}ms`} as React.CSSProperties}>
            <div className="productArt" style={{"--product": p.color} as React.CSSProperties}>
              {p.badge && <span className="badge">{p.badge}</span>}<button className="heart" aria-label={`Save ${p.name}`}>♡</button><span className="productEmoji">{p.emoji}</span><div className="shadow"/>
              <button className="quick" onClick={() => add(p)}>QUICK ADD +</button>
            </div>
            <div className="productInfo"><p>★ {p.rating} <span>(120+)</span></p><h3>{p.name}</h3><small>{p.note}</small><div><b>₹{p.price}</b><del>₹{p.old}</del><select aria-label={`Size for ${p.name}`}><option>250g</option><option>500g</option></select></div></div>
          </article>)}
        </div>
      </section>

      <section className="ritual" id="story">
        <div className="ritualArt"><div className="jar">N<br/><small>&N</small></div><div className="almonds">🌰　🌰<br/>　🌰</div></div>
        <div className="ritualCopy"><p className="eyebrow light"><span/> A BETTER RITUAL</p><h2>From their hands,<br/><em>to your table.</em></h2><p>We partner directly with small farms and trusted growers. Every batch is thoughtfully selected, gently processed, and sealed at peak freshness.</p><div className="steps"><span><b>01</b> Ethically sourced</span><span><b>02</b> Quality tested</span><span><b>03</b> Freshly packed</span></div><a href="#gifting">DISCOVER OUR STORY →</a></div>
      </section>

      <section className="gift section" id="gifting">
        <div><p className="eyebrow"><span/> MEANINGFUL GIFTING</p><h2>Beautifully packed.<br/><em>Joyfully opened.</em></h2><p>Curated gift boxes for celebrations, teams, and thoughtful gestures. Personalisation available.</p><button className="primary" onClick={() => setToast("Gift concierge will be available at launch")}>EXPLORE GIFTING <b>→</b></button></div>
        <div className="giftbox"><span className="ribbon">NOURISH & NUT</span><div>✦<br/><b>A gift of<br/>goodness</b></div></div>
      </section>

      <footer><a className="brand footerBrand" href="#top"><span className="brandmark">N</span><span>NOURISH<br/><i>& NUT</i></span></a><p>Wholesome snacks for fuller days.</p><div className="footerLinks"><a href="#shop">Shop</a><button onClick={() => setTrackOpen(true)}>Track order</button><button onClick={() => setLoginOpen(true)}>My account</button><a href="#story">Our story</a></div><div className="payments"><span>Secure payments</span><b>Razorpay</b><b>PhonePe</b><b>UPI</b></div><small>© 2026 Nourish & Nut · Shipping-ready with Shiprocket, Delhivery & Amazon Shipping</small></footer>

      <div className={`overlay ${cartOpen || loginOpen || trackOpen ? "visible" : ""}`} onClick={() => { setCartOpen(false); setLoginOpen(false); setTrackOpen(false); }} />
      <aside className={`drawer ${cartOpen ? "open" : ""}`} aria-label="Shopping cart">
        <div className="drawerHead"><div><p className="eyebrow"><span/> YOUR BAG</p><h2>{checkout ? "Checkout" : `${cart.length} good choice${cart.length === 1 ? "" : "s"}`}</h2></div><button onClick={() => {setCartOpen(false); setCheckout(false)}}>×</button></div>
        {!checkout ? <>
          <div className="cartItems">{cart.length === 0 ? <div className="empty"><span>🌰</span><h3>Your bag feels light</h3><p>Add a little goodness to get started.</p><a href="#shop" onClick={() => setCartOpen(false)}>EXPLORE BESTSELLERS</a></div> : cart.map((p, i) => <div className="cartItem" key={`${p.id}-${i}`}><span style={{background:p.color}}>{p.emoji}</span><div><b>{p.name}</b><small>250g · Fresh pack</small><strong>₹{p.price}</strong></div><button onClick={() => setCart(items => items.filter((_, x) => x !== i))}>×</button></div>)}</div>
          {cart.length > 0 && <div className="cartFoot"><div className="coupon"><input value={coupon} onChange={e => setCoupon(e.target.value)} placeholder="Coupon code"/><button onClick={() => { if(coupon.toUpperCase()==="NUTTY15" || coupon.toUpperCase()==="WELCOME10") {setDiscount(true);setToast("Coupon applied — 10% saved") } else setToast("Try WELCOME10 for 10% off")}}>APPLY</button></div>{discount && <p className="saved">You saved ₹{subtotal-total}</p>}<div className="total"><span>Subtotal</span><b>₹{total}</b></div><small>Free shipping above ₹799 · Taxes included</small><button className="checkoutBtn" onClick={() => setCheckout(true)}>SECURE CHECKOUT <b>→</b></button></div>}
        </> : <Checkout total={total} onDone={() => {setCart([]);setCheckout(false);setCartOpen(false);setToast("Demo order placed successfully!")}}/>}
      </aside>

      <Modal open={loginOpen} close={() => setLoginOpen(false)} title="Welcome back" eyebrow="YOUR ACCOUNT">
        <p>Sign in to see your orders, save favourites and check out faster.</p><label>Email address<input type="email" placeholder="you@example.com"/></label><button className="checkoutBtn" onClick={() => setToast("Secure email login will activate with your auth provider")}>CONTINUE WITH EMAIL →</button><div className="divider"><span>or</span></div><button className="social">G&nbsp; Continue with Google</button><small className="fine">By continuing, you agree to our terms and privacy policy.</small>
      </Modal>
      <Modal open={trackOpen} close={() => setTrackOpen(false)} title="Where’s my order?" eyebrow="LIVE ORDER TRACKING">
        <p>Enter the order number from your confirmation email.</p><label>Order number<input placeholder="e.g. NN-10482"/></label><label>Email or mobile<input placeholder="you@example.com"/></label><button className="checkoutBtn" onClick={() => setToast("Tracking will connect to your selected shipping partner")}>TRACK MY ORDER →</button><div className="partnerRow"><span>Shiprocket</span><span>Delhivery</span><span>Amazon Shipping</span></div>
      </Modal>
      {toast && <div className="toast"><span>✓</span>{toast}</div>}
    </main>
  );
}

function Modal({open, close, title, eyebrow, children}: {open:boolean; close:()=>void; title:string; eyebrow:string; children:React.ReactNode}) {
  return <section className={`modal ${open ? "open" : ""}`} role="dialog" aria-modal="true"><button className="modalClose" onClick={close}>×</button><p className="eyebrow"><span/> {eyebrow}</p><h2>{title}</h2>{children}</section>
}

function Checkout({total, onDone}: {total:number; onDone:()=>void}) {
  const [pay, setPay] = useState("razorpay");
  return <div className="checkout"><div className="checkoutSteps"><b>1 Delivery</b><b>2 Payment</b><span>3 Done</span></div><label>Full name<input placeholder="Your name"/></label><label>Mobile number<input placeholder="+91 98765 43210"/></label><label>Delivery address<textarea placeholder="House, street, city, PIN code"/></label><p className="methodTitle">Choose payment method</p>{[["razorpay","Razorpay","UPI · Cards · Netbanking"],["phonepe","PhonePe","UPI · Wallet"],["cod","cod","Cash on delivery"]].map(([id,name,note]) => <label className={`payMethod ${pay===id ? "selected":""}`} key={id}><input type="radio" name="payment" checked={pay===id} onChange={() => setPay(id)}/><b>{name}</b><small>{note}</small></label>)}<div className="total"><span>Total payable</span><b>₹{total}</b></div><button className="checkoutBtn" onClick={onDone}>PLACE DEMO ORDER →</button><p className="demoNote">Demo checkout — connect merchant credentials to accept live payments.</p></div>
}
