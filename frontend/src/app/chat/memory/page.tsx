"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Brain, Sparkles, Plus, Search, Trash2, Edit3, 
  CheckCircle2, XCircle, Share2, Layers, RefreshCw, 
  Target, Heart, Wrench, Briefcase, AlertCircle, Info,
  Filter, Check, Zap, Eye, EyeOff, Loader2, Compass
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface MemoryItem {
  id: string;
  category: "goal" | "preference" | "skill" | "project" | "constraint" | "fact" | string;
  subject: string;
  predicate: string;
  object_value: string;
  confidence_score: number;
  source: string;
  is_active: boolean;
  access_count: number;
  tags?: string;
  last_accessed_at?: string;
  created_at?: string;
}

interface GraphData {
  nodes: Array<{
    id: string;
    label: string;
    category: string;
    type: string;
    confidence: number;
    description: string;
    access_count: number;
  }>;
  links: Array<{
    source: string;
    target: string;
    relationship: string;
    strength: number;
  }>;
  stats: {
    total_memories: number;
    high_confidence_count: number;
    average_confidence: number;
    categories_active: number;
    total_connections: number;
  };
}

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: any }> = {
  goal: {
    label: "Goal",
    color: "text-violet-400",
    bg: "bg-violet-500/15",
    border: "border-violet-500/30",
    icon: Target,
  },
  preference: {
    label: "Preference",
    color: "text-cyan-400",
    bg: "bg-cyan-500/15",
    border: "border-cyan-500/30",
    icon: Heart,
  },
  skill: {
    label: "Skill",
    color: "text-emerald-400",
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/30",
    icon: Wrench,
  },
  project: {
    label: "Project",
    color: "text-amber-400",
    bg: "bg-amber-500/15",
    border: "border-amber-500/30",
    icon: Briefcase,
  },
  constraint: {
    label: "Constraint",
    color: "text-rose-400",
    bg: "bg-rose-500/15",
    border: "border-rose-500/30",
    icon: AlertCircle,
  },
  fact: {
    label: "Fact",
    color: "text-indigo-400",
    bg: "bg-indigo-500/15",
    border: "border-indigo-500/30",
    icon: Info,
  },
};

