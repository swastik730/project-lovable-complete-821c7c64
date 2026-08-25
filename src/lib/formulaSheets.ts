/**
 * Formula / Revision Sheets — one-page, exam-day quick revision per subject.
 * Print-friendly: each subject renders as a single sheet.
 */
export type SheetSection = { title: string; items: string[] };
export type FormulaSheet = { subjectId: string; subjectName: string; sections: SheetSection[] };

export const FORMULA_SHEETS: FormulaSheet[] = [
  {
    subjectId: "maths",
    subjectName: "Mathematics",
    sections: [
      {
        title: "Real Numbers",
        items: [
          "Euclid's lemma: a = bq + r, 0 ≤ r < b",
          "HCF × LCM = product of the two numbers",
          "√2, √3, √5 are irrational — prove by contradiction",
        ],
      },
      {
        title: "Polynomials",
        items: [
          "α + β = −b/a,  αβ = c/a  (quadratic ax² + bx + c)",
          "Cubic: α+β+γ = −b/a, αβ+βγ+γα = c/a, αβγ = −d/a",
          "Division: p(x) = g(x)·q(x) + r(x)",
        ],
      },
      {
        title: "Quadratic Equations",
        items: [
          "Roots: x = [−b ± √(b²−4ac)] / 2a",
          "D > 0 → 2 real roots; D = 0 → equal roots; D < 0 → no real roots",
          "Sum = −b/a, Product = c/a",
        ],
      },
      {
        title: "Arithmetic Progressions",
        items: ["aₙ = a + (n−1)d", "Sₙ = n/2 [2a + (n−1)d] = n/2 (a + l)", "aₙ = Sₙ − Sₙ₋₁"],
      },
      {
        title: "Coordinate Geometry",
        items: [
          "Distance = √[(x₂−x₁)² + (y₂−y₁)²]",
          "Section formula: ((mx₂+nx₁)/(m+n), (my₂+ny₁)/(m+n))",
          "Area of Δ = ½|x₁(y₂−y₃) + x₂(y₃−y₁) + x₃(y₁−y₂)|",
        ],
      },
      {
        title: "Trigonometry",
        items: [
          "sin²θ + cos²θ = 1;  1 + tan²θ = sec²θ;  1 + cot²θ = cosec²θ",
          "sin(90°−θ) = cos θ;  tan(90°−θ) = cot θ",
          "Values: sin 30°=½, sin 45°=1/√2, sin 60°=√3/2; tan 45°=1, tan 60°=√3",
        ],
      },
      {
        title: "Circles",
        items: [
          "Tangent ⊥ radius at point of contact",
          "Tangents from an external point are equal",
        ],
      },
      {
        title: "Mensuration",
        items: [
          "Cylinder: CSA = 2πrh, TSA = 2πr(r+h), V = πr²h",
          "Cone: CSA = πrl, V = ⅓πr²h, l² = r² + h²",
          "Sphere: SA = 4πr², V = 4/3 πr³;  Hemisphere: V = 2/3 πr³",
          "Frustum: V = ⅓πh(R² + r² + Rr)",
        ],
      },
      {
        title: "Statistics & Probability",
        items: [
          "Mean (assumed): x̄ = a + Σfᵢdᵢ/Σfᵢ",
          "Mode = l + [(f₁−f₀)/(2f₁−f₀−f₂)] × h",
          "Mode = 3 Median − 2 Mean",
          "P(E) = favourable outcomes / total outcomes; 0 ≤ P(E) ≤ 1",
        ],
      },
    ],
  },
  {
    subjectId: "science",
    subjectName: "Science",
    sections: [
      {
        title: "Physics — Electricity",
        items: [
          "V = IR;  P = VI = I²R = V²/R",
          "Series: R = R₁ + R₂ + R₃;  Parallel: 1/R = 1/R₁ + 1/R₂",
          "E (kWh) = P(kW) × t(h);  1 unit = 1 kWh = 3.6 × 10⁶ J",
          "Resistivity: R = ρl/A",
        ],
      },
      {
        title: "Physics — Light",
        items: [
          "Mirror/Lens formula: 1/v + 1/u = 1/f (mirror); 1/v − 1/u = 1/f (lens)",
          "Magnification m = −v/u (mirror); m = v/u (lens)",
          "Power of lens P = 1/f (metres) — unit: dioptre",
          "Refractive index n = c/v = sin i / sin r",
        ],
      },
      {
        title: "Chemistry — Key Reactions",
        items: [
          "CaO + H₂O → Ca(OH)₂ + heat (combination, slaking of lime)",
          "CaCO₃ →(heat) CaO + CO₂ (decomposition)",
          "Fe + CuSO₄ → FeSO₄ + Cu (displacement)",
          "CH₄ + 2O₂ → CO₂ + 2H₂O (combustion)",
          "CH₃COOH + C₂H₅OH →(conc. H₂SO₄) CH₃COOC₂H₅ + H₂O (esterification)",
        ],
      },
      {
        title: "Chemistry — Facts",
        items: [
          "pH < 7 acidic, = 7 neutral, > 7 basic; tooth decay below pH 5.5",
          "Baking soda NaHCO₃; Washing soda Na₂CO₃·10H₂O; POP CaSO₄·½H₂O",
          "Aqua regia = conc. HCl : conc. HNO₃ = 3 : 1 (dissolves gold)",
        ],
      },
      {
        title: "Biology — One-liners",
        items: [
          "Photosynthesis: 6CO₂ + 6H₂O →(light/chlorophyll) C₆H₁₂O₆ + 6O₂",
          "Aerobic respiration releases ~38 ATP; anaerobic far less",
          "Nephrons filter blood in kidneys; alveoli exchange gases",
          "Auxin → growth; Gibberellin → stem elongation; ABA → wilting; Cytokinin → cell division",
        ],
      },
    ],
  },
  {
    subjectId: "sst",
    subjectName: "Social Science",
    sections: [
      {
        title: "History — Key Dates",
        items: [
          "1830 — French Revolution (July); 1848 — Europe revolutions",
          "1834 — Zollverein formed; 1871 — German unification (Versailles)",
          "1919 — Rowlatt Act & Jallianwala Bagh; 1920–22 — Non-Cooperation",
          "1930 — Dandi Salt March (12 March); 1942 — Quit India",
        ],
      },
      {
        title: "Geography — Must Remember",
        items: [
          "Alluvial soil — most fertile (Indo-Gangetic plains); Black soil — cotton",
          "Laterite soil — leaching, high rainfall areas",
          "Narmada, Tapi flow westward (rift valleys)",
          "Rainwater harvesting — Rajasthan (tanka), Tamil Nadu (legal mandate)",
        ],
      },
      {
        title: "Civics — Concepts",
        items: [
          "Belgium: equal community representation + community government",
          "Sri Lanka: majoritarianism of Sinhala leaders (lesson in what NOT to do)",
          "3 lists: Union (defence), State (police), Concurrent (education)",
          "3-tier government: Union, State, Panchayati Raj (73rd/74th amendments)",
        ],
      },
      {
        title: "Economics — Concepts",
        items: [
          "HDI = income + health (life expectancy) + education — UNDP",
          "Sectors: Primary (agriculture) → Secondary (industry) → Tertiary (services)",
          "MGNREGA 2005 — 100 days guaranteed rural employment",
          "Disguised unemployment — more people employed than needed (farming)",
        ],
      },
    ],
  },
  {
    subjectId: "english",
    subjectName: "English",
    sections: [
      {
        title: "Grammar — Tenses & Speech",
        items: [
          "Present perfect → Past perfect in reported speech (has/have → had)",
          "Said to → told (with object); that replaces inverted commas",
          "Today → that day; tomorrow → the next day; yesterday → the day before",
          "Modals: can → could, will → would, may → might (backshift)",
        ],
      },
      {
        title: "Writing — Letter Formats",
        items: [
          "Formal: Sender's address → Date → Receiver's designation & address → Subject → Sir/Madam → Body → Yours faithfully",
          "Analytical paragraph: intro (data trend) → comparison → conclusion, 100–120 words",
          "Word limit discipline: 100–120 words; don't exceed — marks cut for length",
        ],
      },
      {
        title: "Literature — Quick Themes",
        items: [
          "A Letter to God — faith vs irony (Lencho)",
          "Nelson Mandela — freedom, courage, dignity",
          "Fire and Ice — desire & hatred destroy",
          "The Ball Poem — loss and growing up",
          "The Midnight Visitor — wit beats weapons (Ausable)",
        ],
      },
    ],
  },
  {
    subjectId: "hindi",
    subjectName: "हिंदी",
    sections: [
      {
        title: "व्याकरण — समास",
        items: [
          "तत्पुरुष: विभक्ति का लोप — विद्यालय (विद्या के लिए आलय)",
          "द्वंद्व: दोनों पद प्रधान — माता-पिता",
          "बहुव्रीहि: तीसरा पद प्रधान — नीलकंठ (नीला कंठ = शिव)",
          "कर्मधारय: विशेषण-विशेष्य — महात्मा",
        ],
      },
      {
        title: "व्याकरण — अलंकार",
        items: [
          "उपमा: जैसे/समान/सा आए (मुकुट मनि-सम दीपता)",
          "रूपक: उपमेय पर उपमान का आरोप (धीरज धरु मन धीरज)",
          "अनुप्रास: वर्ण की आवृत्ति (चारु चंद्र की चंचल किरणें)",
        ],
      },
      {
        title: "पाठ्यपुस्तक — एक पंक्ति में",
        items: [
          "नेताजी का चश्मा — स्वयंसेवक की निष्काम सेवा",
          "बालगोबिन भगत — संगीत में समर्पण",
          "माता का अँचल — मातृ-ममता और सीधा-सादा बेटा",
          "सूरदास — वात्सल्य रस के सम्राट",
        ],
      },
    ],
  },
];

export function sheetFor(subjectId: string): FormulaSheet | undefined {
  return FORMULA_SHEETS.find((s) => s.subjectId === subjectId);
}
