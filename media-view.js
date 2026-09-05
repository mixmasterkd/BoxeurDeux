(function attachBoxeurMediaView(root, factory) {
  "use strict";
  const media = typeof module === "object" && module.exports
    ? require("./media-engine.js")
    : root && root.BoxeurMedia;
  const api = factory(media);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.BoxeurMediaView = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createBoxeurMediaViewApi(BoxeurMedia) {
  "use strict";

  if (!BoxeurMedia) throw new Error("BoxeurMediaView requiert BoxeurMedia.");

  const SCENES = Object.freeze({
    desktop: "assets/studio-media-desktop.jpg",
    mobile: "assets/studio-media-mobile.jpg",
  });
  const ACTIVITIES = Object.freeze(Object.values(BoxeurMedia.CATALOG));

  function escapeHTML(value) {
    return String(value == null ? "" : value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function wholeNumber(value, fallback, minimum = 0, maximum = 99999) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return fallback;
    return Math.round(Math.min(maximum, Math.max(minimum, numeric)));
  }

  function normalizeContext(rawContext) {
    const raw = rawContext && typeof rawContext === "object" ? rawContext : {};
    const profile = raw.profile && typeof raw.profile === "object" ? raw.profile : {};
    const clock = raw.careerClock && typeof raw.careerClock === "object" ? raw.careerClock : {};
    const status = raw.careerStatus === "professional" ? "professional" : raw.careerStatus === "amateur" ? "amateur" : "recreational";
    const rawActivities = Array.isArray(raw.activities) ? raw.activities : [];
    const activityStates = Object.fromEntries(ACTIVITIES.map(activity => {
      const supplied = rawActivities.find(item => item?.id === activity.id) || {};
      return [activity.id, {
        available: supplied.available !== false,
        reason: String(supplied.reason || ""),
        planned: supplied.planned === true,
        reputationLocked: supplied.reputationLocked === true,
        plannedEntryId: String(supplied.plannedEntryId || ""),
      }];
    }));
    return {
      profile: { firstName: String(profile.firstName || "Boxeur").slice(0, 60) },
      statusLabel: status === "professional" ? "Professionnel" : status === "amateur" ? "Amateur" : "Récréatif",
      week: wholeNumber(raw.week, 1, 1),
      dayLabel: String(clock.dayLabel || "Lundi · matin").slice(0, 80),
      dateLabel: String(raw.careerDateLabel || "date à confirmer").slice(0, 100),
      reputation: wholeNumber(raw.reputation, 0, 0, 100),
      capacityRemaining: wholeNumber(raw.capacityRemaining, 0, 0, 65),
      plannedEntryId: String(raw.plannedEntryId || ""),
      plannedActivityId: String(raw.plannedActivityId || ""),
      activityStates,
    };
  }

  function render(rawContext) {
    const context = normalizeContext(rawContext);
    const hotspots = ACTIVITIES.map(activity => {
      const state = context.activityStates[activity.id];
      const status = state.planned
        ? "Planifiée"
        : state.reputationLocked
          ? `Débloqué à ${activity.requiredReputation} réputation`
          : state.available
            ? `${activity.capacityCost} capacité · +${activity.reputationGain} réputation`
            : "Indisponible maintenant";
      const accessibleLabel = `${activity.label}. ${activity.detail}. ${state.reputationLocked ? `Verrouillée. ${state.reason}` : status}. Ouvrir les détails.`;
      return `<button type="button" class="career-media-hotspot career-media-hotspot-${activity.id}${state.planned ? " planned" : ""}${state.reputationLocked ? " locked" : ""}" data-career-media-activity="${activity.id}" aria-label="${escapeHTML(accessibleLabel)}"><strong>${escapeHTML(activity.label)}</strong><small>${escapeHTML(activity.detail)}</small><span>${escapeHTML(status)}</span></button>`;
    }).join("");
    const plannedActivity = BoxeurMedia.getActivity(context.plannedActivityId);
    const plannedCard = plannedActivity
      ? `<section class="career-media-planned career-place-card"><p class="eyebrow">Apparition planifiée</p><h3>${escapeHTML(plannedActivity.label)}</h3><p>La réputation sera ajoutée seulement lorsque la semaine sera confirmée.</p><button type="button" class="secondary-button" data-career-media-remove="${escapeHTML(context.plannedEntryId)}">Retirer l’apparition</button></section>`
      : `<section class="career-media-planned career-place-card"><p class="eyebrow">Visibilité de la semaine</p><h3>Aucune apparition planifiée</h3><p>Choisis une zone pour voir le temps demandé et la réputation obtenue.</p></section>`;

    return `<div class="career-media-view career-place-view">
      <header class="career-media-header career-place-header">
        <div><p class="eyebrow">Centre-ville · Studio média</p><h2>Fais connaître ton parcours, ${escapeHTML(context.profile.firstName)}</h2><p class="career-place-meta">${escapeHTML(context.statusLabel)} · Semaine ${context.week} · ${escapeHTML(context.dayLabel)} · ${escapeHTML(context.dateLabel)}</p></div>
        <button type="button" class="secondary-button" data-career-leave-media>Retour au Centre-ville</button>
      </header>
      <div class="career-media-layout career-place-layout">
        <section class="career-media-scene career-place-scene" aria-labelledby="career-media-scene-title">
          <h3 id="career-media-scene-title" class="sr-only">Possibilités du Studio média</h3>
          <picture><source media="(max-width: 640px)" srcset="${SCENES.mobile}"><img src="${SCENES.desktop}" width="1440" height="810" alt="Studio média illustré avec une zone d’entrevue, un plateau photo, une table de balado et une petite scène publique"></picture>
          <div class="career-media-hotspots">${hotspots}</div>
        </section>
        <aside class="career-media-dashboard career-place-dashboard" aria-label="Présentation du Studio média">
          <section class="career-media-welcome career-place-card"><p class="eyebrow">Réputation</p><h3>La visibilité demande du temps</h3><p>Une seule apparition peut être prévue par semaine. Elle augmente la réputation sans améliorer les statistiques de combat.</p></section>
          ${plannedCard}
          <section class="career-media-status career-place-card" role="status"><span>Situation actuelle</span><strong>${context.reputation}/100 réputation</strong><p>${context.capacityRemaining} points de capacité restent disponibles dans la semaine.</p></section>
          <section class="career-media-preview career-place-card"><p class="eyebrow">Aucun revenu automatique</p><h3>Un choix de carrière, pas un entraînement</h3><p>Consulter le studio est gratuit. Les apparitions n’accordent ni argent, ni XP, ni énergie; leur seul gain est affiché clairement.</p></section>
        </aside>
      </div>
    </div>`;
  }

  function renderMenu(rawContext, activityInput) {
    const context = normalizeContext(rawContext);
    const activity = BoxeurMedia.getActivity(activityInput);
    if (!activity) return "";
    const state = context.activityStates[activity.id];
    const samePlanned = state.planned;
    const replacing = Boolean(context.plannedActivityId && !samePlanned);
    const actionLabel = replacing ? `Remplacer par ${activity.label}` : `Ajouter ${activity.label} à ma semaine`;
    const reasonId = `career-media-menu-${activity.id}-reason`;
    const reason = state.available ? "" : state.reason || "Cette apparition n’est pas disponible maintenant.";
    const disabled = !state.available ? ` disabled aria-disabled="true" aria-describedby="${reasonId}"` : "";
    const currentPlan = replacing
      ? `<p class="career-media-replacement">Cette confirmation remplacera l’apparition déjà planifiée; aucun gain n’a encore été appliqué.</p>`
      : "";
    const remove = samePlanned
      ? `<button type="button" class="secondary-button" data-career-media-remove="${escapeHTML(context.plannedEntryId)}">Retirer de ma semaine</button>`
      : "";

    return `<section class="career-media-menu" aria-labelledby="career-media-menu-title">
      <header><div><p class="eyebrow">Studio média · proposition</p><h2 id="career-media-menu-title">${escapeHTML(activity.label)}</h2></div><button type="button" class="secondary-button" data-career-media-menu-close>Retour au studio</button></header>
      <p class="career-media-menu-lead">${escapeHTML(activity.description)}</p>
      <dl class="career-media-quote"><div><dt>Capacité</dt><dd>−${activity.capacityCost}</dd><small>Réservée dans la semaine</small></div><div><dt>Réputation</dt><dd>+${activity.reputationGain}</dd><small>Ajoutée à la confirmation</small></div></dl>
      <section class="career-media-effect"><span>Effet unique</span><strong>Visibilité</strong><p>Aucun argent, aucune XP et aucun changement d’énergie, de fatigue ou de statistique.</p></section>
      ${currentPlan}${reason ? `<p class="career-media-unavailable" id="${reasonId}" role="status">${escapeHTML(reason)}</p>` : ""}
      <footer><button type="button" class="secondary-button" data-career-media-menu-close>Annuler</button>${remove || `<button type="button" class="primary-button" data-career-media-confirm="${activity.id}"${disabled}>${escapeHTML(actionLabel)}</button>`}</footer>
    </section>`;
  }

  return Object.freeze({ SCENES, ACTIVITIES, normalizeContext, render, renderMenu });
});
