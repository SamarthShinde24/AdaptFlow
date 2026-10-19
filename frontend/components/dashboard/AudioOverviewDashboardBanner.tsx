"use client";

import React, { useState } from "react";
import {
  Radio,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Sparkles,
  Maximize2,
  Clock,
  ArrowRight,
  ListMusic,
  Search,
  Volume2,
  VolumeX,
  Target,
  Zap,
  AlertTriangle,
} from "lucide-react";
import { useAudioOverview } from "@/context/AudioOverviewContext";
import { AudioWaveform } from "@/components/audio/AudioWaveform";
import { Material, PodcastFormatTarget } from "@/lib/types";
import { cn } from "@/lib/utils";

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

interface AudioOverviewDashboardBannerProps {
  materials?: Material[];
}

export function AudioOverviewDashboardBanner({
  materials = [],
}: AudioOverviewDashboardBannerProps) {
  const {
    currentEpisode,
    isPlaying,
    currentTime,
    totalDuration,
    playbackSpeed,
    volume,
    isMuted,
    currentSpeaker,
    availableEpisodes,
    togglePlay,
    playEpisode,
    skipBackward,
    skipForward,
    setPlaybackSpeed,
    toggleMute,
    openModal,
    generateAndPlay,
    isGenerating,
  } = useAudioOverview();

  const [selectedTopic, setSelectedTopic] = useState("");
  const [playlistSearch, setPlaylistSearch] = useState("");
  const [selectedFormat, setSelectedFormat] = useState<PodcastFormatTarget>("deep_dive");

  const activeEp = currentEpisode || (availableEpisodes.length > 0 ? availableEpisodes[0] : null);

  const progressPercent = totalDuration > 0
    ? Math.min(100, Math.max(0, (currentTime / totalDuration) * 100))
    : 0;

  const handleStartEpisode = (ep: any) => {
    playEpisode(ep, 0);
  };

  const handleGenerateCustom = async () => {
    const topic = selectedTopic.trim() || (materials.length > 0 ? materials[0].title : "Study Materials");
    await generateAndPlay({
      materialIds: materials.slice(0, 3).map((m) => m.id),
      topic,
      durationTarget: selectedFormat,
    });
  };

  const cycleSpeed = () => {
    const speeds = [1.0, 1.25, 1.5, 2.0, 0.75];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    setPlaybackSpeed(nextSpeed);
  };

  const filteredEpisodes = availableEpisodes.filter((ep) => {
    if (!playlistSearch.trim()) return true;
    const q = playlistSearch.toLowerCase();
    return (
      ep.title.toLowerCase().includes(q) ||
      ep.subtitle.toLowerCase().includes(q) ||
      (ep.subject && ep.subject.toLowerCase().includes(q))
    );
  });

  return (
    <section id="audio-overview-section" className="space-y-4 scroll-mt-20">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-l-[3px] border-emerald-500 pl-3.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Radio className="h-3.5 w-3.5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
              <span>Audio Overview: AI Podcast Studio</span>
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 mt-0.5">
            Effortless, hands-free 3 to 5 minute two-host conversational revision for traveling or relaxing.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => openModal()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors shadow-2xs cursor-pointer"
          >
            <Maximize2 className="h-3.5 w-3.5 text-emerald-500" />
            <span>Open Studio</span>
          </button>

          <button
            type="button"
            disabled={isGenerating}
            onClick={handleGenerateCustom}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{isGenerating ? "Synthesizing..." : "Generate Audio"}</span>
          </button>
        </div>
      </div>

      {/* Main Banner Card (2-column layout) */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#121316] shadow-md">
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-white/10">
          {/* Left Column: Featured Player Deck */}
          <div className="lg:col-span-7 p-5 sm:p-6 flex flex-col justify-between space-y-5 bg-gradient-to-br from-emerald-500/[0.04] via-transparent to-[#6C63FF]/[0.04]">
            <div>
              {/* Top Host Avatar Badges & Waveform */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center -space-x-1.5">
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-[#6C63FF] text-white text-xs font-extrabold ring-2 ring-white dark:ring-zinc-900 shadow-2xs"
                      title="Alex (Host / Inquisitive Co-host)"
                    >
                      A
                    </span>
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-extrabold ring-2 ring-white dark:ring-zinc-900 shadow-2xs"
                      title="Jordan (Expert Analyst / Citations)"
                    >
                      J
                    </span>
                  </div>
                  <div className="text-[11px] font-bold text-slate-700 dark:text-zinc-300">
                    Alex & Jordan <span className="font-normal text-slate-500 dark:text-zinc-500">· Dual-Voice Co-Hosts</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    <Clock className="h-3 w-3" />
                    <span>~{activeEp ? Math.round(activeEp.duration_seconds / 60) : 4} min</span>
                  </span>
                  <AudioWaveform
                    isPlaying={isPlaying}
                    speaker={currentSpeaker}
                    barCount={5}
                    size="sm"
                    className="h-4"
                  />
                </div>
              </div>

              {/* Title & Description */}
              <div className="mt-4">
                <h3
                  onClick={() => openModal(activeEp || undefined)}
                  className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer leading-tight"
                >
                  {activeEp ? activeEp.title : "Bioenergetics & ATP: Cellular Powerhouse Deep Dive"}
                </h3>
                <p className="mt-1.5 text-xs text-slate-600 dark:text-zinc-300 line-clamp-2 leading-relaxed">
                  {activeEp ? activeEp.subtitle : "Two-host conversation breaking down how cells convert glucose into high-energy ATP across the cytosol and mitochondria."}
                </p>
              </div>

              {/* Speaker Indicator strip */}
              {isPlaying && currentSpeaker && (
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 px-2.5 py-1 text-xs text-emerald-800 dark:text-emerald-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-semibold">{currentSpeaker} speaking</span>
                </div>
              )}
            </div>

            {/* Playback Controls Strip */}
            <div className="pt-3 border-t border-slate-200/80 dark:border-white/10 space-y-3">
              {/* Scrub Track */}
              <div className="space-y-1">
                <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-[#6C63FF] rounded-full transition-all duration-200"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-zinc-400">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(totalDuration || (activeEp ? activeEp.duration_seconds : 240))}</span>
                </div>
              </div>

              {/* Transport Buttons */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (activeEp) {
                        if (currentEpisode?.id === activeEp.id) {
                          togglePlay();
                        } else {
                          handleStartEpisode(activeEp);
                        }
                      }
                    }}
                    className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md active:scale-95 transition-all cursor-pointer"
                    title={isPlaying ? "Pause podcast" : "Play podcast"}
                  >
                    {isPlaying ? (
                      <Pause className="h-5 w-5 fill-current" />
                    ) : (
                      <Play className="h-5 w-5 fill-current ml-0.5" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => skipBackward(15)}
                    className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    title="Rewind 15 seconds"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => skipForward(15)}
                    className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    title="Forward 15 seconds"
                  >
                    <RotateCw className="h-4 w-4" />
                  </button>

                  {/* Volume / Mute Toggle */}
                  <button
                    type="button"
                    onClick={toggleMute}
                    className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    title={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="h-4 w-4 text-red-500" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={cycleSpeed}
                    className="px-2.5 py-1 rounded-xl text-xs font-bold tabular-nums text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                    title="Playback speed"
                  >
                    {playbackSpeed}x
                  </button>

                  <button
                    type="button"
                    onClick={() => openModal(activeEp || undefined)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                  >
                    <span>Transcript</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Episode Playlist & Generator Presets */}
          <div className="lg:col-span-5 p-5 sm:p-6 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                  <ListMusic className="h-4 w-4 text-emerald-500" />
                  <span>Curated Course Episodes</span>
                </div>
                <span className="text-[11px] font-semibold text-slate-400">
                  {filteredEpisodes.length} Episodes
                </span>
              </div>

              {/* Search Filter for Playlist */}
              <div className="relative mb-2.5">
                <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={playlistSearch}
                  onChange={(e) => setPlaylistSearch(e.target.value)}
                  placeholder="Search episodes..."
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-zinc-800/80 pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Playlist Item Cards */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-0.5 scrollbar-thin">
                {filteredEpisodes.map((ep) => {
                  const isCurrent = activeEp?.id === ep.id;
                  const isEpPlaying = isCurrent && isPlaying;

                  return (
                    <div
                      key={ep.id}
                      onClick={() => handleStartEpisode(ep)}
                      className={cn(
                        "group flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer select-none",
                        isCurrent
                          ? "bg-emerald-500/10 dark:bg-emerald-950/30 border-emerald-500/30 shadow-2xs"
                          : "bg-slate-50/70 dark:bg-zinc-900/50 border-slate-200/70 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/15 hover:bg-white dark:hover:bg-zinc-800"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <button
                          type="button"
                          className={cn(
                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-white transition-transform group-hover:scale-105",
                            isEpPlaying ? "bg-emerald-600 animate-pulse" : "bg-[#6C63FF]"
                          )}
                        >
                          {isEpPlaying ? (
                            <Pause className="h-3 w-3 fill-current" />
                          ) : (
                            <Play className="h-3 w-3 fill-current ml-0.5" />
                          )}
                        </button>

                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {ep.title}
                          </h4>
                          <span className="text-[10px] text-slate-500 dark:text-zinc-400 truncate block mt-0.5">
                            ~{Math.round(ep.duration_seconds / 60)} min · 2 hosts · {ep.segments.length} turns
                          </span>
                        </div>
                      </div>

                      <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-500 shrink-0 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  );
                })}

                {filteredEpisodes.length === 0 && (
                  <div className="py-6 text-center text-xs text-slate-400">
                    No episodes found matching &quot;{playlistSearch}&quot;
                  </div>
                )}
              </div>
            </div>

            {/* Quick Generator with Format Pills */}
            <div className="pt-3 border-t border-slate-200/70 dark:border-white/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400">
                  Generate Audio Overview for any topic:
                </span>
              </div>

              {/* Format Target Pills */}
              <div className="flex items-center gap-1.5">
                {[
                  { id: "deep_dive" as const, label: "Deep Dive", icon: Target, time: "~4m" },
                  { id: "quick_sprint" as const, label: "Sprint", icon: Zap, time: "~2m" },
                  { id: "exam_pitfalls" as const, label: "Pitfalls", icon: AlertTriangle, time: "~3m" },
                ].map((fmt) => {
                  const Icon = fmt.icon;
                  return (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => setSelectedFormat(fmt.id)}
                      className={cn(
                        "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer border",
                        selectedFormat === fmt.id
                          ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 shadow-2xs"
                          : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:border-slate-300"
                      )}
                    >
                      <Icon className="h-2.5 w-2.5" />
                      <span>{fmt.label}</span>
                      <span className="opacity-60 text-[9px]">{fmt.time}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleGenerateCustom()}
                  placeholder="e.g. Distributed Hash Tables or Amber Fort..."
                  className="flex-1 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-zinc-800 px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={handleGenerateCustom}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
                >
                  Generate
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
