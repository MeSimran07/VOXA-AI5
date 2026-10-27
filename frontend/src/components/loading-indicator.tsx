"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export function FloatingLoadingIndicator() {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Show brief smooth transition indicator when route changes
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 700);

    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 10 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-4 right-4 z-[9999] pointer-events-none select-none"
        >
          <div className="relative flex items-center justify-center w-11 h-11 rounded-full bg-neutral-900/90 border border-violet-500/40 text-white shadow-[0_4px_20px_rgba(124,92,255,0.35)] backdrop-blur-md">
            <span className="text-xl animate-spin [animation-duration:2.5s] inline-block leading-none drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]">
              💫
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
