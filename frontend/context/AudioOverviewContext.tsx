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
  SleepTimerDuration,
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
import { useRouter } from "next/navigation";

interface WordBoundaryEvent {
  charIndex: number;
  word: string;
}

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
  isMuted: boolean;
  currentSpeaker: string | null;
  isMiniPlayerOpen: boolean;
  isModalOpen: boolean;
  isGenerating: boolean;
  availableEpisodes: AudioOverviewEpisode[];
  autoPlayNext: boolean;
  activeSleepTimerDuration: SleepTimerDuration;
  sleepTimerRemaining: number | null;
  activeWord: WordBoundaryEvent | null;
  voiceConfig: DualVoiceConfig;
  availableVoices: SpeechSynthesisVoice[];
  hasNextEpisode: boolean;
  hasPreviousEpisode: boolean;

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
  toggleMute: () => void;
  toggleAutoPlayNext: () => void;
  setSleepTimer: (duration: SleepTimerDuration) => void;
  updateVoiceConfig: (config: Partial<DualVoiceConfig>) => void;
  playNextEpisode: () => void;
  playPreviousEpisode: () => void;
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
  sendToChat: (segmentText: string, citationLabel?: string) => void;
}

const AudioOverviewContext = createContext<AudioOverviewContextType | null>(null);

