"use client"

import { useState, useRef, useEffect } from "react"
import { Bell, Search, Sun, Moon, Paperclip, Mic, MicOff, Send, Loader2, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ChatMessage } from "@/components/chat-message"

import { api } from "@/lib/api"
import { recordUserActivity } from "@/lib/activityLogger"


// Types for Speech Recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

import { useSearchParams } from "next/navigation"

export default function ChatPage() {
  const [messages, setMessages] = useState<{role: string, content: string, mediaUrl?: string}[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [chatId, setChatId] = useState<string | null>(null)
  
  // Voice State
  const [isListening, setIsListening] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<any>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  
  const searchParams = useSearchParams()

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        
        recognitionRef.current.onresult = (event: any) => {
          let currentTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              setInputValue(prev => prev + event.results[i][0].transcript + " ");
            } else {
              currentTranscript += event.results[i][0].transcript;
            }
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }
    
    // Initial welcome message
    const isInterview = searchParams.get('interview') === 'true'
    const role = searchParams.get('role') || 'Candidate'
    
    if (isInterview) {
      setMessages([
        {
          role: "assistant",
          content: `Hello! I am the AI Recruiter. Today we will be conducting a mock interview for the ${role} position. Are you ready to begin?`
        }
      ])
      // Automatically send a system message to the backend to set the context on the first user message
    } else {
      setMessages([
        {
          role: "assistant",
          content: "Hello! Voxa AI here, how can I help you today?"
        }
      ])
    }
  }, [searchParams])

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages])

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setInputValue("");
      recognitionRef.current?.start();
      setIsListening(true);
    }
  }

  const speak = (text: string) => {
    if (!voiceEnabled || !window.speechSynthesis) return;
    
    window.speechSynthesis.cancel(); // Stop any current speech
    const utterance = new SpeechSynthesisUtterance(text);
    // Try to find a good English voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.name.includes("Google") || v.name.includes("Natural"));
    if (preferredVoice) utterance.voice = preferredVoice;
    
    window.speechSynthesis.speak(utterance);
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append("file", file)

    try {
      const token = localStorage.getItem("token")
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/api/media/upload`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      })

      if (!response.ok) throw new Error("Upload failed")

      const data = await response.json()
      setMessages(prev => [...prev, { role: "user", content: "Uploaded media:", mediaUrl: data.url }])
      
    } catch (error) {
      console.error(error)
      alert("Failed to upload image")
    } finally {
      setIsUploading(false)
    }
  }

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    const userMessage = inputValue.trim();
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setInputValue("");
    setIsLoading(true);

    recordUserActivity({
      action: "chat_query",
      query: userMessage,
      title: `Chat: "${userMessage.substring(0, 35)}"`,
      category: "AI Chat",
      detail: `Prompt: "${userMessage}"`
    });

    try {
      let currentChatId = chatId;
      if (!currentChatId) {
         // Create chat
         const chatRes = await api.post<{ id: string }>('/chats', { title: userMessage.substring(0, 30) || "New Chat" });
         currentChatId = chatRes.id;
         setChatId(currentChatId);
      }
      
      const msgRes = await api.post<{ content: string }>(`/chats/${currentChatId}/messages`, { message: userMessage });
      
      setMessages(prev => [...prev, { role: "assistant", content: msgRes.content }]);
      
      // Speak the response
      speak(msgRes.content);
      
    } catch (error: any) {
      console.error(error);
      setMessages(prev => [...prev, { role: "assistant", content: error.message || "Sorry, I encountered an error connecting to the server." }]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full bg-transparent text-white relative font-sans">
      {/* Chat Area */}
      <div 
        className="flex-1 p-4 md:p-8 overflow-y-auto"
        ref={scrollRef}
      >
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
          
          {messages.map((msg, idx) => (
            <ChatMessage 
              key={idx} 
              role={msg.role} 
              content={msg.content} 
              mediaUrl={msg.mediaUrl}
              onRegenerate={msg.role === 'assistant' ? () => {} : undefined}
              onEdit={msg.role === 'user' ? (newContent) => setInputValue(newContent) : undefined}
            />
          ))}

          {isLoading && (
            <div className="flex flex-col gap-2 items-start">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-7 w-7 rounded-xl bg-indigo-600/50 flex items-center justify-center animate-pulse">
                  <Mic className="h-3.5 w-3.5 text-white" />
                </div>
              </div>
              <div className="bg-neutral-800 rounded-2xl rounded-tl-sm px-6 py-5 border border-neutral-700/50 flex gap-2">
                <div className="h-2 w-2 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="h-2 w-2 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="h-2 w-2 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 bg-black/20 backdrop-blur-xl border-t border-white/10">
        <div className="max-w-4xl mx-auto relative flex items-center">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileUpload}
            accept="image/*,video/*"
          />
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute left-2 text-neutral-400 hover:text-white rounded-full transition-colors z-10"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Paperclip className="h-5 w-5" />}
          </Button>
          
          <Input 
            placeholder={isListening ? "Listening..." : "Ask Voxa AI anything..."} 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isLoading}
            className={`w-full bg-neutral-800/80 border-neutral-700 h-14 pl-12 pr-24 rounded-2xl text-white placeholder:text-neutral-500 focus-visible:ring-1 focus-visible:ring-indigo-500 shadow-sm transition-all ${isListening ? 'ring-1 ring-red-500 bg-red-500/5' : ''}`}
          />
          
          <div className="absolute right-2 flex items-center gap-1 z-10">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleListening}
              className={`rounded-full transition-colors ${isListening ? 'text-red-500 bg-red-500/10 hover:bg-red-500/20 hover:text-red-400 animate-pulse' : 'text-neutral-400 hover:text-white'}`}
            >
              {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
            <Button 
              size="icon" 
              onClick={handleSend} 
              disabled={isLoading || !inputValue.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl h-10 w-10 shadow-md shadow-indigo-600/20 transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
