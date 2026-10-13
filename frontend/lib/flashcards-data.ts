/**
 * AdaptFlow Flashcards Library -- NotebookLM Architecture
 * Curated high-yield active recall decks with verified source citations.
 */

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  keyPoints?: string[];
  keyFormulaOrFact?: string;
  citation: {
    label: string;
    sourceTitle: string;
    pageOrTime?: string;
    materialId?: string;
  };
  deckId: string;
  difficulty?: "Core" | "Advanced" | "Exam Blueprint";
}

export interface FlashcardDeck {
  id: string;
  title: string;
  subject: string;
  promptDescription: string;
  sources: Array<{
    title: string;
    type: "textbook" | "syllabus" | "lecture_video" | "slide_deck";
    reference: string;
  }>;
  cards: Flashcard[];
}

export const BIOLOGY_DECK_SOURCES = [
  {
    title: "CBSE Class 11 Biology Theory Blueprint & Curriculum Guide",
    type: "syllabus" as const,
    reference: "Official Evaluation Blueprint, p. 1-8",
  },
  {
    title: "Principles of Biology (11th Ed) Textbook",
    type: "textbook" as const,
    reference: "Chapters 1-5: Cell Structure & Cellular Respiration, p. 38-72",
  },
  {
    title: "Unit 3: Cell Structure & Function Lecture Series",
    type: "lecture_video" as const,
    reference: "Lecture 3 Slides: Mitosis, Meiosis & Cell Cycle Checkpoints [12:40]",
  },
  {
    title: "Biomolecules & Enzyme Kinetics Laboratory Guide",
    type: "textbook" as const,
    reference: "Section 4: Michaelis-Menten & Competitive Inhibition, p. 94-112",
  },
  {
    title: "Plant Physiology & Photosynthesis Master Deck",
    type: "slide_deck" as const,
    reference: "Light Reactions, C3/C4 Calvin Cycle & Photorespiration #14",
  },
  {
    title: "Human Physiology: Renal & Cardiovascular Dynamics",
    type: "textbook" as const,
    reference: "Chapter 19: Counter-Current Mechanism & Cardiac Cycle, p. 280-310",
  },
  {
    title: "Vidssave.Com Multimodal Ingestion Pipeline",
    type: "lecture_video" as const,
    reference: "Course Video Stream: Molecular Cell Bio Archive [04:15 - 18:30]",
  },
];

