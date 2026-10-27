"use client"

import { useState } from "react"
import { Presentation, Sparkles, Wand2, MonitorPlay, ChevronLeft, ChevronRight, LayoutTemplate, Download, Loader2, Check, LayoutDashboard, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { api } from "@/lib/api"
import { recordUserActivity } from "@/lib/activityLogger"
import { toast } from "sonner"

interface Slide {
  title: string;
  content: string;
}

const THEMES = [
  { id: "Modern", color: "bg-blue-500", name: "Modern" },
  { id: "Corporate", color: "bg-slate-700", name: "Corporate" },
  { id: "Vibrant", color: "bg-orange-500", name: "Vibrant" },
  { id: "Minimal", color: "bg-neutral-300", name: "Minimal" }
]

const STYLES = ["Border Design", "Full Design"]
const EFFECTS = ["Fade", "Slide", "Zoom"]

export default function PresentationsPage() {
  const [currentSlide, setCurrentSlide] = useState(1)
  const [prompt, setPrompt] = useState("")
  const [selectedTheme, setSelectedTheme] = useState("Modern")
  const [selectedStyle, setSelectedStyle] = useState("Full Design")
  const [selectedEffect, setSelectedEffect] = useState("Fade")
  const [slideCount, setSlideCount] = useState(5)
  const [isGenerating, setIsGenerating] = useState(false)
  
  const [slides, setSlides] = useState<Slide[]>([
    {
      title: "The Future of AI",
      content: "Exploring artificial intelligence applications in the modern workspace and how it enhances productivity."
    }
  ])

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a topic for your presentation");
      return;
    }

    setIsGenerating(true);
    try {
      recordUserActivity({
        action: "presentation_generate",
        query: prompt.trim(),
        title: `Presentation: "${prompt.trim().substring(0, 35)}"`,
        category: "Presentations",
        detail: `${slideCount} slides (${selectedTheme} theme, ${selectedStyle})`
      });

      const res: any = await api.post("/presentations/generate", {
        prompt,
        theme: selectedTheme,
        style: selectedStyle,
        effect: selectedEffect,
        slide_count: slideCount
      });
      
      const data = (res as any).data || res;
      if (data && data.slides && data.slides.length > 0) {
        setSlides(data.slides);
        setCurrentSlide(1);
        toast.success("Presentation generated successfully!");
      } else {
        toast.error("Failed to generate slides. Please try again.");
      }
    } catch (error) {
      console.error("Presentation generation error:", error);
      toast.error("Something went wrong generating the presentation.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="flex flex-col min-h-full bg-transparent text-white font-sans relative">
      <main className="flex-1 p-8 pb-20 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
                  Presentations
                </h1>
                <p className="text-neutral-400 text-sm mt-1">Generate beautiful slide decks dynamically using AI.</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button className="bg-orange-600 hover:bg-orange-500 text-white rounded-none">
                <Download className="h-4 w-4 mr-2" /> Export to PPTX
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            
            {/* Main Presentation View */}
            <div className={`w-full aspect-[16/9] rounded-none overflow-hidden relative shadow-2xl transition-all duration-500
              ${selectedStyle === 'Border Design' ? 'border-4 border-transparent bg-[#FFFDF2] bg-[url(/border-design.png)] bg-[length:100%_100%] bg-center bg-no-repeat text-amber-950' : 'border border-neutral-700'}
              ${selectedStyle === 'Full Design' ? 'bg-[url(/full-design.png)] bg-cover bg-center bg-no-repeat text-white' : ''}`}>
              
              {/* Slide Content */}
              <div key={currentSlide} className={`absolute inset-0 p-16 flex flex-col justify-center animate-in ${
                selectedEffect === 'Fade' ? 'fade-in duration-500' :
                selectedEffect === 'Slide' ? 'slide-in-from-right duration-500' :
                selectedEffect === 'Zoom' ? 'zoom-in duration-500' :
                'fade-in duration-500'
              }`}>
                {isGenerating ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4 text-white">
                    <Loader2 className="h-12 w-12 animate-spin text-orange-400" />
                    <p className="text-xl font-medium">Crafting your presentation...</p>
                  </div>
                ) : (
                  <>
                    <h2 className="text-5xl font-black mb-8">
                      {slides[currentSlide - 1]?.title || "Untitled Slide"}
                    </h2>
                    
                    <div className="text-2xl font-medium max-w-4xl whitespace-pre-line leading-relaxed">
                      {slides[currentSlide - 1]?.content.split('\n').map((line, i) => (
                        <p key={i} className="mb-2">{line.startsWith('-') || line.startsWith('•') ? line : line}</p>
                      ))}
                    </div>
                  </>
                )}
              </div>
              
              {/* Slide Controls Overlay */}
              {!isGenerating && slides.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-neutral-900/80 backdrop-blur-md px-4 py-2 rounded-none border border-neutral-700 shadow-xl">
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-neutral-800 rounded-none" onClick={() => setCurrentSlide(Math.max(1, currentSlide - 1))}>
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <span className="text-sm font-medium text-neutral-300 min-w-[60px] text-center">Slide {currentSlide}/{slides.length}</span>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-neutral-800 rounded-none" onClick={() => setCurrentSlide(Math.min(slides.length, currentSlide + 1))}>
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                  <div className="w-px h-4 bg-neutral-700 mx-1"></div>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-orange-400 hover:bg-neutral-800 rounded-none">
                    <MonitorPlay className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Config & Prompt Area */}
            <div className="bg-neutral-900/60 border border-neutral-800 rounded-none p-6 backdrop-blur-md shadow-lg space-y-6">
              
              {/* Configuration Panel */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pb-6 border-b border-neutral-800">
                {/* Theme Selection */}
                <div>
                  <h3 className="text-sm font-medium text-neutral-400 mb-3 flex items-center gap-2">
                    Select Theme
                  </h3>
                  <div className="flex gap-3">
                    {THEMES.map(theme => (
                      <button
                        key={theme.id}
                        onClick={() => setSelectedTheme(theme.id)}
                        className={`relative h-10 w-10 shrink-0 rounded-none transition-all ${theme.color} border-2 ${selectedTheme === theme.id ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-70 hover:opacity-100'}`}
                        title={theme.name}
                      >
                        {selectedTheme === theme.id && <Check className="absolute inset-0 m-auto h-5 w-5 text-white drop-shadow-md" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Style Selection */}
                <div>
                  <h3 className="text-sm font-medium text-neutral-400 mb-3 flex items-center gap-2">
                    Design Style
                  </h3>
                  <div className="flex gap-2 flex-wrap">
                    {STYLES.map(style => (
                      <button
                        key={style}
                        onClick={() => setSelectedStyle(style)}
                        className={`px-4 py-2 rounded-none text-sm font-medium transition-all ${selectedStyle === style ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50' : 'bg-neutral-800 text-neutral-400 border border-transparent hover:bg-neutral-700'}`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Effect Selection */}
                <div>
                  <h3 className="text-sm font-medium text-neutral-400 mb-3 flex items-center gap-2">
                    Transition Effect
                  </h3>
                  <div className="flex gap-2 flex-wrap">
                    {EFFECTS.map(effect => (
                      <button
                        key={effect}
                        onClick={() => setSelectedEffect(effect)}
                        className={`px-4 py-2 rounded-none text-sm font-medium transition-all ${selectedEffect === effect ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50' : 'bg-neutral-800 text-neutral-400 border border-transparent hover:bg-neutral-700'}`}
                      >
                        {effect}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Slide Count */}
                <div>
                  <h3 className="text-sm font-medium text-neutral-400 mb-3 flex items-center gap-2">
                    Number of Slides
                  </h3>
                  <div className="flex items-center gap-4 bg-neutral-800 rounded-none px-4 py-2 w-max">
                    <input 
                      type="range" 
                      min="3" 
                      max="15" 
                      value={slideCount} 
                      onChange={(e) => setSlideCount(parseInt(e.target.value))}
                      className="accent-orange-500"
                    />
                    <span className="text-white font-bold w-6 text-center">{slideCount}</span>
                  </div>
                </div>
              </div>

              {/* Prompt Input */}
              <div className="flex gap-4">
                <div className="bg-neutral-950 border border-neutral-800 rounded-none p-1 flex-1 flex items-center relative">
                  <Input 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !isGenerating && handleGenerate()}
                    placeholder="E.g., A pitch deck for a sustainable coffee brand..."
                    className="w-full bg-transparent border-none text-white h-12 text-sm focus-visible:ring-0 pl-4 pr-4"
                    disabled={isGenerating}
                  />
                </div>
                <Button 
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-none px-8 h-14 font-bold shadow-lg shadow-orange-500/25 flex gap-2 items-center shrink-0 disabled:opacity-50"
                >
                  {isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : null} 
                  {isGenerating ? "Generating..." : "Generate Deck"}
                </Button>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}
