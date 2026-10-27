"use client"

import React, { useEffect } from "react"
import { useRouter } from "next/navigation"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { TopNav } from "@/components/layout/top-nav"
import { useAuthStore } from "@/store/authStore"

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { isAuthenticated, checkAuth, isLoading } = useAuthStore()

  useEffect(() => {
    checkAuth().then(() => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/auth');
      }
    });
  }, [checkAuth, router])

  if (isLoading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-neutral-950 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute w-[500px] h-[500px] rounded-full blur-[120px] top-1/4 left-1/4 bg-indigo-600/10" />
          <div className="absolute w-[600px] h-[600px] rounded-full blur-[150px] bottom-1/4 right-1/4 bg-purple-600/10" />
        </div>
        
        {/* Loader Content */}
        <div className="z-10 flex flex-col items-center gap-6">
          <div className="relative flex items-center justify-center">
            {/* Outer spinning rings */}
            <div className="absolute h-24 w-24 rounded-full border-t-2 border-r-2 border-indigo-500 animate-[spin_2s_linear_infinite]" />
            <div className="absolute h-20 w-20 rounded-full border-b-2 border-l-2 border-purple-500 animate-[spin_1.5s_linear_infinite_reverse]" />
            {/* Center icon */}
            <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center shadow-[0_0_30px_rgba(79,70,229,0.5)] animate-pulse">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      {/* Global Fixed Background (Dynamic Light / Dark) */}
      <div className="fixed inset-0 z-[-1] pointer-events-none transition-colors duration-500 dark:bg-neutral-950 bg-slate-50">
        <div className="absolute inset-0 dark:bg-neutral-950/40 bg-white/40 z-10" />
        <div className="absolute inset-0 bg-gradient-to-t dark:from-neutral-950 from-slate-50 via-transparent to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-b dark:from-neutral-950/50 from-slate-100/50 to-transparent z-10" />
        <img 
          src="/auth-hero.png" 
          alt="Voxa AI Background" 
          className="w-full h-full object-cover dark:mix-blend-screen opacity-10 dark:opacity-20" 
        />
        <div className="absolute w-[500px] h-[500px] rounded-full blur-[120px] top-1/4 left-1/4 dark:bg-indigo-600/10 bg-indigo-500/10 z-10" />
        <div className="absolute w-[600px] h-[600px] rounded-full blur-[150px] bottom-1/4 right-1/4 dark:bg-purple-600/10 bg-purple-500/10 z-10" />
      </div>

      <AppSidebar />
      <main className="flex flex-col flex-1 h-screen overflow-hidden relative">
        <TopNav />
        <div className="flex-1 overflow-y-auto w-full relative z-0">
          {children}
        </div>
      </main>
    </SidebarProvider>
  )
}
