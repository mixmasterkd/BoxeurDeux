(function attachMembershipView(root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.BoxeurMembershipView = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createMembershipView() {
  "use strict";
  // Pure presentation: no purchases, countdowns, persistence or new saved fields.
  const escape = value => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  const count = value => Number.isFinite(Number(value)) ? Math.max(0, Math.floor(Number(value))) : 0;
  const PAYMENT_NOTE = "Paiement unique · aucun renouvellement automatique.";

  function status(weeksRemaining, { locked = false, week = 1 } = {}) {
    const weeks = count(weeksRemaining);
    if (locked) return { tone: "locked", label: "Amateur requis", detail: "Disponible après le passage amateur.", weeks, lastWeek: null };
    if (!weeks) return { tone: "inactive", label: "Non abonné", detail: "Inscription ou renouvellement nécessaire à l’accueil.", weeks, lastWeek: null };
    const lastWeek = Math.max(1, count(week)) + weeks - 1;
    return { tone: weeks === 1 ? "ending" : "active", label: `${weeks} sem.`, weeks, lastWeek,
      detail: `${weeks} semaine${weeks > 1 ? "s" : ""} restante${weeks > 1 ? "s" : ""}${weeks === 1 ? " · dernière semaine" : ""}.` };
  }

  function renderBadge(weeksRemaining, options) {
    const current = status(weeksRemaining, options);
    return `<small class="membership-map-badge ${current.tone}" data-membership-status="${current.tone}" aria-hidden="true">${current.label}</small>`;
  }

  function planState(plan, context) {
    const membership = context.membership || {};
    if (context.kind === "strength" && context.careerStatus === "recreational") return { available: false, reason: "Disponible après le passage amateur." };
    if (membership.active || count(membership.weeksRemaining) > 0) return { available: false, reason: "Ton abonnement actuel doit d'abord arriver à échéance." };
    if (membership.initialRequired && plan.id !== "monthly") return { available: false, reason: "Le premier abonnement obligatoire est celui d’un mois." };
    if (plan.available === false) return { available: false, reason: plan.disabledReason || "Ce forfait est temporairement indisponible." };
    const spendable = membership.spendableBalance ?? membership.balance;
    if (spendable != null && Number(spendable) < plan.price) return { available: false, reason: `Il manque ${plan.price - Number(spendable)} $.` };
    return { available: true, reason: "" };
  }

  function renderPlans(context) {
    const kind = context.kind === "strength" ? "strength" : "boxing";
    const membership = context.membership || {};
    const current = status(membership.weeksRemaining, { week: context.week,
      locked: kind === "strength" && context.careerStatus === "recreational" });
    const plans = (membership.plans || []).filter(plan => !membership.initialRequired || plan.id === "monthly");
    const monthly = (membership.plans || []).find(plan => plan.id === "monthly");
    const cards = plans.map(plan => {
      const availability = planState(plan, { ...context, kind });
      const savings = monthly ? Math.max(0, monthly.price * plan.weeks / monthly.weeks - plan.price) : 0;
      const reasonId = `membership-${kind}-${escape(plan.id)}-reason`;
      const attr = kind === "strength" ? "data-career-strength-plan" : "data-gym-plan";
      return `<article class="membership-plan ${availability.available ? "available" : "locked"}"><div><h4>${escape(plan.label)}</h4><strong>${escape(plan.price)} $</strong></div><p>Paiement unique pour ${escape(plan.weeks)} semaines d’accès.</p><span>${savings > 0 ? `Économie de ${savings} $` : "Tarif mensuel"}</span><button type="button" ${attr}="${escape(plan.id)}"${availability.available ? "" : ` disabled aria-disabled="true" aria-describedby="${reasonId}"`}>Choisir ${escape(plan.label)}</button>${availability.reason ? `<small id="${reasonId}" class="membership-plan-reason">${escape(availability.reason)}</small>` : ""}</article>`;
    }).join("");
    return `<section class="membership-panel" data-membership-gym="${kind}" aria-label="Abonnement ${kind === "boxing" ? "au GYM de boxe" : "au gym de musculation"}"><header><h3>Abonnement</h3><strong>${membership.balance == null ? "Solde à vérifier" : `Solde : ${escape(membership.balance)} $`}</strong></header><div class="membership-current ${current.tone}"><strong>${current.weeks && current.tone !== "locked" ? "Abonnement actif" : current.label}</strong><p>${current.detail}</p>${current.lastWeek == null ? "" : `<p class="membership-expiry">Dernière semaine couverte : semaine ${current.lastWeek}.</p><small>La semaine en cours compte dans le solde, selon le repère du parcours actuel.</small>`}${membership.detail ? `<p>${escape(membership.detail)}</p>` : ""}</div><p class="membership-payment-note">${PAYMENT_NOTE}</p><div class="membership-plan-grid">${cards}</div></section>`;
  }

  function renderConfirmation({ kind, plan, balance, week }) {
    const current = status(plan.weeks, { week });
    return `<p class="membership-confirm-gym">${kind === "strength" ? "Gym de musculation" : "GYM de boxe"} · ${escape(plan.label)}</p><dl class="membership-confirm-details"><div><dt>Durée</dt><dd>${escape(plan.weeks)} semaines</dd></div><div><dt>À payer maintenant</dt><dd>${escape(plan.price)} $</dd></div><div><dt>Solde après achat</dt><dd>${balance - plan.price} $</dd></div><div><dt>Dernière semaine couverte</dt><dd>Semaine ${current.lastWeek}</dd></div></dl><p>${PAYMENT_NOTE}</p><p>Le compteur diminue à la clôture des semaines jouées. Aucune semaine n’avance lors de l’achat.</p>`;
  }

  return Object.freeze({ status, renderBadge, planState, renderPlans, renderConfirmation });
});
