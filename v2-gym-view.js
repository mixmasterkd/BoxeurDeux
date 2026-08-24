(function attachBoxeurGymView(root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.BoxeurGymView = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createBoxeurGymViewApi() {
  "use strict";

  const EXERCISES = Object.freeze([
    Object.freeze({ id: "jump-rope", label: "Corde à danser", short: "Corde", detail: "Rythme, appuis et cardio.", energyCost: 5, durationMinutes: 15, fatigueGain: 3 }),
    Object.freeze({ id: "shadow-boxing", label: "Shadow-boxing", short: "Shadow", detail: "Technique, fluidité et déplacements.", energyCost: 4, durationMinutes: 20, fatigueGain: 2 }),
    Object.freeze({ id: "heavy-bag", label: "Sac lourd", short: "Sac", detail: "Enchaînements, puissance et gestion de l’effort.", energyCost: 7, durationMinutes: 25, fatigueGain: 5 }),
    Object.freeze({ id: "mitt-work", label: "Travail aux mitaines", short: "Mitaines", detail: "Précision, réactions et consignes de l’entraîneur.", energyCost: 6, durationMinutes: 25, fatigueGain: 4 }),
    Object.freeze({ id: "defense", label: "Défense et esquives", short: "Défense", detail: "Blocages, retraits, pivots et sorties des câbles.", energyCost: 5, durationMinutes: 20, fatigueGain: 3 }),
  ]);

  const ZONES = Object.freeze([
    Object.freeze({ id: "jump-rope", label: "Corde à danser", detail: "Échauffement et rythme" }),
    Object.freeze({ id: "shadow-boxing", label: "Shadow-boxing", detail: "Appuis et technique" }),
    Object.freeze({ id: "heavy-bag", label: "Sac lourd", detail: "Combinaisons et puissance" }),
    Object.freeze({ id: "mitt-work", label: "Travail aux mitaines", detail: "Séance dirigée" }),
    Object.freeze({ id: "defense", label: "Défense et esquives", detail: "Réactions et sorties" }),
    Object.freeze({ id: "sparring", label: "Ring et sparring", detail: "Opposition contrôlée" }),
    Object.freeze({ id: "coach", label: "Entraîneur", detail: "Séance préparée et conseils" }),
    Object.freeze({ id: "reception", label: "Accueil", detail: "Abonnement au GYM" }),
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
    const careerStatus = raw.careerStatus === "recreational" ? "recreational" : raw.careerStatus === "professional" ? "professional" : "amateur";
    const preparationTone = ["positive", "steady", "warning", "critical"].includes(condition.preparationTone)
      ? condition.preparationTone
      : "steady";

    return {
      profile: {
        firstName: profile.firstName || "Boxeur",
      },
      careerStatus,
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
    };
  }

  function recreationalPath(context) {
    if (context.careerStatus !== "recreational") {
      return `<section class="v2-gym-path v2-gym-path-amateur" aria-label="Parcours de boxe">
        <p class="eyebrow">Parcours ${context.careerStatus === "professional" ? "professionnel" : "amateur"}</p>
        <h3>Prépare ton prochain objectif</h3>
        <p>Utilise les séances du GYM et le sparring pour arriver prêt à ton prochain rendez-vous.</p>
      </section>`;
    }

    const progress = Math.min(context.recreational.trainingWeeks, context.recreational.targetWeeks);
    const statuses = {
      locked: `Complète encore les bases au GYM. Le sparring de Rémy est réservé à la semaine ${context.recreational.sparringWeek}.`,
      scheduled: "Le sparring pédagogique est inscrit à ton calendrier.",
      ready: "Tu peux maintenant monter dans le ring pour ton évaluation.",
      completed: "Évaluation terminée : retourne voir l’entraîneur quand tu voudras passer amateur.",
    };
    const detail = context.recreational.remyDetail || statuses[context.recreational.remyStatus];
    const action = context.recreational.remyStatus === "ready"
      ? `<button type="button" class="primary-button" data-v2-remy-sparring>Faire le sparring pédagogique</button>`
      : context.recreational.remyStatus === "completed"
        ? `<button type="button" class="primary-button" data-v2-amateur-transition>Voir l’entraîneur</button>`
        : "";

    return `<section class="v2-gym-path v2-gym-path-recreational" aria-labelledby="v2-remy-title">
      <p class="eyebrow">Parcours récréatif</p>
      <h3 id="v2-remy-title">En route vers Rémy « Le Tank »</h3>
      <p class="v2-gym-path-progress"><strong>${progress}/${context.recreational.targetWeeks}</strong> entraînements possibles complétés</p>
      <p class="v2-gym-group-class"><strong>Cours de groupe :</strong> inclus au parcours récréatif avec une inscription active au GYM.</p>
      <p>${escapeHTML(detail)}</p>
      ${action}
    </section>`;
  }

  function sparringState(context) {
    if (context.careerStatus === "recreational") {
      const remyCompleted = context.recreational.remyStatus === "completed";
      return {
        available: false,
        status: remyCompleted ? "transition" : "locked",
        label: remyCompleted ? "Passage amateur requis" : "Verrouillé pendant le parcours récréatif",
        detail: remyCompleted
          ? "Rémy a donné son feu vert. Confirme maintenant ton passage amateur auprès de l’entraîneur."
          : "Complète d’abord le sparring pédagogique avec Rémy « Le Tank », puis confirme ton passage amateur.",
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
    return `<section class="v2-gym-sparring-card ${sparring.available ? "available" : "locked"}" id="v2-gym-sparring-card" data-v2-sparring-state="${sparring.status}" aria-labelledby="v2-gym-sparring-title">
      <p class="eyebrow">Activité distincte</p>
      <h3 id="v2-gym-sparring-title">Sparring</h3>
      <p>Une opposition interactive avec un partenaire. Le sparring ne fait jamais partie d’une séance personnalisée.</p>
      <div class="v2-gym-sparring-state" id="v2-gym-sparring-reason" role="note"><span aria-hidden="true">${sparring.available ? "✓" : "🔒"}</span><div><strong>${escapeHTML(sparring.label)}</strong><p>${escapeHTML(sparring.detail)}</p></div></div>
      <button type="button" class="${sparring.available ? "primary-button" : "secondary-button"}" data-v2-sparring-activity="cta"${disabled}>${buttonLabel}</button>
    </section>`;
  }

  function renderWeekPlan(context) {
    if (!context.weekPlan.entries.length) return "";
    return `<section class="v2-gym-week-plan" aria-labelledby="v2-gym-week-plan-title"><div><p class="eyebrow">Déjà dans la semaine</p><h3 id="v2-gym-week-plan-title">Activités du GYM planifiées</h3></div><ul>${context.weekPlan.entries.map(entry => `<li><span><strong>${escapeHTML(entry.label)}</strong><small>−${entry.cost} énergie</small></span>${entry.removable ? `<button type="button" class="secondary-button" data-v2-location-remove="${escapeHTML(entry.id)}">Retirer</button>` : `<em>Déjà joué</em>`}</li>`).join("")}</ul></section>`;
  }

  function render(rawContext) {
    const context = normalizeContext(rawContext);
    const sparring = sparringState(context);
    const zones = ZONES.map(zone => {
      const isSparring = zone.id === "sparring";
      const recreationalBlocked = context.careerStatus === "recreational" && !["coach", "reception"].includes(zone.id);
      const medicallyBlocked = context.membership.active && context.condition.trainingBlocked && !["coach", "reception"].includes(zone.id);
      const membershipBlocked = !context.membership.active && zone.id !== "reception";
      const sparringBlocked = isSparring && !sparring.available;
      const disabled = sparringBlocked
        ? " disabled aria-disabled=\"true\" aria-describedby=\"v2-gym-sparring-reason\""
        : membershipBlocked
        ? " aria-disabled=\"true\" aria-describedby=\"v2-gym-membership-lock-reason\""
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
      const actionAttribute = isSparring ? `data-v2-sparring-activity="hotspot" aria-controls="v2-gym-sparring-card"` : `data-v2-gym-zone="${zone.id}"`;
      return `<button type="button" class="v2-gym-hotspot v2-gym-hotspot-${zone.id}" ${actionAttribute} aria-label="${escapeHTML(zone.label)}. ${escapeHTML(zone.detail)}${escapeHTML(reason)}"${disabled}><strong>${escapeHTML(zone.label)}</strong><small>${escapeHTML(zone.detail)}</small>${lock}</button>`;
    }).join("");
    const coachDisabled = context.coach.available && context.membership.active ? "" : " disabled aria-disabled=\"true\"";
    const coachButtonLabel = context.coach.planned ? "Retirer de ma semaine" : "Ajouter à ma semaine";
    const coachButtonClass = context.coach.planned ? "secondary-button" : "primary-button";
    const privateTrainerDisabled = context.privateTrainer.available ? "" : " disabled aria-disabled=\"true\" aria-describedby=\"v2-gym-private-trainer-reason\"";
    const composerDisabled = context.careerStatus === "recreational" || context.condition.trainingBlocked || !context.membership.active ? " disabled aria-disabled=\"true\"" : "";
    const coachNotice = context.coach.notice ? `<p class="v2-gym-coach-notice">${escapeHTML(context.coach.notice)}</p>` : "";
    const balanceLabel = context.membership.balance == null ? "Solde affiché à l’accueil" : `Solde : ${context.membership.balance} $`;
    const shortfall = context.membership.balance == null ? 0 : Math.max(0, context.membership.monthlyPrice - context.membership.balance);
    const priceDetail = shortfall > 0 ? `${balanceLabel} · il manque ${shortfall} $` : balanceLabel;
    const membershipButton = context.membership.active ? "Gérer mon abonnement" : `S’inscrire · ${context.membership.monthlyPrice} $`;
    const membershipLock = context.membership.active ? "" : `<div class="v2-gym-access-lock" id="v2-gym-membership-lock-reason" role="note">
      <span aria-hidden="true">🔒</span><div><strong>Inscription requise</strong><p>Les activités restent visibles pour découvrir le GYM, mais elles se débloquent seulement après l’inscription. Le sac au sous-sol reste accessible à la maison.</p></div>
    </div>`;
    const accessItems = [
      "Travail aux mitaines",
      "Sac lourd et défense",
      context.careerStatus === "recreational" ? "Sparring après Rémy et le passage amateur" : "Sparring comme activité distincte",
      ...(context.careerStatus === "recreational" ? ["Cours de groupe récréatif"] : []),
    ];

    return `<div class="v2-gym-view" data-career-status="${context.careerStatus}" data-membership-active="${context.membership.active}">
      <header class="v2-gym-header">
        <div><p class="eyebrow">GYM de boxe</p><h2>Bienvenue au GYM, ${escapeHTML(context.profile.firstName)}</h2></div>
        <button type="button" class="secondary-button" data-v2-leave-gym>Retour à la carte</button>
      </header>
      <div class="v2-gym-layout">
        <section class="v2-gym-floor" aria-labelledby="v2-gym-floor-title">
          <h3 id="v2-gym-floor-title" class="sr-only">Zones interactives du GYM</h3>
          <picture>
            <source media="(max-width: 640px)" srcset="assets/gym-boxe-v2-mobile.jpg">
            <img src="assets/gym-boxe-v2-desktop.jpg" width="1440" height="810" alt="Intérieur illustré d’un gym de boxe avec ring et zones d’entraînement" />
          </picture>
          <div class="v2-gym-hotspots">${zones}</div>
          ${membershipLock}
        </section>
        <aside class="v2-gym-dashboard" aria-label="Séance et état actuel">
          <section class="v2-gym-readiness weekly">
            <span>Énergie restante de la semaine</span><strong>${context.weekCapacity.remaining}/${context.weekCapacity.total}</strong>
            <progress max="${context.weekCapacity.total}" value="${context.weekCapacity.remaining}" aria-label="Énergie hebdomadaire restante : ${context.weekCapacity.remaining} sur ${context.weekCapacity.total}">${context.weekCapacity.remaining}/${context.weekCapacity.total}</progress>
            <p>${context.weekCapacity.used} déjà réservée. Les choix restent modifiables avant la confirmation.</p>
          </section>
          ${renderWeekPlan(context)}
          <section class="v2-gym-readiness ${context.condition.preparationTone}">
            <span>Préparation</span><strong>${escapeHTML(context.condition.preparationLabel)}</strong>
            <p>${escapeHTML(context.condition.preparationDetail)}</p>
            <div class="v2-gym-meters">
              <label>Énergie <meter min="0" max="100" value="${context.condition.energy}">${context.condition.energy} %</meter><b>${context.condition.energy} %</b></label>
              <label>Fatigue <meter min="0" max="100" value="${context.condition.fatigue}">${context.condition.fatigue} %</meter><b>${context.condition.fatigue} %</b></label>
              <span>Temps disponible <b>${context.condition.availableMinutes} min</b></span>
            </div>
          </section>
          <section class="v2-gym-coach-card" aria-labelledby="v2-gym-coach-title">
            <p class="eyebrow">Préparée par ${escapeHTML(context.coach.name)}</p>
            <h3 id="v2-gym-coach-title">${escapeHTML(context.coach.sessionTitle)}</h3>
            <p>${escapeHTML(context.coach.sessionSummary)}</p>
            <p class="v2-gym-session-duration"><strong>${context.coach.durationMinutes} minutes</strong> · adaptée à ton état actuel</p>
            ${coachNotice}
            <button type="button" class="${coachButtonClass}" data-v2-coach-session aria-pressed="${context.coach.planned}"${coachDisabled}>${coachButtonLabel}</button>
            <button type="button" class="secondary-button" data-v2-compose-session${composerDisabled}>Composer puis ajouter</button>
            <div class="v2-gym-private-trainer"><strong>${escapeHTML(context.privateTrainer.name)}</strong><small id="v2-gym-private-trainer-reason">${escapeHTML(context.privateTrainer.available ? context.privateTrainer.detail : context.careerStatus === "recreational" ? "Les programmes privés se débloquent après le passage amateur." : "Un abonnement actif est requis.")}</small><button type="button" class="secondary-button" data-v2-boxing-trainer${privateTrainerDisabled}>${escapeHTML(context.privateTrainer.actionLabel)}</button></div>
          </section>
          ${renderSparringCard(context)}
          <section class="v2-gym-membership ${context.membership.active ? "active" : "inactive"}">
            <span>Réception du GYM</span><strong>${escapeHTML(context.membership.active ? context.membership.label : "Inscription requise")}</strong><p>${escapeHTML(context.membership.detail)}</p>
            <ul class="v2-gym-access-preview" aria-label="${context.membership.active ? "Activités comprises" : "Activités déverrouillées après l’inscription"}">${accessItems.map(item => `<li><span aria-hidden="true">${context.membership.active ? "✓" : "🔒"}</span>${escapeHTML(item)}</li>`).join("")}</ul>
            <div class="v2-gym-membership-price"><span>Forfait 1 mois</span><strong>${context.membership.monthlyPrice} $</strong><small>${escapeHTML(priceDetail)}</small></div>
            <button type="button" class="${context.membership.active ? "secondary-button" : "primary-button"}" data-v2-gym-zone="reception" aria-label="${escapeHTML(`${membershipButton}. ${priceDetail}`)}">${escapeHTML(membershipButton)}</button>
          </section>
          ${recreationalPath(context)}
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
    const projectedFatigue = Math.min(100, context.condition.fatigue + fatigueGain);
    const exerciseButtons = EXERCISES.map(exercise => {
      const isSelected = selected.includes(exercise.id);
      const lacksEnergy = !isSelected && exercise.energyCost > projectedEnergy;
      const disabled = membershipLocked || context.condition.trainingBlocked || lacksEnergy ? " disabled aria-disabled=\"true\"" : "";
      const stateLabel = isSelected ? "Sélectionnée · toucher pour retirer" : lacksEnergy ? "Énergie insuffisante" : `Ajouter · −${exercise.energyCost} énergie`;
      return `<button type="button" class="v2-exercise-choice${isSelected ? " selected" : ""}" data-v2-exercise="${exercise.id}" aria-pressed="${isSelected}" aria-label="${escapeHTML(`${exercise.label}. ${stateLabel}`)}"${disabled}><span class="v2-exercise-heading-row"><strong>${escapeHTML(exercise.label)}</strong><b>−${exercise.energyCost} E</b></span><small>${escapeHTML(exercise.detail)}</small><em>${exercise.durationMinutes} min · ${escapeHTML(stateLabel)}</em></button>`;
    }).join("");
    const blocks = selected.length
      ? selected.map((id, index) => {
          const exercise = EXERCISES.find(item => item.id === id);
          return `<li><span>Activité ${index + 1}</span><strong>${escapeHTML(exercise.label)}</strong><small>−${exercise.energyCost} E · ${exercise.durationMinutes} min</small><button type="button" data-v2-exercise="${exercise.id}" aria-label="Retirer ${escapeHTML(exercise.label)}">Retirer</button></li>`;
        }).join("")
      : `<li class="empty">Choisis ta première activité ci-dessous. Tu peux commencer petit ou bâtir une séance plus complète.</li>`;

    return `<section class="v2-session-composer" aria-labelledby="v2-composer-title">
      <header><div><p class="eyebrow">Séance personnalisée</p><h2 id="v2-composer-title">Bâtis ta séance avec ton énergie</h2></div><button type="button" data-v2-close-composer aria-label="Fermer le compositeur">Fermer</button></header>
      <p>Ajoute librement les activités qui t’intéressent. Chaque choix réduit immédiatement l’énergie projetée; retirer une activité la remet dans la réserve.</p>
      ${membershipLocked ? `<p class="v2-composer-membership-note" role="status"><strong>Inscription requise.</strong> Retourne à la réception pour débloquer les activités du GYM.</p>` : ""}
      <section class="v2-composer-energy" aria-label="Énergie disponible pendant la composition" aria-live="polite"><div><span>Énergie pour cette séance</span><strong>${projectedEnergy} %</strong></div><progress max="100" value="${projectedEnergy}">${projectedEnergy} %</progress><p>${context.condition.energy} % au départ · ${energyCost ? `−${energyCost} points dépensés` : "aucune dépense choisie"}</p></section>
      <div class="v2-composer-state" aria-live="polite"><strong>${selected.length} activité${selected.length > 1 ? "s" : ""}</strong><span>Durée prévue : ${context.draftDurationMinutes} min</span><span>Énergie après : ${projectedEnergy} %</span><span>Fatigue après : ${projectedFatigue} %</span></div>
      <ol class="v2-session-blocks" aria-label="Activités choisies">${blocks}</ol>
      <div class="v2-exercise-grid" aria-label="Exercices disponibles">${exerciseButtons}</div>
      <footer><button type="button" class="secondary-button" data-v2-close-composer>Annuler</button><button type="button" class="primary-button" data-v2-confirm-session${selected.length >= 1 && !context.condition.trainingBlocked && !membershipLocked ? "" : " disabled aria-disabled=\"true\""}>Ajouter à ma semaine</button></footer>
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

  return Object.freeze({ EXERCISES, ZONES, normalizeContext, render, renderComposer, renderResult });
});
