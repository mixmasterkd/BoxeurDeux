(function attachBoxeurStrengthView(root, factory) {
  "use strict";
  const strengthApi = typeof module === "object" && module.exports
    ? require("./strength-engine.js")
    : root && root.BoxeurStrength;
  const api = factory(strengthApi, typeof module === "object" && module.exports ? require("./membership-view.js") : root.BoxeurMembershipView);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.BoxeurStrengthView = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createBoxeurStrengthViewApi(BoxeurStrength, membershipView) {
  "use strict";

  if (!BoxeurStrength) {
    throw new Error("BoxeurStrengthView requiert strength-engine.js (BoxeurStrength).");
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
        programLabel: trainer.programLabel || "Séance physique personnalisée",
        detail: trainer.detail || "Un préparateur privé produit davantage d’XP ciblée; il ne donne jamais un point de statistique instantané.",
        sessionsCompleted: wholeNumber(trainer.sessionsCompleted, 0, 0, 999),
        sessionsTotal: wholeNumber(trainer.sessionsTotal, 0, 0, 999),
        actionLabel: trainer.actionLabel || (trainer.active === true ? "Voir ma séance privée" : "Choisir une séance privée"),
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
          supplementLabel: String(entry?.supplementLabel || ""),
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
    return membershipView.planState(plan, { ...context, kind: "strength" });
  }

  function renderMembershipPlans(context) {
    return membershipView.renderPlans({ ...context, kind: "strength", week: context.clock.week });
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
    const reasonId = `career-strength-activity-${domToken(activity.id, "activity")}-reason`;
    const disabled = state.available ? "" : ` disabled aria-disabled="true" aria-describedby="${reasonId}"`;
    const buttonLabel = state.selected ? `Retirer ${activity.label}` : `Ajouter ${activity.label}`;
    const fatigueDelta = activity.fatigueGain - activity.fatigueRelief;
    const fatigueLabel = fatigueDelta > 0 ? `+${fatigueDelta}` : `${fatigueDelta}`;
    const reason = state.reason ? `<small class="career-strength-activity-reason" id="${reasonId}">${escapeHTML(state.reason)}</small>` : "";
    return `<article class="career-strength-activity${state.selected ? " selected" : ""}${state.available ? "" : " unavailable"}" data-strength-category="${escapeHTML(activity.category)}">
      <div class="career-strength-activity-icon" aria-hidden="true">${escapeHTML(activity.icon)}</div>
      <div class="career-strength-activity-copy"><h4>${escapeHTML(activity.label)}</h4><p>${escapeHTML(activity.benefit)}</p>
        <div class="career-strength-activity-costs"><span>${activity.durationMinutes} min</span><strong>−${activity.energyCost} énergie</strong><span>${fatigueLabel} fatigue</span></div>
        <div class="career-strength-stimuli" aria-label="XP ciblée prévue">${stimulusMarkup(activity.stimulus, { empty: "Récupération" })}</div>
        <small class="career-strength-tradeoff">Compromis : ${escapeHTML(activity.compromise)}</small>${reason}
      </div>
      <button type="button" data-career-strength-activity="${escapeHTML(activity.id)}" aria-pressed="${state.selected}" aria-label="${escapeHTML(buttonLabel)}"${disabled}>${state.selected ? "Retirer" : "Ajouter"}</button>
    </article>`;
  }

  function renderSelection(context) {
    const preview = context.preview;
    const selected = context.selectedActivities.length
      ? `<ol>${context.selectedActivities.map(id => {
          const activity = BoxeurStrength.ACTIVITIES[id];
          return `<li><span>${escapeHTML(activity.label)}</span><button type="button" data-career-strength-activity="${escapeHTML(id)}" aria-label="Retirer ${escapeHTML(activity.label)}">Retirer</button></li>`;
        }).join("")}</ol>`
      : `<p class="career-strength-selection-empty">Commence par l’échauffement, ajoute au moins un exercice principal, puis termine par la mobilité. Ton énergie détermine le volume entre les deux.</p>`;
    const warnings = preview.warnings.length
      ? `<ul class="career-strength-warnings" aria-label="Avertissements">${preview.warnings.map(warning => `<li>${escapeHTML(warning)}</li>`).join("")}</ul>`
      : "";
    const disabled = preview.canConfirm ? "" : ` disabled aria-disabled="true" aria-describedby="career-strength-confirm-reason"`;
    return `<section class="career-strength-selection" aria-labelledby="career-strength-selection-title">
      <header><div><p class="eyebrow">Séance personnalisée</p><h3 id="career-strength-selection-title">Ta séance en construction</h3></div><strong>${context.selectedActivities.length} activité${context.selectedActivities.length > 1 ? "s" : ""}</strong></header>
      ${selected}
      <div class="career-strength-projection" aria-live="polite">
        <div><span>Durée</span><strong>${preview.totals.durationMinutes} min</strong></div>
        <div><span>Énergie après</span><strong>${preview.projected.energy} %</strong></div>
        <div><span>Fatigue après</span><strong>${preview.projected.fatigue} %</strong></div>
      </div>
      <div class="career-strength-total-stimuli"><span>XP ciblée de la séance</span><div>${stimulusMarkup(preview.totals.stimulus, { empty: "Aucune pour le moment" })}</div></div>
      ${warnings}
      <p id="career-strength-confirm-reason" class="career-strength-confirm-reason">${escapeHTML(preview.reason)}</p>
      <button type="button" class="primary-button" data-career-strength-confirm${disabled}>Ajouter cette séance à ma semaine</button>
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
    const reasonId = `career-strength-zone-${zone.id}-reason`;
    const legacyAttribute = zone.id === "trainer"
      ? " data-career-strength-trainer"
      : zone.id === "shop" ? " data-career-strength-shop" : "";
    const disabled = state.available ? "" : ` disabled aria-disabled="true" aria-describedby="${reasonId}"`;
    const detail = state.reason || zone.detail;
    return `<button type="button" class="career-strength-hotspot zone-${escapeHTML(zone.id)}${state.available ? "" : " locked"}" data-career-strength-zone="${escapeHTML(zone.id)}"${legacyAttribute}${disabled}>
      <span aria-hidden="true">${state.available ? escapeHTML(zone.icon) : "🔒"}</span><strong>${escapeHTML(zone.label)}</strong><small id="${reasonId}">${escapeHTML(detail)}</small>
    </button>`;
  }

  function renderWeekPlan(context, options = {}) {
    const interactive = options.interactive !== false;
    const id = options.id || "career-strength-week-plan-title";
    const entries = context.weekPlan.entries.length
      ? `<ul>${context.weekPlan.entries.map(entry => `<li><span><strong>${escapeHTML(entry.label)}</strong><small>${entry.cost > 0 ? `−${entry.cost} capacité` : "Aucun coût de capacité"}${entry.supplementLabel ? ` · Supplément : ${escapeHTML(entry.supplementLabel)}` : ""}</small></span>${interactive && entry.removable ? `<button type="button" class="secondary-button" data-career-location-remove="${escapeHTML(entry.id)}">Retirer</button>` : `<em>${entry.removable ? "Planifiée" : "Déjà faite"}</em>`}</li>`).join("")}</ul>`
      : `<p class="career-strength-plan-empty">Aucune séance de musculation n’est encore placée cette semaine.</p>`;
    return `<section class="career-strength-week-plan${interactive ? "" : " compact"}" aria-labelledby="${id}"><div><p class="eyebrow">Cette semaine</p><h3 id="${id}">Séances de musculation</h3></div>${entries}</section>`;
  }

  function renderCapacity(context) {
    return `<section class="career-strength-capacity career-place-week-plan${context.weekCapacity.remaining <= 0 ? " full" : ""}" aria-labelledby="career-strength-capacity-title">
      <div class="career-place-week-plan-heading"><div><p class="eyebrow">Programme hebdomadaire</p><h3 id="career-strength-capacity-title">Capacité restante</h3></div><strong>${context.weekCapacity.remaining}/${context.weekCapacity.total}</strong></div>
      <meter min="0" max="${context.weekCapacity.total}" value="${context.weekCapacity.remaining}" aria-label="Capacité hebdomadaire restante : ${context.weekCapacity.remaining} sur ${context.weekCapacity.total}">${context.weekCapacity.remaining}/${context.weekCapacity.total}</meter>
      <p>${context.weekCapacity.used} points sont déjà réservés par tes activités de la semaine.</p>
    </section>`;
  }

  function renderCondition(context) {
    const accessIcon = context.access.available ? "✓" : context.access.state === BoxeurStrength.ACCESS_STATES.CONDITION_BLOCKED ? "!" : "🔒";
    return `<section class="career-strength-access career-place-condition ${escapeHTML(context.access.state)}" role="status"><span aria-hidden="true">${accessIcon}</span><div><strong>${escapeHTML(context.access.label)}</strong><p>${escapeHTML(context.access.reason)}</p></div>
      <div class="career-strength-condition-values"><span>Énergie <strong>${context.condition.energy} %</strong></span><span>Fatigue <strong>${context.condition.fatigue} %</strong></span></div>
    </section>`;
  }

  function renderMembershipSummary(context) {
    return `<section class="career-strength-membership-summary career-place-card"><p class="eyebrow">Accueil</p><h3>${escapeHTML(context.membership.label)}</h3><p>${escapeHTML(context.membership.detail)}</p><dl><div><dt>Entraîneur</dt><dd>${escapeHTML(context.trainer.name)}</dd></div><div><dt>Suppléments</dt><dd>${context.shop.itemCount} en inventaire</dd></div></dl></section>`;
  }

  function render(rawContext) {
    const context = normalizeContext(rawContext);
    const meta = [`Semaine ${context.clock.week}`, context.clock.dayLabel, context.clock.timeLabel].filter(Boolean).join(" · ");
    return `<div class="career-strength-view career-place-view" data-career-strength-access="${escapeHTML(context.access.state)}" data-career-status="${escapeHTML(context.careerStatus)}">
      <header class="career-strength-header career-place-header"><div><p class="eyebrow">Gym de musculation</p><h2>Préparation physique de ${escapeHTML(context.profile.firstName)}</h2><p class="career-place-meta">${escapeHTML(meta || `Semaine ${context.clock.week}`)}</p></div><button type="button" class="secondary-button" data-career-leave-strength-gym>Retour à la carte</button></header>
      <div class="career-strength-layout career-place-layout">
        <main class="career-strength-scene career-place-scene" aria-labelledby="career-strength-scene-title"><h3 class="sr-only" id="career-strength-scene-title">Espaces interactifs du gym de musculation</h3>
          <picture><source media="(max-width: 640px)" srcset="${SCENES.gym.mobile}"><img src="${SCENES.gym.desktop}" alt="Gym de musculation chaleureux avec accueil, aire de CrossFit, poids libres, entraîneurs et boutique."></picture>
          <div class="career-strength-hotspots">${ZONES.map(zone => renderHotspot(zone, context)).join("")}</div>
        </main>
        <aside class="career-strength-dashboard career-place-dashboard" aria-label="État du gym et de la semaine">${renderCapacity(context)}${renderCondition(context)}${renderMembershipSummary(context)}${renderWeekPlan(context, { interactive: false, id: "career-strength-main-plan-title" })}</aside>
      </div>
    </div>`;
  }

  function renderMenuHeader(context, eyebrow, title) {
    return `<header class="career-strength-menu-header"><div><p class="eyebrow">${escapeHTML(eyebrow)}</p><h2>${escapeHTML(title)}</h2><p>Semaine ${context.clock.week} · ${context.weekCapacity.remaining}/${context.weekCapacity.total} de capacité disponible</p></div><button type="button" class="secondary-button" data-career-strength-menu-close>Retour au gym</button></header>`;
  }

  function renderProgramMenu(context) {
    const activities = Object.values(BoxeurStrength.ACTIVITIES).map(activity => renderActivity(activity, context)).join("");
    const mobileConfirmDisabled = context.preview.canConfirm ? "" : " disabled aria-disabled=\"true\"";
    return `<section class="career-strength-menu career-strength-program-menu" data-career-strength-menu="program">
      ${renderMenuHeader(context, "Composition libre", "Bâtis ton programme")}
      <section class="career-strength-mobile-summary" aria-label="Résumé rapide de la séance" aria-live="polite"><span><strong>${context.selectedActivities.length} activité${context.selectedActivities.length > 1 ? "s" : ""}</strong><small>${context.preview.projected.energy} % énergie · ${context.preview.totals.durationMinutes} min</small></span><button type="button" class="primary-button" data-career-strength-mobile-confirm${mobileConfirmDisabled}>Ajouter</button></section>
      <div class="career-strength-program-layout"><main class="career-strength-catalogue"><header><div><p class="eyebrow">Exercices</p><h3>Choisis selon ton énergie</h3></div><p>Chaque ajout met immédiatement à jour l’énergie, la fatigue et l’XP ciblée prévue.</p></header><div class="career-strength-activity-grid">${activities}</div></main><aside class="career-strength-program-sidebar">${renderSelection(context)}${renderWeekPlan(context, { id: "career-strength-program-plan-title" })}</aside></div>
    </section>`;
  }

  function renderCrossfitMenu(context) {
    const buttonLabel = context.quick.plannedCount >= 2
      ? "Maximum de deux cours atteint"
      : context.quick.plannedCount === 1 ? "Ajouter un deuxième cours" : "Ajouter le cours à ma semaine";
    const disabled = context.quick.available ? "" : " disabled aria-disabled=\"true\"";
    return `<section class="career-strength-menu career-strength-crossfit-menu" data-career-strength-menu="crossfit">${renderMenuHeader(context, "Cours encadré", "Cours de CrossFit")}
      <div class="career-strength-crossfit-layout"><article class="career-strength-crossfit-card"><span class="career-strength-crossfit-mark" aria-hidden="true">CF</span><div><p class="eyebrow">Séance complète</p><h3>Échauffement, conditionnement et mobilité</h3><p>Un cours prêt à planifier qui utilise exactement la séance rapide du moteur : échauffement dynamique, appareils et retour au calme.</p><ul><li>Une seule période</li><li>XP ciblée assimilée après récupération</li><li>Compte dans la limite des séances de musculation</li></ul><button type="button" class="primary-button" data-career-strength-quick aria-pressed="${context.quick.plannedCount > 0}"${disabled}>${escapeHTML(buttonLabel)}</button>${context.quick.reason && !context.quick.available ? `<small class="career-strength-menu-reason">${escapeHTML(context.quick.reason)}</small>` : ""}</div></article>${renderWeekPlan(context, { id: "career-strength-crossfit-plan-title" })}</div>
    </section>`;
  }

  function renderReceptionMenu(context) {
    return `<section class="career-strength-menu career-membership-reception" data-career-strength-menu="reception">${renderMenuHeader(context, "Gym de musculation · Accueil", "Inscription au gym")}
      ${renderMembershipPlans(context)}
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
      const reasonId = `career-supplement-${safeId}-reason`;
      const disabled = available ? "" : ` disabled aria-disabled="true" aria-describedby="${reasonId}"`;
      const label = String(product?.label || "Supplément");
      const price = wholeNumber(product?.price, 0, 0, 9999);
      const quantity = wholeNumber(product?.quantity, 0, 0, 99);
      const accessibleLabel = available
        ? `Voir l’achat de ${label}. Prix ${price} $. Possédé : ${quantity}.`
        : `${label} indisponible. ${product?.reason || "Achat indisponible"}`;
      return `<button type="button" class="career-supplement-hotspot product-${safeId}${available ? "" : " locked"}" data-career-supplement-buy="${escapeHTML(id)}" aria-label="${escapeHTML(accessibleLabel)}"${disabled}><span aria-hidden="true">${available ? "$" : "🔒"}</span><strong>${escapeHTML(label)}</strong><small><b>${price} $</b> · possédé ×${quantity}</small>${available ? "" : `<em id="${reasonId}">${escapeHTML(product?.reason || "Indisponible")}</em>`}</button>`;
    }).join("");
    const inventory = products.map(product => `<li><span><b>${escapeHTML(product?.label || "Supplément")}</b><small>${wholeNumber(product?.price, 0, 0, 9999)} $ l’unité</small></span><strong>Possédé ×${wholeNumber(product?.quantity, 0, 0, 99)}</strong></li>`).join("");
    return `<section class="career-strength-shop career-place-view career-supplement-shop" aria-labelledby="career-supplement-shop-title"><header class="career-place-header"><div><p class="eyebrow">Gym de musculation</p><h2 id="career-supplement-shop-title">Boutique de suppléments</h2><p class="career-place-meta">Solde disponible · ${balance} $</p></div><button type="button" class="secondary-button" data-career-supplement-shop-close>Retour au gym</button></header>
      <div class="career-strength-shop-layout career-place-layout"><main class="career-strength-shop-scene career-place-scene"><h3 class="sr-only">Produits disponibles dans la boutique</h3><picture><source media="(max-width: 640px)" srcset="${SCENES.shop.mobile}"><img src="${SCENES.shop.desktop}" alt="Boutique chaleureuse avec boissons sportives, protéines, pré-entraînement et barres protéinées."></picture><div class="career-supplement-hotspots">${productMarkup}</div></main><aside class="career-strength-shop-dashboard career-place-dashboard"><section class="career-place-card career-strength-shop-guide"><p class="eyebrow">Comment acheter</p><h3>Choisis, vérifie, confirme</h3><ol><li>Sélectionne un produit dans le décor.</li><li>Vérifie son effet, son prix et ton nouveau solde.</li><li>Confirme pour l’ajouter à ton inventaire.</li></ol><p><strong>L’achat n’utilise pas le produit.</strong> Tu le réserveras ensuite à une séance depuis l’Inventaire.</p></section><section class="career-place-card"><p class="eyebrow">Règles d’utilisation</p><h3>Prépare ta prochaine séance</h3><p>Un produit s’utilise avant une seule séance. Maximum de deux utilisations par semaine et jamais deux fois le même produit.</p></section><section class="career-place-card"><p class="eyebrow">Inventaire</p><h3>Dans ton sac</h3><ul class="career-strength-shop-inventory">${inventory}</ul></section></aside></div>
    </section>`;
  }

  function renderPurchaseConfirmation(rawContext) {
    const raw = rawContext && typeof rawContext === "object" ? rawContext : {};
    const product = raw.product && typeof raw.product === "object" ? raw.product : {};
    const id = String(product.id || "");
    const label = String(product.label || "Supplément");
    const benefit = String(product.benefit || "Effet appliqué à la séance choisie depuis l’inventaire.");
    const compromise = String(product.compromise || "Une seule utilisation de ce produit est permise par semaine.");
    const price = wholeNumber(product.price, 0, 0, 9999);
    const quantity = wholeNumber(raw.quantity ?? product.quantity, 0, 0, 99);
    const balance = wholeNumber(raw.balance, 0, 0, 9999999);
    const available = raw.available !== false && balance >= price;
    const reason = String(raw.reason || (balance < price ? `Il manque ${price - balance} $.` : "Cet achat n’est pas disponible."));
    const disabled = available ? "" : " disabled aria-disabled=\"true\" aria-describedby=\"career-supplement-purchase-reason\"";
    return `<div class="service-card career-supplement-purchase-confirmation"><div class="service-heading"><div><p class="eyebrow">Boutique de suppléments</p><h2 id="career-supplement-purchase-title">Confirmer l’achat</h2></div><button type="button" class="dialog-close" data-career-supplement-purchase-cancel aria-label="Fermer">×</button></div><p class="service-lead">Vérifie la transaction avant d’acheter <strong>${escapeHTML(label)}</strong>.</p><section class="career-supplement-purchase-product" aria-labelledby="career-supplement-purchase-product-title"><span aria-hidden="true">$</span><div><p class="eyebrow">Produit sélectionné</p><h3 id="career-supplement-purchase-product-title">${escapeHTML(label)}</h3><p>${escapeHTML(benefit)}</p><small><strong>À savoir :</strong> ${escapeHTML(compromise)}</small></div></section><dl class="career-supplement-purchase-summary"><div><dt>Prix</dt><dd>${price} $</dd></div><div><dt>Solde</dt><dd>${balance} $ → ${Math.max(0, balance - price)} $</dd></div><div><dt>Inventaire</dt><dd>×${quantity} → ×${quantity + 1}</dd></div></dl><p class="career-supplement-purchase-note"><strong>Le produit sera seulement ajouté à ton inventaire.</strong> Il ne sera ni utilisé ni réservé automatiquement.</p>${available ? "" : `<p id="career-supplement-purchase-reason" class="form-error">${escapeHTML(reason)}</p>`}<div class="service-actions"><button type="button" class="secondary-button" data-career-supplement-purchase-cancel>Annuler</button><button type="button" class="primary-button" data-career-supplement-purchase-confirm="${escapeHTML(id)}"${disabled}>Acheter pour ${price} $</button></div></div>`;
  }

  function renderResult(rawResult) {
    const result = rawResult && typeof rawResult === "object" ? rawResult : {};
    const title = result.title || "Séance de musculation terminée";
    const summary = result.summary || "L’XP ciblée est enregistrée. La récupération déterminera la quantité assimilée.";
    const durationMinutes = wholeNumber(result.durationMinutes, 0, 0, 360);
    const activities = Array.isArray(result.activities) ? result.activities.slice(0, Object.keys(BoxeurStrength.ACTIVITIES).length) : [];
    const changes = Array.isArray(result.changes) ? result.changes.slice(0, 8) : [];
    const activityMarkup = activities.length
      ? `<ul class="career-strength-result-activities">${activities.map(item => `<li>${escapeHTML(item)}</li>`).join("")}</ul>`
      : "";
    const changeMarkup = changes.length
      ? `<ul class="career-strength-result-changes">${changes.map(change => {
          const safe = change && typeof change === "object" ? change : {};
          const tone = ["positive", "neutral", "warning", "critical"].includes(safe.tone) ? safe.tone : "neutral";
          return `<li class="${tone}"><span>${escapeHTML(safe.label || "État")}</span><strong>${escapeHTML(safe.value || "—")}</strong></li>`;
        }).join("")}</ul>`
      : "";
    return `<section class="career-strength-result" aria-labelledby="career-strength-result-title" aria-live="polite"><p class="eyebrow">Bilan physique</p><h2 id="career-strength-result-title">${escapeHTML(title)}</h2><p>${escapeHTML(summary)}</p><p>Durée : <strong>${durationMinutes} min</strong></p>${activityMarkup}${changeMarkup}<div><button type="button" class="secondary-button" data-career-strength-result-close>Continuer au gym</button><button type="button" class="primary-button" data-career-leave-strength-gym>Retour à la carte</button></div></section>`;
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
    renderPurchaseConfirmation,
    renderResult,
  });
});
