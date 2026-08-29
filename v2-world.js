(function attachBoxeurWorld(root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.BoxeurWorld = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createBoxeurWorldApi() {
  "use strict";

  const LOCATIONS = Object.freeze([
    Object.freeze({ id: "home", label: "Maison", icon: "⌂", detail: "Repos, repas, messages et sac au sous-sol." }),
    Object.freeze({ id: "boxing-gym", label: "GYM de boxe", icon: "B", detail: "Séance du coach, travail aux mitaines, entraînement personnalisé, sparring et entraîneurs privés." }),
    Object.freeze({ id: "strength-gym", label: "Gym de musculation", icon: "M", detail: "Puissance, cardio, récupération et préparateurs physiques." }),
    Object.freeze({ id: "work", label: "Emploi", icon: "$", detail: "Semaine de travail, entrevues, vacances et finances." }),
    Object.freeze({ id: "arena", label: "Aréna", icon: "★", detail: "Galas, tournois, pesées et combats programmés." }),
  ]);

  function escapeHTML(value) {
    return String(value == null ? "" : value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function sparringPartner(career = {}) {
    const supplied = career.v2SparringPartner && typeof career.v2SparringPartner === "object"
      ? career.v2SparringPartner
      : {};
    const firstName = String(supplied.firstName || "Rémy");
    return {
      firstName,
      displayName: String(supplied.displayName || `${firstName} « Le Tank »`),
    };
  }

  function preparation(career) {
    if (career.v2Preparation && typeof career.v2Preparation === "object") {
      const supplied = career.v2Preparation;
      return {
        label: supplied.label || "À surveiller",
        tone: ["positive", "steady", "warning", "critical"].includes(supplied.tone) ? supplied.tone : "steady",
        detail: supplied.detail || (Array.isArray(supplied.reasons) ? supplied.reasons.join(" · ") : "État calculé par le moteur de récupération."),
      };
    }
    const energy = Math.max(0, Math.min(100, Number(career.energy) || 0));
    const fatigue = Math.max(0, Math.min(100, Number(career.fatigue) || 0));
    const score = energy - fatigue * 0.55;
    if (score >= 62) return { label: "Très bonne", tone: "positive", detail: "Le corps est frais et disponible pour une séance productive." };
    if (score >= 38) return { label: "Correcte", tone: "steady", detail: "Une séance modérée demeure raisonnable aujourd’hui." };
    return { label: "Fragile", tone: "warning", detail: "La récupération devrait passer avant une autre grosse charge." };
  }

  function onboardingObjective(career) {
    const step = career.v2OnboardingStep;
    const onboarding = career.v2Onboarding;
    if (!step || typeof step !== "object") return null;
    if (onboarding && typeof onboarding === "object" && ["complete", "exempt"].includes(onboarding.mode)) return null;
    if (["complete", "exempt"].includes(step.type) || ["onboarding-complete", "onboarding-exempt"].includes(step.id)) return null;
    const locationId = String(step.locationId || "");
    const validLocation = locationId === "map" || LOCATIONS.some(location => location.id === locationId);
    const week = Math.max(1, Math.min(999, Number(onboarding?.week ?? career.week) || 1));
    const remyWeek = Math.max(2, Math.min(52, Number(onboarding?.remyWeek) || 6));
    const partner = step.sparringPartner && typeof step.sparringPartner === "object"
      ? sparringPartner({ v2SparringPartner: step.sparringPartner })
      : sparringPartner(career);
    return {
      id: String(step.id || "guided-step"),
      type: String(step.type || "objective"),
      title: step.title || "Prochaine étape du parcours",
      detail: step.detail || "Suis le repère proposé pour avancer sans devoir tout planifier.",
      locationId: validLocation ? locationId : "boxing-gym",
      required: step.required === true,
      actionMode: String(step.actionMode || ""),
      onboarding: true,
      week,
      remyWeek,
      sparringPartner: partner,
    };
  }

  function objective(career) {
    const guided = onboardingObjective(career);
    if (guided) return guided;
    if (career.careerStatus === "recreational") {
      const partner = sparringPartner(career);
      if (!career.jobId && isFirstJobRequired(career)) return { title: "Choisir un emploi", detail: "Ton premier revenu finance le GYM et le début du parcours.", locationId: "work" };
      if (!career.gymWeeks) return { title: "Entrer au GYM de boxe", detail: "Active ton premier abonnement et rencontre le coach.", locationId: "boxing-gym" };
      if (career.recreationalSparringStatus === "completed") return { title: "Statut amateur obtenu", detail: "Rémy « Le Tank » a donné son feu vert et le circuit amateur est maintenant ouvert.", locationId: "arena" };
      if (career.recreationalSparringStatus === "ready" || career.scheduledFight?.isRecreationalSparring) return { title: `Sparring avec ${partner.firstName}`, detail: `Le ring est prêt pour ton évaluation pédagogique contre ${partner.displayName}.`, locationId: "boxing-gym" };
      const progress = Math.max(0, Number(career.recreationalTrainingWeeks) || 0);
      return { title: "Bâtir tes bases", detail: `${progress} entraînement${progress > 1 ? "s" : ""} complété${progress > 1 ? "s" : ""}. ${partner.firstName} t’évalue à la semaine 6; le passage amateur suivra automatiquement.`, locationId: "boxing-gym" };
    }
    if (career.activeTournament) return { title: "Tournoi en cours", detail: "La pesée, le prochain combat et la récupération se gèrent à l’aréna.", locationId: "arena" };
    if (career.scheduledFight) return { title: "Préparer le prochain combat", detail: `Combat prévu à la semaine ${career.scheduledFight.week}.`, locationId: "arena" };
    return { title: "Choisir la prochaine occasion", detail: "Consulte les galas et tournois annoncés sans remplir ton horaire trop loin d’avance.", locationId: "arena" };
  }

  function locationLabel(locationId) {
    if (locationId === "map") return "la carte";
    return LOCATIONS.find(location => location.id === locationId)?.label || "le lieu indiqué";
  }

  function guideInstruction(currentObjective, currentLocationId) {
    if (currentObjective.actionMode === "review-and-confirm") {
      return "Ton programme est prêt, mais rien n’est encore appliqué. Ouvre-le pour le vérifier, puis confirme la semaine dans la fenêtre suivante.";
    }
    if (currentObjective.actionMode === "quick-plan") {
      return "Appuie sur « Suivre le plan rapide ». Le programme restera entièrement modifiable avant sa confirmation.";
    }
    const destination = locationLabel(currentObjective.locationId);
    if (currentLocationId === "map") {
      return `Sur la carte, appuie sur « ${destination} » pour poursuivre cette étape.`;
    }
    if (currentLocationId !== currentObjective.locationId) {
      return `Retourne à la carte, puis appuie sur « ${destination} » pour poursuivre cette étape.`;
    }
    if (currentObjective.type === "membership" && currentLocationId === "boxing-gym") {
      return "Dans le GYM, appuie sur « Accueil », puis choisis le premier abonnement.";
    }
    if (currentObjective.type === "membership-renewal" && currentLocationId === "boxing-gym") {
      return "Dans le GYM, appuie sur « Accueil », puis choisis et paie le forfait que tu veux renouveler.";
    }
    if (currentObjective.type === "work-priority" && currentLocationId === "work") {
      return "Dans le panneau de ton emploi, retire le travail de cette semaine. La perte de paie et l’absence seront appliquées normalement.";
    }
    if (currentObjective.type === "home-training" && currentLocationId === "home") {
      return "À la maison, ouvre le sous-sol et ajoute « Entraînement maison rapide ». Cette séance utilise réellement le shadow-boxing et le sac.";
    }
    if (currentObjective.type === "roadwork" && currentLocationId === "home") {
      return "À la maison, ouvre le menu « Course » par la porte, puis ajoute « Court jog » à ta semaine.";
    }
    if (currentObjective.type === "recreational-course" && currentLocationId === "boxing-gym") {
      return "Dans le GYM, va voir l’entraîneur et ajoute le cours récréatif à ta semaine.";
    }
    if (currentObjective.type === "objective" && currentLocationId === "boxing-gym") {
      return "Dans le GYM, va voir l’entraîneur et ajoute le cours récréatif à ta semaine.";
    }
    if (currentObjective.type === "recovery" && currentLocationId === "home") {
      return "À la maison, appuie sur « Journée de repos », puis ajoute-la à ta semaine.";
    }
    if (currentObjective.type === "job" && currentLocationId === "work") {
      return "Dans le lieu de travail, appuie sur « Choisir mon emploi », puis sélectionne ton premier poste.";
    }
    if (currentObjective.type === "sparring" && currentLocationId === "boxing-gym") {
      return `Dans le GYM, va au ring et commence le sparring pédagogique avec ${currentObjective.sparringPartner?.firstName || "Rémy"}.`;
    }
    return `Suis les indications de ${destination} pour poursuivre cette étape.`;
  }

  function guideAction(currentObjective, currentLocationId) {
    if (currentObjective.actionMode === "review-and-confirm") {
      return `<div class="v2-onboarding-actions"><button class="primary-button" type="button" data-v2-week-handoff>Confirmer semaine</button></div>`;
    }
    if (currentObjective.actionMode === "quick-plan") {
      return `<button class="primary-button" type="button" data-v2-week-quick>Suivre le plan rapide</button>`;
    }
    if (currentLocationId !== currentObjective.locationId) {
      return currentObjective.locationId === "map"
        ? ""
        : `<button class="primary-button" type="button" data-v2-location="${escapeHTML(currentObjective.locationId)}">M’y rendre</button>`;
    }
    if (currentObjective.type === "membership" && currentLocationId === "boxing-gym") {
      return `<button class="primary-button" type="button" data-v2-gym-zone="reception">Aller à l’accueil</button>`;
    }
    if (currentObjective.type === "membership-renewal" && currentLocationId === "boxing-gym") {
      return `<button class="primary-button" type="button" data-v2-gym-zone="reception">Renouveler à l’accueil</button>`;
    }
    if (currentObjective.type === "work-priority" && currentLocationId === "work") {
      return `<button class="primary-button" type="button" data-v2-toggle-work aria-pressed="true">Ne pas travailler cette semaine</button>`;
    }
    if (currentObjective.type === "home-training" && currentLocationId === "home") {
      return `<button class="primary-button" type="button" data-v2-home-menu="training">Ouvrir le menu du sous-sol</button>`;
    }
    if (currentObjective.type === "roadwork" && currentLocationId === "home") {
      return `<button class="primary-button" type="button" data-v2-home-menu="running">Ouvrir le menu Course</button>`;
    }
    if (currentObjective.type === "recreational-course" && currentLocationId === "boxing-gym") {
      return `<button class="primary-button" type="button" data-v2-gym-zone="coach">Voir le cours récréatif</button>`;
    }
    if (currentObjective.type === "objective" && currentLocationId === "boxing-gym") {
      return `<button class="primary-button" type="button" data-v2-gym-zone="coach">Voir le cours récréatif</button>`;
    }
    if (currentObjective.type === "recovery" && currentLocationId === "home") {
      return `<button class="primary-button" type="button" data-v2-home-action="rest">Ajouter une journée de repos</button>`;
    }
    if (currentObjective.type === "job" && currentLocationId === "work") {
      return `<button class="primary-button" type="button" data-v2-open-job-menu>Choisir mon emploi</button>`;
    }
    if (currentObjective.type === "sparring" && currentLocationId === "boxing-gym") {
      return `<button class="primary-button" type="button" data-v2-remy-sparring>Faire le sparring pédagogique</button>`;
    }
    return "";
  }

  function renderObjectiveCard(currentObjective, currentLocationId = "map") {
    const hasDestination = LOCATIONS.some(location => location.id === currentObjective.locationId);
    const destination = hasDestination
      ? `<button class="primary-button" type="button" data-v2-location="${escapeHTML(currentObjective.locationId)}">M’y rendre</button>`
      : "";
    if (!currentObjective.onboarding) {
      return `<section class="v2-objective-card"><p class="eyebrow">Prochaine étape</p><h3>${escapeHTML(currentObjective.title)}</h3><p>${escapeHTML(currentObjective.detail)}</p>${destination}</section>`;
    }

    const currentWeek = Math.max(1, Math.min(currentObjective.remyWeek, currentObjective.week));
    const partnerName = currentObjective.sparringPartner?.firstName || "Rémy";
    const requirement = currentObjective.required ? "Obligatoire" : "Facultatif";
    const requirementClass = currentObjective.required ? "required" : "optional";
    const progressLabel = currentObjective.week >= currentObjective.remyWeek
      ? `${partnerName} · semaine ${currentObjective.remyWeek}`
      : `Semaine ${currentObjective.week} sur ${currentObjective.remyWeek}`;
    const actions = guideAction(currentObjective, currentLocationId);
    const instruction = guideInstruction(currentObjective, currentLocationId);
    const locationClass = currentLocationId === "map" ? "" : " v2-location-guide";
    return `<section class="v2-objective-card v2-onboarding-card ${requirementClass}${locationClass}" data-v2-onboarding-step="${escapeHTML(currentObjective.id)}">
      <div class="v2-objective-heading"><p class="eyebrow">Guide récréatif</p><span class="v2-objective-requirement ${requirementClass}">${requirement}</span></div>
      <div class="v2-onboarding-track" aria-label="Parcours guidé : semaine ${currentWeek} sur ${currentObjective.remyWeek} avant le sparring de ${escapeHTML(partnerName)}">
        <div><span>Semaine 1</span><strong>${escapeHTML(progressLabel)}</strong><span>${escapeHTML(partnerName)} · semaine ${currentObjective.remyWeek}</span></div>
        <progress max="${currentObjective.remyWeek}" value="${currentWeek}">${currentWeek}/${currentObjective.remyWeek}</progress>
      </div>
      <h3>${escapeHTML(currentObjective.title)}</h3><p>${escapeHTML(currentObjective.detail)}</p><p class="v2-guide-instruction"><strong>Comment faire :</strong> ${escapeHTML(instruction)}</p>${actions}
    </section>`;
  }

  function renderLocationGuide(career, locationId) {
    const currentObjective = objective(career);
    return currentObjective.onboarding ? renderObjectiveCard(currentObjective, locationId) : "";
  }

  function isFirstJobRequired(career) {
    return career.introJobRequired === true && Math.max(0, Number(career.jobsHeldCount) || 0) === 0;
  }

  function appointmentList(career) {
    const candidates = [career.v2Appointments, career.appointments, career.timeState?.appointments];
    return candidates.find(Array.isArray) || [];
  }

  function nextScheduledAppointment(career) {
    const currentSlot = Number(career.v2Clock?.absoluteSlot);
    return appointmentList(career)
      .filter(appointment => appointment && typeof appointment === "object")
      .filter(appointment => !Number.isFinite(currentSlot) || !Number.isFinite(Number(appointment.startSlot)) || Number(appointment.startSlot) >= currentSlot)
      .sort((left, right) => (Number(left.startSlot) || 0) - (Number(right.startSlot) || 0))[0] || null;
  }

  function nextAppointment(career) {
    if (career.activeTournament) return "Tournoi actif · prochaine étape à l’aréna";
    if (career.scheduledFight) return `Combat · semaine ${career.scheduledFight.week}`;
    const appointment = nextScheduledAppointment(career);
    if (appointment) return appointment.title || "Rendez-vous confirmé";
    return "Aucun rendez-vous confirmé";
  }

  function locationStatus(location, career) {
    if (location.id === "boxing-gym") return career.gymWeeks > 0 ? `Abonnement · ${career.gymWeeks} sem.` : "Inscription requise";
    if (location.id === "strength-gym") {
      if (career.careerStatus === "recreational") return "Verrouillé · amateur requis";
      return career.strengthGymWeeks > 0 ? `Abonnement · ${career.strengthGymWeeks} sem.` : "Abonnement facultatif";
    }
    if (location.id === "work") {
      if (career.jobId) return "Emploi actif";
      if (isFirstJobRequired(career)) return "Premier emploi requis";
      if (career.jobApplication) return "Candidature en cours";
      return "Facultatif";
    }
    if (location.id === "arena") return career.scheduledFight || career.activeTournament ? "Rendez-vous actif" : career.careerStatus === "recreational" ? "Verrouillé · amateur requis" : "Événements disponibles";
    return "Toujours accessible";
  }

  function locationAccess(locationInput, career = {}) {
    const locationId = typeof locationInput === "string" ? locationInput : locationInput?.id;
    const locked = career.careerStatus === "recreational"
      && ["strength-gym", "arena"].includes(locationId);
    return {
      locked,
      reason: locked ? "Disponible après le passage amateur." : "",
    };
  }

  function developerTestBanner(career) {
    const testState = career.v2DeveloperTest;
    if (!testState || testState.active !== true) return "";
    const profileLabel = testState.profileLabel
      || [career.profile?.firstName, career.profile?.lastName].filter(Boolean).join(" ")
      || "Profil de test";
    const returnDisabled = testState.canReturn === true ? "" : ' disabled aria-disabled="true"';
    return `<aside class="v2-test-mode-banner" aria-label="Mode test actif">
      <div><span>Mode test actif</span><strong>${escapeHTML(profileLabel)}</strong><small>Ta vraie carrière reste conservée séparément.</small></div>
      <button type="button" data-v2-restore-career${returnDisabled}>Retour à ma carrière</button>
    </aside>`;
  }

  function workDeveloperTile() {
    return "";
  }

  function workManagement(career) {
    const job = career.v2Job && typeof career.v2Job === "object" ? career.v2Job : null;
    const firstJobRequired = isFirstJobRequired(career) && !job;
    const application = career.jobApplication && typeof career.jobApplication === "object" ? career.jobApplication : null;
    const applicationJob = application ? career.v2JobApplicationLabel || "Emploi visé" : "";
    if (job) {
      const planned = career.v2WorkPlan?.planned !== false;
      const missed = Math.max(0, Math.min(2, Math.round(Number(career.missedWorkWeeks) || 0)));
      const workStatus = planned
        ? `Le travail est prévu cette semaine et réserve ${Math.max(0, Math.round(Number(career.v2WorkPlan?.cost) || 0))} énergie. Tu peux le retirer avant la confirmation.`
        : "Tu as retiré le travail de cette semaine : l’énergie est libérée, mais tu ne recevras aucune paie et cette semaine comptera comme une absence.";
      const attendance = missed > 0
        ? `<p class="v2-work-attendance-warning"><strong>${missed}/3 absence${missed > 1 ? "s" : ""} consécutive${missed > 1 ? "s" : ""}.</strong> La troisième entraîne le congédiement.</p>`
        : "";
      const applicationCopy = application
        ? `<p><strong>Candidature en cours :</strong> ${escapeHTML(applicationJob)} · ${Math.max(0, Math.round(Number(application.progress) || 0))}/${Math.max(1, Math.round(Number(application.requiredWeeks) || 1))} semaine${Number(application.requiredWeeks) > 1 ? "s" : ""} écoulée${Number(application.progress) > 1 ? "s" : ""}.</p>`
        : "";
      const shiftButton = `<button class="${planned ? "secondary-button" : "primary-button"}" type="button" data-v2-toggle-work aria-pressed="${planned}">${planned ? "Retirer le travail de ma semaine" : "Ajouter le travail à ma semaine"}</button>`;
      return `<section class="v2-work-management" aria-labelledby="v2-work-management-title">
        <div><p class="eyebrow">Emploi actuel</p><h3 id="v2-work-management-title">${escapeHTML(job.title || "Emploi actif")}</h3></div>
        <dl><div><dt>Paie de la semaine</dt><dd>${Math.round(Number(job.wage) || 0)} $</dd></div><div><dt>Horaire</dt><dd>${escapeHTML(job.schedule || "Horaire régulier")}</dd></div></dl>
        <p><strong>Le salaire affiché est hebdomadaire.</strong> Un emploi plus payant réserve davantage d’énergie et laisse moins de place au camp.</p>
        <p>${escapeHTML(workStatus)}</p>${attendance}${applicationCopy}
        <div class="v2-work-management-actions">${shiftButton}<button class="secondary-button" type="button" data-v2-open-job-menu>Voir mon emploi</button></div>
      </section>`;
    }
    if (application) {
      const progress = Math.max(0, Math.round(Number(application.progress) || 0));
      const required = Math.max(1, Math.round(Number(application.requiredWeeks) || 1));
      const remaining = Math.max(0, required - progress);
      return `<section class="v2-work-management" aria-labelledby="v2-work-management-title">
        <div><p class="eyebrow">Candidature en cours</p><h3 id="v2-work-management-title">${escapeHTML(applicationJob)}</h3></div>
        <p>Réponse garantie dans <strong>${remaining} semaine${remaining > 1 ? "s" : ""}</strong>. Chaque semaine confirmée fait avancer automatiquement l’attente.</p>
        <progress max="${required}" value="${progress}" aria-label="Progression de la candidature : ${progress} sur ${required}">${progress}/${required}</progress>
        <div class="v2-work-management-actions"><button class="secondary-button" type="button" data-v2-open-job-menu>Voir ou changer la candidature</button></div>
      </section>`;
    }
    return `<section class="v2-work-management ${firstJobRequired ? "required" : ""}" aria-labelledby="v2-work-management-title">
      <div><p class="eyebrow">${firstJobRequired ? "Étape obligatoire" : "Revenu facultatif"}</p><h3 id="v2-work-management-title">${firstJobRequired ? "Choisis ton premier emploi" : "Chercher un emploi"}</h3></div>
      <p>${firstJobRequired ? "Ton premier emploi est obtenu immédiatement. Il finance le début du parcours et sera inclus par défaut dans chaque semaine." : "Tu peux poursuivre sans emploi ou postuler. L’attente dure de une à trois semaines selon le poste."}</p>
      <button class="primary-button" type="button" data-v2-open-job-menu>${firstJobRequired ? "Choisir mon emploi" : "Voir les emplois"}</button>
    </section>`;
  }

  function render(career) {
    const prep = preparation(career);
    const currentObjective = objective(career);
    const firstName = career.profile?.firstName || "Boxeur";
    const clockLabel = career.v2Clock?.dayLabel && career.v2Clock?.periodLabel
      ? `${career.v2Clock.dayLabel} · ${String(career.v2Clock.periodLabel).toLocaleLowerCase("fr-CA")}`
      : "Lundi · matin";
    const dateLabel = `${clockLabel} · ${career.v2DateLabel || "date à confirmer"}`;
    const moneyLabel = `${Math.round(Number(career.money) || 0)} $`;
    const hotspots = LOCATIONS.map(location => {
      const status = escapeHTML(locationStatus(location, career));
      const access = locationAccess(location, career);
      const accessAttributes = access.locked
        ? ` data-v2-locked="true" disabled aria-disabled="true" title="${escapeHTML(access.reason)}"`
        : "";
      const accessibleLabel = access.locked
        ? `Accès verrouillé : ${location.label}. ${access.reason}`
        : `Entrer : ${location.label}. ${locationStatus(location, career)}`;
      return `<button class="v2-map-hotspot" type="button" data-v2-location="${location.id}" aria-label="${escapeHTML(accessibleLabel)}"${accessAttributes}><span aria-hidden="true">${access.locked ? "🔒" : location.icon}</span><strong>${escapeHTML(location.label)}</strong><small>${status}</small></button>`;
    }).join("");
    return `<header class="v2-world-bar">
      <div class="v2-now-time"><span>Semaine</span><strong>${String(career.week || 1).padStart(2, "0")}</strong><small><span>${escapeHTML(dateLabel)}</span><b class="v2-now-money" aria-label="Argent disponible ${escapeHTML(moneyLabel)}">${escapeHTML(moneyLabel)}</b></small></div>
    </header>
    <div class="v2-world-layout">
      <div class="v2-map-stack">
        <section class="v2-map-panel" aria-label="Carte du quartier de carrière de ${escapeHTML(firstName)}">
          <div class="v2-map-heading"><p class="eyebrow">Quartier de carrière</p></div>
          ${developerTestBanner(career)}
          <div class="v2-map-canvas">
            <picture><source media="(max-width: 640px)" srcset="assets/carte-quartier-v2-mobile.jpg"><img src="assets/carte-quartier-v2-desktop.jpg" width="1440" height="810" alt="Carte illustrée du quartier avec la maison, les deux gyms, le lieu de travail et l’aréna" /></picture>
            <div class="v2-map-hotspots">${hotspots}</div>
          </div>
        </section>
        <nav class="v2-world-nav" aria-label="Navigation principale V2"><button class="active" type="button" data-v2-nav="map">Carte</button><button type="button" data-v2-open-calendar>Calendrier</button><button type="button" data-v2-nav="fighter">Boxeur</button><button type="button" data-v2-nav="inventory">Inventaire</button></nav>
      </div>
      <aside class="v2-now-panel" aria-label="Situation actuelle">
        ${renderObjectiveCard(currentObjective, "map")}
        <section class="v2-readiness-card ${prep.tone}"><span>État de préparation</span><strong>${escapeHTML(prep.label)}</strong><p>${escapeHTML(prep.detail)}</p><div class="v2-vitals"><span>Énergie <b>${Math.round(career.energy || 0)} %</b></span><span>Fatigue <b>${Math.round(career.fatigue || 0)} %</b></span></div></section>
        <section class="v2-appointment-card"><span>Prochain rendez-vous</span><strong>${escapeHTML(nextAppointment(career))}</strong><button type="button" data-v2-open-calendar>Voir les sept prochains jours</button></section>
      </aside>
    </div>
    <section class="v2-location-sheet" role="dialog" aria-modal="true" aria-label="Lieu du quartier" tabindex="-1" hidden></section>`;
  }

  function renderLocation(locationId, career) {
    const location = LOCATIONS.find(item => item.id === locationId);
    if (!location) return "";
    const objectiveHere = objective(career).locationId === location.id;
    const workContent = location.id === "work" ? `${workManagement(career)}${workDeveloperTile()}` : "";
    const previewNote = location.id === "work"
      ? "Les candidatures avancent automatiquement à chaque semaine confirmée."
      : location.id === "arena" ? "Les galas, les tournois et les combats réservés se gèrent dans le calendrier." : "";
    const actions = location.id === "arena" ? `<button class="primary-button" type="button" data-v2-open-calendar>Ouvrir le calendrier</button>` : "";
    return `<div class="v2-location-card" data-location="${location.id}"><div><p class="eyebrow">${objectiveHere ? "Destination recommandée" : "Lieu du quartier"}</p><h2>${escapeHTML(location.label)}</h2><p>${escapeHTML(location.detail)}</p></div><div class="v2-location-status"><span>État du lieu</span><strong>${escapeHTML(locationStatus(location, career))}</strong></div>${workContent}${previewNote ? `<p class="v2-location-preview-note">${previewNote}</p>` : ""}${actions}<button class="secondary-button" type="button" data-v2-close-location>Retour à la carte</button></div>`;
  }

  return Object.freeze({ LOCATIONS, preparation, onboardingObjective, objective, renderObjectiveCard, renderLocationGuide, renderWorkDeveloperTile: workDeveloperTile, isFirstJobRequired, nextAppointment, locationStatus, locationAccess, render, renderLocation });
});
