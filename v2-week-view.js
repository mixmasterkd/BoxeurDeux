(function attachBoxeurWeekView(root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.BoxeurWeekView = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createBoxeurWeekViewApi() {
  "use strict";

  function escapeHTML(value) {
    return String(value == null ? "" : value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function boundedNumber(value, fallback, min, max) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return fallback;
    return Math.min(max, Math.max(min, numeric));
  }

  function normalizeItem(rawItem) {
    const item = rawItem && typeof rawItem === "object" ? rawItem : {};
    return {
      label: item.label || "Routine",
      detail: item.detail || "Incluse dans la semaine.",
      tone: ["positive", "neutral", "warning", "critical"].includes(item.tone) ? item.tone : "neutral",
    };
  }

  function normalizeContext(rawContext) {
    const raw = rawContext && typeof rawContext === "object" ? rawContext : {};
    const quick = raw.quick && typeof raw.quick === "object" ? raw.quick : {};
    const detailed = raw.detailed && typeof raw.detailed === "object" ? raw.detailed : {};
    return {
      week: Math.round(boundedNumber(raw.week, 1, 1, 99999)),
      mode: raw.mode === "detailed" ? "detailed" : "quick",
      coachName: raw.coachName || "l’entraîneur du GYM",
      quick: {
        available: quick.available !== false,
        reason: quick.reason || "",
        label: quick.label || "Suivre le plan rapide",
        detail: quick.detail || "Travail, entraînement et récupération sont regroupés dans un seul bilan.",
      },
      detailed: {
        label: detailed.label || "Jouer la semaine en détail",
        detail: detailed.detail || "Visite les lieux et choisis toi-même tes séances et tes moments de récupération.",
        activitiesCompleted: Math.round(boundedNumber(detailed.activitiesCompleted, 0, 0, 99)),
        periodsRemaining: Math.round(boundedNumber(detailed.periodsRemaining, 21, 0, 21)),
        canHandOff: detailed.canHandOff === true,
      },
      plan: {
        title: raw.plan?.title || "Semaine équilibrée",
        summary: raw.plan?.summary || "Le plan protège la récupération tout en maintenant le rythme de boxe.",
        tradeoff: raw.plan?.tradeoff || "Tu laisses l’entraîneur répartir la charge au lieu de cibler toi-même une statistique.",
        items: Array.isArray(raw.plan?.items) ? raw.plan.items.slice(0, 8).map(normalizeItem) : [],
      },
    };
  }

  function renderLauncher(rawContext) {
    const context = normalizeContext(rawContext);
    const quickDisabled = context.quick.available ? "" : ' disabled aria-disabled="true"';
    const reason = context.quick.reason
      ? `<p class="v2-week-blocker" role="status">${escapeHTML(context.quick.reason)}</p>`
      : "";
    const handOff = context.detailed.canHandOff
      ? `<button type="button" class="primary-button" data-v2-week-handoff>Confier le reste au coach</button>`
      : "";
    const status = context.mode === "detailed"
      ? `<p class="v2-week-mode-status"><strong>Mode détaillé</strong> · ${context.detailed.activitiesCompleted} activité${context.detailed.activitiesCompleted > 1 ? "s" : ""} terminée${context.detailed.activitiesCompleted > 1 ? "s" : ""} · ${context.detailed.periodsRemaining} périodes restantes</p>`
      : `<p class="v2-week-mode-status"><strong>Mode rapide recommandé</strong> · environ 20 à 45 secondes</p>`;

    return `<section class="v2-week-launcher" aria-labelledby="v2-week-launcher-title">
      <p class="eyebrow">Semaine ${context.week} · à ton rythme</p>
      <h3 id="v2-week-launcher-title">Une décision importante, pas vingt-et-un clics</h3>
      ${status}
      <div class="v2-week-launcher-actions">
        <button type="button" class="primary-button" data-v2-week-quick${quickDisabled}>${escapeHTML(context.quick.label)}</button>
        <button type="button" class="secondary-button" data-v2-week-detailed>${escapeHTML(context.detailed.label)}</button>
        ${handOff}
      </div>
      ${reason}
    </section>`;
  }

  function renderPlan(rawContext) {
    const context = normalizeContext(rawContext);
    const items = context.plan.items.length
      ? context.plan.items.map(item => `<li class="${item.tone}"><strong>${escapeHTML(item.label)}</strong><span>${escapeHTML(item.detail)}</span></li>`).join("")
      : `<li class="neutral"><strong>Routine équilibrée</strong><span>Le détail sera calculé au moment de confirmer.</span></li>`;
    return `<section class="v2-week-plan" aria-labelledby="v2-week-plan-title">
      <header><div><p class="eyebrow">Programme de ${escapeHTML(context.coachName)}</p><h2 id="v2-week-plan-title">${escapeHTML(context.plan.title)}</h2></div><button type="button" data-v2-week-plan-close aria-label="Fermer le programme rapide">Fermer</button></header>
      <p>${escapeHTML(context.plan.summary)}</p>
      <ul class="v2-week-plan-items" aria-label="Contenu du programme">${items}</ul>
      <p class="v2-week-tradeoff"><strong>Compromis :</strong> ${escapeHTML(context.plan.tradeoff)}</p>
      <p class="v2-week-engine-note">Le mode rapide utilise les mêmes activités, coûts et règles de récupération que le mode détaillé.</p>
      <footer><button type="button" class="secondary-button" data-v2-week-plan-close>Retour</button><button type="button" class="primary-button" data-v2-week-confirm${context.quick.available ? "" : ' disabled aria-disabled="true"'}>Lancer la semaine rapide</button></footer>
    </section>`;
  }

  function renderSummary(rawSummary) {
    const raw = rawSummary && typeof rawSummary === "object" ? rawSummary : {};
    const changes = Array.isArray(raw.changes) ? raw.changes.slice(0, 10).map(normalizeItem) : [];
    const events = Array.isArray(raw.events) ? raw.events.slice(0, 8).map(normalizeItem) : [];
    const changesMarkup = changes.length
      ? changes.map(item => `<li class="${item.tone}"><span>${escapeHTML(item.label)}</span><strong>${escapeHTML(item.detail)}</strong></li>`).join("")
      : `<li class="neutral"><span>Bilan</span><strong>Semaine terminée</strong></li>`;
    const eventsMarkup = events.length
      ? `<section class="v2-week-summary-events" aria-labelledby="v2-week-alerts-title"><h3 id="v2-week-alerts-title">À retenir</h3><ul>${events.map(item => `<li class="${item.tone}"><strong>${escapeHTML(item.label)}</strong><span>${escapeHTML(item.detail)}</span></li>`).join("")}</ul></section>`
      : "";
    const weekFrom = Math.round(boundedNumber(raw.weekFrom, 1, 1, 99999));
    const weekTo = Math.round(boundedNumber(raw.weekTo, weekFrom + 1, weekFrom, 99999));
    return `<section class="v2-week-summary" aria-labelledby="v2-week-summary-title" aria-live="polite">
      <p class="eyebrow">Semaine ${weekFrom} terminée</p><h2 id="v2-week-summary-title">${escapeHTML(raw.title || `Bienvenue à la semaine ${weekTo}`)}</h2>
      <p>${escapeHTML(raw.summary || "Ton programme, ton emploi et ta récupération ont été résolus.")}</p>
      <ul class="v2-week-summary-changes" aria-label="Changements de la semaine">${changesMarkup}</ul>
      ${eventsMarkup}
      <div class="v2-week-summary-actions"><button type="button" class="primary-button" data-v2-week-summary-close>Retour à la carte</button></div>
    </section>`;
  }

  return Object.freeze({ normalizeContext, renderLauncher, renderPlan, renderSummary });
});
