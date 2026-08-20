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
  actionsLeft: 3,
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
  declinedFights: [],
  tournaments: { bronze: "pending", silver: "pending", golden: "pending", canadian: "locked", olympic: "locked" },
  activeTournament: null,
  medals: {
    bronze: { bronze: 0, silver: 0, gold: 0 }, silver: { bronze: 0, silver: 0, gold: 0 },
    golden: { bronze: 0, silver: 0, gold: 0 }, canadian: { bronze: 0, silver: 0, gold: 0 },
    olympic: { bronze: 0, silver: 0, gold: 0 },
  },
  goldenPlacement: null,
  olympicCompleted: false,
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

const actions = [
  { id: "work", icon: "$", title: "Travailler", detail: "+70 $ · −22 énergie · −4 moral", changes: { money: 70, energy: -22, morale: -4 }, message: "Un quart de travail paie les factures, mais laisse les jambes lourdes." },
  { id: "gym", icon: "G", title: "Entraînement au gym", detail: "+10 forme · +2 cardio · +1 technique · −18 énergie · +3 risque", requiresGym: true, changes: { fitness: 10, energy: -18, injury: 3 }, combatChanges: { cardio: 2, technique: 1 }, message: "Une séance solide au gym améliore ta condition et affine ta technique." },
  { id: "private", icon: "P", title: "Séance privée", detail: "90 $ · +6 à une statistique · −14 énergie · +3 moral", cost: PRIVATE_PRICE, private: true },
  { id: "rest", icon: "Z", title: "Repos", detail: "+30 énergie · −10 risque · +5 moral", changes: { energy: 30, injury: -10, morale: 5 }, message: "Une vraie journée de repos remet le corps d'aplomb." },
  { id: "eat", icon: "+", title: "Bien manger", detail: "35 $ · +14 énergie · +6 forme · +2 moral", cost: 35, changes: { money: -35, energy: 14, fitness: 6, morale: 2 }, message: "Un bon repas nourrit la récupération autant que le moral." },
  { id: "sparring", icon: "S", title: "Sparring", detail: "+12 expérience · +2 technique · +2 défense · −24 énergie · +12 risque", requiresGym: true, changes: { experience: 12, energy: -24, injury: 12, reputation: 2 }, combatChanges: { technique: 2, defense: 2 }, message: "Les rounds de sparring donnent de l'expérience et de vrais réflexes de combat." },
  { id: "spa", icon: "R", title: "Spa et récupération", detail: "65 $ · +38 énergie · −20 risque · +6 moral", cost: 65, changes: { money: -65, energy: 38, injury: -20, morale: 6 }, message: "Le protocole de récupération remet le corps et la tête en état." },
  { id: "coach", icon: "C", title: "Meilleur coach", detail: "Amélioration de carrière à venir", future: true },
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

function weeklyOpponentOffers() {
  const start = ((state.week - 1) * 2) % opponents.length;
  return [start, (start + 1) % opponents.length, (start + 4) % opponents.length].map(index => opponents[index]);
}

function offerKey(opponentId) {
  return `${state.week}:${opponentId}`;
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
  active.results.push({ round: roundIndex, opponent: fight.opponent.name, result, score: `${fight.playerPoints}–${fight.opponentPoints}` });
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
    const declinedThisWeek = state.declinedFights.includes(offerKey(opponent.id));
    const offeredWeek = offeredFightWeek(opponent);
    const clashesWithTournament = Boolean(state.activeTournament && offeredWeek >= state.activeTournament.startWeek);
    const unavailable = state.scheduledFight || declinedThisWeek || clashesWithTournament;
    const status = declinedThisWeek ? "Proposition refusée cette semaine" : state.scheduledFight ? "Un combat est déjà programmé" : clashesWithTournament ? "Date incompatible avec le tournoi" : "";
    return `<article class="opponent-card"><p class="eyebrow">Proposé : semaine ${offeredWeek}</p><h3>${opponent.name} « ${opponent.nickname} »</h3><p>${state.profile.weightClass} · ${opponent.style}</p><p>Bilan amateur : ${opponent.record}</p><div class="opponent-meta"><span>Risque : ${opponent.risk}</span><span>Difficulté ${opponent.difficulty}</span></div><button class="secondary-button" type="button" data-accept="${opponent.id}" ${unavailable ? "disabled" : ""}>${status || "Accepter le combat"}</button>${!unavailable ? `<button class="plan-remove" type="button" data-decline="${opponent.id}">Refuser</button>` : ""}</article>`;
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

function actionLock(action) {
  if (action.future) return "Bientôt disponible";
  if (action.requiresGym && state.gymWeeks === 0) return "Abonnement au gym requis";
  if (weeklyPlan.length >= 3) return "Plan complet — retire une action";
  if (action.cost && projectedMoney() < action.cost) return `Il manque ${action.cost - projectedMoney()} $ au budget prévu`;
  return "";
}

function renderActions() {
  document.querySelector("#action-grid").innerHTML = actions.map(action => {
    const selected = weeklyPlan.some(item => item.actionId === action.id);
    const lock = selected ? "" : actionLock(action);
    return `<button class="action-card${action.future ? " future" : ""}${selected ? " selected" : ""}" type="button" data-action="${action.id}" ${lock ? "disabled" : ""} aria-pressed="${selected}">
      <span class="action-icon" aria-hidden="true">${action.icon}</span><h3>${action.title}</h3><p>${action.detail}</p>
      ${lock ? `<span class="action-lock">${lock}</span>` : ""}
    </button>`;
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

function planEffects() {
  const general = {};
  const combat = {};
  let earned = 0;
  let spent = 0;
  weeklyPlan.forEach(item => {
    const action = actions.find(candidate => candidate.id === item.actionId);
    const changes = action.private ? { money: -PRIVATE_PRICE, energy: -14, morale: 3 } : (action.changes || {});
    Object.entries(changes).forEach(([key, value]) => {
      general[key] = (general[key] || 0) + value;
      if (key === "money") value >= 0 ? earned += value : spent += Math.abs(value);
    });
    const combatChanges = action.private ? { [item.target]: 6 } : (action.combatChanges || {});
    Object.entries(combatChanges).forEach(([key, value]) => combat[key] = (combat[key] || 0) + value);
  });
  return { general, combat, earned, spent };
}

function signed(value, suffix = "") {
  return `${value > 0 ? "+" : ""}${value}${suffix}`;
}

function renderPlan() {
  const content = document.querySelector("#plan-content");
  document.querySelector("#plan-count").textContent = `${weeklyPlan.length} / 3 action${weeklyPlan.length > 1 ? "s" : ""}`;
  if (!weeklyPlan.length) {
    content.innerHTML = `<div class="plan-list plan-list-empty">${Array.from({ length: 3 }, (_, index) => `<div class="plan-slot"><span>${index + 1}</span><em>Libre</em></div>`).join("")}</div><div class="plan-empty">Ton programme est vide. Choisis jusqu’à trois actions ci-dessus.</div>`;
  } else {
    const totals = planEffects();
    const effectParts = Object.entries(totals.general).filter(([key]) => key !== "money").map(([key, value]) => `${generalStats.find(stat => stat.key === key)?.label || "Expérience"} ${signed(value, key === "experience" ? "" : "%")}`);
    effectParts.push(...Object.entries(totals.combat).map(([key, value]) => `${combatLabels[key]} ${signed(value)}`));
    const plannedRows = weeklyPlan.map((item, index) => {
      const action = actions.find(candidate => candidate.id === item.actionId);
      const target = item.target ? ` · Cible : ${combatLabels[item.target]}` : "";
      return `<div class="plan-row"><span class="plan-order">${index + 1}</span><div class="plan-row-copy"><strong>${action.title}</strong><small>${action.detail}${target}</small></div><div class="plan-row-actions">${item.target ? `<button class="plan-remove" type="button" data-edit="${action.id}">Modifier</button>` : ""}<button class="plan-remove" type="button" data-remove="${action.id}">Retirer</button></div></div>`;
    }).join("");
    const emptyRows = Array.from({ length: 3 - weeklyPlan.length }, (_, index) => `<div class="plan-slot"><span>${weeklyPlan.length + index + 1}</span><em>Libre</em></div>`).join("");
    content.innerHTML = `<div class="plan-list">${plannedRows}${emptyRows}</div><div class="plan-totals"><div class="plan-total-block"><span>Argent à la fin</span><strong class="${projectedMoney() >= state.money ? "positive" : "negative"}">${projectedMoney()} $</strong></div><div class="plan-total-block"><span>Gains / dépenses</span><strong><span class="positive">+${totals.earned} $</span> · <span class="negative">−${totals.spent} $</span></strong></div><div class="plan-total-block"><span>Effets prévus</span><div class="plan-effects">${effectParts.join(" · ") || "Aucun changement de jauge"}</div></div></div>`;
  }
  const tournamentDue = Boolean(state.activeTournament && state.activeTournament.status !== "completed" && state.week >= state.activeTournament.startWeek);
  const fightDue = Boolean((state.scheduledFight && state.week >= state.scheduledFight.week) || tournamentDue);
  const valid = weeklyPlan.length > 0 && projectedMoney() >= 0 && !fightDue;
  const advance = document.querySelector("#advance-week");
  advance.disabled = !valid;
  document.querySelector("#plan-help").textContent = tournamentDue ? "Le tournoi a commencé : termine ton parcours avant de passer à la semaine suivante." : fightDue ? "Le combat est arrivé : entre dans le ring ou désiste-toi avant de passer à la semaine suivante." : !weeklyPlan.length ? "Sélectionne au moins une action pour continuer." : projectedMoney() < 0 ? "Le plan dépasse ton budget. Retire une dépense ou ajoute du travail." : "Rien ne sera appliqué avant ta confirmation.";
}

function render() {
  const hasFighter = Boolean(state.profile);
  document.querySelector("#creation-screen").classList.toggle("hidden", hasFighter);
  document.querySelector("#game").classList.toggle("hidden", !hasFighter);
  if (!hasFighter) return;

  renderFighter();
  document.querySelector("#money-spotlight").textContent = `${state.money} $`;
  document.querySelector("#week").textContent = String(state.week).padStart(2, "0");
  const pips = document.querySelector("#action-pips");
  pips.innerHTML = Array.from({ length: 3 }, (_, index) => `<span class="pip ${index < weeklyPlan.length ? "active" : ""}"></span>`).join("");
  pips.setAttribute("aria-label", `${weeklyPlan.length} action${weeklyPlan.length > 1 ? "s" : ""} planifiée${weeklyPlan.length > 1 ? "s" : ""}`);

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
  if (projectedMoney() < PRIVATE_PRICE) return showToast("Pas assez d'argent prévu pour cette séance.");
  const key = document.querySelector("#private-stat").value;
  const existing = weeklyPlan.find(item => item.actionId === "private");
  if (existing) existing.target = key;
  else weeklyPlan.push({ actionId: "private", target: key });
  document.querySelector("#private-dialog").close();
  render();
  showToast("Séance privée ajoutée au plan");
}

function endWeek(events) {
  const endingWeek = state.week;
  state.week += 1;
  state.actionsLeft = 3;
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
    const action = actions.find(candidate => candidate.id === item.actionId);
    if (action.private) {
      applyChanges({ money: -PRIVATE_PRICE, energy: -14, morale: 3 });
      applyCombatChanges({ [item.target]: 6 });
      state.journal.unshift({ week: endingWeek, text: `La séance privée fait progresser ta ${combatLabels[item.target].toLowerCase()}.` });
    } else {
      applyChanges(action.changes);
      applyCombatChanges(action.combatChanges);
      state.journal.unshift({ week: endingWeek, text: action.message });
    }
  });
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

function startFight() {
  const opponent = scheduledOpponent();
  if (!opponent) return;
  fightState = { opponent, tournamentId: state.scheduledFight.tournamentId || null, round: 1, playerPoints: 0, opponentPoints: 0, playerEnergy: state.energy, opponentEnergy: 88 + Math.floor(Math.random() * 8), rounds: [] };
  document.querySelector("#fight-choices").innerHTML = `<button type="button" data-strategy="attack"><strong>Attaquer</strong><span>Puissance, technique · fatigue élevée</span></button><button type="button" data-strategy="distance"><strong>Boxer à distance</strong><span>Technique, cardio · fatigue modérée</span></button><button type="button" data-strategy="defense"><strong>Jouer la défense</strong><span>Défense, cardio · fatigue réduite</span></button>`;
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

function strategyData(strategy) {
  return {
    attack: { label: "Attaquer", fatigue: 16, player: state.combatStats.power * .46 + state.combatStats.technique * .26 + state.fitness * .18, opponent: 2 },
    distance: { label: "Boxer à distance", fatigue: 10, player: state.combatStats.technique * .46 + state.combatStats.cardio * .28 + state.combatStats.defense * .12, opponent: 0 },
    defense: { label: "Jouer la défense", fatigue: 6, player: state.combatStats.defense * .46 + state.combatStats.cardio * .24 + state.combatStats.technique * .12, opponent: -3 },
  }[strategy];
}

function renderFight(message = "Choisis une consigne pour ce round.") {
  const fight = fightState;
  const tournamentName = fight.tournamentId ? tournamentDefs.find(item => item.id === fight.tournamentId).name : "Combat amateur";
  document.querySelector("#fight-week-label").textContent = `${tournamentName} · Semaine ${state.week}`;
  document.querySelector("#fight-round").textContent = `Round ${fight.round} / 3`;
  document.querySelector("#fight-player-name").textContent = state.profile.firstName;
  document.querySelector("#fight-player-meta").textContent = `${state.profile.nickname ? `« ${state.profile.nickname} » · ` : ""}${state.profile.weightClass} · Coin bleu`;
  document.querySelector("#fight-opponent-name").textContent = fight.opponent.name;
  document.querySelector("#fight-opponent-meta").textContent = `« ${fight.opponent.nickname} » · ${fight.opponent.weightClass || state.profile.weightClass} · Coin rouge`;
  document.querySelector("#fight-player-energy").textContent = `${Math.max(0, fight.playerEnergy)}%`;
  document.querySelector("#fight-opponent-energy").textContent = `${Math.max(0, fight.opponentEnergy)}%`;
  document.querySelector("#fight-score").textContent = `${fight.playerPoints} — ${fight.opponentPoints}`;
  document.querySelector("#fight-status").textContent = message;
  document.querySelector("#fight-instruction").innerHTML = `<p>${message}</p>`;
}

function playRound(strategy) {
  const fight = fightState;
  if (!fight || fight.round > 3) return;
  const choice = strategyData(strategy);
  const opponentBase = fight.opponent.difficulty * 1.05 + fight.opponentEnergy * .28 + state.injury * .08;
  const playerBase = choice.player + fight.playerEnergy * .32 + state.fitness * .22 - state.injury * .16;
  const playerScore = playerBase + (Math.random() * 18 - 9);
  const opponentScore = opponentBase + choice.opponent + (Math.random() * 18 - 9);
  let playerRound = 10;
  let opponentRound = 9;
  if (playerScore > opponentScore + 10) opponentRound = 8;
  else if (opponentScore > playerScore + 10) { playerRound = 9; opponentRound = 10; }
  else if (opponentScore > playerScore + 3) { playerRound = 9; opponentRound = 10; }
  fight.playerPoints += playerRound;
  fight.opponentPoints += opponentRound;
  fight.playerEnergy = clamp(fight.playerEnergy - choice.fatigue - Math.floor(Math.random() * 4));
  fight.opponentEnergy = clamp(fight.opponentEnergy - (9 + Math.floor(Math.random() * 7)));
  fight.rounds.push(`${choice.label} : ${playerRound}–${opponentRound}`);
  if (fight.round === 3) return finishFight();
  fight.round += 1;
  renderFight(`Round ${fight.round - 1} : ${choice.label}, ${playerRound}–${opponentRound}. Choisis la suite.`);
}

function finishFight() {
  const fight = fightState;
  let margin = fight.playerPoints - fight.opponentPoints;
  let result;
  if (fight.tournamentId && margin === 0) {
    if (fight.playerEnergy >= fight.opponentEnergy) fight.playerPoints += 1;
    else fight.opponentPoints += 1;
    margin = fight.playerPoints - fight.opponentPoints;
  }
  if (margin > 0) { result = "Victoire"; state.amateurRecord.wins += 1; applyChanges({ reputation: 7, experience: 18, morale: 9, injury: 4 }); }
  else if (margin < 0) { result = "Défaite"; state.amateurRecord.losses += 1; applyChanges({ reputation: 2, experience: 12, morale: -5, injury: 7 }); }
  else { result = "Match nul"; state.amateurRecord.draws += 1; applyChanges({ reputation: 4, experience: 15, morale: 2, injury: 5 }); }
  const tournamentNote = resolveTournamentRound(fight, result);
  state.energy = clamp(fight.playerEnergy);
  if (fight.tournamentId && result === "Victoire" && state.activeTournament?.status !== "completed") state.energy = clamp(state.energy + 18);
  const injuryEvent = state.injury >= 55 && Math.random() < .35 ? " Une douleur au retour au vestiaire augmente la prudence nécessaire." : "";
  if (injuryEvent) state.injury = clamp(state.injury + 7);
  state.journal.unshift({ week: state.week, text: `Combat amateur : ${result} contre ${fight.opponent.name}, ${fight.playerPoints}–${fight.opponentPoints}.${tournamentNote ? ` ${tournamentNote}` : ""}${injuryEvent}` });
  // Rafraîchir le tableau après le calcul du troisième round afin que son score soit visible.
  renderFight(`${result} après 3 rounds`);
  document.querySelector("#fight-choices").innerHTML = "";
  document.querySelector("#fight-instruction").innerHTML = `<p><strong>${result} — ${fight.playerPoints} à ${fight.opponentPoints}</strong><br>${fight.rounds.join(" · ")}<br>${tournamentNote ? `${tournamentNote}<br>` : ""}Expérience, réputation et état physique ont été mis à jour.${injuryEvent}</p>`;
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
document.querySelector("#summary-close").addEventListener("click", () => {
  document.querySelector("#summary-dialog").close();
  if (state.activeTournament && state.week >= state.activeTournament.startWeek && state.activeTournament.status !== "completed") openTournamentBoard();
});

document.querySelector("#opponents").addEventListener("click", event => {
  const accept = event.target.closest("[data-accept]");
  const decline = event.target.closest("[data-decline]");
  if (accept) {
    const opponent = opponents.find(item => item.id === accept.dataset.accept);
    state.scheduledFight = { id: opponent.id, week: offeredFightWeek(opponent) };
    state.journal.unshift({ week: state.week, text: `Combat amateur programmé contre ${opponent.name} pour la semaine ${state.scheduledFight.week}.` });
    render();
    showToast("Combat programmé");
  }
  if (decline) {
    state.declinedFights.push(offerKey(decline.dataset.decline));
    render();
    showToast("Proposition refusée");
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
  const choice = event.target.closest("[data-strategy]");
  if (choice) playRound(choice.dataset.strategy);
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
