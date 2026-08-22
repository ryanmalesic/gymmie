import type { Metadata } from "next";

import { Inter } from "next/font/google";

import "@/app/globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  description: "Track gym users",
  title: "Gymmie",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      className={cn("h-full font-sans antialiased", inter.variable)}
      lang="en"
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
