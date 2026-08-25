(function attachBoxeurHomeView(root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.BoxeurHomeView = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createBoxeurHomeViewApi() {
  "use strict";

  const ZONES = Object.freeze([
    Object.freeze({ id: "bed", label: "Journée de repos", detail: "Ajouter une journée libre à la semaine", action: "rest" }),
    Object.freeze({ id: "lounge", label: "Jeu d'ordinateur", detail: "Jouer à BoxeurDeux classique", action: "play-v1" }),
    Object.freeze({ id: "kitchen", label: "Cuisine", detail: "Voir les repas de récupération", menu: "kitchen" }),
    Object.freeze({ id: "basement", label: "Sous-sol", detail: "Choisir un entraînement maison", menu: "training" }),
    Object.freeze({ id: "running", label: "Course", detail: "Choisir ta sortie", menu: "running" }),
  ]);

  const ACTIONS = Object.freeze([
    Object.freeze({
      id: "rest",
      label: "Journée de repos rapide",
      category: "recovery",
      kindLabel: "Récupération",
      impact: "Une journée sans entraînement",
      command: "Ajouter à la semaine",
      help: "Réserve une journée plus calme. Les nuits restent automatiques : dormir n’est jamais une action à planifier.",
      plannable: true,
    }),
    Object.freeze({
      id: "home-quick",
      label: "Entraînement maison rapide",
      category: "physical",
      kindLabel: "Entraînement maison",
      impact: "Charge légère et équilibrée",
      command: "Ajouter à la semaine",
      help: "Planifie une petite séance au sous-sol. Elle est moins complète qu’une séance spécialisée au GYM.",
      plannable: true,
    }),
    Object.freeze({
      id: "home-custom",
      label: "Bâtir mon entraînement maison",
      category: "physical",
      kindLabel: "Séance personnalisée",
      impact: "Choix des exercices",
      command: "Préparer pour la semaine",
      help: "Compose une courte séance avec le shadow-boxing et le sac au sous-sol. La course se choisit séparément.",
      plannable: true,
      amateurOnly: true,
    }),
    Object.freeze({
      id: "roadwork-short",
      label: "Court jog",
      category: "running",
      kindLabel: "Course",
      impact: "Cardio léger · charge modérée",
      command: "Ajouter à la semaine",
      help: "Une sortie courte pour bâtir ton cardio sans prendre toute ta semaine.",
      plannable: true,
    }),
    Object.freeze({
      id: "roadwork-long",
      label: "Long jog",
      category: "running",
      kindLabel: "Course",
      impact: "Endurance soutenue",
      command: "Ajouter à la semaine",
      help: "Une sortie plus longue pour travailler l'endurance. Elle se débloque après le statut récréatif.",
      plannable: true,
      amateurOnly: true,
      amateurOnlyReason: "Le long jog se débloque lorsque tu passes amateur.",
    }),
    Object.freeze({
      id: "roadwork-intervals",
      label: "Intervalles",
      category: "running",
      kindLabel: "Course",
      impact: "Cardio intense",
      command: "Ajouter à la semaine",
      help: "Des efforts rapides et exigeants. Ils se débloquent après le statut récréatif.",
      plannable: true,
      amateurOnly: true,
      amateurOnlyReason: "Les intervalles se débloquent lorsque tu passes amateur.",
    }),
    Object.freeze({
      id: "meal",
      label: "Repas maison de récupération",
      category: "recovery",
      kindLabel: "Cuisine et récupération",
      impact: "15 $ · soutien modeste",
      command: "Préparer pour la semaine",
      help: "Prépare un repas pour soutenir modestement la récupération. Il coûte de l’argent et occupe un choix du programme.",
      defaultMoneyCost: 15,
      plannable: true,
      amateurOnly: true,
      amateurOnlyReason: "Les repas de récupération se débloquent lorsque tu passes amateur.",
    }),
    Object.freeze({
      id: "play-v1",
      label: "Jouer à BoxeurDeux classique",
      category: "leisure",
      kindLabel: "Loisir hors carrière",
      impact: "Aucun temps de carrière",
      command: "Jouer maintenant",
      help: "Ouvre la V1 dans l’ordinateur. Ce loisir ne planifie rien, ne prend aucune place et ne fait pas avancer la semaine.",
      plannable: false,
    }),
  ]);

  const ACTION_GROUPS = Object.freeze([
    Object.freeze({ id: "training", label: "Entraînement maison", detail: "Choisis une séance rapide ou bâtis une séance personnalisée au sous-sol.", actionIds: ["home-quick", "home-custom"] }),
    Object.freeze({ id: "running", label: "Course", detail: "Choisis le format de ta sortie. Seul le court jog est disponible en récréatif.", actionIds: ["roadwork-short", "roadwork-long", "roadwork-intervals"] }),
    Object.freeze({ id: "kitchen", label: "Cuisine et récupération", detail: "Les repas de récupération seront accessibles après le parcours récréatif.", actionIds: ["meal"] }),
  ]);

  const ACTION_ALIASES = Object.freeze({
    sleep: "rest",
    jogging: "roadwork-short",
    "short-jog": "roadwork-short",
    "shadow-boxing": "home-quick",
    "basement-bag": "home-quick",
  });
  const ACTION_BY_ID = Object.freeze(Object.fromEntries(ACTIONS.map(action => [action.id, action])));

  function escapeHTML(value) {
    return String(value == null ? "" : value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function safeText(value, fallback = "", maxLength = 360) {
    const text = String(value == null ? "" : value).trim();
    return (text || fallback).slice(0, maxLength);
  }

  function numberInRange(value, fallback, min, max) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return fallback;
    return Math.min(max, Math.max(min, numeric));
  }

  function wholeNumber(value, fallback, min, max) {
    return Math.round(numberInRange(value, fallback, min, max));
  }

  function firstFinite(values) {
    const found = values.find(value => value != null && Number.isFinite(Number(value)));
    return found == null ? null : Number(found);
  }

  function normalizeCareerStatus(value) {
    const status = safeText(value, "recreational", 40).toLocaleLowerCase("fr-CA");
    if (status === "amateur") return "amateur";
    if (["professional", "professionnel", "pro"].includes(status)) return "professional";
    return "recreational";
  }

  function canonicalActionId(value) {
    const id = safeText(value, "", 80);
    return ACTION_ALIASES[id] || id;
  }

  function planEntries(rawPlan) {
    if (Array.isArray(rawPlan)) return rawPlan.slice(0, 80);
    if (!rawPlan || typeof rawPlan !== "object") return [];
    const supplied = [rawPlan.entries, rawPlan.items, rawPlan.actions, rawPlan.selections, rawPlan.plannedActions, rawPlan.homeActionIds].find(Array.isArray);
    if (supplied) return supplied.slice(0, 80);
    if (rawPlan.home && typeof rawPlan.home === "object") {
      if (Array.isArray(rawPlan.home)) return rawPlan.home.slice(0, 80);
      return Object.entries(rawPlan.home)
        .filter(([, planned]) => Boolean(planned))
        .map(([actionId]) => ({ actionId }));
    }
    return [];
  }

  function entryActionId(entry) {
    if (typeof entry === "string") return canonicalActionId(entry);
    if (!entry || typeof entry !== "object") return "";
    return canonicalActionId(entry.homeActionId || entry.activityId || entry.actionId || entry.action || entry.id);
  }

  function normalizePlan(rawPlan) {
    const source = rawPlan && typeof rawPlan === "object" && !Array.isArray(rawPlan) ? rawPlan : {};
    const entries = planEntries(rawPlan);
    const homeActionIds = [];
    const homeEntries = [];
    const seen = new Set();
    entries.forEach((entry, index) => {
      const id = entryActionId(entry);
      if (!ACTION_BY_ID[id]?.plannable || seen.has(id)) return;
      seen.add(id);
      homeActionIds.push(id);
      const supplied = entry && typeof entry === "object" ? entry : {};
      homeEntries.push({
        id: safeText(supplied.id, `home-${id}-${index + 1}`, 120),
        actionId: id,
        label: safeText(supplied.label, ACTION_BY_ID[id].label, 120),
        cost: wholeNumber(supplied.cost, 0, 0, 100),
        removable: supplied.removable !== false,
      });
    });
    const countedEntries = entries.filter(entry => {
      if (entry && typeof entry === "object" && entry.countsTowardCapacity === false) return false;
      return entryActionId(entry) !== "play-v1";
    });
    return {
      title: safeText(source.title, "Programme de la semaine", 100),
      note: safeText(source.note || source.detail, "Les choix faits ici s’ajoutent au même programme que le travail et les deux gyms.", 300),
      homeActionIds,
      entries: homeEntries,
      entryCount: wholeNumber(source.entryCount, countedEntries.length, 0, 99),
    };
  }

  function normalizeWeekCapacity(rawCapacity, plan) {
    const source = typeof rawCapacity === "number" && Number.isFinite(rawCapacity)
      ? { allowed: Number(rawCapacity) }
      : rawCapacity && typeof rawCapacity === "object" ? rawCapacity : {};
    const suppliedAllowed = firstFinite([source.allowed, source.limit, source.max, source.capacity, source.total]);
    const suppliedUsed = firstFinite([source.used, source.planned, source.count]);
    const suppliedRemaining = firstFinite([source.remaining, source.open]);
    let used = wholeNumber(suppliedUsed == null ? plan.entryCount : suppliedUsed, plan.entryCount, 0, 99);
    const allowed = wholeNumber(
      suppliedAllowed == null ? Math.max(3, used + Math.max(0, suppliedRemaining || 0)) : suppliedAllowed,
      3,
      0,
      99,
    );
    if (suppliedUsed == null && suppliedRemaining != null) used = Math.max(0, allowed - wholeNumber(suppliedRemaining, 0, 0, 99));
    const remaining = suppliedRemaining == null
      ? Math.max(0, allowed - used)
      : Math.min(Math.max(0, allowed - used), wholeNumber(suppliedRemaining, 0, 0, 99));
    return {
      allowed,
      used,
      remaining,
      full: remaining <= 0,
      label: safeText(source.label, "Choix hebdomadaires", 80),
    };
  }

  function normalizeAction(rawAction, definition, context) {
    const source = rawAction && typeof rawAction === "object" ? rawAction : {};
    const hasExplicitPlannedState = Object.prototype.hasOwnProperty.call(source, "planned");
    const planned = definition.plannable && (hasExplicitPlannedState
      ? source.planned === true
      : context.plan.homeActionIds.includes(definition.id));
    let available = rawAction !== false && source.available !== false;
    let reason = safeText(source.reason || source.disabledReason, "Cette option est indisponible pour le moment.", 260);
    if (definition.amateurOnly && context.careerStatus === "recreational") {
      available = false;
      reason = definition.amateurOnlyReason || "La séance personnalisée se débloque lorsque tu passes amateur. Utilise l’entraînement maison rapide pour apprendre le rythme du jeu.";
    } else if (definition.plannable && context.weekCapacity.full && !planned) {
      available = false;
      reason = "Le programme de la semaine est complet. Retire d’abord un choix planifié.";
    }
    const moneyCost = wholeNumber(
      source.moneyCost == null ? source.cost == null ? definition.defaultMoneyCost || 0 : source.cost : source.moneyCost,
      definition.defaultMoneyCost || 0,
      0,
      999999,
    );
    return {
      available,
      reason,
      planned: Boolean(planned),
      plannable: definition.plannable,
      help: safeText(source.help, definition.help, 360),
      kindLabel: safeText(source.kindLabel, definition.kindLabel, 80),
      impact: safeText(source.impact, definition.id === "meal" ? `${moneyCost} $ · soutien modeste` : definition.impact, 100),
      command: safeText(source.command, definition.command, 100),
      moneyCost,
    };
  }

  function normalizeContext(rawContext) {
    const raw = rawContext && typeof rawContext === "object" ? rawContext : {};
    const profile = raw.profile && typeof raw.profile === "object" ? raw.profile : {};
    const clock = raw.clock && typeof raw.clock === "object" ? raw.clock : {};
    const condition = raw.condition && typeof raw.condition === "object" ? raw.condition : {};
    const rawActions = raw.actions && typeof raw.actions === "object" ? raw.actions : {};
    const careerStatus = normalizeCareerStatus(raw.careerStatus);
    const plan = normalizePlan(raw.plan);
    const weekCapacity = normalizeWeekCapacity(raw.weekCapacity, plan);
    const recommendationTone = ["positive", "steady", "warning", "critical"].includes(condition.recommendationTone)
      ? condition.recommendationTone
      : "steady";
    const pendingLoad = condition.pendingLoad == null
      ? condition.stimulusLoad == null ? condition.loadToAssimilate : condition.stimulusLoad
      : condition.pendingLoad;
    const actionContext = { careerStatus, plan, weekCapacity };

    return {
      profile: { firstName: safeText(profile.firstName, "Boxeur", 50) },
      careerStatus,
      careerStatusLabel: careerStatus === "professional" ? "Professionnel" : careerStatus === "amateur" ? "Amateur" : "Récréatif",
      clock: {
        week: wholeNumber(clock.week == null ? raw.week : clock.week, 1, 1, 99999),
        dayLabel: safeText(clock.dayLabel || raw.dayLabel, "Lundi", 40),
        dateLabel: safeText(clock.dateLabel || raw.dateLabel, "Date à confirmer", 100),
      },
      condition: {
        energy: wholeNumber(condition.energy, 80, 0, 100),
        fatigue: wholeNumber(condition.fatigue, 10, 0, 100),
        pendingLoad: wholeNumber(pendingLoad, 0, 0, 100),
        recommendation: safeText(condition.recommendation || raw.nextRecommendation, "Garde une semaine équilibrée.", 180),
        recommendationDetail: safeText(condition.recommendationDetail, "Compare ta récupération aux choix déjà prévus avant d’ajouter une autre charge.", 320),
        recommendationTone,
      },
      plan,
      weekCapacity,
      actions: Object.fromEntries(ACTIONS.map(action => [action.id, normalizeAction(rawActions[action.id], action, actionContext)])),
    };
  }

  function renderHotspot(zone, context) {
    const state = zone.action ? context.actions[zone.action] : { available: true, planned: false };
    const reasonId = `v2-home-zone-${zone.id}-reason`;
    const disabledAttributes = state.available ? "" : ` aria-disabled="true" aria-describedby="${reasonId}"`;
    const pressed = state.plannable ? ` aria-pressed="${state.planned ? "true" : "false"}"` : "";
    const planned = state.planned ? ' data-v2-home-planned="true"' : "";
    const reason = state.available ? "" : `<span class="v2-home-hotspot-reason" id="${reasonId}">${escapeHTML(state.reason)}</span>`;
    const detail = state.planned ? "Planifié pour cette semaine" : zone.detail;
    const target = zone.menu
      ? `data-v2-home-menu="${escapeHTML(zone.menu)}"`
      : `data-v2-home-action="${escapeHTML(zone.action)}"`;

    if (zone.id === "kitchen") {
      return `<div class="v2-home-fridge-prototype">
        <button type="button" class="v2-home-fridge-button" data-v2-home-zone="${zone.id}" ${target}${planned}${pressed}${disabledAttributes} aria-label="${escapeHTML(zone.label)}. ${escapeHTML(detail)}.">
          <span class="v2-home-fridge-frame" aria-hidden="true"><img class="v2-home-fridge-image v2-home-fridge-image-desktop" src="assets/maison-v2-desktop.jpg" alt=""><img class="v2-home-fridge-image v2-home-fridge-image-mobile" src="assets/maison-v2-mobile.jpg" alt=""></span>
          <span class="v2-home-fridge-title" aria-hidden="true">Cuisine</span>
        </button>${reason}
      </div>`;
    }

    return `<div class="v2-home-hotspot-wrap v2-home-hotspot-${zone.id}${state.planned ? " planned" : ""}">
      <button type="button" class="v2-home-hotspot" data-v2-home-zone="${zone.id}" ${target}${planned}${pressed}${disabledAttributes} aria-label="${escapeHTML(zone.label)}. ${escapeHTML(detail)}.">
        <strong>${escapeHTML(zone.label)}</strong><small>${escapeHTML(detail)}</small>
      </button>${reason}
    </div>`;
  }

  function renderAction(action, context) {
    const state = context.actions[action.id];
    const helpId = `v2-home-action-${action.id}-help`;
    const disabledAttributes = state.available ? "" : ' disabled aria-disabled="true"';
    const pressed = state.plannable ? ` aria-pressed="${state.planned ? "true" : "false"}"` : "";
    const planned = state.planned ? ' data-v2-home-planned="true"' : "";
    const command = state.planned
      ? state.available ? "Planifié pour la semaine" : "Déjà planifié · limite atteinte"
      : state.command;
    const help = state.available ? state.help : state.reason;
    const accessibleLabel = state.planned
      ? state.available ? `Retirer de la semaine : ${action.label}` : `Déjà planifié : ${action.label}`
      : `${state.command} : ${action.label}`;

    return `<div class="v2-home-action${state.available ? "" : " unavailable"}${state.planned ? " planned" : ""}">
      <button type="button" data-v2-home-action="${action.id}" aria-label="${escapeHTML(accessibleLabel)}" aria-describedby="${helpId}"${planned}${pressed}${disabledAttributes}>
        <span class="v2-home-action-title">${escapeHTML(action.label)}</span>
        <span class="v2-home-action-meta"><b>${escapeHTML(state.kindLabel)}</b><em>${escapeHTML(state.impact)}</em></span>
        <span class="v2-home-action-command">${escapeHTML(command)}</span>
      </button>
      <small id="${helpId}">${escapeHTML(help)}</small>
    </div>`;
  }

  function renderActionGroup(group, context) {
    const matching = group.actionIds.map(id => ACTION_BY_ID[id]).filter(Boolean);
    return `<section class="v2-home-action-group v2-home-action-group-${group.id}" aria-labelledby="v2-home-action-group-${group.id}">
      <div class="v2-home-action-group-heading"><h4 id="v2-home-action-group-${group.id}">${escapeHTML(group.label)}</h4><p>${escapeHTML(group.detail)}</p></div>
      <div class="v2-home-action-grid">${matching.map(action => renderAction(action, context)).join("")}</div>
    </section>`;
  }

  function menuById(menuId) {
    return ACTION_GROUPS.find(group => group.id === String(menuId || "")) || null;
  }

  function renderMenu(menuId, rawContext) {
    const context = normalizeContext(rawContext);
    const menu = menuById(menuId);
    if (!menu) return "";
    return `<section class="v2-home-menu" aria-labelledby="v2-home-menu-title">
      <header><div><p class="eyebrow">Maison · semaine ${context.clock.week}</p><h2 id="v2-home-menu-title">${escapeHTML(menu.label)}</h2></div><button type="button" class="secondary-button" data-v2-home-menu-close>Retour à la maison</button></header>
      <p>${escapeHTML(menu.detail)}</p>
      <div class="v2-home-menu-actions">${renderActionGroup(menu, context)}</div>
    </section>`;
  }

  function renderWeekPlan(context) {
    const capacity = context.weekCapacity;
    const planned = context.plan.entries.length
      ? `<ul class="v2-home-planned-list" aria-label="Choix de la maison déjà planifiés">${context.plan.entries.map(entry => `<li><span>${escapeHTML(entry.label)}<small>${entry.cost > 0 ? `−${entry.cost} énergie` : "Aucun coût d’énergie"}</small></span>${entry.removable ? `<button type="button" data-v2-location-remove="${escapeHTML(entry.id)}">Retirer</button>` : `<em>Déjà joué</em>`}</li>`).join("")}</ul>`
      : `<p class="v2-home-plan-empty">Aucun choix de la maison n’est encore planifié.</p>`;
    const status = capacity.full ? "Énergie hebdomadaire épuisée" : `${capacity.remaining} énergie hebdomadaire encore disponible`;
    const meterMax = Math.max(1, capacity.allowed);
    const meterValue = Math.min(meterMax, capacity.remaining);

    return `<section class="v2-home-week-plan v2-place-week-plan${capacity.full ? " full" : ""}" aria-labelledby="v2-home-week-plan-title" aria-live="polite">
      <div class="v2-home-week-plan-heading v2-place-week-plan-heading"><div><p class="eyebrow">Planification</p><h3 id="v2-home-week-plan-title">${capacity.full ? "Programme complet" : escapeHTML(context.plan.title)}</h3></div><strong>${capacity.remaining} / ${capacity.allowed}</strong></div>
      <meter min="0" max="${meterMax}" value="${meterValue}" aria-label="Énergie hebdomadaire restante : ${capacity.remaining} sur ${capacity.allowed}">${capacity.remaining} sur ${capacity.allowed}</meter>
      <p><strong>${escapeHTML(status)}</strong> · ${capacity.used} déjà réservée · ${escapeHTML(context.plan.note)}</p>${planned}
    </section>`;
  }

  function render(rawContext) {
    const context = normalizeContext(rawContext);
    const hotspots = ZONES.map(zone => renderHotspot(zone, context)).join("");

    return `<div class="v2-home-view v2-place-view">
      <header class="v2-home-header v2-place-header">
        <div><p class="eyebrow">Maison</p><h2>Chez toi, ${escapeHTML(context.profile.firstName)}</h2><p class="v2-place-meta">${escapeHTML(context.careerStatusLabel)} · Semaine ${context.clock.week} · ${escapeHTML(context.clock.dayLabel)} · ${escapeHTML(context.clock.dateLabel)}</p></div>
        <button type="button" class="secondary-button" data-v2-leave-home>Retour à la carte</button>
      </header>
      <div class="v2-home-layout v2-place-layout">
        <section class="v2-home-scene v2-place-scene" aria-labelledby="v2-home-scene-title">
          <h3 id="v2-home-scene-title" class="sr-only">Pièces interactives de la maison</h3>
          <picture>
            <source media="(max-width: 640px)" srcset="assets/maison-v2-mobile.jpg">
            <img src="assets/maison-v2-desktop.jpg" width="1440" height="810" alt="Appartement illustré avec cuisine, salon, chambre et espace d’entraînement au sous-sol" />
          </picture>
          <div class="v2-home-hotspots">${hotspots}</div>
        </section>
        <aside class="v2-home-dashboard v2-place-dashboard" aria-label="Programme et récupération">
          ${renderWeekPlan(context)}
          <section class="v2-home-condition v2-place-condition" aria-label="État de récupération actuel">
            <div><span>Énergie</span><strong>${context.condition.energy} %</strong><meter min="0" max="100" value="${context.condition.energy}">${context.condition.energy} %</meter></div>
            <div><span>Fatigue</span><strong>${context.condition.fatigue} %</strong><meter min="0" max="100" value="${context.condition.fatigue}">${context.condition.fatigue} %</meter></div>
            <div><span>Charge à assimiler</span><strong>${context.condition.pendingLoad} %</strong><meter min="0" max="100" value="${context.condition.pendingLoad}">${context.condition.pendingLoad} %</meter></div>
          </section>
          <section class="v2-home-recommendation v2-place-card ${context.condition.recommendationTone}" aria-labelledby="v2-home-recommendation-title">
            <p class="eyebrow">Conseil avant de planifier</p><h3 id="v2-home-recommendation-title">${escapeHTML(context.condition.recommendation)}</h3>
            <p>${escapeHTML(context.condition.recommendationDetail)}</p>
          </section>
        </aside>
      </div>
    </div>`;
  }

  function renderResult(rawResult) {
    const result = rawResult && typeof rawResult === "object" ? rawResult : {};
    const title = safeText(result.title, "Programme mis à jour", 120);
    const summary = safeText(result.summary, "Le choix de la maison a été ajouté à ton programme.", 360);
    const timeLabel = safeText(result.timeLabel, "Semaine mise à jour", 120);
    const changes = Array.isArray(result.changes) ? result.changes.slice(0, 8) : [];
    const changeMarkup = changes.length
      ? changes.map(change => {
          const safeChange = change && typeof change === "object" ? change : {};
          const tone = ["positive", "neutral", "warning", "critical"].includes(safeChange.tone) ? safeChange.tone : "neutral";
          return `<li class="${tone}"><span>${escapeHTML(safeText(safeChange.label, "Programme", 100))}</span><strong>${escapeHTML(safeText(safeChange.value, "—", 120))}</strong></li>`;
        }).join("")
      : `<li class="neutral"><span>Programme</span><strong>À jour</strong></li>`;
    const recommendation = result.recommendation
      ? `<p class="v2-home-result-recommendation"><strong>À retenir :</strong> ${escapeHTML(safeText(result.recommendation, "", 300))}</p>`
      : "";

    return `<section class="v2-home-result" aria-labelledby="v2-home-result-title" aria-live="polite">
      <p class="eyebrow">Programme de la maison</p><h2 id="v2-home-result-title">${escapeHTML(title)}</h2>
      <p>${escapeHTML(summary)}</p><p class="v2-home-result-time">${escapeHTML(timeLabel)}</p>
      <ul class="v2-home-result-changes" aria-label="Changements au programme">${changeMarkup}</ul>
      ${recommendation}
      <div class="v2-home-result-actions"><button type="button" class="secondary-button" data-v2-home-result-close>Continuer à la maison</button><button type="button" class="primary-button" data-v2-leave-home>Retour à la carte</button></div>
    </section>`;
  }

  return Object.freeze({
    ZONES,
    ACTIONS,
    ACTION_GROUPS,
    menuById,
    normalizeCareerStatus,
    normalizePlan,
    normalizeWeekCapacity,
    normalizeContext,
    render,
    renderMenu,
    renderResult,
  });
});
