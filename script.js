const CREATION_POINTS = 12;
const BASE_COMBAT_STAT = 40;
const GYM_PRICE = 110;
const PRIVATE_PRICE = 90;
const TOURNAMENT_PREP_WEEKS = 4;

const combatLabels = {
  technique: "Technique",
  power: "Puissance",
  cardio: "Cardio",
  defense: "Défense",
};

const styles = {
  technician: { label: "Technicien", bonus: { technique: 5 }, hint: "+5 technique" },
  puncher: { label: "Puncheur", bonus: { power: 5 }, hint: "+5 puissance" },
  counter: { label: "Contre-attaquant", bonus: { defense: 3, technique: 2 }, hint: "+3 défense et +2 technique" },
  balanced: { label: "Équilibré", bonus: { technique: 2, power: 2, cardio: 2, defense: 2 }, hint: "+2 à chaque statistique" },
};

const fightStrategies = {
  attack: { label: "Attaquer", short: "Pression", fatigue: 16, beats: "distance", detail: "Pression · puissance + technique", intent: "Il avance avec pression" },
  distance: { label: "Boxer à distance", short: "Distance", fatigue: 10, beats: "defense", detail: "Technique + cardio", intent: "Il cherche à boxer à distance" },
  defense: { label: "Jouer la défense", short: "Contre", fatigue: 7, beats: "attack", detail: "Contre · défense + technique", intent: "Il attend pour contrer" },
};

const opponents = [
  { id: "leclerc", name: "Thomas Leclerc", nickname: "BETON", style: "Technicien", record: "1 V · 1 D · 0 N", difficulty: 36, risk: "Accessible", dateLead: 3 },
  { id: "okafor", name: "Darnell Okafor", nickname: "Brick", style: "Puncheur", record: "2 V · 1 D · 0 N", difficulty: 40, risk: "Modéré", dateLead: 4 },
  { id: "martel", name: "Émile Martel", nickname: "Le Serein", style: "Contre-attaquant", record: "1 V · 2 D · 1 N", difficulty: 43, risk: "Relevé", dateLead: 5 },
  { id: "gagnon", name: "Olivier Gagnon", nickname: "Le Bûcheron", style: "Bagarreur", record: "3 V · 2 D · 0 N", difficulty: 44, risk: "Relevé", dateLead: 4 },
  { id: "nguyen", name: "Minh Nguyen", nickname: "Vif-Argent", style: "Boxeur mobile", record: "2 V · 0 D · 1 N", difficulty: 42, risk: "Modéré", dateLead: 5 },
  { id: "bouchard", name: "Samuel Bouchard", nickname: "Le Mur", style: "Défensif", record: "4 V · 3 D · 0 N", difficulty: 46, risk: "Relevé", dateLead: 5 },
  { id: "haddad", name: "Yanis Haddad", nickname: "Le Cobra", style: "Contre-attaquant", record: "3 V · 1 D · 1 N", difficulty: 45, risk: "Relevé", dateLead: 5 },
  { id: "wilson", name: "Jayden Wilson", nickname: "Quickstep", style: "Technicien", record: "2 V · 2 D · 0 N", difficulty: 41, risk: "Modéré", dateLead: 3 },
  { id: "caron", name: "Alexis Caron", nickname: "La Masse", style: "Puncheur", record: "5 V · 3 D · 0 N", difficulty: 48, risk: "Difficile", dateLead: 4 },
];

const tournamentDefs = [
  { id: "bronze", medal: "III", name: "Gants de bronze", description: "8 participants · 3 combats · occasion unique au 5e combat.", participants: 8, rounds: 3, baseDifficulty: 45 },
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
const tournamentStyles = ["Pression", "Boxeur mobile", "Contre-attaquant", "Puncheur", "Défensif", "Complet"];

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
  experience: 0,
  gymWeeks: 0,
  amateurRecord: { wins: 0, losses: 0, draws: 0 },
  professionalRecord: { wins: 0, losses: 0, draws: 0 },
  careerStatus: "amateur",
  scheduledFight: null,
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
  journal: [],
};

const generalStats = [
  { key: "money", label: "Argent", suffix: " $", max: 500, className: "money" },
  { key: "energy", label: "Énergie", suffix: "%" },
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
      { id: "observe", title: "Observer les rounds", detail: "Tu étudies les réactions sans prendre de coups.", effect: "+6 expérience · +1 technique · +1 défense · −3 énergie", changes: { experience: 6, energy: -3 }, combatChanges: { technique: 1, defense: 1 }, result: "L’observation attentive ajoute deux détails utiles à ton arsenal." },
      { id: "recover", title: "Rester au repos", detail: "Tu privilégies la prochaine semaine.", effect: "+10 énergie · −3 risque", changes: { energy: 10, injury: -3 }, result: "Tu refuses poliment et gardes du carburant pour ton propre programme." },
    ],
  },
  {
    id: "tactical-choice",
    title: "Une idée à travailler",
    lead: "En revoyant tes dernières séances, trois pistes de progression ressortent pour la semaine qui commence.",
    choices: [
      { id: "film", title: "Étudier les angles", detail: "Tu privilégies la lecture et le placement.", effect: "+2 technique · +2 défense · −5 énergie", changes: { energy: -5 }, combatChanges: { technique: 2, defense: 2 }, result: "Le travail d’angles rend tes décisions plus propres et ta garde plus intelligente." },
      { id: "power", title: "Chercher plus d’impact", detail: "Tu mets l’accent sur l’explosivité.", effect: "+3 puissance · −8 énergie · +3 risque", changes: { energy: -8, injury: 3 }, combatChanges: { power: 3 }, result: "La séance explosive ajoute du poids à tes frappes, avec un peu de tension musculaire." },
      { id: "visualize", title: "Faire de la visualisation", detail: "Tu travailles la confiance et le calme.", effect: "+8 moral · +3 énergie", changes: { morale: 8, energy: 3 }, result: "Quelques minutes de visualisation clarifient ton objectif pour la semaine." },
    ],
  },
];

