const CREATION_POINTS = 5;
const BASE_COMBAT_STAT = 40;
const GYM_PRICE = 110;
const STRENGTH_GYM_PRICE = 95;
const PRIVATE_PRICE = 90;
const TOURNAMENT_PREP_WEEKS = 4;
const SAVE_KEY = "boxeur-deux-career-v2";
const SAVE_VERSION = 4;
const MAX_SUPPLEMENTS_PER_WEEK = 2;
const SPONSOR_COOLDOWN_WEEKS = 4;

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

const fightStrategies = {
  attack: { label: "Attaquer", short: "Pression", fatigue: 16, beats: "distance", detail: "Pression · puissance + technique", intent: "Il avance avec pression" },
  distance: { label: "Boxer à distance", short: "Distance", fatigue: 10, beats: "defense", detail: "Technique + cardio", intent: "Il cherche à boxer à distance" },
  defense: { label: "Jouer la défense", short: "Contre", fatigue: 7, beats: "attack", detail: "Contre · défense + technique", intent: "Il attend pour contrer" },
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
  { id: "silver", medal: "II", name: "Gants d’argent", description: "8 participants · 3 combats · inscription du 6e au 10e combat.", participants: 8, rounds: 3, baseDifficulty: 52 },
  { id: "golden", medal: "I", name: "Gants dorés", description: "8 participants · 3 combats · rejouable dès 10 combats.", participants: 8, rounds: 3, baseDifficulty: 64 },
  { id: "canadian", medal: "CA", name: "Championnat canadien", description: "32 participants · 5 combats · exige l’or aux Gants dorés.", participants: 32, rounds: 5, baseDifficulty: 70 },
  { id: "olympic", medal: "OLY", name: "Parcours olympique", description: "32 participants · 5 combats · exige l’or au championnat canadien.", participants: 32, rounds: 5, baseDifficulty: 77 },
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

const INITIAL_STATE = {
  profile: null,
  combatStats: { technique: BASE_COMBAT_STAT, power: BASE_COMBAT_STAT, cardio: BASE_COMBAT_STAT, defense: BASE_COMBAT_STAT },
  week: 1,
  money: 180,
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
  amateurRecord: { wins: 0, losses: 0, draws: 0 },
  professionalRecord: { wins: 0, losses: 0, draws: 0 },
  careerStatus: "amateur",
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
  workStreak: 0,
  sponsorAvailableWeek: 1,
  supplementWeek: 1,
  supplementsUsed: [],
  levelNotice: null,
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

const actions = [
  { id: "gym", category: "training", icon: "T", title: "Travail aux mitaines", detail: "+12 XP · +5 forme · −18 énergie · +12 fatigue", progressStat: "technique", requiresGym: true, changes: { fitness: 5, energy: -18, injury: 3, experience: 12 }, message: "Le travail aux mitaines affine les gestes et les enchaînements." },
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
  { id: "work", category: "career", icon: "$", title: "Travailler", detail: "+70 $ au départ · −22 énergie · +18 fatigue · −4 moral", changes: { money: 70, energy: -22, morale: -4 }, message: "Un quart de travail paie les factures, mais laisse les jambes lourdes." },
  { id: "promotion", category: "career", icon: "M", title: "Promotion locale", detail: "20 $ · +8 réputation · +3 moral · −10 énergie", cost: 20, changes: { money: -20, reputation: 8, morale: 3, energy: -10 }, message: "Quelques apparitions locales font circuler ton nom dans le quartier." },
  { id: "family", category: "career", icon: "F", title: "Temps avec les proches", detail: "+9 moral · +6 énergie", changes: { morale: 9, energy: 6 }, message: "Une soirée avec les proches remet la carrière en perspective." },
  { id: "sponsor", category: "career", icon: "$+", title: "Petite commandite", detail: "+85 $ · +2 réputation · −12 énergie · −2 moral · délai de 4 semaines", requiresReputation: 30, changes: { money: 85, reputation: 2, morale: -2, energy: -12 }, message: "Une entreprise locale finance une partie du camp en échange d'une apparition promotionnelle." },
];

const actionFatigue = { gym: 12, private: 10, sparring: 22, roadwork: 14, heavybag: 15, video: 4, "strength-power": 18, "strength-circuit": 16, rest: -20, eat: 2, physio: -10, spa: -25, work: 18, promotion: 6, family: -4, sponsor: 8 };

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
let selectedPrivateCoachId = null;
let draftPortraitId = 0;

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
    corner: source.profile.corner === "blue" ? "blue" : "red",
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
    careerStatus: source.careerStatus === "professional" ? "professional" : "amateur",
    combatStats: Object.fromEntries(Object.keys(combatLabels).map(key => [key, safeNumber(source.combatStats?.[key], base.combatStats[key], 0, 99)])),
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
    gymWeeks: [0, 52], strengthGymWeeks: [0, 52], boxingNeglectWeeks: [0, 3], workStreak: [0, 3], sponsorAvailableWeek: [1, 99999],
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
  normalized.pendingWeekEvent = betweenWeekEvents.some(event => event.id === source.pendingWeekEvent) ? source.pendingWeekEvent : null;
  normalized.levelNotice = source.levelNotice ? safeText(source.levelNotice, "", 120) : null;
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
  }
}