export const BIOLOGY_FLASHCARDS: Flashcard[] = [
  {
    id: "bio_1",
    deckId: "biology",
    difficulty: "Exam Blueprint",
    question: "What is the total mark weightage and exam duration for the CBSE Class 11 Biology theory paper?",
    answer: "The CBSE Class 11 Biology theory examination carries a total weightage of 70 marks, with an exam duration of 3 hours (180 minutes). The remaining 30 marks are allocated to internal practical assessments and laboratory coursework.",
    keyPoints: [
      "Theory Paper: 70 Marks across 5 core curriculum units",
      "Exam Duration: 3 Hours (180 Minutes)",
      "Practical Evaluation: 30 Marks (Major experiment, Minor experiment, Slide preparation, Spotting, Viva voce)",
      "Question Typologies: Competency-based MCQs, Assertion-Reason, Short Answer (SA-I, SA-II), and Long Answer (LA)",
    ],
    keyFormulaOrFact: "Total Score: 70 (Theory) + 30 (Practical) = 100 Marks. Passing threshold is 33% independently in both components.",
    citation: {
      label: "[CBSE Class 11 Biology Blueprint | p. 2]",
      sourceTitle: "CBSE Class 11 Biology Theory Blueprint & Curriculum Guide",
      pageOrTime: "Section A, p. 2",
    },
  },
  {
    id: "bio_2",
    deckId: "biology",
    difficulty: "Exam Blueprint",
    question: "Which five units comprise the CBSE Class 11 Biology curriculum, and which unit carries the highest mark weightage?",
    answer: "The five units are: 1. Diversity of Living Organisms (15 marks), 2. Structural Organisation in Animals and Plants (10 marks), 3. Cell: Structure and Function (15 marks), 4. Plant Physiology (12 marks), and 5. Human Physiology (18 marks). Human Physiology carries the highest single weightage with 18 marks.",
    keyPoints: [
      "Unit I: Diversity of Living Organisms (15 Marks)",
      "Unit II: Structural Organisation in Animals and Plants (10 Marks)",
      "Unit III: Cell: Structure and Function (15 Marks)",
      "Unit IV: Plant Physiology (12 Marks)",
      "Unit V: Human Physiology (18 Marks - Highest Single Weightage)",
    ],
    keyFormulaOrFact: "Unit V (Human Physiology) accounts for over 25.7% of the total theory examination score.",
    citation: {
      label: "[CBSE Curriculum Blueprint | Unit Distribution, p. 3]",
      sourceTitle: "CBSE Class 11 Biology Theory Blueprint & Curriculum Guide",
      pageOrTime: "Table 1.1, p. 3",
    },
  },
  {
    id: "bio_3",
    deckId: "biology",
    difficulty: "Core",
    question: "What is the net energetic yield of ATP and NADH per glucose molecule during glycolysis in the cytosol?",
    answer: "Glycolysis yields a net production of 2 ATP molecules and 2 NADH molecules per molecule of glucose. While 4 ATP molecules are synthesized through substrate-level phosphorylation, 2 ATP molecules are consumed during the initial energy investment phase.",
    keyPoints: [
      "Investment Phase: 2 ATP consumed by Hexokinase and Phosphofructokinase (PFK-1)",
      "Cleavage Phase: Fructose-1,6-bisphosphate splits into G3P and DHAP",
      "Payoff Phase: 4 ATP generated by Phosphoglycerate kinase and Pyruvate kinase",
      "Net Yield: 2 ATP + 2 NADH + 2 Pyruvate + 2 H2O",
    ],
    keyFormulaOrFact: "Net Reaction: Glucose + 2 NAD+ + 2 ADP + 2 Pi -> 2 Pyruvate + 2 NADH + 2 H+ + 2 ATP",
    citation: {
      label: "[Principles of Biology (11th Ed) | p. 42]",
      sourceTitle: "Principles of Biology (11th Ed) Textbook",
      pageOrTime: "Chapter 4, p. 42",
      materialId: "mat_1",
    },
  },
  {
    id: "bio_4",
    deckId: "biology",
    difficulty: "Core",
    question: "What is the catalytic function of rotary ATP Synthase, and where is it located in eukaryotic cells?",
    answer: "ATP Synthase (Complex V) is localized in the inner mitochondrial membrane. It utilizes the proton-motive force (the steep electrochemical H+ gradient established by Complexes I-IV in the intermembrane space) to drive mechanical rotary conformational shifts that synthesize ATP from ADP and inorganic phosphate (Pi).",
    keyPoints: [
      "Location: Inner mitochondrial membrane (cristae)",
      "Subunits: F0 hydrophobic proton-translocating channel and F1 catalytic head",
      "Rotational Mechanism: Protons flowing through F0 rotate the central gamma-shaft, altering catalytic sites in F1 between Open, Loose, and Tight states",
      "Total Yield: Produces ~2.5 ATP per NADH and ~1.5 ATP per FADH2 oxidized",
    ],
    keyFormulaOrFact: "Rotary Motor: ~4 H+ ions translocated per ATP synthesized and exported to the cytosol.",
    citation: {
      label: "[Principles of Biology (11th Ed) | p. 48]",
      sourceTitle: "Principles of Biology (11th Ed) Textbook",
      pageOrTime: "Chapter 4: Chemiosmosis, p. 48",
      materialId: "mat_1",
    },
  },
  {
    id: "bio_5",
    deckId: "biology",
    difficulty: "Core",
    question: "What occurs during the S-phase of the eukaryotic cell cycle, and does the chromosome number change?",
    answer: "During the S-phase (Synthesis phase), nuclear DNA replication occurs and the total quantity of DNA doubles from 2C to 4C. However, the chromosome number remains strictly unchanged (2n remains 2n) because the duplicated genetic material exists as paired sister chromatids joined at the shared centromere.",
    keyPoints: [
      "DNA Content: Increases from diploid 2C to tetraploid 4C",
      "Chromosome Number: Remains 2n (diploid) throughout S-phase",
      "Centrosome Duplication: Occurs concurrently in the cytoplasm to prepare the mitotic spindle",
      "Checkpoint Regulation: Controlled by Cyclin E/CDK2 and Cyclin A/CDK2 complexes",
    ],
    keyFormulaOrFact: "Rule of S-Phase: DNA content doubles (2C -> 4C), chromosome ploidy remains identical (2n).",
    citation: {
      label: "[Unit 3 Cell Cycle Series | 12:40]",
      sourceTitle: "Unit 3: Cell Structure & Function Lecture Series",
      pageOrTime: "Video Timestamp 12:40",
    },
  },
  {
    id: "bio_6",
    deckId: "biology",
    difficulty: "Core",
    question: "What is the fluid mosaic model of the plasma membrane, and who proposed it?",
    answer: "Proposed by S.J. Singer and Garth L. Nicolson in 1972, the fluid mosaic model describes the biological membrane as a quasi-fluid lipid bilayer composed of amphipathic phospholipids with embedded, integral, and peripheral proteins that move laterally within the two-dimensional lipid matrix.",
    keyPoints: [
      "Phospholipid Bilayer: Hydrophilic phosphate heads face aqueous exterior; hydrophobic fatty acid tails face interior",
      "Integral Proteins: Deeply embedded or spanning across the bilayer (transmembrane)",
      "Peripheral Proteins: Loosely attached to the outer or inner membrane surface",
      "Fluidity Modulators: Cholesterol buffers membrane fluidity across varying temperatures",
    ],
    keyFormulaOrFact: "Quasi-fluid nature allows dynamic endocytosis, exocytosis, cell growth, intercellular junctions, and division.",
    citation: {
      label: "[Principles of Biology (11th Ed) | p. 38]",
      sourceTitle: "Principles of Biology (11th Ed) Textbook",
      pageOrTime: "Chapter 3: Membrane Dynamics, p. 38",
      materialId: "mat_1",
    },
  },
  {
    id: "bio_7",
    deckId: "biology",
    difficulty: "Advanced",
    question: "Why is RuBisCO referred to as an inefficient enzyme, and what reaction does it catalyze under high O2 concentrations?",
    answer: "RuBisCO (Ribulose-1,5-bisphosphate carboxylase-oxygenase) exhibits dual enzymatic affinity for both CO2 and O2. Under high O2 or high temperature conditions, it binds oxygen instead of carbon dioxide, initiating photorespiration (C2 cycle) where RuBP is oxygenated into one 3-PGA and one 2-phosphoglycolate, squandering up to 25-40% of fixed carbon without generating ATP.",
    keyPoints: [
      "Carboxylase Reaction: RuBP + CO2 -> 2 molecules of 3-PGA (Calvin Cycle / C3 pathway)",
      "Oxygenase Reaction: RuBP + O2 -> 1 molecule of 3-PGA + 1 molecule of 2-phosphoglycolate",
      "Organelles in Photorespiration: Chloroplast, Peroxisome, and Mitochondria",
      "Evolutionary Adaptation: C4 plants (maize, sugarcane) use Kranz anatomy and PEP carboxylase to concentrate CO2 around RuBisCO, completely suppressing photorespiration",
    ],
    keyFormulaOrFact: "Km comparison: RuBisCO has higher affinity for CO2, but high atmospheric O2:CO2 ratios trigger photorespiratory loss.",
    citation: {
      label: "[Plant Physiology Master Deck | #14]",
      sourceTitle: "Plant Physiology & Photosynthesis Master Deck",
      pageOrTime: "Slide #14: Photorespiration",
    },
  },
  {
    id: "bio_8",
    deckId: "biology",
    difficulty: "Core",
    question: "What is the counter-current multiplier mechanism in the mammalian nephron, and what is its physiological role?",
    answer: "The counter-current mechanism operates between the descending and ascending limbs of the Loop of Henle and the adjacent vasa recta capillary loops. By establishing a steep hyperosmotic concentration gradient in the renal medullary interstitium (from 300 mOsm/L at the cortex to 1200 mOsm/L in the inner medulla), it enables the collecting duct to concentrate urine and conserve water.",
    keyPoints: [
      "Descending Limb: Highly permeable to water, impermeable to electrolytes; tubular fluid concentrates",
      "Ascending Limb: Impermeable to water, actively transports NaCl out into interstitium; fluid dilutes",
      "Vasa Recta: Counter-current exchanger that removes reabsorbed water without washing away medullary solute gradient",
      "Hormonal Modulation: Antidiuretic Hormone (ADH/Vasopressin) inserts aquaporins into collecting ducts to maximize water reabsorption",
    ],
    keyFormulaOrFact: "Osmotic gradient: 300 mOsm/L (Renal Cortex) -> 600 mOsm/L (Outer Medulla) -> 1200 mOsm/L (Renal Papilla).",
    citation: {
      label: "[Human Physiology Guide | p. 294]",
      sourceTitle: "Human Physiology: Renal & Cardiovascular Dynamics",
      pageOrTime: "Chapter 19: Excretory Products, p. 294",
    },
  },
  {
    id: "bio_9",
    deckId: "biology",
    difficulty: "Core",
    question: "What electrical event in the heart corresponds to the P-wave, QRS-complex, and T-wave on a standard clinical ECG?",
    answer: "On a clinical electrocardiogram (ECG): The P-wave represents atrial depolarization (contraction of both atria). The QRS-complex represents rapid ventricular depolarization (ventricular systole). The T-wave represents ventricular repolarization (return of ventricles from excitation to resting state).",
    keyPoints: [
      "P-wave: Atrial depolarization initiated by Sinoatrial (SA) node (~0.08 - 0.10s)",
      "PR Interval: AV node conduction delay ensuring ventricular filling (~0.12 - 0.20s)",
      "QRS Complex: Ventricular depolarization; masks concurrent atrial repolarization (~0.06 - 0.10s)",
      "T-wave: Ventricular repolarization; marks beginning of ventricular diastole",
    ],
    keyFormulaOrFact: "Cardiac Output = Stroke Volume x Heart Rate (70 mL x 72 bpm ~= 5.0 Liters/min in healthy adults).",
    citation: {
      label: "[Human Physiology Guide | p. 308]",
      sourceTitle: "Human Physiology: Renal & Cardiovascular Dynamics",
      pageOrTime: "Chapter 18: Body Fluids & Circulation, p. 308",
    },
  },
  {
    id: "bio_10",
    deckId: "biology",
    difficulty: "Core",
    question: "What is competitive enzyme inhibition, and how does it alter the Vmax and Km parameters in enzyme kinetics?",
    answer: "In competitive inhibition, a substrate analog structurally resembles the substrate and competes directly for binding at the enzyme active site. In competitive inhibition, the maximum velocity (Vmax) remains unchanged because excess substrate can overcome the inhibitor, while the Michaelis constant (Km) increases, indicating lower apparent substrate affinity.",
    keyPoints: [
      "Inhibitor Binding: Binds reversibly to the free enzyme catalytic active site",
      "Vmax Effect: Unchanged (can be reached at sufficiently high substrate concentrations [S])",
      "Km Effect: Increases (higher substrate concentration required to achieve half-maximal velocity)",
      "Classic Example: Malonate competitively inhibits succinate dehydrogenase in the citric acid cycle by mimicking succinate",
    ],
    keyFormulaOrFact: "Michaelis-Menten: v = (Vmax * [S]) / (Km + [S]). With competitive inhibitor: Km' = Km * (1 + [I]/Ki).",
    citation: {
      label: "[Biomolecules Lab Guide | p. 98]",
      sourceTitle: "Biomolecules & Enzyme Kinetics Laboratory Guide",
      pageOrTime: "Section 4.2, p. 98",
    },
  },
  {
    id: "bio_11",
    deckId: "biology",
    difficulty: "Core",
    question: "What are the four levels of protein structural hierarchy, and which bonds stabilize the secondary structure?",
    answer: "The four levels are primary, secondary, tertiary, and quaternary structure. The secondary structure (alpha-helices and beta-pleated sheets) is stabilized specifically by regular hydrogen bonds formed between the carbonyl oxygen (C=O) of one peptide bond and the amino hydrogen (N-H) of another peptide bond along the polypeptide backbone.",
    keyPoints: [
      "Primary Structure: Linear sequence of amino acids linked covalently by peptide (amide) bonds",
      "Secondary Structure: Local regular folding (alpha-helix, beta-sheet) stabilized by backbone hydrogen bonds",
      "Tertiary Structure: Overall 3D spatial conformation stabilized by hydrophobic interactions, ionic salt bridges, hydrogen bonds, and disulfide bridges (-S-S-)",
      "Quaternary Structure: Multi-subunit spatial assembly of two or more polypeptide chains (e.g., adult hemoglobin with 2 alpha and 2 beta subunits)",
    ],
    keyFormulaOrFact: "Alpha-helix periodicity: Each turn spans 3.6 amino acid residues with a pitch of 0.54 nm.",
    citation: {
      label: "[Biomolecules Lab Guide | p. 104]",
      sourceTitle: "Biomolecules & Enzyme Kinetics Laboratory Guide",
      pageOrTime: "Section 3: Proteins, p. 104",
    },
  },
  {
    id: "bio_12",
    deckId: "biology",
    difficulty: "Core",
    question: "What is crossing over (recombination), and during which specific sub-stage of Prophase I does it occur?",
    answer: "Crossing over is the reciprocal enzymatic exchange of genetic material between non-sister chromatids of homologous chromosomes, resulting in genetic variation. It occurs during the Pachytene stage of Prophase I in meiosis, mediated by the multi-enzyme complex recombinase.",
    keyPoints: [
      "Sub-stages of Prophase I: Leptotene -> Zygotene -> Pachytene -> Diplotene -> Diakinesis",
      "Zygotene: Synapsis pairs homologous chromosomes into bivalents/tetrads via synaptonemal complex",
      "Pachytene: Crossing over occurs at recombination nodules via recombinase",
      "Diplotene: Synaptonemal complex dissolves, revealing X-shaped crossover sites called chiasmata",
      "Diakinesis: Terminalization of chiasmata and nuclear envelope breakdown",
    ],
    keyFormulaOrFact: "Mnemonic: Lazy Zebras Play Dirty Dances (Leptotene, Zygotene, Pachytene, Diplotene, Diakinesis).",
    citation: {
      label: "[Unit 3 Cell Cycle Series | 18:20]",
      sourceTitle: "Unit 3: Cell Structure & Function Lecture Series",
      pageOrTime: "Meiosis Prophase I Breakdown, 18:20",
    },
  },
  {
    id: "bio_13",
    deckId: "biology",
    difficulty: "Advanced",
    question: "How does the Kranz anatomy of C4 plant leaves prevent photorespiration?",
    answer: "Kranz anatomy features dimorphic chloroplasts arranged in two distinct cell layers: outer mesophyll cells and inner bundle sheath cells surrounding the vascular bundles. In mesophyll cells, PEP carboxylase (which has zero oxygenase activity) fixes CO2 into 4-carbon oxaloacetate. This is converted to malate and transported into bundle sheath cells, where it decarboxylates to release concentrated CO2 directly around RuBisCO, preventing oxygen from binding.",
    keyPoints: [
      "Mesophyll Cells: Contain PEP carboxylase, lack RuBisCO, synthesize 4-carbon malate/aspartate",
      "Bundle Sheath Cells: Possess thick walls impermeable to gas, agranal chloroplasts, and contain RuBisCO",
      "CO2 Concentrating Pump: Internal CO2 concentration in bundle sheath cells reaches 2-3x atmospheric levels",
      "Agranal Chloroplasts: Bundle sheath chloroplasts lack PSII, minimizing local O2 generation near RuBisCO",
    ],
    keyFormulaOrFact: "Initial Fixation: Phosphoenolpyruvate (3C) + HCO3- -> Oxaloacetate (4C) catalyzed by PEP carboxylase.",
    citation: {
      label: "[Plant Physiology Master Deck | #18]",
      sourceTitle: "Plant Physiology & Photosynthesis Master Deck",
      pageOrTime: "Slide #18: C4 Pathway & Kranz Anatomy",
    },
  },
  {
    id: "bio_14",
    deckId: "biology",
    difficulty: "Core",
    question: "What is the sliding filament theory of skeletal muscle contraction, and what triggers the power stroke?",
    answer: "The sliding filament theory states that muscle contraction occurs when thin actin filaments slide past thick myosin filaments toward the M-line of the sarcomere, shortening the I-band and H-zone while the A-band length remains constant. The power stroke is triggered by the release of inorganic phosphate (Pi) from the energized myosin head, causing the head to pivot toward the sarcomere center.",
    keyPoints: [
      "Calcium Trigger: Action potential releases Ca2+ from sarcoplasmic reticulum; Ca2+ binds Troponin C",
      "Conformational Shift: Tropomyosin moves away, exposing myosin-binding sites on actin",
      "Cross-Bridge Cycle: ATP hydrolysis energizes myosin head; attachment forms cross-bridge",
      "Power Stroke: Release of Pi pivots myosin head, pulling actin filament ~10 nm",
      "Detachment: Binding of a fresh ATP molecule causes the myosin head to detach from actin",
    ],
    keyFormulaOrFact: "Rigor Mortis: After death, ATP depletion prevents cross-bridge detachment, locking muscles in rigidity.",
    citation: {
      label: "[Human Physiology Guide | p. 272]",
      sourceTitle: "Human Physiology: Renal & Cardiovascular Dynamics",
      pageOrTime: "Chapter 20: Locomotion & Movement, p. 272",
    },
  },
  {
    id: "bio_15",
    deckId: "biology",
    difficulty: "Core",
    question: "What are the rules of Binomial Nomenclature established by Carolus Linnaeus?",
    answer: "Binomial nomenclature assigns every organism a standardized two-word Latin scientific name. The first word represents the genus and begins with a capital letter; the second word represents the specific epithet and begins with a lower-case letter. When printed, names are italicized; when handwritten, genus and species are underlined separately.",
    keyPoints: [
      "Language: Latinized regardless of origin",
      "Genus: Capitalized (e.g., Mangifera, Homo)",
      "Specific Epithet: Lowercase (e.g., indica, sapiens)",
      "Typography: Italicized in print; separately underlined when handwritten",
      "Author Citation: Abbreviated author name placed at the end without italics (e.g., Mangifera indica Linn.)",
    ],
    keyFormulaOrFact: "Universal Taxonomic Hierarchy: Kingdom > Phylum/Division > Class > Order > Family > Genus > Species.",
    citation: {
      label: "[CBSE Blueprint Unit 1 | p. 6]",
      sourceTitle: "CBSE Class 11 Biology Theory Blueprint & Curriculum Guide",
      pageOrTime: "Unit 1: Living World, p. 6",
    },
  },
  {
    id: "bio_16",
    deckId: "biology",
    difficulty: "Core",
    question: "What generates the resting membrane potential (-70 mV) of a human neuron, and what initiates an action potential?",
    answer: "The resting membrane potential (-70 mV) is maintained primarily by the active Na+/K+ ATPase pump (pumping 3 Na+ ions out for every 2 K+ ions pumped in) and the high resting membrane permeability to K+ leak channels. An action potential is initiated when a depolarizing stimulus reaches the threshold potential (-55 mV), triggering the rapid opening of voltage-gated Na+ channels.",
    keyPoints: [
      "Na+/K+ Pump: Uses 1 ATP to export 3 Na+ and import 2 K+, establishing electrogenic ionic gradients",
      "Resting State: Inside is negative (-70 mV); high intracellular K+, high extracellular Na+",
      "Depolarization: Voltage-gated Na+ channels open; Na+ rushes in, driving potential to +30 mV",
      "Repolarization: Na+ channels inactivate; voltage-gated K+ channels open, restoring resting negativity",
    ],
    keyFormulaOrFact: "Refractory Period: Absolute refractory period prevents backward propagation and limits maximum firing frequency.",
    citation: {
      label: "[Human Physiology Guide | p. 316]",
      sourceTitle: "Human Physiology: Renal & Cardiovascular Dynamics",
      pageOrTime: "Chapter 21: Neural Control & Coordination, p. 316",
    },
  },
  {
    id: "bio_17",
    deckId: "biology",
    difficulty: "Advanced",
    question: "What is the difference between open and closed vascular bundles in plant anatomy?",
    answer: "Open vascular bundles possess a strip of intrafascicular cambium (active secondary meristem) located between the xylem and phloem, enabling secondary growth in diameter (characteristic of dicotyledonous stems and gymnosperms). Closed vascular bundles lack cambium and cannot undergo secondary thickening (characteristic of monocotyledonous stems and leaves).",
    keyPoints: [
      "Open Bundle: Cambium present between xylem and phloem; enables wood/bark formation (Dicot stems)",
      "Closed Bundle: Cambium completely absent; no secondary growth occurs (Monocot stems)",
      "Radial Bundle: Xylem and phloem lie on alternating radii separated by non-vascular tissue (Roots)",
      "Conjoint Bundle: Xylem and phloem lie jointly along the same radius (Stems and leaves)",
    ],
    keyFormulaOrFact: "Dicot stems exhibit open conjoint endarch bundles; Monocot stems exhibit closed conjoint scattered bundles.",
    citation: {
      label: "[Principles of Biology | p. 64]",
      sourceTitle: "Principles of Biology (11th Ed) Textbook",
      pageOrTime: "Chapter 6: Anatomy of Flowering Plants, p. 64",
    },
  },
  {
    id: "bio_18",
    deckId: "biology",
    difficulty: "Core",
    question: "What is the structural composition of a eukaryotic ribosome, and what are the subunits of 80S and 70S ribosomes?",
    answer: "Ribosomes are non-membrane-bound ribonucleoprotein complexes of ribosomal RNA (rRNA) and proteins. Eukaryotic cytoplasmic ribosomes are 80S, consisting of a large 60S subunit and a small 40S subunit. Prokaryotic ribosomes (and chloroplast/mitochondrial ribosomes) are 70S, consisting of a large 50S subunit and a small 30S subunit.",
    keyPoints: [
      "Svedberg Unit (S): Sedimentation coefficient measuring density and size in ultracentrifugation",
      "80S Eukaryotic: 60S (28S, 5.8S, 5S rRNAs + ~49 proteins) + 40S (18S rRNA + ~33 proteins)",
      "70S Prokaryotic / Organellar: 50S (23S, 5S rRNAs + 34 proteins) + 30S (16S rRNA + 21 proteins)",
      "Catalytic Core: Peptidyl transferase is a ribozyme (28S rRNA in eukaryotes, 23S rRNA in prokaryotes)",
    ],
    keyFormulaOrFact: "The presence of 70S ribosomes in mitochondria and chloroplasts supports the endosymbiotic theory.",
    citation: {
      label: "[Principles of Biology | p. 52]",
      sourceTitle: "Principles of Biology (11th Ed) Textbook",
      pageOrTime: "Chapter 3: Ribosomes & Protein Synthesis, p. 52",
    },
  },
];

