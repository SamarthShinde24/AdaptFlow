"use client";

import { PodcastSegment, DualVoiceConfig } from "./types";

export type AudioPipelineStatus = "idle" | "playing" | "paused" | "ended";

export interface AudioPipelineListener {
  onStatusChange?: (status: AudioPipelineStatus) => void;
  onSegmentChange?: (segmentIndex: number, segment: PodcastSegment) => void;
  onTimeUpdate?: (currentTimeSec: number, totalDurationSec: number) => void;
  onWordBoundary?: (charIndex: number, word: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Normalizes academic, scientific, and mathematical text into spoken dialogue.
 * Converts LaTeX expressions, equations, acronyms, and formatting into natural speech.
 */
export function normalizeTextForSpeech(rawText: string): string {
  if (!rawText) return "";

  let text = rawText
    // Remove markdown formatting
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[(?:Slide|PDF|Chapter|Lecture|Page)[^\]]*\]/gi, "") // skip spoken citation tokens
    .replace(/\[\s*.*?\s*\|\s*.*?\s*\]/g, "")
    // Mathematical & scientific symbols
    .replace(/\\approx|≈/g, " approximately equals ")
    .replace(/\\ne|!=|≠/g, " is not equal to ")
    .replace(/\\le|<=|≤/g, " is less than or equal to ")
    .replace(/\\ge|>=|≥/g, " is greater than or equal to ")
    .replace(/\\pm|±/g, " plus or minus ")
    .replace(/\\times|×/g, " times ")
    .replace(/\\div|÷/g, " divided by ")
    .replace(/\\cdot|•/g, " dot ")
    .replace(/\\pi|π/g, " pie ")
    .replace(/\\theta|θ/g, " theta ")
    .replace(/\\alpha|α/g, " alpha ")
    .replace(/\\beta|β/g, " beta ")
    .replace(/\\lambda|λ/g, " lambda ")
    .replace(/\\sigma|σ/g, " sigma ")
    .replace(/\\Delta|Δ|\\delta/g, " delta ")
    .replace(/\\Sigma|∑|\\sum/g, " sum of ")
    .replace(/\\int|∫/g, " integral of ")
    .replace(/\\infty|∞/g, " infinity ")
    .replace(/\\sqrt\{([^}]+)\}/g, "square root of $1")
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "$1 over $2")
    // Superscripts and powers
    .replace(/\^2|²/g, " squared")
    .replace(/\^3|³/g, " cubed")
    .replace(/\^([0-9]+)/g, " to the power of $1")
    // Chemical and biological nomenclature
    .replace(/\bH2O\b|\bH_2O\b/gi, "H 2 O")
    .replace(/\bCO2\b|\bCO_2\b/gi, "C O 2")
    .replace(/\bO2\b|\bO_2\b/gi, "O 2")
    .replace(/\bATP\b/g, "A T P")
    .replace(/\bADP\b/g, "A D P")
    .replace(/\bNADH\b/g, "N A D H")
    .replace(/\bFADH2\b|\bFADH_2\b/g, "F A D H 2")
    .replace(/\bDNA\b/g, "D N A")
    .replace(/\bRNA\b/g, "R N A")
    .replace(/\bmRNA\b/g, "messenger R N A")
    .replace(/\btRNA\b/g, "transfer R N A")
    // Tech & Computer Science Acronyms
    .replace(/\bLLM\b/g, "L L M")
    .replace(/\bLLMs\b/g, "L L Ms")
    .replace(/\bRAG\b/g, "rag")
    .replace(/\bAPI\b/g, "A P I")
    .replace(/\bAPIs\b/g, "A P Is")
    .replace(/\bSQL\b/g, "sequel")
    .replace(/\bDBMS\b/g, "D B M S")
    .replace(/\bTTS\b/g, "T T S")
    .replace(/\bGPU\b/g, "G P U")
    .replace(/\bCPU\b/g, "C P U")
    .replace(/\bML\b/g, "M L")
    .replace(/\bAI\b/g, "A I")
    // Clean whitespace and trailing punctuation
    .replace(/\s+/g, " ")
    .trim();

  return text;
}

