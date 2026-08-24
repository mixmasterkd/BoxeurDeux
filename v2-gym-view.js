(function attachBoxeurGymView(root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.BoxeurGymView = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createBoxeurGymViewApi() {
  "use strict";

  const EXERCISES = Object.freeze([
    Object.freeze({ id: "jump-rope", label: "Corde à danser", short: "Corde", detail: "Rythme, appuis et cardio." }),
    Object.freeze({ id: "shadow-boxing", label: "Shadow-boxing", short: "Shadow", detail: "Technique, fluidité et déplacements." }),
    Object.freeze({ id: "heavy-bag", label: "Sac lourd", short: "Sac", detail: "Enchaînements, puissance et gestion de l’effort." }),
    Object.freeze({ id: "mitt-work", label: "Travail aux mitaines", short: "Mitaines", detail: "Précision, réactions et consignes de l’entraîneur." }),
    Object.freeze({ id: "defense", label: "Défense et esquives", short: "Défense", detail: "Blocages, retraits, pivots et sorties des câbles." }),
    Object.freeze({ id: "sparring", label: "Ring et sparring", short: "Ring", detail: "Mise en situation contrôlée avec un partenaire." }),
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
    const membership = raw.membership && typeof raw.membership === "object" ? raw.membership : {};
    const recreational = raw.recreational && typeof raw.recreational === "object" ? raw.recreational : {};
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
        notice: coach.notice || "",
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
      selectedExercises: Array.isArray(raw.selectedExercises)
        ? raw.selectedExercises.filter((id, index, list) => EXERCISES.some(exercise => exercise.id === id) && list.indexOf(id) === index).slice(0, 3)
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

  function render(rawContext) {
    const context = normalizeContext(rawContext);
    const zones = ZONES.map(zone => {
      const medicallyBlocked = context.membership.active && context.condition.trainingBlocked && !["coach", "reception"].includes(zone.id);
      const membershipBlocked = !context.membership.active && zone.id !== "reception";
      const disabled = medicallyBlocked
        ? " disabled aria-disabled=\"true\""
        : membershipBlocked ? " aria-disabled=\"true\" aria-describedby=\"v2-gym-membership-lock-reason\"" : "";
      const reason = medicallyBlocked
        ? ` Indisponible : ${context.condition.trainingBlockedReason}`
        : membershipBlocked ? " Verrouillé : inscription au GYM requise." : "";
      const lock = membershipBlocked ? `<span class="v2-gym-hotspot-lock" aria-hidden="true">🔒</span>` : "";
      return `<button type="button" class="v2-gym-hotspot v2-gym-hotspot-${zone.id}" data-v2-gym-zone="${zone.id}" aria-label="${escapeHTML(zone.label)}. ${escapeHTML(zone.detail)}${escapeHTML(reason)}"${disabled}><strong>${escapeHTML(zone.label)}</strong><small>${escapeHTML(zone.detail)}</small>${lock}</button>`;
    }).join("");
    const coachDisabled = context.coach.available && context.membership.active ? "" : " disabled aria-disabled=\"true\"";
    const composerDisabled = context.condition.trainingBlocked || !context.membership.active ? " disabled aria-disabled=\"true\"" : "";
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
      "Ring et sparring",
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
            <button type="button" class="primary-button" data-v2-coach-session${coachDisabled}>Faire la séance de l’entraîneur</button>
            <button type="button" class="secondary-button" data-v2-compose-session${composerDisabled}>Composer ma séance</button>
          </section>
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
    const maximumReached = selected.length >= 3;
    const membershipLocked = !context.membership.active;
    const exerciseButtons = EXERCISES.map(exercise => {
      const isSelected = selected.includes(exercise.id);
      const disabled = membershipLocked || context.condition.trainingBlocked || (maximumReached && !isSelected) ? " disabled aria-disabled=\"true\"" : "";
      return `<button type="button" class="v2-exercise-choice${isSelected ? " selected" : ""}" data-v2-exercise="${exercise.id}" aria-pressed="${isSelected}"${disabled}><strong>${escapeHTML(exercise.label)}</strong><small>${escapeHTML(exercise.detail)}</small></button>`;
    }).join("");
    const blocks = selected.length
      ? selected.map((id, index) => {
          const exercise = EXERCISES.find(item => item.id === id);
          return `<li><span>Bloc ${index + 1}</span><strong>${escapeHTML(exercise.label)}</strong><button type="button" data-v2-exercise="${exercise.id}" aria-label="Retirer ${escapeHTML(exercise.label)}">Retirer</button></li>`;
        }).join("")
      : `<li class="empty">Choisis ton premier bloc ci-dessous.</li>`;

    return `<section class="v2-session-composer" aria-labelledby="v2-composer-title">
      <header><div><p class="eyebrow">Séance personnalisée</p><h2 id="v2-composer-title">Compose jusqu’à trois blocs</h2></div><button type="button" data-v2-close-composer aria-label="Fermer le compositeur">Fermer</button></header>
      <p>Une séance courte et cohérente vaut mieux qu’une accumulation de clics. Tu peux modifier un bloc avant de confirmer.</p>
      ${membershipLocked ? `<p class="v2-composer-membership-note" role="status"><strong>Inscription requise.</strong> Retourne à la réception pour débloquer les activités du GYM.</p>` : ""}
      <div class="v2-composer-state" aria-live="polite"><strong>${selected.length}/3 blocs</strong><span>Durée prévue : ${context.draftDurationMinutes} min</span><span>Énergie : ${context.condition.energy} %</span><span>Fatigue : ${context.condition.fatigue} %</span></div>
      <ol class="v2-session-blocks" aria-label="Blocs choisis">${blocks}</ol>
      <div class="v2-exercise-grid" aria-label="Exercices disponibles">${exerciseButtons}</div>
      <footer><button type="button" class="secondary-button" data-v2-close-composer>Annuler</button><button type="button" class="primary-button" data-v2-confirm-session${selected.length >= 2 && !context.condition.trainingBlocked && !membershipLocked ? "" : " disabled aria-disabled=\"true\""}>Commencer ma séance</button></footer>
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
