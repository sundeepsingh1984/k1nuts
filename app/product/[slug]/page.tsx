import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AddToCartButton,
  StoreFooter,
  StoreHeader,
} from "../../storefront-context";
import { formatInr, getProduct, products } from "../../store-data";
import { ProductReviews } from "../../product-reviews";

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();
  const packagingNote =
    product.categorySlug === "cold-pressed-oils"
      ? "Amber glass presentation"
      : product.categorySlug === "healthy-snacks"
        ? "Freshness-sealed PET jar"
        : "Resealable premium pouch";

  return (
    <main className="brandSite">
      <StoreHeader />
      <section className="productDetail">
        <div
          className="productGallery"
          style={{ "--accent": product.accent } as React.CSSProperties}
        >
          <div className="productStamp">
            K1
            <br />
            <span>ESTD 2023</span>
          </div>
          <div className="saleProductBadge">
            <b>50%</b>
            <span>OFF MRP</span>
          </div>
          <img
            src={product.image}
            alt={`${product.name} ${product.weight} K1 packaging`}
            fetchPriority="high"
            decoding="async"
          />
          <div className="galleryNote">
            K1 BRANDED PACK VISUAL · FINAL STATUTORY COPY SUBJECT TO APPROVAL
          </div>
        </div>
        <div className="productSummary">
          <div className="breadcrumbs">
            <Link href="/">HOME</Link>
            <span>/</span>
            <Link href={`/category/${product.categorySlug}`}>
              {product.category.toUpperCase()}
            </Link>
          </div>
          <p className="brandEyebrow">
            <span /> {product.badge ?? "K1 SELECTED"}
          </p>
          <h1>{product.name}</h1>
          <div className="stars">
            ★★★★★ <span>5.0 · K1 GOOGLE RATING</span>
          </div>
          <p className="leadDescription">{product.description}</p>
          <div className="priceLine">
            <b>₹{formatInr(product.price)}</b>
            <del>₹{formatInr(product.mrp)}</del>
            <span>FLAT 50% OFF MRP · TAXES INCLUDED</span>
          </div>
          <div className="weightChoice">
            <span>PACK SIZE</span>
            <button>{product.weight}</button>
          </div>
          <AddToCartButton product={product} />
          <div className="deliveryNotes">
            <span>✦ Free delivery above ₹799</span>
            <span>✦ {packagingNote}</span>
            <span>✦ Shiprocket & Delhivery ready</span>
          </div>
        </div>
      </section>
      <section className="productFacts sectionNew">
        <div>
          <p className="brandEyebrow">
            <span /> WHAT&apos;S INSIDE
          </p>
          <h2>
            Real ingredients.
            <br />
            <em>Nothing to hide.</em>
          </h2>
          <p>
            {product.short} Crafted for clean flavour and reliable everyday
            nourishment.
          </p>
        </div>
        <div className="ingredientList">
          {(
            product.ingredients ?? [
              product.name,
              "Natural ingredients",
              "Freshness-sealed",
            ]
          ).map((ingredient, index) => (
            <span key={ingredient}>
              <b>{String(index + 1).padStart(2, "0")}</b>
              {ingredient}
            </span>
          ))}
        </div>
      </section>
      {product.composition && (
        <section className="composition sectionNew">
          <div>
            <p className="brandEyebrow light">
              <span /> APPROXIMATE COMPOSITION
            </p>
            <h2>
              A balanced
              <br />
              <em>little powerhouse.</em>
            </h2>
          </div>
          <div>
            {product.composition.map(([name, value]) => (
              <div className="compositionRow" key={name}>
                <span>{name}</span>
                <i>
                  <b style={{ width: `${value}%` }} />
                </i>
                <em>{value}%</em>
              </div>
            ))}
          </div>
        </section>
      )}
      <section className="benefitStrip">
        {(
          product.benefits ?? [
            "Quality graded",
            "Freshness packed",
            "K1 selected",
            "Made with care",
          ]
        ).map((benefit, index) => (
          <span key={benefit}>
            <b>0{index + 1}</b>
            {benefit}
          </span>
        ))}
      </section>
      <ProductReviews productSlug={product.slug} productName={product.name} />
      <section className="productStory">
        <img
          src="/k1-logo.jpeg"
          alt="K1 Nut's Delicacy from the Himalayas"
          loading="lazy"
          decoding="async"
        />
        <div>
          <p className="brandEyebrow">
            <span /> THE K1 PROMISE
          </p>
          <h2>
            From our Himalayas,
            <br />
            <em>to your everyday.</em>
          </h2>
          <p>
            Selected with care, packed for freshness and made to bring better
            snacking into the rhythm of real life.
          </p>
          <Link href={`/category/${product.categorySlug}`}>
            EXPLORE MORE {product.category.toUpperCase()} →
          </Link>
        </div>
      </section>
      <StoreFooter />
    </main>
  );
}
