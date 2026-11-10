"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Mail, Phone, Copy, Check, Send, 
  Sparkles, ShieldCheck, Zap, MessageSquare 
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function WhatsAppIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

export interface ContactProModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "pro" | "team" | "contact";
}

export function ContactProModal({
  isOpen,
  onClose,
  initialMode = "pro",
}: ContactProModalProps) {
  const [mode, setMode] = useState<"pro" | "team" | "contact">(initialMode);
  const [activeTab, setActiveTab] = useState<"direct" | "form">("direct");
  const [copiedField, setCopiedField] = useState<"email" | "phone" | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formMessage, setFormMessage] = useState("");

  const targetEmail = "s6899878@gmail.com";
  const targetPhoneRaw = "6280642187";
  const targetPhoneFormatted = "+91 62806 42187";

  // Dynamic defaults based on mode
  const getSubject = () => {
    if (mode === "pro") return "Voxa AI Pro Upgrade Request (₹299/month)";
    if (mode === "team") return "Voxa AI Team Plan Inquiry (₹999/month)";
    return "Voxa AI - Contact & Support Inquiry";
  };

  const getWhatsAppMessage = () => {
    if (formMessage.trim()) {
      return `Hello Voxa AI! %0A%0A*Name:* ${encodeURIComponent(formName || "Customer")}%0A*Email:* ${encodeURIComponent(formEmail || "N/A")}%0A*Inquiry:* ${encodeURIComponent(formMessage)}%0A*Topic:* ${encodeURIComponent(mode.toUpperCase())}`;
    }
    if (mode === "pro") {
      return `Hello! I would like to upgrade my account to the Voxa AI Pro Plan (₹299/month). Please assist me with payment and activation.`;
    }
    if (mode === "team") {
      return `Hello! We are interested in the Voxa AI Team Plan (₹999/month - 5 seats). Please share details.`;
    }
    return `Hello Voxa AI Team! I have an inquiry and would like to get in touch.`;
  };

  const getMailtoUrl = () => {
    const subject = encodeURIComponent(getSubject());
    let body = "";
    if (formMessage.trim()) {
      body = `Hi Voxa AI Team,\n\nName: ${formName || "Customer"}\nEmail: ${formEmail || "N/A"}\nPhone: ${formPhone || "N/A"}\nTopic: ${mode.toUpperCase()}\n\nMessage:\n${formMessage}\n\nThank you!`;
    } else if (mode === "pro") {
      body = `Hi Voxa AI Team,\n\nI want to upgrade my account to Voxa AI Pro (₹299/month).\n\nMy Registered Email: \nMy Phone Number: \n\nPlease let me know how to complete the activation.\n\nThank you!`;
    } else if (mode === "team") {
      body = `Hi Voxa AI Team,\n\nI am interested in setting up the Team Plan (₹999/month for 5 seats).\n\nOrganization / Team Name: \nContact Person: \nEmail: \nPhone: \n\nThank you!`;
    } else {
      body = `Hi Voxa AI Team,\n\nI would like to get in touch with you regarding Voxa AI.\n\nName: \nMessage: \n\nThank you!`;
    }
    return `mailto:${targetEmail}?subject=${subject}&body=${encodeURIComponent(body)}`;
  };

  const handleCopy = (field: "email" | "phone", value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2500);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", duration: 0.45, bounce: 0.15 }}
          className="relative w-full max-w-lg bg-neutral-950 border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-violet-500/10 text-white z-10 overflow-hidden"
        >
          {/* Top energetic gradient beam */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-600 via-indigo-500 to-emerald-400" />
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />

          {/* Modal Header */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-2 bg-violet-500/15 text-violet-400 border border-violet-500/30">
                {mode === "pro" && (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Pro Upgrade • ₹299/month</span>
                  </>
                )}
                {mode === "team" && (
                  <>
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Team Licensing • ₹999/month</span>
                  </>
                )}
                {mode === "contact" && (
                  <>
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>Direct Contact & Support</span>
                  </>
                )}
              </div>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                {mode === "pro"
                  ? "Upgrade to Voxa AI Pro"
                  : mode === "team"
                  ? "Connect for Team Access"
                  : "Get in Touch with Us"}
              </h3>
              <p className="text-xs sm:text-sm text-neutral-400 mt-1">
                {mode === "pro"
                  ? "Send us a message on WhatsApp or Email for instant Pro activation."
                  : "Reach out directly via WhatsApp or Email. We reply in minutes!"}
              </p>
            </div>

            <button
              onClick={onClose}
              className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white flex items-center justify-center transition-colors shrink-0 ml-3"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-neutral-900/80 rounded-xl border border-white/10 mb-5 text-xs">
            <button
              onClick={() => setMode("pro")}
              className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                mode === "pro"
                  ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Pro Plan (₹299)
            </button>
            <button
              onClick={() => setMode("team")}
              className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                mode === "team"
                  ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Team Plan (₹999)
            </button>
            <button
              onClick={() => setMode("contact")}
              className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                mode === "contact"
                  ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              General Contact
            </button>
          </div>

          {/* Contact Details Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            {/* Email Card */}
            <div className="bg-neutral-900/70 border border-white/10 rounded-2xl p-4 flex flex-col justify-between hover:border-violet-500/40 transition-colors">
              <div>
                <div className="flex items-center justify-between text-xs text-neutral-400 mb-1.5">
                  <span className="flex items-center gap-1.5 font-medium text-violet-400">
                    <Mail className="h-3.5 w-3.5" /> Official Email
                  </span>
                  <span className="text-[10px] bg-violet-500/20 text-violet-300 px-1.5 py-0.5 rounded">
                    Direct
                  </span>
                </div>
                <div className="font-mono text-sm font-semibold text-white break-all">
                  {targetEmail}
                </div>
              </div>
              <button
                onClick={() => handleCopy("email", targetEmail)}
                className="mt-3 flex items-center justify-center gap-1.5 py-1 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-medium transition-colors w-full border border-white/5"
              >
                {copiedField === "email" ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-semibold">Email Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-neutral-400" />
                    <span>Copy Email</span>
                  </>
                )}
              </button>
            </div>

            {/* WhatsApp Card */}
            <div className="bg-neutral-900/70 border border-white/10 rounded-2xl p-4 flex flex-col justify-between hover:border-emerald-500/40 transition-colors">
              <div>
                <div className="flex items-center justify-between text-xs text-neutral-400 mb-1.5">
                  <span className="flex items-center gap-1.5 font-medium text-emerald-400">
                    <WhatsAppIcon className="h-3.5 w-3.5" /> WhatsApp Support
                  </span>
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="font-mono text-sm font-semibold text-white">
                  {targetPhoneFormatted}
                </div>
              </div>
              <button
                onClick={() => handleCopy("phone", targetPhoneRaw)}
                className="mt-3 flex items-center justify-center gap-1.5 py-1 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-medium transition-colors w-full border border-white/5"
              >
                {copiedField === "phone" ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-semibold">Number Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-neutral-400" />
                    <span>Copy Number</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Connect Actions */}
          <div className="space-y-2.5">
            {/* Primary WhatsApp Action */}
            <a
              href={`https://wa.me/91${targetPhoneRaw}?text=${encodeURIComponent(getWhatsAppMessage())}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2.5 w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold shadow-lg shadow-emerald-600/25 transition-all active:scale-[0.98] group"
            >
              <WhatsAppIcon className="h-5 w-5 text-white group-hover:scale-110 transition-transform" />
              <span>
                {mode === "pro"
                  ? "Chat on WhatsApp to Upgrade (6280642187)"
                  : "Chat on WhatsApp (6280642187)"}
              </span>
            </a>

            {/* Email Action */}
            <a
              href={getMailtoUrl()}
              className="flex items-center justify-center gap-2.5 w-full py-3 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl font-semibold shadow-md shadow-violet-600/20 transition-all active:scale-[0.98] group"
            >
              <Mail className="h-4 w-4 text-violet-200 group-hover:scale-110 transition-transform" />
              <span>Send Message to {targetEmail}</span>
            </a>

            {/* Direct Phone Call */}
            <a
              href={`tel:+91${targetPhoneRaw}`}
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/10 rounded-xl text-xs font-medium transition-all"
            >
              <Phone className="h-3.5 w-3.5 text-neutral-400" />
              <span>Direct Phone Call: {targetPhoneFormatted}</span>
            </a>
          </div>

          {/* Collapsible Custom Message Box */}
          <div className="mt-4 pt-4 border-t border-white/10">
            {activeTab === "direct" ? (
              <button
                onClick={() => setActiveTab("form")}
                className="w-full text-center text-xs text-violet-400 hover:text-violet-300 flex items-center justify-center gap-1.5 transition-colors font-medium py-1"
              >
                <span>Write custom message / Send inquiry details</span>
                <span>↓</span>
              </button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-neutral-300 font-medium">
                  <span>Custom Inquiry Form</span>
                  <button
                    onClick={() => setActiveTab("direct")}
                    className="text-[11px] text-neutral-400 hover:text-white"
                  >
                    Hide
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Your Name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-violet-500"
                  />
                  <input
                    type="email"
                    placeholder="Your Email or Phone"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-violet-500"
                  />
                </div>
                <textarea
                  rows={2}
                  placeholder={`Optional notes or instructions for ${mode === "pro" ? "Pro Upgrade" : "your query"}...`}
                  value={formMessage}
                  onChange={(e) => setFormMessage(e.target.value)}
                  className="w-full bg-neutral-900 border border-white/10 rounded-lg p-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-violet-500 resize-none"
                />
                <div className="flex gap-2">
                  <a
                    href={`https://wa.me/91${targetPhoneRaw}?text=${encodeURIComponent(getWhatsAppMessage())}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 px-3 bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-semibold text-center flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <WhatsAppIcon className="h-3.5 w-3.5" />
                    <span>Send via WhatsApp</span>
                  </a>
                  <a
                    href={getMailtoUrl()}
                    className="flex-1 py-2 px-3 bg-violet-600/30 hover:bg-violet-600/40 text-violet-300 border border-violet-500/30 rounded-lg text-xs font-semibold text-center flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    <span>Send via Email</span>
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Footer notice */}
          <div className="mt-4 text-center text-[11px] text-neutral-500">
            Voxa AI Official Contact • Email: <span className="text-neutral-400 font-mono">{targetEmail}</span> • Phone / WhatsApp: <span className="text-neutral-400 font-mono">{targetPhoneRaw}</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
