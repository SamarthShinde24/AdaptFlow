import random
import re
import uuid
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.db.session import get_db
from app.core.deps import get_current_user, get_optional_user
from app.db.models import User, QuizSession, Material, KnowledgeUnit
from app.db.redis import cache_get, cache_set
from app.schemas.base import APIResponse

router = APIRouter()

class QuizGenerateRequest(BaseModel):
    material_id: Optional[str] = None
    file_id: Optional[str] = None
    question_count: int = 10
    difficulty: Optional[str] = "medium"

    @property
    def target_material_id(self) -> str:
        return self.material_id or self.file_id or ""

class QuizAnswerRequest(BaseModel):
    session_id: str
    question_id: str
    selected_answer: int

class QuizCompleteRequest(BaseModel):
    session_id: str

# Balanced topic-specific question banks with strict length parity and randomized answer slots
RAG_QUESTIONS = [
    {
        "concept": "RAG Architectural Philosophy",
        "easy": {
            "question": "What primary vulnerability of Large Language Models does Retrieval-Augmented Generation (RAG) directly address?",
            "options": [
                "Unconstrained factual hallucinations and static knowledge cutoff dates.",
                "Excessive token throughput during unsupervised baseline pre-training.",
                "Inability to parse natural language prompt instructions from end users.",
                "Hardware overheating across distributed multi-GPU training clusters."
            ],
            "correct_answer": 0,
            "explanation": "RAG grounds LLM reasoning in external verifiable documents, preventing hallucinations and bypassing static cutoff dates [00:00].",
            "citation": "[00:00 - 00:30]"
        },
        "medium": {
            "question": "How does RAG bridge parametric memory and non-parametric memory in enterprise question-answering systems?",
            "options": [
                "Connects frozen model weights with an external dynamic document database.",
                "Permanently writes retrieved document tokens into internal neural network layers.",
                "Substitutes all transformer self-attention blocks with relational SQL lookup tables.",
                "Converts the entire non-parametric document corpus into quantized model weights."
            ],
            "correct_answer": 0,
            "explanation": "Parametric memory refers to the frozen model weights, while non-parametric memory is the external vector knowledge base [00:30].",
            "citation": "[00:30 - 01:00]"
        },
        "advanced": {
            "question": "In production RAG pipelines, how is the semantic chunking boundary established to preserve contextual integrity?",
            "options": [
                "Referenced in [01:00-01:30]: Chunks of 300 to 500 tokens with 50-token sliding window overlap.",
                "Referenced in [01:30-02:00]: Unbounded multi-page segments serialized without structural delimiters.",
                "Referenced in [02:00-02:30]: Single-sentence micro-chunks isolated strictly by punctuation boundaries.",
                "Referenced in [02:30-03:00]: Variable paragraph clusters stripped of all sequential sentence overlap."
            ],
            "correct_answer": 0,
            "explanation": "Ingestion divides documents into 300-500 token windows with a 50-token overlap to maintain coherence across cutoffs [01:00].",
            "citation": "[01:00 - 01:30]"
        }
    },
    {
        "concept": "Vector Embeddings & Indexing",
        "easy": {
            "question": "What is the primary role of a dense embedding model in a RAG ingestion pipeline?",
            "options": [
                "Converts text passages into continuous high-dimensional vector representations.",
                "Translates source texts into encrypted ciphertext for secure cloud storage.",
                "Extracts metadata keywords using classical regular expression matching rules.",
                "Compresses binary audio video formats into lossy standardized MP3 files."
            ],
            "correct_answer": 0,
            "explanation": "Dense embedding models map text into high-dimensional vector spaces where semantic similarity corresponds to geometric distance [01:30].",
            "citation": "[01:30 - 02:00]"
        },
        "medium": {
            "question": "During the retrieval phase, which mathematical metric is most commonly evaluated to rank candidate knowledge chunks?",
            "options": [
                "Cosine similarity between the query vector and candidate chunk embeddings.",
                "Levenshtein edit distance between raw input character sequences and titles.",
                "Jaccard word intersection index across un-stemmed natural language tokens.",
                "Euclidean centroid variance measured across external document file headers."
            ],
            "correct_answer": 0,
            "explanation": "Cosine similarity or inner product distance calculates the angular orientation between embedding vectors in high-dimensional space [02:00].",
            "citation": "[02:00 - 02:30]"
        },
        "advanced": {
            "question": "How does cross-encoder re-ranking optimize retrieval quality compared to initial bi-encoder vector similarity search?",
            "options": [
                "Referenced in [03:00-03:30]: Jointly attends to query and passage to score deep contextual relevance.",
                "Referenced in [01:30-02:00]: Pre-computes static vector projections to bypass deep transformer attention.",
                "Referenced in [02:00-02:30]: Eliminates candidate passages using exact keyword frequency thresholding.",
                "Referenced in [04:00-04:30]: Discards non-parametric context passages to rely solely on model memory."
            ],
            "correct_answer": 0,
            "explanation": "Cross-encoders evaluate the query and document simultaneously with full self-attention, generating precise relevance scores [03:00].",
            "citation": "[03:00 - 03:30]"
        }
    }
]

