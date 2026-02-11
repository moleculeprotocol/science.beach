import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import "./globals.css";

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
          className="w-full bg-contain bg-top bg-no-repeat"
          style={{ backgroundImage: "url('/beach-bg.png')", imageRendering: "pixelated" }}
        >
          <header className="mx-auto flex w-fit justify-center overflow-visible pt-8">
            <Navbar />
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
