(function attachBoxeurWorkView(root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.BoxeurWorkView = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createBoxeurWorkViewApi() {
  "use strict";

  const JOB_SCENES = Object.freeze({
    convenience: Object.freeze({
      desktop: "assets/emploi-depanneur-v2-desktop.png",
      mobile: "assets/emploi-depanneur-v2-mobile.png",
      alt: "Intérieur d’un dépanneur avec comptoir, rayons et réserve",
    }),
    courier: Object.freeze({
      desktop: "assets/emploi-coursier-v2-desktop.png",
      mobile: "assets/emploi-coursier-v2-mobile.png",
      alt: "Intérieur d’un dépôt de coursier avec vélo cargo et colis",
    }),
    office: Object.freeze({
      desktop: "assets/emploi-bureau-v2-desktop.png",
      mobile: "assets/emploi-bureau-v2-mobile.png",
      alt: "Intérieur d’un bureau administratif avec postes de travail et salle de réunion",
    }),
    warehouse: Object.freeze({
      desktop: "assets/emploi-entrepot-v2-desktop.png",
      mobile: "assets/emploi-entrepot-v2-mobile.png",
      alt: "Intérieur d’un entrepôt de nuit avec palettes et quai de chargement",
    }),
  });

  const DEFAULT_OFFERS = Object.freeze([
    Object.freeze({ id: "convenience", title: "Commis de dépanneur", wage: 75, schedule: "Horaire souple", interviewWeeks: 1, energy: -14, fatigue: 10, weekCapacityCost: 15, detail: "La solution la moins payante, mais la plus facile à concilier avec le camp." }),
    Object.freeze({ id: "courier", title: "Coursier local", wage: 100, schedule: "Horaire variable", interviewWeeks: 2, energy: -20, fatigue: 16, weekCapacityCost: 22, detail: "Une meilleure paie hebdomadaire avec plus de kilomètres et de fatigue dans les jambes." }),
    Object.freeze({ id: "office", title: "Employé de bureau", wage: 120, schedule: "Bureau · longues heures", interviewWeeks: 2, energy: -14, fatigue: 7, weekCapacityCost: 30, detail: "Une paie solide et peu de fatigue physique, mais de longues journées de bureau." }),
    Object.freeze({ id: "warehouse", title: "Manutention de nuit", wage: 130, schedule: "Horaire exigeant", interviewWeeks: 3, energy: -27, fatigue: 23, weekCapacityCost: 30, detail: "La paie la plus élevée, au prix d’une lourde dépense physique." }),
  ]);

  function escapeHTML(value) {
    return String(value == null ? "" : value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function safeText(value, fallback = "", maxLength = 360) {
    const text = String(value == null ? "" : value).trim();
    return (text || fallback).slice(0, maxLength);
  }

  function wholeNumber(value, fallback, minimum = 0, maximum = 999999) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.round(Math.min(maximum, Math.max(minimum, number)));
  }

  function normalizeOffer(rawOffer, index) {
    const source = rawOffer && typeof rawOffer === "object" ? rawOffer : {};
    const fallback = DEFAULT_OFFERS[index] || DEFAULT_OFFERS[0];
    return {
      id: safeText(source.id, fallback.id, 80),
      title: safeText(source.title, fallback.title, 100),
      wage: wholeNumber(source.wage, fallback.wage, 0, 999999),
      schedule: safeText(source.schedule, fallback.schedule, 100),
      interviewWeeks: wholeNumber(source.interviewWeeks, fallback.interviewWeeks, 1, 99),
      energy: wholeNumber(source.energy, fallback.energy, -100, 100),
      fatigue: wholeNumber(source.fatigue, fallback.fatigue, -100, 100),
      weekCapacityCost: wholeNumber(source.weekCapacityCost, fallback.weekCapacityCost, 0, 100),
      detail: safeText(source.detail, fallback.detail, 260),
    };
  }

  function normalizeContext(rawContext) {
    const raw = rawContext && typeof rawContext === "object" ? rawContext : {};
    const profile = raw.profile && typeof raw.profile === "object" ? raw.profile : {};
    const clock = raw.v2Clock && typeof raw.v2Clock === "object" ? raw.v2Clock : {};
    const rawJob = raw.v2Job && typeof raw.v2Job === "object" ? raw.v2Job : null;
    const rawApplication = raw.jobApplication && typeof raw.jobApplication === "object" ? raw.jobApplication : null;
    const rawPlan = raw.v2WorkPlan && typeof raw.v2WorkPlan === "object" ? raw.v2WorkPlan : {};
    const offers = Array.isArray(raw.v2JobOffers) && raw.v2JobOffers.length
      ? raw.v2JobOffers.slice(0, 4).map(normalizeOffer)
      : DEFAULT_OFFERS;
    const job = rawJob
      ? {
        id: safeText(rawJob.id, "", 80),
        title: safeText(rawJob.title, "Emploi actif", 100),
        schedule: safeText(rawJob.schedule, "Horaire régulier", 100),
        wage: wholeNumber(rawJob.wage, 0, 0, 999999),
        detail: safeText(rawJob.detail, "Ton emploi est intégré à la semaine.", 260),
      }
      : null;
    const application = rawApplication
      ? {
        jobId: safeText(rawApplication.jobId, "", 80),
        title: safeText(raw.v2JobApplicationLabel, "Emploi visé", 100),
        progress: wholeNumber(rawApplication.progress, 0, 0, 99),
        requiredWeeks: wholeNumber(rawApplication.requiredWeeks, 1, 1, 99),
      }
      : null;
    return {
      profile: { firstName: safeText(profile.firstName, "Boxeur", 50) },
      clock: {
        week: wholeNumber(clock.week ?? raw.week, 1, 1, 99999),
        dayLabel: safeText(clock.dayLabel, "Lundi", 60),
        dateLabel: safeText(raw.v2DateLabel, "Date à confirmer", 100),
      },
      job,
      scene: job ? JOB_SCENES[job.id] || JOB_SCENES.convenience : null,
      application,
      offers,
      plan: {
        planned: rawPlan.planned !== false,
        available: rawPlan.available !== false,
        reason: safeText(rawPlan.reason, "", 260),
        cost: wholeNumber(rawPlan.cost, 0, 0, 100),
      },
      missedWorkWeeks: wholeNumber(raw.missedWorkWeeks, 0, 0, 2),
      firstJobRequired: raw.introJobRequired === true && wholeNumber(raw.jobsHeldCount, 0, 0, 999) === 0 && !job,
    };
  }

  function renderWorkZones(context) {
    if (!context.job) return "";
    const scheduleDetail = context.plan.planned
      ? `Travail prévu · −${context.plan.cost} capacité`
      : context.plan.available
        ? "Réintégrer le travail à la semaine"
        : `Travail indisponible · ${context.plan.reason}`;
    const applicationDetail = context.application
      ? `Candidature : ${context.application.progress}/${context.application.requiredWeeks}`
      : "Voir mon emploi et les offres";
    return `<div class="v2-work-hotspots" aria-label="Zones interactives de l’emploi">
      <button type="button" class="v2-work-hotspot v2-work-hotspot-schedule" data-v2-work-zone="schedule" aria-label="Horaire de la semaine. ${escapeHTML(scheduleDetail)}"><strong>Horaire</strong><small>${escapeHTML(scheduleDetail)}</small></button>
      <button type="button" class="v2-work-hotspot v2-work-hotspot-job" data-v2-work-zone="job" aria-label="Mon emploi. ${escapeHTML(applicationDetail)}"><strong>Mon emploi</strong><small>${escapeHTML(applicationDetail)}</small></button>
    </div>`;
  }

  function renderBoard(context) {
    const application = context.application
      ? `<p class="v2-work-board-application"><strong>Candidature en cours : ${escapeHTML(context.application.title)}</strong><span>${context.application.progress}/${context.application.requiredWeeks} semaine${context.application.requiredWeeks > 1 ? "s" : ""} écoulée${context.application.progress > 1 ? "s" : ""}</span></p>`
      : "";
    const headline = context.firstJobRequired ? "Ton premier emploi est requis" : "Choisis directement ton prochain emploi";
    const instructions = context.firstJobRequired
      ? "Choisis une feuille sur le babillard pour consulter les offres."
      : "Compare les conditions, puis sélectionne l’offre à laquelle tu veux postuler.";
    const offers = context.offers.map((offer, index) => {
      const targeted = context.application?.jobId === offer.id;
      const waitLabel = targeted
        ? `Candidature en cours · ${context.application.progress}/${context.application.requiredWeeks}`
        : `${offer.interviewWeeks} semaine${offer.interviewWeeks > 1 ? "s" : ""} d’attente`;
      const actionAttribute = context.firstJobRequired
        ? 'data-v2-work-zone="employment"'
        : `data-select-job="${escapeHTML(offer.id)}"`;
      const disabled = !context.firstJobRequired && targeted ? ' disabled aria-disabled="true"' : "";
      const accessibleAction = context.firstJobRequired ? "Consulter l’offre" : targeted ? "Candidature en cours" : "Postuler";
      return `<button type="button" class="v2-work-board-sheet v2-work-board-sheet-${index + 1}${targeted ? " selected" : ""}" ${actionAttribute}${disabled} aria-label="${accessibleAction} : ${escapeHTML(offer.title)}"><span class="v2-work-board-pin" aria-hidden="true"></span><small>OFFRE D’EMPLOI</small><strong>${escapeHTML(offer.title)}</strong><em>${offer.wage} $ / semaine</em><span class="v2-work-board-schedule">${escapeHTML(offer.schedule)}</span><span class="v2-work-board-status">${escapeHTML(waitLabel)}</span><span class="v2-work-board-effects">${offer.energy} énergie · +${offer.fatigue} fatigue · ${offer.weekCapacityCost} capacité</span><span class="v2-work-board-detail">${escapeHTML(offer.detail)}</span></button>`;
    }).join("");
    return `<section class="v2-work-board-scene" aria-labelledby="v2-work-board-title">
      <div class="v2-work-board-frame">
        <div class="v2-work-board-heading"><p class="eyebrow">Bureau d’emploi</p><h3 id="v2-work-board-title">${escapeHTML(headline)}</h3><p>${escapeHTML(instructions)}</p></div>
        <div class="v2-work-board-offers">${offers}</div>
        ${application}
      </div>
    </section>`;
  }

  function renderStatus(context) {
    if (!context.job) {
      const status = context.application
        ? `Candidature chez ${context.application.title} · ${context.application.progress}/${context.application.requiredWeeks}`
        : context.firstJobRequired ? "Premier emploi requis" : "Aucun emploi en cours";
      return `<section class="v2-work-status-card v2-place-card"><span>Situation d’emploi</span><strong>${escapeHTML(status)}</strong><p>${context.application ? "L’attente avance automatiquement à chaque semaine confirmée." : "Le babillard donne accès aux emplois sans modifier les règles de candidature."}</p></section>`;
    }
    const attendance = context.missedWorkWeeks
      ? `<p class="v2-work-attendance-warning"><strong>${context.missedWorkWeeks}/3 absence${context.missedWorkWeeks > 1 ? "s" : ""} injustifiée${context.missedWorkWeeks > 1 ? "s" : ""} cumulée${context.missedWorkWeeks > 1 ? "s" : ""}.</strong> Elles restent au dossier chez cet employeur; la troisième entraîne le congédiement.</p>`
      : "";
    return `<section class="v2-work-status-card v2-place-card"><span>Emploi actuel</span><strong>${escapeHTML(context.job.title)}</strong><dl><div><dt>Paie hebdomadaire</dt><dd>${context.job.wage} $</dd></div><div><dt>Horaire</dt><dd>${escapeHTML(context.job.schedule)}</dd></div></dl><p>${escapeHTML(context.job.detail)}</p>${attendance}</section>`;
  }

  function render(rawContext) {
    const context = normalizeContext(rawContext);
    const scene = context.job && context.scene
      ? `<section class="v2-work-scene v2-place-scene" aria-labelledby="v2-work-scene-title"><h3 id="v2-work-scene-title" class="sr-only">Zones interactives de l’emploi</h3><picture><source media="(max-width: 640px)" srcset="${escapeHTML(context.scene.mobile)}"><img src="${escapeHTML(context.scene.desktop)}" width="1672" height="941" alt="${escapeHTML(context.scene.alt)}"></picture>${renderWorkZones(context)}</section>`
      : renderBoard(context);
    return `<div class="v2-work-view v2-place-view${context.job ? ` v2-work-view-${escapeHTML(context.job.id)}` : " v2-work-view-unemployed"}">
      <header class="v2-work-header v2-place-header"><div><p class="eyebrow">Emploi</p><h2 data-v2-developer-secret>${context.job ? escapeHTML(context.job.title) : "Bureau d’emploi"}</h2><p class="v2-place-meta">Semaine ${context.clock.week} · ${escapeHTML(context.clock.dayLabel)} · ${escapeHTML(context.clock.dateLabel)}</p></div><button type="button" class="secondary-button" data-v2-leave-work>Retour à la carte</button></header>
      <div class="v2-work-layout v2-place-layout">${scene}<aside class="v2-work-dashboard v2-place-dashboard" aria-label="Situation d’emploi">${renderStatus(context)}</aside></div>
    </div>`;
  }

  function renderScheduleMenu(context) {
    if (!context.job) return "";
    const status = context.plan.planned
      ? `Le travail est prévu cette semaine et réserve ${context.plan.cost} points de capacité. Tu peux le retirer avant la confirmation.`
      : context.plan.available
        ? "Tu as retiré le travail de cette semaine : la capacité est libérée, mais tu ne recevras aucune paie et cette semaine comptera comme une absence."
        : context.plan.reason || "Ton état actuel ne permet pas d’assurer le travail cette semaine.";
    const buttonLabel = context.plan.planned
      ? "Retirer le travail de ma semaine"
      : context.plan.available ? "Ajouter le travail à ma semaine" : "Travail indisponible cette semaine";
    return `<section class="v2-work-menu" aria-labelledby="v2-work-menu-title"><header><div><p class="eyebrow">${escapeHTML(context.job.title)}</p><h2 id="v2-work-menu-title">Horaire de la semaine</h2></div><button type="button" class="secondary-button" data-v2-work-menu-close>Retour à l’emploi</button></header><div class="v2-work-menu-card"><p><strong>Le salaire affiché est hebdomadaire.</strong> ${escapeHTML(status)}</p><button type="button" class="${context.plan.planned ? "secondary-button" : "primary-button"}" data-v2-toggle-work aria-pressed="${context.plan.planned}"${!context.plan.planned && !context.plan.available ? " disabled aria-disabled=\"true\"" : ""}>${buttonLabel}</button></div></section>`;
  }

  function renderJobMenu(context) {
    if (!context.job) return "";
    const application = context.application
      ? `<p>Candidature en cours : <strong>${escapeHTML(context.application.title)}</strong> · ${context.application.progress}/${context.application.requiredWeeks} semaine${context.application.requiredWeeks > 1 ? "s" : ""} écoulée${context.application.progress > 1 ? "s" : ""}.</p>`
      : "";
    return `<section class="v2-work-menu" aria-labelledby="v2-work-menu-title"><header><div><p class="eyebrow">Emploi actuel</p><h2 id="v2-work-menu-title">${escapeHTML(context.job.title)}</h2></div><button type="button" class="secondary-button" data-v2-work-menu-close>Retour à l’emploi</button></header><div class="v2-work-menu-card"><dl><div><dt>Paie de la semaine</dt><dd>${context.job.wage} $</dd></div><div><dt>Horaire</dt><dd>${escapeHTML(context.job.schedule)}</dd></div></dl><p>${escapeHTML(context.job.detail)}</p>${application}<button type="button" class="secondary-button" data-v2-open-job-menu>${context.application ? "Voir ou changer la candidature" : "Voir les offres d’emploi"}</button></div></section>`;
  }

  function renderMenu(menuId, rawContext) {
    const context = normalizeContext(rawContext);
    if (menuId === "schedule") return renderScheduleMenu(context);
    if (menuId === "job") return renderJobMenu(context);
    return "";
  }

  return Object.freeze({ JOB_SCENES, normalizeContext, render, renderMenu });
});
