"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { QuizProgressHeader } from "@/components/quiz/quiz-progress-header";
import { QuestionCard } from "@/components/quiz/question-card";
import { ScoreSummaryCard } from "@/components/quiz/score-summary-card";
import {
  DifficultySelectionScreen,
  DifficultyLevel,
} from "@/components/quiz/difficulty-selection-screen";
import {
  QuizQuestion,
  QuizAnswerRecord,
  Material,
  MaterialType,
} from "@/lib/types";
import {
  getQuizQuestions,
  listMaterials,
  generateQuizQuestions,
  getQuizQuestionCounts,
} from "@/lib/api";
import {
  Sparkles,
  GraduationCap,
  Loader2,
  FileText,
  Film,
  Presentation,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  FolderOpen,
  Upload,
  CheckCircle2,
  AlertCircle,
  Layers,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatBytes } from "@/lib/utils";
import { toast } from "sonner";
import { ErrorBoundary } from "@/components/error-boundary";

// Fisher-Yates Shuffle Algorithm (Issue 2)
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const FALLBACK_QUESTIONS: QuizQuestion[] = [
  {
    id: "fb_q1",
    type: "multiple_choice",
    question: "Where does glycolysis take place within a eukaryotic cell, and what is the net yield of ATP per glucose molecule?",
    options: [
      "Mitochondrial matrix; 4 ATP",
      "Cytosol; 2 ATP",
      "Inner mitochondrial membrane; 32 ATP",
      "Endoplasmic reticulum; 1 ATP",
    ],
    correct_answer: 1,
    explanation: "Glycolysis occurs entirely in the cytosol. While 4 total ATP molecules are produced, 2 ATP are consumed during the initial preparatory phase, resulting in a net yield of 2 ATP per glucose.",
    source_citation: "[Slide 4]",
    difficulty: "medium",
    concept: "Glycolysis & Energy Metabolism",
  },
  {
    id: "fb_q2",
    type: "multiple_choice",
    question: "According to the lecture video discussion on gradient descent convergence, what occurs when the learning rate (alpha) is set excessively high?",
    options: [
      "The algorithm converges monotonically to the global minimum.",
      "The loss function oscillates and may diverge uncontrollably.",
      "The gradient vector automatically resets to zero.",
      "Parameters undergo L2 regularization shrinkage.",
    ],
    correct_answer: 1,
    explanation: "Setting an excessively high learning rate causes parameter updates to overshoot the valley, oscillating wildly and diverging instead of converging.",
    source_citation: "[Lecture 03 @ 12:45]",
    difficulty: "medium",
    concept: "Gradient Descent Optimization",
  },
  {
    id: "fb_q3",
    type: "multiple_choice",
    question: "In Convolutional Neural Networks, what is the primary role of the slide concept 'Stride' during convolution operations?",
    options: [
      "Specifies the number of pixels by which the kernel shifts over the input matrix.",
      "Adds zeros around the border to preserve spatial dimensions.",
      "Applies the ReLU non-linear activation function.",
      "Normalizes the activations across batch dimensions.",
    ],
    correct_answer: 0,
    explanation: "Stride defines the step size (in pixels) by which the convolutional filter slides across the input feature map, directly controlling the spatial downsampling rate.",
    source_citation: "[Slide 7]",
    difficulty: "easy",
    concept: "CNN Architecture & Convolutions",
  },
  {
    id: "fb_q4",
    type: "multiple_choice",
    question: "What electrochemical force directly powers the catalytic rotational head of ATP synthase during oxidative phosphorylation?",
    options: [
      "Proton motive force across the inner mitochondrial membrane.",
      "Direct thermal kinetic diffusion of ADP anions.",
      "Sodium-potassium ATPase antiporter flow.",
      "Active calcium ion efflux through voltage gates.",
    ],
    correct_answer: 0,
    explanation: "Protons accumulated in the intermembrane space flow down their electrochemical gradient through Fo, driving rotational ATP synthesis in F1.",
    source_citation: "[PDF p.48]",
    difficulty: "hard",
    concept: "Oxidative Phosphorylation & Chemiosmosis",
  },
  {
    id: "fb_q5",
    type: "multiple_choice",
    question: "In the speaker notes for the Neural Networks slide deck, what guideline is highlighted regarding weight initialization?",
    options: [
      "Initialize all weights to 1.0 to ensure strong initial gradients.",
      "Break symmetry by using small random numbers drawn from a Gaussian distribution.",
      "Set all biases to negative infinity.",
      "Freeze convolutional filters during the first 10 epochs.",
    ],
    correct_answer: 1,
    explanation: "Zero or constant initialization causes all hidden units to learn identical features; random Gaussian weights break symmetry.",
    source_citation: "[Slide 12]",
    difficulty: "hard",
    concept: "Weight Initialization & Symmetry Breaking",
  },
  {
    id: "fb_q6",
    type: "multiple_choice",
    question: "Which molecule does pyruvate convert into before entering the citric acid cycle?",
    options: [
      "Acetyl-CoA with liberation of CO2 and NADH.",
      "Oxaloacetate via direct ATP carboxylation.",
      "Lactate dehydrogenase intermediate.",
      "Phosphoenolpyruvate via kinase transfer.",
    ],
    correct_answer: 0,
    explanation: "Pyruvate dehydrogenase converts 3-carbon pyruvate into 2-carbon Acetyl-CoA in the mitochondrial matrix.",
    source_citation: "[PDF p.46]",
    difficulty: "medium",
    concept: "Pyruvate Oxidation & Citric Acid Cycle",
  },
  {
    id: "fb_q7",
    type: "multiple_choice",
    question: "Where do the light-dependent reactions of photosynthesis occur inside a plant cell?",
    options: [
      "Thylakoid membranes inside chloroplasts.",
      "Aqueous chloroplast stroma liquid.",
      "Central vacuole storage compartment.",
      "Primary cellulose cell wall matrix.",
    ],
    correct_answer: 0,
    explanation: "Chlorophyll pigments and electron transfer complexes are embedded directly in the thylakoid membrane.",
    source_citation: "[Slide 10]",
    difficulty: "easy",
    concept: "Photosynthesis Light Reactions",
  },
  {
    id: "fb_q8",
    type: "multiple_choice",
    question: "Which enzyme catalyzes the primary carbon fixation reaction in C3 photosynthesis?",
    options: [
      "RuBisCO (Ribulose-1,5-bisphosphate carboxylase-oxygenase).",
      "PEP carboxylase in mesophyll cells.",
      "Phosphofructokinase rate regulator.",
      "Pyruvate decarboxylase synthetase.",
    ],
    correct_answer: 0,
    explanation: "RuBisCO fixes inorganic CO2 onto the 5-carbon sugar RuBP, generating 3-PGA in the stroma.",
    source_citation: "[PDF p.58]",
    difficulty: "medium",
    concept: "Calvin Cycle & Carbon Fixation",
  },
  {
    id: "fb_q9",
    type: "multiple_choice",
    question: "What is the primary role of DNA topoisomerase (gyrase) ahead of the replication fork?",
    options: [
      "Relieves torsional strain and supercoiling created by helicase unwinding.",
      "Synthesizes short RNA primers required by DNA polymerases.",
      "Seals phosphodiester nicks between adjacent Okazaki fragments.",
      "Maintains single-stranded template stability.",
    ],
    correct_answer: 0,
    explanation: "Topoisomerase cuts and swivels DNA strands to relieve positive supercoils accumulating ahead of the fork.",
    source_citation: "[PDF p.64]",
    difficulty: "medium",
    concept: "DNA Replication & Fork Dynamics",
  },
  {
    id: "fb_q10",
    type: "multiple_choice",
    question: "Which post-transcriptional modification protects mature eukaryotic mRNA from 5' exonuclease degradation?",
    options: [
      "7-methylguanosine (5' cap) linkage.",
      "Poly-adenine tail attached to the 5' end.",
      "Phosphorylation of histone protein tails.",
      "Alternative exon skipping in the 3' UTR.",
    ],
    correct_answer: 0,
    explanation: "A 5'-to-5' triphosphate linkage with 7-methylguanosine protects the transcript and promotes ribosome binding.",
    source_citation: "[PDF p.70]",
    difficulty: "easy",
    concept: "Transcription & RNA Processing",
  },
  {
    id: "fb_q11",
    type: "multiple_choice",
    question: "Into which ribosomal site does an incoming aminoacyl-tRNA first bind during translation elongation?",
    options: [
      "The Aminoacyl (A) site.",
      "The Peptidyl (P) catalytic site.",
      "The Exit (E) discharge site.",
      "The 5' cap binding pocket.",
    ],
    correct_answer: 0,
    explanation: "Charged tRNAs enter the A site guided by elongation factors, where codon matching is verified.",
    source_citation: "[PDF p.75]",
    difficulty: "medium",
    concept: "Translation & Ribosomal Function",
  },
  {
    id: "fb_q12",
    type: "multiple_choice",
    question: "Which ubiquitous second messenger is generated from ATP by adenylyl cyclase upon G-protein stimulation?",
    options: [
      "Cyclic AMP (cAMP).",
      "Inositol 1,4,5-trisphosphate (IP3).",
      "Diacylglycerol (DAG).",
      "Phosphatidylinositol bisphosphate (PIP2).",
    ],
    correct_answer: 0,
    explanation: "Stimulated G-alpha-s activates adenylyl cyclase, converting ATP to cyclic AMP to activate Protein Kinase A.",
    source_citation: "[PDF p.82]",
    difficulty: "easy",
    concept: "Cellular Signal Transduction",
  },
  {
    id: "fb_q13",
    type: "multiple_choice",
    question: "During which phase of the eukaryotic cell cycle is genomic DNA replicated?",
    options: [
      "S Phase (Synthesis).",
      "G1 Phase (First Gap).",
      "G2 Phase (Second Gap).",
      "M Phase (Mitotic division).",
    ],
    correct_answer: 0,
    explanation: "DNA synthesis occurs strictly during the S phase of interphase.",
    source_citation: "[Slide 24]",
    difficulty: "easy",
    concept: "Cell Cycle Checkpoints & Mitosis",
  },
  {
    id: "fb_q14",
    type: "multiple_choice",
    question: "What chromosomal phenomenon during Prophase I allows linked genes on the same chromosome to recombine?",
    options: [
      "Crossing over (chiasma formation) between non-sister chromatids.",
      "Random alignment of bivalents along the metaphase plate.",
      "Sister chromatid separation during Anaphase II.",
      "Nondisjunction of homologous pairs.",
    ],
    correct_answer: 0,
    explanation: "Homologous recombination breaks and reconnects non-sister chromatids, creating recombinant allele combinations.",
    source_citation: "[PDF p.94]",
    difficulty: "medium",
    concept: "Mendelian Genetics & Gene Linkage",
  },
  {
    id: "fb_q15",
    type: "multiple_choice",
    question: "Which RNA component guides Cas9 endonuclease to cut its specific genomic DNA target?",
    options: [
      "Single Guide RNA (sgRNA) containing a 20-nucleotide complementary spacer.",
      "Ribosomal 16S RNA scaffolding arm.",
      "Transfer RNA carrying an initiator methionine.",
      "MicroRNA hairpins targeted for cytoplasmic slicing.",
    ],
    correct_answer: 0,
    explanation: "The guide RNA matches the target sequence adjacent to a Protospacer Adjacent Motif (PAM).",
    source_citation: "[PDF p.102]",
    difficulty: "hard",
    concept: "CRISPR-Cas9 & Biotechnology",
  },
];

