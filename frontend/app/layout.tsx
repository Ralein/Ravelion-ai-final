import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ravelion AI - Intelligent Video Editing",
  description: "Remove video backgrounds instantly with AI.",
};

import CopyProtection from "./components/CopyProtection";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-neutral-950 text-white`}>
        <CopyProtection />
        {children}
      </body>
    </html>
  );
}
