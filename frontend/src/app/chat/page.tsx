"use client"

import { useState, useEffect } from "react"
import { motion, Variants } from "framer-motion"
import Link from "next/link"
import { 
  Bell, Search, Sun, Moon, MessageSquare, Mic, 
  GraduationCap, FileText, Image as ImageIcon, 
  BarChart, Clock, Zap, ArrowRight, Activity
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import dynamic from "next/dynamic"
import { useAuthStore } from "@/store/authStore"


const UsageChart = dynamic(() => import("@/components/UsageChart"), {
  ssr: false,
  loading: () => <div className="w-full h-full animate-pulse bg-neutral-800/50 rounded-none"></div>
})
import { api } from "@/lib/api"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useRouter } from "next/navigation"
import { getLocalActivities } from "@/lib/activityLogger"

const featureCards = [
  { title: "AI Chat", desc: "Interact with advanced AI models", icon: MessageSquare, color: "bg-indigo-500", link: "/chat/ai-chat" },
  { title: "Voice Assistant", desc: "Speak directly to your AI", icon: Mic, color: "bg-purple-500", link: "/chat/voice" },
  { title: "Image Studio", desc: "Generate & store visual assets", icon: ImageIcon, color: "bg-fuchsia-500", link: "/chat/images" },
  { title: "Doc Analyzer", desc: "Extract insights from PDFs", icon: FileText, color: "bg-blue-500", link: "/chat/docs" },
  { title: "AI Tutor", desc: "Personalized learning sessions", icon: GraduationCap, color: "bg-green-500", link: "/chat/tutor" },
]

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
}

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const displayUsername = user?.name || user?.email?.split('@')[0] || "Guest"
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [usageData, setUsageData] = useState([
    { name: 'Mon', queries: 0, storage: 0 },
    { name: 'Tue', queries: 0, storage: 0 },
    { name: 'Wed', queries: 0, storage: 0 },
    { name: 'Thu', queries: 0, storage: 0 },
    { name: 'Fri', queries: 0, storage: 0 },
    { name: 'Sat', queries: 0, storage: 0 },
    { name: 'Sun', queries: 0, storage: 0 },
  ])

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const res: any = await api.get("/analytics/usage")
        const data = (res as any)?.data || res
        if (data && Array.isArray(data) && data.length > 0) {
          setUsageData(data)
        }
      } catch (error) {
        console.error("Failed to fetch usage data", error)
      }
    }

    const fetchActivities = async () => {
      try {
        const list: any[] = []
        try {
          const res: any = await api.get("/analytics/activities?limit=6")
          const serverActs = res?.data || (Array.isArray(res) ? res : [])
          list.push(...serverActs)
        } catch (e) {}

        const localActs = getLocalActivities()
        localActs.forEach(la => {
          if (!list.some(item => item.id === la.id || (item.title === la.title && item.action === la.action))) {
            list.push(la)
          }
        })

        if (list.length < 4) {
          try {
            const chatsRes = await api.get<any[]>("/chats")
            const chats = Array.isArray(chatsRes) ? chatsRes : (chatsRes as any)?.data || []
            chats.slice(0, 4).forEach((c: any) => {
              if (!list.some(item => item.title === c.title)) {
                list.push({
                  id: `chat-${c.id}`,
                  action: "chat",
                  title: c.title || "AI Conversation",
                  created_at: c.created_at || new Date().toISOString(),
                  category: "AI Chat"
                })
              }
            })
          } catch (e) {}
        }

        list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        setRecentActivities(list.slice(0, 5))
      } catch (e) {}
    }
    
    fetchUsage()
    fetchActivities()

    const onUpdate = () => fetchActivities()
    window.addEventListener("voxa_activity_updated", onUpdate)
    return () => window.removeEventListener("voxa_activity_updated", onUpdate)
  }, [])

  return (
    <div className="flex flex-col min-h-full bg-transparent text-white font-sans relative">
      <main className="flex-1 p-8 pb-20 relative z-10">
        <motion.div 
          className="max-w-7xl mx-auto space-y-10"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          
          {/* Hero Section */}
          <motion.div variants={itemVariants} className="relative overflow-hidden rounded-none bg-neutral-900 border border-neutral-800 p-10 flex flex-col justify-end min-h-[280px]">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none transform translate-x-1/3 -translate-y-1/3" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-500/20 rounded-full blur-[100px] pointer-events-none transform -translate-x-1/4 translate-y-1/4" />
            
            <div className="relative z-10 max-w-2xl">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-8">
                Hi, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">{displayUsername}</span>
              </h1>
              <div className="flex gap-4">
                <Button className="bg-white text-neutral-950 hover:bg-neutral-200 rounded-none h-11 px-6 font-semibold shadow-lg group">
                  <Zap className="mr-2 h-4 w-4 text-indigo-600" />
                  Quick Action
                </Button>
                <Button variant="outline" className="rounded-none h-11 px-6 border-neutral-700 hover:bg-neutral-800 text-neutral-200 font-medium">
                  View Analytics
                </Button>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Features */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  AI Applications
                </h2>
                <Button variant="link" className="text-indigo-400 p-0 h-auto font-medium">View all</Button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {featureCards.map((card, idx) => (
                  <Link href={card.link} key={idx}>
                    <motion.div 
                      variants={itemVariants}
                      whileHover={{ scale: 1.03, y: -5 }}
                      className="group p-5 rounded-none bg-neutral-900 border border-neutral-800 hover:border-indigo-500/50 hover:shadow-[0_8px_30px_rgb(79,70,229,0.12)] transition-all cursor-pointer h-full relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className={`h-10 w-10 rounded-none ${card.color} flex items-center justify-center shadow-lg mb-4 text-white`}>
                        <card.icon className="h-5 w-5" />
                      </div>
                      <h3 className="font-semibold text-neutral-100 mb-1">{card.title}</h3>
                      <p className="text-xs text-neutral-500 leading-relaxed">{card.desc}</p>
                    </motion.div>
                  </Link>
                ))}
              </div>

              {/* Chart Section */}
              <motion.div variants={itemVariants} className="mt-8 pt-8 border-t border-neutral-800/50">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  Usage Overview
                </h2>
                <div className="h-[300px] w-full bg-neutral-900 border border-neutral-800 rounded-none p-6 shadow-sm">
                  <UsageChart data={usageData} />
                </div>
              </motion.div>
            </div>

            {/* Right Column: Widgets */}
            <div className="space-y-6">
              
              {/* Recent Activity */}
              <motion.div variants={itemVariants} className="bg-neutral-900 border border-neutral-800 rounded-none p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Clock className="h-5 w-5 text-neutral-400" /> Recent Activity
                  </h2>
                  <span className="text-[10px] text-neutral-500 font-mono">Live</span>
                </div>
                
                {recentActivities.length === 0 ? (
                  <div className="py-8 text-center text-neutral-500 text-xs">
                    No recent activity yet. Searches and queries will appear here automatically.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentActivities.map((activity, idx) => {
                      let IconComponent = MessageSquare
                      let color = "text-indigo-400"
                      let bg = "bg-indigo-400/10"

                      if (activity.action === "search" || activity.category === "Searches") {
                        IconComponent = Search
                        color = "text-amber-400"
                        bg = "bg-amber-400/10"
                      } else if (activity.action === "voice_query" || activity.category === "Voice Assistant") {
                        IconComponent = Mic
                        color = "text-purple-400"
                        bg = "bg-purple-400/10"
                      } else if (activity.action === "presentation_generate" || activity.category === "Presentations") {
                        IconComponent = Zap
                        color = "text-orange-400"
                        bg = "bg-orange-400/10"
                      } else if (activity.action === "ai_tutor" || activity.category === "AI Tutor") {
                        IconComponent = GraduationCap
                        color = "text-teal-400"
                        bg = "bg-teal-400/10"
                      }

                      const timeStr = activity.created_at ? new Date(activity.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"

                      return (
                        <div 
                          key={idx} 
                          onClick={() => router.push(activity.category === "Searches" ? `/chat/history?q=${encodeURIComponent(activity.query || activity.title)}` : "/chat/history")}
                          className="flex items-start gap-3.5 group cursor-pointer hover:bg-neutral-800/40 p-2 -mx-2 transition-colors"
                        >
                          <div className={`h-9 w-9 rounded-none ${bg} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                            <IconComponent className={`h-4 w-4 ${color}`} />
                          </div>
                          <div className="overflow-hidden flex-1">
                            <p className="text-sm font-medium text-neutral-200 group-hover:text-white transition-colors truncate">
                              {activity.title}
                            </p>
                            <p className="text-xs text-neutral-500 mt-0.5 flex items-center gap-2">
                              <span>{timeStr}</span>
                              <span>•</span>
                              <span className="capitalize">{activity.category || activity.action}</span>
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
                
                <Button 
                  variant="ghost" 
                  onClick={() => router.push("/chat/history")}
                  className="w-full mt-6 text-xs text-neutral-400 hover:text-white border border-neutral-800 rounded-none hover:bg-neutral-800/60"
                >
                  View all history ({recentActivities.length})
                </Button>
              </motion.div>

              {/* Quick Access */}
              <motion.div variants={itemVariants} className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-none p-6 relative overflow-hidden shadow-sm">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-[40px] pointer-events-none" />
                <h2 className="text-lg font-bold text-white mb-2">Upgrade to Pro</h2>
                <p className="text-sm text-indigo-200 mb-6 max-w-[200px]">Unlock GPT-4, DALL-E 3, and unlimited API usage.</p>
                <Button className="w-full bg-white text-indigo-950 hover:bg-neutral-200 rounded-none font-bold shadow-lg">
                  Upgrade Now
                </Button>
              </motion.div>

            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}

function SparklesIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  )
}
