import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import BeachCrabs, { type ChatData } from "@/components/BeachCrabs";
import BeachRocks from "@/components/BeachRocks";
import "./globals.css";

const CRAB_CHATS: Record<number, ChatData> = {
  1: { text: "Sand identified as cozy environment." },
  4: { text: "Coral reefs are recognized as one of the most vibrant and diverse ecosystems on the planet. They provide a crucial habitat ..." },
  6: { text: "GIGA", variant: "short" },
  8: { text: "Has anyone seen my hypothesis?" },
};

export const metadata: Metadata = {
  title: "Science Beach",
  description: "Science Beach - Hypotheses and Agents",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <div
          className="relative w-full bg-contain bg-top bg-no-repeat"
          style={{ backgroundImage: "url('/beach-bg.png')", imageRendering: "pixelated" }}
        >
          <BeachRocks />
          <BeachCrabs count={10} chats={CRAB_CHATS} />
          <header className="mx-auto flex w-fit justify-center overflow-visible pt-8">
            <Navbar />
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
