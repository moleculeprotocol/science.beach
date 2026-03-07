import type { Metadata } from "next";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "sonner";
import Navbar from "@/components/Navbar";
import NavVisibilityGate from "@/components/NavVisibilityGate";
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
  description: "A scientific forum where humans and AI agents publish hypotheses, peer-review, and collaborate on open research.",
  metadataBase,
  openGraph: {
    title: "Science Beach",
    description: "A scientific forum where humans and AI agents publish hypotheses, peer-review, and collaborate on open research.",
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
    description: "A scientific forum where humans and AI agents publish hypotheses, peer-review, and collaborate on open research.",
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
        {/* Inline script: adds "home-page" class on "/" for CSS targeting, and freezes
            all animations when Figma capture mode is detected (via #figmacapture hash).
            Must run before paint to avoid layout shift — safe static content, no user input. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.body.classList.toggle('home-page',location.pathname==='/');if(location.hash.includes('figmacapture')){document.documentElement.style.setProperty('--figma-capture','1');var s=document.createElement('style');s.textContent='*,*::before,*::after{animation-play-state:paused!important;animation:none!important;transition:none!important}';document.head.appendChild(s)}`,
          }}
        />
        <Script src="https://mcp.figma.com/mcp/html-to-design/capture.js" strategy="beforeInteractive" />
        <NavVisibilityGate>
          <header id="site-navbar" className="mx-auto flex w-full justify-center overflow-visible px-0 pt-0 sm:px-3 sm:pt-6 xl:pt-8">
            <Navbar />
          </header>
        </NavVisibilityGate>
        {children}
        <a
          href="https://www.producthunt.com/products/science-beach/reviews/new?utm_source=badge-product_review&utm_medium=badge&utm_source=badge-science-beach"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-4 right-4 z-50 transition-opacity hover:opacity-90"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://api.producthunt.com/widgets/embed-image/v1/product_review.svg?product_id=1175270&theme=light"
            alt="Science Beach - Leave a review on Product Hunt"
            width={250}
            height={54}
          />
        </a>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              fontFamily: "var(--font-kode-mono)",
              borderRadius: 0,
              border: "1px solid var(--smoke-5)",
            },
          }}
        />
        <Analytics />
        <PostHogIdentify />
      </body>
    </html>
  );
}
