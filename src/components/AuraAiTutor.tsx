import React, { useEffect, useState, useRef } from 'react';
import { Sparkles, Volume2, VolumeX, HelpCircle } from 'lucide-react';

interface AuraAiTutorProps {
  message: string;
  voiceText?: string;
  highlightedStep?: string;
  isMuted: boolean;
  onToggleMute: () => void;
  accentColor?: string;
  lang: 'ID' | 'EN';
}

export default function AuraAiTutor({
  message,
  voiceText,
  highlightedStep,
  isMuted,
  onToggleMute,
  accentColor = 'emerald',
  lang
}: AuraAiTutorProps) {
  const [pulse, setPulse] = useState(true);
  const activeVoiceTextRef = useRef<string | null>(null);

  useEffect(() => {
    // Pulse animation timer
    const interval = setInterval(() => {
      setPulse(p => !p);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Trigger web speech synthesis for elderly accessibility
  useEffect(() => {
    const textToSpeak = voiceText || message;
    if (isMuted || !('speechSynthesis' in window)) return;

    // Prevent repeating the same message in rapid succession
    if (activeVoiceTextRef.current === textToSpeak) return;
    activeVoiceTextRef.current = textToSpeak;

    // Speak
    try {
      window.speechSynthesis.cancel();
      const cleanText = textToSpeak.replace(/[Rp\.]/g, '').replace(/IID/g, 'I I D');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = lang === 'ID' ? 'id-ID' : 'en-US';
      utterance.rate = 0.95;    // Slightly slower for comprehension
      utterance.pitch = 1.05;   // Warm tone

      const voices = window.speechSynthesis.getVoices();
      if (lang === 'ID') {
        const idVoice = voices.find(v => v.lang.includes('id') || v.name.toLowerCase().includes('indonesian'));
        if (idVoice) utterance.voice = idVoice;
      } else {
        const enVoice = voices.find(v => v.lang.includes('en') || v.name.toLowerCase().includes('english'));
        if (enVoice) utterance.voice = enVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis failed:', e);
    }
  }, [message, voiceText, isMuted, lang]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          {/* Animated pulsing AURA Core */}
          <div className="relative flex h-5 w-5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-${accentColor}-400 opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-5 w-5 bg-${accentColor}-500 shadow-lg flex items-center justify-center`}>
              <Sparkles className="w-3 h-3 text-white" />
            </span>
          </div>
          <div>
            <span className="font-sans font-semibold text-xs tracking-wider text-slate-300">AURA AI</span>
            <span className="text-[10px] text-slate-500 ml-2 font-mono">{lang === 'ID' ? 'Bimbingan Lansia Aktif' : 'Active Elderly Guidance'}</span>
          </div>
        </div>

        {/* Audio speaker toggle for TTS spoken accessibility instructions */}
        <button
          onClick={onToggleMute}
          title={isMuted ? (lang === 'ID' ? "Aktifkan bimbingan suara" : "Unmute voice assistance") : (lang === 'ID' ? "Senyapkan suara" : "Mute voice assistance")}
          className={`p-1.5 rounded-lg border transition-all ${
            isMuted 
              ? 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-400' 
              : 'bg-emerald-950/40 border-emerald-800 text-emerald-400 hover:bg-emerald-950/70'
          }`}
          id={`${accentColor}-voice-toggle`}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 animate-bounce" />}
        </button>
      </div>

      <div className="relative bg-slate-950 rounded-xl p-3 border border-slate-800/80">
        <p className="font-sans text-sm text-slate-200 leading-relaxed font-semibold">
          "{message}"
        </p>

        {highlightedStep && (
          <div className="mt-2.5 pt-2 border-t border-slate-900 flex items-center gap-1.5 text-[11px] text-slate-400">
            <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
            <span>{lang === 'ID' ? 'Petunjuk:' : 'Task:'} {highlightedStep}</span>
          </div>
        )}
      </div>
    </div>
  );
}
