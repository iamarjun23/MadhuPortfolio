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

// Reading the theme cookie on the server would opt every route that renders this layout out of
// prerendering, which is exactly what left the public site rendering from scratch on every request
// (`Cache-Control: no-store`) and burning ~0.5-1s of Worker CPU a page. Settling the theme in a
// blocking inline script instead keeps the pages cacheable and still paints the right theme first
// time: the script runs before the body renders, so there is no flash.
const themeScript = `try{var m=document.cookie.match(/(?:^|; )theme=(light|dark)/);if(m)document.documentElement.dataset.theme=m[1]}catch(e){}`;

export default async function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="en"
      data-theme="dark"
      data-scroll-behavior="smooth"
      className={`${display.variable} ${body.variable} ${mono.variable} ${serif.variable}`}
      suppressHydrationWarning
    >
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {children}
      </body>
    </html>
  );
}
