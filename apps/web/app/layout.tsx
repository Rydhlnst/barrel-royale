import type { Metadata, Viewport } from "next";
import { Nunito, Pixelify_Sans, Silkscreen } from "next/font/google";
import { site } from "@/lib/site";
import "./globals.css";

// Silkscreen for the blocky logo lettering of the banner, Pixelify Sans for
// headings and buttons, Nunito for reading. All three are OFL.
const silkscreen = Silkscreen({ variable: "--font-silkscreen", weight: ["400", "700"], subsets: ["latin"] });
const pixelify = Pixelify_Sans({ variable: "--font-pixelify", weight: ["500", "700"], subsets: ["latin"] });
const nunito = Nunito({ variable: "--font-nunito", weight: ["500", "700", "800"], subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: site.title,
  description: site.description,
  openGraph: { title: site.title, description: site.description, type: "website", url: "/", siteName: site.name },
  twitter: { card: "summary_large_image", title: site.title, description: site.description },
};

export const viewport: Viewport = {
  themeColor: "#ffd54a",
  colorScheme: "only light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${silkscreen.variable} ${pixelify.variable} ${nunito.variable}`}>
      <body>{children}</body>
    </html>
  );
}
