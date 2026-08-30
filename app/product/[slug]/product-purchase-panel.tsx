"use client";

import { useState } from "react";
import {
  formatInr,
  getProductVariants,
  productWithVariant,
  type StoreProduct,
} from "../../store-data";
import { useStore } from "../../storefront-context";

export function ProductPurchasePanel({ product }: { product: StoreProduct }) {
  const { add } = useStore();
  const variants = getProductVariants(product);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selected = variants[selectedIndex];

  return (
    <div className="productPurchasePanel">
      <div className="priceLine">
        <b>₹{formatInr(selected.price)}</b>
        <del>₹{formatInr(selected.mrp)}</del>
        <span>FLAT 50% OFF MRP · TAXES INCLUDED</span>
      </div>
      <div className="weightChoice">
        <span>SELECT PACK SIZE</span>
        <div>
          {variants.map((variant, index) => (
            <button
              type="button"
              className={selectedIndex === index ? "active" : ""}
              onClick={() => setSelectedIndex(index)}
              key={variant.sku}
            >
              <b>{variant.label}</b>
              <small>₹{formatInr(variant.price)}</small>
            </button>
          ))}
        </div>
      </div>
      <div className="variantAvailability">
        <span>{selected.sku}</span>
        <b className={selected.stock > 0 ? "inStock" : "outOfStock"}>
          {selected.stock > 0
            ? `${selected.stock} packs available`
            : "Sold out"}
        </b>
      </div>
      <button
        className="brandButton"
        disabled={selected.stock < 1}
        onClick={() => add(productWithVariant(product, selected))}
      >
        ADD {selected.label.toUpperCase()} TO BAG
        <span>₹{formatInr(selected.price)}</span>
      </button>
    </div>
  );
}
