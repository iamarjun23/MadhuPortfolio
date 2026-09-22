import type { Metadata } from "next";
import { DM_Sans, Instrument_Serif, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--f-display",
});

const body = DM_Sans({
  subsets: ["latin"],
  variable: "--f-body",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--f-mono",
});

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--f-serif",
});

export const metadata: Metadata = {
  title: "madhu.edit",
  description: "Portfolio foundation for N Madhu Kumar.",
  // The mark in the browser tab and on a bookmark. One SVG covers every size,
  // and naming it here is what puts the <link> in the head - a file sitting in
  // public/ is served but never declared.
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default async function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="en"
      data-theme="dark"
      data-scroll-behavior="smooth"
      className={`${display.variable} ${body.variable} ${mono.variable} ${serif.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
