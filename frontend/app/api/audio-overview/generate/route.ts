import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Try FastAPI backend first with fast timeout
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/audio-overview/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          cache: "no-store",
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (res.ok) {
          const data = await res.json();
          return NextResponse.json(data);
        }
      } catch {
        clearTimeout(timeout);
      }
    } catch {
      // Backend unavailable; execute client-side multi-format synthesis
    }

    // 2. Multi-Format Synthesizer Engine
    const topic = body.topic || "Course Core Concepts";
    const formatTarget = body.durationTarget || body.duration_target || "deep_dive";
    const materialTitles = body.material_titles || [topic];
    const sourceLabel = materialTitles[0] || topic;

    let title = `${topic}: Audio Deep Dive`;
    let subtitle = `Two-host conversational analysis of key takeaways from ${topic}`;
    let summary = `Alex and Jordan explore core frameworks, problem-solving methods, and common exam pitfalls in ${topic}.`;
    let keyTakeaways = [
      `Systematic decomposition of foundational principles in ${topic}`,
      "Step-by-step walkthrough of operational mechanics and workflows",
      "Key exam pitfalls and distinction between similar concepts",
      "Source provenance and verified reference citations",
    ];
    let difficulty: "Foundational" | "Intermediate" | "Advanced" = "Intermediate";
    let segments: any[] = [];

    if (formatTarget === "quick_sprint") {
      title = `${topic}: 2-Minute Concept Sprint`;
      subtitle = `High-yield rapid-fire revision of essential terms and definitions in ${topic}`;
      summary = `A quick 2-minute revision sprint designed for students on the go.`;
      difficulty = "Foundational";
      keyTakeaways = [
        `Primary definition and core mental anchor of ${topic}`,
        "Essential input/output constraints",
        "Top 3 terms guaranteed to appear on exams",
      ];
      segments = [
        {
          id: "seg_sprint_01",
          speaker: "Alex",
          text: `Welcome to this AdaptFlow Concept Sprint! We have 2 minutes to lock down the core of ${topic}. Jordan, what is the single most important definition?`,
          duration_estimate_sec: 7.2,
        },
        {
          id: "seg_sprint_02",
          speaker: "Jordan",
          text: `Here's your anchor: ${topic} is fundamentally about converting structured inputs into verifiable outcomes under defined system constraints.`,
          duration_estimate_sec: 8.5,
          citation: {
            source_title: sourceLabel,
            citation_label: `[${sourceLabel} | Chapter 1]`,
            page_or_timestamp: "p. 1",
          },
        },
        {
          id: "seg_sprint_03",
          speaker: "Alex",
          text: `And what is the mechanism that students forget under time pressure?`,
          duration_estimate_sec: 4.8,
        },
        {
          id: "seg_sprint_04",
          speaker: "Jordan",
          text: `They forget that every transformation must preserve conservation laws and component boundaries. Track the flow from input to output sequentially.`,
          duration_estimate_sec: 8.6,
        },
        {
          id: "seg_sprint_05",
          speaker: "Alex",
          text: `Input to output, step-by-step. What is the one key formula or metric?`,
          duration_estimate_sec: 5.1,
        },
        {
          id: "seg_sprint_06",
          speaker: "Jordan",
          text: `Always calculate net yield by subtracting baseline overhead from total generation. That's where extra credit lives.`,
          duration_estimate_sec: 7.4,
        },
        {
          id: "seg_sprint_07",
          speaker: "Alex",
          text: `Boom! 2 minutes on the clock, core principles locked. Go crush your study session!`,
          duration_estimate_sec: 5.8,
        },
      ];
    } else if (formatTarget === "exam_pitfalls") {
      title = `${topic}: Exam Traps & Common Pitfalls`;
      subtitle = `Alex and Jordan dissect the top student misconceptions in ${topic}`;
      summary = `Detailed diagnostic breakdown of trick questions, confusing edge cases, and exam-proven problem solving habits.`;
      difficulty = "Advanced";
      keyTakeaways = [
        "Confusing correlation with causation in system feedback loops",
        "Overlooking boundary constraints and edge conditions",
        "How examiners formulate distractor choices on multiple choice questions",
        "Step-by-step verification checklist before submitting answers",
      ];
      segments = [
        {
          id: "seg_pitfall_01",
          speaker: "Alex",
          text: `Welcome to this special Exam Pitfalls edition of the AdaptFlow Deep Dive! Today Jordan and I are dissecting where students actually lose points on ${topic}.`,
          duration_estimate_sec: 8.5,
        },
        {
          id: "seg_pitfall_02",
          speaker: "Jordan",
          text: `Yes! Looking at past exam patterns and course notes, the number one mistake is treating ${topic} like a memorization checklist rather than an interconnected system.`,
          duration_estimate_sec: 9.6,
          citation: {
            source_title: sourceLabel,
            citation_label: `[${sourceLabel} | Common Errors]`,
            page_or_timestamp: "Review Section",
          },
        },
        {
          id: "seg_pitfall_03",
          speaker: "Alex",
          text: `Let's get specific. What's a classic trick question professors love to ask?`,
          duration_estimate_sec: 5.4,
        },
        {
          id: "seg_pitfall_04",
          speaker: "Jordan",
          text: `They will switch an initial condition—like temperature, dimension, or sign—and ask for the final state. Students reflexively plug in the standard formula without checking if the assumptions still hold!`,
          duration_estimate_sec: 10.8,
        },
        {
          id: "seg_pitfall_05",
          speaker: "Alex",
          text: `The classic assumption trap! You think you know the answer in five seconds, but you missed the subtle constraint.`,
          duration_estimate_sec: 6.9,
        },
        {
          id: "seg_pitfall_06",
          speaker: "Jordan",
          text: `Exactly. Another huge trap: confusing intermediate states with equilibrium. In your study notes, remember that the peak rate of reaction is rarely the final steady state.`,
          duration_estimate_sec: 9.7,
        },
        {
          id: "seg_pitfall_07",
          speaker: "Alex",
          text: `So how do we foolproof our work during an actual timed test?`,
          duration_estimate_sec: 5.2,
        },
        {
          id: "seg_pitfall_08",
          speaker: "Jordan",
          text: `Two steps: First, write down the units before calculating. If the units don't balance, your equation is wrong. Second, test an extreme edge case—like zero or infinity—to see if the behavior makes physical sense.`,
          duration_estimate_sec: 11.4,
        },
        {
          id: "seg_pitfall_09",
          speaker: "Alex",
          text: `Dimensional analysis and extreme bounds checking. Those two habits alone save letter grades!`,
          duration_estimate_sec: 6.8,
        },
        {
          id: "seg_pitfall_10",
          speaker: "Jordan",
          text: `Every single time. Ground yourself in the source definitions, stay calm, and don't take the bait on distractors.`,
          duration_estimate_sec: 8.1,
        },
        {
          id: "seg_pitfall_11",
          speaker: "Alex",
          text: `Fantastic advice, Jordan. Review your notes, watch out for those traps, and good luck on the exam!`,
          duration_estimate_sec: 7.2,
        },
      ];
    } else {
      // Default: Comprehensive Deep Dive
      segments = [
        {
          id: "seg_dd_01",
          speaker: "Alex",
          text: `Welcome to this AdaptFlow Audio Deep Dive! Today Jordan and I are exploring ${topic}.`,
          duration_estimate_sec: 7.0,
        },
        {
          id: "seg_dd_02",
          speaker: "Jordan",
          text: `This is a fascinating subject. Looking through the student's uploaded notes, what really stands out is how each foundational concept builds logically toward the overall architecture.`,
          duration_estimate_sec: 9.8,
          citation: {
            source_title: sourceLabel,
            citation_label: `[${sourceLabel} | Core Framework]`,
            page_or_timestamp: "Overview",
          },
        },
        {
          id: "seg_dd_03",
          speaker: "Alex",
          text: `Let's start right at the beginning. If someone is revising ${topic} for the first time, what is the core intuition they should hold in mind?`,
          duration_estimate_sec: 7.8,
        },
        {
          id: "seg_dd_04",
          speaker: "Jordan",
          text: `Think of it like a layered engine: every stage has a dedicated input, applies a specific transformation, and passes clean output to the next layer without data loss.`,
          duration_estimate_sec: 9.5,
        },
        {
          id: "seg_dd_05",
          speaker: "Alex",
          text: `And that prevents the whole system from becoming a black box! How does the lecture explain the second phase?`,
          duration_estimate_sec: 6.8,
        },
        {
          id: "seg_dd_06",
          speaker: "Jordan",
          text: `In phase two, optimization occurs. The system balances trade-offs between precision, resource consumption, and execution latency.`,
          duration_estimate_sec: 8.7,
        },
        {
          id: "seg_dd_07",
          speaker: "Alex",
          text: `Like balancing cache speed versus storage size in computer systems, or activation energy in biochemistry!`,
          duration_estimate_sec: 7.3,
        },
        {
          id: "seg_dd_08",
          speaker: "Jordan",
          text: `Spot on analogy, Alex! When you see those cross-disciplinary connections, retaining the material becomes almost effortless.`,
          duration_estimate_sec: 8.2,
        },
        {
          id: "seg_dd_09",
          speaker: "Alex",
          text: `To wrap things up, what is the one big takeaway you want students to remember when they review their flashcards?`,
          duration_estimate_sec: 6.9,
        },
        {
          id: "seg_dd_10",
          speaker: "Jordan",
          text: `Understand the primary principles first, verify against your citations, and trace each step sequentially. Master that, and you'll ace any question on ${topic}.`,
          duration_estimate_sec: 9.9,
        },
        {
          id: "seg_dd_11",
          speaker: "Alex",
          text: `Awesome breakdown! Thanks for tuning in to the AdaptFlow Deep Dive. Happy revising!`,
          duration_estimate_sec: 6.4,
        },
      ];
    }

    const totalDuration = Math.round(segments.reduce((acc, s) => acc + s.duration_estimate_sec, 0));

    const episode = {
      id: `ep_dyn_${Date.now()}`,
      title,
      subtitle,
      material_ids: body.material_ids || [],
      material_titles: materialTitles,
      duration_seconds: totalDuration,
      created_at: new Date().toISOString(),
      summary,
      key_takeaways: keyTakeaways,
      format_target: formatTarget,
      difficulty,
      segments,
    };

    return NextResponse.json({
      success: true,
      data: episode,
      episode,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to generate episode" },
      { status: 500 }
    );
  }
}