const JAIPUR_FALLBACK_QUESTIONS: QuizQuestion[] = [
  {
    id: "jp_q1",
    type: "multiple_choice",
    question: "How many intricately carved jharokhas (casements) feature on the exterior facade of Hawa Mahal in Jaipur?",
    options: [
      "953 sandstone jharokhas with intricate latticework.",
      "120 jharokhas distributed across two storeys.",
      "365 jharokhas symbolizing the days of the solar year.",
      "540 jharokhas facing the eastern city gates.",
    ],
    correct_answer: 0,
    explanation: "Hawa Mahal has 953 jharokhas designed to allow royal women to observe city festivals while maintaining purdah [PDF p.1].",
    source_citation: "[Rajasthan Heritage Guide | Chapter 1, p. 1]",
    difficulty: "easy",
    concept: "Hawa Mahal Architectural Structure & Jharokhas",
  },
  {
    id: "jp_q2",
    type: "multiple_choice",
    question: "Which aerodynamic principle explains how the honeycomb sandstone lattice of Hawa Mahal naturally cools interior palace chambers?",
    options: [
      "The Venturi effect accelerates air drafts through narrow window apertures, dropping pressure and temperature.",
      "Capillary evaporation of subterranean water wells situated directly beneath the foundation.",
      "Convective thermal inversion through hollow marble solar chimneys on the rooftop.",
      "Radiative infrared shielding provided by double-glazed leaded glass panes.",
    ],
    correct_answer: 0,
    explanation: "The Venturi effect naturally funnels breezes through the 953 narrowed openings, creating air velocity that cools the interior [PDF p.1].",
    source_citation: "[Rajasthan Heritage Guide | Chapter 1, p. 1]",
    difficulty: "medium",
    concept: "Hawa Mahal Architectural Structure & Jharokhas",
  },
  {
    id: "jp_q3",
    type: "multiple_choice",
    question: "Under whose royal commission was the iconic Hawa Mahal constructed in 1799, and which chief architect drafted its Krishna-crown facade?",
    options: [
      "Commissioned by Maharaja Sawai Pratap Singh and designed by master architect Lal Chand Ustad.",
      "Commissioned by Raja Man Singh I and designed by Persian architect Mir Imad.",
      "Commissioned by Maharaja Sawai Jai Singh II and designed by Pandit Vidyadhar Bhattacharya.",
      "Commissioned by Sawai Madho Singh and designed by Sir Samuel Swinton Jacob.",
    ],
    correct_answer: 0,
    explanation: "Maharaja Sawai Pratap Singh commissioned Hawa Mahal in 1799, designed by Lal Chand Ustad to resemble Lord Krishna's crown [PDF p.1].",
    source_citation: "[Rajasthan Heritage Guide | Chapter 1, p. 1]",
    difficulty: "hard",
    concept: "Hawa Mahal Architectural Structure & Jharokhas",
  },
  {
    id: "jp_q4",
    type: "multiple_choice",
    question: "What is Jantar Mantar in Jaipur primarily recognized for internationally?",
    options: [
      "A collection of 19 monumental UNESCO stone and marble architectural astronomical instruments.",
      "A fortified military arsenal and gunpowder storehouse constructed during the Mughal wars.",
      "An underground reservoir system designed for royal summer banquets and water storage.",
      "A ceremonial equestrian polo stadium and parade ground for the royal cavalry.",
    ],
    correct_answer: 0,
    explanation: "Jantar Mantar features 19 astronomical instruments built by Sawai Jai Singh II to calculate celestial positions [PDF p.2].",
    source_citation: "[Rajasthan Heritage Guide | Chapter 1, p. 2]",
    difficulty: "easy",
    concept: "Jantar Mantar Astronomical Observatory",
  },
  {
    id: "jp_q5",
    type: "multiple_choice",
    question: "What is the primary function of the 27-meter tall Vrihat Samrat Yantra sundial located at Jantar Mantar?",
    options: [
      "Measures local solar time with an accuracy within 2 seconds using the shadow cast on its calibrated quadrants.",
      "Calculates seasonal monsoonal precipitation volumes and groundwater percolation rates.",
      "Forecasts seismic ground tremors across the surrounding Aravalli mountain ridge.",
      "Determines oceanic tidal patterns along the Bay of Bengal coastline.",
    ],
    correct_answer: 0,
    explanation: "The Vrihat Samrat Yantra is the world's largest stone sundial, measuring solar time to within two seconds of precision [PDF p.2].",
    source_citation: "[Rajasthan Heritage Guide | Chapter 1, p. 2]",
    difficulty: "medium",
    concept: "Jantar Mantar Astronomical Observatory",
  },
  {
    id: "jp_q6",
    type: "multiple_choice",
    question: "Which geometric coordinate systems are primarily measured by the Jai Prakash Yantra bowl instruments at Jantar Mantar?",
    options: [
      "Celestial horizon and equatorial coordinates via intersecting crosswires over inverted hemispherical marble bowls.",
      "Astrological lunar horoscope ascendancies through mercury balance counterweights.",
      "Earth magnetic declination variations through floating directional compass needles.",
      "Atmospheric barometric pressure gradients across seasonal equinoxes and solstices.",
    ],
    correct_answer: 0,
    explanation: "The Jai Prakash Yantra uses twin complementary hemispherical marble bowls to map the celestial spheres and coordinates [PDF p.2].",
    source_citation: "[Rajasthan Heritage Guide | Chapter 1, p. 2]",
    difficulty: "hard",
    concept: "Jantar Mantar Astronomical Observatory",
  },
  {
    id: "jp_q7",
    type: "multiple_choice",
    question: "Which picturesque body of water lies directly below the ramparts of Amber Fort and reflects its palace towers?",
    options: [
      "Maota Lake, which served as the primary water source for the palace complex.",
      "Pichola Lake, situated adjacent to the southern palace ghats.",
      "Fateh Sagar Lake, engineered for royal boating and regattas.",
      "Ana Sagar Lake, built as an artificial reservoir in Ajmer.",
    ],
    correct_answer: 0,
    explanation: "Maota Lake lies at the base of Amber Fort, reflecting the palace fortifications and providing water [PDF p.3].",
    source_citation: "[Rajasthan Heritage Guide | Chapter 1, p. 3]",
    difficulty: "easy",
    concept: "Amber Fort & Rajputana Military Architecture",
  },
  {
    id: "jp_q8",
    type: "multiple_choice",
    question: "What artistic and optical technique distinguishes the famous Sheesh Mahal (Mirror Palace) inside Amber Fort?",
    options: [
      "Thousands of convex Belgian mirror foils inlaid into plaster ceiling carvings that illuminate the hall with a single candle.",
      "Stained glass mosaic windows imported from Venice depicting Mughal court scenes.",
      "Phosphorescent minerals ground into marble ceiling frescoes to glow in darkness.",
      "Embossed gold leaf gilding covering acoustical cedar wood wall paneling.",
    ],
    correct_answer: 0,
    explanation: "Sheesh Mahal is renowned for its intricate mirror mosaic work that multiplies flickering candlelight across the entire pavilion [PDF p.3].",
    source_citation: "[Rajasthan Heritage Guide | Chapter 1, p. 3]",
    difficulty: "medium",
    concept: "Amber Fort & Rajputana Military Architecture",
  },
  {
    id: "jp_q9",
    type: "multiple_choice",
    question: "Why did Maharaja Sawai Ram Singh paint the historic walled city of Jaipur terracotta pink in 1876?",
    options: [
      "To welcome Queen Victoria's son, Albert Edward, the Prince of Wales, on his royal tour.",
      "To celebrate the victory over invading Maratha cavalry battalions at the city gates.",
      "To reduce interior building temperatures during the scorching Thar desert summer.",
      "To comply with an imperial tax edict issued by the British East India Company.",
    ],
    correct_answer: 0,
    explanation: "In 1876, Maharaja Ram Singh painted the entire city terracotta pink—a color symbolizing hospitality—to welcome the Prince of Wales [PDF p.4].",
    source_citation: "[Rajasthan Heritage Guide | Chapter 1, p. 4]",
    difficulty: "easy",
    concept: "City Palace & Urban Grid Planning of Jaipur",
  },
  {
    id: "jp_q10",
    type: "multiple_choice",
    question: "What ancient architectural planning discipline guided the founding and street grid layout of Jaipur in 1727?",
    options: [
      "Vastu Shastra and Shilpa Shastra, dividing the city into nine orthogonal sectors (chowkris).",
      "European baroque radial avenues radiating outward from a central circular palace plaza.",
      "Organic winding labyrinth alleyways intended to disorient foreign military forces.",
      "Linear riverine street layouts paralleling the seasonal drainage riverbanks.",
    ],
    correct_answer: 0,
    explanation: "Architect Vidyadhar Bhattacharya and Maharaja Jai Singh II planned Jaipur based on ancient Vastu principles with nine geometric sectors [PDF p.4].",
    source_citation: "[Rajasthan Heritage Guide | Chapter 1, p. 4]",
    difficulty: "medium",
    concept: "City Palace & Urban Grid Planning of Jaipur",
  },
  {
    id: "jp_q11",
    type: "multiple_choice",
    question: "What world record is held by the two massive silver urns (Gangajalis) displayed in the Mubarak Mahal of Jaipur City Palace?",
    options: [
      "Certified by Guinness World Records as the largest sterling silver vessels in the world, cast to carry Ganga water to London.",
      "The heaviest ceremonial silver thrones ever presented to a Rajput monarch by the Mughal court.",
      "The oldest intact silver astrolabes manufactured in the subcontinent during the 18th century.",
      "The largest silver coins minted in Asia, weighing over 150 kilograms each.",
    ],
    correct_answer: 0,
    explanation: "Maharaja Sawai Madho Singh II commissioned two 345-kg sterling silver Gangajalis to carry 4,000 liters of holy Ganges water to England in 1902 [PDF p.4].",
    source_citation: "[Rajasthan Heritage Guide | Chapter 1, p. 4]",
    difficulty: "hard",
    concept: "City Palace & Urban Grid Planning of Jaipur",
  },
];

