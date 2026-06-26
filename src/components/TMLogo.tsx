import React, { useState } from 'react';

interface TMLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function TMLogo({ className = '', size = 'md' }: TMLogoProps) {
  const [hasError, setHasError] = useState(false);

  const dimensionClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-12 w-12 text-sm',
    lg: 'h-16 w-16 text-lg'
  };

  if (hasError) {
    // Elegant Cyberpunk glowing fallback with custom css
    return (
      <div 
        className={`inline-flex items-center justify-center rounded-xl bg-slate-950 border border-emerald-500/40 relative overflow-hidden select-none shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.3)] ${dimensionClasses[size]} ${className}`}
        style={{ fontFamily: '"JetBrains Mono", monospace' }}
      >
        {/* Futuristic circuit grid lines behind */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:10px_10px]"></div>
        
        {/* Holographic glowing text */}
        <span className="relative font-mono font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 animate-pulse">
          TM
        </span>
        
        {/* Cybernetic accent dot */}
        <div className="absolute top-1 right-1 h-1 w-1 rounded-full bg-cyan-400 animate-ping"></div>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center justify-center rounded-xl overflow-hidden shrink-0 border border-emerald-500/30 bg-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.25)] ${dimensionClasses[size]} ${className}`}>
      <img 
        src="/logo.jpg" 
        alt="TM Logo" 
        className="w-full h-full object-cover" 
        onError={() => setHasError(true)}
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