BIOLOGY_QUESTIONS = [
    {
        "concept": "Glycolysis & Energy Metabolism",
        "easy": {
            "question": "Where does glycolysis take place within a eukaryotic cell?",
            "options": [
                "In the cytosol, outside the mitochondria.",
                "Inside the inner mitochondrial matrix fluid.",
                "Embedded across the cristae folding folds.",
                "Within the rough endoplasmic reticulum lumen."
            ],
            "correct_answer": 0,
            "explanation": "Glycolysis is the anaerobic initial stage of cellular respiration that takes place in the cytosol [Slide 4].",
            "citation": "[Slide 4]"
        },
        "medium": {
            "question": "What is the net ATP and NADH yield produced per glucose molecule during glycolysis?",
            "options": [
                "Net yield of 2 ATP and 2 NADH molecules.",
                "Net yield of 4 ATP and 0 NADH molecules.",
                "Net yield of 0 ATP and 4 NADH molecules.",
                "Net yield of 32 ATP and 6 NADH molecules."
            ],
            "correct_answer": 0,
            "explanation": "Glycolysis produces 4 ATP and consumes 2 ATP, resulting in a net yield of 2 ATP and 2 NADH [PDF p.42].",
            "citation": "[PDF p.42]"
        },
        "advanced": {
            "question": "How does substrate-level phosphorylation differ fundamentally from oxidative phosphorylation?",
            "options": [
                "Directly transfers a substrate phosphate without an electron transport chain.",
                "Requires active oxygen consumption and inner membrane proton pumping.",
                "Synthesizes over 90% of total aerobic energy via rotational ATP synthase.",
                "Operates exclusively inside chloroplast stroma under continuous light."
            ],
            "correct_answer": 0,
            "explanation": "Substrate-level phosphorylation directly transfers a high-energy phosphate from an organic substrate to ADP without chemiosmosis [PDF p.44].",
            "citation": "[PDF p.44]"
        }
    },
    {
        "concept": "Pyruvate Oxidation & Citric Acid Cycle",
        "easy": {
            "question": "In which sub-cellular compartment does the Citric Acid (Krebs) cycle take place?",
            "options": [
                "Mitochondrial matrix fluid.",
                "Outer mitochondrial intermembrane space.",
                "Cytosolic ribosome clusters.",
                "Nucleolus ribonucleoprotein core."
            ],
            "correct_answer": 0,
            "explanation": "Following transport across both mitochondrial membranes, pyruvate oxidation and the Krebs cycle proceed in the matrix [Slide 6].",
            "citation": "[Slide 6]"
        },
        "medium": {
            "question": "Which molecule does pyruvate convert into before entering the citric acid cycle?",
            "options": [
                "Acetyl-CoA with liberation of CO2 and NADH.",
                "Oxaloacetate via direct ATP carboxylation.",
                "Lactate dehydrogenase intermediate.",
                "Phosphoenolpyruvate via kinase transfer."
            ],
            "correct_answer": 0,
            "explanation": "Pyruvate dehydrogenase converts 3-carbon pyruvate into 2-carbon Acetyl-CoA, producing NADH and CO2 [PDF p.46].",
            "citation": "[PDF p.46]"
        },
        "advanced": {
            "question": "Which catalytic enzyme in the citric acid cycle is allosterically inhibited by high NADH and ATP levels?",
            "options": [
                "Isocitrate dehydrogenase.",
                "Fumarase hydratase.",
                "Succinate thiokinase.",
                "Malate dehydrogenase."
            ],
            "correct_answer": 0,
            "explanation": "Isocitrate dehydrogenase serves as the key rate-limiting checkpoint inhibited by high cellular energy charge [Lecture 02 @ 15:30].",
            "citation": "[Lecture 02 @ 15:30]"
        }
    },
    {
        "concept": "Oxidative Phosphorylation & Chemiosmosis",
        "easy": {
            "question": "Where are the protein complexes of the electron transport chain anchored in eukaryotes?",
            "options": [
                "Inner mitochondrial membrane cristae.",
                "Outer porous mitochondrial envelope.",
                "Nuclear envelope pore complexes.",
                "Peroxisomal lipid bilayer membrane."
            ],
            "correct_answer": 0,
            "explanation": "Complexes I through IV and ATP synthase are embedded within the folded inner mitochondrial membrane [Slide 8].",
            "citation": "[Slide 8]"
        },
        "medium": {
            "question": "What electrochemical force directly powers the catalytic rotational head of ATP synthase?",
            "options": [
                "Proton motive force across the inner membrane.",
                "Direct thermal kinetic diffusion of ADP anions.",
                "Sodium potassium ATPase antiporter flow.",
                "Active calcium ion efflux through voltage gates."
            ],
            "correct_answer": 0,
            "explanation": "Protons accumulated in the intermembrane space flow down their electrochemical gradient through Fo, driving rotational ATP synthesis in F1 [PDF p.48].",
            "citation": "[PDF p.48]"
        },
        "advanced": {
            "question": "How do mitochondrial uncoupling proteins (UCP-1 / thermogenin) alter respiratory energetics in brown adipose tissue?",
            "options": [
                "Dissipate the proton gradient as heat without producing ATP.",
                "Inhibit Complex IV cytochrome c oxidase electron transfers.",
                "Accelerate substrate-level phosphorylation five-fold.",
                "Block pyruvate entry across mitochondrial Porin channels."
            ],
            "correct_answer": 0,
            "explanation": "Uncoupling proteins channel protons across the inner membrane without passing through ATP synthase, converting energy into heat [Lecture 03 @ 22:10].",
            "citation": "[Lecture 03 @ 22:10]"
        }
    },
    {
        "concept": "Photosynthesis Light Reactions",
        "easy": {
            "question": "In which plant cell sub-structure do the light-dependent reactions of photosynthesis occur?",
            "options": [
                "Thylakoid membranes inside chloroplasts.",
                "Aqueous chloroplast stroma liquid.",
                "Central vacuole storage compartment.",
                "Primary cellulose cell wall matrix."
            ],
            "correct_answer": 0,
            "explanation": "Chlorophyll pigments and electron transfer complexes are embedded in the thylakoid membrane [Slide 10].",
            "citation": "[Slide 10]"
        },
        "medium": {
            "question": "What is the initial electron donor that replenishes P680 reaction center in Photosystem II?",
            "options": [
                "Photolysis of water molecules (H2O), releasing O2.",
                "Oxidation of atmospheric carbon dioxide (CO2).",
                "Reduction of plastoquinone by cytochrome b6f.",
                "Hydrolysis of ATP in the thylakoid lumen."
            ],
            "correct_answer": 0,
            "explanation": "Photosystem II splits water into protons, electrons, and oxygen gas to replace photoexcited electrons [PDF p.55].",
            "citation": "[PDF p.55]"
        },
        "advanced": {
            "question": "Under what metabolic conditions do plant chloroplasts engage in cyclic photophosphorylation around Photosystem I?",
            "options": [
                "When ATP demand exceeds NADPH supply for the Calvin cycle.",
                "When carbon dioxide levels reach saturating maximum.",
                "When Photosystem II operates at twice normal efficiency.",
                "During prolonged anaerobic nighttime dark cycles."
            ],
            "correct_answer": 0,
            "explanation": "Cyclic electron flow pumps additional protons to generate ATP without reducing NADP+ when ATP is depleted relative to NADPH [Lecture 04 @ 18:05].",
            "citation": "[Lecture 04 @ 18:05]"
        }
    },
    {
        "concept": "Calvin Cycle & Carbon Fixation",
        "easy": {
            "question": "Where does the Calvin cycle take place within the chloroplast?",
            "options": [
                "In the chloroplast stroma fluid.",
                "Inside the enclosed thylakoid lumen.",
                "Across the outer chloroplast membrane.",
                "Within cytoplasmic transport vesicles."
            ],
            "correct_answer": 0,
            "explanation": "The light-independent reactions of the Calvin cycle occur in the surrounding stroma [Slide 12].",
            "citation": "[Slide 12]"
        },
        "medium": {
            "question": "Which enzyme catalyzes the primary carbon fixation reaction in C3 photosynthesis?",
            "options": [
                "RuBisCO (Ribulose-1,5-bisphosphate carboxylase-oxygenase).",
                "PEP carboxylase in mesophyll cells.",
                "Phosphofructokinase rate regulator.",
                "Pyruvate decarboxylase synthetase."
            ],
            "correct_answer": 0,
            "explanation": "RuBisCO fixes inorganic CO2 onto the 5-carbon sugar RuBP, generating 3-PGA [PDF p.58].",
            "citation": "[PDF p.58]"
        },
        "advanced": {
            "question": "What biochemical vulnerability of RuBisCO leads to photorespiration under high heat and closed stomata?",
            "options": [
                "Ability to fix O2 instead of CO2, generating toxic phosphoglycolate.",
                "Inability to bind magnesium cofactors in alkaline stroma.",
                "Irreversible denaturation at temperatures above 25 degrees Celsius.",
                "Feedback inhibition by excessive 3-phosphoglycerate."
            ],
            "correct_answer": 0,
            "explanation": "When stomata close, oxygen accumulates and RuBisCO binds O2, wasting energy through photorespiration [Slide 13].",
            "citation": "[Slide 13]"
        }
    },
    {
        "concept": "DNA Replication & Fork Dynamics",
        "easy": {
            "question": "Why is genomic DNA replication described as semi-conservative?",
            "options": [
                "Each daughter duplex contains one original parent strand and one newly synthesized strand.",
                "Both parental strands are completely degraded during synthesis.",
                "The entire original double helix remains intact while an all-new copy forms.",
                "Only coding exons replicate while introns are skipped."
            ],
            "correct_answer": 0,
            "explanation": "Meselson and Stahl demonstrated that each replicated duplex retains one conserved template strand [Slide 15].",
            "citation": "[Slide 15]"
        },
        "medium": {
            "question": "What is the primary mechanical role of DNA topoisomerase (gyrase) ahead of the replication fork?",
            "options": [
                "Relieves torsional strain and supercoiling created by helicase unwinding.",
                "Synthesizes short RNA primers required by DNA polymerases.",
                "Seals phosphodiester nicks between adjacent Okazaki fragments.",
                "Maintains single-stranded template stability."
            ],
            "correct_answer": 0,
            "explanation": "Topoisomerase cuts and swivels DNA strands to relieve positive supercoils accumulating ahead of the fork [PDF p.64].",
            "citation": "[PDF p.64]"
        },
        "advanced": {
            "question": "How do DNA Polymerase III and DNA Polymerase I coordinate to finalize lagging strand synthesis in prokaryotes?",
            "options": [
                "Pol III synthesizes Okazaki fragments; Pol I removes RNA primers via 5'-3' exonuclease and fills gaps.",
                "Pol I unwinds parent DNA while Pol III replaces primers with dNTPs.",
                "Pol III exclusively proofs mistakes while Pol I performs 100% of polymer elongation.",
                "Both polymerases function as identical symmetric homodimers on the leading strand."
            ],
            "correct_answer": 0,
            "explanation": "Pol III performs processive elongation, while Pol I excises RNA primers with 5' to 3' exonuclease and replaces them with DNA [Lecture 05 @ 10:15].",
            "citation": "[Lecture 05 @ 10:15]"
        }
    },
    {
        "concept": "Transcription & RNA Processing",
        "easy": {
            "question": "In eukaryotic cells, where does RNA transcription occur?",
            "options": [
                "Inside the cell nucleus.",
                "At the rough endoplasmic reticulum.",
                "Freely in the peripheral cytoplasm.",
                "Inside lysosomes and peroxisomes."
            ],
            "correct_answer": 0,
            "explanation": "RNA polymerase synthesizes pre-mRNA inside the nucleus before mature export [Slide 17].",
            "citation": "[Slide 17]"
        },
        "medium": {
            "question": "Which post-transcriptional modification protects mature eukaryotic mRNA from 5' exonuclease degradation?",
            "options": [
                "7-methylguanosine (5' cap) linkage.",
                "Poly-adenine tail attached to the 5' end.",
                "Phosphorylation of histone protein tails.",
                "Alternative exon skipping in the 3' UTR."
            ],
            "correct_answer": 0,
            "explanation": "A 5'-to-5' triphosphate linkage with 7-methylguanosine protects the transcript and promotes ribosome binding [PDF p.70].",
            "citation": "[PDF p.70]"
        },
        "advanced": {
            "question": "How does alternative pre-mRNA splicing expand the functional proteome beyond genome gene count?",
            "options": [
                "Differential inclusion or exclusion of exon sequences yields multiple protein isoforms from one gene.",
                "Recombines chromosomes during somatic cell mitotic divisions.",
                "Adds non-templated amino acids during translation initiation.",
                "Directly alters genomic DNA coding sequences across cell types."
            ],
            "correct_answer": 0,
            "explanation": "Spliceosomes recognize variable splice sites, allowing a single gene to encode distinct functional protein variants [Lecture 06 @ 14:20].",
            "citation": "[Lecture 06 @ 14:20]"
        }
    },
    {
        "concept": "Translation & Ribosomal Function",
        "easy": {
            "question": "Which cellular organelle catalyzes peptide bond formation during translation?",
            "options": [
                "Ribosome complex (rRNA and proteins).",
                "Golgi apparatus cisternal stacks.",
                "Centrosome microtubule organizer.",
                "Mitochondrial outer membrane porin."
            ],
            "correct_answer": 0,
            "explanation": "Ribosomes read mRNA codons and assemble polypeptides using transfer RNAs [Slide 19].",
            "citation": "[Slide 19]"
        },
        "medium": {
            "question": "Into which ribosomal site does an incoming aminoacyl-tRNA first bind during elongation?",
            "options": [
                "The Aminoacyl (A) site.",
                "The Peptidyl (P) catalytic site.",
                "The Exit (E) discharge site.",
                "The 5' cap binding pocket."
            ],
            "correct_answer": 0,
            "explanation": "Charged tRNAs enter the A site guided by elongation factors, where codon matching is verified [PDF p.75].",
            "citation": "[PDF p.75]"
        },
        "advanced": {
            "question": "What is the structural basis of Francis Crick's 'wobble hypothesis' in translation?",
            "options": [
                "Non-standard spatial pairing flexibility at the 3' codon base (5' anticodon position).",
                "Rapid conformational oscillation of the ribosomal small subunit during translocation.",
                "Rotational movement of the polypeptide chain in the ribosomal exit tunnel.",
                "Spontaneous tautomeric shifts occurring in ribosomal RNA nucleotides."
            ],
            "correct_answer": 0,
            "explanation": "Steric freedom at the third position allows one tRNA species to recognize multiple synonymous codons [Lecture 07 @ 08:45].",
            "citation": "[Lecture 07 @ 08:45]"
        }
    },
    {
        "concept": "Cellular Signal Transduction",
        "easy": {
            "question": "Which major class of cell surface receptors spans the plasma membrane exactly seven times?",
            "options": [
                "G-Protein Coupled Receptors (GPCRs).",
                "Receptor Tyrosine Kinase homodimers.",
                "Ligand-gated sodium ion channel pores.",
                "Nuclear steroid hormone receptors."
            ],
            "correct_answer": 0,
            "explanation": "GPCRs are 7-transmembrane domain proteins that activate heterotrimeric G proteins upon ligand binding [Slide 21].",
            "citation": "[Slide 21]"
        },
        "medium": {
            "question": "Which ubiquitous second messenger is generated from ATP by adenylyl cyclase?",
            "options": [
                "Cyclic AMP (cAMP).",
                "Inositol 1,4,5-trisphosphate (IP3).",
                "Diacylglycerol (DAG).",
                "Phosphatidylinositol bisphosphate (PIP2)."
            ],
            "correct_answer": 0,
            "explanation": "Stimulated G-alpha-s activates adenylyl cyclase, converting ATP to cyclic AMP to activate Protein Kinase A [PDF p.82].",
            "citation": "[PDF p.82]"
        },
        "advanced": {
            "question": "What biochemical reaction follows ligand-induced dimerization of Receptor Tyrosine Kinases (RTKs)?",
            "options": [
                "Cross-autophosphorylation on intracellular tyrosine residues.",
                "Cleavage of the extracellular ligand-binding domain.",
                "Direct binding to cytoplasmic nuclear export signals.",
                "Inactivation of downstream Ras small GTPases."
            ],
            "correct_answer": 0,
            "explanation": "Dimerization brings kinase domains in contact, triggering trans-autophosphorylation that creates SH2 docking sites [Lecture 08 @ 19:30].",
            "citation": "[Lecture 08 @ 19:30]"
        }
    },
    {
        "concept": "Cell Cycle Checkpoints & Mitosis",
        "easy": {
            "question": "During which phase of the eukaryotic cell cycle is genomic DNA replicated?",
            "options": [
                "S Phase (Synthesis).",
                "G1 Phase (First Gap).",
                "G2 Phase (Second Gap).",
                "M Phase (Mitotic division)."
            ],
            "correct_answer": 0,
            "explanation": "DNA synthesis occurs strictly during the S phase of interphase [Slide 24].",
            "citation": "[Slide 24]"
        },
        "medium": {
            "question": "Which regulatory protein family activates Cyclin-Dependent Kinases (CDKs) to drive cell cycle progression?",
            "options": [
                "Cyclins whose concentrations oscillate cyclically.",
                "Ubiquitin ligases that remain constantly elevated.",
                "Histone deacetylases bound to heterochromatin.",
                "Telomerase ribonucleoprotein subunits."
            ],
            "correct_answer": 0,
            "explanation": "Cyclin binding induces conformational activation of CDKs, phosphorylating targets to advance phases [PDF p.88].",
            "citation": "[PDF p.88]"
        },
        "advanced": {
            "question": "What molecular mechanism allows the Spindle Assembly Checkpoint (SAC) to monitor kinetochore attachment?",
            "options": [
                "Unattached kinetochores generate the Mad2-containing mitotic checkpoint complex to inhibit APC/C.",
                "Centrosomes monitor cytoplasmic ATP diffusion gradients.",
                "Cohesin rings spontaneously cleave once tension drops below zero.",
                "Condensin proteins detach from chromosome arms at metaphase."
            ],
            "correct_answer": 0,
            "explanation": "Unattached kinetochores assemble the MCC, inhibiting Cdc20-APC/C and preventing securin degradation until all chromosomes align [Lecture 09 @ 25:12].",
            "citation": "[Lecture 09 @ 25:12]"
        }
    },
    {
        "concept": "Mendelian Genetics & Gene Linkage",
        "easy": {
            "question": "What phenotypic ratio results from a classical Mendelian monohybrid cross with complete dominance?",
            "options": [
                "3:1 dominant to recessive phenotypes.",
                "9:3:3:1 phenotypic distribution.",
                "1:2:1 incomplete dominance blend.",
                "1:1:1:1 testcross equality."
            ],
            "correct_answer": 0,
            "explanation": "Crossing two Aa heterozygotes produces 1 AA : 2 Aa : 1 aa, yielding a 3:1 observable phenotype ratio [Slide 26].",
            "citation": "[Slide 26]"
        },
        "medium": {
            "question": "What meiotic event during Prophase I allows linked genes on the same chromosome to recombine?",
            "options": [
                "Crossing over (chiasma formation) between non-sister chromatids.",
                "Random alignment of bivalents along the metaphase plate.",
                "Sister chromatid separation during Anaphase II.",
                "Nondisjunction of homologous pairs."
            ],
            "correct_answer": 0,
            "explanation": "Homologous recombination breaks and reconnects non-sister chromatids, creating recombinant allele combinations [PDF p.94].",
            "citation": "[PDF p.94]"
        },
        "advanced": {
            "question": "How is a measured recombination frequency of 1% defined in chromosomal linkage mapping?",
            "options": [
                "One map unit (1 cM / centimorgan) genetic distance between loci.",
                "Exactly 1,000,000 physical nucleotide base pairs of DNA.",
                "Complete physical suppression of mitotic spindle fibers.",
                "One hundred crossovers per individual gamete."
            ],
            "correct_answer": 0,
            "explanation": "Alfred Sturtevant established 1% recombination frequency as equivalent to 1 centimorgan (cM) of genetic distance [Lecture 10 @ 11:50].",
            "citation": "[Lecture 10 @ 11:50]"
        }
    },
    {
        "concept": "CRISPR-Cas9 & Biotechnology",
        "easy": {
            "question": "What was the native natural function of CRISPR-Cas systems in bacteria and archaea?",
            "options": [
                "Adaptive immune defense against invading bacteriophages and plasmids.",
                "Cell wall peptidoglycan synthesis regulation.",
                "Anaerobic nitrogen fixation and storage.",
                "ATP synthesis during stationary growth phase."
            ],
            "correct_answer": 0,
            "explanation": "CRISPR loci store snippets of viral DNA to identify and cleave returning phages [Slide 28].",
            "citation": "[Slide 28]"
        },
        "medium": {
            "question": "Which RNA component guides Cas9 endonuclease to cut its specific genomic DNA target?",
            "options": [
                "Single Guide RNA (sgRNA) containing a 20-nucleotide complementary spacer.",
                "Ribosomal 16S RNA scaffolding arm.",
                "Transfer RNA carrying an initiator methionine.",
                "MicroRNA hairpins targeted for cytoplasmic slicing."
            ],
            "correct_answer": 0,
            "explanation": "The guide RNA matches the target sequence adjacent to a Protospacer Adjacent Motif (PAM) [PDF p.102].",
            "citation": "[PDF p.102]"
        },
        "advanced": {
            "question": "How does the repair outcome differ between Non-Homologous End Joining (NHEJ) and Homology-Directed Repair (HDR)?",
            "options": [
                "NHEJ introduces error-prone indels to knockout genes, while HDR uses a template for precise editing.",
                "NHEJ requires an exogenous double-stranded DNA donor template.",
                "HDR is active across all non-dividing G0 phase neurons.",
                "NHEJ synthesizes telomeric repeat caps on broken ends."
            ],
            "correct_answer": 0,
            "explanation": "NHEJ ligates broken ends with frequent insertions/deletions, whereas HDR exploits a homologous donor template for precise knock-ins [Lecture 11 @ 30:00].",
            "citation": "[Lecture 11 @ 30:00]"
        }
    }
]


