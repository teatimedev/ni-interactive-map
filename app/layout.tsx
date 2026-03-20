import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Big Dirty NI Map",
  description:
    "Interactive map of Northern Ireland with real stats for all 462 wards",
  openGraph: {
    title: "The Big Dirty NI Map",
    description:
      "Interactive map of Northern Ireland with real stats for all 462 wards",
    images: ["/og-image.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
  themeColor: "#1a1a1a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