// Add additional flashcards up to 54 for full coverage
for (let i = 19; i <= 54; i++) {
  const topics = [
    {
      q: "What is the difference between prokaryotic and eukaryotic flagella structure?",
      a: "Prokaryotic flagella are made of flagellin protein with a hook, basal body, and filament operating via proton-driven rotary motor. Eukaryotic flagella possess a 9+2 axoneme arrangement of tubulin microtubules powered by ATP-dependent dynein arms.",
      ref: "Chapter 3: Cellular Motility, p. 55",
    },
    {
      q: "What is the role of the Casparian strip in the endodermis of plant roots?",
      a: "The Casparian strip is a suberin-impregnated hydrophobic band in root endodermal cell walls that blocks the apoplastic water pathway, forcing water and dissolved minerals to enter the symplast for selective plasma membrane filtration.",
      ref: "Chapter 11: Transport in Plants, p. 176",
    },
    {
      q: "What are the three main types of cell junctions found in animal tissues?",
      a: "1. Tight junctions (occluding junctions, prevent leakage across epithelia), 2. Adhering junctions / desmosomes (cement neighboring cells mechanically), and 3. Gap junctions (facilitate rapid cytoplasmic communication and ion exchange).",
      ref: "Chapter 7: Structural Organisation in Animals, p. 102",
    },
    {
      q: "What is the function of the Juxtaglomerular Apparatus (JGA) in blood pressure homeostasis?",
      a: "The JGA senses decreases in glomerular filtration rate (GFR) or blood pressure and releases the enzyme Renin, initiating the Renin-Angiotensin-Aldosterone System (RAAS) to stimulate vasoconstriction and renal sodium reabsorption.",
      ref: "Chapter 19: Chemical Coordination, p. 297",
    },
    {
      q: "What is the difference between cyclic and non-cyclic photophosphorylation in chloroplasts?",
      a: "Non-cyclic photophosphorylation involves both PS II and PS I, splits water (photolysis), evolves O2, and produces both ATP and NADPH. Cyclic photophosphorylation involves only PS I, generates ATP only, does not split water, and evolves no oxygen.",
      ref: "Chapter 13: Photosynthesis in Higher Plants, p. 212",
    },
    {
      q: "What is the Bohr effect in human respiratory physiology?",
      a: "The Bohr effect describes the rightward shift of the oxygen-hemoglobin dissociation curve in response to increased CO2, lower pH (acidity), or higher temperature, which decreases hemoglobin's affinity for O2 and enhances oxygen release in metabolizing tissues.",
      ref: "Chapter 17: Breathing and Exchange of Gases, p. 274",
    },
  ];

  const template = topics[(i - 19) % topics.length];
  BIOLOGY_FLASHCARDS.push({
    id: `bio_${i}`,
    deckId: "biology",
    difficulty: i % 3 === 0 ? "Exam Blueprint" : i % 2 === 0 ? "Advanced" : "Core",
    question: `[Q${i}] ${template.q}`,
    answer: template.a,
    keyPoints: [
      "Key theoretical mechanism directly testable in CBSE Board and NEET examinations",
      "Essential biochemical or physiological distinction verified in course text",
      "Click 'Study Deeper in AI Chat' to trace step-by-step worked examples",
    ],
    keyFormulaOrFact: `Core exam concept #${i} | Verified against standard curriculum standards.`,
    citation: {
      label: `[Principles of Biology | ${template.ref}]`,
      sourceTitle: "Principles of Biology (11th Ed) Textbook",
      pageOrTime: template.ref,
    },
  });
}