function applyCareerTheme() {
  document.body.classList.toggle("theme-blue", state.profile?.corner === "blue");
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
    epoch: state.calendar?.epoch || undefined,
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
    let interval;
    try {
      interval = booking.grandfathered
        ? { startDate: event.startDate, endDate: event.endDate, travelOptionId: booking.travelOptionId }
        : BoxeurCalendar.bookingInterval(event, booking.travelOptionId);
    } catch {
      interval = { startDate: event.startDate, endDate: event.endDate, travelOptionId: booking.travelOptionId };
    }
    return { ...booking, event: cloneData(event), interval };
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
      const generated = generateTournamentOpponents(tournament);
      const storedOpponents = Array.isArray(raw.opponents) ? raw.opponents : [];
      raw.startWeek = safeNumber(raw.startWeek, state.week + TOURNAMENT_PREP_WEEKS, 1, 99999);
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
    weeklyPlan = (Array.isArray(snapshot?.weeklyPlan) ? snapshot.weeklyPlan : []).filter(item => {
      const action = actions.find(candidate => candidate.id === item?.actionId);
      if (!action || seenActions.has(action.id)) return false;
      if (action.id === "private" && !state.privateProgram) return false;
      seenActions.add(action.id);
      return true;
    }).slice(0, weeklyActionLimit());
    fightState = null;
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

function restoreCareer(snapshot) {
  try {
    hydrateCareer(snapshot);
    render();
    maybeShowDivisionMigration();
    showToast("Carrière restaurée");
    if (state.pendingWeekEvent) setTimeout(showBetweenWeekEvent, 0);
    return true;
  } catch (error) {
    console.error("[Boxeur Deux] Sauvegarde refusée :", error);
    showToast("Fichier de carrière invalide.");
    return false;
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
  choices.innerHTML = Object.entries(combatLabels).map(([key, label]) => `<button class="level-choice" type="button" data-level-stat="${key}" ${state.levelPoints < 1 || state.combatStats[key] >= 99 ? "disabled" : ""}><span>${label}</span><strong>${state.combatStats[key]}</strong><em>+1</em></button>`).join("");
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
  const campStatus = state.injuryWeeks > 0 ? ` · Blessé (${state.injuryWeeks} sem.)` : state.fatigue >= 75 ? " · Camp épuisé" : state.morale < 25 ? " · Moral fragile" : "";
  const divisionLabel = profile.sex === "female" ? "Division féminine" : "Division masculine";
  document.querySelector("#fighter-meta").textContent = `${weightClassLabel(profile.weightClass, profile.sex)} · ${divisionLabel} · ${styles[profile.style].label} · ${isProfessional ? "Professionnel" : "Amateur"}${campStatus}`;
  const portrait = document.querySelector("#fighter-portrait");
  const portraitImage = document.querySelector("#fighter-portrait-image");
  portrait?.style.setProperty("--portrait-index", String(profile.portraitId || 0));
  if (portraitImage) portraitImage.src = portraitAsset(profile.sex);
  portrait?.setAttribute("aria-label", `Portrait de ${profile.firstName}`);
  document.querySelector("#fighter-style-label").textContent = styles[profile.style].label;
  const record = state.amateurRecord;
  const amateurText = `${record.wins} V · ${record.losses} D${record.draws ? ` · ${record.draws} N historique${record.draws > 1 ? "s" : ""}` : ""}`;
  const pro = state.professionalRecord;
  document.querySelector("#career-records").innerHTML = isProfessional ? `Montréal, QC <span class="dot">•</span> Bilan pro : ${pro.wins} V · ${pro.losses} D · ${pro.draws} N <span class="dot">•</span> Bilan amateur final : ${amateurText}` : `Montréal, QC <span class="dot">•</span> Bilan amateur : <span id="amateur-record">${amateurText}</span>`;
  const medalTotals = Object.values(state.medals).reduce((totals, medals) => ({ bronze: totals.bronze + medals.bronze, silver: totals.silver + medals.silver, gold: totals.gold + medals.gold }), { bronze: 0, silver: 0, gold: 0 });
  const medalCount = medalTotals.bronze + medalTotals.silver + medalTotals.gold;
  document.querySelector("#career-medals").innerHTML = `<span>Médailles</span>${medalCount ? `<strong><i class="medal-dot bronze"></i>${medalTotals.bronze}<i class="medal-dot silver"></i>${medalTotals.silver}<i class="medal-dot gold"></i>${medalTotals.gold}</strong>` : "<em>Aucune pour l’instant</em>"}`;
  document.querySelector("#combat-stats").innerHTML = Object.entries(combatLabels).map(([key, label]) => `<div class="combat-stat"><span>${label}</span><strong>${state.combatStats[key]}</strong></div>`).join("");
  const nextFight = document.querySelector("#fighter-next-fight");
  const opponent = scheduledOpponent();
  if (opponent && state.scheduledFight) {
    const timing = state.week >= state.scheduledFight.week ? "Maintenant" : `Semaine ${state.scheduledFight.week}`;
    nextFight.className = `fighter-next-fight${state.week >= state.scheduledFight.week ? " due" : ""}`;
    nextFight.textContent = `Prochain combat · ${timing} · ${opponent.name}`;
  } else if (state.activeTournament && state.activeTournament.status !== "completed") {
    const tournament = tournamentDefs.find(item => item.id === state.activeTournament.id);
    nextFight.className = "fighter-next-fight";
    nextFight.textContent = `Prochaine compétition · ${tournament?.name || "Tournoi"} · semaine ${state.activeTournament.startWeek}`;
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
  document.querySelector("#edit-corner").value = state.profile.corner;
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
  state.profile.corner = document.querySelector("#edit-corner").value === "blue" ? "blue" : "red";
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
  return Math.max(0, base - (galaDue ? 1 : 0));
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
    if (count >= 6 && count <= 10) return { available: true, label: "Inscription ouverte" };
    return { available: false, label: count < 6 ? `Disponible au 6e combat` : "Fenêtre terminée" };
  }
  if (id === "golden") {
    return count >= 10 ? { available: true, label: state.medals.golden.gold ? `${state.medals.golden.gold} or · rejouable` : state.goldenPlacement ? `Nouvelle tentative · meilleur rang ${state.goldenPlacement}` : "Inscription ouverte" } : { available: false, label: `Disponible dans ${10 - count} combat${10 - count > 1 ? "s" : ""}` };
  }
  if (id === "canadian") {
    return state.medals.golden.gold > 0 ? { available: true, label: state.medals.canadian.gold ? "Champion · rejouable" : "Sélection ouverte" } : { available: false, label: "Remporte l’or aux Gants dorés" };
  }
  return state.medals.canadian.gold > 0 ? { available: true, label: state.olympicCompleted ? "Parcours terminé · rejouable" : "Sélection ouverte" } : { available: false, label: "Remporte l’or au championnat canadien" };
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
  const tournament = tournamentDefs.find(item => item.id === active.id);
  if (medal) state.medals[active.id][medal] += 1;
  if (active.id === "bronze" || active.id === "silver") state.tournaments[active.id] = medal === "gold" ? "won" : "lost";
  else state.tournaments[active.id] = "pending";
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
  active.summary = reason ? `${tournament.name} terminés : ${reason}.` : `${tournament.name} terminés : ${medalLabel}.`;
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

function expandMobileSection(selector) {
  if (!window.matchMedia("(max-width: 800px)").matches) return;
  const section = document.querySelector(selector);
  if (!section) return;
  section.classList.remove("mobile-collapsed");
  const toggle = section.querySelector(".mobile-section-toggle");
  toggle?.setAttribute("aria-expanded", "true");
  const stateLabel = toggle?.querySelector(".toggle-state");
  if (stateLabel) stateLabel.textContent = "Masquer";
}

function renderFights() {
  ensureCareerCalendar();
  ensureDueTournamentActive();
  const scheduled = document.querySelector("#scheduled-fight");
  const calendarContainer = document.querySelector("#calendar-events");
  const tournamentsContainer = document.querySelector("#tournaments");
  const activeTournamentContainer = document.querySelector("#active-tournament");
  const proTransition = document.querySelector("#pro-transition");
  const avoidanceWarning = document.querySelector("#fight-avoidance-warning");
  const fightCount = amateurFightCount();
  if (avoidanceWarning) {
    avoidanceWarning.hidden = state.avoidanceWeeks < 3;
    avoidanceWarning.textContent = state.avoidanceWeeks >= 6 ? "Avertissement du coach : les offres deviennent moins ambitieuses tant que tu évites les combats." : state.avoidanceWeeks >= 3 ? `Tu n’as pas combattu depuis ${state.avoidanceWeeks} semaines : ta réputation commence à baisser.` : "";
  }
  document.querySelector("#amateur-fight-count").textContent = `${fightCount} combat${fightCount > 1 ? "s" : ""} disputé${fightCount > 1 ? "s" : ""}`;

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
    const eventName = state.scheduledFight.tournamentId ? tournamentDefs.find(item => item.id === state.scheduledFight.tournamentId).name : "Combat local";
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
      const type = event.kind === "tournament" ? "Tournoi" : event.scope === "home-gym" ? "Gala à ton gym" : event.scope === "regional" ? "Gala régional" : "Gala local";
      const venue = `${event.venue.city}, ${event.venue.region}`;
      if (event.kind === "tournament") {
        const eligibility = BoxeurCalendar.evaluateEligibility(event, state, { bookings: activeBookings(), includeBookings: true });
        const travelChoices = BoxeurCalendar.travelOptionsForEvent(event);
        const buttons = booked
          ? `<button class="secondary-button" type="button" disabled>Inscription confirmée · ${booked.payment?.total || 0} $</button>`
          : travelChoices.map(choice => {
            const quote = BoxeurCalendar.quoteEventCost(event, choice.id);
            return `<button class="secondary-button" type="button" data-book-tournament="${event.id}" data-travel="${choice.id}" ${eligibility.eligible ? "" : "disabled"}>${escapeHTML(choice.label)} · ${quote.total} $</button>`;
          }).join("");
        return `<article class="calendar-event ${eventClass}${booked ? " booked" : ""}${eligibility.eligible || booked ? "" : " unavailable"}"><div class="calendar-event-head"><span class="calendar-event-type">${type}</span><span class="calendar-event-badge">${event.rounds} jours · 5 juges</span></div><h3>${escapeHTML(event.name)}</h3><p>${venue} · pesée quotidienne · un combat par jour.</p><div class="calendar-event-meta"><span>${weightClassLabel(state.profile.weightClass, state.profile.sex)}</span><span>${eligibility.reason}</span><span>Date limite ${formatDate(event.registrationDeadline)}</span></div><div class="calendar-event-actions">${buttons}</div></article>`;
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
    return `<section class="calendar-date-group"><div class="calendar-date"><strong>${escapeHTML(formatDate(date))}</strong><span>${events.length} événement${events.length > 1 ? "s" : ""}</span></div><div class="calendar-day-events">${eventCards}</div></section>`;
  }).join("") || '<div class="amateur-closed"><strong>Aucun événement annoncé</strong><p>Le calendrier sera prolongé à la prochaine semaine.</p></div>';

  if (fightCount > 5 && state.tournaments.bronze === "pending") state.tournaments.bronze = "missed";
  if (fightCount > 10 && state.tournaments.silver === "pending") state.tournaments.silver = "missed";
  if (state.activeTournament) {
    const active = state.activeTournament;
    const tournament = tournamentDefs.find(item => item.id === active.id);
    const remaining = Math.max(0, active.startWeek - state.week);
    const progress = Math.round(((TOURNAMENT_PREP_WEEKS - remaining) / TOURNAMENT_PREP_WEEKS) * 100);
    activeTournamentContainer.innerHTML = active.status === "completed" ? `<div class="tournament-countdown ready"><div><p class="eyebrow">Parcours terminé</p><strong>${escapeHTML(active.summary)}</strong></div><button class="secondary-button" type="button" data-open-tournament>Voir le tableau final</button></div>` : remaining > 0 ? `<div class="tournament-countdown"><div><p class="eyebrow">Inscription confirmée · ${tournament.name}</p><strong>Début dans ${remaining} semaine${remaining > 1 ? "s" : ""}</strong><p>Semaine ${active.startWeek} · ${tournament.participants} participants · ${tournament.rounds} combats à gagner</p><div class="countdown-meter"><span style="width:${progress}%"></span></div></div><button class="secondary-button" type="button" data-open-tournament>Voir le tableau</button></div>` : `<div class="tournament-countdown ready"><div><p class="eyebrow">Le tournoi commence</p><strong>${tournament.name}</strong><p>${tournament.participants} participants · prochain tour : ${roundName(tournament.rounds, active.currentRound)}</p></div><button class="primary-button" type="button" data-open-tournament>Ouvrir le tableau</button></div>`;
  } else {
    activeTournamentContainer.innerHTML = "";
  }
  tournamentsContainer.innerHTML = tournamentDefs.map(tournament => {
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
  if (amateurFightCount() === 0 || state.scheduledFight || state.activeTournament) expandMobileSection(".calendar-panel");
}

function projectedMoney() {
  return state.money + weeklyPlan.reduce((total, item) => {
    return total + (actionChangesFor(item).money || 0);
  }, 0);
}

function actionRequirementLock(action) {
  if (!action) return "Action inconnue";
  if (action.future) return "Bientôt disponible";
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
  if (action.id === "work" && state.energy < 30) return "Au moins 30 % d’énergie requis pour travailler";
  if (action.id === "work" && state.fatigue >= 75) return "Fatigue trop élevée : repose-toi avant de retravailler";
  if (action.id === "work" && state.workStreak >= 3) return "Trois semaines travaillées : une semaine sans travail est obligatoire";
  if (action.category === "training" && state.energy < 28) return "Énergie trop basse pour bien t’entraîner";
  if (action.category === "training" && state.fitness < 18) return "Forme physique trop basse : récupère d’abord";
  if (action.category === "training" && state.morale < 25) return "Moral trop bas : le camp ne peut pas être productif";
  if (action.category === "training" && state.fatigue >= 75) return "Fatigue trop élevée : récupère avant l’entraînement";
  if (actionFatigue[action.id] >= 17 && state.fatigue >= 88) return "Fatigue trop élevée pour une séance intensive";
  return "";
}

function actionLock(action) {
  const requirement = actionRequirementLock(action);
  if (requirement) return requirement;
  const condition = actionConditionLock(action);
  if (condition) return condition;
  if (weeklyPlan.length >= weeklyActionLimit()) return "Plan complet — retire une action";
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
  if (state.money < GYM_PRICE) add("work");
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
  document.querySelector("#action-grid").innerHTML = actionCategories.map((category, index) => {
    const categoryActions = actions.filter(action => action.category === category.id && (!action.requiresPrivateProgram || state.privateProgram)).map((action, originalIndex) => ({
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
      const progressDetail = action.progressStat ? ` · ${state.trainingProgress[action.progressStat]}/10 vers +1 ${combatLabels[action.progressStat].toLowerCase()}` : "";
      const work = action.id === "work" ? workOutcome() : null;
      const actionDetail = work ? `+${work.money} $ cette semaine · −22 énergie · +18 fatigue · −${Math.abs(work.morale)} moral` : action.detail;
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
    status.innerHTML = "<strong>GYM de boxe expiré</strong>Entraînement et sparring verrouillés";
    button.disabled = state.money < GYM_PRICE;
    button.textContent = button.disabled ? `Il manque ${GYM_PRICE - state.money} $ pour s’abonner` : `S’abonner · ${GYM_PRICE} $ / 4 semaines`;
    button.title = button.disabled ? `Il manque ${GYM_PRICE - state.money} $` : "";
  }
  services.innerHTML = state.gymWeeks > 0 ? `<div class="gym-exercise-heading"><strong>Exercices du GYM de boxe</strong><small>Disponibles dans Préparation et technique</small></div><div class="gym-exercise-grid">${gymExerciseCard("technique", "Travail aux mitaines")}${gymExerciseCard("defense", "Défense et esquives")}</div>` : `<div class="gym-locked-note">Abonne-toi pour débloquer les exercices de boxe.</div>`;
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
    button.disabled = state.money < STRENGTH_GYM_PRICE;
    button.textContent = button.disabled ? `Il manque ${STRENGTH_GYM_PRICE - state.money} $` : `S’abonner · ${STRENGTH_GYM_PRICE} $ / 4 semaines`;
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

function workOutcome() {
  const streakWages = [70, 60, 45];
  const baseWage = streakWages[Math.min(state.workStreak, streakWages.length - 1)];
  const fatiguePenalty = state.fatigue >= 65 ? .72 : state.fatigue >= 45 ? .86 : 1;
  const energyPenalty = state.energy < 45 ? .82 : 1;
  const wage = Math.max(25, Math.round(baseWage * fatiguePenalty * energyPenalty));
  const moraleLoss = 4 + (state.workStreak >= 2 ? 3 : 0) + (state.fatigue >= 70 ? 2 : 0);
  return { money: wage, energy: -22, fatigue: actionFatigue.work, morale: -moraleLoss, injury: state.fatigue >= 70 ? 3 : 0 };
}

function actionChangesFor(item) {
  const action = actions.find(candidate => candidate.id === item.actionId);
  if (!action) return {};
  if (action.id === "work") return workOutcome();
  if (action.id === "private") {
    const coach = privateCoaches.find(item => item.id === state.privateProgram?.coachId);
    if (!coach) return {};
    return { money: -privateCourseDuePrice(coach), energy: -14, fatigue: coach.fatigue, fitness: coach.fitness, morale: coach.morale, experience: 10 };
  }
  const changes = { ...(action.changes || {}) };
  if (actionFatigue[action.id]) changes.fatigue = (changes.fatigue || 0) + actionFatigue[action.id];
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
    combat: reachesMilestone ? { [action.progressStat]: 1 } : {},
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

function planValidation() {
  const tournamentDue = Boolean(state.activeTournament && state.activeTournament.status !== "completed" && state.week >= state.activeTournament.startWeek);
  const scheduledFightDue = Boolean(state.scheduledFight && state.week >= state.scheduledFight.week);
  if (state.pendingWeekEvent) return { valid: false, reason: "Choisis d’abord l’événement entre les semaines." };
  if (tournamentDue && state.injuryWeeks === 0) return { valid: false, reason: "Le tournoi a commencé : ouvre le tableau pour disputer le prochain combat." };
  if (!weeklyPlan.length && !scheduledFightDue) return { valid: false, reason: "Sélectionne au moins une action pour continuer." };
  if (weeklyPlan.length > weeklyActionLimit()) return { valid: false, reason: `Le plan dépasse la limite de ${weeklyActionLimit()} actions.` };
  const seen = new Set();
  for (const item of weeklyPlan) {
    const action = actions.find(candidate => candidate.id === item.actionId);
    if (!action || seen.has(item.actionId)) return { valid: false, reason: "Le plan contient une action invalide ou en double." };
    seen.add(item.actionId);
    const lock = actionRequirementLock(action) || actionConditionLock(action);
    if (lock) return { valid: false, reason: `${action.title} : ${lock}.` };
  }
  const totals = planEffects();
  if (state.money + (totals.rawGeneral.money || 0) < 0) return { valid: false, reason: "Le plan dépasse ton budget. Retire une dépense ou ajoute du travail." };
  const finalEnergy = clamp(state.energy + (totals.rawGeneral.energy || 0));
  const finalFatigue = clamp(state.fatigue + (totals.rawGeneral.fatigue || 0));
  if (finalEnergy < 5) return { valid: false, reason: "Ce programme épuiserait complètement ton boxeur. Ajoute de la récupération." };
  if (finalFatigue >= 96) return { valid: false, reason: "Ce programme pousserait la fatigue à un niveau dangereux. Ajoute du repos." };
  return { valid: true, reason: scheduledFightDue ? `Le combat réserve une action. Tu peux encore préparer ${weeklyPlan.length}/${weeklyActionLimit()} action${weeklyActionLimit() > 1 ? "s" : ""} avant d’entrer dans le ring.` : tournamentDue ? "Tournoi en pause pendant la blessure : planifie une semaine de récupération." : "Rien ne sera appliqué avant ta confirmation." };
}

function renderPlan() {
  const content = document.querySelector("#plan-content");
  const actionLimit = weeklyActionLimit();
  document.querySelector("#plan-count").textContent = `${weeklyPlan.length} / ${actionLimit} action${actionLimit > 1 ? "s" : ""}`;
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
      const progressDetail = action.progressStat ? currentProgress >= 9 ? ` · cette séance donne +1 ${combatLabels[action.progressStat].toLowerCase()}` : ` · progression prévue : ${currentProgress + 1}/10` : "";
      const work = action.id === "work" ? workOutcome() : null;
      const actionDetail = work ? `+${work.money} $ cette semaine · −22 énergie · +18 fatigue · −${Math.abs(work.morale)} moral` : action.detail;
      const detail = coach ? `${combatLabels[state.privateProgram.target]} · ${duePrice ? `${duePrice} $` : "séance déjà payée"} · cours ${state.privateProgram.sessionsCompleted + 1} / ${coach.sessions}` : `${actionDetail}${progressDetail}`;
      return `<div class="plan-row"><span class="plan-order">${index + 1}</span><div class="plan-row-copy"><strong>${action.title}</strong><small>${detail}</small></div><div class="plan-row-actions"><button class="plan-remove" type="button" data-remove="${action.id}">Retirer</button></div></div>`;
    }).join("");
    const emptyRows = Array.from({ length: actionLimit - weeklyPlan.length }, (_, index) => `<div class="plan-slot"><span>${weeklyPlan.length + index + 1}</span><em>Libre</em></div>`).join("");
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
  if (!hasFighter) return;

  ensureCareerCalendar();
  ensureDueTournamentActive();
  renderFighter();
  document.querySelector("#money-spotlight").textContent = `${state.money} $`;
  document.querySelector("#week").textContent = String(state.week).padStart(2, "0");
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
  document.querySelector("#action-limit-help").textContent = actionLimit === 0 ? "Le tournoi occupe toute la semaine : les décisions se prennent dans le hub de compétition." : galaDue ? `Le gala réserve une action : ${actionLimit} choix de camp restent disponibles avant le combat.` : actionLimit === 4 ? "Expérience acquise : compose maintenant un programme de quatre actions." : `Trois actions par semaine · la quatrième se débloque après ${Math.max(0, 10 - amateurFightCount())} combat${10 - amateurFightCount() > 1 ? "s" : ""}.`;
  const pips = document.querySelector("#action-pips");
  pips.innerHTML = Array.from({ length: actionLimit }, (_, index) => `<span class="pip ${index < weeklyPlan.length ? "active" : ""}"></span>`).join("");
  pips.setAttribute("aria-label", `${weeklyPlan.length} action${weeklyPlan.length > 1 ? "s" : ""} planifiée${weeklyPlan.length > 1 ? "s" : ""} sur ${actionLimit}`);

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
  renderFights();
  renderActions();
  renderPlan();
  persistCareer();
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
    if (!action?.progressStat) return;
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
  state.supplementWeek = state.week;
  state.supplementsUsed = [];
  state.pendingWeekEvent = betweenWeekEvents[(state.week - 2) % betweenWeekEvents.length].id;
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
    state.scheduledFight = null;
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
  const boxingWorkThisWeek = weeklyPlan.some(item => ["gym", "sparring", "heavybag", "video"].includes(item.actionId)) || privateCoachThisWeek?.type === "boxing";
  if (privateCoachThisWeek?.type === "physical" && !boxingWorkThisWeek) state.boxingNeglectWeeks += 1;
  else if (boxingWorkThisWeek) state.boxingNeglectWeeks = 0;
  if (state.boxingNeglectWeeks >= 3) {
    applyCombatChanges({ technique: -1, defense: -1 });
    state.boxingNeglectWeeks = 0;
    events.push("Trois semaines centrées uniquement sur la préparation physique : −1 technique et −1 défense.");
  }
  const workedThisWeek = weeklyPlan.some(item => item.actionId === "work");
  state.workStreak = workedThisWeek ? state.workStreak + 1 : Math.max(0, state.workStreak - 1);
  if (weeklyPlan.some(item => item.actionId === "sponsor")) state.sponsorAvailableWeek = endingWeek + SPONSOR_COOLDOWN_WEEKS;
  if (workedThisWeek && state.workStreak >= 3) events.push("Tu enchaînes les semaines de travail : la fatigue réduit ton rendement et ta fraîcheur au camp.");
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
  document.querySelector("#summary-content").innerHTML = `<div class="summary-money"><div><span>Argent gagné</span><strong class="earned">+${totals.earned} $</strong></div><div><span>Argent dépensé</span><strong class="spent">−${totals.spent} $</strong></div></div><div class="summary-section"><h3>Changements nets</h3><ul>${changes.map(change => `<li>${change}</li>`).join("") || "<li>Aucun changement</li>"}</ul></div><div class="summary-section"><h3>Événements</h3><ul>${events.map(event => `<li>${escapeHTML(event)}</li>`).join("") || "<li>Aucun imprévu cette semaine.</li>"}</ul></div>`;
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
  if (!weeklyPlan.length) return true;
  const events = [];
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
  const boxingWork = weeklyPlan.some(item => ["gym", "sparring", "heavybag", "video"].includes(item.actionId)) || privateCoachThisWeek?.type === "boxing";
  state.preFightTrainingWeek = boxingWork || weeklyPlan.some(item => actions.find(action => action.id === item.actionId)?.category === "training") ? state.week : 0;
  if (privateCoachThisWeek?.type === "physical" && !boxingWork) state.boxingNeglectWeeks += 1;
  else if (boxingWork) state.boxingNeglectWeeks = 0;
  const worked = weeklyPlan.some(item => item.actionId === "work");
  if (weeklyPlan.some(item => item.actionId === "video")) state.preFightStudyWeek = state.week;
  state.workStreak = worked ? state.workStreak + 1 : Math.max(0, state.workStreak - 1);
  if (weeklyPlan.some(item => item.actionId === "sponsor")) state.sponsorAvailableWeek = state.week + SPONSOR_COOLDOWN_WEEKS;
  weeklyPlan = [];
  if (events.length) state.journal.unshift({ week: state.week, text: `Préparation du gala : ${events.join(" ")}` });
  return true;
}

function continueAfterWeekTransition() {
  if (state.activeTournament && state.week >= state.activeTournament.startWeek && state.activeTournament.status !== "completed") openTournamentBoard();
}

function showBetweenWeekEvent() {
  const event = betweenWeekEvents.find(item => item.id === state.pendingWeekEvent);
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
  const event = betweenWeekEvents.find(item => item.id === state.pendingWeekEvent);
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
  continueAfterWeekTransition();
}

async function startFight() {
  if (fightState || document.querySelector("#fight-dialog")?.open) return;
  const opponent = scheduledOpponent();
  if (!opponent) return;
  if (state.week < state.scheduledFight.week) return showToast(`Combat prévu à la semaine ${state.scheduledFight.week}.`);
  if (state.injuryWeeks > 0) return showToast("Blessure en cours : ce combat doit être annulé.");
  if (!state.scheduledFight.tournamentId && !applyPreFightPlan()) return;
  if (!state.scheduledFight.travelApplied) {
    applyChanges({ energy: state.scheduledFight.travelEffects?.energy || 0, fatigue: state.scheduledFight.travelEffects?.fatigue || 0 });
    state.scheduledFight.travelApplied = true;
  }
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
    exchangesPerRound: 5,
    coachQuality: clamp(.60 + (coach?.reward || 0) * .035 + homeStudy, .55, .78),
    studyBonus: Math.max(campStudy, activeEffect?.readAccuracyBonus || 0, homeStudy),
    studyExchangeLimit: activeEffect?.exchangesRemaining,
    playerEffects: state.activeTournament?.competition?.activeEffects || [],
    player: {
      id: "player",
      name: state.profile.firstName,
      style: styles[state.profile.style].label,
      stats: state.combatStats,
      energy: state.activeTournament?.competition?.condition?.energy ?? state.energy,
      fitness: state.fitness,
      fatigue: state.fatigue,
      injury: state.injury,
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
  };
  const stage = document.querySelector("#fight-ring-stage");
  stage.dataset.cue = "neutral";
  stage.classList.remove("show-impact");
  configureRingImages();
  const backdrop = stage.querySelector(".ring-backdrop");
  if (backdrop) {
    backdrop.loading = "eager";
    backdrop.fetchPriority = "high";
    let preloadTimer;
    try {
      await Promise.race([
        backdrop.decode(),
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
  ensureCareerCalendar();
  const event = state.calendar.events.find(item => item.id === eventId && item.kind === "gala");
  if (!event) return showToast("Ce gala n’est plus disponible.");
  if (state.scheduledFight) return showToast("Un autre combat est déjà programmé.");
  if (event.careerWeek === state.week && weeklyPlan.length >= (amateurFightCount() >= 10 ? 4 : 3)) return showToast("Retire une action : le gala doit réserver une place dans la semaine.");
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

function bookTournamentEvent(eventId, travelOptionId) {
  ensureCareerCalendar();
  const event = state.calendar.events.find(item => item.id === eventId && item.kind === "tournament");
  if (!event) return showToast("Ce tournoi n’est plus disponible.");
  const result = BoxeurCalendar.createBooking({ event, career: state, existingBookings: activeBookings(), travelOptionId, currentDate: careerWeekDate(0) });
  if (!result.ok) return showToast(result.reason || "Inscription impossible.");
  state.money = result.moneyAfter;
  state.bookings.push(result.booking);
  state.tournaments[event.tournamentId] = "entered";
  state.journal.unshift({ week: state.week, text: `Inscription aux ${event.name} confirmée pour ${result.quote.total} $ (${event.venue.city}).` });
  render();
  showToast(`${event.name} · inscription confirmée`);
}

function activateTournamentBooking(booking) {
  if (!booking || state.activeTournament || booking.event?.kind !== "tournament") return state.activeTournament;
  const event = booking.event;
  const checkIn = BoxeurCalendar.checkInTournament(booking, state, { fightCount: amateurFightCount(), checkedAt: event.startDate });
  if (!checkIn.ok) {
    booking.status = "withdrawn";
    state.tournaments[event.tournamentId] = "missed";
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
  const definition = tournamentDefs.find(item => item.id === event.tournamentId);
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

function renderTournamentBoard() {
  const active = state.activeTournament;
  if (!active) return;
  const tournament = tournamentDefs.find(item => item.id === active.id);
  let competition = active.competition;
  const remaining = Math.max(0, active.startWeek - state.week);
  if (remaining === 0 && active.status === "preparing") active.status = "active";
  if (remaining === 0 && competition?.phase === BoxeurTournament.PHASES.PREPARING) {
    active.competition = BoxeurTournament.activateTournament(competition);
    competition = active.competition;
  }
  document.querySelector("#tournament-board-title").textContent = tournament.name;
  document.querySelector("#tournament-board-status").innerHTML = active.status === "completed" ? `<strong>${escapeHTML(active.summary)}</strong><span>${tournament.participants} participants · parcours terminé</span>` : remaining > 0 ? `<strong>Début dans ${remaining} semaine${remaining > 1 ? "s" : ""}</strong><span>Semaine ${active.startWeek} · profite de la préparation</span>` : `<strong>${roundName(tournament.rounds, active.currentRound)}</strong><span>${active.currentRound} victoire${active.currentRound > 1 ? "s" : ""} · ${tournament.rounds - active.currentRound} combat${tournament.rounds - active.currentRound > 1 ? "s" : ""} restant${tournament.rounds - active.currentRound > 1 ? "s" : ""}</span>`;
  const bracket = document.querySelector("#tournament-bracket");
  bracket.className = `tournament-bracket rounds-${tournament.rounds}`;
  bracket.innerHTML = active.opponents.map((opponent, index) => {
    const displayedDifficulty = opponentDifficulty(opponent, tournament.baseDifficulty);
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
    state.activeTournament = null;
    weeklyPlan = [];
    endWeek(events);
    render();
    showToast("Tournoi terminé · retour au calendrier");
    if (state.pendingWeekEvent) setTimeout(showBetweenWeekEvent, 0);
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

function opponentStylePreference(style = "") {
  if (/puncheur|pression|bagarreur/i.test(style)) return "attack";
  if (/technicien|mobile/i.test(style)) return "distance";
  if (/contre|défensif/i.test(style)) return "defense";
  return ["attack", "distance", "defense"][Math.floor(Math.random() * 3)];
}

function strategyThatBeats(strategy) {
  return Object.keys(fightStrategies).find(key => fightStrategies[key].beats === strategy);
}

function chooseOpponentStrategy(fight) {
  if (fight.round > 1 && fight.lastPlayerStrategy && Math.random() < .25 + fight.opponentDifficulty / 250) return strategyThatBeats(fight.lastPlayerStrategy);
  if (fight.opponentEnergy < 24 && Math.random() < .65) return "defense";
  if (Math.random() < .62) return opponentStylePreference(fight.opponent.style);
  return ["attack", "distance", "defense"][Math.floor(Math.random() * 3)];
}

function prepareOpponentRound(fight) {
  fight.opponentStrategy = chooseOpponentStrategy(fight);
  const readingAccuracy = clamp(.38 + (state.combatStats.technique - 35) * .006 + (state.morale - 50) * .0015, .34, .74);
  const preferred = opponentStylePreference(fight.opponent.style);
  const alternatives = Object.keys(fightStrategies).filter(strategy => strategy !== fight.opponentStrategy);
  fight.opponentTellStrategy = Math.random() < readingAccuracy ? fight.opponentStrategy : (preferred !== fight.opponentStrategy ? preferred : alternatives[Math.floor(Math.random() * alternatives.length)]);
  fight.readingAccuracy = readingAccuracy;
}

function tacticalEdge(playerStrategy, opponentStrategy) {
  if (fightStrategies[playerStrategy].beats === opponentStrategy) return 4.5;
  if (fightStrategies[opponentStrategy].beats === playerStrategy) return -4.5;
  return 0;
}

function strategySkill(stats, strategy) {
  const weights = {
    attack: { technique: .28, power: .42, cardio: .14, defense: .16 },
    distance: { technique: .38, power: .10, cardio: .28, defense: .24 },
    defense: { technique: .24, power: .12, cardio: .24, defense: .40 },
  }[strategy];
  return Object.entries(weights).reduce((total, [key, weight]) => total + stats[key] * weight, 0);
}

function roundEnergyCost(stats, strategy, opposingStats, opposingStrategy) {
  const cardioRelief = clamp((stats.cardio - 40) * .08, -2, 5);
  const incomingIntensity = opposingStrategy === "attack" ? .12 : opposingStrategy === "distance" ? .075 : .045;
  const incomingPressure = clamp(opposingStats.power * incomingIntensity + opposingStats.technique * .025 - stats.defense * .075, 0, 7);
  const cost = fightStrategies[strategy].fatigue - cardioRelief + incomingPressure + Math.random() * 2;
  return { cost: Math.max(4, Math.round(cost)), incomingPressure };
}

function renderFightChoices() {
  const fight = fightState;
  const container = document.querySelector("#fight-choices");
  if (!fight || fight.phase === "finished") {
    container.innerHTML = "";
    return;
  }
  if (fight.phase === "report") {
    container.innerHTML = `<button class="next-round-button" type="button" data-next-round><strong>Écouter le coin</strong><span>Passer au round ${fight.round + 1}</span></button>`;
    return;
  }
  container.innerHTML = Object.entries(fightStrategies).map(([key, strategy]) => {
    const matchup = key === "attack" ? "Met de la pression sur la distance" : key === "distance" ? "Force une garde défensive à travailler" : "Cherche le contre face à la pression";
    return `<button type="button" data-strategy="${key}"><strong>${strategy.label}</strong><span>${strategy.detail} · coût de base −${strategy.fatigue} E</span><em>${matchup}</em></button>`;
  }).join("");
}

function momentumLabel(fight) {
  const difference = fight.playerPoints - fight.opponentPoints;
  if (difference >= 2) return "Avantage à ton coin";
  if (difference <= -2) return "L’adversaire mène";
  return "Combat équilibré";
}

function renderFight(message = "Lis sa tendance et choisis une consigne.") {
  const fight = fightState;
  if (!fight) return;
  const tournamentName = fight.tournamentId ? tournamentDefs.find(item => item.id === fight.tournamentId)?.name || "Tournoi amateur" : "Combat amateur";
  const playerIsBlue = state.profile.corner === "blue";
  const playerCorner = document.querySelector(".player-corner");
  const opponentCorner = document.querySelector(".opponent-corner");
  playerCorner.classList.toggle("blue-corner", playerIsBlue);
  playerCorner.classList.toggle("red-corner", !playerIsBlue);
  opponentCorner.classList.toggle("red-corner", playerIsBlue);
  opponentCorner.classList.toggle("blue-corner", !playerIsBlue);
  playerCorner.querySelector(".fight-portrait").alt = `Portrait illustré de ${state.profile.firstName}, coin ${playerIsBlue ? "bleu" : "rouge"}`;
  opponentCorner.querySelector(".fight-portrait").alt = `Portrait illustré de ${fight.opponent.name}, coin ${playerIsBlue ? "rouge" : "bleu"}`;
  document.querySelector("#fight-week-label").textContent = `${tournamentName} · Semaine ${state.week}`;
  document.querySelector("#fight-round").textContent = fight.phase === "finished" ? "Fin · 3 rounds" : `Round ${fight.round} / 3`;
  document.querySelector("#fight-player-name").textContent = state.profile.firstName;
  document.querySelector("#fight-player-meta").textContent = `${state.profile.nickname ? `« ${state.profile.nickname} » · ` : ""}${state.profile.weightClass} · Coin ${playerIsBlue ? "bleu" : "rouge"}`;
  document.querySelector("#fight-opponent-name").textContent = fight.opponent.name;
  document.querySelector("#fight-opponent-meta").textContent = `« ${fight.opponent.nickname} » · ${fight.opponent.weightClass || state.profile.weightClass} · Coin ${playerIsBlue ? "rouge" : "bleu"}`;
  document.querySelector("#fight-player-energy").textContent = `${Math.max(0, fight.playerEnergy)}%`;
  document.querySelector("#fight-opponent-energy").textContent = `${Math.max(0, fight.opponentEnergy)}%`;
  document.querySelector("#fight-player-energy-bar").style.width = `${Math.max(0, fight.playerEnergy)}%`;
  document.querySelector("#fight-opponent-energy-bar").style.width = `${Math.max(0, fight.opponentEnergy)}%`;
  document.querySelector("#fight-score").textContent = `${fight.playerPoints} — ${fight.opponentPoints}`;
  document.querySelector("#fight-status").textContent = fight.phase === "report" ? `Round ${fight.round} terminé` : message;
  const tell = fightStrategies[fight.opponentTellStrategy]?.intent || "Il change de rythme";
  document.querySelector("#fight-opponent-tell").textContent = `Lecture probable : ${tell.toLocaleLowerCase("fr-CA")}`;
  document.querySelector("#fight-tactical-hint").textContent = `${fight.opponent.style} · difficulté ${fight.opponentDifficulty} · lecture imparfaite liée à ta technique`;
  document.querySelector("#fight-momentum").textContent = momentumLabel(fight);
  document.querySelector("#fight-round-track").innerHTML = Array.from({ length: 3 }, (_, index) => {
    const result = fight.rounds[index];
    const current = fight.phase !== "finished" && index + 1 === fight.round;
    return `<span class="${result ? "completed" : current ? "current" : ""}">R${index + 1}<strong>${result ? `${result.playerRound}–${result.opponentRound}` : "—"}</strong></span>`;
  }).join("");
  const cornerButton = document.querySelector("#fight-corner-boost");
  cornerButton.hidden = fight.phase === "finished";
  cornerButton.disabled = fight.phase !== "choice" || fight.round === 1 || !fight.cornerBoostAvailable;
  cornerButton.textContent = !fight.cornerBoostAvailable ? "Souffle déjà utilisé" : fight.round === 1 ? "Souffle disponible après le round" : "Souffler au coin · +8 E";
  const instruction = document.querySelector("#fight-instruction");
  instruction.innerHTML = "";
  const paragraph = document.createElement("p");
  paragraph.textContent = message;
  instruction.append(paragraph);
  renderFightChoices();
}

function playRound(strategy) {
  const fight = fightState;
  if (!fight || fight.phase !== "choice" || fight.round > 3 || !fightStrategies[strategy]) return;
  const playerStats = state.combatStats;
  const opponentStats = fight.opponentStats;
  const matchup = tacticalEdge(strategy, fight.opponentStrategy);
  const repeatPenalty = fight.lastPlayerStrategy === strategy ? -2.5 : 0;
  const playerCondition = (fight.playerEnergy - 70) * .10 + (state.fitness - 50) * .06 - state.fatigue * .09 - state.injury * .04 + (state.morale - 50) * .045;
  const opponentCondition = (fight.opponentEnergy - 70) * .10;
  const lateCardioEdge = (fight.round - 1) * (playerStats.cardio - opponentStats.cardio) * .065;
  const tacticalTechnique = (playerStats.technique - opponentStats.technique) * .03;
  const playerPowerEdge = (playerStats.power - opponentStats.defense) * (strategy === "attack" ? .08 : .035);
  const opponentPowerEdge = (opponentStats.power - playerStats.defense) * (fight.opponentStrategy === "attack" ? .08 : .035);
  const playerBase = strategySkill(playerStats, strategy) + playerCondition + matchup + repeatPenalty + lateCardioEdge + tacticalTechnique + playerPowerEdge;
  const opponentBase = strategySkill(opponentStats, fight.opponentStrategy) + opponentCondition + opponentPowerEdge;
  const edge = playerBase - opponentBase + (Math.random() * 12 - 6);
  let playerRound;
  let opponentRound;
  if (edge >= 8.5) [playerRound, opponentRound] = [10, 8];
  else if (edge >= 0) [playerRound, opponentRound] = [10, 9];
  else if (edge <= -8.5) [playerRound, opponentRound] = [8, 10];
  else [playerRound, opponentRound] = [9, 10];
  const playerEnergyBefore = fight.playerEnergy;
  const opponentEnergyBefore = fight.opponentEnergy;
  const playerCost = roundEnergyCost(playerStats, strategy, opponentStats, fight.opponentStrategy);
  const opponentCost = roundEnergyCost(opponentStats, fight.opponentStrategy, playerStats, strategy);
  fight.playerPoints += playerRound;
  fight.opponentPoints += opponentRound;
  fight.playerEnergy = clamp(fight.playerEnergy - playerCost.cost);
  fight.opponentEnergy = clamp(fight.opponentEnergy - opponentCost.cost);
  fight.playerDamageTaken += playerCost.incomingPressure + (opponentRound > playerRound ? 1.5 : 0) + (opponentRound - playerRound >= 2 ? 1.5 : 0);
  fight.opponentDamageTaken += opponentCost.incomingPressure + (playerRound > opponentRound ? 1.5 : 0) + (playerRound - opponentRound >= 2 ? 1.5 : 0);
  let playerRecovery = 0;
  let opponentRecovery = 0;
  if (fight.round < 3) {
    playerRecovery = clamp(Math.round((playerStats.cardio - 30) * .075), 1, 6);
    opponentRecovery = clamp(Math.round((opponentStats.cardio - 30) * .075), 1, 6);
    fight.playerEnergy = clamp(fight.playerEnergy + playerRecovery);
    fight.opponentEnergy = clamp(fight.opponentEnergy + opponentRecovery);
  }
  const tacticalNote = matchup > 0 ? "Ta lecture tactique est juste" : matchup < 0 ? "Son plan contre le tien" : "Les tactiques se neutralisent";
  const verdict = playerRound > opponentRound ? "Tu prends le round" : "Il prend le round";
  const recoveryNote = playerRecovery ? `, dont +${playerRecovery} récupérée grâce au cardio` : "";
  const feedback = `${fightStrategies[fight.opponentStrategy].intent}. ${tacticalNote}${repeatPenalty ? ", mais tu deviens prévisible" : ""}. ${verdict} ${playerRound}–${opponentRound}. Énergie ${playerEnergyBefore} → ${fight.playerEnergy}${recoveryNote}.`;
  fight.rounds.push({ number: fight.round, playerStrategy: strategy, opponentStrategy: fight.opponentStrategy, playerRound, opponentRound, playerEnergyBefore, playerEnergyAfter: fight.playerEnergy, opponentEnergyBefore, opponentEnergyAfter: fight.opponentEnergy, playerRecovery, opponentRecovery, edge, feedback });
  fight.lastPlayerStrategy = strategy;
  if (fight.round === 3) return finishFight();
  fight.phase = "report";
  renderFight(feedback);
}

function advanceFightRound() {
  const fight = fightState;
  if (!fight || fight.phase !== "report" || fight.round >= 3) return;
  fight.round += 1;
  fight.phase = "choice";
  prepareOpponentRound(fight);
  renderFight(`Round ${fight.round} : observe sa nouvelle tendance avant de choisir.`);
}

function useCornerBoost() {
  const fight = fightState;
  if (!fight || fight.phase !== "choice" || fight.round === 1 || !fight.cornerBoostAvailable) return;
  fight.playerEnergy = clamp(fight.playerEnergy + 8);
  fight.cornerBoostAvailable = false;
  renderFight("Le coin te calme et te rend 8 points d’énergie. Choisis maintenant ta consigne.");
}

function finishFight() {
  const fight = fightState;
  if (!fight || fight.phase === "finished") return;
  const fightCountBefore = amateurFightCount();
  let margin = fight.playerPoints - fight.opponentPoints;
  let result;
  if (fight.tournamentId && margin === 0) {
    const playerAdvances = fight.playerEnergy >= fight.opponentEnergy;
    margin = playerAdvances ? 1 : -1;
    fight.tiebreak = playerAdvances ? "Ton énergie restante fait pencher la décision de tournoi en ta faveur." : "Son énergie restante fait pencher la décision de tournoi en sa faveur.";
  }
  const fightFatigue = clamp(Math.round(8 + (100 - fight.playerEnergy) * .14 + fight.playerDamageTaken * .25 - state.combatStats.cardio * .035), 8, 32);
  const injuryIncrease = clamp(Math.round(2 + fight.playerDamageTaken * .28 + (margin < 0 ? 2 : 0) - (state.combatStats.defense - 40) * .025), 1, 13);
  if (margin > 0) {
    result = "Victoire";
    state.amateurRecord.wins += 1;
    applyChanges({ reputation: fight.tournamentId ? 6 + (state.activeTournament?.currentRound || 0) : fight.reputationReward, experience: fight.experienceReward, morale: 7, injury: injuryIncrease, fatigue: fightFatigue });
  } else if (margin < 0) {
    result = "Défaite";
    state.amateurRecord.losses += 1;
    applyChanges({ reputation: 2, experience: Math.max(10, fight.experienceReward - 6), morale: -5, injury: injuryIncrease + 2, fatigue: fightFatigue + 3 });
  } else {
    result = "Match nul";
    state.amateurRecord.draws += 1;
    applyChanges({ reputation: 4, experience: Math.max(12, fight.experienceReward - 3), morale: 1, injury: injuryIncrease + 1, fatigue: fightFatigue + 1 });
  }
  const unlockedFourthAction = fightCountBefore < 10 && amateurFightCount() >= 10;
  const tournamentNote = resolveTournamentRound(fight, result);
  state.lastFightWeek = state.week;
  state.avoidanceWeeks = 0;
  state.energy = clamp(fight.playerEnergy);
  let tournamentRecoveryNote = "";
  if (fight.tournamentId && result === "Victoire" && state.activeTournament?.status !== "completed") {
    // Une courte récupération garde l'attrition du tournoi sans condamner les parcours
    // de trois ou cinq combats. Le risque et les blessures, eux, sont conservés.
    state.energy = clamp(state.energy + 30);
    state.fatigue = clamp(state.fatigue - 16);
    tournamentRecoveryNote = "Récupération entre les tours : +30 énergie et −16 fatigue.";
  }
  const acuteInjuryChance = clamp((state.injury - 58) / 160 + fight.playerDamageTaken / 240, 0, .38);
  let injuryEvent = "";
  if (!state.injuryWeeks && Math.random() < acuteInjuryChance) {
    state.injuryWeeks = state.injury >= 80 ? 2 : 1;
    state.fitness = clamp(state.fitness - 6);
    state.morale = clamp(state.morale - 3);
    injuryEvent = ` Une blessure impose ${state.injuryWeeks} semaine${state.injuryWeeks > 1 ? "s" : ""} de récupération.`;
  } else if (state.injury >= 55) {
    injuryEvent = " Le corps sort marqué du combat : surveille le risque de blessure.";
  }
  state.journal.unshift({ week: state.week, text: `Combat amateur : ${result} contre ${fight.opponent.name}, ${fight.playerPoints}–${fight.opponentPoints}.${fight.tiebreak ? ` ${fight.tiebreak}` : ""}${tournamentNote ? ` ${tournamentNote}` : ""}${tournamentRecoveryNote ? ` ${tournamentRecoveryNote}` : ""}${injuryEvent}` });
  if (unlockedFourthAction) state.journal.unshift({ week: state.week, text: "Dix combats amateurs disputés : le programme hebdomadaire passe définitivement à quatre actions." });
  const roundSummary = fight.rounds.map(round => `R${round.number} ${fightStrategies[round.playerStrategy].short}/${fightStrategies[round.opponentStrategy].short} ${round.playerRound}–${round.opponentRound}`).join(" · ");
  const tiebreakNote = fight.tiebreak ? `<br>${fight.tiebreak}` : "";
  const unlockNote = unlockedFourthAction ? "<br><strong>Progression débloquée :</strong> tu peux maintenant planifier quatre actions par semaine." : "";
  const levelNote = state.levelNotice ? `<br><strong>${escapeHTML(state.levelNotice)}</strong>` : "";
  fight.phase = "finished";
  fight.result = result;
  state.scheduledFight = null;
  persistCareer();
  // Rafraîchir le tableau après le calcul du troisième round afin que son score soit visible.
  renderFight(`${result} après 3 rounds`);
  document.querySelector("#fight-instruction").innerHTML = `<p><strong>${result} — ${fight.playerPoints} à ${fight.opponentPoints}</strong><br><span class="fight-round-summary">${roundSummary}</span>${tiebreakNote}<br>${tournamentNote ? `${tournamentNote}<br>` : ""}${tournamentRecoveryNote ? `${tournamentRecoveryNote}<br>` : ""}Expérience, réputation, fatigue et état physique ont été mis à jour.${injuryEvent}${unlockNote}${levelNote}</p>`;
  document.querySelector("#fight-status").textContent = result;
  const closeButton = document.createElement("button");
  closeButton.className = "primary-button";
  closeButton.type = "button";
  closeButton.textContent = "Retour au camp";
  closeButton.addEventListener("click", () => {
    document.querySelector("#fight-dialog").close();
    state.scheduledFight = null;
    fightState = null;
    render();
    if (state.activeTournament) openTournamentBoard();
  });
  document.querySelector("#fight-instruction").append(closeButton);
}

/* Interface V4 du moteur tactique. Ces déclarations remplacent les anciens
   résolveurs par round tout en gardant leur code lisible pour la comparaison. */
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
  container.innerHTML = BoxeurCombat.getAvailableActions(fightState).map(action => `<button type="button" data-fight-action="${action.id}" class="${action.directiveAligned ? "coach-match" : ""}"><strong>${escapeHTML(action.label)}</strong><span>${escapeHTML(action.description)} · coût env. ${action.baseEnergyCost.toFixed(1)} E</span><em>${action.directiveAligned ? "Suit la directive du coach" : riskLabels[action.risk] || "Issue incertaine"}</em></button>`).join("");
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
  document.querySelector("#fight-coach-title").textContent = fightState.round === 1 ? "Directive avant le combat" : `Pause du coach avant le round ${fightState.round}`;
  document.querySelector("#fight-coach-analysis").textContent = `${pending.observation} Lecture proposée : ${pending.prediction}. Confiance ${pending.confidence}.`;
  choices.innerHTML = BoxeurCombat.getCoachOptions(fightState).map(option => `<button type="button" data-coach-option="${option.id}"><strong>${escapeHTML(option.label)}${option.recommended ? " · conseillé" : ""}</strong><span>${escapeHTML(option.description)} Compromis : ${escapeHTML(option.tradeoff)}</span></button>`).join("");
}

function renderFight(message = "Observe la situation puis choisis une réponse.") {
  if (!fightState) return;
  const view = BoxeurCombat.getPublicState(fightState);
  const meta = fightState.careerMeta || {};
  const opponent = meta.opponent || { name: view.fighters.opponent.name, nickname: "", weightClass: state.profile.weightClass, style: view.fighters.opponent.style };
  const tournamentName = meta.tournamentId ? tournamentDefs.find(item => item.id === meta.tournamentId)?.name || "Tournoi amateur" : (state.scheduledFight?.event?.name || "Gala amateur");
  const playerIsBlue = state.profile.corner === "blue";
  const playerCorner = document.querySelector(".player-corner");
  const opponentCorner = document.querySelector(".opponent-corner");
  playerCorner.classList.toggle("blue-corner", playerIsBlue);
  playerCorner.classList.toggle("red-corner", !playerIsBlue);
  opponentCorner.classList.toggle("red-corner", playerIsBlue);
  opponentCorner.classList.toggle("blue-corner", !playerIsBlue);
  const playerPortrait = document.querySelector(".player-corner .portrait-crop");
  playerPortrait.style.setProperty("--portrait-index", String(state.profile.portraitId || 0));
  const playerPortraitImage = document.querySelector("#fight-player-portrait");
  playerPortraitImage.src = portraitAsset(state.profile.sex);
  playerPortraitImage.alt = `Portrait de ${state.profile.firstName}, coin ${playerIsBlue ? "bleu" : "rouge"}`;
  const opponentPortrait = document.querySelector("#fight-opponent-portrait");
  opponentPortrait.src = opponentPortraitAsset();
  opponentPortrait.alt = `Portrait de ${opponent.name}, coin ${playerIsBlue ? "rouge" : "bleu"}`;
  configureRingImages();

  document.querySelector("#fight-week-label").textContent = `${tournamentName} · semaine ${state.week}`;
  document.querySelector("#fight-round").textContent = view.status.finished ? "Combat terminé" : view.phase === "corner" ? `${view.round === 1 ? "Briefing" : "Entre les rounds"} · round ${view.round} / 3` : `Round ${view.round} / 3 · échange ${view.currentExchange.number} / ${view.format.exchangesPerRound}`;
  document.querySelector("#fight-player-name").textContent = state.profile.firstName;
  document.querySelector("#fight-player-meta").textContent = `${state.profile.nickname ? `« ${state.profile.nickname} » · ` : ""}${state.profile.weightClass} · coin ${playerIsBlue ? "bleu" : "rouge"}`;
  document.querySelector("#fight-opponent-name").textContent = opponent.name;
  document.querySelector("#fight-opponent-meta").textContent = `${opponent.nickname ? `« ${opponent.nickname} » · ` : ""}${opponent.weightClass || state.profile.weightClass} · coin ${playerIsBlue ? "rouge" : "bleu"}`;
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
  stage.dataset.playerCorner = playerIsBlue ? "blue" : "red";
  stage.dataset.distance = view.ring.distance;
  stage.dataset.position = view.ring.position === "center" ? "center" : `${view.ring.position === "corner" ? "corner" : "ropes"}-${view.ring.pressured || "player"}`;

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

  const scoreLabel = document.querySelector("#fight-score-label");
  const score = document.querySelector("#fight-score");
  const cards = document.querySelector("#fight-judge-cards");
  if (view.status.finished) {
    scoreLabel.textContent = view.result.method === "decision" ? `Décision · ${view.format.judgeCount} juges` : "Arrêt du combat";
    score.textContent = view.result.method === "decision" ? view.result.decision : view.result.label;
    cards.hidden = !view.result.judgeCards;
    cards.innerHTML = (view.result.judgeCards || []).map((card, index) => `<div class="judge-card ${card.winner === "player" ? "winner" : ""}"><span>Juge ${index + 1}</span><strong>${card.playerTotal}–${card.opponentTotal}</strong></div>`).join("");
  } else {
    scoreLabel.textContent = "Cartes cachées";
    score.textContent = "—";
    cards.hidden = true;
    cards.innerHTML = "";
  }
  document.querySelector("#fight-status").textContent = view.status.finished ? view.result.label : view.phase === "corner" ? "Le coach donne ses directives" : "Décision tactique en cours";
  const instruction = document.querySelector("#fight-instruction");
  instruction.innerHTML = `<p>${escapeHTML(view.phase === "corner" ? "Choisis entre une directive tactique, une adaptation contextuelle et la récupération." : message)}</p>`;
  const recent = view.history.filter(item => item.text).slice(-7);
  document.querySelector("#fight-log").innerHTML = recent.map(item => `<li>${item.round ? `R${item.round}${item.exchange ? `·E${item.exchange}` : ""} — ` : ""}${escapeHTML(item.text)}</li>`).join("") || "<li>Le combat va commencer.</li>";
  renderFightCoach();
  renderFightChoices();
  if (!view.status.finished) requestAnimationFrame(() => {
    const selector = view.phase === "corner" ? "#fight-coach-choices button" : "#fight-choices button";
    document.querySelector(selector)?.focus({ preventScroll: false });
  });
}

function chooseFightCoachDirective(optionId) {
  if (!fightState || fightState.phase !== "corner") return;
  const transition = BoxeurCombat.chooseCoachDirective(fightState, optionId);
  fightState = transition.state;
  triggerFightVisual(transition.result);
  renderFight(transition.result.text);
}

function playRound(actionId) {
  if (!fightState || fightState.phase !== "exchange") return;
  try {
    const transition = BoxeurCombat.resolveExchange(fightState, actionId);
    fightState = transition.state;
    triggerFightVisual(transition.result);
    if (fightState.status.finished) finishFight();
    else renderFight(transition.result.text);
  } catch (error) {
    console.error("[Boxeur Deux] Échange impossible :", error);
    showToast("Cette action n’est plus disponible.");
  }
}

function advanceFightRound() {
  renderFight("Le coach analyse le round terminé.");
}

function useCornerBoost() {
  if (fightState?.phase === "corner") chooseFightCoachDirective("recover");
}

function finishFight() {
  if (!fightState?.status.finished || fightState.careerApplied) return;
  const fightCountBefore = amateurFightCount();
  const meta = fightState.careerMeta || {};
  const fightResult = fightState.result;
  const won = fightResult.winner === "player";
  const result = won ? "Victoire" : "Défaite";
  const exposure = fightResult.exposure?.player || fightState.fighters.player.legacyExposure || 0;
  const fightFatigue = clamp(Math.round(8 + (100 - fightState.fighters.player.energy) * .14 + exposure * .25 - state.combatStats.cardio * .035), 8, 32);
  const injuryIncrease = clamp(Math.round(2 + exposure * .28 + (won ? 0 : 2) - (state.combatStats.defense - 40) * .025 + fightState.fighters.player.head * .025), 1, 15);
  if (won) {
    state.amateurRecord.wins += 1;
    applyChanges({ reputation: meta.tournamentId ? 6 + (state.activeTournament?.currentRound || 0) : meta.reputationReward, experience: meta.experienceReward, morale: 7, injury: injuryIncrease, fatigue: fightFatigue });
  } else {
    state.amateurRecord.losses += 1;
    applyChanges({ reputation: 2, experience: Math.max(10, (meta.experienceReward || 16) - 6), morale: -5, injury: injuryIncrease + 2, fatigue: fightFatigue + 3 });
  }
  state.energy = clamp(Math.round(fightState.fighters.player.energy));
  state.lastFightWeek = state.week;
  state.avoidanceWeeks = 0;
  const score = fightResult.method === "decision" ? `décision ${fightResult.decision}` : `${fightResult.label} · R${fightResult.round || fightState.round}`;
  const tournamentNote = resolveTournamentRound({ ...fightState, tournamentId: meta.tournamentId, opponent: meta.opponent }, result, fightResult.method, score);
  const unlockedFourthAction = fightCountBefore < 10 && amateurFightCount() >= 10;
  let injuryEvent = "";
  if (!won && fightResult.method === "KO") {
    state.injuryWeeks = Math.max(state.injuryWeeks, 2);
    state.injuryStartedWeek = state.week;
    injuryEvent = " Une récupération obligatoire de deux semaines suit le KO.";
  } else if (!won && fightResult.method === "TKO") {
    state.injuryWeeks = Math.max(state.injuryWeeks, 1);
    state.injuryStartedWeek = state.week;
    injuryEvent = " Une semaine de récupération obligatoire suit l’arrêt.";
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
  const methodLabel = fightResult.method === "decision" ? `${fightResult.label} (${fightResult.decision})` : `${won ? "Victoire" : "Défaite"} par ${fightResult.label}`;
  state.journal.unshift({ week: state.week, text: `Combat amateur : ${methodLabel} contre ${meta.opponent?.name || fightState.fighters.opponent.name}.${tournamentNote ? ` ${tournamentNote}` : ""}${injuryEvent}` });
  if (unlockedFourthAction) state.journal.unshift({ week: state.week, text: "Dix combats amateurs disputés : le programme hebdomadaire passe définitivement à quatre actions." });
  const booking = state.bookings.find(item => item.id === meta.bookingId);
  if (booking && !meta.tournamentId) booking.status = "completed";
  fightState.careerApplied = true;
  state.scheduledFight = null;
  if (meta.tournamentId) {
    restoreDeferredGalaAfterTournamentBout();
  } else {
    const weekTransitionEvents = [];
    weeklyPlan = [];
    endWeek(weekTransitionEvents);
  }
  persistCareer();
  renderFight(`${methodLabel}.`);
  const instruction = document.querySelector("#fight-instruction");
  instruction.innerHTML = `<p><strong>${escapeHTML(methodLabel)}</strong><br>${meta.tournamentId ? escapeHTML(tournamentNote || "Le tableau est mis à jour.") : "Expérience, réputation, fatigue et état physique ont été mis à jour."}${injuryEvent ? `<br>${escapeHTML(injuryEvent.trim())}` : ""}</p>`;
  const closeButton = document.createElement("button");
  closeButton.className = "primary-button";
  closeButton.type = "button";
  closeButton.textContent = meta.tournamentId ? "Retour au tournoi" : "Retour au camp";
  closeButton.addEventListener("click", () => {
    document.querySelector("#fight-dialog").close();
    const wasTournament = Boolean(meta.tournamentId);
    fightState = null;
    if (wasTournament) {
      render();
      openTournamentBoard();
    } else {
      render();
      if (state.pendingWeekEvent) setTimeout(showBetweenWeekEvent, 0);
    }
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
  state = cloneData(INITIAL_STATE);
  weeklyPlan = [];
  fightState = null;
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
  document.body.classList.toggle("theme-blue", corner === "blue");
  Object.keys(combatLabels).forEach(key => { state.combatStats[key] = BASE_COMBAT_STAT + styles[style].bonuses[key] + draftStats[key]; });
  state.journal = [{ week: 1, text: `${state.profile.firstName} rejoint le circuit amateur. La route commence ici.` }];
  render();
  showToast("Nouvelle carrière lancée");
});

document.querySelector("#import-career-creation")?.addEventListener("click", () => document.querySelector("#import-career-file")?.click());
document.querySelector("#import-career-file")?.addEventListener("change", async event => {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  try {
    const snapshot = JSON.parse(await file.text());
    restoreCareer(snapshot);
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
  state = cloneData(INITIAL_STATE);
  weeklyPlan = [];
  fightState = null;
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

document.querySelector("#action-grid").addEventListener("click", event => {
  const button = event.target.closest(".action-card");
  if (!button) return;
  const action = actions.find(item => item.id === button.dataset.action);
  toggleAction(action);
});

document.querySelector("#private-coaching").addEventListener("click", event => {
  if (event.target.closest("#open-coach-menu")) openCoachMenu();
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
document.querySelector("#open-level-dialog")?.addEventListener("click", () => {
  if (state.levelPoints > 0) {
    state.levelNotice = null;
    renderLevel();
    persistCareer();
    document.querySelector("#level-dialog")?.showModal();
  }
});
document.querySelector("#level-dialog-close")?.addEventListener("click", () => document.querySelector("#level-dialog")?.close());
document.querySelector("#level-choices")?.addEventListener("click", event => {
  const choice = event.target.closest("[data-level-stat]");
  if (!choice || state.levelPoints < 1) return;
  const stat = choice.dataset.levelStat;
  if (!combatLabels[stat] || state.combatStats[stat] >= 99) return;
  state.levelPoints -= 1;
  applyCombatChanges({ [stat]: 1 });
  render();
  showToast(`+1 ${combatLabels[stat]}`);
});
document.querySelector("#plan-start-fight").addEventListener("click", startFight);
document.querySelector("#plan-withdraw-fight").addEventListener("click", withdrawFight);
document.querySelector("#summary-close").addEventListener("click", () => {
  document.querySelector("#summary-dialog").close();
  if (state.pendingWeekEvent) showBetweenWeekEvent();
  else continueAfterWeekTransition();
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
  if (tournament) return bookTournamentEvent(tournament.dataset.bookTournament, tournament.dataset.travel);
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

document.querySelector("#scheduled-fight").addEventListener("click", event => {
  if (event.target.closest("#start-fight")) startFight();
  if (event.target.closest("#withdraw-fight")) withdrawFight();
});

document.querySelector("#fight-choices").addEventListener("click", event => {
  const choice = event.target.closest("[data-fight-action]");
  if (choice) playRound(choice.dataset.fightAction);
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

document.querySelector("#membership-button").addEventListener("click", () => {
  if (state.gymWeeks > 0) return;
  if (state.money < GYM_PRICE) return showToast("Pas assez d'argent pour le GYM de boxe.");
  if (!window.confirm(`GYM de boxe\n\nCoût : ${GYM_PRICE} $\nDurée : 4 semaines\nInclut l'entraînement régulier et le sparring sans coût par séance.\n\nConfirmer ?`)) return;
  state.money -= GYM_PRICE;
  state.gymWeeks = 4;
  state.journal.unshift({ week: state.week, text: "Ton abonnement au GYM de boxe est actif pour quatre semaines." });
  render();
  showToast("Abonnement activé");
});

document.querySelector("#strength-membership-button").addEventListener("click", () => {
  if (state.strengthGymWeeks > 0) return;
  if (state.money < STRENGTH_GYM_PRICE) return showToast("Pas assez d'argent pour le gym de musculation.");
  if (!window.confirm(`Gym de musculation\n\nCoût : ${STRENGTH_GYM_PRICE} $\nDurée : 4 semaines\nDébloque les exercices, la boutique et les préparateurs physiques.\n\nConfirmer ?`)) return;
  state.money -= STRENGTH_GYM_PRICE;
  state.strengthGymWeeks = 4;
  state.journal.unshift({ week: state.week, text: "Ton abonnement au gym de musculation est actif pour quatre semaines." });
  render();
  showToast("Abonnement musculation activé");
});

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
    state = cloneData(INITIAL_STATE);
    weeklyPlan = [];
    fightState = null;
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
