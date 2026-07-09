import type { Metadata } from "next";
import { Archivo, Archivo_Black, Barlow_Condensed } from "next/font/google";
import "./globals.css";

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

export const metadata: Metadata = {
  title: "Transfergit — Tu GitHub, tasado como jugador de fútbol",
  description:
    "Convertí cualquier perfil de GitHub en una ficha de jugador estilo Transfermarkt: valor de mercado, posición, temporadas, fichajes y lesiones.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${display.variable} ${table.variable} ${body.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-pitch text-foreground">
        {children}
      </body>
    </html>
  );
}