const DATA_STRUCTURES_FALLBACK_QUESTIONS: QuizQuestion[] = [
  {
    id: "ds_q1",
    type: "multiple_choice",
    question: "What fundamental ordering invariant defines a valid Binary Search Tree (BST)?",
    options: [
      "For any node X, all keys in its left subtree are less than X, and all keys in its right subtree are greater.",
      "The tree must be perfectly balanced such that all leaf nodes reside at the exact same depth.",
      "Every internal non-leaf node must possess exactly two child nodes at all levels.",
      "Node values must strictly alternate between even and odd numbers along every root-to-leaf path.",
    ],
    correct_answer: 0,
    explanation: "The BST property requires that left subtree keys < node key < right subtree keys for every node [Slide 3].",
    source_citation: "[CS201 Lecture 7 | Slide #3]",
    difficulty: "easy",
    concept: "Binary Search Tree Properties & Invariant",
  },
  {
    id: "ds_q2",
    type: "multiple_choice",
    question: "Which tree traversal algorithm produces the keys of a Binary Search Tree in strictly ascending sorted order?",
    options: [
      "Inorder traversal (Left subtree, Current node, Right subtree).",
      "Preorder traversal (Current node, Left subtree, Right subtree).",
      "Postorder traversal (Left subtree, Right subtree, Current node).",
      "Breadth-first level-order traversal using a FIFO queue.",
    ],
    correct_answer: 0,
    explanation: "An in-order traversal of a BST visits nodes in non-decreasing order by traversing left, node, then right [Slide 5].",
    source_citation: "[CS201 Lecture 7 | Slide #5]",
    difficulty: "medium",
    concept: "Binary Search Tree Properties & Invariant",
  },
  {
    id: "ds_q3",
    type: "multiple_choice",
    question: "What are the worst-case and average-case time complexities respectively for search operations in an unaugmented BST of N keys?",
    options: [
      "O(N) worst-case (skewed degenerate tree) and O(log N) average-case (randomly balanced tree).",
      "O(1) worst-case and O(log N) average-case lookups.",
      "O(log N) worst-case and O(N) average-case lookups.",
      "O(N log N) worst-case and O(1) average-case lookups.",
    ],
    correct_answer: 0,
    explanation: "Inserting sorted keys creates a degenerate linked list with O(N) height; randomly inserted keys yield O(log N) expected height [Slide 6].",
    source_citation: "[CS201 Lecture 7 | Slide #6]",
    difficulty: "hard",
    concept: "Binary Search Tree Properties & Invariant",
  },
  {
    id: "ds_q4",
    type: "multiple_choice",
    question: "When deleting a BST node that has two non-empty child subtrees, which node is commonly chosen to replace it?",
    options: [
      "The in-order successor (minimum node in right subtree) or in-order predecessor.",
      "The leftmost leaf node of the entire tree regardless of key value.",
      "The root node of the binary search tree.",
      "Any random sibling node from the parent's alternate branch.",
    ],
    correct_answer: 0,
    explanation: "Replacing a node with its in-order successor or predecessor preserves the BST ordering invariant [Slide 8].",
    source_citation: "[CS201 Lecture 7 | Slide #8]",
    difficulty: "easy",
    concept: "BST Deletion & Replacement Operations",
  },
  {
    id: "ds_q5",
    type: "multiple_choice",
    question: "What is the time complexity to find the minimum key in a Binary Search Tree with height H?",
    options: [
      "O(H), accomplished by traversing left child pointers until reaching a node with no left child.",
      "O(N log N), requiring a full sort of all nodes in memory.",
      "O(1), because the minimum is always stored directly at the root node.",
      "O(2^H), requiring exhaustive traversal across all branches.",
    ],
    correct_answer: 0,
    explanation: "The minimum element in a BST is found by following left child pointers until a dead end, taking O(H) steps [Slide 9].",
    source_citation: "[CS201 Lecture 7 | Slide #9]",
    difficulty: "medium",
    concept: "BST Deletion & Replacement Operations",
  },
  {
    id: "ds_q6",
    type: "multiple_choice",
    question: "In Hibbard deletion for BSTs, what asymmetric degradation phenomenon occurs after many random deletions and insertions?",
    options: [
      "The average tree height degrades toward O(sqrt(N)) because always replacing with the successor biases right-subtree depth.",
      "The tree becomes perfectly self-balanced over time without rotation overhead.",
      "All subtrees spontaneously collapse into directed acyclic graph cycles.",
      "Memory pointers leak because leaf nodes retain circular parent references.",
    ],
    correct_answer: 0,
    explanation: "Hibbard deletion favors the right subtree, causing unaugmented BSTs to become increasingly asymmetric over long sequences [Slide 11].",
    source_citation: "[CS201 Lecture 7 | Slide #11]",
    difficulty: "hard",
    concept: "BST Deletion & Replacement Operations",
  },
  {
    id: "ds_q7",
    type: "multiple_choice",
    question: "What is the balance factor constraint enforced at every node in an AVL tree?",
    options: [
      "The difference between the heights of the left and right subtrees must be -1, 0, or +1.",
      "The number of nodes in the left subtree must equal the number in the right subtree.",
      "All leaf nodes must reside on the exact same depth level from the root.",
      "Every internal node must have either zero or two child nodes.",
    ],
    correct_answer: 0,
    explanation: "AVL trees require that for every node, |height(left) - height(right)| <= 1, guaranteeing O(log N) depth [Slide 13].",
    source_citation: "[CS201 Lecture 7 | Slide #13]",
    difficulty: "easy",
    concept: "Self-Balancing Trees (AVL & Red-Black Trees)",
  },
  {
    id: "ds_q8",
    type: "multiple_choice",
    question: "What operation restores AVL tree balance after an insertion produces a Left-Right (LR) imbalance?",
    options: [
      "A double rotation: left rotation on the left child, followed by a right rotation on the unbalanced node.",
      "A single right rotation on the unbalanced grandparent node.",
      "A full re-indexing of all keys using an auxiliary array.",
      "Swapping the unbalanced node's key with the root node.",
    ],
    correct_answer: 0,
    explanation: "An LR imbalance requires a Left rotation on the left child, then a Right rotation on the node itself [Slide 14].",
    source_citation: "[CS201 Lecture 7 | Slide #14]",
    difficulty: "medium",
    concept: "Self-Balancing Trees (AVL & Red-Black Trees)",
  },
  {
    id: "ds_q9",
    type: "multiple_choice",
    question: "Why do standard libraries (like C++ std::map and Java TreeMap) typically choose Red-Black trees over AVL trees?",
    options: [
      "Red-Black trees require at most 2 rotations on insert and 3 on delete, offering faster modifications with slightly looser balance.",
      "Red-Black trees use zero pointer overhead compared to AVL trees.",
      "Red-Black trees guarantee O(1) worst-case search lookup times.",
      "AVL trees cannot handle duplicate keys under any algorithmic variation.",
    ],
    correct_answer: 0,
    explanation: "Red-Black trees require fewer rotations during updates, making them preferable for workload-heavy insertion and deletion environments [Slide 16].",
    source_citation: "[CS201 Lecture 7 | Slide #16]",
    difficulty: "hard",
    concept: "Self-Balancing Trees (AVL & Red-Black Trees)",
  },
  {
    id: "ds_q10",
    type: "multiple_choice",
    question: "In a Red-Black Tree, what is the maximum possible height of a tree containing N internal nodes?",
    options: [
      "At most 2 * log2(N + 1), ensuring guaranteed logarithmic lookups.",
      "Strictly log2(N) without any variance.",
      "O(N), identical to an unaugmented binary search tree.",
      "O(N / 2) under heavy deletion workloads.",
    ],
    correct_answer: 0,
    explanation: "The red-black invariant ensures no path from root to leaf has consecutive red nodes, bounding height to 2 * log2(N + 1) [Slide 17].",
    source_citation: "[CS201 Lecture 7 | Slide #17]",
    difficulty: "hard",
    concept: "Self-Balancing Trees (AVL & Red-Black Trees)",
  },
];

