import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { PwaProvider } from "@/components/pwa-provider";

export const viewport: Viewport = {
  themeColor: "#0B0F19",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "369 AKR UNIVERSE | Subcontractor Operations Portal (SOP)",
  description: "Enterprise Subcontractor Operations Portal for 369 AKR UNIVERSE - India's Premier Solar Energy Infrastructure Contractor.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AKR SOP",
  },
  keywords: ["369 AKR UNIVERSE", "Solar EPC", "Subcontractor Operations Portal", "Field Dispatches", "India Solar"],
  icons: {
    icon: "/images/logo/logo-icon.svg",
    apple: "/images/logo/logo-icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col bg-[#06090e] text-slate-100 antialiased selection:bg-[#FFD23F] selection:text-black">
        <PwaProvider>
          <Navbar />
          <div className="flex-1 flex flex-col pt-20">{children}</div>
          <Footer />
        </PwaProvider>
      </body>
    </html>
  );
}

