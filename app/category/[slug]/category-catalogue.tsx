"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { trackStoreEvent } from "../../analytics";
import type { StoreProduct } from "../../store-data";
import { CategoryAddButton } from "./product-actions";

type SortMode = "featured" | "name" | "price-low" | "price-high";

export function CategoryCatalogue({ products }: { products: StoreProduct[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("featured");

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    const matches = search
      ? products.filter((product) =>
          `${product.name} ${product.category} ${product.short}`
            .toLowerCase()
            .includes(search),
        )
      : [...products];
    if (sort === "name") matches.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "price-low") matches.sort((a, b) => a.price - b.price);
    if (sort === "price-high") matches.sort((a, b) => b.price - a.price);
    return matches;
  }, [products, query, sort]);

  const groups = useMemo(() => {
    const map = new Map<string, StoreProduct[]>();
    for (const product of filtered) {
      map.set(product.category, [
        ...(map.get(product.category) ?? []),
        product,
      ]);
    }
    return [...map.entries()];
  }, [filtered]);

  useEffect(() => {
    const searchTerm = query.trim();
    if (searchTerm.length < 2) return;
    const timer = window.setTimeout(() => {
      trackStoreEvent("catalogue_search", window.location.pathname, {
        searchTerm,
        resultCount: filtered.length,
        metadata: { category: products[0]?.categorySlug || "unknown" },
      });
    }, 650);
    return () => window.clearTimeout(timer);
  }, [filtered.length, products, query]);

  return (
    <section className="categoryCatalogue sectionNew">
      <header className="catalogueToolbar">
        <div>
          <p className="brandEyebrow">
            <span /> THE K1 PANTRY EDIT
          </p>
          <h2>
            Choose by origin.
            <br />
            <em>Order by ritual.</em>
          </h2>
        </div>
        <div className="catalogueControls">
          <label>
            <span>SEARCH COLLECTION</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search products or varieties"
            />
          </label>
          <label>
            <span>SORT BY</span>
            <select
              value={sort}
              onChange={(event) => {
                const nextSort = event.target.value as SortMode;
                setSort(nextSort);
                trackStoreEvent("catalogue_sort", window.location.pathname, {
                  metadata: { sort: nextSort },
                });
              }}
            >
              <option value="featured">K1 featured</option>
              <option value="name">Name A–Z</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
            </select>
          </label>
        </div>
      </header>

      <div className="catalogueResultLine">
        <b>{String(filtered.length).padStart(2, "0")}</b>
        <span>products ready to pack</span>
      </div>

      {groups.map(([group, groupProducts], groupIndex) => (
        <section className="collectionGroup" key={group}>
          <header>
            <span>{String(groupIndex + 1).padStart(2, "0")}</span>
            <div>
              <p>CURATED SERIES</p>
              <h3>{group}</h3>
            </div>
            <small>{groupProducts.length} VARIETIES</small>
          </header>
          <div className="listingGridPro">
            {groupProducts.map((product, index) => (
              <article className="listingCardPro" key={product.slug}>
                <Link
                  href={`/product/${product.slug}`}
                  className="listingImagePro"
                  style={{ "--accent": product.accent } as React.CSSProperties}
                >
                  <span className="listingSaleBadge">50% OFF</span>
                  <span className="listingPackSizes">250 · 500 · 1K</span>
                  <img
                    src={product.image}
                    alt={`${product.name} K1 packaging`}
                    loading="lazy"
                    decoding="async"
                  />
                  <i>{String(index + 1).padStart(2, "0")}</i>
                </Link>
                <div className="listingCardCopy">
                  <p>{product.category}</p>
                  <Link href={`/product/${product.slug}`}>
                    <h4>{product.name}</h4>
                  </Link>
                  <small>{product.short}</small>
                  <CategoryAddButton product={product} />
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}

      {!filtered.length && (
        <div className="catalogueEmpty">
          <b>NO MATCH YET</b>
          <p>Try another product, origin or variety.</p>
          <button onClick={() => setQuery("")}>CLEAR SEARCH</button>
        </div>
      )}
    </section>
  );
}