export default function MemoryGraphPage() {
  const [activeTab, setActiveTab] = useState<"graph" | "cards">("graph");
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNode, setSelectedNode] = useState<any>(null);

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [extractModalOpen, setExtractModalOpen] = useState(false);
  const [editMemory, setEditMemory] = useState<MemoryItem | null>(null);

  // Form states for adding/editing
  const [formCategory, setFormCategory] = useState("goal");
  const [formSubject, setFormSubject] = useState("");
  const [formPredicate, setFormPredicate] = useState("preparing_for");
  const [formObject, setFormObject] = useState("");
  const [formConfidence, setFormConfidence] = useState(0.9);
  const [formTags, setFormTags] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Extract from text state
  const [extractText, setExtractText] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedPreview, setExtractedPreview] = useState<any[]>([]);

  useEffect(() => {
    fetchMemoriesAndGraph();
  }, []);

  const fetchMemoriesAndGraph = async () => {
    try {
      setIsLoading(true);
      const [memsRes, graphRes] = await Promise.all([
        api.get<any>("/memories"),
        api.get<GraphData>("/memories/graph"),
      ]);

      const memList = Array.isArray(memsRes) ? memsRes : (memsRes?.data || []);
      setMemories(memList);

      if (graphRes && (graphRes as any).nodes) {
        setGraphData(graphRes);
      }
    } catch (e: any) {
      console.warn("Could not load memory graph:", e?.message || e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (mem: MemoryItem) => {
    try {
      await api.patch(`/memories/${mem.id}/toggle`, {});
      setMemories(prev => prev.map(m => m.id === mem.id ? { ...m, is_active: !m.is_active } : m));
      toast.success(mem.is_active ? "Memory paused from AI context" : "Memory activated for personalization");
    } catch (err: any) {
      toast.error("Failed to toggle memory status");
    }
  };

  const handleDeleteMemory = async (id: string) => {
    try {
      await api.delete(`/memories/${id}`);
      setMemories(prev => prev.filter(m => m.id !== id));
      if (selectedNode?.id === `mem-${id}`) setSelectedNode(null);
      toast.success("Knowledge node removed from memory graph");
      // refresh graph
      const graphRes = await api.get<GraphData>("/memories/graph");
      setGraphData(graphRes);
    } catch (err: any) {
      toast.error("Failed to delete memory");
    }
  };

  const handleSaveMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSubject.trim() || !formObject.trim()) {
      toast.error("Please enter a subject and details to remember");
      return;
    }

    try {
      setIsSubmitting(true);
      if (editMemory) {
        // Update existing
        await api.put(`/memories/${editMemory.id}`, {
          category: formCategory,
          subject: formSubject,
          predicate: formPredicate,
          object_value: formObject,
          confidence_score: formConfidence,
          tags: formTags,
        });
        toast.success("Memory node updated successfully!");
      } else {
        // Create new
        await api.post("/memories", {
          category: formCategory,
          subject: formSubject,
          predicate: formPredicate,
          object_value: formObject,
          confidence_score: formConfidence,
          tags: formTags,
          source: "explicit_user",
        });
        toast.success("New knowledge node linked to your Memory Graph!");
      }

      setAddModalOpen(false);
      setEditMemory(null);
      resetForm();
      fetchMemoriesAndGraph();
    } catch (err: any) {
      toast.error(err.message || "Failed to save memory");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (mem: MemoryItem) => {
    setEditMemory(mem);
    setFormCategory(mem.category);
    setFormSubject(mem.subject);
    setFormPredicate(mem.predicate);
    setFormObject(mem.object_value);
    setFormConfidence(mem.confidence_score);
    setFormTags(mem.tags || "");
    setAddModalOpen(true);
  };

  const resetForm = () => {
    setFormCategory("goal");
    setFormSubject("");
    setFormPredicate("preparing_for");
    setFormObject("");
    setFormConfidence(0.9);
    setFormTags("");
  };

  const handleExtractFromText = async () => {
    if (!extractText.trim()) return;
    try {
      setIsExtracting(true);
      const res = await api.post<any>("/memories/extract?auto_save=true", { text: extractText });
      const count = res?.extracted_count || res?.memories?.length || 0;
      if (count > 0) {
        toast.success(`Extracted & linked ${count} new knowledge nodes to your Memory Graph!`);
        setExtractModalOpen(false);
        setExtractText("");
        fetchMemoriesAndGraph();
      } else {
        toast.info("No long-term facts or goals detected in that statement.");
      }
    } catch (err: any) {
      toast.error("Extraction failed: " + (err.message || "Check connection"));
    } finally {
      setIsExtracting(false);
    }
  };

  const filteredMemories = useMemo(() => {
    return memories.filter(m => {
      const matchCat = selectedCategory === "all" || m.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchSearch = !searchQuery || 
        m.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
        m.object_value.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.tags && m.tags.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [memories, selectedCategory, searchQuery]);

  return (
    <div className="flex flex-col min-h-screen bg-transparent text-white font-sans p-6 sm:p-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/15 text-violet-400 border border-violet-500/30 mb-2">
            <Brain className="h-3.5 w-3.5" />
            <span>Innovation 1: Self-Improving Memory Graph</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            Personal Knowledge Graph
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-2xl">
            Voxa AI autonomously connects your goals, study habits, coding preferences, and ongoing projects so you never have to repeat your context.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => setExtractModalOpen(true)}
            variant="outline"
            className="border-white/15 hover:bg-white/10 text-white rounded-xl text-xs h-10 px-4"
          >
            <Sparkles className="h-3.5 w-3.5 mr-1.5 text-violet-400" />
            Auto-Extract from Chat
          </Button>

          <Button
            onClick={() => {
              resetForm();
              setEditMemory(null);
              setAddModalOpen(true);
            }}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-xs h-10 px-4 shadow-lg shadow-violet-600/25 font-semibold"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add Knowledge Node
          </Button>
        </div>
      </div>

      {/* Stats Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-6">
        <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>Total Memories</span>
            <Layers className="h-4 w-4 text-violet-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {graphData?.stats.total_memories ?? memories.length}
          </div>
          <div className="text-[11px] text-neutral-500 mt-0.5">Active Knowledge Nodes</div>
        </div>

        <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>Confidence Index</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {graphData?.stats.average_confidence ?? 94}%
          </div>
          <div className="text-[11px] text-neutral-500 mt-0.5">Avg Verification Score</div>
        </div>

        <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>Graph Dimensions</span>
            <Compass className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400 font-mono">
            {graphData?.stats.categories_active ?? 4} Clusters
          </div>
          <div className="text-[11px] text-neutral-500 mt-0.5">Goals, Skills, Constraints</div>
        </div>

        <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>Connected Edges</span>
            <Share2 className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-indigo-400 font-mono">
            {graphData?.stats.total_connections ?? (memories.length * 2)}
          </div>
          <div className="text-[11px] text-neutral-500 mt-0.5">Context Associations</div>
        </div>
      </div>

      {/* Tabs and Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
        {/* View Switcher */}
        <div className="flex items-center p-1 bg-neutral-900/90 rounded-xl border border-white/10 w-fit">
          <button
            onClick={() => setActiveTab("graph")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "graph"
                ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>Interactive Mind Graph</span>
          </button>
          <button
            onClick={() => setActiveTab("cards")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "cards"
                ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Control Panel ({filteredMemories.length})</span>
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <Input
              type="text"
              placeholder="Search memory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-neutral-900/80 border-white/10 rounded-xl pl-8 pr-3 text-xs h-9 w-44 sm:w-56 text-white placeholder-neutral-500"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-neutral-900/80 border border-white/10 rounded-xl text-xs h-9 px-3 text-neutral-300 focus:outline-none focus:border-violet-500"
          >
            <option value="all">All Categories</option>
            <option value="goal">Goals</option>
            <option value="preference">Preferences</option>
            <option value="skill">Skills</option>
            <option value="project">Projects</option>
            <option value="constraint">Constraints</option>
            <option value="fact">Facts</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === "graph" ? (
        <div className="relative bg-neutral-950/80 border border-white/10 rounded-3xl overflow-hidden p-6 min-h-[520px] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Knowledge Topology • Click any node to inspect details
            </span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-violet-500"/> Goal</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-cyan-500"/> Preference</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500"/> Skill</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500"/> Project</span>
            </div>
          </div>

          {/* Interactive SVG Radial Mind Graph */}
          <div className="relative w-full h-[460px] flex items-center justify-center overflow-hidden">
            <svg className="w-full h-full" viewBox="-300 -200 600 400">
              <defs>
                <radialGradient id="userGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Central Glowing Field */}
              <circle cx="0" cy="0" r="140" fill="url(#userGlow)" />
              <circle cx="0" cy="0" r="180" fill="none" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
              <circle cx="0" cy="0" r="100" fill="none" stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />

              {/* Connecting Lines to Orbiting Nodes */}
              {filteredMemories.map((m, idx) => {
                const total = filteredMemories.length || 1;
                const angle = (idx / total) * 2 * Math.PI - Math.PI / 2;
                const radius = 135 + (idx % 3) * 25;
                const x = radius * Math.cos(angle);
                const y = radius * Math.sin(angle);
                const isSelected = selectedNode?.id === `mem-${m.id}`;

                return (
                  <g key={`link-${m.id}`}>
                    <line
                      x1="0"
                      y1="0"
                      x2={x}
                      y2={y}
                      stroke={isSelected ? "#8b5cf6" : "rgba(255,255,255,0.15)"}
                      strokeWidth={isSelected ? 2.5 : 1}
                      strokeDasharray={isSelected ? "none" : "2 2"}
                    />
                  </g>
                );
              })}

              {/* Central Node: User Brain */}
              <g className="cursor-pointer">
                <circle cx="0" cy="0" r="34" fill="#18181b" stroke="#7c3aed" strokeWidth="2.5" />
                <foreignObject x="-24" y="-24" width="48" height="48">
                  <div className="w-full h-full flex items-center justify-center text-violet-400">
                    <Brain className="h-7 w-7 animate-pulse" />
                  </div>
                </foreignObject>
                <text x="0" y="46" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="bold">
                  Your Brain
                </text>
              </g>

              {/* Orbiting Memory Nodes */}
              {filteredMemories.map((m, idx) => {
                const total = filteredMemories.length || 1;
                const angle = (idx / total) * 2 * Math.PI - Math.PI / 2;
                const radius = 135 + (idx % 3) * 25;
                const x = radius * Math.cos(angle);
                const y = radius * Math.sin(angle);
                const isSelected = selectedNode?.id === `mem-${m.id}`;
                const config = CATEGORY_CONFIG[m.category.toLowerCase()] || CATEGORY_CONFIG.fact;

                return (
                  <g
                    key={`node-${m.id}`}
                    transform={`translate(${x}, ${y})`}
                    onClick={() => setSelectedNode(selectedNode?.id === `mem-${m.id}` ? null : { ...m, id: `mem-${m.id}`, raw: m })}
                    className="cursor-pointer group"
                  >
                    <circle
                      cx="0"
                      cy="0"
                      r={isSelected ? "22" : "18"}
                      fill="#121216"
                      stroke={isSelected ? "#fff" : config.color.replace("text-", "").includes("violet") ? "#8b5cf6" : config.color.replace("text-", "").includes("cyan") ? "#06b6d4" : "#10b981"}
                      strokeWidth={isSelected ? 3 : 1.5}
                      className="transition-all duration-300"
                    />
                    <foreignObject x="-10" y="-10" width="20" height="20">
                      <div className={`w-full h-full flex items-center justify-center ${config.color}`}>
                        <config.icon className="h-3.5 w-3.5" />
                      </div>
                    </foreignObject>
                    <text
                      x="0"
                      y={isSelected ? "32" : "28"}
                      textAnchor="middle"
                      fill={isSelected ? "#fff" : "#a1a1aa"}
                      fontSize="9"
                      fontWeight={isSelected ? "bold" : "normal"}
                    >
                      {m.subject.length > 14 ? m.subject.slice(0, 12) + ".." : m.subject}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Selected Node Drawer */}
          {selectedNode && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 rounded-2xl bg-neutral-900/90 border border-violet-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-mono font-bold text-violet-400">
                    {selectedNode.raw?.category || selectedNode.category}
                  </span>
                  <span className="text-sm font-bold text-white">
                    {selectedNode.raw?.subject || selectedNode.label}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                    {Math.round((selectedNode.raw?.confidence_score || 0.9) * 100)}% Confirmed
                  </span>
                </div>
                <p className="text-xs text-neutral-300">
                  <span className="text-neutral-500 italic mr-1">
                    {selectedNode.raw?.predicate || "relates_to"}:
                  </span>
                  {selectedNode.raw?.object_value || selectedNode.description}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openEditModal(selectedNode.raw)}
                  className="border-white/10 text-xs h-8"
                >
                  <Edit3 className="h-3 w-3 mr-1" /> Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDeleteMemory(selectedNode.raw?.id)}
                  className="text-xs h-8"
                >
                  <Trash2 className="h-3 w-3 mr-1" /> Delete
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      ) : (
        /* View 2: Cards Grid Control Center */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMemories.length === 0 ? (
            <div className="col-span-full py-16 text-center text-neutral-400 bg-neutral-900/40 rounded-3xl border border-white/5">
              <Brain className="h-10 w-10 mx-auto text-neutral-600 mb-3" />
              <p className="text-base font-semibold text-white">No memory nodes found</p>
              <p className="text-xs text-neutral-500 mt-1">
                Add a memory manually or use Auto-Extract from conversation.
              </p>
            </div>
          ) : (
            filteredMemories.map((mem) => {
              const config = CATEGORY_CONFIG[mem.category.toLowerCase()] || CATEGORY_CONFIG.fact;
              const pct = Math.round(mem.confidence_score * 100);

              return (
                <motion.div
                  key={mem.id}
                  layout
                  className={`rounded-2xl p-5 border transition-all ${
                    mem.is_active 
                      ? "bg-neutral-900/70 border-white/10 hover:border-violet-500/40" 
                      : "bg-neutral-950/50 border-white/5 opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold ${config.bg} ${config.color} border ${config.border}`}>
                      <config.icon className="h-3 w-3" />
                      <span className="capitalize">{mem.category}</span>
                    </span>

                    <button
                      onClick={() => handleToggleActive(mem)}
                      className="text-neutral-400 hover:text-white transition-colors"
                      title={mem.is_active ? "Active in AI memory (click to pause)" : "Paused (click to activate)"}
                    >
                      {mem.is_active ? (
                        <Zap className="h-4 w-4 text-emerald-400 fill-emerald-400/20" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-neutral-600" />
                      )}
                    </button>
                  </div>

                  <h3 className="text-base font-bold text-white mb-1">{mem.subject}</h3>
                  <div className="text-xs text-neutral-400 mb-4 line-clamp-2">
                    <span className="text-neutral-500 font-mono italic mr-1">({mem.predicate}):</span>
                    <span className="text-neutral-200">{mem.object_value}</span>
                  </div>

                  {/* Confidence Score Bar */}
                  <div className="space-y-1 mb-4">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-neutral-400">Confidence Score</span>
                      <span className={`font-mono font-bold ${pct >= 85 ? "text-emerald-400" : "text-amber-400"}`}>
                        {pct}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          pct >= 85 ? "bg-emerald-500" : "bg-amber-500"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Footer & Actions */}
                  <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-neutral-500">
                    <span>Used {mem.access_count || 0} times</span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(mem)}
                        className="text-neutral-400 hover:text-white transition-colors"
                        title="Edit memory"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteMemory(mem.id)}
                        className="text-neutral-400 hover:text-red-400 transition-colors"
                        title="Delete memory"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {/* MODAL: ADD / EDIT MEMORY NODE */}
      <AnimatePresence>
        {addModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAddModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-neutral-950 border border-white/15 rounded-3xl p-6 sm:p-7 shadow-2xl text-white z-10"
            >
              <h3 className="text-xl font-bold mb-1">
                {editMemory ? "Edit Knowledge Node" : "Add Memory to Knowledge Graph"}
              </h3>
              <p className="text-xs text-neutral-400 mb-5">
                Define persistent facts, goals, or coding preferences that VOXA AI should remember.
              </p>

              <form onSubmit={handleSaveMemory} className="space-y-4 text-xs">
                <div>
                  <label className="text-neutral-300 font-medium block mb-1.5">Dimension Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-neutral-900 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
                  >
                    <option value="goal">Goal (Exams, Career Milestones, Objectives)</option>
                    <option value="preference">Preference (Coding Style, Response Depth)</option>
                    <option value="skill">Skill (Technologies, Languages Known)</option>
                    <option value="project">Project (Active software or research building)</option>
                    <option value="constraint">Constraint (Available Hours, Hardware limits)</option>
                    <option value="fact">Fact (General Personal Fact)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-neutral-300 font-medium block mb-1.5">Subject Entity</label>
                    <Input
                      placeholder="e.g. GATE 2027"
                      value={formSubject}
                      onChange={(e) => setFormSubject(e.target.value)}
                      className="bg-neutral-900 border-white/10 text-xs rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-neutral-300 font-medium block mb-1.5">Predicate / Relation</label>
                    <Input
                      placeholder="e.g. preparing_for / prefers"
                      value={formPredicate}
                      onChange={(e) => setFormPredicate(e.target.value)}
                      className="bg-neutral-900 border-white/10 text-xs rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-neutral-300 font-medium block mb-1.5">Detail to Remember (Object Value)</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Preparing for Computer Science GATE 2027 with focus on Algorithms & OS"
                    value={formObject}
                    onChange={(e) => setFormObject(e.target.value)}
                    className="w-full bg-neutral-900 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-violet-500 resize-none"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-neutral-300 font-medium">Confidence Score</label>
                    <span className="font-mono text-emerald-400 font-bold">{Math.round(formConfidence * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="1.0"
                    step="0.05"
                    value={formConfidence}
                    onChange={(e) => setFormConfidence(parseFloat(e.target.value))}
                    className="w-full accent-violet-500"
                  />
                </div>

                <div>
                  <label className="text-neutral-300 font-medium block mb-1.5">Tags (optional, comma-separated)</label>
                  <Input
                    placeholder="e.g. exam, cs, gate"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    className="bg-neutral-900 border-white/10 text-xs rounded-xl"
                  />
                </div>

                <div className="pt-3 border-t border-white/10 flex justify-end gap-2.5">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setAddModalOpen(false)}
                    className="text-xs text-neutral-400 hover:text-white"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-violet-600 hover:bg-violet-500 text-white text-xs px-5 rounded-xl font-semibold"
                  >
                    {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                    Save to Memory Graph
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: AUTO-EXTRACT FROM TEXT */}
      <AnimatePresence>
        {extractModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setExtractModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-neutral-950 border border-white/15 rounded-3xl p-6 sm:p-7 shadow-2xl text-white z-10"
            >
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-5 w-5 text-violet-400" />
                <h3 className="text-xl font-bold">Auto-Extract Memories</h3>
              </div>
              <p className="text-xs text-neutral-400 mb-4">
                Paste any paragraph, statement, or bio. Voxa AI's AI extraction model will parse long-term goals and link them to your graph.
              </p>

              <textarea
                rows={4}
                placeholder="e.g. I am preparing for GATE 2027 in CS. I prefer Python and TypeScript examples, and have 2 hours to study on weekdays."
                value={extractText}
                onChange={(e) => setExtractText(e.target.value)}
                className="w-full bg-neutral-900 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-violet-500 resize-none mb-4"
              />

              <div className="flex justify-end gap-2.5">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setExtractModalOpen(false)}
                  className="text-xs text-neutral-400 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleExtractFromText}
                  disabled={isExtracting || !extractText.trim()}
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs px-5 rounded-xl font-semibold"
                >
                  {isExtracting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      Extracting...
                    </>
                  ) : (
                    "Extract & Save Knowledge"
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
