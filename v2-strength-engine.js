(function attachBoxeurStrength(root, factory) {
  "use strict";
  const timeApi = typeof module === "object" && module.exports
    ? require("./career-time-engine.js")
    : root && root.BoxeurTime;
  const api = factory(timeApi);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.BoxeurStrength = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createBoxeurStrengthApi(BoxeurTime) {
  "use strict";

  if (!BoxeurTime) {
    throw new Error("BoxeurStrength requiert career-time-engine.js (BoxeurTime).");
  }

  const SCHEMA_VERSION = 1;
  const SESSION_DURATION_PERIODS = 1;
  const STAT_KEYS = Object.freeze([...BoxeurTime.STAT_KEYS]);

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
    return value;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function finiteNumber(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function clamp(value, min = 0, max = 100) {
    return Math.min(max, Math.max(min, finiteNumber(value, min)));
  }

  function roundTo(value, decimals = 2) {
    const factor = 10 ** decimals;
    return Math.round((finiteNumber(value) + Number.EPSILON) * factor) / factor;
  }

  function strengthError(code, message, details) {
    const error = new Error(message);
    error.code = code;
    if (details !== undefined) error.details = details;
    return error;
  }

  /*
   * Les coûts reprennent l'ordre de grandeur de la V1 (18 à 20 points pour une
   * séance simple), mais la V2 laisse le joueur construire un entraînement plus
   * court ou plus long. Une composition personnalisée doit toutefois contenir
   * un échauffement, au moins un exercice de travail et un retour au calme. La
   * dépense d'énergie limite ensuite naturellement le volume utile.
   */
  const ACTIVITIES = deepFreeze({
    dynamic_warmup: {
      id: "dynamic_warmup",
      label: "Échauffement dynamique",
      shortLabel: "Échauffement",
      category: "preparation",
      durationMinutes: 10,
      energyCost: 5,
      fatigueGain: 2,
      fatigueRelief: 0,
      stimulus: { technique: 0, power: 0.3, cardio: 1, defense: 0.2 },
      xp: 1,
      wear: 0.1,
      injuryRisk: 0.05,
      benefit: "Prépare les articulations et les appuis avant une charge plus exigeante.",
      compromise: "Produit peu de progression lorsqu'il est fait seul.",
      icon: "É",
      countsAsWork: false,
    },
    lower_body_strength: {
      id: "lower_body_strength",
      label: "Force des jambes",
      shortLabel: "Jambes",
      category: "strength",
      durationMinutes: 20,
      energyCost: 13,
      fatigueGain: 8,
      fatigueRelief: 0,
      stimulus: { technique: 0, power: 3.4, cardio: 0.6, defense: 0 },
      xp: 3,
      wear: 1.2,
      injuryRisk: 0.55,
      benefit: "Développe une base solide pour pousser, pivoter et transférer la force.",
      compromise: "Laisse les jambes lourdes et apporte peu de cardio à lui seul.",
      icon: "J",
      countsAsWork: true,
    },
    posterior_chain: {
      id: "posterior_chain",
      label: "Chaîne postérieure",
      shortLabel: "Chaîne postérieure",
      category: "strength",
      durationMinutes: 20,
      energyCost: 14,
      fatigueGain: 9,
      fatigueRelief: 0,
      stimulus: { technique: 0, power: 3.8, cardio: 0.2, defense: 0 },
      xp: 3,
      wear: 1.5,
      injuryRisk: 0.75,
      benefit: "Renforce les hanches, les jambes et le dos pour une puissance mieux transmise.",
      compromise: "Charge exigeante qui demande une exécution contrôlée.",
      icon: "H",
      countsAsWork: true,
    },
    rotational_power: {
      id: "rotational_power",
      label: "Lancers rotatifs au ballon lesté",
      shortLabel: "Rotation",
      category: "power",
      durationMinutes: 15,
      energyCost: 11,
      fatigueGain: 7,
      fatigueRelief: 0,
      stimulus: { technique: 0.4, power: 2.7, cardio: 0, defense: 0 },
      xp: 3,
      wear: 0.8,
      injuryRisk: 0.35,
      benefit: "Travaille l'explosivité en rotation sans prétendre remplacer la technique de boxe.",
      compromise: "Moins utile au cardio et à la garde.",
      icon: "R",
      countsAsWork: true,
    },
    upper_back_guard: {
      id: "upper_back_guard",
      label: "Dos et stabilité des épaules",
      shortLabel: "Dos et épaules",
      category: "durability",
      durationMinutes: 15,
      energyCost: 8,
      fatigueGain: 5,
      fatigueRelief: 0,
      stimulus: { technique: 0, power: 0.8, cardio: 0, defense: 1.7 },
      xp: 2,
      wear: 0.55,
      injuryRisk: 0.2,
      benefit: "Aide à conserver une garde stable et une posture solide sous la fatigue.",
      compromise: "Crée moins de puissance qu'un travail des jambes ou des hanches.",
      icon: "D",
      countsAsWork: true,
    },
    boxing_core: {
      id: "boxing_core",
      label: "Tronc et antirotation",
      shortLabel: "Tronc",
      category: "durability",
      durationMinutes: 15,
      energyCost: 8,
      fatigueGain: 5,
      fatigueRelief: 0,
      stimulus: { technique: 0, power: 0.7, cardio: 0.6, defense: 1.2 },
      xp: 2,
      wear: 0.45,
      injuryRisk: 0.15,
      benefit: "Améliore la stabilité du tronc pour frapper et absorber les mouvements sans se désunir.",
      compromise: "Le gain est polyvalent, mais moins marqué dans une qualité précise.",
      icon: "T",
      countsAsWork: true,
    },
    machine_conditioning: {
      id: "machine_conditioning",
      label: "Conditionnement sur appareils",
      shortLabel: "Appareils",
      category: "conditioning",
      durationMinutes: 20,
      energyCost: 12,
      fatigueGain: 8,
      fatigueRelief: 0,
      stimulus: { technique: 0, power: 0.2, cardio: 3.8, defense: 0 },
      xp: 3,
      wear: 0.65,
      injuryRisk: 0.2,
      benefit: "Rameur, vélo ou tapis développent le moteur sans ajouter de coups reçus.",
      compromise: "N'enseigne ni la distance ni les réactions propres au ring.",
      icon: "C",
      countsAsWork: true,
    },
    mobility_cooldown: {
      id: "mobility_cooldown",
      label: "Mobilité et retour au calme",
      shortLabel: "Mobilité",
      category: "recovery",
      durationMinutes: 10,
      energyCost: 3,
      fatigueGain: 0,
      fatigueRelief: 3,
      stimulus: { technique: 0, power: 0, cardio: 0, defense: 0.3 },
      xp: 0,
      wear: 0,
      injuryRisk: 0,
      benefit: "Réduit une partie de la fatigue immédiate et termine la séance proprement.",
      compromise: "Consomme du temps sans créer beaucoup d’XP ciblée.",
      icon: "M",
      countsAsWork: false,
    },
  });

  const MEMBERSHIP_PLANS = deepFreeze([
    { id: "monthly", label: "1 mois", weeks: 4, price: 95, savings: 0, detail: "4 semaines d'accès au gym de musculation." },
    { id: "three-months", label: "3 mois", weeks: 12, price: 270, savings: 15, detail: "12 semaines d'accès · 15 $ d'économie." },
    { id: "six-months", label: "6 mois", weeks: 24, price: 510, savings: 60, detail: "24 semaines d'accès · 60 $ d'économie." },
    { id: "yearly", label: "1 an", weeks: 48, price: 960, savings: 180, detail: "48 semaines d'accès · 180 $ d'économie." },
  ]);

  const ACCESS_STATES = deepFreeze({
    RECREATIONAL_LOCKED: "recreational-locked",
    MEMBERSHIP_REQUIRED: "membership-required",
    MEDICAL_BLOCKED: "medical-blocked",
    ACTIVE: "active",
  });

  function normalizeCareerStatus(context = {}) {
    const status = String(context.careerStatus || context.status || "recreational").toLowerCase();
    return ["recreational", "amateur", "professional"].includes(status) ? status : "recreational";
  }

  function hasMembership(context = {}) {
    if (context.membershipActive != null) return Boolean(context.membershipActive);
    if (context.strengthGymMembershipActive != null) return Boolean(context.strengthGymMembershipActive);
    if (context.strengthGymAccess != null) return Boolean(context.strengthGymAccess);
    if (context.hasStrengthGymMembership != null) return Boolean(context.hasStrengthGymMembership);
    if (context.strengthGymWeeks != null) return finiteNumber(context.strengthGymWeeks) > 0;
    const membership = context.membership && typeof context.membership === "object" ? context.membership : {};
    if (membership.active != null) return Boolean(membership.active);
    if (membership.weeksRemaining != null) return finiteNumber(membership.weeksRemaining) > 0;
    if (membership.status != null) return ["active", "paid"].includes(String(membership.status));
    return false;
  }

  function medicalBlockReason(context = {}) {
    const condition = context.condition && typeof context.condition === "object" ? context.condition : {};
    const weeks = Math.max(0, finiteNumber(
      context.injuryWeeks ?? context.medicalRestWeeks ?? condition.injuryWeeks ?? condition.medicalRestWeeks,
    ));
    const blocked = context.medicalRestriction === true
      || context.medicalBlocked === true
      || context.trainingBlocked === true
      || condition.medicalRestriction === true
      || condition.medicalBlocked === true
      || condition.trainingBlocked === true
      || weeks > 0;
    if (!blocked) return "";
    const supplied = context.medicalReason
      || context.trainingBlockedReason
      || condition.medicalReason
      || condition.trainingBlockedReason;
    if (supplied) return String(supplied);
    if (weeks > 0) {
      const rounded = Math.ceil(weeks);
      return `Repos médical obligatoire pendant ${rounded} semaine${rounded > 1 ? "s" : ""}.`;
    }
    return "Une restriction médicale bloque temporairement l'entraînement physique.";
  }

  function resolveAccess(context = {}) {
    const careerStatus = normalizeCareerStatus(context);
    if (careerStatus === "recreational") {
      return {
        state: ACCESS_STATES.RECREATIONAL_LOCKED,
        available: false,
        label: "Débloqué au statut amateur",
        reason: "Le gym de musculation devient accessible après le passage amateur.",
      };
    }
    if (!hasMembership(context)) {
      return {
        state: ACCESS_STATES.MEMBERSHIP_REQUIRED,
        available: false,
        label: "Abonnement requis",
        reason: "Choisis un forfait avant de composer une séance de musculation.",
      };
    }
    const medicalReason = medicalBlockReason(context);
    if (medicalReason) {
      return {
        state: ACCESS_STATES.MEDICAL_BLOCKED,
        available: false,
        label: "Repos médical",
        reason: medicalReason,
      };
    }
    return {
      state: ACCESS_STATES.ACTIVE,
      available: true,
      label: "Accès actif",
      reason: "Compose librement ta séance selon l'énergie disponible.",
    };
  }

  function normalizeMembershipPlans(input) {
    const supplied = Array.isArray(input) ? input : [];
    return MEMBERSHIP_PLANS.map(defaultPlan => {
      const source = supplied.find(plan => plan && plan.id === defaultPlan.id) || {};
      const price = Math.max(0, Math.round(finiteNumber(source.price, defaultPlan.price)));
      const weeks = Math.max(1, Math.round(finiteNumber(source.weeks, defaultPlan.weeks)));
      const savings = Math.max(0, Math.round(finiteNumber(source.savings, defaultPlan.savings)));
      return {
        id: defaultPlan.id,
        label: String(source.label || defaultPlan.label),
        weeks,
        price,
        savings,
        detail: String(source.detail || defaultPlan.detail),
        available: source.available !== false,
        disabledReason: source.disabledReason ? String(source.disabledReason) : "",
      };
    });
  }

  function normalizeSelection(input, options = {}) {
    const source = Array.isArray(input)
      ? input
      : input && Array.isArray(input.activities) ? input.activities : [];
    const selection = [];
    source.forEach(value => {
      const id = typeof value === "string" ? value : value && value.id;
      if (!ACTIVITIES[id]) {
        if (options.strict) throw strengthError("UNKNOWN_ACTIVITY", `Activité de musculation inconnue : ${id}.`);
        return;
      }
      if (selection.includes(id)) {
        if (options.strict) throw strengthError("DUPLICATE_ACTIVITY", `${ACTIVITIES[id].label} est déjà dans la séance.`);
        return;
      }
      selection.push(id);
    });
    return selection;
  }

  function emptyStimulus() {
    return STAT_KEYS.reduce((result, key) => {
      result[key] = 0;
      return result;
    }, {});
  }

  function aggregateSelection(input) {
    const activityIds = normalizeSelection(input, { strict: true });
    const totals = {
      durationMinutes: 0,
      durationPeriods: SESSION_DURATION_PERIODS,
      energyCost: 0,
      fatigueGain: 0,
      fatigueRelief: 0,
      fatigueDelta: 0,
      stimulus: emptyStimulus(),
      xp: 0,
      wear: 0,
      injuryRisk: 0,
    };
    activityIds.forEach(id => {
      const activity = ACTIVITIES[id];
      totals.durationMinutes += activity.durationMinutes;
      totals.energyCost += activity.energyCost;
      totals.fatigueGain += activity.fatigueGain;
      totals.fatigueRelief += activity.fatigueRelief;
      totals.xp += activity.xp;
      totals.wear += activity.wear;
      totals.injuryRisk += activity.injuryRisk;
      STAT_KEYS.forEach(key => { totals.stimulus[key] += activity.stimulus[key]; });
    });
    totals.energyCost = roundTo(totals.energyCost);
    totals.fatigueGain = roundTo(totals.fatigueGain);
    totals.fatigueRelief = roundTo(totals.fatigueRelief);
    totals.fatigueDelta = roundTo(totals.fatigueGain - totals.fatigueRelief);
    totals.xp = roundTo(totals.xp);
    totals.wear = roundTo(totals.wear);
    totals.injuryRisk = roundTo(totals.injuryRisk);
    STAT_KEYS.forEach(key => { totals.stimulus[key] = roundTo(totals.stimulus[key]); });
    return {
      schemaVersion: SCHEMA_VERSION,
      activityIds,
      activities: activityIds.map(id => clone(ACTIVITIES[id])),
      totals,
    };
  }

  function conditionFrom(timeState, context = {}) {
    const source = timeState && timeState.condition && typeof timeState.condition === "object"
      ? timeState.condition
      : context.condition && typeof context.condition === "object" ? context.condition : context;
    return {
      energy: roundTo(clamp(source.energy == null ? 100 : source.energy)),
      fatigue: roundTo(clamp(source.fatigue == null ? 0 : source.fatigue)),
    };
  }

  function activityFromAggregate(aggregate, label = "Séance de musculation personnalisée") {
    return {
      id: `strength-gym-session:${aggregate.activityIds.join("-") || "empty"}`,
      label: String(label),
      category: "strength-gym-training",
      duration: SESSION_DURATION_PERIODS,
      energyCost: aggregate.totals.energyCost,
      energyGain: 0,
      fatigueGain: aggregate.totals.fatigueGain,
      fatigueRelief: aggregate.totals.fatigueRelief,
      stimulus: clone(aggregate.totals.stimulus),
    };
  }

  function applySessionAdjustment(baseTotals, input) {
    const totals = clone(baseTotals);
    const adjustment = input && typeof input === "object" ? input : {};
    const read = (key, fallback) => Number.isFinite(Number(adjustment[key])) ? Number(adjustment[key]) : fallback;
    totals.energyCost = roundTo(clamp(read("energyCost", totals.energyCost)));
    totals.fatigueGain = roundTo(clamp(read("fatigueGain", totals.fatigueGain)));
    totals.fatigueRelief = roundTo(clamp(read("fatigueRelief", totals.fatigueRelief)));
    totals.fatigueDelta = roundTo(totals.fatigueGain - totals.fatigueRelief);
    return {
      totals,
      recoveryQuality: roundTo(clamp(read("recoveryQuality", 1), .75, 1.25), 4),
    };
  }

  function draftReason(aggregate, condition, access, context = {}) {
    if (!access.available) return { code: access.state.toUpperCase().replaceAll("-", "_"), reason: access.reason };
    if (context.strengthSessionCompletedToday === true || context.physicalSessionCompletedToday === true) {
      return { code: "SESSION_ALREADY_COMPLETED", reason: "Une activité physique principale a déjà été faite aujourd'hui." };
    }
    if (aggregate.totals.energyCost > condition.energy) {
      return {
        code: "INSUFFICIENT_ENERGY",
        reason: `Il manque ${roundTo(aggregate.totals.energyCost - condition.energy)} % d'énergie pour cette composition.`,
      };
    }
    return null;
  }

  function previewDraft(timeState, selectionInput, context = {}) {
    let aggregate;
    try {
      aggregate = aggregateSelection(selectionInput);
    } catch (error) {
      return { ok: false, canConfirm: false, code: error.code || "INVALID_SELECTION", reason: error.message };
    }
    const condition = conditionFrom(timeState, context);
    const access = resolveAccess(context);
    const issue = draftReason(aggregate, condition, access, context);
    const projected = {
      energy: roundTo(clamp(condition.energy - aggregate.totals.energyCost)),
      fatigue: roundTo(clamp(condition.fatigue + aggregate.totals.fatigueDelta)),
      stimulus: clone(aggregate.totals.stimulus),
    };
    const hasWork = aggregate.activities.some(activity => activity.countsAsWork);
    const hasWarmup = aggregate.activityIds.includes("dynamic_warmup");
    const hasCooldown = aggregate.activityIds.includes("mobility_cooldown");
    const hasCompleteStructure = hasWarmup && hasWork && hasCooldown;
    const warnings = [];
    if (!hasWarmup && hasWork) warnings.push("Ajoute un échauffement dynamique");
    if (!hasCooldown && hasWork) warnings.push("Ajoute un retour au calme");
    if (projected.energy <= 20 && aggregate.activityIds.length) warnings.push("Très peu d'énergie restera après la séance");
    if (projected.fatigue >= 75) warnings.push("Fatigue élevée après la séance");
    if (aggregate.totals.durationMinutes > 90) warnings.push("Séance très longue : les gains seront soumis aux limites d'assimilation");
    return {
      ok: !issue,
      canConfirm: !issue && hasCompleteStructure,
      code: issue
        ? issue.code
        : !hasWork
          ? "WORK_ACTIVITY_REQUIRED"
          : !hasWarmup
            ? "WARMUP_REQUIRED"
            : !hasCooldown
              ? "COOLDOWN_REQUIRED"
              : "READY",
      reason: issue
        ? issue.reason
        : !hasWork
          ? "Ajoute au moins un exercice de travail physique."
          : !hasWarmup
            ? "Ajoute l’échauffement dynamique pour préparer la séance."
            : !hasCooldown
              ? "Ajoute la mobilité et le retour au calme pour terminer la séance."
              : "La séance peut commencer.",
      access,
      aggregate,
      totals: aggregate.totals,
      projected,
      warnings,
    };
  }

  function previewSession(timeState, selectionInput, context = {}) {
    const draft = previewDraft(timeState, selectionInput, context);
    if (!draft.ok || !draft.canConfirm) return { ...draft, ok: false };
    const adjusted = applySessionAdjustment(draft.totals, context.sessionAdjustment);
    const adjustedAggregate = {
      ...draft.aggregate,
      totals: adjusted.totals,
    };
    const activity = activityFromAggregate(adjustedAggregate, context.sessionLabel);
    const timeCheck = BoxeurTime.canPerformActivity(timeState, activity, {
      appointmentId: context.appointmentId,
    });
    if (!timeCheck.ok) {
      return {
        ...draft,
        ok: false,
        canConfirm: false,
        code: timeCheck.code,
        reason: timeCheck.reason,
        activity,
      };
    }
    return {
      ...draft,
      ok: true,
      canConfirm: true,
      totals: adjusted.totals,
      activity,
      recoveryQuality: adjusted.recoveryQuality,
      projected: {
        ...draft.projected,
        energy: roundTo(clamp(conditionFrom(timeState, context).energy - adjusted.totals.energyCost)),
        fatigue: roundTo(clamp(conditionFrom(timeState, context).fatigue + adjusted.totals.fatigueDelta)),
        end: clone(timeCheck.end),
      },
    };
  }

  function toggleActivity(timeState, selectionInput, activityId, context = {}) {
    if (!ACTIVITIES[activityId]) {
      return { ok: false, code: "UNKNOWN_ACTIVITY", reason: `Activité de musculation inconnue : ${activityId}.`, selection: normalizeSelection(selectionInput) };
    }
    const current = normalizeSelection(selectionInput);
    if (current.includes(activityId)) {
      const selection = current.filter(id => id !== activityId);
      return { ok: true, action: "removed", selection, preview: previewDraft(timeState, selection, context) };
    }
    const access = resolveAccess(context);
    if (!access.available) {
      return { ok: false, code: access.state.toUpperCase().replaceAll("-", "_"), reason: access.reason, selection: current };
    }
    if (context.strengthSessionCompletedToday === true || context.physicalSessionCompletedToday === true) {
      return { ok: false, code: "SESSION_ALREADY_COMPLETED", reason: "Une activité physique principale a déjà été faite aujourd'hui.", selection: current };
    }
    const selection = [...current, activityId];
    const preview = previewDraft(timeState, selection, context);
    if (preview.code === "INSUFFICIENT_ENERGY") {
      return { ok: false, code: preview.code, reason: preview.reason, selection: current, preview };
    }
    return { ok: true, action: "added", selection, preview };
  }

  function businessResult(before, after, preview) {
    const sessionCondition = {
      energy: roundTo(clamp(before.condition.energy - preview.totals.energyCost)),
      fatigue: roundTo(clamp(before.condition.fatigue + preview.totals.fatigueDelta)),
    };
    const statGains = {};
    const statXpGains = {};
    STAT_KEYS.forEach(key => {
      statGains[key] = roundTo(after.stats[key] - before.stats[key]);
      statXpGains[key] = Math.max(0, Math.round((after.statXp?.[key] || 0) - (before.statXp?.[key] || 0)));
    });
    return {
      type: "strength-gym-session",
      activities: clone(preview.aggregate.activityIds),
      label: preview.activity.label,
      startedAt: clone(before.clock),
      endedAt: clone(after.clock),
      durationMinutes: preview.totals.durationMinutes,
      durationPeriods: SESSION_DURATION_PERIODS,
      sessionConditionDelta: {
        energy: roundTo(sessionCondition.energy - before.condition.energy),
        fatigue: roundTo(sessionCondition.fatigue - before.condition.fatigue),
      },
      nightRecoveryDelta: {
        energy: roundTo(after.condition.energy - sessionCondition.energy),
        fatigue: roundTo(after.condition.fatigue - sessionCondition.fatigue),
      },
      plannedStimulus: clone(preview.totals.stimulus),
      remainingStimulus: clone(after.stimulus),
      statGains,
      statXpGains,
      xpAward: Math.max(1, Math.round(preview.totals.xp)),
      wear: preview.totals.wear,
      injuryRiskPercent: roundTo(clamp(
        preview.totals.injuryRisk
          + Math.max(0, before.condition.fatigue - 50) * 0.07
          + Math.max(0, 30 - before.condition.energy) * 0.05,
        0,
        20,
      ), 1),
      injuryResolved: false,
      warnings: clone(preview.warnings),
    };
  }

  function executeSession(timeState, selectionInput, context = {}, rng) {
    const preview = previewSession(timeState, selectionInput, context);
    if (!preview.ok) throw strengthError(preview.code, preview.reason);
    const nextTimeState = BoxeurTime.performActivity(
      timeState,
      preview.activity,
      { appointmentId: context.appointmentId, recoveryQuality: preview.recoveryQuality },
      rng,
    );
    return {
      timeState: nextTimeState,
      state: nextTimeState,
      session: clone(preview.aggregate),
      result: businessResult(timeState, nextTimeState, preview),
    };
  }

  return Object.freeze({
    SCHEMA_VERSION,
    SESSION_DURATION_PERIODS,
    STAT_KEYS,
    ACTIVITIES,
    MEMBERSHIP_PLANS,
    ACCESS_STATES,
    normalizeCareerStatus,
    hasMembership,
    medicalBlockReason,
    resolveAccess,
    normalizeMembershipPlans,
    normalizeSelection,
    aggregateSelection,
    applySessionAdjustment,
    activityFromAggregate,
    previewDraft,
    previewSession,
    canExecuteSession: previewSession,
    toggleActivity,
    executeSession,
  });
});
