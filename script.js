const CREATION_POINTS = 5;
const BASE_COMBAT_STAT = 40;
const GYM_PRICE = 110;
const GYM_THREE_MONTH_PRICE = 285;
const GYM_MONTH_WEEKS = 4;
const GYM_THREE_MONTH_WEEKS = 12;
const STRENGTH_GYM_PRICE = 95;
const STRENGTH_GYM_THREE_MONTH_PRICE = 270;
const STRENGTH_GYM_SIX_MONTH_PRICE = 510;
const STRENGTH_GYM_YEAR_PRICE = 960;
const STRENGTH_GYM_MONTH_WEEKS = 4;
const STRENGTH_GYM_THREE_MONTH_WEEKS = 12;
const STRENGTH_GYM_SIX_MONTH_WEEKS = 24;
const STRENGTH_GYM_YEAR_WEEKS = 48;
const PRIVATE_PRICE = 90;
const TOURNAMENT_PREP_WEEKS = 4;
const RECREATIONAL_START_DATE = "2026-09-07";
const RECREATIONAL_SPARRING_WEEK = 6;
const RECREATIONAL_MAX_WEEK = 10;
const SAVE_KEY = "boxeur-deux-career-v2";
const CLASSIC_GAME_ACTIVE = new URLSearchParams(window.location.search).get("classic") === "1";
const DEV_RETURN_SAVE_KEY = `${SAVE_KEY}-dev-return`;
const DEV_TEST_ACTIVE_KEY = `${SAVE_KEY}-dev-active`;
const DEV_UNLOCK_CODE = "128";
const SAVE_VERSION = 5;
const V2_ACTIVE = !CLASSIC_GAME_ACTIVE;
const V2_PREVIEW_SAVE_KEY = `${SAVE_KEY}-v2-preview`;
const MAX_SUPPLEMENTS_PER_WEEK = 2;
const SPONSOR_COOLDOWN_WEEKS = 4;
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
  { id: "f-kim", name: "Naomi Kim", nickname: "Quickstep", style: "Défensif", record: "0 V · 2 D", difficulty: 34, risk: "Accessible", dateLead: 4 },
  { id: "f-okafor", name: "Amara Okafor", nickname: "Brick", style: "Puncheur", record: "2 V · 1 D", difficulty: 40, risk: "Modéré", dateLead: 4 },
  { id: "f-martel", name: "Élodie Martel", nickname: "La Sereine", style: "Contre-attaquant", record: "2 V · 2 D", difficulty: 43, risk: "Relevé", dateLead: 5 },
  { id: "f-gagnon", name: "Marianne Gagnon", nickname: "La Forge", style: "Bagarreur", record: "3 V · 2 D", difficulty: 44, risk: "Relevé", dateLead: 4 },
  { id: "f-nguyen", name: "Linh Nguyen", nickname: "Vif-Argent", style: "Boxeur mobile", record: "3 V · 1 D", difficulty: 42, risk: "Modéré", dateLead: 5 },
  { id: "f-bouchard", name: "Sophie Bouchard", nickname: "Le Mur", style: "Défensif", record: "4 V · 3 D", difficulty: 46, risk: "Relevé", dateLead: 5 },
  { id: "f-haddad", name: "Maya Haddad", nickname: "Le Cobra", style: "Contre-attaquant", record: "3 V · 1 D", difficulty: 45, risk: "Relevé", dateLead: 5 },
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

const tournamentNames = [
  ["Nicolas", "Roy", "Le Marteau"], ["Isaac", "Tremblay", "L’Éclair"], ["Marcus", "Diallo", "L’Architecte"],
  ["Ryan", "McKenna", "North Star"], ["Aleksandar", "Petrov", "Le Métronome"], ["Diego", "Vargas", "El Fuego"],
  ["Noah", "Kim", "Le Fantôme"], ["Lucas", "Moreau", "La Flèche"], ["Amir", "Benali", "Le Roc"],
  ["Mateo", "Silva", "Tempête"], ["Ethan", "Clarke", "Ice"], ["Hugo", "Laroche", "Le Faucon"]
];
const tournamentNamesFemale = [
  ["Jade", "Roy", "Le Marteau"], ["Sarah", "Tremblay", "L’Éclair"], ["Amina", "Diallo", "L’Architecte"],
  ["Olivia", "McKenna", "North Star"], ["Irina", "Petrova", "Le Métronome"], ["Lucía", "Vargas", "Fuego"],
  ["Hana", "Kim", "Le Fantôme"], ["Léa", "Moreau", "La Flèche"], ["Noura", "Benali", "Le Roc"],
  ["Valentina", "Silva", "Tempête"], ["Emma", "Clarke", "Ice"], ["Chloé", "Laroche", "Le Faucon"]
];
const tournamentStyles = ["Pression", "Boxeur mobile", "Contre-attaquant", "Puncheur", "Défensif", "Complet"];

const privateCoaches = [
  { id: "renard", type: "boxing", name: "Luc Renard", nickname: "Le Méthodique", targets: ["technique", "defense"], price: 100, sessions: 4, reward: 1, fatigue: 10, fitness: 3, morale: 1 },
  { id: "morin", type: "boxing", name: "Étienne Morin", nickname: "Le Professeur", targets: ["technique"], price: 125, sessions: 4, reward: 1, fatigue: 9, fitness: 3, morale: 2 },
  { id: "clarke", type: "boxing", name: "Malik Clarke", nickname: "Le Rempart", targets: ["defense"], price: 130, sessions: 4, reward: 1, fatigue: 8, fitness: 3, morale: 2 },
  { id: "diaz", type: "boxing", name: "Sofia Diaz", nickname: "La Pédagogue", targets: ["technique", "defense"], price: 175, sessions: 5, reward: 2, fatigue: 7, fitness: 4, morale: 3 },
  { id: "petrov", type: "boxing", name: "Aleksandar Petrov", nickname: "Le Maître", targets: ["technique", "defense"], price: 310, sessions: 6, reward: 3, fatigue: 6, fitness: 4, morale: 3 },
  { id: "okoro", type: "physical", name: "Emmanuel Okoro", nickname: "Le Préparateur", targets: ["power", "cardio"], price: 110, sessions: 4, reward: 1, fatigue: 7, fitness: 6, morale: 1 },
  { id: "silva", type: "physical", name: "Mateo Silva", nickname: "Explosif", targets: ["power"], price: 135, sessions: 4, reward: 1, fatigue: 9, fitness: 6, morale: 1 },
  { id: "kim", type: "physical", name: "Noah Kim", nickname: "Le Moteur", targets: ["cardio"], price: 135, sessions: 4, reward: 1, fatigue: 7, fitness: 7, morale: 1 },
  { id: "tremblay", type: "physical", name: "Mélanie Tremblay", nickname: "La Science", targets: ["power", "cardio"], price: 185, sessions: 5, reward: 2, fatigue: 6, fitness: 7, morale: 2 },
  { id: "dubois", type: "physical", name: "Victor Dubois", nickname: "Haute Performance", targets: ["power", "cardio"], price: 325, sessions: 6, reward: 3, fatigue: 5, fitness: 8, morale: 2 },
];

const jobs = Object.freeze([
  { id: "convenience", title: "Commis de dépanneur", schedule: "Horaire souple", wage: 75, interviewWeeks: 1, energy: -14, fatigue: 10, morale: -1, injury: 0, detail: "La solution la moins payante, mais la plus facile à concilier avec le camp." },
  { id: "courier", title: "Coursier local", schedule: "Horaire variable", wage: 100, interviewWeeks: 2, energy: -20, fatigue: 16, morale: -3, injury: 1, detail: "Une meilleure paie hebdomadaire avec plus de kilomètres et de fatigue dans les jambes." },
  { id: "office", title: "Employé de bureau", schedule: "Bureau · longues heures", wage: 120, interviewWeeks: 2, energy: -14, fatigue: 7, morale: -2, injury: 0, weekCapacityCost: 30, detail: "Une paie solide et peu de fatigue physique, mais de longues journées de bureau qui occupent une grande partie de la semaine." },
  { id: "warehouse", title: "Manutention de nuit", schedule: "Horaire exigeant", wage: 130, interviewWeeks: 3, energy: -27, fatigue: 23, morale: -5, injury: 3, detail: "La paie hebdomadaire la plus élevée, au prix d’une lourde dépense physique." },
]);

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

const INITIAL_STATE = {
  profile: null,
  combatStats: { technique: BASE_COMBAT_STAT, power: BASE_COMBAT_STAT, cardio: BASE_COMBAT_STAT, defense: BASE_COMBAT_STAT },
  week: 1,
  money: 220,
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
  gymWeeks: 0,
  strengthGymWeeks: 0,
  trainingProgress: { technique: 0, power: 0, cardio: 0, defense: 0 },
  boxingNeglectWeeks: 0,
  boxingInactivityWeeks: 0,
  boxingTrainingWeek: 0,
  trainingRhythmPenalty: 0,
  amateurRecord: { wins: 0, losses: 0, draws: 0 },
  professionalRecord: { wins: 0, losses: 0, draws: 0 },
  careerStatus: "recreational",
  introJobRequired: true,
  initialJobLockedUntilWeek: 0,
  initialGymRequired: true,
  recreationalTrainingWeeks: 0,
  recreationalSparringStatus: "training",
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
    olympic: { bronze: 0, silver: 0, gold: 0 },
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
  v2SupplementState: null,
  v2TrainerState: null,
  v2WeekPlannerState: null,
  progressionState: null,
  levelNotice: null,
  levelAnnouncementPending: false,
  jobLossNotice: null,
  avoidanceWeeks: 0,
  lastFightWeek: 0,
  journal: [],
};

const generalStats = [
  { key: "money", label: "Argent", suffix: " $", max: 500, className: "money" },
  { key: "energy", label: "Énergie", suffix: "%" },
  { key: "fatigue", label: "Fatigue", suffix: "%", className: "fatigue" },
  { key: "fitness", label: "Forme physique", suffix: "%" },
  { key: "morale", label: "Moral", suffix: "%" },
  { key: "reputation", label: "Réputation", suffix: "%", className: "reputation" },
  { key: "injury", label: "Risque de blessure", suffix: "%", className: "injury" },
];

const actionCategories = [
  { id: "training", label: "Préparation et technique", hint: "Développe les qualités qui feront la différence dans le ring." },
  { id: "recovery", label: "Récupération", hint: "Protège ton énergie, ta forme et ton corps." },
  { id: "career", label: "Carrière et finances", hint: "Finance le camp, développe ta réputation et garde le moral." },
];

const betweenWeekEvents = [
  {
    id: "local-radio",
    title: "Le micro est ouvert",
    lead: "Une radio du quartier veut parler de ta progression. Ta réponse changera le début de la nouvelle semaine.",
    choices: [
      { id: "interview", title: "Accepter l’entrevue", detail: "Tu racontes ton parcours avec calme.", effect: "+7 réputation · +2 moral · −6 énergie", changes: { reputation: 7, morale: 2, energy: -6 }, result: "L’entrevue locale fait connaître ton nom sans détourner complètement ton attention du camp." },
      { id: "training", title: "Rester au camp", detail: "Tu laisses parler tes résultats.", effect: "+5 énergie · +2 forme", changes: { energy: 5, fitness: 2 }, result: "Tu déclines l’entrevue et profites du temps gagné pour consolider ta préparation." },
      { id: "challenge", title: "Lancer un défi", detail: "Tu promets un spectacle au prochain combat.", effect: "+10 réputation · +4 moral · +3 risque", changes: { reputation: 10, morale: 4, injury: 3 }, result: "Ta déclaration attire l’attention, mais ajoute un peu de pression au camp." },
    ],
  },
  {
    id: "sore-morning",
    title: "Un réveil difficile",
    lead: "Une douleur tenace apparaît au lendemain de la semaine. Tu dois décider comment commencer la suivante.",
    choices: [
      { id: "physio", title: "Consultation express", detail: "Un traitement rapide, moins complet que la physiothérapie hebdomadaire.", effect: "45 $ · −14 risque · +5 énergie", changes: { money: -45, injury: -14, energy: 5 }, result: "Le traitement rapide calme la douleur avant qu’elle devienne un problème." },
      { id: "slow-down", title: "Lever le pied", detail: "Tu acceptes de perdre un peu de rythme.", effect: "+12 énergie · −6 risque · −2 forme", changes: { energy: 12, injury: -6, fitness: -2 }, result: "Une journée plus douce protège ton corps, au prix d’un peu de forme." },
      { id: "push-through", title: "Maintenir le rythme", detail: "Tu refuses de modifier le programme.", effect: "+6 forme · −10 énergie · +7 risque", changes: { fitness: 6, energy: -10, injury: 7 }, result: "Tu gagnes du rythme, mais la douleur reste dans un coin de ta tête." },
    ],
  },
  {
    id: "community-night",
    title: "Le quartier t’appelle",
    lead: "Le centre communautaire te propose une soirée avec les jeunes boxeurs avant le début de la semaine.",
    choices: [
      { id: "workshop", title: "Donner un atelier", detail: "Tu partages tes premiers apprentissages.", effect: "+7 réputation · +6 moral · −8 énergie", changes: { reputation: 7, morale: 6, energy: -8 }, result: "L’atelier crée un vrai lien avec le quartier et te rappelle pourquoi tu boxes." },
      { id: "extra-shift", title: "Prendre un quart de travail", detail: "Tu profites plutôt de la soirée pour travailler.", effect: "+55 $ · −15 énergie · −3 moral", changes: { money: 55, energy: -15, morale: -3 }, result: "Le compte en banque respire, même si la soirée laisse des traces." },
      { id: "quiet-night", title: "Garder la soirée libre", detail: "Tu coupes le téléphone et récupères.", effect: "+10 énergie · +2 moral", changes: { energy: 10, morale: 2 }, result: "Une soirée calme te permet d’attaquer la semaine avec plus de fraîcheur." },
    ],
  },
  {
    id: "open-sparring",
    title: "Une invitation imprévue",
    lead: "Un autre club ouvre ses portes pour une séance de sparring informelle. Tu peux participer, observer ou récupérer.",
    choices: [
      { id: "join", title: "Monter sur le ring", detail: "De l’expérience réelle, avec les risques qui viennent avec.", effect: "+10 expérience · −12 énergie · +7 risque", changes: { experience: 10, energy: -12, injury: 7 }, result: "Les rounds improvisés donnent de nouveaux repères, mais le corps encaisse." },
      { id: "observe", title: "Observer les rounds", detail: "Tu étudies les réactions sans prendre de coups.", effect: "+8 XP · −3 énergie", changes: { experience: 8, energy: -3 }, result: "L’observation attentive ajoute de l’expérience utile à ton arsenal." },
      { id: "recover", title: "Rester au repos", detail: "Tu privilégies la prochaine semaine.", effect: "+10 énergie · −3 risque", changes: { energy: 10, injury: -3 }, result: "Tu refuses poliment et gardes du carburant pour ton propre programme." },
    ],
  },
  {
    id: "tactical-choice",
    title: "Une idée à travailler",
    lead: "En revoyant tes dernières séances, trois pistes de progression ressortent pour la semaine qui commence.",
    choices: [
      { id: "film", title: "Étudier les angles", detail: "Tu privilégies la lecture et le placement.", effect: "+8 XP · −5 énergie", changes: { experience: 8, energy: -5 }, result: "Le travail d’angles améliore ta lecture du ring et ton expérience." },
      { id: "power", title: "Chercher plus d’impact", detail: "Tu mets l’accent sur l’explosivité.", effect: "+9 XP · −8 énergie · +3 risque", changes: { experience: 9, energy: -8, injury: 3 }, result: "La séance explosive demande un effort, mais enrichit ton expérience." },
      { id: "visualize", title: "Faire de la visualisation", detail: "Tu travailles la confiance et le calme.", effect: "+8 moral · +3 énergie", changes: { morale: 8, energy: 3 }, result: "Quelques minutes de visualisation clarifient ton objectif pour la semaine." },
    ],
  },
];

const recreationalBetweenWeekEvents = [
  {
    id: "rec-gym-routine",
    title: "Les repères du GYM",
    lead: "Tu commences à reconnaître les visages et les habitudes du gym. Une petite décision peut rendre les prochaines séances plus faciles.",
    choices: [
      { id: "arrive-early", title: "Arriver un peu plus tôt", detail: "Tu observes l’échauffement avant le cours.", effect: "+6 XP · −4 énergie", changes: { experience: 6, energy: -4 }, result: "Tu repars avec quelques repères simples sur la garde et le rythme." },
      { id: "keep-fresh", title: "Garder de l’énergie", detail: "Tu rentres tôt pour récupérer.", effect: "+8 énergie · +2 moral", changes: { energy: 8, morale: 2 }, result: "Tu choisis la régularité plutôt que d’en faire trop dès le début." },
      { id: "ask-question", title: "Poser une question au coach", detail: "Tu fais préciser une base qui te bloque.", effect: "+4 XP · +3 moral", changes: { experience: 4, morale: 3 }, result: "Le coach apprécie ta curiosité et reformule le geste simplement." },
    ],
  },
  {
    id: "rec-work-balance",
    title: "Trouver son rythme",
    lead: "Entre ton emploi et le GYM, la première routine se construit. Tu ajustes ton début de semaine.",
    choices: [
      { id: "protect-sleep", title: "Protéger ton sommeil", detail: "Tu refuses de remplir toutes tes soirées.", effect: "+12 énergie · −5 fatigue", changes: { energy: 12, fatigue: -5 }, result: "Tu attaques la semaine moins lourd, même si ton horaire reste simple." },
      { id: "extra-effort", title: "Ajouter un petit effort", detail: "Tu allonges légèrement ton échauffement.", effect: "+5 XP · −7 énergie", changes: { experience: 5, energy: -7 }, result: "Tu gagnes un peu de confiance, sans brûler les étapes." },
      { id: "call-home", title: "Prendre une soirée calme", detail: "Tu gardes du temps pour les proches.", effect: "+7 moral · +4 énergie", changes: { morale: 7, energy: 4 }, result: "Une soirée tranquille remet tes priorités en ordre." },
    ],
  },
  {
    id: "rec-sore-muscles",
    title: "Les premières courbatures",
    lead: "Tes épaules et tes jambes découvrent un rythme nouveau. Tu peux récupérer, bouger doucement ou forcer un peu.",
    choices: [
      { id: "easy-recovery", title: "Récupérer doucement", detail: "Marche, eau et étirements légers.", effect: "+10 énergie · −7 fatigue · −3 risque", changes: { energy: 10, fatigue: -7, injury: -3 }, result: "Tu laisses ton corps assimiler le travail plutôt que de lui demander trop vite." },
      { id: "light-mobility", title: "Faire de la mobilité", detail: "Tu gardes le corps en mouvement.", effect: "+4 XP · +4 énergie · −3 fatigue", changes: { experience: 4, energy: 4, fatigue: -3 }, result: "La séance légère te donne de meilleures sensations sans te vider." },
      { id: "push-on", title: "Passer au travers", detail: "Tu refuses de ralentir dès le départ.", effect: "+7 XP · −10 énergie · +4 risque", changes: { experience: 7, energy: -10, injury: 4 }, result: "Tu accumules de la pratique, mais le corps te rappelle qu’il apprend encore." },
    ],
  },
  {
    id: "rec-coach-tip",
    title: "Un conseil qui reste",
    lead: "Après une séance, le coach résume la boxe avec trois idées simples. Tu choisis celle que tu veux retenir cette semaine.",
    choices: [
      { id: "keep-guard", title: "Garder les mains hautes", detail: "Tu privilégies la sécurité et le calme.", effect: "+5 XP · +3 moral", changes: { experience: 5, morale: 3 }, result: "La phrase devient un réflexe : calme, garde, respiration." },
      { id: "move-feet", title: "Bouger après le jab", detail: "Tu travailles le placement avant la vitesse.", effect: "+6 XP · −4 énergie", changes: { experience: 6, energy: -4 }, result: "Tu observes déjà mieux l’espace autour de toi." },
      { id: "breathe", title: "Respirer et ralentir", detail: "Tu retiens surtout la gestion de l’effort.", effect: "+9 énergie · −4 fatigue", changes: { energy: 9, fatigue: -4 }, result: "Tu comprends qu’un bon rythme se construit aussi en récupérant." },
    ],
  },
];

const allBetweenWeekEvents = [...betweenWeekEvents, ...recreationalBetweenWeekEvents];

function betweenWeekEventsForCurrentCareer() {
  return isRecreationalCareer() ? recreationalBetweenWeekEvents : betweenWeekEvents;
}

function betweenWeekEventById(eventId) {
  return allBetweenWeekEvents.find(event => event.id === eventId);
}

const actions = [
  { id: "gym", category: "training", icon: "T", title: "Travail aux mitaines", detail: "+12 XP · +5 forme · −18 énergie · +12 fatigue", progressStat: "technique", requiresGym: true, changes: { fitness: 5, energy: -18, injury: 3, experience: 12 }, message: "Le travail aux mitaines affine les gestes et les enchaînements." },
  { id: "group-class", category: "training", icon: "G", title: "Cours de groupe", detail: "+10 XP · +4 forme · −15 énergie · +11 fatigue", requiresGym: true, changes: { fitness: 4, energy: -15, injury: 2, experience: 10, morale: 2 }, message: "Le cours de groupe donne des repères simples, du rythme et l’habitude du gym." },
  { id: "home-bag", category: "training", icon: "D", title: "Sac au sous-sol", detail: "+6 XP · +2 forme · −12 énergie · +9 fatigue", changes: { fitness: 2, energy: -12, injury: 1, experience: 6 }, message: "Au sous-sol, le sac permet de garder les gestes de base quand le GYM n’est pas accessible." },
  { id: "private", category: "training", icon: "P", title: "Séance privée", detail: "Programme privé requis", requiresPrivateProgram: true, message: "Un cours privé fait avancer ton programme individuel." },
  { id: "sparring", category: "training", icon: "S", title: "Sparring", detail: "+18 XP · +4 forme · −24 énergie · +22 fatigue · +12 risque", requiresGym: true, changes: { experience: 18, fitness: 4, energy: -24, injury: 12, reputation: 2 }, message: "Les rounds de sparring donnent de l’expérience réelle, mais le corps encaisse." },
  { id: "roadwork", category: "training", icon: "C", title: "Course matinale", detail: "+9 XP · +5 forme · −16 énergie · +14 fatigue", changes: { fitness: 5, energy: -16, injury: 2, experience: 9 }, message: "La course construit la base physique nécessaire aux longs combats." },
  { id: "heavybag", category: "training", icon: "D", title: "Défense et esquives", detail: "+11 XP · +4 forme · −17 énergie · +15 fatigue", progressStat: "defense", requiresGym: true, changes: { fitness: 4, energy: -17, injury: 3, experience: 11 }, message: "Les répétitions défensives améliorent les esquives et les blocages." },
  { id: "video", category: "training", icon: "V", title: "Étude vidéo", detail: "+8 XP · −7 énergie · +1 moral · +4 fatigue", changes: { experience: 8, energy: -7, morale: 1 }, message: "L’étude vidéo affine ta compréhension du ring." },
  { id: "strength-power", category: "training", icon: "M", title: "Musculation", detail: "+10 XP · +5 forme · −18 énergie · +18 fatigue · +5 risque", progressStat: "power", requiresStrengthGym: true, changes: { experience: 10, fitness: 5, energy: -18, injury: 5 }, message: "La musculation construit progressivement une puissance plus utile dans le ring." },
  { id: "strength-circuit", category: "training", icon: "C", title: "Cardio sur appareils", detail: "Rameur, vélo et tapis · +10 XP · +5 forme · −20 énergie · +16 fatigue", progressStat: "cardio", requiresStrengthGym: true, changes: { experience: 10, fitness: 5, energy: -20, injury: 3 }, message: "Le travail sur rameur, vélo et tapis développe l’endurance du boxeur." },
  { id: "rest", category: "recovery", icon: "Z", title: "Repos", detail: "+24 énergie · −20 fatigue · −7 risque · +4 moral", changes: { energy: 24, injury: -7, morale: 4 }, message: "Une vraie journée de repos remet le corps d'aplomb." },
  { id: "eat", category: "recovery", icon: "+", title: "Bien manger", detail: "35 $ · +12 énergie · +4 forme · +2 moral", cost: 35, changes: { money: -35, energy: 12, fitness: 4, morale: 2 }, message: "Un bon repas nourrit la récupération autant que le moral." },
  { id: "physio", category: "recovery", icon: "T", title: "Physiothérapie", detail: "55 $ · −16 risque · +8 énergie · +2 forme · accélère la guérison", cost: 55, changes: { money: -55, injury: -16, injuryWeeks: -1, energy: 8, fitness: 2 }, message: "Le traitement du physiothérapeute calme les douleurs avant qu'elles ne s'installent." },
  { id: "spa", category: "recovery", icon: "R", title: "Spa et récupération", detail: "65 $ · +38 énergie · −20 risque · +6 moral", cost: 65, changes: { money: -65, energy: 38, injury: -20, morale: 6 }, message: "Le protocole de récupération remet le corps et la tête en état." },
  { id: "work", category: "career", icon: "$", title: "Travailler", detail: "Emploi requis · paie hebdomadaire et fatigue selon le poste", requiresJob: true, message: "La semaine de travail paie les factures, mais peut laisser les jambes lourdes." },
  { id: "interview", category: "career", icon: "E", title: "Passer des entrevues", detail: "Candidature requise · −3 énergie · +1 moral", changes: { energy: -3, morale: 1 }, message: "Une entrevue fait avancer la candidature vers un nouvel emploi." },
  { id: "vacation", category: "career", icon: "☼", title: "Vacances payées", detail: "Congé payé · récupération sans perdre ton emploi · hors limite d’actions", requiresJob: true, message: "Une semaine de congé payé protège le corps sans couper le revenu." },
  { id: "promotion", category: "career", icon: "M", title: "Promotion locale", detail: "20 $ · +8 réputation · +3 moral · −10 énergie", cost: 20, changes: { money: -20, reputation: 8, morale: 3, energy: -10 }, message: "Quelques apparitions locales font circuler ton nom dans le quartier." },
  { id: "family", category: "career", icon: "F", title: "Temps avec les proches", detail: "+9 moral · +6 énergie", changes: { morale: 9, energy: 6 }, message: "Une soirée avec les proches remet la carrière en perspective." },
  { id: "sponsor", category: "career", icon: "$+", title: "Petite commandite", detail: "+85 $ · +2 réputation · −12 énergie · −2 moral · délai de 4 semaines", requiresReputation: 30, changes: { money: 85, reputation: 2, morale: -2, energy: -12 }, message: "Une entreprise locale finance une partie du camp en échange d'une apparition promotionnelle." },
  { id: "drug-sales", category: "career", icon: "!", title: "Vente de stupéfiants", detail: "À venir · risques judiciaires et semaines de détention dans une future version", future: true, message: "Cette activité n’est pas encore disponible." },
];

const actionFatigue = { gym: 12, "group-class": 11, "home-bag": 9, private: 10, sparring: 22, roadwork: 14, heavybag: 15, video: 4, "strength-power": 18, "strength-circuit": 16, rest: -20, eat: 2, physio: -10, spa: -25, work: 18, interview: 1, promotion: 6, family: -4, sponsor: 8 };

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

// Diagnostic temporaire : ne change ni l'interface ni les sauvegardes.
window.addEventListener("error", event => {
  console.error("[Boxeur Deux] Erreur JavaScript :", event.error || event.message, event.filename ? `${event.filename}:${event.lineno}` : "");
});
window.addEventListener("unhandledrejection", event => {
  console.error("[Boxeur Deux] Promesse rejetée :", event.reason);
});

let state = cloneData(INITIAL_STATE);
let draftStats = { technique: 0, power: 0, cardio: 0, defense: 0 };
let weeklyPlan = [];
let toastTimer;
let fightState = null;
let sparringRingState = null;
let selectedPrivateCoachId = null;
let draftPortraitId = 0;
let drugSalesTapCount = 0;
let resumeCareerAlertsAfterLevelDialog = false;
let v2PreviewCapsule = null;
let v2ComposerSelection = [];
let v2StrengthSelection = [];
let v2HomeSelection = [];
let v2TrainerTarget = "technique";
let v2PendingTraining = null;
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
    careerStatus: ["professional", "amateur", "recreational", "amateur_pending"].includes(source.careerStatus)
      ? source.careerStatus
      : "amateur",
    // La partie entière reste la statistique affichée. La fraction représente
    // la jauge V2 déjà assimilée et doit survivre aux sauvegardes/imports.
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
    injury: [0, 100], fatigue: [0, 100], injuryWeeks: [0, 52], experience: [0, 10000000], level: [1, 999], levelPoints: [0, 9999],
    gymWeeks: [0, 52], strengthGymWeeks: [0, 52], boxingNeglectWeeks: [0, 3], boxingInactivityWeeks: [0, 999], boxingTrainingWeek: [0, 99999], trainingRhythmPenalty: [0, 2], workStreak: [0, 999], sponsorAvailableWeek: [1, 99999],
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
  normalized.pendingWeekEvent = allBetweenWeekEvents.some(event => event.id === source.pendingWeekEvent) ? source.pendingWeekEvent : null;
  normalized.levelNotice = source.levelNotice ? safeText(source.levelNotice, "", 120) : null;
  normalized.levelAnnouncementPending = Boolean(source.levelAnnouncementPending);
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
    : normalized.careerStatus === "amateur_pending" ? "completed" : "training";
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
  const coach = privateCoaches.find(item => item.id === source.privateProgram?.coachId);
  const target = source.privateProgram?.target;
  normalized.privateProgram = coach && coach.targets.includes(target) ? {
    coachId: coach.id,
    target,
    sessionsCompleted: safeNumber(source.privateProgram.sessionsCompleted, 0, 0, Math.max(0, coach.sessions - 1)),
    firstSessionPaid: Boolean(source.privateProgram.firstSessionPaid),
  } : null;
  normalized.v2SupplementState = window.BoxeurSupplements
    ? window.BoxeurSupplements.createState(source.v2SupplementState || source, { weekKey: normalized.week })
    : source.v2SupplementState && typeof source.v2SupplementState === "object" ? cloneData(source.v2SupplementState) : null;
  normalized.v2TrainerState = window.BoxeurTrainer
    ? window.BoxeurTrainer.createState(source.v2TrainerState || {})
    : source.v2TrainerState && typeof source.v2TrainerState === "object" ? cloneData(source.v2TrainerState) : null;
  try {
    normalized.v2WeekPlannerState = window.BoxeurWeekPlanner && source.v2WeekPlannerState?.kind === window.BoxeurWeekPlanner.STATE_KIND
      ? window.BoxeurWeekPlanner.restorePlanner(source.v2WeekPlannerState)
      : null;
  } catch (error) {
    normalized.v2WeekPlannerState = null;
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
  const steps = level - 2;
  return 100 + steps * 180 + ((steps * (steps - 1)) / 2) * 80;
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
    if (state.journal) state.journal.unshift({ week: state.week, text: `Niveau ${state.level} atteint : trois points de combat sont disponibles.` });
  }
  if (levelsGained && state.profile) {
    const message = levelsGained === 1 ? `Niveau ${state.level} atteint · 3 points à répartir` : `Niveau ${state.level} atteint · ${levelsGained * 3} points à répartir`;
    state.levelNotice = message;
    state.levelAnnouncementPending = true;
  }
}

function applyCareerTheme() {
  document.body.classList.remove(...cornerThemes.filter(theme => theme.id !== "red").map(theme => `theme-${theme.id}`));
  if (state.profile?.corner && state.profile.corner !== "red") document.body.classList.add(`theme-${state.profile.corner}`);
}

function careerSnapshot() {
  return { version: SAVE_VERSION, savedAt: new Date().toISOString(), state: cloneData(state), weeklyPlan: cloneData(weeklyPlan) };
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

function dueGalaBooking() {
  return activeBookings().find(booking => booking.event?.kind === "gala" && booking.event.careerWeek === state.week) || null;
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
            injury: state.injury,
            fitness: state.fitness,
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
  const embedded = normalizeOpponentData(raw.opponent, state.profile.weightClass);
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
  const source = snapshot?.state || snapshot;
  const previousState = state;
  const previousPlan = weeklyPlan;
  try {
    state = normalizeCareerState(source);
    normalizeCompetitionState();
    ensureCareerCalendar();
    syncLevelProgress();
    const seenActions = new Set();
    let restoredCoreActions = 0;
    let restoredVacation = false;
    weeklyPlan = (Array.isArray(snapshot?.weeklyPlan) ? snapshot.weeklyPlan : []).filter(item => {
      const action = actions.find(candidate => candidate.id === item?.actionId);
      if (!action || seenActions.has(action.id)) return false;
      if (action.id === "private" && !state.privateProgram) return false;
      if (action.id === "interview" && !state.jobApplication) return false;
      if (action.id === "work" && seenActions.has("vacation")) return false;
      if (action.id === "vacation" && seenActions.has("work")) return false;
      if (isBonusAction(action)) {
        if (restoredVacation || !vacationStatus().available) return false;
        restoredVacation = true;
      } else {
        if (restoredCoreActions >= weeklyActionLimit()) return false;
        restoredCoreActions += 1;
      }
      seenActions.add(action.id);
      return true;
    });
    fightState = null;
    sparringRingState = null;
    selectedPrivateCoachId = null;
    applyCareerTheme();
  } catch (error) {
    state = previousState;
    weeklyPlan = previousPlan;
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
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Accepte aussi les toutes premières sauvegardes qui stockaient l'état
    // directement à la racine du JSON.
    if (!(parsed?.state?.profile || parsed?.profile)) return null;
    return parsed;
  } catch (error) {
    console.warn("[Boxeur Deux] Sauvegarde locale illisible :", error);
    return null;
  }
}

function exportCareer() {
  if (!state.profile) return showToast("Aucune carrière à exporter.");
  persistCareer();
  const blob = new Blob([JSON.stringify(careerSnapshot(), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `boxeur-deux-${state.profile.lastName || "carriere"}.json`;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast("Carrière exportée");
}

function restoreCareer(snapshot, options = {}) {
  try {
    hydrateCareer(snapshot);
    // Une importation doit reconstruire sa capsule depuis les données qui
    // viennent d'être validées, avant que le premier rendu V2 puisse la lire.
    if (options.invalidateV2 === true) invalidateV2PreviewCapsule();
    render();
    maybeShowDivisionMigration();
    showToast("Carrière restaurée");
    if (state.pendingWeekEvent || state.jobLossNotice || state.levelAnnouncementPending) setTimeout(showCareerAlertOrContinue, 0);
    return true;
  } catch (error) {
    console.error("[Boxeur Deux] Sauvegarde refusée :", error);
    showToast("Fichier de carrière invalide.");
    return false;
  }
}

const developerPresetDefinitions = Object.freeze([
  { id: "recreational-start", label: "Récréatif · départ", detail: "Semaine 1, emploi et premier abonnement déjà réglés." },
  { id: "remy-ready", label: "Récréatif · Rémy prêt", detail: "Semaine 6, cinq entraînements complétés : le sparring est prêt." },
  { id: "amateur-rookie", label: "Amateur · début", detail: "Début de saison, quelques galas et peu de ressources." },
  { id: "bronze-ready", label: "Gants de bronze", detail: "Cinq combats au dossier, semaine précédant les Gants de bronze." },
  { id: "silver-ready", label: "Gants d’argent", detail: "Dix combats au dossier, prêt à vérifier les conditions d’argent." },
  { id: "golden-ready", label: "Gants dorés", detail: "Carrière avancée, budget et statistiques de niveau élevé." },
  { id: "pro-ready", label: "Professionnel · aperçu", detail: "Boxeur déjà passé pro pour tester l’affichage et les couleurs futures." },
  { id: "recovery-case", label: "Test récupération", detail: "Fatigue, blessure légère et banque de vacances active." },
]);

const developerToolDefinitions = Object.freeze([
  { id: "funds", label: "Fonds de test", detail: "Fixe le solde à 9 999 $." },
  { id: "recover", label: "Récupération complète", detail: "Énergie à 100 %, fatigue et blessure à 0." },
  { id: "test-fight", label: "Combat immédiat", detail: "Lance un combat complet comparable, sans modifier la carrière ni le bilan." },
  { id: "test-sparring", label: "Sparring immédiat", detail: "Lance quatre échanges par round, sans gagnant officiel ni effet sur la carrière." },
  { id: "next-week", label: "Semaine suivante", detail: "Avance sans action ni dépense ; indisponible lorsqu’un combat est dû." },
  { id: "v2-reset", label: "Réinitialiser la carte", detail: "Recrée seulement l’état de la carte depuis la carrière actuelle." },
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
    return Boolean(localStorage.getItem(DEV_RETURN_SAVE_KEY));
  } catch {
    return false;
  }
}

function isDeveloperTestActive() {
  try {
    return localStorage.getItem(DEV_TEST_ACTIVE_KEY) === "1";
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
  invalidateV2PreviewCapsule();
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
  if (id === "v2-reset") {
    invalidateV2PreviewCapsule();
    renderV2WorldPreview(Boolean(state.profile));
    showToast("Capsule de test V2 réinitialisée · carrière actuelle intacte");
    return;
  }
  if (id === "funds") {
    state.money = 9999;
    invalidateV2PreviewCapsule();
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
    invalidateV2PreviewCapsule();
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
  weeklyPlan = [];
  endWeek(events);
  state.pendingWeekEvent = null;
  scheduleRecreationalSparring(events);
  state.journal.unshift({ week: skippedWeek, text: "Outil de test : semaine avancée sans action ni dépense." });
  invalidateV2PreviewCapsule();
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
    if (!localStorage.getItem(DEV_TEST_ACTIVE_KEY)) localStorage.setItem(DEV_RETURN_SAVE_KEY, JSON.stringify(careerSnapshot()));
    localStorage.setItem(DEV_TEST_ACTIVE_KEY, "1");
    hydrateCareer(developerPresetSnapshot(id));
    weeklyPlan = [];
    invalidateV2PreviewCapsule();
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
    const raw = localStorage.getItem(DEV_RETURN_SAVE_KEY);
    if (!raw) return showToast("Aucune carrière de retour n’est disponible.");
    hydrateCareer(JSON.parse(raw));
    localStorage.removeItem(DEV_RETURN_SAVE_KEY);
    localStorage.removeItem(DEV_TEST_ACTIVE_KEY);
    weeklyPlan = [];
    invalidateV2PreviewCapsule();
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
  const currentXp = state.experience - currentFloor;
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
  if (!levelNode || !xpProgress || !xpMeter || !points || !buttonLabel || !openButton || !dialogCopy || !choices || !notice) return;
  levelNode.textContent = level;
  xpProgress.textContent = `XP ${currentXp} / ${needed}`;
  xpMeter.style.width = `${clamp((currentXp / needed) * 100)}%`;
  points.textContent = state.levelPoints;
  openButton.disabled = state.levelPoints < 1;
  buttonLabel.textContent = state.levelPoints ? "Répartir ·" : "Points :";
  notice.hidden = !state.levelNotice;
  notice.textContent = state.levelNotice || "";
  dialogCopy.textContent = state.levelPoints ? `${state.levelPoints} point${state.levelPoints > 1 ? "s" : ""} disponible${state.levelPoints > 1 ? "s" : ""}. Chaque point ajoute +1 à une statistique.` : "Les entraînements restent ton moyen principal de progresser. Les points de niveau offrent un petit bonus de spécialisation.";
  choices.innerHTML = Object.entries(combatLabels).map(([key, label]) => `<button class="level-choice" type="button" data-level-stat="${key}" ${state.levelPoints < 1 || state.combatStats[key] >= 99 ? "disabled" : ""}><span>${label}</span><strong>${Math.floor(state.combatStats[key])}</strong><em>+1</em></button>`).join("");
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
  if (state.jobLossNotice) {
    document.querySelector("#job-loss-copy").textContent = state.jobLossNotice;
    document.querySelector("#job-loss-dialog")?.showModal();
    return true;
  }
  if (state.levelAnnouncementPending && state.levelNotice && state.levelPoints > 0) {
    document.querySelector("#level-up-title").textContent = `Niveau ${state.level} atteint`;
    document.querySelector("#level-up-copy").textContent = `${state.levelNotice}. Tes points restent disponibles tant que tu ne les répartis pas.`;
    document.querySelector("#level-up-dialog")?.showModal();
    return true;
  }
  if (state.pendingWeekEvent) showBetweenWeekEvent();
  else continueAfterWeekTransition();
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

function renderFighter() {
  const profile = state.profile;
  renderLevel();
  const nickname = profile.nickname ? ` « ${profile.nickname} »` : "";
  document.querySelector("#fighter-name").textContent = `${profile.firstName}${nickname} ${profile.lastName}`;
  const isProfessional = state.careerStatus === "professional";
  const statusLabel = isProfessional ? "Professionnel" : isAwaitingAmateurTransition() ? "Prêt à passer amateur" : isRecreationalCareer() ? "Récréatif" : "Amateur";
  const campStatus = state.injuryWeeks > 0 ? ` · Blessé (${state.injuryWeeks} sem.)` : state.fatigue >= 75 ? " · Camp épuisé" : state.morale < 25 ? " · Moral fragile" : "";
  const divisionLabel = profile.sex === "female" ? "Division féminine" : "Division masculine";
  document.querySelector("#fighter-meta").textContent = `${weightClassLabel(profile.weightClass, profile.sex)} · ${divisionLabel} · ${styles[profile.style].label} · ${statusLabel}${campStatus}`;
  const portrait = document.querySelector("#fighter-portrait");
  const portraitImage = document.querySelector("#fighter-portrait-image");
  portrait?.style.setProperty("--portrait-index", String(profile.portraitId || 0));
  if (portraitImage) portraitImage.src = portraitAsset(profile.sex);
  portrait?.setAttribute("aria-label", `Portrait de ${profile.firstName}`);
  document.querySelector("#fighter-style-label").textContent = styles[profile.style].label;
  const record = state.amateurRecord;
  const amateurText = `${record.wins} V · ${record.losses} D${record.draws ? ` · ${record.draws} N historique${record.draws > 1 ? "s" : ""}` : ""}`;
  const pro = state.professionalRecord;
  document.querySelector("#career-records").innerHTML = isProfessional ? `Montréal, QC <span class="dot">•</span> Bilan pro : ${pro.wins} V · ${pro.losses} D · ${pro.draws} N <span class="dot">•</span> Bilan amateur final : ${amateurText}` : isRecreationalCareer() || isAwaitingAmateurTransition() ? `Montréal, QC <span class="dot">•</span> Bilan amateur : <span id="amateur-record">À venir</span>` : `Montréal, QC <span class="dot">•</span> Bilan amateur : <span id="amateur-record">${amateurText}</span>`;
  const medalTotals = Object.values(state.medals).reduce((totals, medals) => ({ bronze: totals.bronze + medals.bronze, silver: totals.silver + medals.silver, gold: totals.gold + medals.gold }), { bronze: 0, silver: 0, gold: 0 });
  const medalCount = medalTotals.bronze + medalTotals.silver + medalTotals.gold;
  document.querySelector("#career-medals").innerHTML = `<span>Médailles</span>${medalCount ? `<strong><i class="medal-dot bronze"></i>${medalTotals.bronze}<i class="medal-dot silver"></i>${medalTotals.silver}<i class="medal-dot gold"></i>${medalTotals.gold}</strong>` : "<em>Aucune pour l’instant</em>"}`;
  document.querySelector("#combat-stats").innerHTML = Object.entries(combatLabels).map(([key, label]) => `<div class="combat-stat"><span>${label}</span><strong>${Math.floor(state.combatStats[key])}</strong></div>`).join("");
  const nextFight = document.querySelector("#fighter-next-fight");
  const opponent = scheduledOpponent();
  if (opponent && state.scheduledFight) {
    const timing = state.week >= state.scheduledFight.week ? "Maintenant" : `Semaine ${state.scheduledFight.week}`;
    nextFight.className = `fighter-next-fight${state.week >= state.scheduledFight.week ? " due" : ""}`;
    nextFight.textContent = `Prochain combat · ${timing} · ${opponent.name}`;
  } else if (state.activeTournament && state.activeTournament.status !== "completed") {
    const tournament = tournamentDefs.find(item => item.id === state.activeTournament.id);
    nextFight.className = "fighter-next-fight";
    nextFight.textContent = `Prochaine compétition · ${state.activeTournament.name || tournament?.name || "Tournoi"} · semaine ${state.activeTournament.startWeek}`;
  } else if (isAwaitingAmateurTransition()) {
    nextFight.className = "fighter-next-fight due";
    nextFight.textContent = "Étape suivante · passer amateur";
  } else {
    nextFight.className = "fighter-next-fight empty";
    nextFight.textContent = "Aucun combat programmé";
  }
}

function openProfileEditor() {
  if (!state.profile) return;
  document.querySelector("#edit-first-name").value = state.profile.firstName;
  document.querySelector("#edit-last-name").value = state.profile.lastName;
  document.querySelector("#edit-nickname").value = state.profile.nickname;
  const weightSelect = document.querySelector("#edit-weight-class");
  document.querySelector("#edit-sex-label").value = state.profile.sex === "female" ? "Féminine" : "Masculine";
  renderWeightOptions(weightSelect, state.profile.sex, state.profile.weightClass);
  weightSelect.disabled = Boolean(state.scheduledFight || state.activeTournament);
  document.querySelector("#edit-portrait").value = String(state.profile.portraitId || 0);
  const cornerSelect = document.querySelector("#edit-corner");
  cornerSelect.querySelector("option[data-test-corner]")?.remove();
  if (!cornerSelect.querySelector(`option[value="${state.profile.corner}"]`)) {
    const option = new Option(`Coin ${cornerLabel(state.profile.corner)} · test`, state.profile.corner);
    option.dataset.testCorner = "true";
    cornerSelect.add(option);
  }
  cornerSelect.value = state.profile.corner;
  document.querySelector("#profile-edit-note").textContent = weightSelect.disabled ? "La catégorie est verrouillée pendant un combat ou un tournoi programmé. Le style de base reste inchangé." : "Le style de base et ses points restent inchangés.";
  document.querySelector("#profile-dialog").showModal();
}

function saveProfileEdits(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity() || !state.profile) return;
  state.profile.firstName = document.querySelector("#edit-first-name").value.trim();
  state.profile.lastName = document.querySelector("#edit-last-name").value.trim();
  state.profile.nickname = document.querySelector("#edit-nickname").value.trim();
  if (!document.querySelector("#edit-weight-class").disabled) {
    const nextWeightClass = document.querySelector("#edit-weight-class").value;
    if (nextWeightClass !== state.profile.weightClass) {
      state.profile.weightClass = nextWeightClass;
      const category = weightClassDefinition(nextWeightClass, state.profile.sex);
      state.currentWeightKg = defaultCompetitionWeight(category);
    }
  }
  state.profile.portraitId = safeNumber(document.querySelector("#edit-portrait").value, 0, 0, 2);
  state.profile.corner = isCornerTheme(document.querySelector("#edit-corner").value) ? document.querySelector("#edit-corner").value : "red";
  applyCareerTheme();
  document.querySelector("#profile-dialog").close();
  render();
  showToast("Profil mis à jour");
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
  const avoidancePenalty = state.avoidanceWeeks >= 3 ? Math.min(2, Math.floor(state.avoidanceWeeks / 3)) : 0;
  return clamp(Math.round(4 + (difficulty - playerCombatStrength()) * .75) - avoidancePenalty, 2, 12);
}

function opponentExperienceReward(difficulty) {
  return clamp(Math.round(18 + (difficulty - playerCombatStrength()) * .9), 14, 26);
}

function weeklyActionLimit() {
  const base = amateurFightCount() >= 10 ? 4 : 3;
  if (state.activeTournament && state.activeTournament.status !== "completed" && state.week >= state.activeTournament.startWeek) return 0;
  const galaDue = Boolean(state.scheduledFight && !state.scheduledFight.tournamentId && state.week >= state.scheduledFight.week);
  const available = Math.max(0, base - (galaDue ? 1 : 0));
  return hasWeakBoxingRhythm() ? Math.min(1, available) : available;
}

function isCompetitiveCareer() {
  return state.careerStatus === "amateur" || state.careerStatus === "professional";
}

function hasWeakBoxingRhythm() {
  return isCompetitiveCareer() && state.boxingInactivityWeeks >= 3;
}

const boxingTrainingActionIds = new Set(["gym", "group-class", "home-bag", "sparring", "heavybag"]);
const lowFitnessAllowedActionIds = new Set(["gym", "group-class", "home-bag", "roadwork", "video"]);
const progressiveReturnActionIds = new Set(["gym", "group-class", "home-bag", "roadwork"]);

function isProgressiveReturn(action) {
  return Boolean(action && state.fitness < 18 && progressiveReturnActionIds.has(action.id));
}

function actionDisplayDetail(action) {
  if (action?.id === "interview" && state.jobApplication) {
    const job = jobs.find(item => item.id === state.jobApplication.jobId);
    return `${job?.title || "Candidature"} · ${state.jobApplication.progress}/${state.jobApplication.requiredWeeks} entrevue${state.jobApplication.requiredWeeks > 1 ? "s" : ""} · −3 énergie · +1 moral`;
  }
  if (!isProgressiveReturn(action)) return action.detail;
  const label = action.id === "roadwork" ? "Footing léger" : "Reprise progressive";
  return `${label} · intensité réduite · +${Math.max(4, action.changes?.fitness || 0)} forme · peu de risque · progression de statistique suspendue`;
}

function planHasBoxingTraining(privateCoach = null) {
  return weeklyPlan.some(item => boxingTrainingActionIds.has(item.actionId)) || privateCoach?.type === "boxing";
}

function recordBoxingTrainingForWeek(week, privateCoach = null) {
  if (isCompetitiveCareer() && planHasBoxingTraining(privateCoach)) state.boxingTrainingWeek = week;
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

function weeklyOpponentOffers() {
  const pool = opponentPool();
  const count = amateurFightCount();
  if (count === 0 && state.week === 1) {
    return [buildLocalOpponent(pool[1], -1, 0), buildLocalOpponent(pool[0], -4, 1), buildLocalOpponent(pool[2], 2, 2)];
  }
  const start = ((state.week - 1) * 2 + count) % pool.length;
  const templates = [start, (start + 3) % pool.length, (start + 7) % pool.length].map(index => pool[index]);
  return templates.map((template, index) => buildLocalOpponent(template, [-4, -1, 2][index], index));
}

function offeredFightWeek(opponent) {
  return Math.max(4, state.week + opponent.dateLead);
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
  if (state.injuryWeeks > 0 || state.injury >= 45) return "Conseil du coach : ton état physique compte plus que l’inscription; récupère avant de te décider.";
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
  const stageBonus = { bronze: -2, silver: -1, golden: 0, canadian: -1, olympic: 0 }[tournament.id] ?? 0;
  const roundStep = { bronze: 2, silver: 2, golden: 2, canadian: 1.5, olympic: 1.5 }[tournament.id] || 2;
  const playerRating = playerCombatStrength();
  return Array.from({ length: tournament.rounds }, (_, round) => {
    const identity = names[(seed + round * 3) % names.length];
    const rating = clamp(Math.round(playerRating + stageBonus + round * roundStep), 32, 98);
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
  applyChanges({ reputation: medal === "gold" ? 15 : medal ? 9 : 3, experience: medal === "gold" ? 20 : 12, morale: medal ? 8 : -4 });
  active.status = "completed";
  active.medal = medal;
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
    injury: state.injury,
    fitness: state.fitness,
    cardio: state.combatStats.cardio,
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
      medical: { knockedOut: fight.result?.method === "KO" && fight.result?.winner === "opponent", acuteInjury: fight.fighters.player.head >= 82 },
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

function professionalEligibility() {
  const count = amateurFightCount();
  if (state.olympicCompleted) return { eligible: true, reason: "Parcours olympique terminé" };
  if (state.goldenPlacement && state.goldenPlacement <= 3) return { eligible: true, reason: `Podium aux Gants dorés · ${state.goldenPlacement}${state.goldenPlacement === 1 ? "re" : "e"} place` };
  if (count >= 20) return { eligible: true, reason: `${count} combats amateurs disputés` };
  return { eligible: false, reason: `Termine un parcours majeur ou dispute encore ${20 - count} combat${20 - count > 1 ? "s" : ""}` };
}

function nextTournamentEvent() {
  const currentDate = careerWeekDate(0);
  return state.calendar?.events?.find(event => event.kind === "tournament" && event.endDate >= currentDate) || null;
}

function renderCalendarLaunch() {
  const copy = document.querySelector("#calendar-launch-copy");
  const summary = document.querySelector("#calendar-summary");
  const button = document.querySelector("#open-calendar");
  if (!copy || !summary || !button) return;
  if (isAwaitingAmateurTransition()) {
    copy.textContent = "Le sparring d’évaluation est terminé. Confirme le passage au circuit amateur pour continuer.";
    summary.className = "membership-status active";
    summary.innerHTML = "<strong>Prêt à passer amateur</strong>Le calendrier s’ouvrira dès ta confirmation";
    button.textContent = "Passer amateur";
    return;
  }
  if (isRecreationalCareer()) {
    const sparringCompleted = state.recreationalSparringStatus === "completed";
    const sparringDue = Boolean(state.scheduledFight?.isRecreationalSparring && state.week >= state.scheduledFight.week);
    const remainingWeeks = Math.max(0, RECREATIONAL_SPARRING_WEEK - state.week);
    if (sparringCompleted) {
      copy.textContent = state.week >= RECREATIONAL_MAX_WEEK
        ? "Le parcours récréatif se termine ici. Confirme le passage amateur pour poursuivre la carrière."
        : "Rémy a terminé son évaluation. Tu peux passer amateur maintenant ou continuer à apprendre jusqu’à la semaine 10.";
      summary.className = "membership-status active";
      summary.innerHTML = `<strong>Passage amateur disponible</strong>${state.week >= RECREATIONAL_MAX_WEEK ? "Semaine 10 atteinte" : `Encore ${RECREATIONAL_MAX_WEEK - state.week} semaine${RECREATIONAL_MAX_WEEK - state.week > 1 ? "s" : ""} récréative${RECREATIONAL_MAX_WEEK - state.week > 1 ? "s" : ""} possibles`}`;
      button.textContent = "Passer amateur";
    } else {
      copy.textContent = `Rémy « Le Tank » t’attend pour un sparring d’évaluation en semaine ${RECREATIONAL_SPARRING_WEEK}. Les cours de groupe et le GYM te préparent sans obligation de remplir dix semaines.`;
      summary.className = `membership-status${sparringDue ? " active" : ""}`;
      summary.innerHTML = sparringDue
        ? `<strong>Sparring disponible</strong>Rémy « Le Tank » est prêt au GYM`
        : `<strong>${state.recreationalTrainingWeeks} / 10 entraînements au GYM</strong>Rémy arrive dans ${remainingWeeks || 1} semaine${remainingWeeks === 1 ? "" : "s"}`;
      button.textContent = sparringDue ? "Voir le sparring" : "Voir le parcours";
    }
    return;
  }
  const tournament = nextTournamentEvent();
  copy.textContent = "Galas et tournois annoncés à l’avance. Choisis une seule date lorsqu’ils se chevauchent.";
  summary.className = "membership-status active";
  summary.innerHTML = tournament
    ? `<strong>Prochain tournoi</strong>${escapeHTML(tournament.name)} · ${formatCareerDate(tournament.startDate)}`
    : "<strong>Calendrier actif</strong>Les prochains galas arrivent bientôt";
  button.textContent = "Choisir un combat";
}

function renderRecreationalCalendar(path, scheduled, calendarContainer, tournamentsContainer, activeTournamentContainer, proTransition, amateurTransition) {
  const sparringCompleted = state.recreationalSparringStatus === "completed";
  const isSparringDue = Boolean(state.scheduledFight?.isRecreationalSparring && state.week >= state.scheduledFight.week);
  document.querySelector("#calendar-dialog-eyebrow").textContent = "Parcours récréatif";
  document.querySelector("#calendar-title").textContent = "Vers le premier combat";
  document.querySelector("#calendar-date-label").textContent = `${formatCareerDate(careerWeekDate(0))} · semaine ${state.week}`;
  document.querySelector("#amateur-fight-count").textContent = "Bilan amateur à venir";
  document.querySelector("#calendar-dialog-lead").textContent = sparringCompleted
    ? "Le calendrier compétitif est prêt : tu peux encore rester récréatif jusqu’à la semaine 10 ou confirmer ton passage amateur."
    : `Rémy « Le Tank » évalue tes bases en semaine ${RECREATIONAL_SPARRING_WEEK}.`;
  path.hidden = false;
  path.innerHTML = `<div><p class="eyebrow">Parcours des bases</p><strong>Rémy « Le Tank »</strong><p>${sparringCompleted ? "L’évaluation est terminée. Le coach te laisse continuer à apprendre tranquillement avant de passer amateur." : `Construis tes repères : ${state.recreationalTrainingWeeks}/10 entraînements au GYM complétés. Le sparring arrive en semaine ${RECREATIONAL_SPARRING_WEEK}, pas après dix semaines obligatoires.`}</p><div class="countdown-meter"><span style="width:${Math.min(RECREATIONAL_MAX_WEEK, state.week) * 10}%"></span></div></div><ul><li>Semaines 1 à 5 : emploi, premier abonnement et bases</li><li>Semaine 6 : sparring d’évaluation avec Rémy</li><li>Semaines 7 à 10 : choix de continuer ou de passer amateur</li></ul>`;
  if (state.scheduledFight?.isRecreationalSparring) {
    const opponent = scheduledOpponent();
    scheduled.innerHTML = `<div class="fight-notice"><div><p class="eyebrow">Sparring d’évaluation · GYM de boxe</p><strong>${escapeHTML(opponent.name)} « ${escapeHTML(opponent.nickname)} »</strong><p>${isSparringDue ? "Rémy est prêt. Trois rounds courts pour montrer tes bases; ce sparring ne comptera pas au bilan amateur." : `Prévu à la semaine ${state.scheduledFight.week}. Continue ta préparation.`}</p></div>${isSparringDue ? `<div class="fight-notice-actions"><button id="start-fight" class="primary-button" type="button">Entrer dans le ring</button></div>` : ""}</div>`;
  } else {
    scheduled.innerHTML = "";
  }
  calendarContainer.innerHTML = "";
  tournamentsContainer.innerHTML = "";
  activeTournamentContainer.innerHTML = "";
  proTransition.innerHTML = "";
  amateurTransition.hidden = !sparringCompleted;
  amateurTransition.innerHTML = sparringCompleted ? `<div><strong>Passer amateur</strong><p>${state.week >= RECREATIONAL_MAX_WEEK ? "La période récréative est terminée : confirme le passage pour poursuivre." : "Tu peux confirmer maintenant, ou garder le statut récréatif jusqu’à la semaine 10."}</p></div><button id="turn-amateur" class="primary-button" type="button">Passer amateur</button>` : "";
}

function renderAmateurTransition(path, scheduled, calendarContainer, tournamentsContainer, activeTournamentContainer, proTransition, amateurTransition) {
  document.querySelector("#calendar-dialog-eyebrow").textContent = "Dernière étape";
  document.querySelector("#calendar-title").textContent = "Ton premier statut amateur";
  document.querySelector("#calendar-date-label").textContent = `${formatCareerDate(careerWeekDate(0))} · transition prête`;
  document.querySelector("#amateur-fight-count").textContent = "Bilan amateur : 0 combat";
  document.querySelector("#calendar-dialog-lead").textContent = "Le sparring avec Rémy « Le Tank » est terminé. Cette décision ouvre officiellement ton calendrier amateur.";
  path.hidden = false;
  path.innerHTML = `<div><p class="eyebrow">Évaluation complétée</p><strong>Rémy « Le Tank » a donné son feu vert.</strong><p>Appuie sur « Passer amateur » pour commencer une nouvelle semaine 1 et faire apparaître les galas et tournois.</p></div>`;
  scheduled.innerHTML = "";
  calendarContainer.innerHTML = "";
  tournamentsContainer.innerHTML = "";
  activeTournamentContainer.innerHTML = "";
  proTransition.innerHTML = "";
  amateurTransition.hidden = false;
  amateurTransition.innerHTML = `<div><strong>Passer amateur</strong><p>Cette confirmation débloque les galas, les tournois et le calendrier compétitif.</p></div><button id="turn-amateur" class="primary-button" type="button">Passer amateur</button>`;
}

function renderFights() {
  ensureCareerCalendar();
  ensureDueTournamentActive();
  scheduleRecreationalSparring();
  renderCalendarLaunch();
  const scheduled = document.querySelector("#scheduled-fight");
  const calendarContainer = document.querySelector("#calendar-events");
  const tournamentsContainer = document.querySelector("#tournaments");
  const activeTournamentContainer = document.querySelector("#active-tournament");
  const proTransition = document.querySelector("#pro-transition");
  const amateurTransition = document.querySelector("#amateur-transition");
  const recreationalPath = document.querySelector("#recreational-path");
  const avoidanceWarning = document.querySelector("#fight-avoidance-warning");
  const fightCount = amateurFightCount();
  if (avoidanceWarning) {
    avoidanceWarning.hidden = state.avoidanceWeeks < 3;
    avoidanceWarning.textContent = state.avoidanceWeeks >= 6 ? "Avertissement du coach : les offres deviennent moins ambitieuses tant que tu évites les combats." : state.avoidanceWeeks >= 3 ? `Tu n’as pas combattu depuis ${state.avoidanceWeeks} semaines : ta réputation commence à baisser.` : "";
  }
  document.querySelector("#amateur-fight-count").textContent = `${fightCount} combat${fightCount > 1 ? "s" : ""} disputé${fightCount > 1 ? "s" : ""}`;

  if (isAwaitingAmateurTransition()) {
    if (avoidanceWarning) avoidanceWarning.hidden = true;
    renderAmateurTransition(recreationalPath, scheduled, calendarContainer, tournamentsContainer, activeTournamentContainer, proTransition, amateurTransition);
    return;
  }

  if (isRecreationalCareer()) {
    if (avoidanceWarning) avoidanceWarning.hidden = true;
    renderRecreationalCalendar(recreationalPath, scheduled, calendarContainer, tournamentsContainer, activeTournamentContainer, proTransition, amateurTransition);
    return;
  }

  recreationalPath.hidden = true;
  amateurTransition.hidden = true;
  document.querySelector("#calendar-dialog-eyebrow").textContent = "Saison amateur";
  document.querySelector("#calendar-title").textContent = "Calendrier des galas et tournois";
  document.querySelector("#calendar-dialog-lead").textContent = "Les événements sont annoncés quelques semaines à l’avance. Lorsqu’ils ont lieu le même soir, il faut choisir.";

  if (state.careerStatus === "professional") {
    scheduled.innerHTML = "";
    calendarContainer.innerHTML = '<div class="amateur-closed"><strong>Circuit amateur fermé</strong><p>La carrière professionnelle a commencé. Le bilan amateur est désormais définitif.</p></div>';
    activeTournamentContainer.innerHTML = "";
    tournamentsContainer.innerHTML = "";
    proTransition.innerHTML = "";
    return;
  }

  if (state.scheduledFight) {
    const opponent = scheduledOpponent();
    const isFightWeek = state.week >= state.scheduledFight.week;
    const eventName = state.scheduledFight.tournamentId ? state.scheduledFight.event?.name || tournamentDefs.find(item => item.id === state.scheduledFight.tournamentId)?.name || "Tournoi amateur" : "Combat local";
    const withdrawLabel = state.scheduledFight.tournamentId ? "Abandonner le tournoi" : "Se désister";
    scheduled.innerHTML = `<div class="fight-notice"><div><p class="eyebrow">Prochain combat programmé · ${eventName}</p><strong>${escapeHTML(opponent.name)} « ${escapeHTML(opponent.nickname)} »</strong><p>${isFightWeek ? `Le combat occupe une action : prépare d’abord jusqu’à ${weeklyActionLimit()} action${weeklyActionLimit() > 1 ? "s" : ""}, puis entre dans le ring.` : `Prévu pour la semaine ${state.scheduledFight.week}. Continue ta préparation.`}</p></div>${isFightWeek ? `<div class="fight-notice-actions"><button id="withdraw-fight" class="secondary-button withdraw-button" type="button">${withdrawLabel}</button><button id="start-fight" class="primary-button" type="button">Préparation terminée · combattre</button></div>` : ""}</div>`;
  } else {
    scheduled.innerHTML = "";
  }

  const weekStart = careerWeekDate(0);
  const weekEnd = BoxeurCalendar.dateForCareerWeek(state.calendar.epoch, state.week + 5, 6);
  const currentEvents = state.calendar.events.filter(event => event.endDate >= weekStart && event.startDate <= weekEnd);
  const grouped = BoxeurCalendar.groupEventsByDate(currentEvents);
  const formatDate = value => new Intl.DateTimeFormat("fr-CA", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`));
  document.querySelector("#calendar-date-label").textContent = `${formatDate(weekStart)} · 6 semaines annoncées`;
  calendarContainer.innerHTML = Object.entries(grouped).sort(([left], [right]) => left.localeCompare(right)).map(([date, events]) => {
    const eventCards = events.map(event => {
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
      const slots = event.opponentSlots || [];
      const travel = BoxeurCalendar.travelOptionsForEvent(event)[0];
      const quote = BoxeurCalendar.quoteEventCost(event, travel?.id || "none");
      const buttons = booked
        ? `<button class="secondary-button" type="button" disabled>Combat réservé</button>`
        : slots.map((slot, index) => {
          const candidate = opponentForGala(event, index);
          return `<button class="secondary-button calendar-opponent-choice" type="button" data-book-gala="${event.id}" data-slot="${index}"><strong>${escapeHTML(candidate.name)} « ${escapeHTML(candidate.nickname)} »</strong><span>${escapeHTML(candidate.style)} · ${escapeHTML(candidate.record)} · difficulté ${opponentDifficulty(candidate)}</span><em>${escapeHTML(slot.label)}${quote.total ? ` · ${quote.total} $` : " · gratuit"}</em></button>`;
        }).join("");
      const advantage = event.homeAdvantage ? " · légère aide du coin à domicile" : "";
      return `<article class="calendar-event ${eventClass}${booked ? " booked" : ""}"><div class="calendar-event-head"><span class="calendar-event-type">${type}</span><span class="calendar-event-badge">3 juges</span></div><h3>${escapeHTML(event.name)}</h3><p>${venue}${advantage}. Aucune pesée à gérer.</p><div class="calendar-event-meta"><span>${weightClassLabel(state.profile.weightClass, state.profile.sex)}</span><span>${event.scope === "regional" ? "Transport et hébergement requis" : "Aucuns frais"}</span><span>Vendredi ou samedi</span></div><div class="calendar-event-actions">${buttons}</div></article>`;
    }).join("");
    const eventWeek = safeNumber(events[0]?.careerWeek, state.week, 1, 99999);
    const weeksAway = eventWeek - state.week;
    const relativeWeek = weeksAway <= 0 ? "cette semaine" : weeksAway === 1 ? "dans 1 semaine" : `dans ${weeksAway} semaines`;
    return `<section class="calendar-date-group"><div class="calendar-date"><strong>${escapeHTML(formatDate(date))}</strong><span class="calendar-week-reference">Semaine ${eventWeek} · ${relativeWeek}</span><span>${events.length} événement${events.length > 1 ? "s" : ""}</span></div><div class="calendar-day-events">${eventCards}</div></section>`;
  }).join("") || '<div class="amateur-closed"><strong>Aucun événement annoncé</strong><p>Le calendrier sera prolongé à la prochaine semaine.</p></div>';

  if (fightCount > 5 && state.tournaments.bronze === "pending") state.tournaments.bronze = "missed";
  if (fightCount > 10 && state.tournaments.silver === "pending") state.tournaments.silver = "missed";
  if (state.activeTournament) {
    const active = state.activeTournament;
    const tournament = tournamentDefs.find(item => item.id === active.id);
    const tournamentName = active.name || tournament?.name || "Tournoi extérieur";
    const remaining = Math.max(0, active.startWeek - state.week);
    const progress = Math.round(((TOURNAMENT_PREP_WEEKS - remaining) / TOURNAMENT_PREP_WEEKS) * 100);
    activeTournamentContainer.innerHTML = active.status === "completed" ? `<div class="tournament-countdown ready"><div><p class="eyebrow">Parcours terminé</p><strong>${escapeHTML(active.summary)}</strong></div><button class="secondary-button" type="button" data-open-tournament>Voir le tableau final</button></div>` : remaining > 0 ? `<div class="tournament-countdown"><div><p class="eyebrow">Inscription confirmée · ${escapeHTML(tournamentName)}</p><strong>Début dans ${remaining} semaine${remaining > 1 ? "s" : ""}</strong><p>Semaine ${active.startWeek} · ${tournament?.participants || active.opponents?.length || 8} participants · ${tournament?.rounds || active.opponents?.length || 3} combats à gagner</p><div class="countdown-meter"><span style="width:${progress}%"></span></div></div><button class="secondary-button" type="button" data-open-tournament>Voir le tableau</button></div>` : `<div class="tournament-countdown ready"><div><p class="eyebrow">Le tournoi commence</p><strong>${escapeHTML(tournamentName)}</strong><p>${tournament?.participants || active.opponents?.length || 8} participants · prochain tour : ${roundName(tournament?.rounds || active.opponents?.length || 3, active.currentRound)}</p></div><button class="primary-button" type="button" data-open-tournament>Ouvrir le tableau</button></div>`;
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

  const pro = professionalEligibility();
  const blocked = Boolean(state.scheduledFight || state.activeTournament);
  proTransition.innerHTML = `<div><strong>Passer professionnel</strong><p>${pro.reason}${blocked && pro.eligible ? " · Termine ou annule d’abord le combat programmé." : ""}</p></div><button id="turn-pro" class="primary-button" type="button" ${!pro.eligible || blocked ? "disabled" : ""}>Passer professionnel</button>`;
}

function projectedMoney() {
  return state.money + weeklyPlan.reduce((total, item) => {
    return total + (actionChangesFor(item).money || 0);
  }, 0);
}

function currentJob() {
  return jobs.find(job => job.id === state.jobId) || null;
}

function initialGymReserve() {
  return state.initialGymRequired && state.gymWeeks === 0 ? GYM_PRICE : 0;
}

function spendableMoney() {
  return Math.max(0, state.money - initialGymReserve());
}

function protectedBudgetLock(cost) {
  const reserve = initialGymReserve();
  if (!reserve || spendableMoney() >= cost) return "";
  return `${reserve} $ restent réservés pour le premier mois du GYM de boxe`;
}

function vacationStatus() {
  const job = currentJob();
  if (!job) return { available: false, reason: "Un emploi est requis pour obtenir des vacances payées" };
  if (state.vacationBankWeeks > 0) {
    return { available: true, reason: `${state.vacationBankWeeks}/${MAX_PAID_VACATION_WEEKS} semaine${state.vacationBankWeeks > 1 ? "s" : ""} en banque · ne compte pas comme action` };
  }
  const requiredTenure = state.jobVacationEarnedAtTenure
    ? state.jobVacationEarnedAtTenure + PAID_VACATION_INTERVAL_WEEKS
    : FIRST_PAID_VACATION_WEEKS;
  const remaining = Math.max(0, requiredTenure - state.jobTenureWeeks);
  return {
    available: false,
    requiredTenure,
    remaining,
    reason: remaining ? `Prochaine semaine de vacances dans ${remaining} semaine${remaining > 1 ? "s" : ""}` : "La prochaine semaine de vacances sera créditée à la fin de la semaine",
  };
}

function isBonusAction(action) {
  return action?.id === "vacation";
}

function plannedCoreActionCount() {
  return weeklyPlan.filter(item => !isBonusAction(actions.find(action => action.id === item.actionId))).length;
}

function isRecreationalCareer() {
  return state.careerStatus === "recreational";
}

function isAwaitingAmateurTransition() {
  return state.careerStatus === "amateur_pending";
}

function canPassAmateurCareer() {
  return isAwaitingAmateurTransition() || (isRecreationalCareer() && state.recreationalSparringStatus === "completed");
}

function isRecreationalLimitReached() {
  return isRecreationalCareer() && state.recreationalSparringStatus === "completed" && state.week >= RECREATIONAL_MAX_WEEK;
}

function actionIsVisibleForCareer(action) {
  if (!action) return false;
  if (action.id === "interview" && !state.jobApplication) return false;
  if (isAwaitingAmateurTransition()) return false;
  if (isRecreationalLimitReached()) return false;
  if (!isRecreationalCareer()) return action.id !== "group-class";
  const recreationalActions = ["gym", "group-class", "home-bag", "rest", "work", "vacation", "interview", "drug-sales"];
  if (state.strengthGymWeeks > 0) recreationalActions.push("strength-power", "strength-circuit");
  return recreationalActions.includes(action.id);
}

function actionRequirementLock(action) {
  if (!action) return "Action inconnue";
  if (!actionIsVisibleForCareer(action)) return isAwaitingAmateurTransition() ? "Passe amateur pour reprendre la carrière" : "Cette action n’est pas disponible à ce statut";
  if (action.future && action.id !== "drug-sales") return "Bientôt disponible";
  if (action.id === "drug-sales") return "";
  if (action.id === "work" && !currentJob()) return "Choisis d’abord un emploi dans le panneau Emploi";
  if (action.id === "interview") {
    if (!state.jobApplication) return "Choisis d’abord un emploi visé dans le panneau Emploi";
    if (state.jobApplication.offerReady) return "Offre confirmée : le poste commencera la semaine prochaine";
  }
  if (action.id === "vacation") {
    if (state.activeTournament && state.activeTournament.status !== "completed" && state.week >= state.activeTournament.startWeek) return "Indisponible pendant un tournoi";
    const vacation = vacationStatus();
    if (!vacation.available) return vacation.reason;
  }
  if (action.requiresPrivateProgram && !state.privateProgram) return "Commence un programme avec un coach";
  if (action.id === "private") {
    const coach = privateCoaches.find(item => item.id === state.privateProgram?.coachId);
    if (coach?.type === "physical" && state.strengthGymWeeks === 0) return "Abonnement au gym de musculation requis";
  }
  if (state.injuryWeeks > 0 && action.category === "training") return `Blessé · récupération obligatoire (${state.injuryWeeks} sem.)`;
  if (state.injuryWeeks > 0 && action.id === "work") return `Blessé · impossible de travailler (${state.injuryWeeks} sem.)`;
  if (action.requiresGym && state.gymWeeks === 0) return "Abonnement au GYM de boxe requis";
  if (action.requiresStrengthGym && state.strengthGymWeeks === 0) return "Abonnement au gym de musculation requis";
  if (action.requiresReputation && state.reputation < action.requiresReputation) return `Réputation ${action.requiresReputation} requise`;
  if (action.id === "sponsor" && state.week < state.sponsorAvailableWeek) {
    const remaining = state.sponsorAvailableWeek - state.week;
    return `Nouvelle commandite dans ${remaining} semaine${remaining > 1 ? "s" : ""}`;
  }
  return "";
}

function actionConditionLock(action) {
  const job = action.id === "work" ? currentJob() : null;
  if (action.id === "work" && state.energy < Math.max(30, Math.abs(job?.energy || 0) + 8)) return "Énergie insuffisante pour assurer cette semaine de travail";
  if (action.id === "work" && state.fatigue >= 75) return "Fatigue trop élevée : repose-toi avant de retravailler";
  if (action.id === "rest" && !restRecoveryIsNeeded()) return "Repos inutile : ton boxeur est déjà frais et intact";
  if (action.category === "training" && state.energy < 28) return "Énergie trop basse pour bien t’entraîner";
  if (action.category === "training" && state.fitness < 18 && !lowFitnessAllowedActionIds.has(action.id)) return "Forme trop basse : choisis une reprise progressive avant cette séance intensive";
  if (action.category === "training" && state.morale < 25) return "Moral trop bas : le camp ne peut pas être productif";
  if (action.category === "training" && state.fatigue >= 75) return "Fatigue trop élevée : récupère avant l’entraînement";
  if (actionFatigue[action.id] >= 17 && state.fatigue >= 88) return "Fatigue trop élevée pour une séance intensive";
  return "";
}

function restRecoveryIsNeeded() {
  if (state.energy < 92 || state.fatigue > 10 || state.injury > 0 || state.injuryWeeks > 0) return true;
  const plannedStrain = weeklyPlan.filter(item => item.actionId !== "rest").reduce((total, item) => {
    const changes = actionChangesFor(item);
    return {
      energy: total.energy + (changes.energy || 0),
      fatigue: total.fatigue + (changes.fatigue || 0),
      injury: total.injury + (changes.injury || 0),
    };
  }, { energy: state.energy, fatigue: state.fatigue, injury: state.injury });
  return plannedStrain.energy < 92 || plannedStrain.fatigue > 10 || plannedStrain.injury > 0;
}

function actionLock(action) {
  const requirement = actionRequirementLock(action);
  if (requirement) return requirement;
  const condition = actionConditionLock(action);
  if (condition) return condition;
  const workAndVacationPlanned = weeklyPlan.some(item => item.actionId === "work") && weeklyPlan.some(item => item.actionId === "vacation");
  if (workAndVacationPlanned || (action.id === "work" && weeklyPlan.some(item => item.actionId === "vacation")) || (action.id === "vacation" && weeklyPlan.some(item => item.actionId === "work"))) {
    return "Les vacances payées remplacent le travail cette semaine";
  }
  if (!isBonusAction(action) && plannedCoreActionCount() >= weeklyActionLimit()) return "Plan complet — retire une action";
  if (action.id === "private") {
    const coach = privateCoaches.find(item => item.id === state.privateProgram?.coachId);
    const price = coach ? privateCourseDuePrice(coach) : 0;
    if (!coach || projectedMoney() < price) return `Il manque ${price - projectedMoney()} $ pour ce cours`;
  }
  if (action.cost && projectedMoney() < action.cost) return `Il manque ${action.cost - projectedMoney()} $ au budget prévu`;
  return "";
}

function recommendedActionIds() {
  const recommendations = [];
  const add = id => {
    if (!recommendations.includes(id)) recommendations.push(id);
  };
  const fightDistance = state.scheduledFight ? state.scheduledFight.week - state.week : Infinity;

  if (state.energy <= 45) add("rest");
  if (state.fatigue >= 55) add("rest");
  if (state.morale <= 35) add("family");
  if (state.injuryWeeks > 0) add(state.money >= 55 ? "physio" : "rest");
  if (state.injury >= 30) add(state.money >= 55 ? "physio" : "rest");
  if (state.money < GYM_PRICE && currentJob()) add("work");
  if (fightDistance <= 2) add("video");
  if (recommendations.length < 2 && state.energy > 35 && state.fatigue < 55 && !state.injuryWeeks) {
    add(state.gymWeeks > 0 ? "gym" : "roadwork");
  }
  [state.gymWeeks > 0 ? "gym" : "roadwork", "video", "family"].forEach(id => {
    if (recommendations.length < 2) add(id);
  });
  return new Set(recommendations.slice(0, 2));
}

function renderActions() {
  const recommended = recommendedActionIds();
  const visibleCategories = actionCategories.map(category => ({
    ...category,
    actions: actions.filter(action => action.category === category.id && (!action.requiresPrivateProgram || state.privateProgram) && actionIsVisibleForCareer(action)),
  })).filter(category => category.actions.length);
  if (!visibleCategories.length) {
    const recreationalLimit = isRecreationalLimitReached();
    document.querySelector("#action-grid").innerHTML = `<div class="career-transition-lock"><strong>${recreationalLimit ? "La période récréative est terminée." : "Le gym attend ta décision."}</strong><p>${recreationalLimit ? "Tu as atteint la semaine 10 après le sparring avec Rémy « Le Tank ». Ouvre le calendrier et appuie sur « Passer amateur » pour continuer." : "Le sparring avec Rémy « Le Tank » est terminé. Ouvre le calendrier et appuie sur « Passer amateur » pour continuer."}</p></div>`;
    return;
  }
  document.querySelector("#action-grid").innerHTML = visibleCategories.map((category, index) => {
    const categoryActions = category.actions.map((action, originalIndex) => ({
      action,
      originalIndex,
      priority: recommended.has(action.id) ? 0 : actionRequirementLock(action) ? 2 : 1,
    })).sort((first, second) => first.priority - second.priority || first.originalIndex - second.originalIndex);
    const cards = categoryActions.map(({ action }) => {
      const selected = weeklyPlan.some(item => item.actionId === action.id);
      const lock = selected ? "" : actionLock(action);
      const isRecommended = recommended.has(action.id) && !action.future && !lock;
      const privateCoach = action.id === "private" ? privateCoaches.find(coach => coach.id === state.privateProgram?.coachId) : null;
      const duePrice = privateCoach ? privateCourseDuePrice(privateCoach) : 0;
      const progressDetail = action.progressStat && !isProgressiveReturn(action) ? ` · ${state.trainingProgress[action.progressStat]}/10 vers +1 ${combatLabels[action.progressStat].toLowerCase()}` : "";
      const work = action.id === "work" ? workOutcome() : action.id === "vacation" ? vacationOutcome() : null;
      const job = ["work", "vacation"].includes(action.id) ? currentJob() : null;
      const actionDetail = work && job ? action.id === "vacation"
        ? `${job.title} · +${work.money} $ · +${work.energy} énergie · ${work.fatigue} fatigue · +${work.morale} moral`
        : `${job.title} · +${work.money} $ · ${work.energy} énergie · +${work.fatigue} fatigue · ${work.morale} moral${work.injury ? ` · +${work.injury} risque` : ""}`
        : actionDisplayDetail(action);
      const detail = privateCoach ? `${combatLabels[state.privateProgram.target]} · séance ${state.privateProgram.sessionsCompleted + 1} / ${privateCoach.sessions} · ${duePrice ? `${duePrice} $` : "déjà payée"} · +10 XP` : `${actionDetail}${progressDetail}`;
      return `<button class="action-card${action.future ? " future" : ""}${selected ? " selected" : ""}${isRecommended ? " recommended" : ""}" type="button" data-action="${action.id}" ${lock ? "disabled" : ""} aria-pressed="${selected}">
        <span class="action-icon" aria-hidden="true">${action.icon}</span><h3>${action.title}</h3><p>${detail}</p>
        ${isRecommended ? `<span class="action-recommendation">Conseillé cette semaine</span>` : ""}
        ${lock ? `<span class="action-lock">${lock}</span>` : ""}
      </button>`;
    }).join("");
    return `<section class="action-group" aria-labelledby="action-group-${category.id}"><div class="action-group-heading"><span>0${index + 1}</span><div><h3 id="action-group-${category.id}">${category.label}</h3><p>${category.hint}</p></div></div><div class="action-grid">${cards}</div></section>`;
  }).join("");
}

function renderMembership() {
  const status = document.querySelector("#membership-status");
  const button = document.querySelector("#membership-button");
  const services = document.querySelector("#boxing-gym-services");
  if (state.gymWeeks > 0) {
    const expiring = state.gymWeeks === 1;
    status.className = `membership-status active${expiring ? " warning" : ""}`;
    status.innerHTML = `<strong>${expiring ? "Renouvellement bientôt nécessaire" : "GYM de boxe actif"}</strong>${state.gymWeeks} semaine${state.gymWeeks > 1 ? "s" : ""} restante${state.gymWeeks > 1 ? "s" : ""}`;
    button.textContent = expiring ? "Dernière semaine d’accès" : "Accès inclus";
    button.disabled = true;
  } else {
    status.className = "membership-status";
    const required = state.initialGymRequired;
    status.innerHTML = required
      ? `<strong>Premier abonnement réservé</strong>${GYM_PRICE} $ sont protégés pour le GYM de boxe avant le début du parcours récréatif`
      : "<strong>GYM de boxe expiré</strong>Le sac au sous-sol reste disponible; les mitaines, cours et sparring attendent un renouvellement";
    button.disabled = false;
    button.textContent = required ? `Activer le premier mois · ${GYM_PRICE} $` : "Choisir un forfait";
    button.title = "";
  }
  services.innerHTML = state.gymWeeks > 0 ? `<div class="gym-exercise-heading"><strong>Exercices du GYM de boxe</strong><small>${isRecreationalCareer() ? "Mitaines et cours de groupe pour bâtir les bases" : "Disponibles dans Préparation et technique"}</small></div><div class="gym-exercise-grid">${gymExerciseCard("technique", "Travail aux mitaines")}${!isRecreationalCareer() ? gymExerciseCard("defense", "Défense et esquives") : ""}</div>` : `<div class="gym-locked-note">Sans abonnement, le sac au sous-sol reste dans les tuiles de préparation.</div>`;
}

function gymExerciseCard(stat, label) {
  const progress = state.trainingProgress[stat] || 0;
  return `<div class="gym-exercise-card"><div><strong>${label}</strong><small>+1 ${combatLabels[stat].toLowerCase()} toutes les 10 séances</small></div><span>${progress}/10</span><div class="gym-progress"><i style="width:${progress * 10}%"></i></div></div>`;
}

function productLock(product) {
  if (state.supplementWeek !== state.week) {
    state.supplementWeek = state.week;
    state.supplementsUsed = [];
  }
  if (state.supplementsUsed.includes(product.id)) return "Déjà consommé cette semaine";
  if (state.supplementsUsed.length >= MAX_SUPPLEMENTS_PER_WEEK) return `Limite de ${MAX_SUPPLEMENTS_PER_WEEK} produits par semaine`;
  if (state.money < product.price) return `Il manque ${product.price - state.money} $`;
  const budgetLock = protectedBudgetLock(product.price);
  if (budgetLock) return budgetLock;
  if (product.id === "preworkout" && state.fatigue >= 85) return "Fatigue trop élevée";
  if ((product.id === "preworkout" || product.id === "energy-drink") && state.energy >= 95) return "Énergie déjà presque pleine";
  const useful = Object.entries(product.changes).some(([key, value]) => {
    if (["energy", "fitness", "morale"].includes(key) && value > 0) return state[key] < 100;
    if (["fatigue", "injury"].includes(key) && value < 0) return state[key] > 0;
    return false;
  });
  return useful ? "" : "Aucun bénéfice actuellement";
}

function renderStrengthMembership() {
  const status = document.querySelector("#strength-membership-status");
  const button = document.querySelector("#strength-membership-button");
  const services = document.querySelector("#strength-gym-services");
  if (state.strengthGymWeeks > 0) {
    const expiring = state.strengthGymWeeks === 1;
    status.className = `membership-status active${expiring ? " warning" : ""}`;
    status.innerHTML = `<strong>${expiring ? "Renouvellement bientôt nécessaire" : "Abonnement actif"}</strong>${state.strengthGymWeeks} semaine${state.strengthGymWeeks > 1 ? "s" : ""} restante${state.strengthGymWeeks > 1 ? "s" : ""}`;
    button.textContent = expiring ? "Dernière semaine d’accès" : "Accès musculation actif";
    button.disabled = true;
  } else {
    status.className = "membership-status";
    status.innerHTML = "<strong>Non abonné</strong>Exercices, boutique et préparateurs verrouillés";
    button.disabled = false;
    button.textContent = "Choisir un forfait";
  }
  if (!services) return;
  const shop = strengthGymProducts.map(product => {
    const lock = productLock(product);
    return `<button type="button" class="gym-product" data-buy-supplement="${product.id}" ${lock ? `disabled title="${lock}"` : ""}><strong>${product.label}</strong><span>${product.price} $</span><small>${product.effect}</small>${lock ? `<em>${lock}</em>` : ""}</button>`;
  }).join("");
  services.innerHTML = state.strengthGymWeeks > 0 ? `<div class="gym-exercise-heading"><strong>Exercices</strong><small>Dans Préparation et technique</small></div><div class="gym-exercise-grid">${gymExerciseCard("power", "Musculation")}${gymExerciseCard("cardio", "Cardio sur appareils")}</div><div class="gym-shop"><div class="gym-shop-heading"><span>Boutique</span><small>Effet immédiat · ${state.supplementsUsed.length}/${MAX_SUPPLEMENTS_PER_WEEK} cette semaine</small></div><div class="gym-shop-actions">${shop}</div></div>` : `<div class="gym-locked-note">Abonne-toi pour débloquer les exercices, les préparateurs et la boutique.</div>`;
}

function privateCoursePrice(coach) {
  return Math.max(0, coach.price - (coach.type === "boxing" && state.gymWeeks > 0 ? 10 : 0));
}

function privateCourseDuePrice(coach) {
  return state.privateProgram?.firstSessionPaid && state.privateProgram.sessionsCompleted === 0 ? 0 : privateCoursePrice(coach);
}

function renderPrivateCoaching() {
  const coaching = document.querySelector("#private-coaching");
  if (!coaching) return;
  const program = state.privateProgram;
  if (program) {
    const coach = privateCoaches.find(item => item.id === program.coachId);
    const remaining = Math.max(0, coach.sessions - program.sessionsCompleted);
    const price = privateCourseDuePrice(coach);
    const discountActive = coach.type === "boxing" && state.gymWeeks > 0;
    const accessNote = coach.type === "physical" && state.strengthGymWeeks === 0 ? " · abonnement musculation requis pour continuer" : "";
    coaching.innerHTML = `<div class="private-program"><span>${coach.type === "boxing" ? "Coach de boxe" : "Préparateur physique"} · programme en cours</span><strong>${coach.name} · ${combatLabels[program.target]}</strong><small>${remaining} cours restant${remaining > 1 ? "s" : ""} avant +${coach.reward} ${combatLabels[program.target].toLowerCase()} · prochain cours : ${price ? `${price} $${discountActive ? " (rabais inclus)" : ""}` : "déjà payé"}${accessNote}.</small></div>`;
  } else {
    coaching.innerHTML = `<div class="coaching-heading"><span>Aucun programme actif</span><small>Compare dix spécialistes, leur prix et les qualités accessibles.</small></div><button id="open-coach-menu" class="primary-button" type="button">Choisir un coach ou un préparateur</button>`;
  }
}

function renderEmployment() {
  const employment = document.querySelector("#employment");
  if (!employment) return;
  const job = currentJob();
  const application = state.jobApplication;
  const targetJob = jobs.find(item => item.id === application?.jobId);
  if (!job) {
    const required = state.introJobRequired;
    if (application && targetJob) {
      const ready = application.offerReady;
      employment.innerHTML = `<div class="private-program employment-program application${ready ? " ready" : ""}"><span>${ready ? "Offre confirmée" : "Recherche d’emploi"}</span><strong>${escapeHTML(targetJob.title)} · ${application.progress}/${application.requiredWeeks} entrevue${application.requiredWeeks > 1 ? "s" : ""}</strong><small>${ready ? "Le poste commencera à la prochaine semaine." : "Planifie « Passer des entrevues » pour faire avancer la candidature. Sans cette action, le compteur reste en pause."}</small><div class="employment-actions"><button id="open-job-menu" class="secondary-button" type="button">Changer de candidature</button><button id="cancel-job-application" class="text-button" type="button">Annuler la candidature</button></div></div>`;
      return;
    }
    employment.innerHTML = `<div class="coaching-heading"><span>${required ? "Premier emploi requis" : "Sans emploi"}</span><small>${required ? "Choisis ton emploi de départ avant de passer ta première semaine." : "Choisis un poste, puis fais progresser les entrevues dans tes actions hebdomadaires."}</small></div><button id="open-job-menu" class="primary-button" type="button">${required ? "Choisir mon emploi de départ" : "Chercher un emploi"}</button>`;
    return;
  }
  const absenceNote = state.missedWorkWeeks === 0
    ? "Présence en règle"
    : state.missedWorkWeeks === 1
      ? "1 absence · deux chances restantes"
      : "2/3 absences · prochain quart manqué : congédiement";
  const vacation = vacationStatus();
  const warningClass = state.missedWorkWeeks >= 2 ? " danger" : state.missedWorkWeeks === 1 ? " warning" : "";
  const applicationCopy = application && targetJob ? `<div class="employment-application"><span>Candidature en cours</span><strong>${escapeHTML(targetJob.title)} · ${application.progress}/${application.requiredWeeks}</strong><small>${application.offerReady ? "Offre confirmée pour la semaine prochaine." : "Chaque action « Passer des entrevues » ajoute une étape."}</small></div>` : "";
  employment.innerHTML = `<div class="private-program employment-program${warningClass}"><span>Emploi actif · ${escapeHTML(job.schedule)}</span><strong>${escapeHTML(job.title)} · ${job.wage} $ par semaine travaillée</strong><small>${escapeHTML(job.detail)} <b>${absenceNote}</b>. Vacances : ${escapeHTML(vacation.reason)}.</small>${applicationCopy}<div class="employment-actions"><button id="open-job-menu" class="secondary-button" type="button">${application ? "Changer de candidature" : "Postuler ailleurs"}</button>${application ? '<button id="cancel-job-application" class="text-button" type="button">Annuler la candidature</button>' : ""}<button id="quit-job" class="text-button" type="button">Quitter l’emploi</button></div></div>`;
}

function openJobMenu() {
  const activeJob = currentJob();
  const immediate = state.introJobRequired && state.jobsHeldCount === 0 && !activeJob;
  document.querySelector("#job-dialog-title").textContent = immediate ? "Choisir l’emploi de départ" : "Choisir une candidature";
  const copy = document.querySelector("#job-dialog-copy");
  if (copy) copy.textContent = immediate ? "Ton premier emploi est obtenu immédiatement. Ensuite, chaque changement demandera des entrevues planifiées dans la semaine." : "Choisis le poste visé. Une nouvelle candidature remet la progression actuelle à zéro; l’embauche est garantie lorsque toutes les entrevues sont terminées.";
  document.querySelector("#job-options").innerHTML = jobs.map(job => {
    const isActive = job.id === activeJob?.id;
    const isTarget = job.id === state.jobApplication?.jobId;
    const referenceEligible = state.jobReferenceBonus || Boolean(activeJob && state.jobTenureWeeks >= 12 && state.missedWorkWeeks === 0);
    const requiredWeeks = Math.max(1, job.interviewWeeks - (referenceEligible ? 1 : 0));
    const hiring = immediate ? "Embauche immédiate" : `${requiredWeeks} semaine${requiredWeeks > 1 ? "s" : ""} d’entrevues${referenceEligible && job.interviewWeeks > 1 ? " · bon dossier inclus" : ""}`;
    return renderJobBoardSheet(job, {
      active: isActive,
      selected: isTarget,
      disabled: isActive,
      status: hiring,
      effects: `${job.energy} énergie · +${job.fatigue} fatigue · ${job.morale} moral${job.injury ? ` · +${job.injury} risque` : ""}`,
    });
  }).join("");
  document.querySelector("#job-dialog").showModal();
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

function selectJob(jobId) {
  const job = jobs.find(item => item.id === jobId);
  if (!job) return;
  if (state.introJobRequired && state.jobsHeldCount === 0 && !currentJob()) {
    hireJob(job, true);
    document.querySelector("#job-dialog").close();
    render();
    showToast(`${job.title} · action Travailler débloquée`);
    return;
  }
  if (job.id === state.jobId) return;
  const activeJob = currentJob();
  const referenceEligible = state.jobReferenceBonus || Boolean(activeJob && state.jobTenureWeeks >= 12 && state.missedWorkWeeks === 0);
  const requiredWeeks = Math.max(1, job.interviewWeeks - (referenceEligible ? 1 : 0));
  state.jobApplication = { jobId: job.id, progress: 0, requiredWeeks, offerReady: false, referenceBonusApplied: referenceEligible };
  weeklyPlan = weeklyPlan.filter(item => item.actionId !== "interview");
  state.journal.unshift({ week: state.week, text: `Candidature envoyée : ${job.title}. ${requiredWeeks} semaine${requiredWeeks > 1 ? "s" : ""} d’entrevues requise${requiredWeeks > 1 ? "s" : ""}.` });
  document.querySelector("#job-dialog").close();
  render();
  showToast(`${job.title} · candidature lancée`);
}

function cancelJobApplication() {
  if (!state.jobApplication) return;
  const job = jobs.find(item => item.id === state.jobApplication.jobId);
  state.jobApplication = null;
  weeklyPlan = weeklyPlan.filter(item => item.actionId !== "interview");
  render();
  showToast(`Candidature ${job ? `chez ${job.title} ` : ""}annulée`);
}

function quitJob() {
  const job = currentJob();
  if (!job) return;
  if (!window.confirm(`Quitter ${job.title} ?\n\nTu pourras rester sans emploi ou en choisir un autre plus tard.`)) return;
  state.jobReferenceBonus = state.jobTenureWeeks >= 12 && state.missedWorkWeeks === 0;
  state.journal.unshift({ week: state.week, text: `${state.profile.firstName} quitte son emploi : ${job.title}.${state.jobReferenceBonus ? " Son bon dossier réduira la prochaine recherche d’une entrevue." : ""}` });
  state.jobId = null;
  state.missedWorkWeeks = 0;
  state.jobTenureWeeks = 0;
  state.jobVacationEarnedAtTenure = 0;
  state.vacationBankWeeks = 0;
  state.jobWagesEarned = 0;
  state.workStreak = 0;
  render();
  showToast("Emploi quitté");
}

function advanceJobApplication(events, week) {
  if (!weeklyPlan.some(item => item.actionId === "interview") || !state.jobApplication || state.jobApplication.offerReady) return;
  const job = jobs.find(item => item.id === state.jobApplication.jobId);
  if (!job) {
    state.jobApplication = null;
    return;
  }
  state.jobApplication.progress = Math.min(state.jobApplication.requiredWeeks, state.jobApplication.progress + 1);
  if (state.jobApplication.progress >= state.jobApplication.requiredWeeks) {
    state.jobApplication.offerReady = true;
    const note = `${job.title} : entrevues terminées, offre confirmée. Le poste commencera la semaine prochaine.`;
    events.push(note);
    state.journal.unshift({ week, text: note });
    return;
  }
  const remaining = state.jobApplication.requiredWeeks - state.jobApplication.progress;
  const note = `${job.title} : entrevue ${state.jobApplication.progress}/${state.jobApplication.requiredWeeks} terminée. Encore ${remaining} semaine${remaining > 1 ? "s" : ""} d’entrevue.`;
  events.push(note);
  state.journal.unshift({ week, text: note });
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
  { id: "six-months", label: "6 mois", weeks: STRENGTH_GYM_SIX_MONTH_WEEKS, price: STRENGTH_GYM_SIX_MONTH_PRICE, detail: "24 semaines d’accès · 60 $ d’économie." },
  { id: "yearly", label: "1 an", weeks: STRENGTH_GYM_YEAR_WEEKS, price: STRENGTH_GYM_YEAR_PRICE, detail: "48 semaines d’accès · 180 $ d’économie." },
]);

function openMembershipMenu() {
  if (state.gymWeeks > 0) return;
  const initial = state.initialGymRequired;
  const choices = initial ? gymPlans.filter(plan => plan.id === "monthly") : gymPlans;
  document.querySelector("#membership-dialog-title").textContent = initial ? "Premier abonnement obligatoire" : "Renouveler le GYM de boxe";
  document.querySelector("#membership-dialog-copy").textContent = initial
    ? "Ton budget de départ couvre ce premier mois. Choisis ensuite un emploi pour financer la suite du camp."
    : "Sans abonnement, le sac au sous-sol reste disponible. Les mitaines, cours et sparring demandent un accès actif au GYM.";
  document.querySelector("#membership-options").innerHTML = choices.map(plan => `<button class="coach-card" type="button" data-gym-plan="${plan.id}" ${state.money < plan.price ? "disabled" : ""}><strong>${plan.label} · ${plan.price} $</strong><span>${plan.weeks} semaines d’accès</span><small>${plan.detail}${state.money < plan.price ? `<br>Il manque ${plan.price - state.money} $.` : ""}</small></button>`).join("");
  document.querySelector("#membership-dialog").showModal();
}

function selectGymPlan(planId) {
  const plan = gymPlans.find(item => item.id === planId);
  if (!plan || state.gymWeeks > 0 || state.money < plan.price) return;
  state.money -= plan.price;
  state.gymWeeks = plan.weeks;
  state.initialGymRequired = false;
  state.journal.unshift({ week: state.week, text: `Abonnement GYM de boxe activé : ${plan.label.toLowerCase()} (${plan.weeks} semaines).` });
  document.querySelector("#membership-dialog").close();
  render();
  showToast(`GYM actif · ${plan.weeks} semaines`);
}

function openStrengthMembershipMenu() {
  if (state.strengthGymWeeks > 0) return;
  document.querySelector("#strength-membership-dialog-copy").textContent = initialGymReserve()
    ? `${GYM_PRICE} $ restent réservés pour le premier mois obligatoire du GYM de boxe. Le reste du budget peut servir à la musculation.`
    : "Le gym de musculation débloque les exercices, la boutique et les préparateurs physiques. Pour le calendrier du jeu, un mois représente quatre semaines.";
  document.querySelector("#strength-membership-options").innerHTML = strengthGymPlans.map(plan => {
    const budgetLock = state.money < plan.price ? `Il manque ${plan.price - state.money} $.` : protectedBudgetLock(plan.price);
    return `<button class="coach-card" type="button" data-strength-gym-plan="${plan.id}" ${budgetLock ? "disabled" : ""}><strong>${plan.label} · ${plan.price} $</strong><span>${plan.weeks} semaines d’accès</span><small>${plan.detail}${budgetLock ? `<br>${budgetLock}` : ""}</small></button>`;
  }).join("");
  document.querySelector("#strength-membership-dialog").showModal();
}

function selectStrengthGymPlan(planId) {
  const plan = strengthGymPlans.find(item => item.id === planId);
  if (!plan || state.strengthGymWeeks > 0 || state.money < plan.price || protectedBudgetLock(plan.price)) return;
  state.money -= plan.price;
  state.strengthGymWeeks = plan.weeks;
  state.journal.unshift({ week: state.week, text: `Abonnement gym de musculation activé : ${plan.label.toLowerCase()} (${plan.weeks} semaines).` });
  document.querySelector("#strength-membership-dialog").close();
  render();
  showToast(`Musculation active · ${plan.weeks} semaines`);
}

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
      const note = `${job.title} : ta présence remet le dossier d’assiduité en règle.`;
      events.push(note);
      state.journal.unshift({ week, text: note });
    }
    state.missedWorkWeeks = 0;
    state.jobTenureWeeks += 1;
    if (paidWork) state.jobWagesEarned += job.wage;
    accruePaidVacation(job, events, week);
    return;
  }
  if (excused || state.injuryWeeks > 0) {
    const note = `${job.title} : absence justifiée par ${excused ? "le tournoi" : "la blessure"}; ton emploi est protégé.`;
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
    const note = `${job.title} : congédiement après trois semaines consécutives sans travailler.${vacationPayout ? ` Indemnité de vacances : +${vacationPayout} $ (4 % des salaires reçus).` : ""}`;
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
    state.jobLossNotice = `Tu as perdu ton emploi de ${job.title} après trois absences consécutives.${vacationPayout ? ` Une indemnité de vacances de ${vacationPayout} $ a été versée.` : ""}`;
    return;
  }
  const remaining = 3 - state.missedWorkWeeks;
  const note = `${job.title} : ${state.missedWorkWeeks === 1 ? "première absence" : "dernier avertissement"}. Il reste ${remaining} absence${remaining > 1 ? "s" : ""} avant le congédiement.`;
  events.push(note);
  state.journal.unshift({ week, text: note });
}

function workOutcome() {
  const job = currentJob();
  if (!job) return null;
  return {
    money: job.wage,
    energy: job.energy,
    fatigue: job.fatigue,
    morale: job.morale,
    injury: job.injury + (state.fatigue >= 70 ? 2 : 0),
  };
}

function vacationOutcome() {
  const job = currentJob();
  if (!job) return null;
  return { money: job.wage, energy: 14, fatigue: -18, morale: 8, injury: -4 };
}

function actionChangesFor(item) {
  const action = actions.find(candidate => candidate.id === item.actionId);
  if (!action) return {};
  if (action.id === "work") return workOutcome() || {};
  if (action.id === "vacation") return vacationOutcome() || {};
  if (action.id === "private") {
    const coach = privateCoaches.find(item => item.id === state.privateProgram?.coachId);
    if (!coach) return {};
    return { money: -privateCourseDuePrice(coach), energy: -14, fatigue: coach.fatigue, fitness: coach.fitness, morale: coach.morale, experience: 10 };
  }
  const changes = { ...(action.changes || {}) };
  const progressiveReturn = isProgressiveReturn(action);
  if (progressiveReturn) {
    if (changes.energy < 0) changes.energy = Math.round(changes.energy * .58);
    changes.fitness = Math.max(4, changes.fitness || 0);
    if (changes.injury > 0) changes.injury = Math.min(1, changes.injury);
    if (changes.experience > 0) changes.experience = Math.max(3, Math.round(changes.experience * .5));
  }
  if (actionFatigue[action.id]) changes.fatigue = (changes.fatigue || 0) + (progressiveReturn ? Math.max(3, Math.round(actionFatigue[action.id] * .5)) : actionFatigue[action.id]);
  if (action.category === "training" && changes.experience) {
    const readiness = clamp(.45 + state.energy / 220 + state.fitness / 260 + state.morale / 600 - state.fatigue / 260, .45, 1.15);
    changes.experience = Math.max(1, Math.round(changes.experience * readiness));
  }
  return changes;
}

function planItemEffects(item) {
  const action = actions.find(candidate => candidate.id === item.actionId);
  const reachesMilestone = action?.progressStat && (state.trainingProgress[action.progressStat] || 0) >= 9;
  return {
    action,
    general: actionChangesFor(item),
    combat: reachesMilestone && !isProgressiveReturn(action) ? { [action.progressStat]: 1 } : {},
  };
}

function planEffects() {
  const rawGeneral = {};
  const rawCombat = {};
  let earned = 0;
  let spent = 0;
  weeklyPlan.forEach(item => {
    const effects = planItemEffects(item);
    Object.entries(effects.general).forEach(([key, value]) => {
      rawGeneral[key] = (rawGeneral[key] || 0) + value;
      if (key === "money") value >= 0 ? earned += value : spent += Math.abs(value);
    });
    Object.entries(effects.combat).forEach(([key, value]) => rawCombat[key] = (rawCombat[key] || 0) + value);
  });
  const general = Object.fromEntries(Object.entries(rawGeneral).map(([key, value]) => {
    const finalValue = key === "money" || key === "experience" ? Math.max(0, state[key] + value) : clamp(state[key] + value);
    return [key, finalValue - state[key]];
  }));
  const combat = Object.fromEntries(Object.entries(rawCombat).map(([key, value]) => [key, clamp(state.combatStats[key] + value, 0, 99) - state.combatStats[key]]));
  return { general, combat, rawGeneral, rawCombat, earned, spent };
}

function signed(value, suffix = "") {
  return `${value > 0 ? "+" : ""}${value}${suffix}`;
}

function scheduleRecreationalSparring(events = []) {
  if (!isRecreationalCareer() || state.week < RECREATIONAL_SPARRING_WEEK || state.recreationalSparringStatus === "completed" || state.scheduledFight) return;
  const scheduledWeek = Math.max(RECREATIONAL_SPARRING_WEEK, state.week + (state.injuryWeeks > 0 ? state.injuryWeeks : 0));
  state.recreationalSparringStatus = "ready";
  state.scheduledFight = {
    id: REMY_TANK.id,
    opponent: { ...REMY_TANK, stats: { ...REMY_TANK.stats }, weightClass: state.profile.weightClass },
    tournamentId: null,
    tournamentRound: null,
    bookingId: null,
    eventId: "recreational-sparring-remy",
    event: { id: "recreational-sparring-remy", name: "Sparring d’évaluation · Rémy « Le Tank »", careerWeek: scheduledWeek },
    week: scheduledWeek,
    isRecreationalSparring: true,
    travelEffects: { energy: 0, fatigue: 0 },
    travelApplied: true,
    fightSeed: freshFightSeed(`remy-le-tank-${state.profile.firstName}-${state.week}`),
  };
  const note = `Sparring d’évaluation disponible à partir de la semaine ${scheduledWeek} : Rémy « Le Tank » t’attend au GYM.`;
  events.push(note);
  state.journal.unshift({ week: state.week, text: note });
}

function advanceRecreationalTraining(events, week) {
  if (!isRecreationalCareer()) return;
  const trainedAtGym = weeklyPlan.some(item => ["gym", "group-class"].includes(item.actionId));
  if (trainedAtGym && state.recreationalTrainingWeeks < RECREATIONAL_MAX_WEEK) {
    state.recreationalTrainingWeeks += 1;
    const note = `Parcours récréatif : ${state.recreationalTrainingWeeks}/10 entraînements au GYM de boxe.`;
    events.push(note);
    state.journal.unshift({ week, text: note });
  }
  scheduleRecreationalSparring(events);
}

function planValidation() {
  const tournamentDue = Boolean(state.activeTournament && state.activeTournament.status !== "completed" && state.week >= state.activeTournament.startWeek);
  const scheduledFightDue = Boolean(state.scheduledFight && state.week >= state.scheduledFight.week);
  if (state.pendingWeekEvent) return { valid: false, reason: "Choisis d’abord l’événement entre les semaines." };
  if (isAwaitingAmateurTransition()) return { valid: false, reason: "Le sparring est terminé : ouvre le calendrier et appuie sur « Passer amateur »." };
  if (isRecreationalLimitReached()) return { valid: false, reason: "La semaine 10 clôt le parcours récréatif : ouvre le calendrier et appuie sur « Passer amateur »." };
  if (isRecreationalCareer() && state.introJobRequired && !currentJob()) return { valid: false, reason: "Choisis d’abord ton emploi de départ dans le panneau Emploi." };
  if (isRecreationalCareer() && state.initialGymRequired && state.gymWeeks === 0) return { valid: false, reason: "Active d’abord le premier abonnement au GYM de boxe." };
  if (tournamentDue && state.injuryWeeks === 0) return { valid: false, reason: "Le tournoi a commencé : ouvre le tableau pour disputer le prochain combat." };
  if (!weeklyPlan.length && !scheduledFightDue) return { valid: false, reason: "Sélectionne au moins une action pour continuer." };
  if (plannedCoreActionCount() > weeklyActionLimit()) return { valid: false, reason: `Le plan dépasse la limite de ${weeklyActionLimit()} actions.` };
  const seen = new Set();
  for (const item of weeklyPlan) {
    const action = actions.find(candidate => candidate.id === item.actionId);
    if (!action || seen.has(item.actionId)) return { valid: false, reason: "Le plan contient une action invalide ou en double." };
    seen.add(item.actionId);
    const lock = actionRequirementLock(action) || actionConditionLock(action);
    if (lock) return { valid: false, reason: `${action.title} : ${lock}.` };
  }
  if (seen.has("work") && seen.has("vacation")) return { valid: false, reason: "Les vacances payées remplacent le travail cette semaine." };
  const totals = planEffects();
  if (state.money + (totals.rawGeneral.money || 0) < 0) return { valid: false, reason: "Le plan dépasse ton budget. Retire une dépense ou ajoute du travail." };
  const finalEnergy = clamp(state.energy + (totals.rawGeneral.energy || 0));
  const finalFatigue = clamp(state.fatigue + (totals.rawGeneral.fatigue || 0));
  if (finalEnergy < 5) return { valid: false, reason: "Ce programme épuiserait complètement ton boxeur. Ajoute de la récupération." };
  if (finalFatigue >= 96) return { valid: false, reason: "Ce programme pousserait la fatigue à un niveau dangereux. Ajoute du repos." };
  const coreActions = plannedCoreActionCount();
  return { valid: true, reason: scheduledFightDue ? `Le combat réserve une action. Tu peux encore préparer ${coreActions}/${weeklyActionLimit()} action${weeklyActionLimit() > 1 ? "s" : ""} avant d’entrer dans le ring.` : tournamentDue ? "Tournoi en pause pendant la blessure : planifie une semaine de récupération." : "Rien ne sera appliqué avant ta confirmation." };
}

function renderPlan() {
  const content = document.querySelector("#plan-content");
  const actionLimit = weeklyActionLimit();
  const coreActionCount = plannedCoreActionCount();
  const vacationPlanned = weeklyPlan.some(item => item.actionId === "vacation");
  document.querySelector("#plan-count").textContent = `${coreActionCount} / ${actionLimit} action${actionLimit > 1 ? "s" : ""}${vacationPlanned ? " · + vacances" : ""}`;
  if (!weeklyPlan.length) {
    content.innerHTML = `<div class="plan-list plan-list-empty">${Array.from({ length: actionLimit }, (_, index) => `<div class="plan-slot"><span>${index + 1}</span><em>Libre</em></div>`).join("")}</div><div class="plan-empty">Ton programme est vide. Choisis jusqu’à ${actionLimit} actions ci-dessus.</div>`;
  } else {
    const totals = planEffects();
    const effectParts = Object.entries(totals.general).filter(([key, value]) => key !== "money" && value).map(([key, value]) => `${generalStats.find(stat => stat.key === key)?.label || "Expérience"} ${signed(value, key === "experience" ? "" : "%")}`);
    effectParts.push(...Object.entries(totals.combat).filter(([, value]) => value).map(([key, value]) => `${combatLabels[key]} ${signed(value)}`));
    const plannedRows = weeklyPlan.map((item, index) => {
      const action = actions.find(candidate => candidate.id === item.actionId);
      const coach = action.id === "private" ? privateCoaches.find(item => item.id === state.privateProgram?.coachId) : null;
      const duePrice = coach ? privateCourseDuePrice(coach) : 0;
      const currentProgress = action.progressStat ? state.trainingProgress[action.progressStat] || 0 : 0;
      const progressDetail = action.progressStat && !isProgressiveReturn(action) ? currentProgress >= 9 ? ` · cette séance donne +1 ${combatLabels[action.progressStat].toLowerCase()}` : ` · progression prévue : ${currentProgress + 1}/10` : "";
      const work = action.id === "work" ? workOutcome() : action.id === "vacation" ? vacationOutcome() : null;
      const job = ["work", "vacation"].includes(action.id) ? currentJob() : null;
      const actionDetail = work && job ? action.id === "vacation"
        ? `${job.title} · +${work.money} $ · +${work.energy} énergie · ${work.fatigue} fatigue · +${work.morale} moral`
        : `${job.title} · +${work.money} $ · ${work.energy} énergie · +${work.fatigue} fatigue · ${work.morale} moral${work.injury ? ` · +${work.injury} risque` : ""}`
        : actionDisplayDetail(action);
      const detail = coach ? `${combatLabels[state.privateProgram.target]} · ${duePrice ? `${duePrice} $` : "séance déjà payée"} · cours ${state.privateProgram.sessionsCompleted + 1} / ${coach.sessions}` : `${actionDetail}${progressDetail}`;
      return `<div class="plan-row"><span class="plan-order">${index + 1}</span><div class="plan-row-copy"><strong>${action.title}</strong><small>${detail}</small></div><div class="plan-row-actions"><button class="plan-remove" type="button" data-remove="${action.id}">Retirer</button></div></div>`;
    }).join("");
    const emptyRows = Array.from({ length: Math.max(0, actionLimit - coreActionCount) }, (_, index) => `<div class="plan-slot"><span>${coreActionCount + index + 1}</span><em>Libre</em></div>`).join("");
    content.innerHTML = `<div class="plan-list">${plannedRows}${emptyRows}</div><div class="plan-totals"><div class="plan-total-block"><span>Argent à la fin</span><strong class="${projectedMoney() >= state.money ? "positive" : "negative"}">${projectedMoney()} $</strong></div><div class="plan-total-block"><span>Gains / dépenses</span><strong><span class="positive">+${totals.earned} $</span> · <span class="negative">−${totals.spent} $</span></strong></div><div class="plan-total-block"><span>Effets prévus</span><div class="plan-effects">${effectParts.join(" · ") || "Aucun changement de jauge"}</div></div></div>`;
  }
  const localFightDue = Boolean(state.scheduledFight && !state.scheduledFight.tournamentId && state.week >= state.scheduledFight.week);
  const validation = planValidation();
  const advance = document.querySelector("#advance-week");
  const fightActions = document.querySelector("#plan-fight-actions");
  advance.disabled = !validation.valid;
  advance.hidden = localFightDue;
  advance.title = validation.valid ? "" : validation.reason;
  fightActions.hidden = !localFightDue;
  document.querySelector("#plan-help").textContent = localFightDue ? `Le combat occupe une action. Tes ${actionLimit} autres choix seront appliqués avant l’entrée dans le ring.` : validation.reason;
}

function render() {
  const hasFighter = Boolean(state.profile);
  document.querySelector("#creation-screen").classList.toggle("hidden", hasFighter);
  document.querySelector("#game").classList.toggle("hidden", !hasFighter);
  if (hasFighter) ensureCareerCalendar();
  renderV2WorldPreview(hasFighter);
  if (!hasFighter) return;

  ensureDueTournamentActive();
  renderFighter();
  document.querySelector(".strength-membership-panel").hidden = isAwaitingAmateurTransition();
  document.querySelector("#private-coaching").closest(".coaching-panel").hidden = isRecreationalCareer() || isAwaitingAmateurTransition();
  document.querySelector("#money-spotlight").textContent = `${state.money} $`;
  document.querySelector("#week").textContent = String(state.week).padStart(2, "0");
  const weekStartDate = careerWeekDate(0);
  const weekEndDate = careerWeekDate(6);
  const topDate = document.querySelector("#top-date");
  topDate.textContent = formatCareerDate(weekStartDate);
  topDate.setAttribute("aria-label", `Semaine du ${formatCareerDate(weekStartDate, { long: true })} au ${formatCareerDate(weekEndDate, { long: true })}`);
  const topEnergy = document.querySelector("#top-energy");
  topEnergy.textContent = `E:${state.energy}%`;
  topEnergy.setAttribute("aria-label", `Énergie ${state.energy} %`);
  const topFitness = document.querySelector("#top-fitness");
  topFitness.textContent = `Fo:${state.fitness}%`;
  topFitness.setAttribute("aria-label", `Forme physique ${state.fitness} %`);
  const topFatigue = document.querySelector("#top-fatigue");
  topFatigue.textContent = `Fa:${state.fatigue}%`;
  topFatigue.setAttribute("aria-label", `Fatigue ${state.fatigue} %`);
  const topMorale = document.querySelector("#top-morale");
  topMorale.textContent = `M:${state.morale}%`;
  topMorale.setAttribute("aria-label", `Moral ${state.morale} %`);
  const topMoney = document.querySelector("#top-money");
  topMoney.textContent = `${state.money}$`;
  topMoney.setAttribute("aria-label", `Argent disponible ${state.money} dollars`);
  const actionLimit = weeklyActionLimit();
  const galaDue = Boolean(state.scheduledFight && !state.scheduledFight.tournamentId && state.week >= state.scheduledFight.week);
  document.querySelector("#action-limit-help").textContent = isAwaitingAmateurTransition() ? "Le parcours est en pause : confirme le passage amateur dans le calendrier." : isRecreationalLimitReached() ? "La semaine 10 clôt le parcours récréatif : confirme le passage amateur dans le calendrier." : isRecreationalCareer() ? `Parcours récréatif : peu de choix, une base solide. Le sparring avec Rémy arrive en semaine ${RECREATIONAL_SPARRING_WEEK}.` : actionLimit === 0 ? "Le tournoi occupe toute la semaine : les décisions se prennent dans le hub de compétition." : hasWeakBoxingRhythm() ? "Rythme faible : une seule action est disponible jusqu’à un entraînement de boxe." : galaDue ? `Le gala réserve une action : ${actionLimit} choix de camp restent disponibles avant le combat.` : actionLimit === 4 ? "Expérience acquise : compose maintenant un programme de quatre actions." : `Trois actions par semaine · la quatrième se débloque après ${Math.max(0, 10 - amateurFightCount())} combat${10 - amateurFightCount() > 1 ? "s" : ""}.`;
  const pips = document.querySelector("#action-pips");
  const plannedCoreActions = plannedCoreActionCount();
  pips.innerHTML = Array.from({ length: actionLimit }, (_, index) => `<span class="pip ${index < plannedCoreActions ? "active" : ""}"></span>`).join("");
  pips.setAttribute("aria-label", `${plannedCoreActions} action${plannedCoreActions > 1 ? "s" : ""} planifiée${plannedCoreActions > 1 ? "s" : ""} sur ${actionLimit}${weeklyPlan.some(item => item.actionId === "vacation") ? ", plus une semaine de vacances payées" : ""}`);

  document.querySelector("#stats").innerHTML = generalStats.map(stat => {
    const display = `${state[stat.key]}${stat.suffix}`;
    const width = clamp((state[stat.key] / (stat.max || 100)) * 100);
    return `<div class="stat ${stat.className || ""}">
      <div class="stat-top"><span>${stat.label}</span><span class="stat-value">${display}</span></div>
      <div class="meter" role="progressbar" aria-label="${stat.label}" aria-valuemin="0" aria-valuemax="${stat.max || 100}" aria-valuenow="${state[stat.key]}"><div class="meter-fill" style="width:${width}%"></div></div>
    </div>`;
  }).join("");

  renderMembership();
  renderStrengthMembership();
  renderPrivateCoaching();
  renderEmployment();
  renderFights();
  renderActions();
  renderPlan();
  persistCareer();
}

function renderV2WorldPreview(hasFighter = Boolean(state.profile)) {
  const root = document.querySelector("#v2-world");
  const active = Boolean(V2_ACTIVE && hasFighter && window.BoxeurWorld && window.BoxeurCareerV2Migration);
  document.body.classList.toggle("v2-preview", active);
  if (!root) return;
  root.hidden = !active;
  if (active) {
    root.innerHTML = window.BoxeurWorld.render(v2CareerView());
    const panel = root.querySelector(".v2-now-panel");
    if (panel && window.BoxeurWeekView && window.BoxeurWeek) {
      const anchorCard = panel.querySelector(".v2-objective-card") || panel.querySelector(".v2-now-time");
      const launcher = window.BoxeurWeekView.renderLauncher(v2WeekViewContext());
      if (anchorCard) anchorCard.insertAdjacentHTML("afterend", launcher);
      else panel.insertAdjacentHTML("afterbegin", launcher);
    }
  }
}

function v2PreviewFingerprint(career = state) {
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
    career.initialGymRequired === true,
    career.introJobRequired === true,
    safeNumber(career.initialJobLockedUntilWeek, 0, 0, 99999),
    career.jobId || null,
    safeNumber(career.jobsHeldCount, 0, 0, 999),
    safeNumber(career.jobTenureWeeks, 0, 0, 9999),
    safeNumber(career.jobWagesEarned, 0, 0, 99999999),
    safeNumber(career.vacationBankWeeks, 0, 0, MAX_PAID_VACATION_WEEKS),
    safeNumber(career.missedWorkWeeks, 0, 0, 3),
    safeNumber(career.trainingRhythmPenalty, 0, 0, 2),
    safeNumber(career.jobVacationEarnedAtTenure, 0, 0, 9999),
    career.jobApplication || null,
    safeNumber(career.recreationalTrainingWeeks, 0, 0, 999),
    career.scheduledFight?.id || null,
    career.scheduledFight?.week || null,
    career.activeTournament?.id || null,
    career.activeTournament?.status || null,
    career.v2SupplementState || null,
    career.v2TrainerState || null,
    career.progressionState || null,
  ]);
}

function createV2PreviewCapsule() {
  const snapshot = careerSnapshot();
  const capsule = window.BoxeurCareerV2Migration.migrateV5ToV2(snapshot, {
    seed: `preview:${v2PreviewFingerprint(state)}`,
  });
  capsule.previewFingerprint = v2PreviewFingerprint(state);
  capsule.previewRuntime = {
    trainingSessions: safeNumber(state.recreationalTrainingWeeks, 0, 0, 999),
    sessions: [],
    weekMode: "quick",
    weekPlanner: state.v2WeekPlannerState ? cloneData(state.v2WeekPlannerState) : null,
    weekPlannerSignature: null,
    weeklySummaries: [],
    weekLedgers: {},
    settledWeeks: [],
    career: createV2RuntimeCareer(),
  };
  return capsule;
}

function createV2RuntimeCareer(source = state) {
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
    trainingRhythmPenalty: safeNumber(source.trainingRhythmPenalty, 0, 0, 2),
    jobVacationEarnedAtTenure: safeNumber(source.jobVacationEarnedAtTenure, 0, 0, 9999),
    jobReferenceBonus: source.jobReferenceBonus === true,
    jobApplication: source.jobApplication && typeof source.jobApplication === "object"
      ? cloneData(source.jobApplication)
      : null,
    experience: safeNumber(source.experience, 0, 0, 99999999),
    v2SupplementState: window.BoxeurSupplements
      ? window.BoxeurSupplements.createState(source.v2SupplementState || source, { weekKey: sourceWeek })
      : source.v2SupplementState && typeof source.v2SupplementState === "object" ? cloneData(source.v2SupplementState) : null,
    v2TrainerState: window.BoxeurTrainer
      ? window.BoxeurTrainer.createState(source.v2TrainerState || {})
      : source.v2TrainerState && typeof source.v2TrainerState === "object" ? cloneData(source.v2TrainerState) : null,
    v2WeekPlannerState: source.v2WeekPlannerState && typeof source.v2WeekPlannerState === "object"
      ? cloneData(source.v2WeekPlannerState)
      : null,
    progressionState: window.BoxeurProgression && source.progressionState?.kind === window.BoxeurProgression.STATE_KIND
      ? window.BoxeurProgression.createState(source.progressionState)
      : null,
  };
}

function normalizeV2PreviewRuntime(capsule) {
  if (!capsule.previewRuntime || typeof capsule.previewRuntime !== "object") capsule.previewRuntime = {};
  const runtime = capsule.previewRuntime;
  runtime.trainingSessions = safeNumber(runtime.trainingSessions, state.recreationalTrainingWeeks, 0, 999);
  if (!Array.isArray(runtime.sessions)) runtime.sessions = [];
  runtime.weekMode = runtime.weekMode === "detailed" ? "detailed" : "quick";
  const suppliedPlanner = Object.prototype.hasOwnProperty.call(runtime, "weekPlanner")
    ? runtime.weekPlanner
    : state.v2WeekPlannerState;
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
  const defaults = createV2RuntimeCareer();
  const suppliedCareer = runtime.career && typeof runtime.career === "object" ? runtime.career : {};
  let normalizedSupplementState = window.BoxeurSupplements
    ? window.BoxeurSupplements.createState(suppliedCareer.v2SupplementState || defaults.v2SupplementState || {}, { weekKey: capsule.timeState?.clock?.week || state.week })
    : suppliedCareer.v2SupplementState || defaults.v2SupplementState || null;
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
    trainingRhythmPenalty: safeNumber(suppliedCareer.trainingRhythmPenalty, defaults.trainingRhythmPenalty, 0, 2),
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
    initialGymRequired: suppliedCareer.initialGymRequired == null ? defaults.initialGymRequired : suppliedCareer.initialGymRequired === true,
    introJobRequired: suppliedCareer.introJobRequired == null ? defaults.introJobRequired : suppliedCareer.introJobRequired === true,
    initialJobLockedUntilWeek: safeNumber(suppliedCareer.initialJobLockedUntilWeek, defaults.initialJobLockedUntilWeek, 0, 99999),
    jobId: typeof suppliedCareer.jobId === "string" ? suppliedCareer.jobId : null,
    v2SupplementState: normalizedSupplementState,
    v2TrainerState: window.BoxeurTrainer
      ? window.BoxeurTrainer.createState(suppliedCareer.v2TrainerState || defaults.v2TrainerState || {})
      : suppliedCareer.v2TrainerState || defaults.v2TrainerState || null,
    progressionState: window.BoxeurProgression && suppliedCareer.progressionState?.kind === window.BoxeurProgression.STATE_KIND
      ? window.BoxeurProgression.createState(suppliedCareer.progressionState)
      : defaults.progressionState,
  };
  return runtime;
}

function invalidateV2PreviewCapsule() {
  v2PreviewCapsule = null;
  try {
    localStorage.removeItem(V2_PREVIEW_SAVE_KEY);
  } catch (error) {
    console.warn("[Boxeur Deux] Capsule V2 impossible à invalider :", error);
  }
}

function ensureV2PreviewCapsule() {
  if (!V2_ACTIVE || !state.profile || !window.BoxeurCareerV2Migration) return null;
  if (v2PreviewCapsule?.previewFingerprint === v2PreviewFingerprint(state)) return v2PreviewCapsule;
  try {
    const stored = JSON.parse(localStorage.getItem(V2_PREVIEW_SAVE_KEY) || "null");
    if (window.BoxeurCareerV2Migration.isV2Capsule(stored) && stored.previewFingerprint === v2PreviewFingerprint(state)) {
      v2PreviewCapsule = window.BoxeurCareerV2Migration.migrateV5ToV2(stored);
    } else {
      v2PreviewCapsule = createV2PreviewCapsule();
    }
  } catch (error) {
    console.warn("[Boxeur Deux] Capsule V2 recréée :", error);
    v2PreviewCapsule = createV2PreviewCapsule();
  }
  normalizeV2PreviewRuntime(v2PreviewCapsule);
  persistV2PreviewCapsule();
  return v2PreviewCapsule;
}

function syncV2CapsuleToCareer(capsule) {
  if (!capsule?.timeState?.clock || !state.profile) return;
  const runtime = normalizeV2PreviewRuntime(capsule);
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
  state.trainingRhythmPenalty = safeNumber(career.trainingRhythmPenalty, state.trainingRhythmPenalty, 0, 2);
  state.jobVacationEarnedAtTenure = safeNumber(career.jobVacationEarnedAtTenure, state.jobVacationEarnedAtTenure, 0, 9999);
  state.jobReferenceBonus = career.jobReferenceBonus === true;
  state.jobApplication = career.jobApplication ? cloneData(career.jobApplication) : null;
  state.experience = safeNumber(career.experience, state.experience, 0, 99999999);
  Object.keys(combatLabels).forEach(key => {
    state.combatStats[key] = safeNumber(capsule.timeState.stats?.[key], state.combatStats[key], 0, 99, false);
  });
  state.v2SupplementState = career.v2SupplementState ? cloneData(career.v2SupplementState) : null;
  state.v2TrainerState = career.v2TrainerState ? cloneData(career.v2TrainerState) : null;
  state.v2WeekPlannerState = runtime.weekPlanner ? cloneData(runtime.weekPlanner) : null;
  state.progressionState = career.progressionState ? cloneData(career.progressionState) : null;
  state.recreationalTrainingWeeks = safeNumber(runtime.trainingSessions, state.recreationalTrainingWeeks, 0, 999);
  syncLevelProgress();
  if (state.careerStatus === "recreational") scheduleRecreationalSparring([]);
  capsule.previewFingerprint = v2PreviewFingerprint(state);
}

function persistV2PreviewCapsule() {
  if (!v2PreviewCapsule) return;
  syncV2CapsuleToCareer(v2PreviewCapsule);
  try {
    localStorage.setItem(V2_PREVIEW_SAVE_KEY, JSON.stringify(v2PreviewCapsule));
    persistCareer();
  } catch (error) {
    console.warn("[Boxeur Deux] Capsule V2 non enregistrée :", error);
  }
}

function v2OnboardingSnapshot(capsule = ensureV2PreviewCapsule()) {
  if (!capsule?.timeState?.clock || !window.BoxeurOnboarding) return null;
  const runtime = normalizeV2PreviewRuntime(capsule);
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
        v2DeveloperTest: { active: isDeveloperTestActive() },
      };
  runtime.onboardingState = window.BoxeurOnboarding.normalizeState(source, {
    developerMode: isDeveloperTestActive(),
  });
  return runtime.onboardingState;
}

function v2OnboardingView(capsule = ensureV2PreviewCapsule()) {
  const onboarding = v2OnboardingSnapshot(capsule);
  if (!onboarding || !window.BoxeurOnboarding) return null;
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
        detail: "Les quatre semaines du premier mois sont terminées. Choisis et paie réellement un nouveau forfait pour reprendre le cours récréatif et conserver l’accès à Rémy.",
        locationId: "boxing-gym",
      };
    } else if (!quickGroupClass || !quickRest) {
      step = {
        ...baseStep,
        id: "week-5-prepare-quick-plan",
        type: "plan-quick",
        title: "Préparer la semaine avant Rémy",
        detail: "Ton abonnement est actif. Suis un dernier plan rapide : il conservera le travail et ajoutera le cours récréatif avec une journée de repos.",
        locationId: "map",
        actionMode: "quick-plan",
      };
    } else {
      step = reviewStep(
        "week-5-review-program",
        "Dernière semaine avant Rémy",
        "Ton abonnement est actif et le cours récréatif est prévu avec du repos. Confirme cette semaine; Rémy deviendra accessible seulement à la semaine 6.",
      );
    }
  }
  return {
    state: onboarding,
    gates: window.BoxeurOnboarding.getGates(onboarding),
    step,
  };
}

function v2CompletedOnboardingObjectiveId(onboarding, plannerEntries, executedEntryIds) {
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

function applyV2OnboardingEvent(event) {
  const capsule = ensureV2PreviewCapsule();
  const onboarding = v2OnboardingSnapshot(capsule);
  if (!capsule || !onboarding || !window.BoxeurOnboarding) return null;
  const next = window.BoxeurOnboarding.applyEvent(onboarding, event);
  normalizeV2PreviewRuntime(capsule).onboardingState = next;
  return next;
}

function v2ProgressionSnapshot(capsule = ensureV2PreviewCapsule()) {
  if (!capsule?.timeState?.stats || !window.BoxeurProgression) return null;
  const runtime = normalizeV2PreviewRuntime(capsule);
  const previous = runtime.career.progressionState?.kind === window.BoxeurProgression.STATE_KIND
    ? runtime.career.progressionState
    : null;
  const integerStats = {};
  const progress = {};
  window.BoxeurProgression.STAT_KEYS.forEach(key => {
    const raw = safeNumber(capsule.timeState.stats[key], state.combatStats[key], 0, 99);
    integerStats[key] = Math.floor(raw);
    const fractionalProgress = Math.round((raw - Math.floor(raw)) * 10000) / 100;
    progress[key] = previous?.stats?.[key] === integerStats[key] && fractionalProgress === 0
      ? safeNumber(previous.progress?.[key], 0, 0, 100)
      : fractionalProgress;
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

function v2PreparationView(timeState) {
  if (!timeState || !window.BoxeurTime) return null;
  const base = window.BoxeurTime.getPreparation(timeState);
  if (state.injuryWeeks > 0) {
    return {
      ...base,
      status: "injured",
      tone: "critical",
      label: "Repos médical",
      detail: `${state.injuryWeeks} semaine${state.injuryWeeks > 1 ? "s" : ""} avant le retour à l’entraînement de boxe.`,
    };
  }
  const tone = base.status === "excellent" || base.status === "good"
    ? "positive"
    : base.status === "fair" ? "steady" : base.status === "fragile" ? "warning" : "critical";
  return { ...base, tone, detail: base.reasons.join(" · ") };
}

function v2CareerView() {
  const capsule = ensureV2PreviewCapsule();
  if (!capsule?.timeState) return state;
  const timeState = capsule.timeState;
  const runtime = normalizeV2PreviewRuntime(capsule);
  const runtimeCareer = runtime.career;
  const workStatus = v2WorkStatus(timeState, runtimeCareer);
  const onboarding = v2OnboardingView(capsule);
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
    v2Clock: cloneData(timeState.clock),
    v2Appointments: window.BoxeurTime ? window.BoxeurTime.getAgenda(timeState) : [],
    v2DateLabel: currentDate ? formatCareerDate(currentDate) : "Date inconnue",
    v2Preparation: v2PreparationView(timeState),
    v2Onboarding: onboarding?.state || null,
    v2OnboardingStep: onboarding?.step || null,
    v2Job: jobs.find(job => job.id === runtimeCareer.jobId) || null,
    ...workStatus,
    v2DeveloperTest: {
      active: isDeveloperTestActive(),
      canReturn: hasDeveloperReturnCareer(),
      profileLabel: [state.profile?.firstName, state.profile?.lastName].filter(Boolean).join(" "),
    },
  };
}

function v2WorkLocationContext() {
  const career = v2CareerView();
  const capsule = ensureV2PreviewCapsule();
  const plannerState = capsule ? ensureV2WeekPlanner(capsule) : null;
  const workEntry = plannerState?.entries?.find(entry => entry.source === "work") || null;
  return {
    ...career,
    v2JobOffers: jobs.map(job => ({ id: job.id, title: job.title, wage: job.wage, schedule: job.schedule })),
    v2JobApplicationLabel: jobs.find(job => job.id === career.jobApplication?.jobId)?.title || "",
    v2WorkPlan: {
      planned: Boolean(workEntry),
      entryId: workEntry?.id || null,
      cost: safeNumber(workEntry?.capacityCost, v2PlannerWorkCost(career.v2Job), 0, 100),
    },
  };
}

function v2GymContext() {
  const capsule = ensureV2PreviewCapsule();
  if (!capsule?.timeState || !window.BoxeurTraining || !window.BoxeurTime) return null;
  const career = v2CareerView();
  const prep = v2PreparationView(capsule.timeState);
  const trainingContext = v2TrainingContext();
  const coachSession = window.BoxeurTraining.buildCoachSession(capsule.timeState, trainingContext);
  const coachPreview = window.BoxeurTraining.previewSession(capsule.timeState, coachSession, trainingContext);
  const boxingCoach = privateCoaches.find(item => item.id === state.privateProgram?.coachId && item.type === "boxing");
  const runtime = normalizeV2PreviewRuntime(capsule);
  const activeTrainerProgram = window.BoxeurTrainer && runtime.career.v2TrainerState
    ? window.BoxeurTrainer.getPublicState(runtime.career.v2TrainerState).activeProgram
    : null;
  const boxingTrainerProgram = activeTrainerProgram && ["technique", "defense"].includes(activeTrainerProgram.target)
    ? activeTrainerProgram
    : null;
  const plannerState = ensureV2WeekPlanner(capsule);
  const plannerPreview = window.BoxeurWeekPlanner.previewPlan(plannerState);
  const coachPlannerId = state.careerStatus === "recreational" ? "group-class" : "boxing-coach";
  const coachPlanState = v2PlannerActionState(coachPlannerId);
  const sparringPlanState = v2PlannerActionState("sparring");
  const membershipMissing = career.gymWeeks <= 0;
  const trainingBlocked = state.injuryWeeks > 0 || membershipMissing || plannerPreview.capacity.remaining <= 0;
  const trainingBlockedReason = state.injuryWeeks > 0
    ? prep.detail
    : membershipMissing
      ? "Inscription requise : passe à l’accueil. Le sac au sous-sol demeure accessible comme dépannage."
      : "La barre d’énergie de la semaine est vide. Retire une activité du programme pour en ajouter une autre.";
  return {
    profile: state.profile,
    careerStatus: state.careerStatus,
    careerStatusLabel: state.careerStatus === "professional" ? "Professionnel" : state.careerStatus === "amateur" ? "Amateur" : "Récréatif",
    clock: {
      ...capsule.timeState.clock,
      dateLabel: career.v2DateLabel,
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
      name: boxingCoach?.name || "l’entraîneur du GYM",
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
          ? `Ajout au programme · ${plannerPreview.capacity.remaining}/${plannerPreview.capacity.total} énergie hebdomadaire disponible. ${coachSession.tradeoff}`
          : coachPreview.reason,
    },
    privateTrainer: {
      available: career.gymWeeks > 0 && state.careerStatus !== "recreational" && state.careerStatus !== "amateur_pending",
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
      targetWeeks: RECREATIONAL_MAX_WEEK,
      sparringWeek: 6,
      remyStatus: career.v2Onboarding?.remyStatus === "completed" || state.recreationalSparringStatus === "completed"
        ? "completed"
        : career.v2Onboarding?.remyStatus === "ready" || state.recreationalSparringStatus === "ready"
          ? "ready"
          : state.scheduledFight?.isRecreationalSparring ? "scheduled" : "locked",
      remyDetail: career.v2OnboardingStep?.type === "sparring" ? career.v2OnboardingStep.detail : "",
    },
    weekCapacity: {
      total: plannerPreview.capacity.total,
      used: plannerPreview.capacity.used,
      remaining: plannerPreview.capacity.remaining,
    },
    weekPlan: {
      entries: v2PlannerLocationEntries(plannerState, "boxing-gym"),
    },
    sparring: sparringPlanState,
  };
}

function v2ReservedBoxingGymBudget(career = v2CareerView()) {
  return career.initialGymRequired && career.gymWeeks <= 0 ? GYM_PRICE : 0;
}

function v2StrengthContext() {
  const capsule = ensureV2PreviewCapsule();
  if (!capsule?.timeState || !window.BoxeurStrength || !window.BoxeurStrengthView) return null;
  const runtime = normalizeV2PreviewRuntime(capsule);
  const career = v2CareerView();
  const trainerProgram = window.BoxeurTrainer && runtime.career.v2TrainerState
    ? window.BoxeurTrainer.getPublicState(runtime.career.v2TrainerState).activeProgram
    : null;
  const strengthProgram = trainerProgram && ["power", "cardio"].includes(trainerProgram.target) ? trainerProgram : null;
  const supplementInventory = window.BoxeurSupplements && runtime.career.v2SupplementState
    ? window.BoxeurSupplements.inventoryList(runtime.career.v2SupplementState)
    : [];
  const reserve = v2ReservedBoxingGymBudget(career);
  const plannerPreview = window.BoxeurWeekPlanner.previewPlan(ensureV2WeekPlanner(capsule));
  const quickState = v2PlannerActionState("strength-quick");
  return {
    profile: state.profile,
    careerStatus: state.careerStatus === "amateur_pending" ? "recreational" : state.careerStatus,
    condition: {
      energy: capsule.timeState.condition.energy,
      fatigue: capsule.timeState.condition.fatigue,
      medicalBlocked: state.injuryWeeks > 0,
      injuryWeeks: state.injuryWeeks,
      medicalReason: state.injuryWeeks > 0 ? v2PreparationView(capsule.timeState).detail : "",
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
    selectedActivities: v2StrengthSelection,
    physicalSessionCompletedToday: false,
    trainer: {
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
      itemCount: supplementInventory.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
      summary: "Un seul produit peut être préparé avant une séance; maximum de deux utilisations par semaine.",
    },
    weekCapacity: {
      total: plannerPreview.capacity.total,
      used: plannerPreview.capacity.used,
      remaining: plannerPreview.capacity.remaining,
    },
    weekPlan: {
      entries: v2PlannerLocationEntries(ensureV2WeekPlanner(capsule), "strength-gym"),
    },
    quick: quickState,
  };
}

const V2_HOME_ACTIVITIES = Object.freeze({
  meal: Object.freeze({
    id: "home-meal",
    label: "Repas maison de récupération",
    category: "home-recovery",
    duration: 1,
    energyCost: 0,
    energyGain: 9,
    fatigueGain: 0,
    fatigueRelief: 2,
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

function v2ActivityOnCurrentDay(timeState, predicate) {
  if (!Array.isArray(timeState?.history) || !window.BoxeurTime) return null;
  const dayStart = v2DayStartSlot(timeState);
  const dayEnd = dayStart + window.BoxeurTime.PERIODS_PER_DAY;
  return [...timeState.history].reverse().find(event => (
    event?.type === "activity-completed"
    && Number(event.fromSlot) >= dayStart
    && Number(event.fromSlot) < dayEnd
    && predicate(event)
  )) || null;
}

function v2HomeActivityState(timeState, viewId, physicalDone) {
  const activity = V2_HOME_ACTIVITIES[viewId];
  if (!activity) return { available: false, reason: "Activité inconnue." };
  if (activity.category === "home-training") {
    if (state.injuryWeeks > 0) return { available: false, reason: v2PreparationView(timeState).detail };
    if (physicalDone) return { available: false, reason: "Une activité physique principale a déjà été faite aujourd’hui." };
  }
  if (viewId === "meal" && v2ActivityOnCurrentDay(timeState, event => event.activityId === activity.id)) {
    return { available: false, reason: "Le repas de récupération de cette journée est déjà préparé." };
  }
  if (v2WouldCrossWeek(timeState, activity.duration)) {
    return { available: false, reason: "Cette activité dépasserait la fin de la semaine actuelle." };
  }
  const check = window.BoxeurTime.canPerformActivity(timeState, activity);
  return { available: check.ok, reason: check.ok ? "" : check.reason };
}

function v2HomeContext() {
  const capsule = ensureV2PreviewCapsule();
  if (!capsule?.timeState || !window.BoxeurRecovery || !window.BoxeurTime || !window.BoxeurWeekPlanner) return null;
  const timeState = capsule.timeState;
  const preparation = v2PreparationView(timeState);
  const plannerState = ensureV2WeekPlanner(capsule);
  const preview = window.BoxeurWeekPlanner.previewPlan(plannerState);
  const pendingLoad = Object.values(timeState.stimulus).reduce((sum, value) => sum + Number(value || 0), 0) / window.BoxeurTime.STAT_KEYS.length;
  const recommendation = state.injuryWeeks > 0
    ? { title: "Le repos médical passe en premier", detail: preparation.detail, tone: "critical" }
    : timeState.condition.fatigue >= 65
    ? { title: "Une journée de repos est prioritaire", detail: "La fatigue persistante est trop haute pour empiler une autre grosse séance; la nuit sera appliquée automatiquement.", tone: "critical" }
    : pendingLoad >= 12
      ? { title: "Laisse le travail s’assimiler", detail: "Une nuit transformera une partie de la charge du GYM en progression permanente.", tone: "warning" }
      : preparation.score >= 80
        ? { title: "Tu peux ajouter une séance", detail: "Compare le coût hebdomadaire du GYM et de la maison avant de confirmer.", tone: "positive" }
        : { title: "Prévois une récupération", detail: "Une journée plus calme préservera une partie de ta réserve pour la semaine suivante.", tone: "steady" };
  const actionState = id => v2PlannerActionState(id);
  const homeEntries = v2PlannerLocationEntries(plannerState, "home");
  return {
    profile: state.profile,
    careerStatus: state.careerStatus === "amateur_pending" ? "recreational" : state.careerStatus,
    clock: {
      ...timeState.clock,
      dateLabel: v2CareerView().v2DateLabel,
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
      "play-v1": { available: true, reason: "" },
    },
    weekCapacity: {
      allowed: preview.capacity.total,
      used: preview.capacity.used,
      remaining: preview.capacity.remaining,
      label: "Énergie de la semaine",
    },
    plan: {
      title: "Programme de la semaine",
      note: "Chaque choix réserve de l’énergie; tu peux le retirer avant la confirmation.",
      entries: homeEntries,
    },
  };
}

function v2FighterContext() {
  const capsule = ensureV2PreviewCapsule();
  const runtime = capsule ? normalizeV2PreviewRuntime(capsule) : null;
  const career = v2CareerView();
  const progression = v2ProgressionSnapshot(capsule);
  const timeStats = progression?.stats || capsule?.timeState?.stats || state.combatStats;
  const explicitProgress = progression?.progress;
  const supplementState = runtime?.career?.v2SupplementState;
  const trainerState = runtime?.career?.v2TrainerState;
  return {
    profile: state.profile,
    careerStatus: state.careerStatus === "amateur_pending" ? "recreational" : state.careerStatus,
    statusLabel: isAwaitingAmateurTransition()
      ? "Prêt à passer amateur"
      : isRecreationalCareer() ? "Récréatif" : state.careerStatus === "professional" ? "Professionnel" : "Amateur",
    styleLabel: styles[state.profile?.style]?.label || "Équilibré",
    weightLabel: state.profile ? weightClassLabel(state.profile.weightClass, state.profile.sex) : "Catégorie à confirmer",
    money: career.money,
    level: state.level,
    levelPoints: state.levelPoints,
    experience: career.experience,
    amateurRecord: state.amateurRecord,
    combatStats: timeStats,
    statProgress: explicitProgress,
    supplementInventory: window.BoxeurSupplements && supplementState
      ? window.BoxeurSupplements.inventoryList(supplementState)
      : [],
    supplementNote: state.careerStatus === "recreational"
      ? "Le gym de musculation et sa boutique se débloquent après le passage amateur."
      : "Achète tes produits au gym de musculation; leur utilisation sera proposée avant une séance.",
    privateTrainerProgram: window.BoxeurTrainer && trainerState
      ? window.BoxeurTrainer.getPublicState(trainerState).activeProgram
      : null,
  };
}

let v2LocationReturnFocus = null;

function v2LocationFocusableElements(sheet) {
  if (!sheet) return [];
  return Array.from(sheet.querySelectorAll("a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])"))
    .filter(element => element.getClientRects().length > 0 && !element.closest("[hidden]") && element.getAttribute("aria-hidden") !== "true");
}

function setV2LocationBackgroundInert(sheet, inactive) {
  if (!sheet?.parentElement) return;
  Array.from(sheet.parentElement.children).forEach(element => {
    if (element === sheet) return;
    if (inactive) {
      if (!element.inert) {
        element.inert = true;
        element.dataset.v2LocationInert = "true";
      }
    } else if (element.dataset.v2LocationInert === "true") {
      element.inert = false;
      delete element.dataset.v2LocationInert;
    }
  });
}

function activateV2LocationSheet(sheet, preferredFocusSelector) {
  if (!sheet) return;
  sheet.hidden = false;
  sheet.setAttribute("role", "dialog");
  sheet.setAttribute("aria-modal", "true");
  sheet.setAttribute("tabindex", "-1");
  const title = sheet.querySelector("h2");
  if (title) {
    if (!title.id) title.id = "v2-location-dialog-title";
    sheet.setAttribute("aria-labelledby", title.id);
    sheet.removeAttribute("aria-label");
  } else {
    sheet.removeAttribute("aria-labelledby");
    sheet.setAttribute("aria-label", "Lieu du quartier");
  }
  setV2LocationBackgroundInert(sheet, true);
  const preferred = preferredFocusSelector ? sheet.querySelector(preferredFocusSelector) : null;
  const target = preferred || v2LocationFocusableElements(sheet)[0] || sheet;
  target.focus({ preventScroll: true });
}

function openV2Location(locationId) {
  const sheet = document.querySelector("#v2-world .v2-location-sheet");
  if (!sheet) return;
  if (sheet.hidden) {
    const currentFocus = document.activeElement;
    v2LocationReturnFocus = currentFocus instanceof HTMLElement && currentFocus !== document.body
      ? currentFocus
      : document.querySelector(`#v2-world [data-v2-location="${safeIdentifier(locationId, "home")}"]`);
  }
  sheet.dataset.originLocation = locationId;
  const isBoxingGym = locationId === "boxing-gym" && window.BoxeurGymView;
  const isStrengthGym = locationId === "strength-gym" && window.BoxeurStrengthView;
  const isHome = locationId === "home" && window.BoxeurHomeView;
  const isWork = locationId === "work" && window.BoxeurWorkView;
  const career = v2CareerView();
  sheet.classList.toggle("v2-location-sheet-full", Boolean(isBoxingGym || isStrengthGym || isHome || isWork));
  sheet.classList.toggle("v2-location-sheet-strength", Boolean(isStrengthGym));
  sheet.innerHTML = isBoxingGym
    ? window.BoxeurGymView.render(v2GymContext())
    : isStrengthGym
      ? window.BoxeurStrengthView.render(v2StrengthContext())
      : isHome
        ? window.BoxeurHomeView.render(v2HomeContext())
        : isWork
          ? window.BoxeurWorkView.render(v2WorkLocationContext())
        : window.BoxeurWorld.renderLocation(locationId, locationId === "work" ? v2WorkLocationContext() : career);
  if (["boxing-gym", "home", "work"].includes(locationId) && window.BoxeurWorld?.renderLocationGuide) {
    const guide = window.BoxeurWorld.renderLocationGuide(career, locationId);
    const guideTarget = isBoxingGym
      ? sheet.querySelector(".v2-gym-dashboard")
      : isHome
        ? sheet.querySelector(".v2-home-dashboard")
        : isWork
          ? sheet.querySelector(".v2-work-dashboard")
          : sheet.querySelector(".v2-location-card");
    if (guide && guideTarget) guideTarget.insertAdjacentHTML("afterbegin", guide);
  }
  if (isWork && window.BoxeurWorld?.renderWorkDeveloperTile) {
    sheet.querySelector(".v2-work-dashboard")?.insertAdjacentHTML("beforeend", window.BoxeurWorld.renderWorkDeveloperTile());
  }
  activateV2LocationSheet(sheet, "[data-v2-leave-gym], [data-v2-leave-strength-gym], [data-v2-leave-home], [data-v2-leave-work], [data-v2-close-location], button");
}

function openV2Fighter() {
  const sheet = document.querySelector("#v2-world .v2-location-sheet");
  if (!sheet || !window.BoxeurFighterView) return;
  if (sheet.hidden) {
    const currentFocus = document.activeElement;
    v2LocationReturnFocus = currentFocus instanceof HTMLElement && currentFocus !== document.body
      ? currentFocus
      : document.querySelector('#v2-world [data-v2-nav="fighter"]');
  }
  sheet.dataset.originLocation = "fighter";
  sheet.classList.add("v2-location-sheet-full");
  sheet.innerHTML = window.BoxeurFighterView.render(v2FighterContext());
  activateV2LocationSheet(sheet, "[data-v2-close-fighter]");
}

function v2InventoryContext() {
  const capsule = ensureV2PreviewCapsule();
  const runtime = normalizeV2PreviewRuntime(capsule);
  const plannerState = ensureV2WeekPlanner(capsule);
  const preview = window.BoxeurWeekPlanner.previewPlan(plannerState);
  const physicalEntries = preview.entries.filter(entry => entry.physical && entry.activityId !== "sparring" && !entry.metadata?.completed);
  const reservedByProduct = Object.fromEntries(preview.supplements.reservations.map(reservation => [reservation.productId, reservation.entryId]));
  const inventory = window.BoxeurSupplements.inventoryList(v2SupplementState(capsule));
  return {
    profile: state.profile,
    eyebrow: "Inventaire de carrière",
    title: "Sac et suppléments",
    introduction: "Les suppléments restent modestes : associe-en un à une séance déjà planifiée pour récupérer un peu d’énergie hebdomadaire. Maximum de deux par semaine.",
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

function openV2Inventory() {
  const sheet = document.querySelector("#v2-world .v2-location-sheet");
  if (!sheet || !window.BoxeurInventoryView) return;
  if (sheet.hidden) {
    const currentFocus = document.activeElement;
    v2LocationReturnFocus = currentFocus instanceof HTMLElement && currentFocus !== document.body
      ? currentFocus
      : document.querySelector('#v2-world [data-v2-nav="inventory"]');
  }
  sheet.dataset.originLocation = "inventory";
  sheet.classList.add("v2-location-sheet-full");
  sheet.innerHTML = window.BoxeurInventoryView.render(v2InventoryContext());
  activateV2LocationSheet(sheet, "[data-v2-close-inventory], [data-v2-inventory-action]");
}

function openV2SupplementReservation(productId) {
  const capsule = ensureV2PreviewCapsule();
  const sheet = document.querySelector("#v2-world .v2-location-sheet");
  const product = window.BoxeurSupplements.CATALOG[productId];
  if (!capsule || !sheet || !product) return;
  const plannerState = ensureV2WeekPlanner(capsule);
  const entries = plannerState.entries.filter(entry => entry.physical && entry.activityId !== "sparring" && !entry.metadata?.completed);
  const choices = entries.map(entry => {
    const selected = entry.supplementId === productId;
    return `<article class="v2-supplement-card${selected ? " selected" : ""}"><div><p class="eyebrow">${escapeHTML(V2_PLANNER_DAY_LABELS[entry.day] || entry.day)}</p><h3>${escapeHTML(entry.label)}</h3></div><p>Coût actuel : ${entry.capacityCost} énergie hebdomadaire.</p><button type="button" data-v2-plan-supplement-entry="${escapeHTML(entry.id)}" data-v2-plan-supplement-product="${escapeHTML(productId)}">${selected ? "Garder cette séance" : "Associer ici"}</button>${entry.supplementId && !selected ? `<small>Remplacera ${escapeHTML(window.BoxeurSupplements.CATALOG[entry.supplementId]?.label || "le produit actuel")}.</small>` : ""}${entry.supplementId ? `<button type="button" class="text-button" data-v2-plan-supplement-remove="${escapeHTML(entry.id)}">Retirer le produit actuel</button>` : ""}</article>`;
  }).join("");
  sheet.dataset.originLocation = "inventory";
  sheet.classList.add("v2-location-sheet-full");
  sheet.innerHTML = `<section class="v2-service-panel v2-supplement-picker" aria-labelledby="v2-inventory-reserve-title"><header><div><p class="eyebrow">${escapeHTML(product.label)} · ×${v2SupplementState(capsule).inventory[productId] || 0}</p><h2 id="v2-inventory-reserve-title">Choisis une séance</h2></div><button type="button" class="secondary-button" data-v2-inventory-reserve-close>Retour à l’inventaire</button></header><p>${escapeHTML(product.benefit)} Le coût hebdomadaire sera recalculé à partir du même effet appliqué pendant la séance; le produit sera consommé seulement à la confirmation.</p><div class="v2-supplement-grid">${choices}</div></section>`;
  activateV2LocationSheet(sheet, "[data-v2-plan-supplement-entry], [data-v2-inventory-reserve-close]");
}

function reserveV2PlannerSupplement(entryId, productId) {
  const capsule = ensureV2PreviewCapsule();
  try {
    const outcome = v2PlannerReserveSupplementOnState(ensureV2WeekPlanner(capsule), entryId, productId);
    v2PlannerStore(capsule, outcome.state);
    openV2Inventory();
    showToast(`${window.BoxeurSupplements.CATALOG[productId]?.label || "Supplément"} réservé · la barre hebdomadaire remonte légèrement`);
  } catch (error) {
    showToast(error.message || "Ce supplément ne peut pas être réservé.");
  }
}

function unreserveV2PlannerSupplement(entryId) {
  const capsule = ensureV2PreviewCapsule();
  try {
    let plannerState = ensureV2WeekPlanner(capsule);
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
    v2PlannerStore(capsule, plannerState);
    openV2Inventory();
    showToast("Réservation retirée · le produit reste dans l’inventaire.");
  } catch (error) {
    showToast(error.message || "La réservation ne peut pas être retirée.");
  }
}

function closeV2Location() {
  const sheet = document.querySelector("#v2-world .v2-location-sheet");
  if (!sheet) return;
  if (sheet.querySelector(".v2-supplement-picker")) v2PendingTraining = null;
  const origin = sheet.dataset.originLocation;
  const rememberedFocus = v2LocationReturnFocus;
  sheet.hidden = true;
  sheet.classList.remove("v2-location-sheet-full");
  sheet.classList.remove("v2-location-sheet-strength");
  setV2LocationBackgroundInert(sheet, false);
  v2LocationReturnFocus = null;
  const fallback = document.querySelector(`#v2-world [data-v2-location="${safeIdentifier(origin, "home")}"]`);
  const target = rememberedFocus?.isConnected ? rememberedFocus : fallback;
  target?.focus({ preventScroll: true });
}

function revealPendingV2LevelAlert() {
  if (state.levelAnnouncementPending) setTimeout(showCareerAlertOrContinue, 0);
}

const V2_EXERCISE_TO_ENGINE = Object.freeze({
  "jump-rope": "jump_rope",
  "shadow-boxing": "shadow_boxing",
  "heavy-bag": "heavy_bag",
  "mitt-work": "mitts",
  defense: "defense_drills",
  cooldown: "cooldown",
});

function v2TrainingContext() {
  const capsule = ensureV2PreviewCapsule();
  const runtimeCareer = capsule ? normalizeV2PreviewRuntime(capsule).career : createV2RuntimeCareer();
  return {
    membershipActive: runtimeCareer.gymWeeks > 0,
    careerStatus: state.careerStatus,
    injury: state.injury,
    injuryWeeks: state.injuryWeeks,
  };
}

function v2Signed(value, suffix = " %") {
  const rounded = Math.round(Number(value) * 10) / 10;
  return `${rounded > 0 ? "+" : ""}${rounded}${suffix}`;
}

function v2WeekStartSlot(timeState) {
  return (timeState.clock.week - 1) * window.BoxeurTime.PERIODS_PER_WEEK;
}

function v2DayStartSlot(timeState, absoluteSlot = timeState?.clock?.absoluteSlot) {
  if (!timeState?.clock || !window.BoxeurTime || !Number.isFinite(Number(absoluteSlot))) return 0;
  const moment = window.BoxeurTime.fromAbsoluteSlot(Math.max(0, Math.trunc(Number(absoluteSlot))));
  return Math.trunc(Number(absoluteSlot)) - moment.periodIndex;
}

function v2IsPrimaryPhysicalEvent(event) {
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

function v2PrimaryTrainingOnDay(timeState, dayStartSlot = v2DayStartSlot(timeState)) {
  if (!Array.isArray(timeState?.history) || !window.BoxeurTime) return false;
  const dayEndSlot = dayStartSlot + window.BoxeurTime.PERIODS_PER_DAY;
  return timeState.history.some(event => {
    if (event?.type !== "activity-completed") return false;
    const fromSlot = Number(event.fromSlot);
    if (!Number.isFinite(fromSlot) || fromSlot < dayStartSlot || fromSlot >= dayEndSlot) return false;
    return v2IsPrimaryPhysicalEvent(event);
  });
}

function v2NextTrainingWindow(timeState) {
  if (!timeState?.clock || !window.BoxeurTime) return { available: false, reason: "Horaire V2 indisponible." };
  const now = timeState.clock.absoluteSlot;
  const currentDayStart = v2DayStartSlot(timeState, now);
  const trainedToday = v2PrimaryTrainingOnDay(timeState, currentDayStart);
  let startSlot = trainedToday
    ? currentDayStart + window.BoxeurTime.PERIODS_PER_DAY + 2
    : currentDayStart + 2;
  if (startSlot < now) startSlot += window.BoxeurTime.PERIODS_PER_DAY;
  const weekEnd = v2WeekStartSlot(timeState) + window.BoxeurTime.PERIODS_PER_WEEK;
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

function prepareV2TrainingWindow(capsule) {
  const windowState = v2NextTrainingWindow(capsule?.timeState);
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

function v2WouldCrossWeek(timeState, duration = 1) {
  if (!timeState?.clock || !window.BoxeurTime) return false;
  const weekEnd = v2WeekStartSlot(timeState) + window.BoxeurTime.PERIODS_PER_WEEK;
  return timeState.clock.absoluteSlot + Math.max(1, Number(duration) || 1) >= weekEnd;
}

function v2WeekTrainingActivityCount(timeState, weekNumber = timeState?.clock?.week) {
  if (!timeState?.clock || !Array.isArray(timeState.history) || !window.BoxeurTime) return 0;
  const week = safeNumber(weekNumber, timeState.clock.week, 1, 99999);
  const start = (week - 1) * window.BoxeurTime.PERIODS_PER_WEEK;
  const end = start + window.BoxeurTime.PERIODS_PER_WEEK;
  return timeState.history.filter(event => (
    v2IsPrimaryPhysicalEvent(event)
    && Number(event.fromSlot) >= start
    && Number(event.fromSlot) < end
  )).length;
}

function v2WeekWorkActivityCount(timeState, jobId = null) {
  if (!timeState?.clock || !Array.isArray(timeState.history) || !window.BoxeurTime) return 0;
  const start = v2WeekStartSlot(timeState);
  const end = start + window.BoxeurTime.PERIODS_PER_WEEK;
  const expectedId = jobId ? `v2-work:${jobId}` : null;
  return timeState.history.filter(event => (
    event.type === "activity-completed"
    && Number(event.fromSlot) >= start
    && Number(event.fromSlot) < end
    && (String(event.activityId || "").startsWith("v2-work:") || (expectedId && event.activityId === expectedId))
  )).length;
}

function v2WorkStatus(timeState, career = {}) {
  const job = jobs.find(item => item.id === career.jobId) || null;
  const completed = Boolean(job && v2WeekWorkActivityCount(timeState, job.id) > 0);
  const tooLate = Boolean(job && !completed && v2WouldCrossWeek(timeState, 2));
  return {
    v2WorkCompleted: completed,
    v2WorkAvailable: Boolean(job && !completed && !tooLate),
    v2WorkBlockReason: completed
      ? "Travail fait cette semaine · paie hebdomadaire versée."
      : tooLate ? "Il ne reste pas assez de temps pour assurer cette semaine de travail avant lundi." : "",
  };
}

function v2WeekLedger(runtime, weekNumber) {
  const key = String(safeNumber(weekNumber, 1, 1, 99999));
  const supplied = runtime.weekLedgers[key] && typeof runtime.weekLedgers[key] === "object" ? runtime.weekLedgers[key] : {};
  runtime.weekLedgers[key] = {
    grossWages: safeNumber(supplied.grossWages, 0, 0, 99999999),
    workShifts: safeNumber(supplied.workShifts, 0, 0, 99),
  };
  return runtime.weekLedgers[key];
}

function recordV2Work(runtime, weekNumber, grossWages, workShifts = 1) {
  const ledger = v2WeekLedger(runtime, weekNumber);
  const pay = safeNumber(grossWages, 0, 0, 99999999);
  const shifts = safeNumber(workShifts, 0, 0, 99);
  ledger.grossWages += pay;
  ledger.workShifts += shifts;
  return ledger;
}

const V2_WEEK_CAPACITY_TOTAL = 50;
const V2_WEEK_RULESET_VERSION = 4;
const V2_WEEK_ACTIVITY_LIMITS = Object.freeze({
  "group-class": 1,
  rest: 2,
  meal: 1,
  sparring: 1,
});
const V2_WEEK_FAMILY_LIMITS = Object.freeze({
  group: 1,
  boxing: 2,
  strength: 2,
  home: 2,
  sparring: 1,
});
const V2_WEEK_TOGGLE_ACTIVITY_IDS = new Set(["group-class", "rest", "meal", "sparring"]);
const V2_CUSTOM_SESSION_BASE_COST = 2;
const V2_PLANNER_DAY_LABELS = Object.freeze({
  monday: "Lundi",
  tuesday: "Mardi",
  wednesday: "Mercredi",
  thursday: "Jeudi",
  friday: "Vendredi",
  saturday: "Samedi",
  sunday: "Dimanche",
});

function v2PlannerWeekKey(capsule = ensureV2PreviewCapsule()) {
  return `week-${capsule?.timeState?.clock?.week || state.week}`;
}

function v2PlannerTrainingEfficiency() {
  return 1 - Math.min(.18, Math.max(0, Number(state.level || 1) - 1) * .015);
}

function v2PlannerLoadCost(energyCost, fatigueDelta, minimum = 4, extraBaseCost = 0) {
  const raw = 2 + Math.max(0, Number(extraBaseCost) || 0) + Math.max(0, Number(energyCost) || 0) * .55 + Math.max(0, Number(fatigueDelta) || 0) * .3;
  return Math.max(minimum, Math.round(raw * v2PlannerTrainingEfficiency()));
}

function v2PlannerWorkCost(job) {
  if (!job) return 0;
  const explicitCapacityCost = Number(job.weekCapacityCost);
  if (Number.isFinite(explicitCapacityCost)) return Math.max(8, Math.round(explicitCapacityCost));
  return Math.max(8, Math.round(Math.max(0, -Number(job.energy || 0)) * .7 + Math.max(0, Number(job.fatigue || 0)) * .5));
}

function v2PlannerCapacityTotal(capsule, career, job) {
  const condition = capsule.timeState.condition || {};
  const conditionPenalty = Math.round(
    Math.max(0, Number(condition.fatigue || 0) - 58) / 8
      + Math.max(0, 38 - Number(condition.energy || 0)) / 8,
  );
  const rhythmPenalty = isCompetitiveCareer()
    ? safeNumber(runtimeCareerTrainingRhythm(career), 0, 0, 2) * 5
    : 0;
  let total = Math.max(32, V2_WEEK_CAPACITY_TOTAL - conditionPenalty - rhythmPenalty);
  return Math.max(v2PlannerWorkCost(job) + 10, total);
}

function runtimeCareerTrainingRhythm(career = v2CareerView()) {
  return safeNumber(career?.trainingRhythmPenalty, state.trainingRhythmPenalty, 0, 2);
}

function v2PlannerSupplementConfig(capsule) {
  const supplementState = v2SupplementState(capsule);
  if (!supplementState) return { inventory: {}, weeklyLimit: 0, alreadyUsed: 0, usedProductIds: [] };
  const currentKeys = new Set([v2PlannerWeekKey(capsule), String(capsule.timeState.clock.week)]);
  const currentUsage = currentKeys.has(String(supplementState.weeklyUsage?.weekKey));
  return {
    inventory: cloneData(supplementState.inventory || {}),
    weeklyLimit: window.BoxeurSupplements.MAX_WEEKLY_USES,
    alreadyUsed: currentUsage ? safeNumber(supplementState.weeklyUsage?.count, 0, 0, window.BoxeurSupplements.MAX_WEEKLY_USES) : 0,
    usedProductIds: currentUsage ? cloneData(supplementState.weeklyUsage?.productIds || []) : [],
    uniqueProducts: true,
  };
}

function v2PlannerBaseConfig(capsule = ensureV2PreviewCapsule()) {
  const runtime = normalizeV2PreviewRuntime(capsule);
  const career = v2CareerView();
  const job = jobs.find(item => item.id === runtime.career.jobId) || null;
  return {
    weekKey: v2PlannerWeekKey(capsule),
    careerStatus: state.careerStatus === "amateur_pending" ? "recreational" : state.careerStatus,
    capacity: v2PlannerCapacityTotal(capsule, career, job),
    condition: cloneData(capsule.timeState.condition),
    work: job ? {
      id: job.id,
      title: job.title,
      active: true,
      weeklyPay: job.wage,
      capacityCost: v2PlannerWorkCost(job),
      energyCost: Math.max(0, -Number(job.energy || 0)),
      fatigueGain: Math.max(0, Number(job.fatigue || 0)),
      // Une entrée représente toute la semaine de travail; elle est réglée le
      // vendredi pour que les choix du camp influencent réellement la fatigue.
      shifts: [{ day: "friday", locked: false }],
      locked: false,
    } : null,
    supplements: v2PlannerSupplementConfig(capsule),
    limits: {
      recreationalPhysicalActivities: 2,
      family: {
        ...V2_WEEK_FAMILY_LIMITS,
        home: state.careerStatus === "recreational" ? 1 : V2_WEEK_FAMILY_LIMITS.home,
      },
    },
  };
}

function v2PlannerSignature(capsule = ensureV2PreviewCapsule()) {
  const runtime = normalizeV2PreviewRuntime(capsule);
  const supplementState = runtime.career.v2SupplementState;
  return JSON.stringify([
    V2_WEEK_RULESET_VERSION,
    capsule.timeState.clock.week,
    state.careerStatus,
    runtime.career.jobId,
    runtime.career.gymWeeks,
    runtime.career.strengthGymWeeks,
    state.injuryWeeks,
    state.level,
    Math.round(capsule.timeState.condition.energy),
    Math.round(capsule.timeState.condition.fatigue),
    runtimeCareerTrainingRhythm(runtime.career),
    supplementState?.inventory || {},
    supplementState?.weeklyUsage || {},
    runtime.career.v2TrainerState?.activeProgram || null,
  ]);
}

function v2PlannerBoxingAggregate(metadata = {}, options = {}) {
  const capsule = ensureV2PreviewCapsule();
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
    session = window.BoxeurTraining.buildCoachSession(capsule.timeState, v2TrainingContext());
  }
  const aggregate = window.BoxeurTraining.aggregateSession(session);
  return { session: aggregate.session, totals: aggregate.totals };
}

function v2PlannerHomeAggregate(selectionInput) {
  const hasExplicitSelection = Array.isArray(selectionInput);
  const selection = hasExplicitSelection
    ? [...new Set(selectionInput.filter(id => V2_HOME_ACTIVITIES[id]?.category === "home-training"))].slice(0, 3)
    : [];
  const chosen = selection.length ? selection : hasExplicitSelection ? [] : ["shadow-boxing", "basement-bag"];
  const totals = chosen.reduce((sum, id) => {
    const activity = V2_HOME_ACTIVITIES[id];
    sum.energyCost += activity.energyCost;
    sum.fatigueGain += activity.fatigueGain;
    sum.xp += activity.xp;
    Object.keys(sum.stimulus).forEach(key => { sum.stimulus[key] += Number(activity.stimulus[key] || 0); });
    return sum;
  }, { energyCost: 0, fatigueGain: 0, fatigueRelief: 0, fatigueDelta: 0, xp: 0, wear: 0, injuryRisk: 0, stimulus: { technique: 0, power: 0, cardio: 0, defense: 0 } });
  totals.fatigueDelta = totals.fatigueGain;
  return { selection: chosen, totals };
}

function v2PlannerActivityDefinition(activityId, metadata = {}) {
  const id = String(activityId || "");
  if (["group-class", "boxing-coach", "boxing-custom"].includes(id)) {
    const groupClass = id === "group-class";
    const custom = id === "boxing-custom";
    const aggregate = v2PlannerBoxingAggregate(metadata, {
      label: groupClass ? "Cours de groupe · fondamentaux" : custom ? "Séance de boxe personnalisée" : "Séance de l’entraîneur",
      source: custom ? "custom" : "coach",
    });
    const familyId = groupClass ? "group" : "boxing";
    const capacityExtraBase = custom ? V2_CUSTOM_SESSION_BASE_COST : 0;
    const programSignature = `${familyId}:${aggregate.session.blocks.map(block => block.id).sort().join("+")}`;
    return {
      id,
      label: groupClass ? "Cours de groupe" : custom ? "Séance de boxe personnalisée" : "Séance de l’entraîneur",
      category: groupClass ? "group-class" : "boxing",
      location: "boxing-gym",
      physical: true,
      capacityCost: v2PlannerLoadCost(aggregate.totals.energyCost, aggregate.totals.fatigueDelta, 4, capacityExtraBase),
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
    const capacityExtraBase = id === "strength-custom" ? V2_CUSTOM_SESSION_BASE_COST : 0;
    return {
      id,
      label: id === "strength-quick" ? "Séance de musculation rapide" : "Séance de musculation personnalisée",
      category: "strength",
      location: "strength-gym",
      physical: true,
      capacityCost: v2PlannerLoadCost(aggregate.totals.energyCost, aggregate.totals.fatigueDelta, 4, capacityExtraBase),
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
    const activity = V2_HOME_ACTIVITIES[id];
    const capacityMinimum = id === "roadwork-short" ? 5 : 7;
    return {
      id,
      label: activity.label,
      category: "home",
      location: "home",
      physical: true,
      capacityCost: v2PlannerLoadCost(activity.energyCost, activity.fatigueGain, capacityMinimum),
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
    const aggregate = v2PlannerHomeAggregate(id === "home-custom" ? metadata.selection : ["shadow-boxing", "basement-bag"]);
    if (id === "home-custom" && aggregate.selection.length === 0) {
      throw new Error("Choisis au moins une activité pour bâtir l’entraînement maison.");
    }
    const capacityExtraBase = id === "home-custom" ? V2_CUSTOM_SESSION_BASE_COST : 0;
    return {
      id,
      label: id === "home-quick" ? "Entraînement maison rapide" : "Entraînement maison personnalisé",
      category: "home",
      location: "home",
      physical: true,
      capacityCost: v2PlannerLoadCost(aggregate.totals.energyCost, aggregate.totals.fatigueDelta, 5, capacityExtraBase),
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
      capacityCost: 0,
      energyGain: 10,
      fatigueDelta: -5,
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
      energyGain: 9,
      fatigueDelta: -2,
      recreationalAllowed: true,
      metadata: { plannerType: id, moneyCost: 15 },
    };
  }
  if (id === "private-training") {
    const capsule = ensureV2PreviewCapsule();
    const runtime = normalizeV2PreviewRuntime(capsule);
    const program = window.BoxeurTrainer.getPublicState(runtime.career.v2TrainerState).activeProgram;
    const trainer = program ? window.BoxeurTrainer.getTrainer(program.trainerId) : null;
    if (!program || !trainer) throw new Error("Aucun programme privé n’est actif.");
    const location = v2TrainerLocationForTarget(program.target);
    const familyId = location === "strength-gym" ? "strength" : "boxing";
    return {
      id,
      label: `Séance privée · ${trainer.label}`,
      category: "private-training",
      location,
      physical: true,
      capacityCost: v2PlannerLoadCost(trainer.energyCost, trainer.fatigue),
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
      capacityCost: v2PlannerLoadCost(18, 14, 12),
      energyCost: 18,
      fatigueDelta: 14,
      metadata: {
        plannerType: id,
        completed: metadata.completed === true,
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

function v2PlannerActivityAccess(activityId) {
  const capsule = ensureV2PreviewCapsule();
  const runtime = normalizeV2PreviewRuntime(capsule);
  const id = String(activityId || "");
  const physical = !["rest", "meal"].includes(id);
  if (physical && state.injuryWeeks > 0) return { available: false, reason: v2PreparationView(capsule.timeState).detail };
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
    const program = runtime.career.v2TrainerState?.activeProgram;
    if (!program) return { available: false, reason: "Choisis d’abord un programme avec un entraîneur privé." };
    const physicalProgram = ["power", "cardio"].includes(program.target);
    if (physicalProgram && runtime.career.strengthGymWeeks <= 0) {
      return { available: false, reason: "Un abonnement actif au gym de musculation est requis pour ce préparateur." };
    }
    if (!physicalProgram && runtime.career.gymWeeks <= 0) {
      return { available: false, reason: "Un abonnement actif au GYM de boxe est requis pour cet entraîneur." };
    }
  }
  if (id === "sparring" && state.scheduledFight) {
    return { available: false, reason: "Un autre rendez-vous de ring est déjà prévu." };
  }
  if (id === "meal" && runtime.career.money < 15) {
    return { available: false, reason: "Il faut 15 $ pour préparer ce repas." };
  }
  return { available: true, reason: "" };
}

function v2PlannerRebuild(capsule, previous) {
  const baseConfig = v2PlannerBaseConfig(capsule);
  const workOptedOut = previous?.workOptedOut === true;
  if (workOptedOut) baseConfig.work = null;
  let rebuilt = window.BoxeurWeekPlanner.createPlanner(baseConfig);
  rebuilt.workOptedOut = workOptedOut;
  const oldEntries = Array.isArray(previous?.entries) ? previous.entries.filter(entry => !entry.preReserved) : [];
  oldEntries.forEach(entry => {
    try {
      const access = v2PlannerActivityAccess(entry.activityId);
      if (!access.available) throw new Error(access.reason);
      const definition = v2PlannerActivityDefinition(entry.activityId, entry.metadata || {});
      const added = window.BoxeurWeekPlanner.addActivity(rebuilt, definition, {
        day: entry.day,
        source: entry.source,
      });
      rebuilt = added.state;
      if (entry.supplementId) {
        const reserved = v2PlannerReserveSupplementOnState(rebuilt, added.result.entry.id, entry.supplementId);
        rebuilt = reserved.state;
      }
    } catch (error) {
      console.warn(`[Boxeur Deux] Choix hebdomadaire retiré pendant la revalidation : ${entry.activityId}`, error.message);
    }
  });
  rebuilt.mode = previous?.mode === "quick" ? "quick" : "manual";
  return rebuilt;
}

function ensureV2WeekPlanner(capsule = ensureV2PreviewCapsule()) {
  if (!capsule || !window.BoxeurWeekPlanner) return null;
  const runtime = normalizeV2PreviewRuntime(capsule);
  const signature = v2PlannerSignature(capsule);
  const current = runtime.weekPlanner;
  const currentWeek = v2PlannerWeekKey(capsule);
  if (!current || current.weekKey !== currentWeek || current.status !== "draft" || runtime.weekPlannerSignature !== signature) {
    runtime.weekPlanner = v2PlannerRebuild(capsule, current?.weekKey === currentWeek && current?.status === "draft" ? current : null);
    runtime.weekPlannerSignature = signature;
  }
  return runtime.weekPlanner;
}

function v2PlannerStore(capsule, plannerState) {
  const runtime = normalizeV2PreviewRuntime(capsule);
  runtime.weekPlanner = plannerState;
  runtime.weekPlannerSignature = v2PlannerSignature(capsule);
  persistV2PreviewCapsule();
  renderV2WorldPreview(true);
  return plannerState;
}

function v2PlannerEntryCount(plannerState, activityId) {
  return plannerState.entries.filter(entry => !entry.preReserved && entry.activityId === activityId).length;
}

function v2PlannerLocationEntries(plannerState, locationId) {
  return plannerState.entries
    .filter(entry => !entry.preReserved && entry.location === locationId)
    .map(entry => ({
      id: entry.id,
      activityId: entry.activityId,
      label: entry.metadata?.gainMultiplier < 1 ? `${entry.label} · gains 85 %` : entry.label,
      cost: entry.capacityCost,
      gainMultiplier: safeNumber(entry.metadata?.gainMultiplier, 1, .5, 1, false),
      removable: !entry.locked && !entry.metadata?.completed,
    }));
}

function v2PlannerActionState(activityId, metadata = {}) {
  const capsule = ensureV2PreviewCapsule();
  const plannerState = ensureV2WeekPlanner(capsule);
  const access = v2PlannerActivityAccess(activityId);
  if (!access.available) return { ...access, planned: false, entryId: null };
  const existingEntries = plannerState.entries.filter(entry => !entry.preReserved && entry.activityId === activityId);
  const existing = existingEntries[0] || null;
  const toggleActivity = V2_WEEK_TOGGLE_ACTIVITY_IDS.has(activityId);
  if (toggleActivity && existing) {
    return { available: true, reason: "", planned: true, plannedCount: existingEntries.length, entryId: existing.id };
  }
  const max = V2_WEEK_ACTIVITY_LIMITS[activityId];
  if (max != null && existingEntries.length >= max) {
    return { available: false, reason: "Le maximum hebdomadaire de cette activité est atteint.", planned: existingEntries.length > 0, plannedCount: existingEntries.length, entryId: existing?.id || null };
  }
  try {
    const definition = v2PlannerActivityDefinition(activityId, metadata);
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

function v2PlannerReserveSupplementOnState(plannerState, entryId, productId) {
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
  const adjustedCost = v2PlannerLoadCost(
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

function addV2PlannerActivity(activityId, metadata = {}, options = {}) {
  const capsule = ensureV2PreviewCapsule();
  if (!capsule) return null;
  const access = v2PlannerActivityAccess(activityId);
  if (!access.available) return showToast(access.reason);
  let plannerState = ensureV2WeekPlanner(capsule);
  const max = V2_WEEK_ACTIVITY_LIMITS[activityId];
  const existing = plannerState.entries.find(entry => !entry.preReserved && entry.activityId === activityId);
  if (options.toggle === true && existing) return removeV2PlannerActivity(existing.id, { reopen: options.reopen });
  if (max != null && v2PlannerEntryCount(plannerState, activityId) >= max) return showToast(`Cette activité est déjà planifiée au maximum ${max} fois cette semaine.`);
  try {
    const definition = v2PlannerActivityDefinition(activityId, metadata);
    const defaultDay = activityId === "rest" ? "sunday" : activityId === "meal" ? "wednesday" : undefined;
    const outcome = window.BoxeurWeekPlanner.addActivity(plannerState, definition, {
      preferredDay: options.preferredDay || defaultDay,
      source: options.source,
    });
    v2PlannerStore(capsule, outcome.state);
    const reservationLabel = outcome.result.capacityReserved > 0
      ? `−${outcome.result.capacityReserved} énergie hebdomadaire`
      : "aucun coût d’énergie hebdomadaire";
    showToast(`${outcome.result.entry.label} ajouté à la semaine · ${reservationLabel}`);
    if (options.reopen) openV2Location(options.reopen);
    return outcome;
  } catch (error) {
    showToast(error.message || "Cette activité ne peut pas être ajoutée à la semaine.");
    return null;
  }
}

function removeV2PlannerActivity(entryId, options = {}) {
  const capsule = ensureV2PreviewCapsule();
  if (!capsule) return null;
  try {
    const plannerState = ensureV2WeekPlanner(capsule);
    const entry = plannerState.entries.find(item => item.id === entryId);
    const outcome = window.BoxeurWeekPlanner.removeActivity(plannerState, entryId);
    if (entry?.source === "work") outcome.state.workOptedOut = true;
    v2PlannerStore(capsule, outcome.state);
    showToast(`${entry?.label || "Activité"} retiré du programme · énergie remboursée`);
    if (options.reopen) openV2Location(options.reopen);
    return outcome;
  } catch (error) {
    showToast(error.message || "Cette activité ne peut pas être retirée.");
    return null;
  }
}

function setV2PlannerWorkAttendance(planned) {
  const capsule = ensureV2PreviewCapsule();
  if (!capsule || !window.BoxeurWeekPlanner) return null;
  const runtime = normalizeV2PreviewRuntime(capsule);
  const job = jobs.find(item => item.id === runtime.career.jobId) || null;
  if (!job) return showToast("Choisis d’abord un emploi.");
  const plannerState = ensureV2WeekPlanner(capsule);
  const workEntry = plannerState.entries.find(entry => entry.source === "work");
  if (!planned) {
    if (!workEntry) return null;
    return removeV2PlannerActivity(workEntry.id, { reopen: "work" });
  }
  if (workEntry) return null;
  try {
    const previous = cloneData(plannerState);
    previous.workOptedOut = false;
    const rebuilt = v2PlannerRebuild(capsule, previous);
    rebuilt.revision = plannerState.revision + 1;
    v2PlannerStore(capsule, rebuilt);
    openV2Location("work");
    showToast(`${job.title} ajouté à la semaine · paie de ${job.wage} $ prévue`);
    return rebuilt;
  } catch (error) {
    showToast(error.message || "Le travail ne peut pas être ajouté à cette semaine.");
    return null;
  }
}

function applyV2QuickWeekPlan() {
  const capsule = ensureV2PreviewCapsule();
  if (!capsule) return;
  const blocker = v2WeekQuickBlockReason(v2CareerView());
  if (blocker) return showToast(blocker);
  let plannerState = ensureV2WeekPlanner(capsule);
  const candidates = [];
  if (state.careerStatus === "recreational") {
    candidates.push({ id: "group-class", day: "tuesday" }, { id: "rest", day: "sunday" });
  } else {
    candidates.push({ id: "boxing-coach", day: "tuesday" });
    if (v2CareerView().strengthGymWeeks > 0) candidates.push({ id: "strength-quick", day: "thursday" });
    else candidates.push({ id: "home-quick", day: "thursday" });
    candidates.push({ id: "rest", day: "sunday" });
  }
  const accepted = [];
  for (const candidate of candidates) {
    try {
      const definition = v2PlannerActivityDefinition(candidate.id);
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
    v2PlannerStore(capsule, outcome.state);
    openV2WeekPlan();
    showToast("Plan rapide créé · tu peux encore le modifier avant de confirmer.");
  } catch (error) {
    showToast(error.message || "Le plan rapide ne peut pas être préparé.");
  }
}

function v2WeekActionAllowance(career = v2CareerView()) {
  const bouts = Number(career.amateurRecord?.wins || 0) + Number(career.amateurRecord?.losses || 0);
  return bouts >= 10 ? 4 : 3;
}

function v2WeekTrainingCapacity(timeState, career = v2CareerView()) {
  const jobConsumesRoutine = Boolean(career.jobId);
  const allowed = career.gymWeeks > 0
    ? Math.max(0, Math.min(3, v2WeekActionAllowance(career) - (jobConsumesRoutine ? 1 : 0)))
    : 0;
  const used = v2WeekTrainingActivityCount(timeState);
  return { allowed, used, remaining: Math.max(0, allowed - used) };
}

function v2WeekCompletedActivityCount(timeState) {
  if (!timeState?.clock || !Array.isArray(timeState.history) || !window.BoxeurTime) return 0;
  const start = v2WeekStartSlot(timeState);
  const end = start + window.BoxeurTime.PERIODS_PER_WEEK;
  return timeState.history.filter(event => (
    event.type === "activity-completed"
    && Number(event.fromSlot) >= start
    && Number(event.fromSlot) < end
  )).length;
}

function v2WeekQuickBlockReason(career = v2CareerView()) {
  const onboarding = v2OnboardingView();
  if (onboarding && !onboarding.gates.closeWeek.allowed) return onboarding.gates.closeWeek.reason;
  if (career.introJobRequired && !career.jobId) return "Choisis d’abord ton emploi de départ dans le lieu Emploi.";
  if (career.initialGymRequired && career.gymWeeks <= 0) return "Inscris-toi d’abord au GYM de boxe. Ton budget de départ couvre le premier mois.";
  if (state.scheduledFight && state.scheduledFight.week <= career.week) return "Un combat est arrivé : règle ce rendez-vous avant de terminer la semaine.";
  if (state.activeTournament && state.activeTournament.status !== "completed" && state.activeTournament.startWeek <= career.week) return "Le tournoi est en cours : les décisions se prennent maintenant à l’aréna.";
  const capsule = ensureV2PreviewCapsule();
  const weekEnd = capsule?.timeState ? v2WeekStartSlot(capsule.timeState) + window.BoxeurTime.PERIODS_PER_WEEK : 0;
  const importantAppointment = capsule?.timeState?.appointments?.find(appointment => (
    Number(appointment.startSlot) >= Number(capsule.timeState.clock.absoluteSlot)
      && Number(appointment.startSlot) < weekEnd
      && window.BoxeurWeek?.isImportantAppointment(appointment)
  ));
  if (importantAppointment) return `${importantAppointment.title || "Un rendez-vous"} doit être réglé avant de confirmer toute la semaine.`;
  return "";
}

function v2WeekFlexibleSchedule(timeState, career, capacity) {
  const weekStart = v2WeekStartSlot(timeState);
  const now = Math.max(0, timeState.clock.absoluteSlot - weekStart);
  const weekEnd = window.BoxeurTime.PERIODS_PER_WEEK;
  const occupied = [];
  const physicalDays = new Set((timeState.history || []).filter(event => (
    v2IsPrimaryPhysicalEvent(event)
      && Number(event.fromSlot) >= weekStart
      && Number(event.fromSlot) < weekStart + weekEnd
  )).map(event => Math.floor((Number(event.fromSlot) - weekStart) / window.BoxeurTime.PERIODS_PER_DAY)));
  const reserve = (slot, duration) => occupied.push({ from: slot, to: slot + duration });
  const findSlot = (preferred, duration) => {
    for (let slot = Math.max(now, preferred); slot + duration <= weekEnd; slot += 1) {
      if (occupied.every(range => slot + duration <= range.from || slot >= range.to)) return slot;
    }
    return null;
  };
  const findTrainingSlot = preferred => {
    const firstCandidate = Math.max(now, preferred);
    for (let slot = 2; slot < weekEnd; slot += window.BoxeurTime.PERIODS_PER_DAY) {
      const dayIndex = Math.floor(slot / window.BoxeurTime.PERIODS_PER_DAY);
      if (slot < firstCandidate || physicalDays.has(dayIndex)) continue;
      if (occupied.every(range => slot + 1 <= range.from || slot >= range.to)) return slot;
    }
    return null;
  };
  const job = jobs.find(item => item.id === career.jobId) || null;
  const workCompleted = Boolean(job && v2WeekWorkActivityCount(timeState, job.id) > 0);
  const workSlot = job && !workCompleted ? findSlot(0, 2) : null;
  if (workSlot != null) reserve(workSlot, 2);
  const trainingSlots = [];
  const preferredTrainingSlots = [2, 8, 14];
  for (let index = 0; index < capacity.remaining; index += 1) {
    const preferred = preferredTrainingSlots[Math.min(preferredTrainingSlots.length - 1, capacity.used + index)];
    const slot = findTrainingSlot(preferred);
    if (slot == null) break;
    reserve(slot, 1);
    physicalDays.add(Math.floor(slot / window.BoxeurTime.PERIODS_PER_DAY));
    trainingSlots.push(slot);
  }
  return {
    job,
    workCompleted,
    workSlot,
    missedWork: Boolean(job && !workCompleted && workSlot == null),
    trainingSlots,
    unscheduledTraining: Math.max(0, capacity.remaining - trainingSlots.length),
  };
}

function v2WeekEngineConfig() {
  const capsule = ensureV2PreviewCapsule();
  const career = v2CareerView();
  const capacity = v2WeekTrainingCapacity(capsule.timeState, career);
  const schedule = v2WeekFlexibleSchedule(capsule.timeState, career, capacity);
  const config = {
    finances: { money: career.money },
    budget: { trainingSessions: capacity.allowed, shortRecoveries: 2 },
    recovery: { energyThreshold: 45, fatigueThreshold: 58 },
  };
  if (schedule.trainingSlots.length > 0) {
    config.trainingContext = v2TrainingContext();
    config.training = {
      slots: schedule.trainingSlots,
      context: v2TrainingContext(),
    };
  } else {
    config.training = false;
  }
  if (schedule.job && schedule.workSlot != null) {
    config.work = {
      id: schedule.job.id,
      title: schedule.job.title,
      weeklyPay: schedule.job.wage,
      energy: schedule.job.energy,
      fatigue: schedule.job.fatigue,
      duration: 2,
      shifts: [{ relativeSlot: schedule.workSlot }],
    };
  }
  return config;
}

function v2WeekPlanItems(career, capacity, schedule) {
  const job = schedule.job;
  const items = [];
  if (job && schedule.workCompleted) {
    items.push({ label: job.title, detail: "Travail déjà fait · la paie hebdomadaire ne sera pas versée une deuxième fois.", tone: "positive" });
  } else if (job && schedule.workSlot != null) {
    items.push({ label: job.title, detail: `Semaine de travail simulée · paie ${job.wage} $ · fatigue normale appliquée`, tone: "neutral" });
  } else if (schedule.missedWork) {
    items.push({ label: "Travail non effectué", detail: "Il ne reste pas deux périodes avant lundi : aucune paie ne sera inventée.", tone: "warning" });
  }
  if (schedule.trainingSlots.length > 0) {
    items.push({
      label: `${schedule.trainingSlots.length} séance${schedule.trainingSlots.length > 1 ? "s" : ""} productive${schedule.trainingSlots.length > 1 ? "s" : ""}`,
      detail: capacity.used > 0 ? `${capacity.used} déjà faite${capacity.used > 1 ? "s" : ""}; le coach complète seulement ce qui tient encore dans la semaine.` : "Réparties dans la semaine selon ton énergie et ta fatigue.",
      tone: "positive",
    });
  } else if (career.gymWeeks <= 0) {
    items.push({ label: "Maintien sans GYM", detail: "Aucun gain ciblé du coach; le sac au sous-sol demeure accessible en mode détaillé.", tone: "warning" });
  }
  if (schedule.unscheduledTraining > 0) items.push({ label: "Temps insuffisant", detail: `${schedule.unscheduledTraining} séance${schedule.unscheduledTraining > 1 ? "s" : ""} restante${schedule.unscheduledTraining > 1 ? "s" : ""} ne sera pas comprimée artificiellement avant lundi.`, tone: "warning" });
  items.push({ label: "Récupération", detail: "Les nuits et, au besoin, jusqu’à deux récupérations courtes assimilent la charge.", tone: "positive" });
  items.push({ label: "Arrêt automatique", detail: "La simulation s’arrête avant une pesée, un combat, un tournoi ou une décision importante.", tone: "neutral" });
  return items;
}

function v2WeekViewContext() {
  const capsule = ensureV2PreviewCapsule();
  const career = v2CareerView();
  const plannerState = ensureV2WeekPlanner(capsule);
  const preview = window.BoxeurWeekPlanner.previewPlan(plannerState);
  const blocker = v2WeekQuickBlockReason(career);
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
  const items = preview.entries.map(entry => {
    const effects = [];
    if (entry.pay > 0) effects.push(`+${Math.round(entry.pay)} $ à la fin de la semaine`);
    if (entry.metadata?.moneyCost > 0) effects.push(`−${Math.round(entry.metadata.moneyCost)} $ à la confirmation`);
    if (entry.energyCost > 0) effects.push(`−${Math.round(entry.energyCost)} énergie pendant l’activité`);
    if (entry.energyGain > 0) effects.push(`+${Math.round(entry.energyGain)} récupération`);
    if (entry.supplementId) effects.push(`${window.BoxeurSupplements.CATALOG[entry.supplementId]?.label || "Supplément"} réservé`);
    if (entry.metadata?.gainMultiplier < 1) effects.push("Répétition exacte · 85 % des gains");
    if (entry.metadata?.completed) effects.push("Déjà joué cette semaine");
    return {
      id: entry.id,
      label: entry.label,
      detail: effects.join(" · ") || "Inclus dans le programme.",
      dayLabel: V2_PLANNER_DAY_LABELS[entry.day] || entry.day,
      cost: entry.capacityCost,
      tone: entry.preReserved ? "neutral" : entry.metadata?.completed ? "positive" : entry.energyCost >= 20 ? "warning" : "positive",
      removable: !entry.locked && !entry.metadata?.completed,
      kindLabel: labels[entry.category] || "Activité",
    };
  });
  return {
    week: capsule.timeState.clock.week,
    capacity: {
      total: preview.capacity.total,
      remaining: preview.capacity.remaining,
      spent: preview.capacity.used,
      zone,
      zoneLabel: preview.condition.fatigueZone.label,
      detail: rhythmPenalty > 0
        ? `Rythme ${rhythmPenalty >= 2 ? "faible" : "fragile"} : une semaine avec entraînement récupérera 5 points de capacité pour la suivante, sans retirer de statistiques.`
        : `À mesure que ton niveau monte, le coût des entraînements baisse légèrement, jusqu’à un plafond équilibré.`,
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
  };
}

function openV2WeekPlan() {
  const sheet = document.querySelector("#v2-world .v2-location-sheet");
  if (!sheet || !window.BoxeurWeekView) return;
  if (sheet.hidden) {
    const currentFocus = document.activeElement;
    v2LocationReturnFocus = currentFocus instanceof HTMLElement && currentFocus !== document.body ? currentFocus : null;
  }
  sheet.dataset.originLocation = "week";
  sheet.classList.remove("v2-location-sheet-full");
  sheet.innerHTML = window.BoxeurWeekView.renderPlan(v2WeekViewContext());
  activateV2LocationSheet(sheet, "[data-v2-week-confirm]");
}

function selectV2DetailedWeek() {
  openV2WeekPlan();
}

function addV2EmploymentEvent(events, week, label, detail, tone = "neutral") {
  events.push({ label, detail, tone });
  state.journal.unshift({ week, text: detail });
}

function accrueV2PaidVacation(runtime, job, events, week) {
  const career = runtime.career;
  const requiredTenure = career.jobVacationEarnedAtTenure
    ? career.jobVacationEarnedAtTenure + PAID_VACATION_INTERVAL_WEEKS
    : FIRST_PAID_VACATION_WEEKS;
  if (career.jobTenureWeeks < requiredTenure) return;
  career.jobVacationEarnedAtTenure = requiredTenure;
  if (career.vacationBankWeeks >= MAX_PAID_VACATION_WEEKS) {
    addV2EmploymentEvent(
      events,
      week,
      "Vacances",
      `${job.title} : ta banque de vacances est déjà pleine (${MAX_PAID_VACATION_WEEKS} semaines).`,
    );
    return;
  }
  career.vacationBankWeeks += 1;
  addV2EmploymentEvent(
    events,
    week,
    "Vacances acquises",
    `${job.title} : une semaine de vacances payées est ajoutée à ta banque (${career.vacationBankWeeks}/${MAX_PAID_VACATION_WEEKS}).`,
    "positive",
  );
}

function settleV2JobAttendance(runtime, worked, events, week, excused = false) {
  const career = runtime.career;
  const job = jobs.find(item => item.id === career.jobId) || null;
  if (!job) {
    career.missedWorkWeeks = 0;
    return;
  }
  const ledger = v2WeekLedger(runtime, week);
  if (worked) {
    if (career.missedWorkWeeks > 0) {
      addV2EmploymentEvent(events, week, "Assiduité rétablie", `${job.title} : ton retour au travail remet ton dossier d’assiduité en règle.`, "positive");
    }
    career.missedWorkWeeks = 0;
    career.jobTenureWeeks += 1;
    career.jobWagesEarned += ledger.grossWages;
    accrueV2PaidVacation(runtime, job, events, week);
    return;
  }
  if (excused || state.injuryWeeks > 0) {
    addV2EmploymentEvent(events, week, "Absence protégée", `${job.title} : l’absence est justifiée; ton emploi demeure protégé.`, "neutral");
    career.jobTenureWeeks += 1;
    accrueV2PaidVacation(runtime, job, events, week);
    return;
  }
  career.missedWorkWeeks += 1;
  if (career.missedWorkWeeks < 3) {
    const remaining = 3 - career.missedWorkWeeks;
    addV2EmploymentEvent(
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
  const detail = `${job.title} : congédiement après trois semaines consécutives sans travailler.${vacationPayout ? ` Indemnité de vacances : +${vacationPayout} $ (4 % des salaires reçus).` : ""}`;
  addV2EmploymentEvent(events, week, "Emploi perdu", detail, "critical");
  career.jobId = null;
  career.missedWorkWeeks = 0;
  career.jobTenureWeeks = 0;
  career.jobVacationEarnedAtTenure = 0;
  career.vacationBankWeeks = 0;
  career.jobWagesEarned = 0;
  career.jobReferenceBonus = false;
  career.jobApplication = null;
  state.workStreak = 0;
  state.jobLossNotice = `Tu as perdu ton emploi de ${job.title} après trois absences consécutives.${vacationPayout ? ` Une indemnité de vacances de ${vacationPayout} $ a été versée.` : ""}`;
}

function advanceV2JobApplication(runtime, events, week) {
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
    addV2EmploymentEvent(
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
  addV2EmploymentEvent(
    events,
    week,
    "Embauche confirmée",
    previousJob
      ? `${job.title} : ta candidature est acceptée et remplace ton ancien emploi dès la nouvelle semaine.`
      : `${job.title} : ta candidature est acceptée. Le travail sera proposé par défaut dès la nouvelle semaine.`,
    "positive",
  );
}

function v2WeeklyCompletionEvents(result, runtime, previousWeek) {
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
  const ledger = v2WeekLedger(runtime, previousWeek);
  settleV2JobAttendance(runtime, ledger.workShifts > 0, events, previousWeek);
  advanceV2JobApplication(runtime, events, previousWeek);
  if (isCompetitiveCareer()) {
    const trained = v2WeekTrainingActivityCount(result.timeState, previousWeek) > 0;
    const beforeRhythm = safeNumber(runtime.career.trainingRhythmPenalty, state.trainingRhythmPenalty, 0, 2);
    const afterRhythm = trained ? Math.max(0, beforeRhythm - 1) : Math.min(2, beforeRhythm + 1);
    runtime.career.trainingRhythmPenalty = afterRhythm;
    state.trainingRhythmPenalty = afterRhythm;
    if (trained && afterRhythm < beforeRhythm) {
      events.push({
        label: afterRhythm === 0 ? "Rythme retrouvé" : "Reprise progressive",
        detail: afterRhythm === 0
          ? "Une semaine active rétablit la capacité normale du prochain programme."
          : "La reprise est amorcée : encore une semaine active permettra de retrouver toute la capacité.",
        tone: "positive",
      });
    } else if (!trained) {
      events.push({
        label: afterRhythm >= 2 ? "Rythme faible" : "Rythme fragile",
        detail: afterRhythm >= 2
          ? "Deux semaines ou plus sans entraînement : la prochaine barre perd 10 points, sans diminution des statistiques."
          : "Semaine sans entraînement : la prochaine barre perd 5 points, sans diminution des statistiques.",
        tone: "warning",
      });
    }
  } else if (result.summary.counts.training <= 0) {
    events.push({ label: "Semaine sans entraînement", detail: "Aucune statistique n’est perdue pendant le parcours récréatif.", tone: "neutral" });
  }
  return events;
}

function v2WeekSummaryView(result, completionEvents = [], options = {}) {
  const grossWages = result.summary.actions
    .filter(record => record.kind === "work")
    .reduce((sum, record) => sum + Math.max(0, Number(record.moneyDelta || 0)), 0);
  const plannedExpenses = result.summary.actions
    .reduce((sum, record) => sum + Math.max(0, -Number(record.moneyDelta || 0)), 0);
  const changes = [
    { label: "Énergie", detail: v2Signed(result.summary.conditionDelta.energy, " pts"), tone: result.summary.conditionDelta.energy < 0 ? "warning" : "positive" },
    { label: "Fatigue", detail: v2Signed(result.summary.conditionDelta.fatigue, " pts"), tone: result.summary.conditionDelta.fatigue > 0 ? "warning" : "positive" },
    { label: "Paie brute", detail: v2Signed(grossWages, " $"), tone: grossWages > 0 ? "positive" : "neutral" },
    { label: "Dépenses planifiées", detail: plannedExpenses ? `−${plannedExpenses} $` : "0 $", tone: plannedExpenses ? "warning" : "neutral" },
    { label: "Variation du solde", detail: v2Signed(result.summary.money.earned, " $"), tone: result.summary.money.earned > 0 ? "positive" : result.summary.money.earned < 0 ? "warning" : "neutral" },
    { label: "Entraînement", detail: `${result.summary.counts.training} séance${result.summary.counts.training > 1 ? "s" : ""}`, tone: result.summary.counts.training > 0 ? "positive" : "neutral" },
    { label: "Progression assimilée", detail: v2Signed(Object.values(result.summary.statGains).reduce((sum, value) => sum + Number(value || 0), 0), " pts"), tone: "positive" },
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
    title: result.status === "week-complete" ? `Bienvenue à la semaine ${result.summary.to.week}` : "Une décision t’attend",
    summary: result.status === "week-complete"
      ? "Le programme a utilisé les mêmes activités et règles de récupération que le mode détaillé."
      : "Le temps s’est arrêté avant une étape qui ne doit pas être décidée automatiquement.",
    changes,
    events,
    ...(options.firstGuidedWeek === true ? {
      guide: {
        title: "Comment lire ton premier bilan",
        detail: "Énergie et fatigue montrent le coût réel de ton programme. La progression assimilée indique ce que ton boxeur a retenu de ses entraînements.",
        next: "En continuant, le guide affichera l’objectif de la semaine 2.",
      },
      actionLabel: "Continuer vers la semaine 2",
    } : {}),
  };
}

function v2PlannerSupplementAdjustment(supplementState, entry, totals, capsule) {
  if (!entry.supplementId || !window.BoxeurSupplements) {
    return { state: supplementState, totals: cloneData(totals), result: null };
  }
  const sessionId = `planner:${entry.id}`;
  const prepared = window.BoxeurSupplements.prepareForSession(supplementState, entry.supplementId, {
    sessionId,
    useId: `use:${v2PlannerWeekKey(capsule)}:${entry.id}`,
    weekKey: v2PlannerWeekKey(capsule),
    careerStatus: state.careerStatus,
  });
  const applied = window.BoxeurSupplements.applyToSession(prepared.state, totals, { sessionId });
  return { state: applied.state, totals: applied.session, result: applied.result };
}

function v2PlannerGainMultiplier(entry) {
  return safeNumber(entry?.metadata?.gainMultiplier, 1, .5, 1, false);
}

function v2PlannerScaledStimulus(stimulus, multiplier) {
  return Object.fromEntries(Object.keys(combatLabels).map(key => [
    key,
    Math.round(Number(stimulus?.[key] || 0) * multiplier * 10000) / 10000,
  ]));
}

function v2PlannerScaledBoxingSession(session, multiplier) {
  if (multiplier >= 1) return session;
  return {
    ...cloneData(session),
    blocks: session.blocks.map(block => ({
      ...cloneData(block),
      stimulus: v2PlannerScaledStimulus(block.stimulus, multiplier),
      xp: Math.round(Number(block.xp || 0) * multiplier * 100) / 100,
    })),
  };
}

function v2PlannerGenericActivity(entry, label, totals, options = {}) {
  return {
    kind: "activity",
    plannerActivityId: entry.activityId,
    plannerEntryId: entry.id,
    activity: {
      id: options.engineId || `v2-planner:${entry.activityId}:${entry.id}`,
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

function v2PlannerExecutionPrimitive(entry, capsule, sideEffects) {
  const runtime = normalizeV2PreviewRuntime(capsule);
  if (entry.preReserved) {
    const job = jobs.find(item => item.id === runtime.career.jobId);
    if (!job) throw new Error("L’emploi réservé n’existe plus.");
    return {
      kind: "work",
      plannerActivityId: "work",
      plannerEntryId: entry.id,
      pay: job.wage,
      activity: {
        id: `v2-work:${job.id}`,
        label: `Travail · ${job.title}`,
        category: "work",
        duration: 2,
        energyCost: Math.max(0, -Number(job.energy || 0)),
        energyGain: 0,
        fatigueGain: Math.max(0, Number(job.fatigue || 0)),
        fatigueRelief: 0,
        stimulus: { technique: 0, power: 0, cardio: 0, defense: 0 },
      },
    };
  }
  if (["group-class", "boxing-coach", "boxing-custom"].includes(entry.activityId)) {
    const aggregate = v2PlannerBoxingAggregate(entry.metadata, {
      label: entry.label,
      source: entry.activityId === "boxing-custom" ? "custom" : "coach",
    });
    const adjusted = v2PlannerSupplementAdjustment(sideEffects.supplementState, entry, aggregate.totals, capsule);
    sideEffects.supplementState = adjusted.state;
    if (adjusted.result) sideEffects.supplements.push(adjusted.result);
    const gainMultiplier = v2PlannerGainMultiplier(entry);
    return {
      kind: "training",
      plannerActivityId: entry.activityId,
      plannerEntryId: entry.id,
      session: v2PlannerScaledBoxingSession(aggregate.session, gainMultiplier),
      context: { ...v2TrainingContext(), sessionAdjustment: adjusted.result ? adjusted.totals : null },
      budgetKind: "trainingSessions",
    };
  }
  if (["strength-quick", "strength-custom"].includes(entry.activityId)) {
    const selection = entry.activityId === "strength-quick"
      ? ["dynamic_warmup", "machine_conditioning", "mobility_cooldown"]
      : entry.metadata?.selection || [];
    const aggregate = window.BoxeurStrength.aggregateSelection(selection);
    const adjusted = v2PlannerSupplementAdjustment(sideEffects.supplementState, entry, aggregate.totals, capsule);
    sideEffects.supplementState = adjusted.state;
    if (adjusted.result) sideEffects.supplements.push(adjusted.result);
    const gainMultiplier = v2PlannerGainMultiplier(entry);
    return v2PlannerGenericActivity(entry, entry.label, {
      ...adjusted.totals,
      stimulus: v2PlannerScaledStimulus(aggregate.totals.stimulus, gainMultiplier),
    }, {
      engineId: `strength-gym-session:${aggregate.activityIds.join("-")}`,
      category: "strength-gym-training",
      xpAward: aggregate.totals.xp * gainMultiplier,
      wear: aggregate.totals.wear,
      injuryRiskPercent: aggregate.totals.injuryRisk,
    });
  }
  if (["home-quick", "home-custom"].includes(entry.activityId)) {
    const aggregate = v2PlannerHomeAggregate(entry.metadata?.selection);
    const adjusted = v2PlannerSupplementAdjustment(sideEffects.supplementState, entry, aggregate.totals, capsule);
    sideEffects.supplementState = adjusted.state;
    if (adjusted.result) sideEffects.supplements.push(adjusted.result);
    const gainMultiplier = v2PlannerGainMultiplier(entry);
    return v2PlannerGenericActivity(entry, entry.label, {
      ...adjusted.totals,
      stimulus: v2PlannerScaledStimulus(aggregate.totals.stimulus, gainMultiplier),
    }, {
      engineId: `home-session:${aggregate.selection.join("-")}`,
      category: "home-training",
      xpAward: aggregate.totals.xp * gainMultiplier,
    });
  }
  if (["roadwork-short", "roadwork-long", "roadwork-intervals"].includes(entry.activityId)) {
    const activity = V2_HOME_ACTIVITIES[entry.activityId];
    const totals = {
      energyCost: activity.energyCost,
      energyGain: activity.energyGain,
      fatigueGain: activity.fatigueGain,
      fatigueRelief: activity.fatigueRelief,
      stimulus: activity.stimulus,
    };
    const adjusted = v2PlannerSupplementAdjustment(sideEffects.supplementState, entry, totals, capsule);
    sideEffects.supplementState = adjusted.state;
    if (adjusted.result) sideEffects.supplements.push(adjusted.result);
    const gainMultiplier = v2PlannerGainMultiplier(entry);
    return v2PlannerGenericActivity(entry, entry.label, {
      ...adjusted.totals,
      stimulus: v2PlannerScaledStimulus(adjusted.totals.stimulus, gainMultiplier),
    }, {
      engineId: activity.id,
      category: "roadwork",
      duration: activity.duration,
      xpAward: activity.xp * gainMultiplier,
    });
  }
  if (entry.activityId === "rest") {
    const activity = window.BoxeurRecovery.ACTIONS.active_recovery.activity;
    return v2PlannerGenericActivity(entry, entry.label, {
      energyCost: activity.energyCost,
      energyGain: activity.energyGain,
      fatigueGain: activity.fatigueGain,
      fatigueRelief: activity.fatigueRelief,
      stimulus: activity.stimulus,
    }, { engineId: activity.id, category: "recovery", duration: window.BoxeurTime.PERIODS_PER_DAY });
  }
  if (entry.activityId === "meal") {
    const activity = V2_HOME_ACTIVITIES.meal;
    return v2PlannerGenericActivity(entry, entry.label, {
      energyCost: activity.energyCost,
      energyGain: activity.energyGain,
      fatigueGain: activity.fatigueGain,
      fatigueRelief: activity.fatigueRelief,
      stimulus: activity.stimulus,
    }, { engineId: activity.id, category: "home-recovery", moneyDelta: -15 });
  }
  if (entry.activityId === "private-training") {
    const publicProgram = window.BoxeurTrainer.getPublicState(sideEffects.trainerState).activeProgram;
    if (!publicProgram) throw new Error("Le programme privé planifié n’est plus actif.");
    const sourceId = `${v2PlannerWeekKey(capsule)}:${entry.id}`;
    const outcome = window.BoxeurTrainer.completeSession(sideEffects.trainerState, sideEffects.progressionState, {
      sourceId,
      weekKey: v2PlannerWeekKey(capsule),
      condition: { energy: 100, fatigue: capsule.timeState.condition.fatigue },
    });
    sideEffects.trainerState = outcome.state;
    sideEffects.progressionState = outcome.progressionState;
    sideEffects.privateSessions.push(outcome.result);
    const gainMultiplier = v2PlannerGainMultiplier(entry);
    const totals = {
      energyCost: Math.max(0, -outcome.result.energyDelta),
      energyGain: 0,
      fatigueGain: Math.max(0, outcome.result.fatigueDelta),
      fatigueRelief: 0,
      stimulus: v2PlannerScaledStimulus(outcome.result.progression.effectiveAccepted, gainMultiplier),
    };
    const adjusted = v2PlannerSupplementAdjustment(sideEffects.supplementState, entry, totals, capsule);
    sideEffects.supplementState = adjusted.state;
    if (adjusted.result) sideEffects.supplements.push(adjusted.result);
    const primitive = v2PlannerGenericActivity(entry, entry.label, {
      ...adjusted.totals,
      stimulus: totals.stimulus,
    }, {
      engineId: `private-trainer:${sourceId}`,
      category: v2TrainerLocationForTarget(publicProgram.target) === "strength-gym" ? "strength-gym-training" : "boxing-gym-training",
      xpAward: 4 * gainMultiplier,
    });
    primitive.privateTarget = publicProgram.target;
    return primitive;
  }
  throw new Error(`Activité hebdomadaire non exécutable : ${entry.activityId}.`);
}

function v2PlannerExecutionSlots(entries, capsule) {
  const weekStart = v2WeekStartSlot(capsule.timeState);
  const weekEnd = weekStart + window.BoxeurTime.PERIODS_PER_WEEK;
  const now = capsule.timeState.clock.absoluteSlot;
  const occupied = [];
  const historicalPhysicalDays = new Set((capsule.timeState.history || []).filter(v2IsPrimaryPhysicalEvent).filter(event => (
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
    for (let candidate = start; candidate + duration <= weekEnd; candidate += 1) {
      const day = Math.floor((candidate - weekStart) / window.BoxeurTime.PERIODS_PER_DAY);
      const period = (candidate - weekStart) % window.BoxeurTime.PERIODS_PER_DAY;
      if (plannerEntry.physical && (period !== 2 || historicalPhysicalDays.has(day))) continue;
      if (overlaps(candidate, duration)) continue;
      found = candidate;
      break;
    }
    if (found == null) throw new Error(`${plannerEntry.label} ne tient plus dans la semaine actuelle.`);
    reserve(found, duration);
    if (plannerEntry.physical) historicalPhysicalDays.add(Math.floor((found - weekStart) / window.BoxeurTime.PERIODS_PER_DAY));
    return { ...primitive, id: `planner-${plannerEntry.id}`, startSlot: found, duration };
  });
}

function createV2PlannerSideEffects(capsule) {
  const runtime = normalizeV2PreviewRuntime(capsule);
  return {
    supplementState: window.BoxeurSupplements.createState(runtime.career.v2SupplementState, { weekKey: capsule.timeState.clock.week }),
    trainerState: window.BoxeurTrainer.createState(runtime.career.v2TrainerState),
    progressionState: window.BoxeurProgression.createState(runtime.career.progressionState),
    supplements: [],
    privateSessions: [],
  };
}

function replayV2PlannerSideEffects(capsule, plannerEntries, executedEntryIds) {
  const committed = createV2PlannerSideEffects(capsule);
  plannerEntries
    .filter(entry => executedEntryIds.has(entry.id))
    .forEach(entry => { v2PlannerExecutionPrimitive(entry, capsule, committed); });
  return committed;
}

function buildV2PlannerExecution(capsule, plannerState) {
  v2ProgressionSnapshot(capsule);
  const sideEffects = createV2PlannerSideEffects(capsule);
  const candidates = window.BoxeurWeekPlanner.previewPlan(plannerState).entries
    .filter(entry => !(entry.activityId === "sparring" && entry.metadata?.completed));
  const withPrimitives = candidates.map(plannerEntry => ({
    plannerEntry,
    primitive: v2PlannerExecutionPrimitive(plannerEntry, capsule, sideEffects),
  }));
  const entries = v2PlannerExecutionSlots(withPrimitives, capsule);
  const weekStartSlot = v2WeekStartSlot(capsule.timeState);
  const physicalCount = entries.filter(entry => entry.kind === "training" || entry.physical === true).length;
  const physicalAlreadyDone = v2WeekTrainingActivityCount(capsule.timeState);
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

function runV2AutomaticWeek() {
  const capsule = ensureV2PreviewCapsule();
  if (!capsule || !window.BoxeurWeek || !window.BoxeurWeekView || !window.BoxeurWeekPlanner) return;
  const blocker = v2WeekQuickBlockReason(v2CareerView());
  if (blocker) return showToast(blocker);
  const plannerState = ensureV2WeekPlanner(capsule);
  const pendingSparring = plannerState.entries.find(entry => entry.activityId === "sparring" && !entry.metadata?.completed);
  if (pendingSparring) {
    showToast("Le sparring est interactif : joue-le maintenant, puis confirme de nouveau la semaine.");
    runV2TechnicalSparring({ launch: true, entryId: pendingSparring.id });
    return;
  }
  const runtime = normalizeV2PreviewRuntime(capsule);
  const previousWeek = capsule.timeState.clock.week;
  const beforeCapsule = cloneData(capsule);
  const beforeCareerState = cloneData(state);
  try {
    const confirmed = window.BoxeurWeekPlanner.confirmPlan(plannerState, {
      transactionId: `${v2PlannerWeekKey(capsule)}:revision-${plannerState.revision}`,
      expectedRevision: plannerState.revision,
    });
    const execution = buildV2PlannerExecution(capsule, confirmed.state);
    const result = window.BoxeurWeek.runWeek({
      timeState: capsule.timeState,
      finances: { money: runtime.career.money },
    }, {
      mode: "quick",
      plan: execution.plan,
      recovery: { energyThreshold: 42, fatigueThreshold: 62 },
    });
    if (result.status !== "week-complete") {
      const reason = result.summary.warnings.at(-1) || "La semaine s’est arrêtée avant sa confirmation complète.";
      throw new Error(reason);
    }
    const executedEntryIds = new Set(result.summary.actions.map(record => record.primitive?.plannerEntryId).filter(Boolean));
    const missingEntries = execution.plan.entries.filter(entry => !executedEntryIds.has(entry.plannerEntryId));
    if (missingEntries.length) {
      throw new Error(`${missingEntries[0].activity?.label || missingEntries[0].session?.label || "Une activité"} n’a pas pu être accomplie. Allège ou réorganise le programme.`);
    }
    const committedSideEffects = replayV2PlannerSideEffects(capsule, execution.plannerEntries, executedEntryIds);
    const onboardingBeforeAdvance = v2OnboardingView(capsule);
    const firstGuidedWeek = onboardingBeforeAdvance?.state.mode === "guided" && previousWeek === 1;
    if (onboardingBeforeAdvance?.state.mode === "guided") {
      const completedObjectiveId = v2CompletedOnboardingObjectiveId(
        onboardingBeforeAdvance,
        execution.plannerEntries,
        executedEntryIds,
      );
      if (completedObjectiveId) {
        applyV2OnboardingEvent({
          type: window.BoxeurOnboarding.EVENT_TYPES.COMPLETE_OBJECTIVE,
          objectiveId: completedObjectiveId,
        });
      }
      applyV2OnboardingEvent({ type: window.BoxeurOnboarding.EVENT_TYPES.CLOSE_WEEK });
    }
    capsule.timeState = result.timeState;
    runtime.career.money = result.finances.money;
    runtime.career.experience += result.summary.xpAward;
    runtime.career.v2SupplementState = committedSideEffects.supplementState;
    runtime.career.v2TrainerState = committedSideEffects.trainerState;
    // BoxeurTime demeure l’unique source de progression exécutée. Le moteur
    // d’entraîneur sert à calculer son stimulus ciblé, sans le créditer une
    // seconde fois dans une jauge parallèle.
    v2ProgressionSnapshot(capsule);
    if (result.summary.counts.work > 0 || result.summary.money.earned > 0) {
      const grossWages = result.summary.actions
        .filter(record => record.kind === "work")
        .reduce((sum, record) => sum + Math.max(0, Number(record.moneyDelta || 0)), 0);
      recordV2Work(runtime, previousWeek, grossWages, result.summary.counts.work);
      const currentJob = jobs.find(item => item.id === runtime.career.jobId);
      if (currentJob) {
        state.morale = clamp(state.morale + Number(currentJob.morale || 0));
        state.injury = clamp(state.injury + Number(currentJob.injury || 0));
      }
    }
    if (state.careerStatus === "recreational" && result.summary.counts.training > 0) runtime.trainingSessions += 1;
    const boxingDone = result.summary.actions.some(record => {
      const plannerActivityId = record.primitive?.plannerActivityId;
      if (["group-class", "boxing-coach", "boxing-custom", "home-quick", "home-custom"].includes(plannerActivityId)) return true;
      if (plannerActivityId !== "private-training") return false;
      return ["technique", "defense"].includes(record.primitive?.privateTarget);
    });
    if (boxingDone && isCompetitiveCareer()) state.boxingTrainingWeek = previousWeek;
    const completionEvents = v2WeeklyCompletionEvents(result, runtime, previousWeek);
    runtime.weekMode = confirmed.commit.mode === "quick" ? "quick" : "detailed";
    runtime.weeklySummaries.unshift(cloneData(result.summary));
    runtime.weeklySummaries = runtime.weeklySummaries.slice(0, 30);
    runtime.weekPlanner = null;
    runtime.weekPlannerSignature = null;
    persistV2PreviewCapsule();
    renderV2WorldPreview(true);
    const sheet = document.querySelector("#v2-world .v2-location-sheet");
    if (!sheet) return;
    sheet.dataset.originLocation = "week";
    sheet.classList.remove("v2-location-sheet-full");
    sheet.innerHTML = window.BoxeurWeekView.renderSummary(v2WeekSummaryView(result, completionEvents, { firstGuidedWeek }));
    activateV2LocationSheet(sheet, "[data-v2-week-summary-close]");
  } catch (error) {
    v2PreviewCapsule = beforeCapsule;
    state = beforeCareerState;
    renderV2WorldPreview(true);
    showToast(error.message || "La semaine n’a pas été confirmée; aucun coût ni produit n’a été appliqué.");
  }
}

function openV2MembershipMenu() {
  const capsule = ensureV2PreviewCapsule();
  if (!capsule) return;
  const career = normalizeV2PreviewRuntime(capsule).career;
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

function selectV2GymPlan(planId) {
  const capsule = ensureV2PreviewCapsule();
  const plan = gymPlans.find(item => item.id === planId);
  if (!capsule || !plan) return;
  const runtime = normalizeV2PreviewRuntime(capsule);
  const career = runtime.career;
  if (career.gymWeeks > 0 || career.money < plan.price) return;
  career.money -= plan.price;
  career.gymWeeks = plan.weeks;
  career.initialGymRequired = false;
  const onboarding = v2OnboardingView(capsule);
  if (onboarding?.state.mode === "guided" && !onboarding.state.initialGym.purchased) {
    applyV2OnboardingEvent({
      type: window.BoxeurOnboarding.EVENT_TYPES.PURCHASE_INITIAL_MEMBERSHIP,
      weeks: plan.weeks,
    });
  }
  persistV2PreviewCapsule();
  document.querySelector("#membership-dialog")?.close();
  renderV2WorldPreview(true);
  openV2Location("boxing-gym");
  showToast(`Inscription confirmée · GYM actif pour ${plan.weeks} semaines`);
}

function openV2JobMenu() {
  const capsule = ensureV2PreviewCapsule();
  if (!capsule) return;
  const career = normalizeV2PreviewRuntime(capsule).career;
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
    ? `<button class="text-button" type="button" data-v2-cancel-job-application>Annuler la candidature en cours</button>`
    : "";
  document.querySelector("#job-options").innerHTML = `${options}${cancel}`;
  setMandatoryDialogState("job-dialog", immediate, "Choisis ton emploi de départ pour commencer la semaine 1.");
  document.querySelector("#job-dialog")?.showModal();
}

function selectV2Job(jobId) {
  const capsule = ensureV2PreviewCapsule();
  const job = jobs.find(item => item.id === jobId);
  if (!capsule || !job) return;
  const runtime = normalizeV2PreviewRuntime(capsule);
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
    persistV2PreviewCapsule();
    document.querySelector("#job-dialog")?.close();
    renderV2WorldPreview(true);
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
  const onboarding = v2OnboardingView(capsule);
  if (onboarding?.state.mode === "guided" && !onboarding.state.initialJob.selected) {
    applyV2OnboardingEvent({
      type: window.BoxeurOnboarding.EVENT_TYPES.SELECT_INITIAL_JOB,
      jobId: job.id,
    });
  }
  persistV2PreviewCapsule();
  document.querySelector("#job-dialog")?.close();
  renderV2WorldPreview(true);
  showToast(`${job.title} obtenu · la paie sera maintenant simulée chaque semaine`);
}

function cancelV2JobApplication() {
  const capsule = ensureV2PreviewCapsule();
  if (!capsule) return;
  const runtime = normalizeV2PreviewRuntime(capsule);
  const job = jobs.find(item => item.id === runtime.career.jobApplication?.jobId);
  if (!runtime.career.jobApplication) return;
  runtime.career.jobApplication = null;
  persistV2PreviewCapsule();
  document.querySelector("#job-dialog")?.close();
  renderV2WorldPreview(true);
  openV2Location("work");
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

function v2InitialJobSelectionRequired() {
  if (!V2_ACTIVE || !state.profile) return false;
  return v2OnboardingView()?.gates.jobSelection.required === true;
}

function runV2WorkShift() {
  const capsule = ensureV2PreviewCapsule();
  if (!capsule || !window.BoxeurWeekPlanner) return;
  const runtime = normalizeV2PreviewRuntime(capsule);
  const job = jobs.find(item => item.id === runtime.career.jobId) || null;
  if (!job) return showToast("Choisis d’abord un emploi.");
  ensureV2WeekPlanner(capsule);
  openV2WeekPlan();
  showToast(`${job.title} est déjà réservé par défaut · paie de ${job.wage} $ à la confirmation`);
}

function commitV2SessionResult(outcome) {
  const capsule = ensureV2PreviewCapsule();
  if (!capsule) return;
  const trainedEarlierThisWeek = v2WeekTrainingActivityCount(capsule.timeState) > 0;
  capsule.timeState = outcome.timeState;
  const runtime = normalizeV2PreviewRuntime(capsule);
  runtime.weekMode = "detailed";
  runtime.career.experience += safeNumber(outcome.result.xpAward, 0, 0, 1000);
  if (state.careerStatus === "recreational" && !trainedEarlierThisWeek && v2WeekTrainingActivityCount(outcome.timeState) > 0) {
    runtime.trainingSessions = safeNumber(runtime.trainingSessions + 1, 0, 0, 999);
  }
  runtime.sessions.unshift(cloneData(outcome.result));
  runtime.sessions = runtime.sessions.slice(0, 50);
  v2ProgressionSnapshot(capsule);
  persistV2PreviewCapsule();
}

function renderV2SessionResult(outcome) {
  renderV2WorldPreview(true);
  const sheet = document.querySelector("#v2-world .v2-location-sheet");
  if (!sheet || !window.BoxeurGymView) return;
  const pendingLoad = Object.values(outcome.result.remainingStimulus || {}).reduce((sum, value) => sum + Number(value || 0), 0);
  const sessionDelta = outcome.result.sessionConditionDelta || outcome.result.conditionDelta;
  const nightDelta = outcome.result.nightRecoveryDelta || { energy: 0, fatigue: 0 };
  const crossedNight = nightDelta.energy !== 0 || nightDelta.fatigue !== 0;
  const changes = [
    { label: "Énergie · séance", value: v2Signed(sessionDelta.energy), tone: sessionDelta.energy < 0 ? "warning" : "positive" },
    { label: "Fatigue · séance", value: v2Signed(sessionDelta.fatigue), tone: sessionDelta.fatigue > 0 ? "warning" : "positive" },
    { label: "Charge encore à assimiler", value: v2Signed(pendingLoad, " pts"), tone: "neutral" },
    { label: "Usure de séance", value: v2Signed(outcome.result.wear, ""), tone: outcome.result.wear >= 2 ? "warning" : "neutral" },
  ];
  if (outcome.result.supplement) {
    changes.push({ label: "Produit utilisé", value: outcome.result.supplement.label, tone: "positive" });
  }
  if (crossedNight) {
    changes.splice(2, 0, {
      label: "Récupération de nuit",
      value: `${v2Signed(nightDelta.energy, " E")} · ${v2Signed(nightDelta.fatigue, " F")}`,
      tone: "positive",
    });
  }
  sheet.dataset.originLocation = "boxing-gym";
  sheet.classList.add("v2-location-sheet-full");
  sheet.innerHTML = window.BoxeurGymView.renderResult({
    title: outcome.result.label,
    summary: "La charge est enregistrée. Les gains permanents seront assimilés pendant la récupération, pas au moment du clic.",
    durationMinutes: outcome.result.durationMinutes,
    changes,
    highlights: [
      ...outcome.session.blocks.map(block => block.label),
      ...(outcome.result.supplement ? [`${outcome.result.supplement.label} · ${outcome.result.supplement.benefit}`] : []),
    ],
    nextStep: crossedNight
      ? "La nuit a déjà assimilé une partie du travail; la charge restante demandera encore de la récupération."
      : outcome.timeState.clock.period === "evening"
        ? "La soirée arrive : une nuit complète transformera une partie de cette charge en progression."
        : "Tu peux encore faire une activité légère, mais empiler les grosses séances réduit leur rendement.",
  });
  activateV2LocationSheet(sheet, "[data-v2-result-close]");
}

function v2SupplementState(capsule = ensureV2PreviewCapsule()) {
  if (!capsule || !window.BoxeurSupplements) return null;
  const runtime = normalizeV2PreviewRuntime(capsule);
  runtime.career.v2SupplementState = window.BoxeurSupplements.createState(
    runtime.career.v2SupplementState || {},
    { weekKey: capsule.timeState?.clock?.week || state.week },
  );
  return runtime.career.v2SupplementState;
}

function openV2SupplementShop() {
  const capsule = ensureV2PreviewCapsule();
  const sheet = document.querySelector("#v2-world .v2-location-sheet");
  if (!capsule || !sheet || !window.BoxeurSupplements) return;
  const runtime = normalizeV2PreviewRuntime(capsule);
  if (!["amateur", "professional"].includes(state.careerStatus)) return showToast("La boutique se débloque après le passage amateur.");
  if (runtime.career.strengthGymWeeks <= 0) return showToast("Un abonnement actif au gym de musculation est requis.");
  const supplementState = v2SupplementState(capsule);
  const products = Object.values(window.BoxeurSupplements.CATALOG).map(product => {
    const quantity = supplementState.inventory[product.id] || 0;
    const quote = window.BoxeurSupplements.quotePurchase(supplementState, product.id, 1, { money: runtime.career.money });
    return `<article class="v2-supplement-card"><div><p class="eyebrow">${escapeHTML(product.category)}</p><h3>${escapeHTML(product.label)}</h3></div><strong>${product.price} $ · inventaire ×${quantity}</strong><p>${escapeHTML(product.benefit)}</p><small>Compromis : ${escapeHTML(product.compromise)}</small><button type="button" data-v2-supplement-buy="${product.id}"${quote.ok ? "" : " disabled aria-disabled=\"true\""}>Acheter une unité</button>${quote.ok ? "" : `<small class="v2-service-reason">${escapeHTML(quote.reason)}</small>`}</article>`;
  }).join("");
  sheet.dataset.originLocation = "strength-gym";
  sheet.classList.add("v2-location-sheet-full", "v2-location-sheet-strength");
  sheet.innerHTML = `<section class="v2-service-panel v2-supplement-shop" aria-labelledby="v2-supplement-shop-title"><header><div><p class="eyebrow">Gym de musculation</p><h2 id="v2-supplement-shop-title">Boutique de suppléments</h2></div><button type="button" class="secondary-button" data-v2-supplement-shop-close>Fermer</button></header><div class="v2-service-balance">Solde disponible <strong>${runtime.career.money} $</strong></div><p>Un produit s’utilise avant une seule séance. Maximum de deux produits par semaine et jamais deux fois le même produit dans la semaine.</p><div class="v2-supplement-grid">${products}</div></section>`;
  activateV2LocationSheet(sheet, "[data-v2-supplement-buy], [data-v2-supplement-shop-close]");
}

function purchaseV2Supplement(productId) {
  const capsule = ensureV2PreviewCapsule();
  if (!capsule || !window.BoxeurSupplements) return;
  const runtime = normalizeV2PreviewRuntime(capsule);
  try {
    const supplementState = v2SupplementState(capsule);
    const transactionId = `shop:${capsule.timeState.clock.week}:${capsule.timeState.clock.absoluteSlot}:${productId}:${supplementState.purchaseIds.length + 1}`;
    const outcome = window.BoxeurSupplements.purchase(supplementState, productId, 1, {
      money: runtime.career.money,
      transactionId,
    });
    runtime.career.v2SupplementState = outcome.state;
    runtime.career.money = outcome.balance;
    persistV2PreviewCapsule();
    renderV2WorldPreview(true);
    openV2SupplementShop();
    showToast(`${window.BoxeurSupplements.CATALOG[productId].label} ajouté à ton inventaire · −${outcome.result.cost} $`);
  } catch (error) {
    showToast(error.message || "Cet achat n’est pas disponible.");
  }
}

function renderV2SupplementPicker() {
  const pending = v2PendingTraining;
  const capsule = ensureV2PreviewCapsule();
  const sheet = document.querySelector("#v2-world .v2-location-sheet");
  if (!pending || !capsule || !sheet || !window.BoxeurSupplements) return;
  const supplementState = v2SupplementState(capsule);
  const options = window.BoxeurSupplements.getUseOptions(supplementState, {
    sessionId: pending.sessionId,
    useId: `use:${pending.sessionId}`,
    weekKey: pending.weekKey,
    careerStatus: state.careerStatus,
  }).filter(option => option.quantity > 0);
  const cards = options.map(option => `<article class="v2-supplement-card${option.available ? "" : " unavailable"}"><div><p class="eyebrow">Inventaire ×${option.quantity}</p><h3>${escapeHTML(option.label)}</h3></div><p>${escapeHTML(option.benefit)}</p><small>Compromis : ${escapeHTML(option.compromise)}</small><button type="button" data-v2-supplement-prepare="${option.id}"${option.available ? "" : " disabled aria-disabled=\"true\""}>Utiliser pour cette séance</button>${option.available ? "" : `<small class="v2-service-reason">${escapeHTML(option.disabledReason)}</small>`}</article>`).join("");
  sheet.dataset.originLocation = pending.locationId;
  sheet.classList.add("v2-location-sheet-full");
  sheet.classList.toggle("v2-location-sheet-strength", pending.locationId === "strength-gym");
  sheet.innerHTML = `<section class="v2-service-panel v2-supplement-picker" aria-labelledby="v2-supplement-picker-title"><header><div><p class="eyebrow">Avant la séance</p><h2 id="v2-supplement-picker-title">Préparer un supplément?</h2></div><button type="button" class="secondary-button" data-v2-supplement-picker-close>Retour</button></header><p>Le produit modifie légèrement l’énergie ou la fatigue de cette séance seulement. Le stimulus, l’XP et les statistiques ne changent pas.</p>${cards ? `<div class="v2-supplement-grid">${cards}</div>` : `<p class="v2-service-empty">Ton inventaire est vide. La boutique se trouve au gym de musculation.</p>`}<div class="v2-service-actions"><button type="button" class="primary-button" data-v2-supplement-skip>Commencer sans produit</button></div></section>`;
  activateV2LocationSheet(sheet, "[data-v2-supplement-skip]");
}

function queueV2Training(kind, payload, locationId) {
  const capsule = ensureV2PreviewCapsule();
  if (!capsule?.timeState) return;
  const windowState = v2NextTrainingWindow(capsule.timeState);
  if (!windowState.available) return showToast(windowState.reason);
  try {
    const previewTime = windowState.waitPeriods > 0
      ? window.BoxeurTime.advanceTime(capsule.timeState, windowState.waitPeriods)
      : capsule.timeState;
    const preview = kind === "strength"
      ? window.BoxeurStrength.previewSession(previewTime, payload, { ...v2StrengthContext(), physicalSessionCompletedToday: false })
      : window.BoxeurTraining.previewSession(previewTime, payload, v2TrainingContext());
    if (!preview.ok) throw new Error(preview.reason);
    const payloadId = kind === "strength" ? payload.join("-") : payload.id;
    v2PendingTraining = {
      kind,
      payload: cloneData(payload),
      locationId,
      sessionId: `${kind}:${capsule.timeState.clock.week}:${windowState.startSlot}:${safeIdentifier(payloadId, "session")}`,
      weekKey: `week-${capsule.timeState.clock.week}`,
    };
    const inventory = window.BoxeurSupplements && ["amateur", "professional"].includes(state.careerStatus)
      ? window.BoxeurSupplements.inventoryList(v2SupplementState(capsule))
      : [];
    if (!inventory.length) executeV2PendingTraining(null);
    else renderV2SupplementPicker();
  } catch (error) {
    showToast(error.message || "Cette séance n’est pas disponible maintenant.");
  }
}

function closeV2SupplementPicker() {
  const pending = v2PendingTraining;
  v2PendingTraining = null;
  if (!pending) return;
  if (pending.kind === "strength") renderV2StrengthGym();
  else if (pending.payload?.source === "custom") renderV2Composer();
  else openV2Location("boxing-gym");
}

function executeV2PendingTraining(productId = null) {
  const pending = v2PendingTraining;
  const capsule = ensureV2PreviewCapsule();
  if (!pending || !capsule?.timeState) return;
  const beforeCapsule = cloneData(capsule);
  const beforeCareerState = cloneData(state);
  let runtime;
  let outcome;
  try {
    runtime = normalizeV2PreviewRuntime(capsule);
    prepareV2TrainingWindow(capsule);
    let sessionAdjustment = null;
    let supplementOutcome = null;
    if (productId) {
      const sourceSupplementState = v2SupplementState(capsule);
      const prepared = window.BoxeurSupplements.prepareForSession(sourceSupplementState, productId, {
        sessionId: pending.sessionId,
        useId: `use:${pending.sessionId}`,
        weekKey: pending.weekKey,
        careerStatus: state.careerStatus,
      });
      const baseTotals = pending.kind === "strength"
        ? window.BoxeurStrength.aggregateSelection(pending.payload).totals
        : window.BoxeurTraining.aggregateSession(pending.payload).totals;
      supplementOutcome = window.BoxeurSupplements.applyToSession(prepared.state, baseTotals, { sessionId: pending.sessionId });
      sessionAdjustment = supplementOutcome.session;
    }
    outcome = pending.kind === "strength"
      ? window.BoxeurStrength.executeSession(capsule.timeState, pending.payload, {
          ...v2StrengthContext(),
          physicalSessionCompletedToday: false,
          sessionAdjustment,
        })
      : window.BoxeurTraining.executeSession(capsule.timeState, pending.payload, {
          ...v2TrainingContext(),
          sessionAdjustment,
        });
    if (supplementOutcome) {
      runtime.career.v2SupplementState = supplementOutcome.state;
      outcome.result.supplement = supplementOutcome.result;
    }
    if (pending.kind === "strength") commitV2StrengthResult(outcome);
    else commitV2SessionResult(outcome);
  } catch (error) {
    v2PreviewCapsule = beforeCapsule;
    state = beforeCareerState;
    v2PendingTraining = pending;
    showToast(error.message || "La séance n’a pas pu commencer; aucun produit n’a été consommé.");
    renderV2SupplementPicker();
    return;
  }
  v2PendingTraining = null;
  if (pending.kind === "strength") v2StrengthSelection = [];
  else if (pending.payload?.source === "custom") v2ComposerSelection = [];
  try {
    if (pending.kind === "strength") renderV2StrengthResult(outcome);
    else renderV2SessionResult(outcome);
  } catch (error) {
    console.error("[Boxeur Deux] Résultat de séance impossible à afficher :", error);
    renderV2WorldPreview(true);
    showToast("Séance enregistrée. Retourne au gym pour consulter ton nouvel état.");
  }
}

function runV2CoachSession() {
  const plannerId = state.careerStatus === "recreational" ? "group-class" : "boxing-coach";
  addV2PlannerActivity(plannerId, {}, { toggle: plannerId === "group-class", reopen: "boxing-gym" });
}

function renderV2GymMenu(menuId) {
  const sheet = document.querySelector("#v2-world .v2-location-sheet");
  if (!sheet || !window.BoxeurGymView?.renderMenu) return;
  const markup = window.BoxeurGymView.renderMenu(menuId, v2GymContext());
  if (!markup) return;
  sheet.dataset.originLocation = "boxing-gym";
  sheet.classList.add("v2-location-sheet-full");
  sheet.innerHTML = markup;
  const preferredFocus = menuId === "coach"
    ? "[data-v2-amateur-transition]:not([disabled]), [data-v2-coach-session]:not([disabled]), [data-v2-boxing-trainer]:not([disabled])"
    : "[data-v2-sparring-activity]:not([disabled])";
  activateV2LocationSheet(sheet, preferredFocus);
}

function renderV2WorkMenu(menuId) {
  const sheet = document.querySelector("#v2-world .v2-location-sheet");
  if (!sheet || !window.BoxeurWorkView?.renderMenu) return;
  const markup = window.BoxeurWorkView.renderMenu(menuId, v2WorkLocationContext());
  if (!markup) return;
  sheet.dataset.originLocation = "work";
  sheet.classList.add("v2-location-sheet-full");
  sheet.innerHTML = markup;
  const preferredFocus = menuId === "schedule"
    ? "[data-v2-toggle-work]:not([disabled])"
    : "[data-v2-open-job-menu]:not([disabled])";
  activateV2LocationSheet(sheet, preferredFocus);
}

const V2_HOME_ACTION_TO_ENGINE = Object.freeze({
  sleep: "sleep_until_morning",
  recover: "active_recovery",
  advance: "advance_free_period",
});

function renderV2ClassicComputer() {
  const sheet = document.querySelector("#v2-world .v2-location-sheet");
  if (!sheet) return;
  sheet.dataset.originLocation = "home";
  sheet.classList.add("v2-location-sheet-full");
  sheet.innerHTML = `<section class="v2-classic-computer" aria-labelledby="v2-classic-computer-title">
    <header><div><p class="eyebrow">Ordinateur de la maison</p><h2 id="v2-classic-computer-title">BoxeurDeux classique</h2></div><button type="button" class="secondary-button" data-v2-classic-close>Fermer l’ordinateur</button></header>
    <p>La V1 reste jouable comme un jeu à part. Cette partie isolée ne remplace pas ta carrière V2 et ne fait pas avancer son temps.</p>
    <div class="v2-classic-monitor"><iframe src="./?classic=1&amp;arcade=1" title="BoxeurDeux classique dans l’ordinateur de la maison" sandbox="allow-scripts allow-forms allow-modals" loading="eager"></iframe></div>
  </section>`;
  activateV2LocationSheet(sheet, "[data-v2-classic-close]");
}

function renderV2HomeMenu(menuId) {
  const sheet = document.querySelector("#v2-world .v2-location-sheet");
  if (!sheet || !window.BoxeurHomeView?.renderMenu) return;
  const markup = window.BoxeurHomeView.renderMenu(menuId, v2HomeContext());
  if (!markup) return;
  sheet.dataset.originLocation = "home";
  sheet.classList.add("v2-location-sheet-full");
  sheet.innerHTML = markup;
  activateV2LocationSheet(sheet, "[data-v2-home-action], [data-v2-home-menu-close]");
}

function showV2HomeActivityResult({ title, summary, before, after, stimulusAdded = 0, xpAward = 0, recommendation = "" }) {
  renderV2WorldPreview(true);
  const sheet = document.querySelector("#v2-world .v2-location-sheet");
  if (!sheet || !window.BoxeurHomeView) return;
  sheet.dataset.originLocation = "home";
  sheet.classList.add("v2-location-sheet-full");
  sheet.innerHTML = window.BoxeurHomeView.renderResult({
    title,
    summary,
    timeLabel: `${after.clock.dayLabel} · ${after.clock.periodLabel} · ${v2CareerView().v2DateLabel}`,
    changes: [
      { label: "Énergie", value: v2Signed(after.condition.energy - before.condition.energy, " pts"), tone: after.condition.energy >= before.condition.energy ? "positive" : "warning" },
      { label: "Fatigue", value: v2Signed(after.condition.fatigue - before.condition.fatigue, " pts"), tone: after.condition.fatigue <= before.condition.fatigue ? "positive" : "warning" },
      { label: "Charge ajoutée", value: v2Signed(stimulusAdded, " pts"), tone: stimulusAdded > 0 ? "neutral" : "positive" },
      { label: "Expérience", value: xpAward > 0 ? `+${xpAward} XP` : "Aucune", tone: xpAward > 0 ? "positive" : "neutral" },
    ],
    recommendation,
  });
  activateV2LocationSheet(sheet, "[data-v2-home-result-close]");
}

function runV2HomeAction(viewActionId) {
  if (viewActionId === "play-v1") {
    renderV2ClassicComputer();
    return;
  }
  if (viewActionId === "home-custom") {
    if (state.careerStatus === "recreational") return showToast("La séance maison personnalisée se débloque après le passage amateur.");
    v2HomeSelection = [];
    renderV2HomeComposer();
    return;
  }
  if (!["rest", "home-quick", "meal", "roadwork-short", "roadwork-long", "roadwork-intervals"].includes(viewActionId)) return;
  addV2PlannerActivity(viewActionId, {}, { toggle: ["rest", "meal", "roadwork-short", "roadwork-long", "roadwork-intervals"].includes(viewActionId), reopen: "home" });
}

function renderV2HomeComposer() {
  const sheet = document.querySelector("#v2-world .v2-location-sheet");
  if (!sheet) return;
  const choices = ["shadow-boxing", "basement-bag"].map(id => {
    const activity = V2_HOME_ACTIVITIES[id];
    const selected = v2HomeSelection.includes(id);
    return `<button type="button" class="v2-exercise-choice${selected ? " selected" : ""}" data-v2-home-exercise="${id}" aria-pressed="${selected}"><strong>${escapeHTML(activity.label)}</strong><small>−${activity.energyCost} énergie · +${activity.fatigueGain} fatigue</small></button>`;
  }).join("");
  const aggregate = v2PlannerHomeAggregate(v2HomeSelection);
  const empty = v2HomeSelection.length === 0;
  sheet.dataset.originLocation = "home";
  sheet.classList.add("v2-location-sheet-full");
  sheet.innerHTML = `<section class="v2-session-composer" aria-labelledby="v2-home-composer-title">
    <header><div><p class="eyebrow">Maison · semaine ${ensureV2PreviewCapsule().timeState.clock.week}</p><h2 id="v2-home-composer-title">Bâtis un entraînement maison</h2></div><button type="button" data-v2-home-composer-close>Fermer</button></header>
    <p>Choisis une ou deux activités du sous-sol. Cette combinaison comptera comme une seule séance physique dans la semaine. La course se planifie séparément par la porte.</p>
    <div class="v2-composer-state" aria-live="polite"><strong>${v2HomeSelection.length} activité${v2HomeSelection.length > 1 ? "s" : ""}</strong><span>−${aggregate.totals.energyCost} énergie</span><span>+${aggregate.totals.fatigueGain} fatigue</span></div>
    <div class="v2-exercise-grid">${choices}</div>
    <footer><button type="button" class="secondary-button" data-v2-home-composer-close>Annuler</button><button type="button" class="primary-button" data-v2-home-custom-confirm${empty ? " disabled aria-disabled=\"true\"" : ""}>Ajouter à ma semaine</button></footer>
  </section>`;
  activateV2LocationSheet(sheet, "[data-v2-home-exercise], [data-v2-home-composer-close]");
}

function toggleV2HomeExercise(exerciseId) {
  if (!V2_HOME_ACTIVITIES[exerciseId] || V2_HOME_ACTIVITIES[exerciseId].category !== "home-training") return;
  const index = v2HomeSelection.indexOf(exerciseId);
  if (index >= 0) v2HomeSelection.splice(index, 1);
  else if (v2HomeSelection.length < 2) v2HomeSelection.push(exerciseId);
  else return showToast("Une séance maison reste courte : choisis au maximum deux activités.");
  renderV2HomeComposer();
}

function renderV2Composer() {
  const sheet = document.querySelector("#v2-world .v2-location-sheet");
  if (!sheet || !window.BoxeurGymView || !window.BoxeurTraining) return;
  const engineIds = v2ComposerSelection.map(id => V2_EXERCISE_TO_ENGINE[id]).filter(Boolean);
  const durationMinutes = engineIds.reduce((sum, id) => sum + (window.BoxeurTraining.EXERCISES[id]?.durationMinutes || 0), 0);
  let draftWeekCost = 0;
  if (engineIds.length) {
    const totals = engineIds.reduce((sum, id) => {
      const exercise = window.BoxeurTraining.EXERCISES[id];
      sum.energyCost += Number(exercise?.energyCost || 0);
      sum.fatigueDelta += Number(exercise?.fatigueGain || 0) - Number(exercise?.fatigueRelief || 0);
      return sum;
    }, { energyCost: 0, fatigueDelta: 0 });
    draftWeekCost = v2PlannerLoadCost(totals.energyCost, totals.fatigueDelta, 4, V2_CUSTOM_SESSION_BASE_COST);
  }
  sheet.dataset.originLocation = "boxing-gym";
  sheet.classList.add("v2-location-sheet-full");
  sheet.innerHTML = window.BoxeurGymView.renderComposer({
    ...v2GymContext(),
    selectedExercises: v2ComposerSelection,
    draftDurationMinutes: durationMinutes,
    draftWeekCost,
  });
  activateV2LocationSheet(sheet, "[data-v2-close-composer]");
}

function selectV2ComposerPreset(presetId) {
  const preset = window.BoxeurGymView?.PRESETS?.find(item => item.id === presetId);
  if (!preset) return;
  v2ComposerSelection = [...preset.exerciseIds];
  renderV2Composer();
}

function toggleV2ComposerExercise(exerciseId) {
  if (!Object.hasOwn(V2_EXERCISE_TO_ENGINE, exerciseId)) return;
  const existing = v2ComposerSelection.indexOf(exerciseId);
  if (existing >= 0) v2ComposerSelection.splice(existing, 1);
  else if (v2ComposerSelection.length < window.BoxeurGymView.EXERCISES.length) v2ComposerSelection.push(exerciseId);
  renderV2Composer();
}

function runV2CustomSession() {
  if (!window.BoxeurTraining) return;
  const selected = new Set(v2ComposerSelection);
  const hasPreparation = selected.has("jump-rope");
  const hasWork = ["shadow-boxing", "heavy-bag", "mitt-work", "defense"].some(id => selected.has(id));
  const hasCooldown = selected.has("cooldown");
  if (!hasPreparation || !hasWork || !hasCooldown) {
    return showToast("Complète la préparation, le travail principal et le retour au calme avant d’ajouter la séance.");
  }
  const blocks = v2ComposerSelection.map(id => V2_EXERCISE_TO_ENGINE[id]).filter(Boolean);
  const outcome = addV2PlannerActivity("boxing-custom", { blocks }, { reopen: "boxing-gym" });
  if (outcome) v2ComposerSelection = [];
}

function renderV2StrengthGym(preferredFocusSelector = "[data-v2-strength-confirm], [data-v2-strength-activity], [data-v2-strength-plan]") {
  const sheet = document.querySelector("#v2-world .v2-location-sheet");
  if (!sheet || !window.BoxeurStrengthView) return;
  sheet.dataset.originLocation = "strength-gym";
  sheet.classList.add("v2-location-sheet-full", "v2-location-sheet-strength");
  sheet.innerHTML = window.BoxeurStrengthView.render(v2StrengthContext());
  activateV2LocationSheet(sheet, preferredFocusSelector);
}

function toggleV2StrengthActivity(activityId) {
  const capsule = ensureV2PreviewCapsule();
  if (!capsule?.timeState || !window.BoxeurStrength) return;
  const outcome = window.BoxeurStrength.toggleActivity(
    capsule.timeState,
    v2StrengthSelection,
    activityId,
    v2StrengthContext(),
  );
  if (!outcome.ok) return showToast(outcome.reason || "Cette activité ne peut pas être ajoutée.");
  v2StrengthSelection = outcome.selection;
  renderV2StrengthGym(`[data-v2-strength-activity="${safeIdentifier(activityId)}"]`);
}

function selectV2StrengthPlan(planId) {
  const capsule = ensureV2PreviewCapsule();
  const plan = strengthGymPlans.find(item => item.id === planId);
  if (!capsule || !plan || !window.BoxeurStrength) return;
  const runtime = normalizeV2PreviewRuntime(capsule);
  if (state.careerStatus === "recreational" || state.careerStatus === "amateur_pending") {
    return showToast("Le gym de musculation se débloque après le passage amateur.");
  }
  if (runtime.career.strengthGymWeeks > 0) return showToast("Ton abonnement de musculation est déjà actif.");
  const reserve = v2ReservedBoxingGymBudget(v2CareerView());
  const spendable = Math.max(0, runtime.career.money - reserve);
  if (spendable < plan.price) {
    const reserveDetail = reserve > 0 ? ` Le premier mois du GYM de boxe garde ${reserve} $ en réserve.` : "";
    return showToast(`Il manque ${plan.price - spendable} $ pour ce forfait.${reserveDetail}`);
  }
  runtime.career.money -= plan.price;
  runtime.career.strengthGymWeeks = plan.weeks;
  v2StrengthSelection = [];
  persistV2PreviewCapsule();
  renderV2WorldPreview(true);
  openV2Location("strength-gym");
  showToast(`Gym de musculation actif · ${plan.label.toLowerCase()} · ${plan.weeks} semaines`);
}

function commitV2StrengthResult(outcome) {
  const capsule = ensureV2PreviewCapsule();
  if (!capsule || !outcome?.result || !window.BoxeurStrengthView) return;
  capsule.timeState = outcome.timeState;
  const runtime = normalizeV2PreviewRuntime(capsule);
  runtime.weekMode = "detailed";
  runtime.career.experience += safeNumber(outcome.result.xpAward, 0, 0, 1000);
  runtime.sessions.unshift(cloneData(outcome.result));
  runtime.sessions = runtime.sessions.slice(0, 50);
  v2ProgressionSnapshot(capsule);
  persistV2PreviewCapsule();
}

function renderV2StrengthResult(outcome) {
  renderV2WorldPreview(true);

  const sheet = document.querySelector("#v2-world .v2-location-sheet");
  if (!sheet) return;
  const remaining = Object.values(outcome.result.remainingStimulus || {}).reduce((sum, value) => sum + Number(value || 0), 0);
  sheet.dataset.originLocation = "strength-gym";
  sheet.classList.add("v2-location-sheet-full", "v2-location-sheet-strength");
  sheet.innerHTML = window.BoxeurStrengthView.renderResult({
    title: outcome.result.label,
    summary: "La séance produit une charge physique à assimiler; elle ne donne aucun point de statistique instantané.",
    durationMinutes: outcome.result.durationMinutes,
    activities: outcome.session.activities.map(activity => activity.label),
    changes: [
      { label: "Énergie · séance", value: v2Signed(outcome.result.sessionConditionDelta.energy), tone: "warning" },
      { label: "Fatigue · séance", value: v2Signed(outcome.result.sessionConditionDelta.fatigue), tone: "warning" },
      { label: "Charge à assimiler", value: v2Signed(remaining, " pts"), tone: "neutral" },
      { label: "Expérience", value: `+${outcome.result.xpAward} XP`, tone: "positive" },
      ...(outcome.result.supplement ? [{ label: "Produit utilisé", value: outcome.result.supplement.label, tone: "positive" }] : []),
    ],
  });
  activateV2LocationSheet(sheet, "[data-v2-strength-result-close]");
}

function runV2StrengthSession() {
  if (!window.BoxeurStrength || !v2StrengthSelection.length) {
    return showToast("Ajoute au moins un exercice de travail physique.");
  }
  const selection = [...v2StrengthSelection];
  const outcome = addV2PlannerActivity("strength-custom", { selection }, { reopen: "strength-gym" });
  if (outcome) v2StrengthSelection = [];
}

function v2TrainerLocationForTarget(target) {
  return ["power", "cardio"].includes(target) ? "strength-gym" : "boxing-gym";
}

function v2TrainerTargetLabel(target) {
  return combatLabels[target] || "Qualité ciblée";
}

function v2TrainerAccess(locationId, program = null) {
  const capsule = ensureV2PreviewCapsule();
  const career = capsule ? normalizeV2PreviewRuntime(capsule).career : null;
  if (!capsule?.timeState || !career) return { available: false, reason: "Carrière V2 indisponible." };
  if (!["amateur", "professional"].includes(state.careerStatus)) {
    return { available: false, reason: "Les programmes privés se débloquent après le passage amateur." };
  }
  if (state.privateProgram) {
    return {
      available: false,
      reason: "Un programme privé de l’interface classique est encore actif. Termine-le depuis l’ordinateur de la maison avant d’en commencer un nouveau.",
    };
  }
  const membershipActive = locationId === "strength-gym" ? career.strengthGymWeeks > 0 : career.gymWeeks > 0;
  if (!membershipActive) return { available: false, reason: "Un abonnement actif dans ce gym est requis." };
  if (state.injuryWeeks > 0) return { available: false, reason: v2PreparationView(capsule.timeState).detail };
  if (program && v2TrainerLocationForTarget(program.target) !== locationId) {
    const destination = v2TrainerLocationForTarget(program.target) === "strength-gym" ? "gym de musculation" : "GYM de boxe";
    return { available: false, reason: `Ce programme se poursuit au ${destination}.` };
  }
  const trainingWindow = v2NextTrainingWindow(capsule.timeState);
  return trainingWindow.available
    ? { available: true, reason: "", label: trainingWindow.label }
    : { available: false, reason: trainingWindow.reason };
}

function renderV2TrainerMenu(locationId = "boxing-gym") {
  const capsule = ensureV2PreviewCapsule();
  const sheet = document.querySelector("#v2-world .v2-location-sheet");
  if (!capsule || !sheet || !window.BoxeurTrainer) return;
  const runtime = normalizeV2PreviewRuntime(capsule);
  const trainerState = runtime.career.v2TrainerState;
  const publicState = window.BoxeurTrainer.getPublicState(trainerState);
  const active = publicState.activeProgram;
  const allowedTargets = locationId === "strength-gym" ? ["power", "cardio"] : ["technique", "defense"];
  if (active) v2TrainerTarget = active.target;
  else if (!allowedTargets.includes(v2TrainerTarget)) v2TrainerTarget = allowedTargets[0];
  const access = v2TrainerAccess(locationId, active);
  const locationLabel = locationId === "strength-gym" ? "gym de musculation" : "GYM de boxe";
  let body = "";
  if (active) {
    const trainer = window.BoxeurTrainer.getTrainer(active.trainerId);
    const correctLocation = v2TrainerLocationForTarget(active.target);
    const otherLocation = correctLocation !== locationId;
    body = `<section class="v2-trainer-active" aria-labelledby="v2-trainer-active-title">
      <p class="eyebrow">Programme actif</p><h3 id="v2-trainer-active-title">${escapeHTML(active.trainerLabel)}</h3>
      <p><strong>${escapeHTML(v2TrainerTargetLabel(active.target))}</strong> · ${active.sessionsCompleted}/${active.sessionsTotal} séances complétées</p>
      <progress max="${active.sessionsTotal}" value="${active.sessionsCompleted}">${active.sessionsCompleted}/${active.sessionsTotal}</progress>
      <p>${escapeHTML(otherLocation ? access.reason : `Prochaine séance : ${access.label || "créneau à confirmer"}. Chaque cours produit une charge ciblée qui doit ensuite être assimilée.`)}</p>
      ${otherLocation
        ? `<button type="button" class="primary-button" data-v2-trainer-go-location="${correctLocation}">Aller au ${correctLocation === "strength-gym" ? "gym de musculation" : "GYM de boxe"}</button>`
        : `<button type="button" class="primary-button" data-v2-trainer-session${access.available ? "" : " disabled aria-disabled=\"true\""}>Ajouter la prochaine séance · −${trainer.energyCost} énergie</button>`}
      ${!access.available && !otherLocation ? `<small class="v2-trainer-reason">${escapeHTML(access.reason)}</small>` : ""}
    </section>`;
  } else {
    const targetButtons = allowedTargets.map(target => `<button type="button" data-v2-trainer-target="${target}" aria-pressed="${v2TrainerTarget === target}">${escapeHTML(v2TrainerTargetLabel(target))}</button>`).join("");
    const statValue = Number(v2ProgressionSnapshot(capsule)?.stats?.[v2TrainerTarget] || state.combatStats[v2TrainerTarget] || 40);
    const offers = window.BoxeurTrainer.listOffers({ statValue }).map(offer => {
      const insufficient = runtime.career.money < offer.cost;
      const locked = !access.available || insufficient;
      const reason = !access.available ? access.reason : insufficient ? `Il manque ${offer.cost - runtime.career.money} $.` : "";
      return `<article class="v2-trainer-offer">
        <div><p class="eyebrow">${escapeHTML(offer.tierLabel)}</p><h3>${escapeHTML(offer.label)}</h3></div>
        <strong>${offer.cost} $ · ${offer.sessions} séances</strong>
        <p>Environ ${Math.round(offer.estimatedGaugePointsPerSession)} % de jauge par séance à ce niveau, avant assimilation.</p>
        <small>−${offer.energyCost} énergie · +${offer.fatigue} fatigue par séance</small>
        <button type="button" data-v2-trainer-start="${offer.id}"${locked ? " disabled aria-disabled=\"true\"" : ""}>Choisir ${escapeHTML(offer.label)}</button>
        ${reason ? `<small class="v2-trainer-reason">${escapeHTML(reason)}</small>` : ""}
      </article>`;
    }).join("");
    body = `<section class="v2-trainer-picker" aria-labelledby="v2-trainer-picker-title">
      <div><p class="eyebrow">Qualité travaillée</p><h3 id="v2-trainer-picker-title">Choisis une cible</h3><div class="v2-trainer-targets">${targetButtons}</div></div>
      <p>Le prix couvre le programme complet. Un entraîneur plus cher crée davantage de progression fractionnaire; aucun ne donne un point instantané.</p>
      <div class="v2-trainer-offers">${offers}</div>
    </section>`;
  }
  sheet.dataset.originLocation = locationId;
  sheet.dataset.trainerLocation = locationId;
  sheet.classList.add("v2-location-sheet-full");
  sheet.classList.toggle("v2-location-sheet-strength", locationId === "strength-gym");
  sheet.innerHTML = `<section class="v2-service-panel v2-trainer-panel" aria-labelledby="v2-trainer-title">
    <header><div><p class="eyebrow">Service du ${escapeHTML(locationLabel)}</p><h2 id="v2-trainer-title">${locationId === "strength-gym" ? "Préparateur privé" : "Entraîneur privé"}</h2></div><button type="button" class="secondary-button" data-v2-trainer-close>Fermer</button></header>
    <div class="v2-service-balance">Solde disponible <strong>${runtime.career.money} $</strong></div>${body}
  </section>`;
  activateV2LocationSheet(sheet, active ? "[data-v2-trainer-session], [data-v2-trainer-go-location], [data-v2-trainer-close]" : `[data-v2-trainer-target="${v2TrainerTarget}"]`);
}

function startV2TrainerProgram(trainerId) {
  const capsule = ensureV2PreviewCapsule();
  const sheet = document.querySelector("#v2-world .v2-location-sheet");
  const locationId = sheet?.dataset.trainerLocation || v2TrainerLocationForTarget(v2TrainerTarget);
  if (!capsule || !window.BoxeurTrainer) return;
  const runtime = normalizeV2PreviewRuntime(capsule);
  const access = v2TrainerAccess(locationId);
  if (!access.available) return showToast(access.reason);
  try {
    const outcome = window.BoxeurTrainer.startProgram(runtime.career.v2TrainerState, {
      trainerId,
      target: v2TrainerTarget,
      startedWeek: capsule.timeState.clock.week,
    }, { balance: runtime.career.money });
    runtime.career.v2TrainerState = outcome.state;
    runtime.career.money = outcome.result.remainingBalance;
    persistV2PreviewCapsule();
    renderV2WorldPreview(true);
    renderV2TrainerMenu(locationId);
    showToast(`${outcome.result.trainer.label} · programme de ${outcome.result.program.sessionsTotal} séances confirmé`);
  } catch (error) {
    showToast(error.message || "Ce programme privé ne peut pas être commencé.");
  }
}

function showV2TrainerResult(locationId, outcome) {
  const sheet = document.querySelector("#v2-world .v2-location-sheet");
  if (!sheet) return;
  const result = outcome.result;
  const accepted = Object.values(result.progression?.effectiveAccepted || {}).reduce((sum, value) => sum + Number(value || 0), 0);
  sheet.dataset.originLocation = locationId;
  sheet.dataset.trainerLocation = locationId;
  sheet.classList.add("v2-location-sheet-full");
  sheet.classList.toggle("v2-location-sheet-strength", locationId === "strength-gym");
  sheet.innerHTML = `<section class="v2-service-panel v2-trainer-result" aria-labelledby="v2-trainer-result-title" aria-live="polite">
    <p class="eyebrow">Séance privée terminée</p><h2 id="v2-trainer-result-title">${escapeHTML(result.trainer.label)} · ${escapeHTML(v2TrainerTargetLabel(result.target))}</h2>
    <p>${result.programCompleted ? "Programme complété. Le travail déjà créé continuera de s’assimiler pendant la récupération." : `${result.program.sessionsCompleted}/${result.program.sessionsTotal} séances complétées dans ce programme.`}</p>
    <ul class="v2-service-result-list"><li><span>Énergie</span><strong>${v2Signed(result.energyDelta)}</strong></li><li><span>Fatigue</span><strong>${v2Signed(result.fatigueDelta)}</strong></li><li><span>Charge ciblée acceptée</span><strong>${v2Signed(accepted, " pts")}</strong></li></ul>
    <div><button type="button" class="secondary-button" data-v2-trainer-result-close>Continuer au gym</button><button type="button" class="primary-button" data-v2-leave-${locationId === "strength-gym" ? "strength-gym" : "gym"}>Retour à la carte</button></div>
  </section>`;
  activateV2LocationSheet(sheet, "[data-v2-trainer-result-close]");
}

function runV2TrainerSession() {
  const capsule = ensureV2PreviewCapsule();
  if (!capsule?.timeState || !window.BoxeurTrainer) return;
  const runtime = normalizeV2PreviewRuntime(capsule);
  const publicProgram = window.BoxeurTrainer.getPublicState(runtime.career.v2TrainerState).activeProgram;
  if (!publicProgram) return showToast("Aucun programme privé n’est actif.");
  const locationId = v2TrainerLocationForTarget(publicProgram.target);
  const access = v2TrainerAccess(locationId, publicProgram);
  if (!access.available) return showToast(access.reason);
  addV2PlannerActivity("private-training", {}, { reopen: locationId });
}

async function runV2TechnicalSparring(options = {}) {
  if (options.launch !== true) {
    addV2PlannerActivity("sparring", {}, { toggle: true, reopen: "boxing-gym" });
    return;
  }
  const capsule = ensureV2PreviewCapsule();
  if (!capsule || !window.BoxeurTraining) return;
  if (!["amateur", "professional"].includes(state.careerStatus)) return showToast("Termine d’abord le sparring de Rémy et confirme ton passage amateur.");
  const career = v2CareerView();
  if (career.gymWeeks <= 0) return showToast("Un abonnement actif au GYM est requis pour réserver un partenaire.");
  if (state.scheduledFight) return showToast("Un combat est déjà à l’horaire : garde ton énergie pour ce rendez-vous.");
  try {
    normalizeV2PreviewRuntime(capsule).pendingPlannerSparringEntryId = options.entryId || null;
    prepareV2TrainingWindow(capsule);
    const rating = clamp(Math.round(Object.values(career.combatStats).reduce((sum, value) => sum + Number(value || 0), 0) / 4), 30, 95);
    const partnerName = state.profile.sex === "female" ? "Camille Beaulieu" : "Mathieu Beaulieu";
    state.scheduledFight = {
      id: `partenaire-gym-${capsule.timeState.clock.week}`,
      opponent: {
        id: `partenaire-gym-${capsule.timeState.clock.week}`,
        name: partnerName,
        nickname: "Partenaire du GYM",
        style: "Équilibré",
        rating,
        difficulty: rating,
        record: "Sparring technique",
        weightClass: state.profile.weightClass,
        stats: opponentStatsForRating(rating, "Équilibré", `${partnerName}-${capsule.timeState.clock.week}`),
      },
      tournamentId: null,
      tournamentRound: null,
      bookingId: null,
      eventId: "v2-sparring-technique",
      event: { id: "v2-sparring-technique", name: "Sparring technique · GYM de boxe", careerWeek: state.week },
      week: state.week,
      isPracticeSparring: true,
      isV2Sparring: true,
      travelEffects: { energy: 0, fatigue: 0 },
      travelApplied: true,
      fightSeed: freshFightSeed(`sparring-technique-${state.profile.firstName}-${capsule.timeState.clock.week}`),
    };
    // Le combat fait partie de l’empreinte de sauvegarde : enregistrer après
    // sa création conserve le lien avec l’entrée du brouillon hebdomadaire.
    persistV2PreviewCapsule();
    await startFight();
  } catch (error) {
    showToast(error.message || "Le sparring n’est pas disponible maintenant.");
  }
}

async function startV2RemySparring() {
  const capsule = ensureV2PreviewCapsule();
  const onboarding = v2OnboardingView(capsule);
  if (!capsule || !onboarding) return;
  if (!onboarding.gates.remySparring.allowed) return showToast(onboarding.gates.remySparring.reason);
  if (v2CareerView().gymWeeks <= 0) return showToast("Réactive ton abonnement au GYM avant le sparring de Rémy.");
  try {
    prepareV2TrainingWindow(capsule);
    if (!state.scheduledFight?.isRecreationalSparring) scheduleRecreationalSparring([]);
    if (!state.scheduledFight?.isRecreationalSparring) return showToast("Rémy n’a pas pu être ajouté à l’horaire.");
    state.scheduledFight.isV2Sparring = true;
    persistV2PreviewCapsule();
    await startFight();
  } catch (error) {
    showToast(error.message || "Le sparring de Rémy ne peut pas commencer maintenant.");
  }
}

function applyChanges(changes = {}) {
  Object.entries(changes).forEach(([key, change]) => {
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

function toggleAction(action) {
  if (!action) return showToast("Cette action n’est plus disponible.");
  if (action.id === "drug-sales") return registerDeveloperSecretTap();
  const existing = weeklyPlan.findIndex(item => item.actionId === action.id);
  if (existing >= 0) {
    weeklyPlan.splice(existing, 1);
    render();
    return;
  }
  const lock = actionLock(action);
  if (lock) return showToast(lock);
  weeklyPlan.push({ actionId: action.id });
  render();
}

function openCoachMenu() {
  if (state.privateProgram) return;
  const activeV2Program = window.BoxeurTrainer && state.v2TrainerState
    ? window.BoxeurTrainer.getPublicState(window.BoxeurTrainer.createState(state.v2TrainerState)).activeProgram
    : null;
  if (activeV2Program) {
    showToast("Un programme privé V2 est déjà actif. Termine-le dans le gym correspondant.");
    return;
  }
  selectedPrivateCoachId = null;
  document.querySelector("#private-dialog-title").textContent = "Choisir un spécialiste";
  document.querySelector("#private-dialog-copy").textContent = "Les coachs de boxe travaillent la technique et la défense; le GYM de boxe donne 10 $ de rabais par cours. Les préparateurs physiques travaillent la puissance et le cardio et exigent un abonnement actif au gym de musculation.";
  document.querySelector("#private-stat-field").hidden = true;
  document.querySelector("#private-confirm").disabled = true;
  document.querySelector("#private-dialog-effect").innerHTML = "<span>Sélectionne un spécialiste pour voir son programme.</span>";
  document.querySelector("#private-coach-options").innerHTML = privateCoaches.map(coach => {
    const price = privateCoursePrice(coach);
    const type = coach.type === "boxing" ? "Coach de boxe" : "Préparateur physique";
    const membershipLocked = coach.type === "physical" && state.strengthGymWeeks === 0;
    const status = membershipLocked ? "Abonnement musculation requis" : state.money < price ? `Il manque ${price - state.money} $` : `${price} $ / cours`;
    return `<button class="coach-card" type="button" data-select-private-coach="${coach.id}" ${membershipLocked || state.money < price ? "disabled" : ""}><strong>${coach.name} « ${coach.nickname} »</strong><span>${type} · ${status}</span><small>${coach.targets.map(target => combatLabels[target]).join(" + ")} · ${coach.sessions} cours → +${coach.reward}</small></button>`;
  }).join("");
  document.querySelector("#private-dialog").showModal();
}

function openPrivateProgram(coachId) {
  const coach = privateCoaches.find(item => item.id === coachId);
  const price = coach ? privateCoursePrice(coach) : 0;
  if (!coach || state.privateProgram) return;
  if (coach.type === "physical" && state.strengthGymWeeks === 0) return showToast("Abonnement au gym de musculation requis.");
  if (state.money < price) return showToast("Pas assez d’argent pour ce premier cours.");
  selectedPrivateCoachId = coachId;
  document.querySelectorAll("[data-select-private-coach]").forEach(button => button.classList.toggle("selected", button.dataset.selectPrivateCoach === coachId));
  const statField = document.querySelector("#private-stat-field");
  const statSelect = document.querySelector("#private-stat");
  statField.hidden = false;
  statSelect.innerHTML = coach.targets.map(target => `<option value="${target}">${combatLabels[target]}</option>`).join("");
  document.querySelector("#private-confirm").disabled = false;
  const discountActive = coach.type === "boxing" && state.gymWeeks > 0;
  const accessCopy = coach.type === "physical"
    ? " Abonnement au gym de musculation actif."
    : discountActive
      ? " Rabais de 10 $ inclus grâce au GYM de boxe."
      : " Abonne-toi au GYM de boxe pour économiser 10 $ par cours.";
  document.querySelector("#private-dialog-effect").innerHTML = `<strong>${price} $</strong><span>${coach.sessions} cours pour +${coach.reward}.${accessCopy}<br>Le premier cours sera payé, mais restera à planifier.</span>`;
}

function startPrivateProgram() {
  const coach = privateCoaches.find(item => item.id === selectedPrivateCoachId);
  const target = document.querySelector("#private-stat").value;
  const price = coach ? privateCoursePrice(coach) : 0;
  if (!coach || !coach.targets.includes(target) || state.privateProgram) return;
  const activeV2Program = window.BoxeurTrainer && state.v2TrainerState
    ? window.BoxeurTrainer.getPublicState(window.BoxeurTrainer.createState(state.v2TrainerState)).activeProgram
    : null;
  if (activeV2Program) return showToast("Un programme privé V2 est déjà actif. Termine-le dans le gym correspondant.");
  if (coach.type === "physical" && state.strengthGymWeeks === 0) return showToast("Abonnement au gym de musculation requis.");
  if (state.money < price) return showToast("Pas assez d’argent pour ce premier cours.");
  state.money -= price;
  state.privateProgram = { coachId: coach.id, target, sessionsCompleted: 0, firstSessionPaid: true };
  state.journal.unshift({ week: state.week, text: `Premier cours privé avec ${coach.name} : programme ${combatLabels[target].toLowerCase()} lancé.` });
  document.querySelector("#private-dialog").close();
  render();
  showToast(`Séance 1 payée · ${coach.sessions} cours à effectuer`);
}

function completePrivateCourse(events, week) {
  const program = state.privateProgram;
  if (!program) return;
  const coach = privateCoaches.find(item => item.id === program.coachId);
  if (!coach) return;
  program.firstSessionPaid = false;
  program.sessionsCompleted += 1;
  if (program.sessionsCompleted < coach.sessions) {
    const remaining = coach.sessions - program.sessionsCompleted;
    events.push(`Cours privé terminé : ${remaining} cours restant${remaining > 1 ? "s" : ""} en ${combatLabels[program.target].toLowerCase()}.`);
    return;
  }
  applyCombatChanges({ [program.target]: coach.reward });
  events.push(`Programme privé terminé : +${coach.reward} ${combatLabels[program.target]}.`);
  state.journal.unshift({ week, text: `Programme privé terminé avec ${coach.name} : +${coach.reward} ${combatLabels[program.target]}.` });
  state.privateProgram = null;
}

function advanceTrainingProgress(events, week) {
  weeklyPlan.forEach(item => {
    const action = actions.find(candidate => candidate.id === item.actionId);
    if (!action?.progressStat || isProgressiveReturn(action)) return;
    const stat = action.progressStat;
    state.trainingProgress[stat] = (state.trainingProgress[stat] || 0) + 1;
    if (state.trainingProgress[stat] < 10) return;
    state.trainingProgress[stat] = 0;
    const result = state.combatStats[stat] < 99 ? `10 séances terminées : +1 ${combatLabels[stat]}.` : `${combatLabels[stat]} est déjà au maximum.`;
    events.push(result);
    state.journal.unshift({ week, text: result });
  });
}

function endWeek(events) {
  const endingWeek = state.week;
  state.week += 1;
  activateReadyJobOffer(events);
  state.supplementWeek = state.week;
  state.supplementsUsed = [];
  const weekEvents = betweenWeekEventsForCurrentCareer();
  state.pendingWeekEvent = weekEvents[(state.week - 2) % weekEvents.length].id;
  state.energy = clamp(state.energy + 6);
  state.morale = clamp(state.morale - 1);
  state.fatigue = clamp(state.fatigue - (state.energy < 35 ? 4 : 6));
  if (state.profile && !state.activeTournament) {
    const targetWeight = defaultCompetitionWeight(weightClassDefinition(state.profile.weightClass, state.profile.sex));
    const weightDifference = targetWeight - state.currentWeightKg;
    if (Math.abs(weightDifference) >= .05) {
      const weeklyAdjustment = clamp(weightDifference, -.8, .8);
      state.currentWeightKg = Math.round((state.currentWeightKg + weeklyAdjustment) * 10) / 10;
    }
  }
  if (!weeklyPlan.some(item => actions.find(action => action.id === item.actionId)?.category === "training") && state.preFightTrainingWeek !== endingWeek) state.fitness = clamp(state.fitness - 1);
  if (state.preFightTrainingWeek === endingWeek) state.preFightTrainingWeek = 0;
  const membershipWasActive = state.gymWeeks > 0;
  const strengthMembershipWasActive = state.strengthGymWeeks > 0;
  if (membershipWasActive) state.gymWeeks -= 1;
  if (strengthMembershipWasActive) state.strengthGymWeeks -= 1;

  let summary = "La récupération naturelle te rend un peu d'énergie.";
  if (state.injuryWeeks > 0) {
    if (state.injuryStartedWeek === endingWeek) {
      summary = `La récupération obligatoire commence : encore ${state.injuryWeeks} semaine${state.injuryWeeks > 1 ? "s" : ""} à ménager le camp.`;
    } else {
      state.injuryWeeks -= 1;
      state.injury = clamp(state.injury - 12);
      if (!state.injuryWeeks) state.injuryStartedWeek = 0;
      summary = state.injuryWeeks ? `Tu récupères de ta blessure : encore ${state.injuryWeeks} semaine à ménager le camp.` : "Tu es rétabli : le camp peut reprendre progressivement.";
    }
    events.push(summary);
  } else if (state.injury >= 55 && Math.random() < (state.injury + state.fatigue * .45) / 180) {
    state.injuryWeeks = state.injury >= 75 || state.fatigue >= 75 ? 2 : 1;
    state.injuryStartedWeek = endingWeek;
    state.fitness = clamp(state.fitness - 10);
    state.morale = clamp(state.morale - 8);
    const cancelledBookingId = state.scheduledFight?.bookingId;
    const cancelledFight = state.scheduledFight ? ` Le combat prévu contre ${scheduledOpponent()?.name || "ton adversaire"} est annulé.` : "";
    const wasRecreationalSparring = Boolean(state.scheduledFight?.isRecreationalSparring);
    state.scheduledFight = null;
    if (wasRecreationalSparring) state.recreationalSparringStatus = "ready";
    const cancelledBooking = state.bookings.find(item => item.id === cancelledBookingId);
    if (cancelledBooking) cancelledBooking.status = "cancelled";
    summary = `Blessure au camp : ${state.injuryWeeks} semaine${state.injuryWeeks > 1 ? "s" : ""} de récupération obligatoire.${cancelledFight}`;
    events.push(summary);
  } else if (state.energy < 20 || state.fatigue >= 85) {
    state.injury = clamp(state.injury + 6);
    summary = "La fatigue accumulée augmente ton risque de blessure. Il faudrait lever le pied.";
    events.push(summary);
  } else {
    state.injury = clamp(state.injury - 2);
  }
  if (state.careerStatus === "amateur" && !state.scheduledFight && !state.activeTournament && endingWeek > state.lastFightWeek) {
    state.avoidanceWeeks += 1;
    if (state.avoidanceWeeks >= 3) {
      const warning = state.avoidanceWeeks >= 6 ? "Le coach te prévient : à force d’éviter les combats, ta réputation et la qualité des offres diminuent." : "Le coach te prévient : trois semaines sans combat ralentissent ta réputation et ta progression.";
      state.reputation = clamp(state.reputation - (state.avoidanceWeeks >= 6 ? 2 : 1));
      state.morale = clamp(state.morale - 1);
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

function weeklyAlertTone(event) {
  const text = String(event || "").toLocaleLowerCase("fr-CA");
  if (/congédi|blessure|ko\b|tko\b|annul|expir|insuffisant|impossible|suspend|disqualif/.test(text)) return "critical";
  if (/fatigue|rythme faible|rythme fragile|absence|risque|renouvel|dernière semaine|attention|avertissement/.test(text)) return "warning";
  if (/niveau|vacances payées|offre confirmée|nouvel emploi|emploi actif|récupér|débloqu|sparring|tournoi/.test(text)) return "positive";
  return "info";
}

function renderWeeklyAlerts(events) {
  const labels = {
    critical: ["À corriger", "!"],
    warning: ["À surveiller", "!"],
    positive: ["Bonne nouvelle", "✓"],
  };
  const highlights = events
    .map(text => ({ text, tone: weeklyAlertTone(text) }))
    .filter(item => item.tone !== "info")
    .slice(0, 4);
  if (!highlights.length) return "";
  return `<section class="summary-alerts" aria-label="Alertes de la semaine"><h3>À surveiller</h3>${highlights.map(({ text, tone }) => {
    const [label, icon] = labels[tone];
    return `<div class="summary-alert ${tone}"><span class="summary-alert-icon" aria-hidden="true">${icon}</span><p><strong>${label}</strong>${escapeHTML(text)}</p></div>`;
  }).join("")}</section>`;
}

function executePlan() {
  const validation = planValidation();
  if (!validation.valid) return showToast(validation.reason);
  const endingWeek = state.week;
  const levelBefore = state.level;
  const before = { ...Object.fromEntries(generalStats.map(stat => [stat.key, state[stat.key]])), experience: state.experience, combatStats: { ...state.combatStats } };
  const totals = planEffects();
  const events = [];
  const privateCoachThisWeek = weeklyPlan.some(item => item.actionId === "private") ? privateCoaches.find(coach => coach.id === state.privateProgram?.coachId) : null;
  weeklyPlan.forEach(item => {
    const { action } = planItemEffects(item);
    state.journal.unshift({ week: endingWeek, text: action.message });
  });
  applyChanges(totals.rawGeneral);
  advanceTrainingProgress(events, endingWeek);
  applyCombatChanges(totals.rawCombat);
  if (weeklyPlan.some(item => item.actionId === "private")) completePrivateCourse(events, endingWeek);
  const boxingWorkThisWeek = planHasBoxingTraining(privateCoachThisWeek);
  recordBoxingTrainingForWeek(endingWeek, privateCoachThisWeek);
  if (privateCoachThisWeek?.type === "physical" && !boxingWorkThisWeek) state.boxingNeglectWeeks += 1;
  else if (boxingWorkThisWeek) state.boxingNeglectWeeks = 0;
  if (state.boxingNeglectWeeks >= 3) {
    applyCombatChanges({ technique: -1, defense: -1 });
    state.boxingNeglectWeeks = 0;
    events.push("Trois semaines centrées uniquement sur la préparation physique : −1 technique et −1 défense.");
  }
  const workedThisWeek = weeklyPlan.some(item => item.actionId === "work");
  const vacationThisWeek = weeklyPlan.some(item => item.actionId === "vacation");
  if (vacationThisWeek) {
    state.vacationBankWeeks = Math.max(0, state.vacationBankWeeks - 1);
    events.push("Vacances payées : la paie est maintenue et le corps récupère sans avertissement d’emploi. Cette tuile ne compte pas parmi les actions de la semaine.");
  }
  state.workStreak = workedThisWeek ? state.workStreak + 1 : Math.max(0, state.workStreak - 1);
  settleJobAttendance(workedThisWeek || vacationThisWeek, events, endingWeek, false, workedThisWeek);
  advanceJobApplication(events, endingWeek);
  advanceRecreationalTraining(events, endingWeek);
  if (weeklyPlan.some(item => item.actionId === "sponsor")) state.sponsorAvailableWeek = endingWeek + SPONSOR_COOLDOWN_WEEKS;
  if (workedThisWeek && state.workStreak >= 3) events.push("Tu enchaînes les semaines de travail : ta fraîcheur au camp commence à souffrir.");
  endWeek(events);
  if (state.level > levelBefore && state.levelNotice) events.unshift(state.levelNotice);
  const changes = [];
  [...generalStats.map(stat => [stat.key, stat.label, stat.key === "money" ? " $" : "%"]), ["experience", "Expérience", ""]].forEach(([key, label, suffix]) => {
    const delta = state[key] - before[key];
    if (delta) changes.push(`${label} : ${signed(delta, suffix)}`);
  });
  Object.entries(combatLabels).forEach(([key, label]) => {
    const delta = state.combatStats[key] - before.combatStats[key];
    if (delta) changes.push(`${label} : ${signed(delta)}`);
  });
  weeklyPlan = [];
  render();
  document.querySelector("#summary-title").textContent = `Bilan de la semaine ${endingWeek}`;
  document.querySelector("#summary-content").innerHTML = `<div class="summary-money"><div><span>Argent gagné</span><strong class="earned">+${totals.earned} $</strong></div><div><span>Argent dépensé</span><strong class="spent">−${totals.spent} $</strong></div></div>${renderWeeklyAlerts(events)}<div class="summary-section"><h3>Changements nets</h3><ul>${changes.map(change => `<li>${change}</li>`).join("") || "<li>Aucun changement</li>"}</ul></div><div class="summary-section"><h3>Événements</h3><ul>${events.map(event => `<li>${escapeHTML(event)}</li>`).join("") || "<li>Aucun imprévu cette semaine.</li>"}</ul></div>`;
  document.querySelector("#summary-dialog").showModal();
}

function applyPreFightPlan() {
  const localFightDue = Boolean(state.scheduledFight && !state.scheduledFight.tournamentId && state.week >= state.scheduledFight.week);
  if (!localFightDue) return true;
  const validation = planValidation();
  if (!validation.valid) {
    showToast(validation.reason);
    return false;
  }
  const events = [];
  if (!weeklyPlan.length) {
    settleJobAttendance(false, events, state.week);
    return true;
  }
  const totals = planEffects();
  const privateCoachThisWeek = weeklyPlan.some(item => item.actionId === "private") ? privateCoaches.find(coach => coach.id === state.privateProgram?.coachId) : null;
  weeklyPlan.forEach(item => {
    const { action } = planItemEffects(item);
    state.journal.unshift({ week: state.week, text: `Avant le gala : ${action.message}` });
  });
  applyChanges(totals.rawGeneral);
  advanceTrainingProgress(events, state.week);
  applyCombatChanges(totals.rawCombat);
  if (weeklyPlan.some(item => item.actionId === "private")) completePrivateCourse(events, state.week);
  const boxingWork = planHasBoxingTraining(privateCoachThisWeek);
  recordBoxingTrainingForWeek(state.week, privateCoachThisWeek);
  state.preFightTrainingWeek = boxingWork || weeklyPlan.some(item => actions.find(action => action.id === item.actionId)?.category === "training") ? state.week : 0;
  if (privateCoachThisWeek?.type === "physical" && !boxingWork) state.boxingNeglectWeeks += 1;
  else if (boxingWork) state.boxingNeglectWeeks = 0;
  const worked = weeklyPlan.some(item => item.actionId === "work");
  const vacation = weeklyPlan.some(item => item.actionId === "vacation");
  if (vacation) state.vacationBankWeeks = Math.max(0, state.vacationBankWeeks - 1);
  if (weeklyPlan.some(item => item.actionId === "video")) state.preFightStudyWeek = state.week;
  state.workStreak = worked ? state.workStreak + 1 : Math.max(0, state.workStreak - 1);
  settleJobAttendance(worked || vacation, events, state.week, false, worked);
  advanceJobApplication(events, state.week);
  if (weeklyPlan.some(item => item.actionId === "sponsor")) state.sponsorAvailableWeek = state.week + SPONSOR_COOLDOWN_WEEKS;
  weeklyPlan = [];
  if (events.length) state.journal.unshift({ week: state.week, text: `Préparation du gala : ${events.join(" ")}` });
  return true;
}

function continueAfterWeekTransition() {
  if (state.activeTournament && state.week >= state.activeTournament.startWeek && state.activeTournament.status !== "completed") openTournamentBoard();
}

function showBetweenWeekEvent() {
  const event = betweenWeekEventById(state.pendingWeekEvent);
  if (!event) return continueAfterWeekTransition();
  document.querySelector("#week-event-title").textContent = event.title;
  document.querySelector("#week-event-lead").textContent = event.lead;
  document.querySelector("#week-event-choices").innerHTML = event.choices.map(choice => {
    const cost = Math.max(0, -(choice.changes?.money || 0));
    const unavailable = cost > state.money;
    return `<button class="week-choice-card" type="button" data-week-choice="${choice.id}" ${unavailable ? "disabled" : ""}><span><strong>${choice.title}</strong><small>${choice.detail}</small></span><em>${unavailable ? `Il manque ${cost - state.money} $` : choice.effect}</em></button>`;
  }).join("");
  document.querySelector("#week-event-dialog").showModal();
}

function resolveBetweenWeekChoice(choiceId) {
  const event = betweenWeekEventById(state.pendingWeekEvent);
  const choice = event?.choices.find(item => item.id === choiceId);
  if (!event || !choice) return;
  const cost = Math.max(0, -(choice.changes?.money || 0));
  if (cost > state.money) return showToast("Pas assez d’argent pour ce choix.");
  const levelBefore = state.level;
  applyChanges(choice.changes);
  state.journal.unshift({ week: state.week, text: `Entre les semaines : ${choice.result}` });
  state.pendingWeekEvent = null;
  document.querySelector("#week-event-dialog").close();
  render();
  showToast(state.level > levelBefore && state.levelNotice ? state.levelNotice : "Décision appliquée à la nouvelle semaine");
  showCareerAlertOrContinue();
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
  const opponent = scheduledOpponent();
  if (!opponent) return;
  if (state.week < state.scheduledFight.week) return showToast(`Combat prévu à la semaine ${state.scheduledFight.week}.`);
  const isDeveloperBout = Boolean(state.scheduledFight.isDeveloperBout);
  if (state.injuryWeeks > 0 && !isDeveloperBout) return showToast("Blessure en cours : ce combat doit être annulé.");
  const isV2Sparring = Boolean(V2_ACTIVE && state.scheduledFight.isV2Sparring);
  if (!state.scheduledFight.tournamentId && !isV2Sparring && !isDeveloperBout && !applyPreFightPlan()) return;
  if (!state.scheduledFight.travelApplied) {
    applyChanges({ energy: state.scheduledFight.travelEffects?.energy || 0, fatigue: state.scheduledFight.travelEffects?.fatigue || 0 });
    state.scheduledFight.travelApplied = true;
  }
  const isRecreationalSparring = Boolean(state.scheduledFight.isRecreationalSparring);
  const isPracticeSparring = Boolean(state.scheduledFight.isPracticeSparring);
  const isNonRecordSparring = isRecreationalSparring || isPracticeSparring;
  const v2FightCareer = V2_ACTIVE && !state.scheduledFight.tournamentId && !isDeveloperBout
    ? v2CareerView()
    : null;
  const difficulty = opponentDifficulty(opponent);
  const opponentStats = opponent.stats || opponentStatsForRating(difficulty, opponent.style, opponent.id);
  if (!state.scheduledFight.fightSeed) state.scheduledFight.fightSeed = freshFightSeed(`${state.scheduledFight.id}-${state.week}`);
  const scheduled = cloneData(state.scheduledFight);
  const activeEffect = state.activeTournament?.competition?.activeEffects?.find(effect => effect.type === "scouting");
  const homeStudy = Number(scheduled.homeAdvantage?.coachReadBonus || 0);
  const campStudy = state.preFightStudyWeek === state.week ? .10 : 0;
  const coach = privateCoaches.find(item => item.id === state.privateProgram?.coachId && item.type === "boxing");
  fightState = BoxeurCombat.createFight({
    id: `${scheduled.id}-${state.week}-${scheduled.tournamentRound ?? "local"}`,
    seed: scheduled.fightSeed,
    kind: scheduled.tournamentId ? "tournament" : "local",
    tournamentId: scheduled.tournamentId,
    opponentDifficulty: difficulty,
    exchangesPerRound: isNonRecordSparring ? 4 : 5,
    coachQuality: clamp((isNonRecordSparring ? .58 : .60) + (coach?.reward || 0) * .035 + homeStudy, .55, .78),
    studyBonus: Math.max(campStudy, activeEffect?.readAccuracyBonus || 0, homeStudy),
    studyExchangeLimit: activeEffect?.exchangesRemaining,
    playerEffects: state.activeTournament?.competition?.activeEffects || [],
    player: {
      id: "player",
      name: state.profile.firstName,
      style: styles[state.profile.style].label,
      stats: v2FightCareer?.combatStats || state.combatStats,
      energy: isDeveloperBout ? 100 : v2FightCareer?.energy ?? state.activeTournament?.competition?.condition?.energy ?? state.energy,
      fitness: state.fitness,
      fatigue: isDeveloperBout ? 0 : v2FightCareer?.fatigue ?? state.fatigue,
      injury: isDeveloperBout ? 0 : state.injury,
      morale: state.morale,
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
    isV2Sparring,
    isDeveloperBout,
    remyLesson: !isRecreationalSparring ? state.remyLesson : "",
  };
  sparringRingState = isRecreationalSparring && window.BoxeurSparringRing
    ? window.BoxeurSparringRing.createState({
      seed: fightState.seed,
      playerCorner: state.profile.corner,
      playerStats: fightState.fighters.player.stats,
      opponentStyle: fightState.fighters.opponent.style,
      coachQuality: fightState.coach.quality,
    })
    : null;
  if (!isRecreationalSparring && state.remyLesson) state.remyLesson = "";
  const stage = document.querySelector("#fight-ring-stage");
  stage.dataset.cue = "neutral";
  stage.classList.remove("show-impact");
  configureRingImages();
  const backdrops = sparringRingState
    ? [...stage.querySelectorAll(".sparring-ring-backdrop, .sparring-before-backdrop, .sparring-corner-backdrop, .sparring-after-backdrop, .sparring-fighter-image")]
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
  if (event.careerWeek === state.week && plannedCoreActionCount() >= (amateurFightCount() >= 10 ? 4 : 3)) return showToast("Retire une action : le gala doit réserver une place dans la semaine.");
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
    condition: { energy: state.energy, fatigue: state.fatigue, injury: state.injury, fitness: state.fitness, cardio: state.combatStats.cardio, headDamage: 0, bodyDamage: 0, lucidity: 100 },
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
    summary: "",
    competition,
  };
  state.journal.unshift({ week: state.week, text: `${event.name} commence à ${event.venue.city}. Pesée et examen avant chaque combat.` });
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
    summary: "",
  };
  state.journal.unshift({ week: state.week, text: `Inscription aux ${tournament.name}. Début prévu dans ${TOURNAMENT_PREP_WEEKS} semaines, à la semaine ${state.activeTournament.startWeek}.` });
  render();
  showToast(`${tournament.name} : ${TOURNAMENT_PREP_WEEKS} semaines de préparation`);
}

function turnProfessional() {
  const eligibility = professionalEligibility();
  if (!eligibility.eligible || state.scheduledFight || state.activeTournament || state.careerStatus === "professional") return;
  if (!window.confirm(`Passer professionnel ?\n\nCe choix est définitif. Le circuit amateur sera fermé et un nouveau bilan professionnel commencera à 0–0–0.`)) return;
  state.careerStatus = "professional";
  state.professionalRecord = { wins: 0, losses: 0, draws: 0 };
  state.journal.unshift({ week: state.week, text: `${state.profile.firstName} quitte définitivement le circuit amateur et passe professionnel.` });
  render();
  showToast("Carrière professionnelle commencée");
}

function beginAmateurCareer() {
  if (!canPassAmateurCareer()) return;
  if (V2_ACTIVE) {
    const capsule = ensureV2PreviewCapsule();
    const onboarding = v2OnboardingView(capsule);
    if (onboarding && !onboarding.gates.passAmateur.allowed) return showToast(onboarding.gates.passAmateur.reason);
    if (capsule?.timeState?.stats) state.combatStats = cloneData(capsule.timeState.stats);
    if (onboarding?.state.mode === "guided") {
      applyV2OnboardingEvent({ type: window.BoxeurOnboarding.EVENT_TYPES.PASS_AMATEUR });
    }
  }
  const amateurEpoch = careerWeekDate(0);
  state.careerStatus = "amateur";
  state.week = 1;
  state.careerStartDate = amateurEpoch;
  state.calendar = null;
  state.bookings = [];
  state.scheduledFight = null;
  state.pendingWeekEvent = null;
  state.avoidanceWeeks = 0;
  state.lastFightWeek = 0;
  state.amateurRecord = { wins: 0, losses: 0, draws: 0 };
  state.journal.unshift({ week: 1, text: `${state.profile.firstName} passe officiellement amateur. Le calendrier des galas et tournois est ouvert.` });
  ensureCareerCalendar();
  document.querySelector("#calendar-dialog")?.close();
  render();
  showToast("Statut amateur confirmé · semaine 1");
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
      daily_check: "Pesée et contrôle à effectuer",
      ready: "Autorisé à boxer aujourd’hui",
      in_bout: "Combat en cours",
      inter_bout: "Journée terminée · récupération à choisir",
      completed: "Tournoi remporté",
      eliminated: "Éliminé du tournoi",
      withdrawn: "Retiré du tournoi",
    };
    const medicalLabel = competition.medical?.status === "fit_with_warning" ? "apte avec surveillance" : competition.medical?.status === "fit" ? "apte" : "à contrôler";
    dailyStatus.innerHTML = `<div><span>Jour du tournoi</span><strong>${competition.day} / ${competition.totalBouts}</strong></div><div><span>Poids actuel</span><strong>${Number(state.currentWeightKg).toFixed(1)} kg</strong><small>${category.minKg} à ${category.maxKg} kg</small></div><div><span>Énergie disponible</span><strong>${Math.round(competition.condition.energy)} %</strong><small>Fatigue ${Math.round(competition.condition.fatigue)} %</small></div><div><span>Contrôle</span><strong>${escapeHTML(phaseLabels[competition.phase] || competition.phase)}</strong><small>État : ${medicalLabel}</small></div>`;
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
        ? `${state.injuryWeeks > 0 ? "Passer le contrôle médical" : "Passer la pesée"} du jour ${competition.day}`
        : competition?.phase === BoxeurTournament.PHASES.INTER_BOUT
          ? "Choisis la récupération de la nuit"
          : `Disputer ${roundName(tournament.rounds, active.currentRound).toLowerCase()}`;
  button.title = state.injuryWeeks > 0 ? "Le contrôle quotidien décidera si le tournoi peut continuer." : "";
}

function openTournamentBoard() {
  if (!state.activeTournament) return;
  renderTournamentBoard();
  const dialog = document.querySelector("#tournament-dialog");
  if (!dialog.open) dialog.showModal();
}

function closeTournamentBoard() {
  document.querySelector("#tournament-dialog").close();
  if (state.activeTournament?.status === "completed") {
    const events = [state.activeTournament.summary];
    settleJobAttendance(false, events, state.week, true);
    state.activeTournament = null;
    weeklyPlan = [];
    endWeek(events);
    render();
    showToast("Tournoi terminé · retour au calendrier");
    if (state.pendingWeekEvent || state.jobLossNotice || state.levelAnnouncementPending) setTimeout(showCareerAlertOrContinue, 0);
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
  state.injury = clamp(Math.round(condition.injury));
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
        restrictionDays: state.injuryWeeks > 0 ? state.injuryWeeks * 7 : 0,
        acuteInjury: state.injury >= 88,
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

function sparringFighterAsset(role, visual) {
  const corner = role === "opponent" ? "red" : "blue";
  const pose = visual?.pose === "back" ? "back" : "front";
  return `assets/sparring-boxer-${corner}-${pose}.webp`;
}

function renderSparringRing(view) {
  const dialog = document.querySelector("#fight-dialog");
  const stage = document.querySelector("#fight-ring-stage");
  const destinations = document.querySelector("#sparring-ring-destinations");
  const coachCallout = document.querySelector("#sparring-coach-callout");
  const prototypeActive = isRemyRingPrototype();
  dialog?.classList.toggle("sparring-ring-prototype", prototypeActive);
  if (!stage || !destinations || !coachCallout) return;
  if (!prototypeActive) {
    delete stage.dataset.sparringScene;
    destinations.innerHTML = "";
    coachCallout.hidden = true;
    coachCallout.classList.remove("coach-warning");
    const logDisclosure = document.querySelector(".fight-log-disclosure");
    if (logDisclosure?.dataset.prototypePrepared) {
      delete logDisclosure.dataset.prototypePrepared;
      logDisclosure.open = true;
    }
    return;
  }

  stage.dataset.sparringScene = view.status.finished
    ? "after"
    : view.phase === "corner"
      ? view.round === 1 ? "before" : "corner"
      : "ring";
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
    image.src = sparringFighterAsset(role, visual);
  });

  const canChooseMovement = view.phase === "exchange" && !view.status.finished && !ringView.pendingMovement;
  stage.dataset.sparringStep = canChooseMovement ? "movement" : "action";
  destinations.innerHTML = canChooseMovement
    ? ringView.movementOptions.map(movement => {
      const cost = movement.energyCost === 0 ? "0" : `−${movement.energyCost}`;
      const energyLabel = movement.energyCost === 0
        ? "aucune énergie"
        : `${movement.energyCost} point${movement.energyCost > 1 ? "s" : ""} d’énergie`;
      return `<button type="button" class="sparring-move" data-sparring-move="${movement.id}" data-spaces="${movement.spaces}" data-role="${movement.role}" style="--move-x:${movement.point.xPercent}%;--move-y:${movement.point.yPercent}%;--move-scale:${movement.point.scale}" aria-label="${escapeHTML(`${movement.label}, ${energyLabel}`)}"><span class="sparring-move-target" aria-hidden="true"></span><span class="sparring-move-cost" aria-hidden="true">${cost}</span><span class="sparring-move-label">${escapeHTML(movement.label)}</span></button>`;
    }).join("")
    : "";

  const energy = clamp(Math.round(view.fighters.player.energy), 0, 100);
  const energyTrack = stage.querySelector(".sparring-player-energy");
  const energyBar = document.querySelector("#sparring-player-energy-bar");
  const roundHud = document.querySelector("#sparring-round-hud");
  if (energyBar) energyBar.style.width = `${energy}%`;
  energyTrack?.setAttribute("aria-valuenow", String(energy));
  if (roundHud) roundHud.textContent = `ROUND ${Math.min(3, view.round)} / 3`;

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
    ? "Ma première lecture ne tient plus. Regarde Rémy et adapte ta réponse."
    : movement
      ? `${movement.label} choisi. Maintenant, décide ce que tu fais depuis cette position.`
      : view.currentExchange?.situation || "Lis la distance avant de t’engager.";
  coachCallout.hidden = false;
  coachCallout.classList.toggle("coach-warning", warning);
  coachCallout.innerHTML = `<span>Ton coach</span><strong>${escapeHTML(warning ? "Change de plan — adapte-toi" : directive)}</strong><small>${escapeHTML(detail)}</small>`;
}

function renderFightRoundDynamic(view) {
  const container = document.querySelector("#fight-round-dynamic");
  if (!container) return;
  if (isRemyRingPrototype()) {
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

function recordSparringExchange(beforeView, transition) {
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
    side: transition.result.side,
    playerImpact: Number(transition.result.playerImpact || 0),
    opponentImpact: Number(transition.result.opponentImpact || 0),
  }).slice(-12);
}

function buildRemySparringDebrief(fight) {
  const notes = fight.careerMeta?.sparringObservations || [];
  const positive = notes.filter(note => note.side === "player" && note.playerImpact >= note.opponentImpact);
  const underPressure = notes.filter(note => ["ropes", "corner"].includes(note.position));
  const exits = underPressure.filter(note => ["pivot_exit", "clinch", "compact_cover", "retake_center"].includes(note.actionId));
  const aggressiveMisses = notes.filter(note => /Entrée agressive|Combinaison rapide|Accélération/.test(note.intention) && note.side === "opponent");
  const tiredRisks = notes.filter(note => note.energy < 38 && ["power_hook", "finish_pressure", "fast_combination", "body_attack"].includes(note.actionId));
  const strengths = [];
  const adjustments = [];
  if (exits.length) strengths.push("Tu as cherché une sortie ou cassé le rythme sous pression : c’est le bon réflexe près des câbles.");
  if (positive.length) strengths.push(`Au moins ${positive.length} échange${positive.length > 1 ? "s" : ""} a montré que tes choix peuvent retourner la séquence quand la lecture est bonne.`);
  if (!strengths.length) strengths.push("Tu as vu que chaque intention adverse laisse une fenêtre de réponse : lire avant de frapper compte autant que forcer l’échange.");
  if (underPressure.length > exits.length) adjustments.push("Quand Rémy te pousse vers les câbles, privilégie le pivot de sortie, la couverture compacte ou le clinch avant de lancer une grosse attaque.");
  if (aggressiveMisses.length) adjustments.push("Face à une entrée agressive, essaie garde haute, pivot ou contre-attaque : attaquer en même temps reste plus risqué.");
  if (tiredRisks.length) adjustments.push("Avec peu d’énergie, le jab prudent, le pas de retrait ou le clinch préservent mieux ta lucidité qu’une combinaison lourde.");
  if (!adjustments.length) adjustments.push("Au prochain combat, compare l’intention annoncée avec la distance et la position : une bonne réponse contextuelle vaut plus qu’un coup puissant répété.");
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

function renderFightChoices() {
  const container = document.querySelector("#fight-choices");
  if (!fightState || fightState.phase !== "exchange") {
    container.innerHTML = "";
    return;
  }
  const riskLabels = { low: "Risque faible", medium: "Risque mesuré", high: "Risque élevé" };
  const actions = BoxeurCombat.getAvailableActions(fightState);
  if (isRemyRingPrototype()) {
    if (!sparringRingState.pendingMovement) {
      container.innerHTML = `<p class="sparring-movement-prompt">CHOISIS TA POSITION</p>`;
      return;
    }
    const exits = ["pivot_exit", "lateral_evade", "retreat_step", "retake_center", "clinch", "compact_cover"];
    const first = actions[0];
    const attack = actions.find(action => action.family === "attack" && action.risk === "low") || actions.find(action => action.family === "attack") || first;
    const response = actions.find(action => action.directiveAligned) || actions.find(action => action.family === "defense") || first;
    const exit = actions.find(action => exits.includes(action.id)) || response;
    const shortcuts = [
      { purpose: "attack", label: "Tester", action: attack },
      { purpose: "defense", label: "Répondre", action: response },
      { purpose: "exit", label: "Se replacer", action: exit },
    ].filter(item => item.action);
    container.innerHTML = shortcuts.map(item => `<button type="button" data-fight-action="${item.action.id}" data-sparring-purpose="${item.purpose}" class="${item.action.directiveAligned ? "coach-match" : ""}" aria-label="${escapeHTML(`${item.label} : ${item.action.label}`)}"><strong>${escapeHTML(item.label)}</strong><span>${escapeHTML(item.action.description)}</span><em>${escapeHTML(item.action.label)} · ${item.action.baseEnergyCost.toFixed(1)} E</em></button>`).join("");
    return;
  }
  container.innerHTML = actions.map(action => `<button type="button" data-fight-action="${action.id}" class="${action.directiveAligned ? "coach-match" : ""}"><strong>${escapeHTML(action.label)}</strong><span>${escapeHTML(action.description)} · coût env. ${action.baseEnergyCost.toFixed(1)} E</span><em>${action.directiveAligned ? "Suit la directive du coach" : riskLabels[action.risk] || "Issue incertaine"}</em></button>`).join("");
}

function renderFightCoach() {
  const panel = document.querySelector("#fight-coach-panel");
  const choices = document.querySelector("#fight-coach-choices");
  if (!fightState || fightState.phase !== "corner") {
    panel.hidden = true;
    choices.innerHTML = "";
    return;
  }
  panel.hidden = false;
  const pending = fightState.coach.pending;
  const remyLesson = fightState.careerMeta?.remyLesson;
  const remyPrototype = isRemyRingPrototype();
  document.querySelector("#fight-coach-title").textContent = remyPrototype
    ? fightState.round === 1 ? "Le coach prépare ton sparring" : `Ton vrai coin · avant le round ${fightState.round}`
    : fightState.round === 1 ? "Directive avant le combat" : `Pause du coach avant le round ${fightState.round}`;
  document.querySelector("#fight-coach-analysis").textContent = `${pending.observation} Le coach propose : ${pending.prediction}.${remyLesson && fightState.round === 1 ? ` Rappel : ${remyLesson}` : ""}`;
  choices.innerHTML = BoxeurCombat.getCoachOptions(fightState).map(option => {
    let label = option.label;
    if (remyPrototype) {
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
      ? "Sparring d’évaluation · Rémy « Le Tank »"
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
  const showSparringTutorial = isRemyRingPrototype() && view.phase === "corner" && view.round === 1 && !view.status.finished;
  const sparringInstruction = isRemyRingPrototype()
    ? showSparringTutorial
      ? "La barre sous le ring montre ton ressenti du round, jamais un score ni une carte de juge."
      : view.phase === "corner"
        ? "Choisis une seule priorité avant de repartir."
        : sparringRingState.pendingMovement
          ? "Choisis maintenant ton intention depuis cette position."
          : "Choisis ta destination sur le ring : rester coûte 0, une case coûte 1 et deux cases coûtent 3."
    : null;
  instruction.hidden = Boolean(isRemyRingPrototype() && !view.status.finished && !showSparringTutorial);
  instruction.innerHTML = `<p>${escapeHTML(sparringInstruction || (view.phase === "corner" ? "Choisis entre une directive tactique, une adaptation contextuelle et la récupération." : message))}</p>`;
  const recent = view.history.filter(item => item.text).slice(-7);
  document.querySelector("#fight-log").innerHTML = recent.map(item => `<li>${item.round ? `R${item.round}${item.exchange ? `·E${item.exchange}` : ""} — ` : ""}${escapeHTML(item.text)}</li>`).join("") || "<li>Le combat va commencer.</li>";
  const logDisclosure = document.querySelector(".fight-log-disclosure");
  if (isRemyRingPrototype() && logDisclosure && !logDisclosure.dataset.prototypePrepared) {
    logDisclosure.open = false;
    logDisclosure.dataset.prototypePrepared = "true";
  }
  renderFightCoach();
  renderFightChoices();
  if (!view.status.finished) requestAnimationFrame(() => {
    const selector = view.phase === "corner"
      ? "#fight-coach-choices button"
      : isRemyRingPrototype() && !sparringRingState.pendingMovement
        ? "#sparring-ring-destinations button"
        : "#fight-choices button";
    document.querySelector(selector)?.focus({ preventScroll: isRemyRingPrototype() });
  });
}

function chooseFightCoachDirective(optionId) {
  if (!fightState || fightState.phase !== "corner") return;
  const enteringRound = fightState.round;
  const transition = BoxeurCombat.chooseCoachDirective(fightState, optionId);
  fightState = transition.state;
  if (isRemyRingPrototype() && enteringRound > 1) {
    sparringRingState = window.BoxeurSparringRing.beginRound(sparringRingState, enteringRound);
  }
  triggerFightVisual(transition.result);
  renderFight(transition.result.text);
}

function sparringActionForPurpose(actions, purpose, preferredId) {
  if (actions.some(action => action.id === preferredId)) return preferredId;
  const exits = ["pivot_exit", "lateral_evade", "retreat_step", "retake_center", "clinch", "compact_cover"];
  const fallback = purpose === "coach"
    ? actions.find(action => action.directiveAligned)
    : purpose === "attack"
      ? actions.find(action => action.family === "attack")
      : purpose === "defense"
        ? actions.find(action => action.family === "defense")
        : purpose === "exit"
          ? actions.find(action => exits.includes(action.id))
          : null;
  return (fallback || actions[0])?.id || preferredId;
}

function applySparringMovement(movementId) {
  if (!isRemyRingPrototype() || fightState.phase !== "exchange") return;
  try {
    const transition = window.BoxeurSparringRing.applyMovement(sparringRingState, fightState, movementId);
    sparringRingState = transition.state;
    fightState = transition.combatState;
    renderFight(transition.result.text);
  } catch (error) {
    console.error("[Boxeur Deux] Déplacement de sparring impossible :", error);
    showToast("Cette position n’est plus accessible.");
  }
}

function playRound(actionId, movementPurpose = "hold") {
  if (!fightState || fightState.phase !== "exchange") return;
  try {
    if (isRemyRingPrototype() && !sparringRingState.pendingMovement) {
      showToast("Choisis d’abord ta position dans le ring.");
      return;
    }
    const beforeView = BoxeurCombat.getPublicState(fightState);
    const transition = BoxeurCombat.resolveExchange(fightState, actionId);
    if (isRemyRingPrototype()) {
      sparringRingState = window.BoxeurSparringRing.advanceAfterExchange(sparringRingState, transition, transition.state);
    }
    fightState = transition.state;
    recordSparringExchange(beforeView, transition);
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

function settleV2Sparring(fight, fightFatigue, exposure) {
  const capsule = ensureV2PreviewCapsule();
  if (!capsule?.timeState || !window.BoxeurTime) return false;
  const runtime = normalizeV2PreviewRuntime(capsule);
  const isRemy = fight.careerMeta?.isRecreationalSparring === true;
  const label = isRemy ? "Sparring pédagogique avec Rémy « Le Tank »" : "Sparring technique au GYM";
  const trainedEarlierThisWeek = v2WeekTrainingActivityCount(capsule.timeState) > 0;
  const finalEnergy = clamp(Math.round(fight.fighters.player.energy), 0, 100);
  const energyCost = Math.max(0, Math.round(capsule.timeState.condition.energy - finalEnergy));
  try {
    capsule.timeState = window.BoxeurTime.performActivity(capsule.timeState, {
      id: `${isRemy ? "v2-remy-sparring" : "v2-practice-sparring"}:${capsule.timeState.clock.week}`,
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
    console.warn("[Boxeur Deux] Bilan temporel du sparring V2 simplifié :", error);
    capsule.timeState.condition.energy = finalEnergy;
    capsule.timeState.condition.fatigue = clamp(capsule.timeState.condition.fatigue + Math.max(6, Math.round(fightFatigue * .72)));
    capsule.timeState = window.BoxeurTime.advanceTime(capsule.timeState, 1);
  }
  if (isRemy) {
    const onboarding = v2OnboardingView(capsule);
    if (onboarding?.gates.remySparring.allowed) {
      applyV2OnboardingEvent({ type: window.BoxeurOnboarding.EVENT_TYPES.COMPLETE_REMY_SPARRING });
    }
    state.recreationalSparringStatus = "completed";
  }
  state.morale = clamp(state.morale + (isRemy ? 3 : 1));
  state.injury = clamp(state.injury + Math.max(1, Math.round(exposure * .12)));
  runtime.career.experience += isRemy ? 14 : 8;
  if (!isRemy && isCompetitiveCareer()) state.boxingTrainingWeek = capsule.timeState.clock.week;
  if (!trainedEarlierThisWeek) runtime.trainingSessions = safeNumber(runtime.trainingSessions + 1, 0, 0, 999);
  runtime.sessions.unshift({
    type: isRemy ? "v2-remy-sparring" : "v2-practice-sparring",
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
  state.scheduledFight = null;
  persistV2PreviewCapsule();
  return true;
}

function finishFight() {
  if (!fightState?.status.finished || fightState.careerApplied) return;
  const fightCountBefore = amateurFightCount();
  const meta = fightState.careerMeta || {};
  const fightResult = fightState.result;
  const won = fightResult.winner === "player";
  const result = won ? "Victoire" : "Défaite";
  const isRecreationalSparring = Boolean(meta.isRecreationalSparring);
  const isPracticeSparring = Boolean(meta.isPracticeSparring);
  const isNonRecordSparring = isRecreationalSparring || isPracticeSparring;
  const isV2Sparring = Boolean(meta.isV2Sparring);
  const isDeveloperBout = Boolean(meta.isDeveloperBout);
  const exposure = fightResult.exposure?.player || fightState.fighters.player.legacyExposure || 0;
  const fightFatigue = clamp(Math.round(8 + (100 - fightState.fighters.player.energy) * .14 + exposure * .25 - state.combatStats.cardio * .035), 8, 32);
  const injuryIncrease = clamp(Math.round(2 + exposure * .28 + (won ? 0 : 2) - (state.combatStats.defense - 40) * .025 + fightState.fighters.player.head * .025), 1, 15);
  if (isDeveloperBout) {
    // Un affrontement lancé par le menu caché exerce le vrai moteur, mais ne
    // touche jamais au bilan, aux jauges ni à la semaine de la carrière testée.
  } else if (isNonRecordSparring) {
    if (!isV2Sparring) {
      applyChanges({ experience: 14, morale: 3, injury: Math.max(1, Math.round(injuryIncrease * .65)), fatigue: Math.round(fightFatigue * .72) });
      if (isRecreationalSparring) state.recreationalSparringStatus = "completed";
    }
  } else if (won) {
    state.amateurRecord.wins += 1;
    applyChanges({ reputation: meta.tournamentId ? 6 + (state.activeTournament?.currentRound || 0) : meta.reputationReward, experience: meta.experienceReward, morale: 7, injury: injuryIncrease, fatigue: fightFatigue });
  } else {
    state.amateurRecord.losses += 1;
    applyChanges({ reputation: 2, experience: Math.max(10, (meta.experienceReward || 16) - 6), morale: -5, injury: injuryIncrease + 2, fatigue: fightFatigue + 3 });
  }
  if (!isV2Sparring && !isDeveloperBout) state.energy = clamp(Math.round(fightState.fighters.player.energy));
  if (!isNonRecordSparring && !isDeveloperBout) {
    state.lastFightWeek = state.week;
    state.avoidanceWeeks = 0;
  }
  const score = fightResult.method === "decision" ? `décision ${fightResult.decision}` : `${fightResult.label} · R${fightResult.round || fightState.round}`;
  const tournamentNote = isNonRecordSparring || isDeveloperBout ? "" : resolveTournamentRound({ ...fightState, tournamentId: meta.tournamentId, opponent: meta.opponent }, result, fightResult.method, score);
  const unlockedFourthAction = !isNonRecordSparring && !isDeveloperBout && fightCountBefore < 10 && amateurFightCount() >= 10;
  let injuryEvent = "";
  if (isDeveloperBout) {
    injuryEvent = "";
  } else if (isV2Sparring) {
    injuryEvent = exposure >= 45 ? " Le coach impose une récupération légère après cette opposition exigeante." : "";
  } else if (!won && fightResult.method === "KO") {
    state.injuryWeeks = Math.max(state.injuryWeeks, 2);
    state.injuryStartedWeek = state.week;
    injuryEvent = isRecreationalSparring ? " Le coach impose deux semaines de récupération après ce sparring exigeant." : " Une récupération obligatoire de deux semaines suit le KO.";
  } else if (!won && fightResult.method === "TKO") {
    state.injuryWeeks = Math.max(state.injuryWeeks, 1);
    state.injuryStartedWeek = state.week;
    injuryEvent = isRecreationalSparring ? " Le coach impose une semaine de récupération après ce sparring exigeant." : " Une semaine de récupération obligatoire suit l’arrêt.";
  } else {
    const acuteInjuryChance = clamp((state.injury - 58) / 160 + exposure / 240 + fightState.fighters.player.head / 600, 0, .38);
    if (!state.injuryWeeks && Math.random() < acuteInjuryChance) {
      state.injuryWeeks = state.injury >= 80 ? 2 : 1;
      state.injuryStartedWeek = state.week;
      state.fitness = clamp(state.fitness - 6);
      state.morale = clamp(state.morale - 3);
      injuryEvent = ` Une blessure impose ${state.injuryWeeks} semaine${state.injuryWeeks > 1 ? "s" : ""} de récupération.`;
    } else if (state.injury >= 55) injuryEvent = " Le corps sort marqué du combat.";
  }
  const methodLabel = isNonRecordSparring ? "Sparring terminé" : fightResult.method === "decision" ? `${fightResult.label} (${fightResult.decision})` : `${won ? "Victoire" : "Défaite"} par ${fightResult.label}`;
  const journalPrefix = isRecreationalSparring ? "Sparring d’évaluation" : isPracticeSparring ? "Sparring technique" : "Combat amateur";
  const sparringJournal = "Rémy termine son évaluation et confirme que le passage amateur est disponible.";
  const sparringDebrief = isRecreationalSparring ? buildRemySparringDebrief(fightState) : null;
  if (sparringDebrief) state.remyLesson = sparringDebrief.lesson;
  const sparringSummary = isRecreationalSparring
    ? sparringJournal
    : isPracticeSparring
      ? `Opposition contrôlée contre ${meta.opponent?.name || fightState.fighters.opponent.name}, sans résultat au bilan.`
      : `${methodLabel} contre ${meta.opponent?.name || fightState.fighters.opponent.name}.`;
  if (!isDeveloperBout) state.journal.unshift({ week: state.week, text: `${journalPrefix} : ${sparringSummary}${tournamentNote ? ` ${tournamentNote}` : ""}${injuryEvent}` });
  if (unlockedFourthAction) state.journal.unshift({ week: state.week, text: "Dix combats amateurs disputés : le programme hebdomadaire passe définitivement à quatre actions." });
  const booking = state.bookings.find(item => item.id === meta.bookingId);
  if (booking && !meta.tournamentId && !isDeveloperBout) booking.status = "completed";
  fightState.careerApplied = true;
  if (isDeveloperBout) {
    state.scheduledFight = developerBoutScheduledBackup;
    developerBoutScheduledBackup = null;
  } else if (isV2Sparring) settleV2Sparring(fightState, fightFatigue, exposure);
  else state.scheduledFight = null;
  if (meta.tournamentId && !isDeveloperBout) {
    restoreDeferredGalaAfterTournamentBout();
  } else if (!isV2Sparring && !isDeveloperBout) {
    const weekTransitionEvents = [];
    settleJobAttendance(false, weekTransitionEvents, state.week);
    weeklyPlan = [];
    endWeek(weekTransitionEvents);
  }
  if (!isV2Sparring && !isDeveloperBout) persistCareer();
  renderFight(`${methodLabel}.`);
  const instruction = document.querySelector("#fight-instruction");
  const sparringReport = sparringDebrief ? `<section class="sparring-debrief" aria-labelledby="sparring-debrief-title"><h3 id="sparring-debrief-title">Ce que Rémy veut te montrer</h3><div><strong>À garder</strong><ul>${sparringDebrief.strengths.map(item => `<li>${escapeHTML(item)}</li>`).join("")}</ul></div><div><strong>À essayer au prochain combat</strong><ul>${sparringDebrief.adjustments.map(item => `<li>${escapeHTML(item)}</li>`).join("")}</ul></div></section>` : "";
  instruction.innerHTML = `<p><strong>${escapeHTML(methodLabel)}</strong><br>${isDeveloperBout ? "Test terminé : la carrière, le bilan, les jauges et le calendrier sont restés intacts." : isRecreationalSparring ? "Rémy a terminé son évaluation. Tu peux passer amateur maintenant, ou continuer à t’entraîner jusqu’à la semaine 10." : isPracticeSparring ? "Le sparring reste une séance d’apprentissage : aucune victoire ni défaite n’est ajoutée au bilan." : meta.tournamentId ? escapeHTML(tournamentNote || "Le tableau est mis à jour.") : "Expérience, réputation, fatigue et état physique ont été mis à jour."}${injuryEvent ? `<br>${escapeHTML(injuryEvent.trim())}` : ""}</p>${sparringReport}`;
  const closeButton = document.createElement("button");
  closeButton.className = "primary-button";
  closeButton.type = "button";
  closeButton.textContent = isDeveloperBout ? "Retour au menu test" : meta.tournamentId ? "Retour au tournoi" : isRecreationalSparring ? "Voir le parcours récréatif" : isPracticeSparring ? "Retour au GYM" : "Retour au camp";
  closeButton.addEventListener("click", () => {
    document.querySelector("#fight-dialog").close();
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
        if (isV2Sparring) setTimeout(() => openV2Location("boxing-gym"), 0);
        else setTimeout(() => document.querySelector("#calendar-dialog")?.showModal(), 0);
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
  invalidateV2PreviewCapsule();
  state = cloneData(INITIAL_STATE);
  weeklyPlan = [];
  fightState = null;
  sparringRingState = null;
  selectedPrivateCoachId = null;
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
  if (V2_ACTIVE) openV2JobMenu();
  else openJobMenu();
  showToast("Nouvelle carrière lancée · statut récréatif");
});

document.querySelector("#import-career-creation")?.addEventListener("click", () => document.querySelector("#import-career-file")?.click());
document.querySelector("#import-career-file")?.addEventListener("change", async event => {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  try {
    const snapshot = JSON.parse(await file.text());
    restoreCareer(snapshot, { invalidateV2: true });
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
  invalidateV2PreviewCapsule();
  state = cloneData(INITIAL_STATE);
  weeklyPlan = [];
  fightState = null;
  sparringRingState = null;
  selectedPrivateCoachId = null;
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

document.querySelector("#v2-world")?.addEventListener("keydown", event => {
  const sheet = event.target.closest(".v2-location-sheet");
  if (!sheet || sheet.hidden) return;
  if (event.key === "Escape") {
    event.preventDefault();
    closeV2Location();
    return;
  }
  if (event.key !== "Tab") return;
  const focusable = v2LocationFocusableElements(sheet);
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

document.querySelector("#v2-world")?.addEventListener("click", event => {
  const disabledControl = event.target.closest('.v2-location-sheet [aria-disabled="true"]:not(:disabled)');
  if (disabledControl) {
    event.preventDefault();
    const reasonId = disabledControl.getAttribute("aria-describedby");
    const reason = reasonId ? document.getElementById(reasonId)?.textContent?.trim() : "";
    showToast(reason || "Cette option n’est pas disponible maintenant.");
    return;
  }
  const destination = event.target.closest("[data-v2-location]");
  if (destination) {
    openV2Location(destination.dataset.v2Location);
    return;
  }
  if (event.target.closest("[data-v2-week-quick]")) {
    applyV2QuickWeekPlan();
    return;
  }
  if (event.target.closest("[data-v2-week-handoff]")) {
    openV2WeekPlan();
    return;
  }
  if (event.target.closest("[data-v2-week-detailed]")) {
    selectV2DetailedWeek();
    return;
  }
  if (event.target.closest("[data-v2-week-confirm]")) {
    runV2AutomaticWeek();
    return;
  }
  const weekEntryRemove = event.target.closest("[data-v2-week-remove]");
  if (weekEntryRemove) {
    const removed = removeV2PlannerActivity(weekEntryRemove.dataset.v2WeekRemove);
    if (removed) openV2WeekPlan();
    return;
  }
  if (event.target.closest("[data-v2-week-summary-close]")) {
    closeV2Location();
    setTimeout(showCareerAlertOrContinue, 0);
    return;
  }
  if (event.target.closest("[data-v2-week-plan-close]")) {
    closeV2Location();
    return;
  }
  if (event.target.closest("[data-v2-close-location], [data-v2-leave-gym], [data-v2-leave-strength-gym], [data-v2-leave-home], [data-v2-leave-work], [data-v2-close-fighter], [data-v2-close-inventory]")) {
    closeV2Location();
    revealPendingV2LevelAlert();
    return;
  }
  if (event.target.closest("[data-v2-developer-secret]")) {
    registerDeveloperSecretTap();
    return;
  }
  if (event.target.closest("[data-v2-restore-career]")) {
    restoreDeveloperReturnCareer();
    return;
  }
  const inventoryAction = event.target.closest("[data-v2-inventory-action]");
  if (inventoryAction) {
    if (inventoryAction.dataset.v2InventoryAction === "reserve-week") {
      openV2SupplementReservation(inventoryAction.dataset.v2InventoryItem);
    }
    return;
  }
  const supplementEntry = event.target.closest("[data-v2-plan-supplement-entry]");
  if (supplementEntry) {
    reserveV2PlannerSupplement(supplementEntry.dataset.v2PlanSupplementEntry, supplementEntry.dataset.v2PlanSupplementProduct);
    return;
  }
  const supplementRemove = event.target.closest("[data-v2-plan-supplement-remove]");
  if (supplementRemove) {
    unreserveV2PlannerSupplement(supplementRemove.dataset.v2PlanSupplementRemove);
    return;
  }
  const locationEntryRemove = event.target.closest("[data-v2-location-remove]");
  if (locationEntryRemove) {
    const origin = event.currentTarget.querySelector(".v2-location-sheet")?.dataset.originLocation;
    removeV2PlannerActivity(locationEntryRemove.dataset.v2LocationRemove, { reopen: origin });
    return;
  }
  if (event.target.closest("[data-v2-inventory-reserve-close]")) {
    openV2Inventory();
    return;
  }
  if (event.target.closest("[data-v2-open-job-menu]")) {
    openV2JobMenu();
    return;
  }
  if (event.target.closest("[data-v2-cancel-job-application]")) {
    cancelV2JobApplication();
    return;
  }
  const workToggle = event.target.closest("[data-v2-toggle-work]");
  if (workToggle) {
    setV2PlannerWorkAttendance(workToggle.getAttribute("aria-pressed") !== "true");
    return;
  }
  if (event.target.closest("[data-v2-work-shift]")) {
    runV2WorkShift();
    return;
  }
  const workZone = event.target.closest("[data-v2-work-zone]");
  if (workZone) {
    if (workZone.dataset.v2WorkZone === "schedule") renderV2WorkMenu("schedule");
    else if (["job", "employment"].includes(workZone.dataset.v2WorkZone)) openV2JobMenu();
    return;
  }
  if (event.target.closest("[data-v2-work-menu-close]")) {
    openV2Location("work");
    return;
  }
  const homeMenu = event.target.closest("[data-v2-home-menu]");
  if (homeMenu) {
    renderV2HomeMenu(homeMenu.dataset.v2HomeMenu);
    return;
  }
  const homeAction = event.target.closest("[data-v2-home-action]");
  if (homeAction) {
    runV2HomeAction(homeAction.dataset.v2HomeAction);
    return;
  }
  const homeExercise = event.target.closest("[data-v2-home-exercise]");
  if (homeExercise) {
    toggleV2HomeExercise(homeExercise.dataset.v2HomeExercise);
    return;
  }
  if (event.target.closest("[data-v2-home-custom-confirm]")) {
    if (!v2HomeSelection.length) return;
    const selection = [...v2HomeSelection];
    const added = addV2PlannerActivity("home-custom", { selection }, { reopen: "home" });
    if (added) v2HomeSelection = [];
    return;
  }
  if (event.target.closest("[data-v2-home-composer-close]")) {
    v2HomeSelection = [];
    openV2Location("home");
    return;
  }
  if (event.target.closest("[data-v2-home-menu-close]")) {
    openV2Location("home");
    return;
  }
  if (event.target.closest("[data-v2-home-result-close]")) {
    openV2Location("home");
    revealPendingV2LevelAlert();
    return;
  }
  if (event.target.closest("[data-v2-classic-close]")) {
    openV2Location("home");
    return;
  }
  if (event.target.closest("[data-v2-gym-menu-close]")) {
    openV2Location("boxing-gym");
    return;
  }
  const strengthActivity = event.target.closest("[data-v2-strength-activity]");
  if (strengthActivity) {
    toggleV2StrengthActivity(strengthActivity.dataset.v2StrengthActivity);
    return;
  }
  const strengthPlan = event.target.closest("[data-v2-strength-plan]");
  if (strengthPlan) {
    selectV2StrengthPlan(strengthPlan.dataset.v2StrengthPlan);
    return;
  }
  if (event.target.closest("[data-v2-strength-confirm], [data-v2-strength-mobile-confirm]")) {
    runV2StrengthSession();
    return;
  }
  if (event.target.closest("[data-v2-strength-quick]")) {
    addV2PlannerActivity("strength-quick", {}, { reopen: "strength-gym" });
    return;
  }
  if (event.target.closest("[data-v2-strength-result-close]")) {
    openV2Location("strength-gym");
    revealPendingV2LevelAlert();
    return;
  }
  if (event.target.closest("[data-v2-strength-shop]")) {
    openV2SupplementShop();
    return;
  }
  const supplementBuy = event.target.closest("[data-v2-supplement-buy]");
  if (supplementBuy) {
    purchaseV2Supplement(supplementBuy.dataset.v2SupplementBuy);
    return;
  }
  const supplementPrepare = event.target.closest("[data-v2-supplement-prepare]");
  if (supplementPrepare) {
    executeV2PendingTraining(supplementPrepare.dataset.v2SupplementPrepare);
    return;
  }
  if (event.target.closest("[data-v2-supplement-skip]")) {
    executeV2PendingTraining(null);
    return;
  }
  if (event.target.closest("[data-v2-supplement-picker-close]")) {
    closeV2SupplementPicker();
    return;
  }
  if (event.target.closest("[data-v2-supplement-shop-close]")) {
    openV2Location("strength-gym");
    return;
  }
  if (event.target.closest("[data-v2-boxing-trainer]")) {
    renderV2TrainerMenu("boxing-gym");
    return;
  }
  if (event.target.closest("[data-v2-strength-trainer]")) {
    renderV2TrainerMenu("strength-gym");
    return;
  }
  const trainerTarget = event.target.closest("[data-v2-trainer-target]");
  if (trainerTarget) {
    v2TrainerTarget = trainerTarget.dataset.v2TrainerTarget;
    renderV2TrainerMenu(event.currentTarget.querySelector(".v2-location-sheet")?.dataset.trainerLocation || v2TrainerLocationForTarget(v2TrainerTarget));
    return;
  }
  const trainerStart = event.target.closest("[data-v2-trainer-start]");
  if (trainerStart) {
    startV2TrainerProgram(trainerStart.dataset.v2TrainerStart);
    return;
  }
  if (event.target.closest("[data-v2-trainer-session]")) {
    runV2TrainerSession();
    return;
  }
  const trainerDestination = event.target.closest("[data-v2-trainer-go-location]");
  if (trainerDestination) {
    openV2Location(trainerDestination.dataset.v2TrainerGoLocation);
    return;
  }
  if (event.target.closest("[data-v2-trainer-close], [data-v2-trainer-result-close]")) {
    const finishedTrainerSession = Boolean(event.target.closest("[data-v2-trainer-result-close]"));
    const trainerLocation = event.currentTarget.querySelector(".v2-location-sheet")?.dataset.trainerLocation || "boxing-gym";
    openV2Location(trainerLocation);
    if (finishedTrainerSession) revealPendingV2LevelAlert();
    return;
  }
  if (event.target.closest("[data-v2-coach-session]")) {
    runV2CoachSession();
    return;
  }
  if (event.target.closest("[data-v2-compose-session]")) {
    v2ComposerSelection = [];
    renderV2Composer();
    return;
  }
  const sessionPreset = event.target.closest("[data-v2-session-preset]");
  if (sessionPreset) {
    selectV2ComposerPreset(sessionPreset.dataset.v2SessionPreset);
    return;
  }
  const exercise = event.target.closest("[data-v2-exercise]");
  if (exercise) {
    toggleV2ComposerExercise(exercise.dataset.v2Exercise);
    return;
  }
  if (event.target.closest("[data-v2-confirm-session]")) {
    runV2CustomSession();
    return;
  }
  if (event.target.closest("[data-v2-close-composer], [data-v2-result-close]")) {
    const finishedBoxingSession = Boolean(event.target.closest("[data-v2-result-close]"));
    openV2Location("boxing-gym");
    if (finishedBoxingSession) revealPendingV2LevelAlert();
    return;
  }
  if (event.target.closest("[data-v2-remy-sparring]")) {
    startV2RemySparring();
    return;
  }
  if (event.target.closest("[data-v2-sparring-activity]")) {
    runV2TechnicalSparring();
    return;
  }
  if (event.target.closest("[data-v2-amateur-transition]")) {
    beginAmateurCareer();
    return;
  }
  if (event.target.closest("[data-v2-open-calendar]")) {
    document.querySelector("#open-calendar")?.click();
    return;
  }
  const gymZone = event.target.closest("[data-v2-gym-zone]");
  if (gymZone) {
    if (gymZone.dataset.v2GymZone === "reception") openV2MembershipMenu();
    else if (gymZone.dataset.v2GymZone === "coach") renderV2GymMenu("coach");
    else if (gymZone.dataset.v2GymZone === "training") {
      v2ComposerSelection = [];
      renderV2Composer();
    } else if (gymZone.dataset.v2GymZone === "ring") {
      const context = v2GymContext();
      if (context?.careerStatus === "recreational" && context.recreational?.remyStatus === "ready") startV2RemySparring();
      else if (context?.careerStatus !== "recreational") renderV2GymMenu("ring");
    }
    return;
  }
  const navigation = event.target.closest("[data-v2-nav]");
  if (navigation?.dataset.v2Nav === "fighter") {
    openV2Fighter();
    return;
  }
  if (navigation?.dataset.v2Nav === "inventory") {
    openV2Inventory();
    return;
  }
  if (navigation?.dataset.v2Nav === "map") {
    closeV2Location();
    return;
  }
});

document.querySelector("#action-grid").addEventListener("click", event => {
  const button = event.target.closest(".action-card");
  if (!button) return;
  const action = actions.find(item => item.id === button.dataset.action);
  toggleAction(action);
});

document.querySelector("#private-coaching").addEventListener("click", event => {
  if (event.target.closest("#open-coach-menu")) openCoachMenu();
});

document.querySelector("#employment").addEventListener("click", event => {
  if (event.target.closest("#open-job-menu")) openJobMenu();
  if (event.target.closest("#quit-job")) quitJob();
  if (event.target.closest("#cancel-job-application")) cancelJobApplication();
});

document.querySelector("#job-options").addEventListener("click", event => {
  if (V2_ACTIVE && event.target.closest("[data-v2-cancel-job-application]")) {
    cancelV2JobApplication();
    return;
  }
  const job = event.target.closest("[data-select-job]");
  if (job) {
    if (V2_ACTIVE) selectV2Job(job.dataset.selectJob);
    else selectJob(job.dataset.selectJob);
  }
});

document.querySelector("#job-dialog-close").addEventListener("click", () => closeOptionalDialog("job-dialog"));
document.querySelector("#job-dialog-cancel").addEventListener("click", () => closeOptionalDialog("job-dialog"));
document.querySelector("#job-dialog")?.addEventListener("cancel", event => {
  if (event.currentTarget.dataset.mandatory === "true") {
    event.preventDefault();
    showToast(event.currentTarget.dataset.mandatoryReason || "Choisis ton emploi de départ pour poursuivre.");
  }
});

document.querySelector("#private-coach-options").addEventListener("click", event => {
  const coach = event.target.closest("[data-select-private-coach]");
  if (coach) openPrivateProgram(coach.dataset.selectPrivateCoach);
});

document.querySelector("#private-form").addEventListener("submit", event => {
  event.preventDefault();
  if (event.submitter?.id === "private-confirm") startPrivateProgram();
  else document.querySelector("#private-dialog").close();
});

document.querySelector("#plan-content").addEventListener("click", event => {
  const remove = event.target.closest("[data-remove]");
  if (remove) {
    weeklyPlan = weeklyPlan.filter(item => item.actionId !== remove.dataset.remove);
    render();
    return;
  }
});

document.querySelector("#advance-week").addEventListener("click", executePlan);
document.querySelector("#export-career")?.addEventListener("click", exportCareer);
document.querySelector("#edit-profile")?.addEventListener("click", openProfileEditor);
document.querySelector("#profile-form")?.addEventListener("submit", saveProfileEdits);
document.querySelector("#profile-dialog-close")?.addEventListener("click", () => document.querySelector("#profile-dialog")?.close());
document.querySelector("#profile-cancel")?.addEventListener("click", () => document.querySelector("#profile-dialog")?.close());
document.querySelector("#open-level-dialog")?.addEventListener("click", () => openLevelDialog(false));
document.querySelector("#level-dialog-close")?.addEventListener("click", () => document.querySelector("#level-dialog")?.close());
document.querySelector("#level-dialog")?.addEventListener("close", () => {
  if (!resumeCareerAlertsAfterLevelDialog) return;
  resumeCareerAlertsAfterLevelDialog = false;
  showCareerAlertOrContinue();
});
document.querySelector("#level-up-later")?.addEventListener("click", () => {
  state.levelAnnouncementPending = false;
  document.querySelector("#level-up-dialog")?.close();
  persistCareer();
  showCareerAlertOrContinue();
});
document.querySelector("#level-up-allocate")?.addEventListener("click", () => {
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
  if (V2_ACTIVE) {
    const capsule = v2PreviewCapsule || ensureV2PreviewCapsule();
    if (capsule?.timeState?.stats) {
      capsule.timeState.stats[stat] = state.combatStats[stat];
      v2ProgressionSnapshot(capsule);
      persistV2PreviewCapsule();
    }
  }
  render();
  showToast(`+1 ${combatLabels[stat]}`);
  if (state.levelPoints === 0 && resumeCareerAlertsAfterLevelDialog) setTimeout(() => document.querySelector("#level-dialog")?.close(), 0);
});
document.querySelector("#plan-start-fight").addEventListener("click", startFight);
document.querySelector("#plan-withdraw-fight").addEventListener("click", withdrawFight);
document.querySelector("#summary-close").addEventListener("click", () => {
  document.querySelector("#summary-dialog").close();
  showCareerAlertOrContinue();
});
document.querySelector("#week-event-choices").addEventListener("click", event => {
  const choice = event.target.closest("[data-week-choice]");
  if (choice) resolveBetweenWeekChoice(choice.dataset.weekChoice);
});
document.querySelector("#summary-dialog").addEventListener("cancel", event => event.preventDefault());
document.querySelector("#week-event-dialog").addEventListener("cancel", event => event.preventDefault());

document.querySelector("#calendar-events").addEventListener("click", event => {
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
  if (event.target.closest("[data-open-tournament]")) openTournamentBoard();
});

document.querySelector("#tournament-board-close").addEventListener("click", closeTournamentBoard);
document.querySelector("#tournament-dialog").addEventListener("cancel", event => {
  event.preventDefault();
  closeTournamentBoard();
});
document.querySelector("#tournament-next-fight").addEventListener("click", startTournamentRound);
document.querySelector("#tournament-recovery-choices").addEventListener("click", event => {
  const choice = event.target.closest("[data-tournament-recovery]");
  if (choice) applyTournamentRecovery(choice.dataset.tournamentRecovery);
});

document.querySelector("#pro-transition").addEventListener("click", event => {
  if (event.target.closest("#turn-pro")) turnProfessional();
});
document.querySelector("#amateur-transition").addEventListener("click", event => {
  if (event.target.closest("#turn-amateur")) beginAmateurCareer();
});

document.querySelector("#open-calendar").addEventListener("click", () => document.querySelector("#calendar-dialog")?.showModal());
function closeCalendarDialog() {
  document.querySelector("#calendar-dialog")?.close();
  if (isRecreationalCareer() && state.pendingWeekEvent) setTimeout(showBetweenWeekEvent, 0);
}
document.querySelector("#calendar-dialog-close").addEventListener("click", closeCalendarDialog);
document.querySelector("#calendar-dialog-done").addEventListener("click", closeCalendarDialog);

document.querySelector("#scheduled-fight").addEventListener("click", event => {
  if (event.target.closest("#start-fight")) startFight();
  if (event.target.closest("#withdraw-fight")) withdrawFight();
});

document.querySelector("#fight-choices").addEventListener("click", event => {
  const choice = event.target.closest("[data-fight-action]");
  if (choice) playRound(choice.dataset.fightAction, choice.dataset.sparringPurpose || "hold");
});
document.querySelector("#sparring-ring-destinations").addEventListener("click", event => {
  const movement = event.target.closest("[data-sparring-move]");
  if (movement) applySparringMovement(movement.dataset.sparringMove);
});
document.querySelector("#fight-coach-choices").addEventListener("click", event => {
  const choice = event.target.closest("[data-coach-option]");
  if (choice) chooseFightCoachDirective(choice.dataset.coachOption);
});
document.querySelector("#fight-corner-boost").addEventListener("click", useCornerBoost);
document.querySelector("#fight-dialog").addEventListener("cancel", event => {
  if (fightState) event.preventDefault();
});

function setupMobileCollapsibles() {
  document.querySelectorAll(".collapsible-section").forEach(section => {
    const toggle = section.querySelector(".mobile-section-toggle");
    if (!toggle) return;
    const startsOpen = section.dataset.mobileOpen === "true";
    const stateLabel = toggle.querySelector(".toggle-state");
    section.classList.toggle("mobile-collapsed", !startsOpen);
    toggle.setAttribute("aria-expanded", String(startsOpen));
    if (stateLabel) stateLabel.textContent = startsOpen ? "Masquer" : "Afficher";
    toggle.addEventListener("click", () => {
      const collapsed = section.classList.toggle("mobile-collapsed");
      toggle.setAttribute("aria-expanded", String(!collapsed));
      if (stateLabel) stateLabel.textContent = collapsed ? "Afficher" : "Masquer";
    });
  });
}

document.querySelector("#membership-button").addEventListener("click", openMembershipMenu);
document.querySelector("#membership-options").addEventListener("click", event => {
  const plan = event.target.closest("[data-gym-plan]");
  if (plan) {
    if (V2_ACTIVE) selectV2GymPlan(plan.dataset.gymPlan);
    else selectGymPlan(plan.dataset.gymPlan);
  }
});
document.querySelector("#membership-dialog-close").addEventListener("click", () => closeOptionalDialog("membership-dialog"));
document.querySelector("#membership-dialog-cancel").addEventListener("click", () => closeOptionalDialog("membership-dialog"));
document.querySelector("#membership-dialog")?.addEventListener("cancel", event => {
  if (event.currentTarget.dataset.mandatory === "true") {
    event.preventDefault();
    showToast(event.currentTarget.dataset.mandatoryReason || "Choisis ton premier abonnement pour poursuivre.");
  }
});

document.querySelector("#strength-membership-button").addEventListener("click", openStrengthMembershipMenu);
document.querySelector("#strength-membership-options").addEventListener("click", event => {
  const plan = event.target.closest("[data-strength-gym-plan]");
  if (plan) selectStrengthGymPlan(plan.dataset.strengthGymPlan);
});
document.querySelector("#strength-membership-dialog-close").addEventListener("click", () => document.querySelector("#strength-membership-dialog").close());
document.querySelector("#strength-membership-dialog-cancel").addEventListener("click", () => document.querySelector("#strength-membership-dialog").close());

document.querySelector("#strength-gym-services").addEventListener("click", event => {
  const product = event.target.closest("[data-buy-supplement]")?.dataset.buySupplement;
  if (!product || state.strengthGymWeeks === 0) return;
  const offer = strengthGymProducts.find(item => item.id === product);
  if (!offer) return;
  const lock = productLock(offer);
  if (lock) return showToast(lock);
  applyChanges({ money: -offer.price, ...offer.changes });
  state.supplementWeek = state.week;
  state.supplementsUsed.push(offer.id);
  render();
  showToast(`${offer.label} consommé · ${state.supplementsUsed.length}/${MAX_SUPPLEMENTS_PER_WEEK} cette semaine`);
});

function resetCareer() {
  if (window.confirm("Recommencer et retourner à la création du boxeur ?\n\nLa carrière actuelle restera récupérable si tu recharges la page avant de valider le nouveau boxeur.")) {
    invalidateV2PreviewCapsule();
    state = cloneData(INITIAL_STATE);
    weeklyPlan = [];
    fightState = null;
    sparringRingState = null;
    applyCareerTheme();
    draftStats = { technique: 0, power: 0, cardio: 0, defense: 0 };
    document.querySelector("#creation-form").reset();
    renderCreation();
    render();
  }
}

document.querySelector("#restart").addEventListener("click", resetCareer);

setupMobileCollapsibles();
renderCreation();
render();
showResumePrompt();
