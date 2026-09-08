import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";
import { PerformanceReporter } from "./performance-reporter";
import { absoluteUrl, safeJsonLd, SITE_URL } from "./seo";
import { StorefrontProvider } from "./storefront-context";

const display = Cormorant_Garamond({ variable: "--font-display", subsets: ["latin"], weight: ["500", "600", "700"], style: ["normal", "italic"] });
const sans = DM_Sans({ variable: "--font-sans", subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "K1 Nuts — Goodness in Motion from Kashmir", template: "%s · K1 Nuts" },
  description:
    "Shop K1 Nuts healthy bites, premium nuts, dry fruits, berries, spices and cold-pressed oils from Srinagar, Kashmir.",
  alternates: { canonical: "/" },
  icons: { icon: "/favicon.svg" },
  openGraph: {
    type: "website",
    siteName: "K1 Nuts",
    title: "K1 Nuts — Goodness in Motion.",
    description: "Healthy bites and Himalayan pantry essentials, crafted in Srinagar.",
    url: "/",
    images: [{ url: absoluteUrl("/og.png"), width: 1728, height: 918 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "K1 Nuts — Goodness in Motion.",
    description: "Healthy bites and Himalayan pantry essentials, crafted in Srinagar.",
    images: [absoluteUrl("/og.png")],
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "K1 Nuts",
  url: SITE_URL,
  logo: absoluteUrl("/k1-logo.jpeg"),
  foundingDate: "2023",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Aluchi Bagh",
    addressLocality: "Srinagar",
    addressRegion: "Jammu & Kashmir",
    postalCode: "190008",
    addressCountry: "IN",
  },
  contactPoint: [
    { "@type": "ContactPoint", telephone: "+91-90860-25119", contactType: "sales" },
    { "@type": "ContactPoint", telephone: "+91-95412-43120", contactType: "customer service" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${sans.variable}`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(organizationSchema) }}
        />
        <StorefrontProvider>
          <PerformanceReporter />
          {children}
        </StorefrontProvider>
      </body>
    </html>
  );
}
