import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { MobileNav } from "@/components/layout/MobileNav";
import { PrescriptionModal } from "@/components/layout/PrescriptionModal";
import { ToastContainer } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "MediSwift — Your Health, Delivered Smarter.",
  description:
    "India's premier digital healthcare ecosystem uniting online pharmacy, secure prescription uploads, doctor discovery, and 2-hour express delivery.",
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
      <body className="min-h-full flex flex-col pb-16 md:pb-0 bg-slate-50 text-slate-900 antialiased">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <MobileNav />
        <PrescriptionModal />
        <ToastContainer />
      </body>
    </html>
  );
}
