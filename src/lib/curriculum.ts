import { EXTRA_QUESTIONS } from "./questionBank.extra";

export type Difficulty = "easy" | "medium" | "hard";

export type Question = {
  id: string;
  subjectId: string;
  chapterId: string;
  difficulty: Difficulty;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
  concept: string;
};

export type Chapter = {
  id: string;
  name: string;
  topics: string[];
};

export type Subject = {
  id: string;
  name: string;
  short: string;
  blurb: string;
  chapters: Chapter[];
};

export const SUBJECTS: Subject[] = [
  {
    id: "science",
    name: "Science",
    short: "SCI",
    blurb: "Physics, Chemistry & Biology — NCERT Class 10",
    chapters: [
      { id: "chemical-reactions", name: "Chemical Reactions and Equations", topics: ["Balancing", "Types of reactions", "Corrosion"] },
      { id: "acids-bases-salts", name: "Acids, Bases and Salts", topics: ["pH scale", "Indicators", "Common salts"] },
      { id: "metals-nonmetals", name: "Metals and Non-metals", topics: ["Reactivity series", "Extraction", "Alloys"] },
      { id: "carbon-compounds", name: "Carbon and its Compounds", topics: ["Covalent bonds", "Homologous series", "Soaps"] },
      { id: "life-processes", name: "Life Processes", topics: ["Nutrition", "Respiration", "Transportation", "Excretion"] },
      { id: "control-coordination", name: "Control and Coordination", topics: ["Reflex arc", "Hormones", "Tropisms"] },
      { id: "light", name: "Light — Reflection and Refraction", topics: ["Mirror formula", "Lens formula", "Refractive index"] },
      { id: "electricity", name: "Electricity", topics: ["Ohm's law", "Resistors", "Heating effect"] },
      { id: "magnetic-effects", name: "Magnetic Effects of Current", topics: ["Field lines", "Fleming's rules", "Induction"] },
    ],
  },
  {
    id: "maths",
    name: "Mathematics",
    short: "MAT",
    blurb: "Concept clarity + speed for the board paper",
    chapters: [
      { id: "real-numbers", name: "Real Numbers", topics: ["Euclid's lemma", "HCF & LCM", "Irrational numbers"] },
      { id: "polynomials", name: "Polynomials", topics: ["Zeroes", "Relation with coefficients"] },
      { id: "linear-equations", name: "Pair of Linear Equations", topics: ["Substitution", "Elimination", "Graphs"] },
      { id: "quadratic-equations", name: "Quadratic Equations", topics: ["Factorisation", "Discriminant", "Roots"] },
      { id: "ap", name: "Arithmetic Progressions", topics: ["nth term", "Sum of n terms"] },
      { id: "triangles", name: "Triangles", topics: ["Similarity", "BPT", "Pythagoras"] },
      { id: "coordinate-geometry", name: "Coordinate Geometry", topics: ["Distance formula", "Section formula"] },
      { id: "trigonometry", name: "Introduction to Trigonometry", topics: ["Ratios", "Identities", "Standard angles"] },
      { id: "circles", name: "Circles", topics: ["Tangents", "Theorems"] },
      { id: "surface-areas", name: "Surface Areas and Volumes", topics: ["Combined solids", "Conversion"] },
      { id: "statistics", name: "Statistics", topics: ["Mean", "Median", "Mode"] },
      { id: "probability", name: "Probability", topics: ["Simple events", "Dice & cards"] },
    ],
  },
  {
    id: "sst",
    name: "Social Science",
    short: "SST",
    blurb: "History, Geography, Civics & Economics",
    chapters: [
      { id: "nationalism-europe", name: "The Rise of Nationalism in Europe", topics: ["French Revolution", "Unification"] },
      { id: "nationalism-india", name: "Nationalism in India", topics: ["Non-Cooperation", "Civil Disobedience"] },
      { id: "resources", name: "Resources and Development", topics: ["Soil types", "Land use"] },
      { id: "water-resources", name: "Water Resources", topics: ["Dams", "Rainwater harvesting"] },
      { id: "power-sharing", name: "Power Sharing", topics: ["Belgium & Sri Lanka", "Forms of power sharing"] },
      { id: "federalism", name: "Federalism", topics: ["Lists", "Decentralisation"] },
      { id: "development", name: "Development", topics: ["Income", "HDI"] },
      { id: "sectors-economy", name: "Sectors of the Indian Economy", topics: ["Primary/Secondary/Tertiary", "MGNREGA"] },
    ],
  },
  {
    id: "english",
    name: "English",
    short: "ENG",
    blurb: "Literature, grammar and writing skills",
    chapters: [
      { id: "first-flight", name: "First Flight — Prose", topics: ["A Letter to God", "Nelson Mandela"] },
      { id: "poems", name: "First Flight — Poems", topics: ["Dust of Snow", "Fire and Ice"] },
      { id: "footprints", name: "Footprints Without Feet", topics: ["A Triumph of Surgery", "The Thief's Story"] },
      { id: "grammar", name: "Grammar", topics: ["Tenses", "Reported speech", "Determiners"] },
      { id: "writing", name: "Writing Skills", topics: ["Formal letter", "Analytical paragraph"] },
    ],
  },
  {
    id: "hindi",
    name: "Hindi",
    short: "HIN",
    blurb: "क्षितिज, कृतिका और व्याकरण",
    chapters: [
      { id: "kshitij-kavya", name: "क्षितिज — काव्य खंड", topics: ["सूरदास", "तुलसीदास", "बिहारी"] },
      { id: "kshitij-gadya", name: "क्षितिज — गद्य खंड", topics: ["नेताजी का चश्मा", "बालगोबिन भगत"] },
      { id: "kritika", name: "कृतिका", topics: ["माता का अँचल", "साना साना हाथ जोड़ि"] },
      { id: "vyakaran", name: "व्याकरण", topics: ["रचना के आधार पर वाक्य", "समास", "अलंकार"] },
    ],
  },
];

