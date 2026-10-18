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

export class DualVoiceAudioPipeline {
  private segments: PodcastSegment[] = [];
  private currentSegmentIndex: number = -1;
  private status: AudioPipelineStatus = "idle";
  private playbackSpeed: number = 1.0;
  private volume: number = 1.0;
  private listeners: AudioPipelineListener[] = [];
  private utterance: SpeechSynthesisUtterance | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private alexVoice: SpeechSynthesisVoice | null = null;
  private jordanVoice: SpeechSynthesisVoice | null = null;
  private voiceConfig: DualVoiceConfig = {
    alexPitch: 1.08,
    jordanPitch: 0.92,
    alexRate: 1.02,
    jordanRate: 0.98,
  };

  // Time tracking
  private totalDurationSec: number = 0;
  private elapsedTimeBeforeCurrentSegment: number = 0;
  private segmentStartTime: number = 0;
  private progressTimer: any = null;

  constructor() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      this.initVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => this.initVoices();
      }
    }
  }

  public initVoices() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    this.voices = window.speechSynthesis.getVoices();
    if (!this.voices || this.voices.length === 0) return;

    const englishVoices = this.voices.filter((v) =>
      v.lang.startsWith("en") || v.lang.startsWith("en_") || v.lang.startsWith("en-")
    );
    const pool = englishVoices.length > 0 ? englishVoices : this.voices;

    // Female / higher pitch candidate for Alex
    const alexCandidates = pool.filter(
      (v) =>
        v.name.toLowerCase().includes("zira") ||
        v.name.toLowerCase().includes("female") ||
        v.name.toLowerCase().includes("samantha") ||
        v.name.toLowerCase().includes("karen") ||
        v.name.toLowerCase().includes("jenny") ||
        v.name.toLowerCase().includes("victoria") ||
        v.name.toLowerCase().includes("aria")
    );

    // Male / deeper pitch candidate for Jordan
    const jordanCandidates = pool.filter(
      (v) =>
        v.name.toLowerCase().includes("david") ||
        v.name.toLowerCase().includes("male") ||
        v.name.toLowerCase().includes("daniel") ||
        v.name.toLowerCase().includes("guy") ||
        v.name.toLowerCase().includes("george") ||
        v.name.toLowerCase().includes("mark") ||
        v.name.toLowerCase().includes("alex")
    );

    this.alexVoice = alexCandidates.length > 0 ? alexCandidates[0] : pool[0];
    // Pick contrasting voice for Jordan
    if (jordanCandidates.length > 0) {
      this.jordanVoice = jordanCandidates[0];
    } else {
      this.jordanVoice = pool.length > 1 ? pool[1] : pool[0];
    }
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  public setCustomVoices(alexVoiceName?: string, jordanVoiceName?: string) {
    if (alexVoiceName) {
      const v = this.voices.find((x) => x.name === alexVoiceName);
      if (v) this.alexVoice = v;
    }
    if (jordanVoiceName) {
      const v = this.voices.find((x) => x.name === jordanVoiceName);
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

  public setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.utterance) {
      this.utterance.volume = this.volume;
    }
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
    const segElapsed = (Date.now() - this.segmentStartTime) / 1000 * this.playbackSpeed;
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

    // Clean text of markdown asterisks or special characters for smooth voice synthesis
    const cleanSpeechText = seg.text
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/\[.*?\]/g, "") // skip spoken citation bracket strings
      .trim();

    const utt = new SpeechSynthesisUtterance(cleanSpeechText);
    this.utterance = utt;

    // Apply dual-voice configuration depending on speaker
    const isAlex = seg.speaker.toLowerCase().includes("alex");
    if (isAlex) {
      if (this.alexVoice) utt.voice = this.alexVoice;
      utt.pitch = this.voiceConfig.alexPitch || 1.08;
      utt.rate = (this.voiceConfig.alexRate || 1.02) * this.playbackSpeed;
    } else {
      if (this.jordanVoice) utt.voice = this.jordanVoice;
      utt.pitch = this.voiceConfig.jordanPitch || 0.92;
      utt.rate = (this.voiceConfig.jordanRate || 0.98) * this.playbackSpeed;
    }

    utt.volume = this.volume;

    utt.onstart = () => {
      this.segmentStartTime = Date.now();
      this.setStatus("playing");
      this.startProgressTimer();
      this.listeners.forEach((l) => l.onSegmentChange?.(this.currentSegmentIndex, seg));
    };

    utt.onboundary = (event) => {
      if (event.name === "word") {
        const word = cleanSpeechText.substring(event.charIndex, event.charIndex + event.charLength);
        this.listeners.forEach((l) => l.onWordBoundary?.(event.charIndex, word));
      }
    };

    utt.onend = () => {
      this.stopProgressTimer();
      const segDur = seg.duration_estimate_sec || 5;
      this.elapsedTimeBeforeCurrentSegment += segDur;
      this.currentSegmentIndex += 1;

      if (this.currentSegmentIndex < this.segments.length) {
        // Small organic conversational pause between speaker turns (180ms)
        setTimeout(() => {
          if (this.status === "playing") {
            this.speakCurrentSegment();
          }
        }, 180);
      } else {
        this.setStatus("ended");
        this.notifyTime(this.totalDurationSec);
      }
    };

    utt.onerror = (e) => {
      if (e.error === "canceled" || e.error === "interrupted") return;
      this.stopProgressTimer();
      console.warn("DualVoiceAudioPipeline speech error:", e);
      // Advance to next segment if one fails
      this.currentSegmentIndex += 1;
      if (this.currentSegmentIndex < this.segments.length) {
        this.speakCurrentSegment();
      } else {
        this.setStatus("ended");
      }
    };

    window.speechSynthesis.speak(utt);
  }

  private startProgressTimer() {
    this.stopProgressTimer();
    this.progressTimer = setInterval(() => {
      this.notifyTime(this.getCurrentTime());
    }, 250);
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
