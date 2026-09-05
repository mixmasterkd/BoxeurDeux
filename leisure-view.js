(function attachBoxeurLeisureView(root, factory) {
  "use strict";
  const leisure = typeof module === "object" && module.exports
    ? require("./leisure-engine.js")
    : root && root.BoxeurLeisure;
  const api = factory(leisure);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.BoxeurLeisureView = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createBoxeurLeisureViewApi(BoxeurLeisure) {
  "use strict";

  if (!BoxeurLeisure) throw new Error("BoxeurLeisureView requiert BoxeurLeisure.");

  const SCENES = Object.freeze({
    desktop: "assets/centre-loisirs-desktop.jpg",
    mobile: "assets/centre-loisirs-mobile.jpg",
  });
  const ACTIVITIES = Object.freeze(Object.values(BoxeurLeisure.CATALOG));

  function escapeHTML(value) {
    return String(value == null ? "" : value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function wholeNumber(value, fallback, minimum = 1, maximum = 99999) {
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
        plannedEntryId: String(supplied.plannedEntryId || ""),
      }];
    }));
    return {
      profile: { firstName: String(profile.firstName || "Boxeur").slice(0, 60) },
      statusLabel: status === "professional" ? "Professionnel" : status === "amateur" ? "Amateur" : "Récréatif",
      week: wholeNumber(raw.week, 1),
      dayLabel: String(clock.dayLabel || "Lundi · matin").slice(0, 80),
      dateLabel: String(raw.careerDateLabel || "date à confirmer").slice(0, 100),
      money: wholeNumber(raw.money, 0, 0, 9999999),
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
      const status = state.planned ? "Planifiée" : `${activity.price} $ · ${activity.capacityCost} capacité`;
      const accessibleLabel = `${activity.label}. ${activity.detail}. ${status}. Ouvrir les détails.`;
      return `<button type="button" class="career-leisure-hotspot career-leisure-hotspot-${activity.id}${state.planned ? " planned" : ""}" data-career-leisure-activity="${activity.id}" aria-label="${escapeHTML(accessibleLabel)}"><strong>${escapeHTML(activity.label)}</strong><small>${escapeHTML(activity.detail)}</small><span>${escapeHTML(status)}</span></button>`;
    }).join("");
    const plannedActivity = BoxeurLeisure.getActivity(context.plannedActivityId);
    const plannedCard = plannedActivity
      ? `<section class="career-leisure-planned career-place-card"><p class="eyebrow">Sortie planifiée</p><h3>${escapeHTML(plannedActivity.label)}</h3><p>${plannedActivity.price} $ seront débités seulement à la confirmation de la semaine.</p><button type="button" class="secondary-button" data-career-leisure-remove="${escapeHTML(context.plannedEntryId)}">Retirer la sortie</button></section>`
      : `<section class="career-leisure-planned career-place-card"><p class="eyebrow">Sortie de la semaine</p><h3>Aucune sortie planifiée</h3><p>Choisis une zone pour voir son prix, sa capacité et ses effets avant de confirmer.</p></section>`;

    return `<div class="career-leisure-view career-place-view">
      <header class="career-leisure-header career-place-header">
        <div><p class="eyebrow">Centre-ville · Centre de loisirs</p><h2>Une pause bien méritée, ${escapeHTML(context.profile.firstName)}</h2><p class="career-place-meta">${escapeHTML(context.statusLabel)} · Semaine ${context.week} · ${escapeHTML(context.dayLabel)} · ${escapeHTML(context.dateLabel)}</p></div>
        <button type="button" class="secondary-button" data-career-leave-leisure>Retour au Centre-ville</button>
      </header>
      <div class="career-leisure-layout career-place-layout">
        <section class="career-leisure-scene career-place-scene" aria-labelledby="career-leisure-scene-title">
          <h3 id="career-leisure-scene-title" class="sr-only">Activités du Centre de loisirs</h3>
          <picture><source media="(max-width: 640px)" srcset="${SCENES.mobile}"><img src="${SCENES.desktop}" width="1440" height="810" alt="Intérieur illustré du Centre de loisirs avec des quilles, un cinéma, une arcade et une piste de karting"></picture>
          <div class="career-leisure-hotspots">${hotspots}</div>
        </section>
        <aside class="career-leisure-dashboard career-place-dashboard" aria-label="Présentation du Centre de loisirs">
          <section class="career-leisure-welcome career-place-card"><p class="eyebrow">Sorties et amis</p><h3>Un lieu, quatre façons de décrocher</h3><p>Une seule sortie peut être prévue par semaine. Elle aide à récupérer un peu, sans remplacer une vraie journée de repos.</p></section>
          ${plannedCard}
          <section class="career-leisure-status career-place-card" role="status"><span>Disponible maintenant</span><strong>${context.money} $ · ${context.capacityRemaining} capacité</strong><p>Le prix sera payé seulement lorsque tu confirmeras et vivras la semaine.</p></section>
          <section class="career-leisure-preview career-place-card"><p class="eyebrow">Choix transparents</p><h3>Tout est affiché avant de confirmer</h3><p>Chaque sortie indique son prix, son temps et ses effets réels sur la semaine avant d’être ajoutée au programme.</p></section>
        </aside>
      </div>
    </div>`;
  }

  function renderMenu(rawContext, activityInput) {
    const context = normalizeContext(rawContext);
    const activity = BoxeurLeisure.getActivity(activityInput);
    if (!activity) return "";
    const state = context.activityStates[activity.id];
    const samePlanned = state.planned;
    const replacing = Boolean(context.plannedActivityId && !samePlanned);
    const actionLabel = replacing ? `Remplacer par ${activity.label}` : `Ajouter ${activity.label} à ma semaine`;
    const reasonId = `career-leisure-menu-${activity.id}-reason`;
    const reason = state.available ? "" : state.reason || "Cette sortie n’est pas disponible maintenant.";
    const disabled = !state.available ? ` disabled aria-disabled="true" aria-describedby="${reasonId}"` : "";
    const currentPlan = replacing
      ? `<p class="career-leisure-replacement">Cette confirmation remplacera la sortie déjà planifiée. Aucun argent n’a encore été dépensé.</p>`
      : "";
    const remove = samePlanned
      ? `<button type="button" class="secondary-button" data-career-leisure-remove="${escapeHTML(context.plannedEntryId)}">Retirer de ma semaine</button>`
      : "";

    return `<section class="career-leisure-menu" aria-labelledby="career-leisure-menu-title">
      <header><div><p class="eyebrow">Centre de loisirs · fiche de sortie</p><h2 id="career-leisure-menu-title">${escapeHTML(activity.label)}</h2></div><button type="button" class="secondary-button" data-career-leisure-menu-close>Retour au centre</button></header>
      <p class="career-leisure-menu-lead">${escapeHTML(activity.description)}</p>
      <dl class="career-leisure-quote"><div><dt>Prix</dt><dd>${activity.price} $</dd><small>Débité à la confirmation</small></div><div><dt>Capacité</dt><dd>−${activity.capacityCost}</dd><small>Sur la semaine</small></div><div><dt>Énergie</dt><dd>+${activity.energyGain}</dd><small>Effet de la sortie</small></div><div><dt>Fatigue</dt><dd>−${activity.fatigueRelief}</dd><small>Effet de la sortie</small></div></dl>
      <section class="career-leisure-effect"><span>Résultat</span><strong>Détendu</strong><p>Aucune XP et aucun bonus de statistique. Les effets affichés ci-dessus sont les seuls effets de cette sortie.</p></section>
      ${currentPlan}${reason ? `<p class="career-leisure-unavailable" id="${reasonId}" role="status">${escapeHTML(reason)}</p>` : ""}
      <footer><button type="button" class="secondary-button" data-career-leisure-menu-close>Annuler</button>${remove || `<button type="button" class="primary-button" data-career-leisure-confirm="${activity.id}"${disabled}>${escapeHTML(actionLabel)}</button>`}</footer>
    </section>`;
  }

  return Object.freeze({ SCENES, ACTIVITIES, normalizeContext, render, renderMenu });
});
