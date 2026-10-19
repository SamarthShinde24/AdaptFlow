"use client";

import React, { useState } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Maximize2,
  X,
  Volume2,
  VolumeX,
  Radio,
  ChevronUp,
  ChevronDown,
  SkipBack,
  SkipForward,
  BookOpen,
} from "lucide-react";
import { useAudioOverview } from "@/context/AudioOverviewContext";
import { AudioWaveform } from "./AudioWaveform";
import { cn } from "@/lib/utils";

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function AudioOverviewMiniPlayer() {
  const {
    currentEpisode,
    isPlaying,
    currentTime,
    totalDuration,
    playbackSpeed,
    volume,
    isMuted,
    currentSpeaker,
    activeSegment,
    isMiniPlayerOpen,
    activeSegmentIndex,
    togglePlay,
    skipBackward,
    skipForward,
    setPlaybackSpeed,
    setVolume,
    toggleMute,
    openModal,
    closeMiniPlayer,
    seekSegment,
  } = useAudioOverview();

  const [showDrawer, setShowDrawer] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  if (!isMiniPlayerOpen || !currentEpisode) {
    return null;
  }

  const progressPercent = totalDuration > 0
    ? Math.min(100, Math.max(0, (currentTime / totalDuration) * 100))
    : 0;

  const cycleSpeed = () => {
    const speeds = [1.0, 1.25, 1.5, 2.0, 0.75];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    setPlaybackSpeed(nextSpeed);
  };

  const isAlex = currentSpeaker?.toLowerCase().includes("alex");
  const isJordan = currentSpeaker?.toLowerCase().includes("jordan");

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

  return (
    <aside
      aria-label="Audio Overview Mini Player"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-[500px] z-50 animate-in slide-in-from-bottom-4 duration-200 select-none"
    >
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white/95 dark:bg-[#16171a]/95 backdrop-blur-xl shadow-2xl p-3.5 transition-all">
        {/* Top Mini-Progress Bar across top edge */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-100 dark:bg-zinc-800">
          <div
            className="h-full bg-gradient-to-r from-[#6C63FF] to-emerald-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Collapsible Mini-Transcript Drawer */}
        {showDrawer && activeSegment && (
          <div className="mb-2.5 pb-2.5 border-b border-slate-200/70 dark:border-white/10 pt-1 text-xs animate-in slide-in-from-top-2">
            <div className="flex items-center justify-between mb-1 text-[10px]">
              <span
                className={cn(
                  "font-bold uppercase tracking-wider",
                  isJordan
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-[#6C63FF] dark:text-[#8B85FF]"
                )}
              >
                {activeSegment.speaker} Speaking (Turn {activeSegmentIndex + 1} of{" "}
                {currentEpisode.segments.length})
              </span>
              {activeSegment.citation && (
                <span className="flex items-center gap-1 text-slate-400 text-[10px] truncate max-w-[180px]">
                  <BookOpen className="h-2.5 w-2.5" />
                  <span>{activeSegment.citation.citation_label}</span>
                </span>
              )}
            </div>
            <p className="text-slate-800 dark:text-zinc-200 leading-relaxed font-medium">
              &quot;{activeSegment.text}&quot;
            </p>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 pt-0.5">
          {/* Host Avatar / Active Speaker Indicator */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="relative shrink-0">
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl font-bold text-xs shadow-xs border transition-all",
                  isJordan
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                    : "bg-[#6C63FF]/10 border-[#6C63FF]/30 text-[#6C63FF] dark:text-[#8B85FF]"
                )}
              >
                {isJordan ? "J" : "A"}
              </div>
              {isPlaying && (
                <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                  <span
                    className={cn(
                      "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                      isJordan ? "bg-emerald-400" : "bg-violet-400"
                    )}
                  />
                  <span
                    className={cn(
                      "relative inline-flex rounded-full h-3 w-3",
                      isJordan ? "bg-emerald-500" : "bg-[#6C63FF]"
                    )}
                  />
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                  <Radio className="h-2.5 w-2.5 text-[#6C63FF]" />
                  <span>Audio Overview</span>
                </span>
                <span className="text-[10px] text-slate-400 dark:text-zinc-600">·</span>
                <span
                  className={cn(
                    "text-[10px] font-bold truncate",
                    isJordan
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-[#6C63FF] dark:text-[#8B85FF]"
                  )}
                >
                  {currentSpeaker || "Alex & Jordan"}
                </span>
              </div>

              <h4
                onClick={() => openModal()}
                className="font-bold text-xs text-slate-900 dark:text-white truncate cursor-pointer hover:underline hover:text-[#6C63FF] transition-colors leading-tight mt-0.5"
                title={currentEpisode.title}
              >
                {currentEpisode.title}
              </h4>
            </div>
          </div>

          {/* Soundwave Visualizer */}
          <AudioWaveform
            isPlaying={isPlaying}
            speaker={currentSpeaker}
            barCount={5}
            size="sm"
            className="hidden sm:flex shrink-0 mx-1"
          />

          {/* Action buttons */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Speed toggle */}
            <button
              type="button"
              onClick={cycleSpeed}
              title={`Playback speed: ${playbackSpeed}x (Click to cycle)`}
              className="px-2 py-1 rounded-lg text-[10px] font-bold tabular-nums text-slate-600 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              {playbackSpeed}x
            </button>

            {/* Volume toggle button with popup slider */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowVolumeSlider((prev) => !prev)}
                className="p-1.5 rounded-lg text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                title="Adjust volume"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-3.5 w-3.5 text-red-500" />
                ) : (
                  <Volume2 className="h-3.5 w-3.5" />
                )}
              </button>

              {showVolumeSlider && (
                <div className="absolute bottom-full mb-2 -right-4 p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 shadow-xl z-50 flex items-center gap-2 animate-in fade-in zoom-in-95">
                  <button
                    type="button"
                    onClick={toggleMute}
                    className="text-xs text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
                  >
                    {isMuted ? "Unmute" : "Mute"}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-20 accent-[#6C63FF] h-1.5"
                  />
                </div>
              )}
            </div>

            {/* Turn Navigation: Previous Turn */}
            <button
              type="button"
              onClick={handlePreviousTurn}
              disabled={activeSegmentIndex <= 0}
              title="Previous dialogue turn"
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 disabled:opacity-25"
            >
              <SkipBack className="h-3.5 w-3.5" />
            </button>

            {/* Play/Pause */}
            <button
              type="button"
              onClick={togglePlay}
              title={isPlaying ? "Pause" : "Play"}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#6C63FF] hover:bg-[#5850EC] text-white shadow-md active:scale-95 transition-all cursor-pointer"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4 fill-current" />
              ) : (
                <Play className="h-4 w-4 fill-current ml-0.5" />
              )}
            </button>

            {/* Turn Navigation: Next Turn */}
            <button
              type="button"
              onClick={handleNextTurn}
              disabled={activeSegmentIndex >= currentEpisode.segments.length - 1}
              title="Next dialogue turn"
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 disabled:opacity-25"
            >
              <SkipForward className="h-3.5 w-3.5" />
            </button>

            {/* Toggle Drawer */}
            <button
              type="button"
              onClick={() => setShowDrawer((prev) => !prev)}
              title={showDrawer ? "Hide transcript drawer" : "View active line transcript"}
              className="p-1.5 rounded-lg text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              {showDrawer ? (
                <ChevronDown className="h-3.5 w-3.5 text-[#6C63FF]" />
              ) : (
                <ChevronUp className="h-3.5 w-3.5" />
              )}
            </button>

            {/* Expand to Studio modal */}
            <button
              type="button"
              onClick={() => openModal()}
              title="Open full podcast transcript & studio"
              className="p-1.5 rounded-lg text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>

            {/* Dismiss */}
            <button
              type="button"
              onClick={closeMiniPlayer}
              title="Close audio player"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Timestamp footer & scrubbing indicator */}
        <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-zinc-400 pt-1.5 px-0.5">
          <span className="font-mono tabular-nums">
            {formatTime(currentTime)} / {formatTime(totalDuration)}
          </span>
          <span className="truncate max-w-[240px] text-right italic opacity-85">
            {activeSegment ? `"${activeSegment.text.slice(0, 48)}..."` : "Two-host revision"}
          </span>
        </div>
      </div>
    </aside>
  );
}