const RAG_FALLBACK_QUESTIONS: QuizQuestion[] = [
  {
    id: "rag_q1",
    type: "multiple_choice",
    question: "What primary vulnerability of Large Language Models does Retrieval-Augmented Generation (RAG) directly address?",
    options: [
      "Unconstrained factual hallucinations and static knowledge cutoff dates.",
      "Excessive token throughput during unsupervised baseline pre-training.",
      "Inability to parse natural language prompt instructions from end users.",
      "Hardware overheating across distributed multi-GPU training clusters.",
    ],
    correct_answer: 0,
    explanation: "RAG grounds LLM reasoning in external verifiable documents, preventing hallucinations and bypassing static cutoff dates [00:00].",
    source_citation: "[00:00 - 00:30]",
    difficulty: "easy",
    concept: "RAG Architectural Philosophy",
  },
  {
    id: "rag_q2",
    type: "multiple_choice",
    question: "How does RAG bridge parametric memory and non-parametric memory in enterprise question-answering systems?",
    options: [
      "Connects frozen model weights with an external dynamic document database.",
      "Permanently writes retrieved document tokens into internal neural network layers.",
      "Substitutes all transformer self-attention blocks with relational SQL lookup tables.",
      "Converts the entire non-parametric document corpus into quantized model weights.",
    ],
    correct_answer: 0,
    explanation: "Parametric memory refers to the frozen model weights, while non-parametric memory is the external vector knowledge base [00:30].",
    source_citation: "[00:30 - 01:00]",
    difficulty: "medium",
    concept: "RAG Architectural Philosophy",
  },
  {
    id: "rag_q3",
    type: "multiple_choice",
    question: "In production RAG pipelines, how is the semantic chunking boundary established to preserve contextual integrity?",
    options: [
      "Chunks of 300 to 500 tokens with 50-token sliding window overlap.",
      "Unbounded multi-page segments serialized without structural delimiters.",
      "Single-sentence micro-chunks isolated strictly by punctuation boundaries.",
      "Variable paragraph clusters stripped of all sequential sentence overlap.",
    ],
    correct_answer: 0,
    explanation: "Ingestion divides documents into 300-500 token windows with a 50-token overlap to maintain coherence across cutoffs [01:00].",
    source_citation: "[01:00 - 01:30]",
    difficulty: "hard",
    concept: "RAG Architectural Philosophy",
  },
  {
    id: "rag_q4",
    type: "multiple_choice",
    question: "What is the primary role of a dense embedding model in a RAG ingestion pipeline?",
    options: [
      "Converts text passages into continuous high-dimensional vector representations.",
      "Translates source texts into encrypted ciphertext for secure cloud storage.",
      "Extracts metadata keywords using classical regular expression matching rules.",
      "Compresses binary audio video formats into lossy standardized MP3 files.",
    ],
    correct_answer: 0,
    explanation: "Dense embedding models map text into high-dimensional vector spaces where semantic similarity corresponds to geometric distance [01:30].",
    source_citation: "[01:30 - 02:00]",
    difficulty: "easy",
    concept: "Vector Embeddings & Indexing",
  },
  {
    id: "rag_q5",
    type: "multiple_choice",
    question: "During the retrieval phase, which mathematical metric is most commonly evaluated to rank candidate knowledge chunks?",
    options: [
      "Cosine similarity between the query vector and candidate chunk embeddings.",
      "Levenshtein edit distance between raw input character sequences and titles.",
      "Jaccard word intersection index across un-stemmed natural language tokens.",
      "Euclidean centroid variance measured across external document file headers.",
    ],
    correct_answer: 0,
    explanation: "Cosine similarity or inner product distance calculates the angular orientation between embedding vectors in high-dimensional space [02:00].",
    source_citation: "[02:00 - 02:30]",
    difficulty: "medium",
    concept: "Vector Embeddings & Indexing",
  },
  {
    id: "rag_q6",
    type: "multiple_choice",
    question: "How does cross-encoder re-ranking optimize retrieval quality compared to initial bi-encoder vector similarity search?",
    options: [
      "Jointly attends to query and passage to score deep contextual relevance.",
      "Pre-computes static vector projections to bypass deep transformer attention.",
      "Eliminates candidate passages using exact keyword frequency thresholding.",
      "Discards non-parametric context passages to rely solely on model memory.",
    ],
    correct_answer: 0,
    explanation: "Cross-encoders evaluate the query and document simultaneously with full self-attention, generating precise relevance scores [03:00].",
    source_citation: "[03:00 - 03:30]",
    difficulty: "hard",
    concept: "Vector Embeddings & Indexing",
  },
];

