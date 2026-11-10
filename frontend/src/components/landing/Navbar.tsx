"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Menu, X, Phone, Mail, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContactProModal } from "./ContactProModal";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"pro" | "team" | "contact">("contact");

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const openContact = (mode: "pro" | "team" | "contact" = "contact") => {
    setModalMode(mode);
    setContactModalOpen(true);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
          scrolled 
            ? "bg-background/80 backdrop-blur-2xl border-white/10 shadow-lg shadow-black/20 py-4" 
            : "bg-transparent border-transparent py-6"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/25 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <Mic className="h-5 w-5 relative z-10" />
            </motion.div>
            <span className="font-bold text-xl tracking-tight text-white">
              Voxa <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-blue-400">AI</span>
            </span>
          </Link>

          {/* Desktop Nav - Matching screenshot navigation */}
          <div className="hidden md:flex items-center gap-7">
            <Link 
              href="#features" 
              className="text-sm font-medium text-neutral-300 hover:text-white transition-colors"
            >
              Features
            </Link>
            
            <Link 
              href="#pricing" 
              className="text-sm font-medium text-neutral-300 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <span>Pricing</span>
              <span className="text-[10px] font-mono bg-violet-500/20 text-violet-300 px-1.5 py-0.2 rounded-full border border-violet-500/30">
                ₹299
              </span>
            </Link>

            <Link 
              href="/chat/docs" 
              className="text-sm font-medium text-neutral-300 hover:text-white transition-colors"
            >
              Docs
            </Link>

            <button
              onClick={() => openContact("contact")}
              className="flex items-center gap-2 text-sm font-semibold text-neutral-300 hover:text-white transition-all px-3 py-1.5 rounded-full hover:bg-white/5 border border-transparent hover:border-violet-500/30 group"
            >
              <Phone className="h-3.5 w-3.5 text-violet-400 group-hover:scale-110 transition-transform" />
              <span>Contact</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </button>
            
            <div className="flex items-center gap-3 border-l border-white/10 pl-6">
              <Link href="/auth">
                <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-white rounded-full px-5 text-sm transition-all hover-lift">
                  Login
                </Button>
              </Link>
              <Link href="/auth">
                <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-full px-6 text-sm font-semibold shadow-lg shadow-violet-500/25 transition-all hover-lift">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>

          {/* Mobile Toggle */}
          <button 
            className="md:hidden text-white p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-background/95 backdrop-blur-xl border-b border-white/10 overflow-hidden"
            >
              <div className="flex flex-col p-6 gap-3">
                <Link
                  href="#features"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-medium text-neutral-200 py-2 border-b border-white/5"
                >
                  Features
                </Link>

                <Link
                  href="#pricing"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between text-base font-medium text-neutral-200 py-2 border-b border-white/5"
                >
                  <span>Pricing</span>
                  <span className="text-xs bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full">
                    ₹299/mo
                  </span>
                </Link>

                <Link
                  href="/chat/docs"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-medium text-neutral-200 py-2 border-b border-white/5"
                >
                  Docs
                </Link>

                <button 
                  onClick={() => openContact("contact")}
                  className="flex items-center justify-between text-base font-medium text-white py-2 border-b border-white/5 w-full text-left"
                >
                  <span className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-violet-400" />
                    Contact & Pro Support
                  </span>
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-mono">
                    WhatsApp • Call
                  </span>
                </button>

                <div className="flex flex-col gap-2.5 mt-3">
                  <Link href="/auth" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full border-white/20 text-white rounded-xl bg-transparent">
                      Login
                    </Button>
                  </Link>
                  <Link href="/auth" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-semibold">
                      Get Started
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Reusable Contact & Pro Upgrade Modal */}
      <ContactProModal
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
        initialMode={modalMode}
      />
    </>
  );
}
