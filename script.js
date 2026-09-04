const CREATION_POINTS = 5;
const BASE_COMBAT_STAT = 40;
const CAREER_BALANCE = window.BoxeurBalance;
if (!CAREER_BALANCE) throw new Error("Boxeur Deux requiert son moteur d’équilibrage (BoxeurBalance).");
const GYM_PRICE = CAREER_BALANCE.ECONOMY.memberships.boxing.monthly.price;
const GYM_THREE_MONTH_PRICE = CAREER_BALANCE.ECONOMY.memberships.boxing.threeMonths.price;
const GYM_MONTH_WEEKS = CAREER_BALANCE.ECONOMY.memberships.boxing.monthly.weeks;
const GYM_THREE_MONTH_WEEKS = CAREER_BALANCE.ECONOMY.memberships.boxing.threeMonths.weeks;
const STRENGTH_GYM_PRICE = CAREER_BALANCE.ECONOMY.memberships.strength.monthly.price;
const STRENGTH_GYM_THREE_MONTH_PRICE = CAREER_BALANCE.ECONOMY.memberships.strength.threeMonths.price;
const STRENGTH_GYM_MONTH_WEEKS = CAREER_BALANCE.ECONOMY.memberships.strength.monthly.weeks;
const STRENGTH_GYM_THREE_MONTH_WEEKS = CAREER_BALANCE.ECONOMY.memberships.strength.threeMonths.weeks;
const TOURNAMENT_PREP_WEEKS = 4;
const RECREATIONAL_START_DATE = "2026-09-07";
const RECREATIONAL_SPARRING_WEEK = 6;
const SAVE_KEY = "boxeur-deux-career";
const LEGACY_SAVE_KEYS = Object.freeze(["boxeur-deux-career-v2"]);
const DEV_RETURN_SAVE_KEY = `${SAVE_KEY}-dev-return`;
const DEV_TEST_ACTIVE_KEY = `${SAVE_KEY}-dev-active`;
const LEGACY_DEV_RETURN_SAVE_KEYS = Object.freeze(LEGACY_SAVE_KEYS.map(key => `${key}-dev-return`));
const LEGACY_DEV_TEST_ACTIVE_KEYS = Object.freeze(LEGACY_SAVE_KEYS.map(key => `${key}-dev-active`));
const DEV_UNLOCK_CODE = "128";
const SAVE_VERSION = 6;
const CAREER_RUNTIME_SAVE_KEY = `${SAVE_KEY}-runtime`;
const LEGACY_CAREER_RUNTIME_SAVE_KEYS = Object.freeze(["boxeur-deux-career-v2-v2-preview"]);
const JSON_EXPORT_KIND = "boxeur-deux-complete-career";
const JSON_EXPORT_VERSION = 2;
const MAX_SUPPLEMENTS_PER_WEEK = 2;
const MAX_LEGACY_PLAN_ITEMS = 32;
const FIRST_PAID_VACATION_WEEKS = 8;
const PAID_VACATION_INTERVAL_WEEKS = 12;
const MAX_PAID_VACATION_WEEKS = 3;

const cornerThemes = Object.freeze([
  { id: "red", label: "Rouge", detail: "Couleur classique du coin rouge." },
  { id: "blue", label: "Bleu", detail: "Couleur classique du coin bleu." },
  { id: "green", label: "Vert", detail: "Aperçu d’une couleur de coin professionnelle." },
  { id: "purple", label: "Violet", detail: "Aperçu d’une couleur de coin professionnelle." },
  { id: "gold", label: "Doré", detail: "Aperçu d’une couleur de coin professionnelle." },
  { id: "pink", label: "Rose", detail: "Aperçu d’une couleur de coin professionnelle." },
]);

function isCornerTheme(value) {
  return cornerThemes.some(theme => theme.id === value);
}

function cornerLabel(corner) {
  return cornerThemes.find(theme => theme.id === corner)?.label.toLowerCase() || "rouge";
}

function opposingCorner(corner) {
  return corner === "blue" ? "red" : "blue";
}

const weightClassDefs = Object.freeze({
  male: Object.freeze([
    { id: "M50", label: "M50 · 47 à 50 kg", minKg: 47, maxKg: 50 },
    { id: "M55", label: "M55 · 50 à 55 kg", minKg: 50, maxKg: 55 },
    { id: "M60", label: "M60 · 55 à 60 kg", minKg: 55, maxKg: 60 },
    { id: "M65", label: "M65 · 60 à 65 kg", minKg: 60, maxKg: 65 },
    { id: "M70", label: "M70 · 65 à 70 kg", minKg: 65, maxKg: 70 },
    { id: "M75", label: "M75 · 70 à 75 kg", minKg: 70, maxKg: 75 },
    { id: "M80", label: "M80 · 75 à 80 kg", minKg: 75, maxKg: 80 },
    { id: "M85", label: "M85 · 80 à 85 kg", minKg: 80, maxKg: 85 },
    { id: "M90", label: "M90 · 85 à 90 kg", minKg: 85, maxKg: 90 },
    { id: "M90+", label: "M90+ · plus de 90 kg", minKg: 90, maxKg: 130 },
  ]),
  female: Object.freeze([
    { id: "W48", label: "W48 · 45 à 48 kg", minKg: 45, maxKg: 48 },
    { id: "W51", label: "W51 · 48 à 51 kg", minKg: 48, maxKg: 51 },
    { id: "W54", label: "W54 · 51 à 54 kg", minKg: 51, maxKg: 54 },
    { id: "W57", label: "W57 · 54 à 57 kg", minKg: 54, maxKg: 57 },
    { id: "W60", label: "W60 · 57 à 60 kg", minKg: 57, maxKg: 60 },
    { id: "W65", label: "W65 · 60 à 65 kg", minKg: 60, maxKg: 65 },
    { id: "W70", label: "W70 · 65 à 70 kg", minKg: 65, maxKg: 70 },
    { id: "W75", label: "W75 · 70 à 75 kg", minKg: 70, maxKg: 75 },
    { id: "W80", label: "W80 · 75 à 80 kg", minKg: 75, maxKg: 80 },
    { id: "W80+", label: "W80+ · plus de 80 kg", minKg: 80, maxKg: 120 },
  ]),
});
const weightClasses = [...weightClassDefs.male, ...weightClassDefs.female].map(item => item.id);

function weightClassesForSex(sex = "male") {
  return weightClassDefs[sex === "female" ? "female" : "male"];
}

function weightClassDefinition(id, sex = "male") {
  return weightClassesForSex(sex).find(item => item.id === id) || weightClassesForSex(sex)[3];
}

function weightClassLabel(id, sex = "male") {
  return weightClassDefinition(id, sex).label;
}

function defaultCompetitionWeight(category) {
  const span = category.maxKg - category.minKg;
  const value = span > 10 ? category.minKg + 3 : category.minKg + span * .65;
  return Math.round(value * 10) / 10;
}

const combatLabels = {
  technique: "Technique",
  power: "Puissance",
  cardio: "Cardio",
  defense: "Défense",
};

const styles = {
  technician: { label: "Technicien", bonuses: { technique: 3, power: 0, cardio: 0, defense: 2 } },
  puncher: { label: "Puncheur", bonuses: { technique: 0, power: 4, cardio: 1, defense: 0 } },
  counter: { label: "Contre-attaquant", bonuses: { technique: 2, power: 0, cardio: 0, defense: 3 } },
  balanced: { label: "Équilibré", bonuses: { technique: 2, power: 1, cardio: 1, defense: 1 } },
};

const opponents = [
  { id: "leclerc", name: "Thomas Leclerc", nickname: "BETON", style: "Technicien", record: "1 V · 1 D", difficulty: 36, risk: "Accessible", dateLead: 3 },
  { id: "kramer", name: "Maxime Kramer", nickname: "THE QUITTER", style: "Défensif", record: "0 V · 2 D", difficulty: 34, risk: "Accessible", dateLead: 4 },
  { id: "okafor", name: "Darnell Okafor", nickname: "Brick", style: "Puncheur", record: "2 V · 1 D", difficulty: 40, risk: "Modéré", dateLead: 4 },
  { id: "martel", name: "Émile Martel", nickname: "Le Serein", style: "Contre-attaquant", record: "2 V · 2 D", difficulty: 43, risk: "Relevé", dateLead: 5 },
  { id: "gagnon", name: "Olivier Gagnon", nickname: "Le Bûcheron", style: "Bagarreur", record: "3 V · 2 D", difficulty: 44, risk: "Relevé", dateLead: 4 },
  { id: "nguyen", name: "Minh Nguyen", nickname: "Vif-Argent", style: "Boxeur mobile", record: "3 V · 0 D", difficulty: 42, risk: "Modéré", dateLead: 5 },
  { id: "bouchard", name: "Samuel Bouchard", nickname: "Le Mur", style: "Défensif", record: "4 V · 3 D", difficulty: 46, risk: "Relevé", dateLead: 5 },
  { id: "haddad", name: "Yanis Haddad", nickname: "Le Cobra", style: "Contre-attaquant", record: "4 V · 1 D", difficulty: 45, risk: "Relevé", dateLead: 5 },
  { id: "wilson", name: "Jayden Wilson", nickname: "Quickstep", style: "Technicien", record: "2 V · 2 D", difficulty: 41, risk: "Modéré", dateLead: 3 },
  { id: "caron", name: "Alexis Caron", nickname: "La Masse", style: "Puncheur", record: "5 V · 3 D", difficulty: 48, risk: "Difficile", dateLead: 4 },
];

const femaleOpponents = [
  { id: "f-beaulieu", name: "Camille Beaulieu", nickname: "La Boussole", style: "Technicien", record: "1 V · 1 D", difficulty: 36, risk: "Accessible", dateLead: 3 },
  { id: "f-kim", name: "Naomi Kim", nickname: "L’Insaisissable", style: "Défensif", record: "0 V · 2 D", difficulty: 34, risk: "Accessible", dateLead: 4 },
  { id: "f-okafor", name: "Amara Okafor", nickname: "La Brique", style: "Puncheur", record: "2 V · 1 D", difficulty: 40, risk: "Modéré", dateLead: 4 },
  { id: "f-martel", name: "Élodie Martel", nickname: "La Sereine", style: "Contre-attaquant", record: "2 V · 2 D", difficulty: 43, risk: "Relevé", dateLead: 5 },
  { id: "f-gagnon", name: "Marianne Gagnon", nickname: "La Forge", style: "Bagarreur", record: "3 V · 2 D", difficulty: 44, risk: "Relevé", dateLead: 4 },
  { id: "f-nguyen", name: "Linh Nguyen", nickname: "Vif-Argent", style: "Boxeur mobile", record: "3 V · 1 D", difficulty: 42, risk: "Modéré", dateLead: 5 },
  { id: "f-bouchard", name: "Sophie Bouchard", nickname: "La Garde", style: "Défensif", record: "4 V · 3 D", difficulty: 46, risk: "Relevé", dateLead: 5 },
  { id: "f-haddad", name: "Maya Haddad", nickname: "La Vipère", style: "Contre-attaquant", record: "3 V · 1 D", difficulty: 45, risk: "Relevé", dateLead: 5 },
  { id: "f-wilson", name: "Avery Wilson", nickname: "North Star", style: "Technicien", record: "2 V · 2 D", difficulty: 41, risk: "Modéré", dateLead: 3 },
  { id: "f-caron", name: "Maude Caron", nickname: "La Masse", style: "Puncheur", record: "5 V · 3 D", difficulty: 48, risk: "Difficile", dateLead: 4 },
];

function opponentPool() {
  return state?.profile?.sex === "female" ? femaleOpponents : opponents;
}

const tournamentDefs = [
  { id: "bronze", medal: "III", name: "Gants de bronze", description: "8 participants · 3 combats · inscription de 0 à 5 combats amateurs.", participants: 8, rounds: 3, baseDifficulty: 45 },
  { id: "silver", medal: "II", name: "Gants d’argent", description: "8 participants · 3 combats · inscription de 0 à 10 combats amateurs.", participants: 8, rounds: 3, baseDifficulty: 52 },
  { id: "golden", medal: "I", name: "Gants dorés", description: "8 participants · 3 combats · accessibles dès 10 combats.", participants: 8, rounds: 3, baseDifficulty: 64 },
  { id: "canadian", medal: "CA", name: "Championnat canadien", description: "32 participants · 5 combats · exige l’or aux Gants dorés.", participants: 32, rounds: 5, baseDifficulty: 70 },
  { id: "olympic", medal: "OLY", name: "Parcours olympique", description: "32 participants · 5 combats · exige l’or au championnat canadien.", participants: 32, rounds: 5, baseDifficulty: 77 },
  { id: "regional-cup", medal: "RC", name: "Coupe régionale des clubs", description: "Tournoi extérieur indépendant · divisions Relève (0–10) et Ouverte (10+).", participants: 8, rounds: 3, baseDifficulty: 50, independent: true },
];

const TOURNAMENT_MEDAL_PRESENTATION = Object.freeze({
  gold: Object.freeze({ label: "Médaille d’or", noun: "la médaille d’or", asset: "assets/tournament-medal-gold-v1.png" }),
  silver: Object.freeze({ label: "Médaille d’argent", noun: "la médaille d’argent", asset: "assets/tournament-medal-silver-v1.png" }),
  bronze: Object.freeze({ label: "Médaille de bronze", noun: "la médaille de bronze", asset: "assets/tournament-medal-bronze-v1.png" }),
});

const tournamentNames = [
  ["Nicolas", "Roy", "Le Marteau"], ["Isaac", "Tremblay", "L’Éclair"], ["Marcus", "Diallo", "L’Architecte"],
  ["Ryan", "McKenna", "North Star"], ["Aleksandar", "Petrov", "Le Métronome"], ["Diego", "Vargas", "El Fuego"],
  ["Noah", "Kim", "Le Fantôme"], ["Lucas", "Moreau", "La Flèche"], ["Amir", "Benali", "Le Roc"],
  ["Mateo", "Silva", "Tempête"], ["Ethan", "Clarke", "Ice"], ["Hugo", "Laroche", "Le Faucon"]
];
const tournamentNamesFemale = [
  ["Jade", "Roy", "L’Ancre"], ["Sarah", "Tremblay", "L’Éclair"], ["Amina", "Diallo", "L’Architecte"],
  ["Olivia", "McKenna", "North Star"], ["Irina", "Petrova", "La Métronome"], ["Lucía", "Vargas", "Fuego"],
  ["Hana", "Kim", "L’Ombre"], ["Léa", "Moreau", "La Flèche"], ["Noura", "Benali", "La Roche"],
  ["Valentina", "Silva", "Tempête"], ["Emma", "Clarke", "Ice"], ["Chloé", "Laroche", "L’Altitude"]
];
const tournamentStyles = ["Pression", "Boxeur mobile", "Contre-attaquant", "Puncheur", "Défensif", "Complet"];

// Catalogue minimal utilisé uniquement pour convertir les anciens programmes
// privés vers le système d'entraîneur actuel.
const LEGACY_PRIVATE_COACHES = Object.freeze([
  { id: "renard", name: "Luc Renard", targets: ["technique", "defense"], price: 100, sessions: 4, reward: 1 },
  { id: "morin", name: "Étienne Morin", targets: ["technique"], price: 125, sessions: 4, reward: 1 },
  { id: "clarke", name: "Malik Clarke", targets: ["defense"], price: 130, sessions: 4, reward: 1 },
  { id: "diaz", name: "Sofia Diaz", targets: ["technique", "defense"], price: 175, sessions: 5, reward: 2 },
  { id: "petrov", name: "Aleksandar Petrov", targets: ["technique", "defense"], price: 310, sessions: 6, reward: 3 },
  { id: "okoro", name: "Emmanuel Okoro", targets: ["power", "cardio"], price: 110, sessions: 4, reward: 1 },
  { id: "silva", name: "Mateo Silva", targets: ["power"], price: 135, sessions: 4, reward: 1 },
  { id: "kim", name: "Noah Kim", targets: ["cardio"], price: 135, sessions: 4, reward: 1 },
  { id: "tremblay", name: "Mélanie Tremblay", targets: ["power", "cardio"], price: 185, sessions: 5, reward: 2 },
  { id: "dubois", name: "Victor Dubois", targets: ["power", "cardio"], price: 325, sessions: 6, reward: 3 },
]);

const jobs = CAREER_BALANCE.JOBS;

const REMY_TANK = Object.freeze({
  id: "remy-le-tank",
  name: "Rémy Gagnon",
  nickname: "Le Tank",
  style: "Pression contrôlée",
  record: "Sparring d’évaluation",
  difficulty: 45,
  rating: 45,
  stats: Object.freeze({ technique: 45, power: 50, cardio: 46, defense: 43 }),
});

const NADIA_WALL = Object.freeze({
  id: "nadia-la-muraille",
  name: "Nadia Bouchard",
  nickname: "La Muraille",
  style: "Pression contrôlée",
  record: "Sparring d’évaluation",
  difficulty: 45,
  rating: 45,
  // Nadia reprend exactement le rôle mécanique de Rémy : seule l’identité
  // change pour conserver un laboratoire de combat identique entre divisions.
  stats: Object.freeze({ technique: 45, power: 50, cardio: 46, defense: 43 }),
});

function recreationalSparringPartner(profile = state?.profile) {
  return profile?.sex === "female" ? NADIA_WALL : REMY_TANK;
}

function sparringPartnerView(profile = state?.profile) {
  const partner = recreationalSparringPartner(profile);
  const firstName = partner.name.split(" ")[0];
  return {
    id: partner.id,
    firstName,
    name: partner.name,
    nickname: partner.nickname,
    displayName: partner === REMY_TANK
      ? `${firstName} « ${partner.nickname} »`
      : `${partner.name} « ${partner.nickname} »`,
  };
}

const INITIAL_STATE = {
  profile: null,
  combatStats: { technique: BASE_COMBAT_STAT, power: BASE_COMBAT_STAT, cardio: BASE_COMBAT_STAT, defense: BASE_COMBAT_STAT },
  week: 1,
  money: CAREER_BALANCE.ECONOMY.startingMoney,
  careerStartDate: RECREATIONAL_START_DATE,
  energy: 72,
  fitness: 25,
  morale: 68,
  reputation: 5,
  injury: 8,
  fatigue: 0,
  injuryWeeks: 0,
  injuryStartedWeek: 0,
  privateProgram: null,
  experience: 0,
  level: 1,
  levelPoints: 0,
  privateLessonCredits: 0,
  levelRewardsPending: [],
  gymWeeks: 0,
  strengthGymWeeks: 0,
  trainingProgress: { technique: 0, power: 0, cardio: 0, defense: 0 },
  boxingNeglectWeeks: 0,
  boxingInactivityWeeks: 0,
  boxingTrainingWeek: 0,
  trainingRhythmPenalty: 0,
  recoveryConsequence: null,
  amateurRecord: { wins: 0, losses: 0, draws: 0 },
  professionalRecord: { wins: 0, losses: 0, draws: 0 },
  careerStatus: "recreational",
  introJobRequired: true,
  initialJobLockedUntilWeek: 0,
  initialGymRequired: true,
  recreationalTrainingWeeks: 0,
  recreationalSparringStatus: "training",
  amateurPromotionPending: false,
  remyLesson: "",
  scheduledFight: null,
  calendar: null,
  bookings: [],
  currentWeightKg: null,
  migrationPending: false,
  tournaments: { bronze: "pending", silver: "pending", golden: "pending", canadian: "locked", olympic: "locked" },
  activeTournament: null,
  medals: {
    bronze: { bronze: 0, silver: 0, gold: 0 }, silver: { bronze: 0, silver: 0, gold: 0 },
    golden: { bronze: 0, silver: 0, gold: 0 }, canadian: { bronze: 0, silver: 0, gold: 0 },
    olympic: { bronze: 0, silver: 0, gold: 0 }, "regional-cup": { bronze: 0, silver: 0, gold: 0 },
  },
  goldenPlacement: null,
  olympicCompleted: false,
  pendingWeekEvent: null,
  jobId: null,
  jobsHeldCount: 0,
  jobApplication: null,
  jobReferenceBonus: false,
  missedWorkWeeks: 0,
  jobAttendanceWeek: 0,
  jobTenureWeeks: 0,
  jobVacationEarnedAtTenure: 0,
  vacationBankWeeks: 0,
  jobWagesEarned: 0,
  workStreak: 0,
  sponsorAvailableWeek: 1,
  supplementWeek: 1,
  supplementsUsed: [],
  supplementState: null,
  trainerState: null,
  weekPlannerState: null,
  progressionState: null,
  levelNotice: null,
  levelAnnouncementPending: false,
  jobLossNotice: null,
  avoidanceWeeks: 0,
  lastFightWeek: 0,
  journal: [],
};

// Anciens champs conservés tels quels dans les sauvegardes pour garantir leur
// compatibilité. Le jeu actuel ne les utilise plus dans ses règles persistantes.
const CAREER_LEGACY_CONDITION_KEYS = new Set(["fitness", "morale", "injury", "injuryWeeks", "injuryStartedWeek"]);
const CAREER_NEUTRAL_COMBAT_CONDITION = Object.freeze({ fitness: 50, morale: 50, injury: 0 });

const strengthGymProducts = [
  { id: "protein-bar", label: "Barre protéinée", price: 10, effect: "+3 E · −1 Fa · +1 M", changes: { energy: 3, fatigue: -1, morale: 1 } },
  { id: "sports-drink", label: "Boisson sportive", price: 14, effect: "+6 E · −2 Fa", changes: { energy: 6, fatigue: -2 } },
  { id: "energy-drink", label: "Boisson énergisante", price: 16, effect: "+10 E · +5 Fa · +2 risque", changes: { energy: 10, fatigue: 5, injury: 2 } },
  { id: "protein-shake", label: "Shake protéiné", price: 20, effect: "+2 Fo · −3 Fa · +2 E", changes: { fitness: 2, fatigue: -3, energy: 2 } },
  { id: "preworkout", label: "Pré-workout", price: 28, effect: "+16 E · +9 Fa · +5 risque", changes: { energy: 16, fatigue: 9, injury: 5, morale: 2 } },
  { id: "protein-tub", label: "Protéines premium", price: 70, effect: "+8 Fo · −9 Fa · +4 E", changes: { fitness: 8, fatigue: -9, energy: 4 } },
];

// Copie profonde compatible avec les navigateurs mobiles plus anciens.
// Les sauvegardes restent au même format et aucune donnée locale n'est supprimée.
const cloneData = value => typeof structuredClone === "function" ? structuredClone(value) : JSON.parse(JSON.stringify(value));

function readStoredValue(primaryKey, legacyKeys = []) {
  const primary = localStorage.getItem(primaryKey);
  if (primary != null) return { key: primaryKey, raw: primary, legacy: false };
  for (const key of legacyKeys) {
    const raw = localStorage.getItem(key);
    if (raw != null) return { key, raw, legacy: true };
  }
  return null;
}

function readStoredJson(primaryKey, legacyKeys = []) {
  for (const key of [primaryKey, ...legacyKeys]) {
    const raw = localStorage.getItem(key);
    if (raw == null) continue;
    try {
      return { key, raw, value: JSON.parse(raw), legacy: key !== primaryKey };
    } catch (error) {
      console.warn(`[Boxeur Deux] Données locales illisibles pour ${key} :`, error);
    }
  }
  return null;
}

function removeStoredValues(keys) {
  keys.forEach(key => localStorage.removeItem(key));
}

// Diagnostic temporaire : ne change ni l'interface ni les sauvegardes.
window.addEventListener("error", event => {
  console.error("[Boxeur Deux] Erreur JavaScript :", event.error || event.message, event.filename ? `${event.filename}:${event.lineno}` : "");
});
window.addEventListener("unhandledrejection", event => {
  console.error("[Boxeur Deux] Promesse rejetée :", event.reason);
});

let state = cloneData(INITIAL_STATE);
let draftStats = { technique: 0, power: 0, cardio: 0, defense: 0 };
let legacyPendingPlanForMigration = [];
let toastTimer;
let fightState = null;
let sparringRingState = null;
let sparringAutoResolveTimer = null;
let sparringAutoResolving = false;
let sparringPendingActionId = null;
let draftPortraitId = 0;
let drugSalesTapCount = 0;
let resumeCareerAlertsAfterLevelDialog = false;
let careerCapsule = null;
let careerComposerSelection = [];
let careerStrengthSelection = [];
let careerHomeSelection = [];
let careerTrainerTarget = "technique";
let developerBoutScheduledBackup = null;

const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value));
const escapeHTML = value => String(value).replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
const safeText = (value, fallback = "", maxLength = 80) => String(value ?? fallback).trim().slice(0, maxLength) || fallback;
const safeNumber = (value, fallback = 0, min = 0, max = 100, integer = true) => {
  const parsed = Number(value);
  const normalized = Number.isFinite(parsed) ? parsed : fallback;
  const bounded = clamp(normalized, min, max);
  return integer ? Math.round(bounded) : bounded;
};
const safeIdentifier = (value, fallback = "") => safeText(value, fallback, 180).replace(/[^a-zA-Z0-9._:-]/g, "-");

function normalizeRecoveryConsequence(source) {
  if (!source || typeof source !== "object" || !["forced-rest", "hospital"].includes(source.kind)) return null;
  const hospital = source.kind === "hospital";
  return {
    kind: hospital ? "hospital" : "forced-rest",
    week: safeNumber(source.week, 1, 1, 99999),
    capacityCost: hospital ? 15 : 10,
    medicalCost: hospital ? safeNumber(source.medicalCost, 75, 0, 9999) : 0,
  };
}

function normalizeStoredBooking(booking, index) {
  if (!booking || typeof booking !== "object") return null;
  const eventId = safeIdentifier(booking.eventId || booking.event?.id, `legacy-event-${index}`);
  const status = ["registered", "active", "completed", "cancelled", "withdrawn"].includes(booking.status) ? booking.status : "registered";
  return {
    id: safeIdentifier(booking.id, `booking-${eventId}`),
    eventId,
    divisionId: safeIdentifier(booking.divisionId || booking.event?.divisionId, "") || null,
    event: null,
    status,
    registeredOn: /^\d{4}-\d{2}-\d{2}$/.test(booking.registeredOn || "") ? booking.registeredOn : null,
    travelOptionId: safeIdentifier(booking.travelOptionId, "none"),
    interval: null,
    payment: {
      total: safeNumber(booking.payment?.total, 0, 0, 100000),
      status: ["paid", "grandfathered"].includes(booking.payment?.status) ? booking.payment.status : "paid",
      transactionId: safeIdentifier(booking.payment?.transactionId, "") || null,
    },
    travelEffects: {
      energy: safeNumber(booking.travelEffects?.energy, 0, -100, 100),
      fatigue: safeNumber(booking.travelEffects?.fatigue, 0, -100, 100),
    },
    eligibilityAtRegistration: booking.eligibilityAtRegistration && typeof booking.eligibilityAtRegistration === "object" ? cloneData(booking.eligibilityAtRegistration) : null,
    eligibilitySnapshot: booking.eligibilitySnapshot && typeof booking.eligibilitySnapshot === "object" ? cloneData(booking.eligibilitySnapshot) : null,
    weighInStatus: safeText(booking.weighInStatus, "pending", 40),
    expectedBouts: safeNumber(booking.expectedBouts, 1, 1, 5),
    grandfathered: Boolean(booking.grandfathered),
    travelApplied: Boolean(booking.travelApplied),
  };
}

function normalizeRecord(record, fallback) {
  const source = record && typeof record === "object" ? record : {};
  return {
    wins: safeNumber(source.wins, fallback.wins, 0, 9999),
    losses: safeNumber(source.losses, fallback.losses, 0, 9999),
    draws: safeNumber(source.draws, fallback.draws, 0, 9999),
  };
}

function normalizeOpponentData(opponent, fallbackWeightClass) {
  if (!opponent || typeof opponent !== "object") return null;
  const normalized = {
    id: safeText(opponent.id, `opponent-${Date.now()}`, 100),
    name: safeText(opponent.name, "Adversaire amateur", 70),
    nickname: safeText(opponent.nickname, "Sans surnom", 50),
    weightClass: weightClasses.includes(opponent.weightClass) ? opponent.weightClass : fallbackWeightClass,
    style: safeText(opponent.style, "Équilibré", 40),
    record: safeText(opponent.record, "0 V · 0 D", 40),
    difficulty: safeNumber(opponent.difficulty, 40, 20, 99),
    rating: safeNumber(opponent.rating ?? opponent.difficulty, 40, 20, 99),
    risk: safeText(opponent.risk, "Modéré", 30),
    dateLead: safeNumber(opponent.dateLead, 4, 1, 12),
    experience: safeNumber(opponent.experience, 0, 0, 100000),
  };
  if (opponent.stats && typeof opponent.stats === "object") {
    normalized.stats = Object.fromEntries(Object.keys(combatLabels).map(key => [key, safeNumber(opponent.stats[key], normalized.rating, 20, 99)]));
  }
  return normalized;
}

function normalizeCareerState(source) {
  if (!source?.profile || typeof source.profile !== "object") throw new Error("Profil manquant");
  const base = cloneData(INITIAL_STATE);
  const legacyAutomaticAmateurPromotion = source.careerStatus === "amateur_pending"
    || (source.careerStatus === "recreational" && source.recreationalSparringStatus === "completed");
  const hasCompetitionSex = ["male", "female"].includes(source.profile.sex);
  const profileSex = hasCompetitionSex ? source.profile.sex : "male";
  const allowedWeights = weightClassesForSex(profileSex).map(item => item.id);
  const profile = {
    firstName: safeText(source.profile.firstName, "Boxeur", 30),
    lastName: safeText(source.profile.lastName, "Deux", 30),
    nickname: safeText(source.profile.nickname, "", 30),
    sex: profileSex,
    weightClass: allowedWeights.includes(source.profile.weightClass) ? source.profile.weightClass : weightClassesForSex(profileSex)[3].id,
    portraitId: safeNumber(source.profile.portraitId, 0, 0, 2),
    style: styles[source.profile.style] ? source.profile.style : "balanced",
    corner: isCornerTheme(source.profile.corner) ? source.profile.corner : "red",
  };
  const normalized = {
    ...base,
    ...source,
    profile,
    migrationPending: Boolean(source.migrationPending) || !hasCompetitionSex || !allowedWeights.includes(source.profile.weightClass),
    bookings: Array.isArray(source.bookings) ? source.bookings.slice(0, 30).map(normalizeStoredBooking).filter(Boolean) : [],
    calendar: source.calendar && typeof source.calendar === "object" ? {
      version: safeNumber(source.calendar.version, 0, 0, 20),
      epoch: /^\d{4}-\d{2}-\d{2}$/.test(source.calendar.epoch || "") ? source.calendar.epoch : null,
      seed: safeText(source.calendar.seed, `${profile.firstName}-${profile.lastName}-${profile.sex}`, 120),
    } : null,
    careerStatus: legacyAutomaticAmateurPromotion
      ? "amateur"
      : ["professional", "amateur", "recreational"].includes(source.careerStatus)
        ? source.careerStatus
      : "amateur",
    // La partie entière reste la statistique affichée. La fraction représente
    // la jauge de progression déjà assimilée et doit survivre aux sauvegardes/imports.
    combatStats: Object.fromEntries(Object.keys(combatLabels).map(key => [key, safeNumber(source.combatStats?.[key], base.combatStats[key], 0, 99, false)])),
    amateurRecord: normalizeRecord(source.amateurRecord, base.amateurRecord),
    professionalRecord: normalizeRecord(source.professionalRecord, base.professionalRecord),
    trainingProgress: Object.fromEntries(Object.keys(combatLabels).map(key => [key, safeNumber(source.trainingProgress?.[key], 0, 0, 9)])),
    medals: Object.fromEntries(Object.keys(base.medals).map(id => [id, {
      bronze: safeNumber(source.medals?.[id]?.bronze, 0, 0, 999),
      silver: safeNumber(source.medals?.[id]?.silver, 0, 0, 999),
      gold: safeNumber(source.medals?.[id]?.gold, 0, 0, 999),
    }])),
    tournaments: Object.fromEntries(Object.keys(base.tournaments).map(id => {
      const allowed = ["pending", "won", "lost", "missed", "entered", "locked"];
      return [id, allowed.includes(source.tournaments?.[id]) ? source.tournaments[id] : base.tournaments[id]];
    })),
    journal: Array.isArray(source.journal) ? source.journal.slice(0, 250).map(entry => ({
      week: safeNumber(entry?.week, 1, 1, 99999),
      text: safeText(entry?.text, "Événement de carrière", 500),
    })) : [],
  };
  const boundedStats = {
    week: [1, 99999], money: [0, 9999999], energy: [0, 100], fitness: [0, 100], morale: [0, 100], reputation: [0, 100],
    injury: [0, 100], fatigue: [0, 100], injuryWeeks: [0, 52], experience: [0, 10000000], level: [1, 999], levelPoints: [0, 9999], privateLessonCredits: [0, 99],
    gymWeeks: [0, 52], strengthGymWeeks: [0, 52], boxingNeglectWeeks: [0, 3], boxingInactivityWeeks: [0, 999], boxingTrainingWeek: [0, 99999], trainingRhythmPenalty: [0, 4], workStreak: [0, 999], sponsorAvailableWeek: [1, 99999],
    missedWorkWeeks: [0, 3], jobAttendanceWeek: [0, 99999], initialJobLockedUntilWeek: [0, 99999], jobTenureWeeks: [0, 99999], jobsHeldCount: [0, 999], jobVacationEarnedAtTenure: [0, 99999], vacationBankWeeks: [0, MAX_PAID_VACATION_WEEKS], jobWagesEarned: [0, 9999999], recreationalTrainingWeeks: [0, 10],
    supplementWeek: [1, 99999], avoidanceWeeks: [0, 999], lastFightWeek: [0, 99999], injuryStartedWeek: [0, 99999],
  };
  Object.entries(boundedStats).forEach(([key, [min, max]]) => { normalized[key] = safeNumber(source[key], base[key] ?? min, min, max); });
  const category = weightClassDefinition(profile.weightClass, profile.sex);
  const defaultWeight = defaultCompetitionWeight(category);
  normalized.currentWeightKg = safeNumber(source.currentWeightKg, defaultWeight, 35, 140, false);
  normalized.experience = Math.max(normalized.experience, xpForLevel(normalized.level));
  normalized.levelPoints = safeNumber(source.levelPoints, base.levelPoints, 0, 9999);
  normalized.goldenPlacement = [1, 2, 3].includes(Number(source.goldenPlacement)) ? Number(source.goldenPlacement) : null;
  normalized.olympicCompleted = Boolean(source.olympicCompleted);
  // L'ancien champ reste accepté dans les sauvegardes, mais aucune décision
  // intersemaine n'est restaurée dans le parcours actuel.
  normalized.pendingWeekEvent = null;
  normalized.levelNotice = source.levelNotice ? safeText(source.levelNotice, "", 500) : null;
  normalized.levelAnnouncementPending = Boolean(source.levelAnnouncementPending);
  normalized.levelRewardsPending = Array.isArray(source.levelRewardsPending)
    ? source.levelRewardsPending.slice(-12).map(reward => ({
        level: safeNumber(reward?.level, normalized.level, 2, 999),
        type: ["money", "supplement", "private-lesson", "capacity"].includes(reward?.type) ? reward.type : "money",
        title: safeText(reward?.title, "Cadeau du coach", 80),
        detail: safeText(reward?.detail, "Récompense ajoutée à ta carrière.", 180),
    }))
    : [];
  normalized.recoveryConsequence = normalizeRecoveryConsequence(source.recoveryConsequence);
  normalized.jobLossNotice = source.jobLossNotice ? safeText(source.jobLossNotice, "", 180) : null;
  normalized.jobId = jobs.some(job => job.id === source.jobId) ? source.jobId : null;
  const inferredJobsHeld = source.jobsHeldCount ?? (normalized.jobId || (!source.introJobRequired && source.careerStatus !== "recreational") ? 1 : 0);
  normalized.jobsHeldCount = safeNumber(inferredJobsHeld, 0, 0, 999);
  normalized.jobReferenceBonus = Boolean(source.jobReferenceBonus);
  const applicationJob = jobs.find(job => job.id === source.jobApplication?.jobId);
  if (applicationJob) {
    const requiredWeeks = safeNumber(source.jobApplication.requiredWeeks, applicationJob.interviewWeeks, 1, applicationJob.interviewWeeks);
    normalized.jobApplication = {
      jobId: applicationJob.id,
      progress: safeNumber(source.jobApplication.progress, 0, 0, requiredWeeks),
      requiredWeeks,
      offerReady: Boolean(source.jobApplication.offerReady),
      referenceBonusApplied: Boolean(source.jobApplication.referenceBonusApplied),
    };
  } else normalized.jobApplication = null;
  normalized.jobVacationEarnedAtTenure = safeNumber(source.jobVacationEarnedAtTenure ?? source.jobVacationClaimedAtTenure, 0, 0, 99999);
  if (!normalized.jobId) {
    normalized.missedWorkWeeks = 0;
    normalized.jobTenureWeeks = 0;
    normalized.jobVacationEarnedAtTenure = 0;
    normalized.vacationBankWeeks = 0;
    normalized.jobWagesEarned = 0;
  }
  normalized.introJobRequired = normalized.careerStatus === "recreational" && Boolean(source.introJobRequired ?? !normalized.jobId);
  normalized.initialGymRequired = normalized.careerStatus === "recreational" && Boolean(source.initialGymRequired ?? true);
  const sparringStates = ["training", "ready", "completed"];
  normalized.recreationalSparringStatus = sparringStates.includes(source.recreationalSparringStatus)
    ? source.recreationalSparringStatus
    : legacyAutomaticAmateurPromotion ? "completed" : "training";
  normalized.amateurPromotionPending = Boolean(source.amateurPromotionPending) || legacyAutomaticAmateurPromotion;
  normalized.remyLesson = safeText(source.remyLesson, "", 240);
  const inferredStartDate = /^\d{4}-\d{2}-\d{2}$/.test(source.careerStartDate || "")
    ? source.careerStartDate
    : normalized.calendar?.epoch || (normalized.careerStatus === "recreational" ? RECREATIONAL_START_DATE : "2026-01-05");
  normalized.careerStartDate = inferredStartDate;
  normalized.supplementsUsed = Array.isArray(source.supplementsUsed) ? [...new Set(source.supplementsUsed.filter(id => strengthGymProducts.some(product => product.id === id)))].slice(0, MAX_SUPPLEMENTS_PER_WEEK) : [];
  if (normalized.supplementWeek !== normalized.week) {
    normalized.supplementWeek = normalized.week;
    normalized.supplementsUsed = [];
  }
  const coach = LEGACY_PRIVATE_COACHES.find(item => item.id === source.privateProgram?.coachId);
  const target = source.privateProgram?.target;
  const legacyPrivateProgram = coach && coach.targets.includes(target) ? {
    coachId: coach.id,
    target,
    sessionsCompleted: safeNumber(source.privateProgram.sessionsCompleted, 0, 0, Math.max(0, coach.sessions - 1)),
    firstSessionPaid: Boolean(source.privateProgram.firstSessionPaid),
  } : null;
  normalized.privateProgram = null;
  normalized.supplementState = window.BoxeurSupplements
    ? window.BoxeurSupplements.createState(source.supplementState || source, { weekKey: normalized.week })
    : source.supplementState && typeof source.supplementState === "object" ? cloneData(source.supplementState) : null;
  normalized.trainerState = window.BoxeurTrainer
    ? window.BoxeurTrainer.createState(source.trainerState || {})
    : source.trainerState && typeof source.trainerState === "object" ? cloneData(source.trainerState) : null;
  if (window.BoxeurTrainer && legacyPrivateProgram && !normalized.trainerState.activeProgram) {
    const trainerId = coach.reward >= 3 ? "elite" : coach.reward >= 2 ? "specialist" : "club";
    normalized.trainerState = window.BoxeurTrainer.createState({
      ...normalized.trainerState,
      activeProgram: {
        id: `legacy:${coach.id}:${target}`,
        trainerId,
        target,
        sessionsTotal: coach.sessions,
        sessionsCompleted: legacyPrivateProgram.sessionsCompleted,
        startedWeek: normalized.week,
        costPaid: legacyPrivateProgram.firstSessionPaid ? coach.price : 0,
      },
    });
    normalized.journal.unshift({
      week: normalized.week,
      text: `Programme privé de ${coach.name} transféré vers le système d’entraîneur actuel sans frais supplémentaires.`,
    });
  }
  try {
    normalized.weekPlannerState = window.BoxeurWeekPlanner && source.weekPlannerState?.kind === window.BoxeurWeekPlanner.STATE_KIND
      ? window.BoxeurWeekPlanner.restorePlanner(source.weekPlannerState)
      : null;
  } catch (error) {
    normalized.weekPlannerState = null;
  }
  normalized.progressionState = window.BoxeurProgression && source.progressionState?.kind === window.BoxeurProgression.STATE_KIND
    ? window.BoxeurProgression.createState(source.progressionState)
    : null;
  normalized.activeTournament = source.activeTournament && typeof source.activeTournament === "object" ? cloneData(source.activeTournament) : null;
  normalized.scheduledFight = source.scheduledFight && typeof source.scheduledFight === "object" ? cloneData(source.scheduledFight) : null;
  return normalized;
}

function xpForLevel(level) {
  if (level <= 1) return 0;
  const steps = level - 1;
  return steps * 40 + ((steps * (steps - 1)) / 2) * 10;
}

const LEVEL_GIFT_ROTATION = Object.freeze(["money", "supplement", "private-lesson"]);
const LEVEL_GIFT_SUPPLEMENTS = Object.freeze(["protein-bar", "sports-drink", "protein-shake", "preworkout"]);

function addLevelGiftSupplement(level) {
  if (!window.BoxeurSupplements) return null;
  const supplementState = window.BoxeurSupplements.createState(state.supplementState || state, { weekKey: state.week });
  const preferredIndex = Math.max(0, level - 2) % LEVEL_GIFT_SUPPLEMENTS.length;
  const productId = LEVEL_GIFT_SUPPLEMENTS
    .map((_, offset) => LEVEL_GIFT_SUPPLEMENTS[(preferredIndex + offset) % LEVEL_GIFT_SUPPLEMENTS.length])
    .find(id => Number(supplementState.inventory[id] || 0) < 9);
  if (!productId) return null;
  supplementState.inventory[productId] += 1;
  state.supplementState = window.BoxeurSupplements.createState(supplementState, { weekKey: state.week });
  return window.BoxeurSupplements.CATALOG[productId];
}

function grantLevelReward(level) {
  if (level % 5 === 0 && level <= 15) {
    const capacity = Math.min(65, 50 + Math.floor(level / 5) * 5);
    return {
      level,
      type: "capacity",
      title: "+5 capacité hebdomadaire",
      detail: `Ton maximum permanent passe à ${capacity} points par semaine.`,
    };
  }
  const giftType = LEVEL_GIFT_ROTATION[Math.max(0, level - 2) % LEVEL_GIFT_ROTATION.length];
  if (giftType === "supplement") {
    const product = addLevelGiftSupplement(level);
    if (product) {
      return {
        level,
        type: "supplement",
        title: `${product.label} en cadeau`,
        detail: "Le supplément a été placé directement dans ton inventaire.",
      };
    }
  }
  if (giftType === "private-lesson") {
    state.privateLessonCredits = Math.min(99, safeNumber(state.privateLessonCredits, 0, 0, 99) + 1);
    return {
      level,
      type: "private-lesson",
      title: "Un cours privé offert",
      detail: "Le bon réduira automatiquement le prix de ton prochain programme privé d’une séance.",
    };
  }
  state.money = Math.max(0, safeNumber(state.money, 0, 0, 9999999) + 50);
  return {
    level,
    type: "money",
    title: "+50 $",
    detail: "La prime du coach a été ajoutée à ton solde.",
  };
}

function syncLevelProgress() {
  state.level = Math.max(1, Number(state.level) || 1);
  state.levelPoints = Math.max(0, Number(state.levelPoints) || 0);
  state.experience = Math.max(0, Number(state.experience) || 0);
  let levelsGained = 0;
  while (state.experience >= xpForLevel(state.level + 1)) {
    state.level += 1;
    state.levelPoints += 3;
    levelsGained += 1;
    const reward = grantLevelReward(state.level);
    state.levelRewardsPending = [...(Array.isArray(state.levelRewardsPending) ? state.levelRewardsPending : []), reward].slice(-12);
    if (state.journal) state.journal.unshift({ week: state.week, text: `Niveau ${state.level} atteint : trois points de combat et ${reward.title.toLocaleLowerCase("fr-CA")} obtenus.` });
  }
  if (levelsGained && state.profile) {
    const rewards = state.levelRewardsPending.slice(-levelsGained).map(reward => reward.title).join(" · ");
    const message = levelsGained === 1
      ? `Niveau ${state.level} atteint · 3 points à répartir · ${rewards}`
      : `Niveau ${state.level} atteint · ${levelsGained * 3} points à répartir · ${rewards}`;
    state.levelNotice = message;
    state.levelAnnouncementPending = true;
  }
}

function applyCareerTheme() {
  document.body.classList.remove(...cornerThemes.filter(theme => theme.id !== "red").map(theme => `theme-${theme.id}`));
  if (state.profile?.corner && state.profile.corner !== "red") document.body.classList.add(`theme-${state.profile.corner}`);
}

function careerSnapshot() {
  return { version: SAVE_VERSION, savedAt: new Date().toISOString(), state: cloneData(state), weeklyPlan: [] };
}

function completeCareerExportSnapshot() {
  const capsule = ensureCareerPreviewCapsule();
  if (capsule) persistCareerPreviewCapsule();
  return {
    ...careerSnapshot(),
    export: {
      kind: JSON_EXPORT_KIND,
      version: JSON_EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
    },
    careerCapsule: capsule ? cloneData(capsule) : null,
  };
}

function exportCareerJson() {
  if (!state.profile) return;
  try {
    const snapshot = completeCareerExportSnapshot();
    const json = JSON.stringify(snapshot, null, 2);
    const blob = new Blob([json], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const slug = [state.profile.firstName, state.profile.lastName]
      .filter(Boolean)
      .join("-")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "carriere";
    const link = document.createElement("a");
    link.href = url;
    link.download = `boxeur-deux-${slug}-semaine-${state.week}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    showToast("Sauvegarde JSON téléchargée");
  } catch (error) {
    console.error("[Boxeur Deux] Export JSON impossible :", error);
    showToast("Impossible de télécharger la sauvegarde JSON.");
  }
}

function persistCareer() {
  if (!state.profile) return;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(careerSnapshot()));
  } catch (error) {
    console.warn("[Boxeur Deux] Sauvegarde locale indisponible :", error);
  }
}

function calendarSeedForCareer() {
  return `${state.profile?.firstName || "boxeur"}-${state.profile?.lastName || "deux"}-${state.profile?.sex || "male"}`;
}

function ensureCareerCalendar() {
  if (!globalThis.BoxeurCalendar || !state.profile) return;
  const throughWeek = Math.max(10, state.week + 8);
  const config = {
    seed: state.calendar?.seed || calendarSeedForCareer(),
    epoch: state.calendar?.epoch || state.careerStartDate || RECREATIONAL_START_DATE,
    startWeek: 1,
    weeks: throughWeek,
  };
  if (state.calendar?.version === BoxeurCalendar.CALENDAR_VERSION && Array.isArray(state.calendar.events)) {
    state.calendar = BoxeurCalendar.extendCalendar(state.calendar, { throughWeek });
    rehydrateCalendarBookings();
    linkLegacyCompetitionBookings();
    return;
  }
  const migrated = BoxeurCalendar.migrateLegacyState({ ...state, calendar: null }, { legacySaveVersion: SAVE_VERSION - 1, seed: config.seed, epoch: config.epoch, currentWeek: state.week });
  const generated = BoxeurCalendar.generateCalendar(config);
  const events = new Map(generated.events.map(event => [event.id, event]));
  (migrated.events || []).forEach(event => events.set(event.id, event));
  state.calendar = { ...generated, events: [...events.values()].sort((left, right) => left.startDate.localeCompare(right.startDate) || left.id.localeCompare(right.id)) };
  if (!state.bookings.length && migrated.bookings?.length) state.bookings = migrated.bookings;
  rehydrateCalendarBookings();
  linkLegacyCompetitionBookings();
}

function rehydrateCalendarBookings() {
  if (!state.calendar?.events || !Array.isArray(state.bookings)) return;
  const events = new Map(state.calendar.events.map(event => [event.id, event]));
  state.bookings = state.bookings.map(booking => {
    const event = events.get(booking.eventId);
    if (!event) return null;
    const selectedEvent = booking.divisionId
      ? (BoxeurCalendar.eventForDivision(event, booking.divisionId) || event)
      : event;
    let interval;
    try {
      interval = booking.grandfathered
        ? { startDate: selectedEvent.startDate, endDate: selectedEvent.endDate, travelOptionId: booking.travelOptionId }
        : BoxeurCalendar.bookingInterval(selectedEvent, booking.travelOptionId);
    } catch {
      interval = { startDate: selectedEvent.startDate, endDate: selectedEvent.endDate, travelOptionId: booking.travelOptionId };
    }
    return { ...booking, divisionId: selectedEvent.divisionId || null, event: cloneData(selectedEvent), interval };
  }).filter(Boolean);
}

function linkLegacyCompetitionBookings() {
  if (!Array.isArray(state.bookings)) return;
  const usable = state.bookings.filter(booking => !["cancelled", "withdrawn", "completed"].includes(booking.status));
  if (state.activeTournament && !state.activeTournament.bookingId) {
    const booking = usable.find(item => item.event?.kind === "tournament" && item.event?.tournamentId === state.activeTournament.id && item.event?.careerWeek === state.activeTournament.startWeek)
      || usable.find(item => item.event?.kind === "tournament" && item.event?.tournamentId === state.activeTournament.id);
    if (booking) {
      state.activeTournament.bookingId = booking.id;
      state.activeTournament.eventId = booking.eventId;
    }
  }
  if (!state.scheduledFight || state.scheduledFight.bookingId) return;
  const booking = state.scheduledFight.tournamentId
    ? usable.find(item => item.id === state.activeTournament?.bookingId || (item.event?.kind === "tournament" && item.event?.tournamentId === state.scheduledFight.tournamentId))
    : usable.find(item => item.event?.kind === "gala" && item.event?.careerWeek === state.scheduledFight.week && item.grandfathered);
  if (!booking) return;
  state.scheduledFight.bookingId = booking.id;
  state.scheduledFight.eventId = booking.eventId;
  state.scheduledFight.event = cloneData(booking.event);
  state.scheduledFight.travelEffects ||= cloneData(booking.travelEffects || { energy: 0, fatigue: 0 });
  state.scheduledFight.travelApplied = Boolean(booking.travelApplied || booking.grandfathered);
}

function careerWeekDate(weekday = 0) {
  if (!globalThis.BoxeurCalendar) return null;
  ensureCareerCalendar();
  return BoxeurCalendar.dateForCareerWeek(state.calendar.epoch, state.week, weekday);
}

function formatCareerDate(value, options = {}) {
  if (!value) return "Date inconnue";
  return new Intl.DateTimeFormat("fr-CA", {
    day: "numeric",
    month: options.long ? "long" : "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00Z`));
}

function activeBookings() {
  return (state.bookings || []).filter(booking => !["cancelled", "withdrawn", "completed"].includes(booking.status));
}

function bookingForEvent(eventId) {
  return (state.bookings || []).find(booking => booking.eventId === eventId && !["cancelled", "withdrawn"].includes(booking.status)) || null;
}

function dueTournamentBooking() {
  const weekStart = careerWeekDate(0);
  const weekEnd = careerWeekDate(6);
  return activeBookings().find(booking => booking.event?.kind === "tournament" && booking.event.startDate <= weekEnd && booking.event.endDate >= weekStart) || null;
}

function normalizeCompetitionState() {
  if (state.activeTournament) {
    const tournament = tournamentDefs.find(item => item.id === state.activeTournament.id);
    if (!tournament) {
      state.activeTournament = null;
    } else {
      const raw = state.activeTournament;
      const effectiveTournament = { ...tournament, baseDifficulty: safeNumber(raw.baseDifficulty, tournament.baseDifficulty, 20, 99) };
      const generated = generateTournamentOpponents(effectiveTournament);
      const storedOpponents = Array.isArray(raw.opponents) ? raw.opponents : [];
      raw.startWeek = safeNumber(raw.startWeek, state.week + TOURNAMENT_PREP_WEEKS, 1, 99999);
      raw.name = safeText(raw.name, tournament.name, 140);
      raw.baseDifficulty = effectiveTournament.baseDifficulty;
      raw.status = ["preparing", "active", "completed"].includes(raw.status) ? raw.status : (state.week < raw.startWeek ? "preparing" : "active");
      raw.currentRound = safeNumber(raw.currentRound, 0, 0, raw.status === "completed" ? tournament.rounds : tournament.rounds - 1);
      raw.opponents = generated.map((fallback, index) => normalizeOpponentData(storedOpponents[index], state.profile.weightClass) || fallback);
      raw.results = Array.isArray(raw.results) ? raw.results.slice(0, tournament.rounds).map((result, index) => ({
        round: safeNumber(result?.round, index, 0, tournament.rounds - 1),
        opponent: safeText(result?.opponent, raw.opponents[index]?.name || "Adversaire", 70),
        result: ["Victoire", "Défaite", "Match nul"].includes(result?.result) ? result.result : "Défaite",
        score: safeText(result?.score, "—", 60),
      })) : [];
      raw.medal = ["bronze", "silver", "gold"].includes(raw.medal) ? raw.medal : null;
      raw.medalCelebrated = Boolean(raw.medalCelebrated);
      raw.summary = safeText(raw.summary, "", 300);
      raw.eventId = safeText(raw.eventId, "", 140) || null;
      raw.bookingId = safeText(raw.bookingId, "", 180) || null;
      const deferred = raw.deferredScheduledFight;
      const deferredOpponent = normalizeOpponentData(deferred?.opponent, state.profile.weightClass);
      if (deferred && !deferred.tournamentId && deferredOpponent) {
        raw.deferredScheduledFight = {
          id: deferredOpponent.id,
          opponent: deferredOpponent,
          tournamentId: null,
          tournamentRound: null,
          week: safeNumber(deferred.week, state.week + 1, state.week + 1, 99999),
          bookingId: safeText(deferred.bookingId, "", 180) || null,
          eventId: safeText(deferred.eventId, "", 140) || null,
          event: deferred.event && typeof deferred.event === "object" ? cloneData(deferred.event) : null,
          homeAdvantage: deferred.homeAdvantage && typeof deferred.homeAdvantage === "object" ? cloneData(deferred.homeAdvantage) : null,
          travelEffects: deferred.travelEffects && typeof deferred.travelEffects === "object" ? {
            energy: safeNumber(deferred.travelEffects.energy, 0, -100, 100),
            fatigue: safeNumber(deferred.travelEffects.fatigue, 0, -100, 100),
          } : { energy: 0, fatigue: 0 },
          travelApplied: Boolean(deferred.travelApplied),
          fightSeed: safeText(deferred.fightSeed, "", 220) || freshFightSeed("gala-restaure"),
        };
      } else {
        delete raw.deferredScheduledFight;
      }
      if (globalThis.BoxeurTournament && raw.status !== "completed") {
        const category = weightClassDefinition(state.profile.weightClass, state.profile.sex);
        const context = {
          id: raw.eventId || `${raw.id}-legacy-${raw.startWeek}`,
          totalBouts: tournament.rounds,
          started: state.week >= raw.startWeek,
          condition: {
            energy: state.energy,
            fatigue: state.fatigue,
            injury: CAREER_NEUTRAL_COMBAT_CONDITION.injury,
            fitness: CAREER_NEUTRAL_COMBAT_CONDITION.fitness,
            cardio: state.combatStats.cardio,
            headDamage: 0,
            bodyDamage: 0,
            lucidity: 100,
          },
          weight: { className: category.label, minKg: category.minKg, maxKg: category.maxKg },
        };
        try {
          raw.competition = raw.competition
            ? BoxeurTournament.normalizeTournament(raw.competition, context)
            : BoxeurTournament.migrateLegacyTournament(raw, context);
        } catch (error) {
          console.warn("[Boxeur Deux] Migration du tournoi actif impossible; un nouvel état quotidien est créé.", error);
          raw.competition = BoxeurTournament.createTournament({ ...context, started: context.started });
        }
      }
      state.tournaments[tournament.id] = raw.status === "completed" ? state.tournaments[tournament.id] : "entered";
    }
  }

  if (!state.scheduledFight) return;
  const raw = state.scheduledFight;
  const tournament = raw.tournamentId ? tournamentDefs.find(item => item.id === raw.tournamentId) : null;
  if (raw.tournamentId && (!tournament || state.activeTournament?.id !== raw.tournamentId || state.activeTournament.status === "completed")) {
    state.scheduledFight = null;
    return;
  }
  const tournamentRound = tournament ? safeNumber(raw.tournamentRound, state.activeTournament.currentRound, 0, tournament.rounds - 1) : null;
  const recreationalTemplate = raw.isRecreationalSparring
    ? recreationalSparringPartner(state.profile)
    : null;
  const embedded = recreationalTemplate
    ? normalizeOpponentData({ ...recreationalTemplate, stats: recreationalTemplate.stats }, state.profile.weightClass)
    : normalizeOpponentData(raw.opponent, state.profile.weightClass);
  const localTemplate = [...opponents, ...femaleOpponents].find(item => item.id === raw.id);
  const tournamentOpponent = tournament ? state.activeTournament.opponents[tournamentRound] : null;
  const opponent = embedded || tournamentOpponent || (localTemplate ? normalizeOpponentData(localTemplate, state.profile.weightClass) : null);
  if (!opponent) {
    state.scheduledFight = null;
    return;
  }
  state.scheduledFight = {
    ...raw,
    id: opponent.id,
    opponent,
    tournamentId: tournament?.id || null,
    tournamentRound,
    week: safeNumber(raw.week, state.week, 1, 99999),
    bookingId: safeText(raw.bookingId, "", 180) || null,
    eventId: safeText(raw.eventId, "", 140) || null,
    event: raw.event && typeof raw.event === "object" ? cloneData(raw.event) : null,
    homeAdvantage: raw.homeAdvantage && typeof raw.homeAdvantage === "object" ? cloneData(raw.homeAdvantage) : null,
    travelEffects: raw.travelEffects && typeof raw.travelEffects === "object" ? {
      energy: safeNumber(raw.travelEffects.energy, 0, -100, 100),
      fatigue: safeNumber(raw.travelEffects.fatigue, 0, -100, 100),
    } : { energy: 0, fatigue: 0 },
    travelApplied: Boolean(raw.travelApplied),
  };
}

function hydrateCareer(snapshot) {
  const migratedSnapshot = window.BoxeurCareerMigration?.migrateCareerSnapshot(snapshot, { targetVersion: SAVE_VERSION }) || snapshot;
  const source = migratedSnapshot?.state || migratedSnapshot;
  const previousState = state;
  const previousLegacyPlan = legacyPendingPlanForMigration;
  try {
    state = normalizeCareerState(source);
    normalizeCompetitionState();
    ensureCareerCalendar();
    syncLevelProgress();
    legacyPendingPlanForMigration = (Array.isArray(migratedSnapshot?.weeklyPlan) ? migratedSnapshot.weeklyPlan : [])
      .filter(item => typeof item?.actionId === "string")
      .slice(0, MAX_LEGACY_PLAN_ITEMS)
      .map(item => ({ actionId: item.actionId }));
    // Le planificateur actuel est l'unique source d'exécution. L'ancien
    // brouillon est archivé dans la capsule, jamais réactivé.
    fightState = null;
    sparringRingState = null;
    applyCareerTheme();
  } catch (error) {
    state = previousState;
    legacyPendingPlanForMigration = previousLegacyPlan;
    throw error;
  }
}

function maybeShowDivisionMigration() {
  const dialog = document.querySelector("#division-migration-dialog");
  if (!state.profile || !state.migrationPending || state.scheduledFight || state.activeTournament || dialog?.open) return;
  const sexSelect = document.querySelector("#migration-sex");
  sexSelect.value = state.profile.sex || "male";
  renderWeightOptions(document.querySelector("#migration-weight"), sexSelect.value, state.profile.weightClass);
  document.querySelector("#migration-portrait").value = String(state.profile.portraitId || 0);
  dialog.showModal();
}

function loadSavedSnapshot() {
  try {
    const stored = readStoredJson(SAVE_KEY, LEGACY_SAVE_KEYS);
    if (!stored) return null;
    const parsed = stored.value;
    const migrated = window.BoxeurCareerMigration?.migrateCareerSnapshot(parsed, { targetVersion: SAVE_VERSION }) || parsed;
    // Accepte aussi les toutes premières sauvegardes qui stockaient l'état
    // directement à la racine du JSON.
    if (!(migrated?.state?.profile || migrated?.profile)) return null;
    if (stored.legacy || Number(parsed?.version) !== SAVE_VERSION) {
      localStorage.setItem(SAVE_KEY, JSON.stringify(migrated));
    }
    return migrated;
  } catch (error) {
    console.warn("[Boxeur Deux] Sauvegarde locale illisible :", error);
    return null;
  }
}

function restoreCareer(snapshot, options = {}) {
  try {
    const migratedSnapshot = window.BoxeurCareerMigration?.migrateCareerSnapshot(snapshot, { targetVersion: SAVE_VERSION }) || snapshot;
    const suppliedCapsule = migratedSnapshot?.careerCapsule;
    if (suppliedCapsule != null && !window.BoxeurCareerMigration?.isCareerCapsule(suppliedCapsule)) {
      throw new TypeError("La capsule complète de la sauvegarde JSON est invalide.");
    }
    hydrateCareer(migratedSnapshot);
    // Une importation doit reconstruire sa capsule depuis les données qui
    // viennent d'être validées, avant que le premier rendu de carrière puisse la lire.
    if (options.invalidateCareer === true) {
      invalidateCareerPreviewCapsule();
      if (suppliedCapsule) {
        careerCapsule = window.BoxeurCareerMigration.migrateToCareerCapsule(suppliedCapsule);
        normalizeCareerPreviewRuntime(careerCapsule);
        syncCareerCapsuleToCareer(careerCapsule);
        careerCapsule.previewFingerprint = careerPreviewFingerprint(state);
        localStorage.setItem(CAREER_RUNTIME_SAVE_KEY, JSON.stringify(careerCapsule));
      }
    }
    render();
    maybeShowDivisionMigration();
    showToast("Carrière restaurée");
    if (state.jobLossNotice || state.levelAnnouncementPending) setTimeout(showCareerAlertOrContinue, 0);
    return true;
  } catch (error) {
    console.error("[Boxeur Deux] Sauvegarde refusée :", error);
    showToast("Fichier de carrière invalide.");
    return false;
  }
}

const developerPresetDefinitions = Object.freeze([
  { id: "recreational-start", label: "Récréatif · départ", detail: "Semaine 1, emploi et premier abonnement déjà réglés." },
  { id: "remy-ready", label: "Récréatif · sparring prêt", detail: "Semaine 6, cinq entraînements complétés : le sparring est prêt." },
  { id: "amateur-rookie", label: "Amateur · début", detail: "Début de saison, quelques galas et peu de ressources." },
  { id: "bronze-ready", label: "Gants de bronze", detail: "Cinq combats au dossier, semaine précédant les Gants de bronze." },
  { id: "silver-ready", label: "Gants d’argent", detail: "Dix combats au dossier, prêt à vérifier les conditions d’argent." },
  { id: "golden-ready", label: "Gants dorés", detail: "Carrière avancée, budget et statistiques de niveau élevé." },
  { id: "pro-ready", label: "Professionnel · aperçu", detail: "Boxeur déjà passé pro pour tester l’affichage et les couleurs futures." },
  { id: "recovery-case", label: "Test récupération", detail: "Fatigue élevée et banque de vacances active." },
]);

const developerToolDefinitions = Object.freeze([
  { id: "funds", label: "Fonds de test", detail: "Fixe le solde à 9 999 $." },
  { id: "recover", label: "Récupération complète", detail: "Énergie à 100 % et fatigue à 0 %." },
  { id: "test-fight", label: "Combat immédiat", detail: "Lance un combat complet comparable, sans modifier la carrière ni le bilan." },
  { id: "test-sparring", label: "Sparring immédiat", detail: "Lance quatre échanges par round, sans gagnant officiel ni effet sur la carrière." },
  { id: "next-week", label: "Semaine suivante", detail: "Avance sans action ni dépense ; indisponible lorsqu’un combat est dû." },
  { id: "career-reset", label: "Réinitialiser la carte", detail: "Recrée seulement l’état de la carte depuis la carrière actuelle." },
]);

function developerPresetSnapshot(id) {
  const preset = cloneData(INITIAL_STATE);
  const advanced = ["silver-ready", "golden-ready", "pro-ready"].includes(id);
  preset.profile = {
    firstName: id === "recovery-case" ? "Maya" : id === "pro-ready" ? "Jordan" : "Alex",
    lastName: "Test",
    nickname: id === "golden-ready" ? "Le Vétéran" : id === "pro-ready" ? "La Relève" : "Le Banc",
    sex: id === "recovery-case" ? "female" : "male",
    weightClass: id === "recovery-case" ? "W57" : "M65",
    portraitId: id === "recovery-case" ? 2 : 1,
    style: advanced ? "puncher" : "balanced",
    corner: id === "pro-ready" ? "green" : "blue",
  };
  preset.careerStartDate = RECREATIONAL_START_DATE;
  preset.money = advanced ? 1400 : 420;
  preset.energy = advanced ? 86 : 78;
  preset.fitness = advanced ? 70 : 48;
  preset.morale = 72;
  preset.reputation = advanced ? 46 : 14;
  preset.gymWeeks = 8;
  preset.strengthGymWeeks = advanced ? 8 : 0;
  preset.initialGymRequired = false;
  preset.introJobRequired = false;
  preset.jobId = "courier";
  preset.jobTenureWeeks = advanced ? 20 : 4;
  preset.jobWagesEarned = advanced ? 2000 : 400;
  preset.jobVacationEarnedAtTenure = advanced ? 20 : 0;
  preset.combatStats = advanced
    ? { technique: 58, power: 56, cardio: 59, defense: 57 }
    : { technique: 44, power: 43, cardio: 44, defense: 43 };

  if (id === "recreational-start") {
    preset.careerStatus = "recreational";
    preset.week = 1;
    preset.recreationalTrainingWeeks = 0;
    preset.recreationalSparringStatus = "training";
  } else if (id === "remy-ready") {
    preset.careerStatus = "recreational";
    preset.week = RECREATIONAL_SPARRING_WEEK;
    preset.recreationalTrainingWeeks = 5;
    preset.recreationalSparringStatus = "training";
  } else if (id === "pro-ready") {
    preset.careerStatus = "professional";
    preset.week = 52;
    preset.amateurRecord = { wins: 18, losses: 4, draws: 0 };
    preset.professionalRecord = { wins: 6, losses: 1, draws: 0 };
    preset.experience = 1500;
    preset.reputation = 68;
    preset.money = 2600;
    preset.combatStats = { technique: 65, power: 62, cardio: 64, defense: 63 };
  } else {
    preset.careerStatus = "amateur";
    preset.week = id === "bronze-ready" ? 15 : id === "silver-ready" ? 31 : id === "golden-ready" ? 45 : 4;
    const fights = id === "bronze-ready" ? 5 : id === "silver-ready" ? 10 : id === "golden-ready" ? 16 : id === "recovery-case" ? 7 : 1;
    preset.amateurRecord = { wins: Math.max(0, fights - 2), losses: Math.min(2, fights), draws: 0 };
    preset.experience = advanced ? 820 : 120;
  }
  if (id === "recovery-case") {
    preset.fatigue = 58;
    preset.injury = 34;
    preset.injuryWeeks = 1;
    preset.vacationBankWeeks = 2;
    preset.jobTenureWeeks = 20;
    preset.jobVacationEarnedAtTenure = 20;
    preset.jobWagesEarned = 1600;
  }
  return { version: SAVE_VERSION, savedAt: new Date().toISOString(), state: preset, weeklyPlan: [] };
}

function hasDeveloperReturnCareer() {
  try {
    return Boolean(readStoredValue(DEV_RETURN_SAVE_KEY, LEGACY_DEV_RETURN_SAVE_KEYS));
  } catch {
    return false;
  }
}

function isDeveloperTestActive() {
  try {
    return readStoredValue(DEV_TEST_ACTIVE_KEY, LEGACY_DEV_TEST_ACTIVE_KEYS)?.raw === "1";
  } catch {
    return false;
  }
}

function openDeveloperTestMenu() {
  const options = document.querySelector("#developer-test-options");
  const toolOptions = document.querySelector("#developer-tool-options");
  const cornerOptions = document.querySelector("#developer-corner-options");
  const returnButton = document.querySelector("#developer-return-career");
  if (!options || !toolOptions || !cornerOptions || !returnButton) return;
  options.innerHTML = developerPresetDefinitions.map(preset => `<button class="coach-card" type="button" data-developer-preset="${preset.id}"><strong>${preset.label}</strong><small>${preset.detail}</small></button>`).join("");
  toolOptions.innerHTML = developerToolDefinitions.map(tool => `<button class="coach-card developer-tool-card" type="button" data-developer-tool="${tool.id}"><strong>${tool.label}</strong><small>${tool.detail}</small></button>`).join("");
  cornerOptions.innerHTML = cornerThemes.map(theme => `<button class="coach-card developer-corner-card" type="button" data-developer-corner="${theme.id}" aria-pressed="${state.profile?.corner === theme.id}"><strong>Coin ${theme.label}</strong><small>${theme.detail}</small></button>`).join("");
  returnButton.hidden = !hasDeveloperReturnCareer();
  document.querySelector("#developer-test-dialog")?.showModal();
}

function applyDeveloperCorner(corner) {
  if (!state.profile || !isCornerTheme(corner)) return;
  state.profile.corner = corner;
  invalidateCareerPreviewCapsule();
  applyCareerTheme();
  render();
  const options = document.querySelector("#developer-corner-options");
  if (options) {
    options.querySelectorAll("[data-developer-corner]").forEach(button => {
      button.setAttribute("aria-pressed", String(button.dataset.developerCorner === corner));
    });
  }
  showToast(`Coin ${cornerLabel(corner)} appliqué`);
}

function runDeveloperTool(id) {
  if (!state.profile || !developerToolDefinitions.some(tool => tool.id === id)) return;
  if (id === "career-reset") {
    invalidateCareerPreviewCapsule();
    renderCareerWorldPreview(Boolean(state.profile));
    showToast("Données de test réinitialisées · carrière actuelle intacte");
    return;
  }
  if (id === "funds") {
    state.money = 9999;
    invalidateCareerPreviewCapsule();
    render();
    showToast("Fonds de test appliqués · solde : 9 999 $");
    return;
  }
  if (id === "recover") {
    state.energy = 100;
    state.fatigue = 0;
    state.injury = 0;
    state.injuryWeeks = 0;
    state.injuryStartedWeek = 0;
    invalidateCareerPreviewCapsule();
    render();
    showToast("Récupération complète appliquée");
    return;
  }
  if (id === "test-fight" || id === "test-sparring") {
    startDeveloperBout(id === "test-sparring" ? "sparring" : "fight");
    return;
  }
  const fightDue = Boolean(state.scheduledFight && state.week >= state.scheduledFight.week);
  const tournamentDue = Boolean(state.activeTournament && state.activeTournament.status !== "completed" && state.week >= state.activeTournament.startWeek);
  if (fightDue || tournamentDue) {
    showToast("Un combat est dû : utilise l’interface de combat ou du tournoi.");
    return;
  }
  const skippedWeek = state.week;
  const events = [];
  endWeek(events);
  state.pendingWeekEvent = null;
  scheduleRecreationalSparring(events);
  state.journal.unshift({ week: skippedWeek, text: "Outil de test : semaine avancée sans action ni dépense." });
  invalidateCareerPreviewCapsule();
  render();
  showToast(`Semaine ${skippedWeek + 1} · aucune action ni dépense appliquée`);
}

function registerDeveloperSecretTap() {
  drugSalesTapCount += 1;
  if (drugSalesTapCount < 5) return;
  drugSalesTapCount = 0;
  const input = document.querySelector("#developer-code-input");
  const error = document.querySelector("#developer-code-error");
  if (input) input.value = "";
  if (error) error.textContent = "";
  document.querySelector("#developer-code-dialog")?.showModal();
}

function loadDeveloperPreset(id) {
  if (!developerPresetDefinitions.some(preset => preset.id === id)) return;
  try {
    if (!readStoredValue(DEV_TEST_ACTIVE_KEY, LEGACY_DEV_TEST_ACTIVE_KEYS)) localStorage.setItem(DEV_RETURN_SAVE_KEY, JSON.stringify(careerSnapshot()));
    localStorage.setItem(DEV_TEST_ACTIVE_KEY, "1");
    hydrateCareer(developerPresetSnapshot(id));
    invalidateCareerPreviewCapsule();
    render();
    document.querySelector("#developer-test-dialog")?.close();
    showToast("Profil de test chargé · ta carrière est conservée");
  } catch (error) {
    console.error("[Boxeur Deux] Chargement du profil de test impossible :", error);
    showToast("Profil de test impossible à charger.");
  }
}

function restoreDeveloperReturnCareer() {
  try {
    const stored = readStoredJson(DEV_RETURN_SAVE_KEY, LEGACY_DEV_RETURN_SAVE_KEYS);
    if (!stored) return showToast("Aucune carrière de retour n’est disponible.");
    hydrateCareer(stored.value);
    removeStoredValues([DEV_RETURN_SAVE_KEY, DEV_TEST_ACTIVE_KEY, ...LEGACY_DEV_RETURN_SAVE_KEYS, ...LEGACY_DEV_TEST_ACTIVE_KEYS]);
    invalidateCareerPreviewCapsule();
    render();
    document.querySelector("#developer-test-dialog")?.close();
    showToast("Carrière principale restaurée");
  } catch (error) {
    console.error("[Boxeur Deux] Restauration de la carrière principale impossible :", error);
    showToast("Restauration impossible.");
  }
}

function showResumePrompt() {
  const snapshot = loadSavedSnapshot();
  const copy = document.querySelector("#resume-copy");
  const dialog = document.querySelector("#resume-dialog");
  if (!snapshot || !copy || !dialog) return;
  const savedDate = snapshot.savedAt ? new Date(snapshot.savedAt) : null;
  const label = savedDate && !Number.isNaN(savedDate.valueOf()) ? `Dernière sauvegarde : ${savedDate.toLocaleString("fr-CA")}.` : "Une carrière enregistrée a été trouvée sur cet appareil.";
  copy.textContent = label;
  dialog.showModal();
}

function pointsLeft() {
  return CREATION_POINTS - Object.values(draftStats).reduce((sum, value) => sum + value, 0);
}

function portraitAsset(sex = "male") {
  return sex === "female" ? "assets/portraits-femmes.webp" : "assets/portraits-hommes.webp";
}

function renderWeightOptions(select, sex, selected) {
  if (!select) return;
  const options = weightClassesForSex(sex);
  const value = options.some(item => item.id === selected) ? selected : options[3].id;
  select.innerHTML = options.map(item => `<option value="${item.id}">${item.label}</option>`).join("");
  select.value = value;
}

function renderCreationPortraits() {
  const sex = document.querySelector("#fighter-sex")?.value === "female" ? "female" : "male";
  const container = document.querySelector("#creation-portraits");
  if (!container) return;
  container.innerHTML = [0, 1, 2].map(index => `<button class="portrait-option" type="button" data-portrait-id="${index}" aria-pressed="${draftPortraitId === index}"><span class="portrait-option-preview" style="--portrait-index:${index}"><img src="${portraitAsset(sex)}" width="1152" height="768" alt="Portrait ${index + 1}, division ${sex === "female" ? "féminine" : "masculine"}" /></span><span>Portrait ${index + 1}</span></button>`).join("");
}

function renderLevel() {
  syncLevelProgress();
  const level = state.level;
  const currentFloor = xpForLevel(level);
  const nextFloor = xpForLevel(level + 1);
  const needed = nextFloor - currentFloor;
  const levelNode = document.querySelector("#level");
  const xpProgress = document.querySelector("#xp-progress");
  const xpMeter = document.querySelector("#xp-meter-fill");
  const points = document.querySelector("#level-points");
  const buttonLabel = document.querySelector("#level-button-label");
  const openButton = document.querySelector("#open-level-dialog");
  const dialogCopy = document.querySelector("#level-dialog-copy");
  const choices = document.querySelector("#level-choices");
  const notice = document.querySelector("#level-notice");
  if (levelNode) levelNode.textContent = level;
  if (xpProgress) xpProgress.textContent = `XP ${Math.round(state.experience)} / ${nextFloor}`;
  if (xpMeter) xpMeter.style.width = `${clamp(((state.experience - currentFloor) / needed) * 100)}%`;
  if (points) points.textContent = state.levelPoints;
  if (openButton) openButton.disabled = state.levelPoints < 1;
  if (buttonLabel) buttonLabel.textContent = state.levelPoints ? "Répartir ·" : "Points :";
  if (notice) {
    notice.hidden = !state.levelNotice;
    notice.textContent = state.levelNotice || "";
  }
  if (dialogCopy) dialogCopy.textContent = state.levelPoints ? `${state.levelPoints} point${state.levelPoints > 1 ? "s" : ""} disponible${state.levelPoints > 1 ? "s" : ""}. Chaque point ajoute +1 à une statistique.` : "Les entraînements restent ton moyen principal de progresser. Les points de niveau offrent un petit bonus de spécialisation.";
  if (choices) choices.innerHTML = Object.entries(combatLabels).map(([key, label]) => `<button class="level-choice" type="button" data-level-stat="${key}" ${state.levelPoints < 1 || state.combatStats[key] >= 99 ? "disabled" : ""}><span>${label}</span><strong>${Math.floor(state.combatStats[key])}</strong><em>+1</em></button>`).join("");
}

function openLevelDialog(resumeCareerAlerts = false) {
  if (state.levelPoints < 1) return;
  resumeCareerAlertsAfterLevelDialog = resumeCareerAlerts;
  state.levelNotice = null;
  state.levelAnnouncementPending = false;
  renderLevel();
  persistCareer();
  document.querySelector("#level-dialog")?.showModal();
}

function showCareerAlertOrContinue() {
  if (maybeOpenTournamentMedalDialog()) return true;
  if (state.jobLossNotice) {
    document.querySelector("#job-loss-copy").textContent = state.jobLossNotice;
    document.querySelector("#job-loss-dialog")?.showModal();
    return true;
  }
  if (state.levelAnnouncementPending && state.levelNotice && state.levelPoints > 0) {
    document.querySelector("#level-up-title").textContent = `Niveau ${state.level} atteint`;
    document.querySelector("#level-up-copy").textContent = `Tu reçois toujours trois points de caractéristiques par niveau. Tes points restent disponibles tant que tu ne les répartis pas.`;
    const rewards = document.querySelector("#level-up-rewards");
    if (rewards) {
      const icons = { money: "$", supplement: "+", "private-lesson": "★", capacity: "↗" };
      rewards.innerHTML = (state.levelRewardsPending || []).map(reward => `<article class="${escapeHTML(reward.type)}"><span aria-hidden="true">${icons[reward.type] || "+"}</span><div><small>Niveau ${reward.level}</small><strong>${escapeHTML(reward.title)}</strong><p>${escapeHTML(reward.detail)}</p></div></article>`).join("");
    }
    document.querySelector("#level-up-dialog")?.showModal();
    return true;
  }
  state.pendingWeekEvent = null;
  continueAfterWeekTransition();
  return false;
}

function renderCreation() {
  const sex = document.querySelector("#fighter-sex")?.value === "female" ? "female" : "male";
  const weightSelect = document.querySelector("#weight-class");
  renderWeightOptions(weightSelect, sex, weightSelect?.value);
  renderCreationPortraits();
  const selectedStyle = document.querySelector("#fighter-style").value;
  const styleBonuses = styles[selectedStyle].bonuses;
  const bonusSummary = Object.entries(styleBonuses).filter(([, value]) => value).map(([key, value]) => `+${value} ${combatLabels[key].toLowerCase()}`).join(" · ");
  document.querySelector("#style-bonus").textContent = `Bonus du style : ${bonusSummary}`;
  const remaining = pointsLeft();
  document.querySelector("#points-left").textContent = remaining;
  document.querySelector("#creation-stats").innerHTML = Object.entries(combatLabels).map(([key, label]) => {
    const styleBonus = styleBonuses[key] || 0;
    return `<div class="creation-stat"><div class="creation-stat-name"><strong>${label}</strong><small>Base ${BASE_COMBAT_STAT}${styleBonus ? ` · style +${styleBonus}` : ""}</small></div><div class="stat-stepper"><button type="button" data-stat="${key}" data-change="-1" ${draftStats[key] === 0 ? "disabled" : ""}>−</button><output>${BASE_COMBAT_STAT + styleBonus + draftStats[key]}</output><button type="button" data-stat="${key}" data-change="1" ${remaining === 0 ? "disabled" : ""}>+</button></div></div>`;
  }).join("");
}

function amateurFightCount() {
  const record = state.amateurRecord;
  return record.wins + record.losses + record.draws;
}

function playerCombatStrength() {
  const average = Object.values(state.combatStats).reduce((sum, value) => sum + value, 0) / 4;
  const record = state.amateurRecord;
  const fightCount = amateurFightCount();
  const maturity = clamp((state.level - 1) * .08 + Math.log2(1 + state.experience / 100) * .12 + fightCount * .03 + (record.wins - record.losses) * .04, 0, 1.5);
  return average + maturity;
}

function recordNumbers(record = "") {
  const values = [...String(record).matchAll(/(\d+)\s*[VND]/gi)].map(match => Number(match[1]));
  return { wins: values[0] || 0, losses: values[1] || 0, draws: values[2] || 0 };
}

function deterministicSeed(value) {
  return [...String(value)].reduce((seed, character) => ((seed * 31) + character.charCodeAt(0)) >>> 0, 2166136261);
}

function freshFightSeed(prefix = "combat") {
  const words = new Uint32Array(2);
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(words);
  else {
    words[0] = Math.floor(Math.random() * 0xFFFFFFFF);
    words[1] = Date.now() >>> 0;
  }
  return `${prefix}-${Date.now().toString(36)}-${words[0].toString(36)}-${words[1].toString(36)}`;
}

function opponentStatsForRating(rating, style, seedSource) {
  const seed = deterministicSeed(seedSource);
  const jitter = index => ((seed >>> (index * 5)) % 5) - 2;
  const offsets = /puncheur|pression|bagarreur/i.test(style) ? { technique: 0, power: 5, cardio: -2, defense: -3 }
    : /technicien/i.test(style) ? { technique: 4, power: -3, cardio: 0, defense: -1 }
      : /mobile/i.test(style) ? { technique: 2, power: -3, cardio: 4, defense: -3 }
        : /contre|défensif/i.test(style) ? { technique: 1, power: -3, cardio: -1, defense: 3 }
          : { technique: 1, power: 1, cardio: 0, defense: -2 };
  return Object.fromEntries(Object.keys(combatLabels).map((key, index) => [key, clamp(Math.round(rating + offsets[key] + jitter(index)), 20, 99)]));
}

function opponentDifficulty(opponent) {
  if (!opponent) return 40;
  if (Number.isFinite(Number(opponent.rating))) return clamp(Math.round(Number(opponent.rating)), 20, 99);
  if (opponent.stats) return clamp(Math.round(Object.values(opponent.stats).reduce((sum, value) => sum + Number(value || 0), 0) / 4), 20, 99);
  return clamp(Math.round(Number(opponent.difficulty) || 40), 20, 99);
}

function opponentReputationReward(difficulty) {
  return CAREER_BALANCE.opponentReputationReward({
    difficulty,
    playerStrength: playerCombatStrength(),
    avoidanceWeeks: state.avoidanceWeeks,
  });
}

function opponentExperienceReward(difficulty) {
  return CAREER_BALANCE.opponentExperienceReward({ difficulty, playerStrength: playerCombatStrength() });
}

function isCompetitiveCareer() {
  return state.careerStatus === "amateur" || state.careerStatus === "professional";
}

function updateBoxingRhythm(events, endingWeek) {
  if (!isCompetitiveCareer()) return;
  if (state.boxingTrainingWeek === endingWeek) {
    if (state.boxingInactivityWeeks >= 3) events.push("Rythme de boxe retrouvé : le programme hebdomadaire reprend sa capacité normale.");
    state.boxingInactivityWeeks = 0;
    state.boxingTrainingWeek = 0;
    return;
  }
  state.boxingInactivityWeeks = Math.min(999, state.boxingInactivityWeeks + 1);
  if (state.boxingInactivityWeeks === 2) {
    events.push("Rythme fragile : une autre semaine sans entraînement de boxe déclenchera le rythme faible.");
  }
  if (state.boxingInactivityWeeks === 3) {
    events.push("Trois semaines sans entraînement de boxe : rythme faible. Le prochain programme est limité à une action jusqu’au retour au GYM, au sac, aux mitaines ou au sparring.");
    state.journal.unshift({ week: endingWeek, text: "Rythme faible : reprends un entraînement de boxe pour retrouver un programme complet." });
  }
}

function buildLocalOpponent(template, offset, slot) {
  const identityAdjustment = (template.difficulty - 41) * .16;
  const rating = clamp(Math.round(playerCombatStrength() + offset + identityAdjustment), 28, 94);
  const record = recordNumbers(template.record);
  const careerFights = amateurFightCount();
  const wins = careerFights ? Math.max(record.wins, Math.round(careerFights * .55 + Math.max(0, offset) * .4)) : record.wins;
  const losses = careerFights ? Math.max(record.losses, Math.round(careerFights * .35 + Math.max(0, -offset) * .2)) : record.losses;
  const risk = offset <= -3 ? "Accessible" : offset >= 2 ? "Défi risqué" : "Combat serré";
  const prepared = {
    ...template,
    weightClass: state.profile.weightClass,
    record: `${wins} V · ${losses} D`,
    difficulty: rating,
    rating,
    risk,
    experience: Math.max(0, Math.round(state.experience + offset * 18 + careerFights * 4)),
  };
  prepared.stats = opponentStatsForRating(rating, prepared.style, `${prepared.id}-${state.week}-${slot}`);
  return prepared;
}

function scheduledOpponent() {
  if (!state.scheduledFight) return null;
  return state.scheduledFight.opponent || [...opponents, ...femaleOpponents].find(item => item.id === state.scheduledFight.id) || null;
}

function tournamentAvailability(id) {
  const count = amateurFightCount();
  const status = state.tournaments[id];
  if (state.activeTournament?.id === id) return { available: false, label: state.week < state.activeTournament.startWeek ? "Préparation en cours" : "Tournoi en cours" };
  if (state.activeTournament) return { available: false, label: "Un autre tournoi est en cours" };
  if (id === "bronze") {
    if (status !== "pending") return { available: false, terminal: true, label: status === "won" ? "Remporté" : status === "lost" ? "Participation terminée" : "Occasion manquée" };
    if (count <= 5) return { available: true, label: `Inscription ouverte · ${5 - count} combat${5 - count > 1 ? "s" : ""} encore permis avant la date` };
    return { available: false, label: "Occasion manquée" };
  }
  if (id === "silver") {
    if (status === "won" || status === "lost" || status === "missed") return { available: false, terminal: true, label: status === "won" ? "Remporté" : status === "lost" ? "Participation terminée" : "Fenêtre terminée" };
    if (count <= 10) return { available: true, label: `Inscription ouverte · ${10 - count} combat${10 - count > 1 ? "s" : ""} encore permis avant la date` };
    return { available: false, label: "Fenêtre terminée" };
  }
  if (id === "golden") {
    return count >= 10 ? { available: true, label: state.medals.golden.gold ? `${state.medals.golden.gold} or · rejouable` : state.goldenPlacement ? `Nouvelle tentative · meilleur rang ${state.goldenPlacement}` : "Inscription ouverte" } : { available: false, label: `Disponible dans ${10 - count} combat${10 - count > 1 ? "s" : ""}` };
  }
  if (id === "canadian") {
    return state.medals.golden.gold > 0 ? { available: true, label: state.medals.canadian.gold ? "Champion · rejouable" : "Sélection ouverte" } : { available: false, label: "Remporte l’or aux Gants dorés" };
  }
  return state.medals.canadian.gold > 0 ? { available: true, label: state.olympicCompleted ? "Parcours terminé · rejouable" : "Sélection ouverte" } : { available: false, label: "Remporte l’or au championnat canadien" };
}

function boxingGymTournamentAdvice(event, eligibilityNotes = []) {
  if (state.gymWeeks <= 0) return "";
  const count = amateurFightCount();
  if (state.fatigue >= 58 || state.energy <= 42) return "Conseil du coach : la fenêtre est intéressante, mais ta fraîcheur est trop basse pour un tournoi maintenant.";
  if (event.tournamentId === "bronze" && count < 3) return "Conseil du coach : tu es admissible, mais quelques galas locaux de plus te donneraient des repères utiles sans fermer la fenêtre.";
  if (event.tournamentId === "silver" && count < 5) return "Conseil du coach : les Gants d’argent sont ouverts, mais tu peux encore privilégier les galas et choisir ton moment.";
  if (event.independent && eligibilityNotes.some(note => note.eligible)) return "Conseil du coach : choisis la division qui correspond à ton expérience réelle; l’inscription reste facultative.";
  return "Conseil du coach : la fenêtre correspond à ton parcours actuel. Garde tout de même de l’énergie pour les jours de tournoi.";
}

function generateTournamentOpponents(tournament) {
  const seed = state.week + amateurFightCount() + tournament.baseDifficulty;
  const names = state.profile.sex === "female" ? tournamentNamesFemale : tournamentNames;
  // Les parcours avancés sont surtout plus exigeants par leur longueur et leur progression
  // ronde après ronde; un décalage initial trop élevé les rendait presque impossibles.
  const curve = CAREER_BALANCE.TOURNAMENT_CURVES[tournament.id] || CAREER_BALANCE.TOURNAMENT_CURVES["regional-cup"];
  const stageBonus = curve.openingOffset;
  const playerRating = playerCombatStrength();
  return Array.from({ length: tournament.rounds }, (_, round) => {
    const identity = names[(seed + round * 3) % names.length];
    const rating = CAREER_BALANCE.tournamentOpponentRating({
      tournamentId: tournament.id,
      playerRating,
      roundIndex: round,
      baseDifficulty: tournament.baseDifficulty,
    });
    const wins = Math.max(3, amateurFightCount() + Math.round(stageBonus) + round * 3);
    const losses = Math.max(1, 5 - round);
    const opponent = {
      id: `${tournament.id}-round-${round + 1}-${seed}`,
      name: `${identity[0]} ${identity[1]}`,
      nickname: identity[2],
      weightClass: state.profile.weightClass,
      style: tournamentStyles[(seed + round) % tournamentStyles.length],
      record: `${wins} V · ${losses} D`,
      difficulty: rating,
      rating,
      experience: Math.round(state.experience + stageBonus * 25 + round * 35),
      risk: round === tournament.rounds - 1 ? "Finale" : round >= tournament.rounds - 2 ? "Très élevé" : "Relevé",
    };
    opponent.stats = opponentStatsForRating(rating, opponent.style, opponent.id);
    return opponent;
  });
}

function roundName(totalRounds, index) {
  const remaining = totalRounds - index;
  if (remaining === 1) return "Finale";
  if (remaining === 2) return "Demi-finale";
  if (remaining === 3) return "Quart de finale";
  if (remaining === 4) return "Huitième de finale";
  if (remaining === 5) return "Seizième de finale";
  return `Tour ${index + 1}`;
}

function tournamentMedalForLoss(tournament, roundIndex) {
  if (roundIndex === tournament.rounds - 1) return "silver";
  if (roundIndex === tournament.rounds - 2) return "bronze";
  return null;
}

function maybeOpenTournamentMedalDialog() {
  const active = state.activeTournament;
  const presentation = TOURNAMENT_MEDAL_PRESENTATION[active?.medal];
  const dialog = document.querySelector("#tournament-medal-dialog");
  if (!active || active.status !== "completed" || active.medalCelebrated || !presentation || !dialog) return false;

  const tournament = tournamentDefs.find(item => item.id === active.id);
  const tournamentName = active.name || tournament?.name || "Tournoi amateur";
  const category = state.profile ? weightClassLabel(state.profile.weightClass, state.profile.sex) : "Catégorie amateur";
  const details = [active.division, category].filter(Boolean).join(" · ");
  const card = document.querySelector("#tournament-medal-card");
  const image = document.querySelector("#tournament-medal-image");
  if (card) card.dataset.medal = active.medal;
  document.querySelector("#tournament-medal-title").textContent = presentation.label;
  document.querySelector("#tournament-medal-congratulations").textContent = `Félicitations, ${state.profile?.firstName || "champion"} !`;
  document.querySelector("#tournament-medal-copy").textContent = `Tu remportes ${presentation.noun}. ${tournamentName} · ${details}.`;
  if (image) {
    image.src = presentation.asset;
    image.alt = `${presentation.label} de tournoi avec deux gants de boxe en relief`;
  }

  active.medalCelebrated = true;
  persistCareer();
  if (!dialog.open) dialog.showModal();
  return true;
}

function continueAfterTournamentMedal() {
  document.querySelector("#tournament-medal-dialog")?.close();
  if (state.activeTournament) openTournamentBoard();
  else render();
}

function completeTournament(medal = null, reason = "") {
  const active = state.activeTournament;
  if (!active) return "";
  const tournament = tournamentDefs.find(item => item.id === active.id) || { id: active.id, name: active.name || "Tournoi extérieur", rounds: active.opponents?.length || 3 };
  if (medal && state.medals[active.id]) state.medals[active.id][medal] += 1;
  if (active.id === "bronze" || active.id === "silver") state.tournaments[active.id] = medal === "gold" ? "won" : "lost";
  else if (Object.hasOwn(state.tournaments, active.id)) state.tournaments[active.id] = "pending";
  if (active.id === "golden" && medal) {
    const placement = medal === "gold" ? 1 : medal === "silver" ? 2 : 3;
    state.goldenPlacement = state.goldenPlacement ? Math.min(state.goldenPlacement, placement) : placement;
  }
  if (active.id === "olympic") state.olympicCompleted = true;
  const medalLabel = medal === "gold" ? "médaille d’or" : medal === "silver" ? "médaille d’argent" : medal === "bronze" ? "médaille de bronze" : "aucune médaille";
  applyChanges({ reputation: medal === "gold" ? 15 : medal ? 9 : 3, experience: medal === "gold" ? 20 : 12 });
  active.status = "completed";
  active.medal = medal;
  active.medalCelebrated = !medal;
  const booking = state.bookings.find(item => item.id === active.bookingId);
  if (booking) booking.status = "completed";
  const tournamentName = active.name || tournament.name;
  active.summary = reason ? `${tournamentName} terminés : ${reason}.` : `${tournamentName} terminés : ${medalLabel}.`;
  state.journal.unshift({ week: state.week, text: active.summary });
  return active.summary;
}

function resolveTournamentRound(fight, result, method = "decision", score = "") {
  const active = state.activeTournament;
  if (!fight.tournamentId || !active || active.id !== fight.tournamentId) return "";
  const tournament = tournamentDefs.find(item => item.id === active.id);
  const roundIndex = active.currentRound;
  const condition = {
    energy: fight.fighters.player.energy,
    fatigue: state.fatigue,
    injury: CAREER_NEUTRAL_COMBAT_CONDITION.injury,
    fitness: CAREER_NEUTRAL_COMBAT_CONDITION.fitness,
    cardio: state.combatStats.cardio,
    // Ces séquelles restent limitées au tournoi. Elles donnent un sens aux
    // choix Repos/Protection sans réactiver les anciennes blessures persistantes.
    headDamage: fight.fighters.player.head,
    bodyDamage: fight.fighters.player.body,
    lucidity: fight.fighters.player.lucidity,
  };
  if (active.competition) {
    active.competition = BoxeurTournament.recordBoutResult(active.competition, {
      result: result === "Victoire" ? "win" : "loss",
      method,
      score,
      opponent: fight.opponent.name,
      condition,
      medical: { knockedOut: false, acuteInjury: false },
    });
  }
  active.results.push({ round: roundIndex, opponent: fight.opponent.name, result, score: score || method });
  if (result !== "Victoire") {
    const booking = state.bookings.find(item => item.id === active.bookingId);
    if (booking) booking.status = "completed";
    return completeTournament(tournamentMedalForLoss(tournament, roundIndex));
  }
  active.currentRound = active.competition?.wins ?? active.currentRound + 1;
  if (active.currentRound >= tournament.rounds) return completeTournament("gold");
  return `Victoire en ${roundName(tournament.rounds, roundIndex)}. ${tournament.rounds - active.currentRound} combat${tournament.rounds - active.currentRound > 1 ? "s" : ""} à gagner.`;
}

function renderRecreationalCalendar(path, scheduled, calendarContainer, tournamentsContainer, activeTournamentContainer, tournamentCatalog) {
  const partner = sparringPartnerView();
  const isSparringDue = Boolean(state.scheduledFight?.isRecreationalSparring && state.week >= state.scheduledFight.week);
  document.querySelector("#calendar-dialog-eyebrow").textContent = "Parcours récréatif";
  document.querySelector("#calendar-title").textContent = "Vers le premier combat";
  document.querySelector("#calendar-date-label").textContent = `${formatCareerDate(careerWeekDate(0))} · semaine ${state.week}`;
  document.querySelector("#amateur-fight-count").textContent = "Bilan amateur à venir";
  document.querySelector("#calendar-dialog-lead").textContent = `${partner.displayName} évalue tes bases en semaine ${RECREATIONAL_SPARRING_WEEK}. Le statut amateur sera ensuite activé automatiquement.`;
  path.hidden = false;
  path.innerHTML = `<div><p class="eyebrow">Parcours des bases</p><strong>${escapeHTML(partner.displayName)}</strong><p>Construis tes repères avant l’évaluation de la semaine ${RECREATIONAL_SPARRING_WEEK}. Une fois le sparring terminé, le circuit amateur s’ouvrira automatiquement.</p><div class="countdown-meter"><span style="width:${Math.min(100, Math.round((state.week / RECREATIONAL_SPARRING_WEEK) * 100))}%"></span></div></div><ul><li>Semaines 1 à 5 : emploi, premier abonnement et bases</li><li>Semaine 6 : sparring d’évaluation avec ${escapeHTML(partner.firstName)}</li><li>Après le sparring : passage automatique au statut amateur</li></ul>`;
  if (state.scheduledFight?.isRecreationalSparring) {
    const opponent = scheduledOpponent();
    scheduled.innerHTML = `<div class="fight-notice"><div><p class="eyebrow">Sparring d’évaluation · GYM de boxe</p><strong>${escapeHTML(opponent.name)} « ${escapeHTML(opponent.nickname)} »</strong><p>${isSparringDue ? `${escapeHTML(partner.firstName)} est ${state.profile.sex === "female" ? "prête" : "prêt"}. Trois rounds courts pour montrer tes bases; ce sparring ne comptera pas au bilan amateur.` : `Prévu à la semaine ${state.scheduledFight.week}. Continue ta préparation.`}</p></div>${isSparringDue ? `<div class="fight-notice-actions"><button id="start-fight" class="primary-button" type="button">Entrer dans le ring</button></div>` : ""}</div>`;
  } else {
    scheduled.innerHTML = "";
  }
  calendarContainer.innerHTML = "";
  tournamentsContainer.innerHTML = "";
  activeTournamentContainer.innerHTML = "";
  if (tournamentCatalog) tournamentCatalog.hidden = true;
}

function renderFights() {
  ensureCareerCalendar();
  ensureDueTournamentActive();
  scheduleRecreationalSparring();
  const scheduled = document.querySelector("#scheduled-fight");
  const calendarContainer = document.querySelector("#calendar-events");
  const tournamentsContainer = document.querySelector("#tournaments");
  const activeTournamentContainer = document.querySelector("#active-tournament");
  const tournamentCatalog = document.querySelector("#tournament-catalog");
  const recreationalPath = document.querySelector("#recreational-path");
  const avoidanceWarning = document.querySelector("#fight-avoidance-warning");
  const fightCount = amateurFightCount();
  if (avoidanceWarning) {
    avoidanceWarning.hidden = state.avoidanceWeeks < 3;
    avoidanceWarning.textContent = state.avoidanceWeeks >= 6 ? "Avertissement du coach : les offres deviennent moins ambitieuses tant que tu évites les combats." : state.avoidanceWeeks >= 3 ? `Tu n’as pas combattu depuis ${state.avoidanceWeeks} semaines : ta réputation commence à baisser.` : "";
  }
  document.querySelector("#amateur-fight-count").textContent = `${fightCount} combat${fightCount > 1 ? "s" : ""} disputé${fightCount > 1 ? "s" : ""}`;

  if (isRecreationalCareer()) {
    if (avoidanceWarning) avoidanceWarning.hidden = true;
    renderRecreationalCalendar(recreationalPath, scheduled, calendarContainer, tournamentsContainer, activeTournamentContainer, tournamentCatalog);
    return;
  }

  recreationalPath.hidden = true;
  if (tournamentCatalog) {
    tournamentCatalog.hidden = false;
    tournamentCatalog.open = false;
  }
  document.querySelector("#calendar-dialog-eyebrow").textContent = "Saison amateur";
  document.querySelector("#calendar-title").textContent = "Calendrier des galas et tournois";
  document.querySelector("#calendar-dialog-lead").textContent = "Les événements sont annoncés quelques semaines à l’avance. Lorsqu’ils ont lieu le même soir, il faut choisir.";

  if (state.careerStatus === "professional") {
    scheduled.innerHTML = "";
    calendarContainer.innerHTML = '<div class="amateur-closed"><strong>Circuit amateur fermé</strong><p>La carrière professionnelle a commencé. Le bilan amateur est désormais définitif.</p></div>';
    activeTournamentContainer.innerHTML = "";
    tournamentsContainer.innerHTML = "";
    if (tournamentCatalog) tournamentCatalog.hidden = true;
    return;
  }

  if (state.scheduledFight) {
    const opponent = scheduledOpponent();
    const isFightWeek = state.week >= state.scheduledFight.week;
    const eventName = state.scheduledFight.tournamentId ? state.scheduledFight.event?.name || tournamentDefs.find(item => item.id === state.scheduledFight.tournamentId)?.name || "Tournoi amateur" : "Combat local";
    const withdrawLabel = state.scheduledFight.tournamentId ? "Abandonner le tournoi" : "Se désister";
    scheduled.innerHTML = `<div class="fight-notice"><div><p class="eyebrow">Prochain combat programmé · ${eventName}</p><strong>${escapeHTML(opponent.name)} « ${escapeHTML(opponent.nickname)} »</strong><p>${isFightWeek ? "Le combat est arrivé. Joue ta semaine normalement; l’accès au ring s’ouvrira ensuite à l’aréna." : `Prévu pour la semaine ${state.scheduledFight.week}. Continue ta préparation.`}</p></div>${isFightWeek ? `<div class="fight-notice-actions"><button id="withdraw-fight" class="secondary-button withdraw-button" type="button">${withdrawLabel}</button><button data-career-go-arena class="primary-button" type="button">Aller à l’aréna</button></div>` : ""}</div>`;
  } else {
    scheduled.innerHTML = "";
  }

  const weekStart = careerWeekDate(0);
  const weekEnd = BoxeurCalendar.dateForCareerWeek(state.calendar.epoch, state.week + 5, 6);
  const currentEvents = state.calendar.events.filter(event => event.endDate >= weekStart && event.startDate <= weekEnd);
  const formatDate = value => new Intl.DateTimeFormat("fr-CA", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`));
  const formatShortDate = value => new Intl.DateTimeFormat("fr-CA", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`));
  document.querySelector("#calendar-date-label").textContent = `${formatDate(weekStart)} · 6 semaines annoncées`;
  const tournamentIndicator = document.querySelector("#next-tournament-indicator");
  const tournamentIsEligible = event => {
    if (bookingForEvent(event.id)) return true;
    if (event.registrationDeadline && weekStart > event.registrationDeadline) return false;
    const divisions = event.divisions?.length ? event.divisions : [null];
    return divisions.some(division => BoxeurCalendar.evaluateEligibility(event, state, {
      bookings: activeBookings(),
      includeBookings: true,
      divisionId: division?.id,
    }).eligible);
  };
  const upcomingTournaments = state.calendar.events
    .filter(event => event.kind === "tournament" && event.endDate >= weekStart)
    .sort((left, right) => safeNumber(left.careerWeek, state.week) - safeNumber(right.careerWeek, state.week) || left.startDate.localeCompare(right.startDate));
  let nextEligibleTournament = upcomingTournaments.find(tournamentIsEligible) || null;
  if (!nextEligibleTournament && BoxeurCalendar.nextTournamentPreview) {
    let previewWeek = Math.max(state.week, safeNumber(state.calendar.endWeek, state.week + 8, state.week, 99999) + 1);
    for (let attempt = 0; attempt < 24 && !nextEligibleTournament; attempt += 1) {
      const preview = BoxeurCalendar.nextTournamentPreview({
        ...(state.calendar.settings || {}),
        epoch: state.calendar.epoch,
        seed: state.calendar.seed,
        afterWeek: previewWeek,
      });
      if (!preview) break;
      if (tournamentIsEligible(preview)) nextEligibleTournament = preview;
      previewWeek = safeNumber(preview.careerWeek, previewWeek, previewWeek, 99999) + 1;
    }
  }
  if (tournamentIndicator) {
    if (nextEligibleTournament) {
      const weeksUntil = Math.max(0, safeNumber(nextEligibleTournament.careerWeek, state.week, state.week, 99999) - state.week);
      const timing = weeksUntil === 0 ? "cette semaine" : `dans ${weeksUntil} semaine${weeksUntil > 1 ? "s" : ""}`;
      const registered = Boolean(bookingForEvent(nextEligibleTournament.id));
      const finalPreparation = weeksUntil === 1 ? '<b>Dernière semaine pour se préparer</b>' : "";
      tournamentIndicator.innerHTML = `<small>${registered ? "Inscription confirmée" : "Prochain tournoi admissible"}</small><strong>${escapeHTML(nextEligibleTournament.name)}</strong><span>Semaine ${nextEligibleTournament.careerWeek} · ${timing}</span>${finalPreparation}`;
    } else {
      tournamentIndicator.innerHTML = "<small>Prochain tournoi</small><strong>Aucun tournoi admissible annoncé</strong>";
    }
  }
  const galaCandidatesByEvent = new Map(currentEvents.filter(event => event.kind !== "tournament").map(event => {
    const candidates = (event.opponentSlots || []).map((slot, index) => {
      const candidate = opponentForGala(event, index);
      return { slot, index, candidate, difficulty: opponentDifficulty(candidate) };
    }).sort((left, right) => left.difficulty - right.difficulty || left.index - right.index);
    return [event.id, { event, candidates }];
  }));
  const recommendedGala = state.scheduledFight ? null : Array.from(galaCandidatesByEvent.values())
    .filter(item => item.candidates.length)
    .sort((left, right) => safeNumber(left.event.careerWeek, state.week) - safeNumber(right.event.careerWeek, state.week)
      || left.event.startDate.localeCompare(right.event.startDate)
      || Number(Boolean(right.event.homeAdvantage)) - Number(Boolean(left.event.homeAdvantage))
      || left.candidates[0].difficulty - right.candidates[0].difficulty)[0] || null;

  const renderGalaChoice = (event, entry, { primary = false, recommended = false } = {}) => {
    const travel = BoxeurCalendar.travelOptionsForEvent(event)[0];
    const quote = BoxeurCalendar.quoteEventCost(event, travel?.id || "none");
    return `<button class="secondary-button calendar-opponent-choice${primary ? " calendar-opponent-primary" : ""}${recommended ? " recommended" : ""}" type="button" data-book-gala="${event.id}" data-slot="${entry.index}">${recommended ? '<span class="calendar-opponent-recommendation">Recommandé par le coach</span>' : ""}<strong>${escapeHTML(entry.candidate.name)} « ${escapeHTML(entry.candidate.nickname)} »</strong><span>${escapeHTML(entry.candidate.style)} · ${escapeHTML(entry.candidate.record)} · difficulté ${entry.difficulty}</span><em>${escapeHTML(entry.slot.label)}${quote.total ? ` · ${quote.total} $` : " · gratuit"}</em></button>`;
  };

  const renderCalendarEvent = event => {
      const booked = bookingForEvent(event.id);
      const eventClass = event.kind === "tournament" ? "tournament" : event.scope === "home-gym" ? "home" : "";
      const type = event.kind === "tournament" ? event.independent ? "Tournoi extérieur" : "Tournoi" : event.scope === "home-gym" ? "Gala à ton gym" : event.scope === "regional" ? "Gala régional" : "Gala local";
      const venue = `${event.venue.city}, ${event.venue.region}`;
      if (event.kind === "tournament") {
        const divisions = event.divisions?.length ? event.divisions : [null];
        const eligibilityStates = divisions.map(division => ({
          division,
          eligibility: BoxeurCalendar.evaluateEligibility(event, state, { bookings: activeBookings(), includeBookings: true, divisionId: division?.id }),
        }));
        const available = eligibilityStates.some(item => item.eligibility.eligible);
        const travelChoices = BoxeurCalendar.travelOptionsForEvent(event);
        const buttons = booked
          ? `<button class="secondary-button" type="button" disabled>Inscription confirmée · ${booked.payment?.total || 0} $</button>`
          : eligibilityStates.flatMap(({ division, eligibility }) => travelChoices.map(choice => {
            const quote = BoxeurCalendar.quoteEventCost(event, choice.id);
            const divisionLabel = division ? `${division.label} · ` : "";
            return `<button class="secondary-button" type="button" data-book-tournament="${event.id}" data-travel="${choice.id}" ${division ? `data-tournament-division="${division.id}"` : ""} ${eligibility.eligible ? "" : "disabled"}>${escapeHTML(divisionLabel)}${escapeHTML(choice.label)} · ${quote.total} $</button>`;
          })).join("");
        const eligibilityNotes = eligibilityStates.map(({ division, eligibility }) => `${division ? `${division.label} : ` : ""}${eligibility.reason}`);
        const coachAdvice = boxingGymTournamentAdvice(event, eligibilityStates);
        return `<article class="calendar-event ${eventClass}${booked ? " booked" : ""}${available || booked ? "" : " unavailable"}"><div class="calendar-event-head"><span class="calendar-event-type">${type}</span><span class="calendar-event-badge">${event.rounds} jours · 5 juges</span></div><h3>${escapeHTML(event.name)}</h3><p>${venue} · pesée quotidienne · un combat par jour.</p><div class="calendar-event-meta"><span>${weightClassLabel(state.profile.weightClass, state.profile.sex)}</span><span>${escapeHTML(eligibilityNotes.join(" · "))}</span><span>Date limite ${formatDate(event.registrationDeadline)}</span></div>${coachAdvice ? `<p class="calendar-coach-advice">${escapeHTML(coachAdvice)}</p>` : ""}<div class="calendar-event-actions">${buttons}</div></article>`;
      }
      const candidateSet = galaCandidatesByEvent.get(event.id)?.candidates || [];
      const eventRecommended = recommendedGala?.event.id === event.id;
      const primaryChoice = candidateSet[0];
      const alternateChoices = candidateSet.slice(1);
      const buttons = booked
        ? '<button class="secondary-button calendar-opponent-primary" type="button" disabled>Combat réservé</button>'
        : `${primaryChoice ? renderGalaChoice(event, primaryChoice, { primary: true, recommended: eventRecommended }) : ""}${alternateChoices.length ? `<details class="calendar-opponent-alternatives"><summary>Voir les ${alternateChoices.length} autre${alternateChoices.length > 1 ? "s" : ""} adversaire${alternateChoices.length > 1 ? "s" : ""}</summary><div class="calendar-opponent-alternative-list">${alternateChoices.map(entry => renderGalaChoice(event, entry)).join("")}</div></details>` : ""}`;
      const advantage = event.homeAdvantage ? " · légère aide du coin à domicile" : "";
      const recommendation = eventRecommended && primaryChoice ? `<p class="calendar-coach-pick"><strong>Choix du coach</strong><span>${escapeHTML(primaryChoice.candidate.name)} représente l’option la plus accessible de la prochaine occasion.</span></p>` : "";
      return `<article class="calendar-event ${eventClass}${booked ? " booked" : ""}${eventRecommended ? " recommended" : ""}"><div class="calendar-event-head"><span class="calendar-event-type">${type}</span><span class="calendar-event-badge">3 juges</span></div><h3>${escapeHTML(event.name)}</h3><p>${venue}${advantage}. Aucune pesée à gérer.</p><div class="calendar-event-meta"><span>${weightClassLabel(state.profile.weightClass, state.profile.sex)}</span><span>${event.scope === "regional" ? "Transport et hébergement requis" : "Aucuns frais"}</span><span>Vendredi ou samedi</span></div>${recommendation}<div class="calendar-event-actions">${buttons}</div></article>`;
  };

  const renderCalendarDates = weekEvents => {
    if (!weekEvents.length) return '<div class="calendar-week-empty"><strong>Aucun événement cette semaine</strong><span>Profite de cette période pour préparer ton prochain rendez-vous.</span></div>';
    const grouped = BoxeurCalendar.groupEventsByDate(weekEvents);
    return Object.entries(grouped).sort(([left], [right]) => left.localeCompare(right)).map(([date, events]) => {
      const orderedEvents = events.slice().sort((left, right) => Number(right.id === recommendedGala?.event.id) - Number(left.id === recommendedGala?.event.id));
      return `<section class="calendar-date-group"><div class="calendar-date"><strong>${escapeHTML(formatDate(date))}</strong><span>${events.length} événement${events.length > 1 ? "s" : ""}</span></div><div class="calendar-day-events">${orderedEvents.map(renderCalendarEvent).join("")}</div></section>`;
    }).join("");
  };

  calendarContainer.innerHTML = Array.from({ length: 6 }, (_, offset) => {
    const calendarWeek = state.week + offset;
    const events = currentEvents.filter(event => safeNumber(event.careerWeek, state.week, 1, 99999) === calendarWeek);
    const startDate = BoxeurCalendar.dateForCareerWeek(state.calendar.epoch, calendarWeek, 0);
    const endDate = BoxeurCalendar.dateForCareerWeek(state.calendar.epoch, calendarWeek, 6);
    const relativeLabel = offset === 0 ? "Cette semaine" : offset === 1 ? "Semaine prochaine" : `Dans ${offset} semaines`;
    const countLabel = events.length ? `${events.length} événement${events.length > 1 ? "s" : ""}` : "Préparation";
    const tournamentCount = events.filter(event => event.kind === "tournament").length;
    const status = tournamentCount
      ? `<em class="has-tournament"><span class="calendar-week-tournament-badge">${tournamentCount > 1 ? `${tournamentCount} tournois` : "Tournoi"}</span><span>${countLabel}</span></em>`
      : `<em>${countLabel}</em>`;
    return `<details class="calendar-week-group${offset === 0 ? " current" : ""}" data-calendar-week="${calendarWeek}"${offset === 0 ? " open" : ""}><summary class="calendar-week-summary"><div><span>${relativeLabel} · semaine ${calendarWeek}</span><strong>${escapeHTML(formatShortDate(startDate))} — ${escapeHTML(formatShortDate(endDate))}</strong></div>${status}</summary><div class="calendar-week-content">${renderCalendarDates(events)}</div></details>`;
  }).join("");

  if (fightCount > 5 && state.tournaments.bronze === "pending") state.tournaments.bronze = "missed";
  if (fightCount > 10 && state.tournaments.silver === "pending") state.tournaments.silver = "missed";
  if (state.activeTournament) {
    const active = state.activeTournament;
    const tournament = tournamentDefs.find(item => item.id === active.id);
    const tournamentName = active.name || tournament?.name || "Tournoi extérieur";
    const remaining = Math.max(0, active.startWeek - state.week);
    const progress = Math.round(((TOURNAMENT_PREP_WEEKS - remaining) / TOURNAMENT_PREP_WEEKS) * 100);
    activeTournamentContainer.innerHTML = active.status === "completed" ? `<div class="tournament-countdown ready"><div><p class="eyebrow">Parcours terminé</p><strong>${escapeHTML(active.summary)}</strong></div><button class="secondary-button" type="button" data-open-tournament>Voir le tableau final</button></div>` : remaining > 0 ? `<div class="tournament-countdown"><div><p class="eyebrow">Inscription confirmée · ${escapeHTML(tournamentName)}</p><strong>Début dans ${remaining} semaine${remaining > 1 ? "s" : ""}</strong><p>Semaine ${active.startWeek} · ${tournament?.participants || active.opponents?.length || 8} participants · ${tournament?.rounds || active.opponents?.length || 3} combats à gagner</p><div class="countdown-meter"><span style="width:${progress}%"></span></div></div><button class="secondary-button" type="button" data-open-tournament>Voir le tableau</button></div>` : `<div class="tournament-countdown ready"><div><p class="eyebrow">Le tournoi commence</p><strong>${escapeHTML(tournamentName)}</strong><p>${tournament?.participants || active.opponents?.length || 8} participants · prochain tour : ${roundName(tournament?.rounds || active.opponents?.length || 3, active.currentRound)}</p></div><button class="primary-button" type="button" data-career-go-arena>Aller à l’aréna</button></div>`;
  } else {
    activeTournamentContainer.innerHTML = "";
  }
  tournamentsContainer.innerHTML = tournamentDefs.filter(tournament => !tournament.independent).map(tournament => {
    const availability = tournamentAvailability(tournament.id);
    const cardClass = availability.terminal ? "completed" : availability.available ? "available" : "locked";
    const medals = state.medals[tournament.id];
    const medalSummary = medals.bronze + medals.silver + medals.gold ? `<div class="tournament-medals"><span class="medal-dot bronze"></span>${medals.bronze}<span class="medal-dot silver"></span>${medals.silver}<span class="medal-dot gold"></span>${medals.gold}</div>` : "";
    const nextEvent = state.calendar.events.find(event => event.kind === "tournament" && event.tournamentId === tournament.id && event.endDate >= weekStart);
    return `<article class="tournament-card ${cardClass}"><span class="tournament-medal">${tournament.medal}</span><h3>${tournament.name}</h3><p>${tournament.description}</p>${medalSummary}<p class="tournament-state">${nextEvent ? `${formatDate(nextEvent.startDate)} · inscription dans le calendrier` : availability.label}</p></article>`;
  }).join("");
}

function currentJob() {
  return jobs.find(job => job.id === state.jobId) || null;
}

function isRecreationalCareer() {
  return state.careerStatus === "recreational";
}

function renderJobBoardSheet(job, { active = false, selected = false, disabled = false, status = "", effects = "" } = {}) {
  const capacityCost = Number(job.weekCapacityCost);
  const availability = Number.isFinite(capacityCost)
    ? `<small class="job-board-availability">Longues heures · ${Math.round(capacityCost)} capacité de semaine réservée</small>`
    : "";
  return `<button class="job-board-sheet${selected ? " selected" : ""}${active ? " active" : ""}" type="button" data-select-job="${escapeHTML(job.id)}" aria-pressed="${selected}" ${disabled ? "disabled" : ""}><span class="job-board-pin" aria-hidden="true"></span><span class="job-board-sheet-type">Offre d’emploi</span><strong>${escapeHTML(job.title)}</strong><span class="job-board-pay">${job.wage} $ / semaine · ${escapeHTML(job.schedule)}</span><small class="job-board-status">${escapeHTML(status)}</small><small class="job-board-effects">${escapeHTML(effects)}</small>${availability}<small class="job-board-detail">${escapeHTML(job.detail)}</small></button>`;
}

function hireJob(job, initial = false) {
  const previousJob = currentJob();
  state.jobId = job.id;
  state.jobsHeldCount += 1;
  state.introJobRequired = false;
  state.missedWorkWeeks = 0;
  state.jobTenureWeeks = 0;
  state.jobVacationEarnedAtTenure = 0;
  state.vacationBankWeeks = 0;
  state.jobWagesEarned = 0;
  state.workStreak = 0;
  state.jobApplication = null;
  state.jobReferenceBonus = false;
  const verb = initial ? "commence" : previousJob ? `quitte ${previousJob.title} et commence` : "obtient";
  state.journal.unshift({ week: state.week, text: `${state.profile.firstName} ${verb} un emploi : ${job.title}, paie hebdomadaire de ${job.wage} $.` });
}

function activateReadyJobOffer(events) {
  if (!state.jobApplication?.offerReady) return;
  const job = jobs.find(item => item.id === state.jobApplication.jobId);
  if (!job) {
    state.jobApplication = null;
    return;
  }
  const previousJob = currentJob();
  hireJob(job, false);
  events.push(previousJob ? `Changement d’emploi : ${job.title} est maintenant actif.` : `Nouvel emploi : ${job.title} est maintenant actif.`);
}

const gymPlans = Object.freeze([
  { id: "monthly", label: "1 mois", weeks: GYM_MONTH_WEEKS, price: GYM_PRICE, detail: "4 semaines d’accès au GYM de boxe." },
  { id: "three-months", label: "3 mois", weeks: GYM_THREE_MONTH_WEEKS, price: GYM_THREE_MONTH_PRICE, detail: "12 semaines d’accès · 45 $ d’économie sur trois mois." },
]);

const strengthGymPlans = Object.freeze([
  { id: "monthly", label: "1 mois", weeks: STRENGTH_GYM_MONTH_WEEKS, price: STRENGTH_GYM_PRICE, detail: "4 semaines d’accès au gym de musculation." },
  { id: "three-months", label: "3 mois", weeks: STRENGTH_GYM_THREE_MONTH_WEEKS, price: STRENGTH_GYM_THREE_MONTH_PRICE, detail: "12 semaines d’accès · 15 $ d’économie." },
]);

function accruePaidVacation(job, events, week) {
  const requiredTenure = state.jobVacationEarnedAtTenure
    ? state.jobVacationEarnedAtTenure + PAID_VACATION_INTERVAL_WEEKS
    : FIRST_PAID_VACATION_WEEKS;
  if (state.jobTenureWeeks < requiredTenure) return;
  state.jobVacationEarnedAtTenure = requiredTenure;
  if (state.vacationBankWeeks >= MAX_PAID_VACATION_WEEKS) {
    const note = `${job.title} : la banque de vacances est déjà pleine (${MAX_PAID_VACATION_WEEKS} semaines).`;
    events.push(note);
    state.journal.unshift({ week, text: note });
    return;
  }
  state.vacationBankWeeks += 1;
  const note = `${job.title} : une semaine de vacances payées est ajoutée à ta banque (${state.vacationBankWeeks}/${MAX_PAID_VACATION_WEEKS}).`;
  events.push(note);
  state.journal.unshift({ week, text: note });
}

function settleJobAttendance(worked, events, week, excused = false, paidWork = false) {
  if (state.jobAttendanceWeek === week) return;
  state.jobAttendanceWeek = week;
  const job = currentJob();
  if (!job) {
    state.missedWorkWeeks = 0;
    return;
  }
  if (worked) {
    if (state.missedWorkWeeks > 0) {
      const note = `${job.title} : présence enregistrée, mais ${state.missedWorkWeeks}/3 absence${state.missedWorkWeeks > 1 ? "s" : ""} injustifiée${state.missedWorkWeeks > 1 ? "s" : ""} demeure${state.missedWorkWeeks > 1 ? "nt" : ""} au dossier.`;
      events.push(note);
      state.journal.unshift({ week, text: note });
    }
    state.jobTenureWeeks += 1;
    if (paidWork) state.jobWagesEarned += job.wage;
    accruePaidVacation(job, events, week);
    return;
  }
  if (excused) {
    const note = `${job.title} : absence justifiée par le tournoi; ton emploi est protégé.`;
    events.push(note);
    state.journal.unshift({ week, text: note });
    state.jobTenureWeeks += 1;
    accruePaidVacation(job, events, week);
    return;
  }
  state.missedWorkWeeks += 1;
  if (state.missedWorkWeeks >= 3) {
    const vacationPayout = state.vacationBankWeeks > 0 ? Math.round(state.jobWagesEarned * .04) : 0;
    if (vacationPayout) state.money += vacationPayout;
    const note = `${job.title} : congédiement après trois absences injustifiées cumulées chez le même employeur.${vacationPayout ? ` Indemnité de vacances : +${vacationPayout} $ (4 % des salaires reçus).` : ""}`;
    events.push(note);
    state.journal.unshift({ week, text: note });
    state.jobId = null;
    state.missedWorkWeeks = 0;
    state.workStreak = 0;
    state.jobTenureWeeks = 0;
    state.jobVacationEarnedAtTenure = 0;
    state.vacationBankWeeks = 0;
    state.jobWagesEarned = 0;
    state.jobReferenceBonus = false;
    state.jobLossNotice = `Tu as perdu ton emploi de ${job.title} après trois absences injustifiées cumulées.${vacationPayout ? ` Une indemnité de vacances de ${vacationPayout} $ a été versée.` : ""}`;
    return;
  }
  const remaining = 3 - state.missedWorkWeeks;
  const note = `${job.title} : ${state.missedWorkWeeks === 1 ? "première absence" : "dernier avertissement"}. Il reste ${remaining} absence${remaining > 1 ? "s" : ""} avant le congédiement.`;
  events.push(note);
  state.journal.unshift({ week, text: note });
}

function scheduleRecreationalSparring(events = []) {
  if (!isRecreationalCareer() || state.week < RECREATIONAL_SPARRING_WEEK || state.recreationalSparringStatus === "completed" || state.scheduledFight) return;
  const partner = recreationalSparringPartner();
  const partnerView = sparringPartnerView();
  const scheduledWeek = Math.max(RECREATIONAL_SPARRING_WEEK, state.week);
  state.recreationalSparringStatus = "ready";
  state.scheduledFight = {
    id: partner.id,
    opponent: { ...partner, stats: { ...partner.stats }, weightClass: state.profile.weightClass },
    tournamentId: null,
    tournamentRound: null,
    bookingId: null,
    eventId: `recreational-sparring-${partner.id}`,
    event: { id: `recreational-sparring-${partner.id}`, name: `Sparring d’évaluation · ${partnerView.displayName}`, careerWeek: scheduledWeek },
    week: scheduledWeek,
    isRecreationalSparring: true,
    travelEffects: { energy: 0, fatigue: 0 },
    travelApplied: true,
    fightSeed: freshFightSeed(`${partner.id}-${state.profile.firstName}-${state.week}`),
  };
  const note = `Sparring d’évaluation disponible à partir de la semaine ${scheduledWeek} : ${partnerView.displayName} t’attend au GYM.`;
  events.push(note);
  state.journal.unshift({ week: state.week, text: note });
}

function render() {
  const hasFighter = Boolean(state.profile);
  document.querySelector("#creation-screen").classList.toggle("hidden", hasFighter);
  document.querySelector("#game").classList.toggle("hidden", !hasFighter);
  if (!hasFighter) {
    renderCareerWorldPreview(false);
    return;
  }
  renderLevel();
  renderFights();
  renderCareerWorldPreview(true);
  persistCareer();
  if (state.amateurPromotionPending) setTimeout(openAmateurPromotionDialog, 0);
}

function renderCareerWorldPreview(hasFighter = Boolean(state.profile)) {
  const root = document.querySelector("#career-world");
  const active = Boolean(hasFighter && window.BoxeurWorld && window.BoxeurCareerMigration);
  document.body.classList.toggle("career-preview", active);
  if (!root) return;
  root.hidden = !active;
  if (active) {
    root.innerHTML = window.BoxeurWorld.render(careerCareerView());
    const panel = root.querySelector(".career-now-panel");
    if (panel && window.BoxeurWeekView && window.BoxeurWeek) {
      const anchorCard = panel.querySelector(".career-objective-card") || panel.querySelector(".career-now-time");
      const launcher = window.BoxeurWeekView.renderLauncher(careerWeekViewContext());
      if (anchorCard) anchorCard.insertAdjacentHTML("afterend", launcher);
      else panel.insertAdjacentHTML("afterbegin", launcher);
    }
  }
}

function careerPreviewFingerprint(career = state) {
  if (!career?.profile) return "no-career";
  return JSON.stringify([
    career.profile.firstName,
    career.profile.lastName,
    career.profile.sex,
    career.profile.weightClass,
    career.careerStartDate,
    career.careerStatus,
    career.week,
    career.amateurRecord?.wins,
    career.amateurRecord?.losses,
    career.amateurRecord?.draws,
    Object.values(career.combatStats || {}).map(value => safeNumber(value, 0, 0, 99, false)),
    safeNumber(career.energy, 0, 0, 100),
    safeNumber(career.fatigue, 0, 0, 100),
    safeNumber(career.money, 0, 0, 9999999),
    safeNumber(career.gymWeeks, 0, 0, 5200),
    safeNumber(career.strengthGymWeeks, 0, 0, 5200),
    safeNumber(career.experience, 0, 0, 99999999),
    safeNumber(career.privateLessonCredits, 0, 0, 99),
    career.initialGymRequired === true,
    career.introJobRequired === true,
    safeNumber(career.initialJobLockedUntilWeek, 0, 0, 99999),
    career.jobId || null,
    safeNumber(career.jobsHeldCount, 0, 0, 999),
    safeNumber(career.jobTenureWeeks, 0, 0, 9999),
    safeNumber(career.jobWagesEarned, 0, 0, 99999999),
    safeNumber(career.vacationBankWeeks, 0, 0, MAX_PAID_VACATION_WEEKS),
    safeNumber(career.missedWorkWeeks, 0, 0, 3),
    safeNumber(career.trainingRhythmPenalty, 0, 0, 4),
    career.recoveryConsequence || null,
    safeNumber(career.jobVacationEarnedAtTenure, 0, 0, 9999),
    career.jobApplication || null,
    safeNumber(career.recreationalTrainingWeeks, 0, 0, 999),
    career.scheduledFight?.id || null,
    career.scheduledFight?.week || null,
    career.activeTournament?.id || null,
    career.activeTournament?.status || null,
    career.supplementState || null,
    career.trainerState || null,
    career.progressionState || null,
  ]);
}

function createCareerPreviewCapsule() {
  const snapshot = careerSnapshot();
  if (legacyPendingPlanForMigration.length) snapshot.weeklyPlan = cloneData(legacyPendingPlanForMigration);
  const capsule = window.BoxeurCareerMigration.migrateToCareerCapsule(snapshot, {
    seed: `preview:${careerPreviewFingerprint(state)}`,
  });
  legacyPendingPlanForMigration = [];
  capsule.previewFingerprint = careerPreviewFingerprint(state);
  capsule.previewRuntime = {
    trainingSessions: safeNumber(state.recreationalTrainingWeeks, 0, 0, 999),
    sessions: [],
    weekMode: "quick",
    weekPlanner: state.weekPlannerState ? cloneData(state.weekPlannerState) : null,
    weekPlannerSignature: null,
    weeklySummaries: [],
    weekLedgers: {},
    settledWeeks: [],
    fightGate: null,
    career: createCareerRuntimeCareer(),
  };
  return capsule;
}

function createCareerRuntimeCareer(source = state) {
  const sourceWeek = safeNumber(source.week, state.week || 1, 1, 99999);
  return {
    money: safeNumber(source.money, 0, 0, 9999999),
    gymWeeks: safeNumber(source.gymWeeks, 0, 0, 5200),
    strengthGymWeeks: safeNumber(source.strengthGymWeeks, 0, 0, 5200),
    initialGymRequired: source.initialGymRequired === true,
    jobId: typeof source.jobId === "string" ? source.jobId : null,
    introJobRequired: source.introJobRequired === true,
    initialJobLockedUntilWeek: safeNumber(source.initialJobLockedUntilWeek, source.introJobRequired ? 2 : 0, 0, 99999),
    jobsHeldCount: safeNumber(source.jobsHeldCount, 0, 0, 999),
    jobTenureWeeks: safeNumber(source.jobTenureWeeks, 0, 0, 9999),
    jobWagesEarned: safeNumber(source.jobWagesEarned, 0, 0, 99999999),
    vacationBankWeeks: safeNumber(source.vacationBankWeeks, 0, 0, MAX_PAID_VACATION_WEEKS),
    missedWorkWeeks: safeNumber(source.missedWorkWeeks, 0, 0, 3),
    trainingRhythmPenalty: safeNumber(source.trainingRhythmPenalty, 0, 0, 4),
    recoveryConsequence: normalizeRecoveryConsequence(source.recoveryConsequence),
    jobVacationEarnedAtTenure: safeNumber(source.jobVacationEarnedAtTenure, 0, 0, 9999),
    jobReferenceBonus: source.jobReferenceBonus === true,
    jobApplication: source.jobApplication && typeof source.jobApplication === "object"
      ? cloneData(source.jobApplication)
      : null,
    experience: safeNumber(source.experience, 0, 0, 99999999),
    privateLessonCredits: safeNumber(source.privateLessonCredits, 0, 0, 99),
    supplementState: window.BoxeurSupplements
      ? window.BoxeurSupplements.createState(source.supplementState || source, { weekKey: sourceWeek })
      : source.supplementState && typeof source.supplementState === "object" ? cloneData(source.supplementState) : null,
    trainerState: window.BoxeurTrainer
      ? window.BoxeurTrainer.createState(source.trainerState || {})
      : source.trainerState && typeof source.trainerState === "object" ? cloneData(source.trainerState) : null,
    weekPlannerState: source.weekPlannerState && typeof source.weekPlannerState === "object"
      ? cloneData(source.weekPlannerState)
      : null,
    progressionState: window.BoxeurProgression && source.progressionState?.kind === window.BoxeurProgression.STATE_KIND
      ? window.BoxeurProgression.createState(source.progressionState)
      : null,
  };
}

function normalizeCareerPreviewRuntime(capsule) {
  if (!capsule.previewRuntime || typeof capsule.previewRuntime !== "object") capsule.previewRuntime = {};
  const runtime = capsule.previewRuntime;
  runtime.trainingSessions = safeNumber(runtime.trainingSessions, state.recreationalTrainingWeeks, 0, 999);
  if (!Array.isArray(runtime.sessions)) runtime.sessions = [];
  runtime.weekMode = runtime.weekMode === "detailed" ? "detailed" : "quick";
  const suppliedPlanner = Object.prototype.hasOwnProperty.call(runtime, "weekPlanner")
    ? runtime.weekPlanner
    : state.weekPlannerState;
  try {
    runtime.weekPlanner = window.BoxeurWeekPlanner && suppliedPlanner?.kind === window.BoxeurWeekPlanner.STATE_KIND
      ? window.BoxeurWeekPlanner.restorePlanner(suppliedPlanner)
      : null;
  } catch (error) {
    runtime.weekPlanner = null;
  }
  runtime.weekPlannerSignature = typeof runtime.weekPlannerSignature === "string" ? runtime.weekPlannerSignature : null;
  if (!Array.isArray(runtime.weeklySummaries)) runtime.weeklySummaries = [];
  if (!runtime.weekLedgers || typeof runtime.weekLedgers !== "object" || Array.isArray(runtime.weekLedgers)) runtime.weekLedgers = {};
  if (!Array.isArray(runtime.settledWeeks)) runtime.settledWeeks = [];
  runtime.settledWeeks = [...new Set(runtime.settledWeeks.map(value => safeNumber(value, 0, 1, 99999)).filter(Boolean))].slice(-104);
  runtime.fightGate = normalizeCareerFightGate(runtime.fightGate);
  const defaults = createCareerRuntimeCareer();
  const suppliedCareer = runtime.career && typeof runtime.career === "object" ? runtime.career : {};
  let normalizedSupplementState = window.BoxeurSupplements
    ? window.BoxeurSupplements.createState(suppliedCareer.supplementState || defaults.supplementState || {}, { weekKey: capsule.timeState?.clock?.week || state.week })
    : suppliedCareer.supplementState || defaults.supplementState || null;
  // Une réservation de produit n'est jamais un état durable de l'interface :
  // préparation et séance forment une seule transaction synchrone. Si une
  // ancienne sauvegarde en contient une, elle est interrompue et remboursée.
  if (window.BoxeurSupplements && normalizedSupplementState?.activeUse) {
    normalizedSupplementState = window.BoxeurSupplements.cancelPreparedUse(normalizedSupplementState).state;
  }
  runtime.career = {
    ...defaults,
    ...suppliedCareer,
    money: safeNumber(suppliedCareer.money, defaults.money, 0, 9999999),
    gymWeeks: safeNumber(suppliedCareer.gymWeeks, defaults.gymWeeks, 0, 5200),
    strengthGymWeeks: safeNumber(suppliedCareer.strengthGymWeeks, defaults.strengthGymWeeks, 0, 5200),
    jobsHeldCount: safeNumber(suppliedCareer.jobsHeldCount, defaults.jobsHeldCount, 0, 999),
    jobTenureWeeks: safeNumber(suppliedCareer.jobTenureWeeks, defaults.jobTenureWeeks, 0, 9999),
    jobWagesEarned: safeNumber(suppliedCareer.jobWagesEarned, defaults.jobWagesEarned, 0, 99999999),
    vacationBankWeeks: safeNumber(suppliedCareer.vacationBankWeeks, defaults.vacationBankWeeks, 0, MAX_PAID_VACATION_WEEKS),
    missedWorkWeeks: safeNumber(suppliedCareer.missedWorkWeeks, defaults.missedWorkWeeks, 0, 3),
    trainingRhythmPenalty: safeNumber(suppliedCareer.trainingRhythmPenalty, defaults.trainingRhythmPenalty, 0, 4),
    recoveryConsequence: normalizeRecoveryConsequence(suppliedCareer.recoveryConsequence || defaults.recoveryConsequence),
    jobVacationEarnedAtTenure: safeNumber(suppliedCareer.jobVacationEarnedAtTenure, defaults.jobVacationEarnedAtTenure, 0, 9999),
    jobReferenceBonus: suppliedCareer.jobReferenceBonus == null ? defaults.jobReferenceBonus : suppliedCareer.jobReferenceBonus === true,
    jobApplication: suppliedCareer.jobApplication && jobs.some(job => job.id === suppliedCareer.jobApplication.jobId)
      ? {
          jobId: suppliedCareer.jobApplication.jobId,
          progress: safeNumber(suppliedCareer.jobApplication.progress, 0, 0, 3),
          requiredWeeks: safeNumber(
            suppliedCareer.jobApplication.requiredWeeks,
            jobs.find(job => job.id === suppliedCareer.jobApplication.jobId)?.interviewWeeks || 1,
            1,
            3,
          ),
          appliedWeek: safeNumber(suppliedCareer.jobApplication.appliedWeek, capsule.timeState?.clock?.week || state.week, 1, 99999),
        }
      : null,
    experience: safeNumber(suppliedCareer.experience, defaults.experience, 0, 99999999),
    privateLessonCredits: safeNumber(suppliedCareer.privateLessonCredits, defaults.privateLessonCredits, 0, 99),
    initialGymRequired: suppliedCareer.initialGymRequired == null ? defaults.initialGymRequired : suppliedCareer.initialGymRequired === true,
    introJobRequired: suppliedCareer.introJobRequired == null ? defaults.introJobRequired : suppliedCareer.introJobRequired === true,
    initialJobLockedUntilWeek: safeNumber(suppliedCareer.initialJobLockedUntilWeek, defaults.initialJobLockedUntilWeek, 0, 99999),
    jobId: typeof suppliedCareer.jobId === "string" ? suppliedCareer.jobId : null,
    supplementState: normalizedSupplementState,
    trainerState: window.BoxeurTrainer
      ? window.BoxeurTrainer.createState(suppliedCareer.trainerState || defaults.trainerState || {})
      : suppliedCareer.trainerState || defaults.trainerState || null,
    progressionState: window.BoxeurProgression && suppliedCareer.progressionState?.kind === window.BoxeurProgression.STATE_KIND
      ? window.BoxeurProgression.createState(suppliedCareer.progressionState)
      : defaults.progressionState,
  };
  return runtime;
}

function invalidateCareerPreviewCapsule() {
  careerCapsule = null;
  try {
    removeStoredValues([CAREER_RUNTIME_SAVE_KEY, ...LEGACY_CAREER_RUNTIME_SAVE_KEYS]);
  } catch (error) {
    console.warn("[Boxeur Deux] Données d’exécution impossibles à invalider :", error);
  }
}

function ensureCareerPreviewCapsule() {
  if (!state.profile || !window.BoxeurCareerMigration) return null;
  if (careerCapsule?.previewFingerprint === careerPreviewFingerprint(state)) {
    legacyPendingPlanForMigration = [];
    return careerCapsule;
  }
  try {
    const storedValue = readStoredJson(CAREER_RUNTIME_SAVE_KEY, LEGACY_CAREER_RUNTIME_SAVE_KEYS);
    const stored = storedValue?.value || null;
    if (window.BoxeurCareerMigration.isCareerCapsule(stored) && stored.previewFingerprint === careerPreviewFingerprint(state)) {
      careerCapsule = window.BoxeurCareerMigration.migrateToCareerCapsule(stored);
    } else {
      careerCapsule = createCareerPreviewCapsule();
    }
  } catch (error) {
    console.warn("[Boxeur Deux] Données d’exécution recréées :", error);
    careerCapsule = createCareerPreviewCapsule();
  }
  normalizeCareerPreviewRuntime(careerCapsule);
  legacyPendingPlanForMigration = [];
  persistCareerPreviewCapsule();
  return careerCapsule;
}

function syncCareerCapsuleToCareer(capsule) {
  if (!capsule?.timeState?.clock || !state.profile) return;
  const runtime = normalizeCareerPreviewRuntime(capsule);
  const career = runtime.career;
  state.week = safeNumber(capsule.timeState.clock.week, state.week, 1, 99999);
  state.money = safeNumber(career.money, state.money, 0, 9999999);
  state.energy = Math.round(safeNumber(capsule.timeState.condition?.energy, state.energy, 0, 100));
  state.fatigue = Math.round(safeNumber(capsule.timeState.condition?.fatigue, state.fatigue, 0, 100));
  state.gymWeeks = safeNumber(career.gymWeeks, state.gymWeeks, 0, 5200);
  state.strengthGymWeeks = safeNumber(career.strengthGymWeeks, state.strengthGymWeeks, 0, 5200);
  state.initialGymRequired = career.initialGymRequired === true;
  state.jobId = typeof career.jobId === "string" ? career.jobId : null;
  state.introJobRequired = career.introJobRequired === true;
  state.initialJobLockedUntilWeek = safeNumber(career.initialJobLockedUntilWeek, state.initialJobLockedUntilWeek, 0, 99999);
  state.jobsHeldCount = safeNumber(career.jobsHeldCount, state.jobsHeldCount, 0, 999);
  state.jobTenureWeeks = safeNumber(career.jobTenureWeeks, state.jobTenureWeeks, 0, 9999);
  state.jobWagesEarned = safeNumber(career.jobWagesEarned, state.jobWagesEarned, 0, 99999999);
  state.vacationBankWeeks = safeNumber(career.vacationBankWeeks, state.vacationBankWeeks, 0, MAX_PAID_VACATION_WEEKS);
  state.missedWorkWeeks = safeNumber(career.missedWorkWeeks, state.missedWorkWeeks, 0, 3);
  state.trainingRhythmPenalty = safeNumber(career.trainingRhythmPenalty, state.trainingRhythmPenalty, 0, 4);
  state.recoveryConsequence = normalizeRecoveryConsequence(career.recoveryConsequence);
  state.jobVacationEarnedAtTenure = safeNumber(career.jobVacationEarnedAtTenure, state.jobVacationEarnedAtTenure, 0, 9999);
  state.jobReferenceBonus = career.jobReferenceBonus === true;
  state.jobApplication = career.jobApplication ? cloneData(career.jobApplication) : null;
  state.experience = safeNumber(career.experience, state.experience, 0, 99999999);
  state.privateLessonCredits = safeNumber(career.privateLessonCredits, state.privateLessonCredits, 0, 99);
  Object.keys(combatLabels).forEach(key => {
    state.combatStats[key] = safeNumber(capsule.timeState.stats?.[key], state.combatStats[key], 0, 99, false);
  });
  state.supplementState = career.supplementState ? cloneData(career.supplementState) : null;
  state.trainerState = career.trainerState ? cloneData(career.trainerState) : null;
  state.weekPlannerState = runtime.weekPlanner ? cloneData(runtime.weekPlanner) : null;
  state.progressionState = career.progressionState ? cloneData(career.progressionState) : null;
  state.recreationalTrainingWeeks = safeNumber(runtime.trainingSessions, state.recreationalTrainingWeeks, 0, 999);
  syncLevelProgress();
  career.money = state.money;
  career.privateLessonCredits = state.privateLessonCredits;
  career.supplementState = state.supplementState ? cloneData(state.supplementState) : null;
  if (state.careerStatus === "recreational") scheduleRecreationalSparring([]);
  capsule.previewFingerprint = careerPreviewFingerprint(state);
}

function persistCareerPreviewCapsule() {
  if (!careerCapsule) return;
  syncCareerCapsuleToCareer(careerCapsule);
  try {
    localStorage.setItem(CAREER_RUNTIME_SAVE_KEY, JSON.stringify(careerCapsule));
    persistCareer();
  } catch (error) {
    console.warn("[Boxeur Deux] Données d’exécution non enregistrées :", error);
  }
}

function careerOnboardingSnapshot(capsule = ensureCareerPreviewCapsule()) {
  if (!capsule?.timeState?.clock || !window.BoxeurOnboarding) return null;
  const runtime = normalizeCareerPreviewRuntime(capsule);
  const career = runtime.career;
  const previous = window.BoxeurOnboarding.isOnboardingState(runtime.onboardingState)
    ? runtime.onboardingState
    : null;
  const source = previous
    ? {
        ...previous,
        careerStatus: state.careerStatus,
        week: capsule.timeState.clock.week,
        initialJob: {
          ...previous.initialJob,
          selected: career.jobsHeldCount > 0 || Boolean(career.jobId),
          currentJobId: career.jobId,
        },
        initialGym: {
          ...previous.initialGym,
          purchased: previous.initialGym?.purchased === true || career.initialGymRequired === false,
          active: career.gymWeeks > 0,
          remainingWeeks: career.gymWeeks,
        },
        trainingWeeks: runtime.trainingSessions,
        remyStatus: state.recreationalSparringStatus === "completed" ? "completed" : previous.remyStatus,
      }
    : {
        careerStatus: state.careerStatus,
        week: capsule.timeState.clock.week,
        jobId: career.jobId,
        jobsHeldCount: career.jobsHeldCount,
        gymWeeks: career.gymWeeks,
        introJobRequired: career.introJobRequired,
        initialGymRequired: career.initialGymRequired,
        onboardingRequired: career.introJobRequired || career.initialGymRequired,
        recreationalTrainingWeeks: runtime.trainingSessions,
        recreationalSparringStatus: state.recreationalSparringStatus,
        careerDeveloperTest: { active: isDeveloperTestActive() },
      };
  runtime.onboardingState = window.BoxeurOnboarding.normalizeState(source, {
    developerMode: isDeveloperTestActive(),
  });
  return runtime.onboardingState;
}

function careerOnboardingView(capsule = ensureCareerPreviewCapsule()) {
  const onboarding = careerOnboardingSnapshot(capsule);
  if (!onboarding || !window.BoxeurOnboarding) return null;
  const partner = sparringPartnerView();
  const baseStep = window.BoxeurOnboarding.getCurrentStep(onboarding);
  const plannerState = capsule?.previewRuntime?.weekPlanner;
  const plannerEntries = Array.isArray(plannerState?.entries)
    ? plannerState.entries
    : [];
  const career = capsule?.previewRuntime?.career || {};
  const entryFor = (activityId, predicate = () => true) => plannerEntries.find(entry => (
    entry?.activityId === activityId && predicate(entry)
  ));
  const quickGroupClass = entryFor("group-class", entry => entry.source === "quick");
  const quickRest = entryFor("rest", entry => entry.source === "quick");
  const homeTraining = entryFor("home-quick");
  const roadwork = entryFor("roadwork-short");
  const rest = entryFor("rest");
  const work = plannerEntries.find(entry => entry?.source === "work");
  const reviewStep = (id, title, detail) => ({
    id,
    type: "review-week",
    title,
    detail,
    locationId: "map",
    required: false,
    actionMode: "review-and-confirm",
  });
  const firstGroupClassPlanned = onboarding.mode === "guided"
    && onboarding.week === 1
    && baseStep?.id === "week-1-first-session"
    && plannerEntries.some(entry => entry?.activityId === "group-class");
  const firstRestPlanned = firstGroupClassPlanned
    && plannerEntries.some(entry => entry?.activityId === "rest");
  let step = firstGroupClassPlanned && !firstRestPlanned
    ? {
        id: "week-1-add-rest",
        type: "recovery",
        title: "Prévoir une journée de repos",
        detail: "Va à la maison et ajoute une journée de repos pour apprendre à équilibrer entraînement et récupération.",
        locationId: "home",
        required: false,
      }
    : firstGroupClassPlanned
    ? {
        id: "week-1-review-program",
        type: "review-week",
        title: "Ta première séance est planifiée",
        detail: "Rien n’est encore appliqué. Vérifie ton programme, puis confirme la semaine lorsque tu es satisfait de tes choix.",
        locationId: "map",
        required: false,
        actionMode: "review-and-confirm",
      }
    : baseStep;

  if (onboarding.mode === "guided" && baseStep?.id === "week-2-follow-plan") {
    step = quickGroupClass && quickRest
      ? reviewStep(
          "week-2-review-program",
          "Ton plan rapide est prêt",
          "Le travail, le cours récréatif et le repos sont visibles avant leur exécution. Ouvre le programme pour le vérifier, puis confirme la semaine.",
        )
      : {
          ...baseStep,
          type: "plan-quick",
          actionMode: "quick-plan",
        };
  }

  if (onboarding.mode === "guided" && baseStep?.id === "week-3-training-priority") {
    if (!quickGroupClass || !quickRest) {
      step = {
        ...baseStep,
        id: "week-3-prepare-quick-plan",
        type: "plan-quick",
        title: "Préparer le point de départ",
        detail: "Commence par le plan rapide. Tu modifieras ensuite ce programme pour créer une semaine avec davantage d’entraînement.",
        actionMode: "quick-plan",
      };
    } else if (work) {
      step = {
        ...baseStep,
        id: "week-3-skip-work",
        type: "work-priority",
        title: "Libérer du temps d’entraînement",
        detail: "Retire exceptionnellement le travail de cette semaine. Cette décision libère de la capacité, mais tu ne recevras aucune paie et ton employeur enregistrera une première absence.",
        locationId: "work",
      };
    } else if (!homeTraining) {
      step = {
        ...baseStep,
        id: "week-3-add-home-training",
        type: "home-training",
        title: "Ajouter un deuxième entraînement",
        detail: "La capacité libérée permet maintenant d’ajouter l’entraînement maison rapide sans retirer le cours récréatif ni la journée de repos.",
        locationId: "home",
      };
    } else {
      step = reviewStep(
        "week-3-review-program",
        "Ta semaine priorise l’entraînement",
        "Le cours récréatif et l’entraînement maison sont prévus. Le travail est absent : la paie et l’assiduité seront réellement touchées à la confirmation.",
      );
    }
  }

  if (onboarding.mode === "guided" && baseStep?.id === "week-4-roadwork") {
    if (!roadwork) {
      step = {
        ...baseStep,
        id: "week-4-add-roadwork",
        type: "roadwork",
        title: "Tester la course",
        detail: "Ouvre le menu Course par la porte, puis ajoute le court jog à ta semaine. C’est la seule sortie disponible pendant le parcours récréatif.",
        locationId: "home",
      };
    } else if (!rest) {
      step = {
        ...baseStep,
        id: "week-4-add-recovery",
        type: "recovery",
        title: "Prévoir l’assimilation",
        detail: "Le court jog dépense de l’énergie et crée de la fatigue. Ajoute une journée de repos pour apprendre comment la récupération aide le boxeur à assimiler ce travail.",
        locationId: "home",
      };
    } else {
      step = reviewStep(
        "week-4-review-program",
        "Course et récupération sont planifiées",
        "Le court jog et la journée de repos seront appliqués par le même moteur de semaine.",
      );
    }
  }

  if (onboarding.mode === "guided" && baseStep?.id === "week-5-renew-and-prepare") {
    if (Number(career.gymWeeks || 0) <= 0) {
      step = {
        ...baseStep,
        id: "week-5-renew-membership",
        type: "membership-renewal",
        title: "Renouveler l’abonnement au GYM",
        detail: `Les quatre semaines du premier mois sont terminées. Choisis et paie réellement un nouveau forfait pour reprendre le cours récréatif et conserver l’accès à ${partner.firstName}.`,
        locationId: "boxing-gym",
      };
    } else if (!quickGroupClass || !quickRest) {
      step = {
        ...baseStep,
        id: "week-5-prepare-quick-plan",
        type: "plan-quick",
        title: `Préparer la semaine avant ${partner.firstName}`,
        detail: "Ton abonnement est actif. Suis un dernier plan rapide : il conservera le travail et ajoutera le cours récréatif avec une journée de repos.",
        locationId: "map",
        actionMode: "quick-plan",
      };
    } else {
      step = reviewStep(
        "week-5-review-program",
        `Dernière semaine avant ${partner.firstName}`,
        `Ton abonnement est actif et le cours récréatif est prévu avec du repos. Confirme cette semaine; ${partner.firstName} deviendra accessible seulement à la semaine 6.`,
      );
    }
  }
  if (step?.type === "sparring") {
    step = {
      ...step,
      title: `Sparring avec ${partner.displayName}`,
      detail: `Une évaluation pédagogique interactive contre ${partner.firstName}, sans gagnant ni défaite au bilan.`,
      sparringPartner: partner,
    };
  }
  return {
    state: onboarding,
    gates: window.BoxeurOnboarding.getGates(onboarding),
    step,
  };
}

function careerCompletedOnboardingObjectiveId(onboarding, plannerEntries, executedEntryIds) {
  if (!onboarding?.state || onboarding.state.mode !== "guided" || !window.BoxeurOnboarding) return null;
  const objective = window.BoxeurOnboarding.getCurrentStep(onboarding.state);
  if (objective?.type !== "objective" || onboarding.state.completedObjectiveIds.includes(objective.id)) return null;
  const executed = plannerEntries.filter(entry => executedEntryIds.has(entry.id));
  const hasExecuted = (activityId, predicate = () => true) => executed.some(entry => (
    entry.activityId === activityId && predicate(entry)
  ));
  const completed = {
    "week-1-first-session": () => hasExecuted("group-class"),
    "week-2-follow-plan": () => (
      hasExecuted("group-class", entry => entry.source === "quick")
      && hasExecuted("rest", entry => entry.source === "quick")
    ),
    "week-3-training-priority": () => (
      hasExecuted("group-class", entry => entry.source === "quick")
      && hasExecuted("home-quick")
      && !hasExecuted("work")
    ),
    "week-4-roadwork": () => (
      hasExecuted("roadwork-short")
      && hasExecuted("rest")
    ),
    "week-5-renew-and-prepare": () => (
      onboarding.state.initialGym.active
      && hasExecuted("group-class", entry => entry.source === "quick")
      && hasExecuted("rest", entry => entry.source === "quick")
    ),
  }[objective.id];
  return completed?.() ? objective.id : null;
}

function applyCareerOnboardingEvent(event) {
  const capsule = ensureCareerPreviewCapsule();
  const onboarding = careerOnboardingSnapshot(capsule);
  if (!capsule || !onboarding || !window.BoxeurOnboarding) return null;
  const next = window.BoxeurOnboarding.applyEvent(onboarding, event);
  normalizeCareerPreviewRuntime(capsule).onboardingState = next;
  return next;
}

function careerProgressionSnapshot(capsule = ensureCareerPreviewCapsule()) {
  if (!capsule?.timeState?.stats || !window.BoxeurProgression) return null;
  const runtime = normalizeCareerPreviewRuntime(capsule);
  const previous = runtime.career.progressionState?.kind === window.BoxeurProgression.STATE_KIND
    ? runtime.career.progressionState
    : null;
  const integerStats = {};
  const progress = {};
  window.BoxeurProgression.STAT_KEYS.forEach(key => {
    const raw = safeNumber(capsule.timeState.stats[key], state.combatStats[key], 0, 99);
    integerStats[key] = Math.floor(raw);
    const skillXp = window.BoxeurTime?.statXpProgress
      ? window.BoxeurTime.statXpProgress(capsule.timeState, key)
      : null;
    progress[key] = skillXp
      ? Math.round((skillXp.total - skillXp.currentFloor) / Math.max(1, skillXp.nextThreshold - skillXp.currentFloor) * 10000) / 100
      : previous?.stats?.[key] === integerStats[key]
        ? safeNumber(previous.progress?.[key], 0, 0, 100)
        : 0;
  });
  runtime.career.progressionState = window.BoxeurProgression.createState({
    stats: integerStats,
    progress,
    stimulus: capsule.timeState.stimulus,
    stimulusReserve: previous?.stimulusReserve,
    weeklyLoad: previous?.weeklyLoad,
    assimilationIds: previous?.assimilationIds,
  });
  return window.BoxeurProgression.getPublicState(runtime.career.progressionState);
}

function careerPreparationView(timeState) {
  if (!timeState || !window.BoxeurTime) return null;
  const base = window.BoxeurTime.getPreparation(timeState);
  const tone = base.status === "excellent" || base.status === "good"
    ? "positive"
    : base.status === "fair" ? "steady" : base.status === "fragile" ? "warning" : "critical";
  return { ...base, tone, detail: base.reasons.join(" · ") };
}

function careerCareerView() {
  const capsule = ensureCareerPreviewCapsule();
  if (!capsule?.timeState) return state;
  const timeState = capsule.timeState;
  const runtime = normalizeCareerPreviewRuntime(capsule);
  const runtimeCareer = runtime.career;
  const workStatus = careerWorkStatus(timeState, runtimeCareer);
  const onboarding = careerOnboardingView(capsule);
  const currentDate = window.BoxeurCalendar && state.calendar?.epoch
    ? window.BoxeurCalendar.dateForCareerWeek(state.calendar.epoch, timeState.clock.week, timeState.clock.dayIndex)
    : null;
  return {
    ...state,
    ...runtimeCareer,
    week: timeState.clock.week,
    energy: Math.round(timeState.condition.energy),
    fatigue: Math.round(timeState.condition.fatigue),
    combatStats: { ...state.combatStats, ...timeState.stats },
    recreationalTrainingWeeks: safeNumber(runtime.trainingSessions, state.recreationalTrainingWeeks, 0, 999),
    careerClock: cloneData(timeState.clock),
    careerAppointments: window.BoxeurTime ? window.BoxeurTime.getAgenda(timeState) : [],
    careerFightGate: runtime.fightGate ? cloneData(runtime.fightGate) : null,
    careerDateLabel: currentDate ? formatCareerDate(currentDate) : "Date inconnue",
    careerPreparation: careerPreparationView(timeState),
    careerOnboarding: onboarding?.state || null,
    careerOnboardingStep: onboarding?.step || null,
    careerSparringPartner: sparringPartnerView(),
    careerJob: jobs.find(job => job.id === runtimeCareer.jobId) || null,
    ...workStatus,
    careerDeveloperTest: {
      active: isDeveloperTestActive(),
      canReturn: hasDeveloperReturnCareer(),
      profileLabel: [state.profile?.firstName, state.profile?.lastName].filter(Boolean).join(" "),
    },
  };
}

function careerWorkLocationContext() {
  const career = careerCareerView();
  const capsule = ensureCareerPreviewCapsule();
  const plannerState = capsule ? ensureCareerWeekPlanner(capsule) : null;
  const workEntry = plannerState?.entries?.find(entry => entry.source === "work") || null;
  const paidVacationPlanned = workEntry?.metadata?.paidVacation === true;
  const job = jobs.find(item => item.id === career.jobId) || null;
  const workAccess = capsule && job ? careerPlannerWorkAccess(capsule, job) : { available: false, reason: "" };
  const vacationBankWeeks = safeNumber(career.vacationBankWeeks, 0, 0, MAX_PAID_VACATION_WEEKS);
  const vacationTenureWeeks = safeNumber(career.jobTenureWeeks, 0, 0, 99999);
  const vacationEarnedAtTenure = safeNumber(career.jobVacationEarnedAtTenure, 0, 0, 99999);
  const nextVacationAtTenure = vacationEarnedAtTenure
    ? vacationEarnedAtTenure + PAID_VACATION_INTERVAL_WEEKS
    : FIRST_PAID_VACATION_WEEKS;
  return {
    ...career,
    careerJobOffers: jobs.map(job => ({
      id: job.id,
      title: job.title,
      wage: job.wage,
      schedule: job.schedule,
      interviewWeeks: job.interviewWeeks,
      energy: job.energy,
      fatigue: job.fatigue,
      weekCapacityCost: careerPlannerWorkCost(job),
      detail: job.detail,
    })),
    careerJobApplicationLabel: jobs.find(job => job.id === career.jobApplication?.jobId)?.title || "",
    careerWorkPlan: {
      planned: Boolean(workEntry && !paidVacationPlanned),
      available: Boolean((workEntry && !paidVacationPlanned) || workAccess.available),
      reason: workEntry && !paidVacationPlanned ? "" : (plannerState?.workBlockedReason || workAccess.reason || ""),
      entryId: workEntry?.id || null,
      cost: safeNumber(workEntry?.capacityCost, careerPlannerWorkCost(career.careerJob), 0, 100),
    },
    careerVacation: {
      bankWeeks: vacationBankWeeks,
      maxBankWeeks: MAX_PAID_VACATION_WEEKS,
      tenureWeeks: vacationTenureWeeks,
      nextAtTenure: nextVacationAtTenure,
      nextInWeeks: vacationBankWeeks >= MAX_PAID_VACATION_WEEKS
        ? null
        : Math.max(0, nextVacationAtTenure - vacationTenureWeeks),
      firstAtWeeks: FIRST_PAID_VACATION_WEEKS,
      intervalWeeks: PAID_VACATION_INTERVAL_WEEKS,
      planned: paidVacationPlanned,
      available: Boolean(job && vacationBankWeeks > 0),
      weeklyPay: job?.wage || 0,
    },
  };
}

function careerGymContext() {
  const capsule = ensureCareerPreviewCapsule();
  if (!capsule?.timeState || !window.BoxeurTraining || !window.BoxeurTime) return null;
  const career = careerCareerView();
  const prep = careerPreparationView(capsule.timeState);
  const trainingContext = careerTrainingContext();
  const coachSession = window.BoxeurTraining.buildCoachSession(capsule.timeState, trainingContext);
  const coachPreview = window.BoxeurTraining.previewSession(capsule.timeState, coachSession, trainingContext);
  const runtime = normalizeCareerPreviewRuntime(capsule);
  const activeTrainerProgram = window.BoxeurTrainer && runtime.career.trainerState
    ? window.BoxeurTrainer.getPublicState(runtime.career.trainerState).activeProgram
    : null;
  const boxingTrainerProgram = activeTrainerProgram && ["technique", "defense"].includes(activeTrainerProgram.target)
    ? activeTrainerProgram
    : null;
  const plannerState = ensureCareerWeekPlanner(capsule);
  const plannerPreview = window.BoxeurWeekPlanner.previewPlan(plannerState);
  const coachPlannerId = state.careerStatus === "recreational" ? "group-class" : "boxing-coach";
  const coachPlanState = careerPlannerActionState(coachPlannerId);
  const immediateAmateurSparring = state.careerStatus === "amateur";
  const baseSparringPlanState = careerPlannerActionState("sparring", { immediate: immediateAmateurSparring });
  const sparringEntry = plannerState.entries.find(entry => !entry.preReserved && entry.activityId === "sparring") || null;
  const sparringCompleted = sparringEntry?.metadata?.completed === true;
  const sparringFightWeek = immediateAmateurSparring && isCareerOfficialFightWeek(capsule);
  const sparringPlanState = immediateAmateurSparring
    ? {
      ...baseSparringPlanState,
      available: !sparringCompleted && !sparringFightWeek && (Boolean(sparringEntry) || baseSparringPlanState.available),
      reason: sparringFightWeek
        ? "Le sparring n’est pas disponible pendant une semaine de combat officiel."
        : sparringCompleted
          ? "Ce sparring a déjà été fait cette semaine."
          : baseSparringPlanState.reason,
      planned: Boolean(sparringEntry && !sparringCompleted),
      completed: sparringCompleted,
      entryId: sparringEntry?.id || baseSparringPlanState.entryId,
      immediate: true,
      fightWeek: sparringFightWeek,
      cost: 18,
    }
    : { ...baseSparringPlanState, immediate: false, completed: sparringCompleted, fightWeek: false };
  const membershipMissing = career.gymWeeks <= 0;
  const conditionAccess = careerConditionActivityAccess(coachPlannerId, capsule);
  const trainingBlocked = membershipMissing || !conditionAccess.available || plannerPreview.capacity.remaining <= 0;
  const trainingBlockedReason = membershipMissing
      ? "Inscription requise : passe à l’accueil. Le sac au sous-sol demeure accessible comme dépannage."
      : !conditionAccess.available
        ? conditionAccess.reason
        : "La barre d’énergie de la semaine est vide. Retire une activité du programme pour en ajouter une autre.";
  return {
    profile: state.profile,
    careerStatus: state.careerStatus,
    careerStatusLabel: state.careerStatus === "professional" ? "Professionnel" : state.careerStatus === "amateur" ? "Amateur" : "Récréatif",
    clock: {
      ...capsule.timeState.clock,
      dateLabel: career.careerDateLabel,
    },
    condition: {
      preparationLabel: prep.label,
      preparationDetail: prep.detail,
      preparationTone: prep.tone,
      energy: capsule.timeState.condition.energy,
      fatigue: capsule.timeState.condition.fatigue,
      availableMinutes: 90,
      trainingBlocked,
      trainingBlockedReason,
    },
    coach: {
      name: "l’entraîneur du GYM",
      sessionTitle: state.careerStatus === "recreational" ? "Cours de groupe · fondamentaux" : coachSession.label,
      sessionSummary: coachSession.blocks.map(block => block.label).join(" · "),
      durationMinutes: coachPreview.totals?.durationMinutes || 0,
      available: coachPlanState.planned === true || (coachPreview.ok && !trainingBlocked && coachPlanState.available),
      planned: coachPlanState.planned === true,
      plannedCount: safeNumber(coachPlanState.plannedCount, 0, 0, 2),
      notice: trainingBlocked
        ? trainingBlockedReason
        : !coachPlanState.available
          ? coachPlanState.reason
        : coachPreview.ok
          ? `Ajout au programme · ${plannerPreview.capacity.remaining}/${plannerPreview.capacity.total} de capacité hebdomadaire disponible. ${coachSession.tradeoff}`
          : coachPreview.reason,
    },
    privateTrainer: {
      available: career.gymWeeks > 0 && state.careerStatus !== "recreational",
      active: Boolean(boxingTrainerProgram),
      name: boxingTrainerProgram?.trainerLabel || "Entraîneur privé",
      detail: boxingTrainerProgram
        ? `${boxingTrainerProgram.sessionsCompleted}/${boxingTrainerProgram.sessionsTotal} séances · ${combatLabels[boxingTrainerProgram.target]}`
        : "Programme ciblé en technique ou en défense, payé pour quatre séances.",
      actionLabel: boxingTrainerProgram ? "Continuer le programme privé" : "Choisir un entraîneur privé",
    },
    membership: {
      active: career.gymWeeks > 0,
      label: career.gymWeeks > 0 ? `Abonnement actif · ${career.gymWeeks} sem.` : "Inscription requise",
      detail: career.gymWeeks > 0 ? "Les installations et la séance du coach sont accessibles." : "Inscris-toi à l’accueil avant de commencer une séance.",
      monthlyPrice: GYM_PRICE,
      balance: career.money,
    },
    recreational: {
      trainingWeeks: capsule.previewRuntime.trainingSessions,
      targetWeeks: RECREATIONAL_SPARRING_WEEK,
      sparringWeek: 6,
      partner: sparringPartnerView(),
      remyStatus: career.careerOnboarding?.remyStatus === "completed" || state.recreationalSparringStatus === "completed"
        ? "completed"
        : career.careerOnboarding?.remyStatus === "ready" || state.recreationalSparringStatus === "ready"
          ? "ready"
          : state.scheduledFight?.isRecreationalSparring ? "scheduled" : "locked",
      remyDetail: career.careerOnboardingStep?.type === "sparring" ? career.careerOnboardingStep.detail : "",
    },
    weekCapacity: {
      total: plannerPreview.capacity.total,
      used: plannerPreview.capacity.used,
      remaining: plannerPreview.capacity.remaining,
    },
    weekPlan: {
      entries: careerPlannerLocationEntries(plannerState, "boxing-gym"),
    },
    sparring: sparringPlanState,
  };
}

function careerArenaContext() {
  const capsule = ensureCareerPreviewCapsule();
  const career = careerCareerView();
  const fightGate = capsule ? careerFightGate(capsule) : null;
  const currentWeek = Number(career.week || state.week || 1);
  const preparation = capsule?.timeState ? careerPreparationView(capsule.timeState) : window.BoxeurWorld?.preparation?.(career);
  const officialFight = state.scheduledFight
    && !state.scheduledFight.isPracticeSparring
    && !state.scheduledFight.isRecreationalSparring
    && !state.scheduledFight.isDeveloperBout
      ? state.scheduledFight
      : null;
  const activeTournament = state.activeTournament && typeof state.activeTournament === "object" ? state.activeTournament : null;
  const tournamentBooking = activeBookings()
    .filter(booking => booking.event?.kind === "tournament")
    .sort((left, right) => Number(left.event?.careerWeek || 99999) - Number(right.event?.careerWeek || 99999))[0] || null;

  const venueLabel = event => [event?.venue?.name, event?.venue?.city, event?.venue?.region].filter(Boolean).join(" · ") || "Aréna de quartier";
  const dateLabel = event => event?.startDate ? formatCareerDate(event.startDate, { long: true }) : "Date à confirmer";
  let arenaEvent = null;

  if (activeTournament) {
    const booking = activeBookings().find(item => item.id === activeTournament.bookingId) || tournamentBooking;
    const event = booking?.event || state.calendar?.events?.find(item => item.id === activeTournament.eventId) || null;
    const totalRounds = activeTournament.opponents?.length || tournamentDefs.find(item => item.id === activeTournament.id)?.rounds || 3;
    const currentRound = safeNumber(activeTournament.currentRound, 0, 0, Math.max(0, totalRounds - 1));
    const tournamentFight = officialFight?.tournamentId === activeTournament.id ? officialFight : null;
    arenaEvent = {
      kind: "tournament",
      state: activeTournament.status === "completed"
        ? "completed"
        : fightGate?.status === "ready" ? (activeTournament.currentRound > 0 ? "active" : "ready")
          : currentWeek >= Number(activeTournament.startWeek) ? "due" : "future",
      name: activeTournament.name || event?.name || "Tournoi amateur",
      week: activeTournament.startWeek,
      dateLabel: dateLabel(event),
      venue: venueLabel(event),
      roundLabel: roundName(totalRounds, currentRound),
      remaining: Math.max(0, totalRounds - currentRound),
      opponent: tournamentFight?.opponent || activeTournament.opponents?.[currentRound] || null,
    };
  } else {
    const galaCandidate = officialFight ? {
      kind: "gala",
      state: fightGate?.status === "ready" && fightGate.kind === "gala"
        ? "ready"
        : currentWeek >= Number(officialFight.week) ? "due" : "future",
      name: officialFight.event?.name || "Gala amateur",
      week: officialFight.week,
      dateLabel: dateLabel(officialFight.event),
      venue: venueLabel(officialFight.event),
      opponent: officialFight.opponent || null,
    } : null;
    const tournamentCandidate = tournamentBooking ? {
      kind: "tournament",
      state: fightGate?.status === "ready" && fightGate.kind === "tournament"
        ? "ready"
        : currentWeek >= Number(tournamentBooking.event?.careerWeek) ? "due" : "future",
      name: tournamentBooking.event?.name || "Tournoi amateur",
      week: tournamentBooking.event?.careerWeek,
      dateLabel: dateLabel(tournamentBooking.event),
      venue: venueLabel(tournamentBooking.event),
      opponent: null,
    } : null;
    arenaEvent = [galaCandidate, tournamentCandidate]
      .filter(Boolean)
      .sort((left, right) => Number(left.week || 99999) - Number(right.week || 99999))[0] || null;
  }

  return {
    profile: state.profile,
    careerStatusLabel: state.careerStatus === "professional" ? "Professionnel" : state.careerStatus === "amateur" ? "Amateur" : "Récréatif",
    clock: {
      ...(capsule?.timeState?.clock || career.careerClock || {}),
      week: currentWeek,
      dateLabel: career.careerDateLabel,
    },
    condition: {
      preparationLabel: preparation?.label || "Correcte",
      preparationDetail: preparation?.detail || "Garde un œil sur ton énergie avant le prochain combat.",
      preparationTone: preparation?.tone || "steady",
      energy: capsule?.timeState?.condition?.energy ?? career.energy,
      fatigue: capsule?.timeState?.condition?.fatigue ?? career.fatigue,
    },
    event: arenaEvent,
  };
}

function openCareerArenaFromCalendar() {
  closeCalendarDialog();
  renderCareerWorldPreview(true);
  openCareerLocation("arena");
}

function handleCareerArenaAction() {
  const capsule = ensureCareerPreviewCapsule();
  const gate = capsule ? careerFightGate(capsule) : null;
  const dueEvent = careerOfficialEventDue(careerCareerView());
  if (!gate) {
    if (dueEvent) {
      openCareerWeekPlan();
      showToast("Confirme d’abord ta semaine; le combat s’ouvrira ensuite ici.");
      return;
    }
    openCalendarDialog();
    return;
  }
  if (gate.kind === "tournament") {
    const active = ensureDueTournamentActive();
    if (!active) {
      showToast("Le tournoi réservé n’est plus disponible.");
      return;
    }
    closeCareerLocation();
    openTournamentBoard();
    return;
  }
  const scheduled = state.scheduledFight;
  const sameEvent = !gate.eventId || [scheduled?.eventId, scheduled?.id].includes(gate.eventId);
  if (!scheduled
    || scheduled.isPracticeSparring
    || scheduled.isRecreationalSparring
    || scheduled.isDeveloperBout
    || Number(scheduled.week) > Number(state.week)
    || !sameEvent) {
    showToast("Le combat réservé n’est plus disponible.");
    return;
  }
  closeCareerLocation();
  startFight();
}

function careerReservedBoxingGymBudget(career = careerCareerView()) {
  return career.initialGymRequired && career.gymWeeks <= 0 ? GYM_PRICE : 0;
}

function careerStrengthContext() {
  const capsule = ensureCareerPreviewCapsule();
  if (!capsule?.timeState || !window.BoxeurStrength || !window.BoxeurStrengthView) return null;
  const runtime = normalizeCareerPreviewRuntime(capsule);
  const career = careerCareerView();
  const trainerProgram = window.BoxeurTrainer && runtime.career.trainerState
    ? window.BoxeurTrainer.getPublicState(runtime.career.trainerState).activeProgram
    : null;
  const strengthProgram = trainerProgram && ["power", "cardio"].includes(trainerProgram.target) ? trainerProgram : null;
  const supplementInventory = window.BoxeurSupplements && runtime.career.supplementState
    ? window.BoxeurSupplements.inventoryList(runtime.career.supplementState)
    : [];
  const reserve = careerReservedBoxingGymBudget(career);
  const plannerPreview = window.BoxeurWeekPlanner.previewPlan(ensureCareerWeekPlanner(capsule));
  const quickState = careerPlannerActionState("strength-quick");
  const conditionAccess = careerConditionActivityAccess("strength-quick", capsule);
  const trainerAccess = careerTrainerAccess("strength-gym", strengthProgram);
  const shopAvailable = state.careerStatus !== "recreational" && runtime.career.strengthGymWeeks > 0;
  return {
    profile: state.profile,
    careerStatus: state.careerStatus,
    clock: {
      ...capsule.timeState.clock,
      dateLabel: career.careerDateLabel,
    },
    condition: {
      energy: capsule.timeState.condition.energy,
      fatigue: capsule.timeState.condition.fatigue,
      trainingBlocked: !conditionAccess.available,
      trainingBlockedReason: conditionAccess.reason,
    },
    membership: {
      active: runtime.career.strengthGymWeeks > 0,
      weeksRemaining: runtime.career.strengthGymWeeks,
      label: runtime.career.strengthGymWeeks > 0
        ? `Abonnement actif · ${runtime.career.strengthGymWeeks} sem.`
        : "Aucun abonnement actif",
      detail: reserve > 0
        ? `${reserve} $ restent réservés pour le premier mois obligatoire du GYM de boxe.`
        : runtime.career.strengthGymWeeks > 0
          ? "La salle, les préparateurs et la boutique sont accessibles."
          : "Choisis un forfait mensuel lorsque le gym est débloqué.",
      balance: runtime.career.money,
      spendableBalance: Math.max(0, runtime.career.money - reserve),
      plans: strengthGymPlans,
    },
    selectedActivities: careerStrengthSelection,
    physicalSessionCompletedToday: false,
    trainer: {
      available: trainerAccess.available,
      reason: trainerAccess.reason,
      active: Boolean(strengthProgram),
      name: strengthProgram?.trainerLabel || "Aucun préparateur choisi",
      programLabel: strengthProgram ? `${combatLabels[strengthProgram.target]} · programme privé` : "Programme physique personnalisé",
      detail: strengthProgram
        ? `${strengthProgram.sessionsCompleted}/${strengthProgram.sessionsTotal} séances complétées. Les gains sont fractionnaires et doivent être assimilés.`
        : "Choisis un préparateur pour cibler graduellement la puissance ou le cardio.",
      sessionsCompleted: strengthProgram?.sessionsCompleted || 0,
      sessionsTotal: strengthProgram?.sessionsTotal || 0,
      actionLabel: strengthProgram ? "Continuer mon programme" : "Choisir un préparateur",
    },
    shop: {
      available: shopAvailable,
      reason: shopAvailable ? "" : "Un abonnement actif au gym de musculation est requis.",
      itemCount: supplementInventory.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
      summary: "Un seul produit peut être préparé avant une séance; maximum de deux utilisations par semaine.",
    },
    weekCapacity: {
      total: plannerPreview.capacity.total,
      used: plannerPreview.capacity.used,
      remaining: plannerPreview.capacity.remaining,
    },
    weekPlan: {
      entries: careerPlannerLocationEntries(ensureCareerWeekPlanner(capsule), "strength-gym"),
    },
    quick: quickState,
  };
}

const CAREER_HOME_ACTIVITIES = Object.freeze({
  meal: Object.freeze({
    id: "home-meal",
    label: "Repas maison de récupération",
    category: "home-recovery",
    duration: 1,
    energyCost: 0,
    energyGain: CAREER_BALANCE.WEEK.recovery.mealEnergyGain,
    fatigueGain: 0,
    fatigueRelief: CAREER_BALANCE.WEEK.recovery.mealFatigueRelief,
    stimulus: { technique: 0, power: 0, cardio: 0, defense: 0 },
    xp: 0,
  }),
  jogging: Object.freeze({
    id: "home-session:jogging",
    label: "Jogging dans le quartier",
    category: "home-training",
    duration: 1,
    energyCost: 12,
    energyGain: 0,
    fatigueGain: 8,
    fatigueRelief: 0,
    stimulus: { technique: 0, power: .2, cardio: 3, defense: 0 },
    xp: 3,
  }),
  "shadow-boxing": Object.freeze({
    id: "home-session:shadow-boxing",
    label: "Shadow-boxing à la maison",
    category: "home-training",
    duration: 1,
    energyCost: 6,
    energyGain: 0,
    fatigueGain: 3,
    fatigueRelief: 0,
    stimulus: { technique: 2, power: 0, cardio: .4, defense: 1 },
    xp: 2,
  }),
  "basement-bag": Object.freeze({
    id: "home-session:basement-bag",
    label: "Sac au sous-sol",
    category: "home-training",
    duration: 1,
    energyCost: 10,
    energyGain: 0,
    fatigueGain: 7,
    fatigueRelief: 0,
    stimulus: { technique: .5, power: 2.8, cardio: .3, defense: 0 },
    xp: 3,
  }),
  "roadwork-short": Object.freeze({
    id: "roadwork:short",
    label: "Court jog",
    category: "roadwork",
    duration: 1,
    energyCost: 10,
    energyGain: 0,
    fatigueGain: 6,
    fatigueRelief: 0,
    stimulus: { technique: 0, power: 0, cardio: 3.2, defense: 0 },
    xp: 3,
  }),
  "roadwork-long": Object.freeze({
    id: "roadwork:long",
    label: "Long jog",
    category: "roadwork",
    duration: 2,
    energyCost: 18,
    energyGain: 0,
    fatigueGain: 12,
    fatigueRelief: 0,
    stimulus: { technique: 0, power: 0, cardio: 5.5, defense: 0 },
    xp: 5,
  }),
  "roadwork-intervals": Object.freeze({
    id: "roadwork:intervals",
    label: "Intervalles",
    category: "roadwork",
    duration: 1,
    energyCost: 16,
    energyGain: 0,
    fatigueGain: 13,
    fatigueRelief: 0,
    stimulus: { technique: 0, power: .5, cardio: 5, defense: 0 },
    xp: 5,
  }),
});

function careerHomeContext() {
  const capsule = ensureCareerPreviewCapsule();
  if (!capsule?.timeState || !window.BoxeurRecovery || !window.BoxeurTime || !window.BoxeurWeekPlanner) return null;
  const timeState = capsule.timeState;
  const preparation = careerPreparationView(timeState);
  const plannerState = ensureCareerWeekPlanner(capsule);
  const preview = window.BoxeurWeekPlanner.previewPlan(plannerState);
  const pendingLoad = Object.values(timeState.stimulus).reduce((sum, value) => sum + Number(value || 0), 0);
  const recommendation = timeState.condition.fatigue >= 65
    ? { title: "Une journée de repos est prioritaire", detail: "La fatigue persistante est trop haute pour empiler une autre grosse séance; la nuit sera appliquée automatiquement.", tone: "critical" }
    : pendingLoad >= 48
      ? { title: "Laisse l’XP s’assimiler", detail: "Une nuit transformera une partie de l’XP ciblée en attente en progression permanente.", tone: "warning" }
      : preparation.score >= 80
        ? { title: "Tu peux ajouter une séance", detail: "Compare le coût hebdomadaire du GYM et de la maison avant de confirmer.", tone: "positive" }
        : { title: "Prévois une récupération", detail: "Une journée plus calme préservera une partie de ta réserve pour la semaine suivante.", tone: "steady" };
  const actionState = id => careerPlannerActionState(id);
  const homeEntries = careerPlannerLocationEntries(plannerState, "home");
  return {
    profile: state.profile,
    careerStatus: state.careerStatus,
    clock: {
      ...timeState.clock,
      dateLabel: careerCareerView().careerDateLabel,
    },
    condition: {
      energy: timeState.condition.energy,
      fatigue: timeState.condition.fatigue,
      pendingLoad,
      recommendation: recommendation.title,
      recommendationDetail: recommendation.detail,
      recommendationTone: recommendation.tone,
    },
    actions: {
      rest: actionState("rest"),
      "home-quick": actionState("home-quick"),
      "home-custom": actionState("home-custom"),
      "roadwork-short": actionState("roadwork-short"),
      "roadwork-long": actionState("roadwork-long"),
      "roadwork-intervals": actionState("roadwork-intervals"),
      meal: { ...actionState("meal"), moneyCost: 15 },
    },
    weekCapacity: {
      allowed: preview.capacity.total,
      used: preview.capacity.used,
      remaining: preview.capacity.remaining,
      label: "Capacité de semaine",
    },
    plan: {
      title: "Programme de la semaine",
      note: "Chaque choix réserve de l’énergie; tu peux le retirer avant la confirmation.",
      entries: homeEntries,
    },
  };
}

function careerFighterContext() {
  const capsule = ensureCareerPreviewCapsule();
  const runtime = capsule ? normalizeCareerPreviewRuntime(capsule) : null;
  const career = careerCareerView();
  const progression = careerProgressionSnapshot(capsule);
  const timeStats = capsule?.timeState?.stats || progression?.stats || state.combatStats;
  const statXpProgress = capsule?.timeState && window.BoxeurTime
    ? window.BoxeurTime.getPublicState(capsule.timeState).statXpProgress
    : null;
  const trainerState = runtime?.career?.trainerState;
  return {
    profile: state.profile,
    careerStatus: state.careerStatus,
    statusLabel: isRecreationalCareer() ? "Récréatif" : state.careerStatus === "professional" ? "Professionnel" : "Amateur",
    styleLabel: styles[state.profile?.style]?.label || "Équilibré",
    weightLabel: state.profile ? weightClassLabel(state.profile.weightClass, state.profile.sex) : "Catégorie à confirmer",
    money: career.money,
    level: state.level,
    levelPoints: state.levelPoints,
    privateLessonCredits: career.privateLessonCredits,
    experience: career.experience,
    amateurRecord: state.amateurRecord,
    medals: tournamentDefs.map(tournament => ({
      id: tournament.id,
      label: tournament.name,
      bronze: state.medals[tournament.id]?.bronze || 0,
      silver: state.medals[tournament.id]?.silver || 0,
      gold: state.medals[tournament.id]?.gold || 0,
    })),
    combatStats: timeStats,
    statXpProgress,
    privateTrainerProgram: window.BoxeurTrainer && trainerState
      ? window.BoxeurTrainer.getPublicState(trainerState).activeProgram
      : null,
  };
}

let careerLocationReturnFocus = null;

function setCareerPrimaryNavigationView(navigation, viewId) {
  if (!navigation) return;
  const activeView = ["map", "calendar", "fighter", "inventory"].includes(viewId) ? viewId : "map";
  navigation.dataset.careerNavigationView = activeView;
  navigation.querySelectorAll("[data-career-nav]").forEach(button => {
    const active = button.dataset.careerNav === activeView;
    button.classList.toggle("active", active);
    if (active) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
}

function careerPrimaryNavigation() {
  return document.querySelector("#career-world [data-career-primary-navigation]");
}

function renderCareerPrimarySheet(sheet, html, activeView) {
  const navigation = careerPrimaryNavigation();
  if (navigation && sheet.contains(navigation)) navigation.remove();
  sheet.innerHTML = html;
  if (!navigation) return;
  setCareerPrimaryNavigationView(navigation, activeView);
  sheet.append(navigation);
}

function restoreCareerPrimaryNavigation() {
  const navigation = careerPrimaryNavigation();
  const host = document.querySelector("#career-world .career-map-stack");
  if (!navigation || !host) return;
  setCareerPrimaryNavigationView(navigation, "map");
  host.append(navigation);
}

function careerLocationFocusableElements(sheet) {
  if (!sheet) return [];
  return Array.from(sheet.querySelectorAll("a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])"))
    .filter(element => element.getClientRects().length > 0 && !element.closest("[hidden]") && element.getAttribute("aria-hidden") !== "true");
}

function setCareerLocationBackgroundInert(sheet, inactive) {
  if (!sheet?.parentElement) return;
  Array.from(sheet.parentElement.children).forEach(element => {
    if (element === sheet) return;
    if (inactive) {
      if (!element.inert) {
        element.inert = true;
        element.dataset.careerLocationInert = "true";
      }
    } else if (element.dataset.careerLocationInert === "true") {
      element.inert = false;
      delete element.dataset.careerLocationInert;
    }
  });
}

function activateCareerLocationSheet(sheet, preferredFocusSelector) {
  if (!sheet) return;
  const isWeekSurface = Boolean(sheet.querySelector(":scope > .career-week-plan, :scope > .career-week-summary"));
  sheet.classList.toggle("career-location-sheet-week", isWeekSurface);
  sheet.hidden = false;
  sheet.setAttribute("role", "dialog");
  sheet.setAttribute("aria-modal", "true");
  sheet.setAttribute("tabindex", "-1");
  const title = sheet.querySelector("h2");
  if (title) {
    if (!title.id) title.id = "career-location-dialog-title";
    sheet.setAttribute("aria-labelledby", title.id);
    sheet.removeAttribute("aria-label");
  } else {
    sheet.removeAttribute("aria-labelledby");
    sheet.setAttribute("aria-label", "Lieu du quartier");
  }
  setCareerLocationBackgroundInert(sheet, true);
  const preferred = preferredFocusSelector ? sheet.querySelector(preferredFocusSelector) : null;
  const target = preferred || careerLocationFocusableElements(sheet)[0] || sheet;
  target.focus({ preventScroll: true });
}

function openCareerLocation(locationId) {
  const sheet = document.querySelector("#career-world .career-location-sheet");
  if (!sheet) return;
  restoreCareerPrimaryNavigation();
  const career = careerCareerView();
  const access = window.BoxeurWorld?.locationAccess?.(locationId, career);
  if (access?.locked) {
    showToast(access.reason || "Ce lieu se débloque après le passage amateur.");
    return;
  }
  if (sheet.hidden) {
    const currentFocus = document.activeElement;
    careerLocationReturnFocus = currentFocus instanceof HTMLElement && currentFocus !== document.body
      ? currentFocus
      : document.querySelector(`#career-world [data-career-location="${safeIdentifier(locationId, "home")}"]`);
  }
  sheet.dataset.originLocation = locationId;
  const isBoxingGym = locationId === "boxing-gym" && window.BoxeurGymView;
  const isStrengthGym = locationId === "strength-gym" && window.BoxeurStrengthView;
  const isHome = locationId === "home" && window.BoxeurHomeView;
  const isWork = locationId === "work" && window.BoxeurWorkView;
  const isArena = locationId === "arena" && window.BoxeurArenaView;
  sheet.classList.toggle("career-location-sheet-full", Boolean(isBoxingGym || isStrengthGym || isHome || isWork || isArena));
  sheet.classList.toggle("career-location-sheet-strength", Boolean(isStrengthGym));
  sheet.innerHTML = isBoxingGym
    ? window.BoxeurGymView.render(careerGymContext())
    : isStrengthGym
      ? window.BoxeurStrengthView.render(careerStrengthContext())
      : isHome
        ? window.BoxeurHomeView.render(careerHomeContext())
        : isWork
          ? window.BoxeurWorkView.render(careerWorkLocationContext())
          : isArena
            ? window.BoxeurArenaView.render(careerArenaContext())
        : window.BoxeurWorld.renderLocation(locationId, locationId === "work" ? careerWorkLocationContext() : career);
  if (["boxing-gym", "home", "work"].includes(locationId) && window.BoxeurWorld?.renderLocationGuide) {
    const guide = window.BoxeurWorld.renderLocationGuide(career, locationId);
    const guideTarget = isBoxingGym
      ? sheet.querySelector(".career-gym-dashboard")
      : isHome
        ? sheet.querySelector(".career-home-dashboard")
        : isWork
          ? sheet.querySelector(".career-work-dashboard")
          : sheet.querySelector(".career-location-card");
    if (guide && guideTarget) guideTarget.insertAdjacentHTML("afterbegin", guide);
  }
  activateCareerLocationSheet(sheet, "[data-career-leave-gym], [data-career-leave-strength-gym], [data-career-leave-home], [data-career-leave-work], [data-career-leave-arena], [data-career-close-location], button");
}

function openCareerFighter() {
  const sheet = document.querySelector("#career-world .career-location-sheet");
  if (!sheet || !window.BoxeurFighterView) return;
  if (sheet.hidden) {
    const currentFocus = document.activeElement;
    careerLocationReturnFocus = currentFocus instanceof HTMLElement && currentFocus !== document.body
      ? currentFocus
      : document.querySelector('#career-world [data-career-nav="fighter"]');
  }
  sheet.dataset.originLocation = "fighter";
  sheet.classList.add("career-location-sheet-full");
  sheet.classList.remove("career-location-sheet-strength", "career-location-sheet-week");
  renderCareerPrimarySheet(sheet, window.BoxeurFighterView.render(careerFighterContext()), "fighter");
  activateCareerLocationSheet(sheet, '[data-career-nav="fighter"]');
}

function careerInventoryContext() {
  const capsule = ensureCareerPreviewCapsule();
  const runtime = normalizeCareerPreviewRuntime(capsule);
  const plannerState = ensureCareerWeekPlanner(capsule);
  const preview = window.BoxeurWeekPlanner.previewPlan(plannerState);
  const physicalEntries = preview.entries.filter(entry => entry.physical && entry.activityId !== "sparring" && !entry.metadata?.completed);
  const reservedByProduct = Object.fromEntries(preview.supplements.reservations.map(reservation => [reservation.productId, reservation.entryId]));
  const inventory = window.BoxeurSupplements.inventoryList(careerSupplementState(capsule));
  return {
    profile: state.profile,
    eyebrow: "Inventaire de carrière",
    title: "Sac et suppléments",
    introduction: "Les suppléments restent modestes : associe-en un à une séance déjà planifiée pour récupérer un peu de capacité hebdomadaire. Maximum de deux par semaine.",
    items: inventory.map(item => {
      const reservedEntry = plannerState.entries.find(entry => entry.id === reservedByProduct[item.id]);
      const available = state.careerStatus !== "recreational"
        && physicalEntries.length > 0
        && (preview.supplements.remainingUses > 0 || Boolean(reservedEntry));
      const reason = state.careerStatus === "recreational"
        ? "Les suppléments se débloquent après le passage amateur."
        : !physicalEntries.length
          ? "Ajoute d’abord une séance physique à ta semaine."
          : "La limite hebdomadaire de deux produits est atteinte.";
      return {
        ...item,
        categoryId: "supplements",
        description: item.detail,
        status: reservedEntry ? "prepared" : "stored",
        statusLabel: reservedEntry ? "Réservé cette semaine" : "Dans le sac",
        note: reservedEntry
          ? `Associé à : ${reservedEntry.label} · ${reservedEntry.metadata?.supplementCapacityRelief || 0} point${Number(reservedEntry.metadata?.supplementCapacityRelief || 0) > 1 ? "s" : ""} libéré${Number(reservedEntry.metadata?.supplementCapacityRelief || 0) > 1 ? "s" : ""}.`
          : "Le coût sera recalculé selon l’énergie et la fatigue de la séance choisie.",
        action: {
          id: "reserve-week",
          label: reservedEntry ? "Changer la réservation" : "Associer à une séance",
          available,
          reason,
        },
      };
    }),
    emptyTitle: "Ton inventaire est vide",
    emptyMessage: "Achète des suppléments à la boutique du gym de musculation. L’inventaire pourra accueillir d’autres objets plus tard.",
    access: { available: true },
    balance: runtime.career.money,
  };
}

function openCareerInventory() {
  const sheet = document.querySelector("#career-world .career-location-sheet");
  if (!sheet || !window.BoxeurInventoryView) return;
  if (sheet.hidden) {
    const currentFocus = document.activeElement;
    careerLocationReturnFocus = currentFocus instanceof HTMLElement && currentFocus !== document.body
      ? currentFocus
      : document.querySelector('#career-world [data-career-nav="inventory"]');
  }
  sheet.dataset.originLocation = "inventory";
  sheet.classList.add("career-location-sheet-full");
  sheet.classList.remove("career-location-sheet-strength", "career-location-sheet-week");
  renderCareerPrimarySheet(sheet, window.BoxeurInventoryView.render(careerInventoryContext()), "inventory");
  activateCareerLocationSheet(sheet, '[data-career-nav="inventory"], [data-career-inventory-action]');
}

function openCareerSupplementReservation(productId) {
  const capsule = ensureCareerPreviewCapsule();
  const sheet = document.querySelector("#career-world .career-location-sheet");
  const product = window.BoxeurSupplements.CATALOG[productId];
  if (!capsule || !sheet || !product) return;
  const plannerState = ensureCareerWeekPlanner(capsule);
  const entries = plannerState.entries.filter(entry => entry.physical && entry.activityId !== "sparring" && !entry.metadata?.completed);
  const choices = entries.map(entry => {
    const selected = entry.supplementId === productId;
    return `<article class="career-supplement-card${selected ? " selected" : ""}"><div><p class="eyebrow">${escapeHTML(CAREER_PLANNER_DAY_LABELS[entry.day] || entry.day)}</p><h3>${escapeHTML(entry.label)}</h3></div><p>Coût actuel : ${entry.capacityCost} de capacité hebdomadaire.</p><button type="button" data-career-plan-supplement-entry="${escapeHTML(entry.id)}" data-career-plan-supplement-product="${escapeHTML(productId)}">${selected ? "Garder cette séance" : "Associer ici"}</button>${entry.supplementId && !selected ? `<small>Remplacera ${escapeHTML(window.BoxeurSupplements.CATALOG[entry.supplementId]?.label || "le produit actuel")}.</small>` : ""}${entry.supplementId ? `<button type="button" class="text-button" data-career-plan-supplement-remove="${escapeHTML(entry.id)}">Retirer le produit actuel</button>` : ""}</article>`;
  }).join("");
  sheet.dataset.originLocation = "inventory";
  sheet.classList.add("career-location-sheet-full");
  sheet.classList.remove("career-location-sheet-strength", "career-location-sheet-week");
  renderCareerPrimarySheet(sheet, `<section class="career-service-panel career-supplement-picker" aria-labelledby="career-inventory-reserve-title"><header><div><p class="eyebrow">${escapeHTML(product.label)} · ×${careerSupplementState(capsule).inventory[productId] || 0}</p><h2 id="career-inventory-reserve-title">Choisis une séance</h2></div><button type="button" class="secondary-button" data-career-inventory-reserve-close>Retour à l’inventaire</button></header><p>${escapeHTML(product.benefit)} Le coût hebdomadaire sera recalculé à partir du même effet appliqué pendant la séance; le produit sera consommé seulement à la confirmation.</p><div class="career-supplement-grid">${choices}</div></section>`, "inventory");
  activateCareerLocationSheet(sheet, "[data-career-plan-supplement-entry], [data-career-inventory-reserve-close]");
}

function reserveCareerPlannerSupplement(entryId, productId) {
  const capsule = ensureCareerPreviewCapsule();
  try {
    const outcome = careerPlannerReserveSupplementOnState(ensureCareerWeekPlanner(capsule), entryId, productId);
    careerPlannerStore(capsule, outcome.state);
    openCareerInventory();
    showToast(`${window.BoxeurSupplements.CATALOG[productId]?.label || "Supplément"} réservé · la barre hebdomadaire remonte légèrement`);
  } catch (error) {
    showToast(error.message || "Ce supplément ne peut pas être réservé.");
  }
}

function unreserveCareerPlannerSupplement(entryId) {
  const capsule = ensureCareerPreviewCapsule();
  try {
    let plannerState = ensureCareerWeekPlanner(capsule);
    const entry = plannerState.entries.find(item => item.id === entryId);
    if (!entry?.supplementId) return;
    const unreserved = window.BoxeurWeekPlanner.unreserveSupplement(plannerState, entryId);
    plannerState = unreserved.state;
    const current = plannerState.entries.find(item => item.id === entryId);
    const restoredCost = safeNumber(current.metadata?.supplementBaseCapacityCost, current.capacityCost, 0, 100);
    const restoredEnergy = safeNumber(current.metadata?.supplementBaseEnergyCost, current.energyCost, 0, 100, false);
    const restoredFatigue = safeNumber(current.metadata?.supplementBaseFatigueDelta, current.fatigueDelta, -100, 100, false);
    const metadata = { ...current.metadata };
    delete metadata.supplementBaseCapacityCost;
    delete metadata.supplementBaseEnergyCost;
    delete metadata.supplementBaseFatigueDelta;
    delete metadata.supplementBaseFatigueGain;
    delete metadata.supplementBaseFatigueRelief;
    delete metadata.supplementCapacityRelief;
    plannerState = window.BoxeurWeekPlanner.editActivity(plannerState, entryId, {
      capacityCost: restoredCost,
      energyCost: restoredEnergy,
      fatigueDelta: restoredFatigue,
      metadata,
    }).state;
    careerPlannerStore(capsule, plannerState);
    openCareerInventory();
    showToast("Réservation retirée · le produit reste dans l’inventaire.");
  } catch (error) {
    showToast(error.message || "La réservation ne peut pas être retirée.");
  }
}

function closeCareerLocation() {
  const sheet = document.querySelector("#career-world .career-location-sheet");
  if (!sheet) return;
  const origin = sheet.dataset.originLocation;
  const rememberedFocus = careerLocationReturnFocus;
  restoreCareerPrimaryNavigation();
  sheet.hidden = true;
  sheet.classList.remove("career-location-sheet-full");
  sheet.classList.remove("career-location-sheet-strength");
  sheet.classList.remove("career-location-sheet-week");
  setCareerLocationBackgroundInert(sheet, false);
  careerLocationReturnFocus = null;
  const fallback = document.querySelector(`#career-world [data-career-location="${safeIdentifier(origin, "home")}"]`);
  const target = rememberedFocus?.isConnected ? rememberedFocus : fallback;
  target?.focus({ preventScroll: true });
}

function revealPendingCareerLevelAlert() {
  if (state.levelAnnouncementPending) setTimeout(showCareerAlertOrContinue, 0);
}

const CAREER_EXERCISE_TO_ENGINE = Object.freeze({
  "jump-rope": "jump_rope",
  "shadow-boxing": "shadow_boxing",
  "heavy-bag": "heavy_bag",
  "mitt-work": "mitts",
  defense: "defense_drills",
  cooldown: "cooldown",
});

function careerTrainingContext() {
  const capsule = ensureCareerPreviewCapsule();
  const runtimeCareer = capsule ? normalizeCareerPreviewRuntime(capsule).career : createCareerRuntimeCareer();
  return {
    membershipActive: runtimeCareer.gymWeeks > 0,
    careerStatus: state.careerStatus,
  };
}

function careerSigned(value, suffix = " %") {
  const rounded = Math.round(Number(value) * 10) / 10;
  return `${rounded > 0 ? "+" : ""}${rounded}${suffix}`;
}

function careerWeekStartSlot(timeState) {
  return (timeState.clock.week - 1) * window.BoxeurTime.PERIODS_PER_WEEK;
}

const CAREER_FIGHT_APPOINTMENT_PREFIX = "career-official-fight";

function normalizeCareerFightGate(input) {
  if (!input || typeof input !== "object" || input.status !== "ready") return null;
  const week = safeNumber(input.week, 0, 1, 99999);
  const appointmentId = safeText(input.appointmentId, "", 180);
  if (!week || !appointmentId) return null;
  return {
    schemaVersion: 1,
    status: "ready",
    week,
    kind: input.kind === "tournament" ? "tournament" : "gala",
    eventId: safeText(input.eventId, "", 180) || null,
    bookingId: safeText(input.bookingId, "", 180) || null,
    appointmentId,
    title: safeText(input.title, input.kind === "tournament" ? "Tournoi amateur" : "Combat amateur", 180),
    summary: input.summary && typeof input.summary === "object" ? cloneData(input.summary) : null,
    plannerEntries: Array.isArray(input.plannerEntries) ? cloneData(input.plannerEntries) : [],
    startingCondition: input.startingCondition && typeof input.startingCondition === "object"
      ? cloneData(input.startingCondition)
      : null,
    completionEvents: Array.isArray(input.completionEvents) ? cloneData(input.completionEvents) : [],
  };
}

function careerFightGate(capsule = ensureCareerPreviewCapsule()) {
  if (!capsule) return null;
  return normalizeCareerPreviewRuntime(capsule).fightGate;
}

function careerFightGateReady(capsule = ensureCareerPreviewCapsule()) {
  return careerFightGate(capsule)?.status === "ready";
}

function isCareerFightAppointment(appointment) {
  return Boolean(appointment && (
    String(appointment.id || "").startsWith(`${CAREER_FIGHT_APPOINTMENT_PREFIX}:`)
      || appointment.metadata?.careerFightGate === true
  ));
}

function careerOfficialEventDue(career = null) {
  if (state.careerStatus !== "amateur") return null;
  const currentWeek = Number(career?.week || careerCapsule?.timeState?.clock?.week || state.week || 1);
  const activeTournament = state.activeTournament;
  if (activeTournament && activeTournament.status !== "completed" && Number(activeTournament.startWeek) <= currentWeek) {
    return {
      kind: "tournament",
      eventId: activeTournament.eventId || activeTournament.id,
      bookingId: activeTournament.bookingId || null,
      title: activeTournament.name || tournamentDefs.find(item => item.id === activeTournament.id)?.name || "Tournoi amateur",
    };
  }
  const tournamentBooking = dueTournamentBooking();
  if (tournamentBooking) {
    return {
      kind: "tournament",
      eventId: tournamentBooking.eventId || tournamentBooking.event?.id,
      bookingId: tournamentBooking.id,
      title: tournamentBooking.event?.name || "Tournoi amateur",
    };
  }
  const scheduled = state.scheduledFight;
  if (!scheduled
    || scheduled.isPracticeSparring
    || scheduled.isRecreationalSparring
    || scheduled.isDeveloperBout
    || Number(scheduled.week) > currentWeek) return null;
  return {
    kind: scheduled.tournamentId ? "tournament" : "gala",
    eventId: scheduled.eventId || scheduled.id,
    bookingId: scheduled.bookingId || null,
    title: scheduled.event?.name || (scheduled.tournamentId ? "Tournoi amateur" : "Combat amateur"),
  };
}

function ensureCareerFightAppointment(capsule, officialEvent) {
  if (!capsule?.timeState || !officialEvent || !window.BoxeurTime) return null;
  const week = capsule.timeState.clock.week;
  const eventKey = safeIdentifier(officialEvent.eventId || officialEvent.bookingId || officialEvent.kind, officialEvent.kind);
  const appointmentId = `${CAREER_FIGHT_APPOINTMENT_PREFIX}:${week}:${eventKey}`;
  const existing = capsule.timeState.appointments.find(appointment => appointment.id === appointmentId);
  if (existing) return existing;
  const weekStart = careerWeekStartSlot(capsule.timeState);
  const lastPeriod = weekStart + window.BoxeurTime.PERIODS_PER_WEEK - 1;
  const earliest = Math.max(weekStart, capsule.timeState.clock.absoluteSlot);
  const appointmentInput = startSlot => ({
    id: appointmentId,
    title: officialEvent.title,
    kind: officialEvent.kind === "tournament" ? "tournament" : "fight",
    location: "arena",
    startSlot,
    duration: 1,
    activity: {
      id: appointmentId,
      label: officialEvent.title,
      category: "official-fight",
      duration: 1,
      energyCost: 0,
      energyGain: 0,
      fatigueGain: 0,
      fatigueRelief: 0,
      stimulus: { technique: 0, power: 0, cardio: 0, defense: 0 },
    },
    metadata: {
      important: true,
      careerFightGate: true,
      eventKind: officialEvent.kind,
      eventId: officialEvent.eventId,
      bookingId: officialEvent.bookingId,
    },
  });
  for (let startSlot = lastPeriod; startSlot >= earliest; startSlot -= 1) {
    const availability = window.BoxeurTime.canScheduleAppointment(capsule.timeState, appointmentInput(startSlot));
    if (!availability.ok) continue;
    capsule.timeState = window.BoxeurTime.scheduleAppointment(capsule.timeState, appointmentInput(startSlot));
    return capsule.timeState.appointments.find(appointment => appointment.id === appointmentId) || null;
  }
  throw new Error("Aucune période libre ne reste pour le combat à l’aréna cette semaine.");
}

function careerDayStartSlot(timeState, absoluteSlot = timeState?.clock?.absoluteSlot) {
  if (!timeState?.clock || !window.BoxeurTime || !Number.isFinite(Number(absoluteSlot))) return 0;
  const moment = window.BoxeurTime.fromAbsoluteSlot(Math.max(0, Math.trunc(Number(absoluteSlot))));
  return Math.trunc(Number(absoluteSlot)) - moment.periodIndex;
}

function careerIsPrimaryPhysicalEvent(event) {
  if (event?.type !== "activity-completed") return false;
  const category = String(event.activityCategory || "");
  const activityId = String(event.activityId || "");
  return ["training", "boxing-gym-training", "strength-gym-training", "home-training", "roadwork", "private-training", "sparring"].includes(category)
    || activityId.startsWith("boxing-gym-session:")
    || activityId.startsWith("strength-gym-session:")
    || activityId.startsWith("home-session:")
    || activityId.startsWith("roadwork:")
    || activityId.startsWith("private-trainer:");
}

function careerPrimaryTrainingOnDay(timeState, dayStartSlot = careerDayStartSlot(timeState)) {
  if (!Array.isArray(timeState?.history) || !window.BoxeurTime) return false;
  const dayEndSlot = dayStartSlot + window.BoxeurTime.PERIODS_PER_DAY;
  return timeState.history.some(event => {
    if (event?.type !== "activity-completed") return false;
    const fromSlot = Number(event.fromSlot);
    if (!Number.isFinite(fromSlot) || fromSlot < dayStartSlot || fromSlot >= dayEndSlot) return false;
    return careerIsPrimaryPhysicalEvent(event);
  });
}

function careerNextTrainingWindow(timeState) {
  if (!timeState?.clock || !window.BoxeurTime) return { available: false, reason: "Horaire de carrière indisponible." };
  const now = timeState.clock.absoluteSlot;
  const currentDayStart = careerDayStartSlot(timeState, now);
  const trainedToday = careerPrimaryTrainingOnDay(timeState, currentDayStart);
  let startSlot = trainedToday
    ? currentDayStart + window.BoxeurTime.PERIODS_PER_DAY + 2
    : currentDayStart + 2;
  if (startSlot < now) startSlot += window.BoxeurTime.PERIODS_PER_DAY;
  const weekEnd = careerWeekStartSlot(timeState) + window.BoxeurTime.PERIODS_PER_WEEK;
  if (startSlot + 1 >= weekEnd) {
    return {
      available: false,
      trainedToday,
      reason: "Aucune soirée complète ne reste cette semaine. Confie le reste au coach pour passer à lundi.",
    };
  }
  const moment = window.BoxeurTime.fromAbsoluteSlot(startSlot);
  return {
    available: true,
    trainedToday,
    startSlot,
    waitPeriods: Math.max(0, startSlot - now),
    label: `${moment.dayLabel} soir`,
  };
}

function prepareCareerTrainingWindow(capsule) {
  const windowState = careerNextTrainingWindow(capsule?.timeState);
  if (!windowState.available) {
    const error = new Error(windowState.reason);
    error.code = "NO_TRAINING_WINDOW";
    throw error;
  }
  if (windowState.waitPeriods > 0) {
    capsule.timeState = window.BoxeurTime.advanceTime(capsule.timeState, windowState.waitPeriods);
  }
  return windowState;
}

function careerWouldCrossWeek(timeState, duration = 1) {
  if (!timeState?.clock || !window.BoxeurTime) return false;
  const weekEnd = careerWeekStartSlot(timeState) + window.BoxeurTime.PERIODS_PER_WEEK;
  return timeState.clock.absoluteSlot + Math.max(1, Number(duration) || 1) >= weekEnd;
}

function careerWeekTrainingActivityCount(timeState, weekNumber = timeState?.clock?.week) {
  if (!timeState?.clock || !Array.isArray(timeState.history) || !window.BoxeurTime) return 0;
  const week = safeNumber(weekNumber, timeState.clock.week, 1, 99999);
  const start = (week - 1) * window.BoxeurTime.PERIODS_PER_WEEK;
  const end = start + window.BoxeurTime.PERIODS_PER_WEEK;
  return timeState.history.filter(event => (
    careerIsPrimaryPhysicalEvent(event)
    && Number(event.fromSlot) >= start
    && Number(event.fromSlot) < end
  )).length;
}

function careerWeekWorkActivityCount(timeState, jobId = null) {
  if (!timeState?.clock || !Array.isArray(timeState.history) || !window.BoxeurTime) return 0;
  const start = careerWeekStartSlot(timeState);
  const end = start + window.BoxeurTime.PERIODS_PER_WEEK;
  const expectedId = jobId ? `work:${jobId}` : null;
  return timeState.history.filter(event => (
    event.type === "activity-completed"
    && Number(event.fromSlot) >= start
    && Number(event.fromSlot) < end
    && (String(event.activityId || "").startsWith("work:") || (expectedId && event.activityId === expectedId))
  )).length;
}

function careerWorkStatus(timeState, career = {}) {
  const job = jobs.find(item => item.id === career.jobId) || null;
  const completed = Boolean(job && careerWeekWorkActivityCount(timeState, job.id) > 0);
  const tooLate = Boolean(job && !completed && careerWouldCrossWeek(timeState, 2));
  return {
    careerWorkCompleted: completed,
    careerWorkAvailable: Boolean(job && !completed && !tooLate),
    careerWorkBlockReason: completed
      ? "Travail fait cette semaine · paie hebdomadaire versée."
      : tooLate ? "Il ne reste pas assez de temps pour assurer cette semaine de travail avant lundi." : "",
  };
}

function careerWeekLedger(runtime, weekNumber) {
  const key = String(safeNumber(weekNumber, 1, 1, 99999));
  const supplied = runtime.weekLedgers[key] && typeof runtime.weekLedgers[key] === "object" ? runtime.weekLedgers[key] : {};
  runtime.weekLedgers[key] = {
    grossWages: safeNumber(supplied.grossWages, 0, 0, 99999999),
    workShifts: safeNumber(supplied.workShifts, 0, 0, 99),
    paidVacationWeeks: safeNumber(supplied.paidVacationWeeks, 0, 0, 1),
  };
  return runtime.weekLedgers[key];
}

function recordCareerWork(runtime, weekNumber, grossWages, workShifts = 1, paidVacationWeeks = 0) {
  const ledger = careerWeekLedger(runtime, weekNumber);
  const pay = safeNumber(grossWages, 0, 0, 99999999);
  const shifts = safeNumber(workShifts, 0, 0, 99);
  ledger.grossWages += pay;
  ledger.workShifts += shifts;
  ledger.paidVacationWeeks += safeNumber(paidVacationWeeks, 0, 0, 1);
  return ledger;
}

const CAREER_WEEK_CAPACITY_MILESTONE_GAIN = CAREER_BALANCE.WEEK.milestoneGain;
const CAREER_WEEK_RULESET_VERSION = 11;
const CAREER_CONDITION_CRITICAL_ENERGY = CAREER_BALANCE.WEEK.condition.criticalEnergy;
const CAREER_CONDITION_CRITICAL_FATIGUE = CAREER_BALANCE.WEEK.condition.criticalFatigue;
const CAREER_CONDITION_FRAGILE_ENERGY = CAREER_BALANCE.WEEK.condition.fragileEnergy;
const CAREER_CONDITION_FRAGILE_FATIGUE = CAREER_BALANCE.WEEK.condition.fragileFatigue;
const CAREER_DEMANDING_ACTIVITY_IDS = new Set([
  "boxing-coach",
  "boxing-custom",
  "strength-quick",
  "strength-custom",
  "sparring",
  "private-training",
  "home-custom",
  "roadwork-long",
  "roadwork-intervals",
]);
const CAREER_DEMANDING_JOB_IDS = new Set(["courier", "warehouse"]);
const CAREER_WEEK_ACTIVITY_LIMITS = Object.freeze({
  "group-class": 1,
  rest: 2,
  meal: 1,
  sparring: 1,
});
const CAREER_WEEK_FAMILY_LIMITS = Object.freeze({
  group: 1,
  boxing: 2,
  strength: 2,
  home: 2,
  sparring: 1,
});
const CAREER_WEEK_TOGGLE_ACTIVITY_IDS = new Set(["group-class", "rest", "meal", "sparring"]);
const CAREER_CUSTOM_SESSION_BASE_COST = 2;
const CAREER_PLANNER_DAY_LABELS = Object.freeze({
  monday: "Lundi",
  tuesday: "Mardi",
  wednesday: "Mercredi",
  thursday: "Jeudi",
  friday: "Vendredi",
  saturday: "Samedi",
  sunday: "Dimanche",
});

function careerPlannerWeekKey(capsule = ensureCareerPreviewCapsule()) {
  return `week-${capsule?.timeState?.clock?.week || state.week}`;
}

function careerPlannerLoadCost(energyCost, fatigueDelta, minimum = 4, extraBaseCost = 0) {
  return CAREER_BALANCE.activityCapacityCost(energyCost, fatigueDelta, { minimum, extraBaseCost });
}

function careerPlannerWorkCost(job) {
  return CAREER_BALANCE.workCapacityCost(job);
}

function careerPlannerCapacityTotal() {
  return CAREER_BALANCE.weeklyCapacity(state.level);
}

function careerActiveRecoveryConsequence(capsule, career = normalizeCareerPreviewRuntime(capsule).career) {
  const consequence = normalizeRecoveryConsequence(career?.recoveryConsequence);
  const week = safeNumber(capsule?.timeState?.clock?.week, state.week, 1, 99999);
  return consequence?.week === week ? consequence : null;
}

function careerPlannerUnavailableCapacity(capsule, career, _job, total = careerPlannerCapacityTotal()) {
  const condition = capsule.timeState.condition || {};
  const conditionPenalty = Math.round(
    Math.max(0, Number(condition.fatigue || 0) - 58) / 8
      + Math.max(0, 38 - Number(condition.energy || 0)) / 8,
  );
  const rhythmPenalty = isCompetitiveCareer()
    ? safeNumber(runtimeCareerTrainingRhythm(career), 0, 0, 4) * 5
    : 0;
  const forcedRecoveryCost = careerActiveRecoveryConsequence(capsule, career)?.capacityCost || 0;
  return Math.min(total, Math.max(conditionPenalty, forcedRecoveryCost) + rhythmPenalty);
}

function runtimeCareerTrainingRhythm(career = careerCareerView()) {
  return safeNumber(career?.trainingRhythmPenalty, state.trainingRhythmPenalty, 0, 4);
}

function careerConditionActivityAccess(activityId, capsule = ensureCareerPreviewCapsule()) {
  if (!capsule?.timeState) return { available: false, reason: "État physique indisponible." };
  const runtime = normalizeCareerPreviewRuntime(capsule);
  const activeRecovery = careerActiveRecoveryConsequence(capsule, runtime.career);
  const id = String(activityId || "");
  if (activeRecovery) {
    if (id === "rest") {
      return { available: false, reason: "La récupération obligatoire occupe déjà cette semaine." };
    }
    if (id !== "meal") {
      const label = activeRecovery.kind === "hospital" ? "La nuit à l’hôpital" : "Le repos forcé";
      return { available: false, reason: `${label} bloque le travail et l’entraînement cette semaine.` };
    }
  }
  if (["rest", "meal"].includes(id)) return { available: true, reason: "" };
  const energy = Number(capsule.timeState.condition.energy || 0);
  const fatigue = Number(capsule.timeState.condition.fatigue || 0);
  if (energy <= CAREER_CONDITION_CRITICAL_ENERGY || fatigue >= CAREER_CONDITION_CRITICAL_FATIGUE) {
    return {
      available: false,
      reason: "L’état physique est critique : repose-toi avant de travailler ou de t’entraîner.",
    };
  }
  if (CAREER_DEMANDING_ACTIVITY_IDS.has(id)
    && (energy <= CAREER_CONDITION_FRAGILE_ENERGY || fatigue >= CAREER_CONDITION_FRAGILE_FATIGUE)) {
    return {
      available: false,
      reason: "L’état physique est trop fragile pour une activité exigeante. Choisis un effort léger ou du repos.",
    };
  }
  return { available: true, reason: "" };
}

function careerPlannerWorkAccess(capsule, job, total = careerPlannerCapacityTotal()) {
  if (!job) return { available: false, reason: "Choisis d’abord un emploi." };
  const runtime = normalizeCareerPreviewRuntime(capsule);
  const activeRecovery = careerActiveRecoveryConsequence(capsule, runtime.career);
  if (activeRecovery) {
    const label = activeRecovery.kind === "hospital" ? "La nuit à l’hôpital" : "Le repos forcé";
    return { available: false, reason: `${label} empêche de travailler cette semaine.` };
  }
  const condition = capsule.timeState.condition || {};
  const energy = Number(condition.energy || 0);
  const fatigue = Number(condition.fatigue || 0);
  if (energy <= CAREER_CONDITION_CRITICAL_ENERGY || fatigue >= CAREER_CONDITION_CRITICAL_FATIGUE) {
    return { available: false, reason: "L’état physique est critique : cette semaine doit servir à récupérer." };
  }
  if (CAREER_DEMANDING_JOB_IDS.has(job.id)
    && (energy <= CAREER_CONDITION_FRAGILE_ENERGY || fatigue >= CAREER_CONDITION_FRAGILE_FATIGUE)) {
    return { available: false, reason: "Ton état physique est trop fragile pour assurer cet emploi exigeant." };
  }
  const unavailable = careerPlannerUnavailableCapacity(capsule, runtime.career, null, total);
  const workCost = careerPlannerWorkCost(job);
  if (unavailable + workCost > total) {
    return {
      available: false,
      reason: `Après les ${unavailable} points déjà occupés, le travail à ${workCost} points ne tient plus dans la semaine.`,
    };
  }
  return { available: true, reason: "" };
}

function careerPlannerSupplementConfig(capsule) {
  const supplementState = careerSupplementState(capsule);
  if (!supplementState) return { inventory: {}, weeklyLimit: 0, alreadyUsed: 0, usedProductIds: [] };
  const currentKeys = new Set([careerPlannerWeekKey(capsule), String(capsule.timeState.clock.week)]);
  const currentUsage = currentKeys.has(String(supplementState.weeklyUsage?.weekKey));
  return {
    inventory: cloneData(supplementState.inventory || {}),
    weeklyLimit: window.BoxeurSupplements.MAX_WEEKLY_USES,
    alreadyUsed: currentUsage ? safeNumber(supplementState.weeklyUsage?.count, 0, 0, window.BoxeurSupplements.MAX_WEEKLY_USES) : 0,
    usedProductIds: currentUsage ? cloneData(supplementState.weeklyUsage?.productIds || []) : [],
    uniqueProducts: true,
  };
}

function careerPlannerBaseConfig(capsule = ensureCareerPreviewCapsule(), options = {}) {
  const runtime = normalizeCareerPreviewRuntime(capsule);
  const career = careerCareerView();
  const job = jobs.find(item => item.id === runtime.career.jobId) || null;
  const capacityTotal = careerPlannerCapacityTotal();
  const workAccess = job ? careerPlannerWorkAccess(capsule, job, capacityTotal) : { available: false, reason: "" };
  const paidVacationPlanned = options.paidVacationPlanned === true
    && Boolean(job)
    && safeNumber(runtime.career.vacationBankWeeks, 0, 0, MAX_PAID_VACATION_WEEKS) > 0;
  const work = paidVacationPlanned ? {
    id: job.id,
    title: "Vacances payées",
    active: true,
    weeklyPay: job.wage,
    capacityCost: 0,
    energyCost: 0,
    fatigueGain: 0,
    shifts: [{
      day: "friday",
      locked: false,
      activity: {
        id: `paid-vacation:${job.id}`,
        label: `Vacances payées · ${job.title}`,
        category: "work",
        location: "work",
        physical: false,
        capacityCost: 0,
        energyCost: 0,
        energyGain: 0,
        fatigueDelta: 0,
        pay: job.wage,
        recreationalAllowed: true,
        metadata: { jobId: job.id, paidVacation: true },
      },
    }],
    locked: false,
  } : job && workAccess.available ? {
    id: job.id,
    title: job.title,
    active: true,
    weeklyPay: job.wage,
    capacityCost: careerPlannerWorkCost(job),
    energyCost: Math.max(0, -Number(job.energy || 0)),
    fatigueGain: Math.max(0, Number(job.fatigue || 0)),
    // Une entrée représente toute la semaine de travail; elle est réglée le
    // vendredi pour que les choix du camp influencent réellement la fatigue.
    shifts: [{ day: "friday", locked: false }],
    locked: false,
  } : null;
  return {
    weekKey: careerPlannerWeekKey(capsule),
    careerStatus: state.careerStatus,
    capacity: {
      total: capacityTotal,
      unavailable: careerPlannerUnavailableCapacity(capsule, career, job, capacityTotal),
    },
    condition: cloneData(capsule.timeState.condition),
    work,
    workBlockedReason: job && !paidVacationPlanned && !workAccess.available ? workAccess.reason : "",
    supplements: careerPlannerSupplementConfig(capsule),
    limits: {
      recreationalPhysicalActivities: 2,
      family: {
        ...CAREER_WEEK_FAMILY_LIMITS,
        home: state.careerStatus === "recreational" ? 1 : CAREER_WEEK_FAMILY_LIMITS.home,
      },
    },
  };
}

function careerPlannerSignature(capsule = ensureCareerPreviewCapsule()) {
  const runtime = normalizeCareerPreviewRuntime(capsule);
  const supplementState = runtime.career.supplementState;
  return JSON.stringify([
    CAREER_WEEK_RULESET_VERSION,
    capsule.timeState.clock.week,
    state.careerStatus,
    runtime.career.jobId,
    runtime.career.gymWeeks,
    runtime.career.strengthGymWeeks,
    state.level,
    Math.round(capsule.timeState.condition.energy),
    Math.round(capsule.timeState.condition.fatigue),
    runtimeCareerTrainingRhythm(runtime.career),
    runtime.career.recoveryConsequence || null,
    runtime.career.vacationBankWeeks,
    supplementState?.inventory || {},
    supplementState?.weeklyUsage || {},
    runtime.career.trainerState?.activeProgram || null,
  ]);
}

function careerPlannerBoxingAggregate(metadata = {}, options = {}) {
  const capsule = ensureCareerPreviewCapsule();
  const blockIds = Array.isArray(metadata.blocks)
    ? metadata.blocks.filter(id => window.BoxeurTraining.EXERCISES[id])
    : [];
  let session;
  if (blockIds.length) {
    session = window.BoxeurTraining.createCustomSession(blockIds, {
      label: options.label || metadata.label || "Séance personnalisée",
      focus: metadata.focus || "balanced",
      source: options.source || metadata.source || "custom",
    });
  } else {
    session = window.BoxeurTraining.buildCoachSession(capsule.timeState, careerTrainingContext());
  }
  const aggregate = window.BoxeurTraining.aggregateSession(session);
  return { session: aggregate.session, totals: aggregate.totals };
}

function careerPlannerHomeAggregate(selectionInput) {
  const hasExplicitSelection = Array.isArray(selectionInput);
  const selection = hasExplicitSelection
    ? [...new Set(selectionInput.filter(id => CAREER_HOME_ACTIVITIES[id]?.category === "home-training"))].slice(0, 3)
    : [];
  const chosen = selection.length ? selection : hasExplicitSelection ? [] : ["shadow-boxing", "basement-bag"];
  const totals = chosen.reduce((sum, id) => {
    const activity = CAREER_HOME_ACTIVITIES[id];
    sum.energyCost += activity.energyCost;
    sum.fatigueGain += activity.fatigueGain;
    sum.xp += activity.xp;
    Object.keys(sum.stimulus).forEach(key => { sum.stimulus[key] += Number(activity.stimulus[key] || 0); });
    return sum;
  }, { energyCost: 0, fatigueGain: 0, fatigueRelief: 0, fatigueDelta: 0, xp: 0, wear: 0, injuryRisk: 0, stimulus: { technique: 0, power: 0, cardio: 0, defense: 0 } });
  totals.fatigueDelta = totals.fatigueGain;
  return { selection: chosen, totals };
}

function careerPlannerActivityDefinition(activityId, metadata = {}) {
  const id = String(activityId || "");
  if (["group-class", "boxing-coach", "boxing-custom"].includes(id)) {
    const groupClass = id === "group-class";
    const custom = id === "boxing-custom";
    const aggregate = careerPlannerBoxingAggregate(metadata, {
      label: groupClass ? "Cours de groupe · fondamentaux" : custom ? "Séance de boxe personnalisée" : "Séance de l’entraîneur",
      source: custom ? "custom" : "coach",
    });
    const familyId = groupClass ? "group" : "boxing";
    const capacityExtraBase = custom ? CAREER_CUSTOM_SESSION_BASE_COST : 0;
    const programSignature = `${familyId}:${aggregate.session.blocks.map(block => block.id).sort().join("+")}`;
    return {
      id,
      label: groupClass ? "Cours de groupe" : custom ? "Séance de boxe personnalisée" : "Séance de l’entraîneur",
      category: groupClass ? "group-class" : "boxing",
      location: "boxing-gym",
      physical: true,
      capacityCost: careerPlannerLoadCost(aggregate.totals.energyCost, aggregate.totals.fatigueDelta, 4, capacityExtraBase),
      energyCost: aggregate.totals.energyCost,
      fatigueDelta: aggregate.totals.fatigueDelta,
      recreationalAllowed: groupClass,
      metadata: {
        plannerType: id,
        blocks: aggregate.session.blocks.map(block => block.id),
        focus: aggregate.session.focus,
        source: custom ? "custom" : "coach",
        xp: aggregate.totals.xp,
        wear: aggregate.totals.wear,
        injuryRisk: aggregate.totals.injuryRisk,
        familyId,
        programSignature,
        capacityExtraBase,
        capacityMinimum: 4,
        fatigueGain: aggregate.totals.fatigueGain,
        fatigueRelief: aggregate.totals.fatigueRelief,
      },
    };
  }
  if (["strength-quick", "strength-custom"].includes(id)) {
    const selection = id === "strength-quick"
      ? ["dynamic_warmup", "machine_conditioning", "mobility_cooldown"]
      : Array.isArray(metadata.selection) ? metadata.selection : [];
    const aggregate = window.BoxeurStrength.aggregateSelection(selection);
    if (id === "strength-custom") {
      const hasWarmup = aggregate.activityIds.includes("dynamic_warmup");
      const hasCooldown = aggregate.activityIds.includes("mobility_cooldown");
      const hasWork = aggregate.activities.some(activity => activity.countsAsWork);
      if (!hasWarmup || !hasWork || !hasCooldown) {
        throw new Error("Une séance personnalisée doit contenir un échauffement, un exercice principal et un retour au calme.");
      }
    }
    const capacityExtraBase = id === "strength-custom" ? CAREER_CUSTOM_SESSION_BASE_COST : 0;
    return {
      id,
      label: id === "strength-quick" ? "Cours de CrossFit" : "Séance de musculation personnalisée",
      category: "strength",
      location: "strength-gym",
      physical: true,
      capacityCost: careerPlannerLoadCost(aggregate.totals.energyCost, aggregate.totals.fatigueDelta, 4, capacityExtraBase),
      energyCost: aggregate.totals.energyCost,
      fatigueDelta: aggregate.totals.fatigueDelta,
      metadata: {
        plannerType: id,
        selection: aggregate.activityIds,
        xp: aggregate.totals.xp,
        wear: aggregate.totals.wear,
        injuryRisk: aggregate.totals.injuryRisk,
        familyId: "strength",
        programSignature: `strength:${aggregate.activityIds.slice().sort().join("+")}`,
        capacityExtraBase,
        capacityMinimum: 4,
        fatigueGain: aggregate.totals.fatigueGain,
        fatigueRelief: aggregate.totals.fatigueRelief,
      },
    };
  }
  if (["roadwork-short", "roadwork-long", "roadwork-intervals"].includes(id)) {
    const activity = CAREER_HOME_ACTIVITIES[id];
    const capacityMinimum = id === "roadwork-short" ? 5 : 7;
    return {
      id,
      label: activity.label,
      category: "home",
      location: "home",
      physical: true,
      capacityCost: careerPlannerLoadCost(activity.energyCost, activity.fatigueGain, capacityMinimum),
      energyCost: activity.energyCost,
      fatigueDelta: activity.fatigueGain,
      recreationalAllowed: id === "roadwork-short",
      metadata: {
        plannerType: id,
        runningType: id.replace("roadwork-", ""),
        xp: activity.xp,
        familyId: "home",
        programSignature: `home:${id}`,
        capacityMinimum,
        fatigueGain: activity.fatigueGain,
        fatigueRelief: activity.fatigueRelief,
      },
    };
  }
  if (["home-quick", "home-custom"].includes(id)) {
    const aggregate = careerPlannerHomeAggregate(id === "home-custom" ? metadata.selection : ["shadow-boxing", "basement-bag"]);
    if (id === "home-custom" && aggregate.selection.length === 0) {
      throw new Error("Choisis au moins une activité pour bâtir l’entraînement maison.");
    }
    const capacityExtraBase = id === "home-custom" ? CAREER_CUSTOM_SESSION_BASE_COST : 0;
    return {
      id,
      label: id === "home-quick" ? "Entraînement maison rapide" : "Entraînement maison personnalisé",
      category: "home",
      location: "home",
      physical: true,
      capacityCost: careerPlannerLoadCost(aggregate.totals.energyCost, aggregate.totals.fatigueDelta, 5, capacityExtraBase),
      energyCost: aggregate.totals.energyCost,
      fatigueDelta: aggregate.totals.fatigueDelta,
      recreationalAllowed: id === "home-quick",
      metadata: {
        plannerType: id,
        selection: aggregate.selection,
        xp: aggregate.totals.xp,
        familyId: "home",
        programSignature: `home:${aggregate.selection.slice().sort().join("+")}`,
        capacityExtraBase,
        capacityMinimum: 5,
        fatigueGain: aggregate.totals.fatigueGain,
        fatigueRelief: aggregate.totals.fatigueRelief,
      },
    };
  }
  if (id === "rest") {
    return {
      id,
      label: "Journée de repos",
      category: "recovery",
      location: "home",
      physical: false,
      capacityCost: CAREER_BALANCE.WEEK.recovery.restCapacityCost,
      energyGain: CAREER_BALANCE.WEEK.recovery.restEnergyGain,
      fatigueDelta: -CAREER_BALANCE.WEEK.recovery.restFatigueRelief,
      recreationalAllowed: true,
      metadata: { plannerType: id },
    };
  }
  if (id === "meal") {
    return {
      id,
      label: "Repas maison de récupération",
      category: "home",
      location: "home",
      physical: false,
      capacityCost: 0,
      energyGain: CAREER_BALANCE.WEEK.recovery.mealEnergyGain,
      fatigueDelta: -CAREER_BALANCE.WEEK.recovery.mealFatigueRelief,
      recreationalAllowed: true,
      metadata: { plannerType: id, moneyCost: CAREER_BALANCE.WEEK.recovery.mealCost },
    };
  }
  if (id === "private-training") {
    const capsule = ensureCareerPreviewCapsule();
    const runtime = normalizeCareerPreviewRuntime(capsule);
    const program = window.BoxeurTrainer.getPublicState(runtime.career.trainerState).activeProgram;
    const trainer = program ? window.BoxeurTrainer.getTrainer(program.trainerId) : null;
    if (!program || !trainer) throw new Error("Aucun programme privé n’est actif.");
    const location = careerTrainerLocationForTarget(program.target);
    const familyId = location === "strength-gym" ? "strength" : "boxing";
    return {
      id,
      label: `Séance privée · ${trainer.label}`,
      category: "private-training",
      location,
      physical: true,
      capacityCost: careerPlannerLoadCost(trainer.energyCost, trainer.fatigue),
      energyCost: trainer.energyCost,
      fatigueDelta: trainer.fatigue,
      metadata: {
        plannerType: id,
        programId: program.id,
        trainerId: trainer.id,
        target: program.target,
        familyId,
        programSignature: `${familyId}:private:${trainer.id}:${program.target}`,
        capacityExtraBase: 0,
        capacityMinimum: 4,
        fatigueGain: trainer.fatigue,
        fatigueRelief: 0,
      },
    };
  }
  if (id === "sparring") {
    return {
      id,
      label: "Sparring technique interactif",
      category: "sparring",
      location: "boxing-gym",
      physical: true,
      capacityCost: metadata.immediate === true ? 18 : careerPlannerLoadCost(18, 14, 12),
      energyCost: 18,
      fatigueDelta: 14,
      metadata: {
        plannerType: id,
        completed: metadata.completed === true,
        immediate: metadata.immediate === true,
        familyId: "sparring",
        programSignature: "sparring:technical",
        capacityExtraBase: 0,
        capacityMinimum: 12,
        fatigueGain: 14,
        fatigueRelief: 0,
      },
    };
  }
  throw new Error("Cette activité n’est pas reconnue par le planificateur.");
}

function isCareerOfficialFightWeek(capsule = ensureCareerPreviewCapsule()) {
  const currentWeek = Number(capsule?.timeState?.clock?.week || state.week);
  const scheduled = state.scheduledFight;
  const scheduledOfficial = Boolean(
    scheduled
      && !scheduled.isPracticeSparring
      && !scheduled.isRecreationalSparring
      && !scheduled.isDeveloperBout
      && Number(scheduled.week) <= currentWeek,
  );
  const activeTournamentWeek = Boolean(
    state.activeTournament
      && state.activeTournament.status !== "completed"
      && Number(state.activeTournament.startWeek) <= currentWeek,
  );
  return scheduledOfficial || activeTournamentWeek;
}

function careerPlannerActivityAccess(activityId) {
  const capsule = ensureCareerPreviewCapsule();
  const runtime = normalizeCareerPreviewRuntime(capsule);
  const id = String(activityId || "");
  const conditionAccess = careerConditionActivityAccess(id, capsule);
  if (!conditionAccess.available) return conditionAccess;
  if (["group-class", "boxing-coach", "boxing-custom", "sparring"].includes(id) && runtime.career.gymWeeks <= 0) {
    return { available: false, reason: "Un abonnement actif au GYM de boxe est requis." };
  }
  if (["strength-quick", "strength-custom"].includes(id) && runtime.career.strengthGymWeeks <= 0) {
    return { available: false, reason: "Un abonnement actif au gym de musculation est requis." };
  }
  if (state.careerStatus === "recreational" && !["group-class", "home-quick", "roadwork-short", "rest"].includes(id)) {
    return { available: false, reason: "Cette activité se débloque après le passage amateur." };
  }
  if (id === "private-training") {
    const program = runtime.career.trainerState?.activeProgram;
    if (!program) return { available: false, reason: "Choisis d’abord un programme avec un entraîneur privé." };
    const physicalProgram = ["power", "cardio"].includes(program.target);
    if (physicalProgram && runtime.career.strengthGymWeeks <= 0) {
      return { available: false, reason: "Un abonnement actif au gym de musculation est requis pour ce préparateur." };
    }
    if (!physicalProgram && runtime.career.gymWeeks <= 0) {
      return { available: false, reason: "Un abonnement actif au GYM de boxe est requis pour cet entraîneur." };
    }
  }
  if (id === "sparring") {
    if (state.careerStatus === "amateur" && isCareerOfficialFightWeek(capsule)) {
      return { available: false, reason: "Le sparring n’est pas disponible pendant une semaine de combat officiel." };
    }
    if (state.careerStatus !== "amateur" && state.scheduledFight) {
      return { available: false, reason: "Un autre rendez-vous de ring est déjà prévu." };
    }
  }
  if (id === "meal" && runtime.career.money < 15) {
    return { available: false, reason: "Il faut 15 $ pour préparer ce repas." };
  }
  return { available: true, reason: "" };
}

function careerPlannerRebuild(capsule, previous) {
  const paidVacationPlanned = previous?.paidVacationPlanned === true;
  const baseConfig = careerPlannerBaseConfig(capsule, { paidVacationPlanned });
  const workOptedOut = previous?.workOptedOut === true && !paidVacationPlanned;
  if (workOptedOut) baseConfig.work = null;
  let rebuilt = window.BoxeurWeekPlanner.createPlanner(baseConfig);
  rebuilt.workOptedOut = workOptedOut;
  rebuilt.paidVacationPlanned = paidVacationPlanned && Boolean(baseConfig.work);
  rebuilt.workBlockedReason = workOptedOut ? "" : (baseConfig.workBlockedReason || "");
  const oldEntries = Array.isArray(previous?.entries) ? previous.entries.filter(entry => !entry.preReserved) : [];
  oldEntries.forEach(entry => {
    try {
      const access = careerPlannerActivityAccess(entry.activityId);
      const alreadyConsumed = entry.activityId === "sparring" && entry.metadata?.immediate === true;
      if (!access.available && !alreadyConsumed) throw new Error(access.reason);
      const definition = careerPlannerActivityDefinition(entry.activityId, entry.metadata || {});
      const added = window.BoxeurWeekPlanner.addActivity(rebuilt, definition, {
        day: entry.day,
        source: entry.source,
      });
      rebuilt = added.state;
      if (entry.supplementId) {
        const reserved = careerPlannerReserveSupplementOnState(rebuilt, added.result.entry.id, entry.supplementId);
        rebuilt = reserved.state;
      }
    } catch (error) {
      console.warn(`[Boxeur Deux] Choix hebdomadaire retiré pendant la revalidation : ${entry.activityId}`, error.message);
    }
  });
  rebuilt.mode = previous?.mode === "quick" ? "quick" : "manual";
  return rebuilt;
}

function ensureCareerWeekPlanner(capsule = ensureCareerPreviewCapsule()) {
  if (!capsule || !window.BoxeurWeekPlanner) return null;
  const runtime = normalizeCareerPreviewRuntime(capsule);
  const signature = careerPlannerSignature(capsule);
  const current = runtime.weekPlanner;
  const currentWeek = careerPlannerWeekKey(capsule);
  if (!current || current.weekKey !== currentWeek || current.status !== "draft" || runtime.weekPlannerSignature !== signature) {
    runtime.weekPlanner = careerPlannerRebuild(capsule, current?.weekKey === currentWeek && current?.status === "draft" ? current : null);
    runtime.weekPlannerSignature = signature;
  }
  return runtime.weekPlanner;
}

function careerPlannerStore(capsule, plannerState) {
  const runtime = normalizeCareerPreviewRuntime(capsule);
  runtime.weekPlanner = plannerState;
  runtime.weekPlannerSignature = careerPlannerSignature(capsule);
  persistCareerPreviewCapsule();
  renderCareerWorldPreview(true);
  return plannerState;
}

function careerPlannerEntryCount(plannerState, activityId) {
  return plannerState.entries.filter(entry => !entry.preReserved && entry.activityId === activityId).length;
}

function careerPlannerLocationEntries(plannerState, locationId) {
  return plannerState.entries
    .filter(entry => !entry.preReserved && entry.location === locationId)
    .map(entry => ({
      id: entry.id,
      activityId: entry.activityId,
      label: entry.metadata?.gainMultiplier < 1 ? `${entry.label} · gains 85 %` : entry.label,
      cost: entry.capacityCost,
      gainMultiplier: safeNumber(entry.metadata?.gainMultiplier, 1, .5, 1, false),
      removable: !entry.locked && !entry.metadata?.completed && !entry.metadata?.immediate,
    }));
}

function careerPlannerActionState(activityId, metadata = {}) {
  const capsule = ensureCareerPreviewCapsule();
  const plannerState = ensureCareerWeekPlanner(capsule);
  const access = careerPlannerActivityAccess(activityId);
  if (!access.available) return { ...access, planned: false, entryId: null };
  const existingEntries = plannerState.entries.filter(entry => !entry.preReserved && entry.activityId === activityId);
  const existing = existingEntries[0] || null;
  const toggleActivity = CAREER_WEEK_TOGGLE_ACTIVITY_IDS.has(activityId);
  if (toggleActivity && existing) {
    return { available: true, reason: "", planned: true, plannedCount: existingEntries.length, entryId: existing.id };
  }
  const max = CAREER_WEEK_ACTIVITY_LIMITS[activityId];
  if (max != null && existingEntries.length >= max) {
    return { available: false, reason: "Le maximum hebdomadaire de cette activité est atteint.", planned: existingEntries.length > 0, plannedCount: existingEntries.length, entryId: existing?.id || null };
  }
  try {
    const definition = careerPlannerActivityDefinition(activityId, metadata);
    const quote = window.BoxeurWeekPlanner.quoteActivity(plannerState, definition);
    return {
      available: quote.ok,
      reason: quote.reason || "",
      planned: false,
      plannedCount: existingEntries.length,
      entryId: existing?.id || null,
      quote,
    };
  } catch (error) {
    return { available: false, reason: error.message || "Cette activité est indisponible.", planned: false, plannedCount: existingEntries.length, entryId: existing?.id || null };
  }
}

function careerPlannerReserveSupplementOnState(plannerState, entryId, productId) {
  const entry = plannerState.entries.find(item => item.id === entryId);
  if (!entry) throw new Error("La séance choisie n’existe plus.");
  if (entry.activityId === "sparring") throw new Error("Les suppléments ne s’appliquent pas au sparring interactif.");
  let working = plannerState;
  const previousReservation = working.entries.find(item => item.id !== entryId && item.supplementId === productId);
  if (previousReservation) {
    const unreserved = window.BoxeurWeekPlanner.unreserveSupplement(working, previousReservation.id);
    working = unreserved.state;
    const restoredEntry = working.entries.find(item => item.id === previousReservation.id);
    const restoredMetadata = { ...restoredEntry.metadata };
    const restoredCost = safeNumber(restoredMetadata.supplementBaseCapacityCost, restoredEntry.capacityCost, 0, 100);
    const restoredEnergy = safeNumber(restoredMetadata.supplementBaseEnergyCost, restoredEntry.energyCost, 0, 100, false);
    const restoredFatigue = safeNumber(restoredMetadata.supplementBaseFatigueDelta, restoredEntry.fatigueDelta, -100, 100, false);
    delete restoredMetadata.supplementBaseCapacityCost;
    delete restoredMetadata.supplementBaseEnergyCost;
    delete restoredMetadata.supplementBaseFatigueDelta;
    delete restoredMetadata.supplementBaseFatigueGain;
    delete restoredMetadata.supplementBaseFatigueRelief;
    delete restoredMetadata.supplementCapacityRelief;
    working = window.BoxeurWeekPlanner.editActivity(working, restoredEntry.id, {
      capacityCost: restoredCost,
      energyCost: restoredEnergy,
      fatigueDelta: restoredFatigue,
      metadata: restoredMetadata,
    }).state;
  }
  const currentEntry = working.entries.find(item => item.id === entryId);
  const product = window.BoxeurSupplements.CATALOG[productId];
  if (!product) throw new Error("Ce supplément n’existe plus.");
  const baseCost = safeNumber(currentEntry.metadata?.supplementBaseCapacityCost, currentEntry.capacityCost, 0, 100);
  const baseEnergy = safeNumber(currentEntry.metadata?.supplementBaseEnergyCost, currentEntry.energyCost, 0, 100, false);
  const baseFatigueGain = safeNumber(
    currentEntry.metadata?.supplementBaseFatigueGain,
    currentEntry.metadata?.fatigueGain ?? Math.max(0, currentEntry.fatigueDelta),
    0,
    100,
    false,
  );
  const baseFatigueRelief = safeNumber(
    currentEntry.metadata?.supplementBaseFatigueRelief,
    currentEntry.metadata?.fatigueRelief ?? Math.max(0, -currentEntry.fatigueDelta),
    0,
    100,
    false,
  );
  const adjustedEnergy = Math.round(baseEnergy * safeNumber(product.effects?.energyCostMultiplier, 1, .5, 1.5, false) * 100) / 100;
  const adjustedFatigueGain = Math.round(baseFatigueGain * safeNumber(product.effects?.fatigueGainMultiplier, 1, .5, 1.5, false) * 100) / 100;
  const adjustedFatigueRelief = Math.round((baseFatigueRelief + safeNumber(product.effects?.fatigueRelief, 0, 0, 20, false)) * 100) / 100;
  const adjustedFatigueDelta = adjustedFatigueGain - adjustedFatigueRelief;
  const adjustedCost = careerPlannerLoadCost(
    adjustedEnergy,
    adjustedFatigueDelta,
    safeNumber(currentEntry.metadata?.capacityMinimum, 4, 1, 20),
    safeNumber(currentEntry.metadata?.capacityExtraBase, 0, 0, 10),
  );
  const relief = Math.max(0, baseCost - adjustedCost);
  const edited = window.BoxeurWeekPlanner.editActivity(working, entryId, {
    capacityCost: adjustedCost,
    energyCost: adjustedEnergy,
    fatigueDelta: adjustedFatigueDelta,
    metadata: {
      ...currentEntry.metadata,
      supplementBaseCapacityCost: baseCost,
      supplementBaseEnergyCost: baseEnergy,
      supplementBaseFatigueDelta: currentEntry.fatigueDelta,
      supplementBaseFatigueGain: baseFatigueGain,
      supplementBaseFatigueRelief: baseFatigueRelief,
      supplementCapacityRelief: relief,
    },
  });
  working = edited.state;
  return window.BoxeurWeekPlanner.reserveSupplement(working, entryId, productId);
}

function addCareerPlannerActivity(activityId, metadata = {}, options = {}) {
  const capsule = ensureCareerPreviewCapsule();
  if (!capsule) return null;
  const access = careerPlannerActivityAccess(activityId);
  if (!access.available) return showToast(access.reason);
  let plannerState = ensureCareerWeekPlanner(capsule);
  const max = CAREER_WEEK_ACTIVITY_LIMITS[activityId];
  const existing = plannerState.entries.find(entry => !entry.preReserved && entry.activityId === activityId);
  if (options.toggle === true && existing) return removeCareerPlannerActivity(existing.id, { reopen: options.reopen });
  if (max != null && careerPlannerEntryCount(plannerState, activityId) >= max) return showToast(`Cette activité est déjà planifiée au maximum ${max} fois cette semaine.`);
  try {
    const definition = careerPlannerActivityDefinition(activityId, metadata);
    const defaultDay = activityId === "rest" ? "sunday" : activityId === "meal" ? "wednesday" : undefined;
    const outcome = window.BoxeurWeekPlanner.addActivity(plannerState, definition, {
      preferredDay: options.preferredDay || defaultDay,
      source: options.source,
    });
    careerPlannerStore(capsule, outcome.state);
    const reservationLabel = outcome.result.capacityReserved > 0
      ? `−${outcome.result.capacityReserved} de capacité hebdomadaire`
      : "aucun coût de capacité hebdomadaire";
    showToast(`${outcome.result.entry.label} ajouté à la semaine · ${reservationLabel}`);
    if (options.reopen) openCareerLocation(options.reopen);
    return outcome;
  } catch (error) {
    showToast(error.message || "Cette activité ne peut pas être ajoutée à la semaine.");
    return null;
  }
}

function removeCareerPlannerActivity(entryId, options = {}) {
  const capsule = ensureCareerPreviewCapsule();
  if (!capsule) return null;
  try {
    const plannerState = ensureCareerWeekPlanner(capsule);
    const entry = plannerState.entries.find(item => item.id === entryId);
    if (entry?.metadata?.paidVacation === true) {
      return setCareerPlannerPaidVacation(false, { reopen: options.reopen });
    }
    if (entry?.metadata?.immediate) {
      showToast("Le sparring commencé ne peut pas être retiré : ses 18 points de capacité ont été consommés.");
      return null;
    }
    const outcome = window.BoxeurWeekPlanner.removeActivity(plannerState, entryId);
    if (entry?.source === "work") outcome.state.workOptedOut = true;
    careerPlannerStore(capsule, outcome.state);
    showToast(`${entry?.label || "Activité"} retiré du programme · énergie remboursée`);
    if (options.reopen) openCareerLocation(options.reopen);
    return outcome;
  } catch (error) {
    showToast(error.message || "Cette activité ne peut pas être retirée.");
    return null;
  }
}

function setCareerPlannerWorkAttendance(planned) {
  const capsule = ensureCareerPreviewCapsule();
  if (!capsule || !window.BoxeurWeekPlanner) return null;
  const runtime = normalizeCareerPreviewRuntime(capsule);
  const job = jobs.find(item => item.id === runtime.career.jobId) || null;
  if (!job) return showToast("Choisis d’abord un emploi.");
  const plannerState = ensureCareerWeekPlanner(capsule);
  const workEntry = plannerState.entries.find(entry => entry.source === "work");
  if (planned && workEntry?.metadata?.paidVacation === true) {
    return setCareerPlannerPaidVacation(false);
  }
  if (!planned) {
    if (!workEntry) return null;
    return removeCareerPlannerActivity(workEntry.id, { reopen: "work" });
  }
  if (workEntry) return null;
  try {
    const access = careerPlannerWorkAccess(capsule, job);
    if (!access.available) throw new Error(access.reason);
    const previous = cloneData(plannerState);
    previous.workOptedOut = false;
    const rebuilt = careerPlannerRebuild(capsule, previous);
    rebuilt.revision = plannerState.revision + 1;
    careerPlannerStore(capsule, rebuilt);
    openCareerLocation("work");
    showToast(`${job.title} ajouté à la semaine · paie de ${job.wage} $ prévue`);
    return rebuilt;
  } catch (error) {
    showToast(error.message || "Le travail ne peut pas être ajouté à cette semaine.");
    return null;
  }
}

function setCareerPlannerPaidVacation(planned, options = {}) {
  const capsule = ensureCareerPreviewCapsule();
  if (!capsule || !window.BoxeurWeekPlanner) return null;
  const runtime = normalizeCareerPreviewRuntime(capsule);
  const job = jobs.find(item => item.id === runtime.career.jobId) || null;
  if (!job) return showToast("Choisis d’abord un emploi.");
  const plannerState = ensureCareerWeekPlanner(capsule);
  const vacationEntry = plannerState.entries.find(entry => entry.source === "work" && entry.metadata?.paidVacation === true);
  if (planned && vacationEntry) return null;
  if (!planned && !vacationEntry) return null;
  if (planned && safeNumber(runtime.career.vacationBankWeeks, 0, 0, MAX_PAID_VACATION_WEEKS) <= 0) {
    return showToast("Aucune semaine de vacances payées n’est encore en banque.");
  }
  try {
    if (!planned) {
      const access = careerPlannerWorkAccess(capsule, job);
      if (!access.available) throw new Error(`Les vacances restent prévues : ${access.reason}`);
    }
    const previous = cloneData(plannerState);
    previous.paidVacationPlanned = planned;
    previous.workOptedOut = false;
    const rebuilt = careerPlannerRebuild(capsule, previous);
    const expectedManualCount = previous.entries.filter(entry => !entry.preReserved).length;
    const rebuiltManualCount = rebuilt.entries.filter(entry => !entry.preReserved).length;
    if (rebuiltManualCount !== expectedManualCount) {
      throw new Error(planned
        ? "Les vacances ne peuvent pas être ajoutées sans modifier le programme actuel."
        : "Les vacances restent prévues : retire d’abord une activité pour pouvoir remettre le travail.");
    }
    const rebuiltVacation = rebuilt.entries.find(entry => entry.source === "work" && entry.metadata?.paidVacation === true);
    const rebuiltWork = rebuilt.entries.find(entry => entry.source === "work" && entry.metadata?.paidVacation !== true);
    if (planned && !rebuiltVacation) throw new Error("Cette semaine de vacances n’est plus disponible.");
    if (!planned && !rebuiltWork) throw new Error("Le travail ne peut pas être remis dans cette semaine.");
    rebuilt.revision = plannerState.revision + 1;
    careerPlannerStore(capsule, rebuilt);
    if (options.reopen === "week") openCareerWeekPlan();
    else openCareerLocation("work");
    showToast(planned
      ? `Vacances payées prévues · ${job.wage} $ de paie maintenue`
      : `${job.title} remis à la semaine · vacances conservées en banque`);
    return rebuilt;
  } catch (error) {
    showToast(error.message || "Les vacances ne peuvent pas être modifiées cette semaine.");
    return null;
  }
}

function applyCareerQuickWeekPlan() {
  const capsule = ensureCareerPreviewCapsule();
  if (!capsule) return;
  const blocker = careerWeekQuickBlockReason(careerCareerView());
  if (blocker) return showToast(blocker);
  let plannerState = ensureCareerWeekPlanner(capsule);
  const candidates = [];
  if (state.careerStatus === "recreational") {
    candidates.push({ id: "group-class", day: "tuesday" }, { id: "rest", day: "sunday" });
  } else {
    // La récupération est la deuxième priorité du plan automatique. Ainsi, un
    // emploi exigeant réduit le volume d'entraînement au lieu de supprimer le
    // repos sans avertissement lorsque la capacité devient serrée.
    candidates.push({ id: "boxing-coach", day: "tuesday" });
    candidates.push({ id: "rest", day: "sunday" });
    if (careerCareerView().strengthGymWeeks > 0) candidates.push({ id: "strength-quick", day: "thursday" });
    else candidates.push({ id: "home-quick", day: "thursday" });
  }
  const accepted = [];
  for (const candidate of candidates) {
    try {
      const definition = careerPlannerActivityDefinition(candidate.id);
      window.BoxeurWeekPlanner.applyQuickPlan(plannerState, [
        ...accepted,
        { activity: definition, day: candidate.day },
      ]);
      accepted.push({ activity: definition, day: candidate.day });
    } catch (error) {
      if (error.code !== "WEEKLY_CAPACITY_EXCEEDED") console.warn("[Boxeur Deux] Choix rapide ignoré :", error.message);
    }
  }
  try {
    const outcome = window.BoxeurWeekPlanner.applyQuickPlan(plannerState, accepted);
    careerPlannerStore(capsule, outcome.state);
    openCareerWeekPlan();
    showToast("Plan rapide créé · tu peux encore le modifier avant de confirmer.");
  } catch (error) {
    showToast(error.message || "Le plan rapide ne peut pas être préparé.");
  }
}

function careerWeekQuickBlockReason(career = careerCareerView()) {
  const onboarding = careerOnboardingView();
  if (onboarding && !onboarding.gates.closeWeek.allowed) return onboarding.gates.closeWeek.reason;
  if (career.introJobRequired && !career.jobId) return "Choisis d’abord ton emploi de départ dans le lieu Emploi.";
  if (career.initialGymRequired && career.gymWeeks <= 0) return "Inscris-toi d’abord au GYM de boxe. Ton budget de départ couvre le premier mois.";
  if (career.careerFightGate?.status === "ready") return "La semaine est terminée : rends-toi maintenant à l’aréna pour régler le combat.";
  const capsule = ensureCareerPreviewCapsule();
  const weekEnd = capsule?.timeState ? careerWeekStartSlot(capsule.timeState) + window.BoxeurTime.PERIODS_PER_WEEK : 0;
  const importantAppointment = capsule?.timeState?.appointments?.find(appointment => (
    Number(appointment.startSlot) >= Number(capsule.timeState.clock.absoluteSlot)
      && Number(appointment.startSlot) < weekEnd
      && window.BoxeurWeek?.isImportantAppointment(appointment)
      && !isCareerFightAppointment(appointment)
  ));
  if (importantAppointment) return `${importantAppointment.title || "Un rendez-vous"} doit être réglé avant de confirmer toute la semaine.`;
  return "";
}

function careerWeekViewContext() {
  const capsule = ensureCareerPreviewCapsule();
  const career = careerCareerView();
  const plannerState = ensureCareerWeekPlanner(capsule);
  const preview = window.BoxeurWeekPlanner.previewPlan(plannerState);
  const blocker = careerWeekQuickBlockReason(career);
  const remainingRatio = preview.capacity.total > 0 ? preview.capacity.remaining / preview.capacity.total : 0;
  const zone = preview.capacity.remaining <= 0
    ? "blocked"
    : remainingRatio <= .18 ? "critical" : remainingRatio <= .38 ? "low" : "comfortable";
  const labels = {
    work: "Emploi",
    boxing: "Boxe",
    "group-class": "Cours de groupe",
    strength: "Musculation",
    sparring: "Sparring",
    "private-training": "Cours privé",
    recovery: "Récupération",
    home: "Maison",
  };
  const rhythmPenalty = runtimeCareerTrainingRhythm(career);
  const rhythmCapacity = isCompetitiveCareer() ? rhythmPenalty * 5 : 0;
  const activeRecovery = careerActiveRecoveryConsequence(capsule, normalizeCareerPreviewRuntime(capsule).career);
  const plannedItems = preview.entries.map(entry => {
    const effects = [];
    if (entry.pay > 0) effects.push(`+${Math.round(entry.pay)} $ à la fin de la semaine`);
    if (entry.metadata?.moneyCost > 0) effects.push(`−${Math.round(entry.metadata.moneyCost)} $ à la confirmation`);
    if (entry.energyCost > 0) effects.push(`−${Math.round(entry.energyCost)} énergie pendant l’activité`);
    if (entry.energyGain > 0) effects.push(`+${Math.round(entry.energyGain)} énergie physique`);
    if (entry.fatigueDelta < 0) effects.push(`−${Math.round(Math.abs(entry.fatigueDelta))} fatigue`);
    if (entry.supplementId) effects.push(`${window.BoxeurSupplements.CATALOG[entry.supplementId]?.label || "Supplément"} réservé`);
    if (entry.metadata?.gainMultiplier < 1) effects.push("Répétition exacte · 85 % des gains");
    if (entry.metadata?.completed) effects.push("Déjà joué cette semaine");
    return {
      id: entry.id,
      label: entry.label,
      detail: effects.join(" · ") || "Inclus dans le programme.",
      dayLabel: CAREER_PLANNER_DAY_LABELS[entry.day] || entry.day,
      cost: entry.capacityCost,
      tone: entry.preReserved ? "neutral" : entry.metadata?.completed ? "positive" : entry.energyCost >= 20 ? "warning" : "positive",
      removable: !entry.locked && !entry.metadata?.completed && !entry.metadata?.immediate,
      kindLabel: entry.metadata?.paidVacation === true ? "Vacances" : labels[entry.category] || "Activité",
    };
  });
  const items = activeRecovery ? [{
    id: `system-recovery-${activeRecovery.week}`,
    label: activeRecovery.kind === "hospital" ? "Nuit à l’hôpital" : "Repos forcé",
    detail: activeRecovery.kind === "hospital"
      ? "Récupération imposée après avoir épuisé toute la réserve physique."
      : "Récupération imposée par l’état physique de la semaine précédente.",
    dayLabel: "Début de semaine",
    cost: activeRecovery.capacityCost,
    tone: "critical",
    removable: false,
    kindLabel: "Récupération",
  }, ...plannedItems] : plannedItems;
  const unavailableDetail = activeRecovery
    ? `${preview.capacity.unavailable} point${preview.capacity.unavailable > 1 ? "s" : ""} occupé${preview.capacity.unavailable > 1 ? "s" : ""} au départ, dont ${activeRecovery.capacityCost} par ${activeRecovery.kind === "hospital" ? "la nuit à l’hôpital" : "le repos forcé"}. Ton maximum permanent reste intact.`
    : preview.capacity.unavailable > 0
      ? `${preview.capacity.unavailable} point${preview.capacity.unavailable > 1 ? "s" : ""} occupé${preview.capacity.unavailable > 1 ? "s" : ""} au départ${rhythmCapacity > 0 ? `, dont ${rhythmCapacity} par le manque d’entraînement` : ""}${preview.capacity.unavailable > rhythmCapacity ? `${rhythmCapacity > 0 ? " et" : ", dont"} ${preview.capacity.unavailable - rhythmCapacity} par l’état physique` : ""}. Ton maximum permanent reste intact.`
      : `Ton maximum permanent augmente de ${CAREER_WEEK_CAPACITY_MILESTONE_GAIN} aux niveaux 5, 10 et 15.`;
  return {
    week: capsule.timeState.clock.week,
    capacity: {
      total: preview.capacity.total,
      remaining: preview.capacity.remaining,
      spent: preview.capacity.used,
      zone,
      zoneLabel: preview.condition.fatigueZone.label,
      detail: unavailableDetail,
      unavailable: preview.capacity.unavailable,
    },
    quick: {
      available: !blocker,
      reason: blocker,
      label: "Suivre le plan rapide",
      detail: "Crée un programme équilibré que tu peux modifier avant de le confirmer.",
    },
    plan: {
      title: preview.mode === "quick" ? "Plan rapide modifiable" : "Ton programme de la semaine",
      summary: "Visite les lieux pour ajouter des activités. Rien n’est accompli avant ta confirmation.",
      items,
      editable: true,
    },
    confirm: {
      available: !blocker,
      label: "Confirmer et vivre la semaine",
      reason: blocker,
    },
    risk: preview.recoveryRisk,
  };
}

function openCareerWeekPlan() {
  const sheet = document.querySelector("#career-world .career-location-sheet");
  if (!sheet || !window.BoxeurWeekView) return;
  if (sheet.hidden) {
    const currentFocus = document.activeElement;
    careerLocationReturnFocus = currentFocus instanceof HTMLElement && currentFocus !== document.body ? currentFocus : null;
  }
  sheet.dataset.originLocation = "week";
  sheet.classList.remove("career-location-sheet-full");
  sheet.innerHTML = window.BoxeurWeekView.renderPlan(careerWeekViewContext());
  activateCareerLocationSheet(sheet, "[data-career-week-confirm]");
}

function selectCareerDetailedWeek() {
  openCareerWeekPlan();
}

function addCareerEmploymentEvent(events, week, label, detail, tone = "neutral") {
  events.push({ label, detail, tone });
  state.journal.unshift({ week, text: detail });
}

function accrueCareerPaidVacation(runtime, job, events, week) {
  const career = runtime.career;
  const requiredTenure = career.jobVacationEarnedAtTenure
    ? career.jobVacationEarnedAtTenure + PAID_VACATION_INTERVAL_WEEKS
    : FIRST_PAID_VACATION_WEEKS;
  if (career.jobTenureWeeks < requiredTenure) return;
  career.jobVacationEarnedAtTenure = requiredTenure;
  if (career.vacationBankWeeks >= MAX_PAID_VACATION_WEEKS) {
    addCareerEmploymentEvent(
      events,
      week,
      "Vacances",
      `${job.title} : ta banque de vacances est déjà pleine (${MAX_PAID_VACATION_WEEKS} semaines).`,
    );
    return;
  }
  career.vacationBankWeeks += 1;
  addCareerEmploymentEvent(
    events,
    week,
    "Vacances acquises",
    `${job.title} : une semaine de vacances payées est ajoutée à ta banque (${career.vacationBankWeeks}/${MAX_PAID_VACATION_WEEKS}).`,
    "positive",
  );
}

function consumeCareerPaidVacation(runtime, plannerEntries, executedEntryIds, week) {
  const vacationEntry = plannerEntries.find(entry => (
    entry.metadata?.paidVacation === true
    && executedEntryIds.has(entry.id)
  ));
  if (!vacationEntry) return null;
  const career = runtime.career;
  if (safeNumber(career.vacationBankWeeks, 0, 0, MAX_PAID_VACATION_WEEKS) <= 0) {
    throw new Error("La semaine de vacances n’est plus disponible; aucun changement n’a été appliqué.");
  }
  career.vacationBankWeeks -= 1;
  const detail = `Vacances payées utilisées : la paie est maintenue, sans travail, fatigue ni absence. Banque restante : ${career.vacationBankWeeks}/${MAX_PAID_VACATION_WEEKS}.`;
  state.journal.unshift({ week, text: detail });
  return { label: "Vacances payées", detail, tone: "positive" };
}

function settleCareerJobAttendance(runtime, worked, events, week, excused = false) {
  const career = runtime.career;
  const job = jobs.find(item => item.id === career.jobId) || null;
  if (!job) {
    career.missedWorkWeeks = 0;
    return;
  }
  const ledger = careerWeekLedger(runtime, week);
  if (worked) {
    if (career.missedWorkWeeks > 0) {
      addCareerEmploymentEvent(
        events,
        week,
        ledger.paidVacationWeeks > 0 ? "Vacances enregistrées" : "Présence enregistrée",
        `${job.title} : ${ledger.paidVacationWeeks > 0 ? "tes vacances protègent ton emploi" : "tu as travaillé"}, mais ${career.missedWorkWeeks}/3 absence${career.missedWorkWeeks > 1 ? "s" : ""} injustifiée${career.missedWorkWeeks > 1 ? "s" : ""} demeure${career.missedWorkWeeks > 1 ? "nt" : ""} au dossier.`,
        "neutral",
      );
    }
    career.jobTenureWeeks += 1;
    career.jobWagesEarned += ledger.grossWages;
    accrueCareerPaidVacation(runtime, job, events, week);
    return;
  }
  if (excused) {
    addCareerEmploymentEvent(events, week, "Absence protégée", `${job.title} : l’absence est justifiée; ton emploi demeure protégé.`, "neutral");
    career.jobTenureWeeks += 1;
    accrueCareerPaidVacation(runtime, job, events, week);
    return;
  }
  career.missedWorkWeeks += 1;
  if (career.missedWorkWeeks < 3) {
    const remaining = 3 - career.missedWorkWeeks;
    addCareerEmploymentEvent(
      events,
      week,
      career.missedWorkWeeks === 1 ? "Première absence" : "Dernier avertissement",
      `${job.title} : semaine de travail manquée, sans paie. Il reste ${remaining} absence${remaining > 1 ? "s" : ""} avant le congédiement.`,
      career.missedWorkWeeks === 1 ? "warning" : "critical",
    );
    return;
  }
  const vacationPayout = career.vacationBankWeeks > 0 ? Math.round(career.jobWagesEarned * .04) : 0;
  if (vacationPayout) career.money += vacationPayout;
  const detail = `${job.title} : congédiement après trois absences injustifiées cumulées chez le même employeur.${vacationPayout ? ` Indemnité de vacances : +${vacationPayout} $ (4 % des salaires reçus).` : ""}`;
  addCareerEmploymentEvent(events, week, "Emploi perdu", detail, "critical");
  career.jobId = null;
  career.missedWorkWeeks = 0;
  career.jobTenureWeeks = 0;
  career.jobVacationEarnedAtTenure = 0;
  career.vacationBankWeeks = 0;
  career.jobWagesEarned = 0;
  career.jobReferenceBonus = false;
  career.jobApplication = null;
  state.workStreak = 0;
  state.jobLossNotice = `Tu as perdu ton emploi de ${job.title} après trois absences injustifiées cumulées.${vacationPayout ? ` Une indemnité de vacances de ${vacationPayout} $ a été versée.` : ""}`;
}

function advanceCareerJobApplication(runtime, events, week) {
  const career = runtime.career;
  const application = career.jobApplication;
  if (!application || application.appliedWeek > week) return;
  const job = jobs.find(item => item.id === application.jobId);
  if (!job) {
    career.jobApplication = null;
    return;
  }
  application.progress = Math.min(application.requiredWeeks, application.progress + 1);
  if (application.progress < application.requiredWeeks) {
    const remaining = application.requiredWeeks - application.progress;
    addCareerEmploymentEvent(
      events,
      week,
      "Candidature en cours",
      `${job.title} : candidature ${application.progress}/${application.requiredWeeks}. Encore ${remaining} semaine${remaining > 1 ? "s" : ""} d’attente.`,
      "neutral",
    );
    return;
  }
  const previousJob = jobs.find(item => item.id === career.jobId) || null;
  career.jobId = job.id;
  career.jobsHeldCount += 1;
  career.introJobRequired = false;
  career.missedWorkWeeks = 0;
  career.jobTenureWeeks = 0;
  career.jobVacationEarnedAtTenure = 0;
  career.vacationBankWeeks = 0;
  career.jobWagesEarned = 0;
  career.jobReferenceBonus = false;
  career.jobApplication = null;
  state.workStreak = 0;
  addCareerEmploymentEvent(
    events,
    week,
    "Embauche confirmée",
    previousJob
      ? `${job.title} : ta candidature est acceptée et remplace ton ancien emploi dès la nouvelle semaine.`
      : `${job.title} : ta candidature est acceptée. Le travail sera proposé par défaut dès la nouvelle semaine.`,
    "positive",
  );
}

function careerWeeklyCompletionEvents(result, runtime, previousWeek) {
  const events = [];
  const completedWeek = result.timeState.clock.week > previousWeek;
  if (!completedWeek) return events;
  if (runtime.settledWeeks.includes(previousWeek)) return events;
  runtime.settledWeeks.push(previousWeek);
  runtime.settledWeeks = runtime.settledWeeks.slice(-104);
  if (runtime.career.gymWeeks > 0) {
    runtime.career.gymWeeks -= 1;
    if (runtime.career.gymWeeks === 0) events.push({ label: "Abonnement expiré", detail: "Renouvelle le GYM pour reprendre les séances encadrées.", tone: "warning" });
  }
  if (runtime.career.strengthGymWeeks > 0) runtime.career.strengthGymWeeks -= 1;
  const ledger = careerWeekLedger(runtime, previousWeek);
  settleCareerJobAttendance(runtime, ledger.workShifts > 0, events, previousWeek);
  advanceCareerJobApplication(runtime, events, previousWeek);
  if (isCompetitiveCareer()) {
    const trained = careerWeekTrainingActivityCount(result.timeState, previousWeek) > 0;
    const beforeRhythm = safeNumber(runtime.career.trainingRhythmPenalty, state.trainingRhythmPenalty, 0, 4);
    const afterRhythm = trained ? Math.max(0, beforeRhythm - 1) : Math.min(4, beforeRhythm + 1);
    runtime.career.trainingRhythmPenalty = afterRhythm;
    state.trainingRhythmPenalty = afterRhythm;
    if (trained && afterRhythm < beforeRhythm) {
      events.push({
        label: afterRhythm === 0 ? "Rythme retrouvé" : "Reprise progressive",
        detail: afterRhythm === 0
          ? "Une semaine active rétablit la capacité normale du prochain programme."
          : `La reprise efface un palier : ${afterRhythm * 5} points resteront occupés la semaine prochaine.`,
        tone: "positive",
      });
    } else if (!trained) {
      const rhythmLabels = ["Rythme stable", "Rythme fragile", "Rythme faible", "Rythme très faible", "Rythme à reconstruire"];
      events.push({
        label: rhythmLabels[afterRhythm],
        detail: `Semaine sans entraînement : ${afterRhythm * 5} points seront occupés dans la prochaine barre, sans diminution des statistiques.`,
        tone: "warning",
      });
    }
  } else if (result.summary.counts.training <= 0) {
    events.push({ label: "Semaine sans entraînement", detail: "Aucune statistique n’est perdue pendant le parcours récréatif.", tone: "neutral" });
  }
  return events;
}

function applyCareerUnrecoveredWorkload(result, plannerEntries, startingCondition, previousWeek) {
  const entries = Array.isArray(plannerEntries) ? plannerEntries : [];
  if (entries.some(entry => entry.activityId === "rest")) return null;
  const demandingEntries = entries.filter(entry => (
    (entry.preReserved && entry.metadata?.paidVacation !== true)
    || entry.physical === true
  ));
  if (!demandingEntries.length) return null;

  const capacityLoad = demandingEntries.reduce((sum, entry) => sum + Math.max(0, Number(entry.capacityCost || 0)), 0);
  const energyLoad = demandingEntries.reduce((sum, entry) => sum + Math.max(0, Number(entry.energyCost || 0)), 0);
  const fatigueLoad = demandingEntries.reduce((sum, entry) => sum + Math.max(0, Number(entry.fatigueDelta || 0)), 0);
  const persistentFatigue = Math.min(22, Math.max(6, Math.round((capacityLoad + fatigueLoad) * .35)));
  const persistentEnergy = Math.min(18, Math.max(4, Math.round((capacityLoad + energyLoad) * .2)));
  const startEnergy = Number(startingCondition?.energy ?? 100);
  const startFatigue = Number(startingCondition?.fatigue ?? 0);
  const energyBefore = Number(result.timeState.condition.energy || 0);
  const fatigueBefore = Number(result.timeState.condition.fatigue || 0);
  result.timeState.condition.energy = Math.min(energyBefore, Math.max(0, startEnergy - persistentEnergy));
  result.timeState.condition.fatigue = Math.max(fatigueBefore, Math.min(100, startFatigue + persistentFatigue));
  result.summary.conditionDelta.energy += result.timeState.condition.energy - energyBefore;
  result.summary.conditionDelta.fatigue += result.timeState.condition.fatigue - fatigueBefore;
  const event = {
    label: "Fatigue accumulée",
    detail: `Sans journée de repos, une partie de la charge résiste aux nuits automatiques : −${persistentEnergy} énergie et +${persistentFatigue} fatigue persistent.`,
    tone: persistentFatigue >= 12 ? "warning" : "neutral",
  };
  state.journal.unshift({ week: previousWeek, text: event.detail });
  return event;
}

function applyCareerRecoveryConsequence(result, runtime, plannerEntries, previousWeek) {
  if (!window.BoxeurWeekPlanner?.assessRecoveryRisk) return null;
  const plannedRest = plannerEntries.some(entry => entry.activityId === "rest");
  const risk = window.BoxeurWeekPlanner.assessRecoveryRisk({
    plannedRest,
    condition: result.timeState.condition,
  });
  runtime.career.recoveryConsequence = null;
  if (risk.kind === "none") return null;
  if (risk.kind === "warning") {
    const event = {
      label: "Récupération fragile",
      detail: "Aucun repos cette semaine : l’état physique fera commencer la prochaine barre moins pleine.",
      tone: "warning",
    };
    state.journal.unshift({ week: previousWeek, text: event.detail });
    return event;
  }

  const hospital = risk.kind === "hospital";
  runtime.career.recoveryConsequence = {
    kind: risk.kind,
    week: safeNumber(result.timeState.clock.week, previousWeek + 1, 1, 99999),
    capacityCost: risk.capacityCost,
    medicalCost: risk.medicalCost,
  };
  const energyBefore = Number(result.timeState.condition.energy || 0);
  const fatigueBefore = Number(result.timeState.condition.fatigue || 0);
  result.timeState.condition.energy = Math.max(energyBefore, hospital ? 45 : 32);
  result.timeState.condition.fatigue = Math.min(fatigueBefore, hospital ? 50 : 66);
  result.summary.conditionDelta.energy += result.timeState.condition.energy - energyBefore;
  result.summary.conditionDelta.fatigue += result.timeState.condition.fatigue - fatigueBefore;

  let charged = 0;
  if (hospital) {
    charged = Math.min(risk.medicalCost, runtime.career.money);
    runtime.career.money -= charged;
    result.finances.money = runtime.career.money;
    result.summary.money.after = runtime.career.money;
    result.summary.money.earned = runtime.career.money - result.summary.money.before;
  }
  const event = hospital ? {
    label: "Nuit à l’hôpital",
    detail: `Le corps a lâché faute de récupération : ${risk.capacityCost} points sont déjà occupés la semaine prochaine${charged > 0 ? ` et ${charged} $ de soins ont été payés` : ""}.`,
    tone: "critical",
  } : {
    label: "Repos forcé",
    detail: `Le boxeur doit récupérer : ${risk.capacityCost} points sont déjà occupés au début de la prochaine semaine.`,
    tone: "critical",
  };
  state.journal.unshift({ week: previousWeek, text: event.detail });
  return event;
}

function syncCareerFightGateProgressToCapsule(capsule = careerCapsule) {
  const gate = capsule ? careerFightGate(capsule) : null;
  if (!capsule?.timeState || !gate) return false;
  const runtime = normalizeCareerPreviewRuntime(capsule);
  capsule.timeState.condition.energy = safeNumber(state.energy, capsule.timeState.condition.energy, 0, 100, false);
  capsule.timeState.condition.fatigue = safeNumber(state.fatigue, capsule.timeState.condition.fatigue, 0, 100, false);
  runtime.career.money = safeNumber(state.money, runtime.career.money, 0, 9999999);
  runtime.career.experience = safeNumber(state.experience, runtime.career.experience, 0, 99999999);
  return true;
}

function finalizeCareerFightGate() {
  const capsule = careerCapsule || ensureCareerPreviewCapsule();
  const gate = capsule ? careerFightGate(capsule) : null;
  if (!capsule?.timeState || !gate || !window.BoxeurTime) return false;
  const runtime = normalizeCareerPreviewRuntime(capsule);
  syncCareerFightGateProgressToCapsule(capsule);
  const beforeFinalization = cloneData(capsule);
  const beforeFinalPeriod = cloneData(capsule.timeState);
  try {
    const appointment = capsule.timeState.appointments.find(item => item.id === gate.appointmentId);
    if (!appointment) throw new Error("Le rendez-vous de l’aréna est introuvable dans la sauvegarde.");
    if (appointment.startSlot > capsule.timeState.clock.absoluteSlot) {
      capsule.timeState = window.BoxeurTime.advanceToNextAppointment(capsule.timeState);
    }
    capsule.timeState = window.BoxeurTime.attendAppointment(capsule.timeState, gate.appointmentId);

    const summary = gate.summary ? cloneData(gate.summary) : {
      schemaVersion: window.BoxeurWeek?.SCHEMA_VERSION || 1,
      mode: runtime.weekMode || "quick",
      from: { ...beforeFinalPeriod.clock, week: gate.week },
      actions: [],
      warnings: [],
      counts: { training: 0, work: 0, recovery: 0, freePeriods: 0, appointments: 0 },
      money: { before: runtime.career.money, earned: 0, after: runtime.career.money },
      statGains: {},
      statXpGains: {},
      stimulusDelta: {},
      xpAward: 0,
      wear: 0,
      maximumSingleActionInjuryRiskPercent: 0,
      nightRecoveries: 0,
    };
    const startCondition = gate.startingCondition || beforeFinalPeriod.condition;
    summary.status = "week-complete";
    summary.to = cloneData(capsule.timeState.clock);
    summary.elapsedPeriods = capsule.timeState.clock.absoluteSlot - Number(summary.from?.absoluteSlot || careerWeekStartSlot(beforeFinalPeriod));
    summary.conditionDelta = {
      energy: Number(capsule.timeState.condition.energy) - Number(startCondition.energy || 0),
      fatigue: Number(capsule.timeState.condition.fatigue) - Number(startCondition.fatigue || 0),
    };
    summary.money ||= { before: runtime.career.money, earned: 0, after: runtime.career.money };
    summary.money.after = runtime.career.money;
    summary.money.earned = runtime.career.money - Number(summary.money.before || 0);
    summary.counts ||= { training: 0, work: 0, recovery: 0, freePeriods: 0, appointments: 0 };
    summary.counts.appointments = Number(summary.counts.appointments || 0) + 1;
    summary.nightRecoveries = Number(summary.nightRecoveries || 0)
      + (capsule.timeState.clock.week > beforeFinalPeriod.clock.week ? 1 : 0);
    summary.stoppedBeforeAppointment = null;

    const result = {
      status: "week-complete",
      timeState: capsule.timeState,
      state: capsule.timeState,
      finances: { money: runtime.career.money },
      summary,
    };
    const completionEvents = [...gate.completionEvents, ...careerWeeklyCompletionEvents(result, runtime, gate.week)];
    const recoveryEvent = applyCareerRecoveryConsequence(result, runtime, gate.plannerEntries, gate.week);
    if (recoveryEvent) completionEvents.unshift(recoveryEvent);
    capsule.timeState = result.timeState;
    const summaryIndex = runtime.weeklySummaries.findIndex(item => Number(item?.from?.week) === gate.week);
    if (summaryIndex >= 0) runtime.weeklySummaries[summaryIndex] = cloneData(result.summary);
    else runtime.weeklySummaries.unshift(cloneData(result.summary));
    runtime.weeklySummaries = runtime.weeklySummaries.slice(0, 30);
    runtime.fightGate = null;
    state.supplementWeek = capsule.timeState.clock.week;
    state.supplementsUsed = [];
    if (state.preFightTrainingWeek === gate.week) state.preFightTrainingWeek = 0;
    persistCareerPreviewCapsule();
    return true;
  } catch (error) {
    careerCapsule = beforeFinalization;
    persistCareerPreviewCapsule();
    console.error("[Boxeur Deux] Fin de semaine de combat impossible :", error);
    showToast("Le combat est enregistré, mais la semaine n’a pas pu avancer. Recharge la carrière pour réessayer.");
    return false;
  }
}

function careerWeekSummaryView(result, completionEvents = [], options = {}) {
  const grossWages = result.summary.actions
    .filter(record => record.kind === "work")
    .reduce((sum, record) => sum + Math.max(0, Number(record.moneyDelta || 0)), 0);
  const plannedExpenses = result.summary.actions
    .reduce((sum, record) => sum + Math.max(0, -Number(record.moneyDelta || 0)), 0);
  const statXpChanges = Object.entries(combatLabels).map(([key, label]) => {
    const gainedXp = Math.round(Number(result.summary.statXpGains?.[key] || 0));
    return {
      label: `${label} · XP ciblée`,
      detail: `${gainedXp > 0 ? "+" : ""}${gainedXp} XP`,
      tone: gainedXp > 0 ? "positive" : "neutral",
    };
  });
  const conditionTransition = (key, suffix = "") => {
    const after = Math.round(Number(result.timeState.condition[key] || 0));
    const delta = Math.round(Number(result.summary.conditionDelta[key] || 0));
    const before = after - delta;
    const change = delta === 0 ? "stable" : careerSigned(delta, " pts");
    return `${before}${suffix} → ${after}${suffix} · ${change}`;
  };
  const dateLabel = options.dateLabel || careerCareerView()?.careerDateLabel || "";
  const changes = [
    { label: "Énergie", detail: conditionTransition("energy", " %"), tone: result.summary.conditionDelta.energy < 0 ? "warning" : result.summary.conditionDelta.energy > 0 ? "positive" : "neutral" },
    { label: "Fatigue", detail: conditionTransition("fatigue", " %"), tone: result.summary.conditionDelta.fatigue > 0 ? "warning" : result.summary.conditionDelta.fatigue < 0 ? "positive" : "neutral" },
    { label: "Paie brute", detail: careerSigned(grossWages, " $"), tone: grossWages > 0 ? "positive" : "neutral" },
    { label: "Dépenses planifiées", detail: plannedExpenses ? `−${plannedExpenses} $` : "0 $", tone: plannedExpenses ? "warning" : "neutral" },
    { label: "Variation du solde", detail: careerSigned(result.summary.money.earned, " $"), tone: result.summary.money.earned > 0 ? "positive" : result.summary.money.earned < 0 ? "warning" : "neutral" },
    { label: "Entraînement", detail: `${result.summary.counts.training} séance${result.summary.counts.training > 1 ? "s" : ""}`, tone: result.summary.counts.training > 0 ? "positive" : "neutral" },
    { label: "XP générale", detail: `${result.summary.xpAward > 0 ? "+" : ""}${Math.round(result.summary.xpAward)} XP`, tone: result.summary.xpAward > 0 ? "positive" : "neutral" },
    ...statXpChanges,
    { label: "Nuits récupérées", detail: String(result.summary.nightRecoveries), tone: "neutral" },
  ];
  const events = [...completionEvents];
  result.summary.warnings.slice(0, 4).forEach(warning => events.push({ label: "À surveiller", detail: warning, tone: "warning" }));
  if (result.status === "appointment" && result.summary.stoppedBeforeAppointment) {
    events.unshift({ label: "Simulation arrêtée", detail: `${result.summary.stoppedBeforeAppointment.title} demande ton attention.`, tone: "warning" });
  }
  return {
    weekFrom: result.summary.from.week,
    weekTo: result.summary.to.week,
    title: options.fightGate === true
      ? `Semaine ${result.summary.from.week} terminée · combat prêt`
      : result.status === "week-complete" ? `Semaine ${result.summary.to.week}${dateLabel ? ` · ${dateLabel}` : ""}` : "Une décision t’attend",
    summary: options.fightGate === true
      ? "Tes activités et ton travail sont enregistrés. La semaine avancera après le combat à l’aréna."
      : result.status === "week-complete"
      ? "Voici les valeurs avant et après la semaine, ainsi que les effets réellement appliqués."
      : "Le temps s’est arrêté avant une étape qui ne doit pas être décidée automatiquement.",
    changes,
    events,
    ...(options.fightGate === true ? {
      actionLabel: "Continuer vers l’aréna",
    } : options.firstGuidedWeek === true ? {
      guide: {
        title: "Comment lire ton premier bilan",
        detail: "Énergie et fatigue montrent le coût réel de ton programme. L’XP ciblée assimilée indique ce que ton boxeur a retenu de ses entraînements.",
        next: "En continuant, le guide affichera l’objectif de la semaine 2.",
      },
      actionLabel: "Continuer vers la semaine 2",
    } : {}),
  };
}

function careerPlannerSupplementAdjustment(supplementState, entry, totals, capsule) {
  if (!entry.supplementId || !window.BoxeurSupplements) {
    return { state: supplementState, totals: cloneData(totals), result: null };
  }
  const sessionId = `planner:${entry.id}`;
  const prepared = window.BoxeurSupplements.prepareForSession(supplementState, entry.supplementId, {
    sessionId,
    useId: `use:${careerPlannerWeekKey(capsule)}:${entry.id}`,
    weekKey: careerPlannerWeekKey(capsule),
    careerStatus: state.careerStatus,
  });
  const applied = window.BoxeurSupplements.applyToSession(prepared.state, totals, { sessionId });
  return { state: applied.state, totals: applied.session, result: applied.result };
}

function careerPlannerGainMultiplier(entry) {
  return safeNumber(entry?.metadata?.gainMultiplier, 1, .5, 1, false);
}

function careerPlannerScaledStimulus(stimulus, multiplier) {
  return Object.fromEntries(Object.keys(combatLabels).map(key => [
    key,
    Math.round(Number(stimulus?.[key] || 0) * multiplier * 10000) / 10000,
  ]));
}

function careerPlannerScaledBoxingSession(session, multiplier) {
  if (multiplier >= 1) return session;
  return {
    ...cloneData(session),
    blocks: session.blocks.map(block => ({
      ...cloneData(block),
      stimulus: careerPlannerScaledStimulus(block.stimulus, multiplier),
      xp: Math.round(Number(block.xp || 0) * multiplier * 100) / 100,
    })),
  };
}

function careerPlannerGenericActivity(entry, label, totals, options = {}) {
  return {
    kind: "activity",
    plannerActivityId: entry.activityId,
    plannerEntryId: entry.id,
    activity: {
      id: options.engineId || `planner:${entry.activityId}:${entry.id}`,
      label,
      category: options.category || entry.category,
      duration: safeNumber(options.duration, 1, 1, window.BoxeurTime.PERIODS_PER_DAY),
      energyCost: Math.max(0, Number(totals.energyCost || 0)),
      energyGain: Math.max(0, Number(totals.energyGain || 0)),
      fatigueGain: Math.max(0, Number(totals.fatigueGain == null ? totals.fatigueDelta : totals.fatigueGain) || 0),
      fatigueRelief: Math.max(0, Number(totals.fatigueRelief || (Number(totals.fatigueDelta) < 0 ? -Number(totals.fatigueDelta) : 0)) || 0),
      stimulus: cloneData(totals.stimulus || { technique: 0, power: 0, cardio: 0, defense: 0 }),
    },
    moneyDelta: Number(options.moneyDelta || 0),
    physical: entry.physical === true,
    budgetKind: entry.physical ? "trainingSessions" : null,
    detail: {
      label,
      category: options.category || entry.category,
      xpAward: Number(options.xpAward == null ? entry.metadata?.xp || 0 : options.xpAward),
      wear: Number(options.wear == null ? entry.metadata?.wear || 0 : options.wear),
      injuryRiskPercent: Number(options.injuryRiskPercent == null ? entry.metadata?.injuryRisk || 0 : options.injuryRiskPercent),
    },
  };
}

function careerPlannerExecutionPrimitive(entry, capsule, sideEffects) {
  const runtime = normalizeCareerPreviewRuntime(capsule);
  if (entry.preReserved) {
    const job = jobs.find(item => item.id === runtime.career.jobId);
    if (!job) throw new Error("L’emploi réservé n’existe plus.");
    const paidVacation = entry.metadata?.paidVacation === true;
    return {
      kind: "work",
      plannerActivityId: paidVacation ? "paid-vacation" : "work",
      plannerEntryId: entry.id,
      pay: job.wage,
      activity: {
        id: paidVacation ? `paid-vacation:${job.id}` : `work:${job.id}`,
        label: paidVacation ? `Vacances payées · ${job.title}` : `Travail · ${job.title}`,
        category: "work",
        duration: 2,
        energyCost: paidVacation ? 0 : Math.max(0, -Number(job.energy || 0)),
        energyGain: 0,
        fatigueGain: paidVacation ? 0 : Math.max(0, Number(job.fatigue || 0)),
        fatigueRelief: 0,
        stimulus: { technique: 0, power: 0, cardio: 0, defense: 0 },
      },
      paidVacation,
    };
  }
  if (["group-class", "boxing-coach", "boxing-custom"].includes(entry.activityId)) {
    const aggregate = careerPlannerBoxingAggregate(entry.metadata, {
      label: entry.label,
      source: entry.activityId === "boxing-custom" ? "custom" : "coach",
    });
    const adjusted = careerPlannerSupplementAdjustment(sideEffects.supplementState, entry, aggregate.totals, capsule);
    sideEffects.supplementState = adjusted.state;
    if (adjusted.result) sideEffects.supplements.push(adjusted.result);
    const gainMultiplier = careerPlannerGainMultiplier(entry);
    return {
      kind: "training",
      plannerActivityId: entry.activityId,
      plannerEntryId: entry.id,
      session: careerPlannerScaledBoxingSession(aggregate.session, gainMultiplier),
      context: { ...careerTrainingContext(), sessionAdjustment: adjusted.result ? adjusted.totals : null },
      budgetKind: "trainingSessions",
    };
  }
  if (["strength-quick", "strength-custom"].includes(entry.activityId)) {
    const selection = entry.activityId === "strength-quick"
      ? ["dynamic_warmup", "machine_conditioning", "mobility_cooldown"]
      : entry.metadata?.selection || [];
    const aggregate = window.BoxeurStrength.aggregateSelection(selection);
    const adjusted = careerPlannerSupplementAdjustment(sideEffects.supplementState, entry, aggregate.totals, capsule);
    sideEffects.supplementState = adjusted.state;
    if (adjusted.result) sideEffects.supplements.push(adjusted.result);
    const gainMultiplier = careerPlannerGainMultiplier(entry);
    return careerPlannerGenericActivity(entry, entry.label, {
      ...adjusted.totals,
      stimulus: careerPlannerScaledStimulus(aggregate.totals.stimulus, gainMultiplier),
    }, {
      engineId: `strength-gym-session:${aggregate.activityIds.join("-")}`,
      category: "strength-gym-training",
      xpAward: aggregate.totals.xp * gainMultiplier,
      wear: aggregate.totals.wear,
      injuryRiskPercent: aggregate.totals.injuryRisk,
    });
  }
  if (["home-quick", "home-custom"].includes(entry.activityId)) {
    const aggregate = careerPlannerHomeAggregate(entry.metadata?.selection);
    const adjusted = careerPlannerSupplementAdjustment(sideEffects.supplementState, entry, aggregate.totals, capsule);
    sideEffects.supplementState = adjusted.state;
    if (adjusted.result) sideEffects.supplements.push(adjusted.result);
    const gainMultiplier = careerPlannerGainMultiplier(entry);
    return careerPlannerGenericActivity(entry, entry.label, {
      ...adjusted.totals,
      stimulus: careerPlannerScaledStimulus(aggregate.totals.stimulus, gainMultiplier),
    }, {
      engineId: `home-session:${aggregate.selection.join("-")}`,
      category: "home-training",
      xpAward: aggregate.totals.xp * gainMultiplier,
    });
  }
  if (["roadwork-short", "roadwork-long", "roadwork-intervals"].includes(entry.activityId)) {
    const activity = CAREER_HOME_ACTIVITIES[entry.activityId];
    const totals = {
      energyCost: activity.energyCost,
      energyGain: activity.energyGain,
      fatigueGain: activity.fatigueGain,
      fatigueRelief: activity.fatigueRelief,
      stimulus: activity.stimulus,
    };
    const adjusted = careerPlannerSupplementAdjustment(sideEffects.supplementState, entry, totals, capsule);
    sideEffects.supplementState = adjusted.state;
    if (adjusted.result) sideEffects.supplements.push(adjusted.result);
    const gainMultiplier = careerPlannerGainMultiplier(entry);
    return careerPlannerGenericActivity(entry, entry.label, {
      ...adjusted.totals,
      stimulus: careerPlannerScaledStimulus(adjusted.totals.stimulus, gainMultiplier),
    }, {
      engineId: activity.id,
      category: "roadwork",
      duration: activity.duration,
      xpAward: activity.xp * gainMultiplier,
    });
  }
  if (entry.activityId === "rest") {
    const restDuration = careerOfficialEventDue(careerCareerView())
      ? Math.max(1, window.BoxeurTime.PERIODS_PER_DAY - 1)
      : window.BoxeurTime.PERIODS_PER_DAY;
    return careerPlannerGenericActivity(entry, entry.label, {
      energyCost: entry.energyCost,
      energyGain: entry.energyGain,
      fatigueGain: Math.max(0, entry.fatigueDelta),
      fatigueRelief: Math.max(0, -entry.fatigueDelta),
      stimulus: { technique: 0, power: 0, cardio: 0, defense: 0 },
    }, { engineId: "home_planned_rest", category: "recovery", duration: restDuration });
  }
  if (entry.activityId === "meal") {
    const activity = CAREER_HOME_ACTIVITIES.meal;
    return careerPlannerGenericActivity(entry, entry.label, {
      energyCost: activity.energyCost,
      energyGain: activity.energyGain,
      fatigueGain: activity.fatigueGain,
      fatigueRelief: activity.fatigueRelief,
      stimulus: activity.stimulus,
    }, { engineId: activity.id, category: "home-recovery", moneyDelta: -CAREER_BALANCE.WEEK.recovery.mealCost });
  }
  if (entry.activityId === "private-training") {
    const publicProgram = window.BoxeurTrainer.getPublicState(sideEffects.trainerState).activeProgram;
    if (!publicProgram) throw new Error("Le programme privé planifié n’est plus actif.");
    const sourceId = `${careerPlannerWeekKey(capsule)}:${entry.id}`;
    const outcome = window.BoxeurTrainer.completeSession(sideEffects.trainerState, sideEffects.progressionState, {
      sourceId,
      weekKey: careerPlannerWeekKey(capsule),
      condition: { energy: 100, fatigue: capsule.timeState.condition.fatigue },
    });
    sideEffects.trainerState = outcome.state;
    sideEffects.progressionState = outcome.progressionState;
    sideEffects.privateSessions.push(outcome.result);
    const gainMultiplier = careerPlannerGainMultiplier(entry);
    const totals = {
      energyCost: Math.max(0, -outcome.result.energyDelta),
      energyGain: 0,
      fatigueGain: Math.max(0, outcome.result.fatigueDelta),
      fatigueRelief: 0,
      stimulus: careerPlannerScaledStimulus(outcome.result.progression.effectiveAccepted, gainMultiplier),
    };
    const adjusted = careerPlannerSupplementAdjustment(sideEffects.supplementState, entry, totals, capsule);
    sideEffects.supplementState = adjusted.state;
    if (adjusted.result) sideEffects.supplements.push(adjusted.result);
    const primitive = careerPlannerGenericActivity(entry, entry.label, {
      ...adjusted.totals,
      stimulus: totals.stimulus,
    }, {
      engineId: `private-trainer:${sourceId}`,
      category: careerTrainerLocationForTarget(publicProgram.target) === "strength-gym" ? "strength-gym-training" : "boxing-gym-training",
      xpAward: 4 * gainMultiplier,
    });
    primitive.privateTarget = publicProgram.target;
    return primitive;
  }
  throw new Error(`Activité hebdomadaire non exécutable : ${entry.activityId}.`);
}

function careerPlannerExecutionSlots(entries, capsule) {
  const weekStart = careerWeekStartSlot(capsule.timeState);
  const weekEnd = weekStart + window.BoxeurTime.PERIODS_PER_WEEK;
  const now = capsule.timeState.clock.absoluteSlot;
  const occupied = (capsule.timeState.appointments || [])
    .filter(appointment => Number(appointment.endSlot) > now && Number(appointment.startSlot) < weekEnd)
    .map(appointment => ({ start: Number(appointment.startSlot), end: Number(appointment.endSlot) }));
  const historicalPhysicalDays = new Set((capsule.timeState.history || []).filter(careerIsPrimaryPhysicalEvent).filter(event => (
    Number(event.fromSlot) >= weekStart && Number(event.fromSlot) < weekEnd
  )).map(event => Math.floor((Number(event.fromSlot) - weekStart) / window.BoxeurTime.PERIODS_PER_DAY)));
  const reserve = (start, duration) => occupied.push({ start, end: start + duration });
  const overlaps = (start, duration) => occupied.some(range => start < range.end && start + duration > range.start);
  return entries.map(({ plannerEntry, primitive }) => {
    const duration = primitive.kind === "work" ? primitive.activity.duration : primitive.kind === "training" ? 1 : primitive.activity?.duration || 1;
    const preferredPeriod = primitive.kind === "work" || plannerEntry.activityId === "rest" ? 0 : plannerEntry.physical ? 2 : 1;
    const requestedDay = safeNumber(plannerEntry.dayIndex, 0, 0, 6);
    let start = Math.max(now, weekStart + requestedDay * window.BoxeurTime.PERIODS_PER_DAY + preferredPeriod);
    let found = null;
    const candidateAllowed = candidate => {
      const day = Math.floor((candidate - weekStart) / window.BoxeurTime.PERIODS_PER_DAY);
      const period = (candidate - weekStart) % window.BoxeurTime.PERIODS_PER_DAY;
      if (candidate < now || candidate + duration > weekEnd) return false;
      if (plannerEntry.physical && (period !== 2 || historicalPhysicalDays.has(day))) return false;
      return !overlaps(candidate, duration);
    };
    for (let candidate = start; candidate + duration <= weekEnd; candidate += 1) {
      if (!candidateAllowed(candidate)) continue;
      found = candidate;
      break;
    }
    // Un rendez-vous de combat placé le dimanche soir peut repousser une
    // activité choisie ce jour-là. On cherche alors le même moment dans les
    // jours précédents plutôt que de supprimer silencieusement l’activité.
    if (found == null) {
      for (let candidate = start - window.BoxeurTime.PERIODS_PER_DAY; candidate >= now; candidate -= window.BoxeurTime.PERIODS_PER_DAY) {
        if (!candidateAllowed(candidate)) continue;
        found = candidate;
        break;
      }
    }
    if (found == null) throw new Error(`${plannerEntry.label} ne tient plus dans la semaine actuelle.`);
    reserve(found, duration);
    if (plannerEntry.physical) historicalPhysicalDays.add(Math.floor((found - weekStart) / window.BoxeurTime.PERIODS_PER_DAY));
    return { ...primitive, id: `planner-${plannerEntry.id}`, startSlot: found, duration };
  });
}

function createCareerPlannerSideEffects(capsule) {
  const runtime = normalizeCareerPreviewRuntime(capsule);
  return {
    supplementState: window.BoxeurSupplements.createState(runtime.career.supplementState, { weekKey: capsule.timeState.clock.week }),
    trainerState: window.BoxeurTrainer.createState(runtime.career.trainerState),
    progressionState: window.BoxeurProgression.createState(runtime.career.progressionState),
    supplements: [],
    privateSessions: [],
  };
}

function replayCareerPlannerSideEffects(capsule, plannerEntries, executedEntryIds) {
  const committed = createCareerPlannerSideEffects(capsule);
  plannerEntries
    .filter(entry => executedEntryIds.has(entry.id))
    .forEach(entry => { careerPlannerExecutionPrimitive(entry, capsule, committed); });
  return committed;
}

function buildCareerPlannerExecution(capsule, plannerState) {
  careerProgressionSnapshot(capsule);
  const sideEffects = createCareerPlannerSideEffects(capsule);
  const candidates = window.BoxeurWeekPlanner.previewPlan(plannerState).entries
    .filter(entry => !(entry.activityId === "sparring" && entry.metadata?.completed));
  const withPrimitives = candidates.map(plannerEntry => ({
    plannerEntry,
    primitive: careerPlannerExecutionPrimitive(plannerEntry, capsule, sideEffects),
  }));
  const entries = careerPlannerExecutionSlots(withPrimitives, capsule);
  const weekStartSlot = careerWeekStartSlot(capsule.timeState);
  const physicalCount = entries.filter(entry => entry.kind === "training" || entry.physical === true).length;
  const physicalAlreadyDone = careerWeekTrainingActivityCount(capsule.timeState);
  return {
    plan: {
      schemaVersion: window.BoxeurWeek.SCHEMA_VERSION,
      week: capsule.timeState.clock.week,
      weekStartSlot,
      weekEndSlot: weekStartSlot + window.BoxeurTime.PERIODS_PER_WEEK,
      budget: {
        trainingSessions: Math.min(window.BoxeurWeek.MAX_TRAINING_SESSIONS, physicalAlreadyDone + physicalCount),
        shortRecoveries: 2,
        workShifts: entries.filter(entry => entry.kind === "work").length,
      },
      entries,
    },
    sideEffects,
    plannerEntries: candidates,
  };
}

function runCareerAutomaticWeek() {
  const capsule = ensureCareerPreviewCapsule();
  if (!capsule || !window.BoxeurWeek || !window.BoxeurWeekView || !window.BoxeurWeekPlanner) return;
  const blocker = careerWeekQuickBlockReason(careerCareerView());
  if (blocker) return showToast(blocker);
  const plannerState = ensureCareerWeekPlanner(capsule);
  const pendingSparring = plannerState.entries.find(entry => entry.activityId === "sparring" && !entry.metadata?.completed);
  if (pendingSparring) {
    showToast("Le sparring est interactif : joue-le maintenant, puis confirme de nouveau la semaine.");
    runCareerTechnicalSparring({ launch: true, entryId: pendingSparring.id });
    return;
  }
  const runtime = normalizeCareerPreviewRuntime(capsule);
  const previousWeek = capsule.timeState.clock.week;
  const beforeCapsule = cloneData(capsule);
  const beforeCareerState = cloneData(state);
  try {
    const officialEvent = careerOfficialEventDue(careerCareerView());
    const fightAppointment = officialEvent ? ensureCareerFightAppointment(capsule, officialEvent) : null;
    const confirmed = window.BoxeurWeekPlanner.confirmPlan(plannerState, {
      transactionId: `${careerPlannerWeekKey(capsule)}:revision-${plannerState.revision}`,
      expectedRevision: plannerState.revision,
    });
    const execution = buildCareerPlannerExecution(capsule, confirmed.state);
    const result = window.BoxeurWeek.runWeek({
      timeState: capsule.timeState,
      finances: { money: runtime.career.money },
    }, {
      mode: "quick",
      plan: execution.plan,
      recovery: { energyThreshold: 42, fatigueThreshold: 62 },
    });
    const stoppedForFight = Boolean(
      fightAppointment
      && result.status === "appointment"
      && result.summary.stoppedBeforeAppointment?.id === fightAppointment.id
    );
    if (result.status !== "week-complete" && !stoppedForFight) {
      const reason = result.summary.warnings.at(-1) || "La semaine s’est arrêtée avant sa confirmation complète.";
      throw new Error(reason);
    }
    const executedEntryIds = new Set(result.summary.actions.map(record => record.primitive?.plannerEntryId).filter(Boolean));
    const missingEntries = execution.plan.entries.filter(entry => !executedEntryIds.has(entry.plannerEntryId));
    if (missingEntries.length) {
      throw new Error(`${missingEntries[0].activity?.label || missingEntries[0].session?.label || "Une activité"} n’a pas pu être accomplie. Allège ou réorganise le programme.`);
    }
    const committedSideEffects = replayCareerPlannerSideEffects(capsule, execution.plannerEntries, executedEntryIds);
    const onboardingBeforeAdvance = careerOnboardingView(capsule);
    const firstGuidedWeek = onboardingBeforeAdvance?.state.mode === "guided" && previousWeek === 1;
    if (onboardingBeforeAdvance?.state.mode === "guided") {
      const completedObjectiveId = careerCompletedOnboardingObjectiveId(
        onboardingBeforeAdvance,
        execution.plannerEntries,
        executedEntryIds,
      );
      if (completedObjectiveId) {
        applyCareerOnboardingEvent({
          type: window.BoxeurOnboarding.EVENT_TYPES.COMPLETE_OBJECTIVE,
          objectiveId: completedObjectiveId,
        });
      }
      applyCareerOnboardingEvent({ type: window.BoxeurOnboarding.EVENT_TYPES.CLOSE_WEEK });
    }
    capsule.timeState = result.timeState;
    runtime.career.money = result.finances.money;
    runtime.career.experience += result.summary.xpAward;
    runtime.career.supplementState = committedSideEffects.supplementState;
    runtime.career.trainerState = committedSideEffects.trainerState;
    // BoxeurTime demeure l’unique source de progression exécutée. Le moteur
    // d’entraîneur sert à calculer son stimulus ciblé, sans le créditer une
    // seconde fois dans une jauge parallèle.
    careerProgressionSnapshot(capsule);
    if (result.summary.counts.work > 0 || result.summary.money.earned > 0) {
      const grossWages = result.summary.actions
        .filter(record => record.kind === "work")
        .reduce((sum, record) => sum + Math.max(0, Number(record.moneyDelta || 0)), 0);
      const paidVacationWeeks = result.summary.actions.filter(record => record.primitive?.paidVacation === true).length;
      recordCareerWork(runtime, previousWeek, grossWages, result.summary.counts.work, paidVacationWeeks);
    }
    const paidVacationEvent = consumeCareerPaidVacation(
      runtime,
      execution.plannerEntries,
      executedEntryIds,
      previousWeek,
    );
    if (state.careerStatus === "recreational" && result.summary.counts.training > 0) runtime.trainingSessions += 1;
    const boxingDone = result.summary.actions.some(record => {
      const plannerActivityId = record.primitive?.plannerActivityId;
      if (["group-class", "boxing-coach", "boxing-custom", "home-quick", "home-custom"].includes(plannerActivityId)) return true;
      if (plannerActivityId !== "private-training") return false;
      return ["technique", "defense"].includes(record.primitive?.privateTarget);
    });
    if (boxingDone && isCompetitiveCareer()) state.boxingTrainingWeek = previousWeek;
    const workloadEvent = applyCareerUnrecoveredWorkload(
      result,
      execution.plannerEntries,
      beforeCapsule.timeState.condition,
      previousWeek,
    );
    const completionEvents = stoppedForFight ? [] : careerWeeklyCompletionEvents(result, runtime, previousWeek);
    if (paidVacationEvent) completionEvents.unshift(paidVacationEvent);
    if (workloadEvent) completionEvents.unshift(workloadEvent);
    const recoveryEvent = stoppedForFight
      ? null
      : applyCareerRecoveryConsequence(result, runtime, execution.plannerEntries, previousWeek);
    if (recoveryEvent) completionEvents.unshift(recoveryEvent);
    runtime.fightGate = stoppedForFight ? normalizeCareerFightGate({
      status: "ready",
      week: previousWeek,
      kind: officialEvent.kind,
      eventId: officialEvent.eventId,
      bookingId: officialEvent.bookingId,
      appointmentId: fightAppointment.id,
      title: officialEvent.title,
      summary: result.summary,
      plannerEntries: execution.plannerEntries,
      startingCondition: beforeCapsule.timeState.condition,
      completionEvents,
    }) : null;
    runtime.weekMode = confirmed.commit.mode === "quick" ? "quick" : "detailed";
    runtime.weeklySummaries.unshift(cloneData(result.summary));
    runtime.weeklySummaries = runtime.weeklySummaries.slice(0, 30);
    runtime.weekPlanner = null;
    runtime.weekPlannerSignature = null;
    persistCareerPreviewCapsule();
    renderCareerWorldPreview(true);
    const sheet = document.querySelector("#career-world .career-location-sheet");
    if (!sheet) return;
    sheet.dataset.originLocation = "week";
    sheet.classList.remove("career-location-sheet-full");
    sheet.innerHTML = window.BoxeurWeekView.renderSummary(careerWeekSummaryView(result, completionEvents, {
      firstGuidedWeek,
      fightGate: stoppedForFight,
    }));
    activateCareerLocationSheet(sheet, "[data-career-week-summary-close]");
  } catch (error) {
    careerCapsule = beforeCapsule;
    state = beforeCareerState;
    renderCareerWorldPreview(true);
    showToast(error.message || "La semaine n’a pas été confirmée; aucun coût ni produit n’a été appliqué.");
  }
}

function openCareerMembershipMenu() {
  const capsule = ensureCareerPreviewCapsule();
  if (!capsule) return;
  const career = normalizeCareerPreviewRuntime(capsule).career;
  if (career.gymWeeks > 0) return showToast(`Abonnement actif · ${career.gymWeeks} semaine${career.gymWeeks > 1 ? "s" : ""} restante${career.gymWeeks > 1 ? "s" : ""}.`);
  const choices = career.initialGymRequired ? gymPlans.filter(plan => plan.id === "monthly") : gymPlans;
  document.querySelector("#membership-dialog-title").textContent = career.initialGymRequired ? "Premier abonnement obligatoire" : "Renouveler le GYM de boxe";
  document.querySelector("#membership-dialog-copy").textContent = career.initialGymRequired
    ? "Ton budget de départ couvre ce premier mois. Cette inscription débloque les installations et le programme rapide du coach."
    : "Sans abonnement, le sac au sous-sol reste disponible. Les séances encadrées demandent un accès actif au GYM.";
  document.querySelector("#membership-options").innerHTML = choices.map(plan => {
    const missing = Math.max(0, plan.price - career.money);
    return `<button class="coach-card" type="button" data-gym-plan="${plan.id}" ${missing ? "disabled" : ""}><strong>${plan.label} · ${plan.price} $</strong><span>${plan.weeks} semaines d’accès</span><small>${plan.detail}${missing ? `<br>Il manque ${missing} $.` : ""}</small></button>`;
  }).join("");
  setMandatoryDialogState("membership-dialog", career.initialGymRequired, "Choisis le premier mois de GYM pour poursuivre le tutoriel.");
  document.querySelector("#membership-dialog")?.showModal();
}

function selectCareerGymPlan(planId) {
  const capsule = ensureCareerPreviewCapsule();
  const plan = gymPlans.find(item => item.id === planId);
  if (!capsule || !plan) return;
  const runtime = normalizeCareerPreviewRuntime(capsule);
  const career = runtime.career;
  if (career.gymWeeks > 0 || career.money < plan.price) return;
  career.money -= plan.price;
  career.gymWeeks = plan.weeks;
  career.initialGymRequired = false;
  const onboarding = careerOnboardingView(capsule);
  if (onboarding?.state.mode === "guided" && !onboarding.state.initialGym.purchased) {
    applyCareerOnboardingEvent({
      type: window.BoxeurOnboarding.EVENT_TYPES.PURCHASE_INITIAL_MEMBERSHIP,
      weeks: plan.weeks,
    });
  }
  persistCareerPreviewCapsule();
  document.querySelector("#membership-dialog")?.close();
  renderCareerWorldPreview(true);
  openCareerLocation("boxing-gym");
  showToast(`Inscription confirmée · GYM actif pour ${plan.weeks} semaines`);
}

function openCareerJobMenu() {
  const capsule = ensureCareerPreviewCapsule();
  if (!capsule) return;
  const career = normalizeCareerPreviewRuntime(capsule).career;
  const current = jobs.find(job => job.id === career.jobId);
  const immediate = career.introJobRequired && career.jobsHeldCount === 0 && !current;
  const application = career.jobApplication;
  document.querySelector("#job-dialog-title").textContent = immediate ? "Choisir l’emploi de départ" : "Choisir un emploi";
  document.querySelector("#job-dialog-copy").textContent = immediate
    ? "Ton premier emploi est obtenu immédiatement. Sa paie hebdomadaire et sa fatigue seront incluses automatiquement dans chaque semaine rapide."
    : "Après ta candidature, l’embauche est garantie au bout de 1, 2 ou 3 semaines selon le poste. Tu peux continuer ta carrière pendant l’attente.";
  const options = jobs.map(job => {
    const active = job.id === career.jobId;
    const targeted = application?.jobId === job.id;
    const status = active
      ? "Emploi actif"
      : immediate
        ? "Embauche immédiate"
        : targeted
          ? `Candidature en cours · ${application.progress}/${application.requiredWeeks}`
          : `${job.interviewWeeks} semaine${job.interviewWeeks > 1 ? "s" : ""} d’attente`;
    return renderJobBoardSheet(job, {
      active,
      selected: targeted,
      disabled: active || targeted,
      status,
      effects: `${job.energy} énergie · +${job.fatigue} fatigue`,
    });
  }).join("");
  const cancel = application && !immediate
    ? `<button class="text-button" type="button" data-career-cancel-job-application>Annuler la candidature en cours</button>`
    : "";
  document.querySelector("#job-options").innerHTML = `${options}${cancel}`;
  setMandatoryDialogState("job-dialog", immediate, "Choisis ton emploi de départ pour commencer la semaine 1.");
  document.querySelector("#job-dialog")?.showModal();
}

function openCareerOnboardingWelcome() {
  const dialog = document.querySelector("#onboarding-guide-dialog");
  if (!dialog || dialog.open) return;
  dialog.showModal();
}

function startCareerOnboardingFromWelcome() {
  document.querySelector("#onboarding-guide-dialog")?.close();
  openCareerJobMenu();
}

function selectCareerJob(jobId) {
  const capsule = ensureCareerPreviewCapsule();
  const job = jobs.find(item => item.id === jobId);
  if (!capsule || !job) return;
  const runtime = normalizeCareerPreviewRuntime(capsule);
  const career = runtime.career;
  const initial = career.introJobRequired && career.jobsHeldCount === 0 && !career.jobId;
  if (!initial) {
    if (career.jobId === job.id) return;
    career.jobApplication = {
      jobId: job.id,
      progress: 0,
      requiredWeeks: job.interviewWeeks,
      appliedWeek: capsule.timeState.clock.week,
    };
    persistCareerPreviewCapsule();
    document.querySelector("#job-dialog")?.close();
    renderCareerWorldPreview(true);
    showToast(`${job.title} · candidature envoyée, réponse dans ${job.interviewWeeks} semaine${job.interviewWeeks > 1 ? "s" : ""}`);
    return;
  }
  career.jobId = job.id;
  career.jobsHeldCount = 1;
  career.introJobRequired = false;
  career.initialJobLockedUntilWeek = 2;
  career.jobTenureWeeks = 0;
  career.jobWagesEarned = 0;
  career.missedWorkWeeks = 0;
  career.jobApplication = null;
  const onboarding = careerOnboardingView(capsule);
  if (onboarding?.state.mode === "guided" && !onboarding.state.initialJob.selected) {
    applyCareerOnboardingEvent({
      type: window.BoxeurOnboarding.EVENT_TYPES.SELECT_INITIAL_JOB,
      jobId: job.id,
    });
  }
  persistCareerPreviewCapsule();
  document.querySelector("#job-dialog")?.close();
  renderCareerWorldPreview(true);
  showToast(`${job.title} obtenu · la paie sera maintenant simulée chaque semaine`);
}

function cancelCareerJobApplication() {
  const capsule = ensureCareerPreviewCapsule();
  if (!capsule) return;
  const runtime = normalizeCareerPreviewRuntime(capsule);
  const job = jobs.find(item => item.id === runtime.career.jobApplication?.jobId);
  if (!runtime.career.jobApplication) return;
  runtime.career.jobApplication = null;
  persistCareerPreviewCapsule();
  document.querySelector("#job-dialog")?.close();
  renderCareerWorldPreview(true);
  openCareerLocation("work");
  showToast(`Candidature${job ? ` chez ${job.title}` : ""} annulée`);
}

function setMandatoryDialogState(dialogId, mandatory, accessibleReason = "Cette décision est requise pour poursuivre.") {
  const dialog = document.querySelector(`#${dialogId}`);
  if (!dialog) return;
  dialog.dataset.mandatory = mandatory ? "true" : "false";
  dialog.querySelectorAll(".dialog-close, [id$='-cancel']").forEach(control => {
    control.hidden = mandatory;
    control.disabled = mandatory;
    if (mandatory) control.setAttribute("aria-hidden", "true");
    else control.removeAttribute("aria-hidden");
  });
  if (mandatory) dialog.dataset.mandatoryReason = accessibleReason;
  else delete dialog.dataset.mandatoryReason;
}

function closeOptionalDialog(dialogId) {
  const dialog = document.querySelector(`#${dialogId}`);
  if (!dialog) return;
  if (dialog.dataset.mandatory === "true") {
    showToast(dialog.dataset.mandatoryReason || "Cette décision est requise pour poursuivre.");
    return;
  }
  dialog.close();
}

function careerSupplementState(capsule = ensureCareerPreviewCapsule()) {
  if (!capsule || !window.BoxeurSupplements) return null;
  const runtime = normalizeCareerPreviewRuntime(capsule);
  runtime.career.supplementState = window.BoxeurSupplements.createState(
    runtime.career.supplementState || {},
    { weekKey: capsule.timeState?.clock?.week || state.week },
  );
  return runtime.career.supplementState;
}

function openCareerSupplementShop() {
  const capsule = ensureCareerPreviewCapsule();
  const sheet = document.querySelector("#career-world .career-location-sheet");
  if (!capsule || !sheet || !window.BoxeurSupplements || !window.BoxeurStrengthView?.renderShop) return;
  const runtime = normalizeCareerPreviewRuntime(capsule);
  if (!["amateur", "professional"].includes(state.careerStatus)) return showToast("La boutique se débloque après le passage amateur.");
  if (runtime.career.strengthGymWeeks <= 0) return showToast("Un abonnement actif au gym de musculation est requis.");
  const supplementState = careerSupplementState(capsule);
  const products = Object.values(window.BoxeurSupplements.CATALOG).map(product => {
    const quantity = supplementState.inventory[product.id] || 0;
    const quote = window.BoxeurSupplements.quotePurchase(supplementState, product.id, 1, { money: runtime.career.money });
    return {
      id: product.id,
      label: product.label,
      category: product.category,
      benefit: product.benefit,
      compromise: product.compromise,
      price: product.price,
      quantity,
      available: quote.ok,
      reason: quote.reason || "",
    };
  });
  sheet.dataset.originLocation = "strength-gym";
  sheet.classList.add("career-location-sheet-full", "career-location-sheet-strength");
  sheet.innerHTML = window.BoxeurStrengthView.renderShop({ balance: runtime.career.money, products });
  activateCareerLocationSheet(sheet, "[data-career-supplement-buy], [data-career-supplement-shop-close]");
}

function purchaseCareerSupplement(productId) {
  const capsule = ensureCareerPreviewCapsule();
  if (!capsule || !window.BoxeurSupplements) return;
  const runtime = normalizeCareerPreviewRuntime(capsule);
  try {
    const supplementState = careerSupplementState(capsule);
    const transactionId = `shop:${capsule.timeState.clock.week}:${capsule.timeState.clock.absoluteSlot}:${productId}:${supplementState.purchaseIds.length + 1}`;
    const outcome = window.BoxeurSupplements.purchase(supplementState, productId, 1, {
      money: runtime.career.money,
      transactionId,
    });
    runtime.career.supplementState = outcome.state;
    runtime.career.money = outcome.balance;
    persistCareerPreviewCapsule();
    renderCareerWorldPreview(true);
    openCareerSupplementShop();
    showToast(`${window.BoxeurSupplements.CATALOG[productId].label} ajouté à ton inventaire · −${outcome.result.cost} $`);
  } catch (error) {
    showToast(error.message || "Cet achat n’est pas disponible.");
  }
}

function runCareerCoachSession() {
  const plannerId = state.careerStatus === "recreational" ? "group-class" : "boxing-coach";
  addCareerPlannerActivity(plannerId, {}, { toggle: plannerId === "group-class", reopen: "boxing-gym" });
}

function renderCareerGymMenu(menuId) {
  const sheet = document.querySelector("#career-world .career-location-sheet");
  if (!sheet || !window.BoxeurGymView?.renderMenu) return;
  const markup = window.BoxeurGymView.renderMenu(menuId, careerGymContext());
  if (!markup) return;
  sheet.dataset.originLocation = "boxing-gym";
  sheet.classList.add("career-location-sheet-full");
  sheet.innerHTML = markup;
  const preferredFocus = menuId === "coach"
    ? "[data-career-coach-session]:not([disabled]), [data-career-boxing-trainer]:not([disabled])"
    : "[data-career-sparring-activity]:not([disabled])";
  activateCareerLocationSheet(sheet, preferredFocus);
}

function renderCareerWorkMenu(menuId) {
  const sheet = document.querySelector("#career-world .career-location-sheet");
  if (!sheet || !window.BoxeurWorkView?.renderMenu) return;
  const markup = window.BoxeurWorkView.renderMenu(menuId, careerWorkLocationContext());
  if (!markup) return;
  sheet.dataset.originLocation = "work";
  sheet.classList.add("career-location-sheet-full");
  sheet.innerHTML = markup;
  const preferredFocus = menuId === "schedule"
    ? "[data-career-toggle-work]:not([disabled])"
    : "[data-career-open-job-menu]:not([disabled])";
  activateCareerLocationSheet(sheet, preferredFocus);
}

function renderCareerHomeMenu(menuId) {
  const sheet = document.querySelector("#career-world .career-location-sheet");
  if (!sheet || !window.BoxeurHomeView?.renderMenu) return;
  const markup = window.BoxeurHomeView.renderMenu(menuId, careerHomeContext());
  if (!markup) return;
  sheet.dataset.originLocation = "home";
  sheet.classList.add("career-location-sheet-full");
  sheet.innerHTML = markup;
  activateCareerLocationSheet(sheet, "[data-career-home-action], [data-career-home-menu-close]");
}

function runCareerHomeAction(viewActionId) {
  if (viewActionId === "home-custom") {
    if (state.careerStatus === "recreational") return showToast("La séance maison personnalisée se débloque après le passage amateur.");
    careerHomeSelection = [];
    renderCareerHomeComposer();
    return;
  }
  if (!["rest", "home-quick", "meal", "roadwork-short", "roadwork-long", "roadwork-intervals"].includes(viewActionId)) return;
  addCareerPlannerActivity(viewActionId, {}, { toggle: ["rest", "meal", "roadwork-short", "roadwork-long", "roadwork-intervals"].includes(viewActionId), reopen: "home" });
}

function renderCareerHomeComposer() {
  const sheet = document.querySelector("#career-world .career-location-sheet");
  if (!sheet) return;
  const choices = ["shadow-boxing", "basement-bag"].map(id => {
    const activity = CAREER_HOME_ACTIVITIES[id];
    const selected = careerHomeSelection.includes(id);
    return `<button type="button" class="career-exercise-choice${selected ? " selected" : ""}" data-career-home-exercise="${id}" aria-pressed="${selected}"><strong>${escapeHTML(activity.label)}</strong><small>−${activity.energyCost} énergie · +${activity.fatigueGain} fatigue</small></button>`;
  }).join("");
  const aggregate = careerPlannerHomeAggregate(careerHomeSelection);
  const empty = careerHomeSelection.length === 0;
  sheet.dataset.originLocation = "home";
  sheet.classList.add("career-location-sheet-full");
  sheet.innerHTML = `<section class="career-session-composer" aria-labelledby="career-home-composer-title">
    <header><div><p class="eyebrow">Maison · semaine ${ensureCareerPreviewCapsule().timeState.clock.week}</p><h2 id="career-home-composer-title">Bâtis un entraînement maison</h2></div><button type="button" data-career-home-composer-close>Fermer</button></header>
    <p>Choisis une ou deux activités du sous-sol. Cette combinaison comptera comme une seule séance physique dans la semaine. La course se planifie séparément par la porte.</p>
    <div class="career-composer-state" aria-live="polite"><strong>${careerHomeSelection.length} activité${careerHomeSelection.length > 1 ? "s" : ""}</strong><span>−${aggregate.totals.energyCost} énergie</span><span>+${aggregate.totals.fatigueGain} fatigue</span></div>
    <div class="career-exercise-grid">${choices}</div>
    <footer><button type="button" class="secondary-button" data-career-home-composer-close>Annuler</button><button type="button" class="primary-button" data-career-home-custom-confirm${empty ? " disabled aria-disabled=\"true\"" : ""}>Ajouter à ma semaine</button></footer>
  </section>`;
  activateCareerLocationSheet(sheet, "[data-career-home-exercise], [data-career-home-composer-close]");
}

function toggleCareerHomeExercise(exerciseId) {
  if (!CAREER_HOME_ACTIVITIES[exerciseId] || CAREER_HOME_ACTIVITIES[exerciseId].category !== "home-training") return;
  const index = careerHomeSelection.indexOf(exerciseId);
  if (index >= 0) careerHomeSelection.splice(index, 1);
  else if (careerHomeSelection.length < 2) careerHomeSelection.push(exerciseId);
  else return showToast("Une séance maison reste courte : choisis au maximum deux activités.");
  renderCareerHomeComposer();
}

function renderCareerComposer() {
  const sheet = document.querySelector("#career-world .career-location-sheet");
  if (!sheet || !window.BoxeurGymView || !window.BoxeurTraining) return;
  const engineIds = careerComposerSelection.map(id => CAREER_EXERCISE_TO_ENGINE[id]).filter(Boolean);
  const durationMinutes = engineIds.reduce((sum, id) => sum + (window.BoxeurTraining.EXERCISES[id]?.durationMinutes || 0), 0);
  let draftWeekCost = 0;
  if (engineIds.length) {
    const totals = engineIds.reduce((sum, id) => {
      const exercise = window.BoxeurTraining.EXERCISES[id];
      sum.energyCost += Number(exercise?.energyCost || 0);
      sum.fatigueDelta += Number(exercise?.fatigueGain || 0) - Number(exercise?.fatigueRelief || 0);
      return sum;
    }, { energyCost: 0, fatigueDelta: 0 });
    draftWeekCost = careerPlannerLoadCost(totals.energyCost, totals.fatigueDelta, 4, CAREER_CUSTOM_SESSION_BASE_COST);
  }
  sheet.dataset.originLocation = "boxing-gym";
  sheet.classList.add("career-location-sheet-full");
  sheet.innerHTML = window.BoxeurGymView.renderComposer({
    ...careerGymContext(),
    selectedExercises: careerComposerSelection,
    draftDurationMinutes: durationMinutes,
    draftWeekCost,
  });
  activateCareerLocationSheet(sheet, "[data-career-close-composer]");
}

function selectCareerComposerPreset(presetId) {
  const preset = window.BoxeurGymView?.PRESETS?.find(item => item.id === presetId);
  if (!preset) return;
  careerComposerSelection = [...preset.exerciseIds];
  renderCareerComposer();
}

function toggleCareerComposerExercise(exerciseId) {
  if (!Object.hasOwn(CAREER_EXERCISE_TO_ENGINE, exerciseId)) return;
  const existing = careerComposerSelection.indexOf(exerciseId);
  if (existing >= 0) careerComposerSelection.splice(existing, 1);
  else if (careerComposerSelection.length < window.BoxeurGymView.EXERCISES.length) careerComposerSelection.push(exerciseId);
  renderCareerComposer();
}

function runCareerCustomSession() {
  if (!window.BoxeurTraining) return;
  const selected = new Set(careerComposerSelection);
  const hasPreparation = selected.has("jump-rope");
  const hasWork = ["shadow-boxing", "heavy-bag", "mitt-work", "defense"].some(id => selected.has(id));
  const hasCooldown = selected.has("cooldown");
  if (!hasPreparation || !hasWork || !hasCooldown) {
    return showToast("Complète la préparation, le travail principal et le retour au calme avant d’ajouter la séance.");
  }
  const blocks = careerComposerSelection.map(id => CAREER_EXERCISE_TO_ENGINE[id]).filter(Boolean);
  const outcome = addCareerPlannerActivity("boxing-custom", { blocks }, { reopen: "boxing-gym" });
  if (outcome) careerComposerSelection = [];
}

function renderCareerStrengthMenu(menuId, preferredFocusSelector = "") {
  const sheet = document.querySelector("#career-world .career-location-sheet");
  if (!sheet || !window.BoxeurStrengthView?.renderMenu) return;
  const markup = window.BoxeurStrengthView.renderMenu(menuId, careerStrengthContext());
  if (!markup) return;
  sheet.dataset.originLocation = "strength-gym";
  sheet.classList.add("career-location-sheet-full", "career-location-sheet-strength");
  sheet.innerHTML = markup;
  const defaultFocus = menuId === "reception"
    ? "[data-career-strength-plan]:not([disabled]), [data-career-strength-menu-close]"
    : menuId === "crossfit"
      ? "[data-career-strength-quick]:not([disabled]), [data-career-strength-menu-close]"
      : "[data-career-strength-activity]:not([disabled]), [data-career-strength-menu-close]";
  activateCareerLocationSheet(sheet, preferredFocusSelector || defaultFocus);
}

function toggleCareerStrengthActivity(activityId) {
  const capsule = ensureCareerPreviewCapsule();
  if (!capsule?.timeState || !window.BoxeurStrength) return;
  const outcome = window.BoxeurStrength.toggleActivity(
    capsule.timeState,
    careerStrengthSelection,
    activityId,
    careerStrengthContext(),
  );
  if (!outcome.ok) return showToast(outcome.reason || "Cette activité ne peut pas être ajoutée.");
  careerStrengthSelection = outcome.selection;
  renderCareerStrengthMenu("program", `[data-career-strength-activity="${safeIdentifier(activityId)}"]`);
}

function selectCareerStrengthPlan(planId) {
  const capsule = ensureCareerPreviewCapsule();
  const plan = strengthGymPlans.find(item => item.id === planId);
  if (!capsule || !plan || !window.BoxeurStrength) return;
  const runtime = normalizeCareerPreviewRuntime(capsule);
  if (state.careerStatus === "recreational") {
    return showToast("Le gym de musculation se débloque après le passage amateur.");
  }
  if (runtime.career.strengthGymWeeks > 0) return showToast("Ton abonnement de musculation est déjà actif.");
  const reserve = careerReservedBoxingGymBudget(careerCareerView());
  const spendable = Math.max(0, runtime.career.money - reserve);
  if (spendable < plan.price) {
    const reserveDetail = reserve > 0 ? ` Le premier mois du GYM de boxe garde ${reserve} $ en réserve.` : "";
    return showToast(`Il manque ${plan.price - spendable} $ pour ce forfait.${reserveDetail}`);
  }
  runtime.career.money -= plan.price;
  runtime.career.strengthGymWeeks = plan.weeks;
  careerStrengthSelection = [];
  persistCareerPreviewCapsule();
  renderCareerWorldPreview(true);
  openCareerLocation("strength-gym");
  showToast(`Gym de musculation actif · ${plan.label.toLowerCase()} · ${plan.weeks} semaines`);
}

function runCareerStrengthSession() {
  if (!window.BoxeurStrength || !careerStrengthSelection.length) {
    return showToast("Ajoute au moins un exercice de travail physique.");
  }
  const selection = [...careerStrengthSelection];
  const outcome = addCareerPlannerActivity("strength-custom", { selection }, { reopen: "strength-gym" });
  if (outcome) careerStrengthSelection = [];
}

function careerTrainerLocationForTarget(target) {
  return ["power", "cardio"].includes(target) ? "strength-gym" : "boxing-gym";
}

function careerTrainerTargetLabel(target) {
  return combatLabels[target] || "Qualité ciblée";
}

function careerTrainerAccess(locationId, program = null) {
  const capsule = ensureCareerPreviewCapsule();
  const career = capsule ? normalizeCareerPreviewRuntime(capsule).career : null;
  if (!capsule?.timeState || !career) return { available: false, reason: "Carrière indisponible." };
  if (!["amateur", "professional"].includes(state.careerStatus)) {
    return { available: false, reason: "Les programmes privés se débloquent après le passage amateur." };
  }
  const membershipActive = locationId === "strength-gym" ? career.strengthGymWeeks > 0 : career.gymWeeks > 0;
  if (!membershipActive) return { available: false, reason: "Un abonnement actif dans ce gym est requis." };
  const conditionAccess = careerConditionActivityAccess("private-training", capsule);
  if (!conditionAccess.available) return conditionAccess;
  if (program && careerTrainerLocationForTarget(program.target) !== locationId) {
    const destination = careerTrainerLocationForTarget(program.target) === "strength-gym" ? "gym de musculation" : "GYM de boxe";
    return { available: false, reason: `Ce programme se poursuit au ${destination}.` };
  }
  const trainingWindow = careerNextTrainingWindow(capsule.timeState);
  return trainingWindow.available
    ? { available: true, reason: "", label: trainingWindow.label }
    : { available: false, reason: trainingWindow.reason };
}

function renderCareerTrainerMenu(locationId = "boxing-gym") {
  const capsule = ensureCareerPreviewCapsule();
  const sheet = document.querySelector("#career-world .career-location-sheet");
  if (!capsule || !sheet || !window.BoxeurTrainer) return;
  const runtime = normalizeCareerPreviewRuntime(capsule);
  const trainerState = runtime.career.trainerState;
  const publicState = window.BoxeurTrainer.getPublicState(trainerState);
  const active = publicState.activeProgram;
  const allowedTargets = locationId === "strength-gym" ? ["power", "cardio"] : ["technique", "defense"];
  if (active) careerTrainerTarget = active.target;
  else if (!allowedTargets.includes(careerTrainerTarget)) careerTrainerTarget = allowedTargets[0];
  const access = careerTrainerAccess(locationId, active);
  const locationLabel = locationId === "strength-gym" ? "gym de musculation" : "GYM de boxe";
  let body = "";
  if (active) {
    const trainer = window.BoxeurTrainer.getTrainer(active.trainerId);
    const correctLocation = careerTrainerLocationForTarget(active.target);
    const otherLocation = correctLocation !== locationId;
    body = `<section class="career-trainer-active" aria-labelledby="career-trainer-active-title">
      <p class="eyebrow">Programme actif</p><h3 id="career-trainer-active-title">${escapeHTML(active.trainerLabel)}</h3>
      <p><strong>${escapeHTML(careerTrainerTargetLabel(active.target))}</strong> · ${active.sessionsCompleted}/${active.sessionsTotal} séances complétées</p>
      <progress max="${active.sessionsTotal}" value="${active.sessionsCompleted}">${active.sessionsCompleted}/${active.sessionsTotal}</progress>
      <p>${escapeHTML(otherLocation ? access.reason : `Prochaine séance : ${access.label || "créneau à confirmer"}. Chaque cours produit de l’XP ciblée qui doit ensuite être assimilée.`)}</p>
      ${otherLocation
        ? `<button type="button" class="primary-button" data-career-trainer-go-location="${correctLocation}">Aller au ${correctLocation === "strength-gym" ? "gym de musculation" : "GYM de boxe"}</button>`
        : `<button type="button" class="primary-button" data-career-trainer-session${access.available ? "" : " disabled aria-disabled=\"true\""}>Ajouter la prochaine séance · −${trainer.energyCost} énergie</button>`}
      ${!access.available && !otherLocation ? `<small class="career-trainer-reason">${escapeHTML(access.reason)}</small>` : ""}
    </section>`;
  } else {
    const targetButtons = allowedTargets.map(target => `<button type="button" data-career-trainer-target="${target}" aria-pressed="${careerTrainerTarget === target}">${escapeHTML(careerTrainerTargetLabel(target))}</button>`).join("");
    const statValue = Number(careerProgressionSnapshot(capsule)?.stats?.[careerTrainerTarget] || state.combatStats[careerTrainerTarget] || 40);
    const lessonCredits = safeNumber(runtime.career.privateLessonCredits, 0, 0, 99);
    const offers = window.BoxeurTrainer.listOffers({ statValue }).map(offer => {
      const lessonDiscount = lessonCredits > 0 ? Math.round(offer.cost / offer.sessions) : 0;
      const currentCost = offer.cost - lessonDiscount;
      const insufficient = runtime.career.money < currentCost;
      const locked = !access.available || insufficient;
      const reason = !access.available ? access.reason : insufficient ? `Il manque ${currentCost - runtime.career.money} $.` : "";
      return `<article class="career-trainer-offer">
        <div><p class="eyebrow">${escapeHTML(offer.tierLabel)}</p><h3>${escapeHTML(offer.label)}</h3></div>
        <strong>${lessonDiscount > 0 ? `<s>${offer.cost} $</s> ${currentCost} $` : `${offer.cost} $`} · ${offer.sessions} séances</strong>
        ${lessonDiscount > 0 ? `<small class="career-trainer-gift">Bon cadeau appliqué · une séance offerte (−${lessonDiscount} $)</small>` : ""}
        <p>Environ ${Math.round(offer.estimatedTargetedXpPerSession ?? offer.estimatedGaugePointsPerSession)} XP ciblée par séance, avant assimilation.</p>
        <small>−${offer.energyCost} énergie · +${offer.fatigue} fatigue par séance</small>
        <button type="button" data-career-trainer-start="${offer.id}"${locked ? " disabled aria-disabled=\"true\"" : ""}>Choisir ${escapeHTML(offer.label)}</button>
        ${reason ? `<small class="career-trainer-reason">${escapeHTML(reason)}</small>` : ""}
      </article>`;
    }).join("");
    body = `<section class="career-trainer-picker" aria-labelledby="career-trainer-picker-title">
      <div><p class="eyebrow">Qualité travaillée</p><h3 id="career-trainer-picker-title">Choisis une cible</h3><div class="career-trainer-targets">${targetButtons}</div></div>
      <p>Le prix couvre le programme complet. Un entraîneur plus cher crée davantage d’XP ciblée; la récupération reste nécessaire avant tout gain de caractéristique.${lessonCredits > 0 ? ` Tu as ${lessonCredits} bon${lessonCredits > 1 ? "s" : ""} pour un cours offert.` : ""}</p>
      <div class="career-trainer-offers">${offers}</div>
    </section>`;
  }
  sheet.dataset.originLocation = locationId;
  sheet.dataset.trainerLocation = locationId;
  sheet.classList.add("career-location-sheet-full");
  sheet.classList.toggle("career-location-sheet-strength", locationId === "strength-gym");
  sheet.innerHTML = `<section class="career-service-panel career-trainer-panel" aria-labelledby="career-trainer-title">
    <header><div><p class="eyebrow">Service du ${escapeHTML(locationLabel)}</p><h2 id="career-trainer-title">${locationId === "strength-gym" ? "Entraîneurs privés" : "Entraîneur privé"}</h2></div><button type="button" class="secondary-button" data-career-trainer-close>Fermer</button></header>
    <div class="career-service-balance">Solde disponible <strong>${runtime.career.money} $</strong></div>${body}
  </section>`;
  activateCareerLocationSheet(sheet, active ? "[data-career-trainer-session], [data-career-trainer-go-location], [data-career-trainer-close]" : `[data-career-trainer-target="${careerTrainerTarget}"]`);
}

function startCareerTrainerProgram(trainerId) {
  const capsule = ensureCareerPreviewCapsule();
  const sheet = document.querySelector("#career-world .career-location-sheet");
  const locationId = sheet?.dataset.trainerLocation || careerTrainerLocationForTarget(careerTrainerTarget);
  if (!capsule || !window.BoxeurTrainer) return;
  const runtime = normalizeCareerPreviewRuntime(capsule);
  const access = careerTrainerAccess(locationId);
  if (!access.available) return showToast(access.reason);
  try {
    const outcome = window.BoxeurTrainer.startProgram(runtime.career.trainerState, {
      trainerId,
      target: careerTrainerTarget,
      startedWeek: capsule.timeState.clock.week,
    }, {
      balance: runtime.career.money,
      freeSessions: runtime.career.privateLessonCredits > 0 ? 1 : 0,
    });
    runtime.career.trainerState = outcome.state;
    runtime.career.money = outcome.result.remainingBalance;
    if (outcome.result.freeSessionsUsed > 0) {
      runtime.career.privateLessonCredits = Math.max(0, runtime.career.privateLessonCredits - outcome.result.freeSessionsUsed);
    }
    persistCareerPreviewCapsule();
    renderCareerWorldPreview(true);
    renderCareerTrainerMenu(locationId);
    showToast(`${outcome.result.trainer.label} · programme de ${outcome.result.program.sessionsTotal} séances confirmé`);
  } catch (error) {
    showToast(error.message || "Ce programme privé ne peut pas être commencé.");
  }
}

function runCareerTrainerSession() {
  const capsule = ensureCareerPreviewCapsule();
  if (!capsule?.timeState || !window.BoxeurTrainer) return;
  const runtime = normalizeCareerPreviewRuntime(capsule);
  const publicProgram = window.BoxeurTrainer.getPublicState(runtime.career.trainerState).activeProgram;
  if (!publicProgram) return showToast("Aucun programme privé n’est actif.");
  const locationId = careerTrainerLocationForTarget(publicProgram.target);
  const access = careerTrainerAccess(locationId, publicProgram);
  if (!access.available) return showToast(access.reason);
  addCareerPlannerActivity("private-training", {}, { reopen: locationId });
}

async function runCareerTechnicalSparring(options = {}) {
  const immediateAmateurSparring = state.careerStatus === "amateur";
  if (!immediateAmateurSparring && options.launch !== true) {
    addCareerPlannerActivity("sparring", {}, { toggle: true, reopen: "boxing-gym" });
    return;
  }
  const capsule = ensureCareerPreviewCapsule();
  if (!capsule || !window.BoxeurTraining) return;
  if (!["amateur", "professional"].includes(state.careerStatus)) return showToast("Termine d’abord le sparring d’évaluation; le passage amateur se fera automatiquement.");
  const career = careerCareerView();
  if (career.gymWeeks <= 0) return showToast("Un abonnement actif au GYM est requis pour réserver un partenaire.");
  const access = careerPlannerActivityAccess("sparring");
  if (!access.available) return showToast(access.reason);
  try {
    const runtime = normalizeCareerPreviewRuntime(capsule);
    let plannerState = ensureCareerWeekPlanner(capsule);
    let plannerEntry = options.entryId
      ? plannerState.entries.find(entry => entry.id === options.entryId && entry.activityId === "sparring")
      : plannerState.entries.find(entry => !entry.preReserved && entry.activityId === "sparring" && !entry.metadata?.completed);
    if (plannerEntry?.metadata?.completed) return showToast("Ce sparring a déjà été fait cette semaine.");
    if (!plannerEntry) {
      const definition = careerPlannerActivityDefinition("sparring", { immediate: immediateAmateurSparring });
      const outcome = window.BoxeurWeekPlanner.addActivity(plannerState, definition, { source: immediateAmateurSparring ? "immediate" : "gym" });
      plannerState = careerPlannerStore(capsule, outcome.state);
      plannerEntry = outcome.result.entry;
    }
    runtime.pendingPlannerSparringEntryId = plannerEntry.id;
    prepareCareerTrainingWindow(capsule);
    const rating = clamp(Math.round(Object.values(career.combatStats).reduce((sum, value) => sum + Number(value || 0), 0) / 4), 30, 95);
    const partner = recreationalSparringPartner();
    const deferredScheduledFight = state.scheduledFight?.isPracticeSparring
      ? cloneData(state.scheduledFight.deferredScheduledFight || null)
      : state.scheduledFight && !state.scheduledFight.isRecreationalSparring
        ? cloneData(state.scheduledFight)
        : null;
    state.scheduledFight = {
      id: `${partner.id}-gym-${capsule.timeState.clock.week}`,
      opponent: {
        id: `${partner.id}-gym-${capsule.timeState.clock.week}`,
        name: partner.name,
        nickname: partner.nickname,
        style: partner.style,
        rating,
        difficulty: rating,
        record: "Sparring technique",
        weightClass: state.profile.weightClass,
        stats: opponentStatsForRating(rating, partner.style, `${partner.id}-${capsule.timeState.clock.week}`),
      },
      tournamentId: null,
      tournamentRound: null,
      bookingId: null,
      eventId: "sparring-technique",
      event: { id: "sparring-technique", name: "Sparring technique · GYM de boxe", careerWeek: state.week },
      week: state.week,
      isPracticeSparring: true,
      isCareerSparring: true,
      travelEffects: { energy: 0, fatigue: 0 },
      travelApplied: true,
      deferredScheduledFight,
      fightSeed: freshFightSeed(`sparring-technique-${state.profile.firstName}-${capsule.timeState.clock.week}`),
    };
    // Le combat fait partie de l’empreinte de sauvegarde : enregistrer après
    // sa création conserve le lien avec l’entrée du brouillon hebdomadaire.
    persistCareerPreviewCapsule();
    await startFight();
  } catch (error) {
    showToast(error.message || "Le sparring n’est pas disponible maintenant.");
  }
}

async function startCareerRemySparring() {
  const capsule = ensureCareerPreviewCapsule();
  const onboarding = careerOnboardingView(capsule);
  if (!capsule || !onboarding) return;
  if (!onboarding.gates.remySparring.allowed) return showToast(onboarding.gates.remySparring.reason);
  const partner = sparringPartnerView();
  if (careerCareerView().gymWeeks <= 0) return showToast(`Réactive ton abonnement au GYM avant le sparring de ${partner.firstName}.`);
  try {
    prepareCareerTrainingWindow(capsule);
    if (!state.scheduledFight?.isRecreationalSparring) scheduleRecreationalSparring([]);
    if (!state.scheduledFight?.isRecreationalSparring) return showToast(`${partner.firstName} n’a pas pu être ${state.profile.sex === "female" ? "ajoutée" : "ajouté"} à l’horaire.`);
    state.scheduledFight.isCareerSparring = true;
    persistCareerPreviewCapsule();
    await startFight();
  } catch (error) {
    showToast(error.message || `Le sparring de ${partner.firstName} ne peut pas commencer maintenant.`);
  }
}

function applyChanges(changes = {}) {
  Object.entries(changes).forEach(([key, change]) => {
    if (CAREER_LEGACY_CONDITION_KEYS.has(key)) return;
    if (key === "money" || key === "experience") state[key] = Math.max(0, state[key] + change);
    else state[key] = clamp(state[key] + change);
  });
  syncLevelProgress();
  // Les combats et les événements modifient parfois l'XP sans relancer le rendu général.
  // Rafraîchir seulement le panneau de niveau garde l'affichage synchronisé immédiatement.
  if (state.profile) renderLevel();
}

function applyCombatChanges(changes = {}) {
  Object.entries(changes).forEach(([key, change]) => {
    state.combatStats[key] = clamp(state.combatStats[key] + change, 0, 99);
  });
}

function endWeek(events) {
  const endingWeek = state.week;
  state.week += 1;
  activateReadyJobOffer(events);
  state.supplementWeek = state.week;
  state.supplementsUsed = [];
  state.pendingWeekEvent = null;
  state.energy = clamp(state.energy + 6);
  state.fatigue = clamp(state.fatigue - (state.energy < 35 ? 4 : 6));
  if (state.profile && !state.activeTournament) {
    const targetWeight = defaultCompetitionWeight(weightClassDefinition(state.profile.weightClass, state.profile.sex));
    const weightDifference = targetWeight - state.currentWeightKg;
    if (Math.abs(weightDifference) >= .05) {
      const weeklyAdjustment = clamp(weightDifference, -.8, .8);
      state.currentWeightKg = Math.round((state.currentWeightKg + weeklyAdjustment) * 10) / 10;
    }
  }
  if (state.preFightTrainingWeek === endingWeek) state.preFightTrainingWeek = 0;
  const membershipWasActive = state.gymWeeks > 0;
  const strengthMembershipWasActive = state.strengthGymWeeks > 0;
  if (membershipWasActive) state.gymWeeks -= 1;
  if (strengthMembershipWasActive) state.strengthGymWeeks -= 1;

  let summary = "La récupération naturelle te rend un peu d'énergie.";
  if (state.energy < 20 || state.fatigue >= 85) {
    summary = "La fatigue accumulée réduit fortement ta préparation. Il faudrait lever le pied.";
    events.push(summary);
  }
  if (state.careerStatus === "amateur" && !state.scheduledFight && !state.activeTournament && endingWeek > state.lastFightWeek) {
    state.avoidanceWeeks += 1;
    if (state.avoidanceWeeks >= 3) {
      const warning = state.avoidanceWeeks >= 6 ? "Le coach te prévient : à force d’éviter les combats, ta réputation et la qualité des offres diminuent." : "Le coach te prévient : trois semaines sans combat ralentissent ta réputation et ta progression.";
      state.reputation = clamp(state.reputation - (state.avoidanceWeeks >= 6 ? 2 : 1));
      events.push(warning);
      state.journal.unshift({ week: endingWeek, text: warning });
    }
  } else if (state.scheduledFight || state.activeTournament || state.lastFightWeek >= endingWeek) {
    state.avoidanceWeeks = 0;
  }
  updateBoxingRhythm(events, endingWeek);
  state.journal.unshift({ week: endingWeek, text: `Bilan : ${summary}` });
  if (membershipWasActive && state.gymWeeks === 0) {
    const expiry = "Ton abonnement au GYM de boxe est expiré. Renouvelle-le pour reprendre l'entraînement et le sparring.";
    events.push(expiry);
    state.journal.unshift({ week: endingWeek, text: expiry });
  }
  if (strengthMembershipWasActive && state.strengthGymWeeks === 0) {
    const expiry = "Ton abonnement au gym de musculation est expiré : les exercices et les préparateurs physiques sont maintenant verrouillés.";
    events.push(expiry);
    state.journal.unshift({ week: endingWeek, text: expiry });
  }
}

function continueAfterWeekTransition() {
  if (state.activeTournament && state.week >= state.activeTournament.startWeek && state.activeTournament.status !== "completed") openTournamentBoard();
}

async function startDeveloperBout(kind = "fight") {
  if (!state.profile || fightState || document.querySelector("#fight-dialog")?.open) {
    showToast("Termine d’abord l’affrontement déjà ouvert.");
    return;
  }
  const isSparring = kind === "sparring";
  const rating = clamp(Math.round(Object.values(state.combatStats).reduce((sum, value) => sum + Number(value || 0), 0) / 4), 30, 95);
  const opponentName = state.profile.sex === "female" ? "Camille Banc d’essai" : "Mathieu Banc d’essai";
  developerBoutScheduledBackup = state.scheduledFight ? cloneData(state.scheduledFight) : null;
  state.scheduledFight = {
    id: `developer-${kind}-${Date.now()}`,
    opponent: {
      id: `developer-${kind}-opponent`,
      name: opponentName,
      nickname: "Profil test",
      style: "Équilibré",
      rating,
      difficulty: rating,
      record: isSparring ? "Sparring de test" : "Combat de test",
      weightClass: state.profile.weightClass,
      stats: opponentStatsForRating(rating, "Équilibré", `${opponentName}-${rating}`),
    },
    tournamentId: null,
    tournamentRound: null,
    bookingId: null,
    eventId: `developer-${kind}`,
    event: {
      id: `developer-${kind}`,
      name: isSparring ? "Sparring immédiat · mode développeur" : "Combat immédiat · mode développeur",
      careerWeek: state.week,
    },
    week: state.week,
    isPracticeSparring: isSparring,
    isDeveloperBout: true,
    travelEffects: { energy: 0, fatigue: 0 },
    travelApplied: true,
    fightSeed: freshFightSeed(`developer-${kind}-${state.profile.firstName}-${state.week}-${rating}`),
  };
  document.querySelector("#developer-test-dialog")?.close();
  try {
    await startFight();
  } catch (error) {
    state.scheduledFight = developerBoutScheduledBackup;
    developerBoutScheduledBackup = null;
    console.error("[Boxeur Deux] Affrontement développeur impossible :", error);
    showToast("Le test immédiat n’a pas pu démarrer.");
  }
}

async function startFight() {
  if (fightState || document.querySelector("#fight-dialog")?.open) return;
  clearSparringAutoResolve();
  const opponent = scheduledOpponent();
  if (!opponent) return;
  if (state.week < state.scheduledFight.week) return showToast(`Combat prévu à la semaine ${state.scheduledFight.week}.`);
  const isDeveloperBout = Boolean(state.scheduledFight.isDeveloperBout);
  const isCareerSparring = Boolean(state.scheduledFight.isCareerSparring);
  if (!state.scheduledFight.travelApplied) {
    applyChanges({ energy: state.scheduledFight.travelEffects?.energy || 0, fatigue: state.scheduledFight.travelEffects?.fatigue || 0 });
    state.scheduledFight.travelApplied = true;
    if (syncCareerFightGateProgressToCapsule()) persistCareerPreviewCapsule();
  }
  const isRecreationalSparring = Boolean(state.scheduledFight.isRecreationalSparring);
  const isPracticeSparring = Boolean(state.scheduledFight.isPracticeSparring);
  const isNonRecordSparring = isRecreationalSparring || isPracticeSparring;
  const isTournamentBout = Boolean(state.scheduledFight.tournamentId) && !isNonRecordSparring;
  const isLocalOfficialFight = !isTournamentBout && !isNonRecordSparring;
  const useImmersiveRing = isNonRecordSparring || isLocalOfficialFight || isTournamentBout;
  const careerFightCareer = !state.scheduledFight.tournamentId && !isDeveloperBout
    ? careerCareerView()
    : null;
  const difficulty = opponentDifficulty(opponent);
  const opponentStats = opponent.stats || opponentStatsForRating(difficulty, opponent.style, opponent.id);
  if (!state.scheduledFight.fightSeed) state.scheduledFight.fightSeed = freshFightSeed(`${state.scheduledFight.id}-${state.week}`);
  const scheduled = cloneData(state.scheduledFight);
  const activeEffect = state.activeTournament?.competition?.activeEffects?.find(effect => effect.type === "scouting");
  const homeStudy = Number(scheduled.homeAdvantage?.coachReadBonus || 0);
  const campStudy = state.preFightStudyWeek === state.week ? .10 : 0;
  fightState = BoxeurCombat.createFight({
    id: `${scheduled.id}-${state.week}-${scheduled.tournamentRound ?? "local"}`,
    seed: scheduled.fightSeed,
    kind: scheduled.tournamentId ? "tournament" : "local",
    tournamentId: scheduled.tournamentId,
    opponentDifficulty: difficulty,
    exchangesPerRound: isNonRecordSparring ? 4 : 5,
    actionChoiceCount: useImmersiveRing ? 5 : 4,
    coachQuality: clamp((isNonRecordSparring ? .58 : .60) + homeStudy, .55, .78),
    studyBonus: Math.max(campStudy, activeEffect?.readAccuracyBonus || 0, homeStudy),
    studyExchangeLimit: activeEffect?.exchangesRemaining,
    playerEffects: state.activeTournament?.competition?.activeEffects || [],
    player: {
      id: "player",
      name: state.profile.firstName,
      style: styles[state.profile.style].label,
      stats: careerFightCareer?.combatStats || state.combatStats,
      energy: isDeveloperBout ? 100 : careerFightCareer?.energy ?? state.activeTournament?.competition?.condition?.energy ?? state.energy,
      fitness: CAREER_NEUTRAL_COMBAT_CONDITION.fitness,
      fatigue: isDeveloperBout ? 0 : careerFightCareer?.fatigue ?? state.fatigue,
      injury: CAREER_NEUTRAL_COMBAT_CONDITION.injury,
      morale: CAREER_NEUTRAL_COMBAT_CONDITION.morale,
      experience: state.experience,
      level: state.level,
      head: state.activeTournament?.competition?.condition?.headDamage || 0,
      body: state.activeTournament?.competition?.condition?.bodyDamage || 0,
      lucidity: clamp((state.activeTournament?.competition?.condition?.lucidity ?? 100) + Number(scheduled.homeAdvantage?.openingComposure || 0)),
    },
    opponent: { id: opponent.id, name: opponent.name, style: opponent.style, stats: opponentStats },
  });
  fightState.careerMeta = {
    opponent: cloneData(opponent),
    opponentDifficulty: difficulty,
    reputationReward: opponentReputationReward(difficulty),
    experienceReward: scheduled.tournamentId ? 20 + (scheduled.tournamentRound || 0) * 2 : opponentExperienceReward(difficulty),
    tournamentId: scheduled.tournamentId || null,
    tournamentRound: scheduled.tournamentRound,
    bookingId: scheduled.bookingId || null,
    isRecreationalSparring,
    isPracticeSparring,
    isLocalOfficialFight,
    isTournamentOfficialFight: isTournamentBout,
    isCareerSparring,
    isDeveloperBout,
    deferredScheduledFight: scheduled.deferredScheduledFight ? cloneData(scheduled.deferredScheduledFight) : null,
    remyLesson: !isRecreationalSparring ? state.remyLesson : "",
    careerBefore: {
      energy: Math.round(careerFightCareer?.energy ?? state.energy),
      fatigue: Math.round(careerFightCareer?.fatigue ?? state.fatigue),
      experience: state.experience,
      reputation: state.reputation,
      money: state.money,
      amateurRecord: cloneData(state.amateurRecord),
    },
  };
  sparringRingState = useImmersiveRing && window.BoxeurSparringRing
    ? window.BoxeurSparringRing.createState({
      seed: fightState.seed,
      playerCorner: state.profile.corner,
      playerStats: fightState.fighters.player.stats,
      opponentStyle: fightState.fighters.opponent.style,
      coachQuality: fightState.coach.quality,
    })
    : null;
  if (sparringRingState) syncImmersiveRingContext();
  if (!isRecreationalSparring && state.remyLesson) state.remyLesson = "";
  const stage = document.querySelector("#fight-ring-stage");
  stage.dataset.cue = "neutral";
  stage.classList.remove("show-impact");
  configureRingImages();
  if (isNonRecordSparring) configureSparringPlayerImages();
  const tournamentVisualFamily = scheduled.tournamentId === "olympic" ? "olympic" : "amateur";
  const immersiveBackdropSelector = isTournamentBout
    ? `.tournament-${tournamentVisualFamily}-ring-backdrop, .tournament-${tournamentVisualFamily}-before-backdrop, .tournament-${tournamentVisualFamily}-corner-backdrop, .tournament-${tournamentVisualFamily}-after-backdrop, .sparring-fighter-image`
    : isLocalOfficialFight
      ? ".local-fight-ring-backdrop, .local-fight-before-backdrop, .local-fight-corner-backdrop, .local-fight-after-backdrop, .sparring-fighter-image"
      : ".sparring-ring-backdrop, .sparring-before-backdrop, .sparring-corner-backdrop, .sparring-after-backdrop, .sparring-fighter-image";
  const backdrops = sparringRingState
    ? [...stage.querySelectorAll(immersiveBackdropSelector)]
    : [stage.querySelector(".ring-backdrop")].filter(Boolean);
  if (backdrops.length) {
    backdrops.forEach(image => {
      image.loading = "eager";
      image.fetchPriority = "high";
    });
    let preloadTimer;
    try {
      await Promise.race([
        Promise.all(backdrops.map(image => image.decode())),
        new Promise(resolve => { preloadTimer = setTimeout(resolve, 1200); }),
      ]);
    } catch {
      // Le texte et les commandes restent utilisables si le décor ne peut pas être décodé.
    } finally {
      clearTimeout(preloadTimer);
    }
  }
  document.querySelector("#fight-dialog").showModal();
  renderFight();
}

function withdrawFight() {
  const opponent = scheduledOpponent();
  if (!opponent) return;
  if (!window.confirm(`Se désister du combat contre ${opponent.name} ?\n\nLe combat sera annulé et tu pourras poursuivre la carrière.`)) return;
  state.journal.unshift({ week: state.week, text: `Tu te désistes du combat amateur contre ${opponent.name}. Le rendez-vous est annulé.` });
  const tournamentId = state.scheduledFight.tournamentId;
  const bookingId = state.scheduledFight.bookingId;
  if (tournamentId && state.activeTournament) completeTournament(null);
  state.scheduledFight = null;
  if (tournamentId) restoreDeferredGalaAfterTournamentBout();
  const booking = state.bookings.find(item => item.id === bookingId);
  if (booking) booking.status = "withdrawn";
  if (!tournamentId && careerFightGateReady(careerCapsule)) finalizeCareerFightGate();
  render();
  showToast("Combat annulé");
}

function opponentForGala(event, slotIndex) {
  const pool = opponentPool();
  const index = Math.abs(deterministicSeed(`${event.id}-${slotIndex}-${state.profile.sex}`)) % pool.length;
  const slot = event.opponentSlots?.[slotIndex] || event.opponentSlots?.[0] || { ratingOffset: 0 };
  const opponent = buildLocalOpponent(pool[index], Number(slot.ratingOffset) || 0, slotIndex);
  opponent.id = `${event.id}-${opponent.id}-${slotIndex}`;
  opponent.stats = opponentStatsForRating(opponent.rating, opponent.style, opponent.id);
  return opponent;
}

function bookGalaEvent(eventId, slotIndex) {
  if (state.careerStatus !== "amateur") return showToast("Passe amateur avant de réserver un gala.");
  ensureCareerCalendar();
  const event = state.calendar.events.find(item => item.id === eventId && item.kind === "gala");
  if (!event) return showToast("Ce gala n’est plus disponible.");
  if (state.scheduledFight) return showToast("Un autre combat est déjà programmé.");
  const travel = BoxeurCalendar.travelOptionsForEvent(event)[0];
  const result = BoxeurCalendar.createBooking({ event, career: state, existingBookings: activeBookings(), travelOptionId: travel?.id, currentDate: careerWeekDate(0) });
  if (!result.ok) return showToast(result.reason || "Inscription impossible.");
  const opponent = opponentForGala(event, safeNumber(slotIndex, 0, 0, 2));
  state.money = result.moneyAfter;
  state.bookings.push(result.booking);
  state.scheduledFight = {
    id: opponent.id,
    opponent,
    tournamentId: null,
    tournamentRound: null,
    bookingId: result.booking.id,
    eventId: event.id,
    event,
    week: event.careerWeek,
    homeAdvantage: event.homeAdvantage || null,
    travelEffects: result.booking.travelEffects || { energy: 0, fatigue: 0 },
    travelApplied: false,
    fightSeed: freshFightSeed(`${event.id}-${opponent.id}`),
  };
  state.journal.unshift({ week: state.week, text: `${event.name} réservé contre ${opponent.name}, le ${event.startDate}.${result.quote.total ? ` Frais : ${result.quote.total} $.` : " Gala gratuit."}` });
  render();
  showToast(`Combat réservé · semaine ${event.careerWeek}`);
}

function bookTournamentEvent(eventId, travelOptionId, divisionId = null) {
  if (state.careerStatus !== "amateur") return showToast("Passe amateur avant de t’inscrire à un tournoi.");
  ensureCareerCalendar();
  const event = state.calendar.events.find(item => item.id === eventId && item.kind === "tournament");
  if (!event) return showToast("Ce tournoi n’est plus disponible.");
  const result = BoxeurCalendar.createBooking({ event, career: state, existingBookings: activeBookings(), travelOptionId, divisionId, currentDate: careerWeekDate(0) });
  if (!result.ok) return showToast(result.reason || "Inscription impossible.");
  state.money = result.moneyAfter;
  state.bookings.push(result.booking);
  if (Object.hasOwn(state.tournaments, event.tournamentId)) state.tournaments[event.tournamentId] = "entered";
  state.journal.unshift({ week: state.week, text: `Inscription aux ${result.booking.event.name} confirmée pour ${result.quote.total} $ (${event.venue.city}).` });
  render();
  showToast(`${result.booking.event.name} · inscription confirmée`);
}

function activateTournamentBooking(booking) {
  if (!booking || state.activeTournament || booking.event?.kind !== "tournament") return state.activeTournament;
  const event = booking.event;
  const checkIn = BoxeurCalendar.checkInTournament(booking, state, { fightCount: amateurFightCount(), checkedAt: event.startDate });
  if (!checkIn.ok) {
    booking.status = "withdrawn";
    if (Object.hasOwn(state.tournaments, event.tournamentId)) state.tournaments[event.tournamentId] = "missed";
    state.journal.unshift({ week: state.week, text: `${event.name} : inscription annulée au contrôle d’admissibilité. ${checkIn.reason}` });
    showToast(checkIn.reason);
    return null;
  }
  booking.status = "active";
  booking.eligibilitySnapshot = checkIn.eligibilitySnapshot;
  if (!booking.travelApplied) {
    applyChanges({ energy: booking.travelEffects?.energy || 0, fatigue: booking.travelEffects?.fatigue || 0 });
    booking.travelApplied = true;
  }
  const baseDefinition = tournamentDefs.find(item => item.id === event.tournamentId);
  const definition = { ...baseDefinition, baseDifficulty: Number.isFinite(Number(event.baseDifficulty)) ? Number(event.baseDifficulty) : baseDefinition.baseDifficulty };
  const category = weightClassDefinition(state.profile.weightClass, state.profile.sex);
  const competition = BoxeurTournament.createTournament({
    id: event.id,
    totalBouts: event.rounds,
    started: true,
    condition: { energy: state.energy, fatigue: state.fatigue, injury: CAREER_NEUTRAL_COMBAT_CONDITION.injury, fitness: CAREER_NEUTRAL_COMBAT_CONDITION.fitness, cardio: state.combatStats.cardio, headDamage: 0, bodyDamage: 0, lucidity: 100 },
    weight: { className: category.label, minKg: category.minKg, maxKg: category.maxKg },
  });
  state.activeTournament = {
    id: event.tournamentId,
    name: event.name,
    independent: Boolean(event.independent),
    division: event.selectedDivision?.label || null,
    baseDifficulty: definition.baseDifficulty,
    eventId: event.id,
    bookingId: booking.id,
    startWeek: event.careerWeek,
    status: "active",
    currentRound: 0,
    opponents: generateTournamentOpponents(definition),
    results: [],
    medal: null,
    medalCelebrated: false,
    summary: "",
    competition,
  };
  state.journal.unshift({ week: state.week, text: `${event.name} commence à ${event.venue.city}. Pesée avant chaque combat.` });
  return state.activeTournament;
}

function ensureDueTournamentActive() {
  if (state.activeTournament) return state.activeTournament;
  const booking = dueTournamentBooking();
  if (!booking) return null;
  return activateTournamentBooking(booking);
}

function scheduledFightBlocksTournament() {
  const scheduled = state.scheduledFight;
  return Boolean(scheduled && (scheduled.tournamentId || scheduled.week <= state.week));
}

function deferFutureGalaForTournament(active) {
  const scheduled = state.scheduledFight;
  if (!active || !scheduled || scheduled.tournamentId || scheduled.week <= state.week) return;
  active.deferredScheduledFight = cloneData(scheduled);
}

function restoreDeferredGalaAfterTournamentBout() {
  const active = state.activeTournament;
  if (!active?.deferredScheduledFight || state.scheduledFight) return;
  state.scheduledFight = cloneData(active.deferredScheduledFight);
  delete active.deferredScheduledFight;
}

function registerTournament(id) {
  const tournament = tournamentDefs.find(item => item.id === id);
  const availability = tournamentAvailability(id);
  if (!tournament || !availability.available || state.scheduledFight || state.activeTournament) return;
  state.tournaments[id] = "entered";
  state.activeTournament = {
    id,
    startWeek: state.week + TOURNAMENT_PREP_WEEKS,
    status: "preparing",
    currentRound: 0,
    opponents: generateTournamentOpponents(tournament),
    results: [],
    medal: null,
    medalCelebrated: false,
    summary: "",
  };
  state.journal.unshift({ week: state.week, text: `Inscription aux ${tournament.name}. Début prévu dans ${TOURNAMENT_PREP_WEEKS} semaines, à la semaine ${state.activeTournament.startWeek}.` });
  render();
  showToast(`${tournament.name} : ${TOURNAMENT_PREP_WEEKS} semaines de préparation`);
}

function completeAmateurCareerAfterSparring() {
  if (!isRecreationalCareer() || state.recreationalSparringStatus !== "completed") return false;
  const capsule = careerCapsule;
  if (capsule?.timeState?.stats) state.combatStats = cloneData(capsule.timeState.stats);
  const amateurEpoch = careerWeekDate(0);
  state.careerStatus = "amateur";
  state.week = 1;
  state.careerStartDate = amateurEpoch || state.careerStartDate;
  state.calendar = null;
  state.bookings = [];
  state.scheduledFight = null;
  state.pendingWeekEvent = null;
  state.avoidanceWeeks = 0;
  state.lastFightWeek = 0;
  state.amateurRecord = { wins: 0, losses: 0, draws: 0 };
  state.amateurPromotionPending = true;
  state.journal.unshift({ week: 1, text: `${state.profile.firstName} passe automatiquement amateur après le sparring d’évaluation. Le calendrier des galas et tournois est ouvert.` });
  invalidateCareerPreviewCapsule();
  ensureCareerCalendar();
  closeCalendarDialog();
  persistCareer();
  return true;
}

function openAmateurPromotionDialog() {
  const dialog = document.querySelector("#amateur-promotion-dialog");
  if (!dialog || dialog.open || state.careerStatus !== "amateur" || !state.amateurPromotionPending) return;
  const blockingDialog = Array.from(document.querySelectorAll("dialog[open]")).find(item => item !== dialog);
  if (blockingDialog) return;
  dialog.showModal();
}

function acknowledgeAmateurPromotion() {
  const dialog = document.querySelector("#amateur-promotion-dialog");
  state.amateurPromotionPending = false;
  dialog?.close();
  persistCareer();
  renderCareerWorldPreview(true);
  showToast("Statut amateur obtenu · le circuit compétitif est ouvert");
}

function renderTournamentBoard() {
  const active = state.activeTournament;
  if (!active) return;
  const tournament = tournamentDefs.find(item => item.id === active.id);
  const tournamentName = active.name || tournament.name;
  let competition = active.competition;
  const remaining = Math.max(0, active.startWeek - state.week);
  if (remaining === 0 && active.status === "preparing") active.status = "active";
  if (remaining === 0 && competition?.phase === BoxeurTournament.PHASES.PREPARING) {
    active.competition = BoxeurTournament.activateTournament(competition);
    competition = active.competition;
  }
  document.querySelector("#tournament-board-title").textContent = tournamentName;
  document.querySelector("#tournament-board-status").innerHTML = active.status === "completed" ? `<strong>${escapeHTML(active.summary)}</strong><span>${tournament.participants} participants · parcours terminé</span>` : remaining > 0 ? `<strong>Début dans ${remaining} semaine${remaining > 1 ? "s" : ""}</strong><span>Semaine ${active.startWeek} · profite de la préparation</span>` : `<strong>${roundName(tournament.rounds, active.currentRound)}</strong><span>${active.currentRound} victoire${active.currentRound > 1 ? "s" : ""} · ${tournament.rounds - active.currentRound} combat${tournament.rounds - active.currentRound > 1 ? "s" : ""} restant${tournament.rounds - active.currentRound > 1 ? "s" : ""}</span>`;
  const bracket = document.querySelector("#tournament-bracket");
  bracket.className = `tournament-bracket rounds-${tournament.rounds}`;
  bracket.innerHTML = active.opponents.map((opponent, index) => {
    const displayedDifficulty = opponentDifficulty(opponent, active.baseDifficulty ?? tournament.baseDifficulty);
    const result = active.results.find(item => item.round === index);
    const isCurrent = active.status !== "completed" && remaining === 0 && index === active.currentRound;
    const stateClass = result ? (result.result === "Victoire" ? "won" : "lost") : isCurrent ? "current" : "upcoming";
    const resultText = result ? `${result.result} · ${result.score}` : isCurrent ? "Prochain combat" : "À venir";
    return `<div class="bracket-round ${stateClass}"><span class="bracket-step">${roundName(tournament.rounds, index)}</span><strong>${escapeHTML(opponent.name)} « ${escapeHTML(opponent.nickname)} »</strong><small>${escapeHTML(opponent.style)} · ${escapeHTML(opponent.record)} · difficulté ${displayedDifficulty}</small><em>${escapeHTML(resultText)}</em></div>`;
  }).join("");

  const dailyStatus = document.querySelector("#tournament-daily-status");
  const interBout = document.querySelector("#tournament-interbout");
  const recoveryChoices = document.querySelector("#tournament-recovery-choices");
  const category = weightClassDefinition(state.profile.weightClass, state.profile.sex);
  if (competition && active.status !== "completed") {
    const phaseLabels = {
      daily_check: "Pesée à effectuer",
      ready: "Autorisé à boxer aujourd’hui",
      in_bout: "Combat en cours",
      inter_bout: "Journée terminée · récupération à choisir",
      completed: "Tournoi remporté",
      eliminated: "Éliminé du tournoi",
      withdrawn: "Retiré du tournoi",
    };
    dailyStatus.innerHTML = `<div><span>Jour du tournoi</span><strong>${competition.day} / ${competition.totalBouts}</strong></div><div><span>Poids actuel</span><strong>${Number(state.currentWeightKg).toFixed(1)} kg</strong><small>${category.minKg} à ${category.maxKg} kg</small></div><div><span>Énergie disponible</span><strong>${Math.round(competition.condition.energy)} %</strong><small>Fatigue ${Math.round(competition.condition.fatigue)} %</small></div><div><span>Étape</span><strong>${escapeHTML(phaseLabels[competition.phase] || competition.phase)}</strong><small>Un combat par jour</small></div>`;
    const showRecovery = competition.phase === BoxeurTournament.PHASES.INTER_BOUT;
    interBout.hidden = !showRecovery;
    if (showRecovery) {
      document.querySelector("#tournament-recovery-preview").textContent = "Un seul choix pour la nuit : récupérer davantage, protéger une zone touchée ou étudier le prochain adversaire. Un repas plus complet aide la récupération mais rapproche légèrement de la limite de poids.";
      recoveryChoices.innerHTML = BoxeurTournament.getInterBoutChoices(competition).map(choice => {
        const delta = tournamentRecoveryWeightDelta(choice.id);
        const nextWeight = Math.round((state.currentWeightKg + delta) * 10) / 10;
        const weightWarning = nextWeight > category.maxKg ? " · risque de disqualification" : "";
        return `<button type="button" data-tournament-recovery="${choice.id}"><strong>${escapeHTML(choice.title)}</strong><span>${escapeHTML(choice.summary)}</span><em>${escapeHTML(choice.tradeoff)} · poids estimé ${nextWeight.toFixed(1)} kg${weightWarning}</em></button>`;
      }).join("");
    } else {
      recoveryChoices.innerHTML = "";
    }
  } else {
    dailyStatus.innerHTML = active.status === "completed" ? `<div><span>Parcours</span><strong>${escapeHTML(active.summary)}</strong></div>` : "";
    interBout.hidden = true;
    recoveryChoices.innerHTML = "";
  }

  const button = document.querySelector("#tournament-next-fight");
  button.hidden = active.status === "completed";
  const blockedPhase = competition && [BoxeurTournament.PHASES.INTER_BOUT, BoxeurTournament.PHASES.IN_BOUT].includes(competition.phase);
  button.disabled = remaining > 0 || scheduledFightBlocksTournament() || blockedPhase;
  button.textContent = remaining > 0
    ? `Début dans ${remaining} semaine${remaining > 1 ? "s" : ""}`
    : competition?.phase === BoxeurTournament.PHASES.DAILY_CHECK
        ? `Passer la pesée du jour ${competition.day}`
        : competition?.phase === BoxeurTournament.PHASES.INTER_BOUT
          ? "Choisis la récupération de la nuit"
          : `Disputer ${roundName(tournament.rounds, active.currentRound).toLowerCase()}`;
  button.title = "";
}

function openTournamentBoard() {
  if (!state.activeTournament) return;
  if (state.activeTournament.status !== "completed"
    && state.week >= state.activeTournament.startWeek
    && !careerFightGateReady(careerCapsule)) {
    showToast("Confirme d’abord ta semaine; le tournoi s’ouvrira ensuite à l’aréna.");
    return;
  }
  if (maybeOpenTournamentMedalDialog()) return;
  renderTournamentBoard();
  const dialog = document.querySelector("#tournament-dialog");
  if (!dialog.open) dialog.showModal();
}

function closeTournamentBoard() {
  document.querySelector("#tournament-dialog").close();
  if (state.activeTournament?.status === "completed") {
    if (careerFightGateReady(careerCapsule)) {
      const completedTournament = state.activeTournament;
      state.activeTournament = null;
      if (!finalizeCareerFightGate()) {
        state.activeTournament = completedTournament;
        render();
        return;
      }
      render();
      showToast("Tournoi terminé · nouvelle semaine");
      if (state.jobLossNotice || state.levelAnnouncementPending) setTimeout(showCareerAlertOrContinue, 0);
      return;
    }
    const events = [state.activeTournament.summary];
    settleJobAttendance(false, events, state.week, true);
    state.activeTournament = null;
    endWeek(events);
    render();
    showToast("Tournoi terminé · retour au calendrier");
    if (state.jobLossNotice || state.levelAnnouncementPending) setTimeout(showCareerAlertOrContinue, 0);
  }
}

function tournamentRecoveryWeightDelta(choiceId) {
  return choiceId === BoxeurTournament.CHOICE_IDS.REST ? .45 : choiceId === BoxeurTournament.CHOICE_IDS.PROTECT ? .2 : 0;
}

function syncTournamentConditionToCareer() {
  const condition = state.activeTournament?.competition?.condition;
  if (!condition) return;
  state.energy = clamp(Math.round(condition.energy));
  state.fatigue = clamp(Math.round(condition.fatigue));
}

function applyTournamentRecovery(choiceId) {
  const active = state.activeTournament;
  const competition = active?.competition;
  if (!competition || competition.phase !== BoxeurTournament.PHASES.INTER_BOUT) return;
  try {
    const choice = BoxeurTournament.getInterBoutChoices(competition).find(item => item.id === choiceId);
    if (!choice) return;
    const recoveryId = competition.interBout?.id;
    active.competition = BoxeurTournament.applyInterBoutChoice(competition, choiceId, { recoveryId, targetZone: choice.targetZone });
    state.currentWeightKg = Math.round((state.currentWeightKg + tournamentRecoveryWeightDelta(choiceId)) * 10) / 10;
    syncTournamentConditionToCareer();
    if (syncCareerFightGateProgressToCapsule()) persistCareerPreviewCapsule();
    state.journal.unshift({ week: state.week, text: `${tournamentDefs.find(item => item.id === active.id)?.name} · nuit ${active.competition.day - 1} : ${choice.title}. Poids prévu ${state.currentWeightKg.toFixed(1)} kg.` });
    renderTournamentBoard();
    persistCareer();
    showToast("Choix appliqué · nouvelle journée de tournoi");
  } catch (error) {
    console.error("[Boxeur Deux] Récupération de tournoi impossible :", error);
    showToast("Ce choix de récupération n’est plus disponible.");
  }
}

function startTournamentRound() {
  const active = state.activeTournament;
  if (!active || active.status === "completed" || state.week < active.startWeek || scheduledFightBlocksTournament()) return;
  if (state.week >= active.startWeek && !careerFightGateReady(careerCapsule)) {
    return showToast("Confirme d’abord ta semaine avant de commencer le tournoi.");
  }
  active.status = "active";
  const opponent = active.opponents[active.currentRound];
  if (!opponent) {
    console.error("[Boxeur Deux] Tournoi incohérent : adversaire du prochain tour introuvable.", { tournament: active.id, round: active.currentRound });
    return showToast("Impossible d’ouvrir ce combat. Recharge la carrière pour réparer le tableau.");
  }
  const category = weightClassDefinition(state.profile.weightClass, state.profile.sex);
  try {
    if (active.competition?.phase === BoxeurTournament.PHASES.DAILY_CHECK) {
      active.competition = BoxeurTournament.performDailyChecks(active.competition, {
        weightKg: state.currentWeightKg,
        minKg: category.minKg,
        maxKg: category.maxKg,
        toleranceKg: 0,
        restrictionDays: 0,
        acuteInjury: false,
      });
      if (active.competition.phase === BoxeurTournament.PHASES.WITHDRAWN) {
        const reason = active.competition.termination?.reason === "weigh_in" ? `disqualification à la pesée (${state.currentWeightKg.toFixed(1)} kg pour une limite de ${category.maxKg} kg)` : "retrait après le contrôle d’aptitude";
        completeTournament(null, reason);
        renderTournamentBoard();
        persistCareer();
        return showToast(reason);
      }
      renderTournamentBoard();
      persistCareer();
      return showToast(`Pesée réussie · ${state.currentWeightKg.toFixed(1)} kg`);
    }
    if (active.competition?.phase !== BoxeurTournament.PHASES.READY) return showToast("Termine d’abord la décision inter-combats.");
    active.competition = BoxeurTournament.beginBout(active.competition);
  } catch (error) {
    console.error("[Boxeur Deux] Contrôle quotidien impossible :", error);
    return showToast(error.message || "Le tournoi ne peut pas poursuivre aujourd’hui.");
  }
  const booking = state.bookings.find(item => item.id === active.bookingId);
  deferFutureGalaForTournament(active);
  state.scheduledFight = {
    id: opponent.id,
    opponent,
    tournamentId: active.id,
    tournamentRound: active.currentRound,
    bookingId: active.bookingId || null,
    eventId: active.eventId || null,
    event: booking?.event || null,
    week: state.week,
    travelApplied: true,
    travelEffects: { energy: 0, fatigue: 0 },
    fightSeed: freshFightSeed(`${active.eventId || active.id}-${active.currentRound}`),
  };
  document.querySelector("#tournament-dialog").close();
  startFight();
}

function fightDistanceLabel(distance) {
  return { outside: "Extérieur", mid: "Mi-distance", inside: "Corps à corps" }[distance] || "Variable";
}

function fightPositionLabel(ring) {
  if (ring.position === "center") return "Centre du ring";
  const subject = ring.pressured === "player" ? "Tu es" : ring.pressured === "opponent" ? "Adversaire" : "Combat";
  const place = ring.position === "near_ropes" ? "près des câbles" : ring.position === "ropes" ? "dans les câbles" : "dans un coin";
  return `${subject} ${place}`;
}

function fightDamageLabel(value, zone) {
  if (value < 15) return zone === "head" ? "Intacte" : "Intact";
  if (value < 35) return "Touché";
  if (value < 55) return "Marqué";
  if (value < 75) return "Ébranlé";
  return "Critique";
}

function fightComposureLabel(value) {
  if (value >= 82) return "Calme";
  if (value >= 62) return "Vigilant";
  if (value >= 42) return "Troublé";
  return "Désorienté";
}

function momentumLabel(fight) {
  const value = fight?.ring?.momentum || 0;
  if (value >= 1.5) return "Ton coin impose le rythme";
  if (value >= .5) return "Légère initiative";
  if (value <= -1.5) return "Forte pression adverse";
  if (value <= -.5) return "Initiative adverse";
  return "Équilibrée";
}

function isRemyRingPrototype() {
  return Boolean(fightState?.careerMeta?.isRecreationalSparring && sparringRingState && window.BoxeurSparringRing);
}

function isTechnicalSparringPrototype() {
  return Boolean(fightState?.careerMeta?.isPracticeSparring && sparringRingState && window.BoxeurSparringRing);
}

function isLocalOfficialFight() {
  return Boolean(fightState?.careerMeta?.isLocalOfficialFight && sparringRingState && window.BoxeurSparringRing);
}

function isTournamentOfficialFight() {
  return Boolean(fightState?.careerMeta?.isTournamentOfficialFight && sparringRingState && window.BoxeurSparringRing);
}

function isOfficialFight() {
  return isLocalOfficialFight() || isTournamentOfficialFight();
}

function isImmersiveRingFight() {
  return isRemyRingPrototype() || isTechnicalSparringPrototype() || isOfficialFight();
}

function immersiveOpponentFirstName() {
  if (isRemyRingPrototype()) return sparringPartnerView().firstName;
  const fullName = fightState?.careerMeta?.opponent?.name || fightState?.fighters?.opponent?.name || "l’adversaire";
  return String(fullName).trim().split(/\s+/)[0] || "l’adversaire";
}

function syncImmersiveRingContext() {
  if (!isImmersiveRingFight()) return;
  fightState.ring = window.BoxeurSparringRing.formulas.ringContextFor(sparringRingState, fightState.ring);
}

function sparringPlayerVisualSet() {
  const sex = state.profile.sex === "female" ? "female" : "male";
  const portraitId = clamp(Math.round(Number(state.profile.portraitId) || 0), 0, 2);
  if (sex === "female") {
    const identity = `female-${portraitId + 1}`;
    return {
      front: `assets/sparring-player-${identity}-front.png`,
      back: `assets/sparring-player-${identity}-back.png`,
      before: `assets/sparring-nadia-${identity}-before-v1.png`,
      corner: `assets/sparring-nadia-${identity}-corner-v1.png`,
      after: `assets/sparring-nadia-${identity}-after-v1.png`,
    };
  }
  if (sex === "male" && portraitId === 0) {
    return {
      front: "assets/sparring-boxer-blue-front-v2.png",
      back: "assets/sparring-boxer-blue-back-v2.png",
      before: "assets/sparring-remy-before-v3.png",
      corner: "assets/sparring-remy-corner-v3.png",
      after: "assets/sparring-remy-after-v3.png",
    };
  }
  const identity = `${sex}-${portraitId + 1}`;
  return {
    front: `assets/sparring-player-${identity}-front.png`,
    back: `assets/sparring-player-${identity}-back.png`,
    before: `assets/sparring-player-${identity}-before.png`,
    corner: `assets/sparring-player-${identity}-corner.png`,
    after: `assets/sparring-player-${identity}-after.png`,
  };
}

function configureSparringPlayerImages() {
  const stage = document.querySelector("#fight-ring-stage");
  if (!stage) return;
  const visuals = sparringPlayerVisualSet();
  const partner = sparringPartnerView();
  const femalePath = state.profile.sex === "female";
  const subject = state.profile.sex === "female" ? "la boxeuse" : "le boxeur";
  [
    [".sparring-before-backdrop", "before", `${femalePath ? "Rémy prépare" : "Le coach prépare"} ${subject} avant le sparring pendant que ${partner.firstName} s’échauffe`],
    [".sparring-corner-backdrop", "corner", `${subject === "la boxeuse" ? "La boxeuse écoute" : "Le boxeur écoute"} les directives ${femalePath ? "de Rémy" : "du coach"} dans son coin`],
    [".sparring-after-backdrop", "after", `${subject === "la boxeuse" ? "La boxeuse" : "Le boxeur"} et ${partner.firstName} touchent leurs gants après le sparring${femalePath ? " sous le regard de Rémy" : ""}`],
  ].forEach(([selector, key, alt]) => {
    const image = stage.querySelector(selector);
    if (!image) return;
    if (image.getAttribute("src") !== visuals[key]) image.src = visuals[key];
    image.alt = alt;
  });
}

function sparringFighterAsset(role, visual) {
  const pose = visual?.pose === "back" ? "back" : "front";
  if (role === "player") return sparringPlayerVisualSet()[pose];
  if (state.profile.sex === "female") return `assets/sparring-nadia-${pose}-v1.png`;
  return `assets/sparring-boxer-red-${pose}-v2.png`;
}

function localFightPlayerVisualSet() {
  const sex = state.profile.sex === "female" ? "female" : "male";
  const portraitId = clamp(Math.round(Number(state.profile.portraitId) || 0), 0, 2) + 1;
  const root = `assets/local-fight-player-${sex}-${portraitId}`;
  return {
    front: `${root}-front-v1.png`,
    back: `${root}-back-v1.png`,
  };
}

function localFightFighterAsset(role, visual, scene = "ring") {
  const ringPose = visual?.pose === "back" ? "back" : "front";
  const pose = scene === "corner" && role === "player"
    ? "back"
    : scene === "before" || scene === "after"
      ? "front"
      : ringPose;
  if (role === "player") return localFightPlayerVisualSet()[pose];
  const sex = state.profile.sex === "female" ? "female" : "male";
  return `assets/local-fight-opponent-${sex}-${pose}-v1.png`;
}

function renderSparringRing(view) {
  const dialog = document.querySelector("#fight-dialog");
  const stage = document.querySelector("#fight-ring-stage");
  const coachCallout = document.querySelector("#sparring-coach-callout");
  const prototypeActive = isImmersiveRingFight();
  const localFightActive = isLocalOfficialFight();
  const tournamentFightActive = isTournamentOfficialFight();
  const olympicFightActive = tournamentFightActive && fightState?.careerMeta?.tournamentId === "olympic";
  const officialFightActive = localFightActive || tournamentFightActive;
  dialog?.classList.toggle("sparring-ring-prototype", prototypeActive);
  dialog?.classList.toggle("local-fight-prototype", localFightActive);
  dialog?.classList.toggle("tournament-fight-prototype", tournamentFightActive);
  dialog?.classList.toggle("olympic-fight-prototype", olympicFightActive);
  if (!stage || !coachCallout) return;
  if (!prototypeActive) {
    delete stage.dataset.sparringScene;
    delete stage.dataset.sparringStep;
    delete stage.dataset.sparringMovement;
    coachCallout.hidden = true;
    coachCallout.classList.remove("coach-warning");
    const logDisclosure = document.querySelector(".fight-log-disclosure");
    if (logDisclosure?.dataset.prototypePrepared) {
      delete logDisclosure.dataset.prototypePrepared;
      logDisclosure.open = true;
    }
    return;
  }
  if (isRemyRingPrototype() || isTechnicalSparringPrototype()) configureSparringPlayerImages();

  const scene = view.status.finished
    ? "after"
    : view.phase === "corner"
      ? view.round === 1 ? "before" : "corner"
      : "ring";
  stage.dataset.sparringScene = scene;
  delete stage.dataset.distance;
  delete stage.dataset.position;
  const visualRingState = view.status.finished ? cloneData(sparringRingState) : sparringRingState;
  if (view.status.finished) {
    visualRingState.fighters.player = { x: 1.75, y: 3 };
    visualRingState.fighters.opponent = { x: 2.25, y: 2 };
  }
  const ringView = window.BoxeurSparringRing.getView(visualRingState, view.fighters.player.energy);
  ["player", "opponent"].forEach(role => {
    const visual = ringView.fighters[role];
    const fighter = stage.querySelector(`.ring-fighter-${role}`);
    const image = fighter?.querySelector(".sparring-fighter-image");
    if (!fighter || !image) return;
    fighter.style.setProperty("--ring-x", `${visual.xPercent}%`);
    fighter.style.setProperty("--ring-y", `${visual.yPercent}%`);
    fighter.style.setProperty("--ring-scale", String(visual.scale));
    fighter.style.setProperty("--ring-layer", String(visual.layer));
    fighter.style.setProperty("--fighter-flip", visual.mirrored ? "-1" : "1");
    fighter.dataset.facing = visual.direction;
    image.src = officialFightActive
      ? localFightFighterAsset(role, visual, scene)
      : sparringFighterAsset(role, visual);
  });

  stage.dataset.sparringStep = sparringAutoResolving ? "resolving" : "decision";
  if (sparringAutoResolving && ringView.pendingMovement) stage.dataset.sparringMovement = ringView.pendingMovement.role;
  else delete stage.dataset.sparringMovement;
  // La grille 5 × 5 reste le moteur du placement; les décisions tactiques
  // déplacent automatiquement le boxeur sans contrôle de déplacement séparé.

  const playerEnergy = clamp(Math.round(view.fighters.player.energy), 0, 100);
  const opponentEnergy = clamp(Math.round(view.fighters.opponent.energy), 0, 100);
  const playerEnergyTrack = stage.querySelector(".sparring-player-energy");
  const opponentEnergyTrack = stage.querySelector(".sparring-opponent-energy");
  const playerEnergyBar = document.querySelector("#sparring-player-energy-bar");
  const opponentEnergyBar = document.querySelector("#sparring-opponent-energy-bar");
  const playerEnergyValue = document.querySelector("#sparring-player-energy-value");
  const opponentEnergyValue = document.querySelector("#sparring-opponent-energy-value");
  const opponentEnergyLabel = document.querySelector("#sparring-opponent-energy-label");
  const roundHud = document.querySelector("#sparring-round-hud");
  const exchangeHud = document.querySelector("#sparring-exchange-hud");
  if (playerEnergyBar) playerEnergyBar.style.width = `${playerEnergy}%`;
  if (opponentEnergyBar) opponentEnergyBar.style.width = `${opponentEnergy}%`;
  if (playerEnergyValue) playerEnergyValue.textContent = `${playerEnergy} %`;
  if (opponentEnergyValue) opponentEnergyValue.textContent = `${opponentEnergy} %`;
  if (opponentEnergyLabel) opponentEnergyLabel.textContent = immersiveOpponentFirstName();
  playerEnergyTrack?.setAttribute("aria-valuenow", String(playerEnergy));
  opponentEnergyTrack?.setAttribute("aria-valuenow", String(opponentEnergy));
  opponentEnergyTrack?.setAttribute("aria-label", `Énergie de ${immersiveOpponentFirstName()}`);
  if (roundHud) roundHud.textContent = `ROUND ${Math.min(view.format.rounds || 3, view.round)} / ${view.format.rounds || 3}`;
  if (exchangeHud) {
    exchangeHud.textContent = view.status.finished
      ? "Terminé"
      : view.phase === "corner"
        ? view.round === 1 ? "Briefing" : "Entre les rounds"
        : `Échange ${view.currentExchange?.number || view.exchange || 1} / ${view.format.exchangesPerRound}`;
  }

  if (view.status.finished) {
    coachCallout.hidden = true;
    coachCallout.classList.remove("coach-warning");
    coachCallout.innerHTML = "";
    return;
  }
  if (view.phase !== "exchange") {
    coachCallout.hidden = true;
    coachCallout.classList.remove("coach-warning");
    return;
  }
  const warning = Boolean(view.roundState?.coachRevealedWrong);
  const movement = ringView.pendingMovement;
  const directive = view.coach.activeDirective?.label || "Observe avant de t’engager";
  const detail = warning
    ? `Ma première lecture ne tient plus. Regarde ${immersiveOpponentFirstName()} et adapte ta réponse.`
    : sparringAutoResolving && movement
      ? `${movement.label}. Ton choix ajuste automatiquement ta place dans le ring.`
      : view.currentExchange?.situation || "Lis la distance avant de t’engager.";
  coachCallout.hidden = false;
  coachCallout.classList.toggle("coach-warning", warning);
  coachCallout.innerHTML = `<span>Ton coach</span><strong>${escapeHTML(warning ? "Change de plan — adapte-toi" : directive)}</strong><small>${escapeHTML(detail)}</small>`;
}

function renderFightRoundDynamic(view) {
  const container = document.querySelector("#fight-round-dynamic");
  if (!container) return;
  if (isImmersiveRingFight()) {
    const perception = window.BoxeurSparringRing.getView(sparringRingState, view.fighters.player.energy).perception;
    const low = clamp((perception.low + 100) / 2, 0, 100);
    const high = clamp((perception.high + 100) / 2, 0, 100);
    const value = clamp((perception.value + 100) / 2, 0, 100);
    const clarity = perception.uncertainty <= 15 ? "Lecture assez nette" : perception.uncertainty <= 25 ? "Lecture prudente" : "Lecture très incertaine";
    const hud = document.querySelector("#sparring-perception-hud");
    if (hud) {
      hud.style.setProperty("--perception-low", `${low}%`);
      hud.style.setProperty("--perception-width", `${Math.max(2, high - low)}%`);
      hud.style.setProperty("--perception-value", `${value}%`);
      hud.setAttribute("aria-label", `${perception.label}. ${clarity}.`);
    }
    const mobileReading = document.querySelector("#fight-mobile-reading");
    if (mobileReading) mobileReading.textContent = `${perception.label} · ${clarity}`;
    container.innerHTML = `<span class="visually-hidden">${escapeHTML(perception.label)}. ${clarity}. Cette perception n’est jamais une carte de juge.</span>`;
    return;
  }
  const momentum = clamp(Number(view.ring?.momentum || 0), -2, 2);
  const direction = momentum > 0 ? "player" : momentum < 0 ? "opponent" : "even";
  const label = momentum >= 1.5 ? "Ton coin garde l'initiative récente" : momentum >= .5 ? "Tu reprends légèrement l'initiative" : momentum <= -1.5 ? "L'adversaire impose la séquence récente" : momentum <= -.5 ? "L'adversaire prend légèrement l'initiative" : "Les derniers échanges sont partagés";
  const activeCount = Math.abs(Math.round(momentum));
  const pips = Array.from({ length: 5 }, (_, index) => {
    const distanceFromCenter = direction === "player" ? index - 2 : 2 - index;
    const active = direction !== "even" && distanceFromCenter > 0 && distanceFromCenter <= activeCount;
    return `<span class="${active ? `active ${direction}` : ""}" aria-hidden="true"></span>`;
  }).join("");
  container.innerHTML = `<div><span>Dynamique du round</span><strong>${escapeHTML(label)}</strong></div><div class="fight-dynamic-pips" aria-label="${escapeHTML(label)}">${pips}</div><small>Indicateur de rythme : ce n’est pas une carte de juge.</small>`;
}

function recordSparringExchange(beforeView, transition, movementPurpose = "hold", movement = null) {
  const meta = fightState?.careerMeta;
  if (!meta?.isRecreationalSparring) return;
  const action = BoxeurCombat.ACTIONS[transition.result.actionId];
  const exchange = beforeView.currentExchange || {};
  meta.sparringObservations = (meta.sparringObservations || []).concat({
    actionId: transition.result.actionId,
    actionLabel: action?.label || transition.result.actionId,
    intention: exchange.intention || "la séquence adverse",
    situation: exchange.situation || "la situation du ring",
    position: beforeView.ring?.position || "center",
    energy: Number(beforeView.fighters?.player?.energy || 0),
    movementPurpose,
    movement: movement?.role || "hold",
    movementCost: Number(movement?.energyCost || 0),
    side: transition.result.side,
    playerImpact: Number(transition.result.playerImpact || 0),
    opponentImpact: Number(transition.result.opponentImpact || 0),
  }).slice(-12);
}

function buildRemySparringDebrief(fight) {
  const partner = sparringPartnerView();
  const notes = fight.careerMeta?.sparringObservations || [];
  const positive = notes.filter(note => note.side === "player" && note.playerImpact > note.opponentImpact);
  const underPressure = notes.filter(note => ["ropes", "corner"].includes(note.position));
  const exits = underPressure.filter(note => ["pivot_exit", "clinch", "compact_cover", "retake_center"].includes(note.actionId));
  const aggressiveMisses = notes.filter(note => /Entrée agressive|Combinaison rapide|Accélération/.test(note.intention) && note.side === "opponent");
  const tiredRisks = notes.filter(note => note.energy < 38 && ["power_hook", "finish_pressure", "fast_combination", "body_attack"].includes(note.actionId));
  const strengths = [];
  const adjustments = [];
  if (exits.length) strengths.push(`Sous pression, tu as choisi ${exits.length} sortie${exits.length > 1 ? "s" : ""} ou rupture${exits.length > 1 ? "s" : ""} de rythme : c’est une base solide près des câbles.`);
  if (positive.length) strengths.push(`Tu as pris ${positive.length} échange${positive.length > 1 ? "s" : ""} à ${partner.firstName} grâce à une réponse mieux adaptée.`);
  if (!strengths.length) strengths.push(`Cette séance ne dégage pas encore de point fort net : garde la lecture de ${partner.firstName} au centre de tes prochains choix.`);
  if (underPressure.length > exits.length) adjustments.push(`${partner.firstName} t’a ${state.profile.sex === "female" ? "placée" : "placé"} ${underPressure.length} fois près des câbles ou du coin sans sortie adaptée à chaque fois : cherche d’abord le pivot, la couverture ou le clinch.`);
  if (aggressiveMisses.length) adjustments.push(`Tu as subi ${aggressiveMisses.length} réponse${aggressiveMisses.length > 1 ? "s" : ""} en répondant à une entrée forte : garde, pivot ou contre préparé seront plus sûrs.`);
  if (tiredRisks.length) adjustments.push(`Tu as tenté ${tiredRisks.length} attaque${tiredRisks.length > 1 ? "s" : ""} lourde${tiredRisks.length > 1 ? "s" : ""} sous 38 d’énergie : privilégie le jab, le retrait ou le clinch dans cet état.`);
  if (!adjustments.length) adjustments.push("Aucun problème ne s’est répété assez souvent pour être isolé : continue de lier la lecture adverse, la distance et ta réserve d’énergie.");
  return {
    strengths: strengths.slice(0, 2),
    adjustments: adjustments.slice(0, 2),
    lesson: adjustments[0],
  };
}

function opponentPortraitAsset() {
  const opponentCorner = state.profile.corner === "blue" ? "rouge" : "bleu";
  if (state.profile.sex === "female") return `assets/boxeuse-coin-${opponentCorner}.webp`;
  return opponentCorner === "rouge" ? "assets/adversaire-coin-rouge.webp" : "assets/boxeur-coin-bleu.webp";
}

function configureRingImages() {
  const playerVisual = document.querySelector(".ring-fighter-player .ring-fighter-silhouette");
  const opponentVisual = document.querySelector(".ring-fighter-opponent .ring-fighter-silhouette");
  const playerCornerAsset = state.profile.sex === "female"
    ? `assets/boxeuse-coin-${state.profile.corner === "blue" ? "bleu" : "rouge"}.webp`
    : state.profile.corner === "blue" ? "assets/boxeur-coin-bleu.webp" : "assets/adversaire-coin-rouge.webp";
  if (playerVisual) {
    playerVisual.style.setProperty("--fighter-image", `url(\"${playerCornerAsset}\")`);
    playerVisual.style.setProperty("--fighter-size", "cover");
    playerVisual.style.setProperty("--fighter-position", "center 18%");
  }
  if (opponentVisual) {
    opponentVisual.style.setProperty("--fighter-image", `url(\"${opponentPortraitAsset()}\")`);
    opponentVisual.style.setProperty("--fighter-size", "cover");
    opponentVisual.style.setProperty("--fighter-position", "center 18%");
  }
}

function triggerFightVisual(result) {
  const stage = document.querySelector("#fight-ring-stage");
  if (!stage || !result) return;
  let cue = result.visualCue || "neutral";
  if (result.knockdown) cue = `${result.knockdown.knockedDown}-knockdown`;
  else if (cue === "knockout" || cue === "referee-stoppage") cue = `${fightState?.result?.loser || (result.side === "player" ? "opponent" : "player")}-knockdown`;
  cue = cue.replace("-hard", "");
  stage.dataset.cue = cue;
  const impact = /hit|trade|knockdown/.test(cue);
  stage.classList.remove("show-impact");
  if (impact) {
    void stage.offsetWidth;
    stage.classList.add("show-impact");
  }
  const important = result.significant || result.knockdown || result.fightResult;
  if (important) document.querySelector("#fight-announcer").textContent = result.events?.map(event => event.text).join(" ") || result.text || result.fightResult?.label;
}

function remyTacticPresentation(action) {
  const partnerName = immersiveOpponentFirstName();
  const directPresentation = {
    cautious_jab: { label: "Lire avec le jab", detail: "Teste la distance sans te vider.", purpose: "hold" },
    double_jab_move: { label: "Jab et angle", detail: `Marque ${partnerName} puis décale-toi de sa ligne.`, purpose: "exit" },
    fast_combination: { label: "Enchaîner proprement", detail: "Travaille vite avant de ressortir.", purpose: "attack" },
    body_attack: { label: "Travailler au corps", detail: "Use sa réserve, mais garde la tête protégée.", purpose: "attack" },
    power_hook: { label: "Tenter le crochet", detail: "Cherche un gros coup en acceptant le risque.", purpose: "attack" },
    feint_attack: { label: "Provoquer l’ouverture", detail: "Force une réaction avant de répondre.", purpose: "hold" },
    controlled_pressure: { label: "Mettre la pression", detail: `Avance pour obliger ${partnerName} à répondre.`, purpose: "attack" },
    counter_attack: { label: "Piéger et contrer", detail: `Laisse ${partnerName} se découvrir, puis réponds.`, purpose: "hold" },
    cut_ring: { label: "Couper le ring", detail: "Ferme ses sorties sans te jeter.", purpose: "attack" },
    high_guard: { label: "Fermer la garde", detail: "Couvre ta tête et casse son élan.", purpose: "defense" },
    parry_counter: { label: "Parer puis répondre", detail: "Dévie son premier coup pour reprendre la main.", purpose: "hold" },
    lateral_evade: { label: "Changer d’angle", detail: "Quitte sa ligne et crée une nouvelle cible.", purpose: "exit" },
    roll_under: { label: "Passer sous le coup", detail: "Évite bas puis ressors sur le côté.", purpose: "exit" },
    retreat_step: { label: "Faire un pas arrière", detail: "Fais-le manquer pour reprendre de l’air.", purpose: "defense" },
    pivot_exit: { label: "Sortir par le pivot", detail: "Tourne hors des câbles au lieu de reculer droit.", purpose: "exit" },
    clinch: { label: "Casser l’échange", detail: "Accroche-le brièvement pour reprendre ton souffle.", purpose: "hold" },
    compact_cover: { label: "Rester compact", detail: "Absorbe la séquence avant de repartir.", purpose: "defense" },
    retake_center: { label: "Reprendre le centre", detail: "Récupère de l’espace avant de frapper.", purpose: "exit" },
    protect_body: { label: "Fermer les coudes", detail: "Protège le corps et refuse son travail au ventre.", purpose: "defense" },
    finish_pressure: { label: "Accélérer", detail: "Profite de son doute sans te découvrir.", purpose: "attack" },
  };
  if (directPresentation[action.id]) return directPresentation[action.id];
  const definition = BoxeurCombat.ACTIONS[action.id] || {};
  const tags = new Set(definition.tags || []);
  if (tags.has("jab")) return { label: "Lire avec le jab", detail: "Teste la distance sans te vider.", purpose: "hold" };
  if (tags.has("feint")) return { label: "Provoquer l’ouverture", detail: "Force une réaction avant de répondre.", purpose: "hold" };
  if (tags.has("counter") || tags.has("parry")) return { label: "Piéger et contrer", detail: `Laisse ${partnerName} se découvrir, puis réponds.`, purpose: "hold" };
  if (tags.has("guard") || tags.has("clinch") || tags.has("recover") || tags.has("retreat")) return { label: "Fermer la garde", detail: "Casse son rythme et protège-toi.", purpose: "defense" };
  if (tags.has("exit") || tags.has("pivot") || tags.has("center") || tags.has("ringcraft") || tags.has("angle")) return { label: "Reprendre l’espace", detail: "Sors de sa ligne et retrouve du ring.", purpose: "exit" };
  if (tags.has("pressure") || action.family === "attack") return { label: "Mettre la pression", detail: `Avance pour obliger ${partnerName} à répondre.`, purpose: "attack" };
  return { label: action.label, detail: action.description, purpose: "hold" };
}

function renderFightChoices() {
  const container = document.querySelector("#fight-choices");
  const heading = document.querySelector("#fight-decision-heading");
  const decisionArea = container.closest(".fight-decision-area");
  if (!fightState || fightState.phase !== "exchange") {
    container.innerHTML = "";
    if (heading) heading.hidden = true;
    if (decisionArea) decisionArea.hidden = true;
    return;
  }
  if (heading) heading.hidden = false;
  if (decisionArea) decisionArea.hidden = false;
  const riskLabels = { low: "Risque faible", medium: "Risque mesuré", high: "Risque élevé" };
  const actions = BoxeurCombat.getAvailableActions(fightState);
  if (isImmersiveRingFight()) {
    if (sparringAutoResolving) {
      const movement = sparringRingState?.pendingMovement;
      const pendingAction = BoxeurCombat.ACTIONS[sparringPendingActionId] || null;
      const tactic = pendingAction ? remyTacticPresentation(pendingAction) : null;
      container.innerHTML = `<p class="sparring-resolution-prompt"><strong>${escapeHTML(tactic?.label || "Action engagée")}</strong><span>${escapeHTML(movement ? `${movement.label} · le ring réagit à ton intention.` : "Le ring réagit à ton intention.")}</span></p>`;
      return;
    }
    container.innerHTML = actions.slice(0, 5).map(action => {
      const tactic = remyTacticPresentation(action);
      const coachHint = action.directiveAligned ? " · conseil du coach" : "";
      return `<button type="button" data-fight-action="${action.id}" data-sparring-purpose="${tactic.purpose}" class="${action.directiveAligned ? "coach-match" : ""}" aria-label="${escapeHTML(`${tactic.label} : ${action.label}. ${tactic.detail}`)}"><strong>${escapeHTML(tactic.label)}</strong><span>${escapeHTML(tactic.detail)}</span><em>${escapeHTML(action.label)} · −${action.baseEnergyCost.toFixed(1)} E${coachHint}</em></button>`;
    }).join("");
    return;
  }
  container.innerHTML = actions.map(action => `<button type="button" data-fight-action="${action.id}" class="${action.directiveAligned ? "coach-match" : ""}"><strong>${escapeHTML(action.label)}</strong><span>${escapeHTML(action.description)} · coût env. ${action.baseEnergyCost.toFixed(1)} E</span><em>${action.directiveAligned ? "Suit la directive du coach" : riskLabels[action.risk] || "Issue incertaine"}</em></button>`).join("");
}

function renderFightCoach() {
  const panel = document.querySelector("#fight-coach-panel");
  const choices = document.querySelector("#fight-coach-choices");
  const immersiveFight = isImmersiveRingFight();
  const officialFight = isOfficialFight();
  const showCoachPanel = Boolean(fightState && (fightState.phase === "corner" || (immersiveFight && fightState.phase === "exchange")));
  if (!showCoachPanel) {
    panel.hidden = true;
    choices.innerHTML = "";
    delete panel.dataset.sparringPhase;
    return;
  }
  panel.hidden = false;
  if (immersiveFight && fightState.phase === "exchange") {
    panel.dataset.sparringPhase = "round";
    const directive = fightState.coach.activeDirective?.label || "Observe avant de t’engager";
    const situation = fightState.currentExchange?.situation || `Lis la distance et les appuis de ${immersiveOpponentFirstName()} avant de t’ouvrir.`;
    document.querySelector("#fight-coach-title").textContent = "Le coach te guide";
    document.querySelector("#fight-coach-analysis").textContent = `${directive}. ${situation}`;
    choices.innerHTML = "";
    return;
  }
  delete panel.dataset.sparringPhase;
  const pending = fightState.coach.pending;
  const remyLesson = fightState.careerMeta?.remyLesson;
  document.querySelector("#fight-coach-title").textContent = immersiveFight
    ? fightState.round === 1
      ? officialFight ? "Le coach prépare ton combat" : "Le coach prépare ton sparring"
      : `Ton vrai coin · avant le round ${fightState.round}`
    : fightState.round === 1 ? "Directive avant le combat" : `Pause du coach avant le round ${fightState.round}`;
  document.querySelector("#fight-coach-analysis").textContent = `${pending.observation} Le coach propose : ${pending.prediction}.${remyLesson && fightState.round === 1 ? ` Rappel : ${remyLesson}` : ""}`;
  choices.innerHTML = BoxeurCombat.getCoachOptions(fightState).map(option => {
    let label = option.label;
    if (immersiveFight) {
      label = option.kind === "recovery"
        ? "Souffler"
        : option.kind === "patient"
          ? "Observer"
          : option.recommended
            ? "Écouter"
            : "Adapter";
    }
    return `<button type="button" data-coach-option="${option.id}" aria-label="${escapeHTML(`${label} : ${option.description} Compromis : ${option.tradeoff}`)}"><strong>${escapeHTML(label)}${option.recommended ? " · conseillé" : ""}</strong><span>${escapeHTML(option.description)} Compromis : ${escapeHTML(option.tradeoff)}</span></button>`;
  }).join("");
}

function renderFight(message = "Observe la situation puis choisis une réponse.") {
  if (!fightState) return;
  const view = BoxeurCombat.getPublicState(fightState);
  const meta = fightState.careerMeta || {};
  const isSparring = Boolean(meta.isRecreationalSparring || meta.isPracticeSparring);
  const opponent = meta.opponent || { name: view.fighters.opponent.name, nickname: "", weightClass: state.profile.weightClass, style: view.fighters.opponent.style };
  const tournamentName = meta.isDeveloperBout
    ? meta.isPracticeSparring ? "Sparring immédiat · mode développeur" : "Combat immédiat · mode développeur"
    : meta.isRecreationalSparring
      ? `Sparring d’évaluation · ${sparringPartnerView().displayName}`
      : meta.isPracticeSparring
        ? "Sparring technique · GYM de boxe"
        : meta.tournamentId ? state.activeTournament?.name || tournamentDefs.find(item => item.id === meta.tournamentId)?.name || "Tournoi amateur" : (state.scheduledFight?.event?.name || "Gala amateur");
  const playerCornerTheme = state.profile.corner;
  const playerIsBlue = playerCornerTheme === "blue";
  const opponentCornerTheme = opposingCorner(playerCornerTheme);
  const playerCorner = document.querySelector(".player-corner");
  const opponentCorner = document.querySelector(".opponent-corner");
  playerCorner.classList.toggle("blue-corner", playerIsBlue);
  playerCorner.classList.toggle("red-corner", !playerIsBlue);
  opponentCorner.classList.toggle("red-corner", playerIsBlue);
  opponentCorner.classList.toggle("blue-corner", !playerIsBlue);
  playerCorner.dataset.corner = playerCornerTheme;
  opponentCorner.dataset.corner = opponentCornerTheme;
  const playerPortrait = document.querySelector(".player-corner .portrait-crop");
  playerPortrait.style.setProperty("--portrait-index", String(state.profile.portraitId || 0));
  const playerPortraitImage = document.querySelector("#fight-player-portrait");
  playerPortraitImage.src = portraitAsset(state.profile.sex);
  playerPortraitImage.alt = `Portrait de ${state.profile.firstName}, coin ${cornerLabel(playerCornerTheme)}`;
  const opponentPortrait = document.querySelector("#fight-opponent-portrait");
  opponentPortrait.src = opponentPortraitAsset();
  opponentPortrait.alt = `Portrait de ${opponent.name}, coin ${cornerLabel(opponentCornerTheme)}`;
  configureRingImages();

  document.querySelector("#fight-week-label").textContent = `${tournamentName} · semaine ${state.week}`;
  document.querySelector("#fight-round").textContent = view.status.finished ? (isSparring ? "Sparring terminé" : "Combat terminé") : view.phase === "corner" ? `${view.round === 1 ? "Briefing" : "Entre les rounds"} · round ${view.round} / 3` : `Round ${view.round} / 3 · échange ${view.currentExchange.number} / ${view.format.exchangesPerRound}`;
  document.querySelector("#fight-player-name").textContent = state.profile.firstName;
  document.querySelector("#fight-player-meta").textContent = `${state.profile.nickname ? `« ${state.profile.nickname} » · ` : ""}${state.profile.weightClass} · coin ${cornerLabel(playerCornerTheme)}`;
  document.querySelector("#fight-opponent-name").textContent = opponent.name;
  document.querySelector("#fight-opponent-meta").textContent = `${opponent.nickname ? `« ${opponent.nickname} » · ` : ""}${opponent.weightClass || state.profile.weightClass} · coin ${cornerLabel(opponentCornerTheme)}`;
  document.querySelector("#fight-player-energy").textContent = `${Math.round(view.fighters.player.energy)}%`;
  document.querySelector("#fight-opponent-energy").textContent = `${Math.round(view.fighters.opponent.energy)}%`;
  document.querySelector("#fight-player-energy-bar").style.width = `${view.fighters.player.energy}%`;
  document.querySelector("#fight-opponent-energy-bar").style.width = `${view.fighters.opponent.energy}%`;
  document.querySelector("#fight-distance").textContent = fightDistanceLabel(view.ring.distance);
  document.querySelector("#fight-position").textContent = fightPositionLabel(view.ring);
  document.querySelector("#fight-momentum").textContent = momentumLabel(view);
  document.querySelector("#fight-composure").textContent = fightComposureLabel(view.fighters.player.lucidity);
  document.querySelector("#fight-head-status").textContent = fightDamageLabel(view.fighters.player.head, "head");
  document.querySelector("#fight-body-status").textContent = fightDamageLabel(view.fighters.player.body, "body");
  const mobileDistance = fightDistanceLabel(view.ring.distance);
  const mobilePosition = fightPositionLabel(view.ring);
  const mobileHead = fightDamageLabel(view.fighters.player.head, "head");
  const mobileBody = fightDamageLabel(view.fighters.player.body, "body");
  document.querySelector("#fight-mobile-details-summary").textContent = `${mobileDistance} · ${mobilePosition}`;
  document.querySelector("#fight-mobile-distance").textContent = mobileDistance;
  document.querySelector("#fight-mobile-position").textContent = mobilePosition;
  document.querySelector("#fight-mobile-momentum").textContent = momentumLabel(view);
  document.querySelector("#fight-mobile-composure").textContent = fightComposureLabel(view.fighters.player.lucidity);
  document.querySelector("#fight-mobile-damage").textContent = `Tête : ${mobileHead} · Corps : ${mobileBody}`;
  const stage = document.querySelector("#fight-ring-stage");
  stage.dataset.playerCorner = playerCornerTheme;
  stage.dataset.distance = view.ring.distance;
  stage.dataset.position = view.ring.position === "center" ? "center" : `${view.ring.position === "corner" ? "corner" : "ropes"}-${view.ring.pressured || "player"}`;
  renderSparringRing(view);

  const tell = view.currentExchange?.intention || (view.coach.pending ? `Le coach anticipe : ${view.coach.pending.prediction}.` : "Le plan adverse reste difficile à lire.");
  document.querySelector("#fight-opponent-tell").textContent = tell;
  document.querySelector("#fight-tactical-hint").textContent = view.currentExchange ? `${view.currentExchange.situation} · lecture estimée ${Math.round(view.currentExchange.readingAccuracy * 100)} %` : `${opponent.style} · difficulté ${meta.opponentDifficulty || view.opponentDifficulty}`;
  document.querySelector("#fight-coach-directive").textContent = view.coach.activeDirective?.label || "À choisir";
  document.querySelector("#fight-coach-confidence").textContent = view.roundState?.coachRevealedWrong ? "La première lecture ne se confirme pas : adapte-toi." : "Suivre la directive aide, sans garantir l’échange.";

  document.querySelector("#fight-round-track").innerHTML = Array.from({ length: 3 }, (_, index) => {
    const completed = view.rounds[index];
    const current = !view.status.finished && index + 1 === view.round;
    const label = completed ? `${view.format.exchangesPerRound} échanges` : current ? `${view.exchange}/${view.format.exchangesPerRound}` : "À venir";
    return `<span class="${completed ? "completed" : current ? "current" : ""}">Round ${index + 1}<strong>${label}</strong></span>`;
  }).join("");
  renderFightRoundDynamic(view);

  const scoreLabel = document.querySelector("#fight-score-label");
  const score = document.querySelector("#fight-score");
  const cards = document.querySelector("#fight-judge-cards");
  if (view.status.finished) {
    scoreLabel.textContent = isSparring ? "Sparring non comptabilisé" : view.result.method === "decision" ? `Décision · ${view.format.judgeCount} juges` : "Arrêt du combat";
    score.textContent = isSparring ? "—" : view.result.method === "decision" ? view.result.decision : view.result.label;
    cards.hidden = isSparring || !view.result.judgeCards;
    cards.innerHTML = isSparring ? "" : (view.result.judgeCards || []).map((card, index) => `<div class="judge-card ${card.winner === "player" ? "winner" : ""}"><span>Juge ${index + 1}</span><strong>${card.playerTotal}–${card.opponentTotal}</strong></div>`).join("");
  } else {
    scoreLabel.textContent = "Cartes cachées";
    score.textContent = "—";
    cards.hidden = true;
    cards.innerHTML = "";
  }
  document.querySelector("#fight-status").textContent = view.status.finished ? (isSparring ? "Sparring terminé" : view.result.label) : view.phase === "corner" ? "Le coach donne ses directives" : "Décision tactique en cours";
  const instruction = document.querySelector("#fight-instruction");
  const immersiveFight = isImmersiveRingFight();
  const showImmersiveTutorial = immersiveFight && view.phase === "corner" && view.round === 1 && !view.status.finished;
  const immersiveInstruction = immersiveFight
    ? showImmersiveTutorial
      ? isOfficialFight()
        ? `La barre sous le ring montre ton ressenti du round. Les cartes des ${view.format.judgeCount} juges restent cachées jusqu’au résultat.`
        : "La barre sous le ring montre ton ressenti du round, jamais un score ni une carte de juge."
      : view.phase === "corner"
        ? "Choisis une seule priorité avant de repartir."
        : sparringAutoResolving
          ? "Ton placement s’ajuste automatiquement à ton intention."
          : "Choisis une intention : le déplacement se fait naturellement dans le ring."
    : null;
  instruction.hidden = Boolean(immersiveFight && !view.status.finished && !showImmersiveTutorial);
  instruction.innerHTML = `<p>${escapeHTML(immersiveInstruction || (view.phase === "corner" ? "Choisis entre une directive tactique, une adaptation contextuelle et la récupération." : message))}</p>`;
  const recent = view.history.filter(item => item.text).slice(-7);
  document.querySelector("#fight-log").innerHTML = recent.map(item => `<li>${item.round ? `R${item.round}${item.exchange ? `·E${item.exchange}` : ""} — ` : ""}${escapeHTML(item.text)}</li>`).join("") || "<li>Le combat va commencer.</li>";
  const logDisclosure = document.querySelector(".fight-log-disclosure");
  if (immersiveFight && logDisclosure && !logDisclosure.dataset.prototypePrepared) {
    logDisclosure.open = false;
    logDisclosure.dataset.prototypePrepared = "true";
  }
  renderFightCoach();
  renderFightChoices();
  if (!view.status.finished && !sparringAutoResolving) requestAnimationFrame(() => {
    const selector = view.phase === "corner"
      ? "#fight-coach-choices button"
      : "#fight-choices button";
    document.querySelector(selector)?.focus({ preventScroll: immersiveFight });
  });
}

function chooseFightCoachDirective(optionId) {
  if (!fightState || fightState.phase !== "corner") return;
  const enteringRound = fightState.round;
  if (isImmersiveRingFight() && enteringRound > 1) {
    sparringRingState = window.BoxeurSparringRing.beginRound(sparringRingState, enteringRound);
    syncImmersiveRingContext();
  }
  const transition = BoxeurCombat.chooseCoachDirective(fightState, optionId);
  fightState = transition.state;
  triggerFightVisual(transition.result);
  renderFight(transition.result.text);
}

function clearSparringAutoResolve() {
  if (sparringAutoResolveTimer) clearTimeout(sparringAutoResolveTimer);
  sparringAutoResolveTimer = null;
  sparringAutoResolving = false;
  sparringPendingActionId = null;
}

function beginSparringExchange(actionId, movementPurpose = "hold") {
  if (!isImmersiveRingFight() || fightState?.phase !== "exchange" || sparringAutoResolving) return;
  try {
    const initialRingState = sparringRingState;
    const suggested = window.BoxeurSparringRing.findSuggestedMovement(initialRingState, fightState, movementPurpose);
    if (!suggested) throw new Error("Aucun placement tactique n’est disponible.");
    let movementTransition = window.BoxeurSparringRing.applyMovement(initialRingState, fightState, suggested.id);
    const actionRemainsAvailable = BoxeurCombat.getAvailableActions(movementTransition.combatState)
      .some(action => action.id === actionId);
    if (!actionRemainsAvailable && suggested.id !== "hold") {
      const hold = window.BoxeurSparringRing.getMovementOptions(initialRingState, fightState.fighters.player.energy)
        .find(movement => movement.id === "hold");
      if (hold) movementTransition = window.BoxeurSparringRing.applyMovement(initialRingState, fightState, hold.id);
    }
    sparringRingState = movementTransition.state;
    fightState = movementTransition.combatState;
    sparringAutoResolving = true;
    sparringPendingActionId = actionId;
    const movement = sparringRingState.pendingMovement;
    renderFight(movement?.label ? `${movement.label} : le placement suit ton choix.` : "Le placement suit ton choix.");
    sparringAutoResolveTimer = setTimeout(() => {
      sparringAutoResolveTimer = null;
      sparringAutoResolving = false;
      if (!isImmersiveRingFight() || fightState?.phase !== "exchange") return;
      playRound(actionId, movementPurpose);
      sparringPendingActionId = null;
    }, 360);
  } catch (error) {
    console.error("[Boxeur Deux] Placement automatique du sparring impossible :", error);
    clearSparringAutoResolve();
    showToast("Le placement tactique n’est plus disponible.");
    renderFight();
  }
}

function playRound(actionId, movementPurpose = "hold") {
  if (!fightState || fightState.phase !== "exchange") return;
  try {
    if (isImmersiveRingFight() && sparringAutoResolving) return;
    if (isImmersiveRingFight() && !sparringRingState.pendingMovement) {
      beginSparringExchange(actionId, movementPurpose);
      return;
    }
    const beforeView = BoxeurCombat.getPublicState(fightState);
    const movement = isImmersiveRingFight() ? sparringRingState.pendingMovement : null;
    const transition = BoxeurCombat.resolveExchange(fightState, actionId);
    if (isImmersiveRingFight()) {
      sparringRingState = window.BoxeurSparringRing.advanceAfterExchange(sparringRingState, transition, transition.state);
    }
    fightState = transition.state;
    if (isImmersiveRingFight()) syncImmersiveRingContext();
    recordSparringExchange(beforeView, transition, movementPurpose, movement);
    triggerFightVisual(transition.result);
    if (fightState.status.finished) finishFight();
    else renderFight(transition.result.text);
  } catch (error) {
    console.error("[Boxeur Deux] Échange impossible :", error);
    showToast("Cette action n’est plus disponible.");
  }
}

function useCornerBoost() {
  if (fightState?.phase === "corner") chooseFightCoachDirective("recover");
}

function settleCareerSparring(fight, fightFatigue, exposure) {
  const capsule = ensureCareerPreviewCapsule();
  if (!capsule?.timeState || !window.BoxeurTime) return false;
  const runtime = normalizeCareerPreviewRuntime(capsule);
  const isRemy = fight.careerMeta?.isRecreationalSparring === true;
  const label = isRemy ? `Sparring pédagogique avec ${sparringPartnerView().displayName}` : "Sparring technique au GYM";
  const trainedEarlierThisWeek = careerWeekTrainingActivityCount(capsule.timeState) > 0;
  const finalEnergy = clamp(Math.round(fight.fighters.player.energy), 0, 100);
  const energyCost = Math.max(0, Math.round(capsule.timeState.condition.energy - finalEnergy));
  try {
    capsule.timeState = window.BoxeurTime.performActivity(capsule.timeState, {
      id: `${isRemy ? "remy-sparring" : "practice-sparring"}:${capsule.timeState.clock.week}`,
      label,
      category: "sparring",
      duration: 1,
      energyCost,
      energyGain: 0,
      fatigueGain: Math.max(6, Math.round(fightFatigue * .72)),
      fatigueRelief: 0,
      stimulus: isRemy
        ? { technique: 4, power: 0, cardio: 2, defense: 5 }
        : { technique: 3, power: 0, cardio: 2, defense: 4 },
    });
  } catch (error) {
    console.warn("[Boxeur Deux] Bilan temporel du sparring simplifié :", error);
    capsule.timeState.condition.energy = finalEnergy;
    capsule.timeState.condition.fatigue = clamp(capsule.timeState.condition.fatigue + Math.max(6, Math.round(fightFatigue * .72)));
    capsule.timeState = window.BoxeurTime.advanceTime(capsule.timeState, 1);
  }
  if (isRemy) {
    const onboarding = careerOnboardingView(capsule);
    if (onboarding?.gates.remySparring.allowed) {
      applyCareerOnboardingEvent({ type: window.BoxeurOnboarding.EVENT_TYPES.COMPLETE_REMY_SPARRING });
    }
    state.recreationalSparringStatus = "completed";
  }
  runtime.career.experience += isRemy ? 14 : 8;
  if (!isRemy && isCompetitiveCareer()) state.boxingTrainingWeek = capsule.timeState.clock.week;
  if (!trainedEarlierThisWeek) runtime.trainingSessions = safeNumber(runtime.trainingSessions + 1, 0, 0, 999);
  runtime.sessions.unshift({
    type: isRemy ? "remy-sparring" : "practice-sparring",
    label,
    week: capsule.timeState.clock.week,
    exposure: Math.round(exposure * 10) / 10,
  });
  runtime.sessions = runtime.sessions.slice(0, 50);
  if (!isRemy && runtime.pendingPlannerSparringEntryId && runtime.weekPlanner?.status === "draft") {
    try {
      const entry = runtime.weekPlanner.entries.find(item => item.id === runtime.pendingPlannerSparringEntryId);
      if (entry) {
        runtime.weekPlanner = window.BoxeurWeekPlanner.editActivity(runtime.weekPlanner, entry.id, {
          metadata: { ...entry.metadata, completed: true },
        }).state;
      }
    } catch (error) {
      console.warn("[Boxeur Deux] Le sparring est terminé, mais son repère de semaine n’a pas pu être mis à jour :", error);
    }
  }
  runtime.pendingPlannerSparringEntryId = null;
  runtime.weekPlannerSignature = null;
  state.scheduledFight = !isRemy && fight.careerMeta?.deferredScheduledFight
    ? cloneData(fight.careerMeta.deferredScheduledFight)
    : null;
  persistCareerPreviewCapsule();
  return true;
}

function fightCareerSnapshot(source = state) {
  return {
    energy: Math.round(Number(source.energy ?? state.energy)),
    fatigue: Math.round(Number(source.fatigue ?? state.fatigue)),
    experience: Math.round(Number(source.experience ?? state.experience)),
    reputation: Math.round(Number(source.reputation ?? state.reputation)),
    money: Math.round(Number(source.money ?? state.money)),
    amateurRecord: cloneData(source.amateurRecord || state.amateurRecord),
  };
}

function buildFightCareerDebrief(fight, before, after, options = {}) {
  const exchanges = (fight.history || []).filter(item => item?.type === "exchange");
  const playerEdges = exchanges.filter(item => item.side === "player").length;
  const opponentEdges = exchanges.filter(item => item.side === "opponent").length;
  const significant = exchanges.filter(item => item.significant).length;
  const knockdownsFor = exchanges.filter(item => item.knockdown?.knockedDown === "opponent").length;
  const knockdownsAgainst = exchanges.filter(item => item.knockdown?.knockedDown === "player").length;
  const xpDelta = after.experience - before.experience;
  const reputationDelta = after.reputation - before.reputation;
  const moneyDelta = after.money - before.money;
  const recordBefore = before.amateurRecord || { wins: 0, losses: 0, draws: 0 };
  const recordAfter = after.amateurRecord || recordBefore;
  const recordChanged = ["wins", "losses", "draws"].some(key => Number(recordAfter[key] || 0) !== Number(recordBefore[key] || 0));
  const signed = (value, suffix = "") => `${value > 0 ? "+" : value < 0 ? "−" : ""}${Math.abs(value)}${suffix}`;
  const ringNotes = [
    `${playerEdges} échange${playerEdges > 1 ? "s" : ""} à ton avantage · ${opponentEdges} à l’adversaire.`,
    `${significant} échange${significant > 1 ? "s" : ""} marquant${significant > 1 ? "s" : ""}.`,
  ];
  if (knockdownsFor || knockdownsAgainst) ringNotes.push(`Comptes : ${knockdownsFor} provoqué${knockdownsFor > 1 ? "s" : ""} · ${knockdownsAgainst} subi${knockdownsAgainst > 1 ? "s" : ""}.`);
  const progression = options.developer
    ? "Aucun effet sur la carrière."
    : `XP ${signed(xpDelta)} · réputation ${signed(reputationDelta)}.`;
  const finances = options.developer
    ? "Solde inchangé."
    : moneyDelta === 0 ? "Aucun gain ni coût supplémentaire." : `Variation du solde : ${signed(moneyDelta, " $")}.`;
  const record = options.nonRecord
    ? "Non comptabilisé au bilan amateur."
    : recordChanged
      ? `${recordAfter.wins || 0} V · ${recordAfter.losses || 0} D · ${recordAfter.draws || 0} N`
      : "Bilan amateur inchangé.";
  return `<section class="fight-career-debrief" aria-labelledby="fight-career-debrief-title">
    <h3 id="fight-career-debrief-title">Bilan du combat</h3>
    <div class="fight-career-debrief-grid">
      <div><strong>Condition</strong><span>Énergie ${before.energy} → ${after.energy} · fatigue ${before.fatigue} → ${after.fatigue}</span></div>
      <div><strong>Progression</strong><span>${escapeHTML(progression)}</span></div>
      <div><strong>Finances</strong><span>${escapeHTML(finances)}</span></div>
      <div><strong>Bilan</strong><span>${escapeHTML(record)}</span></div>
    </div>
    <div class="fight-career-debrief-notes"><strong>Repères du ring</strong><ul>${ringNotes.map(note => `<li>${escapeHTML(note)}</li>`).join("")}</ul></div>
  </section>`;
}

function finishFight() {
  if (!fightState?.status.finished || fightState.careerApplied) return;
  clearSparringAutoResolve();
  const fightCountBefore = amateurFightCount();
  const meta = fightState.careerMeta || {};
  const fightResult = fightState.result;
  const won = fightResult.winner === "player";
  const result = won ? "Victoire" : "Défaite";
  const isRecreationalSparring = Boolean(meta.isRecreationalSparring);
  const isPracticeSparring = Boolean(meta.isPracticeSparring);
  const isNonRecordSparring = isRecreationalSparring || isPracticeSparring;
  const isCareerSparring = Boolean(meta.isCareerSparring);
  const isDeveloperBout = Boolean(meta.isDeveloperBout);
  const exposure = fightResult.exposure?.player || fightState.fighters.player.legacyExposure || 0;
  const fightFatigue = clamp(Math.round(8 + (100 - fightState.fighters.player.energy) * .14 + exposure * .25 - state.combatStats.cardio * .035), 8, 32);
  if (isDeveloperBout) {
    // Un affrontement lancé par le menu caché exerce le vrai moteur, mais ne
    // touche jamais au bilan, aux jauges ni à la semaine de la carrière testée.
  } else if (isNonRecordSparring) {
    if (!isCareerSparring) {
      applyChanges({ experience: 14, fatigue: Math.round(fightFatigue * .72) });
      if (isRecreationalSparring) state.recreationalSparringStatus = "completed";
    }
  } else if (won) {
    state.amateurRecord.wins += 1;
    applyChanges({ reputation: meta.tournamentId ? 6 + (state.activeTournament?.currentRound || 0) : meta.reputationReward, experience: meta.experienceReward, fatigue: fightFatigue });
  } else {
    state.amateurRecord.losses += 1;
    applyChanges({ reputation: 2, experience: Math.max(10, (meta.experienceReward || 16) - 6), fatigue: fightFatigue + 3 });
  }
  if (!isCareerSparring && !isDeveloperBout) state.energy = clamp(Math.round(fightState.fighters.player.energy));
  if (!isNonRecordSparring && !isDeveloperBout) {
    state.lastFightWeek = state.week;
    state.avoidanceWeeks = 0;
  }
  const score = fightResult.method === "decision" ? `décision ${fightResult.decision}` : `${fightResult.label} · R${fightResult.round || fightState.round}`;
  const tournamentNote = isNonRecordSparring || isDeveloperBout ? "" : resolveTournamentRound({ ...fightState, tournamentId: meta.tournamentId, opponent: meta.opponent }, result, fightResult.method, score);
  const unlockedFourthAction = !isNonRecordSparring && !isDeveloperBout && fightCountBefore < 10 && amateurFightCount() >= 10;
  const methodLabel = isNonRecordSparring ? "Sparring terminé" : fightResult.method === "decision" ? `${fightResult.label} (${fightResult.decision})` : `${won ? "Victoire" : "Défaite"} par ${fightResult.label}`;
  const journalPrefix = isRecreationalSparring ? "Sparring d’évaluation" : isPracticeSparring ? "Sparring technique" : "Combat amateur";
  const partner = sparringPartnerView();
  const sparringJournal = state.profile.sex === "female"
    ? `${partner.firstName} termine l’opposition et Rémy confirme ton passage automatique au statut amateur.`
    : "Rémy termine son évaluation et confirme ton passage automatique au statut amateur.";
  const sparringDebrief = isRecreationalSparring ? buildRemySparringDebrief(fightState) : null;
  if (sparringDebrief) state.remyLesson = sparringDebrief.lesson;
  const sparringSummary = isRecreationalSparring
    ? sparringJournal
    : isPracticeSparring
      ? `Opposition contrôlée contre ${meta.opponent?.name || fightState.fighters.opponent.name}, sans résultat au bilan.`
      : `${methodLabel} contre ${meta.opponent?.name || fightState.fighters.opponent.name}.`;
  if (!isDeveloperBout) state.journal.unshift({ week: state.week, text: `${journalPrefix} : ${sparringSummary}${tournamentNote ? ` ${tournamentNote}` : ""}` });
  if (unlockedFourthAction) state.journal.unshift({ week: state.week, text: "Dix combats amateurs disputés : le programme hebdomadaire passe définitivement à quatre actions." });
  const booking = state.bookings.find(item => item.id === meta.bookingId);
  if (booking && !meta.tournamentId && !isDeveloperBout) booking.status = "completed";
  fightState.careerApplied = true;
  let careerAfterFight = fightCareerSnapshot();
  if (isDeveloperBout) {
    state.scheduledFight = developerBoutScheduledBackup;
    developerBoutScheduledBackup = null;
  } else if (isCareerSparring) {
    settleCareerSparring(fightState, fightFatigue, exposure);
    careerAfterFight = fightCareerSnapshot(careerCareerView());
    if (isRecreationalSparring) completeAmateurCareerAfterSparring();
  }
  else state.scheduledFight = null;
  const gatedOfficialFight = !isNonRecordSparring && !isDeveloperBout && careerFightGateReady(careerCapsule);
  if (meta.tournamentId && !isDeveloperBout) {
    restoreDeferredGalaAfterTournamentBout();
    if (gatedOfficialFight && syncCareerFightGateProgressToCapsule()) persistCareerPreviewCapsule();
  } else if (!isCareerSparring && !isDeveloperBout) {
    if (gatedOfficialFight) finalizeCareerFightGate();
    else {
      const weekTransitionEvents = [];
      settleJobAttendance(false, weekTransitionEvents, state.week);
      endWeek(weekTransitionEvents);
    }
    if (isRecreationalSparring) completeAmateurCareerAfterSparring();
  }
  if (!isCareerSparring && !isDeveloperBout) persistCareer();
  renderFight(`${methodLabel}.`);
  const instruction = document.querySelector("#fight-instruction");
  const debriefTitle = state.profile.sex === "female" ? `Ce que Rémy et ${partner.firstName} veulent te montrer` : "Ce que Rémy veut te montrer";
  const evaluationComplete = state.profile.sex === "female"
    ? `${partner.firstName} a terminé l’opposition et Rémy donne son feu vert. Ton statut amateur est maintenant activé automatiquement.`
    : "Rémy a terminé son évaluation. Ton statut amateur est maintenant activé automatiquement.";
  const sparringReport = sparringDebrief ? `<section class="sparring-debrief" aria-labelledby="sparring-debrief-title"><h3 id="sparring-debrief-title">${escapeHTML(debriefTitle)}</h3><div><strong>À garder</strong><ul>${sparringDebrief.strengths.map(item => `<li>${escapeHTML(item)}</li>`).join("")}</ul></div><div><strong>À essayer au prochain combat</strong><ul>${sparringDebrief.adjustments.map(item => `<li>${escapeHTML(item)}</li>`).join("")}</ul></div></section>` : "";
  const careerDebrief = buildFightCareerDebrief(
    fightState,
    meta.careerBefore || fightCareerSnapshot(),
    careerAfterFight,
    { developer: isDeveloperBout, nonRecord: isNonRecordSparring || isDeveloperBout },
  );
  instruction.innerHTML = `<p><strong>${escapeHTML(methodLabel)}</strong><br>${isDeveloperBout ? "Test terminé : la carrière, le bilan, les jauges et le calendrier sont restés intacts." : isRecreationalSparring ? escapeHTML(evaluationComplete) : isPracticeSparring ? "Le sparring reste une séance d’apprentissage : aucune victoire ni défaite n’est ajoutée au bilan." : meta.tournamentId ? escapeHTML(tournamentNote || "Le tableau est mis à jour.") : "Le bilan ci-dessous montre exactement les effets du combat."}</p>${careerDebrief}${sparringReport}`;
  const closeButton = document.createElement("button");
  closeButton.className = "primary-button";
  closeButton.type = "button";
  closeButton.textContent = isDeveloperBout ? "Retour au menu test" : meta.tournamentId ? "Retour au tournoi" : isRecreationalSparring ? "Voir mon passage amateur" : isPracticeSparring ? "Retour au GYM" : "Retour au camp";
  closeButton.addEventListener("click", () => {
    document.querySelector("#fight-dialog").close();
    clearSparringAutoResolve();
    const wasTournament = Boolean(meta.tournamentId);
    fightState = null;
    sparringRingState = null;
    if (isDeveloperBout) {
      render();
      setTimeout(openDeveloperTestMenu, 0);
    } else if (wasTournament) {
      render();
    } else {
      render();
      if (isNonRecordSparring) {
        if (isCareerSparring) {
          if (!isRecreationalSparring) setTimeout(() => openCareerLocation("boxing-gym"), 0);
        } else if (!isRecreationalSparring) setTimeout(() => document.querySelector("#calendar-dialog")?.showModal(), 0);
      }
    }
    if (!isNonRecordSparring && !isDeveloperBout) showCareerAlertOrContinue();
    maybeShowDivisionMigration();
  });
  instruction.append(closeButton);
}

function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1600);
}

document.querySelector("#creation-stats").addEventListener("click", event => {
  const button = event.target.closest("button[data-stat]");
  if (!button) return;
  const key = button.dataset.stat;
  const change = Number(button.dataset.change);
  if (change > 0 && pointsLeft() === 0) return;
  draftStats[key] = Math.max(0, draftStats[key] + change);
  renderCreation();
});

document.querySelector("#fighter-style").addEventListener("change", renderCreation);
document.querySelector("#fighter-sex").addEventListener("change", () => {
  draftPortraitId = 0;
  const sex = document.querySelector("#fighter-sex").value;
  renderWeightOptions(document.querySelector("#weight-class"), sex, null);
  renderCreation();
});
document.querySelector("#creation-portraits").addEventListener("click", event => {
  const button = event.target.closest("[data-portrait-id]");
  if (!button) return;
  draftPortraitId = safeNumber(button.dataset.portraitId, 0, 0, 2);
  renderCreationPortraits();
});
document.querySelector("#creation-form").addEventListener("submit", event => {
  event.preventDefault();
  const form = event.currentTarget;
  const error = document.querySelector("#creation-error");
  if (!form.reportValidity()) return;
  if (pointsLeft() !== 0) {
    error.textContent = `Il reste ${pointsLeft()} point${pointsLeft() > 1 ? "s" : ""} à répartir.`;
    return;
  }
  error.textContent = "";
  const style = document.querySelector("#fighter-style").value;
  const corner = document.querySelector("#fighter-corner").value;
  const sex = document.querySelector("#fighter-sex").value === "female" ? "female" : "male";
  invalidateCareerPreviewCapsule();
  state = cloneData(INITIAL_STATE);
  fightState = null;
  sparringRingState = null;
  state.profile = {
    firstName: document.querySelector("#first-name").value.trim(),
    lastName: document.querySelector("#last-name").value.trim(),
    nickname: document.querySelector("#nickname").value.trim(),
    sex,
    weightClass: document.querySelector("#weight-class").value,
    portraitId: draftPortraitId,
    style,
    corner,
  };
  const category = weightClassDefinition(state.profile.weightClass, sex);
  state.currentWeightKg = defaultCompetitionWeight(category);
  state.migrationPending = false;
  ensureCareerCalendar();
  applyCareerTheme();
  Object.keys(combatLabels).forEach(key => { state.combatStats[key] = BASE_COMBAT_STAT + styles[style].bonuses[key] + draftStats[key]; });
  state.journal = [{ week: 1, text: `${state.profile.firstName} commence au statut récréatif. Choisis un emploi et active le premier mois de GYM pour lancer le parcours.` }];
  render();
  openCareerOnboardingWelcome();
  showToast("Nouvelle carrière lancée · statut récréatif");
});

document.querySelector("#import-career-creation")?.addEventListener("click", () => document.querySelector("#import-career-file")?.click());
document.querySelector("#import-career-file")?.addEventListener("change", async event => {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  try {
    const snapshot = JSON.parse(await file.text());
    restoreCareer(snapshot, { invalidateCareer: true });
  } catch (error) {
    console.error("[Boxeur Deux] Import JSON impossible :", error);
    showToast("Impossible de lire ce fichier de carrière.");
  }
});

document.querySelector("#resume-load")?.addEventListener("click", () => {
  const snapshot = loadSavedSnapshot();
  if (snapshot && restoreCareer(snapshot)) document.querySelector("#resume-dialog")?.close();
});
document.querySelector("#resume-new")?.addEventListener("click", () => {
  document.querySelector("#resume-dialog")?.close();
  invalidateCareerPreviewCapsule();
  state = cloneData(INITIAL_STATE);
  fightState = null;
  sparringRingState = null;
  draftPortraitId = 0;
  draftStats = { technique: 0, power: 0, cardio: 0, defense: 0 };
  document.querySelector("#creation-form").reset();
  renderCreation();
  render();
});

document.querySelector("#migration-sex")?.addEventListener("change", event => {
  renderWeightOptions(document.querySelector("#migration-weight"), event.currentTarget.value, null);
});
document.querySelector("#division-migration-form")?.addEventListener("submit", event => {
  event.preventDefault();
  const sex = document.querySelector("#migration-sex").value === "female" ? "female" : "male";
  const weightClass = document.querySelector("#migration-weight").value;
  if (!weightClassesForSex(sex).some(item => item.id === weightClass)) return;
  state.profile.sex = sex;
  state.profile.weightClass = weightClass;
  state.profile.portraitId = safeNumber(document.querySelector("#migration-portrait").value, 0, 0, 2);
  const category = weightClassDefinition(weightClass, sex);
  state.currentWeightKg = defaultCompetitionWeight(category);
  state.migrationPending = false;
  state.calendar = null;
  ensureCareerCalendar();
  document.querySelector("#division-migration-dialog").close();
  render();
  showToast("Division et catégorie enregistrées");
});
document.querySelector("#division-migration-dialog")?.addEventListener("cancel", event => event.preventDefault());

document.querySelector("#developer-code-form")?.addEventListener("submit", event => {
  event.preventDefault();
  const input = document.querySelector("#developer-code-input");
  const error = document.querySelector("#developer-code-error");
  if (input?.value !== DEV_UNLOCK_CODE) {
    if (error) error.textContent = "Code invalide.";
    input?.focus();
    return;
  }
  document.querySelector("#developer-code-dialog")?.close();
  openDeveloperTestMenu();
});
document.querySelector("#developer-code-close")?.addEventListener("click", () => document.querySelector("#developer-code-dialog")?.close());
document.querySelector("#developer-test-close")?.addEventListener("click", () => document.querySelector("#developer-test-dialog")?.close());
document.querySelector("#developer-test-options")?.addEventListener("click", event => {
  const preset = event.target.closest("[data-developer-preset]");
  if (preset) loadDeveloperPreset(preset.dataset.developerPreset);
});
document.querySelector("#developer-corner-options")?.addEventListener("click", event => {
  const corner = event.target.closest("[data-developer-corner]");
  if (corner) applyDeveloperCorner(corner.dataset.developerCorner);
});
document.querySelector("#developer-tool-options")?.addEventListener("click", event => {
  const tool = event.target.closest("[data-developer-tool]");
  if (tool) runDeveloperTool(tool.dataset.developerTool);
});
document.querySelector("#developer-return-career")?.addEventListener("click", restoreDeveloperReturnCareer);

document.querySelector("#career-world")?.addEventListener("keydown", event => {
  const sheet = event.target.closest(".career-location-sheet");
  if (!sheet || sheet.hidden) return;
  if (event.key === "Escape") {
    event.preventDefault();
    closeCareerLocation();
    return;
  }
  if (event.key !== "Tab") return;
  const focusable = careerLocationFocusableElements(sheet);
  if (!focusable.length) {
    event.preventDefault();
    sheet.focus();
    return;
  }
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && (document.activeElement === first || !sheet.contains(document.activeElement))) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (document.activeElement === last || !sheet.contains(document.activeElement))) {
    event.preventDefault();
    first.focus();
  }
});

document.querySelector("#career-world")?.addEventListener("click", event => {
  const disabledControl = event.target.closest('.career-location-sheet [aria-disabled="true"]:not(:disabled)');
  if (disabledControl) {
    event.preventDefault();
    const reasonId = disabledControl.getAttribute("aria-describedby");
    const reason = reasonId ? document.getElementById(reasonId)?.textContent?.trim() : "";
    showToast(reason || "Cette option n’est pas disponible maintenant.");
    return;
  }
  const destination = event.target.closest("[data-career-location]");
  if (destination) {
    openCareerLocation(destination.dataset.careerLocation);
    return;
  }
  if (event.target.closest("[data-career-week-quick]")) {
    applyCareerQuickWeekPlan();
    return;
  }
  if (event.target.closest("[data-career-week-handoff]")) {
    openCareerWeekPlan();
    return;
  }
  if (event.target.closest("[data-career-week-detailed]")) {
    selectCareerDetailedWeek();
    return;
  }
  if (event.target.closest("[data-career-week-confirm]")) {
    runCareerAutomaticWeek();
    return;
  }
  const weekEntryRemove = event.target.closest("[data-career-week-remove]");
  if (weekEntryRemove) {
    const removed = removeCareerPlannerActivity(weekEntryRemove.dataset.careerWeekRemove);
    if (removed) openCareerWeekPlan();
    return;
  }
  if (event.target.closest("[data-career-week-summary-close]")) {
    if (careerFightGateReady()) {
      closeCareerLocation();
      setTimeout(() => openCareerLocation("arena"), 0);
      return;
    }
    closeCareerLocation();
    setTimeout(showCareerAlertOrContinue, 0);
    return;
  }
  if (event.target.closest("[data-career-export-career]")) {
    exportCareerJson();
    return;
  }
  if (event.target.closest("[data-career-week-plan-close]")) {
    closeCareerLocation();
    return;
  }
  if (event.target.closest("[data-career-close-location], [data-career-leave-gym], [data-career-leave-strength-gym], [data-career-leave-home], [data-career-leave-work], [data-career-leave-arena]")) {
    closeCareerLocation();
    revealPendingCareerLevelAlert();
    return;
  }
  if (event.target.closest("[data-career-developer-secret]")) {
    registerDeveloperSecretTap();
    return;
  }
  if (event.target.closest("[data-career-restore-career]")) {
    restoreDeveloperReturnCareer();
    return;
  }
  const inventoryAction = event.target.closest("[data-career-inventory-action]");
  if (inventoryAction) {
    if (inventoryAction.dataset.careerInventoryAction === "reserve-week") {
      openCareerSupplementReservation(inventoryAction.dataset.careerInventoryItem);
    }
    return;
  }
  const supplementEntry = event.target.closest("[data-career-plan-supplement-entry]");
  if (supplementEntry) {
    reserveCareerPlannerSupplement(supplementEntry.dataset.careerPlanSupplementEntry, supplementEntry.dataset.careerPlanSupplementProduct);
    return;
  }
  const supplementRemove = event.target.closest("[data-career-plan-supplement-remove]");
  if (supplementRemove) {
    unreserveCareerPlannerSupplement(supplementRemove.dataset.careerPlanSupplementRemove);
    return;
  }
  const locationEntryRemove = event.target.closest("[data-career-location-remove]");
  if (locationEntryRemove) {
    const origin = event.currentTarget.querySelector(".career-location-sheet")?.dataset.originLocation;
    removeCareerPlannerActivity(locationEntryRemove.dataset.careerLocationRemove, { reopen: origin });
    return;
  }
  if (event.target.closest("[data-career-inventory-reserve-close]")) {
    openCareerInventory();
    return;
  }
  if (event.target.closest("[data-career-open-job-menu]")) {
    openCareerJobMenu();
    return;
  }
  if (event.target.closest("[data-career-cancel-job-application]")) {
    cancelCareerJobApplication();
    return;
  }
  const workOffer = event.target.closest(".career-location-sheet [data-select-job]");
  if (workOffer) {
    selectCareerJob(workOffer.dataset.selectJob);
    return;
  }
  const workToggle = event.target.closest("[data-career-toggle-work]");
  if (workToggle) {
    setCareerPlannerWorkAttendance(workToggle.getAttribute("aria-pressed") !== "true");
    return;
  }
  const vacationToggle = event.target.closest("[data-career-toggle-vacation]");
  if (vacationToggle) {
    setCareerPlannerPaidVacation(vacationToggle.getAttribute("aria-pressed") !== "true");
    return;
  }
  const workZone = event.target.closest("[data-career-work-zone]");
  if (workZone) {
    if (workZone.dataset.careerWorkZone === "schedule") renderCareerWorkMenu("schedule");
    else if (["job", "employment"].includes(workZone.dataset.careerWorkZone)) openCareerJobMenu();
    return;
  }
  if (event.target.closest("[data-career-work-menu-close]")) {
    openCareerLocation("work");
    return;
  }
  const homeMenu = event.target.closest("[data-career-home-menu]");
  if (homeMenu) {
    renderCareerHomeMenu(homeMenu.dataset.careerHomeMenu);
    return;
  }
  const homeAction = event.target.closest("[data-career-home-action]");
  if (homeAction) {
    runCareerHomeAction(homeAction.dataset.careerHomeAction);
    return;
  }
  const homeExercise = event.target.closest("[data-career-home-exercise]");
  if (homeExercise) {
    toggleCareerHomeExercise(homeExercise.dataset.careerHomeExercise);
    return;
  }
  if (event.target.closest("[data-career-home-custom-confirm]")) {
    if (!careerHomeSelection.length) return;
    const selection = [...careerHomeSelection];
    const added = addCareerPlannerActivity("home-custom", { selection }, { reopen: "home" });
    if (added) careerHomeSelection = [];
    return;
  }
  if (event.target.closest("[data-career-home-composer-close]")) {
    careerHomeSelection = [];
    openCareerLocation("home");
    return;
  }
  if (event.target.closest("[data-career-home-menu-close]")) {
    openCareerLocation("home");
    return;
  }
  if (event.target.closest("[data-career-home-result-close]")) {
    openCareerLocation("home");
    revealPendingCareerLevelAlert();
    return;
  }
  if (event.target.closest("[data-career-gym-menu-close]")) {
    openCareerLocation("boxing-gym");
    return;
  }
  const strengthZone = event.target.closest("[data-career-strength-zone]");
  if (strengthZone) {
    const zoneId = strengthZone.dataset.careerStrengthZone;
    if (["reception", "crossfit", "program"].includes(zoneId)) renderCareerStrengthMenu(zoneId);
    else if (zoneId === "trainer") renderCareerTrainerMenu("strength-gym");
    else if (zoneId === "shop") openCareerSupplementShop();
    return;
  }
  if (event.target.closest("[data-career-strength-menu-close]")) {
    openCareerLocation("strength-gym");
    return;
  }
  const strengthActivity = event.target.closest("[data-career-strength-activity]");
  if (strengthActivity) {
    toggleCareerStrengthActivity(strengthActivity.dataset.careerStrengthActivity);
    return;
  }
  const strengthPlan = event.target.closest("[data-career-strength-plan]");
  if (strengthPlan) {
    selectCareerStrengthPlan(strengthPlan.dataset.careerStrengthPlan);
    return;
  }
  if (event.target.closest("[data-career-strength-confirm], [data-career-strength-mobile-confirm]")) {
    runCareerStrengthSession();
    return;
  }
  if (event.target.closest("[data-career-strength-quick]")) {
    addCareerPlannerActivity("strength-quick", {}, { reopen: "strength-gym" });
    return;
  }
  if (event.target.closest("[data-career-strength-result-close]")) {
    openCareerLocation("strength-gym");
    revealPendingCareerLevelAlert();
    return;
  }
  if (event.target.closest("[data-career-strength-shop]")) {
    openCareerSupplementShop();
    return;
  }
  const supplementBuy = event.target.closest("[data-career-supplement-buy]");
  if (supplementBuy) {
    purchaseCareerSupplement(supplementBuy.dataset.careerSupplementBuy);
    return;
  }
  if (event.target.closest("[data-career-supplement-shop-close]")) {
    openCareerLocation("strength-gym");
    return;
  }
  if (event.target.closest("[data-career-boxing-trainer]")) {
    renderCareerTrainerMenu("boxing-gym");
    return;
  }
  if (event.target.closest("[data-career-strength-trainer]")) {
    renderCareerTrainerMenu("strength-gym");
    return;
  }
  const trainerTarget = event.target.closest("[data-career-trainer-target]");
  if (trainerTarget) {
    careerTrainerTarget = trainerTarget.dataset.careerTrainerTarget;
    renderCareerTrainerMenu(event.currentTarget.querySelector(".career-location-sheet")?.dataset.trainerLocation || careerTrainerLocationForTarget(careerTrainerTarget));
    return;
  }
  const trainerStart = event.target.closest("[data-career-trainer-start]");
  if (trainerStart) {
    startCareerTrainerProgram(trainerStart.dataset.careerTrainerStart);
    return;
  }
  if (event.target.closest("[data-career-trainer-session]")) {
    runCareerTrainerSession();
    return;
  }
  const trainerDestination = event.target.closest("[data-career-trainer-go-location]");
  if (trainerDestination) {
    openCareerLocation(trainerDestination.dataset.careerTrainerGoLocation);
    return;
  }
  if (event.target.closest("[data-career-trainer-close], [data-career-trainer-result-close]")) {
    const finishedTrainerSession = Boolean(event.target.closest("[data-career-trainer-result-close]"));
    const trainerLocation = event.currentTarget.querySelector(".career-location-sheet")?.dataset.trainerLocation || "boxing-gym";
    openCareerLocation(trainerLocation);
    if (finishedTrainerSession) revealPendingCareerLevelAlert();
    return;
  }
  if (event.target.closest("[data-career-coach-session]")) {
    runCareerCoachSession();
    return;
  }
  const sessionPreset = event.target.closest("[data-career-session-preset]");
  if (sessionPreset) {
    selectCareerComposerPreset(sessionPreset.dataset.careerSessionPreset);
    return;
  }
  const exercise = event.target.closest("[data-career-exercise]");
  if (exercise) {
    toggleCareerComposerExercise(exercise.dataset.careerExercise);
    return;
  }
  if (event.target.closest("[data-career-confirm-session]")) {
    runCareerCustomSession();
    return;
  }
  if (event.target.closest("[data-career-close-composer], [data-career-result-close]")) {
    const finishedBoxingSession = Boolean(event.target.closest("[data-career-result-close]"));
    openCareerLocation("boxing-gym");
    if (finishedBoxingSession) revealPendingCareerLevelAlert();
    return;
  }
  if (event.target.closest("[data-career-remy-sparring]")) {
    startCareerRemySparring();
    return;
  }
  if (event.target.closest("[data-career-sparring-activity]")) {
    runCareerTechnicalSparring();
    return;
  }
  if (event.target.closest("[data-career-open-calendar]")) {
    openCalendarDialog();
    return;
  }
  if (event.target.closest("[data-career-arena-action]")) {
    handleCareerArenaAction();
    return;
  }
  const gymZone = event.target.closest("[data-career-gym-zone]");
  if (gymZone) {
    if (gymZone.dataset.careerGymZone === "reception") openCareerMembershipMenu();
    else if (gymZone.dataset.careerGymZone === "coach") renderCareerGymMenu("coach");
    else if (gymZone.dataset.careerGymZone === "training") {
      careerComposerSelection = [];
      renderCareerComposer();
    } else if (gymZone.dataset.careerGymZone === "ring") {
      const context = careerGymContext();
      if (context?.careerStatus === "recreational" && context.recreational?.remyStatus === "ready") startCareerRemySparring();
      else if (context?.careerStatus !== "recreational") renderCareerGymMenu("ring");
    }
    return;
  }
  const navigation = event.target.closest("[data-career-nav]");
  if (navigation) {
    navigateCareerPrimary(navigation.dataset.careerNav);
    return;
  }
});

document.querySelector("#job-options").addEventListener("click", event => {
  if (event.target.closest("[data-career-cancel-job-application]")) {
    cancelCareerJobApplication();
    return;
  }
  const job = event.target.closest("[data-select-job]");
  if (job) selectCareerJob(job.dataset.selectJob);
});

document.querySelector("#job-dialog-close").addEventListener("click", () => closeOptionalDialog("job-dialog"));
document.querySelector("#job-dialog-cancel").addEventListener("click", () => closeOptionalDialog("job-dialog"));
document.querySelector("#onboarding-guide-acknowledge")?.addEventListener("click", startCareerOnboardingFromWelcome);
document.querySelector("#onboarding-guide-dialog")?.addEventListener("cancel", event => {
  event.preventDefault();
  showToast("Appuie sur « Commencer le parcours » pour choisir ton premier emploi.");
});
document.querySelector("#amateur-promotion-acknowledge")?.addEventListener("click", acknowledgeAmateurPromotion);
document.querySelector("#amateur-promotion-dialog")?.addEventListener("cancel", event => {
  event.preventDefault();
  showToast("Appuie sur « Entrer dans le circuit amateur » pour poursuivre.");
});
document.querySelector("#job-dialog")?.addEventListener("cancel", event => {
  if (event.currentTarget.dataset.mandatory === "true") {
    event.preventDefault();
    showToast(event.currentTarget.dataset.mandatoryReason || "Choisis ton emploi de départ pour poursuivre.");
  }
});

document.querySelector("#level-dialog-close")?.addEventListener("click", () => document.querySelector("#level-dialog")?.close());
document.querySelector("#level-dialog")?.addEventListener("close", () => {
  if (!resumeCareerAlertsAfterLevelDialog) return;
  resumeCareerAlertsAfterLevelDialog = false;
  showCareerAlertOrContinue();
});
document.querySelector("#level-up-later")?.addEventListener("click", () => {
  state.levelAnnouncementPending = false;
  state.levelRewardsPending = [];
  document.querySelector("#level-up-dialog")?.close();
  persistCareer();
  showCareerAlertOrContinue();
});
document.querySelector("#level-up-allocate")?.addEventListener("click", () => {
  state.levelRewardsPending = [];
  document.querySelector("#level-up-dialog")?.close();
  openLevelDialog(true);
});
document.querySelector("#job-loss-acknowledge")?.addEventListener("click", () => {
  state.jobLossNotice = null;
  document.querySelector("#job-loss-dialog")?.close();
  persistCareer();
  showCareerAlertOrContinue();
});
document.querySelector("#level-choices")?.addEventListener("click", event => {
  const choice = event.target.closest("[data-level-stat]");
  if (!choice || state.levelPoints < 1) return;
  const stat = choice.dataset.levelStat;
  if (!combatLabels[stat] || state.combatStats[stat] >= 99) return;
  state.levelPoints -= 1;
  applyCombatChanges({ [stat]: 1 });
  const capsule = careerCapsule || ensureCareerPreviewCapsule();
  if (capsule?.timeState?.stats) {
    capsule.timeState.stats[stat] = state.combatStats[stat];
    careerProgressionSnapshot(capsule);
    persistCareerPreviewCapsule();
  }
  render();
  showToast(`+1 ${combatLabels[stat]}`);
  if (state.levelPoints === 0 && resumeCareerAlertsAfterLevelDialog) setTimeout(() => document.querySelector("#level-dialog")?.close(), 0);
});
document.querySelector("#calendar-events").addEventListener("click", event => {
  const weekSummary = event.target.closest(".calendar-week-summary");
  if (weekSummary) {
    const selectedWeek = weekSummary.closest(".calendar-week-group");
    if (selectedWeek && !selectedWeek.open) {
      document.querySelectorAll("#calendar-events .calendar-week-group[open]").forEach(week => {
        if (week !== selectedWeek) week.open = false;
      });
    }
    return;
  }
  const gala = event.target.closest("[data-book-gala]");
  if (gala) return bookGalaEvent(gala.dataset.bookGala, gala.dataset.slot);
  const tournament = event.target.closest("[data-book-tournament]");
  if (tournament) return bookTournamentEvent(tournament.dataset.bookTournament, tournament.dataset.travel, tournament.dataset.tournamentDivision || null);
});

document.querySelector("#tournaments").addEventListener("click", event => {
  const button = event.target.closest("[data-tournament]");
  if (button) registerTournament(button.dataset.tournament);
});

document.querySelector("#active-tournament").addEventListener("click", event => {
  if (event.target.closest("[data-career-go-arena]")) return openCareerArenaFromCalendar();
  if (event.target.closest("[data-open-tournament]")) openTournamentBoard();
});

document.querySelector("#tournament-board-close").addEventListener("click", closeTournamentBoard);
document.querySelector("#tournament-dialog").addEventListener("cancel", event => {
  event.preventDefault();
  closeTournamentBoard();
});
document.querySelector("#tournament-medal-continue").addEventListener("click", continueAfterTournamentMedal);
document.querySelector("#tournament-medal-dialog").addEventListener("cancel", event => event.preventDefault());
document.querySelector("#tournament-next-fight").addEventListener("click", startTournamentRound);
document.querySelector("#tournament-recovery-choices").addEventListener("click", event => {
  const choice = event.target.closest("[data-tournament-recovery]");
  if (choice) applyTournamentRecovery(choice.dataset.tournamentRecovery);
});

function openCalendarDialog() {
  if (!state.profile) return;
  const sheet = document.querySelector("#career-world .career-location-sheet");
  if (sheet && !sheet.hidden) closeCareerLocation();
  renderFights();
  const navigationHost = document.querySelector("#career-calendar-navigation");
  if (navigationHost && window.BoxeurWorld?.renderNavigation) {
    navigationHost.innerHTML = window.BoxeurWorld.renderNavigation("calendar");
  }
  const dialog = document.querySelector("#calendar-dialog");
  dialog?.showModal();
  dialog?.querySelector('[data-career-nav="calendar"]')?.focus({ preventScroll: true });
}

function closeCalendarDialog() {
  document.querySelector("#calendar-dialog")?.close();
  const navigationHost = document.querySelector("#career-calendar-navigation");
  if (navigationHost) navigationHost.innerHTML = "";
}

function navigateCareerPrimary(viewId) {
  const target = ["map", "calendar", "fighter", "inventory"].includes(viewId) ? viewId : "map";
  const dialog = document.querySelector("#calendar-dialog");
  const sheet = document.querySelector("#career-world .career-location-sheet");
  const currentSheetView = sheet && !sheet.hidden ? sheet.dataset.originLocation : "map";
  if (target === "calendar") {
    if (!dialog?.open) openCalendarDialog();
    return;
  }
  if (dialog?.open) {
    closeCalendarDialog();
    document.querySelector(`#career-world [data-career-nav="${target}"]`)?.focus({ preventScroll: true });
  }
  if (target === "fighter") {
    if (currentSheetView !== "fighter") openCareerFighter();
    return;
  }
  if (target === "inventory") {
    if (currentSheetView !== "inventory" || !sheet?.querySelector(".career-inventory-view")) openCareerInventory();
    return;
  }
  if (sheet && !sheet.hidden) closeCareerLocation();
  document.querySelector('#career-world [data-career-nav="map"]')?.focus({ preventScroll: true });
}

document.querySelector("#calendar-dialog")?.addEventListener("click", event => {
  const navigation = event.target.closest("[data-career-nav]");
  if (navigation) navigateCareerPrimary(navigation.dataset.careerNav);
});
document.querySelector("#calendar-dialog")?.addEventListener("cancel", event => {
  event.preventDefault();
  closeCalendarDialog();
});

document.querySelector("#scheduled-fight").addEventListener("click", event => {
  if (event.target.closest("#start-fight")) startFight();
  if (event.target.closest("[data-career-go-arena]")) openCareerArenaFromCalendar();
  if (event.target.closest("#withdraw-fight")) withdrawFight();
});

document.querySelector("#fight-choices").addEventListener("click", event => {
  const choice = event.target.closest("[data-fight-action]");
  if (choice) playRound(choice.dataset.fightAction, choice.dataset.sparringPurpose || "hold");
});
document.querySelector("#fight-coach-choices").addEventListener("click", event => {
  const choice = event.target.closest("[data-coach-option]");
  if (choice) chooseFightCoachDirective(choice.dataset.coachOption);
});
document.querySelector("#fight-corner-boost").addEventListener("click", useCornerBoost);
document.querySelector("#fight-dialog").addEventListener("cancel", event => {
  if (fightState) event.preventDefault();
});

document.querySelector("#membership-options").addEventListener("click", event => {
  const plan = event.target.closest("[data-gym-plan]");
  if (plan) selectCareerGymPlan(plan.dataset.gymPlan);
});
document.querySelector("#membership-dialog-close").addEventListener("click", () => closeOptionalDialog("membership-dialog"));
document.querySelector("#membership-dialog-cancel").addEventListener("click", () => closeOptionalDialog("membership-dialog"));
document.querySelector("#membership-dialog")?.addEventListener("cancel", event => {
  if (event.currentTarget.dataset.mandatory === "true") {
    event.preventDefault();
    showToast(event.currentTarget.dataset.mandatoryReason || "Choisis ton premier abonnement pour poursuivre.");
  }
});

renderCreation();
render();
showResumePrompt();
