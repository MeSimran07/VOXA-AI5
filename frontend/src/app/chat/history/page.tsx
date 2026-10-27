"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { 
  MessageSquare, FileText, StickyNote, Mic, Search, Loader2, 
  ChevronRight, Bot, FolderOpen, Sparkles, ExternalLink, Calendar,
  MonitorPlay, GraduationCap, Trash2, ArrowUpRight, History, Cloud, HardDrive
} from "lucide-react"
import { api } from "@/lib/api"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { getLocalActivities, clearLocalActivities } from "@/lib/activityLogger"

function formatRelativeTime(dateString?: string) {
  if (!dateString) return "Recently";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Recently";
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  } catch (e) {
    return "Recently";
  }
}

export interface UnifiedHistoryItem {
  id: string
  title: string
  category: "Searches" | "AI Chat" | "Voice Assistant" | "AI Tutor" | "Presentations" | "Doc Analyzer" | "AI Notes"
  created_at: string
  detail?: string
  raw?: any
  link?: string
}

function HistoryContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQ = searchParams.get("q") || ""

  const [items, setItems] = useState<UnifiedHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(initialQ)
  const [selectedCategory, setSelectedCategory] = useState<string>("All")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [isClearing, setIsClearing] = useState(false)
  const [isCloudSynced, setIsCloudSynced] = useState<boolean | null>(null)

  useEffect(() => {
    if (initialQ) {
      setSearchQuery(initialQ)
    }
  }, [initialQ])

  useEffect(() => {
    // 1. Instant 0ms cache load so user can access history immediately
    try {
      const cached = localStorage.getItem("voxa_cloud_history_cache")
      if (cached) {
        const parsed = JSON.parse(cached)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems(parsed)
          setIsLoading(false)
        }
      }
    } catch (e) {}

    fetchAllHistory()

    const handleUpdate = () => {
      fetchAllHistory(false)
    }
    window.addEventListener("voxa_activity_updated", handleUpdate)
    return () => window.removeEventListener("voxa_activity_updated", handleUpdate)
  }, [])

  const fetchAllHistory = async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true)
      const unifiedMap = new Map<string, UnifiedHistoryItem>()

      // 1. Fetch AI Chats
      try {
        const chatsRes = await api.get<any[]>("/chats")
        const chats = Array.isArray(chatsRes) ? chatsRes : (chatsRes as any)?.data || []
        chats.forEach((chat: any) => {
          const isVoice = chat.title?.toLowerCase().includes("voice") || chat.title?.toLowerCase().includes("interview")
          const isTutor = chat.title?.toLowerCase().includes("tutor")
          let category: UnifiedHistoryItem["category"] = "AI Chat"
          if (isVoice) category = "Voice Assistant"
          else if (isTutor) category = "AI Tutor"

          const id = `chat-${chat.id}`
          unifiedMap.set(id, {
            id,
            title: chat.title || "AI Chat Session",
            category,
            created_at: chat.created_at || new Date().toISOString(),
            detail: chat.messages ? `${chat.messages.length} messages exchanged` : undefined,
            raw: chat,
            link: "/chat/ai-chat"
          })
        })
      } catch (e) {}

      // 2. Fetch Uploaded Documents & Image Storage
      try {
        const docsRes = await api.get<any[]>("/documents")
        const docs = Array.isArray(docsRes) ? docsRes : (docsRes as any)?.data || []
        docs.forEach((doc: any) => {
          if (!doc) return
          const id = `doc-${doc.id || Math.random()}`
          unifiedMap.set(id, {
            id,
            title: doc.filename || "Uploaded File",
            category: "Doc Analyzer",
            created_at: doc.created_at || new Date().toISOString(),
            detail: doc.cloudinary_url ? "Stored in Cloudinary" : `${(doc.file_size ? (doc.file_size / 1024).toFixed(0) : 0)} KB`,
            raw: doc,
            link: "/chat/docs"
          })
        })
      } catch (e) {}

      // 3. Fetch Generated Notes & Mindmaps
      try {
        const notesRes = await api.get<any[]>("/notes")
        const notes = Array.isArray(notesRes) ? notesRes : (notesRes as any)?.data || []
        notes.forEach((note: any) => {
          if (!note) return
          const id = `note-${note.id || Math.random()}`
          unifiedMap.set(id, {
            id,
            title: note.title || "Generated Note",
            category: "AI Notes",
            created_at: note.created_at || new Date().toISOString(),
            detail: "AI Note / Mindmap",
            raw: note,
            link: "/chat/notes"
          })
        })
      } catch (e) {}

      // 4. Fetch Activities & Searches from Backend Database
      try {
        const actRes: any = await api.get("/analytics/activities")
        const activities = actRes?.data || (Array.isArray(actRes) ? actRes : [])
        activities.forEach((act: any) => {
          let category: UnifiedHistoryItem["category"] = "Searches"
          let link = "/chat"

          if (act.action === "search") {
            category = "Searches"
            link = `/chat/history?q=${encodeURIComponent(act.query || act.title)}`
          } else if (act.action === "voice_query") {
            category = "Voice Assistant"
            link = "/chat/voice"
          } else if (act.action === "presentation_generate") {
            category = "Presentations"
            link = "/chat/presentations"
          } else if (act.action === "ai_tutor") {
            category = "AI Tutor"
            link = "/chat/tutor"
          } else if (act.action === "chat_query") {
            category = "AI Chat"
            link = "/chat/ai-chat"
          }

          const id = act.id || `act-${Math.random()}`
          unifiedMap.set(id, {
            id,
            title: act.title || act.query || "Recorded Activity",
            category,
            created_at: act.created_at || new Date().toISOString(),
            detail: act.detail || (act.query ? `Query: "${act.query}"` : undefined),
            raw: act,
            link
          })
        })
      } catch (e) {}

      // 5. Merge Local Activities (Ensures Demo Users & Offline Users never lose anything)
      const localActs = getLocalActivities()
      localActs.forEach((act: any) => {
        let category: UnifiedHistoryItem["category"] = "Searches"
        let link = "/chat"

        if (act.action === "search") {
          category = "Searches"
          link = `/chat/history?q=${encodeURIComponent(act.query || act.title)}`
        } else if (act.action === "voice_query") {
          category = "Voice Assistant"
          link = "/chat/voice"
        } else if (act.action === "presentation_generate") {
          category = "Presentations"
          link = "/chat/presentations"
        } else if (act.action === "ai_tutor") {
          category = "AI Tutor"
          link = "/chat/tutor"
        } else if (act.action === "chat_query") {
          category = "AI Chat"
          link = "/chat/ai-chat"
        }

        const id = act.id || `local-${act.created_at}`
        if (!unifiedMap.has(id)) {
          unifiedMap.set(id, {
            id,
            title: act.title || act.query || "Recent Activity",
            category,
            created_at: act.created_at || new Date().toISOString(),
            detail: act.detail || (act.query ? `Query: "${act.query}"` : undefined),
            raw: act,
            link
          })
        }
      })

      // Convert map to sorted array (newest first)
      const list = Array.from(unifiedMap.values())
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      
      if (list.length > 0) {
        setItems(list)
        try {
          localStorage.setItem("voxa_cloud_history_cache", JSON.stringify(list))
        } catch (e) {}
      }
      setIsCloudSynced(true)

    } catch (error) {
      setIsCloudSynced(false)
      console.warn("Could not reach cloud API, using local & cached history records", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearAll = async () => {
    if (!confirm("Are you sure you want to clear all your search and activity history?")) return
    setIsClearing(true)
    try {
      clearLocalActivities()
      try {
        localStorage.removeItem("voxa_cloud_history_cache")
      } catch (e) {}
      try {
        await api.delete("/analytics/activities")
      } catch (e) {}
      setItems([])
      toast.success("All searches and activity history cleared successfully!")
    } catch (e) {
      toast.error("Failed to clear history")
    } finally {
      setIsClearing(false)
    }
  }

  const categories = [
    "All", 
    "Searches", 
    "AI Chat", 
    "Voice Assistant", 
    "AI Tutor", 
    "Presentations", 
    "Doc Analyzer", 
    "AI Notes"
  ]

  const filteredItems = items.filter(item => {
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory
    const q = searchQuery.toLowerCase().trim()
    const matchesSearch = !q || 
      item.title.toLowerCase().includes(q) || 
      (item.detail && item.detail.toLowerCase().includes(q)) ||
      item.category.toLowerCase().includes(q)
    return matchesCategory && matchesSearch
  })

  const getItemCategoryBadge = (cat: string) => {
    switch (cat) {
      case "Searches":
        return <div className="p-2 bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center"><Search className="w-4 h-4" /></div>
      case "AI Chat":
        return <div className="p-2 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center"><MessageSquare className="w-4 h-4" /></div>
      case "Voice Assistant":
        return <div className="p-2 bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center"><Mic className="w-4 h-4" /></div>
      case "AI Tutor":
        return <div className="p-2 bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center"><GraduationCap className="w-4 h-4" /></div>
      case "Presentations":
        return <div className="p-2 bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center"><MonitorPlay className="w-4 h-4" /></div>
      case "Doc Analyzer":
        return <div className="p-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center"><FileText className="w-4 h-4" /></div>
      case "AI Notes":
        return <div className="p-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center"><StickyNote className="w-4 h-4" /></div>
      default:
        return <div className="p-2 bg-neutral-800 text-neutral-400 flex items-center justify-center"><Sparkles className="w-4 h-4" /></div>
    }
  }

  return (
    <div className="flex flex-col min-h-full bg-transparent text-white font-sans relative">
      <main className="flex-1 p-6 md:p-8 pb-20 relative z-10">
        <div className="max-w-5xl mx-auto space-y-6">
          
          {/* Header & Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
                  <History className="h-7 w-7 text-indigo-400" /> Activity & Search History
                </h1>
                {isCloudSynced === true && (
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono rounded-none">
                    <Cloud className="w-3 h-3" /> Cloud Synced
                  </span>
                )}
                {isCloudSynced === false && (
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono rounded-none" title="Cloud API unavailable: using local & cached backup">
                    <HardDrive className="w-3 h-3" /> Offline / Backup Active
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                <Input 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter searches, tools, or queries..."
                  className="w-full bg-neutral-900/60 border-neutral-800 text-white pl-10 pr-4 rounded-none focus-visible:ring-indigo-500/50 backdrop-blur-md text-xs h-10"
                />
              </div>

              {items.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAll}
                  disabled={isClearing}
                  className="border-neutral-800 hover:border-red-500/40 hover:bg-red-500/10 text-neutral-400 hover:text-red-400 rounded-none h-10 px-3 text-xs shrink-0"
                  title="Clear all recorded history"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Clear History
                </Button>
              )}
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-neutral-800/80 custom-scrollbar">
            {categories.map((cat) => {
              const count = cat === "All" ? items.length : items.filter(i => i.category === cat).length
              const isActive = selectedCategory === cat
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-none border transition-all flex items-center gap-2 whitespace-nowrap ${
                    isActive 
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' 
                      : 'bg-neutral-900/50 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
                  }`}
                >
                  <span>{cat}</span>
                  <span className={`px-1.5 py-0.5 text-[10px] font-mono ${isActive ? 'bg-indigo-700 text-white' : 'bg-neutral-800 text-neutral-400'}`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Main Unified History Area */}
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-none p-6 backdrop-blur-md shadow-xl min-h-[450px] flex flex-col">
            
            {isLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-neutral-500 py-16">
                <Loader2 className="h-8 w-8 animate-spin mb-3 text-indigo-400" />
                <span className="text-xs">Loading complete activity and search history...</span>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                <div className="h-16 w-16 rounded-none bg-neutral-800/80 border border-neutral-700 flex items-center justify-center mb-4">
                  <FolderOpen className="h-8 w-8 text-neutral-500" />
                </div>
                <h2 className="text-lg font-bold text-white mb-1">No activity records found</h2>
                <p className="text-neutral-400 text-xs max-w-sm mb-4">
                  {searchQuery 
                    ? `No items matched "${searchQuery}".` 
                    : `No activity recorded yet under ${selectedCategory}. Try searching in the top bar or running a voice/chat query.`}
                </p>
                {searchQuery && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setSearchQuery("")}
                    className="border-neutral-700 rounded-none text-xs"
                  >
                    Clear Filter
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-neutral-400 font-mono mb-2 px-1">
                  <span>Showing {filteredItems.length} records</span>
                  <span>Click item to view details or launch tool</span>
                </div>

                <div className="grid gap-3">
                  {filteredItems.map((item) => {
                    const isExpanded = expandedId === item.id;

                    return (
                      <div 
                        key={item.id}
                        onClick={() => setExpandedId(isExpanded ? null : item.id)}
                        className={`group flex flex-col p-4 bg-neutral-950/40 hover:bg-neutral-900/80 border transition-all cursor-pointer rounded-none ${
                          isExpanded 
                            ? 'border-indigo-500/60 bg-neutral-900/90 shadow-lg' 
                            : 'border-neutral-800/80 hover:border-neutral-700'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3.5 overflow-hidden">
                            {getItemCategoryBadge(item.category)}
                            <div className="overflow-hidden">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-sm text-white truncate">{item.title}</h4>
                                <span className="text-[10px] px-2 py-0.5 border border-neutral-800 bg-neutral-900 text-neutral-400 font-mono">
                                  {item.category}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-neutral-500" />
                                  {formatRelativeTime(item.created_at)}
                                </span>
                                {item.detail && (
                                  <>
                                    <span>•</span>
                                    <span className="text-neutral-400 truncate">{item.detail}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 justify-end">
                            {item.link && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  router.push(item.link!)
                                }}
                                className="opacity-0 group-hover:opacity-100 px-2.5 py-1 text-[11px] font-medium bg-neutral-800 hover:bg-indigo-600 text-neutral-300 hover:text-white border border-neutral-700 transition-all flex items-center gap-1"
                                title="Open in tool"
                              >
                                Open <ArrowUpRight className="w-3 h-3" />
                              </button>
                            )}

                            <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                              {isExpanded ? "Hide" : "Details"}
                              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                            </span>
                          </div>
                        </div>

                        {/* Expanded Content View */}
                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-neutral-800 text-xs space-y-3 cursor-default" onClick={(e) => e.stopPropagation()}>
                            
                            {/* Search or Voice Query */}
                            {(item.category === "Searches" || item.category === "Voice Assistant") && (
                              <div className="p-3 bg-neutral-900/90 border border-neutral-800 space-y-2">
                                <div className="text-neutral-300">
                                  <strong className="text-indigo-400">Recorded Query:</strong> {item.title}
                                </div>
                                {item.detail && (
                                  <div className="text-neutral-400 font-mono text-[11px]">
                                    {item.detail}
                                  </div>
                                )}
                                <div className="pt-2 flex gap-2">
                                  <button
                                    onClick={() => router.push(`/chat/ai-chat`)}
                                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-none text-xs font-medium"
                                  >
                                    Ask in AI Chat
                                  </button>
                                  <button
                                    onClick={() => router.push(`/chat/voice`)}
                                    className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-none text-xs font-medium"
                                  >
                                    Try in Voice Assistant
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Chat Messages */}
                            {item.raw?.messages && Array.isArray(item.raw.messages) && (
                              <div className="max-h-[350px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                                {item.raw.messages.length === 0 ? (
                                  <p className="text-neutral-500 italic">No message details stored for this session.</p>
                                ) : (
                                  item.raw.messages.map((msg: any, idx: number) => {
                                    if (msg.content?.includes("INSTRUCTION:") || msg.content?.includes("DOCUMENT CONTEXT:")) return null
                                    return (
                                      <div key={idx} className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                                        <div className={`w-6 h-6 rounded-none flex items-center justify-center shrink-0 text-[10px] font-bold ${msg.role === "user" ? "bg-indigo-600 text-white" : "bg-neutral-800 text-neutral-300"}`}>
                                          {msg.role === "user" ? "U" : <Bot className="w-3.5 h-3.5" />}
                                        </div>
                                        <div className={`p-3 rounded-none max-w-[85%] whitespace-pre-wrap ${msg.role === "user" ? "bg-indigo-950/40 border border-indigo-500/30 text-white" : "bg-neutral-900 border border-neutral-800 text-neutral-300"}`}>
                                          {msg.content}
                                        </div>
                                      </div>
                                    )
                                  })
                                )}
                              </div>
                            )}

                            {/* Cloudinary Document URL */}
                            {item.raw?.cloudinary_url && (
                              <div className="p-3 bg-neutral-900 border border-neutral-800 flex items-center justify-between">
                                <span className="text-neutral-300 truncate max-w-md">Cloudinary Asset: {item.raw.cloudinary_url}</span>
                                <a 
                                  href={item.raw.cloudinary_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center gap-1.5 transition-colors"
                                >
                                  Open Link <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            )}

                            {/* HTML Content for Notes */}
                            {item.raw?.content && (
                              <div className="p-4 bg-neutral-900 border border-neutral-800 max-h-[300px] overflow-y-auto prose prose-invert max-w-none text-xs leading-relaxed" dangerouslySetInnerHTML={{ __html: item.raw.content }} />
                            )}

                          </div>
                        )}

                      </div>
                    )
                  })}
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  )
}

export default function HistoryPage() {
  return (
    <Suspense fallback={
      <div className="p-12 text-center text-neutral-500 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading History...
      </div>
    }>
      <HistoryContent />
    </Suspense>
  )
}
