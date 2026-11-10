"use client"
import * as React from "react"
import { usePathname } from "next/navigation"
import {
  MessageSquare,
  Mic,
  GraduationCap,
  FileText,
  MonitorPlay,
  StickyNote,
  Users,
  FolderOpen,
  BarChart,
  Settings,
  Image as ImageIcon,
  LayoutDashboard,
  Clock,
  Brain,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { ContactProModal } from "@/components/landing/ContactProModal"
import { Sparkles } from "lucide-react"

// Menu items.
const items = [
  {
    title: "Dashboard",
    url: "/chat",
    icon: LayoutDashboard,
    isActive: true,
  },
  {
    title: "History",
    url: "/chat/history",
    icon: Clock,
  },
  {
    title: "AI Chat (PDF)",
    url: "/chat/ai-chat",
    icon: MessageSquare,
  },
  {
    title: "Voice Assistant",
    url: "/chat/voice",
    icon: Mic,
  },
  {
    title: "AI Tutor",
    url: "/chat/tutor",
    icon: GraduationCap,
  },
  {
    title: "Memory Graph",
    url: "/chat/memory",
    icon: Brain,
  },
  {
    title: "Doc Analyzer",
    url: "/chat/docs",
    icon: FileText,
  },
  {
    title: "Presentations",
    url: "/chat/presentations",
    icon: MonitorPlay,
  },
  {
    title: "AI Notes",
    url: "/chat/notes",
    icon: StickyNote,
  },
  {
    title: "Mock Interview",
    url: "/chat/interview",
    icon: Users,
  },
  {
    title: "My Files",
    url: "/chat/files",
    icon: FolderOpen,
  },
  {
    title: "Settings",
    url: "/chat/settings",
    icon: Settings,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  
  return (
    <>
      <Sidebar className="border-r border-border/50 dark:bg-neutral-950 bg-white backdrop-blur-2xl">
        <SidebarHeader className="p-4 border-b border-border/50">
          <div className="flex items-center gap-2 font-bold text-xl">
            <div className="h-8 w-8 rounded-none bg-indigo-600 flex items-center justify-center text-white">
              <Mic className="h-4 w-4" />
            </div>
            <span>Voxa AI</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => {
                  const isActive = pathname === item.url || (item.url !== '/chat' && pathname?.startsWith(item.url + '/')) || (item.url === '/chat' && pathname === '/chat')
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        isActive={isActive} 
                        className={`py-6 rounded-none ${isActive ? 'bg-indigo-500/10 text-indigo-500 font-bold border-r-2 border-indigo-500' : 'text-muted-foreground'}`}
                        render={
                          <a href={item.url} className="flex items-center gap-3">
                            <item.icon className="h-5 w-5" />
                            <span className="font-medium">{item.title}</span>
                          </a>
                        }
                      />
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="p-4 border-t border-border/50">
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-500/40 text-indigo-300 font-mono text-xs rounded-none transition-colors cursor-pointer group"
            title="Click to view Pro Plan details / Contact support"
          >
            <span className="font-semibold tracking-wider uppercase text-[11px] flex items-center gap-1.5 group-hover:text-white">
              <Sparkles className="h-3 w-3 text-indigo-400" />
              Pro Plan (₹299)
            </span>
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </button>
        </SidebarFooter>
      </Sidebar>

      <ContactProModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialMode="pro"
      />
    </>
  )
}