const actions = [
  { id: "gym", category: "training", icon: "G", title: "Entraînement au gym", detail: "+10 forme · +2 cardio · +1 technique · −18 énergie · +3 risque", requiresGym: true, changes: { fitness: 10, energy: -18, injury: 3 }, combatChanges: { cardio: 2, technique: 1 }, message: "Une séance solide au gym améliore ta condition et affine ta technique." },
  { id: "private", category: "training", icon: "P", title: "Séance privée", detail: "90 $ · +6 à une statistique · −14 énergie · +3 moral", cost: PRIVATE_PRICE, private: true },
  { id: "sparring", category: "training", icon: "S", title: "Sparring", detail: "+12 expérience · +2 technique · +2 défense · −24 énergie · +12 risque", requiresGym: true, changes: { experience: 12, energy: -24, injury: 12, reputation: 2 }, combatChanges: { technique: 2, defense: 2 }, message: "Les rounds de sparring donnent de l'expérience et de vrais réflexes de combat." },
  { id: "roadwork", category: "training", icon: "C", title: "Course matinale", detail: "+7 forme · +2 cardio · −16 énergie · +2 risque", changes: { fitness: 7, energy: -16, injury: 2 }, combatChanges: { cardio: 2 }, message: "La course matinale bâtit un moteur plus solide pour les longs échanges." },
  { id: "heavybag", category: "training", icon: "B", title: "Travail au sac", detail: "+3 puissance · +1 technique · +3 forme · −17 énergie · +4 risque", requiresGym: true, changes: { fitness: 3, energy: -17, injury: 4 }, combatChanges: { power: 3, technique: 1 }, message: "Le travail au sac rend tes frappes plus lourdes et plus propres." },
  { id: "video", category: "training", icon: "V", title: "Étude vidéo", detail: "+7 expérience · +1 technique · +1 défense · −7 énergie · +1 moral", changes: { experience: 7, energy: -7, morale: 1 }, combatChanges: { technique: 1, defense: 1 }, message: "Une soirée d'étude révèle des habitudes que tu pourras exploiter en combat." },
  { id: "rest", category: "recovery", icon: "Z", title: "Repos", detail: "+30 énergie · −10 risque · +5 moral", changes: { energy: 30, injury: -10, morale: 5 }, message: "Une vraie journée de repos remet le corps d'aplomb." },
  { id: "eat", category: "recovery", icon: "+", title: "Bien manger", detail: "35 $ · +14 énergie · +6 forme · +2 moral", cost: 35, changes: { money: -35, energy: 14, fitness: 6, morale: 2 }, message: "Un bon repas nourrit la récupération autant que le moral." },
  { id: "physio", category: "recovery", icon: "T", title: "Physiothérapie", detail: "55 $ · −16 risque · +8 énergie · +2 forme", cost: 55, changes: { money: -55, injury: -16, energy: 8, fitness: 2 }, message: "Le traitement du physiothérapeute calme les douleurs avant qu'elles ne s'installent." },
  { id: "spa", category: "recovery", icon: "R", title: "Spa et récupération", detail: "65 $ · +38 énergie · −20 risque · +6 moral", cost: 65, changes: { money: -65, energy: 38, injury: -20, morale: 6 }, message: "Le protocole de récupération remet le corps et la tête en état." },
  { id: "work", category: "career", icon: "$", title: "Travailler", detail: "+70 $ · −22 énergie · −4 moral", changes: { money: 70, energy: -22, morale: -4 }, message: "Un quart de travail paie les factures, mais laisse les jambes lourdes." },
  { id: "promotion", category: "career", icon: "M", title: "Promotion locale", detail: "20 $ · +8 réputation · +3 moral · −10 énergie", cost: 20, changes: { money: -20, reputation: 8, morale: 3, energy: -10 }, message: "Quelques apparitions locales font circuler ton nom dans le quartier." },
  { id: "family", category: "career", icon: "F", title: "Temps avec les proches", detail: "+12 moral · +8 énergie", changes: { morale: 12, energy: 8 }, message: "Une soirée avec les proches remet la carrière en perspective." },
  { id: "sponsor", category: "career", icon: "$+", title: "Petite commandite", detail: "+95 $ · +2 réputation · −12 énergie · −2 moral", requiresReputation: 30, changes: { money: 95, reputation: 2, morale: -2, energy: -12 }, message: "Une entreprise locale finance une partie du camp en échange d'une apparition promotionnelle." },
];

let state = structuredClone(INITIAL_STATE);
let draftStats = { technique: 0, power: 0, cardio: 0, defense: 0 };
let weeklyPlan = [];
let toastTimer;
let fightState = null;

const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value));
const escapeHTML = value => String(value).replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);

function pointsLeft() {
  return CREATION_POINTS - Object.values(draftStats).reduce((sum, value) => sum + value, 0);
}

function styleBonus(styleKey, statKey) {
  return styles[styleKey]?.bonus[statKey] || 0;
}

function renderCreation() {
  const selectedStyle = document.querySelector("#fighter-style").value;
  const remaining = pointsLeft();
  document.querySelector("#points-left").textContent = remaining;
  document.querySelector("#style-bonus").textContent = `Bonus de style : ${styles[selectedStyle].hint}`;
  document.querySelector("#creation-stats").innerHTML = Object.keys(combatLabels).map(key => {
    const bonus = styleBonus(selectedStyle, key);
    const value = BASE_COMBAT_STAT + draftStats[key] + bonus;
    return `<div class="creation-stat">
      <div class="creation-stat-name"><strong>${combatLabels[key]}</strong><small>Base ${BASE_COMBAT_STAT}${bonus ? ` <span class="bonus-badge">+${bonus} style</span>` : ""}</small></div>
      <div class="stat-stepper">
        <button type="button" data-stat="${key}" data-change="-1" ${draftStats[key] === 0 ? "disabled" : ""} aria-label="Retirer un point en ${combatLabels[key]}">−</button>
        <output>${value}</output>
        <button type="button" data-stat="${key}" data-change="1" ${remaining === 0 ? "disabled" : ""} aria-label="Ajouter un point en ${combatLabels[key]}">+</button>
      </div>
    </div>`;
  }).join("");
}

function renderFighter() {
  const profile = state.profile;
  const nickname = profile.nickname ? ` « ${profile.nickname} »` : "";
  document.querySelector("#fighter-name").textContent = `${profile.firstName}${nickname} ${profile.lastName}`;
  const isProfessional = state.careerStatus === "professional";
  document.querySelector("#fighter-meta").textContent = `${profile.weightClass} · ${styles[profile.style].label} · ${isProfessional ? "Professionnel" : "Amateur"}`;
  document.querySelector("#fighter-initials").textContent = `${profile.firstName[0]}${profile.lastName[0]}`.toLocaleUpperCase("fr-CA");
  document.querySelector("#fighter-style-label").textContent = styles[profile.style].label;
  const record = state.amateurRecord;
  const amateurText = `${record.wins} V · ${record.losses} D · ${record.draws} N`;
  const pro = state.professionalRecord;
  document.querySelector("#career-records").innerHTML = isProfessional ? `Montréal, QC <span class="dot">•</span> Bilan pro : ${pro.wins} V · ${pro.losses} D · ${pro.draws} N <span class="dot">•</span> Bilan amateur final : ${amateurText}` : `Montréal, QC <span class="dot">•</span> Bilan amateur : <span id="amateur-record">${amateurText}</span>`;
  const medalTotals = Object.values(state.medals).reduce((totals, medals) => ({ bronze: totals.bronze + medals.bronze, silver: totals.silver + medals.silver, gold: totals.gold + medals.gold }), { bronze: 0, silver: 0, gold: 0 });
  const medalCount = medalTotals.bronze + medalTotals.silver + medalTotals.gold;
  document.querySelector("#career-medals").innerHTML = `<span>Médailles</span>${medalCount ? `<strong><i class="medal-dot bronze"></i>${medalTotals.bronze}<i class="medal-dot silver"></i>${medalTotals.silver}<i class="medal-dot gold"></i>${medalTotals.gold}</strong>` : "<em>Aucune pour l’instant</em>"}`;
  document.querySelector("#combat-stats").innerHTML = Object.entries(combatLabels).map(([key, label]) => `<div class="combat-stat"><span>${label}</span><strong>${state.combatStats[key]}</strong></div>`).join("");
}

