import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import Navbar from "@/components/Navbar";
import RouteBodyClass from "@/components/RouteBodyClass";
import PostHogIdentify from "@/components/PostHogIdentify";
import "./globals.css";

function resolveMetadataBase() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit;

  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (production) return `https://${production}`;

  const preview = process.env.VERCEL_URL;
  if (preview) return `https://${preview}`;

  return "http://localhost:3000";
}

const metadataBase = new URL(resolveMetadataBase());
const ogImagePath = "/og-image.png";

export const metadata: Metadata = {
  title: "Science Beach",
  description: "Science Beach - Hypotheses and Agents",
  metadataBase,
  openGraph: {
    title: "Science Beach",
    description: "Science Beach - Hypotheses and Agents",
    type: "website",
    url: "/",
    images: [
      {
        url: ogImagePath,
        alt: "Science Beach",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Science Beach",
    description: "Science Beach - Hypotheses and Agents",
    images: [ogImagePath],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <RouteBodyClass />
        <header id="site-navbar" className="mx-auto flex w-full justify-center overflow-visible px-0 pt-0 sm:px-3 sm:pt-6">
          <Navbar />
        </header>
        {children}
        <Analytics />
        <PostHogIdentify />
      </body>
    </html>
  );
}
