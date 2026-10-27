export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm select-none">
      <div className="relative flex items-center justify-center">
        {/* Soft neon glow */}
        <div className="absolute -inset-4 bg-gradient-to-r from-violet-600/30 to-fuchsia-600/30 rounded-full blur-xl animate-pulse" />
        
        {/* 💫 Spinning loading emblem */}
        <div className="relative text-5xl animate-spin [animation-duration:2.5s] drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">
          💫
        </div>
      </div>
      <span className="mt-4 text-xs font-mono tracking-widest uppercase text-neutral-400 animate-pulse">
        Loading...
      </span>
    </div>
  );
}
