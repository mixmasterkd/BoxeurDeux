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
        medicalRestriction: condition.medicalRestriction === true,
        medicalBlocked: condition.medicalBlocked === true,
        trainingBlocked: condition.trainingBlocked === true,
        injuryWeeks: condition.injuryWeeks,
        medicalRestWeeks: condition.medicalRestWeeks,
        medicalReason: condition.medicalReason,
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
      condition: { energy, fatigue },
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
      const reasonId = `v2-strength-plan-${plan.id}-reason`;
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
    const reasonId = `v2-strength-activity-${activity.id}-reason`;
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

  function renderServices(context) {
    const trainerLocked = !context.access.available || !context.trainer.available;
    const trainerDisabled = trainerLocked ? " disabled aria-disabled=\"true\"" : "";
    const trainerProgress = context.trainer.sessionsTotal > 0
      ? `<progress max="${context.trainer.sessionsTotal}" value="${Math.min(context.trainer.sessionsCompleted, context.trainer.sessionsTotal)}">${context.trainer.sessionsCompleted}/${context.trainer.sessionsTotal}</progress><small>${context.trainer.sessionsCompleted}/${context.trainer.sessionsTotal} cours complétés</small>`
      : "";
    const shopLocked = context.careerStatus === "recreational" || !context.membership.active || !context.shop.available;
    const shopDisabled = shopLocked ? " disabled aria-disabled=\"true\"" : "";
    return `<div class="v2-strength-services">
      <section class="v2-strength-service" aria-labelledby="v2-strength-trainer-title"><p class="eyebrow">Préparateur privé</p><h3 id="v2-strength-trainer-title">${escapeHTML(context.trainer.name)}</h3><strong>${escapeHTML(context.trainer.programLabel)}</strong><p>${escapeHTML(context.trainer.detail)}</p>${trainerProgress}<button type="button" class="secondary-button" data-v2-strength-trainer${trainerDisabled}>${escapeHTML(context.trainer.actionLabel)}</button></section>
      <section class="v2-strength-service" aria-labelledby="v2-strength-shop-title"><p class="eyebrow">Boutique</p><h3 id="v2-strength-shop-title">Suppléments</h3><strong>${context.shop.itemCount} produit${context.shop.itemCount > 1 ? "s" : ""} dans ton inventaire</strong><p>${escapeHTML(context.shop.summary)}</p><button type="button" class="secondary-button" data-v2-strength-shop${shopDisabled}>${escapeHTML(context.shop.actionLabel)}</button></section>
    </div>`;
  }

  function renderWeekPlan(context) {
    if (!context.weekPlan.entries.length) return "";
    return `<section class="v2-strength-week-plan" aria-labelledby="v2-strength-week-plan-title"><div><p class="eyebrow">Déjà dans la semaine</p><h3 id="v2-strength-week-plan-title">Séances de musculation planifiées</h3></div><ul>${context.weekPlan.entries.map(entry => `<li><span><strong>${escapeHTML(entry.label)}</strong><small>${entry.cost > 0 ? `−${entry.cost} capacité` : "Aucun coût de capacité"}</small></span>${entry.removable ? `<button type="button" class="secondary-button" data-v2-location-remove="${escapeHTML(entry.id)}">Retirer</button>` : `<em>Déjà faite</em>`}</li>`).join("")}</ul></section>`;
  }

  function render(rawContext) {
    const context = normalizeContext(rawContext);
    const activities = Object.values(BoxeurStrength.ACTIVITIES).map(activity => renderActivity(activity, context)).join("");
    const accessIcon = context.access.available ? "✓" : context.access.state === BoxeurStrength.ACCESS_STATES.MEDICAL_BLOCKED ? "✚" : "🔒";
    const mobileConfirmDisabled = context.preview.canConfirm ? "" : " disabled aria-disabled=\"true\"";
    return `<div class="v2-strength-view" data-v2-strength-access="${escapeHTML(context.access.state)}" data-career-status="${escapeHTML(context.careerStatus)}">
      <header class="v2-strength-header"><div><p class="eyebrow">Gym de musculation</p><h2>Préparation physique de ${escapeHTML(context.profile.firstName)}</h2></div><button type="button" class="secondary-button" data-v2-leave-strength-gym>Retour à la carte</button></header>
      <section class="v2-strength-access ${escapeHTML(context.access.state)}" role="status"><span aria-hidden="true">${accessIcon}</span><div><strong>${escapeHTML(context.access.label)}</strong><p>${escapeHTML(context.access.reason)}</p></div></section>
      <section class="v2-strength-energy" aria-labelledby="v2-strength-energy-title"><div><p class="eyebrow">Limite naturelle de la séance</p><h3 id="v2-strength-energy-title">Énergie principale</h3></div><div class="v2-strength-energy-meter"><meter min="0" max="100" value="${context.preview.projected.energy}" aria-label="Énergie prévue après la séance : ${context.preview.projected.energy} %">${context.preview.projected.energy} %</meter><strong>${context.condition.energy} % → ${context.preview.projected.energy} %</strong></div><div><span>Fatigue actuelle</span><strong>${context.condition.fatigue} % → ${context.preview.projected.fatigue} %</strong></div></section>
      <section class="v2-strength-energy" aria-labelledby="v2-strength-week-energy-title"><div><p class="eyebrow">Programme hebdomadaire</p><h3 id="v2-strength-week-energy-title">Capacité restante de la semaine</h3></div><div class="v2-strength-energy-meter"><progress max="${context.weekCapacity.total}" value="${context.weekCapacity.remaining}" aria-label="Capacité hebdomadaire restante : ${context.weekCapacity.remaining} sur ${context.weekCapacity.total}">${context.weekCapacity.remaining}/${context.weekCapacity.total}</progress><strong>${context.weekCapacity.remaining}/${context.weekCapacity.total}</strong></div><div><span>Déjà réservée</span><strong>${context.weekCapacity.used}</strong></div></section>
      ${renderWeekPlan(context)}
      <section class="v2-strength-mobile-summary" aria-label="Résumé rapide de la séance" aria-live="polite"><span><strong>${context.selectedActivities.length} activité${context.selectedActivities.length > 1 ? "s" : ""}</strong><small>${context.preview.projected.energy} % énergie · ${context.preview.totals.durationMinutes} min</small></span><button type="button" class="primary-button" data-v2-strength-mobile-confirm${mobileConfirmDisabled}>Ajouter</button></section>
      <div class="v2-strength-layout">
        <main class="v2-strength-main"><section class="v2-strength-catalogue" aria-labelledby="v2-strength-catalogue-title"><header><div><p class="eyebrow">Composition libre</p><h3 id="v2-strength-catalogue-title">Choisis selon ton énergie</h3></div><p>Chaque ajout met immédiatement à jour l'énergie, la fatigue et l’XP ciblée prévue.</p><button type="button" class="secondary-button" data-v2-strength-quick aria-pressed="${context.quick.planned}"${context.quick.available ? "" : " disabled aria-disabled=\"true\""}>${context.quick.planned ? "Retirer la séance rapide" : context.quick.plannedCount > 0 ? "Ajouter une 2e séance rapide" : "Ajouter la séance rapide"}</button>${context.quick.reason && !context.quick.available ? `<small>${escapeHTML(context.quick.reason)}</small>` : ""}</header><div class="v2-strength-activity-grid">${activities}</div></section>${renderMembershipPlans(context)}</main>
        <aside class="v2-strength-sidebar" aria-label="Séance et services">${renderSelection(context)}${renderServices(context)}</aside>
      </div>
    </div>`;
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
    normalizeContext,
    membershipPlanState,
    renderMembershipPlans,
    render,
    renderResult,
  });
});
