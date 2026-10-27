"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FileText, UploadCloud, File, Send, FilePlus, Bot, Sparkles, Loader2, BrainCircuit, CheckCircle2, XCircle, Infinity as InfinityIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { api } from "@/lib/api"
import { toast } from "sonner"

export default function DocAnalyzerPage() {
  const [documents, setDocuments] = useState<Array<{name: string, size: string, date: string, id?: string, chat_id?: string}>>([])
  
  // Chat State
  const [chatId, setChatId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Array<{role: "user" | "assistant", content: string}>>([])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Quiz State
  const [quiz, setQuiz] = useState<Array<{question: string, options: string[], answer: string}> | null>(null)
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false)
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({})
  const [quizScore, setQuizScore] = useState<number | null>(null)

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const res = await api.get<any[]>("/documents");
        const data = Array.isArray(res) ? res : (res as any)?.data;
        if (data && Array.isArray(data)) {
          const sorted = [...data]
            .filter((doc: any) => doc && (doc.filename || doc.name))
            .sort((a, b) => {
              const aIsDoc = Boolean(a.chat_id || (a.filename && /\.(pdf|docx|txt)$/i.test(a.filename)));
              const bIsDoc = Boolean(b.chat_id || (b.filename && /\.(pdf|docx|txt)$/i.test(b.filename)));
              if (aIsDoc && !bIsDoc) return -1;
              if (!aIsDoc && bIsDoc) return 1;
              return 0;
            });

          const formatted = sorted.map((doc: any) => ({
            name: doc.filename || doc.name || "Document",
            size: doc.file_size ? `${(doc.file_size / 1024).toFixed(0)} KB` : 'Unknown',
            date: doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'Just now',
            chat_id: doc.chat_id,
            id: doc.id,
            extracted_text: doc.extracted_text
          }));
          setDocuments(formatted);
        }
      } catch (e) {
        console.error("Failed to load documents", e);
      }
    };

    fetchDocuments();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isTyping])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // UI Updates
    const sizeInKB = file.size / 1024;
    const formattedSize = sizeInKB > 1024 ? `${(sizeInKB / 1024).toFixed(1)} MB` : `${sizeInKB.toFixed(0)} KB`;
    setDocuments(prev => [{ name: file.name, size: formattedSize, date: "Just now" }, ...prev]);
    setIsUploading(true);
    setChatId(null);
    setMessages([]);
    setQuiz(null);
    setUserAnswers({});
    setQuizScore(null);
    
    toast.info("Extracting document text...");

    try {
      // 1. Extract Text via Next.js API Route (Base64 to avoid Next.js FormData binary corruption)
      const fileData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const parseRes = await fetch('/api/docs/analyze', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, fileData }) 
      });
      const parseJson = await parseRes.json();
      
      if (!parseRes.ok || !parseJson.success) {
        throw new Error(parseJson.error || "Failed to parse document");
      }
      
      const extractedText = parseJson.text;
      
      // 2. Initialize Chat Session with Backend
      toast.info("Initializing AI context...");
      const chatRes = await api.post<any>("/chats", { title: `Doc: ${file.name}` });
      const newChatId = chatRes.id || chatRes.data?.id;
      setChatId(newChatId);

      // 3. Send Context to AI
      setIsTyping(true);
      const systemMessage = `DOCUMENT CONTEXT:\n\n${extractedText}\n\nINSTRUCTIONS: You are Voxa AI Doc Analyzer. I have just uploaded the above document. Acknowledge that you have read it in 1 or 2 short sentences and are ready to answer questions about it.`;
      
      const aiRes = await api.post<any>(`/chats/${newChatId}/messages`, { 
        message: systemMessage,
        is_doc_chat: true,
        provider: "ollama"
      });
      const assistantContent = aiRes?.content || aiRes?.data?.content || "Document analyzed and ready! Ask me anything about it.";
      
      setMessages([{ role: "assistant", content: assistantContent }]);
      toast.success("Document analyzed and ready!");

      try {
        const saveRes = await api.post<any>("/documents", {
          filename: file.name,
          file_size: file.size,
          chat_id: newChatId,
          extracted_text: extractedText
        });
        const savedDoc = (saveRes && saveRes.data) ? saveRes.data : saveRes;
        if (savedDoc) {
          setDocuments(prev => {
            const newDocs = [...prev];
            if (newDocs.length > 0 && newDocs[0]?.name === file.name) {
              newDocs[0] = {
                name: savedDoc.filename || file.name,
                size: savedDoc.file_size ? `${(savedDoc.file_size / 1024).toFixed(0)} KB` : formattedSize,
                date: "Just now",
                chat_id: savedDoc.chat_id || newChatId,
                id: savedDoc.id
              };
            }
            return newDocs;
          });
        }
      } catch (err) {
        console.error("Failed to save document record", err);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to process document");
      setDocuments(prev => prev.filter(d => d.name !== file.name)); // Revert
    } finally {
      setIsUploading(false);
      setIsTyping(false);
    }
  }

  const handleLoadDocumentChat = async (doc: any) => {
    if (isTyping || isUploading) return;
    
    // If doc already has a chat session, load its messages
    if (doc.chat_id) {
      setChatId(doc.chat_id);
      setQuiz(null);
      setUserAnswers({});
      setQuizScore(null);
      setMessages([]);
      setIsTyping(true);
      
      try {
        const chatRes = await api.get<any>(`/chats/${doc.chat_id}`);
        const chatData = (chatRes && chatRes.data) ? chatRes.data : chatRes;
        if (chatData?.messages && Array.isArray(chatData.messages)) {
          const visibleMessages = chatData.messages
            .filter((m: any) => !m.content?.startsWith("DOCUMENT CONTEXT:\n\n"))
            .map((m: any) => ({
              role: m.role,
              content: m.content
            }));
          setMessages(visibleMessages.length > 0 ? visibleMessages : [{
            role: "assistant",
            content: `I'm ready to answer any questions about "${doc.name}".`
          }]);
        }
        
        setDocuments(prev => {
          const filtered = prev.filter(d => d.id !== doc.id);
          return [doc, ...filtered];
        });
      } catch (e) {
        toast.error("Failed to load chat history");
      } finally {
        setIsTyping(false);
      }
      return;
    }

    // If doc has no chat session yet, create one for it immediately
    try {
      setIsTyping(true);
      toast.info(`Starting session for ${doc.name}...`);
      const newChat = await api.post<any>("/chats", { title: `Doc: ${doc.name}` });
      const createdChatId = newChat.id || newChat.data?.id;
      if (createdChatId) {
        doc.chat_id = createdChatId;
        setChatId(createdChatId);
        setQuiz(null);
        setUserAnswers({});
        setQuizScore(null);

        // If doc has stored extracted_text, seed context to Ollama
        if (doc.extracted_text) {
          try {
            const systemMessage = `DOCUMENT CONTEXT:\n\n${doc.extracted_text}\n\nINSTRUCTIONS: You are Voxa AI Doc Analyzer. The user has loaded "${doc.name}". Acknowledge in 1 short sentence that you have read it and are ready.`;
            await api.post<any>(`/chats/${createdChatId}/messages`, { 
              message: systemMessage,
              is_doc_chat: true,
              provider: "ollama"
            });
          } catch (initErr) {
            console.warn("Context seed error:", initErr);
          }
        }

        setMessages([{
          role: "assistant",
          content: `Hello! I have loaded "${doc.name}". Ask me any questions, request a summary, or click 'Generate Quiz' above!`
        }]);
      }
    } catch (e) {
      toast.error("Could not start session for this document");
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || !chatId || isTyping) return;

    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setIsTyping(true);

    try {
      const res = await api.post<any>(`/chats/${chatId}/messages`, { 
        message: userMsg,
        is_doc_chat: true,
        provider: "ollama"
      });
      const assistantText = res?.content || res?.data?.content || "No response received.";
      setMessages(prev => [...prev, { role: "assistant", content: assistantText }]);
    } catch (error: any) {
      toast.error("Failed to send message");
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsTyping(false);
    }
  }

  const generateQuiz = async () => {
    if (!chatId || isGeneratingQuiz) return;
    
    setIsGeneratingQuiz(true);
    toast.info("Generating a quiz from your document...");
    
    try {
      const prompt = `Generate a 5-question multiple choice quiz based ENTIRELY on the document context provided earlier. 
Return ONLY valid JSON in this EXACT format. Do not use markdown blocks like \`\`\`json. Just raw text:
[
  {
    "question": "Sample Question?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "Option B"
  }
]`;

      const res = await api.post<any>(`/chats/${chatId}/messages`, { 
        message: prompt,
        is_doc_chat: true,
        provider: "ollama"
      });
      
      const rawText = res?.content || res?.data?.content || "";
      // Clean up potential markdown formatting
      let cleanJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsedQuiz = JSON.parse(cleanJson);
      
      if (Array.isArray(parsedQuiz) && parsedQuiz.length > 0) {
        setQuiz(parsedQuiz);
        setUserAnswers({});
        setQuizScore(null);
        toast.success("Quiz generated!");
      } else {
        throw new Error("Invalid quiz format");
      }
    } catch (error) {
      toast.error("Failed to generate quiz. The AI response was not formatted correctly.");
      console.error(error);
    } finally {
      setIsGeneratingQuiz(false);
    }
  }

  const submitQuiz = () => {
    if (!quiz) return;
    let score = 0;
    quiz.forEach((q, i) => {
      if (userAnswers[i] === q.answer) score++;
    });
    setQuizScore(score);
  }
  
  return (
    <div className="relative w-full min-h-[calc(100vh-64px)] overflow-x-hidden bg-transparent text-white flex items-center justify-center font-sans">
      <main className="flex-1 p-8 pb-20 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-none bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                <FileText className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-white">
                  Doc Analyzer
                </h1>
                <p className="text-neutral-400 text-sm mt-1">Upload PDFs, Word docs, or Text files and extract insights with private local LLMs.</p>
              </div>
            </div>
            
            {chatId && !quiz && (
              <Button 
                onClick={generateQuiz} 
                disabled={isGeneratingQuiz || isUploading || isTyping}
                className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-none shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all flex items-center gap-2"
              >
                {isGeneratingQuiz ? <Loader2 className="h-4 w-4 animate-spin" /> : <BrainCircuit className="h-4 w-4" />}
                Generate Quiz
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Upload & Files */}
            <div className="lg:col-span-1 space-y-6">
              {/* Upload Zone */}
              <label 
                className={`bg-neutral-900/50 border-2 border-dashed ${isUploading ? 'border-blue-500/50' : 'border-neutral-700 hover:border-blue-500/50'} rounded-none p-10 flex flex-col items-center justify-center text-center transition-all cursor-pointer group relative overflow-hidden backdrop-blur-sm`}
              >
                <input 
                  type="file" 
                  className="hidden" 
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
                <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                {isUploading ? (
                  <div className="h-16 w-16 rounded-none bg-blue-500/20 flex items-center justify-center mb-4 shadow-lg">
                    <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
                  </div>
                ) : (
                  <div className="h-16 w-16 rounded-none bg-neutral-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                    <UploadCloud className="h-8 w-8 text-blue-400" />
                  </div>
                )}
                
                <h3 className="text-lg font-semibold text-white mb-2">
                  {isUploading ? "Analyzing..." : "Upload a Document"}
                </h3>
                <p className="text-sm text-neutral-400 mb-6">Drag and drop or click to browse. Supports PDF, DOCX, TXT.</p>
                <Button variant="secondary" disabled={isUploading} className="bg-blue-600 hover:bg-blue-500 text-white rounded-none px-8 pointer-events-none">
                  {isUploading ? "Processing" : "Browse Files"}
                </Button>
              </label>

              {/* Recent Documents */}
              <div className="bg-neutral-900/60 border border-neutral-800 rounded-none p-6 backdrop-blur-md">
                <h3 className="text-lg font-bold text-white mb-4">Recent Documents</h3>
                <div className="space-y-3">
                  {documents.length === 0 ? (
                    <div className="text-center p-6 rounded-none border border-dashed border-neutral-700">
                      <p className="text-sm text-neutral-500">No documents uploaded yet.</p>
                    </div>
                  ) : (
                    documents.map((doc, i) => (
                      <div key={i} onClick={() => handleLoadDocumentChat(doc)} className={`flex items-center justify-between p-3 rounded-none border transition-all cursor-pointer ${i === 0 ? 'bg-blue-500/10 border-blue-500/30' : 'bg-neutral-800/50 border-transparent hover:border-neutral-700'}`}>
                        <div className="flex items-center gap-3 overflow-hidden">
                          <File className={`h-8 w-8 shrink-0 p-1.5 rounded-none ${i === 0 ? 'text-blue-400 bg-blue-500/20' : 'text-neutral-400 bg-neutral-700'}`} />
                          <div className="overflow-hidden">
                            <p className={`text-sm font-medium truncate ${i === 0 ? 'text-blue-100' : 'text-neutral-200'}`}>{doc.name}</p>
                            <p className="text-xs text-neutral-500">{doc.size} • {doc.date}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: AI Chat & Quiz */}
            <div className="lg:col-span-2 flex flex-col h-[600px] bg-neutral-900/60 border border-neutral-800 rounded-none overflow-hidden backdrop-blur-md shadow-xl relative">
              {/* Overlay if no doc selected */}
              {!chatId && !isUploading && (
                <div className="absolute inset-0 z-20 bg-neutral-950/80 backdrop-blur-sm flex flex-col items-center justify-center">
                  <div className="h-20 w-20 rounded-none bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-4 shadow-lg">
                    <FilePlus className="h-10 w-10 text-neutral-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-white mb-2">No Document Selected</h2>
                  <p className="text-neutral-400 text-center max-w-sm mb-6">Upload a document to start analyzing.</p>
                </div>
              )}

              {/* Quiz Overlay */}
              <AnimatePresence>
                {quiz && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute inset-0 z-30 bg-neutral-950 flex flex-col"
                  >
                    <div className="p-4 border-b border-neutral-800 bg-neutral-900 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <BrainCircuit className="h-5 w-5 text-indigo-400" />
                        <span className="font-bold">Knowledge Check</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setQuiz(null)} className="text-neutral-400 hover:text-white">
                        Back to Chat
                      </Button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-6 space-y-8">
                      {quizScore !== null && (
                        <div className={`p-6 rounded-none border flex flex-col items-center justify-center text-center ${quizScore >= quiz.length / 2 ? 'bg-green-500/10 border-green-500/30' : 'bg-yellow-500/10 border-yellow-500/30'}`}>
                          <h2 className="text-3xl font-bold mb-2">Score: {quizScore} / {quiz.length}</h2>
                          <p className="text-neutral-300">
                            {quizScore === quiz.length ? "Perfect score! You really know your stuff." : 
                             quizScore >= quiz.length / 2 ? "Good job! You got most of them right." : 
                             "Keep reviewing the document. You can do better next time!"}
                          </p>
                        </div>
                      )}

                      {quiz.map((q, qIndex) => (
                        <div key={qIndex} className="bg-neutral-900/50 border border-neutral-800 rounded-none p-5">
                          <p className="font-medium text-lg mb-4">{qIndex + 1}. {q.question}</p>
                          <div className="space-y-2">
                            {q.options.map((opt, oIndex) => {
                              const isSelected = userAnswers[qIndex] === opt;
                              const isSubmitted = quizScore !== null;
                              const isCorrect = opt === q.answer;
                              
                              let btnClass = "w-full justify-start text-left h-auto py-3 px-4 border ";
                              
                              if (isSubmitted) {
                                if (isCorrect) btnClass += "bg-green-500/20 border-green-500/50 text-green-100";
                                else if (isSelected && !isCorrect) btnClass += "bg-red-500/20 border-red-500/50 text-red-100";
                                else btnClass += "bg-neutral-800 border-neutral-700 opacity-50";
                              } else {
                                if (isSelected) btnClass += "bg-indigo-600 border-indigo-500 text-white";
                                else btnClass += "bg-neutral-800 hover:bg-neutral-700 border-neutral-700";
                              }

                              return (
                                <Button 
                                  key={oIndex}
                                  variant="outline"
                                  className={btnClass}
                                  onClick={() => !isSubmitted && setUserAnswers(prev => ({...prev, [qIndex]: opt}))}
                                  disabled={isSubmitted}
                                >
                                  <span className="flex-1 whitespace-normal">{opt}</span>
                                  {isSubmitted && isCorrect && <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0 ml-2" />}
                                  {isSubmitted && isSelected && !isCorrect && <XCircle className="h-5 w-5 text-red-400 shrink-0 ml-2" />}
                                </Button>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                      
                      {quizScore === null && (
                        <Button 
                          onClick={submitQuiz}
                          disabled={Object.keys(userAnswers).length !== quiz.length}
                          className="w-full h-12 text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500"
                        >
                          Submit Answers
                        </Button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Chat Header */}
              <div className="p-4 border-b border-neutral-800 bg-neutral-900/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl leading-none">🥨</span>
                  <span className="font-semibold text-white">AI Analyst {documents.length > 0 ? `(${documents[0].name})` : ""}</span>
                </div>
                <div className="flex items-center gap-2">
                  {isUploading && <span className="text-xs text-blue-400 flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin"/> Processing...</span>}
                  <div className="text-xs text-neutral-500 bg-neutral-800 px-3 py-1 rounded-none">
                    {chatId ? "Connected" : "Waiting"}
                  </div>
                </div>
              </div>

              {/* Chat Body */}
              <div className="flex-1 p-6 overflow-y-auto space-y-6" ref={scrollRef}>
                {messages.length === 0 && chatId && !isTyping && (
                  <div className="text-center text-neutral-500 mt-10">
                    <p>Start asking questions about your document.</p>
                  </div>
                )}
                
                {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                    <div className={`h-8 w-8 rounded-none flex items-center justify-center shrink-0 ${msg.role === "user" ? "bg-indigo-500" : "bg-blue-500/20"}`}>
                      {msg.role === "user" ? <span className="text-xs font-bold">U</span> : <span className="text-base leading-none">🥨</span>}
                    </div>
                    <div className={`border rounded-none p-4 max-w-[80%] whitespace-pre-wrap ${msg.role === "user" ? "bg-indigo-600 border-indigo-500 rounded-tr-none text-white" : "bg-neutral-800/60 border-neutral-700/50 rounded-tl-none text-neutral-200"}`}>
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex gap-4">
                    <div className="h-8 w-8 rounded-none bg-blue-500/20 flex items-center justify-center shrink-0">
                      <span className="text-base leading-none">🥨</span>
                    </div>
                    <div className="bg-neutral-800/60 border border-neutral-700/50 rounded-none rounded-tl-none p-4 w-20 flex items-center justify-center">
                      <Loader2 className="h-4 w-4 text-neutral-400 animate-spin" />
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-neutral-800 bg-neutral-900/80">
                <div className="relative">
                  <Input 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={chatId ? "Ask a question about the document..." : "Upload a document first..."}
                    disabled={!chatId || isTyping}
                    className="w-full bg-neutral-950 border-neutral-800 text-white h-12 pl-4 pr-12 rounded-none focus-visible:ring-blue-500/50 disabled:opacity-50"
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    disabled={!chatId || !input.trim() || isTyping}
                    className="absolute right-1.5 top-1.5 h-9 w-9 bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-700 text-white rounded-none transition-colors"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
