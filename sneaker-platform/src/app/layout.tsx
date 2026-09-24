import type { Metadata } from "next";
import { Anton, Archivo, Fraunces, Inter, Plus_Jakarta_Sans, Poppins, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-inter", display: "swap" });
const archivo = Archivo({ subsets: ["latin", "latin-ext"], variable: "--font-archivo", weight: ["500", "700", "800", "900"], display: "swap", preload: false });
const poppins = Poppins({ subsets: ["latin", "latin-ext"], variable: "--font-poppins", weight: ["400", "500", "600", "700", "800"], display: "swap", preload: false });
const grotesk = Space_Grotesk({ subsets: ["latin", "latin-ext"], variable: "--font-grotesk", display: "swap", preload: false });
const anton = Anton({ subsets: ["latin", "latin-ext"], variable: "--font-anton", weight: "400", display: "swap", preload: false });
const fraunces = Fraunces({ subsets: ["latin", "latin-ext"], variable: "--font-fraunces", display: "swap", preload: false });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin", "latin-ext"], variable: "--font-jakarta", display: "swap", preload: false });

export const metadata: Metadata = {
  title: "Sneaker Platform",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="tr"
      className={`${inter.variable} ${archivo.variable} ${poppins.variable} ${grotesk.variable} ${anton.variable} ${fraunces.variable} ${jakarta.variable} antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
