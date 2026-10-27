import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans overflow-x-hidden selection:bg-violet-500/30">
      <Navbar />
      <main className="flex-1 pb-16">
        <Hero />
        <Features />
      </main>
      <footer className="py-8 text-center text-xs text-neutral-500 border-t border-white/5 bg-background/50">
        <p>© {new Date().getFullYear()} Voxa AI. All rights reserved.</p>
      </footer>
    </div>
  );
}
