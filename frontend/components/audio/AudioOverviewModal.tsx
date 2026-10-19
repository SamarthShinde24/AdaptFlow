"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  X,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
  Download,
  Sparkles,
  Radio,
  BookOpen,
  Volume2,
  VolumeX,
  RefreshCw,
  Search,
  CheckCircle2,
  Users,
  Copy,
  Check,
  MessageSquare,
  Moon,
  Sliders,
  ChevronDown,
} from "lucide-react";
import { useAudioOverview } from "@/context/AudioOverviewContext";
import { AudioWaveform } from "./AudioWaveform";
import { cn } from "@/lib/utils";
import { SleepTimerDuration } from "@/lib/types";
import { toast } from "sonner";

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function AudioOverviewModal() {
  const {
    currentEpisode,
    activeSegmentIndex,
    isPlaying,
    currentTime,
    totalDuration,
    playbackSpeed,
    volume,
    isMuted,
    currentSpeaker,
    isModalOpen,
    availableEpisodes,
    activeSleepTimerDuration,
    sleepTimerRemaining,
    voiceConfig,
    availableVoices,
    activeWord,
    closeModal,
    togglePlay,
    seekSegment,
    skipBackward,
    skipForward,
    setPlaybackSpeed,
    setVolume,
    toggleMute,
    setSleepTimer,
    updateVoiceConfig,
    playEpisode,
    exportTranscript,
    generateAndPlay,
    isGenerating,
    sendToChat,
  } = useAudioOverview();

  const [transcriptSearch, setTranscriptSearch] = useState("");
  const [selectedFormat, setSelectedFormat] = useState<"deep_dive" | "quick_sprint" | "exam_pitfalls">("deep_dive");
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [showSleepMenu, setShowSleepMenu] = useState(false);
  const [copiedTurnId, setCopiedTurnId] = useState<string | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ percent: number; timeSec: number } | null>(null);

  const transcriptContainerRef = useRef<HTMLDivElement>(null);
  const activeSegmentRef = useRef<HTMLDivElement>(null);

  // Auto-scroll active segment into view
  useEffect(() => {
    if (activeSegmentRef.current && transcriptContainerRef.current) {
      activeSegmentRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [activeSegmentIndex]);

  // Global keyboard shortcuts within modal
  useEffect(() => {
    if (!isModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in search
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        skipBackward(15);
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        skipForward(15);
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        toggleMute();
      } else if (e.key === "Escape") {
        closeModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen, togglePlay, skipBackward, skipForward, toggleMute, closeModal]);

  // Compute turn boundaries along track (declared before early return to follow React Hook rules)
  const turnBoundaries = useMemo(() => {
    if (!currentEpisode?.segments) return [];
    let accumulated = 0;
    return currentEpisode.segments.map((seg, i) => {
      const startPercent = totalDuration > 0 ? (accumulated / totalDuration) * 100 : 0;
      accumulated += seg.duration_estimate_sec || 5;
      return { index: i, startPercent, speaker: seg.speaker };
    });
  }, [currentEpisode?.segments, totalDuration]);

  if (!isModalOpen || !currentEpisode) {
    return null;
  }

  const progressPercent = totalDuration > 0
    ? Math.min(100, Math.max(0, (currentTime / totalDuration) * 100))
    : 0;

  const handleSeekTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetTime = clickRatio * totalDuration;

    let accumulated = 0;
    for (let i = 0; i < currentEpisode.segments.length; i++) {
      const dur = currentEpisode.segments[i].duration_estimate_sec || 5;
      if (accumulated + dur >= targetTime || i === currentEpisode.segments.length - 1) {
        seekSegment(i);
        break;
      }
      accumulated += dur;
    }
  };

  const handleTrackMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverPosition({
      percent: ratio * 100,
      timeSec: ratio * totalDuration,
    });
  };

  const handleTrackMouseLeave = () => {
    setHoverPosition(null);
  };

  const handlePreviousTurn = () => {
    if (activeSegmentIndex > 0) {
      seekSegment(activeSegmentIndex - 1);
    }
  };

  const handleNextTurn = () => {
    if (activeSegmentIndex < currentEpisode.segments.length - 1) {
      seekSegment(activeSegmentIndex + 1);
    }
  };

  const handleCopyQuote = (segId: string, text: string, speaker: string) => {
    const quote = `"${text}" — ${speaker} (AdaptFlow Audio Overview: ${currentEpisode.title})`;
    navigator.clipboard.writeText(quote);
    setCopiedTurnId(segId);
    toast.success("Quote copied to clipboard!");
    setTimeout(() => setCopiedTurnId(null), 2000);
  };

  const handleRegenerate = async () => {
    await generateAndPlay({
      materialIds: currentEpisode.material_ids,
      topic: currentEpisode.title.replace(/[:\-].*$/, "").trim(),
      durationTarget: selectedFormat,
    });
  };

  const filteredSegments = currentEpisode.segments.filter((s) => {
    if (!transcriptSearch.trim()) return true;
    const q = transcriptSearch.toLowerCase();
    return s.text.toLowerCase().includes(q) || s.speaker.toLowerCase().includes(q);
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Audio Overview Studio"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-5 animate-in fade-in duration-200"
      onClick={closeModal}
    >
      <div
        className="w-full max-w-5xl h-[92vh] max-h-[850px] flex flex-col rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#151619] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ========================================================================= */}
        {/* STUDIO HEADER                                                            */}
        {/* ========================================================================= */}
        <header className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-[#1a1b1e]/80">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#6C63FF]/10 border border-[#6C63FF]/30 text-[#6C63FF] dark:text-[#8B85FF]">
              <Radio className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#6C63FF] dark:text-[#8B85FF]">
                  Audio Overview Studio
                </span>
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  {currentEpisode.difficulty || "Interactive"}
                </span>
                {currentEpisode.format_target && (
                  <span className="rounded-full bg-[#6C63FF]/10 border border-[#6C63FF]/20 px-2 py-0.5 text-[10px] font-bold text-[#6C63FF] dark:text-[#8B85FF] capitalize">
                    {currentEpisode.format_target.replace("_", " ")}
                  </span>
                )}
              </div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
                {currentEpisode.title}
              </h2>
            </div>
          </div>

          {/* Header Action Tools */}
          <div className="flex items-center gap-2">
            {/* Sleep Timer Selector Pill */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSleepMenu((prev) => !prev)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition-all shadow-2xs",
                  activeSleepTimerDuration !== 0
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
                    : "border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700"
                )}
                title="Configure Sleep Timer"
              >
                <Moon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">
                  {sleepTimerRemaining !== null
                    ? `${formatTime(sleepTimerRemaining)}`
                    : activeSleepTimerDuration === -1
                    ? "End"
                    : "Sleep"}
                </span>
                <ChevronDown className="h-3 w-3 opacity-60" />
              </button>

              {showSleepMenu && (
                <div className="absolute right-0 top-full mt-1.5 w-48 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 shadow-xl p-1.5 z-50 space-y-0.5 animate-in fade-in zoom-in-95">
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Sleep Timer
                  </div>
                  {[
                    { label: "Off", value: 0 as SleepTimerDuration },
                    { label: "5 minutes", value: 300 as SleepTimerDuration },
                    { label: "10 minutes", value: 600 as SleepTimerDuration },
                    { label: "15 minutes", value: 900 as SleepTimerDuration },
                    { label: "End of Episode", value: -1 as SleepTimerDuration },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setSleepTimer(opt.value);
                        setShowSleepMenu(false);
                      }}
                      className={cn(
                        "w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center justify-between",
                        activeSleepTimerDuration === opt.value
                          ? "bg-[#6C63FF]/10 text-[#6C63FF] dark:text-[#8B85FF]"
                          : "text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
                      )}
                    >
                      <span>{opt.label}</span>
                      {activeSleepTimerDuration === opt.value && (
                        <Check className="h-3.5 w-3.5 text-[#6C63FF]" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Voice Tuning Toggle */}
            <button
              type="button"
              onClick={() => setShowVoiceSettings((prev) => !prev)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition-all shadow-2xs",
                showVoiceSettings
                  ? "bg-[#6C63FF]/15 border-[#6C63FF]/40 text-[#6C63FF] dark:text-[#8B85FF]"
                  : "border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700"
              )}
              title="Tune Alex & Jordan voice parameters"
            >
              <Sliders className="h-3.5 w-3.5 text-[#6C63FF]" />
              <span className="hidden sm:inline">Voices</span>
            </button>

            {/* Export Transcript */}
            <button
              type="button"
              onClick={exportTranscript}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-800 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors shadow-2xs"
              title="Download full podcast transcript as Markdown"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Export</span>
            </button>

            {/* Close Modal */}
            <button
              type="button"
              onClick={closeModal}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-zinc-800 transition-colors"
              title="Close modal (Esc)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* COLLAPSIBLE VOICE SETTINGS DRAWER                                         */}
        {/* ========================================================================= */}
        {showVoiceSettings && (
          <div className="border-b border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-zinc-900/90 px-6 py-4 animate-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-[#6C63FF]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Dual-Voice Timbre Studio & Voice Engine
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowVoiceSettings(false)}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Alex Tuning Card */}
              <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#151619] p-3.5 space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#6C63FF] text-white text-[10px] font-bold">
                    A
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Alex (Host & Analogy Lead)
                  </span>
                </div>
                {availableVoices.length > 0 && (
                  <select
                    value={voiceConfig.alexVoiceName || ""}
                    onChange={(e) => updateVoiceConfig({ alexVoiceName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-zinc-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="">Default Natural Voice</option>
                    {availableVoices.map((v) => (
                      <option key={v.name} value={v.name}>
                        {v.name} ({v.lang})
                      </option>
                    ))}
                  </select>
                )}
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Pitch: {voiceConfig.alexPitch || 1.06}</span>
                  <input
                    type="range"
                    min="0.8"
                    max="1.4"
                    step="0.02"
                    value={voiceConfig.alexPitch || 1.06}
                    onChange={(e) => updateVoiceConfig({ alexPitch: parseFloat(e.target.value) })}
                    className="w-32 accent-[#6C63FF]"
                  />
                </div>
              </div>

              {/* Jordan Tuning Card */}
              <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#151619] p-3.5 space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                    J
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Jordan (Technical Specialist)
                  </span>
                </div>
                {availableVoices.length > 0 && (
                  <select
                    value={voiceConfig.jordanVoiceName || ""}
                    onChange={(e) => updateVoiceConfig({ jordanVoiceName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-zinc-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="">Default Analyst Voice</option>
                    {availableVoices.map((v) => (
                      <option key={v.name} value={v.name}>
                        {v.name} ({v.lang})
                      </option>
                    ))}
                  </select>
                )}
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Pitch: {voiceConfig.jordanPitch || 0.92}</span>
                  <input
                    type="range"
                    min="0.7"
                    max="1.2"
                    step="0.02"
                    value={voiceConfig.jordanPitch || 0.92}
                    onChange={(e) => updateVoiceConfig({ jordanPitch: parseFloat(e.target.value) })}
                    className="w-32 accent-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STUDIO BODY: 2 COLUMNS                                                    */}
        {/* ========================================================================= */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-white/10 overflow-hidden">
          {/* LEFT COLUMN: PLAYER CONTROLS & EPISODE SUMMARY */}
          <div className="lg:col-span-5 flex flex-col justify-between p-5 sm:p-6 overflow-y-auto space-y-5">
            <div className="space-y-4">
              {/* Cover Art Banner */}
              <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/10 bg-gradient-to-br from-[#6C63FF]/15 via-purple-500/10 to-emerald-500/15 p-5">
                <div className="flex items-start justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 dark:bg-zinc-900/80 border border-slate-200/80 dark:border-white/10 px-2.5 py-1 text-[11px] font-bold text-slate-800 dark:text-zinc-200 shadow-2xs">
                    <Sparkles className="h-3 w-3 text-[#6C63FF]" />
                    <span>~{Math.round(currentEpisode.duration_seconds / 60)} min Session</span>
                  </span>

                  <AudioWaveform
                    isPlaying={isPlaying}
                    speaker={currentSpeaker}
                    barCount={6}
                    size="md"
                    className="h-5"
                  />
                </div>

                <div className="mt-4">
                  <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white leading-snug">
                    {currentEpisode.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-600 dark:text-zinc-300 line-clamp-2">
                    {currentEpisode.subtitle}
                  </p>
                </div>

                {/* Hosts badge strip */}
                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#6C63FF] text-white text-[10px] font-bold">
                        A
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-zinc-200 text-[11px]">
                        Alex
                      </span>
                    </div>
                    <span className="text-slate-300 dark:text-zinc-600">&</span>
                    <div className="flex items-center gap-1.5">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                        J
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-zinc-200 text-[11px]">
                        Jordan
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400">
                    Dual-Voice AI
                  </span>
                </div>
              </div>

              {/* Episode Selector Dropdown */}
              {availableEpisodes.length > 1 && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    Switch Deep Dive Episode:
                  </label>
                  <select
                    value={currentEpisode.id}
                    onChange={(e) => {
                      const ep = availableEpisodes.find((x) => x.id === e.target.value);
                      if (ep) playEpisode(ep, 0);
                    }}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-zinc-800 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#6C63FF]"
                  >
                    {availableEpisodes.map((ep) => (
                      <option key={ep.id} value={ep.id}>
                        {ep.title} ({Math.round(ep.duration_seconds / 60)} min)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Key Takeaways Card */}
              {currentEpisode.key_takeaways?.length > 0 && (
                <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-zinc-900/60 p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                    <CheckCircle2 className="h-4 w-4 text-[#6C63FF]" />
                    <span>Core Takeaways from Study Notes</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-zinc-300 pl-1">
                    {currentEpisode.key_takeaways.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-2 leading-relaxed">
                        <span className="font-bold text-[#6C63FF] text-[11px] mt-0.5">
                          {idx + 1}.
                        </span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Transport & Playback Deck */}
            <div className="pt-4 border-t border-slate-200 dark:border-white/10 space-y-3.5">
              {/* Scrub Track with Turn Ticks and Hover Time */}
              <div className="space-y-1 relative">
                <div
                  onClick={handleSeekTrackClick}
                  onMouseMove={handleTrackMouseMove}
                  onMouseLeave={handleTrackMouseLeave}
                  className="group relative h-3 w-full rounded-full bg-slate-200 dark:bg-zinc-800 cursor-pointer overflow-hidden transition-all hover:h-3.5"
                  title="Click to seek position"
                >
                  {/* Progress Fill */}
                  <div
                    className="h-full bg-gradient-to-r from-[#6C63FF] to-emerald-500 rounded-full transition-all duration-150"
                    style={{ width: `${progressPercent}%` }}
                  />

                  {/* Turn Ticks */}
                  {turnBoundaries.map((tb) => (
                    <span
                      key={tb.index}
                      className={cn(
                        "absolute top-0 bottom-0 w-0.5 pointer-events-none opacity-40",
                        tb.speaker.toLowerCase().includes("jordan") ? "bg-emerald-300" : "bg-violet-300"
                      )}
                      style={{ left: `${tb.startPercent}%` }}
                    />
                  ))}
                </div>

                {/* Hover Preview Tooltip */}
                {hoverPosition && (
                  <div
                    className="absolute -top-7 -translate-x-1/2 rounded-md bg-slate-900 text-white text-[10px] font-mono px-1.5 py-0.5 shadow-md pointer-events-none"
                    style={{ left: `${hoverPosition.percent}%` }}
                  >
                    {formatTime(hoverPosition.timeSec)}
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-zinc-400">
                  <span className="tabular-nums font-semibold text-slate-700 dark:text-zinc-300">
                    {formatTime(currentTime)}
                  </span>
                  <span className="tabular-nums">
                    {formatTime(totalDuration)}
                  </span>
                </div>
              </div>

              {/* Main Transport Buttons */}
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handlePreviousTurn}
                  disabled={activeSegmentIndex <= 0}
                  title="Previous turn (J)"
                  className="p-2 rounded-full text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-30 transition-colors cursor-pointer"
                >
                  <SkipBack className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => skipBackward(15)}
                  title="Rewind 15 seconds (Left Arrow)"
                  className="p-2 rounded-full text-slate-600 hover:text-slate-900 dark:text-zinc-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={togglePlay}
                  title={isPlaying ? "Pause podcast (Space)" : "Play podcast (Space)"}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#6C63FF] hover:bg-[#5850EC] text-white shadow-lg active:scale-95 transition-all cursor-pointer"
                >
                  {isPlaying ? (
                    <Pause className="h-6 w-6 fill-current" />
                  ) : (
                    <Play className="h-6 w-6 fill-current ml-0.5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => skipForward(15)}
                  title="Forward 15 seconds (Right Arrow)"
                  className="p-2 rounded-full text-slate-600 hover:text-slate-900 dark:text-zinc-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <RotateCw className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={handleNextTurn}
                  disabled={activeSegmentIndex >= currentEpisode.segments.length - 1}
                  title="Next turn (K)"
                  className="p-2 rounded-full text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-30 transition-colors cursor-pointer"
                >
                  <SkipForward className="h-4 w-4" />
                </button>
              </div>

              {/* Volume & Speed Controls Strip */}
              <div className="flex items-center justify-between pt-1 text-xs">
                {/* Volume Slider & Mute Toggle */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={toggleMute}
                    className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
                    title={isMuted ? "Unmute (M)" : "Mute (M)"}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="h-4 w-4 text-red-500" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-16 sm:w-20 accent-[#6C63FF] h-1.5"
                    title={`Volume: ${Math.round(volume * 100)}%`}
                  />
                </div>

                {/* Speed buttons */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl">
                  {[0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setPlaybackSpeed(rate)}
                      className={cn(
                        "px-2 py-0.5 rounded-lg text-[10px] font-bold tabular-nums transition-all",
                        playbackSpeed === rate
                          ? "bg-white dark:bg-zinc-700 text-[#6C63FF] dark:text-white shadow-2xs"
                          : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                      )}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>

                {/* Regenerate trigger */}
                <button
                  type="button"
                  onClick={handleRegenerate}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-zinc-400 hover:text-[#6C63FF] dark:hover:text-white transition-colors cursor-pointer"
                  title="Regenerate this episode"
                >
                  <RefreshCw className={cn("h-3 w-3", isGenerating && "animate-spin")} />
                  <span>{isGenerating ? "Generating..." : "Regenerate"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: LIVE INTERACTIVE TRANSCRIPT WITH KARAOKE HIGHLIGHTING */}
          <div className="lg:col-span-7 flex flex-col h-full min-h-0 bg-white dark:bg-[#151619]">
            {/* Transcript Filter & Stats */}
            <div className="p-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[#6C63FF]" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Two-Host Dialogue Transcript ({currentEpisode.segments.length} turns)
                </h4>
              </div>

              <div className="relative w-44 sm:w-56">
                <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={transcriptSearch}
                  onChange={(e) => setTranscriptSearch(e.target.value)}
                  placeholder="Filter dialogue..."
                  className="w-full rounded-full border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-zinc-800 pl-8 pr-3 py-1 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#6C63FF]"
                />
              </div>
            </div>

            {/* Scrollable Transcript List */}
            <div
              ref={transcriptContainerRef}
              className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-zinc-700"
            >
              {filteredSegments.map((seg, idx) => {
                const originalIndex = currentEpisode.segments.indexOf(seg);
                const isActive = originalIndex === activeSegmentIndex;
                const isJordan = seg.speaker.toLowerCase().includes("jordan");

                return (
                  <div
                    key={seg.id || idx}
                    ref={isActive ? activeSegmentRef : null}
                    onClick={() => seekSegment(originalIndex)}
                    className={cn(
                      "group relative rounded-2xl p-4 transition-all duration-200 cursor-pointer border select-none",
                      isActive
                        ? isJordan
                          ? "bg-emerald-500/10 dark:bg-emerald-950/30 border-emerald-500/40 shadow-sm"
                          : "bg-[#6C63FF]/10 dark:bg-[#6C63FF]/15 border-[#6C63FF]/40 shadow-sm"
                        : "bg-slate-50/70 dark:bg-[#1a1b1e]/70 border-slate-200/60 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/15 hover:bg-white dark:hover:bg-[#202125]"
                    )}
                  >
                    {/* Bubble Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "flex h-6 w-6 items-center justify-center rounded-lg text-white font-extrabold text-[11px]",
                            isJordan ? "bg-emerald-600" : "bg-[#6C63FF]"
                          )}
                        >
                          {isJordan ? "J" : "A"}
                        </span>
                        <span
                          className={cn(
                            "font-bold text-xs",
                            isJordan
                              ? "text-emerald-700 dark:text-emerald-400"
                              : "text-[#6C63FF] dark:text-[#8B85FF]"
                          )}
                        >
                          {seg.speaker}
                        </span>
                        {isActive && isPlaying && (
                          <AudioWaveform
                            isPlaying={true}
                            speaker={seg.speaker}
                            barCount={4}
                            size="sm"
                            className="h-3 ml-1"
                          />
                        )}
                      </div>

                      {/* Turn Number & Quick Action Pills */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500 tabular-nums">
                          Turn {originalIndex + 1}
                        </span>

                        {/* Copy Turn Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyQuote(seg.id || `turn-${idx}`, seg.text, seg.speaker);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white transition-opacity"
                          title="Copy quote"
                        >
                          {copiedTurnId === (seg.id || `turn-${idx}`) ? (
                            <Check className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>

                        {/* Ask AI Tutor about this turn */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            sendToChat(seg.text, seg.citation?.citation_label);
                          }}
                          className="opacity-0 group-hover:opacity-100 flex items-center gap-1 rounded-md bg-[#6C63FF]/10 dark:bg-[#6C63FF]/20 px-1.5 py-0.5 text-[10px] font-semibold text-[#6C63FF] dark:text-[#8B85FF] hover:bg-[#6C63FF] hover:text-white transition-all"
                          title="Ask AI Tutor to explain this further"
                        >
                          <MessageSquare className="h-2.5 w-2.5" />
                          <span>Ask Tutor</span>
                        </button>
                      </div>
                    </div>

                    {/* Dialogue Text with Live Word Karaoke Highlight */}
                    <p
                      className={cn(
                        "text-xs sm:text-[13px] leading-relaxed",
                        isActive
                          ? "text-slate-900 dark:text-white font-medium"
                          : "text-slate-700 dark:text-zinc-300"
                      )}
                    >
                      {isActive && activeWord && activeWord.word ? (
                        <span>
                          {seg.text.split(" ").map((w, wIdx) => {
                            const isCurrentWord =
                              w.toLowerCase().replace(/[^a-z0-9]/g, "") ===
                              activeWord.word.toLowerCase().replace(/[^a-z0-9]/g, "");
                            return (
                              <span
                                key={wIdx}
                                className={cn(
                                  "transition-colors duration-100",
                                  isCurrentWord
                                    ? isJordan
                                      ? "bg-emerald-400/30 text-emerald-900 dark:text-emerald-200 font-bold px-0.5 rounded"
                                      : "bg-[#6C63FF]/30 text-[#4338CA] dark:text-violet-200 font-bold px-0.5 rounded"
                                    : ""
                                )}
                              >
                                {w}{" "}
                              </span>
                            );
                          })}
                        </span>
                      ) : (
                        seg.text
                      )}
                    </p>

                    {/* Citation Grounding Chip */}
                    {seg.citation && (
                      <div className="mt-2.5 pt-2 border-t border-slate-200/50 dark:border-white/5 flex items-center gap-1.5">
                        <BookOpen className="h-3 w-3 text-[#6C63FF] shrink-0" />
                        <span className="text-[11px] font-semibold text-[#6C63FF] dark:text-[#a78bfa] truncate">
                          {seg.citation.citation_label}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}

              {filteredSegments.length === 0 && (
                <div className="py-12 text-center text-xs text-slate-400">
                  No dialogue lines matching &quot;{transcriptSearch}&quot;.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
