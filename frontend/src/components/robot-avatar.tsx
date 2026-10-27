"use client"

import * as React from "react"
import { Loader2, Mic, MicOff, Volume2 } from "lucide-react"

interface RobotAvatarProps {
  isListening: boolean
  isSpeaking: boolean
  isProcessing: boolean
  onClick: () => void
  disabled?: boolean
}

export function RobotAvatar({
  isListening,
  isSpeaking,
  isProcessing,
  onClick,
  disabled = false
}: RobotAvatarProps) {
  return (
    <div className="relative flex flex-col items-center justify-center select-none group cursor-pointer" onClick={disabled ? undefined : onClick}>
      
      {/* Outer Soundwave / Energy Aura Rings */}
      <div 
        className={`
          absolute w-72 h-72 rounded-full transition-all duration-700 pointer-events-none
          ${isListening 
            ? 'bg-red-500/20 scale-125 blur-2xl animate-pulse' 
            : isSpeaking 
            ? 'bg-cyan-500/20 scale-110 blur-2xl animate-pulse' 
            : isProcessing
            ? 'bg-purple-500/20 scale-105 blur-xl animate-spin'
            : 'bg-indigo-500/10 scale-90 blur-xl group-hover:scale-100 group-hover:bg-indigo-500/20'
          }
        `} 
      />

      {/* Outer Wave Rings */}
      {(isListening || isSpeaking) && (
        <>
          <div className="absolute w-80 h-80 border border-cyan-400/30 rounded-full animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite] pointer-events-none" />
          <div className="absolute w-96 h-96 border border-purple-500/20 rounded-full animate-[ping_4s_cubic-bezier(0,0,0.2,1)_infinite_1s] pointer-events-none" />
        </>
      )}

      {/* 3D Robot Figure Vector Container */}
      <div className={`relative z-10 w-64 h-72 transition-transform duration-500 ${isListening ? 'scale-105' : 'group-hover:scale-105'}`}>
        
        <svg viewBox="0 0 200 240" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_20px_30px_rgba(0,0,0,0.7)]">
          
          {/* Shadow beneath Robot */}
          <ellipse cx="100" cy="225" rx="55" ry="8" fill="#000000" fillOpacity="0.4" className="animate-pulse" />

          {/* --- LEGS & FEET --- */}
          {/* Left Leg */}
          <rect x="70" y="160" width="22" height="40" rx="6" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="2" />
          <rect x="73" y="175" width="16" height="6" rx="2" fill="#64748B" />
          <ellipse cx="78" cy="205" rx="18" ry="10" fill="#CBD5E1" stroke="#64748B" strokeWidth="2" />

          {/* Right Leg */}
          <rect x="108" y="160" width="22" height="40" rx="6" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="2" />
          <rect x="111" y="175" width="16" height="6" rx="2" fill="#64748B" />
          <ellipse cx="122" cy="205" rx="18" ry="10" fill="#CBD5E1" stroke="#64748B" strokeWidth="2" />

          {/* --- ARMS --- */}
          {/* Left Arm (Resting) */}
          <g className="transition-transform duration-300 origin-[45px_100px]">
            <rect x="34" y="98" width="16" height="45" rx="8" fill="#CBD5E1" stroke="#64748B" strokeWidth="2" />
            <circle cx="42" cy="148" r="8" fill="#475569" />
          </g>

          {/* Right Arm (Waving / Animated) */}
          <g className={`transition-transform duration-500 origin-[155px_100px] ${isSpeaking || isListening ? 'animate-[bounce_1s_infinite]' : 'group-hover:rotate-12'}`}>
            {/* Upper Arm */}
            <path d="M 155 100 L 175 80 L 170 65" stroke="#CBD5E1" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 155 100 L 175 80 L 170 65" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            {/* Waving Hand */}
            <circle cx="168" cy="58" r="8" fill="#475569" />
            <path d="M 162 52 L 160 44 M 168 50 L 168 42 M 174 52 L 176 44" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
          </g>

          {/* --- TORSO / BODY --- */}
          {/* Main White Body Shell */}
          <rect x="52" y="90" width="96" height="75" rx="20" fill="url(#bodyGradient)" stroke="#CBD5E1" strokeWidth="3" />
          
          {/* Dark Metallic Chest Plate */}
          <rect x="64" y="102" width="72" height="50" rx="12" fill="#1E293B" stroke="#475569" strokeWidth="2" />

          {/* Chest Power Symbol (Glows based on state) */}
          <rect x="88" y="116" width="24" height="22" rx="6" fill="#0F172A" stroke={isListening ? "#EF4444" : isSpeaking ? "#22D3EE" : "#818CF8"} strokeWidth="2" />
          
          {/* Power Symbol Icon / Glow Dot */}
          <circle 
            cx="100" 
            cy="127" 
            r="4" 
            fill={isListening ? "#EF4444" : isSpeaking ? "#22D3EE" : "#818CF8"} 
            className={`transition-all duration-300 ${isListening || isSpeaking ? 'animate-ping' : ''}`} 
          />

          {/* --- NECK --- */}
          <rect x="86" y="80" width="28" height="14" rx="4" fill="#475569" />

          {/* --- HEAD & FACE --- */}
          <g className={`transition-transform duration-700 origin-[100px_50px] ${isSpeaking ? 'animate-[pulse_1.5s_infinite]' : isListening ? 'animate-[bounce_2s_infinite]' : ''}`}>
            
            {/* Outer Ear Caps (Headphones) */}
            <circle cx="36" cy="52" r="13" fill="#64748B" stroke="#334155" strokeWidth="2" />
            <circle cx="36" cy="52" r="6" fill={isListening ? "#EF4444" : isSpeaking ? "#22D3EE" : "#818CF8"} />

            <circle cx="164" cy="52" r="13" fill="#64748B" stroke="#334155" strokeWidth="2" />
            <circle cx="164" cy="52" r="6" fill={isListening ? "#EF4444" : isSpeaking ? "#22D3EE" : "#818CF8"} />

            {/* Helmet Outer Shell */}
            <rect x="42" y="18" width="116" height="70" rx="32" fill="url(#helmetGradient)" stroke="#E2E8F0" strokeWidth="3" />

            {/* Black Screen Faceplate */}
            <rect x="52" y="26" width="96" height="52" rx="22" fill="#020617" stroke="#1E293B" strokeWidth="2" />

            {/* --- GLOWING DIGITAL EYES --- */}
            {/* Left Eye */}
            <g className="transition-all duration-300">
              <ellipse 
                cx="78" 
                cy="48" 
                rx={isListening ? "11" : "10"} 
                ry={isListening ? "14" : "12"} 
                fill={isListening ? "#EF4444" : isSpeaking ? "#22D3EE" : "#38BDF8"} 
                className="transition-all duration-300"
              />
              {/* Pupil Reflection */}
              <circle cx="75" cy="44" r="3.5" fill="#FFFFFF" />
              <circle cx="81" cy="51" r="1.5" fill="#FFFFFF" opacity="0.8" />
            </g>

            {/* Right Eye */}
            <g className="transition-all duration-300">
              <ellipse 
                cx="122" 
                cy="48" 
                rx={isListening ? "11" : "10"} 
                ry={isListening ? "14" : "12"} 
                fill={isListening ? "#EF4444" : isSpeaking ? "#22D3EE" : "#38BDF8"} 
                className="transition-all duration-300"
              />
              {/* Pupil Reflection */}
              <circle cx="119" cy="44" r="3.5" fill="#FFFFFF" />
              <circle cx="125" cy="51" r="1.5" fill="#FFFFFF" opacity="0.8" />
            </g>

            {/* --- DYNAMIC MOUTH / EQUALIZER SOUNDWAVE --- */}
            {isSpeaking || isListening ? (
              <g className="flex items-center justify-center">
                {/* 4 Bouncing Equalizer Bars */}
                <rect x="88" y="64" width="4" height="6" rx="2" fill={isListening ? "#EF4444" : "#22D3EE"} className="animate-[bounce_0.6s_infinite_0.1s]" />
                <rect x="95" y="62" width="4" height="10" rx="2" fill={isListening ? "#EF4444" : "#22D3EE"} className="animate-[bounce_0.6s_infinite_0.3s]" />
                <rect x="102" y="62" width="4" height="10" rx="2" fill={isListening ? "#EF4444" : "#22D3EE"} className="animate-[bounce_0.6s_infinite_0.2s]" />
                <rect x="109" y="64" width="4" height="6" rx="2" fill={isListening ? "#EF4444" : "#22D3EE"} className="animate-[bounce_0.6s_infinite_0.4s]" />
              </g>
            ) : (
              /* Cute Default Smile Arc */
              <path d="M 90 65 Q 100 71 110 65" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.7" />
            )}

          </g>

          {/* Gradients */}
          <defs>
            <linearGradient id="helmetGradient" x1="42" y1="18" x2="158" y2="88" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="60%" stopColor="#F1F5F9" />
              <stop offset="100%" stopColor="#CBD5E1" />
            </linearGradient>
            <linearGradient id="bodyGradient" x1="52" y1="90" x2="148" y2="165" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="70%" stopColor="#E2E8F0" />
              <stop offset="100%" stopColor="#94A3B8" />
            </linearGradient>
          </defs>

        </svg>

      </div>

      {/* Floating Status Badge below Robot */}
      <div className={`
        mt-4 px-5 py-2 rounded-full backdrop-blur-xl border text-xs font-bold tracking-wide uppercase shadow-lg transition-all duration-300 flex items-center gap-2
        ${isListening 
          ? 'bg-red-500/20 border-red-500/40 text-red-300 shadow-[0_0_20px_rgba(239,68,68,0.3)]' 
          : isSpeaking 
          ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.3)]' 
          : isProcessing
          ? 'bg-purple-500/20 border-purple-500/40 text-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
          : 'bg-neutral-900/80 border-neutral-800 text-neutral-400 group-hover:border-indigo-500/50 group-hover:text-indigo-300'
        }
      `}>
        {isProcessing ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
            <span>Thinking...</span>
          </>
        ) : isListening ? (
          <>
            <Mic className="w-3.5 h-3.5 animate-pulse text-red-400" />
            <span>Listening... (Tap robot to stop)</span>
          </>
        ) : isSpeaking ? (
          <>
            <Volume2 className="w-3.5 h-3.5 animate-bounce text-cyan-400" />
            <span>Voxa AI Speaking...</span>
          </>
        ) : (
          <>
            <MicOff className="w-3.5 h-3.5 text-neutral-500 group-hover:text-indigo-400" />
            <span>Tap Voxa Robot to Speak</span>
          </>
        )}
      </div>

    </div>
  )
}
