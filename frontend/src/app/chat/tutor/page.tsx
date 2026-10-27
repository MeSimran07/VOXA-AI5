"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { GraduationCap, BookOpen, Clock, Target, PlayCircle, Sparkles, Send, Brain, ChevronRight, Calculator, Globe, Code, FlaskConical, Loader2, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { api } from "@/lib/api"
import { recordUserActivity } from "@/lib/activityLogger"
import { toast } from "sonner"

// Data Structure for Subjects and Topics
const SUBJECTS = [
  {
    id: "computer_science",
    title: "Computer Science",
    icon: Code,
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
    borderColor: "border-blue-500/30",
    topics: ["Python", "JavaScript", "CSS", "C++", "Java", "Data Structures"]
  },
  {
    id: "math",
    title: "Mathematics",
    icon: Calculator,
    color: "text-rose-400",
    bgColor: "bg-rose-500/20",
    borderColor: "border-rose-500/30",
    topics: ["Algebra", "Calculus", "Geometry", "Statistics", "Trigonometry"]
  },
  {
    id: "science",
    title: "Science",
    icon: FlaskConical,
    color: "text-green-400",
    bgColor: "bg-green-500/20",
    borderColor: "border-green-500/30",
    topics: ["Physics", "Chemistry", "Biology", "Astronomy"]
  },
  {
    id: "political_science",
    title: "Political Science",
    icon: Globe,
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
    borderColor: "border-purple-500/30",
    topics: ["International Relations", "Public Policy", "Political Theory", "Comparative Politics"]
  }
];

