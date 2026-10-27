"use client"

import * as React from "react"
import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { Mic, MicOff, Send, Volume2, VolumeX, Loader2, Keyboard, Sparkles } from "lucide-react"
import { api } from "@/lib/api"
import { recordUserActivity } from "@/lib/activityLogger"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RobotAvatar } from "@/components/robot-avatar"

// Define types for Web Speech API
// @ts-ignore
const SpeechRecognition = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

export default function VoiceAssistantPage() {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [textInput, setTextInput] = useState("")
  const [transcript, setTranscript] = useState("")
  const [response, setResponse] = useState("")
  const [useVoiceOutput, setUseVoiceOutput] = useState(true)
  const [mode, setMode] = useState<"voice" | "text">("voice")
  const [isMounted, setIsMounted] = useState(false)
  
  const recognitionRef = useRef<any>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis
      
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = false
        recognitionRef.current.interimResults = true

        recognitionRef.current.onresult = (event: any) => {
          let currentTranscript = ""
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript
          }
          setTranscript(currentTranscript)
        }

        recognitionRef.current.onend = () => {
          setIsListening(false)
        }

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error", event.error)
          setIsListening(false)
        }
      }
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel()
      }
      if (recognitionRef.current && isListening) {
        recognitionRef.current.stop()
      }
    }
  }, [isListening])

  // Auto-submit when transcript finishes and is not empty
  useEffect(() => {
    if (!isListening && transcript.trim() !== "" && mode === "voice") {
      handleInteract(transcript.trim())
    }
  }, [isListening, transcript, mode])

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
    } else {
      setTranscript("")
      setResponse("")
      if (synthRef.current) synthRef.current.cancel()
      setIsSpeaking(false)
      
      try {
        recognitionRef.current?.start()
        setIsListening(true)
      } catch (e) {
        console.error(e)
      }
    }
  }

  const speak = (text: string) => {
    if (!useVoiceOutput || !synthRef.current) return
    
    synthRef.current.cancel() // Cancel any ongoing speech
    
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1.05
    utterance.pitch = 1.0
    
    // Try to find a good English voice
    const voices = synthRef.current.getVoices()
    const preferredVoice = voices.find(v => v.name.includes("Google UK English Female") || v.name.includes("Google US English") || v.name.includes("Samantha"))
    if (preferredVoice) {
      utterance.voice = preferredVoice
    }

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    synthRef.current.speak(utterance)
  }

  const searchParams = useSearchParams()
  const isInterview = searchParams.get('interview') === 'true'
  const role = searchParams.get('role') || 'Candidate'

  // If in interview mode, greet the user when mounted
  useEffect(() => {
    if (isMounted && isInterview) {
      const greeting = `Hello! I am the AI Recruiter. I see you're applying for the ${role} position. Are you ready to begin?`
      setResponse(greeting)
      
      // small delay to let voices load
      setTimeout(() => {
        speak(greeting)
      }, 500)
    }
  }, [isMounted, isInterview, role])

  const handleInteract = async (text: string) => {
    if (!text.trim()) return
    
    setIsProcessing(true)
    try {
      const payload = isInterview 
        ? { text: text.trim(), interview_mode: true, role: role }
        : { text: text.trim() };
        
      recordUserActivity({
        action: "voice_query",
        query: text.trim(),
        title: `Voice: "${text.trim().substring(0, 35)}"`,
        category: "Voice Assistant",
        detail: `Spoken query: "${text.trim()}"`
      })

      const res: any = await api.post("/voice/interact", payload)
      const aiResponse = res.response || res.data?.response || "Done."
      setResponse(aiResponse)
      speak(aiResponse)
    } catch (error: any) {
      console.error("Error interacting with voice API", error)
      if (error?.status === 401 || error?.message?.toLowerCase().includes("authenticate")) {
        setResponse("Your session has expired. Please log out and log in again.")
        speak("Your session has expired. Please log out and log in again.")
      } else {
        const errorDetail = error?.data || error?.message || "Unknown error";
        const errMsg = `Error connecting to server: ${errorDetail}`;
        setResponse(errMsg)
        speak("I'm sorry, I encountered an error connecting to the server.")
      }
    } finally {
      setIsProcessing(false)
      setTextInput("")
      if (mode === "voice") {
        setTranscript("")
      }
    }
  }

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setResponse("")
    handleInteract(textInput)
  }

  const hasRecognitionSupport = isMounted ? !!SpeechRecognition : false

  return (
    <div className="relative w-full min-h-[calc(100vh-64px)] overflow-x-hidden bg-transparent dark:text-white text-neutral-900 flex items-start justify-center pt-12 font-sans transition-colors duration-300">
      
      {/* Animated Glow Overlays for Voice Activation */}
      <div className="absolute inset-0 z-0 dark:bg-gradient-to-t dark:from-neutral-950 dark:via-neutral-950/60 bg-transparent pointer-events-none" />
      <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[100px] transition-all duration-1000 pointer-events-none ${isListening ? 'scale-125 opacity-100 animate-pulse' : isSpeaking ? 'scale-110 opacity-80' : 'scale-100 opacity-30'}`} />

      {/* Main Glassmorphism Container */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-4xl p-8 mx-auto mt-0">
        
        {/* Header */}
        <div className="flex flex-col items-center mb-12 text-center">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600">
              Voice Assistant
            </h1>
          </div>
          <p className="dark:text-indigo-200/60 text-indigo-950 font-medium tracking-wide text-sm uppercase letter-spacing-widest mt-2">
            How can I help you today?
          </p>
        </div>

        {/* Central Animated 3D Robot Avatar */}
        <div className="relative flex items-center justify-center mb-8">
          <RobotAvatar 
            isListening={isListening}
            isSpeaking={isSpeaking}
            isProcessing={isProcessing}
            onClick={toggleListening}
            disabled={!hasRecognitionSupport}
          />
        </div>

        {/* Dynamic Status / Response Area */}
        <div className="w-full max-w-2xl min-h-[120px] p-8 mb-8 rounded-3xl dark:bg-neutral-900/40 bg-white/80 backdrop-blur-md dark:border-neutral-800 border-neutral-200/80 shadow-xl flex flex-col items-center justify-center text-center transition-all duration-500">
          {!hasRecognitionSupport ? (
            <p className="text-red-500 font-medium">Voice recognition is not supported in this browser.</p>
          ) : isListening ? (
            <p className="text-2xl font-light dark:text-indigo-100 text-indigo-950">{transcript || "Listening..."}</p>
          ) : isProcessing ? (
            <p className="text-xl font-light text-indigo-600 dark:text-indigo-300 animate-pulse">Processing your request...</p>
          ) : response ? (
            <div className="w-full text-left max-h-[250px] overflow-y-auto custom-scrollbar">
              <p className="text-lg font-light leading-relaxed dark:text-neutral-200 text-neutral-800 whitespace-pre-wrap">{response}</p>
            </div>
          ) : (
            <p className="text-xl font-light dark:text-neutral-500 text-neutral-600">Tap the robot and start speaking</p>
          )}
        </div>

        {/* Controls Panel */}
        <div className="flex flex-col items-center w-full max-w-2xl gap-4 p-5 rounded-3xl dark:bg-neutral-900/30 bg-white/70 dark:border-neutral-800/60 border-neutral-200/80 backdrop-blur-md shadow-lg">
          <div className="flex items-center justify-between w-full">
            <div className="flex gap-2 p-1.5 rounded-xl dark:bg-neutral-950/60 bg-neutral-100/80">
              <button 
                onClick={() => setMode("voice")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === "voice" ? 'dark:bg-neutral-800 bg-white text-indigo-600 dark:text-indigo-300 shadow-sm' : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'}`}
              >
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4" /> Voice
                </div>
              </button>
              <button 
                onClick={() => setMode("text")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === "text" ? 'dark:bg-neutral-800 bg-white text-indigo-600 dark:text-indigo-300 shadow-sm' : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'}`}
              >
                <div className="flex items-center gap-2">
                  <Keyboard className="w-4 h-4" /> Text
                </div>
              </button>
            </div>

            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setUseVoiceOutput(!useVoiceOutput)}
              className={`dark:text-neutral-400 text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-200/50 rounded-xl ${useVoiceOutput ? 'text-indigo-600 dark:text-indigo-400' : ''}`}
            >
              {useVoiceOutput ? <Volume2 className="w-4 h-4 mr-2" /> : <VolumeX className="w-4 h-4 mr-2" />}
              {useVoiceOutput ? "Voice Enabled" : "Voice Muted"}
            </Button>
          </div>

          {mode === "text" && (
            <form onSubmit={handleTextSubmit} className="flex w-full gap-3 mt-3">
              <Input 
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Ask your assistant anything..."
                className="dark:bg-neutral-950/50 bg-white dark:border-neutral-800 border-neutral-200 dark:text-white text-neutral-900 placeholder:text-neutral-500 h-12 rounded-xl focus-visible:ring-indigo-500/50"
                disabled={isProcessing}
              />
              <Button 
                type="submit" 
                disabled={isProcessing || !textInput.trim()}
                className="h-12 px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg"
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </Button>
            </form>
          )}
        </div>

      </div>
    </div>
  )
}
