import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/audio-overview/episodes`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (err) {
    // Backend offline / fallback
  }

  // Fallback default curated episodes
  const fallbackEpisodes = [
    {
      id: "ep_respiration",
      title: "Bioenergetics & ATP: The Cellular Powerhouse Deep Dive",
      subtitle: "How cells convert glucose into high-energy ATP currency across cytosol and mitochondria",
      material_ids: ["mat_1", "mat_4"],
      material_titles: ["Principles of Biology (11th Ed)", "Lecture 4 Slides: Bioenergetics"],
      duration_seconds: 245,
      created_at: new Date().toISOString(),
      summary: "Alex and Jordan break down cellular respiration from glycolysis in the cytosol to rotary ATP synthase in the mitochondrial matrix.",
      key_takeaways: [
        "Glycolysis in cytosol yields net 2 ATP and 2 NADH",
        "Krebs cycle loads electron carriers with high-energy electrons",
        "Electrochemical proton gradient powers rotary ATP Synthase",
        "Net yield is roughly 30 to 32 ATP per glucose molecule",
      ],
      segments: [
        {
          id: "seg_01",
          speaker: "Alex",
          text: "Welcome back to the AdaptFlow Deep Dive! Today, we're diving into what might be the single most crucial biochemical engine in all of biology: cellular respiration.",
          duration_estimate_sec: 9.5,
        },
        {
          id: "seg_02",
          speaker: "Jordan",
          text: "Right, and what's amazing when you look at the uploaded course slides and textbook is how it frames this not as some abstract reaction, but as a meticulously engineered energy factory.",
          duration_estimate_sec: 11.2,
          citation: {
            source_title: "Principles of Biology (11th Ed)",
            citation_label: "[Principles of Biology | Chapter 4, p. 42]",
            page_or_timestamp: "p. 42",
          },
        },
        {
          id: "seg_03",
          speaker: "Alex",
          text: "Exactly. Because we eat food—like a slice of pizza or an apple—and somehow our cells turn that into this universal currency called ATP. Where does it actually kick off?",
          duration_estimate_sec: 10.4,
        },
        {
          id: "seg_04",
          speaker: "Jordan",
          text: "It kicks off in the cytosol with glycolysis. Glucose is a six-carbon sugar, and the cell has to invest 2 ATP upfront to prime it.",
          duration_estimate_sec: 8.8,
        },
        {
          id: "seg_05",
          speaker: "Alex",
          text: "You have to spend money to make money!",
          duration_estimate_sec: 3.2,
        },
        {
          id: "seg_06",
          speaker: "Jordan",
          text: "Precisely! Slide 4 in the lecture deck highlights the payoff phase: the 6-carbon sugar splits into two 3-carbon pyruvates, generating 4 ATP and 2 NADH. That gives us a net profit of 2 ATP.",
          duration_estimate_sec: 12.0,
          citation: {
            source_title: "Lecture 4 Slides: Bioenergetics",
            citation_label: "[Lecture 4 Slides | Slide #4: Net Reaction]",
            page_or_timestamp: "Slide 4",
          },
        },
        {
          id: "seg_07",
          speaker: "Alex",
          text: "And to unlock the remaining 30 ATP, pyruvate crosses into the mitochondria for the Krebs cycle and the electron transport chain.",
          duration_estimate_sec: 9.0,
        },
        {
          id: "seg_08",
          speaker: "Jordan",
          text: "Yes! Complexes I through IV pump protons across the inner membrane, building a steep electrochemical gradient like water behind a hydroelectric dam.",
          duration_estimate_sec: 10.5,
          citation: {
            source_title: "Bio 101 Lecture: Cellular Energy Pathways",
            citation_label: "[Bio 101 Lecture @ 12:30: ATP Synthase]",
            page_or_timestamp: "12:30",
          },
        },
        {
          id: "seg_09",
          speaker: "Alex",
          text: "And the turbine is ATP Synthase! Protons rush through the rotor, physically turning the catalytic head to phosphorylate ADP into ATP.",
          duration_estimate_sec: 9.8,
        },
        {
          id: "seg_10",
          speaker: "Jordan",
          text: "A literal nanoscale rotary motor spinning at 6,000 RPM inside your cells right now, yielding over 30 ATP per glucose.",
          duration_estimate_sec: 8.9,
        },
        {
          id: "seg_11",
          speaker: "Alex",
          text: "Remember: Glycolysis in cytosol, Krebs cycle in matrix, and oxidative phosphorylation along the inner mitochondrial membrane. Happy studying!",
          duration_estimate_sec: 9.5,
        },
      ],
    },
  ];

  return NextResponse.json({
    success: true,
    total: fallbackEpisodes.length,
    data: fallbackEpisodes,
    episodes: fallbackEpisodes,
  });
}