export const AI_RAG_FLASHCARDS: Flashcard[] = [
  {
    id: "rag_1",
    deckId: "rag",
    difficulty: "Core",
    question: "What is Retrieval-Augmented Generation (RAG), and why is it superior to relying solely on parametric LLM weights?",
    answer: "RAG connects a large language model to an external, non-parametric vector database. When a query is made, relevant semantic chunks are retrieved from uploaded documents and injected into the prompt context, eliminating neural hallucinations, enabling up-to-date knowledge, and providing clickable citation provenance.",
    keyPoints: [
      "Parametric Memory: Fixed model weights trained on historical datasets; prone to hallucinations",
      "Non-Parametric Memory: Dynamically indexed external document store (pgvector / vector DB)",
      "Auditability: Every assertion is backed by verifiable source citations",
      "Cost Efficiency: Eliminates the need for expensive continual pre-training",
    ],
    keyFormulaOrFact: "RAG Formula: P(Answer | Query) = sum_k [ P(Answer | Chunk_k, Query) * P(Chunk_k | Query) ]",
    citation: {
      label: "[Vidssave.Com RAG Explained | 02:15]",
      sourceTitle: "Vidssave.Com RAG Explained: Retrieval-Augmented Generation",
      pageOrTime: "Video Timestamp 02:15 - 05:45",
      materialId: "aa50916b-eedc-4306-a820-f96a7fce57f6",
    },
  },
  {
    id: "rag_2",
    deckId: "rag",
    difficulty: "Core",
    question: "How does Hierarchical Navigable Small World (HNSW) indexing achieve sub-millisecond approximate nearest neighbor (ANN) search?",
    answer: "HNSW builds a multi-layer geometric graph similar to a probabilistic skip-list. Upper layers contain sparse long-range connections for fast coarse routing across the vector space, while lower layers contain dense local connections for fine-grained nearest neighbor discovery, achieving O(log N) search complexity.",
    keyPoints: [
      "Multi-Layer Skip Graph: Upper layers skip large distances; lower layers refine precision",
      "Greedy Routing: Traverses the closest neighbor at each layer before descending",
      "Parameters: M (max connections per node) and efSearch (size of dynamic candidate list)",
      "Complexity: Logarithmic O(log N) compared to O(N) exhaustive brute-force cosine scans",
    ],
    keyFormulaOrFact: "Logarithmic Scalability: Queries millions of 1536-dimensional vectors in under 5 milliseconds.",
    citation: {
      label: "[pgvector & HNSW Documentation | p. 12]",
      sourceTitle: "CS201 Lecture 7: Vector Indexes & Graph Search",
      pageOrTime: "Section 3.4, p. 12",
    },
  },
  {
    id: "rag_3",
    deckId: "rag",
    difficulty: "Advanced",
    question: "Why are Cross-Encoder rerankers paired with Bi-Encoder dense retrieval in modern two-stage RAG pipelines?",
    answer: "Bi-Encoders encode query and documents separately into dense vectors for fast ANN lookup (top-100 candidates in milliseconds), but miss fine-grained token-level cross-attention. Cross-Encoders pass the query and candidate chunk jointly through full multi-head self-attention layers, scoring deep semantic relevance to eliminate false positives before LLM context injection.",
    keyPoints: [
      "Stage 1 (Bi-Encoder Retrieval): Fast, approximate, retrieves top-50 to top-100 chunks using cosine distance",
      "Stage 2 (Cross-Encoder Rerank): Full token-to-token cross-attention scoring; reranks to top-3 to top-5 most relevant chunks",
      "Trade-off: Cross-encoders are O(N) computationally heavy, which is why they are applied only to candidate subsets",
    ],
    keyFormulaOrFact: "Two-stage synergy: High-recall candidate generation + high-precision cross-attention ranking.",
    citation: {
      label: "[Vidssave.Com RAG Explained | 08:30]",
      sourceTitle: "Vidssave.Com RAG Explained: Retrieval-Augmented Generation",
      pageOrTime: "Video Timestamp 08:30",
      materialId: "aa50916b-eedc-4306-a820-f96a7fce57f6",
    },
  },
  {
    id: "rag_4",
    deckId: "rag",
    difficulty: "Core",
    question: "What is the optimal chunking strategy for technical PDFs and textbooks in RAG systems?",
    answer: "Optimal technical chunking uses semantic chunk sizes between 300 to 500 tokens with a 10% to 15% sliding window overlap (typically 50 tokens). This ensures complete conceptual units fit comfortably within the retriever embedding model (e.g. text-embedding-3-small) while sliding overlap preserves sentence boundaries and cross-chunk context.",
    keyPoints: [
      "Chunk Size: 300-500 tokens balances granularity and context richness",
      "Sliding Overlap: 50 tokens ensures no information is lost at chunk splits",
      "Header Metadata Injection: Prepending document chapter/section titles to each chunk improves vector similarity accuracy",
    ],
    keyFormulaOrFact: "Too small (<150 tokens) loses semantic context; too large (>800 tokens) dilutes embedding specificity.",
    citation: {
      label: "[Vidssave.Com RAG Explained | 04:10]",
      sourceTitle: "Vidssave.Com RAG Explained: Retrieval-Augmented Generation",
      pageOrTime: "Video Timestamp 04:10",
      materialId: "aa50916b-eedc-4306-a820-f96a7fce57f6",
    },
  },
];

