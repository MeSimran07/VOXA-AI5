"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-32 pb-20 px-6 bg-neutral-950">
      {/* Background matching Auth Page */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-neutral-950/40 mix-blend-multiply z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/50 to-transparent z-10" />
        <motion.img 
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          src="/auth-hero.png" 
          alt="Voxa AI Background" 
          className="w-full h-full object-cover mix-blend-screen opacity-50" 
        />
        <div className="absolute w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none z-10 top-1/4 left-1/4 bg-indigo-600/20" />
        <div className="absolute w-[600px] h-[600px] rounded-full blur-[150px] pointer-events-none z-10 bottom-1/4 right-1/4 bg-purple-600/20" />
      </div>

      <div className="z-20 text-center space-y-8 max-w-5xl mx-auto mt-10">

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-6xl sm:text-7xl lg:text-8xl font-extrabold tracking-tighter leading-[1.05] drop-shadow-sm text-white"
        >
          VOXA AI <br className="hidden sm:block"/>
          <span className="text-gradient">THE ULTIMATE AI AGENT</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-xl sm:text-2xl text-neutral-300 max-w-3xl mx-auto leading-relaxed font-medium"
        >
          Your intelligent workspace. Seamlessly blending voice, documents, and learning into one autonomous AI experience.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4"
        >
          <Link href="/auth">
            <Button size="lg" className="bg-white text-black hover:bg-neutral-200 font-semibold px-8 h-14 rounded-2xl text-lg shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:shadow-[0_0_40px_rgba(255,255,255,0.5)] transition-all hover-lift group">
              Start Free
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Link href="#demo">
            <Button size="lg" variant="outline" className="text-white border-white/20 hover:bg-white/10 h-14 rounded-2xl text-lg px-8 backdrop-blur-md transition-all hover-lift">
              Watch Demo
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