export class DualVoiceAudioPipeline {
  private segments: PodcastSegment[] = [];
  private currentSegmentIndex: number = -1;
  private status: AudioPipelineStatus = "idle";
  private playbackSpeed: number = 1.0;
  private volume: number = 1.0;
  private previousVolume: number = 1.0;
  private muted: boolean = false;
  private listeners: AudioPipelineListener[] = [];
  private utterance: SpeechSynthesisUtterance | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private alexVoice: SpeechSynthesisVoice | null = null;
  private jordanVoice: SpeechSynthesisVoice | null = null;
  private voiceConfig: DualVoiceConfig = {
    alexPitch: 1.06,
    jordanPitch: 0.92,
    alexRate: 1.02,
    jordanRate: 0.98,
    alexVolume: 1.0,
    jordanVolume: 1.0,
  };

  // Time tracking
  private totalDurationSec: number = 0;
  private elapsedTimeBeforeCurrentSegment: number = 0;
  private segmentStartTime: number = 0;
  private progressTimer: any = null;

  constructor() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        this.initVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
          window.speechSynthesis.onvoiceschanged = () => this.initVoices();
        }
      } catch (err) {
        console.warn("SpeechSynthesis init notice:", err);
      }
    }
  }

  public initVoices() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      this.voices = window.speechSynthesis.getVoices() || [];
    } catch {
      this.voices = [];
    }
    if (!this.voices || this.voices.length === 0) return;

    const englishVoices = this.voices.filter((v) =>
      v.lang.startsWith("en") || v.lang.startsWith("en_") || v.lang.startsWith("en-")
    );
    const pool = englishVoices.length > 0 ? englishVoices : this.voices;

    // Prioritize high-definition Natural / Neural voices
    const isNatural = (v: SpeechSynthesisVoice) =>
      v.name.includes("Natural") ||
      v.name.includes("Online") ||
      v.name.includes("Neural") ||
      v.name.includes("Google");

    // Female / higher pitch candidate for Alex (Co-Host / Inquisitive)
    const alexCandidates = pool.filter(
      (v) =>
        v.name.toLowerCase().includes("zira") ||
        v.name.toLowerCase().includes("female") ||
        v.name.toLowerCase().includes("samantha") ||
        v.name.toLowerCase().includes("karen") ||
        v.name.toLowerCase().includes("jenny") ||
        v.name.toLowerCase().includes("victoria") ||
        v.name.toLowerCase().includes("aria") ||
        v.name.toLowerCase().includes("ava")
    );
    alexCandidates.sort((a, b) => (isNatural(b) ? 1 : 0) - (isNatural(a) ? 1 : 0));

    // Male / deeper pitch candidate for Jordan (Expert Analyst / Citations)
    const jordanCandidates = pool.filter(
      (v) =>
        v.name.toLowerCase().includes("david") ||
        v.name.toLowerCase().includes("male") ||
        v.name.toLowerCase().includes("daniel") ||
        v.name.toLowerCase().includes("guy") ||
        v.name.toLowerCase().includes("george") ||
        v.name.toLowerCase().includes("mark") ||
        v.name.toLowerCase().includes("christopher") ||
        v.name.toLowerCase().includes("alex")
    );
    jordanCandidates.sort((a, b) => (isNatural(b) ? 1 : 0) - (isNatural(a) ? 1 : 0));

    // If custom names already set, honor them
    if (this.voiceConfig.alexVoiceName) {
      const v = this.voices.find((x) => x.name === this.voiceConfig.alexVoiceName);
      if (v) this.alexVoice = v;
    }
    if (!this.alexVoice) {
      this.alexVoice = alexCandidates.length > 0 ? alexCandidates[0] : pool[0];
    }

    if (this.voiceConfig.jordanVoiceName) {
      const v = this.voices.find((x) => x.name === this.voiceConfig.jordanVoiceName);
      if (v) this.jordanVoice = v;
    }
    if (!this.jordanVoice) {
      if (jordanCandidates.length > 0) {
        this.jordanVoice = jordanCandidates[0];
      } else {
        this.jordanVoice = pool.length > 1 ? pool[1] : pool[0];
      }
    }
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  public getVoiceConfig(): DualVoiceConfig {
    return { ...this.voiceConfig };
  }

  public updateVoiceConfig(config: Partial<DualVoiceConfig>) {
    this.voiceConfig = { ...this.voiceConfig, ...config };
    if (config.alexVoiceName) {
      const v = this.voices.find((x) => x.name === config.alexVoiceName);
      if (v) this.alexVoice = v;
    }
    if (config.jordanVoiceName) {
      const v = this.voices.find((x) => x.name === config.jordanVoiceName);
      if (v) this.jordanVoice = v;
    }
  }

  public subscribe(listener: AudioPipelineListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public loadSegments(segments: PodcastSegment[]) {
    this.stop();
    this.segments = segments;
    this.totalDurationSec = segments.reduce(
      (sum, s) => sum + (s.duration_estimate_sec || 5),
      0
    );
    this.currentSegmentIndex = 0;
    this.elapsedTimeBeforeCurrentSegment = 0;
    this.notifyTime(0);
  }

  public play(fromSegmentIndex?: number) {
    if (this.segments.length === 0) return;

    if (fromSegmentIndex !== undefined && fromSegmentIndex >= 0) {
      this.currentSegmentIndex = Math.min(fromSegmentIndex, this.segments.length - 1);
      this.elapsedTimeBeforeCurrentSegment = this.segments
        .slice(0, this.currentSegmentIndex)
        .reduce((sum, s) => sum + (s.duration_estimate_sec || 5), 0);
    }

    if (this.currentSegmentIndex < 0) {
      this.currentSegmentIndex = 0;
      this.elapsedTimeBeforeCurrentSegment = 0;
    }

    if (this.status === "paused") {
      this.resume();
      return;
    }

    this.speakCurrentSegment();
  }

  public pause() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.pause();
    }
    this.stopProgressTimer();
    this.setStatus("paused");
  }

  public resume() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        this.setStatus("playing");
        this.startProgressTimer();
        return;
      }
    }
    // If resuming failed or was dropped by browser engine, restart current segment
    this.speakCurrentSegment();
  }

  public stop() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    this.stopProgressTimer();
    this.utterance = null;
    this.setStatus("idle");
  }

  public setPlaybackSpeed(speed: number) {
    this.playbackSpeed = speed;
    if (this.status === "playing") {
      // Re-trigger current segment at new speed smoothly
      this.speakCurrentSegment();
    }
  }

  public getPlaybackSpeed(): number {
    return this.playbackSpeed;
  }

  public setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    this.muted = this.volume === 0;
    if (this.utterance) {
      this.utterance.volume = this.volume;
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public toggleMute(): boolean {
    if (this.muted) {
      this.volume = this.previousVolume > 0 ? this.previousVolume : 1.0;
      this.muted = false;
    } else {
      this.previousVolume = this.volume;
      this.volume = 0;
      this.muted = true;
    }
    if (this.utterance) {
      this.utterance.volume = this.volume;
    }
    return this.muted;
  }

  public seekToSegment(index: number) {
    if (index < 0 || index >= this.segments.length) return;
    const wasPlaying = this.status === "playing";
    this.stop();
    this.currentSegmentIndex = index;
    this.elapsedTimeBeforeCurrentSegment = this.segments
      .slice(0, index)
      .reduce((sum, s) => sum + (s.duration_estimate_sec || 5), 0);
    this.notifyTime(this.elapsedTimeBeforeCurrentSegment);

    if (wasPlaying) {
      this.play(index);
    } else {
      const seg = this.segments[index];
      this.listeners.forEach((l) => l.onSegmentChange?.(index, seg));
    }
  }

  public skipSeconds(seconds: number) {
    const currentEstTime = this.getCurrentTime();
    const targetTime = Math.max(0, Math.min(this.totalDurationSec, currentEstTime + seconds));

    // Find segment corresponding to targetTime
    let accumulated = 0;
    let targetIdx = 0;
    for (let i = 0; i < this.segments.length; i++) {
      const segDur = this.segments[i].duration_estimate_sec || 5;
      if (accumulated + segDur >= targetTime) {
        targetIdx = i;
        break;
      }
      accumulated += segDur;
    }
    this.seekToSegment(targetIdx);
  }

  public getCurrentTime(): number {
    if (this.status !== "playing") {
      return this.elapsedTimeBeforeCurrentSegment;
    }
    const segElapsed = ((Date.now() - this.segmentStartTime) / 1000) * this.playbackSpeed;
    return Math.min(this.totalDurationSec, this.elapsedTimeBeforeCurrentSegment + segElapsed);
  }

  public getTotalDuration(): number {
    return this.totalDurationSec;
  }

  public getCurrentSegment(): PodcastSegment | null {
    if (this.currentSegmentIndex >= 0 && this.currentSegmentIndex < this.segments.length) {
      return this.segments[this.currentSegmentIndex];
    }
    return null;
  }

  public getCurrentSegmentIndex(): number {
    return this.currentSegmentIndex;
  }

  public getStatus(): AudioPipelineStatus {
    return this.status;
  }

  private speakCurrentSegment() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      this.notifyError(new Error("Web Speech Synthesis API is not supported in this browser."));
      return;
    }

    if (this.currentSegmentIndex < 0 || this.currentSegmentIndex >= this.segments.length) {
      this.stop();
      this.setStatus("ended");
      return;
    }

    const seg = this.segments[this.currentSegmentIndex];
    window.speechSynthesis.cancel();

    // Clean text and pronounce formulas naturally
    const cleanSpeechText = normalizeTextForSpeech(seg.text);

    const utt = new SpeechSynthesisUtterance(cleanSpeechText);
    this.utterance = utt;

    // Apply dual-voice configuration depending on speaker
    const isAlex = seg.speaker.toLowerCase().includes("alex");
    if (isAlex) {
      if (this.alexVoice) utt.voice = this.alexVoice;
      utt.pitch = this.voiceConfig.alexPitch || 1.06;
      utt.rate = (this.voiceConfig.alexRate || 1.02) * this.playbackSpeed;
    } else {
      if (this.jordanVoice) utt.voice = this.jordanVoice;
      utt.pitch = this.voiceConfig.jordanPitch || 0.92;
      utt.rate = (this.voiceConfig.jordanRate || 0.98) * this.playbackSpeed;
    }

    utt.volume = this.muted ? 0 : this.volume;

    utt.onstart = () => {
      this.segmentStartTime = Date.now();
      this.setStatus("playing");
      this.startProgressTimer();
      this.listeners.forEach((l) => l.onSegmentChange?.(this.currentSegmentIndex, seg));
    };

    utt.onboundary = (event) => {
      if (event.name === "word") {
        const word = cleanSpeechText.substring(event.charIndex, event.charIndex + (event.charLength || 6));
        this.listeners.forEach((l) => l.onWordBoundary?.(event.charIndex, word));
      }
    };

    utt.onend = () => {
      this.stopProgressTimer();
      const segDur = seg.duration_estimate_sec || 5;
      this.elapsedTimeBeforeCurrentSegment += segDur;
      this.currentSegmentIndex += 1;

      if (this.currentSegmentIndex < this.segments.length) {
        // Natural conversational pause between speaker turns (~200ms)
        setTimeout(() => {
          if (this.status === "playing") {
            this.speakCurrentSegment();
          }
        }, 200);
      } else {
        this.setStatus("ended");
        this.notifyTime(this.totalDurationSec);
      }
    };

    utt.onerror = (e) => {
      if (e.error === "canceled" || e.error === "interrupted") return;
      this.stopProgressTimer();
      console.warn("DualVoiceAudioPipeline speech notice:", e);
      // Advance to next segment if one encounters an audio interruption
      this.currentSegmentIndex += 1;
      if (this.currentSegmentIndex < this.segments.length) {
        this.speakCurrentSegment();
      } else {
        this.setStatus("ended");
      }
    };

    try {
      window.speechSynthesis.speak(utt);
    } catch (err) {
      console.warn("speechSynthesis.speak execution error:", err);
      this.setStatus("ended");
    }
  }

  private startProgressTimer() {
    this.stopProgressTimer();
    this.progressTimer = setInterval(() => {
      this.notifyTime(this.getCurrentTime());
    }, 200);
  }

  private stopProgressTimer() {
    if (this.progressTimer) {
      clearInterval(this.progressTimer);
      this.progressTimer = null;
    }
  }

  private setStatus(status: AudioPipelineStatus) {
    this.status = status;
    this.listeners.forEach((l) => l.onStatusChange?.(status));
  }

  private notifyTime(timeSec: number) {
    this.listeners.forEach((l) => l.onTimeUpdate?.(timeSec, this.totalDurationSec));
  }

  private notifyError(err: Error) {
    this.listeners.forEach((l) => l.onError?.(err));
  }
}

// Global singleton instance for app-wide continuity
let globalAudioPipeline: DualVoiceAudioPipeline | null = null;

export function getAudioPipeline(): DualVoiceAudioPipeline {
  if (typeof window === "undefined") {
    return new DualVoiceAudioPipeline();
  }
  if (!globalAudioPipeline) {
    globalAudioPipeline = new DualVoiceAudioPipeline();
  }
  return globalAudioPipeline;
}
