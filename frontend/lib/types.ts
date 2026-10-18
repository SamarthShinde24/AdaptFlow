export type MaterialType = "textbook" | "lecture_video" | "slide_deck";

export type ProcessingStatus = "pending" | "parsing" | "indexed" | "failed";

export type ModalityType =
  | "text"
  | "speech_transcript"
  | "slide_content"
  | "speaker_notes"
  | "table"
  | "visual_caption"
  | "visual";

export interface BoundingBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  page?: number;
}

export interface SourceTrackingMetadata {
  material_id: string;
  material_title: string;
  material_type: MaterialType;
  chunk_index: number;

  // Textbook locators
  page_number?: number | null;
  page_range?: string | null;
  chapter?: string | null;
  section?: string | null;
  paragraph_index?: number | null;
  bounding_box?: BoundingBox | null;

  // Video locators
  start_time_seconds?: number | null;
  end_time_seconds?: number | null;
  start_timestamp?: string | null;
  end_timestamp?: string | null;
  speaker_label?: string | null;
  keyframe_asset_path?: string | null;

  // Slide deck locators
  slide_number?: number | null;
  slide_title?: string | null;
  shape_index?: number | null;
  is_speaker_notes: boolean;
  slide_thumbnail_path?: string | null;

  // Visual & diagram locators
  visual_type?: "diagram" | "chart" | "figure" | "table" | "illustration" | string | null;
  figure_index?: number | null;
  caption?: string | null;
  image_stored_path?: string | null;
  is_visual?: boolean;

  // Citation & verification
  citation_label: string;
  content_hash: string;
  token_count: number;
  confidence_score: number;
  extra?: Record<string, any>;
}

export interface KnowledgeUnit {
  id: string;
  material_id: string;
  content: string;
  modality: ModalityType;
  source_tracking: SourceTrackingMetadata;
  summary?: string | null;
  tags: string[];
  created_at: string;
}

export interface Material {
  id: string;
  title: string;
  material_type: MaterialType;
  filename: string;
  file_size_bytes: number;
  mime_type?: string | null;
  file_url?: string | null;
  course_id?: string | null;
  subject?: string | null;
  status: ProcessingStatus;
  status_message?: string | null;
  total_units_extracted: number;
  image_extraction_status?: "pending" | "processing" | "complete" | "failed";
  total_visuals_extracted?: number;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface UploadProgressItem {
  id: string;
  file: File;
  fileName: string;
  fileSize: number;
  materialType: MaterialType;
  status: "uploading" | "processing" | "ready" | "error";
  progress: number;
  errorMessage?: string;
  materialId?: string;
  taskId?: string;
}

export interface CitationReference {
  key: string; // e.g. "[Slide 4]", "[PDF p.12]"
  unit: KnowledgeUnit;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: CitationReference[];
  timestamp: Date | string;
  isStreaming?: boolean;
}

export type QuestionType = "multiple_choice" | "short_answer";

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[]; // for multiple choice
  correct_answer: string | number; // index (0-3) or string answer
  explanation: string;
  source_citation: string;
  difficulty: "easy" | "medium" | "hard";
  concept: string;
  material_id?: string;
  source_type?: "text" | "visual";
  image_stored_path?: string | null;
  visual_type?: string | null;
  figure_index?: number | null;
  page_number?: number | null;
  slide_number?: number | null;
  misconception?: string;
  key_rubric_points?: string[];
}

export interface QuizAnswerRecord {
  questionId: string;
  selectedOptionIndex?: number;
  shortAnswerText?: string;
  isCorrect: boolean;
  score?: number; // 0 to 100 for graded short answers / partial credit
  explanation: string;
  sourceCitation: string;
  concept?: string;
  questionText?: string;
  misconception?: string;
  matchedKeywords?: string[];
  missingKeywords?: string[];
}

export type AcceptedFileType = "PDF" | "PPT" | "DOCX" | "TXT";
export type TaskStatus = "pending" | "submitted" | "overdue";

export interface StudentSubmission {
  studentId: string;
  studentName: string;
  studentEmail?: string;
  status: "pending" | "submitted";
  submittedAt?: string;
  fileName?: string;
  fileSizeBytes?: number;
  fileUrl?: string;
}

export interface Assignment {
  id: string;
  title: string;
  instructions: string;
  instructorId: string;
  instructorName: string;
  course: string;
  courseId?: string;
  assignedStudentIds: string[];
  assignedToLabel?: string;
  acceptedFileTypes: AcceptedFileType[];
  dueDate: string;
  createdAt: string;
  submissions: StudentSubmission[];
  // Student computed properties
  mySubmission?: StudentSubmission | null;
  studentStatus?: TaskStatus;
}

export interface EnrolledStudent {
  id: string;
  name: string;
  email: string;
  course: string;
  grade?: string;
  avatar?: string;
}

// ===========================================================================
// Audio Overview (AI Podcast / Deep Dive) Types
// ===========================================================================

export interface PodcastCitation {
  source_title: string;
  citation_label: string;
  page_or_timestamp?: string;
  material_type?: string;
}

export interface PodcastSegment {
  id: string;
  speaker: "Alex" | "Jordan" | string;
  text: string;
  duration_estimate_sec: number;
  citation?: PodcastCitation;
}

export interface AudioOverviewEpisode {
  id: string;
  title: string;
  subtitle: string;
  material_ids: string[];
  material_titles: string[];
  duration_seconds: number;
  created_at: string;
  summary: string;
  key_takeaways: string[];
  segments: PodcastSegment[];
  hosts?: Record<string, string>;
}

export interface DualVoiceConfig {
  alexVoiceName?: string;
  jordanVoiceName?: string;
  alexPitch?: number;
  jordanPitch?: number;
  alexRate?: number;
  jordanRate?: number;
}
