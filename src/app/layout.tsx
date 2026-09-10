import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { PwaProvider } from "@/components/pwa-provider";

export const viewport: Viewport = {
  themeColor: "#0F172A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "369 AKR UNIVERSE | Subcontractor Operations Portal (SOP)",
  description:
    "Enterprise Subcontractor Operations Portal for 369 AKR UNIVERSE - Utility-Scale Solar EPC & Infrastructure.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AKR SOP",
  },
  keywords: [
    "369 AKR UNIVERSE",
    "Solar EPC",
    "Subcontractor Operations Portal",
    "Field Dispatches",
    "India Solar Infrastructure",
  ],
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
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased selection:bg-slate-900 selection:text-white">
        <PwaProvider>
          <Navbar />
          <div className="flex-1 flex flex-col pt-14">{children}</div>
          <Footer />
        </PwaProvider>
      </body>
    </html>
  );
}
