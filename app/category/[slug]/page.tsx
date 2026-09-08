import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategoryCatalogue } from "../../catalogue-db";
import { categories, getCategory } from "../../store-data";
import { StoreFooter, StoreHeader } from "../../storefront-context";
import { absoluteUrl, safeJsonLd } from "../../seo";
import { CategoryCatalogue } from "./category-catalogue";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) return { title: "Collection not found", robots: { index: false } };
  const path = `/category/${category.slug}`;
  const image = absoluteUrl(category.image);
  return {
    title: `${category.name} — 50% off MRP`,
    description: category.description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      title: `${category.name} · K1 Nuts`,
      description: category.description,
      url: path,
      images: [{ url: image, alt: `${category.name} from K1 Nuts` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${category.name} · K1 Nuts`,
      description: category.description,
      images: [image],
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();
  const products = await getCategoryCatalogue(slug);
  const collectionPath = `/category/${category.slug}`;
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: category.name,
    description: category.description,
    url: absoluteUrl(collectionPath),
    primaryImageOfPage: absoluteUrl(category.image),
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: products.length,
      itemListElement: products.map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: product.name,
        url: absoluteUrl(`/product/${product.slug}`),
      })),
    },
  };

  return (
    <main className="brandSite categoryPage">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(collectionSchema) }}
      />
      <StoreHeader />
      <section
        className="categoryHeroPro"
        style={{ "--tone": category.tone } as React.CSSProperties}
      >
        <div className="categoryHeroCopy">
          <div className="breadcrumbs">
            <Link href="/">HOME</Link>
            <span>/</span>
            <b>{category.name.toUpperCase()}</b>
          </div>
          <p className="brandEyebrow light">
            <span /> {category.kicker}
          </p>
          <h1>{category.name}</h1>
          <p className="categoryHeroDescription">{category.description}</p>
          <div className="categoryHeroProof">
            <span>
              <b>{products.length}</b> CURATED PRODUCTS
            </span>
            <span>
              <b>3</b> PACK SIZES
            </span>
            <span>
              <b>50%</b> OFF MRP
            </span>
          </div>
        </div>
        <div className="categoryHeroMedia">
          <img
            src={category.image}
            alt={`${category.name} by K1 Nut's`}
            fetchPriority="high"
            decoding="async"
          />
          <div className="categoryHeroSeal">
            <img src="/k1-logo.jpeg" alt="K1 Nut's" />
            <span>SELECTED IN KASHMIR</span>
          </div>
          <b className="categoryHeroIndex">
            {String(
              categories.findIndex((item) => item.slug === slug) + 1,
            ).padStart(2, "0")}
          </b>
        </div>
      </section>

      <nav className="categorySwitch" aria-label="Shop by category">
        {categories.map((item) => (
          <Link
            href={`/category/${item.slug}`}
            className={item.slug === slug ? "active" : ""}
            key={item.slug}
          >
            <span>{item.kicker}</span>
            <b>{item.name}</b>
          </Link>
        ))}
      </nav>

      <section className="categoryPromise">
        <span>ORIGIN &amp; GRADE SELECTED</span>
        <i />
        <span>FRESHNESS-SEALED PACKAGING</span>
        <i />
        <span>250G · 500G · 1KG OPTIONS</span>
      </section>

      <CategoryCatalogue products={products} />
      <StoreFooter />
    </main>
  );
}
