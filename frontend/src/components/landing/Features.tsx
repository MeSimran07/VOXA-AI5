"use client";

import { motion } from "framer-motion";
import { Mic, BookOpen, MessageSquare, FileText, LayoutDashboard, Settings } from "lucide-react";

export function Features() {
  const features = [
    {
      icon: <Mic className="h-8 w-8" />,
      title: "Voice Assistant",
      description: "Real-time voice interactions with a live waveform. Interrupt, command, and converse naturally.",
      color: "from-violet-500 to-indigo-600",
      delay: 0.1,
    },
    {
      icon: <FileText className="h-8 w-8" />,
      title: "Document Analyzer",
      description: "Drag and drop PDFs. Extract insights, generate mind maps, and create flashcards instantly.",
      color: "from-electric-blue-500 to-cyan-500",
      delay: 0.2,
    },
    {
      icon: <BookOpen className="h-8 w-8" />,
      title: "Intelligent Tutor",
      description: "Personalized learning roadmaps, mock tests, and topic explanations adapted to your pace.",
      color: "from-magenta-500 to-pink-500",
      delay: 0.3,
    },
    {
      icon: <MessageSquare className="h-8 w-8" />,
      title: "Advanced AI Chat",
      description: "Markdown support, syntax highlighting, image generation, and context-aware memory.",
      color: "from-emerald-500 to-teal-500",
      delay: 0.4,
    },
    {
      icon: <LayoutDashboard className="h-8 w-8" />,
      title: "Unified Workspace",
      description: "Global command palette, split views, and an interconnected productivity ecosystem.",
      color: "from-orange-500 to-red-500",
      delay: 0.5,
    },
    {
      icon: <Settings className="h-8 w-8" />,
      title: "Total Control",
      description: "Customizable models, system prompts, API keys, and comprehensive workspace settings.",
      color: "from-blue-500 to-violet-500",
      delay: 0.6,
    }
  ];

  return (
    <section id="features" className="py-32 relative z-10 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6"
          >
            Everything you need. <br />
            <span className="text-secondary-text">In one intelligent ecosystem.</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-neutral-400 max-w-2xl mx-auto"
          >
            Voxa AI replaces fragmented tools with a unified, context-aware intelligence layer for all your workflows.
          </motion.p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: feature.delay }}
              whileHover={{ y: -5 }}
              className="glass-card p-8 rounded-[28px] group cursor-pointer relative overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
              
              <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${feature.color} bg-opacity-10 flex items-center justify-center text-white mb-6 shadow-lg relative z-10 group-hover:scale-110 transition-transform duration-500`}>
                <div className="absolute inset-0 bg-white/20 rounded-2xl" />
                <div className="relative z-10">{feature.icon}</div>
              </div>
              
              <h3 className="text-2xl font-bold mb-3 text-white relative z-10">{feature.title}</h3>
              <p className="text-secondary-text leading-relaxed relative z-10">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