const KNOWN_MATERIAL_TITLES: Record<string, string> = {
  mat_1: "Principles of Biology: Cellular Energetics",
  mat_2: "The Definitive Jaipur Guide: History & Architecture",
  mat_3: "Molecular Biology: Genetics & Transcription",
  mat_4: "Cell Biology & Signal Transduction",
  mat_5: "CS201 Data Structures & Algorithms: Binary Search Trees",
};

function getTopicFallbackQuestions(materialId?: string, title?: string): QuizQuestion[] {
  const t = (title || "").toLowerCase();
  const mid = (materialId || "").toLowerCase();

  if (
    mid === "mat_2" ||
    t.includes("jaipur") ||
    t.includes("rajasthan") ||
    t.includes("heritage") ||
    t.includes("amber") ||
    t.includes("hawa") ||
    t.includes("jantar")
  ) {
    return JAIPUR_FALLBACK_QUESTIONS;
  }
  if (
    mid === "mat_5" ||
    t.includes("tree") ||
    t.includes("binary") ||
    t.includes("cs201") ||
    t.includes("data structure") ||
    t.includes("bst") ||
    t.includes("avl")
  ) {
    return DATA_STRUCTURES_FALLBACK_QUESTIONS;
  }
  if (
    mid.includes("aa50916b") ||
    t.includes("rag") ||
    t.includes("retrieval") ||
    t.includes("vector") ||
    t.includes("embedding") ||
    t.includes("720p")
  ) {
    return RAG_FALLBACK_QUESTIONS;
  }
  return FALLBACK_QUESTIONS;
}