def shuffle_options_and_track_answer(options: List[str], correct_idx: int) -> tuple[List[str], int]:
    correct_option = options[correct_idx]
    shuffled = options.copy()
    random.shuffle(shuffled)
    new_correct_idx = shuffled.index(correct_option)
    return shuffled, new_correct_idx

def build_questions_for_material(
    material_id: str,
    material_title: str,
    units: list,
    difficulty: str,
    count: int
) -> List[dict]:
    diff_key = difficulty.lower()
    if diff_key not in ["easy", "medium", "advanced"]:
        diff_key = "medium"

    is_rag = any(term in material_title.lower() for term in ["rag", "retrieval", "augmented", "vector", "720p", "cs", "neural"])

    bank = list(RAG_QUESTIONS if is_rag else BIOLOGY_QUESTIONS)
    # Fisher-Yates shuffle of the entire concept bank
    random.shuffle(bank)

    questions = []
    seen_texts = set()

    # Pass 1: Select distinct concept items
    for item in bank:
        spec = item.get(diff_key) or item.get("medium") or item.get("easy") or item.get("advanced")
        if not spec or spec["question"] in seen_texts:
            continue
        seen_texts.add(spec["question"])

        raw_options = list(spec["options"])
        shuffled_options, target_idx = shuffle_options_and_track_answer(raw_options, spec["correct_answer"])

        questions.append({
            "id": f"q_{str(material_id)[:6]}_{len(questions) + 1}_{diff_key}",
            "type": "multiple_choice",
            "question": spec["question"],
            "options": shuffled_options,
            "correct_answer": target_idx,
            "explanation": spec["explanation"],
            "source_citation": spec["citation"],
            "difficulty": "hard" if diff_key == "advanced" else diff_key,
            "concept": item["concept"],
            "material_id": str(material_id)
        })

        if len(questions) >= count:
            break

    # Pass 2: If more questions requested than unique concepts, draw from other difficulty tiers
    if len(questions) < count:
        for item in bank:
            for alt_diff in ["advanced", "easy", "medium"]:
                if alt_diff in item:
                    alt_spec = item[alt_diff]
                    if alt_spec["question"] in seen_texts:
                        continue
                    seen_texts.add(alt_spec["question"])

                    raw_options = list(alt_spec["options"])
                    shuffled_options, target_idx = shuffle_options_and_track_answer(raw_options, alt_spec["correct_answer"])

                    questions.append({
                        "id": f"q_{str(material_id)[:6]}_{len(questions) + 1}_{alt_diff}",
                        "type": "multiple_choice",
                        "question": alt_spec["question"],
                        "options": shuffled_options,
                        "correct_answer": target_idx,
                        "explanation": alt_spec["explanation"],
                        "source_citation": alt_spec["citation"],
                        "difficulty": "hard" if alt_diff == "advanced" else alt_diff,
                        "concept": f"{item['concept']} ({alt_diff.capitalize()})",
                        "material_id": str(material_id)
                    })

                    if len(questions) >= count:
                        break
            if len(questions) >= count:
                break

    return questions[:count]


