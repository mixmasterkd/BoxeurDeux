(function attachBoxeurFighterView(root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.BoxeurFighterView = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createBoxeurFighterViewApi() {
  "use strict";

  const STAT_KEYS = Object.freeze(["technique", "power", "cardio", "defense"]);
  const STAT_LABELS = Object.freeze({
    technique: "Technique",
    power: "Puissance",
    cardio: "Cardio",
    defense: "Défense",
  });
  const EXTENSION_SLOTS = Object.freeze({
    manualLevelUp: "[data-v2-level-up-slot]",
  });

  function escapeHTML(value) {
    return String(value == null ? "" : value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function boundedNumber(value, fallback, min, max) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(max, Math.max(min, number));
  }

  function normalizeRecord(record) {
    const source = record && typeof record === "object" ? record : {};
    return {
      wins: Math.round(boundedNumber(source.wins, 0, 0, 9999)),
      losses: Math.round(boundedNumber(source.losses, 0, 0, 9999)),
    };
  }

  function xpForLevel(level) {
    const safeLevel = Math.max(1, Math.round(boundedNumber(level, 1, 1, 999)));
    if (safeLevel <= 1) return 0;
    const steps = safeLevel - 2;
    return 100 + steps * 180 + ((steps * (steps - 1)) / 2) * 80;
  }

  function normalizeLevel(raw, level, experience) {
    const currentFloor = xpForLevel(level);
    const nextFloor = xpForLevel(level + 1);
    const supplied = raw.levelProgress;
    const percentage = supplied == null
      ? (experience - currentFloor) / Math.max(1, nextFloor - currentFloor) * 100
      : supplied;
    return {
      progress: Math.round(boundedNumber(percentage, 0, 0, 100)),
      currentFloor,
      nextFloor,
      remaining: Math.max(0, nextFloor - experience),
      manualPoints: Math.round(boundedNumber(raw.levelPoints, 0, 0, 9999)),
    };
  }

  function normalizePrivateProgram(rawProgram) {
    if (!rawProgram || typeof rawProgram !== "object") return null;
    const target = STAT_KEYS.includes(rawProgram.target) ? rawProgram.target : "technique";
    const sessionsTotal = Math.round(boundedNumber(
      rawProgram.sessionsTotal == null ? rawProgram.sessions : rawProgram.sessionsTotal,
      1,
      1,
      99,
    ));
    const sessionsCompleted = Math.round(boundedNumber(rawProgram.sessionsCompleted, 0, 0, sessionsTotal));
    return {
      trainerLabel: rawProgram.trainerLabel || rawProgram.coachLabel || "Entraîneur privé",
      target,
      targetLabel: STAT_LABELS[target],
      sessionsTotal,
      sessionsCompleted,
      progress: Math.round(sessionsCompleted / sessionsTotal * 100),
      pendingGaugePoints: Math.round(boundedNumber(rawProgram.pendingGaugePoints, 0, 0, 9999)),
    };
  }

  function normalizeContext(rawContext) {
    const raw = rawContext && typeof rawContext === "object" ? rawContext : {};
    const profile = raw.profile && typeof raw.profile === "object" ? raw.profile : {};
    const rawStats = raw.combatStats && typeof raw.combatStats === "object" ? raw.combatStats : {};
    const rawProgress = raw.statProgress && typeof raw.statProgress === "object" ? raw.statProgress : {};
    const status = ["recreational", "amateur", "professional"].includes(raw.careerStatus)
      ? raw.careerStatus
      : "recreational";
    const level = Math.round(boundedNumber(raw.level, 1, 1, 999));
    const experience = Math.round(boundedNumber(raw.experience, 0, 0, 99999999));
    return {
      profile: {
        firstName: profile.firstName || "Boxeur",
        lastName: profile.lastName || "Deux",
        nickname: profile.nickname || "",
        sex: profile.sex === "female" ? "female" : "male",
        portraitId: Math.round(boundedNumber(profile.portraitId, 0, 0, 2)),
      },
      careerStatus: status,
      statusLabel: raw.statusLabel || (status === "professional" ? "Professionnel" : status === "amateur" ? "Amateur" : "Récréatif"),
      styleLabel: raw.styleLabel || "Équilibré",
      weightLabel: raw.weightLabel || "Catégorie à confirmer",
      money: Math.round(boundedNumber(raw.money, 0, 0, 99999999)),
      level,
      experience,
      levelProgress: normalizeLevel(raw, level, experience),
      record: normalizeRecord(raw.amateurRecord),
      stats: Object.fromEntries(STAT_KEYS.map(key => {
        const supplied = boundedNumber(rawStats[key], 40, 0, 99.9999);
        return [key, Math.floor(supplied)];
      })),
      progress: Object.fromEntries(STAT_KEYS.map(key => {
        const supplied = rawProgress[key] == null
          ? (boundedNumber(rawStats[key], 40, 0, 99.9999) % 1) * 100
          : rawProgress[key];
        return [key, Math.round(boundedNumber(supplied, 0, 0, 99.9999))];
      })),
      privateProgram: normalizePrivateProgram(raw.privateProgram || raw.privateTrainerProgram),
    };
  }

  function portraitAsset(sex) {
    return sex === "female" ? "assets/portraits-femmes.webp" : "assets/portraits-hommes.webp";
  }

  function renderStat(key, context) {
    const value = context.stats[key];
    const progress = context.progress[key];
    const label = STAT_LABELS[key];
    return `<article class="v2-fighter-stat" aria-labelledby="v2-fighter-stat-${key}">
      <div><span id="v2-fighter-stat-${key}">${label}</span><strong>${value}</strong></div>
      <div class="v2-fighter-progress" role="progressbar" aria-label="Progression ${label.toLocaleLowerCase("fr-CA")}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}">
        <span style="width:${progress}%"></span>
      </div>
      <small>${progress} %</small>
    </article>`;
  }

  function renderLevelProgress(context) {
    const progress = context.levelProgress.progress;
    return `<div class="v2-fighter-level-progress">
      <div><span>Progression générale</span><strong>${progress} %</strong></div>
      <div class="v2-fighter-progress" role="progressbar" aria-label="Progression vers le niveau ${context.level + 1}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}">
        <span style="width:${progress}%"></span>
      </div>
    </div>`;
  }

  function renderPrivateProgram(context) {
    const program = context.privateProgram;
    if (!program) {
      return `<p class="v2-fighter-empty">Aucun programme privé actif.<br><small>Les entraîneurs privés font progresser une qualité graduellement; ils n’accordent jamais un point complet instantanément.</small></p>`;
    }
    const pending = program.pendingGaugePoints > 0
      ? `<small>${program.pendingGaugePoints} point${program.pendingGaugePoints > 1 ? "s" : ""} de progression potentielle créé${program.pendingGaugePoints > 1 ? "s" : ""} par le programme</small>`
      : `<small>Les gains seront assimilés avec la récupération.</small>`;
    return `<article class="v2-fighter-private-program">
      <div><span><strong>${escapeHTML(program.trainerLabel)}</strong><small>Cible : ${escapeHTML(program.targetLabel)}</small></span><b>${program.sessionsCompleted}/${program.sessionsTotal} séances</b></div>
      <div class="v2-fighter-progress" role="progressbar" aria-label="Progression du programme privé avec ${escapeHTML(program.trainerLabel)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${program.progress}">
        <span style="width:${program.progress}%"></span>
      </div>
      ${pending}
    </article>`;
  }

  function render(rawContext) {
    const context = normalizeContext(rawContext);
    const nickname = context.profile.nickname ? ` « ${escapeHTML(context.profile.nickname)} »` : "";
    const record = context.careerStatus === "recreational"
      ? "Bilan amateur à venir"
      : `${context.record.wins} V · ${context.record.losses} D`;
    return `<section class="v2-fighter-view" aria-labelledby="v2-fighter-title">
      <header class="v2-fighter-header">
        <div><p class="eyebrow">Fiche du boxeur</p><h2 id="v2-fighter-title">${escapeHTML(context.profile.firstName)}${nickname} ${escapeHTML(context.profile.lastName)}</h2></div>
        <button type="button" class="secondary-button" data-v2-close-fighter>Retour à la carte</button>
      </header>
      <div class="v2-fighter-layout">
        <aside class="v2-fighter-identity">
          <div class="v2-fighter-visual">
            <div class="v2-fighter-portrait portrait-crop" style="--portrait-index:${context.profile.portraitId}" role="img" aria-label="Portrait de ${escapeHTML(context.profile.firstName)}">
              <img src="${portraitAsset(context.profile.sex)}" width="1152" height="768" alt="" />
            </div>
            ${renderLevelProgress(context)}
            <div class="v2-fighter-badges"><span>${escapeHTML(context.statusLabel)} – Niveau ${context.level}</span></div>
          </div>
          <dl>
            <div><dt>Style</dt><dd>${escapeHTML(context.styleLabel)}</dd></div>
            <div><dt>Catégorie</dt><dd>${escapeHTML(context.weightLabel)}</dd></div>
            <div><dt>Bilan</dt><dd>${escapeHTML(record)}</dd></div>
            <div><dt>Argent</dt><dd class="money">${context.money} $</dd></div>
          </dl>
        </aside>
        <div class="v2-fighter-details">
          <section aria-labelledby="v2-fighter-progression-title">
            <div class="v2-fighter-section-heading"><div><p class="eyebrow">Progression permanente</p><h3 id="v2-fighter-progression-title">Tes quatre qualités de boxe</h3></div><p>Les séances créent du travail à assimiler. Une barre complète améliore automatiquement la qualité et conserve l’excédent.</p></div>
            <div class="v2-fighter-stats">${STAT_KEYS.map(key => renderStat(key, context)).join("")}</div>
            <div data-v2-level-up-slot data-level-points="${context.levelProgress.manualPoints}" hidden></div>
          </section>
          <section class="v2-fighter-private" aria-labelledby="v2-fighter-private-title">
            <div class="v2-fighter-section-heading"><div><p class="eyebrow">Développement ciblé</p><h3 id="v2-fighter-private-title">Programme privé</h3></div><p>Un entraîneur plus expérimenté coûte davantage, mais produit plus de progression fractionnaire vers la qualité choisie.</p></div>
            ${renderPrivateProgram(context)}
          </section>
        </div>
      </div>
    </section>`;
  }

  return Object.freeze({ STAT_KEYS, STAT_LABELS, EXTENSION_SLOTS, xpForLevel, normalizeContext, render });
});
