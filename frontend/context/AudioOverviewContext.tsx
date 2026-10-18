"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import {
  AudioOverviewEpisode,
  PodcastSegment,
  DualVoiceConfig,
} from "@/lib/types";
import {
  DualVoiceAudioPipeline,
  getAudioPipeline,
  AudioPipelineStatus,
} from "@/lib/audio-pipeline";
import {
  listAudioOverviewEpisodes,
  generateAudioOverview,
  getAudioOverviewForMaterial,
} from "@/lib/api";
import { toast } from "sonner";

interface AudioOverviewContextType {
  currentEpisode: AudioOverviewEpisode | null;
  activeSegmentIndex: number;
  activeSegment: PodcastSegment | null;
  isPlaying: boolean;
  status: AudioPipelineStatus;
  currentTime: number;
  totalDuration: number;
  playbackSpeed: number;
  volume: number;
  currentSpeaker: string | null;
  isMiniPlayerOpen: boolean;
  isModalOpen: boolean;
  isGenerating: boolean;
  availableEpisodes: AudioOverviewEpisode[];

  // Actions
  playEpisode: (episode: AudioOverviewEpisode, startSegmentIndex?: number) => void;
  pause: () => void;
  resume: () => void;
  togglePlay: () => void;
  seekSegment: (index: number) => void;
  skipForward: (seconds?: number) => void;
  skipBackward: (seconds?: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  setVolume: (volume: number) => void;
  openModal: (episode?: AudioOverviewEpisode) => void;
  closeModal: () => void;
  openMiniPlayer: () => void;
  closeMiniPlayer: () => void;
  generateAndPlay: (params: {
    materialIds?: string[];
    topic?: string;
    durationTarget?: string;
  }) => Promise<AudioOverviewEpisode | null>;
  loadMaterialPodcast: (materialId: string, title?: string) => Promise<void>;
  exportTranscript: () => void;
}

const AudioOverviewContext = createContext<AudioOverviewContextType | null>(null);

export function AudioOverviewProvider({ children }: { children: React.ReactNode }) {
  const [currentEpisode, setCurrentEpisode] = useState<AudioOverviewEpisode | null>(null);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number>(-1);
  const [status, setStatus] = useState<AudioPipelineStatus>("idle");
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [totalDuration, setTotalDuration] = useState<number>(0);
  const [playbackSpeed, setSpeedState] = useState<number>(1.0);
  const [volume, setVolumeState] = useState<number>(1.0);
  const [isMiniPlayerOpen, setIsMiniPlayerOpen] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [availableEpisodes, setAvailableEpisodes] = useState<AudioOverviewEpisode[]>([]);

  const pipelineRef = useRef<DualVoiceAudioPipeline | null>(null);

  // Initialize pipeline & load episodes
  useEffect(() => {
    const pipeline = getAudioPipeline();
    pipelineRef.current = pipeline;

    const unsubscribe = pipeline.subscribe({
      onStatusChange: (newStatus) => {
        setStatus(newStatus);
      },
      onSegmentChange: (index) => {
        setActiveSegmentIndex(index);
      },
      onTimeUpdate: (time, duration) => {
        setCurrentTime(time);
        setTotalDuration(duration);
      },
      onError: (err) => {
        console.warn("Audio pipeline playback notice:", err);
      },
    });

    // Load available episodes
    listAudioOverviewEpisodes().then((eps) => {
      if (eps && eps.length > 0) {
        setAvailableEpisodes(eps);
      }
    });

    return () => {
      unsubscribe();
      pipeline.stop();
    };
  }, []);

  const playEpisode = useCallback(
    (episode: AudioOverviewEpisode, startSegmentIndex: number = 0) => {
      if (!pipelineRef.current) return;
      setCurrentEpisode(episode);
      pipelineRef.current.loadSegments(episode.segments);
      pipelineRef.current.play(startSegmentIndex);
      setIsMiniPlayerOpen(true);
    },
    []
  );

  const pause = useCallback(() => {
    pipelineRef.current?.pause();
  }, []);

  const resume = useCallback(() => {
    if (pipelineRef.current?.getStatus() === "paused") {
      pipelineRef.current.resume();
    } else if (currentEpisode) {
      pipelineRef.current?.play(activeSegmentIndex >= 0 ? activeSegmentIndex : 0);
    }
  }, [currentEpisode, activeSegmentIndex]);

  const togglePlay = useCallback(() => {
    if (status === "playing") {
      pause();
    } else {
      resume();
    }
  }, [status, pause, resume]);

  const seekSegment = useCallback((index: number) => {
    pipelineRef.current?.seekToSegment(index);
  }, []);

  const skipForward = useCallback((seconds: number = 15) => {
    pipelineRef.current?.skipSeconds(seconds);
  }, []);

  const skipBackward = useCallback((seconds: number = 15) => {
    pipelineRef.current?.skipSeconds(-seconds);
  }, []);

  const setPlaybackSpeed = useCallback((speed: number) => {
    setSpeedState(speed);
    pipelineRef.current?.setPlaybackSpeed(speed);
  }, []);

  const setVolume = useCallback((vol: number) => {
    setVolumeState(vol);
    pipelineRef.current?.setVolume(vol);
  }, []);

  const openModal = useCallback((episode?: AudioOverviewEpisode) => {
    if (episode) {
      setCurrentEpisode(episode);
      if (pipelineRef.current && status === "idle") {
        pipelineRef.current.loadSegments(episode.segments);
      }
    }
    setIsModalOpen(true);
  }, [status]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const openMiniPlayer = useCallback(() => {
    setIsMiniPlayerOpen(true);
  }, []);

  const closeMiniPlayer = useCallback(() => {
    pipelineRef.current?.stop();
    setIsMiniPlayerOpen(false);
  }, []);

  const generateAndPlay = useCallback(
    async (params: {
      materialIds?: string[];
      topic?: string;
      durationTarget?: string;
    }): Promise<AudioOverviewEpisode | null> => {
      setIsGenerating(true);
      const toastId = toast.loading("Synthesizing 2-Host Audio Deep Dive...");
      try {
        const episode = await generateAudioOverview(params);
        if (episode) {
          toast.success("Audio Overview Ready!", {
            id: toastId,
            description: `Generated: "${episode.title}" (~${Math.round(episode.duration_seconds / 60)} min)`,
          });
          setAvailableEpisodes((prev) => [
            episode,
            ...prev.filter((e) => e.id !== episode.id),
          ]);
          playEpisode(episode, 0);
          openModal(episode);
          return episode;
        } else {
          toast.error("Could not generate audio overview", { id: toastId });
          return null;
        }
      } catch (err: any) {
        toast.error("Generation error", {
          id: toastId,
          description: err.message || "Failed to generate podcast",
        });
        return null;
      } finally {
        setIsGenerating(false);
      }
    },
    [playEpisode, openModal]
  );

  const loadMaterialPodcast = useCallback(
    async (materialId: string, title?: string) => {
      setIsGenerating(true);
      const toastId = toast.loading(`Generating Audio Overview for "${title || "material"}"...`);
      try {
        const ep = await getAudioOverviewForMaterial(materialId, title);
        if (ep) {
          toast.success("Audio Overview Ready!", {
            id: toastId,
            description: `Now playing: "${ep.title}"`,
          });
          playEpisode(ep, 0);
          openModal(ep);
        } else {
          toast.error("Failed to load material podcast", { id: toastId });
        }
      } catch (err: any) {
        toast.error("Notice", { id: toastId, description: err.message });
      } finally {
        setIsGenerating(false);
      }
    },
    [playEpisode, openModal]
  );

  const exportTranscript = useCallback(() => {
    if (!currentEpisode) return;
    const lines = [
      `# ${currentEpisode.title}`,
      `## ${currentEpisode.subtitle}`,
      `**Duration:** ~${Math.round(currentEpisode.duration_seconds / 60)} minutes`,
      `**Generated on:** ${new Date(currentEpisode.created_at).toLocaleDateString()}`,
      "",
      "### Key Takeaways:",
      ...currentEpisode.key_takeaways.map((k) => `- ${k}`),
      "",
      "---",
      "### Dialogue Transcript:",
      "",
    ];

    currentEpisode.segments.forEach((seg, i) => {
      const citeStr = seg.citation ? ` *(${seg.citation.citation_label})*` : "";
      lines.push(`**${seg.speaker}**: ${seg.text}${citeStr}\n`);
    });

    const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${currentEpisode.title.replace(/[^a-zA-Z0-9_-]/g, "_")}_transcript.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Transcript downloaded as Markdown file!");
  }, [currentEpisode]);

  const activeSegment =
    currentEpisode && activeSegmentIndex >= 0 && activeSegmentIndex < currentEpisode.segments.length
      ? currentEpisode.segments[activeSegmentIndex]
      : null;

  const currentSpeaker = activeSegment ? activeSegment.speaker : null;

  return (
    <AudioOverviewContext.Provider
      value={{
        currentEpisode,
        activeSegmentIndex,
        activeSegment,
        isPlaying: status === "playing",
        status,
        currentTime,
        totalDuration,
        playbackSpeed,
        volume,
        currentSpeaker,
        isMiniPlayerOpen,
        isModalOpen,
        isGenerating,
        availableEpisodes,
        playEpisode,
        pause,
        resume,
        togglePlay,
        seekSegment,
        skipForward,
        skipBackward,
        setPlaybackSpeed,
        setVolume,
        openModal,
        closeModal,
        openMiniPlayer,
        closeMiniPlayer,
        generateAndPlay,
        loadMaterialPodcast,
        exportTranscript,
      }}
    >
      {children}
    </AudioOverviewContext.Provider>
  );
}

export function useAudioOverview() {
  const context = useContext(AudioOverviewContext);
  if (!context) {
    throw new Error("useAudioOverview must be used within an AudioOverviewProvider");
  }
  return context;
}
