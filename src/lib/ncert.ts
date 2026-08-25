/**
 * NCERT Solutions — chapter-wise textbook questions with board-style answers.
 * Kept as static data so solutions work fully offline.
 */

export type NcertSolution = {
  id: string;
  subjectId: string;
  chapterId: string;
  question: string;
  answer: string[];
};

const S = (
  id: string,
  subjectId: string,
  chapterId: string,
  question: string,
  answer: string[],
): NcertSolution => ({ id, subjectId, chapterId, question, answer });

export const NCERT_SOLUTIONS: NcertSolution[] = [
  // ---------------- SCIENCE ----------------
  S("nc-sc-cr-1", "science", "chemical-reactions", "Why should a magnesium ribbon be cleaned before burning in air?", [
    "Magnesium reacts with oxygen in air and gets coated with a layer of magnesium oxide (MgO).",
    "This layer is unreactive and stops the ribbon from burning easily.",
    "Cleaning with sandpaper removes the MgO layer so the ribbon burns with a dazzling white flame.",
  ]),
  S("nc-sc-cr-2", "science", "chemical-reactions", "Write a balanced equation for the reaction of hydrogen with chlorine and name the type of reaction.", [
    "H₂(g) + Cl₂(g) → 2HCl(g)",
    "Two elements combine to form a single compound, so it is a combination reaction.",
  ]),
  S("nc-sc-cr-3", "science", "chemical-reactions", "What is a displacement reaction? Give one example.", [
    "A reaction in which a more reactive element displaces a less reactive element from its compound.",
    "Fe(s) + CuSO₄(aq) → FeSO₄(aq) + Cu(s)",
    "The blue colour of copper sulphate fades and a reddish-brown deposit of copper forms on the iron.",
  ]),
  S("nc-sc-abs-1", "science", "acids-bases-salts", "Why does an aqueous solution of an acid conduct electricity?", [
    "Acids ionise in water and release H⁺ (H₃O⁺) ions.",
    "These free ions carry charge through the solution, so it conducts electricity.",
  ]),
  S("nc-sc-abs-2", "science", "acids-bases-salts", "What happens when a base reacts with a metal? Write one equation.", [
    "Some metals react with strong bases to release hydrogen gas and form a salt.",
    "2NaOH + Zn → Na₂ZnO₂ + H₂↑ (sodium zincate is formed).",
  ]),
  S("nc-sc-mn-1", "science", "metals-nonmetals", "Why are ionic compounds solids with high melting points?", [
    "Ionic compounds have strong electrostatic forces between oppositely charged ions.",
    "A large amount of heat energy is needed to break this rigid lattice, so melting and boiling points are high.",
  ]),
  S("nc-sc-mn-2", "science", "metals-nonmetals", "What is an alloy? Why is it useful?", [
    "An alloy is a homogeneous mixture of a metal with one or more metals or non-metals.",
    "Alloys are harder, more resistant to corrosion and often have lower conductivity than pure metals.",
    "Example: brass (Cu + Zn), steel (Fe + C), bronze (Cu + Sn).",
  ]),
  S("nc-sc-cc-1", "science", "carbon-compounds", "Why does carbon form covalent bonds?", [
    "Carbon has 4 valence electrons; losing or gaining 4 electrons needs very high energy.",
    "So it shares electrons with other atoms and forms four strong covalent bonds.",
  ]),
  S("nc-sc-cc-2", "science", "carbon-compounds", "What is a homologous series? Give one example.", [
    "A series of organic compounds with the same functional group in which successive members differ by −CH₂−.",
    "Example: CH₄, C₂H₆, C₃H₈, C₄H₁₀ (alkanes).",
    "Members show a gradual change in physical properties but similar chemical properties.",
  ]),
  S("nc-sc-lp-1", "science", "life-processes", "Differentiate between autotrophic and heterotrophic nutrition.", [
    "Autotrophic: organism makes its own food from CO₂ and water using sunlight and chlorophyll (green plants).",
    "Heterotrophic: organism depends on other organisms for food (animals, fungi).",
  ]),
  S("nc-sc-lp-2", "science", "life-processes", "What are the components of transport system in human beings?", [
    "Heart — pumps blood; blood vessels (arteries, veins, capillaries) — carry blood; blood — carries O₂, CO₂, food and wastes.",
    "The lymphatic system carries lymph, which drains extra fluid and absorbed fats back to blood.",
  ]),
  S("nc-sc-cco-1", "science", "control-coordination", "What is a reflex action? Draw the path of a reflex arc in words.", [
    "A rapid, automatic response to a stimulus without conscious thinking.",
    "Receptor → sensory neuron → spinal cord (relay neuron) → motor neuron → effector (muscle).",
    "The spinal cord handles it so the response is fast.",
  ]),
  S("nc-sc-li-1", "science", "light", "State the laws of reflection of light.", [
    "The angle of incidence is equal to the angle of reflection (∠i = ∠r).",
    "The incident ray, the reflected ray and the normal at the point of incidence all lie in the same plane.",
  ]),
  S("nc-sc-li-2", "science", "light", "An object is placed 20 cm from a concave mirror of focal length 15 cm. Find the image distance.", [
    "Mirror formula: 1/v + 1/u = 1/f, with u = −20 cm, f = −15 cm.",
    "1/v = 1/f − 1/u = (−1/15) + (1/20) = −1/60",
    "v = −60 cm — a real, inverted image 60 cm in front of the mirror.",
  ]),
  S("nc-sc-el-1", "science", "electricity", "State Ohm's law and write its mathematical form.", [
    "At constant temperature, the current through a conductor is directly proportional to the potential difference across it.",
    "V = IR, where R is the resistance in ohms (Ω).",
  ]),
  S("nc-sc-el-2", "science", "electricity", "Why is tungsten used for filaments of electric lamps?", [
    "Tungsten has a very high melting point (~3380 °C) and high resistivity.",
    "It glows white hot without melting, so it gives light efficiently and lasts long.",
  ]),
  S("nc-sc-mg-1", "science", "magnetic-effects", "State Fleming's left-hand rule.", [
    "Stretch the thumb, forefinger and middle finger of the left hand mutually perpendicular.",
    "Forefinger → magnetic field, middle finger → current, thumb → direction of force (motion) on the conductor.",
  ]),

  // ---------------- MATHS ----------------
  S("nc-mt-rn-1", "maths", "real-numbers", "Find the HCF and LCM of 96 and 404 and verify HCF × LCM = product.", [
    "96 = 2⁵ × 3, 404 = 2² × 101",
    "HCF = 2² = 4; LCM = (96 × 404)/4 = 9696",
    "Check: 4 × 9696 = 38784 = 96 × 404 ✓",
  ]),
  S("nc-mt-rn-2", "maths", "real-numbers", "Prove that √5 is irrational.", [
    "Assume √5 = p/q, where p and q are co-prime integers, q ≠ 0.",
    "Then p² = 5q², so 5 divides p², hence 5 divides p. Let p = 5m.",
    "Then 25m² = 5q² ⇒ q² = 5m², so 5 also divides q — contradicting co-primeness.",
    "Hence √5 is irrational.",
  ]),
  S("nc-mt-po-1", "maths", "polynomials", "Find the zeroes of x² − 2x − 8 and verify the relation with coefficients.", [
    "x² − 2x − 8 = (x − 4)(x + 2) ⇒ zeroes are 4 and −2.",
    "Sum = 4 + (−2) = 2 = −b/a ✓; Product = 4 × (−2) = −8 = c/a ✓",
  ]),
  S("nc-mt-le-1", "maths", "linear-equations", "Solve: 2x + 3y = 11 and 2x − 4y = −24.", [
    "Subtracting: 7y = 35 ⇒ y = 5.",
    "Substituting: 2x + 15 = 11 ⇒ x = −2.",
    "Solution: x = −2, y = 5.",
  ]),
  S("nc-mt-qe-1", "maths", "quadratic-equations", "Find the roots of 2x² − 7x + 3 = 0 by the quadratic formula.", [
    "a = 2, b = −7, c = 3 ⇒ D = 49 − 24 = 25.",
    "x = (7 ± 5)/4 ⇒ x = 3 or x = ½.",
  ]),
  S("nc-mt-ap-1", "maths", "ap", "Which term of the AP 3, 8, 13, 18, … is 78?", [
    "a = 3, d = 5, aₙ = 78.",
    "78 = 3 + (n − 1)5 ⇒ 75 = 5(n − 1) ⇒ n = 16.",
    "So 78 is the 16th term.",
  ]),
  S("nc-mt-ap-2", "maths", "ap", "Find the sum of the first 22 terms of the AP 8, 3, −2, …", [
    "a = 8, d = −5, n = 22.",
    "S₂₂ = 22/2 [2(8) + 21(−5)] = 11 (16 − 105) = 11 × (−89) = −979.",
  ]),
  S("nc-mt-tr-1", "maths", "triangles", "State and use the Basic Proportionality Theorem (Thales theorem).", [
    "If a line is drawn parallel to one side of a triangle intersecting the other two sides, it divides them in the same ratio.",
    "In ΔABC with DE ∥ BC: AD/DB = AE/EC.",
  ]),
  S("nc-mt-tg-1", "maths", "trigonometry", "Evaluate: sin 60° cos 30° + cos 60° sin 30°.", [
    "= (√3/2)(√3/2) + (½)(½) = 3/4 + 1/4 = 1.",
    "This is also sin(60° + 30°) = sin 90° = 1.",
  ]),

  // ---------------- SOCIAL SCIENCE ----------------
  S("nc-ss-na-1", "sst", "nationalism-india", "Why did Gandhiji start the Non-Cooperation Movement?", [
    "To protest against the Rowlatt Act, the Jallianwala Bagh massacre and the injustice done to the Khilafat cause.",
    "Gandhiji believed British rule survived because of Indian cooperation, so withdrawing it would bring Swaraj within a year.",
    "Programme: surrender of titles, boycott of schools, courts, councils and foreign goods.",
  ]),
  S("nc-ss-na-2", "sst", "nationalism-india", "Explain the significance of the Salt March.", [
    "Salt was consumed by rich and poor alike, so the salt tax touched every Indian household.",
    "Gandhiji marched 240 km to Dandi and broke the salt law on 6 April 1930.",
    "It launched the Civil Disobedience Movement and drew worldwide attention to Indian demands.",
  ]),
  S("nc-ss-res-1", "sst", "resources-development", "What is sustainable development?", [
    "Development that meets the needs of the present without compromising the ability of future generations to meet their needs.",
    "It requires careful use of resources, reduced pollution and ecological balance.",
  ]),
  S("nc-ss-pow-1", "sst", "power-sharing", "Why is power sharing desirable?", [
    "Prudential reason: it reduces conflict between social groups and ensures political stability.",
    "Moral reason: people affected by a decision have a right to be consulted — it is the spirit of democracy.",
  ]),
  S("nc-ss-dev-1", "sst", "development", "Why is average income used to compare countries? What is its limitation?", [
    "Average (per capita) income allows comparison of countries with different populations.",
    "Limitation: it hides inequality — a country can have a high average income with most people poor.",
  ]),

  // ---------------- ENGLISH ----------------
  S("nc-en-let-1", "english", "writing-skills", "What is the correct format of a formal letter?", [
    "Sender's address → Date → Receiver's designation and address → Subject → Salutation (Sir/Madam).",
    "Body in three short paragraphs: purpose, details, expected action.",
    "Complimentary close (Yours faithfully) → Signature and name.",
  ]),
  S("nc-en-gr-1", "english", "grammar", "Change into reported speech: He said, \"I am going to the market.\"", [
    "He said that he was going to the market.",
    "Rule: present continuous → past continuous; first-person pronoun changes with the subject of the reporting verb.",
  ]),

  // ---------------- HINDI ----------------
  S("nc-hi-vy-1", "hindi", "vyakaran", "समास किसे कहते हैं? इसके भेद लिखिए।", [
    "दो या दो से अधिक पदों के मेल से बने नए सार्थक शब्द को समास कहते हैं।",
    "मुख्य भेद: अव्ययीभाव, तत्पुरुष, कर्मधारय, द्विगु, द्वंद्व और बहुव्रीहि।",
  ]),
  S("nc-hi-le-1", "hindi", "lekhan", "औपचारिक पत्र का प्रारूप लिखिए।", [
    "प्रेषक का पता → दिनांक → सेवा में (पद व पता) → विषय → सम्बोधन (महोदय)।",
    "विषय-वस्तु तीन छोटे अनुच्छेदों में, फिर धन्यवाद सहित समाप्ति।",
    "भवदीय / भवदीया → नाम और हस्ताक्षर।",
  ]),
];

export function ncertFor(subjectId: string, chapterId?: string): NcertSolution[] {
  return NCERT_SOLUTIONS.filter(
    (s) => s.subjectId === subjectId && (!chapterId || chapterId === "all" || s.chapterId === chapterId),
  );
}

export function ncertCountByChapter(subjectId: string): Map<string, number> {
  const map = new Map<string, number>();
  for (const s of NCERT_SOLUTIONS) {
    if (s.subjectId !== subjectId) continue;
    map.set(s.chapterId, (map.get(s.chapterId) ?? 0) + 1);
  }
  return map;
}

export function ncertSubjectCounts(): Map<string, number> {
  const map = new Map<string, number>();
  for (const s of NCERT_SOLUTIONS) map.set(s.subjectId, (map.get(s.subjectId) ?? 0) + 1);
  return map;
}
