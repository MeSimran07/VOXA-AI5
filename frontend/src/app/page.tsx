import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { Pricing } from "@/components/landing/Pricing";
import { FloatingWhatsApp } from "@/components/landing/FloatingWhatsApp";
import { WhatsAppIcon } from "@/components/landing/ContactProModal";
import { Mail, Phone, Heart } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans overflow-x-hidden selection:bg-violet-500/30">
      <Navbar />
      <main className="flex-1 pb-16">
        <Hero />
        <Features />
        <Pricing />
      </main>

      {/* Rich Footer with Contact Details */}
      <footer className="py-12 border-t border-white/10 bg-neutral-950/80 text-neutral-400 text-xs">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3 md:col-span-2">
            <span className="font-bold text-lg text-white">
              Voxa <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-blue-400">AI</span>
            </span>
            <p className="text-xs text-neutral-400 max-w-sm leading-relaxed">
              The autonomous AI productivity suite. Effortlessly bridging voice intelligence, document analysis, tutor coaching, and slide generation.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase">Navigation</h4>
            <ul className="space-y-1.5">
              <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
              <li><Link href="#pricing" className="hover:text-white transition-colors">Pricing (₹299/mo)</Link></li>
              <li><Link href="/chat/docs" className="hover:text-white transition-colors">Doc Analyzer</Link></li>
              <li><Link href="/auth" className="hover:text-white transition-colors">Login / Signup</Link></li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase">Contact & Pro Upgrade</h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <WhatsAppIcon className="h-4 w-4 text-emerald-400" />
                <a 
                  href="https://wa.me/916280642187" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-emerald-300 font-mono transition-colors"
                >
                  +91 62806 42187 (WhatsApp)
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-violet-400" />
                <a 
                  href="mailto:s6899878@gmail.com" 
                  className="hover:text-violet-300 font-mono transition-colors"
                >
                  s6899878@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-indigo-400" />
                <a 
                  href="tel:+916280642187" 
                  className="hover:text-white font-mono transition-colors"
                >
                  6280642187 (Direct Call)
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-neutral-500 gap-4">
          <p>© {new Date().getFullYear()} Voxa AI. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with intelligence for modern learners & creators.
          </p>
        </div>
      </footer>

      {/* Floating 1-Click WhatsApp Button */}
      <FloatingWhatsApp />
    </div>
  );
}
