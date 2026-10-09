import { Assignment, StudentSubmission } from "@/lib/types";

const SUBMISSIONS_STORAGE_KEY = "adaptflow:student_submissions";

/**
 * Retrieve saved student assignment submissions from browser localStorage.
 */
export function getStoredSubmissions(): Record<string, StudentSubmission> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(SUBMISSIONS_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (err) {
    console.warn("Failed to parse stored assignment submissions from localStorage", err);
    return {};
  }
}

/**
 * Save a student assignment submission record to localStorage.
 */
export function saveStoredSubmission(
  assignmentId: string,
  submission: StudentSubmission
): void {
  if (typeof window === "undefined") return;
  try {
    const current = getStoredSubmissions();
    current[assignmentId] = submission;
    localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(current));
  } catch (err) {
    console.warn("Failed to persist assignment submission to localStorage", err);
  }
}

/**
 * Merge local student submissions into fetched assignments list so student's uploads
 * always reflect accurately across page reloads and mobile sessions.
 */
export function mergeStoredSubmissions(
  assignments: Assignment[],
  studentId: string
): Assignment[] {
  const stored = getStoredSubmissions();

  return assignments.map((assignment) => {
    const localSub = stored[assignment.id];
    if (localSub && localSub.studentId === studentId) {
      const existingSubs = assignment.submissions || [];
      const hasSubIndex = existingSubs.findIndex((s) => s.studentId === studentId);

      const mergedSubs =
        hasSubIndex >= 0
          ? existingSubs.map((s, idx) => (idx === hasSubIndex ? localSub : s))
          : [...existingSubs, localSub];

      return {
        ...assignment,
        submissions: mergedSubs,
        mySubmission: localSub,
        studentStatus: "submitted" as const,
      };
    }
    return assignment;
  });
}

/**
 * Remove a stored submission from localStorage (e.g., if re-uploading or deleting).
 */
export function clearStoredSubmission(assignmentId: string): void {
  if (typeof window === "undefined") return;
  try {
    const current = getStoredSubmissions();
    delete current[assignmentId];
    localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(current));
  } catch (err) {
    console.warn("Failed to clear stored submission", err);
  }
}
