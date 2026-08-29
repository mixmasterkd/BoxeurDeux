(function attachBoxeurStrengthView(root, factory) {
  "use strict";
  const strengthApi = typeof module === "object" && module.exports
    ? require("./v2-strength-engine.js")
    : root && root.BoxeurStrength;
  const api = factory(strengthApi);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.BoxeurStrengthView = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createBoxeurStrengthViewApi(BoxeurStrength) {
  "use strict";

  if (!BoxeurStrength) {
    throw new Error("BoxeurStrengthView requiert v2-strength-engine.js (BoxeurStrength).");
  }

  const STAT_LABELS = Object.freeze({
    technique: "Technique",
    power: "Puissance",
    cardio: "Cardio",
    defense: "Défense",
  });

  const SCENES = Object.freeze({
    gym: Object.freeze({
      desktop: "assets/gym-musculation-v2-desktop.png",
      mobile: "assets/gym-musculation-v2-mobile.png",
    }),
    shop: Object.freeze({
      desktop: "assets/boutique-supplements-v2-desktop.png",
      mobile: "assets/boutique-supplements-v2-mobile.png",
    }),
  });

  const ZONES = Object.freeze([
    Object.freeze({ id: "reception", icon: "A", label: "Accueil", detail: "Inscriptions et abonnement" }),
    Object.freeze({ id: "crossfit", icon: "CF", label: "Cours de CrossFit", detail: "Séance encadrée prête à planifier" }),
    Object.freeze({ id: "program", icon: "+", label: "Bâtir mon programme", detail: "Composition libre" }),
    Object.freeze({ id: "trainer", icon: "P", label: "Entraîneurs privés", detail: "Puissance ou cardio" }),
    Object.freeze({ id: "shop", icon: "$", label: "Boutique", detail: "Suppléments" }),
  ]);

  function escapeHTML(value) {
    return String(value == null ? "" : value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function finiteNumber(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function wholeNumber(value, fallback, min, max) {
    return Math.round(Math.min(max, Math.max(min, finiteNumber(value, fallback))));
  }

  function domToken(value, fallback = "item") {
    const token = String(value == null ? "" : value)
      .trim()
      .replace(/[^a-zA-Z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);
    return token || fallback;
  }

  function normalizeCareerStatus(value) {
    const status = String(value || "recreational").toLowerCase();
    return ["recreational", "amateur", "professional"].includes(status) ? status : "recreational";
  }

  function normalizeContext(rawContext) {
    const raw = rawContext && typeof rawContext === "object" ? rawContext : {};
    const profile = raw.profile && typeof raw.profile === "object" ? raw.profile : {};
    const condition = raw.condition && typeof raw.condition === "object" ? raw.condition : {};
    const membership = raw.membership && typeof raw.membership === "object" ? raw.membership : {};
    const trainer = raw.trainer && typeof raw.trainer === "object" ? raw.trainer : {};
    const shop = raw.shop && typeof raw.shop === "object" ? raw.shop : {};
    const weekCapacity = raw.weekCapacity && typeof raw.weekCapacity === "object" ? raw.weekCapacity : {};
    const weekPlan = raw.weekPlan && typeof raw.weekPlan === "object" ? raw.weekPlan : {};
    const quick = raw.quick && typeof raw.quick === "object" ? raw.quick : {};
    const clock = raw.clock && typeof raw.clock === "object" ? raw.clock : {};
    const careerStatus = normalizeCareerStatus(raw.careerStatus || raw.status);
    const selectedActivities = BoxeurStrength.normalizeSelection(raw.selectedActivities || raw.activities);
    const energy = wholeNumber(condition.energy, 100, 0, 100);
    const fatigue = wholeNumber(condition.fatigue, 0, 0, 100);
    const plans = BoxeurStrength.normalizeMembershipPlans(membership.plans || raw.membershipPlans);
    const membershipActive = membership.active === true
      || finiteNumber(membership.weeksRemaining ?? raw.strengthGymWeeks, 0) > 0;
    const weeksRemaining = wholeNumber(membership.weeksRemaining ?? raw.strengthGymWeeks, 0, 0, 5200);
    const balance = Number.isFinite(Number(membership.balance ?? raw.balance))
      ? wholeNumber(membership.balance ?? raw.balance, 0, 0, 9999999)
      : null;
    const spendableBalance = Number.isFinite(Number(membership.spendableBalance))
      ? wholeNumber(membership.spendableBalance, 0, 0, 9999999)
      : balance;
    const engineContext = {
      careerStatus,
      membership: { active: membershipActive, weeksRemaining },
      condition: {
        energy,
        fatigue,
        trainingBlocked: condition.trainingBlocked === true,
        trainingBlockedReason: condition.trainingBlockedReason,
      },
      strengthSessionCompletedToday: raw.strengthSessionCompletedToday === true,
      physicalSessionCompletedToday: raw.physicalSessionCompletedToday === true,
    };
    const preview = BoxeurStrength.previewDraft({ condition: { energy, fatigue } }, selectedActivities, engineContext);
    const access = preview.access || BoxeurStrength.resolveAccess(engineContext);
    const sessionDone = engineContext.strengthSessionCompletedToday || engineContext.physicalSessionCompletedToday;

    return {
      profile: { firstName: profile.firstName || "Boxeur" },
      careerStatus,
      clock: {
        week: wholeNumber(clock.week, 1, 1, 9999),
        dayLabel: String(clock.dayLabel || ""),
        timeLabel: String(clock.timeLabel || ""),
      },
      condition: {
        energy,
        fatigue,
        trainingBlocked: condition.trainingBlocked === true,
        trainingBlockedReason: String(condition.trainingBlockedReason || condition.medicalReason || ""),
      },
      membership: {
        active: membershipActive,
        weeksRemaining,
        label: membership.label || (membershipActive ? "Abonnement actif" : "Non abonné"),
        detail: membership.detail || (membershipActive
          ? `${weeksRemaining} semaine${weeksRemaining > 1 ? "s" : ""} d'accès restante${weeksRemaining > 1 ? "s" : ""}.`
          : "Choisis un forfait lorsque le gym sera accessible."),
        balance,
        spendableBalance,
        plans,
      },
      trainer: {
        available: trainer.available !== false,
        reason: String(trainer.reason || ""),
        active: trainer.active === true,
        name: trainer.name || "Aucun préparateur choisi",
        programLabel: trainer.programLabel || "Programme physique personnalisé",
        detail: trainer.detail || "Un préparateur privé produit davantage d’XP ciblée; il ne donne jamais un point de statistique instantané.",
        sessionsCompleted: wholeNumber(trainer.sessionsCompleted, 0, 0, 999),
        sessionsTotal: wholeNumber(trainer.sessionsTotal, 0, 0, 999),
        actionLabel: trainer.actionLabel || (trainer.active === true ? "Voir mon programme" : "Choisir un préparateur"),
      },
      shop: {
        available: shop.available !== false,
        reason: String(shop.reason || ""),
        itemCount: wholeNumber(shop.itemCount, 0, 0, 999),
        summary: shop.summary || "Les suppléments seront gérés par leur propre moteur et utilisés avant une séance.",
        actionLabel: shop.actionLabel || "Ouvrir la boutique",
      },
      selectedActivities,
      preview,
      access,
      sessionDone,
      weekCapacity: {
        total: wholeNumber(weekCapacity.total, 50, 1, 200),
        used: wholeNumber(weekCapacity.used, 0, 0, 200),
        remaining: wholeNumber(weekCapacity.remaining, 50, 0, 200),
      },
      weekPlan: {
        entries: Array.isArray(weekPlan.entries) ? weekPlan.entries.slice(0, 12).map((entry, index) => ({
          id: String(entry?.id || `strength-entry-${index + 1}`),
          label: String(entry?.label || "Séance de musculation"),
          cost: wholeNumber(entry?.cost, 0, 0, 100),
          removable: entry?.removable !== false,
        })) : [],
      },
      quick: {
        available: quick.available !== false,
        reason: quick.reason || "",
        planned: quick.planned === true,
        plannedCount: wholeNumber(quick.plannedCount, quick.planned ? 1 : 0, 0, 2),
      },
    };
  }

  function stimulusMarkup(stimulus, options = {}) {
    const entries = Object.entries(stimulus || {})
      .map(([key, value]) => [key, Math.round(finiteNumber(value))])
      .filter(([, value]) => value > 0)
      .map(([key, value]) => `<span><b>${escapeHTML(STAT_LABELS[key] || key)}</b> +${value} XP</span>`);
    if (!entries.length) return options.empty ? `<span class="empty">${escapeHTML(options.empty)}</span>` : "";
    return entries.join("");
  }

  function membershipPlanState(plan, context) {
    if (context.careerStatus === "recreational") {
      return { available: false, reason: "Disponible après le passage amateur." };
    }
    if (context.membership.active) {
      return { available: false, reason: "Ton abonnement actuel doit d'abord arriver à échéance." };
    }
    if (!plan.available) {
      return { available: false, reason: plan.disabledReason || "Ce forfait est temporairement indisponible." };
    }
    if (context.membership.spendableBalance != null && context.membership.spendableBalance < plan.price) {
      return { available: false, reason: `Il manque ${plan.price - context.membership.spendableBalance} $.` };
    }
    return { available: true, reason: "" };
  }

  function renderMembershipPlans(context) {
    const planMarkup = context.membership.plans.map(plan => {
      const state = membershipPlanState(plan, context);
      const reasonId = `v2-strength-plan-${domToken(plan.id, "plan")}-reason`;
      const disabled = state.available ? "" : ` disabled aria-disabled="true" aria-describedby="${reasonId}"`;
      const savings = plan.savings > 0 ? `<span class="v2-strength-plan-savings">Économie de ${plan.savings} $</span>` : `<span>Tarif mensuel</span>`;
      const reason = state.reason ? `<small id="${reasonId}" class="v2-strength-plan-reason">${escapeHTML(state.reason)}</small>` : "";
      return `<article class="v2-strength-plan${state.available ? " available" : " locked"}">
        <div><span>${escapeHTML(plan.label)}</span><strong>${plan.price} $</strong></div>
        <p>${escapeHTML(plan.detail)}</p>${savings}
        <button type="button" data-v2-strength-plan="${escapeHTML(plan.id)}"${disabled}>Choisir ${escapeHTML(plan.label)}</button>${reason}
      </article>`;
    }).join("");
    const balance = context.membership.balance == null ? "Solde disponible dans les finances" : `Solde : ${context.membership.balance} $`;
    return `<section class="v2-strength-membership" aria-labelledby="v2-strength-membership-title">
      <header><div><p class="eyebrow">Abonnement</p><h3 id="v2-strength-membership-title">Accès au gym</h3></div><strong>${escapeHTML(balance)}</strong></header>
      <div class="v2-strength-membership-current ${context.membership.active ? "active" : "inactive"}"><span aria-hidden="true">${context.membership.active ? "✓" : "○"}</span><div><strong>${escapeHTML(context.membership.label)}</strong><p>${escapeHTML(context.membership.detail)}</p></div></div>
      <div class="v2-strength-plan-grid" aria-label="Forfaits de musculation">${planMarkup}</div>
    </section>`;
  }

  function activityState(activity, context) {
    const selected = context.selectedActivities.includes(activity.id);
    if (selected) return { selected: true, available: true, reason: "" };
    if (!context.access.available) return { selected: false, available: false, reason: context.access.reason };
    if (context.sessionDone) return { selected: false, available: false, reason: "Une activité physique principale a déjà été faite aujourd'hui." };
    const remainingEnergy = context.condition.energy - context.preview.totals.energyCost;
    if (activity.energyCost > remainingEnergy) {
      return { selected: false, available: false, reason: `Il faut ${activity.energyCost} % d'énergie; il en reste ${Math.max(0, remainingEnergy)} %.` };
    }
    return { selected: false, available: true, reason: "" };
  }

  function renderActivity(activity, context) {
    const state = activityState(activity, context);
    const reasonId = `v2-strength-activity-${domToken(activity.id, "activity")}-reason`;
    const disabled = state.available ? "" : ` disabled aria-disabled="true" aria-describedby="${reasonId}"`;
    const buttonLabel = state.selected ? `Retirer ${activity.label}` : `Ajouter ${activity.label}`;
    const fatigueDelta = activity.fatigueGain - activity.fatigueRelief;
    const fatigueLabel = fatigueDelta > 0 ? `+${fatigueDelta}` : `${fatigueDelta}`;
    const reason = state.reason ? `<small class="v2-strength-activity-reason" id="${reasonId}">${escapeHTML(state.reason)}</small>` : "";
    return `<article class="v2-strength-activity${state.selected ? " selected" : ""}${state.available ? "" : " unavailable"}" data-strength-category="${escapeHTML(activity.category)}">
      <div class="v2-strength-activity-icon" aria-hidden="true">${escapeHTML(activity.icon)}</div>
      <div class="v2-strength-activity-copy"><h4>${escapeHTML(activity.label)}</h4><p>${escapeHTML(activity.benefit)}</p>
        <div class="v2-strength-activity-costs"><span>${activity.durationMinutes} min</span><strong>−${activity.energyCost} énergie</strong><span>${fatigueLabel} fatigue</span></div>
        <div class="v2-strength-stimuli" aria-label="XP ciblée prévue">${stimulusMarkup(activity.stimulus, { empty: "Récupération" })}</div>
        <small class="v2-strength-tradeoff">Compromis : ${escapeHTML(activity.compromise)}</small>${reason}
      </div>
      <button type="button" data-v2-strength-activity="${escapeHTML(activity.id)}" aria-pressed="${state.selected}" aria-label="${escapeHTML(buttonLabel)}"${disabled}>${state.selected ? "Retirer" : "Ajouter"}</button>
    </article>`;
  }

  function renderSelection(context) {
    const preview = context.preview;
    const selected = context.selectedActivities.length
      ? `<ol>${context.selectedActivities.map(id => {
          const activity = BoxeurStrength.ACTIVITIES[id];
          return `<li><span>${escapeHTML(activity.label)}</span><button type="button" data-v2-strength-activity="${escapeHTML(id)}" aria-label="Retirer ${escapeHTML(activity.label)}">Retirer</button></li>`;
        }).join("")}</ol>`
      : `<p class="v2-strength-selection-empty">Commence par l’échauffement, ajoute au moins un exercice principal, puis termine par la mobilité. Ton énergie détermine le volume entre les deux.</p>`;
    const warnings = preview.warnings.length
      ? `<ul class="v2-strength-warnings" aria-label="Avertissements">${preview.warnings.map(warning => `<li>${escapeHTML(warning)}</li>`).join("")}</ul>`
      : "";
    const disabled = preview.canConfirm ? "" : ` disabled aria-disabled="true" aria-describedby="v2-strength-confirm-reason"`;
    return `<section class="v2-strength-selection" aria-labelledby="v2-strength-selection-title">
      <header><div><p class="eyebrow">Séance personnalisée</p><h3 id="v2-strength-selection-title">Ta séance en construction</h3></div><strong>${context.selectedActivities.length} activité${context.selectedActivities.length > 1 ? "s" : ""}</strong></header>
      ${selected}
      <div class="v2-strength-projection" aria-live="polite">
        <div><span>Durée</span><strong>${preview.totals.durationMinutes} min</strong></div>
        <div><span>Énergie après</span><strong>${preview.projected.energy} %</strong></div>
        <div><span>Fatigue après</span><strong>${preview.projected.fatigue} %</strong></div>
      </div>
      <div class="v2-strength-total-stimuli"><span>XP ciblée de la séance</span><div>${stimulusMarkup(preview.totals.stimulus, { empty: "Aucune pour le moment" })}</div></div>
      ${warnings}
      <p id="v2-strength-confirm-reason" class="v2-strength-confirm-reason">${escapeHTML(preview.reason)}</p>
      <button type="button" class="primary-button" data-v2-strength-confirm${disabled}>Ajouter cette séance à ma semaine</button>
    </section>`;
  }

  function zoneState(zoneId, context) {
    if (context.careerStatus === "recreational") {
      return { available: false, reason: "Disponible après le passage amateur." };
    }
    if (zoneId === "reception") return { available: true, reason: "" };
    if (!context.membership.active) {
      return { available: false, reason: "Inscription requise à l’accueil." };
    }
    if (zoneId === "shop") {
      return context.shop.available
        ? { available: true, reason: "" }
        : { available: false, reason: context.shop.reason || "La boutique est indisponible." };
    }
    if (zoneId === "trainer") {
      if (!context.trainer.available) return { available: false, reason: context.trainer.reason || "Les entraîneurs sont indisponibles." };
      if (!context.access.available) return { available: false, reason: context.access.reason };
      return { available: true, reason: "" };
    }
    if (!context.access.available) return { available: false, reason: context.access.reason };
    if (zoneId === "crossfit" && !context.quick.available) {
      return { available: false, reason: context.quick.reason || "Ce cours ne peut pas être planifié." };
    }
    return { available: true, reason: "" };
  }

  function renderHotspot(zone, context) {
    const state = zoneState(zone.id, context);
    const reasonId = `v2-strength-zone-${zone.id}-reason`;
    const legacyAttribute = zone.id === "trainer"
      ? " data-v2-strength-trainer"
      : zone.id === "shop" ? " data-v2-strength-shop" : "";
    const disabled = state.available ? "" : ` disabled aria-disabled="true" aria-describedby="${reasonId}"`;
    const detail = state.reason || zone.detail;
    return `<button type="button" class="v2-strength-hotspot zone-${escapeHTML(zone.id)}${state.available ? "" : " locked"}" data-v2-strength-zone="${escapeHTML(zone.id)}"${legacyAttribute}${disabled}>
      <span aria-hidden="true">${state.available ? escapeHTML(zone.icon) : "🔒"}</span><strong>${escapeHTML(zone.label)}</strong><small id="${reasonId}">${escapeHTML(detail)}</small>
    </button>`;
  }

  function renderWeekPlan(context, options = {}) {
    const interactive = options.interactive !== false;
    const id = options.id || "v2-strength-week-plan-title";
    const entries = context.weekPlan.entries.length
      ? `<ul>${context.weekPlan.entries.map(entry => `<li><span><strong>${escapeHTML(entry.label)}</strong><small>${entry.cost > 0 ? `−${entry.cost} capacité` : "Aucun coût de capacité"}</small></span>${interactive && entry.removable ? `<button type="button" class="secondary-button" data-v2-location-remove="${escapeHTML(entry.id)}">Retirer</button>` : `<em>${entry.removable ? "Planifiée" : "Déjà faite"}</em>`}</li>`).join("")}</ul>`
      : `<p class="v2-strength-plan-empty">Aucune séance de musculation n’est encore placée cette semaine.</p>`;
    return `<section class="v2-strength-week-plan${interactive ? "" : " compact"}" aria-labelledby="${id}"><div><p class="eyebrow">Cette semaine</p><h3 id="${id}">Séances de musculation</h3></div>${entries}</section>`;
  }

  function renderCapacity(context) {
    return `<section class="v2-strength-capacity v2-place-week-plan${context.weekCapacity.remaining <= 0 ? " full" : ""}" aria-labelledby="v2-strength-capacity-title">
      <div class="v2-place-week-plan-heading"><div><p class="eyebrow">Programme hebdomadaire</p><h3 id="v2-strength-capacity-title">Capacité restante</h3></div><strong>${context.weekCapacity.remaining}/${context.weekCapacity.total}</strong></div>
      <meter min="0" max="${context.weekCapacity.total}" value="${context.weekCapacity.remaining}" aria-label="Capacité hebdomadaire restante : ${context.weekCapacity.remaining} sur ${context.weekCapacity.total}">${context.weekCapacity.remaining}/${context.weekCapacity.total}</meter>
      <p>${context.weekCapacity.used} points sont déjà réservés par tes activités de la semaine.</p>
    </section>`;
  }

  function renderCondition(context) {
    const accessIcon = context.access.available ? "✓" : context.access.state === BoxeurStrength.ACCESS_STATES.CONDITION_BLOCKED ? "!" : "🔒";
    return `<section class="v2-strength-access v2-place-condition ${escapeHTML(context.access.state)}" role="status"><span aria-hidden="true">${accessIcon}</span><div><strong>${escapeHTML(context.access.label)}</strong><p>${escapeHTML(context.access.reason)}</p></div>
      <div class="v2-strength-condition-values"><span>Énergie <strong>${context.condition.energy} %</strong></span><span>Fatigue <strong>${context.condition.fatigue} %</strong></span></div>
    </section>`;
  }

  function renderMembershipSummary(context) {
    return `<section class="v2-strength-membership-summary v2-place-card"><p class="eyebrow">Accueil</p><h3>${escapeHTML(context.membership.label)}</h3><p>${escapeHTML(context.membership.detail)}</p><dl><div><dt>Entraîneur</dt><dd>${escapeHTML(context.trainer.name)}</dd></div><div><dt>Suppléments</dt><dd>${context.shop.itemCount} en inventaire</dd></div></dl></section>`;
  }

  function render(rawContext) {
    const context = normalizeContext(rawContext);
    const meta = [`Semaine ${context.clock.week}`, context.clock.dayLabel, context.clock.timeLabel].filter(Boolean).join(" · ");
    return `<div class="v2-strength-view v2-place-view" data-v2-strength-access="${escapeHTML(context.access.state)}" data-career-status="${escapeHTML(context.careerStatus)}">
      <header class="v2-strength-header v2-place-header"><div><p class="eyebrow">Gym de musculation</p><h2>Préparation physique de ${escapeHTML(context.profile.firstName)}</h2><p class="v2-place-meta">${escapeHTML(meta || `Semaine ${context.clock.week}`)}</p></div><button type="button" class="secondary-button" data-v2-leave-strength-gym>Retour à la carte</button></header>
      <div class="v2-strength-layout v2-place-layout">
        <main class="v2-strength-scene v2-place-scene" aria-labelledby="v2-strength-scene-title"><h3 class="sr-only" id="v2-strength-scene-title">Espaces interactifs du gym de musculation</h3>
          <picture><source media="(max-width: 640px)" srcset="${SCENES.gym.mobile}"><img src="${SCENES.gym.desktop}" alt="Gym de musculation chaleureux avec accueil, aire de CrossFit, poids libres, entraîneurs et boutique."></picture>
          <div class="v2-strength-hotspots">${ZONES.map(zone => renderHotspot(zone, context)).join("")}</div>
        </main>
        <aside class="v2-strength-dashboard v2-place-dashboard" aria-label="État du gym et de la semaine">${renderCapacity(context)}${renderCondition(context)}${renderMembershipSummary(context)}${renderWeekPlan(context, { interactive: false, id: "v2-strength-main-plan-title" })}</aside>
      </div>
    </div>`;
  }

  function renderMenuHeader(context, eyebrow, title) {
    return `<header class="v2-strength-menu-header"><div><p class="eyebrow">${escapeHTML(eyebrow)}</p><h2>${escapeHTML(title)}</h2><p>Semaine ${context.clock.week} · ${context.weekCapacity.remaining}/${context.weekCapacity.total} de capacité disponible</p></div><button type="button" class="secondary-button" data-v2-strength-menu-close>Retour au gym</button></header>`;
  }

  function renderProgramMenu(context) {
    const activities = Object.values(BoxeurStrength.ACTIVITIES).map(activity => renderActivity(activity, context)).join("");
    const mobileConfirmDisabled = context.preview.canConfirm ? "" : " disabled aria-disabled=\"true\"";
    return `<section class="v2-strength-menu v2-strength-program-menu" data-v2-strength-menu="program">
      ${renderMenuHeader(context, "Composition libre", "Bâtis ton programme")}
      <section class="v2-strength-mobile-summary" aria-label="Résumé rapide de la séance" aria-live="polite"><span><strong>${context.selectedActivities.length} activité${context.selectedActivities.length > 1 ? "s" : ""}</strong><small>${context.preview.projected.energy} % énergie · ${context.preview.totals.durationMinutes} min</small></span><button type="button" class="primary-button" data-v2-strength-mobile-confirm${mobileConfirmDisabled}>Ajouter</button></section>
      <div class="v2-strength-program-layout"><main class="v2-strength-catalogue"><header><div><p class="eyebrow">Exercices</p><h3>Choisis selon ton énergie</h3></div><p>Chaque ajout met immédiatement à jour l’énergie, la fatigue et l’XP ciblée prévue.</p></header><div class="v2-strength-activity-grid">${activities}</div></main><aside class="v2-strength-program-sidebar">${renderSelection(context)}${renderWeekPlan(context, { id: "v2-strength-program-plan-title" })}</aside></div>
    </section>`;
  }

  function renderCrossfitMenu(context) {
    const buttonLabel = context.quick.plannedCount >= 2
      ? "Maximum de deux cours atteint"
      : context.quick.plannedCount === 1 ? "Ajouter un deuxième cours" : "Ajouter le cours à ma semaine";
    const disabled = context.quick.available ? "" : " disabled aria-disabled=\"true\"";
    return `<section class="v2-strength-menu v2-strength-crossfit-menu" data-v2-strength-menu="crossfit">${renderMenuHeader(context, "Cours encadré", "Cours de CrossFit")}
      <div class="v2-strength-crossfit-layout"><article class="v2-strength-crossfit-card"><span class="v2-strength-crossfit-mark" aria-hidden="true">CF</span><div><p class="eyebrow">Séance complète</p><h3>Échauffement, conditionnement et mobilité</h3><p>Un cours prêt à planifier qui utilise exactement la séance rapide du moteur : échauffement dynamique, appareils et retour au calme.</p><ul><li>Une seule période</li><li>XP ciblée assimilée après récupération</li><li>Compte dans la limite des séances de musculation</li></ul><button type="button" class="primary-button" data-v2-strength-quick aria-pressed="${context.quick.plannedCount > 0}"${disabled}>${escapeHTML(buttonLabel)}</button>${context.quick.reason && !context.quick.available ? `<small class="v2-strength-menu-reason">${escapeHTML(context.quick.reason)}</small>` : ""}</div></article>${renderWeekPlan(context, { id: "v2-strength-crossfit-plan-title" })}</div>
    </section>`;
  }

  function renderReceptionMenu(context) {
    return `<section class="v2-strength-menu v2-strength-reception-menu" data-v2-strength-menu="reception">${renderMenuHeader(context, "Accueil", "Inscription au gym")}
      <div class="v2-strength-reception-layout"><article class="v2-strength-reception-intro"><span aria-hidden="true">A</span><div><p class="eyebrow">Accès simple</p><h3>Choisis la durée qui te convient</h3><p>Deux forfaits seulement : un mois pour essayer ou trois mois pour t’installer. L’achat conserve exactement les règles actuelles d’accès et de débit hebdomadaire.</p></div></article>${renderMembershipPlans(context)}</div>
    </section>`;
  }

  function renderMenu(menuId, rawContext) {
    const context = normalizeContext(rawContext);
    if (menuId === "reception") return renderReceptionMenu(context);
    if (menuId === "crossfit") return renderCrossfitMenu(context);
    if (menuId === "program") return renderProgramMenu(context);
    return "";
  }

  function renderShop(rawContext) {
    const raw = rawContext && typeof rawContext === "object" ? rawContext : {};
    const products = Array.isArray(raw.products) ? raw.products.slice(0, 4) : [];
    const balance = wholeNumber(raw.balance, 0, 0, 9999999);
    const productMarkup = products.map(product => {
      const id = String(product?.id || "");
      const available = product?.available !== false;
      const safeId = domToken(id, "product");
      const reasonId = `v2-supplement-${safeId}-reason`;
      const disabled = available ? "" : ` disabled aria-disabled="true" aria-describedby="${reasonId}"`;
      return `<button type="button" class="v2-supplement-hotspot product-${safeId}${available ? "" : " locked"}" data-v2-supplement-buy="${escapeHTML(id)}"${disabled}><span aria-hidden="true">${available ? "+" : "🔒"}</span><strong>${escapeHTML(product?.label || "Supplément")}</strong><small>${wholeNumber(product?.price, 0, 0, 9999)} $ · inventaire ×${wholeNumber(product?.quantity, 0, 0, 99)}</small>${available ? "" : `<em id="${reasonId}">${escapeHTML(product?.reason || "Indisponible")}</em>`}</button>`;
    }).join("");
    const inventory = products.map(product => `<li><span>${escapeHTML(product?.label || "Supplément")}</span><strong>×${wholeNumber(product?.quantity, 0, 0, 99)}</strong></li>`).join("");
    return `<section class="v2-strength-shop v2-place-view v2-supplement-shop" aria-labelledby="v2-supplement-shop-title"><header class="v2-place-header"><div><p class="eyebrow">Gym de musculation</p><h2 id="v2-supplement-shop-title">Boutique de suppléments</h2><p class="v2-place-meta">Solde disponible · ${balance} $</p></div><button type="button" class="secondary-button" data-v2-supplement-shop-close>Retour au gym</button></header>
      <div class="v2-strength-shop-layout v2-place-layout"><main class="v2-strength-shop-scene v2-place-scene"><h3 class="sr-only">Produits disponibles dans la boutique</h3><picture><source media="(max-width: 640px)" srcset="${SCENES.shop.mobile}"><img src="${SCENES.shop.desktop}" alt="Boutique chaleureuse avec boissons sportives, protéines, pré-entraînement et barres protéinées."></picture><div class="v2-supplement-hotspots">${productMarkup}</div></main><aside class="v2-strength-shop-dashboard v2-place-dashboard"><section class="v2-place-card"><p class="eyebrow">Règles</p><h3>Prépare ta prochaine séance</h3><p>Un produit s’utilise avant une seule séance. Maximum de deux utilisations par semaine et jamais deux fois le même produit.</p></section><section class="v2-place-card"><p class="eyebrow">Inventaire</p><h3>Dans ton sac</h3><ul class="v2-strength-shop-inventory">${inventory}</ul></section></aside></div>
    </section>`;
  }

  function renderResult(rawResult) {
    const result = rawResult && typeof rawResult === "object" ? rawResult : {};
    const title = result.title || "Séance de musculation terminée";
    const summary = result.summary || "L’XP ciblée est enregistrée. La récupération déterminera la quantité assimilée.";
    const durationMinutes = wholeNumber(result.durationMinutes, 0, 0, 360);
    const activities = Array.isArray(result.activities) ? result.activities.slice(0, Object.keys(BoxeurStrength.ACTIVITIES).length) : [];
    const changes = Array.isArray(result.changes) ? result.changes.slice(0, 8) : [];
    const activityMarkup = activities.length
      ? `<ul class="v2-strength-result-activities">${activities.map(item => `<li>${escapeHTML(item)}</li>`).join("")}</ul>`
      : "";
    const changeMarkup = changes.length
      ? `<ul class="v2-strength-result-changes">${changes.map(change => {
          const safe = change && typeof change === "object" ? change : {};
          const tone = ["positive", "neutral", "warning", "critical"].includes(safe.tone) ? safe.tone : "neutral";
          return `<li class="${tone}"><span>${escapeHTML(safe.label || "État")}</span><strong>${escapeHTML(safe.value || "—")}</strong></li>`;
        }).join("")}</ul>`
      : "";
    return `<section class="v2-strength-result" aria-labelledby="v2-strength-result-title" aria-live="polite"><p class="eyebrow">Bilan physique</p><h2 id="v2-strength-result-title">${escapeHTML(title)}</h2><p>${escapeHTML(summary)}</p><p>Durée : <strong>${durationMinutes} min</strong></p>${activityMarkup}${changeMarkup}<div><button type="button" class="secondary-button" data-v2-strength-result-close>Continuer au gym</button><button type="button" class="primary-button" data-v2-leave-strength-gym>Retour à la carte</button></div></section>`;
  }

  return Object.freeze({
    STAT_LABELS,
    SCENES,
    ZONES,
    normalizeContext,
    membershipPlanState,
    renderMembershipPlans,
    render,
    renderMenu,
    renderShop,
    renderResult,
  });
});
