(function attachGalaRisk(root, factory) {
  "use strict";
  const commonjs = typeof module === "object" && module.exports;
  const api = factory(commonjs ? require("./combat-engine.js") : root.BoxeurCombat);
  if (commonjs) module.exports = api;
  if (root) root.BoxeurGalaRisk = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createGalaRisk(combat) {
  "use strict";
  // Presentation only. Never use this estimate to select, price or resolve a bout.
  const KEYS = Object.freeze(["technique", "power", "cardio", "defense"]);
  const LABELS = Object.freeze({ favorable: "Avantage sur le papier", demanding: "Combat exigeant",
    challenging: "Gros défi", unknown: "Évaluation indisponible" });
  const EXPLANATION = "Comparaison des caractéristiques actuelles. Tes choix et ta condition le jour du combat comptent aussi.";
  const FUTURE = "Ta préparation peut encore changer avant la semaine du combat.";
  const WARNING = "Ta condition actuelle peut rendre ce combat plus difficile, même avec un avantage sur le papier.";
  const escape = text => String(text ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  const validStats = stats => stats && KEYS.every(key => Number.isFinite(stats[key]) && stats[key] >= 1 && stats[key] <= 99);
  const mean = stats => KEYS.reduce((sum, key) => sum + stats[key], 0) / KEYS.length;

  function assess(playerStats, opponentStats, opponentStyle) {
    if (!validStats(playerStats) || !validStats(opponentStats)) return { id: "unknown", label: LABELS.unknown, index: null };
    const family = /puncheur|pression|bagarreur/i.test(opponentStyle || "") ? "attack"
      : /technicien|mobile/i.test(opponentStyle || "") ? "distance"
        : /contre|défensif/i.test(opponentStyle || "") ? "defense" : null;
    const gap = mean(opponentStats) - mean(playerStats);
    const profileGap = family ? KEYS.reduce((sum, key) => sum
      + (opponentStats[key] - playerStats[key]) * combat.LEGACY_WEIGHTS[family][key], 0) : gap;
    const index = gap + .35 * Math.max(0, profileGap - gap);
    const id = index <= -2 ? "favorable" : index >= 2 ? "challenging" : "demanding";
    return { id, label: LABELS[id], index };
  }

  function renderAssessment(assessment) {
    const id = Object.hasOwn(LABELS, assessment?.id) ? assessment.id : "unknown";
    // Only public labels are rendered: never the internal index or supplied HTML.
    return `<span class="gala-risk-label ${id}" data-gala-risk="${id}">${LABELS[id]}</span>`;
  }

  function conditionWarning(condition = {}) {
    return (Number.isFinite(condition.energy) && condition.energy < 35)
      || (Number.isFinite(condition.fatigue) && condition.fatigue > 65) ? WARNING : "";
  }

  function renderPreparation(preparation = {}, future = false) {
    const reading = value => Number.isFinite(value) && value >= 0 && value <= 100 ? Math.round(value) : "—";
    const warning = conditionWarning(preparation);
    return `<aside class="gala-preparation" aria-label="Préparation actuelle pour les galas"><strong>Préparation actuelle : ${escape(preparation.label || "À vérifier")}</strong><span>Énergie ${reading(preparation.energy)} · Fatigue ${reading(preparation.fatigue)}</span>${warning ? `<p class="gala-condition-warning">${WARNING}</p>` : ""}<p>${EXPLANATION}</p>${future ? `<p>${FUTURE}</p>` : ""}</aside>`;
  }

  function renderTravel(effects, applied = false) {
    if (applied || !effects) return "";
    const parts = [["energy", "énergie"], ["fatigue", "fatigue"]].flatMap(([key, label]) => {
      const value = effects[key];
      return Number.isFinite(value) && value !== 0 ? [`${label} ${value > 0 ? "+" : ""}${value}`] : [];
    });
    return parts.length ? `<span class="gala-travel-note">Déplacement à venir : ${parts.join(" · ")}. Effets non encore appliqués.</span>` : "";
  }

  return Object.freeze({ assess, renderAssessment, renderPreparation, renderTravel, conditionWarning, EXPLANATION, FUTURE });
});
