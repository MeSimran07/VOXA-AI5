"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Menu, X, Phone, PhoneCall, Copy, Check, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const phoneNumber = "6280642187";
  const formattedPhone = "+91 62806 42187";

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(phoneNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
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

          {/* Desktop Nav - Contact Only */}
          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={() => setContactModalOpen(true)}
              className="flex items-center gap-2 text-sm font-semibold text-neutral-300 hover:text-white transition-all px-4 py-2 rounded-full hover:bg-white/5 border border-transparent hover:border-violet-500/30 group"
            >
              <Phone className="h-4 w-4 text-violet-400 group-hover:scale-110 transition-transform" />
              <span>Contact</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
            </button>
            
            <div className="flex items-center gap-4 border-l border-white/10 pl-8">
              <Link href="/auth">
                <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-white rounded-full px-6 transition-all hover-lift">
                  Login
                </Button>
              </Link>
              <Link href="/auth">
                <Button className="bg-white text-black hover:bg-neutral-200 rounded-full px-6 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_25px_rgba(255,255,255,0.5)] transition-all hover-lift">
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
              <div className="flex flex-col p-6 gap-4">
                <button 
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setContactModalOpen(true);
                  }}
                  className="flex items-center justify-between text-lg font-medium text-white py-3 border-b border-white/10 w-full text-left"
                >
                  <span className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-violet-400" />
                    Contact
                  </span>
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-mono">
                    Available
                  </span>
                </button>

                <div className="flex flex-col gap-3 mt-2">
                  <Link href="/auth" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full border-white/20 text-white rounded-xl bg-transparent">
                      Login
                    </Button>
                  </Link>
                  <Link href="/auth" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full bg-white text-black hover:bg-neutral-200 rounded-xl">
                      Get Started
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Contact Details Modal */}
      <AnimatePresence>
        {contactModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setContactModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
              className="relative w-full max-w-md bg-neutral-950/95 border border-white/15 rounded-3xl p-6 shadow-2xl shadow-violet-500/10 overflow-hidden"
            >
              {/* Decorative top glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-violet-500 to-transparent" />

              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-violet-500/20 border border-violet-500/40 flex items-center justify-center text-violet-400">
                    <PhoneCall className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Contact & Connect</h3>
                    <p className="text-xs text-neutral-400">Get in touch directly with our team</p>
                  </div>
                </div>
                <button
                  onClick={() => setContactModalOpen(false)}
                  className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Phone display card */}
              <div className="bg-neutral-900/80 border border-white/10 rounded-2xl p-5 mb-5 flex flex-col items-center justify-center text-center relative overflow-hidden">
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 mb-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Direct Phone Support
                </div>
                <div className="text-2xl font-black tracking-wider text-white font-mono mt-1 mb-1">
                  {formattedPhone}
                </div>
                <div className="text-xs text-neutral-400">
                  Raw: <span className="font-mono text-neutral-300">{phoneNumber}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 gap-3">
                {/* Call Now */}
                <a
                  href={`tel:${phoneNumber}`}
                  className="flex items-center justify-center gap-2 w-full py-3.5 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl font-semibold shadow-lg shadow-violet-600/25 transition-all active:scale-[0.98]"
                >
                  <Phone className="h-4 w-4" />
                  Call Directly ({phoneNumber})
                </a>

                {/* WhatsApp Chat */}
                <a
                  href={`https://wa.me/91${phoneNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl font-medium transition-all"
                >
                  <MessageSquare className="h-4 w-4" />
                  Chat on WhatsApp
                </a>

                {/* Copy Number */}
                <button
                  onClick={handleCopyNumber}
                  className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/10 rounded-xl text-sm font-medium transition-all"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-400" />
                      <span className="text-emerald-400 font-semibold">Number Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 text-neutral-400" />
                      Copy Phone Number
                    </>
                  )}
                </button>
              </div>

              <div className="mt-5 text-center text-[11px] text-neutral-500">
                VOXA AI Support • Available 24/7 for Inquiries & Demos
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
