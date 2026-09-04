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
    const clock = raw.careerClock && typeof raw.careerClock === "object" ? raw.careerClock : {};
    const rawJob = raw.careerJob && typeof raw.careerJob === "object" ? raw.careerJob : null;
    const rawApplication = raw.jobApplication && typeof raw.jobApplication === "object" ? raw.jobApplication : null;
    const rawPlan = raw.careerWorkPlan && typeof raw.careerWorkPlan === "object" ? raw.careerWorkPlan : {};
    const rawVacation = raw.careerVacation && typeof raw.careerVacation === "object" ? raw.careerVacation : {};
    const offers = Array.isArray(raw.careerJobOffers) && raw.careerJobOffers.length
      ? raw.careerJobOffers.slice(0, 4).map(normalizeOffer)
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
        title: safeText(raw.careerJobApplicationLabel, "Emploi visé", 100),
        progress: wholeNumber(rawApplication.progress, 0, 0, 99),
        requiredWeeks: wholeNumber(rawApplication.requiredWeeks, 1, 1, 99),
      }
      : null;
    return {
      profile: { firstName: safeText(profile.firstName, "Boxeur", 50) },
      clock: {
        week: wholeNumber(clock.week ?? raw.week, 1, 1, 99999),
        dayLabel: safeText(clock.dayLabel, "Lundi", 60),
        dateLabel: safeText(raw.careerDateLabel, "Date à confirmer", 100),
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
      vacation: {
        bankWeeks: wholeNumber(rawVacation.bankWeeks ?? raw.vacationBankWeeks, 0, 0, 3),
        maxBankWeeks: wholeNumber(rawVacation.maxBankWeeks, 3, 1, 12),
        tenureWeeks: wholeNumber(rawVacation.tenureWeeks ?? raw.jobTenureWeeks, 0, 0, 99999),
        nextAtTenure: wholeNumber(rawVacation.nextAtTenure, 8, 1, 99999),
        nextInWeeks: rawVacation.nextInWeeks == null
          ? null
          : wholeNumber(rawVacation.nextInWeeks, 0, 0, 99999),
        firstAtWeeks: wholeNumber(rawVacation.firstAtWeeks, 8, 1, 99999),
        intervalWeeks: wholeNumber(rawVacation.intervalWeeks, 12, 1, 99999),
        planned: rawVacation.planned === true,
        available: rawVacation.available === true,
        weeklyPay: wholeNumber(rawVacation.weeklyPay, job?.wage || 0, 0, 999999),
      },
      missedWorkWeeks: wholeNumber(raw.missedWorkWeeks, 0, 0, 2),
      firstJobRequired: raw.introJobRequired === true && wholeNumber(raw.jobsHeldCount, 0, 0, 999) === 0 && !job,
    };
  }

  function vacationCopy(vacation) {
    const full = vacation.bankWeeks >= vacation.maxBankWeeks;
    const bankLabel = `${vacation.bankWeeks}/${vacation.maxBankWeeks} semaine${vacation.bankWeeks === 1 ? "" : "s"} en banque`;
    if (full) {
      return {
        bankLabel,
        nextLabel: "Banque complète",
        detail: `La banque est au maximum. Elle peut contenir jusqu’à ${vacation.maxBankWeeks} semaines payées.`,
      };
    }
    const remaining = vacation.nextInWeeks == null
      ? Math.max(0, vacation.nextAtTenure - vacation.tenureWeeks)
      : vacation.nextInWeeks;
    const nextLabel = remaining <= 0
      ? "Crédit à la prochaine semaine travaillée"
      : remaining === 1
        ? "Prochaine semaine après 1 semaine travaillée"
        : `Prochaine semaine après ${remaining} semaines travaillées`;
    return {
      bankLabel,
      nextLabel,
      detail: `La première semaine est acquise après ${vacation.firstAtWeeks} semaines travaillées chez le même employeur, puis une autre toutes les ${vacation.intervalWeeks} semaines.`,
    };
  }

  function renderVacationStatus(context, compact = false) {
    const copy = vacationCopy(context.vacation);
    const pips = Array.from({ length: context.vacation.maxBankWeeks }, (_, index) => `<span${index < context.vacation.bankWeeks ? ' class="filled"' : ""} aria-hidden="true"></span>`).join("");
    const tag = compact ? "div" : "section";
    const cardClass = compact ? "career-work-vacation-summary" : "career-work-vacation-card career-place-card";
    const planned = context.vacation.planned
      ? `<em class="career-work-vacation-planned">Prévues cette semaine · ${context.vacation.weeklyPay} $ de paie maintenue</em>`
      : "";
    return `<${tag} class="${cardClass}"><span>Vacances payées</span><strong>${escapeHTML(copy.bankLabel)}</strong>${planned}<div class="career-work-vacation-meter" role="img" aria-label="${escapeHTML(copy.bankLabel)}">${pips}</div><p><b>${escapeHTML(copy.nextLabel)}.</b> ${escapeHTML(copy.detail)}</p></${tag}>`;
  }

  function renderWorkZones(context) {
    if (!context.job) return "";
    const scheduleDetail = context.vacation.planned
      ? `Vacances prévues · ${context.vacation.weeklyPay} $ maintenus`
      : context.plan.planned
        ? `Travail prévu · −${context.plan.cost} capacité`
        : context.plan.available
          ? "Réintégrer le travail à la semaine"
          : `Travail indisponible · ${context.plan.reason}`;
    const applicationDetail = context.application
      ? `Candidature : ${context.application.progress}/${context.application.requiredWeeks}`
      : "Voir mon emploi et les offres";
    return `<div class="career-work-hotspots" aria-label="Zones interactives de l’emploi">
      <button type="button" class="career-work-hotspot career-work-hotspot-schedule" data-career-work-zone="schedule" aria-label="Horaire de la semaine. ${escapeHTML(scheduleDetail)}"><strong>Horaire</strong><small>${escapeHTML(scheduleDetail)}</small></button>
      <button type="button" class="career-work-hotspot career-work-hotspot-job" data-career-work-zone="job" aria-label="Mon emploi. ${escapeHTML(applicationDetail)}"><strong>Mon emploi</strong><small>${escapeHTML(applicationDetail)}</small></button>
    </div>`;
  }

  function renderBoard(context) {
    const application = context.application
      ? `<p class="career-work-board-application"><strong>Candidature en cours : ${escapeHTML(context.application.title)}</strong><span>${context.application.progress}/${context.application.requiredWeeks} semaine${context.application.requiredWeeks > 1 ? "s" : ""} écoulée${context.application.progress > 1 ? "s" : ""}</span></p>`
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
        ? 'data-career-work-zone="employment"'
        : `data-select-job="${escapeHTML(offer.id)}"`;
      const disabled = !context.firstJobRequired && targeted ? ' disabled aria-disabled="true"' : "";
      const accessibleAction = context.firstJobRequired ? "Consulter l’offre" : targeted ? "Candidature en cours" : "Postuler";
      return `<button type="button" class="career-work-board-sheet career-work-board-sheet-${index + 1}${targeted ? " selected" : ""}" ${actionAttribute}${disabled} aria-label="${accessibleAction} : ${escapeHTML(offer.title)}"><span class="career-work-board-pin" aria-hidden="true"></span><small>OFFRE D’EMPLOI</small><strong>${escapeHTML(offer.title)}</strong><em>${offer.wage} $ / semaine</em><span class="career-work-board-schedule">${escapeHTML(offer.schedule)}</span><span class="career-work-board-status">${escapeHTML(waitLabel)}</span><span class="career-work-board-effects">${offer.energy} énergie · +${offer.fatigue} fatigue · ${offer.weekCapacityCost} capacité</span><span class="career-work-board-detail">${escapeHTML(offer.detail)}</span></button>`;
    }).join("");
    return `<section class="career-work-board-scene" aria-labelledby="career-work-board-title">
      <div class="career-work-board-frame">
        <div class="career-work-board-heading"><p class="eyebrow">Bureau d’emploi</p><h3 id="career-work-board-title">${escapeHTML(headline)}</h3><p>${escapeHTML(instructions)}</p></div>
        <div class="career-work-board-offers">${offers}</div>
        ${application}
      </div>
    </section>`;
  }

  function renderStatus(context) {
    if (!context.job) {
      const status = context.application
        ? `Candidature chez ${context.application.title} · ${context.application.progress}/${context.application.requiredWeeks}`
        : context.firstJobRequired ? "Premier emploi requis" : "Aucun emploi en cours";
      return `<section class="career-work-status-card career-place-card"><span>Situation d’emploi</span><strong>${escapeHTML(status)}</strong><p>${context.application ? "L’attente avance automatiquement à chaque semaine confirmée." : "Le babillard donne accès aux emplois sans modifier les règles de candidature."}</p></section>`;
    }
    const attendance = context.missedWorkWeeks
      ? `<p class="career-work-attendance-warning"><strong>${context.missedWorkWeeks}/3 absence${context.missedWorkWeeks > 1 ? "s" : ""} injustifiée${context.missedWorkWeeks > 1 ? "s" : ""} cumulée${context.missedWorkWeeks > 1 ? "s" : ""}.</strong> Elles restent au dossier chez cet employeur; la troisième entraîne le congédiement.</p>`
      : "";
    return `<section class="career-work-status-card career-place-card"><span>Emploi actuel</span><strong>${escapeHTML(context.job.title)}</strong><dl><div><dt>Paie hebdomadaire</dt><dd>${context.job.wage} $</dd></div><div><dt>Horaire</dt><dd>${escapeHTML(context.job.schedule)}</dd></div></dl><p>${escapeHTML(context.job.detail)}</p>${attendance}</section>${renderVacationStatus(context)}`;
  }

  function render(rawContext) {
    const context = normalizeContext(rawContext);
    const scene = context.job && context.scene
      ? `<section class="career-work-scene career-place-scene" aria-labelledby="career-work-scene-title"><h3 id="career-work-scene-title" class="sr-only">Zones interactives de l’emploi</h3><picture><source media="(max-width: 640px)" srcset="${escapeHTML(context.scene.mobile)}"><img src="${escapeHTML(context.scene.desktop)}" width="1672" height="941" alt="${escapeHTML(context.scene.alt)}"></picture>${renderWorkZones(context)}</section>`
      : renderBoard(context);
    return `<div class="career-work-view career-place-view${context.job ? ` career-work-view-${escapeHTML(context.job.id)}` : " career-work-view-unemployed"}">
      <header class="career-work-header career-place-header"><div><p class="eyebrow">Emploi</p><h2 data-career-developer-secret>${context.job ? escapeHTML(context.job.title) : "Bureau d’emploi"}</h2><p class="career-place-meta">Semaine ${context.clock.week} · ${escapeHTML(context.clock.dayLabel)} · ${escapeHTML(context.clock.dateLabel)}</p></div><button type="button" class="secondary-button" data-career-leave-work>Retour à la carte</button></header>
      <div class="career-work-layout career-place-layout">${scene}<aside class="career-work-dashboard career-place-dashboard" aria-label="Situation d’emploi">${renderStatus(context)}</aside></div>
    </div>`;
  }

  function renderScheduleMenu(context) {
    if (!context.job) return "";
    const status = context.vacation.planned
      ? `Les vacances remplacent le travail cette semaine. La paie de ${context.vacation.weeklyPay} $ est maintenue, sans coût d’énergie, de fatigue ou de capacité et sans absence.`
      : context.plan.planned
        ? `Le travail est prévu cette semaine et réserve ${context.plan.cost} points de capacité. Tu peux le retirer avant la confirmation.`
        : context.plan.available
          ? "Tu as retiré le travail de cette semaine : la capacité est libérée, mais tu ne recevras aucune paie et cette semaine comptera comme une absence."
          : context.plan.reason || "Ton état actuel ne permet pas d’assurer le travail cette semaine.";
    const buttonLabel = context.plan.planned
      ? "Retirer le travail de ma semaine"
      : context.plan.available ? "Ajouter le travail à ma semaine" : "Travail indisponible cette semaine";
    const scheduleAction = context.vacation.planned
      ? `<button type="button" class="secondary-button career-work-vacation-action" data-career-toggle-vacation aria-pressed="true">Annuler mes vacances et remettre le travail</button>`
      : `<button type="button" class="${context.plan.planned ? "secondary-button" : "primary-button"}" data-career-toggle-work aria-pressed="${context.plan.planned}"${!context.plan.planned && !context.plan.available ? " disabled aria-disabled=\"true\"" : ""}>${buttonLabel}</button><button type="button" class="secondary-button career-work-vacation-action" data-career-toggle-vacation aria-pressed="false"${!context.vacation.available ? " disabled aria-disabled=\"true\"" : ""}>${context.vacation.available ? "Prendre une semaine de vacances" : "Aucune semaine de vacances en banque"}</button>`;
    return `<section class="career-work-menu" aria-labelledby="career-work-menu-title"><header><div><p class="eyebrow">${escapeHTML(context.job.title)}</p><h2 id="career-work-menu-title">Horaire de la semaine</h2></div><button type="button" class="secondary-button" data-career-work-menu-close>Retour à l’emploi</button></header><div class="career-work-menu-card"><p><strong>Le salaire affiché est hebdomadaire.</strong> ${escapeHTML(status)}</p>${renderVacationStatus(context, true)}${scheduleAction}</div></section>`;
  }

  function renderJobMenu(context) {
    if (!context.job) return "";
    const application = context.application
      ? `<p>Candidature en cours : <strong>${escapeHTML(context.application.title)}</strong> · ${context.application.progress}/${context.application.requiredWeeks} semaine${context.application.requiredWeeks > 1 ? "s" : ""} écoulée${context.application.progress > 1 ? "s" : ""}.</p>`
      : "";
    return `<section class="career-work-menu" aria-labelledby="career-work-menu-title"><header><div><p class="eyebrow">Emploi actuel</p><h2 id="career-work-menu-title">${escapeHTML(context.job.title)}</h2></div><button type="button" class="secondary-button" data-career-work-menu-close>Retour à l’emploi</button></header><div class="career-work-menu-card"><dl><div><dt>Paie de la semaine</dt><dd>${context.job.wage} $</dd></div><div><dt>Horaire</dt><dd>${escapeHTML(context.job.schedule)}</dd></div></dl><p>${escapeHTML(context.job.detail)}</p>${application}<button type="button" class="secondary-button" data-career-open-job-menu>${context.application ? "Voir ou changer la candidature" : "Voir les offres d’emploi"}</button></div></section>`;
  }

  function renderMenu(menuId, rawContext) {
    const context = normalizeContext(rawContext);
    if (menuId === "schedule") return renderScheduleMenu(context);
    if (menuId === "job") return renderJobMenu(context);
    return "";
  }

  return Object.freeze({ JOB_SCENES, normalizeContext, render, renderMenu });
});
