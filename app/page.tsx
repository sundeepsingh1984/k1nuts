"use client";

import Link from "next/link";
import { useState } from "react";
import { categories, healthyProducts } from "./store-data";
import { AddToCartButton, StoreFooter, StoreHeader } from "./storefront-context";

export default function Home() {
  const [active, setActive] = useState(0);
  const selected = healthyProducts[active];
  return <main className="brandSite">
    <StoreHeader/>
    <section className="snackHero" id="healthy">
      <div className="heroContour contourOne"/><div className="heroContour contourTwo"/>
      <div className="snackCopy">
        <p className="brandEyebrow"><span/> THE K1 SIGNATURE COLLECTION</p>
        <h1>Healthy bites.<br/><em>Happy life.</em></h1>
        <p>Premium dates, nuts, seeds and cocoa—crafted into four joyful bites, inspired by Kashmir and made for modern everyday energy.</p>
        <div className="snackCtas"><Link className="goldButton" href={`/product/${selected.slug}`}>DISCOVER {selected.name.toUpperCase()} <b>→</b></Link><Link href="#categories">EXPLORE THE PANTRY</Link></div>
        <div className="heroPromises"><span><b>01</b> No added sugar</span><span><b>02</b> Natural ingredients</span><span><b>03</b> Made in Kashmir</span></div>
      </div>
      <div className="snackStage">
        <div className="goldHalo"/>
        {healthyProducts.map((product,index)=><button key={product.slug} onClick={()=>setActive(index)} className={`jarFloat jar${index+1} ${active===index?"selected":""}`} aria-label={`Show ${product.name}`}><img src={product.image} alt={`${product.name} 250g jar`}/><span>{index+1}</span></button>)}
        <div className="activeProduct"><small>{selected.badge}</small><b>{selected.name}</b><span>{selected.short}</span></div>
      </div>
      <div className="verticalSeal">K1 NUT&apos;S · ESTD 2023 · SRINAGAR</div>
    </section>

    <section className="ingredientRibbon"><div>DATES <i>✦</i> NUTS <i>✦</i> SEEDS <i>✦</i> REAL COCOA <i>✦</i> SAFFRON <i>✦</i> MADE WITH LOVE IN KASHMIR <i>✦</i> DATES <i>✦</i> NUTS <i>✦</i></div></section>

    <section className="signature sectionNew">
      <div className="newSectionHead"><div><p className="brandEyebrow"><span/> FOUR FLAVOURS · ONE PHILOSOPHY</p><h2>A better bite,<br/><em>beautifully packed.</em></h2></div><p>Real ingredients. Thoughtful recipes. A convenient 250g jar made for desks, gym bags, gifting and the family pantry.</p></div>
      <div className="signatureGrid">{healthyProducts.map((product,index)=><article className="signatureCard" key={product.slug} style={{"--accent":product.accent} as React.CSSProperties}>
        <Link href={`/product/${product.slug}`} className="signatureImage"><span className="rangeBadge">{product.badge}</span><img src={product.image} alt={product.name}/><i>0{index+1}</i></Link>
        <div className="signatureInfo"><small>{product.short}</small><Link href={`/product/${product.slug}`}>{product.name}</Link><div><b>₹{product.price}</b><span>{product.weight}</span></div><AddToCartButton product={product}/></div>
      </article>)}</div>
    </section>

    <section className="categoryWorlds sectionNew" id="categories">
      <div className="newSectionHead"><div><p className="brandEyebrow"><span/> THE COMPLETE K1 PANTRY</p><h2>Five worlds of<br/><em>natural goodness.</em></h2></div><p>Explore by origin, ingredient and everyday ritual—from rare Kashmiri walnuts to naturally vibrant berries and slow-pressed oils.</p></div>
      <div className="worldGrid">{categories.map((category,index)=><Link key={category.slug} href={`/category/${category.slug}`} className="worldCard" style={{"--tone":category.tone} as React.CSSProperties}><small>0{index+1}</small><span>{category.emoji}</span><div><p>{category.kicker}</p><h3>{category.name}</h3><em>{category.description}</em></div><b>EXPLORE →</b></Link>)}</div>
    </section>

    <section className="brandStory" id="story"><div className="storyImage"><img src="/k1-logo.jpeg" alt="K1 Nut's logo — Delicacy from the Himalayas"/><div className="mountainType">HIMALAYAS</div></div><div className="storyCopy"><p className="brandEyebrow light"><span/> OUR ORIGIN</p><h2>Born in Kashmir.<br/><em>Made to travel.</em></h2><p>K1 Nut&apos;s began with a simple conviction: the best food needs less interference and more integrity. We bring together pure ingredients, careful recipes and premium packaging so Himalayan goodness arrives at your table with its character intact.</p><div className="storyValues"><span><b>2023</b>Established</span><span><b>250g</b>Freshness jars</span><span><b>100%</b>Made with care</span></div><Link href="/category/healthy-snacks">TASTE THE K1 STORY →</Link></div></section>

    <section className="testimonials sectionNew" id="testimonials"><div className="newSectionHead"><div><p className="brandEyebrow"><span/> COMMUNITY NOTES</p><h2>Loved at the<br/><em>first bite.</em></h2></div><div className="ratingSeal"><b>4.9</b><span>★★★★★<br/>EARLY TASTER RATING</span></div></div><div className="testimonialGrid">{[
      ["The saffron mewa bites feel festive without being overly sweet. The jar disappeared from our office pantry in two days.","Aaliya R.","SRINAGAR"],
      ["Beautiful packaging and genuinely satisfying. The chocolate truffle is my new 4 PM ritual with coffee.","Rohan M.","BENGALURU"],
      ["The walnut fudge tastes indulgent, but the ingredient list feels considered. It also made a wonderful gift.","Meher K.","DELHI"],
    ].map(([quote,name,city],index)=><blockquote key={name}><span>“</span><p>{quote}</p><footer><b>{name}</b><small>{city} · EARLY TASTER</small><em>0{index+1}</em></footer></blockquote>)}</div><p className="sampleNote">Preview testimonials for layout approval—replace with verified customer reviews before public launch.</p></section>

    <section className="tradeBanner"><div><p className="brandEyebrow light"><span/> RETAIL · GIFTING · CORPORATE</p><h2>Bring K1 goodness<br/><em>to your shelves.</em></h2></div><div><p>Premium shelf-ready jars, gifting packs and B2B supply for retailers, health-food stores, corporate teams and online resellers.</p><a href="tel:+919086025119" className="goldButton">TALK TO K1 WHOLESALE <b>→</b></a></div></section>
    <StoreFooter/>
  </main>;
}
