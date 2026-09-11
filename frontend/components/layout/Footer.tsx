import React from 'react';
import Link from 'next/link';
import { ShieldCheck, HeartPulse, Clock, Award } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#0A2540] text-slate-300 pt-14 pb-10 border-t border-slate-800">
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        {/* Value Prop Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-12 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-white/5 text-[#00A896]">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">100% Genuine Medicines</div>
              <div className="text-xs text-slate-400">Directly sourced from licensed pharmacies</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-white/5 text-[#00A896]">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Express 2-Hour Delivery</div>
              <div className="text-xs text-slate-400">Real-time GPS delivery tracking</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-white/5 text-[#00A896]">
              <HeartPulse className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Verified Specialists</div>
              <div className="text-xs text-slate-400">NMC registered Indian doctors</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-white/5 text-[#00A896]">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Pharmacist Validated</div>
              <div className="text-xs text-slate-400">Strict prescription review workflow</div>
            </div>
          </div>
        </div>

        {/* Links Column Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 py-12 border-b border-slate-800 text-xs">
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-lg bg-[#00A896] flex items-center justify-center text-white font-black text-base">
                +
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                MEDI<span className="text-[#00A896]">SWIFT</span>
              </span>
            </div>
            <p className="text-slate-400 max-w-sm leading-relaxed">
              MediSwift is India&apos;s smarter digital healthcare network, combining high-speed medicine e-commerce, automated prescription verification, and top-tier doctor consultations.
            </p>
            <div className="text-slate-400">
              <span className="text-white font-medium">Headquarters:</span> SG Highway, Ahmedabad, Gujarat 380054
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white text-sm mb-3">Medicine Categories</h4>
            <ul className="space-y-2">
              <li><Link href="/categories/prescription-medicines" className="hover:text-white transition-colors">Prescription Drugs</Link></li>
              <li><Link href="/categories/otc-first-aid" className="hover:text-white transition-colors">OTC & First Aid</Link></li>
              <li><Link href="/categories/vitamins-supplements" className="hover:text-white transition-colors">Vitamins & Immunity</Link></li>
              <li><Link href="/medicines" className="hover:text-white transition-colors">All Products</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white text-sm mb-3">Telehealth Doctors</h4>
            <ul className="space-y-2">
              <li><Link href="/doctors?specialty=cardiology" className="hover:text-white transition-colors">Cardiologists</Link></li>
              <li><Link href="/doctors?specialty=general-medicine" className="hover:text-white transition-colors">General Physicians</Link></li>
              <li><Link href="/doctors" className="hover:text-white transition-colors">Find a Doctor</Link></li>
              <li><Link href="/appointments" className="hover:text-white transition-colors">Book Video Consult</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white text-sm mb-3">Legal & Security</h4>
            <ul className="space-y-2">
              <li><span className="text-slate-400">CDSCO Compliant</span></li>
              <li><span className="text-slate-400">Drugs & Cosmetics Act</span></li>
              <li><span className="text-slate-400">Telemedicine Guidelines 2020</span></li>
              <li><span className="text-slate-400">End-to-End Encryption</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright and regulatory notice */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} MediSwift Technologies Pvt Ltd. All rights reserved.</p>
          <p className="text-[11px] text-slate-500 text-center sm:text-right">
            Disclaimer: MediSwift is a technology platform facilitating fulfillment from licensed retail pharmacies and registered medical practitioners.
          </p>
        </div>
      </div>
    </footer>
  );
}
