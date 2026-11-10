"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Brain, Sparkles, Plus, Search, Trash2, Edit3, 
  CheckCircle2, XCircle, Share2, Layers, RefreshCw, 
  Target, Heart, Wrench, Briefcase, AlertCircle, Info,
  Filter, Check, Zap, Eye, EyeOff, Loader2, Compass,
  BookOpen, CheckSquare, Clock3, ArrowRight, Award, Trophy,
  GraduationCap, Flame, MapPin, ExternalLink, MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { toast } from "sonner";
import Link from "next/link";

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

interface ExamMapData {
  exam: string;
  preparation_score: number;
  readiness_level: string;
  summary: string;
  total_searches_found: number;
  domains: Array<{
    name: string;
    covered_count: number;
    total_count: number;
    percentage: number;
  }>;
  nodes: Array<{
    id: string;
    label: string;
    type: string;
    category: string;
    domain?: string;
    score?: number;
    mastery?: number;
    query?: string;
    date?: string;
    source?: string;
    description: string;
    color: string;
  }>;
  links: Array<{
    source: string;
    target: string;
    relationship: string;
    strength: number;
    status?: string;
  }>;
  previous_searches: Array<{
    query: string;
    topic: string;
    domain: string;
    status: string;
    mastery: number;
    date: string;
    source: string;
  }>;
  recommended_next_topics: string[];
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
  const [activeTab, setActiveTab] = useState<"exam" | "graph" | "cards">("exam");
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNode, setSelectedNode] = useState<any>(null);

  // Exam Preparation Map States
  const [examInput, setExamInput] = useState("GATE 2027 CSE");
  const [detectedExams, setDetectedExams] = useState<string[]>([]);
  const [examMapData, setExamMapData] = useState<ExamMapData | null>(null);
  const [isLoadingExamMap, setIsLoadingExamMap] = useState(false);
  const [selectedExamNode, setSelectedExamNode] = useState<any>(null);
  const [examSubView, setExamSubView] = useState<"graph" | "timeline" | "domains">("graph");

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

  useEffect(() => {
    fetchMemoriesAndGraph();
    fetchDetectedExams();
    handleGenerateExamMap("GATE 2027 CSE");
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

  const fetchDetectedExams = async () => {
    try {
      const res = await api.get<any>("/memories/detected-exams");
      if (res?.exams && res.exams.length > 0) {
        setDetectedExams(res.exams);
      }
    } catch (e: any) {
      console.warn("Could not load detected exams:", e?.message || e);
    }
  };

  const handleGenerateExamMap = async (targetExam?: string) => {
    const examToQuery = (targetExam || examInput).trim();
    if (!examToQuery) {
      toast.error("Please enter an exam name (e.g. GATE 2027, UPSC, JEE, GRE)");
      return;
    }

    try {
      setIsLoadingExamMap(true);
      setSelectedExamNode(null);
      const res = await api.post<ExamMapData>("/memories/exam-map", { exam: examToQuery });
      if (res && res.exam) {
        setExamMapData(res);
        setExamInput(res.exam);
        toast.success(`Exam Preparation Map generated for ${res.exam}!`);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to generate exam map");
    } finally {
      setIsLoadingExamMap(false);
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
      fetchDetectedExams();
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
        fetchDetectedExams();
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
            <span>Autonomous Intelligence Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            Personal Knowledge & Exam Memory Graph
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-2xl">
            Type any exam details to generate a comprehensive visual map of all your previous searches, covered topics, and syllabus readiness.
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

      {/* Main Navigation Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 my-6">
        <div className="flex items-center p-1 bg-neutral-900/90 rounded-2xl border border-white/10 w-fit">
          <button
            onClick={() => setActiveTab("exam")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "exam"
                ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/30"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <GraduationCap className="h-4 w-4 text-amber-300" />
            <span>Exam Preparation Map</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-400/20 text-amber-300 font-bold ml-1">
              AI Roadmap
            </span>
          </button>

          <button
            onClick={() => setActiveTab("graph")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "graph"
                ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Share2 className="h-4 w-4" />
            <span>Global Mind Graph</span>
          </button>

          <button
            onClick={() => setActiveTab("cards")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "cards"
                ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Control Panel ({filteredMemories.length})</span>
          </button>
        </div>

        {activeTab !== "exam" && (
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
        )}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: EXAM PREPARATION & PREVIOUS SEARCHES MAP                            */}
      {/* ========================================================================= */}
      {activeTab === "exam" && (
        <div className="space-y-6">
          {/* Exam Query Bar */}
          <div className="bg-gradient-to-r from-neutral-900/90 via-neutral-900/60 to-neutral-950/90 border border-violet-500/30 rounded-3xl p-5 shadow-xl backdrop-blur-md">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="flex-1">
                <label className="text-xs font-semibold text-neutral-300 mb-2 flex items-center gap-2">
                  <Target className="h-3.5 w-3.5 text-violet-400" />
                  Type Any Exam Details to Map Your Searches & Syllabus:
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <Input
                      type="text"
                      placeholder="e.g. GATE 2027 CSE, UPSC Civil Services, JEE Advanced, GRE, CAT, AWS Solutions Architect..."
                      value={examInput}
                      onChange={(e) => setExamInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleGenerateExamMap()}
                      className="bg-neutral-950/80 border-white/15 rounded-xl pl-10 pr-3 text-xs sm:text-sm h-11 text-white placeholder-neutral-500 w-full focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                    />
                  </div>
                  <Button
                    onClick={() => handleGenerateExamMap()}
                    disabled={isLoadingExamMap}
                    className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-xs sm:text-sm h-11 px-6 font-bold shadow-lg shadow-violet-600/30 shrink-0"
                  >
                    {isLoadingExamMap ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2 text-amber-300" />
                        Generate Map
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Quick Suggestion Chips */}
            <div className="mt-3.5 flex items-center gap-2 flex-wrap text-xs">
              <span className="text-neutral-500 text-[11px] font-medium mr-1">Quick Select:</span>
              {(detectedExams.length > 0 ? detectedExams : ["GATE 2027 CSE", "UPSC Civil Services", "JEE Advanced", "DSA & System Design"]).map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    setExamInput(item);
                    handleGenerateExamMap(item);
                  }}
                  className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all border ${
                    examInput.toLowerCase() === item.toLowerCase()
                      ? "bg-violet-600/30 border-violet-500 text-white shadow-sm"
                      : "bg-white/5 border-white/10 text-neutral-400 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Readiness Dashboard Scorecards */}
          {examMapData && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-neutral-900/70 border border-violet-500/20 rounded-2xl p-4 relative overflow-hidden">
                <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
                  <span>Preparation Readiness</span>
                  <Award className="h-4 w-4 text-violet-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <div className="text-3xl font-black text-white font-mono">
                    {examMapData.preparation_score}%
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    examMapData.preparation_score >= 70 ? "bg-emerald-500/20 text-emerald-300" :
                    examMapData.preparation_score >= 40 ? "bg-amber-500/20 text-amber-300" : "bg-rose-500/20 text-rose-300"
                  }`}>
                    {examMapData.readiness_level}
                  </span>
                </div>
                <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden mt-3">
                  <div 
                    className="h-full bg-gradient-to-r from-violet-500 via-indigo-500 to-emerald-400 rounded-full transition-all duration-700"
                    style={{ width: `${examMapData.preparation_score}%` }}
                  />
                </div>
              </div>

              <div className="bg-neutral-900/70 border border-emerald-500/20 rounded-2xl p-4">
                <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
                  <span>Past Searches Aligned</span>
                  <CheckSquare className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="text-3xl font-black text-emerald-400 font-mono">
                  {examMapData.total_searches_found}
                </div>
                <div className="text-[11px] text-neutral-500 mt-1">Queries & Notes Mapped</div>
              </div>

              <div className="bg-neutral-900/70 border border-cyan-500/20 rounded-2xl p-4">
                <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
                  <span>Syllabus Clusters</span>
                  <BookOpen className="h-4 w-4 text-cyan-400" />
                </div>
                <div className="text-3xl font-black text-cyan-400 font-mono">
                  {examMapData.domains.length}
                </div>
                <div className="text-[11px] text-neutral-500 mt-1">Core Subject Domains</div>
              </div>

              <div className="bg-neutral-900/70 border border-amber-500/20 rounded-2xl p-4">
                <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
                  <span>Next Recommended Focus</span>
                  <Flame className="h-4 w-4 text-amber-400" />
                </div>
                <div className="text-xs font-bold text-amber-300 line-clamp-1 mt-1">
                  {examMapData.recommended_next_topics[0] || "Foundations"}
                </div>
                <div className="text-[11px] text-neutral-500 mt-1">High-yield pending topic</div>
              </div>
            </div>
          )}

          {/* AI Executive Summary */}
          {examMapData?.summary && (
            <div className="bg-violet-950/25 border border-violet-500/30 rounded-2xl p-4 flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-violet-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-violet-300 uppercase tracking-wider mb-0.5">
                  AI Preparation Intelligence & Coverage Analysis
                </h4>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  {examMapData.summary}
                </p>
              </div>
            </div>
          )}

          {/* Sub-view switcher within Exam Map */}
          <div className="flex items-center justify-between">
            <div className="flex items-center p-1 bg-neutral-900 rounded-xl border border-white/10 text-xs">
              <button
                onClick={() => setExamSubView("graph")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  examSubView === "graph" ? "bg-violet-600 text-white font-semibold" : "text-neutral-400 hover:text-white"
                }`}
              >
                <Share2 className="h-3 w-3" />
                <span>Visual Roadmap Graph</span>
              </button>
              <button
                onClick={() => setExamSubView("timeline")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  examSubView === "timeline" ? "bg-violet-600 text-white font-semibold" : "text-neutral-400 hover:text-white"
                }`}
              >
                <Clock3 className="h-3 w-3" />
                <span>Searches Timeline ({examMapData?.previous_searches?.length || 0})</span>
              </button>
              <button
                onClick={() => setExamSubView("domains")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  examSubView === "domains" ? "bg-violet-600 text-white font-semibold" : "text-neutral-400 hover:text-white"
                }`}
              >
                <Layers className="h-3 w-3" />
                <span>Domain Mastery Breakdown</span>
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-3 text-xs text-neutral-400">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <span>Covered in Past Searches</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80 border border-rose-400" />
                <span>Pending Syllabus Topic</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
                <span>Syllabus Domain</span>
              </span>
            </div>
          </div>

          {/* VIEW 1: INTERACTIVE SVG TOPOLOGY GRAPH */}
          {examSubView === "graph" && (
            <div className="relative bg-neutral-950/90 border border-white/10 rounded-3xl overflow-hidden p-6 min-h-[540px] flex flex-col justify-between shadow-2xl">
              <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live Exam Knowledge Topology • Click any node to see search details and start revising
                </span>
                <span className="font-mono text-neutral-500">
                  Target: {examMapData?.exam || examInput}
                </span>
              </div>

              {isLoadingExamMap ? (
                <div className="w-full h-[460px] flex flex-col items-center justify-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
                  <p className="text-xs text-neutral-400">Analyzing past chats and constructing syllabus roadmap...</p>
                </div>
              ) : examMapData ? (
                <div className="relative w-full h-[480px] flex items-center justify-center overflow-hidden">
                  <svg className="w-full h-full" viewBox="-360 -240 720 480">
                    <defs>
                      <radialGradient id="examCenterGlow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.45" />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                      </radialGradient>
                    </defs>

                    {/* Concentric rings */}
                    <circle cx="0" cy="0" r="230" fill="none" stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" />
                    <circle cx="0" cy="0" r="140" fill="none" stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
                    <circle cx="0" cy="0" r="140" fill="url(#examCenterGlow)" />

                    {/* 1. Connections between Exam Center and Domains */}
                    {examMapData.domains.map((dom, dIdx) => {
                      const totalD = examMapData.domains.length || 1;
                      const angle = (dIdx / totalD) * 2 * Math.PI - Math.PI / 2;
                      const rD = 135;
                      const xD = rD * Math.cos(angle);
                      const yD = rD * Math.sin(angle);

                      return (
                        <line
                          key={`link-d-${dIdx}`}
                          x1="0"
                          y1="0"
                          x2={xD}
                          y2={yD}
                          stroke="#06b6d4"
                          strokeWidth="1.5"
                          strokeOpacity="0.4"
                        />
                      );
                    })}

                    {/* 2. Connections between Domains and Covered/Pending Topics */}
                    {examMapData.nodes.filter(n => n.type === "covered_topic" || n.type === "pending_topic").map((node, tIdx) => {
                      const domIndex = examMapData.domains.findIndex(d => d.name.toLowerCase() === (node.domain || "").toLowerCase());
                      const effectiveDomIdx = domIndex >= 0 ? domIndex : 0;
                      const totalD = examMapData.domains.length || 1;
                      const baseAngle = (effectiveDomIdx / totalD) * 2 * Math.PI - Math.PI / 2;
                      
                      // Spread topics in fan around domain hub
                      const offsetAngle = ((tIdx % 3) - 1) * 0.28;
                      const finalAngle = baseAngle + offsetAngle;
                      const rTopic = 230 + (tIdx % 2) * 20;
                      const xT = rTopic * Math.cos(finalAngle);
                      const yT = rTopic * Math.sin(finalAngle);

                      const rD = 135;
                      const xD = rD * Math.cos(baseAngle);
                      const yD = rD * Math.sin(baseAngle);

                      const isSelected = selectedExamNode?.id === node.id;
                      const isCovered = node.type === "covered_topic";

                      return (
                        <g key={`topic-line-${node.id}`}>
                          <line
                            x1={xD}
                            y1={yD}
                            x2={xT}
                            y2={yT}
                            stroke={isSelected ? "#8b5cf6" : isCovered ? "#10b981" : "#f43f5e"}
                            strokeWidth={isSelected ? 2 : 1}
                            strokeOpacity={isCovered ? 0.6 : 0.3}
                            strokeDasharray={isCovered ? "none" : "3 3"}
                          />
                        </g>
                      );
                    })}

                    {/* 3. Center Node: The Exam Target */}
                    <g className="cursor-pointer" onClick={() => setSelectedExamNode({ type: "exam", raw: examMapData })}>
                      <circle cx="0" cy="0" r="42" fill="#0f0f14" stroke="#8b5cf6" strokeWidth="3" />
                      <circle cx="0" cy="0" r="48" fill="none" stroke="#a78bfa" strokeWidth="1" strokeDasharray="3 3" className="animate-[spin_20s_linear_infinite]" />
                      <foreignObject x="-28" y="-28" width="56" height="56">
                        <div className="w-full h-full flex flex-col items-center justify-center text-center">
                          <Trophy className="h-5 w-5 text-amber-400 mb-0.5" />
                          <span className="text-[10px] font-black text-white font-mono">{examMapData.preparation_score}%</span>
                        </div>
                      </foreignObject>
                      <text x="0" y="58" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="bold">
                        {examMapData.exam.length > 15 ? examMapData.exam.slice(0, 14) + ".." : examMapData.exam}
                      </text>
                    </g>

                    {/* 4. Domain Hub Nodes */}
                    {examMapData.domains.map((dom, dIdx) => {
                      const totalD = examMapData.domains.length || 1;
                      const angle = (dIdx / totalD) * 2 * Math.PI - Math.PI / 2;
                      const rD = 135;
                      const xD = rD * Math.cos(angle);
                      const yD = rD * Math.sin(angle);
                      const isSelected = selectedExamNode?.id === `domain-${dIdx}`;

                      return (
                        <g
                          key={`dom-node-${dIdx}`}
                          transform={`translate(${xD}, ${yD})`}
                          onClick={() => setSelectedExamNode({ id: `domain-${dIdx}`, type: "domain", raw: dom })}
                          className="cursor-pointer group"
                        >
                          <circle
                            cx="0"
                            cy="0"
                            r={isSelected ? "22" : "18"}
                            fill="#111827"
                            stroke={isSelected ? "#fff" : "#06b6d4"}
                            strokeWidth={isSelected ? 3 : 2}
                          />
                          <foreignObject x="-12" y="-12" width="24" height="24">
                            <div className="w-full h-full flex items-center justify-center text-cyan-300">
                              <BookOpen className="h-3.5 w-3.5" />
                            </div>
                          </foreignObject>
                          <text
                            x="0"
                            y={isSelected ? "32" : "28"}
                            textAnchor="middle"
                            fill={isSelected ? "#fff" : "#93c5fd"}
                            fontSize="9"
                            fontWeight={isSelected ? "bold" : "normal"}
                          >
                            {dom.name.length > 13 ? dom.name.slice(0, 11) + ".." : dom.name}
                          </text>
                          <text
                            x="0"
                            y={isSelected ? "41" : "37"}
                            textAnchor="middle"
                            fill="#6ee7b7"
                            fontSize="8"
                            fontWeight="bold"
                          >
                            {dom.percentage}%
                          </text>
                        </g>
                      );
                    })}

                    {/* 5. Topic Nodes (Covered & Pending) */}
                    {examMapData.nodes.filter(n => n.type === "covered_topic" || n.type === "pending_topic").map((node, tIdx) => {
                      const domIndex = examMapData.domains.findIndex(d => d.name.toLowerCase() === (node.domain || "").toLowerCase());
                      const effectiveDomIdx = domIndex >= 0 ? domIndex : 0;
                      const totalD = examMapData.domains.length || 1;
                      const baseAngle = (effectiveDomIdx / totalD) * 2 * Math.PI - Math.PI / 2;
                      
                      const offsetAngle = ((tIdx % 3) - 1) * 0.28;
                      const finalAngle = baseAngle + offsetAngle;
                      const rTopic = 230 + (tIdx % 2) * 20;
                      const xT = rTopic * Math.cos(finalAngle);
                      const yT = rTopic * Math.sin(finalAngle);

                      const isSelected = selectedExamNode?.id === node.id;
                      const isCovered = node.type === "covered_topic";

                      return (
                        <g
                          key={`topic-node-${node.id}`}
                          transform={`translate(${xT}, ${yT})`}
                          onClick={() => setSelectedExamNode({ id: node.id, type: node.type, raw: node })}
                          className="cursor-pointer group"
                        >
                          <circle
                            cx="0"
                            cy="0"
                            r={isSelected ? "18" : "14"}
                            fill={isCovered ? "#064e3b" : "#4c0519"}
                            stroke={isSelected ? "#fff" : isCovered ? "#10b981" : "#f43f5e"}
                            strokeWidth={isSelected ? 3 : 1.5}
                            strokeDasharray={isCovered ? "none" : "2 2"}
                            className="transition-all duration-300"
                          />
                          <foreignObject x="-8" y="-8" width="16" height="16">
                            <div className={`w-full h-full flex items-center justify-center ${isCovered ? "text-emerald-300" : "text-rose-300"}`}>
                              {isCovered ? <Check className="h-3 w-3" /> : <Clock3 className="h-3 w-3" />}
                            </div>
                          </foreignObject>
                          <text
                            x="0"
                            y={isSelected ? "26" : "22"}
                            textAnchor="middle"
                            fill={isSelected ? "#fff" : isCovered ? "#a7f3d0" : "#fecdd3"}
                            fontSize="8"
                            fontWeight={isSelected ? "bold" : "normal"}
                          >
                            {node.label.length > 14 ? node.label.slice(0, 12) + ".." : node.label}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              ) : null}

              {/* Selected Node Details & Action Drawer */}
              {selectedExamNode && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 rounded-2xl bg-neutral-900/95 border border-violet-500/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full ${
                        selectedExamNode.raw?.type === "covered_topic" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" :
                        selectedExamNode.raw?.type === "pending_topic" ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" :
                        "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                      }`}>
                        {selectedExamNode.raw?.type === "covered_topic" ? "Covered in Past Searches" :
                         selectedExamNode.raw?.type === "pending_topic" ? "Pending Syllabus Topic" : "Syllabus Domain"}
                      </span>
                      <span className="text-sm font-bold text-white">
                        {selectedExamNode.raw?.label || selectedExamNode.raw?.name}
                      </span>
                      {selectedExamNode.raw?.mastery !== undefined && selectedExamNode.raw.mastery > 0 && (
                        <span className="text-xs text-emerald-400 font-mono font-bold">
                          {selectedExamNode.raw.mastery}% Readiness
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-neutral-300">
                      {selectedExamNode.raw?.query ? (
                        <>
                          <span className="text-neutral-500 mr-1.5 font-semibold">Your Search:</span>
                          <span className="italic text-neutral-200">"{selectedExamNode.raw.query}"</span>
                          <span className="text-neutral-500 ml-2 font-mono text-[10px]">
                            ({selectedExamNode.raw.source || "Chat"} • {selectedExamNode.raw.date || "Recent"})
                          </span>
                        </>
                      ) : (
                        selectedExamNode.raw?.description || "Select a node to inspect your preparation status."
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/chat/ai-chat?topic=${encodeURIComponent(selectedExamNode.raw?.label || selectedExamNode.raw?.name || "")}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-md transition-all"
                    >
                      <MessageSquare className="h-3 w-3" />
                      Ask in AI Chat
                    </Link>

                    <Link
                      href={`/chat/tutor?topic=${encodeURIComponent(selectedExamNode.raw?.label || selectedExamNode.raw?.name || "")}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold border border-white/10 transition-all"
                    >
                      <GraduationCap className="h-3.5 w-3.5 text-amber-400" />
                      Revise in AI Tutor
                    </Link>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* VIEW 2: SEARCHES & STUDY TIMELINE */}
          {examSubView === "timeline" && (
            <div className="bg-neutral-950/80 border border-white/10 rounded-3xl p-6 shadow-xl">
              <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-violet-400" />
                Previous Searches & Inquiries Related to {examMapData?.exam || examInput}
              </h3>
              <p className="text-xs text-neutral-400 mb-6">
                All questions and topics you previously researched or discussed with VOXA AI that map to this exam's syllabus.
              </p>

              {(!examMapData?.previous_searches || examMapData.previous_searches.length === 0) ? (
                <div className="py-12 text-center text-neutral-400 bg-neutral-900/40 rounded-2xl border border-white/5">
                  <BookOpen className="h-8 w-8 mx-auto text-neutral-600 mb-2" />
                  <p className="text-sm font-semibold text-white">No previous searches recorded for this exam yet</p>
                  <p className="text-xs text-neutral-500 mt-1">
                    Start asking questions about this exam in AI Chat or AI Tutor, and they will automatically map here!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {examMapData.previous_searches.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-neutral-900/70 border border-white/10 hover:border-violet-500/40 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-white">{item.topic}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                            {item.domain}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 font-mono">
                            {item.mastery}% Readiness
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400 italic">
                          "{item.query}"
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 text-xs">
                        <span className="text-neutral-500 text-[11px] font-mono">
                          {item.source} • {item.date}
                        </span>
                        <Link
                          href={`/chat/ai-chat?topic=${encodeURIComponent(item.topic)}`}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-violet-600/30 text-neutral-300 hover:text-white border border-white/10 text-[11px] font-medium"
                        >
                          Revise Topic
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VIEW 3: DOMAIN MASTERY BREAKDOWN */}
          {examSubView === "domains" && (
            <div className="bg-neutral-950/80 border border-white/10 rounded-3xl p-6 shadow-xl space-y-6">
              <div>
                <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-cyan-400" />
                  Syllabus Domains & Topic Completion Rates
                </h3>
                <p className="text-xs text-neutral-400">
                  Track how thoroughly you have prepared each subject area based on your questions, notes, and tutor sessions.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {examMapData?.domains.map((dom, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-neutral-900/70 border border-white/10 hover:border-cyan-500/30 transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white">{dom.name}</h4>
                      <span className="text-sm font-mono font-black text-cyan-400">{dom.percentage}%</span>
                    </div>

                    <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-700"
                        style={{ width: `${dom.percentage}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-neutral-400 pt-1">
                      <span>{dom.covered_count} of {dom.total_count} topics covered in searches</span>
                      <span className="text-neutral-500">{dom.total_count - dom.covered_count} pending</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recommended Next Topics Box */}
              {examMapData?.recommended_next_topics && examMapData.recommended_next_topics.length > 0 && (
                <div className="mt-6 p-5 rounded-2xl bg-amber-950/20 border border-amber-500/30">
                  <div className="flex items-center gap-2 mb-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
                    <Flame className="h-4 w-4" />
                    Recommended Next Focus to Reach 100% Preparation
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {examMapData.recommended_next_topics.map((top, idx) => (
                      <Link
                        key={idx}
                        href={`/chat/tutor?topic=${encodeURIComponent(top)}`}
                        className="p-3 rounded-xl bg-neutral-900/80 border border-amber-500/20 hover:border-amber-500/50 text-xs text-neutral-200 hover:text-white transition-all flex items-center justify-between group"
                      >
                        <span className="font-semibold">{top}</span>
                        <ArrowRight className="h-3.5 w-3.5 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: GLOBAL INTERACTIVE MIND GRAPH                                      */}
      {/* ========================================================================= */}
      {activeTab === "graph" && (
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

          <div className="relative w-full h-[460px] flex items-center justify-center overflow-hidden">
            <svg className="w-full h-full" viewBox="-300 -200 600 400">
              <defs>
                <radialGradient id="userGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                </radialGradient>
              </defs>

              <circle cx="0" cy="0" r="140" fill="url(#userGlow)" />
              <circle cx="0" cy="0" r="180" fill="none" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
              <circle cx="0" cy="0" r="100" fill="none" stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />

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
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CONTROL PANEL CARDS                                                */}
      {/* ========================================================================= */}
      {activeTab === "cards" && (
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
