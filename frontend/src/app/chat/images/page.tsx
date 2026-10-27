"use client"

import { useState } from "react"
import { Image as ImageIcon, Sparkles, Wand2, Download, Settings, LayoutGrid, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function ImageStudioPage() {
  const [activeTab, setActiveTab] = useState("generate")

  return (
    <div className="flex flex-col min-h-full bg-transparent text-white font-sans relative">

      <main className="flex-1 p-8 pb-20 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-fuchsia-500/20 border border-fuchsia-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(217,70,239,0.2)]">
                <ImageIcon className="h-6 w-6 text-fuchsia-400" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
                  Image Studio <Sparkles className="h-5 w-5 text-fuchsia-400" />
                </h1>
                <p className="text-neutral-400 text-sm mt-1">Generate stunning visuals from text prompts instantly.</p>
              </div>
            </div>
            
            <div className="flex p-1 bg-neutral-900/60 border border-neutral-800 rounded-xl backdrop-blur-md">
              <button 
                onClick={() => setActiveTab("generate")}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'generate' ? 'bg-fuchsia-500/20 text-fuchsia-300 shadow-sm' : 'text-neutral-400 hover:text-neutral-200'}`}
              >
                Generate
              </button>
              <button 
                onClick={() => setActiveTab("gallery")}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'gallery' ? 'bg-fuchsia-500/20 text-fuchsia-300 shadow-sm' : 'text-neutral-400 hover:text-neutral-200'}`}
              >
                Gallery
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Left Sidebar: Controls */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 backdrop-blur-md">
                <div className="flex items-center gap-2 mb-4">
                  <Settings className="h-4 w-4 text-neutral-400" />
                  <h3 className="text-sm font-semibold text-white">Generation Settings</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-neutral-400 font-medium mb-1 block">Style</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button className="bg-fuchsia-500/20 border border-fuchsia-500/50 text-fuchsia-300 text-xs py-2 rounded-lg font-medium">Cinematic</button>
                      <button className="bg-neutral-800 border border-neutral-700 text-neutral-300 hover:bg-neutral-700 transition-colors text-xs py-2 rounded-lg font-medium">Anime</button>
                      <button className="bg-neutral-800 border border-neutral-700 text-neutral-300 hover:bg-neutral-700 transition-colors text-xs py-2 rounded-lg font-medium">Photoreal</button>
                      <button className="bg-neutral-800 border border-neutral-700 text-neutral-300 hover:bg-neutral-700 transition-colors text-xs py-2 rounded-lg font-medium">Digital Art</button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs text-neutral-400 font-medium mb-1 block">Aspect Ratio</label>
                    <div className="flex gap-2">
                      <button className="flex-1 bg-neutral-800 border border-neutral-700 text-neutral-300 hover:bg-neutral-700 transition-colors text-xs py-2 rounded-lg font-medium flex items-center justify-center gap-1">1:1</button>
                      <button className="flex-1 bg-fuchsia-500/20 border border-fuchsia-500/50 text-fuchsia-300 text-xs py-2 rounded-lg font-medium flex items-center justify-center gap-1">16:9</button>
                      <button className="flex-1 bg-neutral-800 border border-neutral-700 text-neutral-300 hover:bg-neutral-700 transition-colors text-xs py-2 rounded-lg font-medium flex items-center justify-center gap-1">9:16</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Main Area: Prompt & Preview */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* Prompt Input */}
              <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-2 backdrop-blur-md flex items-center shadow-lg relative z-20">
                <Input 
                  placeholder="A futuristic cyberpunk city at night with neon pink and cyan lights, flying cars, highly detailed, 8k..."
                  className="w-full bg-transparent border-none text-white h-12 text-base focus-visible:ring-0 px-4"
                />
                <Button className="bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white rounded-xl px-8 h-12 font-bold shadow-lg shadow-fuchsia-500/25 flex gap-2 items-center">
                  <Wand2 className="h-4 w-4" /> Generate
                </Button>
              </div>

              {/* Main Canvas Area */}
              <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl h-[500px] flex items-center justify-center relative overflow-hidden backdrop-blur-sm">
                {/* Dummy Placeholder Image */}
                <img 
                  src="https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?q=80&w=2000&auto=format&fit=crop" 
                  alt="Generated Preview" 
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent opacity-80" />
                
                {/* Image Overlay Controls */}
                <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                  <div className="max-w-xl">
                    <p className="text-white font-medium mb-1 drop-shadow-md">Cyberpunk Cityscape</p>
                    <p className="text-neutral-300 text-xs drop-shadow-md">A futuristic cyberpunk city at night with neon pink and cyan lights, flying cars, highly detailed, 8k</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="icon" variant="secondary" className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 rounded-full h-10 w-10">
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="secondary" className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white shadow-lg shadow-fuchsia-900/50 rounded-full h-10 w-10 border-none">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
