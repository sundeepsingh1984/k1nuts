import Link from "next/link";
import { notFound } from "next/navigation";
import { categories, getCategory, getCategoryProducts } from "../../store-data";
import { CategoryAddButton } from "./product-actions";
import { StoreFooter, StoreHeader } from "../../storefront-context";

export function generateStaticParams() {
  return categories.map((category) => ({ slug: category.slug }));
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();
  const products = getCategoryProducts(slug);

  return (
    <main className="brandSite">
      <StoreHeader />
      <section
        className="categoryHero categoryHeroVisual"
        style={{ "--tone": category.tone } as React.CSSProperties}
      >
        <img
          className="categoryHeroImage"
          src={category.image}
          alt={`${category.name} by K1 Nut's`}
        />
        <div className="categoryHeroVeil" />
        <div>
          <div className="breadcrumbs">
            <Link href="/">HOME</Link>
            <span>/</span>
            <b>{category.name.toUpperCase()}</b>
          </div>
          <p>{category.kicker}</p>
          <h1>{category.name}</h1>
          <em>{category.description}</em>
        </div>
        <img className="categoryHeroLogo" src="/k1-logo.jpeg" alt="K1 Nut's" />
      </section>
      <section className="categoryListing sectionNew">
        <div className="listingHead">
          <div>
            <b>{products.length}</b>
            <span>PRODUCTS & VARIETIES</span>
          </div>
          <p>
            Each variety has its own description page with origin, pack details
            and purchase controls.
          </p>
        </div>
        <div className="listingGrid">
          {products.map((product, index) => (
            <article className="listingCard" key={product.slug}>
              <Link
                href={`/product/${product.slug}`}
                className="listingImage"
                style={{
                  background: product.image
                    ? "#f3eadc"
                    : `color-mix(in srgb, ${product.accent} 24%, #f5ead5)`,
                }}
              >
                {product.image ? (
                  <img src={product.image} alt={product.name} />
                ) : (
                  <>
                    <span>{product.emoji}</span>
                    <small>
                      K1 QUALITY
                      <br />
                      SELECTED
                    </small>
                  </>
                )}
                <i>0{index + 1}</i>
              </Link>
              <p>{product.category}</p>
              <Link href={`/product/${product.slug}`}>
                <h2>{product.name}</h2>
              </Link>
              <small>{product.short}</small>
              <div>
                <b>₹{product.price}</b>
                <span>{product.weight}</span>
              </div>
              <CategoryAddButton product={product} />
            </article>
          ))}
        </div>
      </section>
      <StoreFooter />
    </main>
  );
}
