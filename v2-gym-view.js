(function attachBoxeurGymView(root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.BoxeurGymView = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createBoxeurGymViewApi() {
  "use strict";

  const EXERCISES = Object.freeze([
    Object.freeze({ id: "jump-rope", label: "Corde à danser", short: "Corde", role: "preparation", roleLabel: "Préparation", gains: "Cardio · appuis", detail: "Rythme, appuis et cardio.", energyCost: 5, durationMinutes: 15, fatigueGain: 3 }),
    Object.freeze({ id: "shadow-boxing", label: "Shadow-boxing", short: "Shadow", role: "work", roleLabel: "Travail principal", gains: "Technique · défense", detail: "Technique, fluidité et déplacements.", energyCost: 4, durationMinutes: 20, fatigueGain: 2 }),
    Object.freeze({ id: "heavy-bag", label: "Sac lourd", short: "Sac", role: "work", roleLabel: "Travail principal", gains: "Puissance", detail: "Enchaînements, puissance et gestion de l’effort.", energyCost: 7, durationMinutes: 25, fatigueGain: 5 }),
    Object.freeze({ id: "mitt-work", label: "Travail aux mitaines", short: "Mitaines", role: "work", roleLabel: "Travail principal", gains: "Technique · défense", detail: "Précision, réactions et consignes de l’entraîneur.", energyCost: 6, durationMinutes: 25, fatigueGain: 4 }),
    Object.freeze({ id: "defense", label: "Défense et esquives", short: "Défense", role: "work", roleLabel: "Travail principal", gains: "Défense · technique", detail: "Blocages, retraits, pivots et sorties des câbles.", energyCost: 5, durationMinutes: 20, fatigueGain: 3 }),
    Object.freeze({ id: "cooldown", label: "Retour au calme", short: "Récupération", role: "cooldown", roleLabel: "Retour au calme", gains: "Fatigue réduite", detail: "Respiration, mobilité légère et retour progressif au repos.", energyCost: 1, durationMinutes: 10, fatigueGain: -4 }),
  ]);

  const ZONES = Object.freeze([
    Object.freeze({ id: "coach", label: "Voir l’entraîneur", detail: "Séance préparée et conseils" }),
    Object.freeze({ id: "training", label: "Zone d’entraînement", detail: "Bâtir une séance personnalisée" }),
    Object.freeze({ id: "ring", label: "Ring", detail: "Sparring et oppositions" }),
    Object.freeze({ id: "reception", label: "Accueil", detail: "Abonnement au GYM" }),
  ]);

  const PRESETS = Object.freeze([
    Object.freeze({ id: "technique", label: "Technique", detail: "Précision et enchaînements", exerciseIds: ["jump-rope", "shadow-boxing", "mitt-work", "cooldown"] }),
    Object.freeze({ id: "power", label: "Puissance", detail: "Impact au sac", exerciseIds: ["jump-rope", "heavy-bag", "cooldown"] }),
    Object.freeze({ id: "cardio", label: "Cardio de boxe", detail: "Rythme et volume", exerciseIds: ["jump-rope", "mitt-work", "cooldown"] }),
    Object.freeze({ id: "defense", label: "Défense", detail: "Esquives et sorties", exerciseIds: ["jump-rope", "shadow-boxing", "defense", "cooldown"] }),
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

  function normalizeContext(rawContext) {
    const raw = rawContext && typeof rawContext === "object" ? rawContext : {};
    const profile = raw.profile && typeof raw.profile === "object" ? raw.profile : {};
    const condition = raw.condition && typeof raw.condition === "object" ? raw.condition : {};
    const coach = raw.coach && typeof raw.coach === "object" ? raw.coach : {};
    const privateTrainer = raw.privateTrainer && typeof raw.privateTrainer === "object" ? raw.privateTrainer : {};
    const membership = raw.membership && typeof raw.membership === "object" ? raw.membership : {};
    const recreational = raw.recreational && typeof raw.recreational === "object" ? raw.recreational : {};
    const weekCapacity = raw.weekCapacity && typeof raw.weekCapacity === "object" ? raw.weekCapacity : {};
    const weekPlan = raw.weekPlan && typeof raw.weekPlan === "object" ? raw.weekPlan : {};
    const sparring = raw.sparring && typeof raw.sparring === "object" ? raw.sparring : {};
    const clock = raw.clock && typeof raw.clock === "object" ? raw.clock : {};
    const careerStatus = raw.careerStatus === "recreational" ? "recreational" : raw.careerStatus === "professional" ? "professional" : "amateur";
    const preparationTone = ["positive", "steady", "warning", "critical"].includes(condition.preparationTone)
      ? condition.preparationTone
      : "steady";
    const partnerSource = recreational.partner && typeof recreational.partner === "object" ? recreational.partner : {};
    const partnerFirstName = String(partnerSource.firstName || "Rémy");

    return {
      profile: {
        firstName: profile.firstName || "Boxeur",
      },
      careerStatus,
      careerStatusLabel: raw.careerStatusLabel || (careerStatus === "professional" ? "Professionnel" : careerStatus === "amateur" ? "Amateur" : "Récréatif"),
      clock: {
        week: wholeNumber(clock.week, 1, 1, 99999),
        dayLabel: clock.dayLabel || "Lundi · matin",
        dateLabel: clock.dateLabel || "date à confirmer",
      },
      condition: {
        preparationLabel: condition.preparationLabel || "Correcte",
        preparationDetail: condition.preparationDetail || "Une séance équilibrée demeure raisonnable aujourd’hui.",
        preparationTone,
        energy: wholeNumber(condition.energy, 100, 0, 100),
        fatigue: wholeNumber(condition.fatigue, 0, 0, 100),
        availableMinutes: wholeNumber(condition.availableMinutes, 60, 0, 240),
        trainingBlocked: condition.trainingBlocked === true,
        trainingBlockedReason: condition.trainingBlockedReason || "Une restriction médicale bloque temporairement l’entraînement de boxe.",
      },
      coach: {
        name: coach.name || "Ton entraîneur",
        sessionTitle: coach.sessionTitle || "Séance équilibrée",
        sessionSummary: coach.sessionSummary || "Échauffement, technique et travail contrôlé au sac.",
        durationMinutes: wholeNumber(coach.durationMinutes, 60, 0, 240),
        available: coach.available !== false,
        planned: coach.planned === true,
        plannedCount: wholeNumber(coach.plannedCount, coach.planned ? 1 : 0, 0, 2),
        notice: coach.notice || "",
      },
      privateTrainer: {
        available: privateTrainer.available === true,
        active: privateTrainer.active === true,
        name: privateTrainer.name || "Entraîneur privé",
        detail: privateTrainer.detail || "Programme ciblé en technique ou en défense.",
        actionLabel: privateTrainer.actionLabel || "Choisir un entraîneur privé",
      },
      membership: {
        active: membership.active === true,
        label: membership.label || (membership.active === true ? "Abonnement actif" : "Inscription requise"),
        detail: membership.detail || (membership.active === true ? "Accès au GYM confirmé." : "Inscris-toi à l’accueil avant de commencer une séance."),
        monthlyPrice: wholeNumber(membership.monthlyPrice, 110, 0, 99999),
        balance: Number.isFinite(Number(membership.balance)) ? wholeNumber(membership.balance, 0, 0, 9999999) : null,
      },
      recreational: {
        trainingWeeks: wholeNumber(recreational.trainingWeeks, 0, 0, 999),
        targetWeeks: wholeNumber(recreational.targetWeeks, 10, 1, 999),
        sparringWeek: wholeNumber(recreational.sparringWeek, 6, 1, 999),
        partner: {
          firstName: partnerFirstName,
          displayName: String(partnerSource.displayName || `${partnerFirstName} « Le Tank »`),
        },
        remyStatus: ["locked", "scheduled", "ready", "completed"].includes(recreational.remyStatus)
          ? recreational.remyStatus
          : "locked",
        remyDetail: recreational.remyDetail || "",
      },
      weekCapacity: {
        total: wholeNumber(weekCapacity.total, 50, 1, 200),
        used: wholeNumber(weekCapacity.used, 0, 0, 200),
        remaining: wholeNumber(weekCapacity.remaining, 50, 0, 200),
      },
      weekPlan: {
        entries: Array.isArray(weekPlan.entries) ? weekPlan.entries.slice(0, 12).map((entry, index) => ({
          id: String(entry?.id || `gym-entry-${index + 1}`),
          label: String(entry?.label || "Activité du GYM"),
          cost: wholeNumber(entry?.cost, 0, 0, 100),
          removable: entry?.removable !== false,
        })) : [],
      },
      sparring: {
        available: sparring.available !== false,
        reason: sparring.reason || "",
        planned: sparring.planned === true,
      },
      selectedExercises: Array.isArray(raw.selectedExercises)
        ? raw.selectedExercises.filter((id, index, list) => EXERCISES.some(exercise => exercise.id === id) && list.indexOf(id) === index).slice(0, EXERCISES.length)
        : [],
      draftDurationMinutes: wholeNumber(raw.draftDurationMinutes, 0, 0, 240),
      draftWeekCost: wholeNumber(raw.draftWeekCost, 0, 0, 100),
    };
  }

  function sparringState(context) {
    if (context.careerStatus === "recreational") {
      const remyCompleted = context.recreational.remyStatus === "completed";
      const partner = context.recreational.partner;
      return {
        available: false,
        status: remyCompleted ? "transition" : "locked",
        label: remyCompleted ? "Passage amateur requis" : "Verrouillé pendant le parcours récréatif",
        detail: remyCompleted
          ? "Rémy a donné son feu vert. Confirme maintenant ton passage amateur auprès de l’entraîneur."
          : `Complète d’abord le sparring pédagogique avec ${partner.displayName}, puis confirme ton passage amateur.`,
      };
    }
    if (!context.membership.active) {
      return {
        available: false,
        status: "membership",
        label: "Abonnement requis",
        detail: "Réactive ton abonnement au GYM avant de réserver un partenaire de sparring.",
      };
    }
    if (context.condition.trainingBlocked) {
      return {
        available: false,
        status: "unavailable",
        label: "Indisponible aujourd’hui",
        detail: context.condition.trainingBlockedReason,
      };
    }
    if (!context.sparring.available) {
      return {
        available: false,
        status: "capacity",
        label: "Programme hebdomadaire complet",
        detail: context.sparring.reason || "Libère de l’énergie dans ton programme avant d’ajouter un sparring.",
      };
    }
    return {
      available: true,
      status: context.sparring.planned ? "planned" : "available",
      label: context.sparring.planned ? "Déjà planifié" : "Disponible",
      detail: context.sparring.planned
        ? "Le sparring sera joué interactivement lorsque tu confirmeras la semaine."
        : "Ajoute cette activité distincte : elle occupe une journée physique complète.",
    };
  }

  function renderSparringCard(context) {
    const sparring = sparringState(context);
    const disabled = sparring.available ? "" : " disabled aria-disabled=\"true\" aria-describedby=\"v2-gym-sparring-reason\"";
    const buttonLabel = sparring.available
      ? context.sparring.planned ? "Retirer de ma semaine" : "Ajouter à ma semaine"
      : "Sparring verrouillé";
    return `<article class="v2-gym-sparring-card v2-gym-action-card ${sparring.available ? "available" : "locked"}" id="v2-gym-sparring-card" data-v2-sparring-state="${sparring.status}" aria-labelledby="v2-gym-sparring-title" tabindex="-1">
      <p class="eyebrow">Activité distincte</p>
      <h3 id="v2-gym-sparring-title">Sparring</h3>
      <p>Une opposition interactive avec un partenaire. Le sparring ne fait jamais partie d’une séance personnalisée.</p>
      <div class="v2-gym-sparring-state" id="v2-gym-sparring-reason" role="note"><span aria-hidden="true">${sparring.available ? "✓" : "🔒"}</span><div><strong>${escapeHTML(sparring.label)}</strong><p>${escapeHTML(sparring.detail)}</p></div></div>
      <button type="button" class="${sparring.available ? "primary-button" : "secondary-button"}" data-v2-sparring-activity="cta"${disabled}>${buttonLabel}</button>
    </article>`;
  }

  function renderWeekPlan(context) {
    const entries = context.weekPlan.entries.length
      ? `<ul>${context.weekPlan.entries.map(entry => `<li><span><strong>${escapeHTML(entry.label)}</strong><small>${entry.cost > 0 ? `−${entry.cost} énergie` : "Aucun coût d’énergie"}</small></span>${entry.removable ? `<button type="button" class="secondary-button" data-v2-location-remove="${escapeHTML(entry.id)}">Retirer</button>` : `<em>Déjà joué</em>`}</li>`).join("")}</ul>`
      : `<p class="v2-place-plan-empty">Aucune activité du GYM n’est encore planifiée.</p>`;
    return `<section class="v2-gym-week-plan v2-place-week-plan${context.weekCapacity.remaining <= 0 ? " full" : ""}" aria-labelledby="v2-gym-week-plan-title" aria-live="polite">
      <div class="v2-place-week-plan-heading"><div><p class="eyebrow">Planification</p><h3 id="v2-gym-week-plan-title">Programme de la semaine</h3></div><strong>${context.weekCapacity.remaining} / ${context.weekCapacity.total}</strong></div>
      <meter min="0" max="${context.weekCapacity.total}" value="${context.weekCapacity.remaining}" aria-label="Énergie hebdomadaire restante : ${context.weekCapacity.remaining} sur ${context.weekCapacity.total}">${context.weekCapacity.remaining} sur ${context.weekCapacity.total}</meter>
      <p><strong>${context.weekCapacity.remaining > 0 ? `${context.weekCapacity.remaining} énergie encore disponible` : "Énergie hebdomadaire épuisée"}</strong> · ${context.weekCapacity.used} déjà réservée · les choix restent modifiables avant la confirmation.</p>
      ${entries}
    </section>`;
  }

  function renderCoachCard(context) {
    const disabled = context.coach.available && context.membership.active ? "" : " disabled aria-disabled=\"true\"";
    const buttonLabel = context.coach.planned
      ? "Retirer de ma semaine"
      : context.coach.plannedCount > 0
        ? "Ajouter une 2e séance"
        : "Ajouter à ma semaine";
    const buttonClass = context.coach.planned ? "secondary-button" : "primary-button";
    const notice = context.coach.notice ? `<p class="v2-gym-coach-notice">${escapeHTML(context.coach.notice)}</p>` : "";
    return `<article class="v2-gym-coach-card v2-gym-action-card recommended" aria-labelledby="v2-gym-coach-title">
      <div class="v2-gym-action-heading"><span>Recommandé</span><small>${context.coach.durationMinutes} min</small></div>
      <p class="eyebrow">Préparée par ${escapeHTML(context.coach.name)}</p>
      <h3 id="v2-gym-coach-title">${escapeHTML(context.coach.sessionTitle)}</h3>
      <p>${escapeHTML(context.coach.sessionSummary)}</p>
      ${notice}
      <button type="button" class="${buttonClass}" data-v2-coach-session aria-pressed="${context.coach.planned}"${disabled}>${buttonLabel}</button>
    </article>`;
  }

  function renderPrivateTrainerCard(context) {
    if (context.careerStatus === "recreational") return "";
    const disabled = context.privateTrainer.available ? "" : " disabled aria-disabled=\"true\" aria-describedby=\"v2-gym-private-trainer-reason\"";
    const detail = context.privateTrainer.available
      ? `${context.privateTrainer.detail} Une séance privée remplace une séance de boxe dans ton programme.`
      : !context.membership.active
        ? "Un abonnement actif est requis."
        : "Le service privé est indisponible pour le moment.";
    return `<article class="v2-gym-action-card${disabled ? " locked" : ""}" aria-labelledby="v2-gym-private-title">
      <div class="v2-gym-action-heading"><span>Spécialisé</span><small>Service payant</small></div>
      <h3 id="v2-gym-private-title">${escapeHTML(context.privateTrainer.name)}</h3><p id="v2-gym-private-trainer-reason">${escapeHTML(detail)}</p>
      <button type="button" class="secondary-button" data-v2-boxing-trainer${disabled}>${escapeHTML(context.privateTrainer.actionLabel)}</button>
    </article>`;
  }

  function renderAmateurTransitionCard(context) {
    if (context.careerStatus !== "recreational" || context.recreational.remyStatus !== "completed") return "";
    const partner = context.recreational.partner;
    const evaluation = partner.firstName === "Rémy"
      ? "Ton évaluation avec Rémy est terminée."
      : `Ton opposition avec ${partner.firstName} est terminée et Rémy a donné son feu vert.`;
    return `<article class="v2-gym-action-card recommended" aria-labelledby="v2-gym-amateur-transition-title">
      <div class="v2-gym-action-heading"><span>Parcours terminé</span><small>Rémy a donné son feu vert</small></div>
      <h3 id="v2-gym-amateur-transition-title">Passer amateur</h3>
      <p>${escapeHTML(evaluation)} Confirme ton passage amateur avec l’entraîneur.</p>
      <button type="button" class="primary-button" data-v2-amateur-transition>Confirmer le passage amateur</button>
    </article>`;
  }

  function renderMenu(menuId, rawContext) {
    const context = normalizeContext(rawContext);
    const id = String(menuId || "");
    if (id === "coach") {
      const description = context.careerStatus === "recreational"
        ? "Les cours récréatifs sont préparés par l’entraîneur."
        : "Choisis la séance préparée par le coach ou un entraîneur privé ciblé.";
      return `<section class="v2-gym-menu" aria-labelledby="v2-gym-menu-title">
        <header><div><p class="eyebrow">GYM de boxe</p><h2 id="v2-gym-menu-title">Voir l’entraîneur</h2></div><button type="button" class="secondary-button" data-v2-gym-menu-close>Retour au GYM</button></header>
        <p>${escapeHTML(description)}</p>
        <div class="v2-gym-menu-actions">${renderAmateurTransitionCard(context)}${renderCoachCard(context)}${renderPrivateTrainerCard(context)}</div>
      </section>`;
    }
    if (id === "ring") {
      return `<section class="v2-gym-menu" aria-labelledby="v2-gym-menu-title">
        <header><div><p class="eyebrow">GYM de boxe</p><h2 id="v2-gym-menu-title">Ring</h2></div><button type="button" class="secondary-button" data-v2-gym-menu-close>Retour au GYM</button></header>
        <p>Le sparring est une activité distincte : il ne fait jamais partie d’une séance personnalisée.</p>
        <div class="v2-gym-menu-actions">${renderSparringCard(context)}</div>
      </section>`;
    }
    return "";
  }

  function render(rawContext) {
    const context = normalizeContext(rawContext);
    const sparring = sparringState(context);
    const zones = ZONES.map(zone => {
      const isRing = zone.id === "ring";
      const remyReady = isRing && context.careerStatus === "recreational" && context.recreational.remyStatus === "ready";
      const recreationalBlocked = context.careerStatus === "recreational" && !["coach", "reception"].includes(zone.id) && !remyReady;
      const medicallyBlocked = context.membership.active && context.condition.trainingBlocked && !["coach", "reception"].includes(zone.id);
      const membershipBlocked = !context.membership.active && zone.id !== "reception";
      const sparringBlocked = isRing && !sparring.available && !remyReady;
      const display = {
        label: zone.label,
        detail: zone.detail,
      };
      if (zone.id === "coach") display.detail = context.careerStatus === "recreational" ? "Cours récréatifs" : "Coach et entraîneur privé";
      if (zone.id === "training") {
        display.label = context.careerStatus === "recreational" ? "Zone d’entraînement · Amateur" : zone.label;
        display.detail = context.careerStatus === "recreational" ? "Bâtir ma séance après le passage amateur" : "Bâtir ma séance personnalisée";
      }
      if (isRing && context.careerStatus === "recreational") {
        display.detail = remyReady
          ? `Sparring pédagogique avec ${context.recreational.partner.firstName}`
          : context.recreational.remyStatus === "completed"
            ? "Passe amateur avec l’entraîneur"
            : `Débloqué avec ${context.recreational.partner.firstName}`;
      }
      const disabled = sparringBlocked
        ? " disabled aria-disabled=\"true\""
        : membershipBlocked
        ? " aria-disabled=\"true\""
        : recreationalBlocked
        ? " disabled aria-disabled=\"true\""
        : medicallyBlocked
        ? " disabled aria-disabled=\"true\""
        : "";
      const reason = sparringBlocked
        ? ` Indisponible : ${sparring.label}. ${sparring.detail}`
        : membershipBlocked
        ? " Verrouillé : inscription au GYM requise."
        : recreationalBlocked
        ? " Indisponible pendant l’initiation : commence par les cours de groupe."
        : medicallyBlocked
        ? ` Indisponible : ${context.condition.trainingBlockedReason}`
        : "";
      const lock = membershipBlocked || sparringBlocked || recreationalBlocked ? `<span class="v2-gym-hotspot-lock" aria-hidden="true">🔒</span>` : "";
      const reasonMarkup = reason ? `<span class="sr-only">${escapeHTML(reason)}</span>` : "";
      return `<button type="button" class="v2-gym-hotspot v2-gym-hotspot-${zone.id}" data-v2-gym-zone="${zone.id}" aria-label="${escapeHTML(display.label)}. ${escapeHTML(display.detail)}${escapeHTML(reason)}"${disabled}><strong>${escapeHTML(display.label)}</strong><small>${escapeHTML(display.detail)}</small>${lock}${reasonMarkup}</button>`;
    }).join("");
    const membershipLock = context.membership.active ? "" : `<div class="v2-gym-access-lock" id="v2-gym-membership-lock-reason" role="note">
      <span aria-hidden="true">🔒</span><div><strong>Inscription requise</strong><p>Les activités restent visibles pour découvrir le GYM, mais elles se débloquent seulement après l’inscription. Le sac au sous-sol reste accessible à la maison.</p></div>
    </div>`;

    return `<div class="v2-gym-view v2-place-view" data-career-status="${context.careerStatus}" data-membership-active="${context.membership.active}">
      <header class="v2-gym-header v2-place-header">
        <div><p class="eyebrow">GYM de boxe</p><h2>Bienvenue au GYM, ${escapeHTML(context.profile.firstName)}</h2><p class="v2-place-meta">${escapeHTML(context.careerStatusLabel)} · Semaine ${context.clock.week} · ${escapeHTML(context.clock.dayLabel)} · ${escapeHTML(context.clock.dateLabel)}</p></div>
        <button type="button" class="secondary-button" data-v2-leave-gym>Retour à la carte</button>
      </header>
      <div class="v2-gym-layout v2-place-layout">
        <section class="v2-gym-floor v2-place-scene" aria-labelledby="v2-gym-floor-title">
          <h3 id="v2-gym-floor-title" class="sr-only">Zones interactives du GYM</h3>
          <picture>
            <source media="(max-width: 640px)" srcset="assets/gym-boxe-v2-mobile.jpg">
            <img src="assets/gym-boxe-v2-desktop.jpg" width="1440" height="810" alt="Intérieur illustré d’un gym de boxe avec ring et zones d’entraînement" />
          </picture>
          <div class="v2-gym-hotspots">${zones}</div>
          ${membershipLock}
        </section>
        <aside class="v2-gym-dashboard v2-place-dashboard" aria-label="Séance et état actuel">
          ${renderWeekPlan(context)}
          <section class="v2-gym-readiness v2-place-condition ${context.condition.preparationTone}">
            <span>Préparation</span><strong>${escapeHTML(context.condition.preparationLabel)}</strong>
            <p>${escapeHTML(context.condition.preparationDetail)}</p>
            <div class="v2-gym-meters">
              <label>Énergie <meter min="0" max="100" value="${context.condition.energy}">${context.condition.energy} %</meter><b>${context.condition.energy} %</b></label>
              <label>Fatigue <meter min="0" max="100" value="${context.condition.fatigue}">${context.condition.fatigue} %</meter><b>${context.condition.fatigue} %</b></label>
              <span>Temps disponible <b>${context.condition.availableMinutes} min</b></span>
            </div>
          </section>
          <section class="v2-gym-membership v2-place-card ${context.membership.active ? "active" : "inactive"}">
            <span>Réception du GYM</span><strong>${escapeHTML(context.membership.active ? context.membership.label : "Inscription requise")}</strong><p>${escapeHTML(context.membership.detail)}</p>
            <p class="v2-gym-membership-hint">Utilise le bouton <strong>Accueil</strong> dans le GYM pour ${context.membership.active ? "gérer l’accès" : "t’inscrire"}.</p>
          </section>
        </aside>
      </div>
    </div>`;
  }

  function renderComposer(rawContext) {
    const context = normalizeContext(rawContext);
    const selected = context.selectedExercises;
    const membershipLocked = !context.membership.active;
    const selectedActivities = selected.map(id => EXERCISES.find(exercise => exercise.id === id)).filter(Boolean);
    const energyCost = selectedActivities.reduce((sum, exercise) => sum + exercise.energyCost, 0);
    const fatigueGain = selectedActivities.reduce((sum, exercise) => sum + exercise.fatigueGain, 0);
    const projectedEnergy = Math.max(0, context.condition.energy - energyCost);
    const projectedFatigue = Math.max(0, Math.min(100, context.condition.fatigue + fatigueGain));
    const hasPreparation = selectedActivities.some(exercise => exercise.role === "preparation");
    const hasWork = selectedActivities.some(exercise => exercise.role === "work");
    const hasCooldown = selectedActivities.some(exercise => exercise.role === "cooldown");
    const structureReady = hasPreparation && hasWork && hasCooldown;
    const projectedWeekEnergy = Math.max(0, context.weekCapacity.remaining - context.draftWeekCost);
    const presets = PRESETS.map(preset => {
      const active = preset.exerciseIds.length === selected.length && preset.exerciseIds.every(id => selected.includes(id));
      return `<button type="button" class="v2-session-preset${active ? " selected" : ""}" data-v2-session-preset="${preset.id}" aria-pressed="${active}"${membershipLocked || context.condition.trainingBlocked ? " disabled aria-disabled=\"true\"" : ""}><strong>${escapeHTML(preset.label)}</strong><small>${escapeHTML(preset.detail)}</small></button>`;
    }).join("");
    const exerciseButtons = EXERCISES.map(exercise => {
      const isSelected = selected.includes(exercise.id);
      const lacksEnergy = !isSelected && exercise.energyCost > projectedEnergy;
      const disabled = membershipLocked || context.condition.trainingBlocked || lacksEnergy ? " disabled aria-disabled=\"true\"" : "";
      const stateLabel = isSelected ? "Sélectionnée · toucher pour retirer" : lacksEnergy ? "Énergie insuffisante" : `Ajouter · −${exercise.energyCost} énergie`;
      return `<button type="button" class="v2-exercise-choice${isSelected ? " selected" : ""}" data-v2-exercise="${exercise.id}" aria-pressed="${isSelected}" aria-label="${escapeHTML(`${exercise.label}. ${exercise.roleLabel}. ${stateLabel}`)}"${disabled}><span class="v2-exercise-heading-row"><strong>${escapeHTML(exercise.label)}</strong><b>${exercise.energyCost > 0 ? `−${exercise.energyCost} E` : `+${Math.abs(exercise.fatigueGain)} récup.`}</b></span><small><span>${escapeHTML(exercise.roleLabel)}</span> · ${escapeHTML(exercise.gains)}</small><small>${escapeHTML(exercise.detail)}</small><em>${exercise.durationMinutes} min · ${escapeHTML(stateLabel)}</em></button>`;
    }).join("");
    const blocks = selected.length
      ? selected.map((id, index) => {
          const exercise = EXERCISES.find(item => item.id === id);
          return `<li><span>Activité ${index + 1}</span><strong>${escapeHTML(exercise.label)}</strong><small>−${exercise.energyCost} E · ${exercise.durationMinutes} min</small><button type="button" data-v2-exercise="${exercise.id}" aria-label="Retirer ${escapeHTML(exercise.label)}">Retirer</button></li>`;
        }).join("")
      : `<li class="empty">Choisis ta première activité ci-dessous. Tu peux commencer petit ou bâtir une séance plus complète.</li>`;

    return `<section class="v2-session-composer" aria-labelledby="v2-composer-title">
      <header><div><p class="eyebrow">Séance personnalisée</p><h2 id="v2-composer-title">Bâtis ta séance avec ton énergie</h2></div><button type="button" data-v2-close-composer aria-label="Fermer le compositeur">Fermer</button></header>
      <p>Utilise un modèle spécialisé ou compose librement. Une séance complète garde une préparation, un travail principal et un retour au calme.</p>
      ${membershipLocked ? `<p class="v2-composer-membership-note" role="status"><strong>Inscription requise.</strong> Retourne à la réception pour débloquer les activités du GYM.</p>` : ""}
      <section class="v2-composer-energy" aria-label="Énergie disponible pendant la composition" aria-live="polite"><div><span>Énergie restante de la semaine</span><strong>${projectedWeekEnergy} / ${context.weekCapacity.total}</strong></div><progress max="${context.weekCapacity.total}" value="${projectedWeekEnergy}">${projectedWeekEnergy}/${context.weekCapacity.total}</progress><p>${context.weekCapacity.remaining} disponible avant cette séance · coût estimé ${context.draftWeekCost}</p><div><span>Énergie physique après la séance</span><strong>${projectedEnergy} %</strong></div></section>
      <section class="v2-session-presets" aria-labelledby="v2-session-presets-title"><div><p class="eyebrow">Modèles rapides</p><h3 id="v2-session-presets-title">Choisir une spécialisation</h3></div><div>${presets}</div></section>
      <div class="v2-composer-state" aria-live="polite"><strong>${selected.length} activité${selected.length > 1 ? "s" : ""}</strong><span>Durée prévue : ${context.draftDurationMinutes} min</span><span>Énergie après : ${projectedEnergy} %</span><span>Fatigue après : ${projectedFatigue} %</span></div>
      <ul class="v2-session-structure" aria-label="Structure minimale de la séance"><li class="${hasPreparation ? "complete" : "missing"}"><span aria-hidden="true">${hasPreparation ? "✓" : "○"}</span> Préparation</li><li class="${hasWork ? "complete" : "missing"}"><span aria-hidden="true">${hasWork ? "✓" : "○"}</span> Travail principal</li><li class="${hasCooldown ? "complete" : "missing"}"><span aria-hidden="true">${hasCooldown ? "✓" : "○"}</span> Retour au calme</li></ul>
      <ol class="v2-session-blocks" aria-label="Activités choisies">${blocks}</ol>
      <div class="v2-exercise-grid" aria-label="Exercices disponibles">${exerciseButtons}</div>
      <footer><button type="button" class="secondary-button" data-v2-close-composer>Annuler</button><button type="button" class="primary-button" data-v2-confirm-session${structureReady && !context.condition.trainingBlocked && !membershipLocked ? "" : " disabled aria-disabled=\"true\""}>Ajouter à ma semaine</button></footer>
    </section>`;
  }

  function renderResult(rawResult) {
    const result = rawResult && typeof rawResult === "object" ? rawResult : {};
    const title = result.title || "Séance terminée";
    const summary = result.summary || "La séance est enregistrée. La récupération déterminera comment ton corps assimile ce travail.";
    const durationMinutes = wholeNumber(result.durationMinutes, 0, 0, 240);
    const changes = Array.isArray(result.changes) ? result.changes.slice(0, 8) : [];
    const highlights = Array.isArray(result.highlights) ? result.highlights.slice(0, 6) : [];
    const changeMarkup = changes.length
      ? changes.map(change => {
          const safeChange = change && typeof change === "object" ? change : {};
          const tone = ["positive", "neutral", "warning", "critical"].includes(safeChange.tone) ? safeChange.tone : "neutral";
          return `<li class="${tone}"><span>${escapeHTML(safeChange.label || "État")}</span><strong>${escapeHTML(safeChange.value || "—")}</strong></li>`;
        }).join("")
      : `<li class="neutral"><span>Bilan</span><strong>À jour</strong></li>`;
    const highlightMarkup = highlights.length
      ? `<ul class="v2-session-highlights">${highlights.map(item => `<li>${escapeHTML(item)}</li>`).join("")}</ul>`
      : "";
    const nextStep = result.nextStep ? `<p class="v2-session-next-step"><strong>Conseil :</strong> ${escapeHTML(result.nextStep)}</p>` : "";

    return `<section class="v2-session-result" aria-labelledby="v2-session-result-title" aria-live="polite">
      <p class="eyebrow">Bilan du GYM</p><h2 id="v2-session-result-title">${escapeHTML(title)}</h2>
      <p>${escapeHTML(summary)}</p><p class="v2-session-result-duration">Durée : <strong>${durationMinutes} min</strong></p>
      <ul class="v2-session-result-changes" aria-label="Effets de la séance">${changeMarkup}</ul>
      ${highlightMarkup}${nextStep}
      <div class="v2-session-result-actions"><button type="button" class="secondary-button" data-v2-result-close>Rester au GYM</button><button type="button" class="primary-button" data-v2-leave-gym>Retour à la carte</button></div>
    </section>`;
  }

  return Object.freeze({ EXERCISES, ZONES, PRESETS, normalizeContext, render, renderMenu, renderComposer, renderResult });
});
