import {
  Material,
  MaterialType,
  KnowledgeUnit,
  QuizQuestion,
  CitationReference,
} from "./types";
import { StreamAssembler } from "./stream-utils";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

/**
 * Uploads a multimodal study material to FastAPI backend
 */
export async function uploadMaterial(
  file: File,
  materialType: MaterialType,
  title: string,
  courseId?: string,
  subject?: string
): Promise<{ material: Material; task_id: string; check_status_url: string }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("material_type", materialType);
  formData.append("title", title);
  if (courseId) formData.append("course_id", courseId);
  if (subject) formData.append("subject", subject);

  const res = await fetch(`${API_BASE_URL}/api/v1/materials/upload`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new ApiError(
      errorData.detail || errorData.error || `Upload failed with status ${res.status}`,
      res.status
    );
  }

  const json = await res.json();
  return {
    material: json.material || json.data?.material,
    task_id: json.task_id || json.data?.job_id || json.data?.task_id,
    check_status_url: json.check_status_url || `/api/v1/tasks/${json.task_id || json.data?.job_id}/status`,
  };
}

/**
 * Polls the ingestion task progress
 */
export async function getTaskStatus(taskId: string): Promise<{
  task_id: string;
  material_id: string;
  status: "pending" | "parsing" | "indexed" | "failed";
  progress_percentage: number;
  message?: string;
  units_extracted: number;
}> {
  const res = await fetch(`${API_BASE_URL}/api/v1/tasks/${taskId}/status`, {
    credentials: "include",
  });
  if (!res.ok) {
    throw new ApiError("Failed to fetch task status", res.status);
  }
  const json = await res.json();
  return {
    task_id: json.task_id || taskId,
    material_id: json.material_id || json.data?.material_id || "",
    status: json.status || json.data?.status || "pending",
    progress_percentage: typeof json.progress_percentage === "number" ? json.progress_percentage : Math.round((json.data?.progress || 0) * 100),
    message: json.message || json.data?.message || "",
    units_extracted: json.units_extracted || json.data?.units_extracted || 0,
  };
}

/**
 * Lists all registered materials
 */
export async function listMaterials(
  courseId?: string,
  materialType?: MaterialType
): Promise<Material[]> {
  const params = new URLSearchParams();
  if (courseId) params.append("course_id", courseId);
  if (materialType) params.append("material_type", materialType);

  const res = await fetch(`${API_BASE_URL}/api/v1/materials?${params.toString()}`, {
    credentials: "include",
  });
  if (!res.ok) {
    throw new ApiError("Failed to fetch materials", res.status);
  }
  const data = await res.json();
  return data.materials || data.data?.materials || data.data || [];
}

/**
 * Deletes a material and its knowledge base chunks
 */
export async function deleteMaterial(materialId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/v1/materials/${materialId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    throw new ApiError("Failed to delete material", res.status);
  }
}

/**
 * Fetches all knowledge units for a specific material
 */