const SEED_QUESTIONS: Question[] = [
  {
    id: "q-sci-1",
    subjectId: "science",
    chapterId: "chemical-reactions",
    difficulty: "easy",
    question: "Which of the following is a displacement reaction?",
    options: [
      "CaO + H₂O → Ca(OH)₂",
      "Fe + CuSO₄ → FeSO₄ + Cu",
      "2H₂ + O₂ → 2H₂O",
      "CaCO₃ → CaO + CO₂",
    ],
    answer: 1,
    explanation:
      "Iron is more reactive than copper, so it displaces copper from copper sulphate solution. This is a single displacement reaction.",
    concept: "Types of chemical reactions",
  },
  {
    id: "q-sci-2",
    subjectId: "science",
    chapterId: "acids-bases-salts",
    difficulty: "easy",
    question: "The pH of a neutral solution at 25°C is:",
    options: ["0", "7", "10", "14"],
    answer: 1,
    explanation: "A neutral solution has equal H⁺ and OH⁻ concentration, giving pH = 7 at 25°C.",
    concept: "pH scale",
  },
  {
    id: "q-sci-3",
    subjectId: "science",
    chapterId: "life-processes",
    difficulty: "medium",
    question: "In humans, the exchange of gases takes place in the:",
    options: ["Trachea", "Bronchi", "Alveoli", "Larynx"],
    answer: 2,
    explanation:
      "Alveoli are balloon-like structures with a rich blood supply and thin walls, providing maximum surface area for gas exchange.",
    concept: "Respiration in humans",
  },
  {
    id: "q-sci-4",
    subjectId: "science",
    chapterId: "light",
    difficulty: "medium",
    question: "A concave mirror forms a virtual and enlarged image when the object is placed:",
    options: ["Beyond C", "At C", "Between F and C", "Between P and F"],
    answer: 3,
    explanation:
      "When the object lies between the pole and the focus of a concave mirror, the image formed is virtual, erect and enlarged.",
    concept: "Image formation by concave mirrors",
  },
  {
    id: "q-sci-5",
    subjectId: "science",
    chapterId: "electricity",
    difficulty: "hard",
    question: "Three resistors of 2Ω, 3Ω and 6Ω are connected in parallel. The equivalent resistance is:",
    options: ["1Ω", "2Ω", "5.5Ω", "11Ω"],
    answer: 0,
    explanation: "1/R = 1/2 + 1/3 + 1/6 = 6/6 = 1, so R = 1Ω.",
    concept: "Resistors in parallel",
  },
  {
    id: "q-sci-6",
    subjectId: "science",
    chapterId: "carbon-compounds",
    difficulty: "medium",
    question: "The number of covalent bonds in a molecule of ethane (C₂H₆) is:",
    options: ["6", "7", "8", "9"],
    answer: 1,
    explanation: "Ethane has 6 C–H bonds and 1 C–C bond, giving a total of 7 covalent bonds.",
    concept: "Covalent bonding in carbon",
  },
  {
    id: "q-mat-1",
    subjectId: "maths",
    chapterId: "real-numbers",
    difficulty: "easy",
    question: "The HCF of 96 and 404 is:",
    options: ["2", "4", "8", "12"],
    answer: 1,
    explanation: "96 = 2⁵ × 3 and 404 = 2² × 101. Common factor = 2² = 4.",
    concept: "HCF by prime factorisation",
  },
  {
    id: "q-mat-2",
    subjectId: "maths",
    chapterId: "quadratic-equations",
    difficulty: "medium",
    question: "For what value of k does 2x² + kx + 3 = 0 have equal roots?",
    options: ["±2√6", "±√6", "±6", "±4√3"],
    answer: 0,
    explanation: "Equal roots ⇒ D = 0 ⇒ k² − 4(2)(3) = 0 ⇒ k² = 24 ⇒ k = ±2√6.",
    concept: "Discriminant",
  },
  {
    id: "q-mat-3",
    subjectId: "maths",
    chapterId: "trigonometry",
    difficulty: "easy",
    question: "The value of sin²30° + cos²30° is:",
    options: ["0", "1/2", "1", "3/4"],
    answer: 2,
    explanation: "sin²θ + cos²θ = 1 for every angle θ, so the value is 1.",
    concept: "Trigonometric identity",
  },
  {
    id: "q-mat-4",
    subjectId: "maths",
    chapterId: "ap",
    difficulty: "medium",
    question: "The 11th term of the AP: 3, 8, 13, 18, … is:",
    options: ["48", "53", "58", "63"],
    answer: 1,
    explanation: "a = 3, d = 5, aₙ = a + (n−1)d = 3 + 10 × 5 = 53.",
    concept: "nth term of an AP",
  },
  {
    id: "q-mat-5",
    subjectId: "maths",
    chapterId: "probability",
    difficulty: "easy",
    question: "A die is thrown once. Probability of getting a prime number is:",
    options: ["1/6", "1/3", "1/2", "2/3"],
    answer: 2,
    explanation: "Primes on a die are 2, 3 and 5 ⇒ 3 favourable outcomes out of 6 ⇒ 1/2.",
    concept: "Simple probability",
  },
  {
    id: "q-mat-6",
    subjectId: "maths",
    chapterId: "coordinate-geometry",
    difficulty: "hard",
    question: "The distance between the points (−5, 7) and (−1, 3) is:",
    options: ["4√2", "2√5", "6", "8"],
    answer: 0,
    explanation: "d = √[(−1+5)² + (3−7)²] = √(16 + 16) = √32 = 4√2.",
    concept: "Distance formula",
  },
  {
    id: "q-sst-1",
    subjectId: "sst",
    chapterId: "nationalism-india",
    difficulty: "easy",
    question: "The Non-Cooperation Movement was launched in the year:",
    options: ["1919", "1920", "1930", "1942"],
    answer: 1,
    explanation:
      "Gandhiji launched the Non-Cooperation Movement in 1920 at the Nagpur session of the Congress, combining it with the Khilafat issue.",
    concept: "National movement timeline",
  },
  {
    id: "q-sst-2",
    subjectId: "sst",
    chapterId: "federalism",
    difficulty: "medium",
    question: "Subjects like defence and foreign affairs are included in the:",
    options: ["State List", "Union List", "Concurrent List", "Residuary powers"],
    answer: 1,
    explanation:
      "The Union List contains subjects of national importance such as defence, foreign affairs, banking and currency; only the Union Government legislates on them.",
    concept: "Division of powers",
  },
  {
    id: "q-sst-3",
    subjectId: "sst",
    chapterId: "development",
    difficulty: "medium",
    question: "Which organisation publishes the Human Development Report?",
    options: ["World Bank", "UNDP", "WHO", "IMF"],
    answer: 1,
    explanation:
      "The UNDP publishes the Human Development Report, which compares countries on income, education and health.",
    concept: "Measuring development",
  },
  {
    id: "q-sst-4",
    subjectId: "sst",
    chapterId: "resources",
    difficulty: "easy",
    question: "Black soil is best suited for the cultivation of:",
    options: ["Rice", "Cotton", "Tea", "Wheat"],
    answer: 1,
    explanation: "Black (regur) soil retains moisture well and is ideal for cotton, hence the name 'black cotton soil'.",
    concept: "Soil types of India",
  },
  {
    id: "q-eng-1",
    subjectId: "english",
    chapterId: "poems",
    difficulty: "easy",
    question: "In 'Fire and Ice', 'ice' symbolises:",
    options: ["Desire", "Hatred", "Hope", "Love"],
    answer: 1,
    explanation:
      "Frost uses fire for desire and ice for hatred/indifference — both, he says, are capable of destroying the world.",
    concept: "Symbolism in poetry",
  },
  {
    id: "q-eng-2",
    subjectId: "english",
    chapterId: "grammar",
    difficulty: "medium",
    question: "Choose the correct sentence:",
    options: [
      "He said that he will come tomorrow.",
      "He said that he would come the next day.",
      "He said that he comes the next day.",
      "He said he will came tomorrow.",
    ],
    answer: 1,
    explanation:
      "In reported speech, 'will' becomes 'would' and 'tomorrow' becomes 'the next day'.",
    concept: "Reported speech",
  },
  {
    id: "q-hin-1",
    subjectId: "hindi",
    chapterId: "vyakaran",
    difficulty: "easy",
    question: "'नीलकमल' में कौन-सा समास है?",
    options: ["तत्पुरुष", "कर्मधारय", "द्विगु", "द्वंद्व"],
    answer: 1,
    explanation: "'नीलकमल' = नीला है जो कमल — विशेषण-विशेष्य संबंध होने के कारण यह कर्मधारय समास है।",
    concept: "समास",
  },
  {
    id: "q-hin-2",
    subjectId: "hindi",
    chapterId: "kshitij-gadya",
    difficulty: "medium",
    question: "'नेताजी का चश्मा' पाठ के लेखक कौन हैं?",
    options: ["स्वयं प्रकाश", "रामवृक्ष बेनीपुरी", "यशपाल", "मन्नू भंडारी"],
    answer: 0,
    explanation: "'नेताजी का चश्मा' कहानी के लेखक स्वयं प्रकाश हैं।",
    concept: "लेखक परिचय",
  },
];

/**
 * Full offline question bank = base seed + the extended CBSE seed bank.
 * Merged here (not in the UI) so every screen — quiz, tests, bookmarks —
 * sees exactly the same questions.
 */
export const QUESTIONS: Question[] = (() => {
  const byId = new Map<string, Question>();
  for (const q of [...SEED_QUESTIONS, ...EXTRA_QUESTIONS]) if (!byId.has(q.id)) byId.set(q.id, q);
  return [...byId.values()];
})();

export function getSubject(id: string) {
  return SUBJECTS.find((s) => s.id === id);
}


export function questionsFor(opts: { subjectId?: string; chapterId?: string; difficulty?: Difficulty | "mixed" }) {
  return QUESTIONS.filter((q) => {
    if (opts.subjectId && q.subjectId !== opts.subjectId) return false;
    if (opts.chapterId && q.chapterId !== opts.chapterId) return false;
    if (opts.difficulty && opts.difficulty !== "mixed" && q.difficulty !== opts.difficulty) return false;
    return true;
  });
}

export const TOTAL_CHAPTERS = SUBJECTS.reduce((n, s) => n + s.chapters.length, 0);
