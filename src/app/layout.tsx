import type { Metadata } from "next";
import { Hanken_Grotesk, JetBrains_Mono, Newsreader } from "next/font/google";
import "./globals.css";

// Titles, quotes and big numbers. opsz lets the serif tighten up at headline sizes.
const display = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--f-display",
});

// Everything read or clicked: body copy, navigation, buttons, labels and captions.
const body = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--f-body",
});

// Machine data only (timecode, frame rate, slate boards, durations), so one weight is enough.
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: "400",
  fallback: ["ui-monospace", "Consolas", "monospace"],
  variable: "--f-mono",
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
    // suppressHydrationWarning: the public layout's scale script sets zoom on <html> before hydration.
    <html
      suppressHydrationWarning
      lang="en"
      data-theme="dark"
      data-scroll-behavior="smooth"
      className={`${display.variable} ${body.variable} ${mono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