type QuizMode = "preset" | "materials" | null;

function getMaterialTypeConfig(type: MaterialType) {
  switch (type) {
    case "textbook":
      return {
        icon: FileText,
        color: "text-blue-400",
        bgColor: "bg-blue-500/10 border-blue-500/20",
        label: "PDF Textbook",
      };
    case "lecture_video":
      return {
        icon: Film,
        color: "text-purple-400",
        bgColor: "bg-purple-500/10 border-purple-500/20",
        label: "Lecture Video",
      };
    case "slide_deck":
      return {
        icon: Presentation,
        color: "text-amber-400",
        bgColor: "bg-amber-500/10 border-amber-500/20",
        label: "Slide Deck",
      };
    default:
      return {
        icon: FileText,
        color: "text-primary-400",
        bgColor: "bg-primary/10 border-primary/20",
        label: "Course Material",
      };
  }
}

type FlowState = "configuring" | "loading" | "in_progress" | "completed";

function QuizView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMaterialId = searchParams.get("materialId");
  const initialTitleParam = searchParams.get("title");
  const initialDifficultyParam = searchParams.get("difficulty") as "easy" | "medium" | "hard" | "advanced" | null;
  const initialCountParam = searchParams.get("limit") || searchParams.get("count");

  // Unified Flow State: configuring -> loading -> in_progress -> completed
  const [flowState, setFlowState] = useState<FlowState>("configuring");

  // Configuration States
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(true);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(initialMaterialId || null);
  const [selectedTopicTitle, setSelectedTopicTitle] = useState<string>(initialTitleParam || "");
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | null>(
    initialDifficultyParam
      ? initialDifficultyParam === "advanced"
        ? "hard"
        : (initialDifficultyParam as DifficultyLevel)
      : null
  );
  const [targetQuizCount, setTargetQuizCount] = useState<number>(
    initialCountParam ? parseInt(initialCountParam, 10) : 10
  );
  const [questionCounts, setQuestionCounts] = useState<{
    easy: number;
    medium: number;
    hard: number;
  }>({ easy: 10, medium: 15, hard: 10 });

  // Quiz Engine Runtime States
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [availablePool, setAvailablePool] = useState<QuizQuestion[]>([]);
  const [shownQuestionIds, setShownQuestionIds] = useState<Set<string>>(new Set());
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [generatingFileName, setGeneratingFileName] = useState<string>("");
  const [generationError, setGenerationError] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, QuizAnswerRecord>>({});
  const [isCompleted, setIsCompleted] = useState(false);

  // Fetch registered study materials
  const fetchMaterialsList = useCallback(async (): Promise<Material[]> => {
    try {
      setLoadingMaterials(true);
      let data: Material[] = await listMaterials();
      if (!data || data.length === 0) {
        const res = await fetch("/api/materials");
        if (res.ok) {
          data = await res.json();
        }
      }
      setMaterials(data || []);
      return data || [];
    } catch (err) {
      console.warn("Could not fetch materials list for quiz:", err);
      try {
        const res = await fetch("/api/materials");
        if (res.ok) {
          const fallbackData: Material[] = await res.json();
          setMaterials(fallbackData);
          return fallbackData;
        }
      } catch (_) {}
      return [];
    } finally {
      setLoadingMaterials(false);
    }
  }, []);

  useEffect(() => {
    fetchMaterialsList().then((loadedMaterials: Material[]) => {
      if (initialMaterialId) {
        const found = loadedMaterials.find((m: Material) => m.id === initialMaterialId);
        if (found) {
          setSelectedTopicId(found.id);
          setSelectedTopicTitle(found.title);
        } else {
          const resolvedTitle =
            initialTitleParam ||
            KNOWN_MATERIAL_TITLES[initialMaterialId] ||
            "Selected Study Material";
          setSelectedTopicId(initialMaterialId);
          setSelectedTopicTitle(resolvedTitle);
        }
      }
    });
  }, [fetchMaterialsList, initialMaterialId, initialTitleParam]);

  // Fetch question counts dynamically when topic selection changes
  useEffect(() => {
    const topicToQuery = selectedTopicTitle || selectedTopicId || "biology";
    getQuizQuestionCounts(topicToQuery).then((counts) => {
      if (counts) setQuestionCounts(counts);
    });
  }, [selectedTopicId, selectedTopicTitle]);

  // Adaptive Quiz Initializer using Fisher-Yates and Set deduplication
  const initializeAdaptiveQuiz = useCallback(
    (
      rawQuestions: QuizQuestion[],
      targetLength: number,
      initialDiff: DifficultyLevel = "medium"
    ) => {
      // 1. Deduplicate questions by question text and ID
      const seenTexts = new Set<string>();
      const uniqueList: QuizQuestion[] = [];

      for (const q of rawQuestions) {
        const textKey = q.question.trim().toLowerCase();
        if (!seenTexts.has(textKey)) {
          seenTexts.add(textKey);
          const mappedDiff: "easy" | "medium" | "hard" =
            (q.difficulty as any) === "advanced"
              ? "hard"
              : (q.difficulty as "easy" | "medium" | "hard") || "medium";
          uniqueList.push({
            ...q,
            difficulty: mappedDiff,
          });
        }
      }

      // Fallback if needed
      const basePool = uniqueList.length > 0 ? uniqueList : FALLBACK_QUESTIONS;

      // 2. Fisher-Yates shuffle of the entire available pool
      const shuffled = shuffle(basePool);

      // 3. Guard: check if unique questions available < requested quiz length
      let effectiveTarget = targetLength;
      if (shuffled.length < targetLength) {
        effectiveTarget = shuffled.length;
        toast.info(`Only ${effectiveTarget} unique questions available for this topic.`);
      }

      // Pick first question matching difficulty, or fallback to medium, or first available
      const firstQ =
        shuffled.find((q) => q.difficulty === initialDiff) ||
        shuffled.find((q) => q.difficulty === "medium") ||
        shuffled[0];

      const initialShown = new Set<string>([firstQ.id]);

      setAvailablePool(shuffled);
      setTargetQuizCount(effectiveTarget);
      setShownQuestionIds(initialShown);
      setQuestions([firstQ]);
      setCurrentIndex(0);
      setAnswers({});
      setIsCompleted(false);
    },
    []
  );

  // Start configured quiz
  const handleStartConfiguredQuiz = async () => {
    if (!selectedTopicId || !selectedDifficulty) {
      toast.error("Please select a topic and difficulty tier before starting.");
      return;
    }

    setFlowState("loading");
    setLoadingQuestions(true);
    setGenerationError(null);

    const topicQuery = selectedTopicTitle || selectedTopicId;
    setGeneratingFileName(selectedTopicTitle || "Selected Study Material");

    try {
      const requestedCount = Math.max(targetQuizCount * 2, 20);
      const data = await getQuizQuestions(
        selectedTopicId,
        requestedCount,
        selectedDifficulty,
        topicQuery
      );

      const topicFallbacks = getTopicFallbackQuestions(selectedTopicId, selectedTopicTitle);
      const pool =
        data && data.length > 0
          ? data
          : topicFallbacks.length > 0
          ? topicFallbacks
          : FALLBACK_QUESTIONS;

      initializeAdaptiveQuiz(pool, targetQuizCount, selectedDifficulty);
      setFlowState("in_progress");
    } catch (err: any) {
      console.warn("Quiz start error, falling back to curated bank:", err);
      const topicFallbacks = getTopicFallbackQuestions(selectedTopicId, selectedTopicTitle);
      const pool = topicFallbacks.length > 0 ? topicFallbacks : FALLBACK_QUESTIONS;
      initializeAdaptiveQuiz(pool, targetQuizCount, selectedDifficulty);
      setFlowState("in_progress");
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleReturnToConfiguration = () => {
    setFlowState("configuring");
    setQuestions([]);
    setAvailablePool([]);
    setShownQuestionIds(new Set());
    setAnswers({});
    setCurrentIndex(0);
    setIsCompleted(false);
    setGenerationError(null);
  };

  // Adaptive difficulty selection mid-quiz:
  // Correct answer -> next question picked from harder pool
  // Wrong answer -> next question picked from easier pool
  // Zero repeats allowed: tracked in shownQuestionIds Set
  const handleAnswerSubmitted = (record: QuizAnswerRecord) => {
    setAnswers((prev) => ({
      ...prev,
      [record.questionId]: record,
    }));

    if (questions.length < targetQuizCount) {
      const currentDiff = questions[currentIndex]?.difficulty || "medium";
      let desiredDifficulty: "easy" | "medium" | "hard" = "medium";

      if (record.isCorrect) {
        // Harder pool
        desiredDifficulty = currentDiff === "easy" ? "medium" : "hard";
      } else {
        // Easier pool
        desiredDifficulty = currentDiff === "hard" ? "medium" : "easy";
      }

      // Pick next unshown question from available pool matching desired difficulty
      const nextQ =
        availablePool.find((q) => !shownQuestionIds.has(q.id) && q.difficulty === desiredDifficulty) ||
        availablePool.find((q) => !shownQuestionIds.has(q.id) && q.difficulty === "medium") ||
        availablePool.find((q) => !shownQuestionIds.has(q.id));

      if (nextQ) {
        setShownQuestionIds((prev) => {
          const updated = new Set(prev);
          updated.add(nextQ.id);
          return updated;
        });
        setQuestions((prev) => [...prev, nextQ]);
      }
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < targetQuizCount) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsCompleted(true);
      setFlowState("completed");
    }
  };

  const handleRestart = () => {
    if (availablePool.length > 0) {
      initializeAdaptiveQuiz(availablePool, targetQuizCount, selectedDifficulty || "medium");
      setFlowState("in_progress");
    } else {
      handleReturnToConfiguration();
    }
  };

  // 1. Loading screen during question synthesis
  if (flowState === "loading" || loadingQuestions) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Skeleton Progress Header */}
        <div className="rounded-2xl border border-border bg-card/80 p-5 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
              <div className="space-y-1.5">
                <div className="h-4 w-44 rounded-md bg-secondary/80 animate-pulse" />
                <div className="h-3 w-28 rounded-md bg-secondary/60 animate-pulse" />
              </div>
            </div>
            <div className="h-8 w-24 rounded-lg bg-secondary/60 animate-pulse" />
          </div>
          <div className="h-2 w-full rounded-full bg-secondary/60 overflow-hidden">
            <div className="h-full w-2/5 bg-primary/60 rounded-full animate-pulse" />
          </div>
        </div>

        {/* Loading Message Banner */}
        <div className="flex items-center justify-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs text-primary-300">
          <Sparkles className="h-4 w-4 text-primary animate-pulse" />
          <span>
            Synthesizing {targetQuizCount} adaptive questions from{" "}
            <strong className="text-foreground">{generatingFileName || "selected topic"}</strong>...
            analyzing knowledge units and calibrating difficulty tiers.
          </span>
        </div>

        {/* Skeleton Question Card */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xl backdrop-blur-md space-y-6">
          <div className="space-y-3">
            <div className="h-3.5 w-32 rounded-full bg-primary/20 animate-pulse" />
            <div className="h-6 w-5/6 rounded-lg bg-secondary/80 animate-pulse" />
            <div className="h-6 w-3/4 rounded-lg bg-secondary/60 animate-pulse" />
          </div>

          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl border border-border/80 bg-secondary/30 p-4"
              >
                <div className="h-7 w-7 rounded-lg bg-secondary/80 shrink-0 animate-pulse" />
                <div
                  className="h-4 rounded bg-secondary/70 animate-pulse"
                  style={{ width: `${60 + (i % 3) * 15}%` }}
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <div className="h-10 w-32 rounded-xl bg-secondary/60 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // 2. Generation Error View
  if (generationError) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/15 text-rose-400">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold text-foreground">
          Quiz Generation Failed
        </h3>
        <p className="text-xs text-muted-foreground max-w-md mx-auto">
          {generationError}
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            size="sm"
            onClick={handleStartConfiguredQuiz}
            className="text-xs gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Retry
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReturnToConfiguration}
            className="text-xs gap-1.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Configuration
          </Button>
        </div>
      </div>
    );
  }

  // 3. In Progress or Completed Screen
  if (flowState === "in_progress" || flowState === "completed") {
    if (questions.length === 0) {
      handleReturnToConfiguration();
      return null;
    }

    const currentQuestion = questions[currentIndex] || questions[0];
    const currentScore = Object.values(answers).filter((a) => a.isCorrect).length;

    return (
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Mode context bar */}
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <button
            onClick={handleReturnToConfiguration}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Change Topic / Difficulty</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full border border-border bg-secondary/40 px-3 py-0.5 text-[11px]">
              <Sparkles className="h-3 w-3 text-primary-400" />
              <span>{selectedTopicTitle || "Selected Topic"}</span>
            </span>
          </div>
        </div>

        {flowState !== "completed" && !isCompleted ? (
          <>
            {/* Progress Header */}
            <QuizProgressHeader
              currentIndex={currentIndex}
              totalQuestions={targetQuizCount}
              currentScore={currentScore}
              concept={currentQuestion.concept}
              difficulty={currentQuestion.difficulty}
              onRestart={handleRestart}
              onChangeMode={handleReturnToConfiguration}
            />

            {/* Active Question Card */}
            <QuestionCard
              key={currentQuestion.id}
              question={currentQuestion}
              onAnswerSubmitted={handleAnswerSubmitted}
              onNextQuestion={handleNextQuestion}
              isLastQuestion={
                currentIndex + 1 >= targetQuizCount ||
                (currentIndex === questions.length - 1 &&
                  !availablePool.some((q) => !shownQuestionIds.has(q.id)))
              }
            />
          </>
        ) : (
          /* Score Summary View */
          <ScoreSummaryCard
            questions={questions}
            answers={answers}
            onRestart={handleRestart}
            onChangeMode={handleReturnToConfiguration}
          />
        )}
      </div>
    );
  }

  // 4. Default Screen: DifficultySelectionScreen
  return (
    <DifficultySelectionScreen
      materials={materials}
      loadingMaterials={loadingMaterials}
      selectedTopicId={selectedTopicId}
      onSelectTopic={(topicId, topicTitle) => {
        setSelectedTopicId(topicId);
        setSelectedTopicTitle(topicTitle);
      }}
      selectedDifficulty={selectedDifficulty}
      onSelectDifficulty={(diff) => setSelectedDifficulty(diff)}
      selectedLength={targetQuizCount}
      onSelectLength={(len) => setTargetQuizCount(len)}
      onStartQuiz={handleStartConfiguredQuiz}
      isStarting={loadingQuestions}
      questionCounts={questionCounts}
    />
  );
}

export default function QuizPage() {
  return (
    <ErrorBoundary fallbackTitle="Adaptive Quiz Engine Error">
      <React.Suspense
        fallback={
          <div className="p-8 text-xs text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>Loading Quiz Engine...</span>
          </div>
        }
      >
        <QuizView />
      </React.Suspense>
    </ErrorBoundary>
  );
}
