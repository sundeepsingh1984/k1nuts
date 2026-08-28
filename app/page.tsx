"use client";

import { useEffect, useMemo, useState } from "react";

type Product = { id: number; name: string; note: string; price: number; old: number; rating: string; color: string; emoji: string; badge?: string };

const products: Product[] = [
  { id: 1, name: "Royal Mamra Almonds", note: "Kashmir · Hand selected", price: 849, old: 999, rating: "4.9", color: "#c8a878", emoji: "🌰", badge: "BESTSELLER" },
  { id: 2, name: "Afghan Anjeer", note: "Naturally sun-dried", price: 699, old: 799, rating: "4.8", color: "#c98770", emoji: "🍂", badge: "NEW HARVEST" },
  { id: 3, name: "Premium Pistachios", note: "Roasted · Lightly salted", price: 749, old: 899, rating: "4.9", color: "#a9b58b", emoji: "🥜" },
  { id: 4, name: "Medjoul Dates", note: "Soft, rich & caramel-like", price: 599, old: 699, rating: "4.7", color: "#9c654a", emoji: "🫘", badge: "15% OFF" },
  { id: 5, name: "Kashmiri Mewa Bites", note: "Fruit, nuts · No refined sugar", price: 449, old: 525, rating: "4.9", color: "#d5b77e", emoji: "🍯", badge: "NEW" },
  { id: 6, name: "Dried Blueberries", note: "Juicy · Antioxidant rich", price: 549, old: 625, rating: "4.8", color: "#8e87a8", emoji: "🫐" },
  { id: 7, name: "California W320 Cashews", note: "Whole · Creamy crunch", price: 649, old: 749, rating: "4.8", color: "#e1cfa9", emoji: "🥜" },
  { id: 8, name: "Walnut Chocolate Truffle", note: "Dark cocoa · Walnut centre", price: 499, old: 575, rating: "4.9", color: "#98725f", emoji: "🍫", badge: "SMALL BATCH" },
];

const categories = [
  { name: "Nuts", note: "Almonds, pistachios, walnuts & more", icon: "🌰", bg: "#f3dfbf" },
  { name: "Dry Fruits & Berries", note: "Figs, berries, raisins & orchard fruit", icon: "🫐", bg: "#d9d7e8" },
  { name: "Spices & Herbs", note: "Fragrant pantry essentials", icon: "🌿", bg: "#e7d5b9" },
  { name: "Healthy Snacks", note: "Mewa bites & chocolate truffles", icon: "🍫", bg: "#e9cfca" },
  { name: "Cold-Pressed Oils", note: "Pure, small-batch nourishment", icon: "🫒", bg: "#d8e4da" },
];

