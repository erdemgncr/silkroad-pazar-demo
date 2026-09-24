import type { Metadata } from "next";
import { Anton, Archivo, Cormorant_Garamond, Fraunces, Inter, Montserrat, Oswald, Plus_Jakarta_Sans, Poppins, Rubik, Space_Grotesk, Space_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-inter", display: "swap" });
const archivo = Archivo({ subsets: ["latin", "latin-ext"], variable: "--font-archivo", weight: ["500", "700", "800", "900"], display: "swap", preload: false });
const poppins = Poppins({ subsets: ["latin", "latin-ext"], variable: "--font-poppins", weight: ["400", "500", "600", "700", "800"], display: "swap", preload: false });
const grotesk = Space_Grotesk({ subsets: ["latin", "latin-ext"], variable: "--font-grotesk", display: "swap", preload: false });
const anton = Anton({ subsets: ["latin", "latin-ext"], variable: "--font-anton", weight: "400", display: "swap", preload: false });
const fraunces = Fraunces({ subsets: ["latin", "latin-ext"], variable: "--font-fraunces", display: "swap", preload: false });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin", "latin-ext"], variable: "--font-jakarta", display: "swap", preload: false });
const oswald = Oswald({ subsets: ["latin", "latin-ext"], variable: "--font-oswald", weight: ["400", "500", "600", "700"], display: "swap", preload: false });
const montserrat = Montserrat({ subsets: ["latin", "latin-ext"], variable: "--font-montserrat", display: "swap", preload: false });
const mono = Space_Mono({ subsets: ["latin", "latin-ext"], variable: "--font-spacemono", weight: ["400", "700"], display: "swap", preload: false });
const cormorant = Cormorant_Garamond({ subsets: ["latin", "latin-ext"], variable: "--font-cormorant", weight: ["400", "500", "600", "700"], display: "swap", preload: false });
const rubik = Rubik({ subsets: ["latin", "latin-ext"], variable: "--font-rubik", display: "swap", preload: false });

export const metadata: Metadata = {
  title: "Sneaker Platform",
  robots: { index: false, follow: false },
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="tr"
      className={`${inter.variable} ${archivo.variable} ${poppins.variable} ${grotesk.variable} ${anton.variable} ${fraunces.variable} ${jakarta.variable} ${oswald.variable} ${montserrat.variable} ${mono.variable} ${cormorant.variable} ${rubik.variable} antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
