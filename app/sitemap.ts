import type { MetadataRoute } from "next";
import { getAllCatalogueProducts } from "./catalogue-db";
import { absoluteUrl } from "./seo";
import { categories } from "./store-data";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getAllCatalogueProducts();
  const now = new Date();
  return [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...categories.map((category) => ({
      url: absoluteUrl(`/category/${category.slug}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.9,
      images: [absoluteUrl(category.image)],
    })),
    ...products.map((product) => ({
      url: absoluteUrl(`/product/${product.slug}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
      images: [absoluteUrl(product.image || "/og.png")],
    })),
  ];
}
