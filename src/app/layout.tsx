import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "sonner";
import Navbar from "@/components/Navbar";
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
        <script
          dangerouslySetInnerHTML={{
            __html: `if(location.pathname==='/')document.body.classList.add('home-page')`,
          }}
        />
        <header id="site-navbar" className="mx-auto flex w-full justify-center overflow-visible px-0 pt-0 sm:px-3 sm:pt-6">
          <Navbar />
        </header>
        {children}
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
