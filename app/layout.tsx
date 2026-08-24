import type { Metadata } from "next";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Inter } from "next/font/google";

import "@/app/globals.css";
import { QueryProvider } from "@/lib/query/providers";
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
      <body className="flex min-h-full flex-col">
        <QueryProvider>{children}</QueryProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
