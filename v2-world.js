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
    Object.freeze({ id: "work", label: "Emploi", icon: "$", detail: "Quarts de travail, entrevues, vacances et finances." }),
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
    const injury = Math.max(0, Math.min(100, Number(career.injury) || 0));
    const score = energy - fatigue * 0.55 - injury * 0.35;
    if (career.injuryWeeks > 0) return { label: "Blessé", tone: "critical", detail: `${career.injuryWeeks} semaine${career.injuryWeeks > 1 ? "s" : ""} de récupération obligatoire.` };
    if (score >= 62) return { label: "Très bonne", tone: "positive", detail: "Le corps est frais et disponible pour une séance productive." };
    if (score >= 38) return { label: "Correcte", tone: "steady", detail: "Une séance modérée demeure raisonnable aujourd’hui." };
    return { label: "Fragile", tone: "warning", detail: "La récupération devrait passer avant une autre grosse charge." };
  }

  function objective(career) {
    if (career.careerStatus === "recreational") {
      if (!career.jobId && isFirstJobRequired(career)) return { title: "Choisir un emploi", detail: "Ton premier revenu finance le GYM et le début du parcours.", locationId: "work" };
      if (!career.gymWeeks) return { title: "Entrer au GYM de boxe", detail: "Active ton premier abonnement et rencontre le coach.", locationId: "boxing-gym" };
      if (career.recreationalSparringStatus === "completed") return { title: "Passer amateur", detail: "Rémy « Le Tank » a donné son feu vert. Retourne voir le coach.", locationId: "boxing-gym" };
      if (career.recreationalSparringStatus === "ready" || career.scheduledFight?.isRecreationalSparring) return { title: "Sparring avec Rémy", detail: "Le ring est prêt pour ton évaluation pédagogique.", locationId: "boxing-gym" };
      const progress = Math.max(0, Math.min(10, Number(career.recreationalTrainingWeeks) || 0));
      return { title: "Bâtir tes bases", detail: `${progress}/10 entraînements possibles. Rémy t’évalue à la semaine 6; tu peux rester récréatif jusqu’à la semaine 10.`, locationId: "boxing-gym" };
    }
    if (career.activeTournament) return { title: "Tournoi en cours", detail: "La pesée, le prochain combat et la récupération se gèrent à l’aréna.", locationId: "arena" };
    if (career.scheduledFight) return { title: "Préparer le prochain combat", detail: `Combat prévu à la semaine ${career.scheduledFight.week}.`, locationId: "arena" };
    return { title: "Choisir la prochaine occasion", detail: "Consulte les galas et tournois annoncés sans remplir ton horaire trop loin d’avance.", locationId: "arena" };
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
    if (location.id === "strength-gym") return career.strengthGymWeeks > 0 ? `Abonnement · ${career.strengthGymWeeks} sem.` : "Facultatif";
    if (location.id === "work") {
      if (career.jobId) return "Emploi actif";
      if (isFirstJobRequired(career)) return "Premier emploi requis";
      if (career.jobApplication) return "Candidature en cours";
      return "Facultatif";
    }
    if (location.id === "arena") return career.scheduledFight || career.activeTournament ? "Rendez-vous actif" : career.careerStatus === "recreational" ? "Verrouillé · récréatif" : "Événements disponibles";
    return career.injuryWeeks > 0 ? "Récupération recommandée" : "Toujours accessible";
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
    return `<section class="v2-work-actions" aria-labelledby="v2-work-actions-title">
      <div><p class="eyebrow">Possibilités du quartier</p><h3 id="v2-work-actions-title">Autres revenus</h3></div>
      <button class="v2-future-work-tile" type="button" data-v2-developer-secret aria-label="Vente de stupéfiants — À venir">
        <span class="v2-future-work-icon" aria-hidden="true">!</span>
        <span><strong>Vente de stupéfiants</strong><small>À venir</small></span>
      </button>
      <p>Cette activité et ses conséquences judiciaires ne font pas encore partie de la carrière.</p>
    </section>`;
  }

  function workManagement(career) {
    const job = career.v2Job && typeof career.v2Job === "object" ? career.v2Job : null;
    const firstJobRequired = isFirstJobRequired(career) && !job;
    if (job) {
      const workCompleted = career.v2WorkCompleted === true;
      const workAvailable = !workCompleted && career.v2WorkAvailable !== false;
      const workStatus = career.v2WorkBlockReason || (workCompleted ? "Quart terminé cette semaine · paie versée." : "Le mode rapide peut aussi simuler ce quart automatiquement.");
      const shiftButton = workCompleted
        ? `<button class="primary-button" type="button" disabled aria-disabled="true">Quart terminé · paie versée</button>`
        : `<button class="primary-button" type="button" data-v2-work-shift${workAvailable ? "" : ' disabled aria-disabled="true"'}>Faire mon quart · +${Math.round(Number(job.wage) || 0)} $</button>`;
      return `<section class="v2-work-management" aria-labelledby="v2-work-management-title">
        <div><p class="eyebrow">Emploi actuel</p><h3 id="v2-work-management-title">${escapeHTML(job.title || "Emploi actif")}</h3></div>
        <dl><div><dt>Paie hebdomadaire</dt><dd>${Math.round(Number(job.wage) || 0)} $</dd></div><div><dt>Horaire</dt><dd>${escapeHTML(job.schedule || "Quart régulier")}</dd></div></dl>
        <p>${escapeHTML(workStatus)}</p>
        <div class="v2-work-management-actions">${shiftButton}<button class="secondary-button" type="button" data-v2-open-job-menu>Voir mon emploi</button></div>
      </section>`;
    }
    return `<section class="v2-work-management ${firstJobRequired ? "required" : ""}" aria-labelledby="v2-work-management-title">
      <div><p class="eyebrow">${firstJobRequired ? "Étape obligatoire" : "Revenu facultatif"}</p><h3 id="v2-work-management-title">${firstJobRequired ? "Choisis ton premier emploi" : "Chercher un emploi"}</h3></div>
      <p>${firstJobRequired ? "Ton premier emploi est obtenu immédiatement. Il finance le début du parcours et sera inclus dans chaque semaine rapide." : "Tu peux poursuivre sans emploi ou consulter les possibilités disponibles."}</p>
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
    const dateAndMoney = `${clockLabel} · ${career.v2DateLabel || "date à confirmer"} · ${Math.round(Number(career.money) || 0)} $`;
    const hotspots = LOCATIONS.map(location => `<button class="v2-map-hotspot" type="button" data-v2-location="${location.id}" aria-label="Entrer : ${escapeHTML(location.label)}. ${escapeHTML(locationStatus(location, career))}"><span aria-hidden="true">${location.icon}</span><strong>${escapeHTML(location.label)}</strong><small>${escapeHTML(locationStatus(location, career))}</small></button>`).join("");
    return `<div class="v2-world-layout">
      <section class="v2-map-panel" aria-labelledby="v2-map-title">
        <div class="v2-map-heading"><div><p class="eyebrow">Quartier de carrière</p><h2 id="v2-map-title">Où vas-tu aujourd’hui, ${escapeHTML(firstName)}?</h2></div><a class="v2-preview-exit" href="./">Retour à l’interface actuelle</a></div>
        ${developerTestBanner(career)}
        <div class="v2-map-canvas">
          <picture><source media="(max-width: 640px)" srcset="assets/carte-quartier-v2-mobile.jpg"><img src="assets/carte-quartier-v2-desktop.jpg" width="1440" height="810" alt="Carte illustrée du quartier avec la maison, les deux gyms, le lieu de travail et l’aréna" /></picture>
          <div class="v2-map-hotspots">${hotspots}</div>
        </div>
      </section>
      <aside class="v2-now-panel" aria-label="Situation actuelle">
        <div class="v2-now-time"><span>Semaine</span><strong>${String(career.week || 1).padStart(2, "0")}</strong><small>${escapeHTML(dateAndMoney)}</small></div>
        <section class="v2-objective-card"><p class="eyebrow">Prochaine étape</p><h3>${escapeHTML(currentObjective.title)}</h3><p>${escapeHTML(currentObjective.detail)}</p><button class="primary-button" type="button" data-v2-location="${currentObjective.locationId}">M’y rendre</button></section>
        <section class="v2-readiness-card ${prep.tone}"><span>État de préparation</span><strong>${escapeHTML(prep.label)}</strong><p>${escapeHTML(prep.detail)}</p><div class="v2-vitals"><span>Énergie <b>${Math.round(career.energy || 0)} %</b></span><span>Fatigue <b>${Math.round(career.fatigue || 0)} %</b></span></div></section>
        <section class="v2-appointment-card"><span>Prochain rendez-vous</span><strong>${escapeHTML(nextAppointment(career))}</strong><button type="button" data-v2-open-calendar>Voir les sept prochains jours</button></section>
      </aside>
    </div>
    <nav class="v2-world-nav" aria-label="Navigation principale V2"><button class="active" type="button" data-v2-nav="map">Carte</button><button type="button" data-v2-open-calendar>Calendrier</button><button type="button" data-v2-nav="fighter">Boxeur</button><button type="button" data-v2-nav="messages">Messages</button></nav>
    <section class="v2-location-sheet" role="dialog" aria-modal="true" aria-label="Lieu du quartier" tabindex="-1" hidden></section>`;
  }

  function renderLocation(locationId, career) {
    const location = LOCATIONS.find(item => item.id === locationId);
    if (!location) return "";
    const objectiveHere = objective(career).locationId === location.id;
    const workContent = location.id === "work" ? `${workManagement(career)}${workDeveloperTile()}` : "";
    const previewNote = location.id === "work"
      ? "Les changements d’emploi par entrevues, les vacances et les mini-jeux seront branchés progressivement à ce lieu."
      : "L’intérieur interactif de ce lieu sera branché à la prochaine étape de la V2.";
    return `<div class="v2-location-card" data-location="${location.id}"><div><p class="eyebrow">${objectiveHere ? "Destination recommandée" : "Lieu du quartier"}</p><h2>${escapeHTML(location.label)}</h2><p>${escapeHTML(location.detail)}</p></div><div class="v2-location-status"><span>État du lieu</span><strong>${escapeHTML(locationStatus(location, career))}</strong></div>${workContent}<p class="v2-location-preview-note">${previewNote}</p><button class="secondary-button" type="button" data-v2-close-location>Retour à la carte</button></div>`;
  }

  return Object.freeze({ LOCATIONS, preparation, objective, isFirstJobRequired, nextAppointment, locationStatus, render, renderLocation });
});
