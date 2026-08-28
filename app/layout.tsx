import type { Metadata } from "next";
import { headers } from "next/headers";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";
import { StorefrontProvider } from "./storefront-context";

const display = Cormorant_Garamond({ variable: "--font-display", subsets: ["latin"], weight: ["500", "600", "700"], style: ["normal", "italic"] });
const sans = DM_Sans({ variable: "--font-sans", subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const base = new URL(`${protocol}://${host}`);
  return {
    metadataBase: base,
    title: "K1 Nuts — Goodness in Motion from Kashmir",
    description: "Discover K1 Nuts: premium healthy bites, nuts, dry fruits, berries, spices and cold-pressed oils from Srinagar, Kashmir.",
    icons: { icon: "/favicon.svg" },
    openGraph: { title: "K1 Nuts — Goodness in Motion.", description: "Healthy bites and Himalayan pantry essentials, crafted in Srinagar.", images: [{ url: new URL("/og.png", base).toString(), width: 1728, height: 918 }] },
    twitter: { card: "summary_large_image", title: "K1 Nuts — Goodness in Motion.", description: "Healthy bites and Himalayan pantry essentials, crafted in Srinagar.", images: [new URL("/og.png", base).toString()] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${display.variable} ${sans.variable}`}><StorefrontProvider>{children}</StorefrontProvider></body></html>;
}