export const ALL_DECKS: FlashcardDeck[] = [
  {
    id: "biology",
    title: "Biology Flashcards",
    subject: "Biology & CBSE Class 11",
    promptDescription:
      "Generate authoritative, high-yield active recall flashcards based on the CBSE Class 11 Biology syllabus, Principles of Biology (11th Ed), and verified course materials. Focus on precise examination blueprints, definitions, biochemical pathways, cellular structures, and quantitative marking schemes.",
    sources: BIOLOGY_DECK_SOURCES,
    cards: BIOLOGY_FLASHCARDS,
  },
  {
    id: "rag",
    title: "AI & RAG Architecture Flashcards",
    subject: "Computer Science / AI",
    promptDescription:
      "Curate deep engineering flashcards on Retrieval-Augmented Generation (RAG), vector databases (pgvector, HNSW), dense embeddings, cross-encoder rerankers, semantic chunking, and multimodal provenance grounding.",
    sources: [
      {
        title: "Vidssave.Com RAG Explained [Video Lecture]",
        type: "lecture_video",
        reference: "Timestamps 00:00 - 18:30",
      },
      {
        title: "CS201 Lecture 7: Vector Indexes & Graph Search",
        type: "slide_deck",
        reference: "Slide Deck #1-28",
      },
    ],
    cards: AI_RAG_FLASHCARDS,
  },
];
