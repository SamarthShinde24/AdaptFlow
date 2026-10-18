"use client";

import React, { useState, useRef, useEffect } from "react";
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
  ListOrdered,
  Users,
  Layers,
} from "lucide-react";
import { useAudioOverview } from "@/context/AudioOverviewContext";
import { AudioWaveform } from "./AudioWaveform";
import { cn } from "@/lib/utils";
import { AudioOverviewEpisode } from "@/lib/types";

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
    currentSpeaker,
    isModalOpen,
    availableEpisodes,
    closeModal,
    togglePlay,
    seekSegment,
    skipBackward,
    skipForward,
    setPlaybackSpeed,
    setVolume,
    playEpisode,
    exportTranscript,
    generateAndPlay,
    isGenerating,
  } = useAudioOverview();

  const [transcriptSearch, setTranscriptSearch] = useState("");
  const [selectedDurationTarget, setSelectedDurationTarget] = useState<"deep_dive" | "quick_recap">("deep_dive");
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

  if (!isModalOpen || !currentEpisode) {
    return null;
  }

  const progressPercent = totalDuration > 0
    ? Math.min(100, Math.max(0, (currentTime / totalDuration) * 100))
    : 0;

  const handleSeekTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickRatio = (e.clientX - rect.left) / rect.width;
    const targetTime = clickRatio * totalDuration;

    // Find closest segment
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

  const handleRegenerate = async () => {
    await generateAndPlay({
      materialIds: currentEpisode.material_ids,
      topic: currentEpisode.title.replace(/[:\-].*$/, "").trim(),
      durationTarget: selectedDurationTarget,
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
      aria-label="NotebookLM Audio Overview Studio"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200"
      onClick={closeModal}
    >
      <div
        className="w-full max-w-5xl h-[90vh] max-h-[820px] flex flex-col rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#151619] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Studio Modal Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-[#1a1b1e]/70">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#6C63FF]/10 border border-[#6C63FF]/30 text-[#6C63FF] dark:text-[#8B85FF]">
              <Radio className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#6C63FF] dark:text-[#8B85FF]">
                  NotebookLM Style · Audio Overview
                </span>
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  AI Podcast Deep Dive
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate max-w-md sm:max-w-xl">
                {currentEpisode.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={exportTranscript}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors shadow-2xs"
              title="Download full podcast transcript as Markdown"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Export Transcript</span>
            </button>

            <button
              type="button"
              onClick={closeModal}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-zinc-800 transition-colors"
              title="Close modal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Studio Modal Body: 2 Columns */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-white/10 overflow-hidden">
          {/* ========================================================================= */}
          {/* LEFT COLUMN: PLAYER CONTROLS, HOSTS & KEY TAKEAWAYS                      */}
          {/* ========================================================================= */}
          <div className="lg:col-span-5 flex flex-col justify-between p-5 sm:p-6 overflow-y-auto space-y-5">
            {/* Episode Cover Art & Host Cards */}
            <div className="space-y-4">
              <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/10 bg-gradient-to-br from-[#6C63FF]/15 via-purple-500/10 to-emerald-500/15 p-5">
                <div className="flex items-start justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 dark:bg-zinc-900/80 border border-slate-200/80 dark:border-white/10 px-2.5 py-1 text-[11px] font-bold text-slate-800 dark:text-zinc-200 shadow-2xs">
                    <Sparkles className="h-3 w-3 text-[#6C63FF]" />
                    <span>~{Math.round(currentEpisode.duration_seconds / 60)} min Deep Dive</span>
                  </span>

                  <AudioWaveform
                    isPlaying={isPlaying}
                    speaker={currentSpeaker}
                    barCount={6}
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
                    Dual-Voice TTS
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

            {/* Transport & Playback Controls Deck */}
            <div className="pt-4 border-t border-slate-200 dark:border-white/10 space-y-3.5">
              {/* Scrub Track */}
              <div className="space-y-1">
                <div
                  onClick={handleSeekTrackClick}
                  className="group relative h-2.5 w-full rounded-full bg-slate-200 dark:bg-zinc-800 cursor-pointer overflow-hidden transition-all hover:h-3"
                  title="Click to seek position"
                >
                  <div
                    className="h-full bg-gradient-to-r from-[#6C63FF] to-emerald-500 rounded-full transition-all duration-150"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

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
                {/* Previous Turn */}
                <button
                  type="button"
                  onClick={handlePreviousTurn}
                  disabled={activeSegmentIndex <= 0}
                  title="Previous turn"
                  className="p-2 rounded-full text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-30 transition-colors"
                >
                  <SkipBack className="h-4 w-4" />
                </button>

                {/* Rewind 15s */}
                <button
                  type="button"
                  onClick={() => skipBackward(15)}
                  title="Rewind 15 seconds"
                  className="p-2 rounded-full text-slate-600 hover:text-slate-900 dark:text-zinc-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>

                {/* Big Play / Pause Button */}
                <button
                  type="button"
                  onClick={togglePlay}
                  title={isPlaying ? "Pause podcast" : "Play podcast"}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#6C63FF] hover:bg-[#5850EC] text-white shadow-lg active:scale-95 transition-all"
                >
                  {isPlaying ? (
                    <Pause className="h-6 w-6 fill-current" />
                  ) : (
                    <Play className="h-6 w-6 fill-current ml-0.5" />
                  )}
                </button>

                {/* Forward 15s */}
                <button
                  type="button"
                  onClick={() => skipForward(15)}
                  title="Forward 15 seconds"
                  className="p-2 rounded-full text-slate-600 hover:text-slate-900 dark:text-zinc-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <RotateCw className="h-4 w-4" />
                </button>

                {/* Next Turn */}
                <button
                  type="button"
                  onClick={handleNextTurn}
                  disabled={activeSegmentIndex >= currentEpisode.segments.length - 1}
                  title="Next turn"
                  className="p-2 rounded-full text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-30 transition-colors"
                >
                  <SkipForward className="h-4 w-4" />
                </button>
              </div>

              {/* Speed & Mode Selector Bar */}
              <div className="flex items-center justify-between pt-1 text-xs">
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

                {/* Regenerate with options */}
                <button
                  type="button"
                  onClick={handleRegenerate}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-zinc-400 hover:text-[#6C63FF] dark:hover:text-white transition-colors"
                  title="Regenerate this episode from latest notes"
                >
                  <RefreshCw className={cn("h-3 w-3", isGenerating && "animate-spin")} />
                  <span>{isGenerating ? "Generating..." : "Regenerate"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* RIGHT COLUMN: LIVE INTERACTIVE DIALOGUE TRANSCRIPT                        */}
          {/* ========================================================================= */}
          <div className="lg:col-span-7 flex flex-col h-full min-h-0 bg-white dark:bg-[#151619]">
            {/* Transcript Search & Stats Bar */}
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
                    {/* Bubble Header: Speaker badge & time offset */}
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
                            className="h-3 ml-1"
                          />
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500 tabular-nums">
                          Turn {originalIndex + 1}
                        </span>
                        <button
                          type="button"
                          className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[10px] font-semibold text-[#6C63FF] dark:text-[#8B85FF] transition-opacity"
                        >
                          <Play className="h-2.5 w-2.5 fill-current" />
                          <span>Play here</span>
                        </button>
                      </div>
                    </div>

                    {/* Dialogue Text */}
                    <p
                      className={cn(
                        "text-xs sm:text-[13px] leading-relaxed",
                        isActive
                          ? "text-slate-900 dark:text-white font-medium"
                          : "text-slate-700 dark:text-zinc-300"
                      )}
                    >
                      {seg.text}
                    </p>

                    {/* Citation Chip (if attached) */}
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
