import type { Metadata } from "next";
import { headers } from "next/headers";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";

const display = Cormorant_Garamond({ variable: "--font-display", subsets: ["latin"], weight: ["500", "600", "700"], style: ["normal", "italic"] });
const sans = DM_Sans({ variable: "--font-sans", subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const base = new URL(`${protocol}://${host}`);
  return {
    metadataBase: base,
    title: "Nourish & Nut — Nature, Perfected",
    description: "Premium dry fruits, nuts and mindful gifts — sourced honestly and packed fresh.",
    icons: { icon: "/favicon.svg" },
    openGraph: { title: "Nourish & Nut — Nature, Perfected", description: "Snack better. Live fuller.", images: [{ url: new URL("/og.png", base).toString(), width: 1536, height: 1024 }] },
    twitter: { card: "summary_large_image", title: "Nourish & Nut", description: "Snack better. Live fuller.", images: [new URL("/og.png", base).toString()] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${display.variable} ${sans.variable}`}>{children}</body></html>;
}
