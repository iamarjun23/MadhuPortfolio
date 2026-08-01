import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Bricolage_Grotesque, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--f-display",
});

const body = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--f-body",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--f-mono",
});

export const metadata: Metadata = {
  title: "madhu.edit",
  description: "Portfolio foundation for N Madhu Kumar.",
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

type ThemeName = "dark" | "light";

function getTheme(value: string | undefined): ThemeName {
  return value === "light" ? "light" : "dark";
}

export default async function RootLayout({ children }: RootLayoutProps) {
  const cookieStore = await cookies();
  const theme = getTheme(cookieStore.get("theme")?.value);

  return (
    <html
      lang="en"
      data-theme={theme}
      className={`${display.variable} ${body.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  );
}
