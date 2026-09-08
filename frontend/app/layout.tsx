import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { MobileNav } from "@/components/layout/MobileNav";
import { SearchOverlay } from "@/components/layout/SearchOverlay";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { ProductQuickViewModal } from "@/components/product/product-quick-view";
import { PrescriptionModal } from "@/components/layout/PrescriptionModal";
import { ToastContainer } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "MediSwift — Your Health, Delivered Smarter.",
  description:
    "India's premier digital healthcare ecosystem uniting online pharmacy, secure prescription uploads, verified doctor telehealth, and 2-hour express delivery.",
  keywords: [
    "online medicine",
    "telehealth",
    "doctor consultation",
    "prescription upload",
    "pharmacy delivery",
    "India healthcare",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col pb-16 md:pb-0 bg-slate-50 text-slate-900 antialiased selection:bg-teal-100 selection:text-teal-900">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <MobileNav />
        <SearchOverlay />
        <CartDrawer />
        <ProductQuickViewModal />
        <PrescriptionModal />
        <ToastContainer />
      </body>
    </html>
  );
}
