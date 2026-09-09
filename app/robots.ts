import type { MetadataRoute } from "next";
import { absoluteUrl } from "./seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/admin/login",
        "/account",
        "/login",
        "/api/",
        "/signin-with-chatgpt",
      ],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