function amateurFightCount() {
  const record = state.amateurRecord;
  return record.wins + record.losses + record.draws;
}

function weeklyActionLimit() {
  return amateurFightCount() >= 10 ? 4 : 3;
}

function weeklyOpponentOffers() {
  const start = ((state.week - 1) * 2) % opponents.length;
  return [start, (start + 1) % opponents.length, (start + 4) % opponents.length].map(index => opponents[index]);
}

function offeredFightWeek(opponent) {
  return Math.max(4, state.week + opponent.dateLead);
}

function scheduledOpponent() {
  if (!state.scheduledFight) return null;
  return state.scheduledFight.opponent || opponents.find(item => item.id === state.scheduledFight.id) || null;
}

function tournamentAvailability(id) {
  const count = amateurFightCount();
  const status = state.tournaments[id];
  if (state.activeTournament?.id === id) return { available: false, label: state.week < state.activeTournament.startWeek ? "Préparation en cours" : "Tournoi en cours" };
  if (state.activeTournament) return { available: false, label: "Un autre tournoi est en cours" };
  if (id === "bronze") {
    if (status !== "pending") return { available: false, terminal: true, label: status === "won" ? "Remporté" : status === "lost" ? "Participation terminée" : "Occasion manquée" };
    if (count === 5) return { available: true, label: "Inscription ouverte" };
    return { available: false, label: count < 5 ? `Encore ${5 - count} combat${5 - count > 1 ? "s" : ""}` : "Occasion manquée" };
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
  return Array.from({ length: tournament.rounds }, (_, round) => {
    const identity = tournamentNames[(seed + round * 3) % tournamentNames.length];
    const wins = Math.max(3, Math.round((tournament.baseDifficulty - 30) / 3) + round * 3);
    const losses = Math.max(1, 5 - round);
    return {
      id: `${tournament.id}-round-${round + 1}-${seed}`,
      name: `${identity[0]} ${identity[1]}`,
      nickname: identity[2],
      weightClass: state.profile.weightClass,
      style: tournamentStyles[(seed + round) % tournamentStyles.length],
      record: `${wins} V · ${losses} D · ${round % 2} N`,
      difficulty: tournament.baseDifficulty + round * 4,
      risk: round === tournament.rounds - 1 ? "Finale" : round >= tournament.rounds - 2 ? "Très élevé" : "Relevé",
    };
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

function completeTournament(medal = null) {
  const active = state.activeTournament;
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
  active.summary = `${tournament.name} terminés : ${medalLabel}.`;
  state.journal.unshift({ week: state.week, text: active.summary });
  return active.summary;
}

function resolveTournamentRound(fight, result) {
  const active = state.activeTournament;
  if (!fight.tournamentId || !active || active.id !== fight.tournamentId) return "";
  const tournament = tournamentDefs.find(item => item.id === active.id);
  const roundIndex = active.currentRound;
  active.results.push({ round: roundIndex, opponent: fight.opponent.name, result, score: `${fight.playerPoints}–${fight.opponentPoints}${fight.tiebreak ? " · départage" : ""}` });
  if (result !== "Victoire") return completeTournament(tournamentMedalForLoss(tournament, roundIndex));
  active.currentRound += 1;
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
  const toggle = section.querySelector(":scope > .mobile-section-toggle");
  toggle?.setAttribute("aria-expanded", "true");
  const stateLabel = toggle?.querySelector(".toggle-state");
  if (stateLabel) stateLabel.textContent = "Masquer";
}

function renderFights() {
  const scheduled = document.querySelector("#scheduled-fight");
  const opponentsContainer = document.querySelector("#opponents");
  const tournamentsContainer = document.querySelector("#tournaments");
  const activeTournamentContainer = document.querySelector("#active-tournament");
  const proTransition = document.querySelector("#pro-transition");
  const localToggleLabel = document.querySelector(".fights-panel:not(.tournaments-panel) .mobile-section-toggle > span:first-child");
  const tournamentToggleLabel = document.querySelector(".tournaments-panel .mobile-section-toggle > span:first-child");
  const fightCount = amateurFightCount();
  localToggleLabel.textContent = "Combats locaux";
  tournamentToggleLabel.textContent = "Tournois";
  document.querySelector("#amateur-fight-count").textContent = `${fightCount} combat${fightCount > 1 ? "s" : ""} disputé${fightCount > 1 ? "s" : ""}`;

  if (state.careerStatus === "professional") {
    scheduled.innerHTML = "";
    opponentsContainer.innerHTML = '<div class="amateur-closed"><strong>Circuit amateur fermé</strong><p>La carrière professionnelle a commencé. Le bilan amateur est désormais définitif.</p></div>';
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
    if (!state.scheduledFight.tournamentId) localToggleLabel.textContent = isFightWeek ? "Combat local · maintenant" : `Combat local · semaine ${state.scheduledFight.week}`;
    scheduled.innerHTML = `<div class="fight-notice"><div><p class="eyebrow">Prochain combat programmé · ${eventName}</p><strong>${opponent.name} « ${opponent.nickname} »</strong><p>${isFightWeek ? "Le combat est arrivé : choisis ton entrée ou ton désistement pour continuer." : `Prévu pour la semaine ${state.scheduledFight.week}. Continue ta préparation.`}</p></div>${isFightWeek ? `<div class="fight-notice-actions"><button id="withdraw-fight" class="secondary-button withdraw-button" type="button">${withdrawLabel}</button><button id="start-fight" class="primary-button" type="button">Entrer dans le ring</button></div>` : ""}</div>`;
  } else {
    scheduled.innerHTML = "";
  }
  opponentsContainer.innerHTML = weeklyOpponentOffers().map(opponent => {
    const offeredWeek = offeredFightWeek(opponent);
    const clashesWithTournament = Boolean(state.activeTournament && offeredWeek >= state.activeTournament.startWeek);
    const unavailable = state.scheduledFight || clashesWithTournament;
    const status = state.scheduledFight ? "Un combat est déjà programmé" : clashesWithTournament ? "Date incompatible avec le tournoi" : "";
    return `<article class="opponent-card"><p class="eyebrow">Proposé : semaine ${offeredWeek}</p><h3>${opponent.name} « ${opponent.nickname} »</h3><p>${state.profile.weightClass} · ${opponent.style}</p><p>Bilan amateur : ${opponent.record}</p><div class="opponent-meta"><span>Risque : ${opponent.risk}</span><span>Difficulté ${opponent.difficulty}</span></div><button class="secondary-button" type="button" data-accept="${opponent.id}" ${unavailable ? "disabled" : ""}>${status || "Accepter le combat"}</button></article>`;
  }).join("");

  if (fightCount > 5 && state.tournaments.bronze === "pending") state.tournaments.bronze = "missed";
  if (fightCount > 10 && state.tournaments.silver === "pending") state.tournaments.silver = "missed";
  if (state.activeTournament) {
    const active = state.activeTournament;
    const tournament = tournamentDefs.find(item => item.id === active.id);
    const remaining = Math.max(0, active.startWeek - state.week);
    const progress = Math.round(((TOURNAMENT_PREP_WEEKS - remaining) / TOURNAMENT_PREP_WEEKS) * 100);
    tournamentToggleLabel.textContent = active.status === "completed" ? "Tournoi · parcours terminé" : remaining > 0 ? `Tournoi · dans ${remaining} sem.` : "Tournoi · maintenant";
    activeTournamentContainer.innerHTML = active.status === "completed" ? `<div class="tournament-countdown ready"><div><p class="eyebrow">Parcours terminé</p><strong>${active.summary}</strong></div><button class="secondary-button" type="button" data-open-tournament>Voir le tableau final</button></div>` : remaining > 0 ? `<div class="tournament-countdown"><div><p class="eyebrow">Inscription confirmée · ${tournament.name}</p><strong>Début dans ${remaining} semaine${remaining > 1 ? "s" : ""}</strong><p>Semaine ${active.startWeek} · ${tournament.participants} participants · ${tournament.rounds} combats à gagner</p><div class="countdown-meter"><span style="width:${progress}%"></span></div></div><button class="secondary-button" type="button" data-open-tournament>Voir le tableau</button></div>` : `<div class="tournament-countdown ready"><div><p class="eyebrow">Le tournoi commence</p><strong>${tournament.name}</strong><p>${tournament.participants} participants · prochain tour : ${roundName(tournament.rounds, active.currentRound)}</p></div><button class="primary-button" type="button" data-open-tournament>Ouvrir le tableau</button></div>`;
  } else {
    activeTournamentContainer.innerHTML = "";
  }
  tournamentsContainer.innerHTML = tournamentDefs.map(tournament => {
    const availability = tournamentAvailability(tournament.id);
    const blockedByFight = Boolean(state.scheduledFight || state.activeTournament);
    const cardClass = availability.terminal ? "completed" : availability.available ? "available" : "locked";
    const buttonText = blockedByFight && availability.available ? "Combat déjà programmé" : availability.available ? (tournament.id === "olympic" ? "Rejoindre le parcours" : "S’inscrire") : availability.label;
    const medals = state.medals[tournament.id];
    const medalSummary = medals.bronze + medals.silver + medals.gold ? `<div class="tournament-medals"><span class="medal-dot bronze"></span>${medals.bronze}<span class="medal-dot silver"></span>${medals.silver}<span class="medal-dot gold"></span>${medals.gold}</div>` : "";
    return `<article class="tournament-card ${cardClass}"><span class="tournament-medal">${tournament.medal}</span><h4>${tournament.name}</h4><p>${tournament.description}</p>${medalSummary}<p class="tournament-state">${availability.label}</p><button class="secondary-button" type="button" data-tournament="${tournament.id}" ${!availability.available || blockedByFight ? "disabled" : ""}>${buttonText}</button></article>`;
  }).join("");

  const pro = professionalEligibility();
  const blocked = Boolean(state.scheduledFight || state.activeTournament);
  proTransition.innerHTML = `<div><strong>Passer professionnel</strong><p>${pro.reason}${blocked && pro.eligible ? " · Termine ou annule d’abord le combat programmé." : ""}</p></div><button id="turn-pro" class="primary-button" type="button" ${!pro.eligible || blocked ? "disabled" : ""}>Passer professionnel</button>`;
  if (state.scheduledFight && state.week >= state.scheduledFight.week && !state.scheduledFight.tournamentId) expandMobileSection(".fights-panel:not(.tournaments-panel)");
  if (state.activeTournament && state.week >= state.activeTournament.startWeek) expandMobileSection(".tournaments-panel");
}

function projectedMoney() {
  return state.money + weeklyPlan.reduce((total, item) => {
    const action = actions.find(candidate => candidate.id === item.actionId);
    return total + (action?.changes?.money || (action?.private ? -PRIVATE_PRICE : 0));
  }, 0);
}

function actionRequirementLock(action) {
  if (action.future) return "Bientôt disponible";
  if (action.requiresGym && state.gymWeeks === 0) return "Abonnement au gym requis";
  if (action.requiresReputation && state.reputation < action.requiresReputation) return `Réputation ${action.requiresReputation} requise`;
  return "";
}

function actionLock(action) {
  const requirement = actionRequirementLock(action);
  if (requirement) return requirement;
  if (weeklyPlan.length >= weeklyActionLimit()) return "Plan complet — retire une action";
  if (action.cost && projectedMoney() < action.cost) return `Il manque ${action.cost - projectedMoney()} $ au budget prévu`;
  return "";
}

function recommendedActionIds() {
  const recommendations = [];
  const add = id => {
    if (!recommendations.includes(id)) recommendations.push(id);
  };
  const fightDistance = state.scheduledFight ? state.scheduledFight.week - state.week : Infinity;
  const weakestStat = Object.entries(state.combatStats).sort(([, first], [, second]) => first - second)[0]?.[0];

  if (state.energy <= 45) add("rest");
  if (state.injury >= 30) add(state.money >= 55 ? "physio" : "rest");
  if (state.money < GYM_PRICE) add("work");
  if (fightDistance <= 2) add("video");
  if (recommendations.length < 2 && state.energy > 35) {
    if (weakestStat === "power") add(state.gymWeeks > 0 ? "heavybag" : state.money >= PRIVATE_PRICE ? "private" : "roadwork");
    else if (weakestStat === "cardio") add("roadwork");
    else add("video");
  }
  [state.gymWeeks > 0 ? "gym" : "roadwork", "video", "family"].forEach(id => {
    if (recommendations.length < 2) add(id);
  });
  return new Set(recommendations.slice(0, 2));
}

function renderActions() {
  const recommended = recommendedActionIds();
  document.querySelector("#action-grid").innerHTML = actionCategories.map((category, index) => {
    const categoryActions = actions.filter(action => action.category === category.id).map((action, originalIndex) => ({
      action,
      originalIndex,
      priority: recommended.has(action.id) ? 0 : actionRequirementLock(action) ? 2 : 1,
    })).sort((first, second) => first.priority - second.priority || first.originalIndex - second.originalIndex);
    const cards = categoryActions.map(({ action }) => {
      const selected = weeklyPlan.some(item => item.actionId === action.id);
      const lock = selected ? "" : actionLock(action);
      const isRecommended = recommended.has(action.id) && !action.future;
      return `<button class="action-card${action.future ? " future" : ""}${selected ? " selected" : ""}${isRecommended ? " recommended" : ""}" type="button" data-action="${action.id}" ${lock ? "disabled" : ""} aria-pressed="${selected}">
        <span class="action-icon" aria-hidden="true">${action.icon}</span><h3>${action.title}</h3><p>${action.detail}</p>
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
  if (state.gymWeeks > 0) {
    const expiring = state.gymWeeks === 1;
    status.className = `membership-status active${expiring ? " warning" : ""}`;
    status.innerHTML = `<strong>${expiring ? "Renouvellement bientôt nécessaire" : "Abonnement actif"}</strong>${state.gymWeeks} semaine${state.gymWeeks > 1 ? "s" : ""} restante${state.gymWeeks > 1 ? "s" : ""}`;
    button.textContent = expiring ? "Dernière semaine d’accès" : "Accès inclus";
    button.disabled = true;
  } else {
    status.className = "membership-status";
    status.innerHTML = "<strong>Abonnement expiré</strong>Gym et sparring verrouillés";
    button.disabled = state.money < GYM_PRICE;
    button.textContent = button.disabled ? `Il manque ${GYM_PRICE - state.money} $ pour s’abonner` : `S’abonner · ${GYM_PRICE} $ / 4 semaines`;
    button.title = button.disabled ? `Il manque ${GYM_PRICE - state.money} $` : "";
  }
}

function planItemEffects(item) {
  const action = actions.find(candidate => candidate.id === item.actionId);
  return {
    action,
    general: action.private ? { money: -PRIVATE_PRICE, energy: -14, morale: 3 } : (action.changes || {}),
    combat: action.private ? { [item.target]: 6 } : (action.combatChanges || {}),
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
    const finalValue = key === "money" ? Math.max(0, state[key] + value) : clamp(state[key] + value);
    return [key, finalValue - state[key]];
  }));
  const combat = Object.fromEntries(Object.entries(rawCombat).map(([key, value]) => [key, clamp(state.combatStats[key] + value, 0, 99) - state.combatStats[key]]));
  return { general, combat, rawGeneral, rawCombat, earned, spent };
}

function signed(value, suffix = "") {
  return `${value > 0 ? "+" : ""}${value}${suffix}`;
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
      const target = item.target ? ` · Cible : ${combatLabels[item.target]}` : "";
      return `<div class="plan-row"><span class="plan-order">${index + 1}</span><div class="plan-row-copy"><strong>${action.title}</strong><small>${action.detail}${target}</small></div><div class="plan-row-actions">${item.target ? `<button class="plan-remove" type="button" data-edit="${action.id}">Modifier</button>` : ""}<button class="plan-remove" type="button" data-remove="${action.id}">Retirer</button></div></div>`;
    }).join("");
    const emptyRows = Array.from({ length: actionLimit - weeklyPlan.length }, (_, index) => `<div class="plan-slot"><span>${weeklyPlan.length + index + 1}</span><em>Libre</em></div>`).join("");
    content.innerHTML = `<div class="plan-list">${plannedRows}${emptyRows}</div><div class="plan-totals"><div class="plan-total-block"><span>Argent à la fin</span><strong class="${projectedMoney() >= state.money ? "positive" : "negative"}">${projectedMoney()} $</strong></div><div class="plan-total-block"><span>Gains / dépenses</span><strong><span class="positive">+${totals.earned} $</span> · <span class="negative">−${totals.spent} $</span></strong></div><div class="plan-total-block"><span>Effets prévus</span><div class="plan-effects">${effectParts.join(" · ") || "Aucun changement de jauge"}</div></div></div>`;
  }
  const tournamentDue = Boolean(state.activeTournament && state.activeTournament.status !== "completed" && state.week >= state.activeTournament.startWeek);
  const localFightDue = Boolean(state.scheduledFight && !state.scheduledFight.tournamentId && state.week >= state.scheduledFight.week);
  const fightDue = Boolean(localFightDue || tournamentDue || (state.scheduledFight && state.week >= state.scheduledFight.week));
  const valid = weeklyPlan.length > 0 && projectedMoney() >= 0 && !fightDue;
  const advance = document.querySelector("#advance-week");
  const fightActions = document.querySelector("#plan-fight-actions");
  advance.disabled = !valid;
  advance.hidden = localFightDue;
  fightActions.hidden = !localFightDue;
  document.querySelector("#plan-help").textContent = tournamentDue ? "Le tournoi a commencé : ouvre le tableau pour disputer le prochain combat." : localFightDue ? "Le combat est arrivé : choisis ton entrée dans le ring ou ton désistement." : !weeklyPlan.length ? "Sélectionne au moins une action pour continuer." : projectedMoney() < 0 ? "Le plan dépasse ton budget. Retire une dépense ou ajoute du travail." : "Rien ne sera appliqué avant ta confirmation.";
}

function render() {
  const hasFighter = Boolean(state.profile);
  document.querySelector("#creation-screen").classList.toggle("hidden", hasFighter);
  document.querySelector("#game").classList.toggle("hidden", !hasFighter);
  if (!hasFighter) return;

  renderFighter();
  document.querySelector("#money-spotlight").textContent = `${state.money} $`;
  document.querySelector("#week").textContent = String(state.week).padStart(2, "0");
  const topEnergy = document.querySelector("#top-energy");
  topEnergy.textContent = `E:${state.energy}%`;
  topEnergy.setAttribute("aria-label", `Énergie ${state.energy} %`);
  const actionLimit = weeklyActionLimit();
  document.querySelector("#action-limit-help").textContent = actionLimit === 4 ? "Expérience acquise : compose maintenant un programme de quatre actions." : `Trois actions par semaine · la quatrième se débloque après ${10 - amateurFightCount()} combat${10 - amateurFightCount() > 1 ? "s" : ""}.`;
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

  document.querySelector("#journal").innerHTML = state.journal.slice(0, 8).map(entry => `<li><span class="journal-week">Semaine ${entry.week}</span>${escapeHTML(entry.text)}</li>`).join("");
  renderMembership();
  renderFights();
  renderActions();
  renderPlan();
}

function applyChanges(changes = {}) {
  Object.entries(changes).forEach(([key, change]) => {
    state[key] = key === "money" ? Math.max(0, state[key] + change) : clamp(state[key] + change);
  });
}

function applyCombatChanges(changes = {}) {
  Object.entries(changes).forEach(([key, change]) => {
    state.combatStats[key] = clamp(state.combatStats[key] + change, 0, 99);
  });
}

function toggleAction(action) {
  const existing = weeklyPlan.findIndex(item => item.actionId === action.id);
  if (existing >= 0) {
    weeklyPlan.splice(existing, 1);
    render();
    return;
  }
  const lock = actionLock(action);
  if (lock) return showToast(lock);
  if (action.private) return document.querySelector("#private-dialog").showModal();
  weeklyPlan.push({ actionId: action.id });
  render();
}

function planPrivateSession() {
  const key = document.querySelector("#private-stat").value;
  const existing = weeklyPlan.find(item => item.actionId === "private");
  if (!existing && projectedMoney() < PRIVATE_PRICE) return showToast("Pas assez d'argent prévu pour cette séance.");
  if (existing) existing.target = key;
  else weeklyPlan.push({ actionId: "private", target: key });
  document.querySelector("#private-dialog").close();
  render();
  showToast("Séance privée ajoutée au plan");
}

function endWeek(events) {
  const endingWeek = state.week;
  state.week += 1;
  state.pendingWeekEvent = betweenWeekEvents[(state.week - 2) % betweenWeekEvents.length].id;
  state.energy = clamp(state.energy + 8);
  state.morale = clamp(state.morale - 2);
  const membershipWasActive = state.gymWeeks > 0;
  if (membershipWasActive) state.gymWeeks -= 1;

  let summary = "La récupération naturelle te rend un peu d'énergie.";
  if (state.injury >= 45 && Math.random() < state.injury / 140) {
    state.fitness = clamp(state.fitness - 8);
    state.morale = clamp(state.morale - 7);
    summary = "Une douleur persistante te force à ralentir : ta forme et ton moral en souffrent.";
    events.push(summary);
  } else if (state.energy < 20) {
    state.injury = clamp(state.injury + 6);
    summary = "La fatigue accumulée augmente ton risque de blessure. Il faudrait lever le pied.";
    events.push(summary);
  } else {
    state.injury = clamp(state.injury - 2);
  }
  state.journal.unshift({ week: endingWeek, text: `Bilan : ${summary}` });
  if (membershipWasActive && state.gymWeeks === 0) {
    const expiry = "Ton abonnement au gym est expiré. Renouvelle-le pour reprendre l'entraînement et le sparring.";
    events.push(expiry);
    state.journal.unshift({ week: endingWeek, text: expiry });
  }
}

function executePlan() {
  if (!weeklyPlan.length || projectedMoney() < 0) return;
  const endingWeek = state.week;
  const before = { ...Object.fromEntries(generalStats.map(stat => [stat.key, state[stat.key]])), experience: state.experience, combatStats: { ...state.combatStats } };
  const totals = planEffects();
  const events = [];
  weeklyPlan.forEach(item => {
    const { action } = planItemEffects(item);
    if (action.private) {
      state.journal.unshift({ week: endingWeek, text: `La séance privée fait progresser ta ${combatLabels[item.target].toLowerCase()}.` });
    } else {
      state.journal.unshift({ week: endingWeek, text: action.message });
    }
  });
  applyChanges(totals.rawGeneral);
  applyCombatChanges(totals.rawCombat);
  endWeek(events);
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
  applyChanges(choice.changes);
  applyCombatChanges(choice.combatChanges);
  state.journal.unshift({ week: state.week, text: `Entre les semaines : ${choice.result}` });
  state.pendingWeekEvent = null;
  document.querySelector("#week-event-dialog").close();
  render();
  showToast("Décision appliquée à la nouvelle semaine");
  continueAfterWeekTransition();
}

function startFight() {
  const opponent = scheduledOpponent();
  if (!opponent) return;
  fightState = {
    opponent,
    tournamentId: state.scheduledFight.tournamentId || null,
    round: 1,
    phase: "choice",
    playerPoints: 0,
    opponentPoints: 0,
    playerEnergy: state.energy,
    opponentEnergy: 88 + Math.floor(Math.random() * 8),
    lastPlayerStrategy: null,
    opponentStrategy: null,
    cornerBoostAvailable: true,
    rounds: [],
  };
  fightState.opponentStrategy = chooseOpponentStrategy(fightState);
  document.querySelector("#fight-dialog").showModal();
  renderFight();
}

function withdrawFight() {
  const opponent = scheduledOpponent();
  if (!opponent) return;
  if (!window.confirm(`Se désister du combat contre ${opponent.name} ?\n\nLe combat sera annulé et tu pourras poursuivre la carrière.`)) return;
  state.journal.unshift({ week: state.week, text: `Tu te désistes du combat amateur contre ${opponent.name}. Le rendez-vous est annulé.` });
  const tournamentId = state.scheduledFight.tournamentId;
  if (tournamentId && state.activeTournament) completeTournament(null);
  state.scheduledFight = null;
  render();
  showToast("Combat annulé");
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
  const remaining = Math.max(0, active.startWeek - state.week);
  if (remaining === 0 && active.status === "preparing") active.status = "active";
  document.querySelector("#tournament-board-title").textContent = tournament.name;
  document.querySelector("#tournament-board-status").innerHTML = active.status === "completed" ? `<strong>${active.summary}</strong><span>${tournament.participants} participants · parcours terminé</span>` : remaining > 0 ? `<strong>Début dans ${remaining} semaine${remaining > 1 ? "s" : ""}</strong><span>Semaine ${active.startWeek} · profite de la préparation</span>` : `<strong>${roundName(tournament.rounds, active.currentRound)}</strong><span>${active.currentRound} victoire${active.currentRound > 1 ? "s" : ""} · ${tournament.rounds - active.currentRound} combat${tournament.rounds - active.currentRound > 1 ? "s" : ""} restant${tournament.rounds - active.currentRound > 1 ? "s" : ""}</span>`;
  const bracket = document.querySelector("#tournament-bracket");
  bracket.className = `tournament-bracket rounds-${tournament.rounds}`;
  bracket.innerHTML = active.opponents.map((opponent, index) => {
    const result = active.results.find(item => item.round === index);
    const isCurrent = active.status !== "completed" && remaining === 0 && index === active.currentRound;
    const stateClass = result ? (result.result === "Victoire" ? "won" : "lost") : isCurrent ? "current" : "upcoming";
    const resultText = result ? `${result.result} · ${result.score}` : isCurrent ? "Prochain combat" : "À venir";
    return `<div class="bracket-round ${stateClass}"><span class="bracket-step">${roundName(tournament.rounds, index)}</span><strong>${opponent.name} « ${opponent.nickname} »</strong><small>${opponent.style} · ${opponent.record} · difficulté ${opponent.difficulty}</small><em>${resultText}</em></div>`;
  }).join("");
  const button = document.querySelector("#tournament-next-fight");
  button.hidden = active.status === "completed";
  button.disabled = remaining > 0 || Boolean(state.scheduledFight);
  button.textContent = remaining > 0 ? `Début dans ${remaining} semaine${remaining > 1 ? "s" : ""}` : `Disputer ${roundName(tournament.rounds, active.currentRound).toLowerCase()}`;
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
    state.activeTournament = null;
    render();
  }
}

function startTournamentRound() {
  const active = state.activeTournament;
  if (!active || active.status === "completed" || state.week < active.startWeek || state.scheduledFight) return;
  active.status = "active";
  const opponent = active.opponents[active.currentRound];
  state.scheduledFight = { id: opponent.id, opponent, tournamentId: active.id, tournamentRound: active.currentRound, week: state.week };
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
  if (fight.round > 1 && fight.lastPlayerStrategy && Math.random() < .25 + fight.opponent.difficulty / 250) return strategyThatBeats(fight.lastPlayerStrategy);
  if (fight.opponentEnergy < 24 && Math.random() < .65) return "defense";
  if (Math.random() < .62) return opponentStylePreference(fight.opponent.style);
  return ["attack", "distance", "defense"][Math.floor(Math.random() * 3)];
}

function tacticalEdge(playerStrategy, opponentStrategy) {
  if (fightStrategies[playerStrategy].beats === opponentStrategy) return 7;
  if (fightStrategies[opponentStrategy].beats === playerStrategy) return -7;
  return 0;
}

function strategyData(strategy) {
  const definition = fightStrategies[strategy];
  const player = {
    attack: state.combatStats.power * .46 + state.combatStats.technique * .26 + state.fitness * .18,
    distance: state.combatStats.technique * .44 + state.combatStats.cardio * .3 + state.combatStats.defense * .12,
    defense: state.combatStats.defense * .44 + state.combatStats.technique * .22 + state.combatStats.cardio * .2,
  }[strategy];
  return { ...definition, player };
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
    const edge = tacticalEdge(key, fight.opponentStrategy);
    const matchup = edge > 0 ? "Avantage tactique" : edge < 0 ? "Risque d’être contré" : "Duel neutre";
    const stateClass = edge > 0 ? " tactical-advantage" : edge < 0 ? " tactical-danger" : "";
    return `<button class="${stateClass.trim()}" type="button" data-strategy="${key}"><strong>${strategy.label}</strong><span>${strategy.detail} · −${strategy.fatigue} E</span><em>${matchup}</em></button>`;
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
  const tournamentName = fight.tournamentId ? tournamentDefs.find(item => item.id === fight.tournamentId).name : "Combat amateur";
  document.querySelector("#fight-week-label").textContent = `${tournamentName} · Semaine ${state.week}`;
  document.querySelector("#fight-round").textContent = fight.phase === "finished" ? "Fin · 3 rounds" : `Round ${fight.round} / 3`;
  document.querySelector("#fight-player-name").textContent = state.profile.firstName;
  document.querySelector("#fight-player-meta").textContent = `${state.profile.nickname ? `« ${state.profile.nickname} » · ` : ""}${state.profile.weightClass} · Coin bleu`;
  document.querySelector("#fight-opponent-name").textContent = fight.opponent.name;
  document.querySelector("#fight-opponent-meta").textContent = `« ${fight.opponent.nickname} » · ${fight.opponent.weightClass || state.profile.weightClass} · Coin rouge`;
  document.querySelector("#fight-player-energy").textContent = `${Math.max(0, fight.playerEnergy)}%`;
  document.querySelector("#fight-opponent-energy").textContent = `${Math.max(0, fight.opponentEnergy)}%`;
  document.querySelector("#fight-player-energy-bar").style.width = `${Math.max(0, fight.playerEnergy)}%`;
  document.querySelector("#fight-opponent-energy-bar").style.width = `${Math.max(0, fight.opponentEnergy)}%`;
  document.querySelector("#fight-score").textContent = `${fight.playerPoints} — ${fight.opponentPoints}`;
  document.querySelector("#fight-status").textContent = fight.phase === "report" ? `Round ${fight.round} terminé` : message;
  document.querySelector("#fight-opponent-tell").textContent = fightStrategies[fight.opponentStrategy]?.intent || "Il change de rythme";
  document.querySelector("#fight-tactical-hint").textContent = `${fight.opponent.style} · difficulté ${fight.opponent.difficulty}`;
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
  document.querySelector("#fight-instruction").innerHTML = `<p>${message}</p>`;
  renderFightChoices();
}

function playRound(strategy) {
  const fight = fightState;
  if (!fight || fight.phase !== "choice" || fight.round > 3 || !fightStrategies[strategy]) return;
  const choice = strategyData(strategy);
  const opponentChoice = fightStrategies[fight.opponentStrategy];
  const matchup = tacticalEdge(strategy, fight.opponentStrategy);
  const repeatPenalty = fight.lastPlayerStrategy === strategy ? -3 : 0;
  const experienceBonus = Math.min(5, state.experience / 20);
  const moraleBonus = (state.morale - 50) * .06;
  const opponentStrategyBonus = fight.opponentStrategy === "attack" ? 4 : fight.opponentStrategy === "distance" ? 1 : -1;
  const playerBase = choice.player + fight.playerEnergy * .32 + state.fitness * .22 - state.injury * .16 + matchup + repeatPenalty + experienceBonus + moraleBonus;
  const opponentBase = fight.opponent.difficulty * 1.05 + fight.opponentEnergy * .28 + state.injury * .08 + opponentStrategyBonus;
  const edge = playerBase - opponentBase + (Math.random() * 10 - 5);
  let playerRound;
  let opponentRound;
  if (edge >= 11) [playerRound, opponentRound] = [10, 8];
  else if (edge >= 0) [playerRound, opponentRound] = [10, 9];
  else if (edge <= -11) [playerRound, opponentRound] = [8, 10];
  else [playerRound, opponentRound] = [9, 10];
  const playerEnergyBefore = fight.playerEnergy;
  const opponentEnergyBefore = fight.opponentEnergy;
  fight.playerPoints += playerRound;
  fight.opponentPoints += opponentRound;
  fight.playerEnergy = clamp(fight.playerEnergy - choice.fatigue - Math.floor(Math.random() * 3));
  fight.opponentEnergy = clamp(fight.opponentEnergy - opponentChoice.fatigue - Math.floor(Math.random() * 3));
  const tacticalNote = matchup > 0 ? "Ta lecture tactique est juste" : matchup < 0 ? "Son plan contre le tien" : "Les tactiques se neutralisent";
  const verdict = playerRound > opponentRound ? "Tu prends le round" : "Il prend le round";
  const feedback = `${fightStrategies[fight.opponentStrategy].intent}. ${tacticalNote}${repeatPenalty ? ", mais tu deviens prévisible" : ""}. ${verdict} ${playerRound}–${opponentRound}. Énergie ${playerEnergyBefore} → ${fight.playerEnergy}.`;
  fight.rounds.push({ number: fight.round, playerStrategy: strategy, opponentStrategy: fight.opponentStrategy, playerRound, opponentRound, playerEnergyBefore, playerEnergyAfter: fight.playerEnergy, opponentEnergyBefore, opponentEnergyAfter: fight.opponentEnergy, feedback });
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
  fight.opponentStrategy = chooseOpponentStrategy(fight);
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
  if (margin > 0) { result = "Victoire"; state.amateurRecord.wins += 1; applyChanges({ reputation: 7, experience: 18, morale: 9, injury: 4 }); }
  else if (margin < 0) { result = "Défaite"; state.amateurRecord.losses += 1; applyChanges({ reputation: 2, experience: 12, morale: -5, injury: 7 }); }
  else { result = "Match nul"; state.amateurRecord.draws += 1; applyChanges({ reputation: 4, experience: 15, morale: 2, injury: 5 }); }
  const unlockedFourthAction = fightCountBefore < 10 && amateurFightCount() >= 10;
  const tournamentNote = resolveTournamentRound(fight, result);
  state.energy = clamp(fight.playerEnergy);
  if (fight.tournamentId && result === "Victoire" && state.activeTournament?.status !== "completed") state.energy = clamp(state.energy + 18);
  const injuryEvent = state.injury >= 55 && Math.random() < .35 ? " Une douleur au retour au vestiaire augmente la prudence nécessaire." : "";
  if (injuryEvent) state.injury = clamp(state.injury + 7);
  state.journal.unshift({ week: state.week, text: `Combat amateur : ${result} contre ${fight.opponent.name}, ${fight.playerPoints}–${fight.opponentPoints}.${fight.tiebreak ? ` ${fight.tiebreak}` : ""}${tournamentNote ? ` ${tournamentNote}` : ""}${injuryEvent}` });
  if (unlockedFourthAction) state.journal.unshift({ week: state.week, text: "Dix combats amateurs disputés : le programme hebdomadaire passe définitivement à quatre actions." });
  const roundSummary = fight.rounds.map(round => `R${round.number} ${fightStrategies[round.playerStrategy].short}/${fightStrategies[round.opponentStrategy].short} ${round.playerRound}–${round.opponentRound}`).join(" · ");
  const tiebreakNote = fight.tiebreak ? `<br>${fight.tiebreak}` : "";
  const unlockNote = unlockedFourthAction ? "<br><strong>Progression débloquée :</strong> tu peux maintenant planifier quatre actions par semaine." : "";
  fight.phase = "finished";
  fight.result = result;
  // Rafraîchir le tableau après le calcul du troisième round afin que son score soit visible.
  renderFight(`${result} après 3 rounds`);
  document.querySelector("#fight-instruction").innerHTML = `<p><strong>${result} — ${fight.playerPoints} à ${fight.opponentPoints}</strong><br><span class="fight-round-summary">${roundSummary}</span>${tiebreakNote}<br>${tournamentNote ? `${tournamentNote}<br>` : ""}Expérience, réputation et état physique ont été mis à jour.${injuryEvent}${unlockNote}</p>`;
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
  state = structuredClone(INITIAL_STATE);
  state.profile = {
    firstName: document.querySelector("#first-name").value.trim(),
    lastName: document.querySelector("#last-name").value.trim(),
    nickname: document.querySelector("#nickname").value.trim(),
    weightClass: document.querySelector("#weight-class").value,
    style,
    corner,
  };
  document.body.classList.toggle("theme-blue", corner === "blue");
  Object.keys(combatLabels).forEach(key => {
    state.combatStats[key] = BASE_COMBAT_STAT + draftStats[key] + styleBonus(style, key);
  });
  state.journal = [{ week: 1, text: `${state.profile.firstName} rejoint le circuit amateur. La route commence ici.` }];
  render();
  showToast("Nouvelle carrière lancée");
});

document.querySelector("#action-grid").addEventListener("click", event => {
  const button = event.target.closest(".action-card");
  if (!button) return;
  const action = actions.find(item => item.id === button.dataset.action);
  toggleAction(action);
});

document.querySelector("#private-form").addEventListener("submit", event => {
  event.preventDefault();
  if (event.submitter?.id === "private-confirm") planPrivateSession();
  else document.querySelector("#private-dialog").close();
});

document.querySelector("#plan-content").addEventListener("click", event => {
  const remove = event.target.closest("[data-remove]");
  if (remove) {
    weeklyPlan = weeklyPlan.filter(item => item.actionId !== remove.dataset.remove);
    render();
    return;
  }
  const edit = event.target.closest("[data-edit]");
  if (edit) {
    const item = weeklyPlan.find(planItem => planItem.actionId === edit.dataset.edit);
    if (item?.target) document.querySelector("#private-stat").value = item.target;
    document.querySelector("#private-dialog").showModal();
  }
});

document.querySelector("#advance-week").addEventListener("click", executePlan);
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

document.querySelector("#opponents").addEventListener("click", event => {
  const accept = event.target.closest("[data-accept]");
  if (accept) {
    const opponent = opponents.find(item => item.id === accept.dataset.accept);
    state.scheduledFight = { id: opponent.id, week: offeredFightWeek(opponent) };
    state.journal.unshift({ week: state.week, text: `Combat amateur programmé contre ${opponent.name} pour la semaine ${state.scheduledFight.week}.` });
    render();
    showToast("Combat programmé");
  }
});

document.querySelector("#tournaments").addEventListener("click", event => {
  const button = event.target.closest("[data-tournament]");
  if (button) registerTournament(button.dataset.tournament);
});

document.querySelector("#active-tournament").addEventListener("click", event => {
  if (event.target.closest("[data-open-tournament]")) openTournamentBoard();
});

document.querySelector("#tournament-board-close").addEventListener("click", closeTournamentBoard);
document.querySelector("#tournament-next-fight").addEventListener("click", startTournamentRound);

document.querySelector("#pro-transition").addEventListener("click", event => {
  if (event.target.closest("#turn-pro")) turnProfessional();
});

document.querySelector("#scheduled-fight").addEventListener("click", event => {
  if (event.target.closest("#start-fight")) startFight();
  if (event.target.closest("#withdraw-fight")) withdrawFight();
});

document.querySelector("#fight-choices").addEventListener("click", event => {
  const nextRound = event.target.closest("[data-next-round]");
  if (nextRound) return advanceFightRound();
  const choice = event.target.closest("[data-strategy]");
  if (choice) playRound(choice.dataset.strategy);
});
document.querySelector("#fight-corner-boost").addEventListener("click", useCornerBoost);
document.querySelector("#fight-dialog").addEventListener("cancel", event => {
  if (fightState) event.preventDefault();
});

function setupMobileCollapsibles() {
  document.querySelectorAll(".collapsible-section").forEach(section => {
    const toggle = section.querySelector(":scope > .mobile-section-toggle");
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
  if (state.money < GYM_PRICE) return showToast("Pas assez d'argent pour l'abonnement.");
  if (!window.confirm(`Abonnement au gym\n\nCoût : ${GYM_PRICE} $\nDurée : 4 semaines\nInclut l'entraînement régulier et le sparring sans coût par séance.\n\nConfirmer ?`)) return;
  state.money -= GYM_PRICE;
  state.gymWeeks = 4;
  state.journal.unshift({ week: state.week, text: "Ton abonnement au gym est actif pour quatre semaines." });
  render();
  showToast("Abonnement activé");
});

function resetCareer() {
  if (window.confirm("Recommencer la carrière et créer un nouveau boxeur ?")) {
    state = structuredClone(INITIAL_STATE);
    weeklyPlan = [];
    fightState = null;
    document.body.classList.remove("theme-blue");
    draftStats = { technique: 0, power: 0, cardio: 0, defense: 0 };
    document.querySelector("#creation-form").reset();
    renderCreation();
    render();
  }
}

document.querySelector("#restart").addEventListener("click", resetCareer);
document.querySelector("#restart-top").addEventListener("click", resetCareer);

setupMobileCollapsibles();
renderCreation();
render();
