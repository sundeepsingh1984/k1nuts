import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategoryCatalogue } from "../../catalogue-db";
import { categories, getCategory } from "../../store-data";
import { StoreFooter, StoreHeader } from "../../storefront-context";
import { CategoryCatalogue } from "./category-catalogue";

export const dynamic = "force-dynamic";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();
  const products = await getCategoryCatalogue(slug);

  return (
    <main className="brandSite categoryPage">
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