export function AudioOverviewProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [currentEpisode, setCurrentEpisode] = useState<AudioOverviewEpisode | null>(null);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number>(-1);
  const [status, setStatus] = useState<AudioPipelineStatus>("idle");
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [totalDuration, setTotalDuration] = useState<number>(0);
  const [playbackSpeed, setSpeedState] = useState<number>(1.0);
  const [volume, setVolumeState] = useState<number>(1.0);
  const [isMuted, setIsMutedState] = useState<boolean>(false);
  const [isMiniPlayerOpen, setIsMiniPlayerOpen] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [availableEpisodes, setAvailableEpisodes] = useState<AudioOverviewEpisode[]>([]);
  const [autoPlayNext, setAutoPlayNext] = useState<boolean>(true);
  const [activeSleepTimerDuration, setActiveSleepTimerDuration] = useState<SleepTimerDuration>(0);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);
  const [activeWord, setActiveWord] = useState<WordBoundaryEvent | null>(null);
  const [voiceConfig, setVoiceConfigState] = useState<DualVoiceConfig>({
    alexPitch: 1.06,
    jordanPitch: 0.92,
    alexRate: 1.02,
    jordanRate: 0.98,
  });
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  const pipelineRef = useRef<DualVoiceAudioPipeline | null>(null);
  const sleepTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize pipeline & load saved preferences
  useEffect(() => {
    const pipeline = getAudioPipeline();
    pipelineRef.current = pipeline;

    // Restore user speed preference
    try {
      const savedSpeed = localStorage.getItem("adaptflow_audio_speed");
      if (savedSpeed) {
        const parsedSpeed = parseFloat(savedSpeed);
        if (!isNaN(parsedSpeed) && parsedSpeed > 0) {
          pipeline.setPlaybackSpeed(parsedSpeed);
          setSpeedState(parsedSpeed);
        }
      }
      const savedVolume = localStorage.getItem("adaptflow_audio_volume");
      if (savedVolume) {
        const parsedVol = parseFloat(savedVolume);
        if (!isNaN(parsedVol)) {
          pipeline.setVolume(parsedVol);
          setVolumeState(parsedVol);
          setIsMutedState(parsedVol === 0);
        }
      }
      const savedAutoPlay = localStorage.getItem("adaptflow_audio_autoplay");
      if (savedAutoPlay !== null) {
        setAutoPlayNext(savedAutoPlay === "true");
      }
      const savedVoiceConfig = localStorage.getItem("adaptflow_audio_voice_config");
      if (savedVoiceConfig) {
        const parsedConfig = JSON.parse(savedVoiceConfig);
        pipeline.updateVoiceConfig(parsedConfig);
        setVoiceConfigState(pipeline.getVoiceConfig());
      }
    } catch (_) {}

    // Load available voices once initialized
    setTimeout(() => {
      setAvailableVoices(pipeline.getAvailableVoices());
      setVoiceConfigState(pipeline.getVoiceConfig());
    }, 400);

    const unsubscribe = pipeline.subscribe({
      onStatusChange: (newStatus) => {
        setStatus(newStatus);
        if (newStatus === "ended") {
          setActiveWord(null);
        }
      },
      onSegmentChange: (index) => {
        setActiveSegmentIndex(index);
        setActiveWord(null);
      },
      onTimeUpdate: (time, duration) => {
        setCurrentTime(time);
        setTotalDuration(duration);
      },
      onWordBoundary: (charIndex, word) => {
        setActiveWord({ charIndex, word });
      },
      onError: (err) => {
        console.warn("Audio pipeline notice:", err);
      },
    });

    // Load available episodes from backend
    listAudioOverviewEpisodes().then((eps) => {
      if (eps && eps.length > 0) {
        setAvailableEpisodes(eps);
      }
    });

    return () => {
      unsubscribe();
      pipeline.stop();
      if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
    };
  }, []);

  // Sleep Timer countdown interval
  useEffect(() => {
    if (activeSleepTimerDuration <= 0) {
      setSleepTimerRemaining(null);
      if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
      return;
    }

    setSleepTimerRemaining(activeSleepTimerDuration);

    sleepTimerRef.current = setInterval(() => {
      setSleepTimerRemaining((prev) => {
        if (prev === null || prev <= 1) {
          if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
          pipelineRef.current?.pause();
          setActiveSleepTimerDuration(0);
          toast.info("Sleep timer completed", {
            description: "Playback paused automatically. Sweet dreams!",
          });
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
    };
  }, [activeSleepTimerDuration]);

  // Handle 'end of episode' sleep timer
  useEffect(() => {
    if (status === "ended") {
      if (activeSleepTimerDuration === -1) {
        setActiveSleepTimerDuration(0);
        toast.info("Episode finished. Sleep timer paused playback.");
        return;
      }

      // Auto-play next episode in playlist if enabled
      if (autoPlayNext && currentEpisode && availableEpisodes.length > 1) {
        const currentIndex = availableEpisodes.findIndex((e) => e.id === currentEpisode.id);
        if (currentIndex >= 0 && currentIndex < availableEpisodes.length - 1) {
          const nextEp = availableEpisodes[currentIndex + 1];
          toast.success("Playing Next Episode", {
            description: nextEp.title,
          });
          playEpisode(nextEp, 0);
        }
      }
    }
  }, [status, activeSleepTimerDuration, autoPlayNext, currentEpisode, availableEpisodes]);

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
    try {
      localStorage.setItem("adaptflow_audio_speed", speed.toString());
    } catch (_) {}
  }, []);

  const setVolume = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setVolumeState(clamped);
    setIsMutedState(clamped === 0);
    pipelineRef.current?.setVolume(clamped);
    try {
      localStorage.setItem("adaptflow_audio_volume", clamped.toString());
    } catch (_) {}
  }, []);

  const toggleMute = useCallback(() => {
    if (!pipelineRef.current) return;
    const muted = pipelineRef.current.toggleMute();
    setIsMutedState(muted);
    setVolumeState(pipelineRef.current.getVolume());
  }, []);

  const toggleAutoPlayNext = useCallback(() => {
    setAutoPlayNext((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("adaptflow_audio_autoplay", next.toString());
      } catch (_) {}
      toast.success(next ? "Autoplay enabled" : "Autoplay disabled");
      return next;
    });
  }, []);

  const setSleepTimer = useCallback((duration: SleepTimerDuration) => {
    setActiveSleepTimerDuration(duration);
    if (duration === 0) {
      toast.info("Sleep timer turned off");
    } else if (duration === -1) {
      toast.success("Sleep timer set: pause at end of episode");
    } else {
      toast.success(`Sleep timer set: ${Math.round(duration / 60)} minutes`);
    }
  }, []);

  const updateVoiceConfig = useCallback((config: Partial<DualVoiceConfig>) => {
    if (!pipelineRef.current) return;
    pipelineRef.current.updateVoiceConfig(config);
    const updated = pipelineRef.current.getVoiceConfig();
    setVoiceConfigState(updated);
    try {
      localStorage.setItem("adaptflow_audio_voice_config", JSON.stringify(updated));
    } catch (_) {}
    toast.success("Voice configuration updated");
  }, []);

  // Playlist Navigation
  const currentEpIndex = availableEpisodes.findIndex((e) => e.id === currentEpisode?.id);
  const hasNextEpisode = currentEpIndex >= 0 && currentEpIndex < availableEpisodes.length - 1;
  const hasPreviousEpisode = currentEpIndex > 0;

  const playNextEpisode = useCallback(() => {
    if (hasNextEpisode) {
      const next = availableEpisodes[currentEpIndex + 1];
      playEpisode(next, 0);
    }
  }, [hasNextEpisode, availableEpisodes, currentEpIndex, playEpisode]);

  const playPreviousEpisode = useCallback(() => {
    if (hasPreviousEpisode) {
      const prev = availableEpisodes[currentEpIndex - 1];
      playEpisode(prev, 0);
    }
  }, [hasPreviousEpisode, availableEpisodes, currentEpIndex, playEpisode]);

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

    currentEpisode.segments.forEach((seg) => {
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

  const sendToChat = useCallback(
    (segmentText: string, citationLabel?: string) => {
      try {
        const prompt = `In the Audio Overview discussion on "${currentEpisode?.title || "our study notes"}", Alex and Jordan mentioned:\n\n> "${segmentText}"\n${citationLabel ? `\n(Grounded in ${citationLabel})\n` : ""}\nCould you explain this deeper and give me a concrete example?`;
        localStorage.setItem("adaptflow_pending_chat_prompt", prompt);
        toast.success("Redirecting to AI Tutor Chat with discussion context...");
        router.push("/chat");
      } catch (_) {}
    },
    [currentEpisode, router]
  );

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
        isMuted,
        currentSpeaker,
        isMiniPlayerOpen,
        isModalOpen,
        isGenerating,
        availableEpisodes,
        autoPlayNext,
        activeSleepTimerDuration,
        sleepTimerRemaining,
        activeWord,
        voiceConfig,
        availableVoices,
        hasNextEpisode,
        hasPreviousEpisode,
        playEpisode,
        pause,
        resume,
        togglePlay,
        seekSegment,
        skipForward,
        skipBackward,
        setPlaybackSpeed,
        setVolume,
        toggleMute,
        toggleAutoPlayNext,
        setSleepTimer,
        updateVoiceConfig,
        playNextEpisode,
        playPreviousEpisode,
        openModal,
        closeModal,
        openMiniPlayer,
        closeMiniPlayer,
        generateAndPlay,
        loadMaterialPodcast,
        exportTranscript,
        sendToChat,
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
