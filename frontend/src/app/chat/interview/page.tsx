"use client"

import * as React from "react"
import { useState, useEffect, useRef } from "react"
import { Users, Sparkles, Mic, Video, Settings, PlayCircle, Briefcase, Award, CheckCircle2, MicOff, Loader2, ArrowLeft, Activity, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"

// @ts-ignore
const SpeechRecognition = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

export default function InterviewPage() {
  const [view, setView] = useState<"setup" | "interview" | "results">("setup")
  const [role, setRole] = useState("Software Engineer")
  const [level, setLevel] = useState("Mid-Level")
  
  // Interview States
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [response, setResponse] = useState("")
  const [isMounted, setIsMounted] = useState(false)
  const [messages, setMessages] = useState<{role: string, content: string}[]>([])
  
  // Results States
  const [evaluation, setEvaluation] = useState<any>(null)
  
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
      if (synthRef.current) synthRef.current.cancel()
      if (recognitionRef.current && isListening) recognitionRef.current.stop()
    }
  }, [isListening])

  // Auto-submit when transcript finishes and is not empty
  useEffect(() => {
    if (!isListening && transcript.trim() !== "" && view === "interview") {
      handleInteract(transcript.trim())
    }
  }, [isListening, transcript, view])

  const speak = (text: string) => {
    if (!synthRef.current) return
    synthRef.current.cancel()
    
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1.05
    
    const voices = synthRef.current.getVoices()
    const preferredVoice = voices.find(v => v.name.includes("Google UK English Female") || v.name.includes("Google US English") || v.name.includes("Samantha"))
    if (preferredVoice) utterance.voice = preferredVoice

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    synthRef.current.speak(utterance)
  }

  const handleStartInterview = () => {
    setView("interview")
    setMessages([])
    const greeting = `Hello! I am the AI Recruiter. I see you're applying for the ${level} ${role} position. Are you ready to begin?`
    setResponse(greeting)
    setMessages([{ role: "assistant", content: greeting }])
    
    setTimeout(() => {
      speak(greeting)
    }, 500)
  }

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

  const handleInteract = async (text: string) => {
    if (!text.trim()) return
    
    setIsProcessing(true)
    setMessages(prev => [...prev, { role: "user", content: text.trim() }])
    
    try {
      const payload = { text: text.trim(), interview_mode: true, role: role }
      const res: any = await api.post("/voice/interact", payload)
      const aiResponse = res.response || res.data?.response || "Done."
      
      setResponse(aiResponse)
      setMessages(prev => [...prev, { role: "assistant", content: aiResponse }])
      speak(aiResponse)
    } catch (error: any) {
      console.error(error)
      setResponse("I'm sorry, I encountered an error connecting to the server.")
      speak("I'm sorry, I encountered an error connecting to the server.")
    } finally {
      setIsProcessing(false)
      setTranscript("")
    }
  }

  const handleEndInterview = async () => {
    if (synthRef.current) synthRef.current.cancel()
    if (recognitionRef.current) recognitionRef.current.stop()
    setIsListening(false)
    setIsSpeaking(false)
    
    setView("results")
    setIsProcessing(true)
    
    try {
      const res: any = await api.post("/voice/evaluate-interview", {
        role: role,
        level: level,
        history: messages
      })
      if (res.success) {
        setEvaluation(res.data)
      }
    } catch (error) {
      console.error("Evaluation error", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const hasRecognitionSupport = isMounted ? !!SpeechRecognition : false

  return (
    <div className="flex flex-col min-h-full bg-transparent text-white font-sans relative">
      <main className="flex-1 p-8 pb-20 relative z-10 flex flex-col items-center justify-center">
        
        {view === "setup" && (
          <div className="max-w-4xl w-full mx-auto animate-in fade-in zoom-in duration-500">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-none bg-cyan-500/20 border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.2)] mb-6">
                <Users className="h-8 w-8 text-cyan-400" />
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2 mb-4">
                AI Mock Interviews
              </h1>
              <p className="text-neutral-400 text-lg max-w-2xl mx-auto">
                Practice behavioral and technical interviews with a realistic AI recruiter. Get instant feedback on your answers, tone, and pacing.
              </p>
            </div>

            <div className="bg-neutral-900/60 border border-neutral-800 rounded-none p-8 backdrop-blur-md shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-cyan-500/10 rounded-none blur-[100px] pointer-events-none" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                <div className="space-y-8">
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-2 mb-4">
                      <Briefcase className="h-4 w-4 text-cyan-400" /> Target Role
                    </h3>
                    <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#06b6d4 transparent' }}>
                      {[
                        "Software Engineer", "Product Manager", "UX/UI Designer", 
                        "Data Scientist", "Marketing Manager", "Financial Analyst", 
                        "Sales Rep", "HR Professional", "Business Analyst", 
                        "Project Manager", "Customer Success", "Graphic Designer", 
                        "Operations Manager", "Accountant", "DevOps Engineer",
                        "QA Tester", "Data Analyst", "Consultant"
                      ].map((r, i) => (
                        <button 
                          key={i}
                          onClick={() => setRole(r)}
                          className={`p-3 rounded-none border text-sm font-medium transition-all text-left ${role === r ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.15)]' : 'bg-neutral-950/50 border-neutral-800 text-neutral-400 hover:bg-neutral-900'}`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-2 mb-4">
                      <Award className="h-4 w-4 text-cyan-400" /> Experience Level
                    </h3>
                    <div className="flex bg-neutral-950/50 border border-neutral-800 rounded-none p-1">
                      {["Junior", "Mid-Level", "Senior"].map(l => (
                        <button 
                          key={l}
                          onClick={() => setLevel(l)}
                          className={`flex-1 py-2 text-sm font-medium rounded-none transition-all ${level === l ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-white'}`}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center bg-gradient-to-br from-cyan-950/40 to-neutral-900/40 border border-cyan-500/20 rounded-none p-8 text-center shadow-inner">
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-cyan-500 rounded-none animate-ping opacity-20 blur-xl"></div>
                    <div className="h-32 w-32 rounded-none bg-cyan-500/10 border-2 border-cyan-500/50 flex items-center justify-center backdrop-blur-sm relative z-10 shadow-[0_0_40px_rgba(6,182,212,0.3)]">
                      <Mic className="h-12 w-12 text-cyan-400" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Ready to begin?</h3>
                  <p className="text-neutral-400 text-sm mb-8">The AI Recruiter is prepared to interview you for the <strong className="text-cyan-300">{role}</strong> position.</p>
                  <Button 
                    onClick={handleStartInterview}
                    className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-none h-14 text-lg font-bold shadow-[0_0_30px_rgba(6,182,212,0.3)] transition-all transform hover:scale-[1.02] active:scale-95"
                  >
                    <PlayCircle className="h-6 w-6 mr-2" /> Start Mock Interview
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === "interview" && (
          <div className="w-full max-w-4xl flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500">
            <div className="w-full flex justify-between items-center mb-12">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/20 rounded-none border border-cyan-500/30 text-cyan-400 animate-pulse">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Interview in Progress</h2>
                  <p className="text-sm text-cyan-400">{level} {role}</p>
                </div>
              </div>
              <Button onClick={handleEndInterview} variant="destructive" className="rounded-none shadow-lg shadow-red-900/20 transition-all hover:scale-105">
                End Interview
              </Button>
            </div>

            <div className="relative flex items-center justify-center mb-16 mt-8">
              <div className={`absolute w-64 h-64 border-[1px] border-cyan-500/30 rounded-none transition-all duration-700 pointer-events-none ${isListening || isProcessing || isSpeaking ? 'animate-[spin_4s_linear_infinite]' : ''}`} />
              <div className={`absolute w-72 h-72 border-[1px] border-blue-400/20 rounded-none transition-all duration-1000 pointer-events-none ${isListening || isProcessing || isSpeaking ? 'animate-[spin_6s_linear_infinite_reverse]' : ''}`} />
              <div className={`absolute w-96 h-96 bg-cyan-500/10 rounded-none blur-[80px] pointer-events-none transition-all duration-1000 ${isListening ? 'scale-125 opacity-100 animate-pulse' : isSpeaking ? 'scale-110 opacity-80' : 'scale-100 opacity-30'}`} />
              
              <button 
                onClick={toggleListening}
                disabled={isProcessing || !hasRecognitionSupport}
                className={`
                  relative z-10 flex items-center justify-center w-40 h-40 rounded-none 
                  backdrop-blur-xl border border-white/10 shadow-[0_0_50px_rgba(6,182,212,0.2)]
                  transition-all duration-500 hover:scale-105 active:scale-95
                  ${isListening ? 'bg-red-500/20 border-red-500/50 shadow-[0_0_60px_rgba(239,68,68,0.3)]' : 'bg-neutral-900/50 hover:bg-neutral-800/60'}
                  ${!hasRecognitionSupport && 'opacity-50 cursor-not-allowed'}
                `}
              >
                {isProcessing ? (
                  <Loader2 className="w-16 h-16 text-cyan-400 animate-spin" />
                ) : isListening ? (
                  <MicOff className="w-16 h-16 text-red-400 animate-pulse" />
                ) : (
                  <Mic className="w-16 h-16 text-cyan-400" />
                )}
              </button>
            </div>

            <div className="w-full max-w-2xl text-center space-y-6">
              {(transcript || isListening) && (
                <div className="p-6 bg-neutral-900/50 border border-neutral-800 rounded-none shadow-xl backdrop-blur-sm min-h-[100px] flex items-center justify-center">
                  <p className="text-xl text-neutral-300 font-medium">
                    {transcript || <span className="text-neutral-500 italic flex items-center justify-center gap-2">Listening <span className="flex gap-1"><span className="w-1.5 h-1.5 bg-neutral-500 rounded-none animate-bounce" style={{animationDelay: '0ms'}}></span><span className="w-1.5 h-1.5 bg-neutral-500 rounded-none animate-bounce" style={{animationDelay: '150ms'}}></span><span className="w-1.5 h-1.5 bg-neutral-500 rounded-none animate-bounce" style={{animationDelay: '300ms'}}></span></span></span>}
                  </p>
                </div>
              )}
              
              {response && !isListening && !isProcessing && (
                <div className="p-6 bg-cyan-950/20 border border-cyan-500/20 rounded-none shadow-xl backdrop-blur-sm relative">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#09090b] px-4 flex items-center gap-2">
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Recruiter</span>
                  </div>
                  <p className="text-lg text-cyan-100 mt-2">{response}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {view === "results" && (
          <div className="max-w-5xl w-full mx-auto animate-in slide-in-from-bottom-8 duration-500">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-extrabold tracking-tight text-white mb-4">Interview Results</h1>
              <p className="text-neutral-400 text-lg">Here is your comprehensive evaluation for the {level} {role} position.</p>
            </div>

            {isProcessing && !evaluation ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-12 h-12 text-cyan-500 animate-spin mb-6" />
                <h3 className="text-xl font-bold text-white mb-2">Analyzing your performance...</h3>
                <p className="text-neutral-500">The AI Recruiter is grading your answers.</p>
              </div>
            ) : evaluation ? (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Scores */}
                  <div className="bg-neutral-900/60 border border-neutral-800 rounded-none p-8 backdrop-blur-md flex flex-col items-center justify-center text-center">
                    <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-6">Technical Score</h3>
                    <div className="relative">
                      <svg className="w-32 h-32 transform -rotate-90">
                        <circle cx="64" cy="64" r="56" fill="none" stroke="currentColor" strokeWidth="12" className="text-neutral-800" />
                        <circle cx="64" cy="64" r="56" fill="none" stroke="currentColor" strokeWidth="12" strokeDasharray="351.86" strokeDashoffset={351.86 - (351.86 * (evaluation.technical_score || 0)) / 10} className="text-cyan-500 transition-all duration-1000 ease-out" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <span className="text-4xl font-black text-white">{evaluation.technical_score || '-'}</span>
                        <span className="text-xs font-medium text-neutral-500">/ 10</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-neutral-900/60 border border-neutral-800 rounded-none p-8 backdrop-blur-md flex flex-col items-center justify-center text-center">
                    <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-6">Communication</h3>
                    <div className="relative">
                      <svg className="w-32 h-32 transform -rotate-90">
                        <circle cx="64" cy="64" r="56" fill="none" stroke="currentColor" strokeWidth="12" className="text-neutral-800" />
                        <circle cx="64" cy="64" r="56" fill="none" stroke="currentColor" strokeWidth="12" strokeDasharray="351.86" strokeDashoffset={351.86 - (351.86 * (evaluation.communication_score || 0)) / 10} className="text-blue-500 transition-all duration-1000 ease-out" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <span className="text-4xl font-black text-white">{evaluation.communication_score || '-'}</span>
                        <span className="text-xs font-medium text-neutral-500">/ 10</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feedback */}
                <div className="bg-neutral-900/60 border border-neutral-800 rounded-none p-8 backdrop-blur-md">
                  <h3 className="text-xl font-bold text-white mb-4">Overall Feedback</h3>
                  <p className="text-neutral-300 leading-relaxed mb-8">{evaluation.feedback_summary}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-sm font-bold text-green-400 uppercase tracking-wider flex items-center gap-2 mb-4">
                        <CheckCircle2 className="w-4 h-4" /> Strengths
                      </h4>
                      <ul className="space-y-3">
                        {(evaluation.strengths || []).map((str: string, i: number) => (
                          <li key={i} className="flex gap-3 text-neutral-300">
                            <span className="text-green-500 mt-1">•</span>
                            <span>{str}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-orange-400 uppercase tracking-wider flex items-center gap-2 mb-4">
                        <Star className="w-4 h-4" /> Areas to Improve
                      </h4>
                      <ul className="space-y-3">
                        {(evaluation.improvements || []).map((imp: string, i: number) => (
                          <li key={i} className="flex gap-3 text-neutral-300">
                            <span className="text-orange-500 mt-1">•</span>
                            <span>{imp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center mt-8">
                  <Button onClick={() => { setView("setup"); setEvaluation(null); }} className="bg-neutral-800 hover:bg-neutral-700 text-white rounded-none h-14 px-8 text-lg font-bold">
                    <ArrowLeft className="h-5 w-5 mr-2" /> Try Another Interview
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-neutral-400">
                Failed to load evaluation.
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  )
}
