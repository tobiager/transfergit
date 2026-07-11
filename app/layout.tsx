import type { Metadata } from "next";
import { Archivo, Archivo_Black, Barlow_Condensed, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { ValuationModal } from "@/components/ValuationModal";
import { ValuationModalProvider } from "@/components/ValuationModalContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { getSiteUrl } from "@/lib/site-url";

const display = Archivo_Black({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

const table = Barlow_Condensed({
  variable: "--font-table",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const body = Archivo({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: "Transfergit — Your GitHub, valued like a football player",
  description:
    "Turn any GitHub profile into a Transfermarkt-style player card: market value, position, seasons, transfers and injuries.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${table.variable} ${body.variable} ${mono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh flex flex-col bg-pitch text-foreground">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ValuationModalProvider>
            <Navbar />
            {children}
            <ValuationModal />
          </ValuationModalProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
