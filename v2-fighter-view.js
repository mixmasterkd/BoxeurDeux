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

  function normalizeMedals(value) {
    const rows = (Array.isArray(value) ? value : []).slice(0, 20).map((entry, index) => {
      const source = entry && typeof entry === "object" ? entry : {};
      return {
        id: String(source.id || `tournament-${index}`).slice(0, 80),
        label: String(source.label || "Tournoi amateur").slice(0, 120),
        gold: Math.round(boundedNumber(source.gold, 0, 0, 999)),
        silver: Math.round(boundedNumber(source.silver, 0, 0, 999)),
        bronze: Math.round(boundedNumber(source.bronze, 0, 0, 999)),
      };
    });
    const totals = rows.reduce((sum, row) => ({
      gold: sum.gold + row.gold,
      silver: sum.silver + row.silver,
      bronze: sum.bronze + row.bronze,
    }), { gold: 0, silver: 0, bronze: 0 });
    return {
      rows: rows.filter(row => row.gold + row.silver + row.bronze > 0),
      totals,
      count: totals.gold + totals.silver + totals.bronze,
    };
  }

  function xpForLevel(level) {
    const safeLevel = Math.max(1, Math.round(boundedNumber(level, 1, 1, 999)));
    if (safeLevel <= 1) return 0;
    const steps = safeLevel - 1;
    return steps * 40 + ((steps * (steps - 1)) / 2) * 10;
  }

  function normalizeLevel(raw, level, experience) {
    const currentFloor = xpForLevel(level);
    const nextFloor = xpForLevel(level + 1);
    return {
      progress: Math.round(boundedNumber(experience / Math.max(1, nextFloor) * 100, 0, 0, 100)),
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
      pendingTargetedXp: Math.round(boundedNumber(
        rawProgram.pendingTargetedXp == null ? rawProgram.pendingGaugePoints : rawProgram.pendingTargetedXp,
        0,
        0,
        9999,
      )),
    };
  }

  function normalizeContext(rawContext) {
    const raw = rawContext && typeof rawContext === "object" ? rawContext : {};
    const profile = raw.profile && typeof raw.profile === "object" ? raw.profile : {};
    const rawStats = raw.combatStats && typeof raw.combatStats === "object" ? raw.combatStats : {};
    const rawStatXp = raw.statXpProgress && typeof raw.statXpProgress === "object" ? raw.statXpProgress : {};
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
      privateLessonCredits: Math.round(boundedNumber(raw.privateLessonCredits, 0, 0, 99)),
      levelProgress: normalizeLevel(raw, level, experience),
      record: normalizeRecord(raw.amateurRecord),
      medals: normalizeMedals(raw.medals),
      stats: Object.fromEntries(STAT_KEYS.map(key => {
        const supplied = boundedNumber(rawStats[key], 40, 0, 99.9999);
        return [key, Math.floor(supplied)];
      })),
      statXp: Object.fromEntries(STAT_KEYS.map(key => {
        const source = rawStatXp[key] && typeof rawStatXp[key] === "object" ? rawStatXp[key] : {};
        const nextThreshold = Math.round(boundedNumber(source.nextThreshold, 40, 1, 99999999));
        return [key, {
          total: Math.round(boundedNumber(source.total, 0, 0, nextThreshold)),
          nextThreshold,
          pendingXp: Math.round(boundedNumber(source.pendingXp, 0, 0, 9999)),
        }];
      })),
      privateProgram: normalizePrivateProgram(raw.privateProgram || raw.privateTrainerProgram),
    };
  }

  function portraitAsset(sex) {
    return sex === "female" ? "assets/portraits-femmes.webp" : "assets/portraits-hommes.webp";
  }

  function renderStat(key, context) {
    const value = context.stats[key];
    const xp = context.statXp[key];
    const label = STAT_LABELS[key];
    const progress = Math.round(xp.total / Math.max(1, xp.nextThreshold) * 100);
    const pendingLabel = xp.pendingXp > 0
      ? `+${xp.pendingXp} XP en attente de récupération`
      : "Toute l’XP est assimilée";
    return `<article class="v2-fighter-stat" aria-labelledby="v2-fighter-stat-${key}">
      <div><span id="v2-fighter-stat-${key}">${label}</span><strong>${value}</strong></div>
      <div class="v2-fighter-progress" role="progressbar" aria-label="XP ${label.toLocaleLowerCase("fr-CA")} : ${xp.total} sur ${xp.nextThreshold}" aria-valuemin="0" aria-valuemax="${xp.nextThreshold}" aria-valuenow="${xp.total}">
        <span style="width:${progress}%"></span>
      </div>
      <div class="v2-fighter-stat-meta"><small><strong>${xp.total} / ${xp.nextThreshold} XP</strong></small><small class="${xp.pendingXp > 0 ? "pending" : "clear"}">${pendingLabel}</small></div>
    </article>`;
  }

  function renderLevelProgress(context) {
    const progress = context.levelProgress.progress;
    return `<div class="v2-fighter-level-progress">
      <div><span>XP générale</span><strong>${context.experience} / ${context.levelProgress.nextFloor} XP</strong></div>
      <div class="v2-fighter-progress" role="progressbar" aria-label="XP générale : ${context.experience} sur ${context.levelProgress.nextFloor} avant le niveau ${context.level + 1}" aria-valuemin="0" aria-valuemax="${context.levelProgress.nextFloor}" aria-valuenow="${context.experience}">
        <span style="width:${progress}%"></span>
      </div>
    </div>`;
  }

  function renderPrivateProgram(context) {
    const program = context.privateProgram;
    if (!program) {
      return `<p class="v2-fighter-empty">Aucun programme privé actif.<br><small>Les entraîneurs privés font progresser une qualité graduellement; ils n’accordent jamais un point complet instantanément.</small></p>`;
    }
    const pending = program.pendingTargetedXp > 0
      ? `<small>${program.pendingTargetedXp} XP ciblée créée par le programme</small>`
      : `<small>Les gains seront assimilés avec la récupération.</small>`;
    return `<article class="v2-fighter-private-program">
      <div><span><strong>${escapeHTML(program.trainerLabel)}</strong><small>Cible : ${escapeHTML(program.targetLabel)}</small></span><b>${program.sessionsCompleted}/${program.sessionsTotal} séances</b></div>
      <div class="v2-fighter-progress" role="progressbar" aria-label="Progression du programme privé avec ${escapeHTML(program.trainerLabel)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${program.progress}">
        <span style="width:${program.progress}%"></span>
      </div>
      ${pending}
    </article>`;
  }

  function renderMedalTotals(medals, compact = false) {
    const order = [
      { id: "gold", label: "Or" },
      { id: "silver", label: "Argent" },
      { id: "bronze", label: "Bronze" },
    ];
    return `<span class="v2-fighter-medal-totals${compact ? " compact" : ""}" aria-label="${medals.totals.gold} or, ${medals.totals.silver} argent et ${medals.totals.bronze} bronze">${order.map(item => `<span data-medal="${item.id}"><i aria-hidden="true"></i><strong>${item.label}</strong> ${medals.totals[item.id]}</span>`).join("")}</span>`;
  }

  function renderMedalPalmares(context) {
    if (context.careerStatus === "recreational") return "";
    const medals = context.medals;
    const content = medals.count
      ? `<div class="v2-fighter-medal-overview">${renderMedalTotals(medals)}</div><div class="v2-fighter-medal-list">${medals.rows.map(row => `<article class="v2-fighter-medal-row"><strong>${escapeHTML(row.label)}</strong><span><b data-medal="gold">Or ${row.gold}</b><b data-medal="silver">Argent ${row.silver}</b><b data-medal="bronze">Bronze ${row.bronze}</b></span></article>`).join("")}</div>`
      : `<p class="v2-fighter-empty">Aucune médaille pour le moment.<br><small>Une victoire en finale donne l’or; une défaite en finale donne l’argent et une défaite en demi-finale donne le bronze.</small></p>`;
    return `<section class="v2-fighter-medals" aria-labelledby="v2-fighter-medals-title">
      <div class="v2-fighter-section-heading"><div><p class="eyebrow">Bilan de tournoi</p><h3 id="v2-fighter-medals-title">Médailles</h3></div><p>Les podiums de tous les tournois amateurs, y compris les compétitions indépendantes, sont conservés ici.</p></div>
      ${content}
    </section>`;
  }

  function render(rawContext) {
    const context = normalizeContext(rawContext);
    const nickname = context.profile.nickname ? ` « ${escapeHTML(context.profile.nickname)} »` : "";
    const record = context.careerStatus === "recreational"
      ? "Bilan amateur à venir"
      : `${context.record.wins} V · ${context.record.losses} D`;
    const compactMedals = context.careerStatus === "recreational"
      ? "À venir"
      : context.medals.count ? renderMedalTotals(context.medals, true) : "Aucune";
    return `<section class="v2-fighter-view" aria-labelledby="v2-fighter-title">
      <header class="v2-fighter-header">
        <div><p class="eyebrow">Fiche du boxeur</p><h2 id="v2-fighter-title">${escapeHTML(context.profile.firstName)}${nickname} ${escapeHTML(context.profile.lastName)}</h2></div>
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
            <div><dt>Médailles</dt><dd class="v2-fighter-medal-summary">${compactMedals}</dd></div>
            <div><dt>Argent</dt><dd class="money">${context.money} $</dd></div>
            ${context.privateLessonCredits > 0 ? `<div><dt>Cours privé offert</dt><dd>${context.privateLessonCredits} bon${context.privateLessonCredits > 1 ? "s" : ""}</dd></div>` : ""}
          </dl>
        </aside>
        <div class="v2-fighter-details">
          <section aria-labelledby="v2-fighter-progression-title">
            <div class="v2-fighter-section-heading"><div><p class="eyebrow">XP ciblée cumulative</p><h3 id="v2-fighter-progression-title">Tes quatre qualités de boxe</h3></div><p>L’entraînement crée de l’XP ciblée. Les nuits l’assimilent; atteindre le prochain seuil donne +1 à la qualité sans perdre l’excédent.</p></div>
            <div class="v2-fighter-stats">${STAT_KEYS.map(key => renderStat(key, context)).join("")}</div>
            <div data-v2-level-up-slot data-level-points="${context.levelProgress.manualPoints}" hidden></div>
          </section>
          ${renderMedalPalmares(context)}
          <section class="v2-fighter-private" aria-labelledby="v2-fighter-private-title">
            <div class="v2-fighter-section-heading"><div><p class="eyebrow">Développement ciblé</p><h3 id="v2-fighter-private-title">Programme privé</h3></div><p>Un entraîneur plus expérimenté coûte davantage, mais produit plus d’XP ciblée vers la qualité choisie.</p></div>
            ${renderPrivateProgram(context)}
          </section>
          <section class="v2-fighter-save" aria-labelledby="v2-fighter-save-title">
            <div><p class="eyebrow">Sauvegarde externe</p><h3 id="v2-fighter-save-title">Conserver une copie de ta carrière</h3><p>Le fichier contient ta progression complète et pourra être réimporté depuis l’écran d’accueil.</p></div>
            <button type="button" class="primary-button" data-v2-export-career>Télécharger la sauvegarde JSON</button>
          </section>
        </div>
      </div>
    </section>`;
  }

  return Object.freeze({ STAT_KEYS, STAT_LABELS, EXTENSION_SLOTS, xpForLevel, normalizeContext, render });
});
