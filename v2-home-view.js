(function attachBoxeurHomeView(root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.BoxeurHomeView = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createBoxeurHomeViewApi() {
  "use strict";

  const ZONES = Object.freeze([
    Object.freeze({
      id: "bed",
      label: "Lit",
      detail: "Dormir jusqu’à demain matin",
      action: "sleep",
    }),
    Object.freeze({
      id: "lounge",
      label: "Salon",
      detail: "Récupération active",
      action: "recover",
    }),
    Object.freeze({
      id: "kitchen",
      label: "Cuisine",
      detail: "Repas et poids · bientôt branché",
      disabled: true,
    }),
    Object.freeze({
      id: "basement",
      label: "Sous-sol",
      detail: "Entraînement de dépannage",
    }),
  ]);

  const ACTIONS = Object.freeze([
    Object.freeze({
      id: "sleep",
      label: "Dormir jusqu’à demain matin",
      help: "Passe à demain matin pour laisser le corps récupérer et assimiler la charge.",
    }),
    Object.freeze({
      id: "recover",
      label: "Récupération active",
      help: "Utilise une période pour bouger doucement et réduire la fatigue.",
    }),
    Object.freeze({
      id: "advance",
      label: "Avancer une période",
      help: "Laisse passer le prochain moment de la journée sans ajouter d’entraînement.",
    }),
  ]);

  function escapeHTML(value) {
    return String(value == null ? "" : value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function numberInRange(value, fallback, min, max) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return fallback;
    return Math.min(max, Math.max(min, numeric));
  }

  function wholeNumber(value, fallback, min, max) {
    return Math.round(numberInRange(value, fallback, min, max));
  }

  function normalizeAction(rawAction) {
    if (rawAction === false) {
      return { available: false, reason: "Cette action est indisponible pour le moment." };
    }
    const source = rawAction && typeof rawAction === "object" ? rawAction : {};
    return {
      available: source.available !== false,
      reason: source.reason || "Cette action est indisponible pour le moment.",
    };
  }

  function normalizeContext(rawContext) {
    const raw = rawContext && typeof rawContext === "object" ? rawContext : {};
    const profile = raw.profile && typeof raw.profile === "object" ? raw.profile : {};
    const clock = raw.clock && typeof raw.clock === "object" ? raw.clock : {};
    const condition = raw.condition && typeof raw.condition === "object" ? raw.condition : {};
    const rawActions = raw.actions && typeof raw.actions === "object" ? raw.actions : {};
    const recommendationTone = ["positive", "steady", "warning", "critical"].includes(condition.recommendationTone)
      ? condition.recommendationTone
      : "steady";
    const pendingLoad = condition.pendingLoad == null
      ? condition.stimulusLoad == null
        ? condition.loadToAssimilate
        : condition.stimulusLoad
      : condition.pendingLoad;

    return {
      profile: {
        firstName: profile.firstName || "Boxeur",
      },
      clock: {
        dayLabel: clock.dayLabel || raw.dayLabel || "Lundi",
        periodLabel: clock.periodLabel || raw.periodLabel || "Matin",
        dateLabel: clock.dateLabel || raw.dateLabel || "Date à confirmer",
      },
      condition: {
        energy: wholeNumber(condition.energy, 80, 0, 100),
        fatigue: wholeNumber(condition.fatigue, 10, 0, 100),
        pendingLoad: wholeNumber(pendingLoad, 0, 0, 100),
        recommendation: condition.recommendation || raw.nextRecommendation || "Garde un rythme équilibré et récupère avant d’ajouter une grosse charge.",
        recommendationDetail: condition.recommendationDetail || "Ton prochain choix devrait tenir compte de l’énergie, de la fatigue et du travail qu’il reste à assimiler.",
        recommendationTone,
      },
      actions: {
        sleep: normalizeAction(rawActions.sleep),
        recover: normalizeAction(rawActions.recover),
        advance: normalizeAction(rawActions.advance),
      },
    };
  }

  function renderHotspot(zone, context) {
    const action = zone.action ? context.actions[zone.action] : null;
    const unavailable = zone.disabled === true || (action && !action.available);
    const reasonId = `v2-home-zone-${zone.id}-reason`;
    const reason = zone.disabled
      ? "Cette fonction sera branchée avec le système de repas et de poids."
      : action && !action.available
        ? action.reason
        : "";
    const actionAttribute = zone.action ? ` data-v2-home-action="${zone.action}"` : "";
    const disabledAttributes = zone.disabled
      ? ` aria-disabled="true" aria-describedby="${reasonId}"`
      : unavailable ? ` disabled aria-disabled="true" aria-describedby="${reasonId}"` : "";
    const reasonMarkup = reason
      ? `<span class="v2-home-hotspot-reason" id="${reasonId}">${escapeHTML(reason)}</span>`
      : "";

    return `<div class="v2-home-hotspot-wrap v2-home-hotspot-${zone.id}">
      <button type="button" class="v2-home-hotspot" data-v2-home-zone="${zone.id}"${actionAttribute}${disabledAttributes} aria-label="${escapeHTML(zone.label)}. ${escapeHTML(zone.detail)}">
        <strong>${escapeHTML(zone.label)}</strong><small>${escapeHTML(zone.detail)}</small>
      </button>${reasonMarkup}
    </div>`;
  }

  function renderAction(action, context) {
    const state = context.actions[action.id];
    const helpId = `v2-home-action-${action.id}-help`;
    const detail = state.available ? action.help : state.reason;
    const disabledAttributes = state.available ? "" : " disabled aria-disabled=\"true\"";
    return `<div class="v2-home-action${state.available ? "" : " unavailable"}">
      <button type="button" data-v2-home-action="${action.id}" aria-describedby="${helpId}"${disabledAttributes}>${escapeHTML(action.label)}</button>
      <small id="${helpId}">${escapeHTML(detail)}</small>
    </div>`;
  }

  function render(rawContext) {
    const context = normalizeContext(rawContext);
    const hotspots = ZONES.map(zone => renderHotspot(zone, context)).join("");
    const actions = ACTIONS.map(action => renderAction(action, context)).join("");

    return `<div class="v2-home-view">
      <header class="v2-home-header">
        <div><p class="eyebrow">Maison</p><h2>Chez toi, ${escapeHTML(context.profile.firstName)}</h2></div>
        <button type="button" class="secondary-button" data-v2-leave-home>Retour à la carte</button>
      </header>
      <div class="v2-home-layout">
        <section class="v2-home-scene" aria-labelledby="v2-home-scene-title">
          <h3 id="v2-home-scene-title" class="sr-only">Pièces interactives de la maison</h3>
          <picture>
            <source media="(max-width: 640px)" srcset="assets/maison-v2-mobile.jpg">
            <img src="assets/maison-v2-desktop.jpg" width="1440" height="810" alt="Appartement illustré avec cuisine, salon, chambre et espace d’entraînement au sous-sol" />
          </picture>
          <div class="v2-home-hotspots">${hotspots}</div>
        </section>
        <aside class="v2-home-dashboard" aria-label="Maintenant et récupération">
          <section class="v2-home-now" aria-labelledby="v2-home-now-title">
            <p class="eyebrow">Maintenant</p><h3 id="v2-home-now-title">${escapeHTML(context.clock.dayLabel)} · ${escapeHTML(context.clock.periodLabel)}</h3>
            <p>${escapeHTML(context.clock.dateLabel)}</p>
          </section>
          <section class="v2-home-condition" aria-label="État de récupération">
            <div><span>Énergie</span><strong>${context.condition.energy} %</strong><meter min="0" max="100" value="${context.condition.energy}">${context.condition.energy} %</meter></div>
            <div><span>Fatigue</span><strong>${context.condition.fatigue} %</strong><meter min="0" max="100" value="${context.condition.fatigue}">${context.condition.fatigue} %</meter></div>
            <div><span>Charge à assimiler</span><strong>${context.condition.pendingLoad} %</strong><meter min="0" max="100" value="${context.condition.pendingLoad}">${context.condition.pendingLoad} %</meter></div>
          </section>
          <section class="v2-home-recommendation ${context.condition.recommendationTone}" aria-labelledby="v2-home-recommendation-title">
            <p class="eyebrow">Prochaine recommandation</p><h3 id="v2-home-recommendation-title">${escapeHTML(context.condition.recommendation)}</h3>
            <p>${escapeHTML(context.condition.recommendationDetail)}</p>
          </section>
          <section class="v2-home-actions" aria-labelledby="v2-home-actions-title">
            <h3 id="v2-home-actions-title">Gérer le temps et la récupération</h3>${actions}
          </section>
        </aside>
      </div>
    </div>`;
  }

  function renderResult(rawResult) {
    const result = rawResult && typeof rawResult === "object" ? rawResult : {};
    const title = result.title || "Récupération terminée";
    const summary = result.summary || "Le temps a avancé et ton état de récupération a été mis à jour.";
    const timeLabel = result.timeLabel || "Nouvel état disponible";
    const changes = Array.isArray(result.changes) ? result.changes.slice(0, 8) : [];
    const changeMarkup = changes.length
      ? changes.map(change => {
          const safeChange = change && typeof change === "object" ? change : {};
          const tone = ["positive", "neutral", "warning", "critical"].includes(safeChange.tone) ? safeChange.tone : "neutral";
          return `<li class="${tone}"><span>${escapeHTML(safeChange.label || "État")}</span><strong>${escapeHTML(safeChange.value || "—")}</strong></li>`;
        }).join("")
      : `<li class="neutral"><span>Bilan</span><strong>À jour</strong></li>`;
    const recommendation = result.recommendation
      ? `<p class="v2-home-result-recommendation"><strong>Prochaine recommandation :</strong> ${escapeHTML(result.recommendation)}</p>`
      : "";

    return `<section class="v2-home-result" aria-labelledby="v2-home-result-title" aria-live="polite">
      <p class="eyebrow">Bilan à la maison</p><h2 id="v2-home-result-title">${escapeHTML(title)}</h2>
      <p>${escapeHTML(summary)}</p><p class="v2-home-result-time">${escapeHTML(timeLabel)}</p>
      <ul class="v2-home-result-changes" aria-label="Effets de la récupération">${changeMarkup}</ul>
      ${recommendation}
      <div class="v2-home-result-actions"><button type="button" class="secondary-button" data-v2-home-result-close>Continuer à la maison</button><button type="button" class="primary-button" data-v2-leave-home>Retour à la carte</button></div>
    </section>`;
  }

  return Object.freeze({ ZONES, ACTIONS, normalizeContext, render, renderResult });
});