export async function getMaterialKnowledgeUnits(
  materialId: string
): Promise<KnowledgeUnit[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/knowledge/material/${materialId}`, {
    credentials: "include",
  });
  if (!res.ok) {
    throw new ApiError("Failed to load knowledge units", res.status);
  }
  const json = await res.json();
  return json.results || json.data || json || [];
}

/**
 * Searches the multimodal knowledge base
 */
export async function searchKnowledge(
  query: string,
  filters?: {
    materialType?: MaterialType;
    materialId?: string;
    modality?: string;
    minPage?: number;
    maxPage?: number;
    slideNumber?: number;
    limit?: number;
  }
): Promise<{ results: KnowledgeUnit[]; total: number }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/knowledge/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      material_type: filters?.materialType,
      material_id: filters?.materialId,
      modality: filters?.modality,
      min_page: filters?.minPage,
      max_page: filters?.maxPage,
      slide_number: filters?.slideNumber,
      limit: filters?.limit || 10,
    }),
  });

  if (!res.ok) {
    throw new ApiError("Search request failed", res.status);
  }
  return res.json();
}

/**
 * Initiates SSE streaming chat from FastAPI
 */
export async function streamChatCompletion({
  message,
  history,
  materialId,
  onDelta,
  onSources,
  onDone,
  onError,
}: {
  message: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  materialId?: string;
  onDelta: (text: string) => void;
  onSources: (citations: CitationReference[]) => void;
  onDone: () => void;
  onError: (err: Error) => void;
}): Promise<void> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        history,
        material_id: materialId,
      }),
    });

    if (!res.ok) {
      throw new Error(`Chat API error: ${res.status} ${res.statusText}`);
    }

    if (!res.body) {
      throw new Error("No readable stream received from server.");
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    const assembler = new StreamAssembler();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const block of lines) {
        if (!block.trim()) continue;
        const eventLines = block.split("\n");
        let eventType = "message";
        let eventData = "";

        for (const line of eventLines) {
          if (line.startsWith("event: ")) {
            eventType = line.replace("event: ", "").trim();
          } else if (line.startsWith("data: ")) {
            eventData = line.replace("data: ", "").trim();
          }
        }

        try {
          if (eventType === "sources") {
            const sourcesData: CitationReference[] = JSON.parse(eventData);
            onSources(sourcesData);
          } else if (eventType === "delta") {
            const deltaObj = JSON.parse(eventData);
            const rawToken = deltaObj.content || "";
            const normalizedDelta = assembler.ingest(rawToken);
            if (normalizedDelta) {
              onDelta(normalizedDelta);
            }
          } else if (eventType === "done") {
            const flushed = assembler.flush();
            if (flushed) {
              onDelta(flushed);
            }
            onDone();
          }
        } catch {
          // If plain text token
          if (eventData) {
            const normalizedDelta = assembler.ingest(eventData);
            if (normalizedDelta) {
              onDelta(normalizedDelta);
            }
          }
        }
      }
    }

    const flushed = assembler.flush();
    if (flushed) {
      onDelta(flushed);
    }
    onDone();
  } catch (err: any) {
    onError(err instanceof Error ? err : new Error(String(err)));
  }
}

/**
 * Fetches adaptive assessment questions from backend
 */
export async function getQuizQuestions(
  materialId?: string,
  count = 5,
  difficulty?: string
): Promise<QuizQuestion[]> {
  const params = new URLSearchParams();
  if (materialId) params.append("material_id", materialId);
  params.append("count", count.toString());
  if (difficulty) params.append("difficulty", difficulty);

  const res = await fetch(`${API_BASE_URL}/api/v1/quiz/questions?${params.toString()}`);
  if (!res.ok) {
    throw new ApiError("Failed to fetch assessment questions", res.status);
  }
  return res.json();
}

/**
 * Generates quiz questions from an uploaded material via FastAPI POST /api/quiz/generate
 */
export async function generateQuizQuestions(
  fileId: string,
  questionCount = 10,
  difficulty: "easy" | "medium" | "advanced" = "medium"
): Promise<QuizQuestion[]> {
  const payload = { file_id: fileId, question_count: questionCount, difficulty };

  // 1. Try Next.js API route /api/quiz/generate
  try {
    const res = await fetch("/api/quiz/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    // Fall back to direct backend endpoint
  }

  // 2. Direct FastAPI backend endpoint
  try {
    const res = await fetch(`${API_BASE_URL}/api/quiz/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    // Fall back to v1 router
  }

  // 3. Fallback to v1 router
  const res = await fetch(`${API_BASE_URL}/api/v1/quiz/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new ApiError(
      errorData.detail || `Quiz generation failed with status ${res.status}`,
      res.status
    );
  }

  return await res.json();
}

// Deliverable 8: Centralized Axios API client with interceptors
export { apiClient, api } from "./api-client";

