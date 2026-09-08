import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StoreFooter, StoreHeader } from "../../storefront-context";
import { getCatalogueProduct } from "../../catalogue-db";
import { ProductReviews } from "../../product-reviews";
import { absoluteUrl, safeJsonLd } from "../../seo";
import { getProductVariants } from "../../store-data";
import { ProductPurchasePanel } from "./product-purchase-panel";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getCatalogueProduct(slug);
  if (!product) return { title: "Product not found", robots: { index: false } };
  const path = `/product/${product.slug}`;
  const image = absoluteUrl(product.image || "/og.png");
  return {
    title: `${product.name} — 50% off MRP`,
    description: product.description.slice(0, 155),
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      title: `${product.name} · K1 Nuts`,
      description: product.short,
      url: path,
      images: [{ url: image, alt: `${product.name} K1 branded packaging` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} · K1 Nuts`,
      description: product.short,
      images: [image],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getCatalogueProduct(slug);
  if (!product) notFound();
  const packagingNote =
    product.categorySlug === "cold-pressed-oils"
      ? "Amber glass presentation"
      : product.categorySlug === "healthy-snacks"
        ? "Freshness-sealed PET jar"
        : "Resealable premium pouch";
  const productPath = `/product/${product.slug}`;
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: [absoluteUrl(product.image || "/og.png")],
    sku: getProductVariants(product)[0]?.sku,
    brand: { "@type": "Brand", name: "K1 Nuts" },
    category: product.category,
    offers: getProductVariants(product).map((variant) => ({
      "@type": "Offer",
      url: absoluteUrl(productPath),
      priceCurrency: "INR",
      price: variant.price.toFixed(2),
      sku: variant.sku,
      availability:
        variant.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    })),
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      {
        "@type": "ListItem",
        position: 2,
        name: product.category,
        item: absoluteUrl(`/category/${product.categorySlug}`),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.name,
        item: absoluteUrl(productPath),
      },
    ],
  };

  return (
    <main className="brandSite">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbSchema) }}
      />
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
          <ProductPurchasePanel product={product} />
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