const catalogue = [
  { name: "Nuts", number: "01", intro: "From Kashmir's mountain groves to California's sunlit orchards.", groups: [
    ["Almonds", "Kashmiri Mamra|California Regular|California Sonora|In-shell Kashmiri Regular|In-shell Papershell"],
    ["Pistachios", "Salted Irani|Salted California|Shelled California|Shelled Salted"],
    ["Walnuts · In-shell", "Paper Kashmir|Regular Kashmiri|Chilean|California"],
    ["Walnut Kernels", "Snow White Halves|Light Halves|Light Quarters"],
    ["Hazelnuts", "Raw|Roasted"], ["Macadamia Nuts", "In-shell|Shelled"],
    ["Pine Nuts", "In-shell|Shelled"], ["Pecan Nuts", "In-shell|Shelled"],
    ["Cashews", "W-320|W-240|W-180"],
  ]},
  { name: "Dry Fruits & Berries", number: "02", intro: "Bright, naturally sweet fruit for bowls, bakes and better snacking.", groups: [
    ["Blueberries", "Premium dried"], ["Goji Berries", "Naturally dried"], ["Cranberries", "Whole dried"],
    ["Cherries", "Dried & pitted"], ["Apricots", "Soft dried"],
    ["Figs & Anjeer", "Turkish|Afghani|Small|Medium|Jumbo"], ["Raisins", "Green|Black"],
  ]},
  { name: "Spices & Herbs", number: "03", intro: "A fragrant edit of pure spices and herbs is being sourced for the first release.", groups: [["The pantry collection", "Curated range arriving soon"]]},
  { name: "Healthy Snacks", number: "04", intro: "Real ingredients, joyful flavours and satisfying little rituals.", groups: [
    ["Kashmiri Mewa Bites", "Signature nut & fruit bites"], ["Chocolate Truffle Bites", "Rich cocoa snack bites"], ["Walnut Chocolate Truffle", "Walnut-centred truffles"],
  ]},
  { name: "Cold-Pressed Oils", number: "05", intro: "Freshly pressed, carefully bottled and made for everyday nourishment.", groups: [["The oil collection", "Small-batch range arriving soon"]]},
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
  const [signedIn, setSignedIn] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [authReason, setAuthReason] = useState<"account" | "checkout">("account");
  const [activeCatalogue, setActiveCatalogue] = useState(0);

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

  function openAccount(reason: "account" | "checkout" = "account") {
    setAuthReason(reason);
    setCartOpen(false);
    setLoginOpen(true);
  }

  function beginCheckout() {
    if (!signedIn) {
      openAccount("checkout");
      setToast("Please log in or create an account to checkout");
      return;
    }
    setCheckout(true);
  }

  function completeAuth(name: string) {
    setSignedIn(true);
    setCustomerName(name || "Member");
    setLoginOpen(false);
    setToast(`Welcome to K1 Nuts, ${name || "Member"}`);
    if (authReason === "checkout") {
      setCartOpen(true);
      setCheckout(true);
    }
  }

  return (
    <main>
      <div className="offerbar">FRESH HARVEST SALE <span>•</span> 15% OFF ABOVE ₹1,499 <span>•</span> USE CODE <b>NUTTY15</b></div>
      <nav className="nav">
        <a className="brand" href="#top" aria-label="K1 Nuts home"><span className="brandmark">K1</span><span>K1 NUTS<br/><i>SRINAGAR</i></span></a>
        <button className="menubtn" onClick={() => setMenu(!menu)} aria-label="Toggle navigation">☰</button>
        <div className={`navlinks ${menu ? "show" : ""}`}>
          <a href="#catalogue">Shop all</a><a href="#categories">Collections</a><a href="#gifting">Gifting</a><a href="#story">Our story</a>
        </div>
        <div className="navtools">
          <button onClick={() => setTrackOpen(true)} aria-label="Track order">⌖ <span>Track</span></button>
          <button className={signedIn ? "accountSigned" : ""} onClick={() => openAccount("account")} aria-label={signedIn ? `Account for ${customerName}` : "Log in"}>{signedIn ? customerName.slice(0,1).toUpperCase() : "♙"}</button>
          <button className="bagbtn" onClick={() => setCartOpen(true)} aria-label={`Shopping bag with ${cart.length} items`}>Bag <b>{cart.length}</b></button>
        </div>
      </nav>

      <section className="hero" id="top">
        <div className="grain" />
        <div className="leaf leaf1">⌇</div><div className="leaf leaf2">⌇</div>
        <div className="heroCopy reveal">
          <p className="eyebrow"><span/> K1 NUTS · SRINAGAR, KASHMIR</p>
          <h1>Rare origins.<br/><em>Remarkable taste.</em></h1>
          <p className="heroText">A world of exceptional nuts, dry fruits and nourishing foods — selected for character, graded for quality and packed with care.</p>
          <div className="heroActions"><a href="#catalogue" className="primary">ENTER THE K1 PANTRY <b>→</b></a><button onClick={() => setTrackOpen(true)} className="textBtn">TRACK AN ORDER</button></div>
          <div className="trust"><div><b>100%</b><span>Natural</span></div><div><b>48h</b><span>Farm to pack</span></div><div><b>4.9★</b><span>3,200+ reviews</span></div></div>
        </div>
        <div className="heroVisual" aria-label="Artistic bowl of premium dry fruits">
          <div className="orbit orbit1"><span>PISTACHIO</span></div><div className="orbit orbit2"/>
          <div className="sun"/><div className="bowl"><div className="nuts">🌰 🥜<br/>🫘 🌰 🥜</div></div>
          <div className="floatcard cardOne"><span>THE SIGNATURE</span><b>Kashmiri<br/>Mamra</b></div>
          <div className="floatcard cardTwo"><b>K1</b><span>Nuts · Srinagar</span></div>
        </div>
        <div className="scrollHint">SCROLL TO DISCOVER <span>↓</span></div>
      </section>

      <section className="promise"><span>✦</span><p>From Kashmir to California. <em>Only the exceptional.</em></p><span>✦</span></section>
      <div className="marquee" aria-hidden="true"><div>NUTS <i>✦</i> DRY FRUITS & BERRIES <i>✦</i> SPICES & HERBS <i>✦</i> HEALTHY SNACKS <i>✦</i> COLD-PRESSED OILS <i>✦</i> NUTS <i>✦</i> DRY FRUITS & BERRIES <i>✦</i></div></div>

      <section className="categories section" id="categories">
        <div className="sectionHead"><div><p className="eyebrow"><span/> THE K1 PANTRY</p><h2>Five worlds.<br/><em>Endless goodness.</em></h2></div><a href="#catalogue">EXPLORE THE FULL RANGE →</a></div>
        <div className="categoryGrid">
          {categories.map((category, i) => <a href="#catalogue" onClick={() => setActiveCatalogue(i)} className="category" key={category.name} style={{"--bg": category.bg, "--delay": `${i * 80}ms`} as React.CSSProperties}>
            <div className="catArt"><span>{category.icon}</span><small>0{i+1}</small></div><div><b>{category.name}</b><small>{category.note}</small></div><i>↗</i>
          </a>)}
        </div>
      </section>

      <section className="catalogue section" id="catalogue">
        <div className="catalogueTop"><div><p className="eyebrow light"><span/> EXPLORE EVERY VARIETY</p><h2>The complete<br/><em>K1 collection.</em></h2></div><p>Choose a department, discover origins and grades, then find the pack that belongs in your pantry.</p></div>
        <div className="catalogueTabs" role="tablist" aria-label="Product departments">
          {catalogue.map((cat, i) => <button key={cat.name} className={activeCatalogue === i ? "active" : ""} onClick={() => setActiveCatalogue(i)} role="tab" aria-selected={activeCatalogue === i}><span>{cat.number}</span>{cat.name}</button>)}
        </div>
        <div className="cataloguePanel">
          <div className="catalogueIntro"><span>{catalogue[activeCatalogue].number}</span><h3>{catalogue[activeCatalogue].name}</h3><p>{catalogue[activeCatalogue].intro}</p><a href="#shop">SHOP FEATURED PICKS →</a></div>
          <div className="catalogueGroups">{catalogue[activeCatalogue].groups.map(([name, variants]) => <article key={name}><h4>{name}</h4><div>{variants.split("|").map(variant => <button key={variant} onClick={() => setToast(`${variant} will be available in the full catalogue`)}>{variant}<span>↗</span></button>)}</div></article>)}</div>
        </div>
      </section>

      <section className="products section" id="shop">
        <div className="sectionHead"><div><p className="eyebrow"><span/> K1 SIGNATURE PICKS</p><h2>Most loved, <em>always fresh.</em></h2></div><div className="arrows"><button aria-label="Previous products">←</button><button aria-label="Next products">→</button></div></div>
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
        <div className="ritualArt"><div className="jar">K1<br/><small>NUTS</small></div><div className="almonds">🌰　🌰<br/>　🌰</div></div>
        <div className="ritualCopy"><p className="eyebrow light"><span/> A BETTER RITUAL</p><h2>From their hands,<br/><em>to your table.</em></h2><p>We partner directly with small farms and trusted growers. Every batch is thoughtfully selected, gently processed, and sealed at peak freshness.</p><div className="steps"><span><b>01</b> Ethically sourced</span><span><b>02</b> Quality tested</span><span><b>03</b> Freshly packed</span></div><a href="#gifting">DISCOVER OUR STORY →</a></div>
      </section>

      <section className="gift section" id="gifting">
        <div><p className="eyebrow"><span/> MEANINGFUL GIFTING</p><h2>Beautifully packed.<br/><em>Joyfully opened.</em></h2><p>Curated gift boxes for celebrations, teams, and thoughtful gestures. Personalisation available.</p><button className="primary" onClick={() => setToast("Gift concierge will be available at launch")}>EXPLORE GIFTING <b>→</b></button></div>
        <div className="giftbox"><span className="ribbon">K1 NUTS · SRINAGAR</span><div>✦<br/><b>A gift of<br/>goodness</b></div></div>
      </section>

      <footer><a className="brand footerBrand" href="#top"><span className="brandmark">K1</span><span>K1 NUTS<br/><i>SRINAGAR</i></span></a><p>Exceptional origins. Honest goodness.</p><div className="footerLinks"><a href="#catalogue">Shop all</a><button onClick={() => setTrackOpen(true)}>Track order</button><button onClick={() => openAccount("account")}>My account</button><a href="#story">Our story</a></div><div className="payments"><span>Secure payments</span><b>Razorpay</b><b>PhonePe</b><b>UPI</b></div><small>© 2026 K1 Nuts, Srinagar, Jammu & Kashmir · Shipping-ready with Shiprocket, Delhivery & Amazon Shipping</small></footer>

      <div className={`overlay ${cartOpen || loginOpen || trackOpen ? "visible" : ""}`} onClick={() => { setCartOpen(false); setLoginOpen(false); setTrackOpen(false); }} />
      <aside className={`drawer ${cartOpen ? "open" : ""}`} aria-label="Shopping cart">
        <div className="drawerHead"><div><p className="eyebrow"><span/> YOUR BAG</p><h2>{checkout ? "Checkout" : `${cart.length} good choice${cart.length === 1 ? "" : "s"}`}</h2></div><button onClick={() => {setCartOpen(false); setCheckout(false)}}>×</button></div>
        {!checkout ? <>
          <div className="cartItems">{cart.length === 0 ? <div className="empty"><span>🌰</span><h3>Your bag feels light</h3><p>Add a little goodness to get started.</p><a href="#shop" onClick={() => setCartOpen(false)}>EXPLORE BESTSELLERS</a></div> : cart.map((p, i) => <div className="cartItem" key={`${p.id}-${i}`}><span style={{background:p.color}}>{p.emoji}</span><div><b>{p.name}</b><small>250g · Fresh pack</small><strong>₹{p.price}</strong></div><button onClick={() => setCart(items => items.filter((_, x) => x !== i))}>×</button></div>)}</div>
          {cart.length > 0 && <div className="cartFoot"><div className="coupon"><input value={coupon} onChange={e => setCoupon(e.target.value)} placeholder="Coupon code"/><button onClick={() => { if(coupon.toUpperCase()==="NUTTY15" || coupon.toUpperCase()==="WELCOME10") {setDiscount(true);setToast("Coupon applied — 10% saved") } else setToast("Try WELCOME10 for 10% off")}}>APPLY</button></div>{discount && <p className="saved">You saved ₹{subtotal-total}</p>}<div className="total"><span>Subtotal</span><b>₹{total}</b></div><small>Free shipping above ₹799 · Taxes included</small>{!signedIn && <div className="authGate"><b>Account required</b><span>Log in or sign up to protect your order and track delivery.</span></div>}<button className="checkoutBtn" onClick={beginCheckout}>{signedIn ? "SECURE CHECKOUT" : "LOG IN TO CHECKOUT"} <b>→</b></button></div>}
        </> : <Checkout total={total} onDone={() => {setCart([]);setCheckout(false);setCartOpen(false);setToast("Demo order placed successfully!")}}/>}
      </aside>

      <Modal open={loginOpen} close={() => setLoginOpen(false)} title={authReason === "checkout" ? "Sign in to checkout" : signedIn ? `Hello, ${customerName}` : "Your K1 account"} eyebrow={authReason === "checkout" ? "ONE STEP BEFORE CHECKOUT" : "MEMBER ACCOUNT"}>
        {signedIn ? <div className="accountCard"><span>{customerName.slice(0,1).toUpperCase()}</span><div><b>{customerName}</b><small>K1 Nuts member · Demo account</small></div><button onClick={() => {setSignedIn(false);setCustomerName("");setLoginOpen(false);setToast("You have been logged out")}}>LOG OUT</button></div> : <AccountPanel reason={authReason} onAuthenticated={completeAuth}/>} 
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

function AccountPanel({reason, onAuthenticated}: {reason:"account"|"checkout"; onAuthenticated:(name:string)=>void}) {
  const [mode, setMode] = useState<"login"|"signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const ready = email.includes("@") && password.length >= 4 && (mode === "login" || name.trim().length > 1);
  return <div className="accountPanel">
    <div className="authTabs"><button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>LOG IN</button><button className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>CREATE ACCOUNT</button></div>
    <p>{reason === "checkout" ? "Your account keeps checkout secure and puts order tracking in one place." : mode === "login" ? "Welcome back. View orders, favourites and rewards." : "Join K1 Nuts for a faster checkout and members-only harvests."}</p>
    {mode === "signup" && <label>Full name<input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" autoComplete="name"/></label>}
    <label>Email address<input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email"/></label>
    <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 4 characters" autoComplete={mode === "login" ? "current-password" : "new-password"}/></label>
    <button className="checkoutBtn" disabled={!ready} onClick={() => ready && onAuthenticated(mode === "signup" ? name.trim() : email.split("@")[0])}>{mode === "login" ? "LOG IN" : "CREATE MY ACCOUNT"} <b>→</b></button>
    <div className="divider"><span>or</span></div><button className="social" onClick={() => onAuthenticated("Google Member")}>G&nbsp; CONTINUE WITH GOOGLE</button>
    <small className="fine">Demo account flow. Production launch requires your selected authentication provider.</small>
  </div>
}

function Checkout({total, onDone}: {total:number; onDone:()=>void}) {
  const [pay, setPay] = useState("razorpay");
  return <div className="checkout"><div className="checkoutSteps"><b>1 Delivery</b><b>2 Payment</b><span>3 Done</span></div><label>Full name<input placeholder="Your name"/></label><label>Mobile number<input placeholder="+91 98765 43210"/></label><label>Delivery address<textarea placeholder="House, street, city, PIN code"/></label><p className="methodTitle">Choose payment method</p>{[["razorpay","Razorpay","UPI · Cards · Netbanking"],["phonepe","PhonePe","UPI · Wallet"],["cod","cod","Cash on delivery"]].map(([id,name,note]) => <label className={`payMethod ${pay===id ? "selected":""}`} key={id}><input type="radio" name="payment" checked={pay===id} onChange={() => setPay(id)}/><b>{name}</b><small>{note}</small></label>)}<div className="total"><span>Total payable</span><b>₹{total}</b></div><button className="checkoutBtn" onClick={onDone}>PLACE DEMO ORDER →</button><p className="demoNote">Demo checkout — connect merchant credentials to accept live payments.</p></div>
}
