"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Sparkles, Zap, ArrowRight, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContactProModal, WhatsAppIcon } from "./ContactProModal";

export function Pricing() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"pro" | "team" | "contact">("pro");

  const openModal = (mode: "pro" | "team" | "contact") => {
    setModalMode(mode);
    setModalOpen(true);
  };

  return (
    <>
      <section id="pricing" className="py-28 relative z-10 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20 mb-4"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Transparent & Fair Pricing</span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 text-white"
            >
              Plans tailored for your growth
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-base sm:text-lg text-neutral-400 max-w-2xl mx-auto"
            >
              Start for free and upgrade as your projects expand. Instant activation via WhatsApp or Email.
            </motion.p>
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
            {/* Card 1: Free */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="rounded-3xl p-8 bg-white dark:bg-neutral-900/90 text-neutral-900 dark:text-white border border-neutral-200 dark:border-white/10 shadow-xl flex flex-col justify-between relative"
            >
              <div>
                <h3 className="text-2xl font-bold tracking-tight mb-1 text-neutral-900 dark:text-white">
                  Free
                </h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 h-10">
                  For students exploring AI-assisted learning.
                </p>

                <div className="flex items-baseline gap-2 mb-8">
                  <span className="text-5xl font-black tracking-tight text-neutral-900 dark:text-white">
                    ₹0
                  </span>
                  <span className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">
                    forever
                  </span>
                </div>

                <ul className="space-y-3.5 mb-8 text-sm">
                  {[
                    "50 AI messages / day",
                    "AI Tutor & Notes",
                    "3 document uploads / month",
                    "Voice assistant (basic)",
                    "Community support",
                  ].map((feat, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="h-5 w-5 rounded-full bg-violet-100 dark:bg-violet-950/60 flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-neutral-700 dark:text-neutral-300 font-medium">
                        {feat}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link href="/auth" className="w-full">
                <Button
                  variant="outline"
                  className="w-full py-6 rounded-2xl font-bold text-sm bg-violet-50 hover:bg-violet-100 dark:bg-white/5 dark:hover:bg-white/10 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-white/10 transition-all hover-lift"
                >
                  Start for free
                </Button>
              </Link>
            </motion.div>

            {/* Card 2: Pro (Highlighted Card matching user's screenshot) */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="rounded-3xl p-8 bg-gradient-to-b from-blue-600 to-indigo-600 text-white shadow-2xl shadow-indigo-500/30 flex flex-col justify-between relative transform md:-translate-y-4 border-2 border-white/20"
            >
              {/* Most popular badge */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-white text-indigo-700 text-[11px] font-extrabold uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md">
                Most Popular
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-2xl font-bold tracking-tight text-white">
                    Pro
                  </h3>
                  <span className="text-xs font-semibold bg-white/20 px-2 py-0.5 rounded-full">
                    Instant Upgrade
                  </span>
                </div>
                <p className="text-sm text-blue-100 mb-6 h-10">
                  For power users who study and build every day.
                </p>

                <div className="flex items-baseline gap-2 mb-8">
                  <span className="text-5xl font-black tracking-tight text-white">
                    ₹299
                  </span>
                  <span className="text-sm text-blue-100 font-medium">
                    per month
                  </span>
                </div>

                <ul className="space-y-3.5 mb-8 text-sm">
                  {[
                    "Unlimited AI messages",
                    "Unlimited document analysis",
                    "Presentation generator",
                    "Mock interview practice",
                    "Priority response speed",
                    "Email support",
                  ].map((feat, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="h-5 w-5 rounded-full bg-white/25 flex items-center justify-center text-white shrink-0">
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                      </div>
                      <span className="text-white font-medium">
                        {feat}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <Button
                  onClick={() => openModal("pro")}
                  className="w-full py-6 rounded-2xl font-bold text-sm bg-white hover:bg-neutral-100 text-indigo-950 shadow-xl transition-all hover-lift active:scale-95"
                >
                  <Sparkles className="h-4 w-4 mr-1 text-indigo-600" />
                  Upgrade to Pro
                </Button>

                {/* Sub contact helper */}
                <div className="mt-3 flex items-center justify-center gap-3 text-[11px] text-blue-100">
                  <button
                    onClick={() => openModal("pro")}
                    className="hover:underline flex items-center gap-1"
                  >
                    <WhatsAppIcon className="h-3 w-3" /> WhatsApp (6280642187)
                  </button>
                  <span>•</span>
                  <button
                    onClick={() => openModal("pro")}
                    className="hover:underline flex items-center gap-1"
                  >
                    <Mail className="h-3 w-3" /> Email us
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Card 3: Team */}
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="rounded-3xl p-8 bg-white dark:bg-neutral-900/90 text-neutral-900 dark:text-white border border-neutral-200 dark:border-white/10 shadow-xl flex flex-col justify-between relative"
            >
              <div>
                <h3 className="text-2xl font-bold tracking-tight mb-1 text-neutral-900 dark:text-white">
                  Team
                </h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 h-10">
                  For study groups, clubs and small teams.
                </p>

                <div className="flex items-baseline gap-2 mb-8">
                  <span className="text-5xl font-black tracking-tight text-neutral-900 dark:text-white">
                    ₹999
                  </span>
                  <span className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">
                    per month · 5 seats
                  </span>
                </div>

                <ul className="space-y-3.5 mb-8 text-sm">
                  {[
                    "Everything in Pro",
                    "Shared folders & chats",
                    "Team analytics dashboard",
                    "Admin controls",
                    "Dedicated onboarding",
                  ].map((feat, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="h-5 w-5 rounded-full bg-violet-100 dark:bg-violet-950/60 flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-neutral-700 dark:text-neutral-300 font-medium">
                        {feat}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <Button
                  onClick={() => openModal("team")}
                  variant="outline"
                  className="w-full py-6 rounded-2xl font-bold text-sm bg-violet-50 hover:bg-violet-100 dark:bg-white/5 dark:hover:bg-white/10 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-white/10 transition-all hover-lift"
                >
                  Contact us
                </Button>
                <p className="mt-2 text-center text-[11px] text-neutral-500">
                  Custom quotes & invoicing available
                </p>
              </div>
            </motion.div>
          </div>

          {/* Direct Support Banner */}
          <div className="mt-14 max-w-4xl mx-auto rounded-2xl bg-neutral-900/60 border border-white/10 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mx-auto sm:mx-0">
                <WhatsAppIcon className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">
                  Need Help or Instant Pro Activation?
                </h4>
                <p className="text-xs text-neutral-400">
                  Message us directly on WhatsApp at{" "}
                  <span className="font-mono text-emerald-400 font-bold">6280642187</span>{" "}
                  or email{" "}
                  <span className="font-mono text-violet-400 font-bold">s6899878@gmail.com</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <a
                href="https://wa.me/916280642187?text=Hello%20Voxa%20AI%20Team!%20I%20want%20to%20upgrade%20to%20Pro%20(₹299/mo)%20or%20have%20an%20inquiry."
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all active:scale-95"
              >
                <WhatsAppIcon className="h-4 w-4" />
                WhatsApp Us
              </a>
              <button
                onClick={() => openModal("pro")}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/10 transition-all active:scale-95"
              >
                <Mail className="h-4 w-4" />
                Email Support
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Modal */}
      <ContactProModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialMode={modalMode}
      />
    </>
  );
}
