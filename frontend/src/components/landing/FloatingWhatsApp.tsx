"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WhatsAppIcon } from "./ContactProModal";
import { X, MessageSquare, Send } from "lucide-react";

export function FloatingWhatsApp() {
  const [showTooltip, setShowTooltip] = useState(false);
  const phoneNumber = "6280642187";
  const defaultMsg = encodeURIComponent(
    "Hello Voxa AI! I am interested in upgrading to Pro / have an inquiry."
  );

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end">
      {/* Tooltip bubble */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="mb-3 p-3.5 bg-neutral-900/95 backdrop-blur-md border border-white/15 rounded-2xl shadow-2xl shadow-emerald-500/10 text-white max-w-xs text-xs relative"
          >
            <div className="flex items-center justify-between gap-3 mb-1">
              <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                WhatsApp Direct Support
              </span>
              <button
                onClick={() => setShowTooltip(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            <p className="text-neutral-300 text-[11px] leading-relaxed">
              Need instant Pro upgrade or have questions? Chat directly with us on WhatsApp at{" "}
              <span className="font-mono font-bold text-white">+91 62806 42187</span>.
            </p>
            <div className="mt-2.5 pt-2 border-t border-white/10 flex justify-end">
              <a
                href={`https://wa.me/91${phoneNumber}?text=${defaultMsg}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white font-medium text-[11px] transition-colors"
              >
                <span>Start Chat</span>
                <Send className="h-3 w-3" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main floating button */}
      <motion.a
        href={`https://wa.me/91${phoneNumber}?text=${defaultMsg}`}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setShowTooltip(true)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        className="h-14 w-14 rounded-full bg-gradient-to-tr from-emerald-600 to-green-500 flex items-center justify-center text-white shadow-xl shadow-emerald-600/30 hover:shadow-emerald-600/50 transition-all border-2 border-white/20 relative group"
        aria-label="Chat with us on WhatsApp"
      >
        {/* Radar ping */}
        <span className="absolute -inset-1 rounded-full bg-emerald-500/40 animate-ping pointer-events-none group-hover:hidden" />
        <WhatsAppIcon className="h-7 w-7 text-white" />
      </motion.a>
    </div>
  );
}
