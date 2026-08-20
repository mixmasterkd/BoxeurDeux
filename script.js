const CREATION_POINTS = 12;
const BASE_COMBAT_STAT = 40;
const GYM_PRICE = 110;
const PRIVATE_PRICE = 90;

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
let toastTimer;

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
  document.querySelector("#fighter-meta").textContent = `${profile.weightClass} · ${styles[profile.style].label} · Professionnel débutant`;
  document.querySelector("#fighter-initials").textContent = `${profile.firstName[0]}${profile.lastName[0]}`.toLocaleUpperCase("fr-CA");
  document.querySelector("#fighter-style-label").textContent = styles[profile.style].label;
  document.querySelector("#combat-stats").innerHTML = Object.entries(combatLabels).map(([key, label]) => `<div class="combat-stat"><span>${label}</span><strong>${state.combatStats[key]}</strong></div>`).join("");
}

function actionLock(action) {
  if (action.future) return "Bientôt disponible";
  if (action.requiresGym && state.gymWeeks === 0) return "Abonnement au gym requis";
  if (action.cost && state.money < action.cost) return `Il manque ${action.cost - state.money} $`;
  return "";
}

function renderActions() {
  document.querySelector("#action-grid").innerHTML = actions.map(action => {
    const lock = actionLock(action);
    return `<button class="action-card${action.future ? " future" : ""}" type="button" data-action="${action.id}" ${lock ? "disabled" : ""}>
      <span class="action-icon" aria-hidden="true">${action.icon}</span><h3>${action.title}</h3><p>${action.detail}</p>
      ${lock ? `<span class="action-lock">${lock}</span>` : ""}
    </button>`;
  }).join("");
}

function renderMembership() {
  const status = document.querySelector("#membership-status");
  const button = document.querySelector("#membership-button");
  if (state.gymWeeks > 0) {
    status.className = "membership-status active";
    status.innerHTML = `<strong>Abonnement actif</strong>${state.gymWeeks} semaine${state.gymWeeks > 1 ? "s" : ""} restante${state.gymWeeks > 1 ? "s" : ""}`;
    button.textContent = "Accès inclus";
    button.disabled = true;
  } else {
    status.className = "membership-status";
    status.innerHTML = "<strong>Abonnement expiré</strong>Gym et sparring verrouillés";
    button.textContent = `S’abonner · ${GYM_PRICE} $ / 4 semaines`;
    button.disabled = state.money < GYM_PRICE;
    button.title = button.disabled ? `Il manque ${GYM_PRICE - state.money} $` : "";
  }
}

function render() {
  const hasFighter = Boolean(state.profile);
  document.querySelector("#creation-screen").classList.toggle("hidden", hasFighter);
  document.querySelector("#game").classList.toggle("hidden", !hasFighter);
  if (!hasFighter) return;

  renderFighter();
  document.querySelector("#week").textContent = String(state.week).padStart(2, "0");
  const pips = document.querySelector("#action-pips");
  pips.innerHTML = Array.from({ length: 3 }, (_, index) => `<span class="pip ${index < state.actionsLeft ? "active" : ""}"></span>`).join("");
  pips.setAttribute("aria-label", `${state.actionsLeft} action${state.actionsLeft > 1 ? "s" : ""} restante${state.actionsLeft > 1 ? "s" : ""}`);

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
  renderActions();
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

function finishAction(title, message) {
  state.actionsLeft -= 1;
  state.journal.unshift({ week: state.week, text: message });
  showToast(title);
  if (state.actionsLeft === 0) endWeek();
  render();
}

function applyAction(action) {
  const lock = actionLock(action);
  if (lock) return showToast(lock);
  if (!window.confirm(`${action.title}\n\nEffets : ${action.detail}\n\nConfirmer cette action ?`)) return;
  applyChanges(action.changes);
  applyCombatChanges(action.combatChanges);
  finishAction(action.title, action.message);
}

function applyPrivateSession() {
  if (state.money < PRIVATE_PRICE) return showToast("Pas assez d'argent pour cette séance.");
  const key = document.querySelector("#private-stat").value;
  const label = combatLabels[key];
  if (!window.confirm(`Séance privée — ${label}\n\nCoût : ${PRIVATE_PRICE} $\nEffets : +6 ${label.toLowerCase()}, −14 énergie et +3 moral\n\nConfirmer ?`)) return;
  state.money -= PRIVATE_PRICE;
  state.energy = clamp(state.energy - 14);
  state.morale = clamp(state.morale + 3);
  state.combatStats[key] = clamp(state.combatStats[key] + 6, 0, 99);
  document.querySelector("#private-dialog").close();
  finishAction("Séance privée", `La séance privée fait progresser ta ${label.toLowerCase()}.`);
}

function endWeek() {
  const endingWeek = state.week;
  state.week += 1;
  state.actionsLeft = 3;
  state.energy = clamp(state.energy + 8);
  state.morale = clamp(state.morale - 2);
  const membershipWasActive = state.gymWeeks > 0;
  if (membershipWasActive) state.gymWeeks -= 1;

  let summary = `Fin de la semaine ${endingWeek}. La nouvelle semaine commence avec un peu d'énergie retrouvée.`;
  if (state.injury >= 45 && Math.random() < state.injury / 140) {
    state.fitness = clamp(state.fitness - 8);
    state.morale = clamp(state.morale - 7);
    summary = "Une douleur persistante te force à ralentir : ta forme et ton moral en souffrent.";
  } else if (state.energy < 20) {
    state.injury = clamp(state.injury + 6);
    summary = "La fatigue accumulée augmente ton risque de blessure. Il faudrait lever le pied.";
  } else {
    state.injury = clamp(state.injury - 2);
  }
  state.journal.unshift({ week: state.week, text: summary });
  if (membershipWasActive && state.gymWeeks === 0) state.journal.unshift({ week: state.week, text: "Ton abonnement au gym est expiré. Renouvelle-le pour reprendre l'entraînement et le sparring." });
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
  state = structuredClone(INITIAL_STATE);
  state.profile = {
    firstName: document.querySelector("#first-name").value.trim(),
    lastName: document.querySelector("#last-name").value.trim(),
    nickname: document.querySelector("#nickname").value.trim(),
    weightClass: document.querySelector("#weight-class").value,
    style,
  };
  Object.keys(combatLabels).forEach(key => {
    state.combatStats[key] = BASE_COMBAT_STAT + draftStats[key] + styleBonus(style, key);
  });
  state.journal = [{ week: 1, text: `${state.profile.firstName} signe sa première licence professionnelle. La route commence ici.` }];
  render();
  showToast("Nouvelle carrière lancée");
});

document.querySelector("#action-grid").addEventListener("click", event => {
  const button = event.target.closest(".action-card");
  if (!button) return;
  const action = actions.find(item => item.id === button.dataset.action);
  if (action.private) {
    if (state.money < PRIVATE_PRICE) return showToast("Pas assez d'argent pour cette séance.");
    document.querySelector("#private-dialog").showModal();
  } else {
    applyAction(action);
  }
});

document.querySelector("#private-form").addEventListener("submit", event => {
  event.preventDefault();
  if (event.submitter?.id === "private-confirm") applyPrivateSession();
  else document.querySelector("#private-dialog").close();
});

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

document.querySelector("#restart").addEventListener("click", () => {
  if (window.confirm("Recommencer la carrière et créer un nouveau boxeur ?")) {
    state = structuredClone(INITIAL_STATE);
    draftStats = { technique: 0, power: 0, cardio: 0, defense: 0 };
    document.querySelector("#creation-form").reset();
    renderCreation();
    render();
  }
});

renderCreation();
render();
