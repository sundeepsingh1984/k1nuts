"use client";

import { useState } from "react";
import {
  formatInr,
  getProductVariants,
  productWithVariant,
  type StoreProduct,
} from "../../store-data";
import { useStore } from "../../storefront-context";

export function CategoryAddButton({ product }: { product: StoreProduct }) {
  const { add } = useStore();
  const variants = getProductVariants(product);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selected = variants[selectedIndex];

  return (
    <div className="cardPurchase">
      <div className="cardVariants" aria-label="Choose pack size">
        {variants.map((variant, index) => (
          <button
            type="button"
            className={selectedIndex === index ? "active" : ""}
            onClick={() => setSelectedIndex(index)}
            key={variant.sku}
          >
            {variant.label}
          </button>
        ))}
      </div>
      <div className="cardPrice">
        <span>
          <b>₹{formatInr(selected.price)}</b>
          <del>₹{formatInr(selected.mrp)}</del>
        </span>
        <small>{selected.stock > 0 ? "IN STOCK" : "SOLD OUT"}</small>
      </div>
      <button
        type="button"
        className="cardAddButton"
        disabled={selected.stock < 1}
        onClick={() => add(productWithVariant(product, selected))}
      >
        QUICK ADD <span>+</span>
      </button>
    </div>
  );
}
