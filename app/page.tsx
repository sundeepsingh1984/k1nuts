"use client";

import Link from "next/link";
import { categories, formatInr, healthyProducts } from "./store-data";
import {
  AddToCartButton,
  StoreFooter,
  StoreHeader,
} from "./storefront-context";

const googleMapsUrl =
  "https://www.google.com/maps/place/K1+nuts/@34.0586242,74.7972288,17z/data=!3m1!4b1!4m6!3m5!1s0x38e18f251fbd8967:0xda71c93f397abc03!8m2!3d34.0586242!4d74.7972288!16s%2Fg%2F11y58v_gcg";

const googleReviews = [
  {
    quote: "The dry fruits were fresh.",
    name: "Parth Sanghavi",
    detail: "Verified Google review",
  },
  {
    quote: "The nuts/seeds mix was great and really tasty.",
    name: "Jagdeep Kochar",
    detail: "Verified Google review",
  },
  {
    quote: "Quality of dry fruits is very good.",
    name: "Jaskirat Singh Gujral",
    detail: "Verified Google review",
  },
];

export default function Home() {
  return (
    <main className="brandSite k1Home">
      <StoreHeader />

      <section className="cinemaHero" id="healthy">
        <div className="heroAurora heroAuroraOne" />
        <div className="heroAurora heroAuroraTwo" />
        <div className="heroGridLines" />
        <div className="cinemaCopy">
          <p className="brandEyebrow">
            <span /> ENERGY, REIMAGINED IN KASHMIR
          </p>
          <div className="heroEdition">
            <b>01</b>
            <span>
              THE HEALTHY
              <br />
              SNACKIVERSE
            </span>
          </div>
          <div className="saleHeroFlag">
            <b>50%</b>
            <span>
              OFF MRP
              <br />
              ON EVERY PRODUCT
            </span>
          </div>
          <h1>
            Goodness
            <br />
            in <em>motion.</em>
          </h1>
          <p className="heroLead">
            Dates become energy. Nuts become ritual. Cocoa becomes joy. Meet
            four uncompromising bites made to move with modern life.
          </p>
          <div className="snackCtas">
            <Link className="goldButton" href="/category/healthy-snacks">
              ENTER THE COLLECTION <b>→</b>
            </Link>
            <a href="#bestsellers">SEE THE BEST OF K1</a>
          </div>
          <div className="heroProof">
            <span>
              <b>0</b> ADDED SUGAR
            </span>
            <span>
              <b>4</b> SIGNATURE RECIPES
            </span>
            <span>
              <b>1</b> KASHMIRI SOUL
            </span>
          </div>
        </div>

        <div
          className="cubeStage"
          aria-label="Rotating K1 healthy snack collection"
        >
          <div className="orbit orbitOne">
            <span>DATES</span>
            <span>COCOA</span>
          </div>
          <div className="orbit orbitTwo">
            <span>SAFFRON</span>
            <span>WALNUT</span>
          </div>
          <div className="cubeViewport">
            <div className="productCube">
              <Link
                className="cubeFace cubeFront"
                href={`/product/${healthyProducts[0].slug}`}
              >
                <img
                  src={healthyProducts[0].image}
                  alt={healthyProducts[0].name}
                />
              </Link>
              <Link
                className="cubeFace cubeRight"
                href={`/product/${healthyProducts[1].slug}`}
              >
                <img
                  src={healthyProducts[1].image}
                  alt={healthyProducts[1].name}
                />
              </Link>
              <Link
                className="cubeFace cubeBack"
                href={`/product/${healthyProducts[2].slug}`}
              >
                <img
                  src={healthyProducts[2].image}
                  alt={healthyProducts[2].name}
                />
              </Link>
              <Link
                className="cubeFace cubeLeft"
                href={`/product/${healthyProducts[3].slug}`}
              >
                <img
                  src={healthyProducts[3].image}
                  alt={healthyProducts[3].name}
                />
              </Link>
              <div className="cubeFace cubeTop">
                <img src="/k1-logo.jpeg" alt="K1 Nut's" />
              </div>
              <div className="cubeFace cubeBottom">
                <span>
                  HEALTHY
                  <br />
                  BITES
                  <br />
                  <b>HAPPY LIFE</b>
                </span>
              </div>
            </div>
          </div>
          <div className="cubeShadow" />
          <p className="cubeHint">
            <i /> HOVER TO HOLD · TAP A SIDE TO EXPLORE
          </p>
        </div>
        <div className="verticalSeal">K1 NUT&apos;S · ESTD 2023 · SRINAGAR</div>
      </section>

      <section className="ingredientRibbon">
        <div>
          DATES <i>✦</i> NUTS <i>✦</i> SEEDS <i>✦</i> REAL COCOA <i>✦</i>{" "}
          SAFFRON <i>✦</i> MADE WITH LOVE IN KASHMIR <i>✦</i> DATES <i>✦</i>{" "}
          NUTS <i>✦</i>
        </div>
      </section>

      <section className="brandManifesto" id="manifesto">
        <p>
          WE DON&apos;T MAKE
          <br />
          <em>EMPTY CALORIES.</em>
        </p>
        <div>
          <span>01</span>
          <h2>We make small, mighty rituals.</h2>
          <p>
            Every K1 bite begins with an ingredient you can name and a reason
            for being there—energy, texture, flavour or nourishment. Nothing
            ornamental. Nothing forgettable.
          </p>
        </div>
      </section>

      <section className="signature sectionNew" id="bestsellers">
        <div className="newSectionHead">
          <div>
            <p className="brandEyebrow">
              <span /> THE BEST OF K1
            </p>
            <h2>
              Four icons.
              <br />
              <em>One bold standard.</em>
            </h2>
          </div>
          <p>
            Made for the desk drawer, the school bag, the mountain drive and the
            gift table. Choose the bite that matches your moment.
          </p>
        </div>
        <div className="signatureGrid">
          {healthyProducts.map((product, index) => (
            <article
              className="signatureCard"
              key={product.slug}
              style={{ "--accent": product.accent } as React.CSSProperties}
            >
              <Link
                href={`/product/${product.slug}`}
                className="signatureImage"
              >
                <span className="rangeBadge">{product.badge}</span>
                <img src={product.image} alt={product.name} />
                <i>0{index + 1}</i>
              </Link>
              <div className="signatureInfo">
                <small>{product.short}</small>
                <Link href={`/product/${product.slug}`}>{product.name}</Link>
                <div>
                  <b>₹{formatInr(product.price)}</b>
                  <del>₹{formatInr(product.mrp)}</del>
                  <span>{product.weight} · 50% OFF</span>
                </div>
                <AddToCartButton product={product} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="categoryGallery sectionNew" id="categories">
        <div className="newSectionHead">
          <div>
            <p className="brandEyebrow">
              <span /> THE COMPLETE K1 PANTRY
            </p>
            <h2>
              Five worlds.
              <br />
              <em>One Himalayan heart.</em>
            </h2>
          </div>
          <p>
            From rare kernels and orchard fruit to aromatic spices and
            slow-pressed oils—enter a pantry curated for flavour, wellbeing and
            gifting.
          </p>
        </div>
        <div className="categoryMosaic">
          {categories.map((category, index) => (
            <Link
              key={category.slug}
              href={`/category/${category.slug}`}
              className={`categoryScene ${index === 0 ? "categorySceneLead" : ""}`}
            >
              <img src={category.image} alt={`${category.name} by K1 Nut's`} />
              <div className="categoryShade" />
              <img className="categoryLogo" src="/k1-logo.jpeg" alt="" />
              <small>0{index + 1} / K1 PANTRY</small>
              <div>
                <p>{category.kicker}</p>
                <h3>{category.name}</h3>
                <span>{category.description}</span>
              </div>
              <b>
                EXPLORE COLLECTION <i>→</i>
              </b>
            </Link>
          ))}
        </div>
      </section>

      <section className="originStory" id="story">
        <div className="originVisual">
          <img
            className="originLandscape"
            src="/categories/spices-herbs.png"
            alt="Kashmiri saffron and spices overlooking the Himalayas"
          />
          <div className="originStamp">
            <img src="/k1-logo.jpeg" alt="K1 Nut's logo" />
            <span>
              DELICACY
              <br />
              FROM THE
              <br />
              HIMALAYAS
            </span>
          </div>
          <p>
            KASHMIR
            <br />
            <em>34.0837° N</em>
          </p>
        </div>
        <div className="originCopy">
          <p className="brandEyebrow light">
            <span /> THIS IS OUR STORY
          </p>
          <h2>
            A valley taught us
            <br />
            <em>what abundance means.</em>
          </h2>
          <p className="storyIntro">
            Before K1 was a jar on a shelf, it was a Kashmiri way of welcoming
            people: walnuts cracked around a conversation, saffron warming a
            cup, dried fruit carried through winter, and the best handful always
            offered to a guest.
          </p>
          <div className="storyChapters">
            <article>
              <b>01</b>
              <div>
                <h3>Keep the ingredient honest.</h3>
                <p>
                  We select for origin, grade, freshness and flavour—then let
                  each ingredient remain recognisably itself.
                </p>
              </div>
            </article>
            <article>
              <b>02</b>
              <div>
                <h3>Make tradition travel.</h3>
                <p>
                  Our recipes carry the warmth of Kashmir into modern rituals:
                  better snacking, thoughtful gifting and everyday nourishment.
                </p>
              </div>
            </article>
            <article>
              <b>03</b>
              <div>
                <h3>Pack joy with precision.</h3>
                <p>
                  Beautiful, freshness-minded packaging protects what matters
                  and makes every K1 jar feel worthy of giving.
                </p>
              </div>
            </article>
          </div>
          <div className="storyPromise">
            FROM OUR HOME IN SRINAGAR <span>→</span> TO YOUR EVERYDAY
          </div>
        </div>
      </section>

      <section className="googleReviews sectionNew" id="testimonials">
        <div className="reviewHeader">
          <div>
            <p className="brandEyebrow">
              <span /> REAL WORDS · REAL CUSTOMERS
            </p>
            <h2>
              Five stars,
              <br />
              <em>straight from Google.</em>
            </h2>
          </div>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noreferrer"
            className="googleScore"
          >
            <span>G</span>
            <b>5.0</b>
            <div>
              <em>★★★★★</em>
              <small>13 GOOGLE REVIEWS</small>
            </div>
          </a>
        </div>
        <div className="reviewRail">
          {googleReviews.map((review, index) => (
            <blockquote key={review.name}>
              <div className="reviewStars">★★★★★</div>
              <p>“{review.quote}”</p>
              <footer>
                <span>{review.name}</span>
                <small>{review.detail}</small>
                <b>0{index + 1}</b>
              </footer>
            </blockquote>
          ))}
        </div>
        <div className="reviewSource">
          <span>Verified from the K1 Nuts Google listing</span>
          <a href={googleMapsUrl} target="_blank" rel="noreferrer">
            READ ALL REVIEWS ON GOOGLE ↗
          </a>
        </div>
      </section>

      <section className="tradeBanner" id="wholesale">
        <div>
          <p className="brandEyebrow light">
            <span /> RETAIL · GIFTING · CORPORATE
          </p>
          <h2>
            Put something
            <br />
            <em>remarkable on the table.</em>
          </h2>
        </div>
        <div>
          <p>
            Premium shelf-ready jars, gifting packs and B2B supply for
            retailers, health-food stores, corporate teams and online resellers.
          </p>
          <a href="tel:+919086025119" className="goldButton">
            TALK TO K1 WHOLESALE <b>→</b>
          </a>
        </div>
      </section>
      <StoreFooter />
    </main>
  );
}