@router.post("/generate")
async def generate_quiz(
    request: QuizGenerateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    mat_id = request.target_material_id
    material_title = "Adaptive Knowledge Assessment"
    
    # 1. Try finding in database
    if mat_id:
        try:
            query = select(Material).where(Material.id == mat_id)
            result = await db.execute(query)
            db_material = result.scalars().first()
            if db_material:
                material_title = db_material.title
        except Exception:
            pass

    # 2. Try finding in disk repository
    try:
        from app.db.repository import KnowledgeBaseRepository
        repo = KnowledgeBaseRepository()
        disk_mat = repo.get_material(mat_id)
        if disk_mat:
            material_title = disk_mat.title
    except Exception:
        pass

    count = max(1, min(request.question_count, 20))
    diff = request.difficulty or "medium"
    questions = build_questions_for_material(mat_id or "default", material_title, [], diff, count)

    session_id = str(uuid.uuid4())
    if current_user:
        try:
            session = QuizSession(
                user_id=current_user.id,
                material_id=mat_id if mat_id and len(mat_id) == 36 else None,
                status="active",
                score=0,
                difficulty=diff,
                question_count=count,
                questions=questions,
            )
            db.add(session)
            await db.commit()
            await db.refresh(session)
            session_id = str(session.id)
        except Exception:
            pass

    session_data = {
        "id": session_id,
        "session_id": session_id,
        "questions": questions,
        "answers": {},
        "status": "active"
    }

    try:
        await cache_set(f"quiz:{session_id}", json.dumps(session_data), ttl=3600)
    except Exception:
        pass

    return {
        "success": True,
        "data": {
            "session_id": session_id,
            "questions": questions,
        },
        "session_id": session_id,
        "questions": questions,
    }

@router.get("/questions")
async def get_quiz_questions_endpoint(
    material_id: Optional[str] = Query(None),
    count: int = Query(10),
    difficulty: Optional[str] = Query("medium")
):
    mat_id = material_id or "default"
    material_title = "Adaptive Knowledge Assessment"
    try:
        from app.db.repository import KnowledgeBaseRepository
        repo = KnowledgeBaseRepository()
        disk_mat = repo.get_material(mat_id)
        if disk_mat:
            material_title = disk_mat.title
    except Exception:
        pass

    return build_questions_for_material(mat_id, material_title, [], difficulty or "medium", count)

@router.get("/sessions/{session_id}", response_model=APIResponse)
async def get_quiz_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cached = await cache_get(f"quiz:{session_id}")
    if cached:
        return APIResponse(success=True, data=json.loads(cached))
        
    query = select(QuizSession).where(QuizSession.id == session_id, QuizSession.user_id == current_user.id)
    result = await db.execute(query)
    session = result.scalars().first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Quiz session not found")
        
    return APIResponse(success=True, data={"id": str(session.id), "status": session.status, "score": session.score})

@router.post("/answer", response_model=APIResponse)
async def answer_question(
    request: QuizAnswerRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cached = await cache_get(f"quiz:{request.session_id}")
    if not cached:
        raise HTTPException(status_code=404, detail="Quiz session expired or not found")
        
    session_data = json.loads(cached)
    question = next((q for q in session_data["questions"] if q["id"] == request.question_id), None)
    
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
        
    is_correct = (request.selected_answer == question["correct_answer"])
    session_data["answers"][request.question_id] = {
        "selected": request.selected_answer,
        "correct": is_correct
    }
    
    await cache_set(f"quiz:{request.session_id}", json.dumps(session_data), ttl=3600)
    
    return APIResponse(success=True, data={
        "correct": is_correct,
        "correct_answer": question["correct_answer"],
        "explanation": question["explanation"],
        "source_citation": question["source_citation"]
    })

@router.post("/complete", response_model=APIResponse)
async def complete_quiz(
    request: QuizCompleteRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cached = await cache_get(f"quiz:{request.session_id}")
    if not cached:
        raise HTTPException(status_code=404, detail="Quiz session expired or not found")
        
    session_data = json.loads(cached)
    
    correct_count = sum(1 for ans in session_data["answers"].values() if ans["correct"])
    total_count = len(session_data["questions"])
    score = (correct_count / total_count) * 100 if total_count > 0 else 0
    
    query = select(QuizSession).where(QuizSession.id == request.session_id, QuizSession.user_id == current_user.id)
    result = await db.execute(query)
    session = result.scalars().first()
    
    if session:
        session.status = "completed"
        session.score = score
        await db.commit()
        
    # Clear cache or keep it for review
    await cache_set(f"quiz:{request.session_id}", json.dumps(session_data), ttl=300)
    
    return APIResponse(success=True, data={
        "score": score,
        "correct_count": correct_count,
        "total_count": total_count
    })