export default function AITutorPage() {
  const [selectedSubject, setSelectedSubject] = useState<typeof SUBJECTS[0] | null>(null)
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  
  // Chat State
  const [chatId, setChatId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Array<{role: "user" | "assistant", content: string}>>([])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isTyping])

  const startTutorSession = async (topic: string) => {
    if (!selectedSubject) return;
    
    setSelectedTopic(topic);
    setIsInitializing(true);
    setMessages([]);
    
    try {
      // 1. Initialize Chat Session
      const chatRes = await api.post<{id: string}>("/chats", { 
        title: `Tutor: ${selectedSubject.title} - ${topic}` 
      });
      const newChatId = chatRes.id;
      setChatId(newChatId);

      recordUserActivity({
        action: "ai_tutor",
        query: topic,
        title: `Tutor: ${selectedSubject.title} - ${topic}`,
        category: "AI Tutor",
        detail: `Subject: ${selectedSubject.title} | Topic: ${topic}`
      });

      // 2. Send Hidden System Context to AI
      const systemMessage = `INSTRUCTION: You are an expert AI Tutor. The user wants to learn about "${topic}" under the subject of "${selectedSubject.title}". 
Act as a patient, encouraging, and interactive teacher. 
Start the session by giving a brief, easy-to-understand explanation of the very basics of the topic, and then immediately ask one simple, interactive multiple-choice or short-answer question to test their understanding. Wait for their answer before proceeding.`;
      
      const aiRes = await api.post<{content: string}>(`/chats/${newChatId}/messages`, { message: systemMessage });
      
      setMessages([{ role: "assistant", content: aiRes.content }]);
      toast.success("Tutor session started!");
    } catch (error) {
      toast.error("Failed to start tutor session. Please try again.");
      console.error(error);
      setSelectedTopic(null);
    } finally {
      setIsInitializing(false);
    }
  }

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || !chatId || isTyping) return;

    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setIsTyping(true);

    try {
      const res = await api.post<{content: string}>(`/chats/${chatId}/messages`, { message: userMsg });
      setMessages(prev => [...prev, { role: "assistant", content: res.content }]);
    } catch (error) {
      toast.error("Failed to send message");
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I encountered an error checking your answer." }]);
    } finally {
      setIsTyping(false);
    }
  }

  const resetSession = () => {
    setSelectedTopic(null);
    setChatId(null);
    setMessages([]);
  }

  return (
    <div className="relative w-full min-h-[calc(100vh-64px)] overflow-x-hidden bg-transparent text-white flex items-center justify-center font-sans">
      <main className="flex-1 p-8 pb-20 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
                  AI Tutor
                </h1>
                <p className="text-neutral-400 text-sm mt-1">Personalized, interactive learning sessions tailored to your pace.</p>
              </div>
            </div>
            {selectedTopic && (
              <Button onClick={resetSession} variant="outline" className="border-neutral-700 hover:bg-neutral-800 text-white rounded-none">
                Change Topic
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Left Sidebar: Subjects */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-neutral-900/60 border border-neutral-800 rounded-none p-5 backdrop-blur-md">
                <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-4">Subjects</h3>
                <div className="space-y-3">
                  {SUBJECTS.map((subject) => (
                    <div 
                      key={subject.id} 
                      onClick={() => !selectedTopic && setSelectedSubject(subject)}
                      className={`p-3 rounded-none border transition-all ${!selectedTopic ? 'cursor-pointer hover:bg-neutral-800/80' : 'opacity-50 pointer-events-none'} flex items-center justify-between ${selectedSubject?.id === subject.id ? `${subject.bgColor} ${subject.borderColor} shadow-[0_0_15px_rgba(255,255,255,0.05)]` : 'bg-neutral-800/40 border-transparent'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-none ${selectedSubject?.id === subject.id ? subject.bgColor : 'bg-neutral-700'} ${subject.color}`}>
                          <subject.icon className="h-4 w-4" />
                        </div>
                        <p className={`text-sm font-medium ${selectedSubject?.id === subject.id ? 'text-white' : 'text-neutral-200'}`}>{subject.title}</p>
                      </div>
                      {selectedSubject?.id === subject.id && !selectedTopic && <ChevronRight className="h-4 w-4 text-neutral-400" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Main Area: Topics or Chat */}
            <div className="lg:col-span-3 flex flex-col min-h-[650px] bg-neutral-900/60 border border-neutral-800 rounded-none overflow-hidden backdrop-blur-md shadow-xl relative">
              
              {!selectedSubject ? (
                // State 1: Nothing Selected
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  <div className="h-24 w-24 rounded-none bg-neutral-800 border border-neutral-700 flex items-center justify-center mb-6 shadow-lg">
                    <GraduationCap className="h-12 w-12 text-neutral-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Welcome to AI Tutor</h2>
                  <p className="text-neutral-400 max-w-md">Select a subject from the left menu to explore topics and begin your interactive learning journey.</p>
                </div>
              ) : !selectedTopic ? (
                // State 2: Subject Selected, Pick a Topic
                <div className="flex-1 p-8">
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-2">
                      <selectedSubject.icon className={`h-8 w-8 ${selectedSubject.color}`} />
                      {selectedSubject.title} Topics
                    </h2>
                    <p className="text-neutral-400">Choose a topic below to start learning from the basics.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedSubject.topics.map((topic, idx) => (
                      <div 
                        key={idx}
                        onClick={() => startTutorSession(topic)}
                        className="group relative bg-neutral-800/50 border border-neutral-700 hover:border-green-500/50 rounded-none p-5 cursor-pointer transition-all overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10 flex items-center justify-between">
                          <span className="font-semibold text-lg text-neutral-200 group-hover:text-green-400 transition-colors">{topic}</span>
                          <PlayCircle className="h-5 w-5 text-neutral-500 group-hover:text-green-400 transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                // State 3: Active Tutor Session
                <>
                  {/* Session Header */}
                  <div className="p-5 border-b border-neutral-800 bg-neutral-900/50 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Brain className="h-5 w-5 text-green-400" />
                        Learning: {selectedSubject.title}
                      </h2>
                      <p className="text-xs text-neutral-400 mt-1">Topic: {selectedTopic}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isInitializing && <span className="text-xs text-green-400 flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin"/> Preparing Lesson...</span>}
                      <div className="flex items-center gap-2 text-xs text-neutral-400 bg-neutral-800/80 px-3 py-1.5 rounded-none">
                        <Clock className="h-3.5 w-3.5" /> Session Active
                      </div>
                    </div>
                  </div>

                  {/* Tutor Chat Area */}
                  <div className="flex-1 p-6 overflow-y-auto space-y-6" ref={scrollRef}>
                    {messages.map((msg, i) => (
                      <div key={i} className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                        <div className={`h-8 w-8 rounded-none flex items-center justify-center shrink-0 ${msg.role === "user" ? "bg-green-600" : selectedSubject.bgColor}`}>
                          {msg.role === "user" ? <span className="text-xs font-bold">U</span> : <GraduationCap className={`h-4 w-4 ${selectedSubject.color}`} />}
                        </div>
                        <div className={`border rounded-none p-5 max-w-[85%] shadow-md whitespace-pre-wrap ${msg.role === "user" ? "bg-green-600/20 border-green-500/30 rounded-tr-none text-neutral-100" : "bg-neutral-800/80 border-neutral-700 rounded-tl-none text-neutral-200"}`}>
                          <p className="text-sm">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                    
                    {isTyping && (
                      <div className="flex gap-4">
                        <div className={`h-8 w-8 rounded-none ${selectedSubject.bgColor} flex items-center justify-center shrink-0`}>
                          <GraduationCap className={`h-4 w-4 ${selectedSubject.color}`} />
                        </div>
                        <div className="bg-neutral-800/80 border border-neutral-700 rounded-none rounded-tl-none p-5 w-20 flex items-center justify-center shadow-md">
                          <Loader2 className="h-4 w-4 text-neutral-400 animate-spin" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input Area */}
                  <form onSubmit={handleSendMessage} className="p-4 border-t border-neutral-800 bg-neutral-900/80">
                    <div className="relative">
                      <Input 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={isInitializing || isTyping}
                        placeholder={isInitializing ? "Tutor is preparing..." : "Type your answer or ask for a hint..."}
                        className="w-full bg-neutral-950 border-neutral-800 text-white h-12 pl-4 pr-12 rounded-none focus-visible:ring-green-500/50 font-mono text-sm disabled:opacity-50"
                      />
                      <Button 
                        type="submit" 
                        disabled={isInitializing || isTyping || !input.trim()}
                        size="icon" 
                        className="absolute right-1.5 top-1.5 h-9 w-9 bg-green-600 hover:bg-green-500 disabled:bg-neutral-700 text-white rounded-none transition-colors"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                </>
              )}
            </div>
            
          </div>
        </div>
      </main>
    </div>
  )
}
