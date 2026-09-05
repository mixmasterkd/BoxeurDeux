(function attachBoxeurArenaView(root, factory) {
  "use strict";
  const api = factory(typeof module === "object" && module.exports ? require("./gala-risk.js") : root.BoxeurGalaRisk);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.BoxeurArenaView = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createBoxeurArenaViewApi(galaRisk) {
  "use strict";

  const SCENES = Object.freeze({
    desktop: "assets/arena-v2-desktop.png",
    mobile: "assets/arena-v2-mobile.png",
  });

  const EVENT_STATES = Object.freeze(["none", "future", "due", "ready", "active", "completed"]);

  function escapeHTML(value) {
    return String(value == null ? "" : value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function safeText(value, fallback = "", maximum = 240) {
    const text = String(value == null ? "" : value).trim();
    return (text || fallback).slice(0, maximum);
  }

  function wholeNumber(value, fallback, minimum = 0, maximum = 99999) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return fallback;
    return Math.round(Math.min(maximum, Math.max(minimum, numeric)));
  }

  function normalizeOpponent(rawOpponent) {
    if (!rawOpponent || typeof rawOpponent !== "object") return null;
    return {
      name: safeText(rawOpponent.name, "Adversaire à confirmer", 100),
      nickname: safeText(rawOpponent.nickname, "", 80),
      style: safeText(rawOpponent.style, "Style à confirmer", 80),
      record: safeText(rawOpponent.record, "Bilan à confirmer", 80),
    };
  }

  function normalizeEvent(rawEvent) {
    if (!rawEvent || typeof rawEvent !== "object") return null;
    const state = EVENT_STATES.includes(rawEvent.state) ? rawEvent.state : "future";
    return {
      kind: rawEvent.kind === "tournament" ? "tournament" : "gala",
      state,
      name: safeText(rawEvent.name, rawEvent.kind === "tournament" ? "Tournoi amateur" : "Gala amateur", 140),
      week: wholeNumber(rawEvent.week, 1, 1, 99999),
      dateLabel: safeText(rawEvent.dateLabel, "Date à confirmer", 100),
      venue: safeText(rawEvent.venue, "Aréna de quartier", 140),
      roundLabel: safeText(rawEvent.roundLabel, "", 80),
      remaining: wholeNumber(rawEvent.remaining, 0, 0, 99),
      opponent: normalizeOpponent(rawEvent.opponent),
      galaRisk: rawEvent.kind !== "tournament" && rawEvent.galaRisk ? { id: rawEvent.galaRisk.id } : null,
      travelEffects: rawEvent.kind !== "tournament" ? {
        energy: Number.isFinite(rawEvent.travelEffects?.energy) ? rawEvent.travelEffects.energy : 0,
        fatigue: Number.isFinite(rawEvent.travelEffects?.fatigue) ? rawEvent.travelEffects.fatigue : 0,
      } : null,
      travelApplied: rawEvent.travelApplied === true,
    };
  }

  function normalizeContext(rawContext) {
    const raw = rawContext && typeof rawContext === "object" ? rawContext : {};
    const profile = raw.profile && typeof raw.profile === "object" ? raw.profile : {};
    const clock = raw.clock && typeof raw.clock === "object" ? raw.clock : {};
    const condition = raw.condition && typeof raw.condition === "object" ? raw.condition : {};
    const preparationTone = ["positive", "steady", "warning", "critical"].includes(condition.preparationTone)
      ? condition.preparationTone
      : "steady";
    return {
      profile: { firstName: safeText(profile.firstName, "Boxeur", 60) },
      careerStatusLabel: safeText(raw.careerStatusLabel, "Amateur", 60),
      clock: {
        week: wholeNumber(clock.week, 1, 1, 99999),
        dayLabel: safeText(clock.dayLabel, "Lundi · matin", 80),
        dateLabel: safeText(clock.dateLabel, "Date à confirmer", 100),
      },
      condition: {
        preparationLabel: safeText(condition.preparationLabel, "Correcte", 80),
        preparationDetail: safeText(condition.preparationDetail, "Garde un œil sur ton énergie avant le prochain combat.", 260),
        preparationTone,
        energy: wholeNumber(condition.energy, 100, 0, 100),
        fatigue: wholeNumber(condition.fatigue, 0, 0, 100),
      },
      event: normalizeEvent(raw.event),
    };
  }

  function eventPresentation(event) {
    if (!event) {
      return {
        state: "none",
        eyebrow: "Programmation de l’aréna",
        title: "Aucun combat réservé",
        detail: "Consulte les galas et les tournois annoncés, puis réserve l’occasion qui convient à ta préparation.",
        hotspotTitle: "Calendrier des événements",
        hotspotDetail: "Galas et tournois disponibles",
        actionLabel: "Consulter les événements",
      };
    }
    if (event.state === "completed") {
      return {
        state: "completed",
        eyebrow: event.kind === "tournament" ? "Parcours terminé" : "Combat terminé",
        title: event.name,
        detail: "Le résultat est enregistré. Le calendrier conserve les prochains événements disponibles.",
        hotspotTitle: "Résultats et calendrier",
        hotspotDetail: "Voir la suite de la saison",
        actionLabel: "Voir le calendrier",
      };
    }
    if (event.state === "active") {
      return {
        state: "active",
        eyebrow: event.kind === "tournament" ? "Tournoi en cours" : "Combat en cours",
        title: event.name,
        detail: event.kind === "tournament"
          ? "Le parcours est commencé. Consulte le tableau pour préparer la prochaine opposition."
          : "Le combat est arrivé. Vérifie une dernière fois ta préparation avant d’entrer dans le ring.",
        hotspotTitle: event.kind === "tournament" ? "Accès au tournoi" : "Accès au ring",
        hotspotDetail: event.roundLabel || "Rendez-vous actif",
        actionLabel: event.kind === "tournament" ? "Ouvrir le tableau du tournoi" : "Entrer dans le ring",
      };
    }
    if (event.state === "ready") {
      return {
        state: "ready",
        eyebrow: event.kind === "tournament" ? "Tournoi prêt" : "Combat prêt",
        title: event.name,
        detail: event.kind === "tournament"
          ? "La semaine est terminée. Le tableau du tournoi est maintenant accessible ici."
          : "La semaine est terminée. Ton travail et ta préparation sont enregistrés; le ring t’attend.",
        hotspotTitle: event.kind === "tournament" ? "Accès au tournoi" : "Accès au ring",
        hotspotDetail: event.roundLabel || "Rendez-vous prêt",
        actionLabel: event.kind === "tournament" ? "Ouvrir le tableau du tournoi" : "Entrer dans le ring",
      };
    }
    if (event.state === "due") {
      return {
        state: "due",
        eyebrow: event.kind === "tournament" ? "Semaine de tournoi" : "Semaine de combat",
        title: event.name,
        detail: "Le rendez-vous est arrivé. Joue et confirme d’abord ta semaine normale; l’aréna ouvrira ensuite l’accès au combat.",
        hotspotTitle: "Préparation de la semaine",
        hotspotDetail: "Confirmer la semaine avant le combat",
        actionLabel: "Préparer et confirmer la semaine",
      };
    }
    return {
      state: "future",
      eyebrow: event.kind === "tournament" ? "Inscription confirmée" : "Combat réservé",
      title: event.name,
      detail: `Le rendez-vous est prévu à la semaine ${event.week}. Continue ton camp sans négliger la récupération.`,
      hotspotTitle: event.kind === "tournament" ? "Prochain tournoi" : "Prochain combat",
      hotspotDetail: `Semaine ${event.week}`,
      actionLabel: event.kind === "tournament" ? "Voir l’inscription au tournoi" : "Voir le combat réservé",
    };
  }

  function renderEventDetails(event) {
    if (!event) return "";
    const advice = event.galaRisk ? galaRisk.renderAssessment(event.galaRisk)
      + galaRisk.renderTravel(event.travelEffects, event.travelApplied) : "";
    const opponent = event.opponent
      ? `<section class="career-arena-opponent" aria-label="Prochain adversaire"><span>Adversaire</span><strong>${escapeHTML(event.opponent.name)}${event.opponent.nickname ? ` « ${escapeHTML(event.opponent.nickname)} »` : ""}</strong><small>${escapeHTML(event.opponent.style)} · ${escapeHTML(event.opponent.record)}</small>${advice}</section>`
      : `<p class="career-arena-opponent-pending">${event.kind === "tournament" ? "Le prochain adversaire sera confirmé dans le tableau du tournoi." : "L’adversaire sera confirmé dans le calendrier."}</p>`;
    return `<dl class="career-arena-event-meta"><div><dt>Semaine</dt><dd>${event.week}</dd></div><div><dt>Date</dt><dd>${escapeHTML(event.dateLabel)}</dd></div><div><dt>Lieu</dt><dd>${escapeHTML(event.venue)}</dd></div>${event.roundLabel ? `<div><dt>Étape</dt><dd>${escapeHTML(event.roundLabel)}</dd></div>` : ""}</dl>${opponent}`;
  }

  function render(rawContext) {
    const context = normalizeContext(rawContext);
    const presentation = eventPresentation(context.event);
    const eventDetails = renderEventDetails(context.event);
    const hasGalaAdvice = Boolean(context.event?.galaRisk);
    const warning = hasGalaAdvice ? galaRisk.conditionWarning(context.condition) : "";
    return `<div class="career-arena-view career-place-view" data-career-arena-state="${presentation.state}">
      <header class="career-arena-header career-place-header">
        <div><p class="eyebrow">Aréna du quartier</p><h2 id="career-arena-title">Soirée de boxe</h2><p class="career-place-meta">${escapeHTML(context.careerStatusLabel)} · Semaine ${context.clock.week} · ${escapeHTML(context.clock.dayLabel)} · ${escapeHTML(context.clock.dateLabel)}</p></div>
        <button type="button" class="secondary-button" data-career-leave-arena>Retour à la carte</button>
      </header>
      <div class="career-arena-layout career-place-layout">
        <section class="career-arena-scene career-place-scene" aria-labelledby="career-arena-scene-title">
          <h3 id="career-arena-scene-title" class="sr-only">Intérieur de l’aréna et accès aux événements</h3>
          <picture><source media="(max-width: 640px)" srcset="${SCENES.mobile}"><img src="${SCENES.desktop}" width="1672" height="941" alt="Aréna amateur rempli de spectateurs avec un ring éclairé au centre"></picture>
          <div class="career-arena-hotspots"><button type="button" class="career-arena-hotspot" data-career-arena-action aria-label="${escapeHTML(presentation.hotspotTitle)}. ${escapeHTML(presentation.hotspotDetail)}"><strong>${escapeHTML(presentation.hotspotTitle)}</strong><small>${escapeHTML(presentation.hotspotDetail)}</small></button></div>
        </section>
        <aside class="career-arena-dashboard career-place-dashboard" aria-label="Événement et préparation">
          <section class="career-arena-event-card career-place-card ${presentation.state}" aria-labelledby="career-arena-event-title">
            <p class="eyebrow">${escapeHTML(presentation.eyebrow)}</p><h3 id="career-arena-event-title">${escapeHTML(presentation.title)}</h3><p>${escapeHTML(presentation.detail)}</p>
            ${eventDetails}<button type="button" class="primary-button" data-career-arena-action>${escapeHTML(presentation.actionLabel)}</button>
          </section>
          <section class="career-arena-condition career-place-condition ${context.condition.preparationTone}" aria-label="État de préparation actuel">
            <span>${hasGalaAdvice ? "Préparation actuelle" : "État de préparation"}</span><strong>${escapeHTML(context.condition.preparationLabel)}</strong><p>${escapeHTML(context.condition.preparationDetail)}</p>
            <div class="career-arena-meters"><label>Énergie <meter min="0" max="100" value="${context.condition.energy}">${context.condition.energy} %</meter><b>${context.condition.energy} %</b></label><label>Fatigue <meter min="0" max="100" value="${context.condition.fatigue}">${context.condition.fatigue} %</meter><b>${context.condition.fatigue} %</b></label></div>
            ${warning ? `<p class="gala-condition-warning">${warning}</p>` : ""}${hasGalaAdvice ? `<p>${galaRisk.EXPLANATION}</p>` : ""}${hasGalaAdvice && context.event.state === "future" ? `<p>${galaRisk.FUTURE}</p>` : ""}
          </section>
          <section class="career-arena-role career-place-card"><p class="eyebrow">Fonction du lieu</p><h3>Réserver au calendrier, combattre à l’aréna</h3><p>Le calendrier présente les occasions et les inscriptions. L’aréna rassemble ensuite le rendez-vous, l’adversaire et l’accès au combat.</p></section>
        </aside>
      </div>
    </div>`;
  }

  return Object.freeze({ SCENES, EVENT_STATES, normalizeContext, eventPresentation, render });
});
